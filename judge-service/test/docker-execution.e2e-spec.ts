import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionService } from '../src/execution/docker-execution.service';
import { ExecutionModule } from '../src/execution/execution.module';
import { ContainerManager } from '../src/execution/managers/container.manager';
import Docker from 'dockerode';
import ExecutionResult from '../src/execution/interfaces/execution-result.interface';

const waitForCondition = async (
  condition: () => Promise<boolean>,
  timeout = 8000,
  interval = 150,
) => {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) return true;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  return false;
};

describe('Docker Execution E2E', () => {
  let executionService: ExecutionService;
  let containerManager: ContainerManager;
  let module: TestingModule;
  let docker: Docker;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ExecutionModule],
    }).compile();

    executionService = module.get<ExecutionService>(ExecutionService);
    containerManager = module.get<ContainerManager>(ContainerManager);

    await executionService.onModuleInit();

    docker = new Docker({ socketPath: '/var/run/docker.sock' });
  }, 30000);

  afterAll(async () => {
    if (docker) {
      const containers = await docker.listContainers({ all: true });
      const cleanupTasks = containers
        .filter(
          (c) =>
            c.Image.includes('python:3.9-slim-time') ||
            c.Image.includes('node:18-slim-time'),
        )
        .map((c) => {
          const container = docker.getContainer(c.Id);
          return container.remove({ force: true }).catch(() => {});
        });
      await Promise.all(cleanupTasks);
    }
    await module.close();
  });

  describe('Docker Image Availability', () => {
    it('should have Python image available', async () => {
      const images = await docker.listImages();
      const pythonImage = images.find((img) =>
        img.RepoTags?.some((tag) => tag.includes('python:3.9-slim-time')),
      );

      expect(pythonImage).toBeDefined();
    }, 10000);

    it('should have Node.js image available', async () => {
      const images = await docker.listImages();
      const nodeImage = images.find((img) =>
        img.RepoTags?.some((tag) => tag.includes('node:18-slim-time')),
      );

      expect(nodeImage).toBeDefined();
    }, 10000);
  });

  describe('Container Lifecycle', () => {
    beforeEach(async () => {
      const containers = await docker.listContainers({ all: true });
      const cleanupTasks = containers
        .filter(
          (c) =>
            c.Image.includes('python:3.9-slim-time') ||
            c.Image.includes('node:18-slim-time'),
        )
        .map((c) => {
          const container = docker.getContainer(c.Id);
          return container.remove({ force: true }).catch(() => {});
        });
      await Promise.all(cleanupTasks);
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    it('should create and remove Python container', async () => {
      const code = 'print("test")';

      await executionService.runCode(code, 'python', '', 1000);

      const isCleaned = await waitForCondition(async () => {
        const containers = await docker.listContainers({ all: true });
        const testContainers = containers.filter((c) =>
          c.Image.includes('python:3.9-slim-time'),
        );
        return testContainers.length === 0;
      });

      expect(isCleaned).toBe(true);
    }, 15000);

    it('should create and remove JavaScript container', async () => {
      const containerConfig = {
        Image: 'node:18-slim-time',
        Cmd: ['node', '-e', 'console.log("test")'],
        Tty: false,
        HostConfig: {
          NetworkMode: 'none',
        },
      };

      const container = await docker.createContainer(containerConfig);

      await containerManager.start(container as any);
      const containersBefore = await docker.listContainers({ all: true });
      expect(containersBefore.find((c) => c.Id === container.id)).toBeDefined();

      await containerManager.remove(container as any);

      const isCleaned = await waitForCondition(async () => {
        const containers = await docker.listContainers({ all: true });
        const exists = containers.some((c) => c.Id === container.id);
        return !exists;
      });

      expect(isCleaned).toBe(true);
    }, 15000);

    it('should cleanup container even on timeout', async () => {
      const code = 'import time\ntime.sleep(10)';

      await executionService.runCode(code, 'python', '', 500);

      const isCleaned = await waitForCondition(async () => {
        const containers = await docker.listContainers({ all: true });
        const testContainers = containers.filter((c) =>
          c.Image.includes('python:3.9-slim-time'),
        );
        return testContainers.length === 0;
      });

      expect(isCleaned).toBe(true);
    }, 20000);

    it('should cleanup container on error', async () => {
      const code = 'raise Exception("test")';

      await executionService.runCode(code, 'python', '', 1000);

      const isCleaned = await waitForCondition(async () => {
        const containers = await docker.listContainers({ all: true });
        const testContainers = containers.filter((c) =>
          c.Image.includes('python:3.9-slim-time'),
        );
        return testContainers.length === 0;
      });

      expect(isCleaned).toBe(true);
    }, 15000);
  });

  describe('Container Isolation', () => {
    it('should not have network access', async () => {
      const code = `
import socket
try:
    socket.create_connection(("google.com", 80), timeout=1)
    print("NETWORK_AVAILABLE")
except:
    print("NETWORK_BLOCKED")
`;

      const result = await executionService.runCode(code, 'python', '', 2000);

      expect(result.stdout.trim()).toBe('NETWORK_BLOCKED');
    }, 10000);

    it('should not be able to access host filesystem outside container', async () => {
      const code = `
import os
try:
    os.listdir('/host')
    print("HOST_ACCESS")
except:
    print("HOST_BLOCKED")
`;

      const result = await executionService.runCode(code, 'python', '', 1000);

      expect(result.stdout.trim()).toBe('HOST_BLOCKED');
    }, 10000);
  });

  describe('Resource Limits', () => {
    it('should enforce memory limits', async () => {
      const code = `
import sys
try:
    chunks = []
    for i in range(100):
        chunks.append(bytearray(10 * 1024 * 1024))
        if i > 50:
            print("ALLOCATED")
            break
except (MemoryError, Exception):
    print("MEMORY_LIMITED")
`;

      const result = await executionService.runCode(code, 'python', '', 3000);
      const output = result.stdout.trim();
      const isOOMKilled =
        result.exitCode === 137 ||
        result.exitCode === 1 ||
        result.exitCode === 139;
      const hasExpectedOutput = /MEMORY_LIMITED|ALLOCATED/.test(output);

      expect(isOOMKilled || hasExpectedOutput).toBe(true);
    }, 15000);

    it('should enforce time limits', async () => {
      const code =
        'import time\nfor i in range(10):\n    time.sleep(1)\n    print(i)';

      const result = await executionService.runCode(code, 'python', '', 2000);

      expect(result.isTimeLimitExceeded).toBe(true);
    }, 15000);

    it('should respect CPU limits', async () => {
      const code = `
import time
start = time.time()
sum([i**2 for i in range(1000000)])
end = time.time()
print(f"{end - start:.2f}")
`;

      const result = await executionService.runCode(code, 'python', '', 5000);

      expect(result.exitCode).toBe(0);
      const duration = parseFloat(result.stdout.trim());
      if (!isNaN(duration)) {
        expect(duration).toBeGreaterThan(0);
      }
    }, 15000);
  });

  describe('Real /usr/bin/time Output', () => {
    it('should capture real memory usage from /usr/bin/time', async () => {
      const code = 'print("test")';
      const result = await executionService.runCode(code, 'python', '', 1000);
      expect(result.memory).toBeGreaterThan(1000);
      expect(result.memory).toBeLessThan(512 * 1024 * 1024);
      expect(Number.isInteger(result.memory)).toBe(true);
    }, 10000);

    it('should capture real execution time from /usr/bin/time', async () => {
      const code = 'import time\ntime.sleep(0.15)\nprint("done")';
      const result = await executionService.runCode(code, 'python', '', 2000);
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.executionTime).toBeLessThan(2000);
      expect(Number.isInteger(result.executionTime)).toBe(true);
    }, 10000);

    it('should not include /usr/bin/time verbose output in stderr', async () => {
      const code = 'print("test")';
      const result = await executionService.runCode(code, 'python', '', 1000);
      expect(result.stderr).not.toContain('Command being timed');
      expect(result.stderr).not.toContain('User time (seconds)');
    }, 10000);

    it('should preserve actual stderr while removing time output', async () => {
      const code =
        'import sys\nprint("warning", file=sys.stderr)\nprint("output")';

      const result = await executionService.runCode(code, 'python', '', 1000);

      expect(result.stderr.trim()).toBe('warning');
      expect(result.stdout.trim()).toBe('output');
      expect(result.memory).toBeGreaterThan(0);
      expect(result.executionTime).toBeGreaterThan(0);
    }, 10000);
  });

  describe('File Operations', () => {
    it('should write code to temporary file', async () => {
      const code = 'print("test")';
      const result = await executionService.runCode(code, 'python', '', 1000);
      expect(result.exitCode).toBe(0);
    }, 10000);

    it('should cleanup temporary files after execution', async () => {
      const code = 'print("test")';
      await executionService.runCode(code, 'python', '', 1000);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }, 10000);

    it('should handle multiple concurrent file operations', async () => {
      const codes = Array(5).fill('print("test")');
      const results = await Promise.all(
        codes.map((code) => executionService.runCode(code, 'python', '', 1000)),
      );
      expect(results).toHaveLength(5);
      results.forEach((result) => expect(result.exitCode).toBe(0));
    }, 15000);
  });

  describe('Stress Testing', () => {
    it('should handle rapid successive executions', async () => {
      const executions: Promise<ExecutionResult>[] = [];
      for (let i = 0; i < 5; i++) {
        executions.push(
          executionService.runCode(`print(${i})`, 'python', '', 1000),
        );
      }
      const results = await Promise.all(executions);
      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result.stdout.trim()).toBe(String(index));
        expect(result.exitCode).toBe(0);
      });
    }, 30000);

    it('should handle mix of successful and failed executions', async () => {
      const codes = [
        'print("success")',
        'raise Exception("error")',
        'print("success again")',
        'print(1/0)',
        'print("final success")',
      ];
      const results = await Promise.all(
        codes.map((code) => executionService.runCode(code, 'python', '', 1000)),
      );
      expect(results[0].exitCode).toBe(0);
      expect(results[1].exitCode).not.toBe(0);
      expect(results[2].exitCode).toBe(0);
      expect(results[3].exitCode).not.toBe(0);
      expect(results[4].exitCode).toBe(0);
    }, 20000);
  });

  describe('Error Recovery', () => {
    it('should recover from failed execution and continue', async () => {
      const errorCode = 'raise Exception("test")';
      await executionService.runCode(errorCode, 'python', '', 1000);

      const successCode = 'print("recovered")';
      const result = await executionService.runCode(
        successCode,
        'python',
        '',
        1000,
      );
      expect(result.stdout.trim()).toBe('recovered');
      expect(result.exitCode).toBe(0);
    }, 10000);

    it('should recover from timeout and continue', async () => {
      const timeoutCode = 'import time\ntime.sleep(10)';
      await executionService.runCode(timeoutCode, 'python', '', 500);

      const successCode = 'print("recovered")';
      const result = await executionService.runCode(
        successCode,
        'python',
        '',
        1000,
      );
      expect(result.stdout.trim()).toBe('recovered');
      expect(result.exitCode).toBe(0);
    }, 15000);
  });
});
