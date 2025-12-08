export class ExecutionTimer {
  static async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
  ): Promise<{ result: T | null; timedOut: boolean; executionTimeMs: number }> {
    const startTime = process.hrtime();
    let timer: NodeJS.Timeout;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('TLE')), timeoutMs);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timer!);
      const [s, ns] = process.hrtime(startTime);
      return {
        result,
        timedOut: false,
        executionTimeMs: s * 1000 + ns / 1e6,
      };
    } catch (error) {
      clearTimeout(timer!);
      const [s, ns] = process.hrtime(startTime);
      if (error.message === 'TLE') {
        return {
          result: null,
          timedOut: true,
          executionTimeMs: s * 1000 + ns / 1e6,
        };
      }
      throw error;
    }
  }
}
