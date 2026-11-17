import { useEffect, useState } from 'react'
import { useStore, rows, upsert, remove, curSpace, home, type ItemKind, type Log } from '../store'
import { sb } from '../lib/supabase'
import { t, tn, getLang } from '../lib/i18n'
import { today, weekStart, fmtDay, diffDays, addDays, num } from '../lib/dates'
import { CHALLENGES } from '../lib/decks'
import { spaceName } from '../lib/space'
import { tap } from '../lib/native'
import { Sheet } from '../ui/Sheet'
import type { Key } from '../i18n/en'

const dur = (ms: number) => { const m = Math.max(0, Math.round(ms / 60000)); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min' }
function useNow(every = 1000) { const [n, setN] = useState(Date.now()); useEffect(() => { const i = setInterval(() => setN(Date.now()), every); return () => clearInterval(i) }, [every]); return n }

/* ---------- wheel ---------- */
export function Wheel() {
  const s = useStore(), [src, setSrc] = useState<ItemKind>('date'), [deg, setDeg] = useState(0), [win, setWin] = useState<string | null>(null)
  const opts = rows('items', s.cur, s).filter(i => i.kind === src && !i.done).slice(0, 12)
  const spin = () => { if (!opts.length) return; tap(); const k = Math.floor(Math.random() * opts.length), turn = deg + 360 * 5 + (360 - (k + .5) * (360 / opts.length)) - (deg % 360); setWin(null); setDeg(turn); setTimeout(() => { setWin(opts[k].title); tap() }, 3100) }
  const seg = 360 / Math.max(1, opts.length), colors = ['#e6336e', '#4f6bed', '#2f9e7a', '#d9774a', '#7c5cff', '#e8a80c']
  return <div className="page">
    <div className="head"><h1>{t('wheel')}</h1></div>
    <div className="label">{t('wheel_from')}<div className="chips">{(['date', 'movie', 'dream'] as const).map(k => <button key={k} className={'chip' + (src === k ? ' on' : '')} onClick={() => { setSrc(k); setWin(null) }}>{t((k === 'date' ? 'dates' : k + 's') as Key)}</button>)}</div></div>
    {!opts.length ? <div className="empty"><b>🎡</b>{t('wheel_empty')}</div> : <>
      <div className="wheelbox"><i className="pin" />
        <div className="wheel" style={{ transform: `rotate(${deg}deg)`, background: `conic-gradient(${opts.map((_, i) => `${colors[i % colors.length]} ${i * seg}deg ${(i + 1) * seg}deg`).join(',')})` }}>
          {opts.map((o, i) => <span key={o.id} style={{ transform: `rotate(${(i + .5) * seg - 90}deg)` }}>{o.title.slice(0, 14)}</span>)}</div></div>
      <button className="btn" style={{ alignSelf: 'center' }} onClick={spin}>{t('wheel_spin')}</button>
      {win && <div className="card ans" style={{ textAlign: 'center', fontSize: 20, fontWeight: 800 }}>🎉 {win}</div>}</>}
  </div>
}

/* ---------- challenge of the week ---------- */
export function Challenge() {
  const s = useStore(), sp = curSpace(s)!, L = getLang(), week = weekStart(today())
  const list = CHALLENGES[sp.type === 'solo' ? 'solo' : sp.type === 'couple' ? 'couple' : 'group'] || []
  const idx = Math.floor(diffDays('2026-01-05', week) / 7) % list.length, ch = list[(idx + list.length) % list.length]
  const done = rows('items', s.cur, s).filter(i => i.kind === 'challenge'), mine = done.find(i => i.title === week)
  return <div className="page">
    <div className="head"><h1>{t('challenge')}</h1></div>
    <div className="cc c3" style={{ height: 'auto', minHeight: 170 }}><span className="up">{t('ci_week', fmtDay(week))}</span><h3 style={{ maxWidth: '100%' }}>{ch?.[L]}</h3><span className="deco">🏆</span></div>
    {mine ? <span className="pill" style={{ alignSelf: 'center' }}>✓ {t('challenge_done')}</span>
      : <button className="btn" style={{ alignSelf: 'center' }} onClick={() => { tap(); upsert('items', crypto.randomUUID(), { kind: 'challenge', title: week, note: null, done: true, rating: null, for_user: null, data: {}, deleted_at: null }) }}>{t('challenge_mark')}</button>}
    <p className="sm mut" style={{ textAlign: 'center' }}>{t('challenges_count', done.length)}</p>
  </div>
}

/* ---------- live statuses ---------- */
const ST = [['free', '🟢'], ['busy', '🔴'], ['work', '💼'], ['study', '📚'], ['gaming', '🎮'], ['sport', '🏃'], ['road', '🚗'], ['sleep', '😴']] as const
export function Status() {
  const s = useStore(), sp = curSpace(s)!, me = s.profile!.id, now = useNow(30000), all = rows('statuses', sp.id, s), id = sp.id + ':' + me, mine = s.db.statuses[id]
  const set = (st: string) => { tap(); if (mine && !mine.deleted_at && mine.status === st) upsert('statuses', id, { deleted_at: new Date().toISOString() }, sp.id); else upsert('statuses', id, { status: st, started_at: new Date().toISOString(), note: null, deleted_at: null }, sp.id) }
  const icon = (st: string) => ST.find(x => x[0] === st)?.[1] || '•'
  return <div className="page">
    <div className="head"><h1>{t('status')}</h1></div>
    <div className="card col"><h2>{t('status_mine')}</h2><div className="chips">{ST.map(([k, em]) => <button key={k} className={'chip' + (mine && !mine.deleted_at && mine.status === k ? ' on' : '')} onClick={() => set(k)}>{em} {t(('st_' + k) as Key)}</button>)}</div></div>
    <div className="card" style={{ padding: '4px 16px' }}>{sp.members.map(m => { const x = all.find(a => a.created_by === m.id)
      return <div key={m.id} className="item"><span className="av">{m.a}</span><b className="grow ell">{m.n}</b>
        {x ? <span className="row sm" style={{ gap: 6 }}><span>{icon(x.status)} {t(('st_' + x.status) as Key)}</span><span className="mut">{t('st_for', dur(now - new Date(x.started_at).getTime()))}</span></span> : <span className="sm mut">{t('st_none')}</span>}</div> })}</div>
  </div>
}

/* ---------- timed logs: intimacy (18+), dating log, poo ---------- */
function useLogs(kind: Log['kind']) { const s = useStore(), ids = new Set(s.spaces.map(x => x.id)); return Object.values(s.db.logs).filter(l => l.kind === kind && !l.deleted_at && ids.has(l.space_id) && (kind !== 'intim' || l.created_by === s.profile!.id || s.spaces.find(x => x.id === l.space_id)?.type === 'couple')).sort((a, b) => b.day.localeCompare(a.day) || (b.started_at || '').localeCompare(a.started_at || '')) }

const pad = (n: number) => String(n).padStart(2, '0')
const hms = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return (h ? h + ':' + pad(m) : m) + ':' + pad(s % 60) }
const MEDAL = ['🥇', '🥈', '🥉']
/** Month grid used by the trackers: `mark` returns what to show on a day (or null to show the date). */
function MonthCal({ mark }: { mark: (day: string) => string | null }) {
  const d = today(), [month, setMonth] = useState(d.slice(0, 7)), [y, mo] = month.split('-').map(Number)
  const first = (new Date(y, mo - 1, 1).getDay() + 6) % 7, n = new Date(y, mo, 0).getDate(), shift = (k: number) => { const z = new Date(y, mo - 1 + k, 1); setMonth(z.getFullYear() + '-' + pad(z.getMonth() + 1)) }
  const wd = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(document.documentElement.lang, { weekday: 'narrow' }).format(new Date(2026, 10, 16 + i)))
  return <div className="card col"><div className="row between"><button className="icon" aria-label={t('prev_day')} onClick={() => shift(-1)}>‹</button><b style={{ textTransform: 'capitalize' }}>{new Intl.DateTimeFormat(document.documentElement.lang, { month: 'long', year: 'numeric' }).format(new Date(y, mo - 1, 1))}</b><button className="icon" aria-label={t('next_day')} onClick={() => shift(1)}>›</button></div>
    <div className="pcal">{wd.map((w, i) => <small key={i}>{w}</small>)}{Array.from({ length: first }, (_, i) => <span key={'e' + i} />)}{Array.from({ length: n }, (_, i) => { const ds = month + '-' + pad(i + 1), m = mark(ds)
      return <span key={ds} className={'pd' + (ds === d ? ' now' : '') + (m ? ' on' : '')}>{m || i + 1}</span> })}</div></div>
}

const Hearts = ({ v, on }: { v: number; on: (n: number) => void }) => <div className="hearts">{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" aria-label={n + '/5'} onClick={() => on(n)}>{n <= v ? '❤️' : '🤍'}</button>)}</div>
function burst(el: HTMLElement | null, em: string[]) {
  if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const r = el.getBoundingClientRect()
  for (let i = 0; i < 10; i++) { const s = document.createElement('span'); s.className = 'burst'; s.textContent = em[i % em.length]
    s.style.left = r.left + r.width / 2 + 'px'; s.style.top = r.top + r.height / 2 + 'px'; const a = (Math.PI * 2 * i) / 10, d = 70 + Math.random() * 40
    s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d + 'px'); document.body.appendChild(s); setTimeout(() => s.remove(), 750) }
}

/** Intimacy tracker (18+): the classic look — gradient hero with a live timer, medals, hearts — plus the choice of where entries are kept. */
export function Intim() {
  const s = useStore(), me = s.profile!, now = useNow(), logs = useLogs('intim')
  const couples = s.spaces.filter(x => x.type === 'couple'), [where, setWhere] = useState(() => { try { return localStorage.getItem('lokami_intim_space') || home(s) } catch { return home(s) } })
  const running = logs.find(l => l.started_at && !l.ended_at), mine = running?.created_by === me.id
  const [sum, setSum] = useState<Log | null>(null), [man, setMan] = useState(false)
  if (!me.adult) return <div className="page"><div className="empty"><b>🔞</b>{t('adult_hint')}</div></div>
  const people = s.spaces.flatMap(x => x.members), who = (id: string | null) => people.find(m => m.id === id), ym = today().slice(0, 7)
  const done = logs.filter(l => l.started_at && l.ended_at), len = (l: Log) => new Date(l.ended_at!).getTime() - new Date(l.started_at!).getTime()
  const ids = [...new Set([me.id, ...done.map(l => l.created_by!)])]
  const stats = ids.map(id => { const a = done.filter(l => l.created_by === id), d = a.map(len); return { m: who(id), c: a.length, mc: a.filter(l => l.day.startsWith(ym)).length, avg: d.length ? d.reduce((x, y) => x + y, 0) / d.length : 0, mx: Math.max(0, ...d) } }).sort((a, b) => b.c - a.c)
  const last = done[0], since = last ? diffDays(last.day, today()) : null
  const start = (e: React.MouseEvent<HTMLElement>) => { tap(); burst(e.currentTarget, ['🔞', '💥', '✨']); upsert('logs', crypto.randomUUID(), { kind: 'intim', day: today(), started_at: new Date().toISOString(), ended_at: null, data: {}, deleted_at: null }, where) }
  const stop = () => { if (!running) return; tap(); setSum({ ...running, ended_at: new Date().toISOString(), data: { rating: 4 } }) }
  return <div className="page">
    <div className="head"><div><h1>{t('intim')} 🔞</h1><p className="sm mut">🔒 {spaceName(s.spaces.find(x => x.id === where))}</p></div></div>
    <div className={'livehero' + (running ? ' on' : '')}>
      <span className="up">{running ? (mine ? t('intim_running') : t('intim_busy', who(running.created_by)?.n || '—')) : t('intim')}</span>
      <div className="big num">{running ? hms(now - new Date(running.started_at!).getTime()) : '0:00'}</div>
      {running ? (mine ? <button className="livebtn" onClick={stop}>⏹ {t('intim_stop')}</button> : null) : <><button className="livebtn" onClick={start}>▶ {t('intim_start')}</button><p className="sm" style={{ opacity: .85 }}>{since !== null ? `${since} ${t('intim_days_since')}` : t('intim_idle')}</p></>}
    </div>
    <div className="card col"><h2>{t('intim_stats')}</h2>{stats.map((x, i) => <div key={x.m?.id || i} className="lvst"><span className="rank">{x.c ? MEDAL[i] || '·' : '·'}</span><span className="av">{x.m?.a || '🙂'}</span>
      <div className="grow"><b>{x.m?.n || '—'}</b><div className="sm mut">{x.c} · {x.mc} {t('intim_month')}</div></div>
      <div className="sm" style={{ textAlign: 'right' }}>{x.c ? <><div>{t('intim_avg')} <b>{dur(x.avg)}</b></div><div className="mut">max {dur(x.mx)}</div></> : '—'}</div></div>)}</div>
    <MonthCal mark={ds => { const c = done.filter(l => l.day === ds).length; return c ? (c > 2 ? '🔥' + c : '🔥'.repeat(c)) : null }} />
    {couples.length > 0 && <div className="card col"><b>{t('intim_share')}</b><p className="sm mut">{t('intim_share_hint')}</p><div className="chips">{[home(s), ...couples.map(c => c.id)].map(id => <button key={id} className={'chip' + (where === id ? ' on' : '')} onClick={() => { setWhere(id); try { localStorage.setItem('lokami_intim_space', id) } catch { /* ignore */ } }}>{id === home(s) ? '🔒 ' : '💞 '}{spaceName(s.spaces.find(x => x.id === id))}</button>)}</div></div>}
    <div className="card col" style={{ gap: 4 }}><div className="row between"><h2>{t('history')}</h2><button className="btn ghost sm" onClick={() => setMan(true)}>{t('intim_add')}</button></div>
      {!done.length ? <p className="sm mut">{t('intim_empty')}</p> : done.slice(0, 30).map(l => <div key={l.id} className="item"><span className="av">{who(l.created_by)?.a || '·'}</span>
        <span className="grow"><b>{who(l.created_by)?.n}</b> · {dur(len(l))} <span style={{ color: 'var(--accent)' }}>{'♥'.repeat((l.data.rating as number) || 0)}</span>
          <span className="sm mut" style={{ display: 'block' }}>{fmtDay(l.day)} · {new Date(l.started_at!).toTimeString().slice(0, 5)}{l.data.note ? ' · ' + l.data.note : ''}</span></span>
        {l.created_by === me.id && <button className="x" aria-label={t('delete')} onClick={() => remove('logs', l.id)}>×</button>}</div>)}</div>
    {sum && <Summary log={sum} onClose={() => setSum(null)} />}
    {man && <Manual space={where} onClose={() => setMan(false)} />}
  </div>
}
function Summary({ log, onClose }: { log: Log; onClose: () => void }) {
  const [r, setR] = useState(4), [note, setNote] = useState('')
  const save = () => { upsert('logs', log.id, { ended_at: log.ended_at, data: { rating: r, note: note.trim() || undefined } }); confetti(); onClose() }
  return <Sheet onClose={save}><h2>{t('intim_summary')} 🔞</h2>
    <div className="lvsum"><small>{t('intim_duration')}</small><b className="num">{hms(new Date(log.ended_at!).getTime() - new Date(log.started_at!).getTime())}</b></div>
    <div className="label">{t('intim_rating')}<Hearts v={r} on={setR} /></div>
    <input className="inp" placeholder={t('note')} value={note} maxLength={60} onChange={e => setNote(e.target.value)} />
    <div className="row wrap"><button className="btn" onClick={save}>{t('save')}</button><button className="btn ghost" onClick={() => { remove('logs', log.id); onClose() }}>{t('intim_discard')}</button></div></Sheet>
}
function Manual({ space, onClose }: { space: string; onClose: () => void }) {
  const [d, setD] = useState(today()), [tm, setTm] = useState('21:00'), [min, setMin] = useState(''), [r, setR] = useState(4), [note, setNote] = useState('')
  const m = parseInt(min, 10), ok = m > 0 && m < 1440
  const save = () => { if (!ok) return; const st = new Date(d + 'T' + tm); upsert('logs', crypto.randomUUID(), { kind: 'intim', day: d, started_at: st.toISOString(), ended_at: new Date(st.getTime() + m * 60000).toISOString(), data: { rating: r, note: note.trim() || undefined }, deleted_at: null }, space); confetti(); onClose() }
  return <Sheet onClose={onClose}><h2>{t('intim_add')} 🔞</h2>
    <div className="row"><input className="inp grow" type="date" value={d} max={today()} onChange={e => setD(e.target.value)} /><input className="inp grow" type="time" value={tm} onChange={e => setTm(e.target.value)} /></div>
    <input className="inp" inputMode="numeric" placeholder={t('intim_minutes')} value={min} onChange={e => setMin(e.target.value)} />
    <div className="label">{t('intim_rating')}<Hearts v={r} on={setR} /></div>
    <input className="inp" placeholder={t('note')} value={note} maxLength={60} onChange={e => setNote(e.target.value)} />
    <div className="row"><button className="btn" disabled={!ok} onClick={save}>{t('save')}</button><button className="btn ghost" onClick={onClose}>{t('cancel')}</button></div></Sheet>
}
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const box = document.createElement('div'); box.className = 'confetti'; box.style.position = 'fixed'; box.style.zIndex = '80'
  for (let i = 0; i < 24; i++) { const c = document.createElement('i'); c.style.left = (i * 4.2) + '%'; c.style.animationDelay = (i % 6) * 70 + 'ms'; box.appendChild(c) }
  document.body.appendChild(box); setTimeout(() => box.remove(), 2200)
}

function LogEdit({ kind, log, space, onClose }: { kind: Log['kind']; log?: Log; space: string; onClose: () => void }) {
  const [day, setDay] = useState(log?.day || today()), [withWho, setWith] = useState((log?.data.with as string) || ''), [rating, setRating] = useState((log?.data.rating as number) || 0), [mins, setMins] = useState(log?.started_at && log.ended_at ? String(Math.round((new Date(log.ended_at).getTime() - new Date(log.started_at).getTime()) / 60000)) : ''), [note, setNote] = useState((log?.data.note as string) || '')
  const save = () => { const m = parseInt(mins), end = log?.ended_at || (m ? new Date(day + 'T22:00:00').toISOString() : null), startAt = m && end ? new Date(new Date(end).getTime() - m * 60000).toISOString() : log?.started_at || null
    upsert('logs', log?.id || crypto.randomUUID(), { kind, day, started_at: startAt, ended_at: end, data: { ...(log?.data || {}), with: withWho.trim() || undefined, rating: rating || undefined, note: note.trim() || undefined }, deleted_at: null }, log?.space_id || space); onClose() }
  return <Sheet onClose={onClose}><h2>{kind === 'dlog' ? t('dlog') : t('intim')}</h2>
    <input className="inp" type="date" value={day} max={today()} onChange={e => setDay(e.target.value)} />
    <input className="inp" placeholder={kind === 'dlog' ? t('dlog_ph') : t('intim_with')} value={withWho} maxLength={40} onChange={e => setWith(e.target.value)} />
    {kind === 'intim' && <input className="inp" inputMode="numeric" placeholder="min" value={mins} onChange={e => setMins(e.target.value)} />}
    <div className="label">{t('intim_rating')}<div className="moods">{[1, 2, 3, 4, 5].map(n => <button key={n} className={'face' + (rating === n ? ' on' : '')} onClick={() => setRating(n)}><span>{'★'.repeat(n).slice(0, 1)}{n}</span></button>)}</div></div>
    <input className="inp" placeholder={t('note')} value={note} maxLength={200} onChange={e => setNote(e.target.value)} />
    <div className="row wrap"><button className="btn" onClick={save}>{t('save')}</button><button className="btn ghost" onClick={onClose}>{t('cancel')}</button>{log && <button className="btn danger" onClick={() => { remove('logs', log.id); onClose() }}>{t('delete')}</button>}</div>
  </Sheet>
}

export function Dlog() {
  const s = useStore(), logs = useLogs('dlog').filter(l => l.space_id === home(s)), [edit, setEdit] = useState<Log | 'new' | null>(null)
  const people = new Set(logs.map(l => ((l.data.with as string) || '').trim().toLowerCase()).filter(Boolean))
  return <div className="page">
    <div className="head"><div><h1>{t('dlog')}</h1><p className="sm mut">🔒 {t('only_you')}</p></div><button className="btn" onClick={() => setEdit('new')}>{t('add')}</button></div>
    <div className="grid"><div className="card stat"><b className="num">{people.size}</b><span className="sm mut">{t('dlog_people')}</span></div><div className="card stat"><b className="num">{logs.length}</b><span className="sm mut">{t('dates')}</span></div></div>
    {logs.length > 0 && <div className="card" style={{ padding: '4px 16px' }}>{logs.map(l => <button key={l.id} className="item" style={{ width: '100%', textAlign: 'left' }} onClick={() => setEdit(l)}><span className="av">💘</span>
      <span className="grow"><b style={{ fontWeight: 600 }}>{(l.data.with as string) || '—'}</b><span className="sm mut" style={{ display: 'block' }}>{[fmtDay(l.day), l.data.rating ? '★'.repeat(l.data.rating as number) : '', l.data.note as string].filter(Boolean).join(' · ')}</span></span></button>)}</div>}
    {edit && <LogEdit kind="dlog" log={edit === 'new' ? undefined : edit} space={home(s)} onClose={() => setEdit(null)} />}
  </div>
}

const POO = ['😌', '😐', '😣', '🔥', '💀']
/** Poo tracker: the classic brown hero with a big button, streak, monthly ranking and a calendar of 💩. */
export function Poo() {
  const s = useStore(), sp = curSpace(s)!, me = s.profile!.id, logs = useLogs('poo').filter(l => l.space_id === sp.id), d = today()
  const month = d.slice(0, 7), [ask, setAsk] = useState(false)
  const mine = logs.filter(l => l.created_by === me), days = new Set(mine.map(l => l.day))
  let streak = 0; for (let x = d; days.has(x); x = addDays(x, -1)) streak++
  const rank = sp.members.map(m => ({ m, c: logs.filter(l => l.created_by === m.id && l.day.startsWith(month)).length })).sort((a, b) => b.c - a.c)
  const who = (id: string | null) => sp.members.find(m => m.id === id)
  return <div className="page">
    <div className="head"><h1>{t('poo')}</h1></div>
    <div className="poohero"><div><span className="up">{t('poo_today')}</span><div className="big num">{mine.filter(l => l.day === d).length}</div><div style={{ fontWeight: 700 }}>🔥 {streak} {t('poo_streak')}</div></div>
      <button className="poobtn" aria-label={t('poo_log')} onClick={e => { tap(); burst(e.currentTarget, ['💩', '✨', '🧻']); setAsk(true) }}>💩</button></div>
    {sp.members.length > 1 && <div className="card col"><h2>{t('poo_rank')}</h2>{rank.map((x, i) => <div key={x.m.id} className="lvst"><span className="rank">{x.c ? MEDAL[i] || '·' : '·'}</span><span className="av">{x.m.a}</span><b className="grow">{x.m.n}</b><b className="num">{x.c} 💩</b></div>)}</div>}
    <MonthCal mark={ds => { const c = logs.filter(l => l.day === ds).length; return c ? (c > 2 ? '💩' + c : '💩'.repeat(c)) : null }} />
    <div className="card col" style={{ gap: 4 }}><h2>{t('history')}</h2>{!logs.length ? <p className="sm mut">{t('poo_empty')}</p> : logs.slice(0, 25).map(l => <div key={l.id} className="item"><span className="av">{who(l.created_by)?.a || '·'}</span>
      <span className="grow"><b>{who(l.created_by)?.n}</b> {l.data.r != null ? POO[l.data.r as number] : ''}<span className="sm mut" style={{ display: 'block' }}>{fmtDay(l.day)} · {l.started_at ? new Date(l.started_at).toTimeString().slice(0, 5) : ''}</span></span>
      {l.created_by === me && <button className="x" aria-label={t('delete')} onClick={() => remove('logs', l.id)}>×</button>}</div>)}</div>
    {ask && <PooAsk space={sp.id} onClose={() => setAsk(false)} />}
  </div>
}
function PooAsk({ space, onClose }: { space: string; onClose: () => void }) {
  const n = new Date(), [d, setD] = useState(today()), [tm, setTm] = useState(pad(n.getHours()) + ':' + pad(n.getMinutes()))
  const save = (r: number) => { tap(); const at = new Date(d + 'T' + tm); upsert('logs', crypto.randomUUID(), { kind: 'poo', day: d, started_at: (isNaN(+at) ? new Date() : at).toISOString(), ended_at: null, data: { r }, deleted_at: null }, space); onClose() }
  return <Sheet onClose={onClose}><h2>{t('poo_q')}</h2>
    <div className="row" style={{ justifyContent: 'space-between' }}>{POO.map((p, i) => <button key={i} className="pq" onClick={() => save(i)}>{p}</button>)}</div>
    <div className="label">{t('poo_when')}<div className="row"><input className="inp grow" type="date" value={d} max={today()} onChange={e => setD(e.target.value)} /><input className="inp grow" type="time" value={tm} onChange={e => setTm(e.target.value)} /></div></div></Sheet>
}

/* ---------- admin ---------- */
export function Admin() {
  const [st, setSt] = useState<Record<string, number> | null>(null), [err, setErr] = useState(false)
  useEffect(() => { sb.rpc('admin_stats').then(({ data, error }) => { if (error) setErr(true); else setSt((Array.isArray(data) ? data[0] : data) as Record<string, number>) }, () => setErr(true)) }, [])
  return <div className="page"><div className="head"><h1>{t('admin')}</h1></div>
    {err ? <div className="empty"><b>🔒</b>{t('err_net')}</div> : !st ? <p className="mut">…</p> : <div className="grid">{Object.entries(st).map(([k, v]) => <div key={k} className="card stat"><b className="num">{typeof v === 'number' ? num(v) : String(v)}</b><span className="sm mut">{k.replace(/_/g, ' ')}</span></div>)}</div>}
    <p className="sm mut">{t('adm_private')}</p></div>
}
void tn
