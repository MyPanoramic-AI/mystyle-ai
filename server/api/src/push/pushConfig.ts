/**
 * Web Push (VAPID) configuration.
 */

export interface PushConfig {
  enabled: boolean;
  publicKey: string | null;
  privateKey: string | null;
  subject: string;
  cronSecret: string | null;
}

export function loadPushConfig(env: NodeJS.ProcessEnv = process.env): PushConfig {
  const publicKey = env.VAPID_PUBLIC_KEY?.trim() || null;
  const privateKey = env.VAPID_PRIVATE_KEY?.trim() || null;
  const subject = env.VAPID_SUBJECT?.trim() || 'mailto:No-Reply@mypanoramic.com';
  const cronSecret = env.PUSH_CRON_SECRET?.trim() || env.CRON_SECRET?.trim() || null;
  return {
    enabled: Boolean(publicKey && privateKey),
    publicKey,
    privateKey,
    subject,
    cronSecret,
  };
}
