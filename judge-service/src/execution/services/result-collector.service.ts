import { Injectable, Logger } from '@nestjs/common';
import ExecutionResult from '../interfaces/execution-result.interface';
import { DockerLogsParser } from '../utils/docker-logs.parser';

const SECONDS_TO_MS = 1000;
const KBYTES_TO_BYTES = 1024;
const TIME_OUTPUT_MARKER = '\tCommand being timed:';

const MEMORY_REGEX = /Maximum resident set size \(kbytes\): (\d+)/g;
const USER_TIME_REGEX = /User time \(seconds\): ([\d.]+)/g;
const SYSTEM_TIME_REGEX = /System time \(seconds\): ([\d.]+)/g;

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

      const parsedMemory = this.parseMemory(stderr, memory);
      const parsedTime = this.parseExecutionTime(stderr, executionTime);
      const cleanedStderr = this.cleanStderr(stderr);

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

  private parseMemory(stderr: string, fallbackMemory: number): number {
    const matches = [...stderr.matchAll(MEMORY_REGEX)];

    if (matches.length === 0) {
      return fallbackMemory;
    }

    const lastMatch = matches[matches.length - 1];
    return parseInt(lastMatch[1], 10) * KBYTES_TO_BYTES;
  }

  private parseExecutionTime(stderr: string, fallbackTime: number): number {
    const userTimeMatches = [...stderr.matchAll(USER_TIME_REGEX)];
    const systemTimeMatches = [...stderr.matchAll(SYSTEM_TIME_REGEX)];

    if (userTimeMatches.length === 0 || systemTimeMatches.length === 0) {
      return fallbackTime;
    }

    const lastUserMatch = userTimeMatches[userTimeMatches.length - 1];
    const lastSystemMatch = systemTimeMatches[systemTimeMatches.length - 1];

    const userTime = parseFloat(lastUserMatch[1]);
    const systemTime = parseFloat(lastSystemMatch[1]);

    return Math.round((userTime + systemTime) * SECONDS_TO_MS);
  }

  private cleanStderr(stderr: string): string {
    const timeOutputStart = stderr.indexOf(TIME_OUTPUT_MARKER);
    if (timeOutputStart !== -1) {
      return stderr.substring(0, timeOutputStart).trimEnd();
    }
    return stderr;
  }
}
