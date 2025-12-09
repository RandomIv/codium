import { Test, TestingModule } from '@nestjs/testing';
import { ResultCollectorService } from './result-collector.service';

describe('ResultCollectorService', () => {
  let service: ResultCollectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResultCollectorService],
    }).compile();

    service = module.get<ResultCollectorService>(ResultCollectorService);
  });

  describe('createSuccessResult', () => {
    it('should parse /usr/bin/time memory output correctly', () => {
      const logsBuffer = createDockerLogBuffer(
        'Hello World\n',
        '\tCommand being timed: "python3 -u test.py"\n' +
          '\tUser time (seconds): 0.02\n' +
          '\tSystem time (seconds): 0.01\n' +
          '\tMaximum resident set size (kbytes): 8192\n',
      );

      const result = service.createSuccessResult(logsBuffer, 0, 0, 0);

      expect(result.memory).toBe(8192 * 1024);
      expect(result.stdout).toBe('Hello World\n');
    });

    it('should parse /usr/bin/time user and system time correctly', () => {
      const logsBuffer = createDockerLogBuffer(
        'Output\n',
        '\tCommand being timed: "node test.js"\n' +
          '\tUser time (seconds): 0.15\n' +
          '\tSystem time (seconds): 0.05\n' +
          '\tMaximum resident set size (kbytes): 16384\n',
      );

      const result = service.createSuccessResult(logsBuffer, 0, 0, 0);

      expect(result.executionTime).toBe(Math.round((0.15 + 0.05) * 1000));
      expect(result.executionTime).toBe(200);
    });

    it('should clean stderr by removing /usr/bin/time output', () => {
      const logsBuffer = createDockerLogBuffer(
        'Result\n',
        'Warning: something\n' +
          '\tCommand being timed: "python3 test.py"\n' +
          '\tUser time (seconds): 0.01\n' +
          '\tSystem time (seconds): 0.00\n' +
          '\tMaximum resident set size (kbytes): 4096\n',
      );

      const result = service.createSuccessResult(logsBuffer, 0, 0, 0);

      expect(result.stderr).toBe('Warning: something');
      expect(result.stderr).not.toContain('Command being timed');
    });

    it('should fall back to provided values if parsing fails', () => {
      const logsBuffer = createDockerLogBuffer('Output\n', 'No time data\n');

      const result = service.createSuccessResult(logsBuffer, 0, 100, 50000);

      expect(result.executionTime).toBe(100);
      expect(result.memory).toBe(50000);
    });

    it('should handle missing time markers', () => {
      const logsBuffer = createDockerLogBuffer(
        'Output\n',
        '\tMaximum resident set size (kbytes): 8192\n',
      );

      const result = service.createSuccessResult(logsBuffer, 0, 50, 1024);

      expect(result.memory).toBe(8192 * 1024);
      expect(result.executionTime).toBe(50);
    });

    it('should handle missing memory markers', () => {
      const logsBuffer = createDockerLogBuffer(
        'Output\n',
        '\tUser time (seconds): 0.10\n' + '\tSystem time (seconds): 0.05\n',
      );

      const result = service.createSuccessResult(logsBuffer, 0, 50, 2048);

      expect(result.executionTime).toBe(150);
      expect(result.memory).toBe(2048);
    });

    it('should handle zero memory usage', () => {
      const logsBuffer = createDockerLogBuffer(
        'Output\n',
        '\tCommand being timed: "python3 test.py"\n' +
          '\tUser time (seconds): 0.01\n' +
          '\tSystem time (seconds): 0.00\n' +
          '\tMaximum resident set size (kbytes): 0\n',
      );

      const result = service.createSuccessResult(logsBuffer, 0, 0, 0);

      expect(result.memory).toBe(0);
    });

    it('should handle very large memory values', () => {
      const logsBuffer = createDockerLogBuffer(
        'Output\n',
        '\tMaximum resident set size (kbytes): 524288\n',
      );

      const result = service.createSuccessResult(logsBuffer, 0, 0, 0);

      expect(result.memory).toBe(524288 * 1024);
    });

    it('should handle fractional seconds correctly', () => {
      const logsBuffer = createDockerLogBuffer(
        'Output\n',
        '\tUser time (seconds): 0.123\n' + '\tSystem time (seconds): 0.456\n',
      );

      const result = service.createSuccessResult(logsBuffer, 0, 0, 0);

      expect(result.executionTime).toBe(579);
    });

    it('should set correct exit code', () => {
      const logsBuffer = createDockerLogBuffer('Output\n', '');

      const result = service.createSuccessResult(logsBuffer, 42, 0, 0);

      expect(result.exitCode).toBe(42);
    });

    it('should set isTimeLimitExceeded to false', () => {
      const logsBuffer = createDockerLogBuffer('Output\n', '');

      const result = service.createSuccessResult(logsBuffer, 0, 0, 0);

      expect(result.isTimeLimitExceeded).toBe(false);
    });

    it('should return stdout correctly', () => {
      const logsBuffer = createDockerLogBuffer('Expected output\n', '');

      const result = service.createSuccessResult(logsBuffer, 0, 0, 0);

      expect(result.stdout).toBe('Expected output\n');
    });

    it('should handle empty stdout', () => {
      const logsBuffer = createDockerLogBuffer('', 'Error\n');

      const result = service.createSuccessResult(logsBuffer, 1, 0, 0);

      expect(result.stdout).toBe('');
    });

    it('should handle empty stderr', () => {
      const logsBuffer = createDockerLogBuffer('Output\n', '');

      const result = service.createSuccessResult(logsBuffer, 0, 0, 0);

      expect(result.stderr).toBe('');
    });

    it('should handle stderr without time output', () => {
      const logsBuffer = createDockerLogBuffer(
        'Output\n',
        'Regular error message\n',
      );

      const result = service.createSuccessResult(logsBuffer, 0, 0, 0);

      expect(result.stderr).toBe('Regular error message\n');
    });

    it('should handle multiple lines in stderr before time output', () => {
      const logsBuffer = createDockerLogBuffer(
        'Output\n',
        'Line 1\nLine 2\n\tCommand being timed: "test"\n' +
          '\tUser time (seconds): 0.01\n',
      );

      const result = service.createSuccessResult(logsBuffer, 0, 0, 0);

      expect(result.stderr).toBe('Line 1\nLine 2');
      expect(result.stderr).not.toContain('Command being timed');
    });

    it('should round execution time to integer', () => {
      const logsBuffer = createDockerLogBuffer(
        'Output\n',
        '\tUser time (seconds): 0.1234\n' + '\tSystem time (seconds): 0.5678\n',
      );

      const result = service.createSuccessResult(logsBuffer, 0, 0, 0);

      expect(Number.isInteger(result.executionTime)).toBe(true);
      expect(result.executionTime).toBe(691);
    });

    it('should convert KB to bytes correctly', () => {
      const logsBuffer = createDockerLogBuffer(
        'Output\n',
        '\tMaximum resident set size (kbytes): 1024\n',
      );

      const result = service.createSuccessResult(logsBuffer, 0, 0, 0);

      expect(result.memory).toBe(1024 * 1024);
    });
  });

  describe('createTimeoutResult', () => {
    it('should create timeout result with correct structure', () => {
      const result = service.createTimeoutResult(1000, 50000);

      expect(result.stdout).toBe('');
      expect(result.stderr).toBe('Time Limit Exceeded');
      expect(result.executionTime).toBe(1000);
      expect(result.memory).toBe(50000);
      expect(result.isTimeLimitExceeded).toBe(true);
      expect(result.exitCode).toBeNull();
    });

    it('should handle zero execution time', () => {
      const result = service.createTimeoutResult(0, 0);

      expect(result.executionTime).toBe(0);
      expect(result.isTimeLimitExceeded).toBe(true);
    });

    it('should have empty stdout', () => {
      const result = service.createTimeoutResult(1000, 50000);

      expect(result.stdout).toBe('');
    });

    it('should have specific stderr message', () => {
      const result = service.createTimeoutResult(1000, 50000);

      expect(result.stderr).toBe('Time Limit Exceeded');
    });
  });

  describe('createErrorResult', () => {
    it('should create error result with correct structure', () => {
      const result = service.createErrorResult('Container failed');

      expect(result.stdout).toBe('');
      expect(result.stderr).toBe('System Error: Container failed');
      expect(result.executionTime).toBe(0);
      expect(result.memory).toBe(0);
      expect(result.isTimeLimitExceeded).toBe(false);
      expect(result.exitCode).toBe(-1);
    });

    it('should prefix error message with "System Error:"', () => {
      const result = service.createErrorResult('Test error');

      expect(result.stderr).toContain('System Error:');
      expect(result.stderr).toContain('Test error');
    });

    it('should have zero execution time', () => {
      const result = service.createErrorResult('Error');

      expect(result.executionTime).toBe(0);
    });

    it('should have zero memory', () => {
      const result = service.createErrorResult('Error');

      expect(result.memory).toBe(0);
    });

    it('should have exit code -1', () => {
      const result = service.createErrorResult('Error');

      expect(result.exitCode).toBe(-1);
    });

    it('should handle empty error message', () => {
      const result = service.createErrorResult('');

      expect(result.stderr).toBe('System Error: ');
    });

    it('should handle long error messages', () => {
      const longError = 'A'.repeat(1000);
      const result = service.createErrorResult(longError);

      expect(result.stderr).toContain(longError);
    });
  });
});

function createDockerLogBuffer(stdout: string, stderr: string): Buffer {
  const frames: Buffer<ArrayBuffer>[] = [];

  if (stdout) {
    const stdoutBuffer = Buffer.from(stdout, 'utf-8');
    const stdoutHeader = Buffer.alloc(8);
    stdoutHeader[0] = 1;
    stdoutHeader.writeUInt32BE(stdoutBuffer.length, 4);
    frames.push(Buffer.concat([stdoutHeader, stdoutBuffer]));
  }

  if (stderr) {
    const stderrBuffer = Buffer.from(stderr, 'utf-8');
    const stderrHeader = Buffer.alloc(8);
    stderrHeader[0] = 2;
    stderrHeader.writeUInt32BE(stderrBuffer.length, 4);
    frames.push(Buffer.concat([stderrHeader, stderrBuffer]));
  }

  return frames.length > 0 ? Buffer.concat(frames) : Buffer.alloc(0);
}
