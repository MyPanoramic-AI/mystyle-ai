import path from 'node:path';
import dotenv from 'dotenv';
import { createServer } from 'node:http';
import { apiDirectory, loadConfig } from './config.js';
import { migrate, openDatabase } from './db.js';
import { RateLimiter } from './auth/rateLimit.js';
import { createApp } from './http/app.js';
import { logEvent } from './errors.js';
import { summarizeEnvironment } from './ops/environment.js';

dotenv.config({ path: path.join(apiDirectory(), '.env') });

let config;
try {
  config = loadConfig();
} catch (error) {
  logEvent('config_failed', { message: error instanceof Error ? error.message : 'invalid_config' }, 'error');
  process.exit(1);
}

logEvent('api_starting', {
  appEnv: config.appEnv,
  host: config.host,
  port: config.port,
  secureCookie: config.secureCookie,
  trustProxy: config.trustProxy,
  serveStatic: Boolean(config.staticDir),
  ...summarizeEnvironment(config.appEnv),
});

let db;
try {
  db = openDatabase(config.databasePath);
  const applied = migrate(db, config.migrationsDir);
  logEvent('database_ready', { migrationsApplied: applied.length });
} catch (error) {
  logEvent('database_failed', { message: error instanceof Error ? error.message : 'database_error' }, 'error');
  process.exit(1);
}

const app = createApp({
  db,
  config,
  now: () => Date.now(),
  rateLimiter: new RateLimiter(config.authRateLimit, config.authRateWindowMs, () => Date.now()),
});
const server = createServer(app);
server.listen(config.port, config.host, () => {
  logEvent('api_listening', { port: config.port, host: config.host, appEnv: config.appEnv });
});
