import { useEffect, type ReactNode } from 'react'
export function Sheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }; window.addEventListener('keydown', k); document.body.style.overflow = 'hidden'; return () => { window.removeEventListener('keydown', k); document.body.style.overflow = '' } }, [onClose])
  return <div className="scrim" onClick={e => { if (e.target === e.currentTarget) onClose() }}><div className="sheet" role="dialog" aria-modal="true"><div className="grab" />{children}</div></div>
}
