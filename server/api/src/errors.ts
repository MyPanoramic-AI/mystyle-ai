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

export function logEvent(event: string, fields: Record<string, string | number | boolean> = {}): void {
  console.log(JSON.stringify({ level: 'info', event, ...fields }));
}
