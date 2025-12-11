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
    memory: number,
  ): ExecutionResult {
    try {
      const { stdout, stderr } = DockerLogsParser.parse(logsBuffer);

      let parsedMemory = memory;
      let parsedTime = executionTime;
      let cleanedStderr = stderr;

      const memoryMatch = stderr.match(
        /Maximum resident set size \(kbytes\): (\d+)/,
      );
      if (memoryMatch) {
        parsedMemory = parseInt(memoryMatch[1], 10) * 1024;
      }

      const userTimeMatch = stderr.match(/User time \(seconds\): ([\d.]+)/);
      const systemTimeMatch = stderr.match(/System time \(seconds\): ([\d.]+)/);

      if (userTimeMatch && systemTimeMatch) {
        const userTime = parseFloat(userTimeMatch[1]);
        const systemTime = parseFloat(systemTimeMatch[1]);
        parsedTime = Math.round((userTime + systemTime) * 1000);
      }

      const timeOutputStart = stderr.indexOf('\tCommand being timed:');
      if (timeOutputStart !== -1) {
        cleanedStderr = stderr.substring(0, timeOutputStart).trimEnd();
      }

      return {
        stdout,
        stderr: cleanedStderr,
        executionTime: parsedTime,
        memory: parsedMemory,
        isTimeLimitExceeded: false,
        exitCode,
      };
    } catch (error) {
      this.logger.error(`Failed to parse logs: ${error.message}`);
      return this.createErrorResult('Failed to read execution logs');
    }
  }
  createTimeoutResult(executionTime: number, memory: number): ExecutionResult {
    return {
      stdout: '',
      stderr: 'Time Limit Exceeded',
      executionTime,
      memory,
      isTimeLimitExceeded: true,
      exitCode: null,
    };
  }
  createErrorResult(errorMessage: string): ExecutionResult {
    return {
      stdout: '',
      stderr: `System Error: ${errorMessage}`,
      executionTime: 0,
      memory: 0,
      isTimeLimitExceeded: false,
      exitCode: -1,
    };
  }
}
