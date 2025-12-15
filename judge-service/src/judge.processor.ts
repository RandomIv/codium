import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ApiService, JudgeProblem } from './api/api.service';
import { ExecutionService } from './execution/docker-execution.service';
import ExecutionResult from './execution/interfaces/execution-result.interface';

enum SubmissionStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

enum Verdict {
  ACCEPTED = 'ACCEPTED',
  WRONG_ANSWER = 'WRONG_ANSWER',
  TIME_LIMIT_EXCEEDED = 'TIME_LIMIT_EXCEEDED',
  RUNTIME_ERROR = 'RUNTIME_ERROR',
  COMPILATION_ERROR = 'COMPILATION_ERROR',
}

interface TestLogEntry {
  testCaseId: string;
  status: Verdict;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  stderr?: string;
  executionTime: number;
  memory: number;
}

interface TestRunResult {
  verdict: Verdict;
  maxTime: number;
  maxMemory: number;
  passedCount: number;
  testLogs: TestLogEntry[];
}

const BYTES_TO_KB = 1024;

@Processor('judge-queue')
export class JudgeProcessor extends WorkerHost {
  private readonly logger = new Logger(JudgeProcessor.name);

  constructor(
    private readonly apiService: ApiService,
    private readonly executionService: ExecutionService,
  ) {
    super();
  }

  async process(job: Job) {
    const { problemId, code, language } = job.data;
    const submissionId = job.id as string;

    try {
      await this.updateSubmissionStatus(
        submissionId,
        SubmissionStatus.IN_PROGRESS,
      );

      const problem = await this.apiService.getProblem(problemId);
      const result = await this.runTests(code, language, problem);

      await this.submitFinalResult(submissionId, result);

      return { status: 'Done', verdict: result.verdict };
    } catch (error) {
      this.logger.error(`Judge failed for #${submissionId}: ${error.message}`);
      await this.handleProcessingError(submissionId);
      throw error;
    }
  }

  private async updateSubmissionStatus(
    submissionId: string,
    status: SubmissionStatus,
  ): Promise<void> {
    await this.apiService.updateSubmission(submissionId, { status });
  }

  private async submitFinalResult(
    submissionId: string,
    result: TestRunResult,
  ): Promise<void> {
    const updateData = {
      status: SubmissionStatus.COMPLETED,
      verdict: result.verdict,
      time: Math.round(result.maxTime),
      memory: Math.round(result.maxMemory / BYTES_TO_KB),
      testCasesPassed: result.passedCount,
      testLogs: result.testLogs,
    };

    await this.apiService.updateSubmission(submissionId, updateData);
  }

  private async handleProcessingError(submissionId: string): Promise<void> {
    try {
      await this.apiService.updateSubmission(submissionId, {
        status: SubmissionStatus.FAILED,
      });
    } catch (error) {
      this.logger.error(`Failed to report error: ${error.message}`);
    }
  }

  private determineTestVerdict(
    result: ExecutionResult,
    expectedOutput: string,
  ): Verdict {
    if (result.isTimeLimitExceeded) {
      return Verdict.TIME_LIMIT_EXCEEDED;
    }

    if (result.exitCode !== 0) {
      return Verdict.RUNTIME_ERROR;
    }

    const actualOutput = result.stdout.trim();
    const normalizedExpected = expectedOutput.trim();

    if (actualOutput !== normalizedExpected) {
      return Verdict.WRONG_ANSWER;
    }

    return Verdict.ACCEPTED;
  }

  private createTestLog(
    testCase: JudgeProblem['testCases'][0],
    result: ExecutionResult,
    verdict: Verdict,
  ): TestLogEntry {
    return {
      testCaseId: testCase.id,
      status: verdict,
      input: testCase.input,
      expectedOutput: testCase.output,
      actualOutput: result.stdout,
      stderr: result.stderr || undefined,
      executionTime: Math.round(result.executionTime),
      memory: Math.round(result.memory / BYTES_TO_KB),
    };
  }

  private async runTests(
    code: string,
    language: string,
    problem: JudgeProblem,
  ): Promise<TestRunResult> {
    let maxTime = 0;
    let maxMemory = 0;
    let passedCount = 0;
    const testLogs: TestLogEntry[] = [];

    for (const test of problem.testCases) {
      const result: ExecutionResult = await this.executionService.runCode(
        code,
        language,
        test.input,
        problem.timeLimit,
      );

      maxTime = Math.max(maxTime, result.executionTime);
      maxMemory = Math.max(maxMemory, result.memory);

      const testVerdict = this.determineTestVerdict(result, test.output);

      if (testVerdict === Verdict.ACCEPTED) {
        passedCount++;
      }

      testLogs.push(this.createTestLog(test, result, testVerdict));

      if (testVerdict !== Verdict.ACCEPTED) {
        return {
          verdict: testVerdict,
          maxTime,
          maxMemory,
          passedCount,
          testLogs,
        };
      }
    }

    return {
      verdict: Verdict.ACCEPTED,
      maxTime,
      maxMemory,
      passedCount,
      testLogs,
    };
  }
}
