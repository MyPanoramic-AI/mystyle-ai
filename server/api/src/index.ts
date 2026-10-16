import path from 'node:path';
import dotenv from 'dotenv';
import { createServer } from 'node:http';
import { apiDirectory, loadConfig } from './config.js';
import { migrate, openDatabase } from './db.js';
import { RateLimiter } from './auth/rateLimit.js';
import { createApp } from './http/app.js';
import { logEvent } from './errors.js';

dotenv.config({ path: path.join(apiDirectory(), '.env') });
const config = loadConfig();
const db = openDatabase(config.databasePath);
migrate(db, config.migrationsDir);
const app = createApp({
  db,
  config,
  now: () => Date.now(),
  rateLimiter: new RateLimiter(config.authRateLimit, config.authRateWindowMs, () => Date.now()),
});
const server = createServer(app);
server.listen(config.port, config.host, () => {
  logEvent('api_listening', { port: config.port });
});
