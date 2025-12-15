import { ExecutionTimer } from './execution-timer';

describe('ExecutionTimer', () => {
  describe('executeWithTimeout', () => {
    it('should return result when promise resolves within timeout', async () => {
      const promise = Promise.resolve('success');

      const result = await ExecutionTimer.executeWithTimeout(promise, 1000);

      expect(result.result).toBe('success');
      expect(result.timedOut).toBe(false);
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.executionTimeMs).toBeLessThan(100);
    });

    it('should measure execution time accurately', async () => {
      const delay = 50;
      const promise = new Promise((resolve) => setTimeout(resolve, delay));

      const result = await ExecutionTimer.executeWithTimeout(promise, 1000);

      expect(result.executionTimeMs).toBeGreaterThanOrEqual(delay - 10);
      expect(result.executionTimeMs).toBeLessThan(delay + 50);
    });

    it('should propagate non-timeout errors', async () => {
      const error = new Error('Custom error');
      const promise = Promise.reject(error);

      await expect(
        ExecutionTimer.executeWithTimeout(promise, 1000),
      ).rejects.toThrow('Custom error');
    });

    it('should handle very short timeouts', async () => {
      const promise = new Promise((resolve) => setTimeout(resolve, 100));

      const result = await ExecutionTimer.executeWithTimeout(promise, 1);

      expect(result.timedOut).toBe(true);
    });

    it('should handle immediate resolution', async () => {
      const promise = Promise.resolve('immediate');

      const result = await ExecutionTimer.executeWithTimeout(promise, 1000);

      expect(result.result).toBe('immediate');
      expect(result.timedOut).toBe(false);
      expect(result.executionTimeMs).toBeLessThan(10);
    });

    it('should handle zero timeout', async () => {
      const promise = new Promise((resolve) => setTimeout(resolve, 10));

      const result = await ExecutionTimer.executeWithTimeout(promise, 0);

      expect(result.timedOut).toBe(true);
    });

    it('should handle very long timeouts', async () => {
      const promise = Promise.resolve('fast');

      const result = await ExecutionTimer.executeWithTimeout(promise, 999999);

      expect(result.result).toBe('fast');
      expect(result.timedOut).toBe(false);
    });

    it('should return execution time even on timeout', async () => {
      const promise = new Promise((resolve) => setTimeout(resolve, 500));

      const result = await ExecutionTimer.executeWithTimeout(promise, 100);

      expect(result.timedOut).toBe(true);
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(95);
    });

    it('should handle promise that resolves exactly at timeout', async () => {
      const timeout = 100;
      const promise = new Promise((resolve) => setTimeout(resolve, timeout));

      const result = await ExecutionTimer.executeWithTimeout(promise, timeout);

      expect(result.executionTimeMs).toBeGreaterThanOrEqual(timeout - 10);
    });

    it('should handle multiple concurrent executions', async () => {
      const promise1 = Promise.resolve('first');
      const promise2 = Promise.resolve('second');
      const promise3 = new Promise((resolve) => setTimeout(resolve, 200));

      const [result1, result2, result3] = await Promise.all([
        ExecutionTimer.executeWithTimeout(promise1, 1000),
        ExecutionTimer.executeWithTimeout(promise2, 1000),
        ExecutionTimer.executeWithTimeout(promise3, 100),
      ]);

      expect(result1.result).toBe('first');
      expect(result1.timedOut).toBe(false);
      expect(result2.result).toBe('second');
      expect(result2.timedOut).toBe(false);
      expect(result3.timedOut).toBe(true);
    });

    it('should clean up timer on successful completion', async () => {
      const promise = Promise.resolve('done');

      const result = await ExecutionTimer.executeWithTimeout(promise, 1000);

      expect(result.result).toBe('done');
      await new Promise((resolve) => setTimeout(resolve, 1100));
    });

    it('should handle null result correctly', async () => {
      const promise = Promise.resolve(null);

      const result = await ExecutionTimer.executeWithTimeout(promise, 1000);

      expect(result.result).toBeNull();
      expect(result.timedOut).toBe(false);
    });
  });
});
