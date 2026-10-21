import { parentPort, workerData } from 'node:worker_threads';
import { openDatabase } from '../src/db.js';
import { reserveCredits } from '../src/domain/membership.js';

const db = openDatabase(workerData.databasePath as string);
try {
  const result = reserveCredits(db, {
    userId: workerData.userId as string,
    amount: 8,
    idempotencyKey: 'race-worker',
    operationType: 'text',
    featureKey: 'account.basic',
    provider: 'mock',
    reason: 'Concurrent reservation',
  }, Date.parse('2026-10-16T12:00:00.000Z'));
  parentPort?.postMessage({ ok: true, balance: result.balance });
} catch (error) {
  parentPort?.postMessage({ ok: false, code: error instanceof Error && 'code' in error ? String((error as { code: unknown }).code) : 'failed' });
} finally {
  db.close();
}
