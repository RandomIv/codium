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
import { NotFoundException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client-runtime-utils';
import { problemPreviewSelect } from './types/problem-preview.type';
import { problemDetailSelect } from './types/problem-detail.dto';

describe('ProblemService', () => {
  let service: ProblemService;
  let prisma: PrismaService;

  const mockPrismaService = {
    problem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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
    it('returns array of problems', async () => {
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

    it('returns empty array when no problems exist', async () => {
      mockPrismaService.problem.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(prisma.problem.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('returns problem by slug', async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue(detailProblemStub);

      const result = await service.findOne('two-sum');

      expect(result).toEqual(detailProblemStub);
      expect(prisma.problem.findUnique).toHaveBeenCalledWith({
        where: { slug: 'two-sum' },
        select: problemDetailSelect,
      });
    });

    it('throws NotFoundException when problem does not exist', async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing-slug')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('missing-slug')).rejects.toThrow(
        'Problem missing-slug not found',
      );
    });
  });

  describe('findOneById', () => {
    it('returns problem by id', async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue(problemStub);

      const result = await service.findOneById('1');

      expect(result).toEqual(problemStub);
      expect(prisma.problem.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { testCases: true },
      });
    });

    it('throws NotFoundException when problem does not exist', async () => {
      mockPrismaService.problem.findUnique.mockResolvedValue(null);

      await expect(service.findOneById('missing')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOneById('missing')).rejects.toThrow(
        'Problem missing not found',
      );
    });
  });

  describe('create', () => {
    it('creates problem', async () => {
      mockPrismaService.problem.create.mockResolvedValue(problemStub);

      const result = await service.create(createProblemDtoStub);

      expect(result).toEqual(problemStub);
      expect(prisma.problem.create).toHaveBeenCalledWith({
        data: createProblemDtoStub,
      });
    });
  });

  describe('update', () => {
    it('updates existing problem', async () => {
      mockPrismaService.problem.update.mockResolvedValue(updatedProblemStub);

      const result = await service.update('1', updateProblemDtoStub);

      expect(result).toEqual(updatedProblemStub);
      expect(prisma.problem.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateProblemDtoStub,
      });
    });
    it('throws NotFoundException when problem does not exist', async () => {
      const prismaError = new PrismaClientKnownRequestError('Not Found', {
        code: 'P2025',
        clientVersion: '5.0.0',
      });

      mockPrismaService.problem.update.mockRejectedValue(prismaError);

      await expect(service.update('1', updateProblemDtoStub)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('removes problem', async () => {
      mockPrismaService.problem.delete.mockResolvedValue(problemStub);

      const result = await service.remove('1');

      expect(result).toEqual(problemStub);
      expect(prisma.problem.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
    it('throws NotFoundException when problem does not exist', async () => {
      const prismaError = new PrismaClientKnownRequestError('Not Found', {
        code: 'P2025',
        clientVersion: '5.0.0',
      });

      mockPrismaService.problem.delete.mockRejectedValue(prismaError);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });
});
