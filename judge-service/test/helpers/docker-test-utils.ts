/**
 * Docker Test Utilities
 * 
 * Helper functions for E2E tests to handle Docker container lifecycle properly.
 * These utilities address common issues with async container cleanup.
 * 
 * Note: This file uses `any` types for Docker-related parameters to avoid adding
 * dockerode as a dependency to this utility file. When using these functions,
 * import Docker from 'dockerode' in your test files and pass the properly typed instance.
 * 
 * Example usage:
 * ```typescript
 * import Docker from 'dockerode';
 * import { waitForContainerCleanup } from './helpers/docker-test-utils';
 * 
 * const docker = new Docker();
 * const cleaned = await waitForContainerCleanup(docker, 'python:3.9-slim-time');
 * ```
 */

/**
 * Wait for Docker containers to be cleaned up.
 * 
 * This function polls Docker to check if containers with a specific image
 * have been removed. It's necessary because Docker cleanup is asynchronous
 * and checking immediately after execution may show containers that are
 * in the process of being removed.
 * 
 * @param docker - Docker instance from dockerode (typed as any to avoid dependency)
 * @param imageName - Image name to filter containers by (e.g., 'python:3.9-slim-time')
 * @param maxAttempts - Maximum number of polling attempts (default: 10)
 * @param delayMs - Delay in milliseconds between attempts (default: 500)
 * @returns Promise<boolean> - true if cleaned up, false if timeout
 */
export async function waitForContainerCleanup(
  docker: any, // Docker from 'dockerode'
  imageName: string,
  maxAttempts: number = 10,
  delayMs: number = 500,
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const containers = await docker.listContainers({ all: true });
    const testContainers = containers.filter((c: any) =>
      c.Image.includes(imageName),
    );

    if (testContainers.length === 0) {
      return true;
    }

    // Wait before next attempt
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return false;
}

/**
 * Clean up all test containers.
 * 
 * This function forcefully removes all containers matching test images.
 * Should be called in afterAll hooks to ensure clean test environment.
 * 
 * @param docker - Docker instance from dockerode (typed as any to avoid dependency)
 * @param imageNames - Array of image names to clean up
 */
export async function cleanupTestContainers(
  docker: any, // Docker from 'dockerode'
  imageNames: string[],
): Promise<void> {
  const containers = await docker.listContainers({ all: true });
  const testContainers = containers.filter((c: any) =>
    imageNames.some((imageName) => c.Image.includes(imageName)),
  );

  await Promise.all(
    testContainers.map(async (container: any) => {
      try {
        const c = docker.getContainer(container.Id);
        try {
          await c.stop({ t: 0 }); // Force stop immediately
        } catch (error) {
          // Container might already be stopped
        }
        await c.remove({ force: true });
      } catch (error) {
        // Container might already be removed
        console.warn(
          `Failed to clean up container ${container.Id}:`,
          error.message,
        );
      }
    }),
  );

  // Give Docker time to complete cleanup
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

/**
 * Wait for a condition with timeout.
 * 
 * Generic utility to poll for a condition with exponential backoff.
 * 
 * @param condition - Function that returns true when condition is met
 * @param timeoutMs - Maximum time to wait in milliseconds
 * @param intervalMs - Initial interval between checks in milliseconds
 * @returns Promise<boolean> - true if condition met, false if timeout
 */
export async function waitFor(
  condition: () => Promise<boolean>,
  timeoutMs: number = 10000,
  intervalMs: number = 500,
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (await condition()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return false;
}
