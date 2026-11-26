/**
 * Browser Web Push helpers — register SW, subscribe, and talk to the API.
 */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export function webPushSupported(): boolean {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window;
}

export async function ensurePushServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!webPushSupported()) {
    throw new Error('This browser does not support push notifications.');
  }
  const existing = await navigator.serviceWorker.getRegistration('/');
  if (existing) return existing;
  return navigator.serviceWorker.register('/sw.js', { scope: '/' });
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
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
  });
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
