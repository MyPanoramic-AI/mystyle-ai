import dotenv from 'dotenv';
import path from 'node:path';
import { labDirectory, loadConfig } from './config.js';
import { createApp } from './http/app.js';
import { JobService } from './jobs/service.js';
import { FileStore } from './storage/files.js';

dotenv.config({ path: path.join(labDirectory(), '.env') });

const config = loadConfig();
const files = new FileStore(path.join(config.dataDir, 'images'));
const jobs = new JobService({
  config,
  files,
  now: () => Date.now(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  fetchImpl: globalThis.fetch,
});

await jobs.init();
const app = createApp({ config, jobs });
app.listen(config.port, config.host, () => {
  console.log(`Try-on lab listening on http://${config.host}:${config.port}`);
  console.log(config.allowLive ? 'Live provider calls are enabled.' : 'Live provider calls are disabled.');
  if (!config.token) console.log('TRYON_LAB_TOKEN is not set. API submissions are disabled.');
});
