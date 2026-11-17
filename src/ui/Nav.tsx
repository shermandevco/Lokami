import { useState } from 'react'
import { useStore, go, curSpace, rows, upsert, home, toast, type Route } from '../store'
import { t } from '../lib/i18n'
import { today } from '../lib/dates'
import { tap } from '../lib/native'
import { spaceName, spaceIcon } from '../lib/space'
import { MODULES, fits } from '../lib/modules'
import { dayId } from '../lib/me'
import { NewTask } from '../screens/Tasks'
import { EventEdit } from '../screens/Planner'
import { ExpenseEdit, pickCur } from '../screens/Budget'
import { MoodPicker } from '../screens/Mood'
import { Sheet } from './Sheet'
import { unread } from '../screens/Feed'

const P: Record<string, string> = {
  hub: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  today: 'M12 3v2M12 19v2M5 12H3M21 12h-2M6.3 6.3 4.9 4.9M19.1 19.1l-1.4-1.4M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  all: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  profile: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  plus: 'M12 5v14M5 12h14',
}
const Ico = ({ d }: { d: string }) => <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>
const CORE = ['hub', 'today', 'profile', 'feed']
export const isOn = (route: Route, r: Route) => route === r || (r === 'all' && !CORE.includes(route))

/** Bottom bar on phones, sidebar on desktop. The + opens one sheet for every quick action. */
export function Nav() {
  const s = useStore(), [add, setAdd] = useState(false)
  const b = (r: Route) => <button className={isOn(s.route, r) ? 'on' : ''} aria-label={r === 'hub' ? 'Lokami' : r === 'all' ? t('all_modules') : t(r as 'today')} onClick={() => { tap(); go(r) }}><Ico d={P[r]} /></button>
  return <>
    <nav className="nav">{b('hub')}{b('today')}<button className="plus" aria-label={t('add')} onClick={() => { tap(); setAdd(true) }}><Ico d={P.plus} /></button>{b('all')}{b('profile')}</nav>
    <Side onAdd={() => setAdd(true)} />
    {add && <QuickAdd onClose={() => setAdd(false)} />}
  </>
}

function Side({ onAdd }: { onAdd: () => void }) {
  const s = useStore(), sp = curSpace(s), me = s.profile!, n = unread(s)
  const recent = (s.recent || []).map(r => MODULES.find(m => m.id === r)).filter((m): m is typeof MODULES[number] => !!m && !!sp && fits(m, sp.type, !!me.adult)).slice(0, 5)
  const lnk = (r: Route, em: string, label: string, extra?: string) => <button key={r} className={'lnk' + (isOn(s.route, r) && (r !== 'all' || !recent.some(m => m.id === s.route)) ? ' on' : '')} onClick={() => go(r)}><span>{em}</span><span className="grow" style={{ width: 'auto', textAlign: 'left', fontSize: 15 }}>{label}</span>{extra && <span className="pill" style={{ width: 'auto', fontSize: 11 }}>{extra}</span>}</button>
  return <aside className="side" aria-label="Lokami">
    <div className="brand"><span className="logo" />Lokami</div>
    {lnk('hub', sp ? spaceIcon(sp) : '🏠', sp ? spaceName(sp) : 'Lokami')}
    {lnk('today', '☀️', t('today'))}
    {lnk('feed', '🔔', t('feed'), n ? String(Math.min(99, n)) : undefined)}
    {lnk('all', '🧩', t('all_modules'))}
    <button className="lnk add" onClick={onAdd}>＋ {t('add')}</button>
    {recent.length > 0 && <><span className="cap">{t('recent')}</span>{recent.map(m => <button key={m.id} className={'lnk' + (s.route === m.id ? ' on' : '')} onClick={() => go(m.id as Route)}><span>{m.em}</span>{t(m.label)}</button>)}</>}
    <button className="foot lnk" onClick={() => go('profile')} style={{ marginTop: 'auto' }}><span className="av" style={{ width: 36, height: 36, fontSize: 18 }}>{me.a}</span><b className="ell">{me.n}</b></button>
  </aside>
}

type Q = '' | 'task' | 'event' | 'expense' | 'shop' | 'mood' | 'note'
/** One place for every quick entry, so nothing needs more than two taps from anywhere. */
function QuickAdd({ onClose }: { onClose: () => void }) {
  const s = useStore(), sp = curSpace(s)!, shared = sp.type !== 'solo', [q, setQ] = useState<Q>(''), [text, setText] = useState('')
  const water = () => { const id = dayId(s.profile!.id, today()), cur = s.db.health_logs[id]; upsert('health_logs', id, { day: today(), water: ((cur?.water as number) || 0) + 1, deleted_at: null }, home(s)); tap(); toast('💧 +1'); onClose() }
  const items: [Q | 'water', string, string, string][] = [
    ['task', '✅', t('task_new'), 'var(--mint)'], ['event', '🗓️', t('event_new'), 'var(--sky)'], ['expense', '💸', t('expense_new'), 'var(--lime)'],
    ...(shared ? [['shop', '🛒', t('shopping'), 'var(--sun)'] as [Q, string, string, string], ['note', '💌', t('notes'), 'var(--pink)'] as [Q, string, string, string]] : []),
    ['mood', '🙂', t('mood'), 'var(--peach)'], ['water', '💧', t('water').split(',')[0] + ' +1', 'var(--sky)'],
  ]
  if (q === 'task') return <NewTask onClose={onClose} />
  if (q === 'event') return <EventEdit onClose={onClose} />
  if (q === 'expense') return <ExpenseEdit cur={pickCur(s.lang)} onClose={onClose} />
  return <Sheet onClose={onClose}>
    {!q && <><h2>{t('add')}</h2><div className="quick">{items.map(([k, em, l, c]) => <button key={k} style={{ '--c': c } as React.CSSProperties} onClick={() => { tap(); if (k === 'water') water(); else setQ(k as Q) }}><span>{em}</span>{l}</button>)}</div></>}
    {q === 'mood' && <><h2>{t('mood_q')}</h2><MoodPicker /><button className="btn" onClick={onClose}>{t('done')}</button></>}
    {(q === 'shop' || q === 'note') && <form className="col" onSubmit={e => { e.preventDefault(); if (!text.trim()) return
      if (q === 'shop') upsert('shopping_items', crypto.randomUUID(), { title: text.trim(), qty: null, done: false, deleted_at: null })
      else upsert('items', crypto.randomUUID(), { kind: 'note', title: text.trim(), note: null, done: false, rating: null, for_user: null, data: {}, deleted_at: null })
      tap(); toast('✓'); onClose() }}>
      <h2>{q === 'shop' ? t('shopping') : t('notes')}</h2>
      {q === 'shop' ? <input className="inp" autoFocus placeholder={t('shop_placeholder')} value={text} maxLength={120} onChange={e => setText(e.target.value)} />
        : <textarea className="inp" autoFocus style={{ minHeight: 100 }} placeholder={t('note_ph')} value={text} maxLength={300} onChange={e => setText(e.target.value)} />}
      <div className="row"><button className="btn" disabled={!text.trim()}>{t('add')}</button><button type="button" className="btn ghost" onClick={() => setQ('')}>{t('cancel')}</button></div>
      {q === 'shop' && <p className="sm mut">{rows('shopping_items', s.cur, s).filter(x => !x.done).length} · {t('shopping')}</p>}</form>}
  </Sheet>
}
