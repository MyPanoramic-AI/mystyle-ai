export class LabError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly retryable = false,
  ) {
    super(message);
    this.name = 'LabError';
  }
}

export function redact(value: string, secrets: string[]): string {
  let out = value;
  for (const secret of secrets) {
    if (secret.length >= 4) {
      out = out.split(secret).join('[redacted]');
    }
  }
  return out;
}

export function publicErrorMessage(error: unknown, secrets: string[]): string {
  const raw = error instanceof Error ? error.message : 'The request failed.';
  return redact(raw, secrets).slice(0, 300);
}
