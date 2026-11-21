// Lokami 2.0 service worker: offline app shell (network first) and push notifications.
const CACHE = 'lokami2-v6'
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => (k.startsWith('lokami2-') || /^lokami-v\d+$/.test(k)) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())))
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url)
  if (e.request.method !== 'GET' || u.origin !== location.origin) return
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)) } return r })
    .catch(() => caches.match(e.request).then(r => r || (e.request.mode === 'navigate' ? caches.match(new URL('./', self.registration.scope).href) : undefined))))
})
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {} } catch { d = { body: e.data && e.data.text() } }
  e.waitUntil(self.registration.showNotification(d.title || 'Lokami', { body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png', tag: d.tag, renotify: true, data: { route: d.route, space: d.space } }))
})
self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = new URL('./', self.registration.scope); const d = e.notification.data || {}
  if (d.route) url.hash = d.route + (d.space ? ':' + d.space : '')
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => { const c = cs.find(x => x.url.startsWith(self.registration.scope)); if (c) { c.focus(); c.postMessage({ open: url.hash }) } else self.clients.openWindow(url.href) }))
})
