const NANOSECONDS_TO_MILLISECONDS = 1e6;
const SECONDS_TO_MILLISECONDS = 1000;
const TIME_LIMIT_EXCEEDED_ERROR = 'TLE';

export interface TimedExecutionResult<T> {
  result: T | null;
  timedOut: boolean;
  executionTimeMs: number;
}

export class ExecutionTimer {
  static async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
  ): Promise<TimedExecutionResult<T>> {
    const startTime = process.hrtime();
    let timer: NodeJS.Timeout | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(TIME_LIMIT_EXCEEDED_ERROR)),
        timeoutMs,
      );
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      this.clearTimer(timer);

      return {
        result,
        timedOut: false,
        executionTimeMs: this.calculateElapsedTime(startTime),
      };
    } catch (error) {
      this.clearTimer(timer);
      const executionTimeMs = this.calculateElapsedTime(startTime);

      if (error.message === TIME_LIMIT_EXCEEDED_ERROR) {
        return {
          result: null,
          timedOut: true,
          executionTimeMs,
        };
      }

      throw error;
    }
  }

  private static clearTimer(timer: NodeJS.Timeout | undefined): void {
    if (timer) {
      clearTimeout(timer);
    }
  }

  private static calculateElapsedTime(startTime: [number, number]): number {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    return (
      seconds * SECONDS_TO_MILLISECONDS +
      nanoseconds / NANOSECONDS_TO_MILLISECONDS
    );
  }
}
