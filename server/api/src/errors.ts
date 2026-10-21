export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function publicError(error: unknown): { code: string; message: string; status: number } {
  if (error instanceof ApiError) return { code: error.code, message: error.message, status: error.status };
  return { code: 'internal_error', message: 'The request could not be completed.', status: 500 };
}

type LogLevel = 'info' | 'warn' | 'error';

const SENSITIVE_KEY = /(password|token|secret|api[_-]?key|authorization|cookie|session|measurement|photograph|conversation)/i;

function scrubFields(fields: Record<string, string | number | boolean | null | undefined>): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    if (SENSITIVE_KEY.test(key)) {
      out[key] = '[redacted]';
      continue;
    }
    out[key] = value;
  }
  return out;
}

export function logEvent(
  event: string,
  fields: Record<string, string | number | boolean | null | undefined> = {},
  level: LogLevel = 'info',
): void {
  const line = JSON.stringify({ level, event, at: new Date().toISOString(), ...scrubFields(fields) });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}
