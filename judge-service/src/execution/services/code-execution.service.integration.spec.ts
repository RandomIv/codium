import { Test, TestingModule } from '@nestjs/testing';
import { CodeExecutionService } from './code-execution.service';
import { ContainerManager } from '../managers/container.manager';
import { ResultCollectorService } from './result-collector.service';
import { Container, DockerClient } from '../interfaces/docker-client.interface';
import Docker from 'dockerode';

describe('CodeExecutionService Integration', () => {
  let service: CodeExecutionService;
  let containerManager: ContainerManager;
  let resultCollector: ResultCollectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CodeExecutionService,
        ContainerManager,
        ResultCollectorService,
      ],
    }).compile();

    service = module.get<CodeExecutionService>(CodeExecutionService);
    containerManager = module.get<ContainerManager>(ContainerManager);
    resultCollector = module.get<ResultCollectorService>(
      ResultCollectorService,
    );
  });

  describe('execute integration', () => {
    let mockDockerClient: jest.Mocked<DockerClient>;
    let mockContainer: jest.Mocked<Container>;
    let mockStream: any;

    beforeEach(() => {
      mockStream = {
        write: jest.fn(),
        end: jest.fn(),
      };

      mockContainer = {
        start: jest.fn().mockResolvedValue(undefined),
        wait: jest.fn().mockResolvedValue(undefined),
        kill: jest.fn().mockResolvedValue(undefined),
        remove: jest.fn().mockResolvedValue(undefined),
        attach: jest.fn().mockResolvedValue(mockStream),
        logs: jest.fn().mockResolvedValue(Buffer.from('')),
        inspect: jest.fn().mockResolvedValue({
          State: { ExitCode: 0 },
        } as any),
      } as jest.Mocked<Container>;

      mockDockerClient = {
        createContainer: jest.fn().mockResolvedValue(mockContainer),
      } as jest.Mocked<DockerClient>;
    });

    it('should execute complete container lifecycle', async () => {
      const containerConfig: Docker.ContainerCreateOptions = {
        Image: 'python:3.9-slim-time',
        Cmd: ['/usr/bin/time', '-v', 'python3', 'test.py'],
      };

      const logsBuffer = createDockerLogBuffer('output\n', '');
      mockContainer.logs.mockResolvedValue(logsBuffer);

      const result = await service.execute(
        mockDockerClient,
        containerConfig,
        '',
        1000,
      );

      expect(mockDockerClient.createContainer).toHaveBeenCalledWith(
        containerConfig,
      );
      expect(mockContainer.start).toHaveBeenCalled();
      expect(mockContainer.wait).toHaveBeenCalled();
      expect(mockContainer.logs).toHaveBeenCalled();
      expect(mockContainer.remove).toHaveBeenCalled();
      expect(result.stdout).toBe('output\n');
    });

    it('should write input to container stdin', async () => {
      const input = '42\n';
      const containerConfig: Docker.ContainerCreateOptions = {
        Image: 'python:3.9-slim-time',
        Cmd: ['/usr/bin/time', '-v', 'python3', 'test.py'],
      };

      mockContainer.logs.mockResolvedValue(createDockerLogBuffer('42\n', ''));

      await service.execute(mockDockerClient, containerConfig, input, 1000);

      expect(mockStream.write).toHaveBeenCalledWith(input);
      expect(mockStream.end).toHaveBeenCalled();
    });

    it('should not write to stdin if input is empty', async () => {
      const containerConfig: Docker.ContainerCreateOptions = {
        Image: 'python:3.9-slim-time',
        Cmd: ['/usr/bin/time', '-v', 'python3', 'test.py'],
      };

      mockContainer.logs.mockResolvedValue(createDockerLogBuffer('output', ''));

      await service.execute(mockDockerClient, containerConfig, '', 1000);

      expect(mockStream.write).not.toHaveBeenCalled();
      expect(mockStream.end).toHaveBeenCalled();
    });

    it('should handle timeout and kill container', async () => {
      const containerConfig: Docker.ContainerCreateOptions = {
        Image: 'python:3.9-slim-time',
        Cmd: ['/usr/bin/time', '-v', 'python3', 'test.py'],
      };

      let rejectWait: () => void;
      mockContainer.wait.mockImplementation(
        () =>
          new Promise((_, reject) => {
            rejectWait = reject;
          }),
      );

      const result = await service.execute(
        mockDockerClient,
        containerConfig,
        '',
        100,
      );

      expect(mockContainer.kill).toHaveBeenCalled();
      expect(result.isTimeLimitExceeded).toBe(true);
    });

    it('should clean up container on timeout', async () => {
      const containerConfig: Docker.ContainerCreateOptions = {
        Image: 'python:3.9-slim-time',
        Cmd: ['/usr/bin/time', '-v', 'python3', 'test.py'],
      };

      mockContainer.wait.mockImplementation(() => new Promise(() => {}));

      await service.execute(mockDockerClient, containerConfig, '', 100);

      expect(mockContainer.remove).toHaveBeenCalled();
    });

    it('should parse logs and extract resource usage', async () => {
      const containerConfig: Docker.ContainerCreateOptions = {
        Image: 'python:3.9-slim-time',
        Cmd: ['/usr/bin/time', '-v', 'python3', 'test.py'],
      };

      const logsBuffer = createDockerLogBuffer(
        'output\n',
        '\tCommand being timed: "python3 test.py"\n' +
          '\tUser time (seconds): 0.10\n' +
          '\tSystem time (seconds): 0.05\n' +
          '\tMaximum resident set size (kbytes): 8192\n',
      );
      mockContainer.logs.mockResolvedValue(logsBuffer);

      const result = await service.execute(
        mockDockerClient,
        containerConfig,
        '',
        1000,
      );

      expect(result.executionTime).toBe(150);
      expect(result.memory).toBe(8192 * 1024);
    });

    it('should handle container creation errors', async () => {
      const containerConfig: Docker.ContainerCreateOptions = {
        Image: 'invalid-image',
        Cmd: ['test'],
      };

      mockDockerClient.createContainer.mockRejectedValue(
        new Error('Image not found'),
      );

      await expect(
        service.execute(mockDockerClient, containerConfig, '', 1000),
      ).rejects.toThrow('Image not found');
    });

    it('should clean up container on error', async () => {
      const containerConfig: Docker.ContainerCreateOptions = {
        Image: 'python:3.9-slim-time',
        Cmd: ['/usr/bin/time', '-v', 'python3', 'test.py'],
      };

      mockContainer.start.mockRejectedValue(new Error('Start failed'));

      await expect(
        service.execute(mockDockerClient, containerConfig, '', 1000),
      ).rejects.toThrow('Start failed');

      expect(mockContainer.remove).toHaveBeenCalled();
    });

    it('should read logs after container completion', async () => {
      const containerConfig: Docker.ContainerCreateOptions = {
        Image: 'python:3.9-slim-time',
        Cmd: ['/usr/bin/time', '-v', 'python3', 'test.py'],
      };

      const logsBuffer = createDockerLogBuffer('result\n', '');
      mockContainer.logs.mockResolvedValue(logsBuffer);

      const result = await service.execute(
        mockDockerClient,
        containerConfig,
        '',
        1000,
      );

      expect(mockContainer.logs).toHaveBeenCalledWith({
        stdout: true,
        stderr: true,
      });
      expect(result.stdout).toBe('result\n');
    });

    it('should get exit code from container inspection', async () => {
      const containerConfig: Docker.ContainerCreateOptions = {
        Image: 'python:3.9-slim-time',
        Cmd: ['/usr/bin/time', '-v', 'python3', 'test.py'],
      };

      mockContainer.inspect.mockResolvedValue({
        State: { ExitCode: 42 },
      } as any);
      mockContainer.logs.mockResolvedValue(createDockerLogBuffer('', ''));

      const result = await service.execute(
        mockDockerClient,
        containerConfig,
        '',
        1000,
      );

      expect(result.exitCode).toBe(42);
    });

    it('should handle runtime errors with non-zero exit code', async () => {
      const containerConfig: Docker.ContainerCreateOptions = {
        Image: 'python:3.9-slim-time',
        Cmd: ['/usr/bin/time', '-v', 'python3', 'test.py'],
      };

      mockContainer.inspect.mockResolvedValue({
        State: { ExitCode: 1 },
      } as any);
      mockContainer.logs.mockResolvedValue(
        createDockerLogBuffer('', 'ZeroDivisionError\n'),
      );

      const result = await service.execute(
        mockDockerClient,
        containerConfig,
        '',
        1000,
      );

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('ZeroDivisionError');
    });

    it('should wait for container before reading logs', async () => {
      const containerConfig: Docker.ContainerCreateOptions = {
        Image: 'python:3.9-slim-time',
        Cmd: ['/usr/bin/time', '-v', 'python3', 'test.py'],
      };

      let waitCalled = false;
      let logsCalled = false;

      mockContainer.wait.mockImplementation(async () => {
        waitCalled = true;
      });

      mockContainer.logs.mockImplementation(async () => {
        logsCalled = true;
        expect(waitCalled).toBe(true);
        return createDockerLogBuffer('', '');
      });

      await service.execute(mockDockerClient, containerConfig, '', 1000);

      expect(waitCalled).toBe(true);
      expect(logsCalled).toBe(true);
    });

    it('should start container before attaching', async () => {
      const containerConfig: Docker.ContainerCreateOptions = {
        Image: 'python:3.9-slim-time',
        Cmd: ['/usr/bin/time', '-v', 'python3', 'test.py'],
      };

      let startCalled = false;
      let attachCalled = false;

      mockContainer.start.mockImplementation(async () => {
        startCalled = true;
      });

      mockContainer.attach.mockImplementation(async () => {
        expect(startCalled).toBe(true);
        attachCalled = true;
        return mockStream;
      });

      mockContainer.logs.mockResolvedValue(createDockerLogBuffer('', ''));

      await service.execute(mockDockerClient, containerConfig, '', 1000);

      expect(startCalled).toBe(true);
      expect(attachCalled).toBe(true);
    });

    it('should handle multiple input lines', async () => {
      const containerConfig: Docker.ContainerCreateOptions = {
        Image: 'python:3.9-slim-time',
        Cmd: ['/usr/bin/time', '-v', 'python3', 'test.py'],
      };

      const input = 'line1\nline2\nline3\n';
      mockContainer.logs.mockResolvedValue(createDockerLogBuffer('', ''));

      await service.execute(mockDockerClient, containerConfig, input, 1000);

      expect(mockStream.write).toHaveBeenCalledWith(input);
    });

    it('should handle large output', async () => {
      const containerConfig: Docker.ContainerCreateOptions = {
        Image: 'python:3.9-slim-time',
        Cmd: ['/usr/bin/time', '-v', 'python3', 'test.py'],
      };

      const largeOutput = 'A'.repeat(10000);
      mockContainer.logs.mockResolvedValue(
        createDockerLogBuffer(largeOutput, ''),
      );

      const result = await service.execute(
        mockDockerClient,
        containerConfig,
        '',
        1000,
      );

      expect(result.stdout.length).toBe(10000);
    });

    it('should use result collector to create success result', async () => {
      const containerConfig: Docker.ContainerCreateOptions = {
        Image: 'python:3.9-slim-time',
        Cmd: ['/usr/bin/time', '-v', 'python3', 'test.py'],
      };

      const createSuccessSpy = jest.spyOn(
        resultCollector,
        'createSuccessResult',
      );
      mockContainer.logs.mockResolvedValue(createDockerLogBuffer('', ''));

      await service.execute(mockDockerClient, containerConfig, '', 1000);

      expect(createSuccessSpy).toHaveBeenCalled();
    });

    it('should use result collector to create timeout result', async () => {
      const containerConfig: Docker.ContainerCreateOptions = {
        Image: 'python:3.9-slim-time',
        Cmd: ['/usr/bin/time', '-v', 'python3', 'test.py'],
      };

      mockContainer.wait.mockImplementation(() => new Promise(() => {}));

      const createTimeoutSpy = jest.spyOn(
        resultCollector,
        'createTimeoutResult',
      );

      await service.execute(mockDockerClient, containerConfig, '', 100);

      expect(createTimeoutSpy).toHaveBeenCalled();
    });
  });
});

function createDockerLogBuffer(stdout: string, stderr: string): Buffer {
  const frames: Buffer[] = [];

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
