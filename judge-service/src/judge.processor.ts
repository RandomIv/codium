import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ApiService, JudgeProblem } from './api/api.service';
import {
  ExecutionService,
  ExecutionResult,
} from './execution/docker-execution.service';

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

      await this.apiService.updateSubmission(submissionId, {
        status: SubmissionStatus.COMPLETED,
        verdict: result.verdict,
        time: Math.round(result.maxTime),
        memory: 0,
        testCasesPassed: result.passedCount,
      });

      this.logger.log(`Job ${job.id} finished. Verdict: ${result.verdict}`);
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
  ) {
    let maxTime = 0;
    let passedCount = 0;

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

      if (result.isTimeLimitExceeded) {
        return { verdict: Verdict.TIME_LIMIT_EXCEEDED, maxTime, passedCount };
      }

      if (result.exitCode !== 0) {
        return { verdict: Verdict.RUNTIME_ERROR, maxTime, passedCount };
      }

      const actualOutput = result.stdout.trim();
      const expectedOutput = test.output.trim();

      if (actualOutput !== expectedOutput) {
        return { verdict: Verdict.WRONG_ANSWER, maxTime, passedCount };
      }

      passedCount++;
    }

    return { verdict: Verdict.ACCEPTED, maxTime, passedCount };
  }
}
