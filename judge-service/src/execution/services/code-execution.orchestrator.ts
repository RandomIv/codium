import { Injectable } from '@nestjs/common';
import Docker from 'dockerode';
import {
  IContainer,
  IDockerClient,
} from '../abstractions/docker-client.interface';
import { ContainerManager } from '../managers/container.manager';
import { ExecutionTimer } from '../utils/execution-timer';
import { ResultCollectorService } from './result-collector.service';
import ExecutionResult from '../interfaces/execution-result.interface';
@Injectable()
export class CodeExecutionOrchestrator {
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
        return this.resultCollector.createTimeoutResult(
          execution.executionTimeMs,
        );
      }

      const logsBuffer = await this.containerManager.readLogs(container);
      const exitCode = await this.containerManager.getExitCode(container);

      return this.resultCollector.createSuccessResult(
        logsBuffer,
        exitCode,
        execution.executionTimeMs,
      );
    } finally {
      if (container) {
        await this.containerManager.remove(container);
      }
    }
  }
}
