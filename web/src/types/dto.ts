import { Difficulty, Language } from './enums';

export type CreateTestCaseDto = {
  input: string;
  output: string;
  isPublic?: boolean;
};

export type CreateSubmissionDto = {
  problemId: string;
  code: string;
  language: Language;
  userId: string;
};
export type LoginDto = {
  email: string;
  password: string;
};
export type RegisterDto = LoginDto & {
  name: string;
};
export type CreateProblemDto = {
  title: string;
  description: string;
  slug: string;
  difficulty: Difficulty;
  starterCode: Record<string, string>;
  timeLimit?: number;
  memoryLimit?: number;
  testCases?: CreateTestCaseDto[];
};

export type UpdateProblemDto = Partial<CreateProblemDto>;
