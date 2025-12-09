export default interface ExecutionResult {
  stdout: string;
  stderr: string;
  executionTime: number;
  memory: number;
  isTimeLimitExceeded: boolean;
  exitCode: number | null;
}
