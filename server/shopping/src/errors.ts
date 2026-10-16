export class ShoppingError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ShoppingError';
  }
}

export function publicError(error: unknown): { code: string; message: string; status: number } {
  if (error instanceof ShoppingError) {
    return { code: error.code, message: error.message, status: error.status };
  }
  return { code: 'internal_error', message: 'The shopping lab could not complete that request.', status: 500 };
}
