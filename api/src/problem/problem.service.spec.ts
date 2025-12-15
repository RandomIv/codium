import { Test, TestingModule } from '@nestjs/testing';
import { ProblemService } from './problem.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  previewProblemStub,
  detailProblemStub,
  createProblemDtoStub,
  updateProblemDtoStub,
  problemStub,
  updatedProblemStub,
} from './problem.stubs';
import { PrismaClientKnownRequestError } from '@prisma/client-runtime-utils';
import { problemPreviewSelect } from './types/problem-preview.type';
import { problemDetailSelect } from './types/problem-detail.dto';

describe('ProblemService', () => {
  let service: ProblemService;
  let prisma: PrismaService;

  const mockPrismaService = {
    problem: {
      findMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    testCase: {
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProblemService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProblemService>(ProblemService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('findAll', () => {
    it('should return array of problems', async () => {
      mockPrismaService.problem.findMany.mockResolvedValue([
        previewProblemStub,
      ]);

      const result = await service.findAll();

      expect(result).toEqual([previewProblemStub]);
      expect(prisma.problem.findMany).toHaveBeenCalledWith({
        select: problemPreviewSelect,
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should return empty array when no problems exist', async () => {
      mockPrismaService.problem.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(prisma.problem.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return problem by slug', async () => {
      mockPrismaService.problem.findUniqueOrThrow.mockResolvedValue(
        detailProblemStub,
      );

      const result = await service.findOne('two-sum');

      expect(result).toEqual(detailProblemStub);
      expect(prisma.problem.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { slug: 'two-sum' },
        select: problemDetailSelect,
      });
    });

    it('should propagate prisma error when problem does not exist', async () => {
      const prismaError = new PrismaClientKnownRequestError('Not Found', {
        code: 'P2025',
        clientVersion: '5.0.0',
      });

      mockPrismaService.problem.findUniqueOrThrow.mockRejectedValue(
        prismaError,
      );

      await expect(service.findOne('missing-slug')).rejects.toBe(prismaError);
    });
  });

  describe('findOneById', () => {
    it('should return problem by id', async () => {
      mockPrismaService.problem.findUniqueOrThrow.mockResolvedValue(
        problemStub,
      );

      const result = await service.findOneById('1');

      expect(result).toEqual(problemStub);
      expect(prisma.problem.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { testCases: true },
      });
    });

    it('should propagate prisma error when problem does not exist', async () => {
      const prismaError = new PrismaClientKnownRequestError('Not Found', {
        code: 'P2025',
        clientVersion: '5.0.0',
      });

      mockPrismaService.problem.findUniqueOrThrow.mockRejectedValue(
        prismaError,
      );

      await expect(service.findOneById('missing')).rejects.toBe(prismaError);
    });
  });

  describe('create', () => {
    it('should create problem', async () => {
      mockPrismaService.problem.create.mockResolvedValue(problemStub);

      const result = await service.create(createProblemDtoStub);

      expect(result).toEqual(problemStub);
      expect(prisma.problem.create).toHaveBeenCalledWith({
        data: {
          ...createProblemDtoStub,
          testCases: undefined,
        },
        include: { testCases: true },
      });
    });
  });

  describe('update', () => {
    it('should update existing problem', async () => {
      mockPrismaService.problem.update.mockResolvedValue(updatedProblemStub);

      const result = await service.update('1', updateProblemDtoStub);

      expect(result).toEqual(updatedProblemStub);
      expect(prisma.problem.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          ...updateProblemDtoStub,
          testCases: undefined,
        },
        include: { testCases: true },
      });
    });
    it('should propagate prisma error when update fails', async () => {
      const prismaError = new PrismaClientKnownRequestError('Not Found', {
        code: 'P2025',
        clientVersion: '5.0.0',
      });

      mockPrismaService.problem.update.mockRejectedValue(prismaError);

      await expect(service.update('1', updateProblemDtoStub)).rejects.toBe(
        prismaError,
      );
    });
  });

  describe('remove', () => {
    it('should remove problem', async () => {
      mockPrismaService.problem.delete.mockResolvedValue(problemStub);

      const result = await service.remove('1');

      expect(result).toEqual(problemStub);
      expect(prisma.problem.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
    it('should propagate prisma error when delete fails', async () => {
      const prismaError = new PrismaClientKnownRequestError('Not Found', {
        code: 'P2025',
        clientVersion: '5.0.0',
      });

      mockPrismaService.problem.delete.mockRejectedValue(prismaError);

      await expect(service.remove('999')).rejects.toBe(prismaError);
    });
  });
});
