export class DockerLogsParser {
  static parse(buffer: Buffer): { stdout: string; stderr: string } {
    let stdout = '';
    let stderr = '';
    let offset = 0;
    while (offset < buffer.length) {
      const frame = this.readFrame(buffer, offset);
      if (!frame) break;
      if (frame.type === 1) stdout += frame.content;
      else if (frame.type === 2) stderr += frame.content;
      offset = frame.nextOffset;
    }
    return { stdout, stderr };
  }
  private static readFrame(
    buffer: Buffer,
    offset: number,
  ): { type: number; content: string; nextOffset: number } | null {
    if (offset + 8 > buffer.length) return null;
    const type = buffer[offset];
    const size = buffer.readUInt32BE(offset + 4);
    if (offset + 8 + size > buffer.length) return null;
    const content = buffer
      .subarray(offset + 8, offset + 8 + size)
      .toString('utf-8');
    return {
      type,
      content,
      nextOffset: offset + 8 + size,
    };
  }
}
