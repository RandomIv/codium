export default interface ExecutionResult {
  stdout: string;
  stderr: string;
  executionTime: number;
  isTimeLimitExceeded: boolean;
  exitCode: number | null;
}
