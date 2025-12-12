import { Difficulty } from './enums';
import type { Submission } from './submission';
import type { TestCase } from './test-case';

export type Problem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  starterCode: Record<string, string>;
  timeLimit: number;
  memoryLimit: number;
  submissions?: Submission[];
  testCases?: TestCase[];
  createdAt: string;
  updatedAt: string;
};
