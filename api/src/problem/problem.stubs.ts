import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { ProblemPreview } from './types/problem-preview.type';
import { ProblemDetail } from './types/problem-detail.dto';
import { Problem } from '../generated/prisma';
export const previewProblemStub: ProblemPreview = {
  id: '1',
  title: 'Two Sum',
  slug: 'two-sum',
  difficulty: 'EASY',
};

export const detailProblemStub: ProblemDetail = {
  id: '1',
  slug: 'two-sum',
  title: 'Two Sum',
  description: 'Test description',
  difficulty: 'EASY',
  timeLimit: 1,
  memoryLimit: 128,
  starterCode: { python: 'def two_sum(nums, target):\n    pass' },
  testCases: [{ input: '[2,7,11,15],9', output: '[0,1]' }],
};

export const createProblemDtoStub: CreateProblemDto = {
  title: 'Two Sum',
  slug: 'two-sum',
  description: 'Test description',
  difficulty: 'EASY',
  starterCode: { python: 'test' },
};

export const updateProblemDtoStub: UpdateProblemDto = {
  title: 'Two Sum updated',
  description: 'Updated description',
  difficulty: 'MEDIUM',
};

export const problemStub: Problem = {
  id: '1',
  title: createProblemDtoStub.title,
  slug: createProblemDtoStub.slug,
  description: createProblemDtoStub.description,
  difficulty: createProblemDtoStub.difficulty,
  starterCode: {},
  timeLimit: 1,
  memoryLimit: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const updatedProblemStub: Problem = {
  ...problemStub,
  ...updateProblemDtoStub,
};
