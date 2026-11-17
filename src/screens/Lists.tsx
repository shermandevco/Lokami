import { useState } from 'react'
import { useStore, rows, upsert, remove, curSpace, type Item, type ItemKind, type Route } from '../store'
import { t } from '../lib/i18n'
import { fmtDay } from '../lib/dates'
import { tap } from '../lib/native'
import type { Key } from '../i18n/en'

interface Cfg { kind: ItemKind; title: Key; ph: Key; open: Key; done: Key; em: string; rating?: boolean; forUser?: boolean; doneVerb?: Key; feed?: boolean; hint?: Key; empty?: Key }
const CFG: Partial<Record<Route, Cfg>> = {
  movies: { kind: 'movie', title: 'movies', ph: 'movie_ph', open: 'to_watch', done: 'watched', em: '🎬', rating: true },
  wishes: { kind: 'wish', title: 'wishes', ph: 'wish_ph', open: 'wishes', done: 'wish_got', em: '🎁' },
  dreams: { kind: 'dream', title: 'dreams', ph: 'dream_ph', open: 'dreams', done: 'dream_done', em: '🗺️' },
  dates: { kind: 'date', title: 'dates', ph: 'date_ph', open: 'dates', done: 'date_done', em: '🌹', rating: true },
  coupons: { kind: 'coupon', title: 'coupons', ph: 'coupon_ph', open: 'coupons', done: 'coupon_used', em: '🎟️', forUser: true, doneVerb: 'coupon_use' },
  notes: { kind: 'note', title: 'notes', ph: 'note_ph', open: 'notes', done: 'notes', em: '💌', feed: true, empty: 'notes_empty' },
}
const Stars = ({ v, on }: { v: number | null; on: (n: number) => void }) => <span className="row" style={{ gap: 0 }}>{[1, 2, 3, 4, 5].map(n => <button key={n} aria-label={'★' + n} onClick={() => on(n)} style={{ fontSize: 16, padding: '0 2px', opacity: (v || 0) >= n ? 1 : .25 }}>★</button>)}</span>

export function ListScreen({ route }: { route: Route }) {
  const c = CFG[route]!, s = useStore(), sp = curSpace(s)!, me = s.profile!.id, multi = sp.members.length > 1
  const list = rows('items', s.cur, s).filter(i => i.kind === c.kind), [title, setTitle] = useState(''), [who, setWho] = useState<string>('')
  const member = (id: string | null) => sp.members.find(m => m.id === id)
  const add = (e: React.FormEvent) => { e.preventDefault(); if (!title.trim()) return; tap(); upsert('items', crypto.randomUUID(), { kind: c.kind, title: title.trim(), note: null, done: false, rating: null, for_user: c.forUser ? (who || null) : null, data: {}, deleted_at: null }); setTitle('') }
  const row = (i: Item) => { const by = member(i.created_by), forU = member(i.for_user)
    return <div key={i.id} className={'item' + (i.done && !c.feed ? ' done' : '')}>
      {!c.feed && !c.doneVerb && <button className={'check' + (i.done ? ' on' : '')} aria-pressed={i.done} aria-label={t(c.done)} onClick={() => { tap(); upsert('items', i.id, { done: !i.done }) }}>✓</button>}
      <span className="grow"><span className="title" style={{ display: 'block', fontWeight: 600, whiteSpace: c.feed ? 'pre-wrap' : undefined }}>{i.title}</span>
        <span className="sm mut">{[multi && by ? t('by', by.a + ' ' + by.n) : '', forU ? '→ ' + forU.a + ' ' + forU.n : '', c.feed ? fmtDay(i.edited_at.slice(0, 10)) : ''].filter(Boolean).join(' · ')}</span></span>
      {c.rating && i.done && <Stars v={i.rating} on={n => upsert('items', i.id, { rating: n })} />}
      {c.doneVerb && !i.done && (i.for_user === me || !i.for_user) && <button className="btn sm" onClick={() => { tap(); upsert('items', i.id, { done: true }) }}>{t(c.doneVerb)}</button>}
      <button className="x" aria-label={t('delete')} onClick={() => remove('items', i.id)}>×</button></div> }
  const open = list.filter(i => !i.done || c.feed).sort((a, b) => (c.feed ? b.edited_at.localeCompare(a.edited_at) : a.edited_at.localeCompare(b.edited_at))), done = c.feed ? [] : list.filter(i => i.done).sort((a, b) => b.edited_at.localeCompare(a.edited_at))
  return <div className="page">
    <div className="head"><h1>{t(c.title)}</h1></div>
    <form className="col" onSubmit={add}><div className="row">{c.feed ? <textarea className="inp grow" style={{ minHeight: 70, padding: 12 }} placeholder={t(c.ph)} value={title} maxLength={300} onChange={e => setTitle(e.target.value)} />
      : <input className="inp grow" placeholder={t(c.ph)} value={title} maxLength={300} onChange={e => setTitle(e.target.value)} />}<button className="btn" disabled={!title.trim()}>{t('add')}</button></div>
      {c.forUser && multi && <div className="chips"><span className="sm mut" style={{ alignSelf: 'center' }}>{t('coupon_for')}:</span>{sp.members.filter(m => m.id !== me).map(m => <button type="button" key={m.id} className={'chip' + (who === m.id ? ' on' : '')} onClick={() => setWho(who === m.id ? '' : m.id)}>{m.a} {m.n}</button>)}</div>}
    </form>
    {!list.length ? <div className="empty"><b>{c.em}</b>{c.empty ? t(c.empty) : ''}</div> : <>
      {open.length > 0 && <div className="card" style={{ padding: '4px 16px' }}>{open.map(row)}</div>}
      {done.length > 0 && <><p className="cap">{t(c.done)} · {done.length}</p><div className="card" style={{ padding: '4px 16px' }}>{done.map(row)}</div></>}</>}
  </div>
}
export const LIST_ROUTES = Object.keys(CFG) as Route[]
