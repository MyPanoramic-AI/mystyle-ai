/**
 * Browser Web Push helpers — register SW, subscribe, and in-app fallback alerts.
 */

const INAPP_ENDPOINT_KEY = 'istyleu_inapp_push_endpoint';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

function applicationServerKey(vapidPublicKey: string): BufferSource {
  const bytes = urlBase64ToUint8Array(vapidPublicKey);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export function webPushSupported(): boolean {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window;
}

export function isPushServiceUnavailableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || '');
  const lower = message.toLowerCase();
  return lower.includes('push service not available')
    || lower.includes('registration failed - permission denied')
    || (lower.includes('registration failed') && lower.includes('abort'));
}

export async function ensurePushServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!webPushSupported()) {
    throw new Error('This browser does not support push notifications.');
  }
  let registration = await navigator.serviceWorker.getRegistration('/');
  if (!registration) {
    registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  }
  await navigator.serviceWorker.ready;
  if (registration.installing) {
    await new Promise<void>((resolve, reject) => {
      const worker = registration!.installing;
      if (!worker) {
        resolve();
        return;
      }
      const onState = () => {
        if (worker.state === 'installed' || worker.state === 'activated') {
          worker.removeEventListener('statechange', onState);
          resolve();
        } else if (worker.state === 'redundant') {
          worker.removeEventListener('statechange', onState);
          reject(new Error('Service worker failed to install.'));
        }
      };
      worker.addEventListener('statechange', onState);
    });
  }
  return registration;
}

export async function subscribeBrowserPush(vapidPublicKey: string): Promise<PushSubscription> {
  const registration = await ensurePushServiceWorker();
  await navigator.serviceWorker.ready;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }
  const current = await registration.pushManager.getSubscription();
  if (current) return current;
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey(vapidPublicKey),
  });
}

/** Device-local alert channel when the browser has no Web Push / FCM service. */
export async function subscribeInAppPushFallback(): Promise<{
  endpoint: string;
  keys: { p256dh: string; auth: string };
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    throw new Error('This browser does not support notifications.');
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }
  // Best-effort SW so showNotification works from the page context too.
  if ('serviceWorker' in navigator) {
    try {
      await ensurePushServiceWorker();
    } catch {
      // Notifications can still use `new Notification(...)`.
    }
  }
  let endpoint = localStorage.getItem(INAPP_ENDPOINT_KEY);
  if (!endpoint) {
    const id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : `d${Date.now().toString(36)}`;
    endpoint = `inapp://device/${id}`;
    localStorage.setItem(INAPP_ENDPOINT_KEY, endpoint);
  }
  return {
    endpoint,
    keys: {
      p256dh: 'inapp-p256dh-placeholder',
      auth: 'inapp-auth-placeholder',
    },
  };
}

export function getStoredInAppEndpoint(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(INAPP_ENDPOINT_KEY);
}

export function clearStoredInAppEndpoint(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(INAPP_ENDPOINT_KEY);
}

export async function unsubscribeBrowserPush(): Promise<boolean> {
  if (!webPushSupported()) return false;
  const registration = await navigator.serviceWorker.getRegistration('/');
  if (!registration) return false;
  const current = await registration.pushManager.getSubscription();
  if (!current) return false;
  await current.unsubscribe();
  return true;
}

export function subscriptionToJson(subscription: PushSubscription): {
  endpoint: string;
  keys: { p256dh: string; auth: string };
} {
  const json = subscription.toJSON();
  return {
    endpoint: json.endpoint || subscription.endpoint,
    keys: {
      p256dh: json.keys?.p256dh || '',
      auth: json.keys?.auth || '',
    },
  };
}

export async function showLocalAlert(alert: {
  title: string;
  body: string;
  url?: string;
  tag?: string | null;
}): Promise<void> {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const tag = alert.tag || 'istyleu';
  try {
    const registration = await navigator.serviceWorker?.getRegistration('/');
    if (registration?.showNotification) {
      await registration.showNotification(alert.title, {
        body: alert.body,
        tag,
        data: { url: alert.url || '/' },
        renotify: true,
      });
      return;
    }
  } catch {
    // Fall through to page Notification.
  }
  const note = new Notification(alert.title, {
    body: alert.body,
    tag,
  });
  note.onclick = () => {
    window.focus();
    if (alert.url) window.location.assign(alert.url);
    note.close();
  };
}
