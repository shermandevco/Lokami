import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { App } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
export const isNative = () => Capacitor.isNativePlatform()
/** Short tactile tick on key actions: native haptics in the app, vibration on Android web, nothing elsewhere. */
export function tap(): void { if (isNative()) void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}); else try { navigator.vibrate?.(8) } catch { /* unsupported */ } }
export function initNative(back: () => boolean) {
  if (!isNative()) return
  document.documentElement.classList.add('native')
  void App.addListener('backButton', () => { if (!back()) void App.exitApp() })
  const dark = () => document.documentElement.dataset.mode === 'dark'
  const paint = () => void StatusBar.setStyle({ style: dark() ? Style.Dark : Style.Light }).catch(() => {})
  paint(); new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] })
}
