import { Language, SubmissionStatus, Verdict } from './enums';
import type { Problem } from './problem';
import type { User } from './user';
import { TestLogs } from './test-log';

export type Submission = {
  id: string;
  code: string;
  language: Language;
  verdict: Verdict | null;
  testLogs: TestLogs;
  status: SubmissionStatus;
  time: number | null;
  memory: number | null;
  testCasesPassed: number | null;
  problemId: string;
  userId: string;
  problem?: Problem;
  user?: User;
  createdAt: string;
  updatedAt: string;
};
