import { Test, TestingModule } from '@nestjs/testing';
import { ContainerManager } from './container.manager';
import { IContainer } from '../interfaces/docker-client.interface';

describe('ContainerManager', () => {
  let manager: ContainerManager;
  let mockContainer: jest.Mocked<IContainer>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContainerManager],
    }).compile();

    manager = module.get<ContainerManager>(ContainerManager);

    mockContainer = {
      start: jest.fn(),
      wait: jest.fn(),
      kill: jest.fn(),
      remove: jest.fn(),
      attach: jest.fn(),
      logs: jest.fn(),
      inspect: jest.fn(),
    } as jest.Mocked<IContainer>;
  });

  describe('start', () => {
    it('should call container.start()', async () => {
      mockContainer.start.mockResolvedValue();

      await manager.start(mockContainer);

      expect(mockContainer.start).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors', async () => {
      mockContainer.start.mockRejectedValue(new Error('Start failed'));

      await expect(manager.start(mockContainer)).rejects.toThrow(
        'Start failed',
      );
    });
  });

  describe('kill', () => {
    it('should call container.kill()', async () => {
      mockContainer.kill.mockResolvedValue();

      await manager.kill(mockContainer);

      expect(mockContainer.kill).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      mockContainer.kill.mockRejectedValue(new Error('Kill failed'));

      await expect(manager.kill(mockContainer)).resolves.not.toThrow();
    });

    it('should not propagate errors', async () => {
      mockContainer.kill.mockRejectedValue(new Error('Container not running'));

      await manager.kill(mockContainer);

      expect(mockContainer.kill).toHaveBeenCalled();
    });
  });

  describe('wait', () => {
    it('should call container.wait()', async () => {
      mockContainer.wait.mockResolvedValue(undefined);

      await manager.wait(mockContainer);

      expect(mockContainer.wait).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors', async () => {
      mockContainer.wait.mockRejectedValue(new Error('Wait failed'));

      await expect(manager.wait(mockContainer)).rejects.toThrow('Wait failed');
    });

    it('should wait for container completion', async () => {
      let completed = false;
      mockContainer.wait.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        completed = true;
      });

      await manager.wait(mockContainer);

      expect(completed).toBe(true);
    });
  });

  describe('remove', () => {
    it('should call container.remove with force option', async () => {
      mockContainer.remove.mockResolvedValue();

      await manager.remove(mockContainer);

      expect(mockContainer.remove).toHaveBeenCalledWith({ force: true });
    });

    it('should handle errors gracefully', async () => {
      mockContainer.remove.mockRejectedValue(new Error('Remove failed'));

      await expect(manager.remove(mockContainer)).resolves.not.toThrow();
    });

    it('should not propagate errors', async () => {
      mockContainer.remove.mockRejectedValue(new Error('Container not found'));

      await manager.remove(mockContainer);

      expect(mockContainer.remove).toHaveBeenCalled();
    });

    it('should always use force option', async () => {
      mockContainer.remove.mockResolvedValue();

      await manager.remove(mockContainer);

      const call = mockContainer.remove.mock.calls[0][0];
      expect(call?.force).toBe(true);
    });
  });

  describe('readLogs', () => {
    it('should read logs with stdout and stderr enabled', async () => {
      const logBuffer = Buffer.from('test logs');
      mockContainer.logs.mockResolvedValue(logBuffer);

      await manager.readLogs(mockContainer);

      expect(mockContainer.logs).toHaveBeenCalledWith({
        stdout: true,
        stderr: true,
      });
    });

    it('should return logs as buffer', async () => {
      const logBuffer = Buffer.from('test output');
      mockContainer.logs.mockResolvedValue(logBuffer);

      const result = await manager.readLogs(mockContainer);

      expect(result).toBe(logBuffer);
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should truncate logs larger than 1MB', async () => {
      const largeBuffer = Buffer.alloc(2 * 1024 * 1024);
      mockContainer.logs.mockResolvedValue(largeBuffer);

      const result = await manager.readLogs(mockContainer);

      expect(result.length).toBe(1024 * 1024);
    });

    it('should not truncate logs smaller than 1MB', async () => {
      const smallBuffer = Buffer.alloc(500 * 1024);
      mockContainer.logs.mockResolvedValue(smallBuffer);

      const result = await manager.readLogs(mockContainer);

      expect(result.length).toBe(500 * 1024);
    });

    it('should handle empty logs', async () => {
      const emptyBuffer = Buffer.alloc(0);
      mockContainer.logs.mockResolvedValue(emptyBuffer);

      const result = await manager.readLogs(mockContainer);

      expect(result.length).toBe(0);
    });

    it('should handle logs exactly 1MB', async () => {
      const exactBuffer = Buffer.alloc(1024 * 1024);
      mockContainer.logs.mockResolvedValue(exactBuffer);

      const result = await manager.readLogs(mockContainer);

      expect(result.length).toBe(1024 * 1024);
    });

    it('should truncate from start of buffer', async () => {
      const largeBuffer = Buffer.alloc(2 * 1024 * 1024);
      largeBuffer.write('START', 0);
      largeBuffer.write('END', largeBuffer.length - 3);
      mockContainer.logs.mockResolvedValue(largeBuffer);

      const result = await manager.readLogs(mockContainer);

      expect(result.toString('utf-8', 0, 5)).toBe('START');
      expect(result.length).toBe(1024 * 1024);
    });
  });

  describe('getExitCode', () => {
    it('should return exit code from container inspect', async () => {
      mockContainer.inspect.mockResolvedValue({
        State: { ExitCode: 0 },
      } as any);

      const exitCode = await manager.getExitCode(mockContainer);

      expect(exitCode).toBe(0);
    });

    it('should return non-zero exit code', async () => {
      mockContainer.inspect.mockResolvedValue({
        State: { ExitCode: 1 },
      } as any);

      const exitCode = await manager.getExitCode(mockContainer);

      expect(exitCode).toBe(1);
    });

    it('should handle different exit codes', async () => {
      const testCases = [0, 1, 2, 127, 255];

      for (const expected of testCases) {
        mockContainer.inspect.mockResolvedValue({
          State: { ExitCode: expected },
        } as any);

        const exitCode = await manager.getExitCode(mockContainer);
        expect(exitCode).toBe(expected);
      }
    });

    it('should call container.inspect()', async () => {
      mockContainer.inspect.mockResolvedValue({
        State: { ExitCode: 0 },
      } as any);

      await manager.getExitCode(mockContainer);

      expect(mockContainer.inspect).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors', async () => {
      mockContainer.inspect.mockRejectedValue(new Error('Inspect failed'));

      await expect(manager.getExitCode(mockContainer)).rejects.toThrow(
        'Inspect failed',
      );
    });
  });
});
