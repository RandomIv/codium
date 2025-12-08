import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class FileManager {
  private readonly logger = new Logger(FileManager.name);
  async writeCodeFile(
    tempDir: string,
    code: string,
    extension: string,
  ): Promise<{ filename: string; filepath: string }> {
    const filename = `${uuidv4()}.${extension}`;
    const filepath = path.join(tempDir, filename);
    await fs.writeFile(filepath, code);
    return { filename, filepath };
  }
  async cleanup(filepath: string): Promise<void> {
    try {
      await fs.unlink(filepath);
    } catch (error) {
      this.logger.warn(`Failed to cleanup file ${filepath}: ${error.message}`);
    }
  }
  async ensureDirectory(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true }).catch(() => {});
  }
}
