import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionService } from './docker-execution.service';
import { FileManager } from './managers/file.manager';
import { CodeExecutionService } from './services/code-execution.service';
import { ResultCollectorService } from './services/result-collector.service';
import { ContainerManager } from './managers/container.manager';

describe('ExecutionService Integration', () => {
  let service: ExecutionService;
  let fileManager: FileManager;
  let codeExecutionService: CodeExecutionService;
  let resultCollector: ResultCollectorService;
  let containerManager: ContainerManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutionService,
        FileManager,
        ContainerManager,
        CodeExecutionService,
        ResultCollectorService,
      ],
    }).compile();

    service = module.get<ExecutionService>(ExecutionService);
    fileManager = module.get<FileManager>(FileManager);
    codeExecutionService =
      module.get<CodeExecutionService>(CodeExecutionService);
    resultCollector = module.get<ResultCollectorService>(
      ResultCollectorService,
    );
    containerManager = module.get<ContainerManager>(ContainerManager);
  });

  describe('runCode integration', () => {
    it('should execute complete flow: file write → container run → result collection → cleanup', async () => {
      const code = 'print("test")';
      const language = 'python';
      const input = '';
      const timeLimit = 1000;

      const writeFileSpy = jest
        .spyOn(fileManager, 'writeCodeFile')
        .mockResolvedValue({
          filename: 'test.py',
          filepath: '/tmp/test.py',
        });

      const cleanupSpy = jest.spyOn(fileManager, 'cleanup').mockResolvedValue();

      const executeSpy = jest
        .spyOn(codeExecutionService, 'execute')
        .mockResolvedValue({
          stdout: 'test\n',
          stderr: '',
          executionTime: 50,
          memory: 1024,
          isTimeLimitExceeded: false,
          exitCode: 0,
        });

      const result = await service.runCode(code, language, input, timeLimit);

      expect(writeFileSpy).toHaveBeenCalledWith(
        expect.stringContaining('/tmp'),
        expect.stringContaining(code),
        'py',
      );
      expect(executeSpy).toHaveBeenCalled();
      expect(cleanupSpy).toHaveBeenCalledWith('/tmp/test.py');
      expect(result.stdout).toBe('test\n');
      expect(result.exitCode).toBe(0);
    });

    it('should handle Python execution flow', async () => {
      const code = 'print("Hello Python")';
      const language = 'python';

      jest.spyOn(fileManager, 'writeCodeFile').mockResolvedValue({
        filename: 'test.py',
        filepath: '/tmp/test.py',
      });
      jest.spyOn(fileManager, 'cleanup').mockResolvedValue();
      jest.spyOn(codeExecutionService, 'execute').mockResolvedValue({
        stdout: 'Hello Python\n',
        stderr: '',
        executionTime: 100,
        memory: 8192 * 1024,
        isTimeLimitExceeded: false,
        exitCode: 0,
      });

      const result = await service.runCode(code, language, '', 1000);

      expect(result.stdout).toBe('Hello Python\n');
      expect(result.memory).toBe(8192 * 1024);
    });

    it('should handle JavaScript execution flow', async () => {
      const code = 'console.log("Hello JS")';
      const language = 'javascript';

      jest.spyOn(fileManager, 'writeCodeFile').mockResolvedValue({
        filename: 'test.js',
        filepath: '/tmp/test.js',
      });
      jest.spyOn(fileManager, 'cleanup').mockResolvedValue();
      jest.spyOn(codeExecutionService, 'execute').mockResolvedValue({
        stdout: 'Hello JS\n',
        stderr: '',
        executionTime: 80,
        memory: 16384 * 1024,
        isTimeLimitExceeded: false,
        exitCode: 0,
      });

      const result = await service.runCode(code, language, '', 1000);

      expect(result.stdout).toBe('Hello JS\n');
      expect(result.memory).toBe(16384 * 1024);
    });

    it('should pass input to execution service', async () => {
      const code = 'x = input(); print(x)';
      const input = '42\n';

      jest.spyOn(fileManager, 'writeCodeFile').mockResolvedValue({
        filename: 'test.py',
        filepath: '/tmp/test.py',
      });
      jest.spyOn(fileManager, 'cleanup').mockResolvedValue();
      const executeSpy = jest
        .spyOn(codeExecutionService, 'execute')
        .mockResolvedValue({
          stdout: '42\n',
          stderr: '',
          executionTime: 50,
          memory: 1024,
          isTimeLimitExceeded: false,
          exitCode: 0,
        });

      await service.runCode(code, 'python', input, 1000);

      expect(executeSpy).toHaveBeenCalled();
      const callArgs = executeSpy.mock.calls[0];
      expect(callArgs[2]).toBe(input);
      expect(callArgs[3]).toBe(1000);
    });

    it('should cleanup file even if execution fails', async () => {
      const code = 'invalid code';

      jest.spyOn(fileManager, 'writeCodeFile').mockResolvedValue({
        filename: 'test.py',
        filepath: '/tmp/test.py',
      });
      const cleanupSpy = jest.spyOn(fileManager, 'cleanup').mockResolvedValue();
      jest
        .spyOn(codeExecutionService, 'execute')
        .mockRejectedValue(new Error('Execution failed'));

      const result = await service.runCode(code, 'python', '', 1000);

      expect(cleanupSpy).toHaveBeenCalledWith('/tmp/test.py');
      expect(result.stderr).toContain('System Error');
    });

    it('should return error result on execution failure', async () => {
      const code = 'test';

      jest.spyOn(fileManager, 'writeCodeFile').mockResolvedValue({
        filename: 'test.py',
        filepath: '/tmp/test.py',
      });
      jest.spyOn(fileManager, 'cleanup').mockResolvedValue();
      jest
        .spyOn(codeExecutionService, 'execute')
        .mockRejectedValue(new Error('Container creation failed'));

      const result = await service.runCode(code, 'python', '', 1000);

      expect(result.exitCode).toBe(-1);
      expect(result.stderr).toContain('Container creation failed');
    });

    it('should handle file write errors', async () => {
      const code = 'test';

      jest
        .spyOn(fileManager, 'writeCodeFile')
        .mockRejectedValue(new Error('Disk full'));

      const result = await service.runCode(code, 'python', '', 1000);

      expect(result.exitCode).toBe(-1);
      expect(result.stderr).toContain('Disk full');
    });

    it('should handle unsupported language errors', async () => {
      const code = 'test';

      const result = await service.runCode(code, 'ruby', '', 1000);

      expect(result.exitCode).toBe(-1);
      expect(result.stderr).toContain('Unsupported language');
    });

    it('should propagate timeout results from execution', async () => {
      const code = 'while True: pass';

      jest.spyOn(fileManager, 'writeCodeFile').mockResolvedValue({
        filename: 'test.py',
        filepath: '/tmp/test.py',
      });
      jest.spyOn(fileManager, 'cleanup').mockResolvedValue();
      jest.spyOn(codeExecutionService, 'execute').mockResolvedValue({
        stdout: '',
        stderr: 'Time Limit Exceeded',
        executionTime: 1000,
        memory: 1024,
        isTimeLimitExceeded: true,
        exitCode: null,
      });

      const result = await service.runCode(code, 'python', '', 1000);

      expect(result.isTimeLimitExceeded).toBe(true);
      expect(result.stderr).toBe('Time Limit Exceeded');
    });

    it('should handle runtime errors from execution', async () => {
      const code = 'print(1/0)';

      jest.spyOn(fileManager, 'writeCodeFile').mockResolvedValue({
        filename: 'test.py',
        filepath: '/tmp/test.py',
      });
      jest.spyOn(fileManager, 'cleanup').mockResolvedValue();
      jest.spyOn(codeExecutionService, 'execute').mockResolvedValue({
        stdout: '',
        stderr: 'ZeroDivisionError',
        executionTime: 50,
        memory: 1024,
        isTimeLimitExceeded: false,
        exitCode: 1,
      });

      const result = await service.runCode(code, 'python', '', 1000);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('ZeroDivisionError');
    });

    it('should ensure directory exists before writing files', async () => {
      jest.spyOn(fileManager, 'writeCodeFile').mockResolvedValue({
        filename: 'test.py',
        filepath: '/tmp/test.py',
      });
      jest.spyOn(fileManager, 'cleanup').mockResolvedValue();
      jest.spyOn(codeExecutionService, 'execute').mockResolvedValue({
        stdout: 'ok',
        stderr: '',
        executionTime: 50,
        memory: 1024,
        isTimeLimitExceeded: false,
        exitCode: 0,
      });

      await service.runCode('test', 'python', '', 1000);

      expect(fileManager.writeCodeFile).toHaveBeenCalled();
    });

    it('should build correct container config for python', async () => {
      jest.spyOn(fileManager, 'writeCodeFile').mockResolvedValue({
        filename: 'test.py',
        filepath: '/tmp/test.py',
      });
      jest.spyOn(fileManager, 'cleanup').mockResolvedValue();
      const executeSpy = jest
        .spyOn(codeExecutionService, 'execute')
        .mockResolvedValue({
          stdout: 'ok',
          stderr: '',
          executionTime: 50,
          memory: 1024,
          isTimeLimitExceeded: false,
          exitCode: 0,
        });

      await service.runCode('test', 'python', '', 1000);

      const containerConfig = executeSpy.mock.calls[0][1];
      expect(containerConfig.Image).toBe('python:3.9-slim-time');
      expect(containerConfig.Cmd).toContain('/usr/bin/time');
      expect(containerConfig.Cmd).toContain('python3');
    });

    it('should build correct container config for javascript', async () => {
      jest.spyOn(fileManager, 'writeCodeFile').mockResolvedValue({
        filename: 'test.js',
        filepath: '/tmp/test.js',
      });
      jest.spyOn(fileManager, 'cleanup').mockResolvedValue();
      const executeSpy = jest
        .spyOn(codeExecutionService, 'execute')
        .mockResolvedValue({
          stdout: 'ok',
          stderr: '',
          executionTime: 50,
          memory: 1024,
          isTimeLimitExceeded: false,
          exitCode: 0,
        });

      await service.runCode('test', 'javascript', '', 1000);

      const containerConfig = executeSpy.mock.calls[0][1];
      expect(containerConfig.Image).toBe('node:18-slim-time');
      expect(containerConfig.Cmd).toContain('/usr/bin/time');
      expect(containerConfig.Cmd).toContain('node');
    });

    it('should handle multiline code', async () => {
      const code = 'line1\nline2\nline3';

      jest.spyOn(fileManager, 'writeCodeFile').mockResolvedValue({
        filename: 'test.py',
        filepath: '/tmp/test.py',
      });
      jest.spyOn(fileManager, 'cleanup').mockResolvedValue();
      jest.spyOn(codeExecutionService, 'execute').mockResolvedValue({
        stdout: 'output',
        stderr: '',
        executionTime: 50,
        memory: 1024,
        isTimeLimitExceeded: false,
        exitCode: 0,
      });

      await service.runCode(code, 'python', '', 1000);

      expect(fileManager.writeCodeFile).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining(code),
        'py',
      );
    });

    it('should handle special characters in code', async () => {
      const code = 'print("Hello 世界 🌍")';

      jest.spyOn(fileManager, 'writeCodeFile').mockResolvedValue({
        filename: 'test.py',
        filepath: '/tmp/test.py',
      });
      jest.spyOn(fileManager, 'cleanup').mockResolvedValue();
      jest.spyOn(codeExecutionService, 'execute').mockResolvedValue({
        stdout: 'Hello 世界 🌍\n',
        stderr: '',
        executionTime: 50,
        memory: 1024,
        isTimeLimitExceeded: false,
        exitCode: 0,
      });

      const result = await service.runCode(code, 'python', '', 1000);

      expect(result.stdout).toContain('世界');
      expect(result.stdout).toContain('🌍');
    });
  });

  describe('module initialization', () => {
    it('should initialize with Docker client', () => {
      expect(service).toBeDefined();
    });

    it('should have all required dependencies injected', () => {
      expect(fileManager).toBeDefined();
      expect(codeExecutionService).toBeDefined();
      expect(resultCollector).toBeDefined();
      expect(containerManager).toBeDefined();
    });
  });
});
