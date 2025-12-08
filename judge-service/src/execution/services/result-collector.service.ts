import { Injectable, Logger } from '@nestjs/common';
import ExecutionResult from '../interfaces/execution-result.interface';
import { DockerLogsParser } from '../utils/docker-logs.parser';
@Injectable()
export class ResultCollectorService {
  private readonly logger = new Logger(ResultCollectorService.name);
  createSuccessResult(
    logsBuffer: Buffer,
    exitCode: number,
    executionTime: number,
  ): ExecutionResult {
    try {
      const { stdout, stderr } = DockerLogsParser.parse(logsBuffer);
      return {
        stdout,
        stderr,
        executionTime,
        isTimeLimitExceeded: false,
        exitCode,
      };
    } catch (error) {
      this.logger.error(`Failed to parse logs: ${error.message}`);
      return this.createErrorResult('Failed to read execution logs');
    }
  }
  createTimeoutResult(executionTime: number): ExecutionResult {
    return {
      stdout: '',
      stderr: 'Time Limit Exceeded',
      executionTime,
      isTimeLimitExceeded: true,
      exitCode: null,
    };
  }
  createErrorResult(errorMessage: string): ExecutionResult {
    return {
      stdout: '',
      stderr: `System Error: ${errorMessage}`,
      executionTime: 0,
      isTimeLimitExceeded: false,
      exitCode: -1,
    };
  }
}
