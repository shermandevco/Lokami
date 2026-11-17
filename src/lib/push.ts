import { sb } from './supabase'
import { getState } from '../store'
const b64 = (s: string) => { const p = '='.repeat((4 - (s.length % 4)) % 4), r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, c => c.charCodeAt(0)) }
export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
export function registerSW() { if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {}) }
/** Ask permission, subscribe this device and save it so the server can reach it while the app is closed. */
export async function enablePush(): Promise<'ok' | 'denied' | 'unsupported' | 'error'> {
  if (!pushSupported()) return 'unsupported'
  if ((await Notification.requestPermission()) !== 'granted') return 'denied'
  try {
    const { data: key, error } = await sb.rpc('vapid_public'); if (error || !key) return 'error'
    const reg = await navigator.serviceWorker.ready
    const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(key as string) }))
    const j = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
    const { error: e2 } = await sb.from('push_subscriptions').upsert({ endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, lang: getState().lang })
    return e2 ? 'error' : 'ok'
  } catch { return 'error' }
}
export async function pushEnabled() { if (!pushSupported() || Notification.permission !== 'granted') return false; const r = await navigator.serviceWorker.getRegistration(); return !!(await r?.pushManager.getSubscription()) }
