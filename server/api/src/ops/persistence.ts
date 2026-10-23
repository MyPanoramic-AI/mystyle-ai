/**
 * Classify whether the API data directory is expected to survive process restarts.
 * On Render Free (no disk), SQLite and media under the app tree are wiped on spin-down.
 */

export type DataPersistence = 'persistent' | 'ephemeral' | 'local';

export function classifyDataPersistence(input: {
  dataDir: string;
  apiDataDirEnv?: string | null;
  onRender?: boolean;
}): DataPersistence {
  const onRender = input.onRender === true;
  const explicit = (input.apiDataDirEnv ?? '').trim();
  const dir = input.dataDir.replace(/\\/g, '/');

  if (onRender) {
    // Blueprint disk mounts at /var/data; only paths under that mount survive deploys/spin-down.
    if (explicit.startsWith('/var/data') || dir === '/var/data' || dir.startsWith('/var/data/')) {
      return 'persistent';
    }
    return 'ephemeral';
  }

  return 'local';
}
