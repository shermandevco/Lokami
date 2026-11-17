import { useRef, useState, useEffect } from 'react'
import { type Route, rows, useStore, curSpace, spaceTasks, setLayout, go, switchSpace, createSpace, joinSpace, toast, editTask, upsert, home, type SpaceType } from '../store'
import { tap } from '../lib/native'
import { toggleHabit } from './Habits'
import { t, tn } from '../lib/i18n'
import { today, diffDays, weekday, fmtFull, fmtDay, weekStart, num } from '../lib/dates'
import { spaceName, spaceIcon } from '../lib/space'
import { Sheet } from '../ui/Sheet'
import { useSortable } from '../ui/useSortable'
import { MOOD_FACE } from '../lib/me'
import { MODULES, fits, onHome } from '../lib/modules'
import { money, byCategory } from '../lib/money'
import { pickCur } from './Budget'
import { carStatus } from './Garage'
import { milestones, daysUntil } from '../lib/milestones'
import { questionFor, questionText } from '../lib/questions'
import { unread } from './Feed'
import { sortTasks, dueLabel } from './Tasks'

const TILES = MODULES.map(m => m.id)


const CARDS = ['today', 'together', 'invite'] as const
const order = <T extends string>(saved: string[] | undefined, all: readonly T[]) => [...(saved || []).filter((x): x is T => (all as readonly string[]).includes(x)), ...all.filter(x => !(saved || []).includes(x))]

export function Hub() {
  const s = useStore(), sp = curSpace(s), lay = s.layouts[s.cur] || {}, tasks = spaceTasks(s), me = s.profile!
  const open = tasks.filter(x => !x.done).sort(sortTasks), now = today(), todayTasks = open.filter(x => x.due && x.due <= now)
  const [pick, setPick] = useState(false), [dot, setDot] = useState(0)
  const car = useRef<HTMLDivElement>(null), grid = useRef<HTMLDivElement>(null)
  const shown = order(lay.cards, CARDS).filter(c => c === 'today' || (sp && sp.type !== 'solo'))
  const sizes = lay.sizes || {}, hidden = lay.hidden || [], tiles = order(lay.tiles, TILES).filter(x => { const m = MODULES.find(y => y.id === x)!; return fits(m, sp?.type || 'solo', !!me.adult) && onHome(m, lay) })
  useSortable(car, ids => setLayout({ cards: ids }), { axis: 'x' }, s.cur)
  const sz = (v: 's' | 'w' | 'l', icon: string) => ({ icon, label: v.toUpperCase(), fn: (id: string) => setLayout({ sizes: { ...sizes, [id]: v } }) })
  useSortable(grid, ids => setLayout({ tiles: ids }), { targets: () => [sz('s', '▫️'), sz('w', '▭'), sz('l', '⬜'), { icon: '🙈', label: t('hide'), fn: (id: string) => { const m = MODULES.find(y => y.id === id); if (m && !m.home) setLayout({ added: (lay.added || []).filter(x => x !== id) }); else setLayout({ hidden: [...hidden, id] }) } }] }, s.cur)
  useEffect(() => { const el = car.current; if (!el) return; const f = () => setDot(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))); el.addEventListener('scroll', f, { passive: true }); return () => el.removeEventListener('scroll', f) }, [])
  if (!sp) return null
  const days = sp.since ? diffDays(sp.since, now) + 1 : 0, hr = new Date().getHours()
  const hello = t(hr < 12 ? 'hello_morning' : hr < 18 ? 'hello_day' : 'hello_evening', me.n)
  const stop = (e: React.SyntheticEvent) => e.stopPropagation()
  const pop = (e: React.SyntheticEvent) => { const el = (e.currentTarget as HTMLElement).closest('.tile') as HTMLElement | null; if (el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop') } tap() }

  const card = (c: typeof CARDS[number], i: number) => {
    const cls = 'cc c' + (i % 4)
    if (c === 'today') return <div key={c} data-id={c} className={cls} onClick={() => go('today')}><span className="up">{weekday(new Date())}</span><h3>{todayTasks.length ? tn('tasks_info_left', todayTasks.length) : t('nothing_today')}</h3>{todayTasks.slice(0, 2).map(x => <div key={x.id} className="line ell">{x.title}</div>)}<span className="deco">☀️</span></div>
    if (c === 'together') { const ms = milestones(sp.since, now, 1)[0], party = ms && ms.day === now, label = ms && (ms.kind === 'years' ? t('anniv', ms.n) : t('days_n', num(ms.n)))
      return <div key={c} data-id={c} className={cls + (party ? ' party' : '')}><span className="up">{t('together_for')}</span>{days > 0 ? <><div className="big num">{num(days)}</div><div style={{ fontWeight: 700 }}>{tn('day', days)} · {fmtFull(sp.since)}</div>
        {ms && <div className="line" style={{ marginTop: 'auto' }}>{party ? '🎉 ' + t('milestone_today', label) : label + ' — ' + tn('in_days', daysUntil(ms, now))}</div>}</> : <h3>{t('set_date')}</h3>}<span className="deco">{party ? '🎉' : spaceIcon(sp)}</span>{party && <div className="confetti" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ left: (i * 7 + 3) + '%', animationDelay: (i % 5) * 120 + 'ms' }} />)}</div>}</div> }
    return <div key={c} data-id={c} className={cls}><span className="up">{t('invite_title')}</span><div className="code">{sp.code}</div><button className="btn sm ghost" style={{ marginTop: 'auto' }} onClick={() => { navigator.clipboard?.writeText(sp.code).then(() => toast(t('copied'))).catch(() => {}) }}>{t('copy')}</button><span className="deco">💌</span></div>
  }
  const extraSub = (id: string) => { const its = rows('items', s.cur, s), k = ({ movies: 'movie', wishes: 'wish', dreams: 'dream', notes: 'note', coupons: 'coupon', dates: 'date' } as Record<string, string>)[id]
    if (k) { const o = its.filter(i => i.kind === k && (k === 'note' || !i.done)); return k === 'note' ? (o.sort((a, b) => b.edited_at.localeCompare(a.edited_at))[0]?.title || '') : String(o.length || '') }
    if (id === 'status') { const x = rows('statuses', s.cur, s).filter(z => z.created_by !== me.id); return x.length ? x.length + ' 🟢' : '' }
    return '' }
  const sub = (id: string): string => {
    const hs = rows('habits', s.cur, s).filter(x => !x.archived), lg = rows('habit_logs', s.cur, s), md = s.db.moods[me.id + ':' + now], pg = s.db.diary_pages[me.id + ':' + now]
    switch (id) {
      case 'planner': { const up = Object.values(s.db.events).filter(e => e.space_id === s.cur && !e.deleted_at && e.day === now); return up.length ? up.map(e => (e.time ? e.time + ' ' : '') + e.title).join(' · ') : t('day_empty') }
      case 'habits': return hs.length ? t('habits_today', hs.filter(x => lg.some(l => l.habit_id === x.id && l.day === now && l.done)).length, hs.length) : t('habit_new')
      case 'mood': return md && !md.deleted_at ? MOOD_FACE[md.score] + ' ' + t(('mood_' + md.score) as 'mood_1') : t('mood_q')
      case 'checkin': return s.db.checkins[sp.id + ':' + weekStart(now) + ':' + me.id] ? '✓ ' + t('ci_week', fmtDay(weekStart(now))) : t('checkin_sub')
      case 'insights': return t('insights_sub')
      case 'year': return (sp.type === 'solo' ? t('my_year') : t('our_year')) + ' ' + now.slice(0, 4)
      case 'budget': { const cur = pickCur(s.lang), m = byCategory(rows('expenses', s.cur, s), now.slice(0, 7), cur).reduce((a, [, v]) => a + v, 0); return money(m, cur) }
      case 'garage': { const cs = rows('cars', s.cur, s); if (!cs.length) return t('car_new'); const st = carStatus(cs[0], rows('car_logs', s.cur, s)); return cs[0].name + (st.serviceLeft != null ? ' · ' + (st.serviceLeft <= 0 ? '⚠️ ' + t('service_due') : t('next_service', num(st.serviceLeft))) : '') }
      case 'goals': { const gs = rows('goals', s.cur, s); return gs.length ? gs.slice(0, 2).map(g => g.icon + ' ' + g.title).join(' · ') : t('goal_new') }
      case 'health': { const x = s.db.health_logs[me.id + ':' + now]; return x ? [x.sleep != null && '😴 ' + x.sleep, x.steps != null && '👟 ' + num(x.steps), x.weight != null && '⚖️ ' + x.weight].filter(Boolean).join('  ') || t('health_hint').split('.')[0] : t('health_hint').split('.')[0] }
      case 'quit': { const q = rows('items', s.cur, s).filter(i => i.kind === 'quit'); return q.length ? q.slice(0, 2).map(i => i.title + ' · ' + Math.floor((Date.now() - new Date((i.data as { since: string }).since).getTime()) / 864e5) + ' ' + t('days_short')).join('\n') : t('quit_new') }
      case 'diary': return pg?.body.trim() ? pg.body.trim().slice(0, 60) : t('diary_write')
      case 'people': return tn('people_info', sp.members.length)
      default: return extraSub(id)
    }
  }
  const tile = (id: string) => {
    const mod = MODULES.find(m => m.id === id)!, def = ({ tasks: 'w', question: 'w', mood: 'w', habits: 'w' } as Record<string, string>)[id] || 's', size = sizes[id] || def, big = size !== 's'
    const style = { '--c': mod.color } as React.CSSProperties, openIt = () => go(id as Route)
    const wrap = (body: React.ReactNode, cls = '') => <div key={id} data-id={id} role="button" tabIndex={0} className={'tile tap ' + size + ' ' + cls} style={style} onClick={openIt} onKeyDown={e => e.key === 'Enter' && openIt()}>{body}</div>
    const evToday = Object.values(s.db.events).filter(e => e.space_id === s.cur && !e.deleted_at && e.day === now).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'))
    const doneToday = tasks.filter(x => x.done && x.edited_at.slice(0, 10) === now)
    if (id === 'tasks') return wrap(<><span className="k">{t('tasks')}</span><b>{open.length ? tn('tasks_info_left', open.length) : t('tasks_all_done') + ' 🎉'}</b>
      <div className="tl" onClick={stop}>{evToday.slice(0, big ? 2 : 1).map(e => <div key={e.id} className="ev" onClick={() => go('planner')}><time>{e.time || '•'}</time><span className="ell">{e.title}</span></div>)}{open.slice(0, size === 'l' ? 7 : big ? 4 : 2).map(x => { const w = x.assignee ? sp.members.find(m => m.id === x.assignee) : null
        return <div key={x.id} className="t" onClick={e => { pop(e); editTask(x.id, { done: true }); toast('✓ ' + x.title) }}><span className="mini-check">✓</span><span className="ell">{x.title}</span>{w && <span className="who">{w.a}</span>}</div> })}{doneToday.slice(0, big ? 3 : 1).map(x => <div key={x.id} className="t done" onClick={e => { pop(e); editTask(x.id, { done: false }) }}><span className="mini-check">✓</span><span className="ell">{x.title}</span></div>)}</div>
      {!open.length && !evToday.length && <span className="em">✅</span>}</>)
    if (id === 'mood') { const mid = me.id + ':' + now, md = s.db.moods[mid], cur = md && !md.deleted_at ? md.score : 0
      return wrap(<><span className="k">{t('mood')}</span><b>{cur ? t(('mood_' + cur) as 'mood_1') : t('mood_q')}</b>
        <div className="qrow" onClick={stop}>{[1, 2, 3, 4, 5].map(n => <button key={n} className={cur === n ? 'on' : ''} aria-label={t(('mood_' + n) as 'mood_1')} onClick={e => { pop(e); upsert('moods', mid, { day: now, score: n, tags: md?.tags || [], note: md?.note || null, deleted_at: null }, home(s)) }}>{MOOD_FACE[n]}</button>)}</div></>) }
    if (id === 'water') { const hid = me.id + ':' + now, h = s.db.health_logs[hid], w = (h?.water as number) || 0
      return wrap(<><span className="k">{t('water_t')}</span><div className="v num">{w}<small style={{ fontSize: 18 }}>/8</small></div>
        <div className="drops">{Array.from({ length: 8 }, (_, i) => <i key={i} className={i < w ? 'on' : ''} />)}</div>
        <button className="go" aria-label="+1" onClick={e => { stop(e); pop(e); upsert('health_logs', hid, { day: now, water: w + 1, deleted_at: null }, home(s)); if (w + 1 === 8) toast('💧 🎉') }}>+</button></>) }
    if (id === 'habits') { const hs = rows('habits', s.cur, s).filter(x => !x.archived).sort((a, b) => a.sort - b.sort), lg = rows('habit_logs', s.cur, s), done = (hid: string) => lg.some(l => l.habit_id === hid && l.day === now && l.done)
      const n = hs.filter(x => done(x.id)).length, pct = hs.length ? n / hs.length : 0
      return wrap(<><span className="k">{t('habits')}</span><div className="row" style={{ gap: 8 }}><svg className="ring" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="14" fill="none" stroke="var(--surface)" strokeWidth="6" /><circle cx="18" cy="18" r="14" fill="none" stroke="#1d1a16" strokeWidth="6" strokeDasharray={`${pct * 88} 88`} strokeLinecap="round" transform="rotate(-90 18 18)" /></svg><b>{hs.length ? `${n}/${hs.length}` : t('habit_new')}</b></div>
        {big && hs.length > 0 && <div className="hchips" onClick={stop}>{hs.slice(0, 6).map(h => { const on = done(h.id); return <button key={h.id} className={on ? 'on' : ''} onClick={e => { pop(e); toggleHabit(h, now, !on, s.cur) }}>{h.icon} {h.title}</button> })}</div>}</>) }
    if (id === 'question') { const q = questionFor(sp.id, now, sp.since), mine = s.db.answers[sp.id + ':' + now + ':' + me.id]
      return wrap(<><span className="k">{t('question')}</span><b style={{ fontSize: 21, maxWidth: 'calc(100% - 56px)', marginTop: 4 }}>{questionText(q)}</b><span className="pill" style={{ alignSelf: 'flex-start', marginTop: 'auto' }}>{mine ? '✓ ' + t('answer_edit') : t('answer_send') + ' →'}</span><span className="em">💬{!mine && <i />}</span></>) }
    if (id === 'shopping') { const left = rows('shopping_items', s.cur, s).filter(x => !x.done)
      return wrap(<><span className="k">{t('shopping')}</span><div className="v num">{left.length}</div><small className="ell">{left.length ? left.slice(0, 3).map(x => x.title).join(', ') : t('shop_empty')}</small>
        {big && <div className="tl" onClick={stop}>{left.slice(0, size === 'l' ? 7 : 3).map(x => <div key={x.id} className="t" onClick={e => { pop(e); upsert('shopping_items', x.id, { done: true }) }}><span className="mini-check">✓</span><span className="ell">{x.title}</span></div>)}</div>}<span className="em">🛒</span></>) }
    if (id === 'people') return wrap(<><span className="k">{t('people')}</span><b>{tn('people_info', sp.members.length)}</b>{big && <ul>{sp.members.slice(0, 8).map(m => <li key={m.id}>{m.a} {m.n}</li>)}</ul>}<span className="em">{spaceIcon(sp)}</span></>)
    return wrap(<><span className="k">{t(mod.label)}</span><b className="ell" style={{ whiteSpace: 'normal', maxWidth: 'calc(100% - 52px)' }}>{sub(id) || t('open')}</b><span className="em">{mod.em}</span></>)
  }
  const word = hello.split(' ').pop()!
  return <div className="page wide">
    <div className="head">
      <button className="switch" onClick={() => setPick(true)}><span className="duo">{sp.members.slice(0, 3).map(m => <span key={m.id}>{m.a}</span>)}</span><span className="ell">{spaceName(sp)}</span><i>▾</i></button>
      <button className="icon bell" aria-label={t('feed')} onClick={() => go('feed')}>🔔{unread(s) > 0 && <b>{Math.min(99, unread(s))}</b>}</button>
    </div>
    <h1 className="hello">{hello.slice(0, hello.length - word.length)}<mark>{word}</mark></h1>
    <div className="car" ref={car}>{shown.map(card)}</div>
    {shown.length > 1 && <div className="dots">{shown.map((c, i) => <i key={c} className={i === dot ? 'on' : ''} />)}</div>}
    <div className="grid" ref={grid}>{tiles.map(tile)}</div>
    <div className="row" style={{ justifyContent: 'center' }}><button className="btn ghost sm" onClick={() => go('all')}>🧩 {t('all_modules')}</button></div>
    <p className="sm mut" style={{ textAlign: 'center' }}>{t('hold_tip')}</p>
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
