import { DockerLogsParser } from './docker-logs.parser';

describe('DockerLogsParser', () => {
  describe('parse', () => {
    it('should parse stdout frame correctly', () => {
      const content = 'Hello World\n';
      const buffer = createDockerLogFrame(1, content);

      const result = DockerLogsParser.parse(buffer);

      expect(result.stdout).toBe(content);
      expect(result.stderr).toBe('');
    });

    it('should parse stderr frame correctly', () => {
      const content = 'Error message\n';
      const buffer = createDockerLogFrame(2, content);

      const result = DockerLogsParser.parse(buffer);

      expect(result.stdout).toBe('');
      expect(result.stderr).toBe(content);
    });

    it('should parse multiple stdout frames', () => {
      const frame1 = createDockerLogFrame(1, 'Line 1\n');
      const frame2 = createDockerLogFrame(1, 'Line 2\n');
      const buffer = Buffer.concat([frame1, frame2]);

      const result = DockerLogsParser.parse(buffer);

      expect(result.stdout).toBe('Line 1\nLine 2\n');
      expect(result.stderr).toBe('');
    });

    it('should parse mixed stdout and stderr frames', () => {
      const frame1 = createDockerLogFrame(1, 'Output\n');
      const frame2 = createDockerLogFrame(2, 'Error\n');
      const frame3 = createDockerLogFrame(1, 'More output\n');
      const buffer = Buffer.concat([frame1, frame2, frame3]);

      const result = DockerLogsParser.parse(buffer);

      expect(result.stdout).toBe('Output\nMore output\n');
      expect(result.stderr).toBe('Error\n');
    });

    it('should handle empty buffer', () => {
      const buffer = Buffer.alloc(0);

      const result = DockerLogsParser.parse(buffer);

      expect(result.stdout).toBe('');
      expect(result.stderr).toBe('');
    });

    it('should handle unicode characters', () => {
      const content = 'Hello 世界 🌍\n';
      const buffer = createDockerLogFrame(1, content);

      const result = DockerLogsParser.parse(buffer);

      expect(result.stdout).toBe(content);
    });

    it('should handle special characters', () => {
      const content = 'Line with\ttabs\nand\nnewlines\r\n';
      const buffer = createDockerLogFrame(1, content);

      const result = DockerLogsParser.parse(buffer);

      expect(result.stdout).toBe(content);
    });

    it('should stop parsing incomplete frames', () => {
      const completeFrame = createDockerLogFrame(1, 'Complete\n');
      const incompleteFrame = Buffer.alloc(4);
      const buffer = Buffer.concat([completeFrame, incompleteFrame]);

      const result = DockerLogsParser.parse(buffer);

      expect(result.stdout).toBe('Complete\n');
      expect(result.stderr).toBe('');
    });

    it('should handle large buffers', () => {
      const largeContent = 'A'.repeat(10000);
      const buffer = createDockerLogFrame(1, largeContent);

      const result = DockerLogsParser.parse(buffer);

      expect(result.stdout).toBe(largeContent);
      expect(result.stdout.length).toBe(10000);
    });

    it('should ignore frames with invalid type', () => {
      const buffer = Buffer.alloc(8);
      buffer[0] = 99;
      buffer.writeUInt32BE(5, 4);
      const content = Buffer.from('Hello');
      const fullBuffer = Buffer.concat([buffer, content]);

      const result = DockerLogsParser.parse(fullBuffer);

      expect(result.stdout).toBe('');
      expect(result.stderr).toBe('');
    });

    it('should handle frame with size larger than remaining buffer', () => {
      const buffer = Buffer.alloc(8);
      buffer[0] = 1;
      buffer.writeUInt32BE(1000, 4);

      const result = DockerLogsParser.parse(buffer);

      expect(result.stdout).toBe('');
    });

    it('should parse multiple large frames', () => {
      const frames: any = [];
      for (let i = 0; i < 10; i++) {
        frames.push(createDockerLogFrame(1, `Line ${i}\n`));
      }
      const buffer = Buffer.concat(frames);

      const result = DockerLogsParser.parse(buffer);

      expect(result.stdout).toContain('Line 0');
      expect(result.stdout).toContain('Line 9');
      expect(result.stdout.split('\n').length).toBe(11);
    });
  });
});

function createDockerLogFrame(type: number, content: string): Buffer {
  const contentBuffer = Buffer.from(content, 'utf-8');
  const header = Buffer.alloc(8);
  header[0] = type;
  header.writeUInt32BE(contentBuffer.length, 4);
  return Buffer.concat([header, contentBuffer]);
}
