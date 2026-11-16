import { useEffect } from 'react'
import { useStore, markSeen, getState, type State } from '../store'
import { t } from '../lib/i18n'
import { fmtDay, today } from '../lib/dates'
import { spaceName } from '../lib/space'
import type { Key } from '../i18n/en'

export interface FeedItem { id: string; at: string; who: string; space: string; key: Key; text: string }
/** Recent changes made by other people in my shared spaces (personal data never appears: it lives in my personal space). */
export function feed(s: State, days = 14): FeedItem[] {
  const me = s.profile?.id, from = new Date(Date.now() - days * 864e5).toISOString(), shared = new Set(s.spaces.filter(x => x.type !== 'solo').map(x => x.id)), out: FeedItem[] = []
  const add = (r: { id: string; created_by: string | null; edited_at: string; space_id: string; deleted_at?: string | null }, key: Key, text: string) => {
    if (r.deleted_at || !r.created_by || r.created_by === me || !shared.has(r.space_id) || r.edited_at < from) return
    out.push({ id: r.id, at: r.edited_at, who: r.created_by, space: r.space_id, key, text })
  }
  Object.values(s.db.tasks).forEach(r => add(r, r.done ? 'ev_task_done' : 'ev_task', r.title))
  Object.values(s.db.events).forEach(r => add(r, 'ev_event', r.title + ' · ' + fmtDay(r.day)))
  Object.values(s.db.shopping_items).forEach(r => add(r, r.done ? 'ev_shop_done' : 'ev_shop', r.title))
  Object.values(s.db.answers).forEach(r => add(r, 'ev_answer', ''))
  return out.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 80)
}
export const unread = (s: State) => feed(s).filter(f => f.at > (s.lastSeen || '')).length

export function Feed() {
  const s = useStore(), items = feed(s), seen = getState().lastSeen
  useEffect(() => () => markSeen(), [])
  const person = (id: string) => s.spaces.flatMap(x => x.members).find(m => m.id === id)
  let lastDay = ''
  return <div className="page">
    <div className="head"><h1>{t('feed')}</h1></div>
    {!items.length ? <div className="empty"><b>🔔</b>{t('feed_empty')}</div> : <div className="card" style={{ padding: '4px 16px' }}>{items.map(f => {
      const d = f.at.slice(0, 10), head = d !== lastDay; lastDay = d; const p = person(f.who), sp = s.spaces.find(x => x.id === f.space)
      return <div key={f.id + f.key}>{head && <p className="cap" style={{ padding: '12px 0 4px' }}>{d === today() ? t('today') : fmtDay(d)}</p>}
        <div className="item"><span className="av">{p?.a || '🙂'}</span><span className="grow"><span style={{ display: 'block' }}><b>{p?.n || '—'}</b> {t(f.key)}{f.at > seen && <span className="pill" style={{ marginLeft: 6 }}>{t('new_badge')}</span>}</span>
          <span className="sm mut ell" style={{ display: 'block' }}>{[f.text, s.spaces.length > 2 ? spaceName(sp) : ''].filter(Boolean).join(' · ')}</span></span>
          <span className="sm mut num">{new Date(f.at).toLocaleTimeString(document.documentElement.lang, { hour: '2-digit', minute: '2-digit' })}</span></div></div> })}</div>}
  </div>
}
