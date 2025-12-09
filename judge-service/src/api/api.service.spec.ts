import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ApiService } from './api.service';

global.fetch = jest.fn();

describe('ApiService', () => {
  let service: ApiService;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockConfigService = {
      getOrThrow: jest.fn(),
    } as any;

    mockConfigService.getOrThrow.mockImplementation((key: string) => {
      if (key === 'API_URL') return 'http://localhost:3000';
      if (key === 'SYSTEM_API_KEY') return 'test-api-key';
      throw new Error(`Unknown config key: ${key}`);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ApiService>(ApiService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getProblem', () => {
    it('should fetch problem correctly', async () => {
      const mockProblem = {
        timeLimit: 1000,
        memoryLimit: 262144,
        testCases: [{ id: '1', input: '5', output: '5' }],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify(mockProblem)),
      });

      const result = await service.getProblem('problem-123');

      expect(result).toEqual(mockProblem);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/problems/system/problem-123',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-system-api-key': 'test-api-key',
          },
        }),
      );
    });

    it('should include system API key header', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('{}'),
      });

      await service.getProblem('test-id');

      const call = (global.fetch as jest.Mock).mock.calls[0];
      expect(call[1].headers['x-system-api-key']).toBe('test-api-key');
    });

    it('should use GET method', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('{}'),
      });

      await service.getProblem('test-id');

      const call = (global.fetch as jest.Mock).mock.calls[0];
      expect(call[1].method).toBe('GET');
    });

    it('should handle 404 errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(service.getProblem('nonexistent')).rejects.toThrow(
        'API Error: Not Found',
      );
    });

    it('should handle 500 errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(service.getProblem('test-id')).rejects.toThrow(
        'API Error: Internal Server Error',
      );
    });

    it('should handle network failures', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(service.getProblem('test-id')).rejects.toThrow(
        'Network error',
      );
    });

    it('should strip trailing slash from base URL', async () => {
      mockConfigService.getOrThrow.mockImplementation((key: string) => {
        if (key === 'API_URL') return 'http://localhost:3000/';
        if (key === 'SYSTEM_API_KEY') return 'test-api-key';
        throw new Error(`Unknown config key: ${key}`);
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ApiService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const newService = module.get<ApiService>(ApiService);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('{}'),
      });

      await newService.getProblem('test-id');

      const call = (global.fetch as jest.Mock).mock.calls[0];
      expect(call[0]).toBe('http://localhost:3000/problems/system/test-id');
      expect(call[0]).not.toContain('//problems');
    });
  });

  describe('updateSubmission', () => {
    it('should update submission correctly', async () => {
      const updateData = {
        status: 'COMPLETED',
        verdict: 'ACCEPTED',
        time: 100,
        memory: 1024,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(''),
      });

      await service.updateSubmission('submission-123', updateData);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/submissions/submission-123',
        expect.objectContaining({
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-system-api-key': 'test-api-key',
          },
          body: JSON.stringify(updateData),
        }),
      );
    });

    it('should use PATCH method', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(''),
      });

      await service.updateSubmission('test-id', {});

      const call = (global.fetch as jest.Mock).mock.calls[0];
      expect(call[1].method).toBe('PATCH');
    });

    it('should include request body', async () => {
      const data = { status: 'COMPLETED' };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(''),
      });

      await service.updateSubmission('test-id', data);

      const call = (global.fetch as jest.Mock).mock.calls[0];
      expect(call[1].body).toBe(JSON.stringify(data));
    });

    it('should handle empty response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(''),
      });

      await expect(
        service.updateSubmission('test-id', {}),
      ).resolves.not.toThrow();
    });

    it('should handle 404 errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(service.updateSubmission('nonexistent', {})).rejects.toThrow(
        'API Error: Not Found',
      );
    });

    it('should handle network failures', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error('Connection refused'),
      );

      await expect(service.updateSubmission('test-id', {})).rejects.toThrow(
        'Connection refused',
      );
    });
  });

  describe('request (private method behavior)', () => {
    it('should parse JSON responses', async () => {
      const responseData = { id: '1', name: 'Test' };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify(responseData)),
      });

      const result = await service.getProblem('test-id');

      expect(result).toEqual(responseData);
    });

    it('should handle empty responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(''),
      });

      const result = await service.updateSubmission('test-id', {});

      expect(result).toBeNull();
    });

    it('should include Content-Type header', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('{}'),
      });

      await service.getProblem('test-id');

      const call = (global.fetch as jest.Mock).mock.calls[0];
      expect(call[1].headers['Content-Type']).toBe('application/json');
    });

    it('should not include body for GET requests', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('{}'),
      });

      await service.getProblem('test-id');

      const call = (global.fetch as jest.Mock).mock.calls[0];
      expect(call[1].body).toBeUndefined();
    });

    it('should include body for PATCH requests', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(''),
      });

      await service.updateSubmission('test-id', { status: 'COMPLETED' });

      const call = (global.fetch as jest.Mock).mock.calls[0];
      expect(call[1].body).toBeDefined();
    });

    it('should construct correct URLs', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('{}'),
      });

      await service.getProblem('prob-1');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/problems/system/prob-1',
        expect.any(Object),
      );
    });
  });
});
