/**
 * logger.ts — dev-only logging utility
 * 
 * All internal debug logs should use this instead of console.log.
 * In production builds (import.meta.env.PROD), all logs are silenced.
 * console.error is always allowed so real errors are visible in Sentry/Vercel.
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log('[TrimTime]', ...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info('[TrimTime]', ...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn('[TrimTime]', ...args);
  },
  /** Always logs — use for real errors only */
  error: (...args: unknown[]) => {
    console.error('[TrimTime]', ...args);
  },
};
