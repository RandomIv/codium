import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionService } from './submission.service';
import { PrismaService } from '../prisma/prisma.service';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  submissionStub,
  createSubmissionDtoStub,
  updateSubmissionDtoStub,
  updatedSubmissionStub,
} from './submission.stubs';
import { PrismaClientKnownRequestError } from '@prisma/client-runtime-utils';

describe('SubmissionService', () => {
  let service: SubmissionService;
  let prisma: PrismaService;
  let judgeQueue: Queue;

  const mockPrismaService = {
    submission: {
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJudgeQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: getQueueToken('judge-queue'),
          useValue: mockJudgeQueue,
        },
      ],
    }).compile();

    service = module.get<SubmissionService>(SubmissionService);
    prisma = module.get<PrismaService>(PrismaService);
    judgeQueue = module.get<Queue>(getQueueToken('judge-queue'));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a submission by id', async () => {
      mockPrismaService.submission.findUniqueOrThrow.mockResolvedValue(
        submissionStub,
      );

      const result = await service.findOne(submissionStub.id);

      expect(result).toEqual(submissionStub);
      expect(prisma.submission.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: submissionStub.id },
      });
    });

    it('should propagate prisma error when submission does not exist', async () => {
      const prismaError = new PrismaClientKnownRequestError('Not Found', {
        code: 'P2025',
        clientVersion: '5.0.0',
      });

      mockPrismaService.submission.findUniqueOrThrow.mockRejectedValue(
        prismaError,
      );

      await expect(service.findOne('fake-id')).rejects.toBe(prismaError);
    });
  });

  describe('create', () => {
    it('should create a submission', async () => {
      mockPrismaService.submission.create.mockResolvedValue(submissionStub);
      mockJudgeQueue.add.mockResolvedValue({ id: submissionStub.id });

      const result = await service.create(createSubmissionDtoStub);

      expect(result).toEqual(submissionStub);
      expect(prisma.submission.create).toHaveBeenCalledWith({
        data: createSubmissionDtoStub,
      });
    });

    it('should add job to judge queue after creating submission', async () => {
      mockPrismaService.submission.create.mockResolvedValue(submissionStub);
      mockJudgeQueue.add.mockResolvedValue({ id: submissionStub.id });

      await service.create(createSubmissionDtoStub);

      expect(judgeQueue.add).toHaveBeenCalledWith(
        'judge',
        {
          problemId: createSubmissionDtoStub.problemId,
          code: createSubmissionDtoStub.code,
          language: createSubmissionDtoStub.language,
        },
        {
          jobId: submissionStub.id,
          removeOnComplete: true,
        },
      );
    });

    it('should create submission with correct initial status', async () => {
      mockPrismaService.submission.create.mockResolvedValue(submissionStub);
      mockJudgeQueue.add.mockResolvedValue({ id: submissionStub.id });

      const result = await service.create(createSubmissionDtoStub);

      expect(result.status).toBe('PENDING');
    });
  });

  describe('update', () => {
    it('should update a submission', async () => {
      mockPrismaService.submission.update.mockResolvedValue(
        updatedSubmissionStub,
      );

      const result = await service.update(
        submissionStub.id,
        updateSubmissionDtoStub,
      );

      expect(result).toEqual(updatedSubmissionStub);
      expect(prisma.submission.update).toHaveBeenCalledWith({
        where: { id: submissionStub.id },
        data: expect.objectContaining({
          status: updateSubmissionDtoStub.status,
          verdict: updateSubmissionDtoStub.verdict,
          time: updateSubmissionDtoStub.time,
          memory: updateSubmissionDtoStub.memory,
          testCasesPassed: updateSubmissionDtoStub.testCasesPassed,
        }),
      });
    });

    it('should update submission with test logs', async () => {
      const updatedWithLogs = {
        ...updatedSubmissionStub,
        testLogs: updateSubmissionDtoStub.testLogs,
      };
      mockPrismaService.submission.update.mockResolvedValue(updatedWithLogs);

      const result = await service.update(
        submissionStub.id,
        updateSubmissionDtoStub,
      );

      expect(result.testLogs).toBeDefined();
      expect(prisma.submission.update).toHaveBeenCalledWith({
        where: { id: submissionStub.id },
        data: expect.objectContaining({
          testLogs: expect.any(Object),
        }),
      });
    });

    it('should propagate prisma error when submission does not exist', async () => {
      const prismaError = new PrismaClientKnownRequestError('Not Found', {
        code: 'P2025',
        clientVersion: '5.0.0',
      });

      mockPrismaService.submission.update.mockRejectedValue(prismaError);

      await expect(
        service.update('fake-id', updateSubmissionDtoStub),
      ).rejects.toBe(prismaError);
    });

    it('should update submission without test logs', async () => {
      const updateWithoutLogs = {
        status: updateSubmissionDtoStub.status,
        verdict: updateSubmissionDtoStub.verdict,
        time: updateSubmissionDtoStub.time,
        memory: updateSubmissionDtoStub.memory,
        testCasesPassed: updateSubmissionDtoStub.testCasesPassed,
      };

      mockPrismaService.submission.update.mockResolvedValue({
        ...submissionStub,
        ...updateWithoutLogs,
      });

      const result = await service.update(submissionStub.id, updateWithoutLogs);

      expect(result.testLogs).toBeNull();
      expect(prisma.submission.update).toHaveBeenCalledWith({
        where: { id: submissionStub.id },
        data: updateWithoutLogs,
      });
    });
  });
});
