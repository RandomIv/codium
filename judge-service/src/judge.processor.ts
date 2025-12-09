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
      await this.apiService.updateSubmission(submissionId, {
        status: SubmissionStatus.IN_PROGRESS,
      });

      const problem = await this.apiService.getProblem(problemId);

      const result = await this.runTests(code, language, problem);

      const updateData = {
        status: SubmissionStatus.COMPLETED,
        verdict: result.verdict,
        time: Math.round(result.maxTime),
        memory: Math.round(result.maxMemory / 1024),
        testCasesPassed: result.passedCount,
        testLogs: result.testLogs,
      };

      await this.apiService.updateSubmission(submissionId, updateData);
      return { status: 'Done', verdict: result.verdict };
    } catch (error) {
      this.logger.error(`Judge failed for #${submissionId}: ${error.message}`);

      await this.apiService
        .updateSubmission(submissionId, {
          status: SubmissionStatus.FAILED,
        })
        .catch((e) =>
          this.logger.error(`Failed to report error: ${e.message}`),
        );

      throw error;
    }
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

      if (result.executionTime > maxTime) {
        maxTime = result.executionTime;
      }

      if (result.memory > maxMemory) {
        maxMemory = result.memory;
      }

      const actualOutput = result.stdout.trim();
      const expectedOutput = test.output.trim();

      let testVerdict: Verdict;

      if (result.isTimeLimitExceeded) {
        testVerdict = Verdict.TIME_LIMIT_EXCEEDED;
      } else if (result.exitCode !== 0) {
        testVerdict = Verdict.RUNTIME_ERROR;
      } else if (actualOutput !== expectedOutput) {
        testVerdict = Verdict.WRONG_ANSWER;
      } else {
        testVerdict = Verdict.ACCEPTED;
        passedCount++;
      }

      testLogs.push({
        testCaseId: test.id,
        status: testVerdict,
        input: test.input,
        expectedOutput: test.output,
        actualOutput: result.stdout,
        stderr: result.stderr || undefined,
        executionTime: Math.round(result.executionTime),
        memory: Math.round(result.memory / 1024),
      });

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
