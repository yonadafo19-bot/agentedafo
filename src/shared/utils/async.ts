/**
 * Utilidades para operaciones asíncronas
 */

/**
 * Espera un tiempo determinado
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Ejecuta una función con reintentos
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    backoff?: boolean;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoff = true,
    onRetry,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxAttempts) {
        const delay = backoff ? delayMs * attempt : delayMs;
        onRetry?.(attempt, lastError);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Ejecuta múltiples promesas en lotes
 */
export async function batch<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }

  return results;
}

/**
 * Ejecuta con timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError = new Error('Operation timed out')
): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(timeoutError), timeoutMs);
  });

  return Promise.race([
    promise.finally(() => clearTimeout(timeoutHandle)),
    timeoutPromise,
  ]);
}

/**
 * Debounce asíncrono
 */
export function debounceAsync<T extends unknown[]>(
  fn: (...args: T) => Promise<void>,
  delayMs: number
): (...args: T) => Promise<void> {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  return (...args: T) => {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }

    return new Promise((resolve, reject) => {
      timeoutHandle = setTimeout(async () => {
        try {
          await fn(...args);
          resolve();
        } catch (error) {
          reject(error);
        }
      }, delayMs);
    });
  };
}

/**
 * Throttle asíncrono
 */
export function throttleAsync<T extends unknown[]>(
  fn: (...args: T) => Promise<void>,
  limitMs: number
): (...args: T) => Promise<void> {
  let lastRun = 0;
  let pendingPromise: Promise<void> | null = null;

  return async (...args: T) => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRun;

    if (timeSinceLastRun >= limitMs) {
      lastRun = now;
      return fn(...args);
    }

    if (pendingPromise) {
      return pendingPromise;
    }

    pendingPromise = new Promise((resolve) => {
      setTimeout(async () => {
        try {
          await fn(...args);
          resolve();
        } finally {
          pendingPromise = null;
        }
      }, limitMs - timeSinceLastRun);
    });

    return pendingPromise;
  };
}

/**
 * Memoiza una función asíncrona
 */
export function memoizeAsync<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  keyFn?: (...args: T) => string,
  ttlMs = 60000
): (...args: T) => Promise<R> {
  const cache = new Map<string, { value: R; expiry: number }>();

  return async (...args: T): Promise<R> => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    const cached = cache.get(key);

    if (cached && cached.expiry > Date.now()) {
      return cached.value;
    }

    const value = await fn(...args);
    cache.set(key, { value, expiry: Date.now() + ttlMs });

    return value;
  };
}
