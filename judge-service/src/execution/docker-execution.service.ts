import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import Docker from 'dockerode';
import * as path from 'path';
import * as os from 'os';
import ExecutionResult from './interfaces/execution-result.interface';
import getLanguageConfig from './config/language.config';
import { ContainerConfigBuilder } from './config/container.config';
import { FileManager } from './managers/file.manager';
import { CodeExecutionService } from './services/code-execution.service';
import { DockerClientAdapter } from './adapters/docker-client.adapter';
import { ResultCollectorService } from './services/result-collector.service';

@Injectable()
export class ExecutionService implements OnModuleInit {
  private dockerClient: DockerClientAdapter;
  private readonly logger = new Logger(ExecutionService.name);
  private readonly hostTempDir = path.join(os.tmpdir(), 'codium-submissions');

  constructor(
    private readonly fileManager: FileManager,
    private readonly orchestrator: CodeExecutionService,
    private readonly resultCollector: ResultCollectorService,
  ) {}

  async onModuleInit() {
    const docker = new Docker({ socketPath: '/var/run/docker.sock' });
    this.dockerClient = new DockerClientAdapter(docker);
    await this.fileManager.ensureDirectory(this.hostTempDir);
    this.logger.log(
      `Execution Service initialized. Temp dir: ${this.hostTempDir}`,
    );
  }

  async runCode(
    code: string,
    language: string,
    input: string,
    timeLimitMs: number,
  ): Promise<ExecutionResult> {
    let filepath: string | null = null;

    try {
      const langConfig = getLanguageConfig(language);
      const { filename, filepath: fp } = await this.fileManager.writeCodeFile(
        this.hostTempDir,
        code,
        langConfig.extension,
      );
      filepath = fp;

      const containerConfig = ContainerConfigBuilder.build({
        image: langConfig.image,
        command: langConfig.command(filename),
        workDir: '/app',
        tempDir: this.hostTempDir,
      });

      const result = await this.orchestrator.execute(
        this.dockerClient,
        containerConfig,
        input,
        timeLimitMs,
      );

      return result;
    } catch (error) {
      this.logger.error(`Execution failed: ${error.message}`);
      return this.resultCollector.createErrorResult(error.message);
    } finally {
      if (filepath) {
        await this.fileManager.cleanup(filepath);
      }
    }
  }
}
