import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionController } from './submission.controller';
import { SubmissionService } from './submission.service';
import { SystemGuard } from '../common/guards/system.guard';
import {
  submissionStub,
  createSubmissionDtoStub,
  updateSubmissionDtoStub,
  updatedSubmissionStub,
} from './submission.stubs';
import { NotFoundException } from '@nestjs/common';

describe('SubmissionController', () => {
  let controller: SubmissionController;
  let service: SubmissionService;

  const mockSubmissionService = {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubmissionController],
      providers: [
        {
          provide: SubmissionService,
          useValue: mockSubmissionService,
        },
      ],
    })
      .overrideGuard(SystemGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<SubmissionController>(SubmissionController);
    service = module.get<SubmissionService>(SubmissionService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a submission by id', async () => {
      mockSubmissionService.findOne.mockResolvedValue(submissionStub);

      const result = await controller.findOne(submissionStub.id);

      expect(result).toEqual(submissionStub);
      expect(service.findOne).toHaveBeenCalledWith(submissionStub.id);
    });

    it('should throw NotFoundException when submission does not exist', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174999';
      mockSubmissionService.findOne.mockRejectedValue(
        new NotFoundException(`Submission ${fakeId} not found`),
      );

      await expect(controller.findOne(fakeId)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.findOne).toHaveBeenCalledWith(fakeId);
    });
  });

  describe('create', () => {
    const mockUser = { id: 'user-id', email: 'test@test.com' } as any;

    it('should create a submission', async () => {
      mockSubmissionService.create.mockResolvedValue(submissionStub);

      const result = await controller.create(createSubmissionDtoStub, mockUser);

      expect(result).toEqual(submissionStub);
      expect(service.create).toHaveBeenCalledWith({
        ...createSubmissionDtoStub,
        userId: mockUser.id,
      });
    });

    it('should create submission and add job to queue', async () => {
      mockSubmissionService.create.mockResolvedValue(submissionStub);

      const result = await controller.create(createSubmissionDtoStub, mockUser);

      expect(result).toEqual(submissionStub);
      expect(result.status).toBe('PENDING');
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('patch', () => {
    it('should update a submission', async () => {
      mockSubmissionService.update.mockResolvedValue(updatedSubmissionStub);

      const result = await controller.patch(
        updateSubmissionDtoStub,
        submissionStub.id,
      );

      expect(result).toEqual(updatedSubmissionStub);
      expect(service.update).toHaveBeenCalledWith(
        submissionStub.id,
        updateSubmissionDtoStub,
      );
    });

    it('should throw NotFoundException when updating non-existent submission', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174999';
      mockSubmissionService.update.mockRejectedValue(
        new NotFoundException(`Submission ${fakeId} not found`),
      );

      await expect(
        controller.patch(updateSubmissionDtoStub, fakeId),
      ).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith(
        fakeId,
        updateSubmissionDtoStub,
      );
    });

    it('should update submission with test logs', async () => {
      const updatedWithLogs = {
        ...updatedSubmissionStub,
        testLogs: updateSubmissionDtoStub.testLogs,
      };
      mockSubmissionService.update.mockResolvedValue(updatedWithLogs);

      const result = await controller.patch(
        updateSubmissionDtoStub,
        submissionStub.id,
      );

      expect(result.testLogs).toBeDefined();
      expect(service.update).toHaveBeenCalledWith(
        submissionStub.id,
        updateSubmissionDtoStub,
      );
    });
  });
});
