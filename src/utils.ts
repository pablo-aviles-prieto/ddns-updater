export const timestamp = () =>
  new Date().toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier?: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig,
  operationName: string
): Promise<T> {
  const { maxAttempts, delayMs, backoffMultiplier = 1.5 } = config;
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[${operationName}] Attempt ${attempt}/${maxAttempts}`);
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.error(
        `[${operationName}] Attempt ${attempt}/${maxAttempts} failed:`,
        error instanceof Error ? error.message : error
      );

      if (attempt < maxAttempts) {
        const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
        console.log(`[${operationName}] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw new Error(`[${operationName}] Failed after ${maxAttempts} attempts: ${lastError!.message}`);
}
