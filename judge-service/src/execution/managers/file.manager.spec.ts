import { Test, TestingModule } from '@nestjs/testing';
import { FileManager } from './file.manager';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

jest.mock('uuid');
jest.mock('fs/promises');

describe('FileManager', () => {
  let service: FileManager;
  const mockUuid = '12345678-1234-1234-1234-123456789abc';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileManager],
    }).compile();

    service = module.get<FileManager>(FileManager);
    jest.clearAllMocks();
    (uuidv4 as jest.Mock).mockReturnValue(mockUuid);
  });

  describe('writeCodeFile', () => {
    it('should write code to file with UUID name', async () => {
      const tempDir = '/tmp/test';
      const code = 'print("Hello")';
      const extension = 'py';

      await service.writeCodeFile(tempDir, code, extension);

      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(tempDir, `${mockUuid}.${extension}`),
        code,
      );
    });

    it('should return correct filename and filepath', async () => {
      const tempDir = '/tmp/test';
      const code = 'console.log("Hello")';
      const extension = 'js';

      const result = await service.writeCodeFile(tempDir, code, extension);

      expect(result.filename).toBe(`${mockUuid}.${extension}`);
      expect(result.filepath).toBe(
        path.join(tempDir, `${mockUuid}.${extension}`),
      );
    });

    it('should handle different extensions', async () => {
      const tempDir = '/tmp/test';
      const code = 'code';

      const result1 = await service.writeCodeFile(tempDir, code, 'py');
      const result2 = await service.writeCodeFile(tempDir, code, 'js');
      const result3 = await service.writeCodeFile(tempDir, code, 'cpp');

      expect(result1.filename).toBe(`${mockUuid}.py`);
      expect(result2.filename).toBe(`${mockUuid}.js`);
      expect(result3.filename).toBe(`${mockUuid}.cpp`);
    });

    it('should handle different temp directories', async () => {
      const code = 'test';
      const extension = 'py';

      const result1 = await service.writeCodeFile('/tmp/dir1', code, extension);
      const result2 = await service.writeCodeFile('/var/tmp', code, extension);

      expect(result1.filepath).toContain('/tmp/dir1');
      expect(result2.filepath).toContain('/var/tmp');
    });

    it('should generate unique filename using uuid', async () => {
      (uuidv4 as jest.Mock)
        .mockReturnValueOnce('uuid-1')
        .mockReturnValueOnce('uuid-2');

      const result1 = await service.writeCodeFile('/tmp', 'code1', 'py');
      const result2 = await service.writeCodeFile('/tmp', 'code2', 'py');

      expect(result1.filename).toBe('uuid-1.py');
      expect(result2.filename).toBe('uuid-2.py');
    });

    it('should write empty code', async () => {
      await service.writeCodeFile('/tmp', '', 'py');

      expect(fs.writeFile).toHaveBeenCalledWith(expect.any(String), '');
    });

    it('should write multiline code', async () => {
      const code = 'line1\nline2\nline3';

      await service.writeCodeFile('/tmp', code, 'py');

      expect(fs.writeFile).toHaveBeenCalledWith(expect.any(String), code);
    });

    it('should handle special characters in code', async () => {
      const code = 'print("Hello 世界 🌍")';

      await service.writeCodeFile('/tmp', code, 'py');

      expect(fs.writeFile).toHaveBeenCalledWith(expect.any(String), code);
    });
  });

  describe('cleanup', () => {
    it('should delete file successfully', async () => {
      const filepath = '/tmp/test.py';
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);

      await service.cleanup(filepath);

      expect(fs.unlink).toHaveBeenCalledWith(filepath);
    });

    it('should handle non-existent files gracefully', async () => {
      const filepath = '/tmp/nonexistent.py';
      (fs.unlink as jest.Mock).mockRejectedValue(new Error('File not found'));

      await expect(service.cleanup(filepath)).resolves.not.toThrow();
    });

    it('should handle permission errors gracefully', async () => {
      const filepath = '/tmp/noperm.py';
      (fs.unlink as jest.Mock).mockRejectedValue(
        new Error('Permission denied'),
      );

      await expect(service.cleanup(filepath)).resolves.not.toThrow();
    });

    it('should handle multiple cleanup calls', async () => {
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);

      await service.cleanup('/tmp/file1.py');
      await service.cleanup('/tmp/file2.js');

      expect(fs.unlink).toHaveBeenCalledTimes(2);
    });

    it('should cleanup files with different extensions', async () => {
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);

      await service.cleanup('/tmp/test.py');
      await service.cleanup('/tmp/test.js');
      await service.cleanup('/tmp/test.cpp');

      expect(fs.unlink).toHaveBeenCalledTimes(3);
    });
  });

  describe('ensureDirectory', () => {
    it('should create directory', async () => {
      const dirPath = '/tmp/codium';
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

      await service.ensureDirectory(dirPath);

      expect(fs.mkdir).toHaveBeenCalledWith(dirPath, { recursive: true });
    });

    it('should be idempotent (handle existing directory)', async () => {
      const dirPath = '/tmp/existing';
      (fs.mkdir as jest.Mock).mockRejectedValue(new Error('Directory exists'));

      await expect(service.ensureDirectory(dirPath)).resolves.not.toThrow();
    });

    it('should create nested directories', async () => {
      const dirPath = '/tmp/a/b/c/d';
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

      await service.ensureDirectory(dirPath);

      expect(fs.mkdir).toHaveBeenCalledWith(dirPath, { recursive: true });
    });

    it('should handle root directory', async () => {
      const dirPath = '/tmp';
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

      await service.ensureDirectory(dirPath);

      expect(fs.mkdir).toHaveBeenCalledWith(dirPath, { recursive: true });
    });

    it('should handle permission errors gracefully', async () => {
      const dirPath = '/root/noperm';
      (fs.mkdir as jest.Mock).mockRejectedValue(new Error('Permission denied'));

      await expect(service.ensureDirectory(dirPath)).resolves.not.toThrow();
    });

    it('should use recursive option', async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

      await service.ensureDirectory('/tmp/test');

      const call = (fs.mkdir as jest.Mock).mock.calls[0];
      expect(call[1]).toEqual({ recursive: true });
    });
  });
});
