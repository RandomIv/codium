import { Injectable, Logger } from '@nestjs/common';
import { Container } from '../interfaces/docker-client.interface';

@Injectable()
export class ContainerManager {
  private readonly logger = new Logger(ContainerManager.name);

  async start(container: Container): Promise<void> {
    await container.start();
  }

  async kill(container: Container): Promise<void> {
    try {
      await container.kill();
    } catch (error) {
      this.logger.warn(`Failed to kill container: ${error.message}`);
    }
  }

  async wait(container: Container): Promise<void> {
    await container.wait();
  }

  async remove(container: Container): Promise<void> {
    try {
      await container.remove({ force: true });
    } catch (error) {
      this.logger.warn(`Failed to remove container: ${error.message}`);
    }
  }

  async readLogs(container: Container): Promise<Buffer> {
    const logs = await container.logs({
      stdout: true,
      stderr: true,
    });
    const bufferLogs = logs as Buffer;

    const MAX_LOG_SIZE = 1024 * 1024;

    if (bufferLogs.length > MAX_LOG_SIZE) {
      return bufferLogs.subarray(0, MAX_LOG_SIZE);
    }

    return bufferLogs;
  }

  async getExitCode(container: Container): Promise<number> {
    const info = await container.inspect();
    return info.State.ExitCode;
  }
}
