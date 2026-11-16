import { useRef, useState, useEffect } from 'react'
import { rows, useStore, curSpace, spaceTasks, setLayout, go, switchSpace, createSpace, joinSpace, toast, type SpaceType } from '../store'
import { t, tn } from '../lib/i18n'
import { today, diffDays, weekday, fmtFull, num } from '../lib/dates'
import { spaceName, spaceIcon } from '../lib/space'
import { Sheet } from '../ui/Sheet'
import { useSortable } from '../ui/useSortable'
import { MOOD_FACE } from '../lib/me'
import { money, byCategory } from '../lib/money'
import { pickCur } from './Budget'
import { carStatus } from './Garage'
import { milestones, daysUntil } from '../lib/milestones'
import { questionFor, questionText } from '../lib/questions'
import { unread } from './Feed'
import { sortTasks, dueLabel } from './Tasks'

const TILES = ['question', 'tasks', 'shopping', 'planner', 'habits', 'mood', 'diary', 'budget', 'health', 'garage', 'goals', 'people', 'classic'] as const
const PERSONAL = ['habits', 'mood', 'diary', 'health']
const SHARED = ['question', 'shopping']
const CARDS = ['today', 'together', 'invite'] as const
const order = <T extends string>(saved: string[] | undefined, all: readonly T[]) => [...(saved || []).filter((x): x is T => (all as readonly string[]).includes(x)), ...all.filter(x => !(saved || []).includes(x))]

export function Hub() {
  const s = useStore(), sp = curSpace(s), lay = s.layouts[s.cur] || {}, tasks = spaceTasks(s)
  const open = tasks.filter(x => !x.done).sort(sortTasks), now = today(), todayTasks = open.filter(x => x.due && x.due <= now)
  const [pick, setPick] = useState(false), [dot, setDot] = useState(0)
  const car = useRef<HTMLDivElement>(null), grid = useRef<HTMLDivElement>(null)
  const shown = order(lay.cards, CARDS).filter(c => c === 'today' || (sp && sp.type !== 'solo'))
  const avail = order(lay.tiles, TILES).filter(x => sp?.type === 'solo' ? x !== 'people' && !SHARED.includes(x) : !PERSONAL.includes(x)), hidden = lay.hidden || [], tiles = avail.filter(x => !hidden.includes(x)), sizes = lay.sizes || {}
  const [mods, setMods] = useState(false)
  useSortable(car, ids => setLayout({ cards: ids }), { axis: 'x' }, s.cur)
  const sz = (v: 's' | 'w' | 'l', icon: string) => ({ icon, label: t('size') + ' ' + v.toUpperCase(), fn: (id: string) => setLayout({ sizes: { ...sizes, [id]: v } }) })
  useSortable(grid, ids => setLayout({ tiles: ids }), { targets: () => [sz('s', '▫️'), sz('w', '▭'), sz('l', '⬜'), { icon: '🙈', label: t('hide'), fn: (id: string) => setLayout({ hidden: [...hidden, id] }) }] }, s.cur)
  useEffect(() => { const el = car.current; if (!el) return; const f = () => setDot(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))); el.addEventListener('scroll', f, { passive: true }); return () => el.removeEventListener('scroll', f) }, [])
  if (!sp) return null
  const days = sp.since ? diffDays(sp.since, now) + 1 : 0

  const card = (c: typeof CARDS[number], i: number) => {
    const cls = 'cc c' + (i % 4)
    if (c === 'today') return <div key={c} data-id={c} className={cls}><span className="up">{weekday(new Date())}</span><h3>{todayTasks.length ? tn('tasks_info_left', todayTasks.length) : t('nothing_today')}</h3>{todayTasks.slice(0, 2).map(x => <div key={x.id} className="line ell">{x.title}</div>)}<span className="deco">☀️</span></div>
    if (c === 'together') { const ms = milestones(sp.since, now, 1)[0], party = ms && ms.day === now, label = ms && (ms.kind === 'years' ? t('anniv', ms.n) : t('days_n', num(ms.n)))
      return <div key={c} data-id={c} className={cls + (party ? ' party' : '')}><span className="up">{t('together_for')}</span>{days > 0 ? <><div className="big num">{num(days)}</div><div style={{ fontWeight: 700 }}>{tn('day', days)} · {fmtFull(sp.since)}</div>
        {ms && <div className="line" style={{ marginTop: 'auto' }}>{party ? '🎉 ' + t('milestone_today', label) : label + ' — ' + tn('in_days', daysUntil(ms, now))}</div>}</> : <h3>{t('set_date')}</h3>}<span className="deco">{party ? '🎉' : spaceIcon(sp)}</span>{party && <div className="confetti" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ left: (i * 7 + 3) + '%', animationDelay: (i % 5) * 120 + 'ms' }} />)}</div>}</div> }
    return <div key={c} data-id={c} className={cls}><span className="up">{t('invite_title')}</span><div className="code">{sp.code}</div><button className="btn sm ghost" style={{ marginTop: 'auto' }} onClick={() => { navigator.clipboard?.writeText(sp.code).then(() => toast(t('copied'))).catch(() => {}) }}>{t('copy')}</button><span className="deco">💌</span></div>
  }
  const tile = (id: typeof TILES[number]) => {
    const size = sizes[id] || (id === 'classic' ? 'w' : 's'), big = size !== 's'
    if (id === 'tasks') return <button key={id} data-id={id} className={'tile ' + size} onClick={() => go('tasks')}><b>{t('tasks')}</b><small>{open.length ? tn('tasks_info_left', open.length) : t('tasks_all_done')}</small>{big && <ul>{open.slice(0, size === 'l' ? 8 : 2).map(x => <li key={x.id}>{x.title}{x.due ? ' · ' + dueLabel(x.due) : ''}</li>)}</ul>}<span className="em">✅{todayTasks.length > 0 && <i />}</span></button>
    if (id === 'question') { const q = questionFor(sp.id, now, sp.since), mine = s.db.answers[sp.id + ':' + now + ':' + s.profile!.id]
      return <button key={id} data-id={id} className={'tile ' + (sizes[id] || 'w')} onClick={() => go('question')}><b>{t('question')}</b><small style={{ maxWidth: 'calc(100% - 56px)' }}>{questionText(q)}</small><span className="em">💬{!mine && <i />}</span></button> }
    if (id === 'shopping') { const left = rows('shopping_items', s.cur, s).filter(x => !x.done)
      return <button key={id} data-id={id} className={'tile ' + size} onClick={() => go('shopping')}><b>{t('shopping')}</b><small>{left.length ? tn('shop_left', left.length) : t('shop_empty')}</small>{big && <ul>{left.slice(0, size === 'l' ? 8 : 2).map(x => <li key={x.id}>{x.title}</li>)}</ul>}<span className="em">🛒</span></button> }
    if (id === 'people') return <button key={id} data-id={id} className={'tile ' + size} onClick={() => go('people')}><b>{t('people')}</b><small>{tn('people_info', sp.members.length)}</small>{big && <ul>{sp.members.slice(0, 8).map(m => <li key={m.id}>{m.a} {m.n}</li>)}</ul>}<span className="em">{spaceIcon(sp)}</span></button>
    const simple: Record<string, [string, string, string]> = { budget: ['budget', '💸', ''], health: ['health', '❤️', ''], garage: ['garage', '🚗', ''], goals: ['goals', '🎯', ''], planner: ['planner', '🗓️', ''], habits: ['habits', '🌱', ''], mood: ['mood', '🙂', ''], diary: ['diary', '📓', ''] }
    if (simple[id]) { const [r, em] = simple[id]; const hs = rows('habits', s.cur, s).filter(x => !x.archived), lg = rows('habit_logs', s.cur, s), md = s.db.moods[s.profile!.id + ':' + now], pg = s.db.diary_pages[s.profile!.id + ':' + now]
      const up = Object.values(s.db.events).filter(e => e.space_id === s.cur && !e.deleted_at && e.day === now)
      const sub = id === 'planner' ? (up.length ? up.map(e => (e.time ? e.time + ' ' : '') + e.title).join(' · ') : t('day_empty'))
        : id === 'habits' ? (hs.length ? t('habits_today', hs.filter(x => lg.some(l => l.habit_id === x.id && l.day === now && l.done)).length, hs.length) : t('habit_new'))
        : id === 'mood' ? (md && !md.deleted_at ? MOOD_FACE[md.score] + ' ' + t(('mood_' + md.score) as 'mood_1') : t('mood_q'))
        : id === 'budget' ? (() => { const cur = pickCur(s.lang), m = byCategory(rows('expenses', s.cur, s), now.slice(0, 7), cur).reduce((a, [, v]) => a + v, 0); return t('this_month') + ': ' + money(m, cur) })()
        : id === 'health' ? (() => { const x = s.db.health_logs[s.profile!.id + ':' + now]; return x ? [x.sleep != null && '😴 ' + x.sleep, x.water != null && '💧 ' + x.water, x.steps != null && '👟 ' + num(x.steps)].filter(Boolean).join('  ') || '—' : t('health_hint').split('.')[0] })()
        : id === 'garage' ? (() => { const cs = rows('cars', s.cur, s); if (!cs.length) return t('car_new'); const st = carStatus(cs[0], rows('car_logs', s.cur, s)); return cs[0].name + (st.serviceLeft != null ? ' · ' + (st.serviceLeft <= 0 ? '⚠️ ' + t('service_due') : t('next_service', num(st.serviceLeft))) : '') })()
        : id === 'goals' ? (() => { const gs = rows('goals', s.cur, s); return gs.length ? gs.slice(0, 2).map(g => g.icon + ' ' + g.title).join(' · ') : t('goal_new') })()
        : (pg?.body.trim() ? pg.body.trim().slice(0, 60) : t('diary_write'))
      return <button key={id} data-id={id} className={'tile ' + size} onClick={() => go(r as 'planner')}><b>{t(r as 'planner')}</b><small>{sub}</small><span className="em">{em}</span></button> }
    return <a key={id} data-id={id} className={'tile ' + size} href="../" style={{ textDecoration: 'none', color: 'inherit' }}><b>{t('open_classic')}</b><small>{t('classic')}</small><span className="em">🗂️</span></a>
  }
  return <div className="page">
    <div className="head">
      <button className="switch" onClick={() => setPick(true)}><span className="ell">{spaceName(sp)}</span><i>▾</i></button>
      <button className="icon bell" aria-label={t('feed')} onClick={() => go('feed')}>🔔{unread(s) > 0 && <b>{Math.min(99, unread(s))}</b>}</button>
    </div>
    <div className="car" ref={car}>{shown.map(card)}</div>
    {shown.length > 1 && <div className="dots">{shown.map((c, i) => <i key={c} className={i === dot ? 'on' : ''} />)}</div>}
    <div className="grid" ref={grid}>{tiles.map(tile)}</div>
    <div className="row" style={{ justifyContent: 'center' }}><button className="chip" onClick={() => setMods(true)}>⚙️ {t('modules')}{hidden.length ? ' · +' + hidden.length : ''}</button></div>
    <p className="sm mut" style={{ textAlign: 'center' }}>{t('hold_tip')}</p>
    {mods && <Sheet onClose={() => setMods(false)}><h2>{t('modules')}</h2><p className="sm mut">{t('modules_hint')}</p>
      <div className="chips">{avail.map(x => { const on = !hidden.includes(x); return <button key={x} aria-pressed={on} className={'chip' + (on ? ' on' : '')} onClick={() => setLayout({ hidden: on ? [...hidden, x] : hidden.filter(y => y !== x) })}>{on ? '✓ ' : ''}{x === 'classic' ? t('open_classic') : t(x as 'tasks')}</button> })}</div>
      <button className="btn" onClick={() => setMods(false)}>{t('done')}</button></Sheet>}
    {pick && <Spaces onClose={() => setPick(false)} />}
  </div>
}

function Spaces({ onClose }: { onClose: () => void }) {
  const s = useStore(), [mode, setMode] = useState<'' | 'new' | 'join'>('')
  const [type, setType] = useState<SpaceType>('couple'), [name, setName] = useState(''), [since, setSince] = useState(''), [code, setCode] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  async function create() { setBusy(true); const ok = await createSpace(type, name.trim(), since); setBusy(false); if (ok) onClose(); else setErr(t('err_net')) }
  async function join() { setBusy(true); const r = await joinSpace(code.trim().toUpperCase()); setBusy(false); if (!r) onClose(); else setErr(t(r === 'not_found' ? 'code_bad' : r === 'already' ? 'code_in' : r === 'full' ? 'code_full' : 'err_net')) }
  return <Sheet onClose={onClose}>
    {!mode && <><h2>{t('spaces')}</h2>
      <div className="card" style={{ padding: '4px 16px' }}>{s.spaces.map(x => <button key={x.id} className="item" style={{ width: '100%', textAlign: 'left' }} onClick={() => { switchSpace(x.id); onClose() }}>
        <span className="av">{spaceIcon(x)}</span><span className="grow"><b className="ell" style={{ display: 'block' }}>{spaceName(x)}</b><span className="sm mut">{tn('people_info', x.members.length)}</span></span>{x.id === s.cur && <span className="pill">✓</span>}</button>)}</div>
      <div className="row"><button className="btn" onClick={() => setMode('new')}>{t('new_space')}</button><button className="btn ghost" onClick={() => setMode('join')}>{t('join')}</button></div></>}
    {mode === 'new' && <><h2>{t('new_space')}</h2>
      <div className="chips">{(['couple', 'family', 'friends', 'mates'] as const).map(x => <button key={x} className={'chip' + (type === x ? ' on' : '')} onClick={() => setType(x)}>{t(('type_' + x) as 'type_couple')}</button>)}</div>
      <input className="inp" placeholder={t('space_name')} value={name} onChange={e => setName(e.target.value)} maxLength={40} />
      <label className="label">{t('since')}<input className="inp" type="date" value={since} max={today()} onChange={e => setSince(e.target.value)} /></label>
      {err && <p className="sm" style={{ color: 'var(--bad)' }}>{err}</p>}
      <div className="row"><button className="btn" disabled={busy} onClick={create}>{t('create')}</button><button className="btn ghost" onClick={() => setMode('')}>{t('cancel')}</button></div></>}
    {mode === 'join' && <><h2>{t('join')}</h2><p className="sm mut">{t('join_hint')}</p>
      <input className="inp" style={{ textTransform: 'uppercase', letterSpacing: '.2em', fontWeight: 800 }} value={code} onChange={e => setCode(e.target.value)} maxLength={8} autoFocus />
      {err && <p className="sm" style={{ color: 'var(--bad)' }}>{err}</p>}
      <div className="row"><button className="btn" disabled={busy || code.trim().length < 4} onClick={join}>{t('join')}</button><button className="btn ghost" onClick={() => setMode('')}>{t('cancel')}</button></div></>}
  </Sheet>
}
