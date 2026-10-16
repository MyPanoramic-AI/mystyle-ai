import dotenv from 'dotenv';
import path from 'node:path';
import { openCatalogue } from './catalogue.js';
import { loadConfig, shoppingDirectory } from './config.js';
import { createConnectors } from './connectors/registry.js';
import { createApp } from './http/app.js';

dotenv.config({ path: path.join(shoppingDirectory(), '.env') });

const config = loadConfig();
const connectors = createConnectors();
const catalogue = openCatalogue(config.databasePath, () => Date.now(), config.freshMs);

if (catalogue.countActive() === 0) {
  for (const connector of connectors) {
    if (connector.mode !== 'mock') continue;
    catalogue.importRecords(connector.id, 'connector', connector.listProducts(), 'upsert');
  }
}

const app = createApp({
  catalogue,
  connectors,
  token: config.token,
  host: config.host,
});

app.listen(config.port, config.host, () => {
  console.log(`Shopping lab listening on http://${config.host}:${config.port}`);
  console.log(`Mock connectors: ${connectors.filter((connector) => connector.mode === 'mock').length}. Verified live connectors: 0.`);
  if (!config.token) console.log('SHOPPING_LAB_TOKEN is not set. API submissions are disabled.');
});
