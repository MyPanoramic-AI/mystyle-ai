import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 32;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, KEY_LENGTH, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, key] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !key) return false;
  const actual = scryptSync(password, Buffer.from(salt, 'base64url'), KEY_LENGTH, { N: 16384, r: 8, p: 1 });
  const expected = Buffer.from(key, 'base64url');
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function assertPassword(password: unknown): string {
  if (typeof password !== 'string' || password.length < 12 || password.length > 200) {
    throw new Error('short');
  }
  return password;
}
