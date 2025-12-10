import { Injectable } from '@nestjs/common';
import Docker from 'dockerode';
import {
  IContainer,
  IDockerClient,
} from '../interfaces/docker-client.interface';
import { ContainerManager } from '../managers/container.manager';
import { ExecutionTimer } from '../utils/execution-timer';
import { ResultCollectorService } from './result-collector.service';
import ExecutionResult from '../interfaces/execution-result.interface';
@Injectable()
export class CodeExecutionService {
  constructor(
    private readonly containerManager: ContainerManager,
    private readonly resultCollector: ResultCollectorService,
  ) {}
  async execute(
    dockerClient: IDockerClient,
    containerConfig: Docker.ContainerCreateOptions,
    input: string,
    timeLimitMs: number,
  ): Promise<ExecutionResult> {
    let container: IContainer | null = null;

    try {
      container = await dockerClient.createContainer(containerConfig);

      await this.containerManager.start(container);

      const stream = await container.attach({
        stream: true,
        stdin: true,
        stdout: false,
        stderr: false,
      });

      if (input) {
        stream.write(input);
      }
      stream.end();

      await new Promise((resolve) => setTimeout(resolve, 50));

      const execution = await ExecutionTimer.executeWithTimeout(
        this.containerManager.wait(container),
        timeLimitMs,
      );

      if (execution.timedOut) {
        await this.containerManager.kill(container);
        await new Promise((resolve) => setTimeout(resolve, 100));
        return this.resultCollector.createTimeoutResult(
          execution.executionTimeMs,
          0,
        );
      }

      const logsBuffer = await this.containerManager.readLogs(container);
      const exitCode = await this.containerManager.getExitCode(container);

      return this.resultCollector.createSuccessResult(
        logsBuffer,
        exitCode,
        0,
        0,
      );
    } catch (error) {
      throw error;
    } finally {
      if (container) {
        try {
          await this.containerManager.remove(container);
        } catch (error) {
          console.warn(
            `Failed to remove container in finally: ${error.message}`,
          );
        }
      }
    }
  }
}
