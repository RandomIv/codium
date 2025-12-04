import { Test, TestingModule } from '@nestjs/testing';
import { ProblemController } from './problem.controller';
import { ProblemService } from './problem.service';
import { NotFoundException } from '@nestjs/common';
import {
  previewProblemStub,
  detailProblemStub,
  createProblemDtoStub,
  updateProblemDtoStub,
  problemStub,
  updatedProblemStub,
} from './problem.stubs';

describe('ProblemController', () => {
  let controller: ProblemController;
  let service: ProblemService;

  const mockProblemService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProblemController],
      providers: [
        {
          provide: ProblemService,
          useValue: mockProblemService,
        },
      ],
    }).compile();

    controller = module.get<ProblemController>(ProblemController);
    service = module.get<ProblemService>(ProblemService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('returns array of problems', async () => {
      mockProblemService.findAll.mockResolvedValue([previewProblemStub]);

      const result = await controller.findAll();

      expect(result).toEqual([previewProblemStub]);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('returns empty array when no problems exist', async () => {
      mockProblemService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('returns problem by slug', async () => {
      mockProblemService.findOne.mockResolvedValue(detailProblemStub);

      const result = await controller.findOne('two-sum');

      expect(result).toEqual(detailProblemStub);
      expect(service.findOne).toHaveBeenCalledWith('two-sum');
    });

    it('throws NotFoundException when problem does not exist', async () => {
      mockProblemService.findOne.mockRejectedValue(
        new NotFoundException('Problem missing-slug not found'),
      );

      await expect(controller.findOne('missing-slug')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates problem', async () => {
      mockProblemService.create.mockResolvedValue(problemStub);

      const result = await controller.create(createProblemDtoStub);

      expect(result).toEqual(problemStub);
      expect(service.create).toHaveBeenCalledWith(createProblemDtoStub);
    });
  });

  describe('update', () => {
    it('updates existing problem', async () => {
      mockProblemService.update.mockResolvedValue(updatedProblemStub);

      const result = await controller.update('1', updateProblemDtoStub);

      expect(result).toEqual(updatedProblemStub);
      expect(service.update).toHaveBeenCalledWith('1', updateProblemDtoStub);
    });

    it('throws NotFoundException when problem does not exist', async () => {
      mockProblemService.update.mockRejectedValue(
        new NotFoundException('Problem with ID 1 not found'),
      );

      await expect(
        controller.update('1', updateProblemDtoStub),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes problem', async () => {
      mockProblemService.remove.mockResolvedValue(problemStub);

      const result = await controller.remove('1');

      expect(result).toEqual(problemStub);
      expect(service.remove).toHaveBeenCalledWith('1');
    });

    it('throws NotFoundException when problem does not exist', async () => {
      mockProblemService.remove.mockRejectedValue(
        new NotFoundException('Problem with ID 999 not found'),
      );

      await expect(controller.remove('999')).rejects.toThrow(NotFoundException);
    });
  });
});
