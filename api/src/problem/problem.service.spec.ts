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

  const previewProblem = previewProblemStub;
  const detailProblem = detailProblemStub;
  const createDto = createProblemDtoStub;
  const updateDto = updateProblemDtoStub;
  const createdProblem = problemStub;
  const updatedProblem = updatedProblemStub;
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
      mockPrismaService.problem.findMany.mockResolvedValue([previewProblem]);

      const result = await service.findAll();

      expect(result).toEqual([previewProblem]);
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
      mockPrismaService.problem.findUnique.mockResolvedValue(detailProblem);

      const result = await service.findOne('two-sum');

      expect(result).toEqual(detailProblem);
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

  describe('create', () => {
    it('creates problem', async () => {
      mockPrismaService.problem.create.mockResolvedValue(createdProblem);

      const result = await service.create(createDto);

      expect(result).toEqual(createdProblem);
      expect(prisma.problem.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });
  });

  describe('update', () => {
    it('updates existing problem', async () => {
      mockPrismaService.problem.update.mockResolvedValue(updatedProblem);

      const result = await service.update('1', updateDto);

      expect(result).toEqual(updatedProblem);
      expect(prisma.problem.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateDto,
      });
    });
    it('throws NotFoundException when problem does not exist', async () => {
      const prismaError = new PrismaClientKnownRequestError('Not Found', {
        code: 'P2025',
        clientVersion: '5.0.0',
      });

      mockPrismaService.problem.update.mockRejectedValue(prismaError);

      await expect(service.update('1', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('removes problem', async () => {
      mockPrismaService.problem.delete.mockResolvedValue(createdProblem);

      const result = await service.remove('1');

      expect(result).toEqual(createdProblem);
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
