import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import Docker from 'dockerode';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  executionTime: number;
  isTimeLimitExceeded: boolean;
  exitCode: number | null;
}

@Injectable()
export class ExecutionService implements OnModuleInit {
  private docker: Docker;
  private readonly logger = new Logger(ExecutionService.name);
  private readonly hostTempDir = path.join(os.tmpdir(), 'codium-submissions');

  onModuleInit() {
    this.docker = new Docker({ socketPath: '/var/run/docker.sock' });
    fs.mkdir(this.hostTempDir, { recursive: true }).catch(() => {});
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
    const langKey = language.toLowerCase();
    const filename = `${uuidv4()}.${this.getExtension(langKey)}`;
    const hostFilePath = path.join(this.hostTempDir, filename);

    let container: Docker.Container | null = null;
    let isTimeLimitExceeded = false;
    let timer: NodeJS.Timeout | null = null;

    try {
      await fs.writeFile(hostFilePath, code);

      const image = this.getDockerImage(langKey);
      const cmd = this.getRunCommand(langKey, filename);

      container = await this.docker.createContainer({
        Image: image,
        Cmd: cmd,
        Tty: false,
        OpenStdin: true,
        StdinOnce: true,
        NetworkDisabled: true,
        HostConfig: {
          Memory: 256 * 1024 * 1024,
          NanoCpus: 500000000,
          Binds: [`${this.hostTempDir}:/app:ro`],
          AutoRemove: false,
        },
        WorkingDir: '/app',
      });

      const stream = await container.attach({
        stream: true,
        stdin: true,
        stdout: false,
        stderr: false,
      });

      const startTime = process.hrtime();
      await container.start();

      if (input) {
        stream.write(input);
      }
      stream.end();

      const timeoutPromise = new Promise<void>((_, reject) => {
        timer = setTimeout(() => {
          isTimeLimitExceeded = true;
          reject(new Error('TLE'));
        }, timeLimitMs);
      });

      try {
        await Promise.race([container.wait(), timeoutPromise]);
      } catch (e) {
        if (e.message === 'TLE') {
          try {
            await container.kill();
          } catch (e) {}
        } else {
          throw e;
        }
      } finally {
        if (timer) clearTimeout(timer);
      }

      const [seconds, nanoseconds] = process.hrtime(startTime);
      const executionTime = seconds * 1000 + nanoseconds / 1e6;

      let stdout = '';
      let stderr = '';
      let exitCode = -1;

      if (!isTimeLimitExceeded) {
        try {
          const logsBuffer = (await container.logs({
            stdout: true,
            stderr: true,
          })) as Buffer;

          const output = this.demuxLogs(logsBuffer);
          stdout = output.stdout;
          stderr = output.stderr;

          const data = await container.inspect();
          exitCode = data.State.ExitCode;
        } catch (e) {
          this.logger.error(`Error reading logs: ${e.message}`);
          exitCode = -1;
        }
      }

      return {
        stdout,
        stderr,
        executionTime,
        isTimeLimitExceeded,
        exitCode: isTimeLimitExceeded ? null : exitCode,
      };
    } catch (error) {
      this.logger.error(`Execution failed: ${error.message}`);
      return {
        stdout: '',
        stderr: `System Error: ${error.message}`,
        executionTime: 0,
        isTimeLimitExceeded: false,
        exitCode: -1,
      };
    } finally {
      if (container) {
        try {
          await container.remove({ force: true }).catch(() => {});
        } catch {}
      }
      await fs.unlink(hostFilePath).catch(() => {});
    }
  }

  private demuxLogs(buffer: Buffer): { stdout: string; stderr: string } {
    let stdout = '';
    let stderr = '';
    let offset = 0;

    while (offset < buffer.length) {
      if (offset + 8 > buffer.length) break;

      const type = buffer[offset];
      const size = buffer.readUInt32BE(offset + 4);

      if (offset + 8 + size > buffer.length) break;

      const content = buffer
        .subarray(offset + 8, offset + 8 + size)
        .toString('utf-8');

      if (type === 1) {
        stdout += content;
      } else if (type === 2) {
        stderr += content;
      }

      offset += 8 + size;
    }

    return { stdout, stderr };
  }

  private getExtension(language: string): string {
    switch (language) {
      case 'python':
        return 'py';
      case 'javascript':
        return 'js';
      default:
        return 'txt';
    }
  }

  private getDockerImage(language: string): string {
    switch (language) {
      case 'python':
        return 'python:3.9-slim';
      case 'javascript':
        return 'node:18-alpine';
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  private getRunCommand(language: string, filename: string): string[] {
    switch (language) {
      case 'python':
        return ['python3', '-u', filename];
      case 'javascript':
        return ['node', filename];
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }
}
