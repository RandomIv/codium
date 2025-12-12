import { Verdict } from './enums';

export type TestLogItem = {
  testCaseId: string;
  status: Verdict;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  executionTime: number;
  memory: number;
  error?: string;
  compileOutput?: string;
};

export type TestLogs = TestLogItem[];
