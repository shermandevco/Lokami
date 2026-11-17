import { createRoot } from 'react-dom/client'
import './styles/app.css'
import { App } from './App'
import { boot, getState, go, switchSpace, type Route } from './store'
import { registerSW } from './lib/push'
createRoot(document.getElementById('root')!).render(<App />)
void boot()
import('./lib/native').then(n => n.initNative(() => { if (getState().route === 'hub') return false; go('hub'); return true }))
if (!(window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()) registerSW()
// open the screen a notification points to: #route or #route:spaceId
const openHash = (h: string) => { const [r, sp] = h.replace('#', '').split(':'); if (!r) return; if (sp) switchSpace(sp); go(r as Route); history.replaceState(null, '', location.pathname) }
navigator.serviceWorker?.addEventListener('message', e => e.data?.open && openHash(e.data.open))
setTimeout(() => openHash(location.hash), 600)
