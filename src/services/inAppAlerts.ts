/**
 * Polls the account API for queued in-app alerts when Web Push / FCM is unavailable.
 */

import { accountApi } from './accountApi';
import { showLocalAlert } from './webPush';

let pollTimer: number | null = null;
let inFlight = false;

export async function drainPendingInAppAlerts(): Promise<number> {
  if (inFlight) return 0;
  inFlight = true;
  try {
    const { alerts } = await accountApi.pushPending();
    if (!alerts.length) return 0;
    for (const alert of alerts) {
      await showLocalAlert({
        title: alert.title,
        body: alert.body,
        url: alert.url,
        tag: alert.tag,
      });
    }
    await accountApi.pushPendingAck(alerts.map((alert) => alert.id));
    return alerts.length;
  } catch {
    return 0;
  } finally {
    inFlight = false;
  }
}

export function startInAppAlertPolling(intervalMs = 20_000): void {
  if (typeof window === 'undefined') return;
  stopInAppAlertPolling();
  void drainPendingInAppAlerts();
  pollTimer = window.setInterval(() => {
    if (document.visibilityState === 'hidden') return;
    void drainPendingInAppAlerts();
  }, intervalMs);
  document.addEventListener('visibilitychange', onVisible);
}

function onVisible(): void {
  if (document.visibilityState === 'visible') void drainPendingInAppAlerts();
}

export function stopInAppAlertPolling(): void {
  if (pollTimer != null) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
  document.removeEventListener('visibilitychange', onVisible);
}
