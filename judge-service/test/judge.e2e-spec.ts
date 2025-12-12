import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionService } from '../src/execution/docker-execution.service';
import { ExecutionModule } from '../src/execution/execution.module';

describe('Judge E2E - Code Execution', () => {
  let executionService: ExecutionService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ExecutionModule],
    }).compile();

    executionService = module.get<ExecutionService>(ExecutionService);
    await executionService.onModuleInit();
  }, 30000);

  afterAll(async () => {
    await module.close();
  });

  describe('Python Execution', () => {
    it('should execute simple Python hello world', async () => {
      const code = 'print("Hello World")';
      const result = await executionService.runCode(code, 'python', '', 1000);

      expect(result.stdout.trim()).toBe('Hello World');
      expect(result.exitCode).toBe(0);
      expect(result.isTimeLimitExceeded).toBe(false);
    }, 10000);

    it('should execute Python with input', async () => {
      const code = 'x = input()\nprint(x)';
      const input = '42\n';

      const result = await executionService.runCode(
        code,
        'python',
        input,
        1000,
      );

      expect(result.stdout.trim()).toBe('42');
      expect(result.exitCode).toBe(0);
    }, 10000);

    it('should execute Python with multiple inputs', async () => {
      const code = 'a = input()\nb = input()\nprint(int(a) + int(b))';
      const input = '5\n10\n';

      const result = await executionService.runCode(
        code,
        'python',
        input,
        1000,
      );

      expect(result.stdout.trim()).toBe('15');
      expect(result.exitCode).toBe(0);
    }, 10000);

    it('should handle Python runtime error (division by zero)', async () => {
      const code = 'print(1/0)';

      const result = await executionService.runCode(code, 'python', '', 1000);

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('ZeroDivisionError');
    }, 10000);

    it('should handle Python syntax error', async () => {
      const code = 'print("unclosed string';

      const result = await executionService.runCode(code, 'python', '', 1000);

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('SyntaxError');
    }, 10000);

    it('should track memory usage for Python', async () => {
      const code = 'print("test")';

      const result = await executionService.runCode(code, 'python', '', 1000);

      expect(result.memory).toBeGreaterThan(0);
      expect(result.memory).toBeLessThan(100 * 1024 * 1024);
    }, 10000);

    it('should track execution time for Python', async () => {
      const code = 'print("test")';

      const result = await executionService.runCode(code, 'python', '', 1000);

      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.executionTime).toBeLessThan(1000);
    }, 10000);

    it('should handle Python timeout', async () => {
      const code = 'import time\ntime.sleep(10)\nprint("done")';

      const result = await executionService.runCode(code, 'python', '', 500);

      expect(result.isTimeLimitExceeded).toBe(true);
    }, 15000);

    it('should execute Python with unicode characters', async () => {
      const code = 'print("Hello 世界 🌍")';

      const result = await executionService.runCode(code, 'python', '', 1000);

      expect(result.stdout.trim()).toBe('Hello 世界 🌍');
      expect(result.exitCode).toBe(0);
    }, 10000);

    it('should handle Python with multiple print statements', async () => {
      const code = 'print("Line 1")\nprint("Line 2")\nprint("Line 3")';

      const result = await executionService.runCode(code, 'python', '', 1000);

      const lines = result.stdout.trim().split('\n');
      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('Line 1');
      expect(lines[1]).toBe('Line 2');
      expect(lines[2]).toBe('Line 3');
    }, 10000);

    it('should execute Python with imports', async () => {
      const code = 'import math\nprint(math.sqrt(16))';

      const result = await executionService.runCode(code, 'python', '', 1000);

      expect(result.stdout.trim()).toBe('4.0');
      expect(result.exitCode).toBe(0);
    }, 10000);

    it('should handle Python list operations', async () => {
      const code = 'arr = [1, 2, 3, 4, 5]\nprint(sum(arr))';

      const result = await executionService.runCode(code, 'python', '', 1000);

      expect(result.stdout.trim()).toBe('15');
      expect(result.exitCode).toBe(0);
    }, 10000);
  });

  describe('JavaScript Execution', () => {
    it('should execute simple JavaScript hello world', async () => {
      const code = 'function solution() { return "Hello World"; }';
      const input = JSON.stringify([]);

      const result = await executionService.runCode(
        code,
        'javascript',
        input,
        1000,
      );

      expect(JSON.parse(result.stdout.trim())).toBe('Hello World');
      expect(result.exitCode).toBe(0);
      expect(result.isTimeLimitExceeded).toBe(false);
    }, 10000);

    it('should execute JavaScript with input (simulated)', async () => {
      const code = 'function solution(x) { return x; }';
      const input = JSON.stringify([42]);

      const result = await executionService.runCode(
        code,
        'javascript',
        input,
        1000,
      );

      expect(JSON.parse(result.stdout.trim())).toBe(42);
      expect(result.exitCode).toBe(0);
    }, 10000);

    it('should handle JavaScript runtime error', async () => {
      const code = 'throw new Error("Test error")';

      const result = await executionService.runCode(
        code,
        'javascript',
        '',
        1000,
      );

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('Error');
    }, 10000);

    it('should handle JavaScript syntax error', async () => {
      const code = 'console.log("unclosed string';

      const result = await executionService.runCode(
        code,
        'javascript',
        '',
        1000,
      );

      expect(result.exitCode).not.toBe(0);
    }, 10000);

    it('should track memory usage for JavaScript', async () => {
      const code = 'console.log("test")';

      const result = await executionService.runCode(
        code,
        'javascript',
        '',
        1000,
      );

      expect(result.memory).toBeGreaterThan(0);
      expect(result.memory).toBeLessThan(100 * 1024 * 1024);
    }, 10000);

    it('should track execution time for JavaScript', async () => {
      const code = 'console.log("test")';

      const result = await executionService.runCode(
        code,
        'javascript',
        '',
        1000,
      );

      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.executionTime).toBeLessThan(1000);
    }, 10000);

    it('should handle JavaScript timeout', async () => {
      const code = 'while(true){}';

      const result = await executionService.runCode(
        code,
        'javascript',
        '',
        500,
      );

      expect(result.isTimeLimitExceeded).toBe(true);
    }, 15000);

    it('should execute JavaScript with unicode characters', async () => {
      const code = 'function solution() { return "Hello 世界 🌍"; }';
      const input = JSON.stringify([]);

      const result = await executionService.runCode(
        code,
        'javascript',
        input,
        1000,
      );

      expect(JSON.parse(result.stdout.trim())).toBe('Hello 世界 🌍');
      expect(result.exitCode).toBe(0);
    }, 10000);

    it('should handle JavaScript with multiple console.log', async () => {
      const code =
        'function solution() { console.log("Line 1"); console.log("Line 2"); console.log("Line 3"); return "done"; }';
      const input = JSON.stringify([]);

      const result = await executionService.runCode(
        code,
        'javascript',
        input,
        1000,
      );

      expect(result.exitCode).toBe(0);
    }, 10000);

    it('should execute JavaScript with array operations', async () => {
      const code =
        'function solution(arr) { return arr.reduce((a, b) => a + b, 0); }';
      const input = JSON.stringify([[1, 2, 3, 4, 5]]);

      const result = await executionService.runCode(
        code,
        'javascript',
        input,
        1000,
      );

      expect(JSON.parse(result.stdout.trim())).toBe(15);
      expect(result.exitCode).toBe(0);
    }, 10000);
  });

  describe('Resource Tracking', () => {
    it('should parse /usr/bin/time output for Python', async () => {
      const code = 'print("test")';

      const result = await executionService.runCode(code, 'python', '', 1000);

      expect(result.memory).toBeGreaterThan(0);
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.stderr).not.toContain('Command being timed');
      expect(result.stderr).not.toContain('Maximum resident set size');
    }, 10000);

    it('should parse /usr/bin/time output for JavaScript', async () => {
      const code = 'console.log("test")';

      const result = await executionService.runCode(
        code,
        'javascript',
        '',
        1000,
      );

      expect(result.memory).toBeGreaterThan(0);
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.stderr).not.toContain('Command being timed');
    }, 10000);

    it('should track higher memory for memory-intensive Python code', async () => {
      const simpleCode = 'print("simple")';
      const memoryIntensiveCode =
        'arr = [i for i in range(1000000)]\nprint(len(arr))';

      const simpleResult = await executionService.runCode(
        simpleCode,
        'python',
        '',
        2000,
      );
      const intensiveResult = await executionService.runCode(
        memoryIntensiveCode,
        'python',
        '',
        2000,
      );

      expect(intensiveResult.memory).toBeGreaterThan(simpleResult.memory);
    }, 15000);

    it('should track higher time for CPU-intensive code', async () => {
      const simpleCode = 'print("simple")';
      const cpuIntensiveCode =
        'sum([i**2 for i in range(100000)])\nprint("done")';

      const simpleResult = await executionService.runCode(
        simpleCode,
        'python',
        '',
        2000,
      );
      const intensiveResult = await executionService.runCode(
        cpuIntensiveCode,
        'python',
        '',
        2000,
      );

      expect(intensiveResult.executionTime).toBeGreaterThan(
        simpleResult.executionTime,
      );
    }, 15000);
  });

  describe('Edge Cases', () => {
    it('should handle empty code', async () => {
      const code = '';

      const result = await executionService.runCode(code, 'python', '', 1000);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('');
    }, 10000);

    it('should handle code with only whitespace', async () => {
      const code = '   \n\n   ';

      const result = await executionService.runCode(code, 'python', '', 1000);

      expect(result.exitCode).toBe(0);
    }, 10000);

    it('should handle code with only comments', async () => {
      const code = '# This is a comment\n# Another comment';

      const result = await executionService.runCode(code, 'python', '', 1000);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('');
    }, 10000);

    it('should handle very large output', async () => {
      const code = 'for i in range(1000):\n    print(i)';

      const result = await executionService.runCode(code, 'python', '', 2000);

      expect(result.exitCode).toBe(0);
      expect(result.stdout.split('\n').length).toBeGreaterThan(500);
    }, 10000);

    it('should handle code with stderr warnings', async () => {
      const code =
        'import sys\nprint("output")\nprint("warning", file=sys.stderr)';

      const result = await executionService.runCode(code, 'python', '', 1000);

      expect(result.stdout.trim()).toBe('output');
      expect(result.stderr).toContain('warning');
      expect(result.exitCode).toBe(0);
    }, 10000);
  });

  describe('Concurrent Executions', () => {
    it('should handle multiple concurrent Python executions', async () => {
      const codes = [
        'print("Execution 1")',
        'print("Execution 2")',
        'print("Execution 3")',
      ];

      const results = await Promise.all(
        codes.map((code) => executionService.runCode(code, 'python', '', 1000)),
      );

      expect(results).toHaveLength(3);
      expect(results[0].stdout.trim()).toBe('Execution 1');
      expect(results[1].stdout.trim()).toBe('Execution 2');
      expect(results[2].stdout.trim()).toBe('Execution 3');
      results.forEach((result) => expect(result.exitCode).toBe(0));
    }, 15000);

    it('should handle mixed Python and JavaScript executions', async () => {
      const pythonCode = 'def solution():\n    return "Python"';
      const jsCode = 'function solution() { return "JavaScript"; }';
      const input = JSON.stringify([]);

      const [pythonResult, jsResult] = await Promise.all([
        executionService.runCode(pythonCode, 'python', input, 1000),
        executionService.runCode(jsCode, 'javascript', input, 1000),
      ]);

      expect(JSON.parse(pythonResult.stdout.trim())).toBe('Python');
      expect(JSON.parse(jsResult.stdout.trim())).toBe('JavaScript');
      expect(pythonResult.exitCode).toBe(0);
      expect(jsResult.exitCode).toBe(0);
    }, 15000);
  });
});
