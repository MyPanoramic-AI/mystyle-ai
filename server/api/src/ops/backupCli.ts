import path from 'node:path';
import dotenv from 'dotenv';
import { apiDirectory, loadConfig } from '../config.js';
import { createSqliteBackup, restoreBackup, verifyBackup, assertBackupPruneDisabled } from './backup.js';
import { logEvent } from '../errors.js';

dotenv.config({ path: path.join(apiDirectory(), '.env') });

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  if (!command || command === 'help' || command === '--help') {
    console.log('Usage: tsx server/api/src/ops/backupCli.ts <create|verify|restore|prune-check> [args]');
    console.log('  create');
    console.log('  verify <backupDir>');
    console.log('  restore <backupDir> <destinationDir>');
    console.log('  prune-check   (always fails; automatic prune is disabled)');
    process.exit(command ? 0 : 1);
  }

  if (command === 'prune-check') {
    try {
      assertBackupPruneDisabled();
    } catch (error) {
      logEvent('backup_prune_refused', { message: error instanceof Error ? error.message : 'refused' }, 'warn');
      process.exit(2);
    }
  }

  const config = loadConfig({ ...process.env, APP_ENV: process.env.APP_ENV ?? 'development' });

  if (command === 'create') {
    const result = await createSqliteBackup({
      databasePath: config.databasePath,
      mediaDir: config.mediaDir,
      backupRoot: config.backupDir,
    });
    logEvent('backup_created', { id: result.manifest.id, mediaCount: result.manifest.mediaCount, bytes: result.manifest.databaseBytes });
    console.log(result.backupDir);
    return;
  }

  if (command === 'verify') {
    const backupDir = rest[0];
    if (!backupDir || !path.isAbsolute(backupDir)) throw new Error('verify requires an absolute backup directory path.');
    const result = verifyBackup(backupDir);
    logEvent('backup_verified', { ok: result.ok, reasons: result.reasons.join('|') || 'none' });
    if (!result.ok) process.exit(1);
    return;
  }

  if (command === 'restore') {
    const backupDir = rest[0];
    const destinationDir = rest[1];
    if (!backupDir || !destinationDir || !path.isAbsolute(backupDir) || !path.isAbsolute(destinationDir)) {
      throw new Error('restore requires absolute backupDir and destinationDir.');
    }
    const result = restoreBackup({
      backupDir,
      destinationDir,
      migrationsDir: config.migrationsDir,
    });
    logEvent('backup_restored', { mediaRestored: result.mediaRestored, migrationsApplied: result.migrationsApplied.length });
    console.log(result.restoredDatabase);
    return;
  }

  throw new Error(`Unknown backup command: ${command}`);
}

main().catch((error) => {
  logEvent('backup_cli_failed', { message: error instanceof Error ? error.message : 'failed' }, 'error');
  process.exit(1);
});
