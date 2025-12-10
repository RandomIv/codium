import { CreateSubmissionDto } from './dtos/create-submission.dto';
import { UpdateSubmissionDto } from './dtos/update-submission.dto';
import {
  Submission,
  Language,
  SubmissionStatus,
  Verdict,
} from '../generated/prisma';

export const createSubmissionDtoStub: CreateSubmissionDto = {
  code: 'def two_sum(nums, target):\n    return [0, 1]',
  language: Language.PYTHON,
  problemId: '123e4567-e89b-12d3-a456-426614174000',
  userId: '123e4567-e89b-12d3-a456-426614174001',
};

export const updateSubmissionDtoStub: UpdateSubmissionDto = {
  status: SubmissionStatus.COMPLETED,
  verdict: Verdict.ACCEPTED,
  time: 100,
  memory: 2048,
  testCasesPassed: 5,
  testLogs: [
    {
      testCaseId: 'test-1',
      status: Verdict.ACCEPTED,
      input: '[2,7,11,15],9',
      expectedOutput: '[0,1]',
      actualOutput: '[0,1]',
      executionTime: 20,
      memory: 512,
    },
  ],
};

export const submissionStub: Submission = {
  id: '123e4567-e89b-12d3-a456-426614174002',
  code: createSubmissionDtoStub.code,
  language: createSubmissionDtoStub.language,
  problemId: createSubmissionDtoStub.problemId,
  userId: createSubmissionDtoStub.userId,
  status: SubmissionStatus.PENDING,
  verdict: null,
  testLogs: null,
  time: 0,
  memory: 0,
  testCasesPassed: 0,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

export const updatedSubmissionStub: Submission = {
  ...submissionStub,
  status: updateSubmissionDtoStub.status,
  verdict: updateSubmissionDtoStub.verdict ?? null,
  time: updateSubmissionDtoStub.time ?? 0,
  memory: updateSubmissionDtoStub.memory ?? 0,
  testCasesPassed: updateSubmissionDtoStub.testCasesPassed ?? 0,
  testLogs: updateSubmissionDtoStub.testLogs as any,
  updatedAt: new Date('2024-01-01T00:01:00.000Z'),
};
