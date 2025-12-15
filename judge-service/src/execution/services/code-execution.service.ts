import { Injectable, Logger } from '@nestjs/common';
import Docker from 'dockerode';
import { Container, DockerClient } from '../interfaces/docker-client.interface';
import { ContainerManager } from '../managers/container.manager';
import { ExecutionTimer } from '../utils/execution-timer';
import { ResultCollectorService } from './result-collector.service';
import ExecutionResult from '../interfaces/execution-result.interface';

const STDIN_FLUSH_DELAY_MS = 50;
const CONTAINER_KILL_SETTLE_DELAY_MS = 100;

@Injectable()
export class CodeExecutionService {
  private readonly logger = new Logger(CodeExecutionService.name);

  constructor(
    private readonly containerManager: ContainerManager,
    private readonly resultCollector: ResultCollectorService,
  ) {}

  async execute(
    dockerClient: DockerClient,
    containerConfig: Docker.ContainerCreateOptions,
    input: string,
    timeLimitMs: number,
  ): Promise<ExecutionResult> {
    let container: Container | null = null;

    try {
      container = await dockerClient.createContainer(containerConfig);
      await this.containerManager.start(container);

      await this.provideInput(container, input);

      const execution = await ExecutionTimer.executeWithTimeout(
        this.containerManager.wait(container),
        timeLimitMs,
      );

      if (execution.timedOut) {
        return await this.handleTimeout(container, execution.executionTimeMs);
      }

      return await this.collectResults(container);
    } catch (error) {
      this.logger.error(`Execution failed: ${error.message}`);
      throw error;
    } finally {
      await this.cleanupContainer(container);
    }
  }

  private async provideInput(
    container: Container,
    input: string,
  ): Promise<void> {
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

    await new Promise((resolve) => setTimeout(resolve, STDIN_FLUSH_DELAY_MS));
  }

  private async handleTimeout(
    container: Container,
    executionTimeMs: number,
  ): Promise<ExecutionResult> {
    await this.containerManager.kill(container);
    await new Promise((resolve) =>
      setTimeout(resolve, CONTAINER_KILL_SETTLE_DELAY_MS),
    );

    return this.resultCollector.createTimeoutResult(executionTimeMs, 0);
  }

  private async collectResults(container: Container): Promise<ExecutionResult> {
    const logsBuffer = await this.containerManager.readLogs(container);
    const exitCode = await this.containerManager.getExitCode(container);

    return this.resultCollector.createSuccessResult(logsBuffer, exitCode, 0, 0);
  }

  private async cleanupContainer(container: Container | null): Promise<void> {
    if (!container) {
      return;
    }

    try {
      await this.containerManager.remove(container);
    } catch (error) {
      this.logger.warn(`Failed to remove container: ${error.message}`);
    }
  }
}
