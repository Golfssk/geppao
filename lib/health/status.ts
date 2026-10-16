/** Public availability only. Never return database errors, credentials or catalog counts. */
export type HealthResult = {
  status: 'ok' | 'degraded' | 'error';
  checks: {environment: boolean; database: boolean};
  code?: 'NOT_CONFIGURED' | 'DEPENDENCY_UNAVAILABLE';
};
type Options = {
  isConfigured: () => boolean;
  probe: (signal: AbortSignal) => Promise<boolean>;
  timeoutMs?: number;
  now?: () => number;
};
export function createHealthCheck({isConfigured, probe, timeoutMs = 3000, now = Date.now}: Options) {
  let cached: {body: HealthResult; expires: number} | undefined;
  let pending: Promise<HealthResult> | undefined;
  return async function check(): Promise<HealthResult> {
    if (!isConfigured()) return {status: 'error', checks: {environment: false, database: false}, code: 'NOT_CONFIGURED'};
    if (cached && now() < cached.expires) return cached.body;
    if (pending) return pending;
    pending = (async () => {
      const controller = new AbortController();
      let timer: ReturnType<typeof setTimeout> | undefined;
      let ok = false;
      try {
        // Race also bounds a dependency that ignores AbortSignal.
        ok = await Promise.race([
          Promise.resolve().then(() => probe(controller.signal)),
          new Promise<boolean>(resolve => {timer = setTimeout(() => {controller.abort(); resolve(false);}, timeoutMs);}),
        ]);
      } catch { /* Deliberately do not serialize or log raw dependency errors. */ }
      finally {clearTimeout(timer); controller.abort();}
      const body: HealthResult = ok === true
        ? {status: 'ok', checks: {environment: true, database: true}}
        : {status: 'degraded', checks: {environment: true, database: false}, code: 'DEPENDENCY_UNAVAILABLE'};
      // Process-local coalescing/cache reduces probe load; NOT a distributed rate limiter.
      cached = {body, expires: now() + (ok === true ? 10_000 : 2_000)};
      return body;
    })();
    try {return await pending;} finally {pending = undefined;}
  };
}
