import { Test, TestingModule } from '@nestjs/testing';
import { JudgeProcessor } from './judge.processor';
import { ApiService } from './api/api.service';
import { ExecutionService } from './execution/docker-execution.service';
import { Logger } from '@nestjs/common';

describe('JudgeProcessor', () => {
  let processor: JudgeProcessor;
  let mockApiService: jest.Mocked<ApiService>;
  let mockExecutionService: jest.Mocked<ExecutionService>;

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
    mockApiService = {
      getProblem: jest.fn(),
      updateSubmission: jest.fn(),
    } as any;

    mockExecutionService = {
      runCode: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JudgeProcessor,
        {
          provide: ApiService,
          useValue: mockApiService,
        },
        {
          provide: ExecutionService,
          useValue: mockExecutionService,
        },
      ],
    }).compile();

    processor = module.get<JudgeProcessor>(JudgeProcessor);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('process', () => {
    const mockJob = {
      id: 'submission-123',
      data: {
        problemId: 'problem-456',
        code: 'print("Hello")',
        language: 'python',
      },
    };

    const mockProblem = {
      timeLimit: 1000,
      memoryLimit: 262144,
      testCases: [
        { id: 'test-1', input: '5', output: '5' },
        { id: 'test-2', input: '10', output: '10' },
      ],
    };

    it('should update submission to IN_PROGRESS', async () => {
      mockApiService.getProblem.mockResolvedValue(mockProblem);
      mockApiService.updateSubmission.mockResolvedValue();
      mockExecutionService.runCode.mockResolvedValue({
        stdout: '5',
        stderr: '',
        executionTime: 50,
        memory: 1024,
        isTimeLimitExceeded: false,
        exitCode: 0,
      });

      await processor.process(mockJob as any);

      expect(mockApiService.updateSubmission).toHaveBeenCalledWith(
        'submission-123',
        { status: 'IN_PROGRESS' },
      );
    });

    it('should fetch problem data', async () => {
      mockApiService.getProblem.mockResolvedValue(mockProblem);
      mockApiService.updateSubmission.mockResolvedValue();
      mockExecutionService.runCode.mockResolvedValue({
        stdout: '5',
        stderr: '',
        executionTime: 50,
        memory: 1024,
        isTimeLimitExceeded: false,
        exitCode: 0,
      });

      await processor.process(mockJob as any);

      expect(mockApiService.getProblem).toHaveBeenCalledWith('problem-456');
    });

    it('should run all test cases for ACCEPTED verdict', async () => {
      mockApiService.getProblem.mockResolvedValue(mockProblem);
      mockApiService.updateSubmission.mockResolvedValue();
      mockExecutionService.runCode
        .mockResolvedValueOnce({
          stdout: '5\n',
          stderr: '',
          executionTime: 50,
          memory: 1024,
          isTimeLimitExceeded: false,
          exitCode: 0,
        })
        .mockResolvedValueOnce({
          stdout: '10\n',
          stderr: '',
          executionTime: 60,
          memory: 2048,
          isTimeLimitExceeded: false,
          exitCode: 0,
        });

      const result = await processor.process(mockJob as any);

      expect(mockExecutionService.runCode).toHaveBeenCalledTimes(2);
      expect(result.verdict).toBe('ACCEPTED');
    });

    it('should stop on first failure', async () => {
      mockApiService.getProblem.mockResolvedValue(mockProblem);
      mockApiService.updateSubmission.mockResolvedValue();
      mockExecutionService.runCode.mockResolvedValueOnce({
        stdout: '999\n',
        stderr: '',
        executionTime: 50,
        memory: 1024,
        isTimeLimitExceeded: false,
        exitCode: 0,
      });

      await processor.process(mockJob as any);

      expect(mockExecutionService.runCode).toHaveBeenCalledTimes(1);
    });

    it('should calculate max time correctly', async () => {
      mockApiService.getProblem.mockResolvedValue(mockProblem);
      mockApiService.updateSubmission.mockResolvedValue();
      mockExecutionService.runCode
        .mockResolvedValueOnce({
          stdout: '5\n',
          stderr: '',
          executionTime: 50,
          memory: 1024,
          isTimeLimitExceeded: false,
          exitCode: 0,
        })
        .mockResolvedValueOnce({
          stdout: '10\n',
          stderr: '',
          executionTime: 150,
          memory: 2048,
          isTimeLimitExceeded: false,
          exitCode: 0,
        });

      await processor.process(mockJob as any);

      const updateCall = mockApiService.updateSubmission.mock.calls[1][1];
      expect(updateCall.time).toBe(150);
    });

    it('should calculate max memory correctly', async () => {
      mockApiService.getProblem.mockResolvedValue(mockProblem);
      mockApiService.updateSubmission.mockResolvedValue();
      mockExecutionService.runCode
        .mockResolvedValueOnce({
          stdout: '5\n',
          stderr: '',
          executionTime: 50,
          memory: 5120,
          isTimeLimitExceeded: false,
          exitCode: 0,
        })
        .mockResolvedValueOnce({
          stdout: '10\n',
          stderr: '',
          executionTime: 60,
          memory: 10240,
          isTimeLimitExceeded: false,
          exitCode: 0,
        });

      await processor.process(mockJob as any);

      const updateCall = mockApiService.updateSubmission.mock.calls[1][1];
      expect(updateCall.memory).toBe(10);
    });

    it('should count passed tests correctly', async () => {
      mockApiService.getProblem.mockResolvedValue(mockProblem);
      mockApiService.updateSubmission.mockResolvedValue();
      mockExecutionService.runCode
        .mockResolvedValueOnce({
          stdout: '5\n',
          stderr: '',
          executionTime: 50,
          memory: 1024,
          isTimeLimitExceeded: false,
          exitCode: 0,
        })
        .mockResolvedValueOnce({
          stdout: '10\n',
          stderr: '',
          executionTime: 60,
          memory: 2048,
          isTimeLimitExceeded: false,
          exitCode: 0,
        });

      await processor.process(mockJob as any);

      const updateCall = mockApiService.updateSubmission.mock.calls[1][1];
      expect(updateCall.testCasesPassed).toBe(2);
    });

    it('should detect ACCEPTED verdict', async () => {
      mockApiService.getProblem.mockResolvedValue(mockProblem);
      mockApiService.updateSubmission.mockResolvedValue();
      mockExecutionService.runCode
        .mockResolvedValueOnce({
          stdout: '5\n',
          stderr: '',
          executionTime: 50,
          memory: 1024,
          isTimeLimitExceeded: false,
          exitCode: 0,
        })
        .mockResolvedValueOnce({
          stdout: '10\n',
          stderr: '',
          executionTime: 60,
          memory: 2048,
          isTimeLimitExceeded: false,
          exitCode: 0,
        });

      await processor.process(mockJob as any);

      const updateCall = mockApiService.updateSubmission.mock.calls[1][1];
      expect(updateCall.verdict).toBe('ACCEPTED');
    });

    it('should detect WRONG_ANSWER verdict', async () => {
      mockApiService.getProblem.mockResolvedValue(mockProblem);
      mockApiService.updateSubmission.mockResolvedValue();
      mockExecutionService.runCode.mockResolvedValueOnce({
        stdout: '999\n',
        stderr: '',
        executionTime: 50,
        memory: 1024,
        isTimeLimitExceeded: false,
        exitCode: 0,
      });

      await processor.process(mockJob as any);

      const updateCall = mockApiService.updateSubmission.mock.calls[1][1];
      expect(updateCall.verdict).toBe('WRONG_ANSWER');
    });

    it('should detect TIME_LIMIT_EXCEEDED verdict', async () => {
      mockApiService.getProblem.mockResolvedValue(mockProblem);
      mockApiService.updateSubmission.mockResolvedValue();
      mockExecutionService.runCode.mockResolvedValueOnce({
        stdout: '',
        stderr: 'Time Limit Exceeded',
        executionTime: 1000,
        memory: 1024,
        isTimeLimitExceeded: true,
        exitCode: null,
      });

      await processor.process(mockJob as any);

      const updateCall = mockApiService.updateSubmission.mock.calls[1][1];
      expect(updateCall.verdict).toBe('TIME_LIMIT_EXCEEDED');
    });

    it('should detect RUNTIME_ERROR verdict', async () => {
      mockApiService.getProblem.mockResolvedValue(mockProblem);
      mockApiService.updateSubmission.mockResolvedValue();
      mockExecutionService.runCode.mockResolvedValueOnce({
        stdout: '',
        stderr: 'ZeroDivisionError',
        executionTime: 50,
        memory: 1024,
        isTimeLimitExceeded: false,
        exitCode: 1,
      });

      await processor.process(mockJob as any);

      const updateCall = mockApiService.updateSubmission.mock.calls[1][1];
      expect(updateCall.verdict).toBe('RUNTIME_ERROR');
    });

    it('should generate test logs', async () => {
      mockApiService.getProblem.mockResolvedValue(mockProblem);
      mockApiService.updateSubmission.mockResolvedValue();
      mockExecutionService.runCode
        .mockResolvedValueOnce({
          stdout: '5\n',
          stderr: '',
          executionTime: 50,
          memory: 1024,
          isTimeLimitExceeded: false,
          exitCode: 0,
        })
        .mockResolvedValueOnce({
          stdout: '10\n',
          stderr: '',
          executionTime: 60,
          memory: 2048,
          isTimeLimitExceeded: false,
          exitCode: 0,
        });

      await processor.process(mockJob as any);

      const updateCall = mockApiService.updateSubmission.mock.calls[1][1];
      expect(updateCall.testLogs).toHaveLength(2);
      expect(updateCall.testLogs[0].testCaseId).toBe('test-1');
      expect(updateCall.testLogs[0].status).toBe('ACCEPTED');
      expect(updateCall.testLogs[1].testCaseId).toBe('test-2');
      expect(updateCall.testLogs[1].status).toBe('ACCEPTED');
    });

    it('should handle errors and update status to FAILED', async () => {
      mockApiService.getProblem.mockRejectedValue(
        new Error('Problem not found'),
      );
      mockApiService.updateSubmission.mockResolvedValue();

      await expect(processor.process(mockJob as any)).rejects.toThrow(
        'Problem not found',
      );

      expect(mockApiService.updateSubmission).toHaveBeenCalledWith(
        'submission-123',
        { status: 'FAILED' },
      );
    });

    it('should handle API update errors gracefully', async () => {
      mockApiService.getProblem.mockRejectedValue(new Error('Test error'));
      mockApiService.updateSubmission
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('API down'));

      await expect(processor.process(mockJob as any)).rejects.toThrow(
        'Test error',
      );
    });

    it('should trim output when comparing', async () => {
      mockApiService.getProblem.mockResolvedValue(mockProblem);
      mockApiService.updateSubmission.mockResolvedValue();
      mockExecutionService.runCode
        .mockResolvedValueOnce({
          stdout: '  5  \n',
          stderr: '',
          executionTime: 50,
          memory: 1024,
          isTimeLimitExceeded: false,
          exitCode: 0,
        })
        .mockResolvedValueOnce({
          stdout: '  10  \n',
          stderr: '',
          executionTime: 60,
          memory: 2048,
          isTimeLimitExceeded: false,
          exitCode: 0,
        });

      await processor.process(mockJob as any);

      const updateCall = mockApiService.updateSubmission.mock.calls[1][1];
      expect(updateCall.verdict).toBe('ACCEPTED');
    });

    it('should pass correct parameters to runCode', async () => {
      mockApiService.getProblem.mockResolvedValue(mockProblem);
      mockApiService.updateSubmission.mockResolvedValue();
      mockExecutionService.runCode
        .mockResolvedValueOnce({
          stdout: '5\n',
          stderr: '',
          executionTime: 50,
          memory: 1024,
          isTimeLimitExceeded: false,
          exitCode: 0,
        })
        .mockResolvedValueOnce({
          stdout: '10\n',
          stderr: '',
          executionTime: 60,
          memory: 2048,
          isTimeLimitExceeded: false,
          exitCode: 0,
        });

      await processor.process(mockJob as any);

      expect(mockExecutionService.runCode).toHaveBeenCalledWith(
        'print("Hello")',
        'python',
        '5',
        1000,
      );
    });

    it('should include stderr in test logs', async () => {
      mockApiService.getProblem.mockResolvedValue(mockProblem);
      mockApiService.updateSubmission.mockResolvedValue();
      mockExecutionService.runCode
        .mockResolvedValueOnce({
          stdout: '5\n',
          stderr: 'Warning: deprecated',
          executionTime: 50,
          memory: 1024,
          isTimeLimitExceeded: false,
          exitCode: 0,
        })
        .mockResolvedValueOnce({
          stdout: '10\n',
          stderr: '',
          executionTime: 60,
          memory: 2048,
          isTimeLimitExceeded: false,
          exitCode: 0,
        });

      await processor.process(mockJob as any);

      const updateCall = mockApiService.updateSubmission.mock.calls[1][1];
      expect(updateCall.testLogs[0].stderr).toBe('Warning: deprecated');
    });

    it('should omit empty stderr from test logs', async () => {
      mockApiService.getProblem.mockResolvedValue(mockProblem);
      mockApiService.updateSubmission.mockResolvedValue();
      mockExecutionService.runCode
        .mockResolvedValueOnce({
          stdout: '5\n',
          stderr: '',
          executionTime: 50,
          memory: 1024,
          isTimeLimitExceeded: false,
          exitCode: 0,
        })
        .mockResolvedValueOnce({
          stdout: '10\n',
          stderr: '',
          executionTime: 60,
          memory: 2048,
          isTimeLimitExceeded: false,
          exitCode: 0,
        });

      await processor.process(mockJob as any);

      const updateCall = mockApiService.updateSubmission.mock.calls[1][1];
      expect(updateCall.testLogs[0].stderr).toBeUndefined();
    });

    it('should round time and memory in test logs', async () => {
      mockApiService.getProblem.mockResolvedValue(mockProblem);
      mockApiService.updateSubmission.mockResolvedValue();
      mockExecutionService.runCode
        .mockResolvedValueOnce({
          stdout: '5\n',
          stderr: '',
          executionTime: 123.456,
          memory: 5678.9,
          isTimeLimitExceeded: false,
          exitCode: 0,
        })
        .mockResolvedValueOnce({
          stdout: '10\n',
          stderr: '',
          executionTime: 200,
          memory: 10000,
          isTimeLimitExceeded: false,
          exitCode: 0,
        });

      await processor.process(mockJob as any);

      const updateCall = mockApiService.updateSubmission.mock.calls[1][1];
      expect(updateCall.testLogs[0].executionTime).toBe(123);
      expect(updateCall.testLogs[0].memory).toBe(6);
    });

    it('should update submission with COMPLETED status', async () => {
      mockApiService.getProblem.mockResolvedValue(mockProblem);
      mockApiService.updateSubmission.mockResolvedValue();
      mockExecutionService.runCode
        .mockResolvedValueOnce({
          stdout: '5\n',
          stderr: '',
          executionTime: 50,
          memory: 1024,
          isTimeLimitExceeded: false,
          exitCode: 0,
        })
        .mockResolvedValueOnce({
          stdout: '10\n',
          stderr: '',
          executionTime: 60,
          memory: 2048,
          isTimeLimitExceeded: false,
          exitCode: 0,
        });

      await processor.process(mockJob as any);

      const updateCall = mockApiService.updateSubmission.mock.calls[1][1];
      expect(updateCall.status).toBe('COMPLETED');
    });
  });
});
