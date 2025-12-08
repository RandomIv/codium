import { Injectable, Logger } from '@nestjs/common';
import { IContainer } from '../abstractions/docker-client.interface';

@Injectable()
export class ContainerManager {
  private readonly logger = new Logger(ContainerManager.name);

  async start(container: IContainer): Promise<void> {
    await container.start();
  }

  async kill(container: IContainer): Promise<void> {
    try {
      await container.kill();
    } catch (error) {
      this.logger.warn(`Failed to kill container: ${error.message}`);
    }
  }

  async wait(container: IContainer): Promise<void> {
    await container.wait();
  }

  async remove(container: IContainer): Promise<void> {
    try {
      await container.remove({ force: true });
    } catch (error) {
      this.logger.warn(`Failed to remove container: ${error.message}`);
    }
  }

  async readLogs(container: IContainer): Promise<Buffer> {
    return (await container.logs({
      stdout: true,
      stderr: true,
    })) as Buffer;
  }

  async getExitCode(container: IContainer): Promise<number> {
    const info = await container.inspect();
    return info.State.ExitCode;
  }
}
