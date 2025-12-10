import { Test, TestingModule } from '@nestjs/testing';
import { JudgeProcessor } from '../../judge.processor';
import { ApiService } from '../../api/api.service';
import { ExecutionService } from '../docker-execution.service';
import { Job } from 'bullmq';

describe('JudgeProcessor Integration', () => {
  let processor: JudgeProcessor;
  let apiService: ApiService;
  let executionService: ExecutionService;

  beforeEach(async () => {
    const mockApiService = {
      getProblem: jest.fn(),
      updateSubmission: jest.fn(),
    };

    const mockExecutionService = {
      runCode: jest.fn(),
    };

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
    apiService = module.get<ApiService>(ApiService);
    executionService = module.get<ExecutionService>(ExecutionService);
  });

  describe('complete judging workflow', () => {
    it('should execute full workflow for accepted submission', async () => {
      const job = createMockJob({
        problemId: 'prob-1',
        code: 'print(input())',
        language: 'python',
      });

      const problem = {
        timeLimit: 1000,
        memoryLimit: 262144,
        testCases: [
          { id: 'test-1', input: '5', output: '5' },
          { id: 'test-2', input: '10', output: '10' },
        ],
      };

      (apiService.getProblem as jest.Mock).mockResolvedValue(problem);
      (apiService.updateSubmission as jest.Mock).mockResolvedValue(undefined);
      (executionService.runCode as jest.Mock)
        .mockResolvedValueOnce({
          stdout: '5\n',
          stderr: '',
          executionTime: 50,
          memory: 8192 * 1024,
          isTimeLimitExceeded: false,
          exitCode: 0,
        })
        .mockResolvedValueOnce({
          stdout: '10\n',
          stderr: '',
          executionTime: 75,
          memory: 8500 * 1024,
          isTimeLimitExceeded: false,
          exitCode: 0,
        });

      const result = await processor.process(job);

      expect(apiService.updateSubmission).toHaveBeenCalledTimes(2);
      expect(apiService.updateSubmission).toHaveBeenNthCalledWith(1, 'sub-1', {
        status: 'IN_PROGRESS',
      });
      expect(apiService.updateSubmission).toHaveBeenNthCalledWith(
        2,
        'sub-1',
        expect.objectContaining({
          status: 'COMPLETED',
          verdict: 'ACCEPTED',
          testCasesPassed: 2,
        }),
      );
      expect(result.verdict).toBe('ACCEPTED');
    });

    it('should stop execution on first wrong answer', async () => {
      const job = createMockJob({
        problemId: 'prob-1',
        code: 'print("999")',
        language: 'python',
      });

      const problem = {
        timeLimit: 1000,
        memoryLimit: 262144,
        testCases: [
          { id: 'test-1', input: '5', output: '5' },
          { id: 'test-2', input: '10', output: '10' },
          { id: 'test-3', input: '15', output: '15' },
        ],
      };

      (apiService.getProblem as jest.Mock).mockResolvedValue(problem);
      (apiService.updateSubmission as jest.Mock).mockResolvedValue(undefined);
      (executionService.runCode as jest.Mock).mockResolvedValue({
        stdout: '999\n',
        stderr: '',
        executionTime: 50,
        memory: 8192 * 1024,
        isTimeLimitExceeded: false,
        exitCode: 0,
      });

      await processor.process(job);

      expect(executionService.runCode).toHaveBeenCalledTimes(1);
      expect(apiService.updateSubmission).toHaveBeenNthCalledWith(
        2,
        'sub-1',
        expect.objectContaining({
          verdict: 'WRONG_ANSWER',
          testCasesPassed: 0,
        }),
      );
    });

    it('should handle time limit exceeded', async () => {
      const job = createMockJob({
        problemId: 'prob-1',
        code: 'while True: pass',
        language: 'python',
      });

      const problem = {
        timeLimit: 1000,
        memoryLimit: 262144,
        testCases: [{ id: 'test-1', input: '', output: '' }],
      };

      (apiService.getProblem as jest.Mock).mockResolvedValue(problem);
      (apiService.updateSubmission as jest.Mock).mockResolvedValue(undefined);
      (executionService.runCode as jest.Mock).mockResolvedValue({
        stdout: '',
        stderr: 'Time Limit Exceeded',
        executionTime: 1000,
        memory: 8192 * 1024,
        isTimeLimitExceeded: true,
        exitCode: null,
      });

      await processor.process(job);

      expect(apiService.updateSubmission).toHaveBeenNthCalledWith(
        2,
        'sub-1',
        expect.objectContaining({
          verdict: 'TIME_LIMIT_EXCEEDED',
        }),
      );
    });

    it('should handle runtime errors', async () => {
      const job = createMockJob({
        problemId: 'prob-1',
        code: 'print(1/0)',
        language: 'python',
      });

      const problem = {
        timeLimit: 1000,
        memoryLimit: 262144,
        testCases: [{ id: 'test-1', input: '', output: '0' }],
      };

      (apiService.getProblem as jest.Mock).mockResolvedValue(problem);
      (apiService.updateSubmission as jest.Mock).mockResolvedValue(undefined);
      (executionService.runCode as jest.Mock).mockResolvedValue({
        stdout: '',
        stderr: 'ZeroDivisionError: division by zero',
        executionTime: 50,
        memory: 8192 * 1024,
        isTimeLimitExceeded: false,
        exitCode: 1,
      });

      await processor.process(job);

      expect(apiService.updateSubmission).toHaveBeenNthCalledWith(
        2,
        'sub-1',
        expect.objectContaining({
          verdict: 'RUNTIME_ERROR',
        }),
      );
    });

    it('should track maximum time across test cases', async () => {
      const job = createMockJob({
        problemId: 'prob-1',
        code: 'print(input())',
        language: 'python',
      });

      const problem = {
        timeLimit: 1000,
        memoryLimit: 262144,
        testCases: [
          { id: 'test-1', input: '1', output: '1' },
          { id: 'test-2', input: '2', output: '2' },
          { id: 'test-3', input: '3', output: '3' },
        ],
      };

      (apiService.getProblem as jest.Mock).mockResolvedValue(problem);
      (apiService.updateSubmission as jest.Mock).mockResolvedValue(undefined);
      (executionService.runCode as jest.Mock)
        .mockResolvedValueOnce({
          stdout: '1\n',
          stderr: '',
          executionTime: 50,
          memory: 8192 * 1024,
          isTimeLimitExceeded: false,
          exitCode: 0,
        })
        .mockResolvedValueOnce({
          stdout: '2\n',
          stderr: '',
          executionTime: 150,
          memory: 8192 * 1024,
          isTimeLimitExceeded: false,
          exitCode: 0,
        })
        .mockResolvedValueOnce({
          stdout: '3\n',
          stderr: '',
          executionTime: 75,
          memory: 8192 * 1024,
          isTimeLimitExceeded: false,
          exitCode: 0,
        });

      await processor.process(job);

      const finalUpdate = (apiService.updateSubmission as jest.Mock).mock
        .calls[1][1];
      expect(finalUpdate.time).toBe(150);
    });

    it('should track maximum memory across test cases', async () => {
      const job = createMockJob({
        problemId: 'prob-1',
        code: 'print(input())',
        language: 'python',
      });

      const problem = {
        timeLimit: 1000,
        memoryLimit: 262144,
        testCases: [
          { id: 'test-1', input: '1', output: '1' },
          { id: 'test-2', input: '2', output: '2' },
        ],
      };

      (apiService.getProblem as jest.Mock).mockResolvedValue(problem);
      (apiService.updateSubmission as jest.Mock).mockResolvedValue(undefined);
      (executionService.runCode as jest.Mock)
        .mockResolvedValueOnce({
          stdout: '1\n',
          stderr: '',
          executionTime: 50,
          memory: 8192 * 1024,
          isTimeLimitExceeded: false,
          exitCode: 0,
        })
        .mockResolvedValueOnce({
          stdout: '2\n',
          stderr: '',
          executionTime: 50,
          memory: 16384 * 1024,
          isTimeLimitExceeded: false,
          exitCode: 0,
        });

      await processor.process(job);

      const finalUpdate = (apiService.updateSubmission as jest.Mock).mock
        .calls[1][1];
      expect(finalUpdate.memory).toBe(16384);
    });

    it('should generate test logs for all executed tests', async () => {
      const job = createMockJob({
        problemId: 'prob-1',
        code: 'print(input())',
        language: 'python',
      });

      const problem = {
        timeLimit: 1000,
        memoryLimit: 262144,
        testCases: [
          { id: 'test-1', input: '1', output: '1' },
          { id: 'test-2', input: '2', output: '2' },
        ],
      };

      (apiService.getProblem as jest.Mock).mockResolvedValue(problem);
      (apiService.updateSubmission as jest.Mock).mockResolvedValue(undefined);
      (executionService.runCode as jest.Mock)
        .mockResolvedValueOnce({
          stdout: '1\n',
          stderr: '',
          executionTime: 50,
          memory: 8192 * 1024,
          isTimeLimitExceeded: false,
          exitCode: 0,
        })
        .mockResolvedValueOnce({
          stdout: '2\n',
          stderr: '',
          executionTime: 60,
          memory: 8500 * 1024,
          isTimeLimitExceeded: false,
          exitCode: 0,
        });

      await processor.process(job);

      const finalUpdate = (apiService.updateSubmission as jest.Mock).mock
        .calls[1][1];
      expect(finalUpdate.testLogs).toHaveLength(2);
      expect(finalUpdate.testLogs[0]).toMatchObject({
        testCaseId: 'test-1',
        status: 'ACCEPTED',
        executionTime: 50,
      });
      expect(finalUpdate.testLogs[1]).toMatchObject({
        testCaseId: 'test-2',
        status: 'ACCEPTED',
        executionTime: 60,
      });
    });

    it('should include stderr in test logs when present', async () => {
      const job = createMockJob({
        problemId: 'prob-1',
        code: 'import sys; print(1); print("warning", file=sys.stderr)',
        language: 'python',
      });

      const problem = {
        timeLimit: 1000,
        memoryLimit: 262144,
        testCases: [{ id: 'test-1', input: '', output: '1' }],
      };

      (apiService.getProblem as jest.Mock).mockResolvedValue(problem);
      (apiService.updateSubmission as jest.Mock).mockResolvedValue(undefined);
      (executionService.runCode as jest.Mock).mockResolvedValue({
        stdout: '1\n',
        stderr: 'warning\n',
        executionTime: 50,
        memory: 8192 * 1024,
        isTimeLimitExceeded: false,
        exitCode: 0,
      });

      await processor.process(job);

      const finalUpdate = (apiService.updateSubmission as jest.Mock).mock
        .calls[1][1];
      expect(finalUpdate.testLogs[0].stderr).toBe('warning\n');
    });

    it('should handle API failures during execution', async () => {
      const job = createMockJob({
        problemId: 'prob-1',
        code: 'print(input())',
        language: 'python',
      });

      (apiService.getProblem as jest.Mock).mockRejectedValue(
        new Error('API unavailable'),
      );
      (apiService.updateSubmission as jest.Mock).mockResolvedValue(undefined);

      await expect(processor.process(job)).rejects.toThrow('API unavailable');

      expect(apiService.updateSubmission).toHaveBeenCalledWith('sub-1', {
        status: 'FAILED',
      });
    });

    it('should handle execution service failures', async () => {
      const job = createMockJob({
        problemId: 'prob-1',
        code: 'print(input())',
        language: 'python',
      });

      const problem = {
        timeLimit: 1000,
        memoryLimit: 262144,
        testCases: [{ id: 'test-1', input: '1', output: '1' }],
      };

      (apiService.getProblem as jest.Mock).mockResolvedValue(problem);
      (apiService.updateSubmission as jest.Mock).mockResolvedValue(undefined);
      (executionService.runCode as jest.Mock).mockRejectedValue(
        new Error('Docker unavailable'),
      );

      await expect(processor.process(job)).rejects.toThrow(
        'Docker unavailable',
      );
    });

    it('should pass correct parameters to execution service', async () => {
      const job = createMockJob({
        problemId: 'prob-1',
        code: 'x = input(); print(x)',
        language: 'python',
      });

      const problem = {
        timeLimit: 2000,
        memoryLimit: 262144,
        testCases: [{ id: 'test-1', input: '42', output: '42' }],
      };

      (apiService.getProblem as jest.Mock).mockResolvedValue(problem);
      (apiService.updateSubmission as jest.Mock).mockResolvedValue(undefined);
      (executionService.runCode as jest.Mock).mockResolvedValue({
        stdout: '42\n',
        stderr: '',
        executionTime: 50,
        memory: 8192 * 1024,
        isTimeLimitExceeded: false,
        exitCode: 0,
      });

      await processor.process(job);

      expect(executionService.runCode).toHaveBeenCalledWith(
        'x = input(); print(x)',
        'python',
        '42',
        2000,
      );
    });

    it('should handle empty test cases list', async () => {
      const job = createMockJob({
        problemId: 'prob-1',
        code: 'print("test")',
        language: 'python',
      });

      const problem = {
        timeLimit: 1000,
        memoryLimit: 262144,
        testCases: [],
      };

      (apiService.getProblem as jest.Mock).mockResolvedValue(problem);
      (apiService.updateSubmission as jest.Mock).mockResolvedValue(undefined);

      await processor.process(job);

      expect(executionService.runCode).not.toHaveBeenCalled();
      const finalUpdate = (apiService.updateSubmission as jest.Mock).mock
        .calls[1][1];
      expect(finalUpdate.verdict).toBe('ACCEPTED');
      expect(finalUpdate.testCasesPassed).toBe(0);
    });

    it('should convert memory from bytes to KB in final update', async () => {
      const job = createMockJob({
        problemId: 'prob-1',
        code: 'print("test")',
        language: 'python',
      });

      const problem = {
        timeLimit: 1000,
        memoryLimit: 262144,
        testCases: [{ id: 'test-1', input: '', output: 'test' }],
      };

      (apiService.getProblem as jest.Mock).mockResolvedValue(problem);
      (apiService.updateSubmission as jest.Mock).mockResolvedValue(undefined);
      (executionService.runCode as jest.Mock).mockResolvedValue({
        stdout: 'test\n',
        stderr: '',
        executionTime: 50,
        memory: 10240,
        isTimeLimitExceeded: false,
        exitCode: 0,
      });

      await processor.process(job);

      const finalUpdate = (apiService.updateSubmission as jest.Mock).mock
        .calls[1][1];
      expect(finalUpdate.memory).toBe(10);
    });
  });
});

function createMockJob(data: any): Job {
  return {
    id: 'sub-1',
    data,
  } as Job;
}
