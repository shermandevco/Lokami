import { useEffect, type RefObject } from 'react'
export interface DropTarget { icon: string; label: string; fn: (id: string) => void }
interface Opts { axis?: 'x'; targets?: (id: string) => DropTarget[] }
function bar(items: DropTarget[] | null) {
  let b = document.getElementById('dropbar') as (HTMLDivElement & { _items?: DropTarget[] }) | null
  if (!b) { b = document.createElement('div'); b.id = 'dropbar'; document.body.appendChild(b) }
  b._items = items || []; b.innerHTML = ''
  b._items.forEach(x => { const d = document.createElement('div'); d.textContent = x.icon + ' ' + x.label; b!.appendChild(d) })
  b.classList.toggle('on', !!b._items.length)
}
function barHit(x: number, y: number): DropTarget | null {
  const b = document.getElementById('dropbar') as (HTMLDivElement & { _items?: DropTarget[] }) | null
  if (!b || !b.classList.contains('on')) return null
  let hit: DropTarget | null = null
  ;[...b.children].forEach((c, i) => { const r = c.getBoundingClientRect(), h = x >= r.left - 8 && x <= r.right + 8 && y >= r.top - 14 && y <= r.bottom + 30; c.classList.toggle('hot', h); if (h) hit = b._items![i] })
  return hit
}
/**
 * Long-press (touch, 350 ms) or plain drag (mouse) to reorder the children of `ref` that carry data-id.
 * The DOM is moved live with FLIP animation; on drop the original order is restored and `onDone`
 * receives the new id order so React re-renders from state.
 */
export function useSortable(ref: RefObject<HTMLElement>, onDone: (ids: string[]) => void, opts: Opts = {}, dep: unknown = null) {
  useEffect(() => {
    const box = ref.current; if (!box) return
    const kids = () => [...box.children].filter(c => (c as HTMLElement).dataset.id) as HTMLElement[]
    const ctx = (e: Event) => { if ((e.target as HTMLElement).closest('[data-id]')) e.preventDefault() }
    const down = (e: PointerEvent) => {
      if (e.button) return
      const t = e.target as HTMLElement; if (t.closest('input,textarea,select')) return
      let it = t.closest('[data-id]') as HTMLElement | null
      while (it && it.parentElement !== box) it = it.parentElement ? (it.parentElement.closest('[data-id]') as HTMLElement | null) : null
      if (!it) return
      const item = it, mouse = e.pointerType === 'mouse', sx = e.clientX, sy = e.clientY, original = kids()
      let px = sx, py = sy, active = false, timer = 0, raf = 0, scroll = 0, gx = 0, gy = 0, ended = false
      const place = () => { item.style.transform = 'none'; const r = item.getBoundingClientRect(); item.style.transform = `translate(${px - gx - r.left}px,${py - gy - r.top}px) scale(1.03)` }
      const flip = (fn: () => void) => { const sib = kids().filter(c => c !== item), before = new Map(sib.map(c => [c, c.getBoundingClientRect()])); fn(); sib.forEach(c => { const a = before.get(c)!, b = c.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top; if (!dx && !dy) return; c.style.transition = 'none'; c.style.transform = `translate(${dx}px,${dy}px)`; requestAnimationFrame(() => { c.style.transition = 'transform 280ms cubic-bezier(.2,.8,.2,1)'; c.style.transform = '' }) }) }
      const hit = () => { for (const c of kids()) { if (c === item) continue; const r = c.getBoundingClientRect(); if (px >= r.left && px <= r.right && py >= r.top && py <= r.bottom) { const wide = !opts.axis && r.width > r.height * 1.6, after = wide ? py > r.top + r.height / 2 : px > r.left + r.width / 2, refNode = after ? c.nextSibling : c; if (refNode !== item && item.nextSibling !== refNode) flip(() => box.insertBefore(item, refNode)); return } } }
      const start = () => { if (ended) return; active = true; const r = item.getBoundingClientRect(); gx = px - r.left; gy = py - r.top; kids().forEach(c => (c.style.animation = 'none')); item.classList.add('dragging'); document.body.classList.add('nosel'); if (opts.axis) { const sl = box.scrollLeft; box.style.scrollSnapType = 'none'; box.scrollLeft = sl } try { navigator.vibrate?.(12) } catch { /* unsupported */ } if (opts.targets) bar(opts.targets(item.dataset.id!)); place() }
      const tick = () => { raf = 0; if (!active) return; place(); if (!barHit(px, py)) hit(); place() }
      const move = (ev: PointerEvent) => { px = ev.clientX; py = ev.clientY; if (!active) { if (Math.hypot(px - sx, py - sy) > (mouse ? 6 : 9)) { if (mouse) start(); else finish(false) } return }
        if (!raf) raf = requestAnimationFrame(tick); clearInterval(scroll)
        if (opts.axis) { if (px < 48 || px > innerWidth - 48) { const d = px < 48 ? -1 : 1; scroll = window.setInterval(() => { box.scrollLeft += d * 10; place(); hit(); place() }, 16) } }
        else if (py < 64 || py > innerHeight - 64) { const d = py < 64 ? -1 : 1; scroll = window.setInterval(() => { window.scrollBy(0, d * 12); place() }, 16) } }
      const touch = (ev: TouchEvent) => { if (active && ev.cancelable) ev.preventDefault() }
      const finish = (ok: boolean) => { if (ended) return; ended = true; clearTimeout(timer); clearInterval(scroll); if (raf) cancelAnimationFrame(raf)
        removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', cancel); document.removeEventListener('touchmove', touch)
        if (!active) return
        const target = ok ? barHit(px, py) : null; bar(null)
        const stop = (ev: Event) => { ev.stopPropagation(); ev.preventDefault() }; addEventListener('click', stop, true); setTimeout(() => removeEventListener('click', stop, true), 80)
        const ids = kids().map(c => c.dataset.id!), id = item.dataset.id!
        kids().forEach(c => { c.style.transition = ''; c.style.transform = '' }); item.classList.remove('dragging'); document.body.classList.remove('nosel'); if (opts.axis) box.style.scrollSnapType = ''
        original.forEach(c => box.appendChild(c))            // hand the DOM back to React in its last rendered order
        ;[...box.children].filter(c => !(c as HTMLElement).dataset.id).forEach(c => box.appendChild(c))
        if (target) target.fn(id); else if (ok) onDone(ids) }
      const up = () => finish(true), cancel = () => finish(false)
      if (!mouse) timer = window.setTimeout(start, 350)
      addEventListener('pointermove', move, { passive: true }); addEventListener('pointerup', up); addEventListener('pointercancel', cancel); document.addEventListener('touchmove', touch, { passive: false })
    }
    box.addEventListener('pointerdown', down); box.addEventListener('contextmenu', ctx)
    return () => { box.removeEventListener('pointerdown', down); box.removeEventListener('contextmenu', ctx) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, dep])
}
