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

export function Intim() {
  const s = useStore(), me = s.profile!, now = useNow(), logs = useLogs('intim')
  const couples = s.spaces.filter(x => x.type === 'couple'), [where, setWhere] = useState(() => { try { return localStorage.getItem('lokami_intim_space') || home(s) } catch { return home(s) } })
  const running = logs.find(l => l.created_by === me.id && l.started_at && !l.ended_at), [edit, setEdit] = useState<Log | 'new' | null>(null)
  if (!me.adult) return <div className="page"><div className="empty"><b>🔞</b>{t('adult_hint')}</div></div>
  const last = logs.find(l => l.ended_at || !l.started_at), since = last ? diffDays(last.day, today()) : null, month = logs.filter(l => l.day.startsWith(today().slice(0, 7))).length
  const timed = logs.filter(l => l.started_at && l.ended_at), avg = timed.length ? timed.reduce((a, l) => a + (new Date(l.ended_at!).getTime() - new Date(l.started_at!).getTime()), 0) / timed.length : 0
  const start = () => { tap(); upsert('logs', crypto.randomUUID(), { kind: 'intim', day: today(), started_at: new Date().toISOString(), ended_at: null, data: {}, deleted_at: null }, where) }
  const who = (l: Log) => s.spaces.flatMap(x => x.members).find(m => m.id === l.created_by)
  return <div className="page">
    <div className="head"><div><h1>{t('intim')}</h1><p className="sm mut">🔒 {spaceName(s.spaces.find(x => x.id === where))}</p></div><button className="btn ghost" onClick={() => setEdit('new')}>{t('intim_add')}</button></div>
    <div className="cc party" style={{ height: 'auto', minHeight: 160, alignItems: 'center', textAlign: 'center' }}>
      {running ? <><span className="up">{t('intim_running')}</span><div className="big num">{dur(now - new Date(running.started_at!).getTime()).replace(' min', '′')}</div>
        <button className="btn ghost" onClick={() => { tap(); setEdit({ ...running, ended_at: new Date().toISOString() }) }}>{t('intim_stop')}</button></>
        : <><span className="up">{t('intim')}</span><button className="btn ghost" style={{ alignSelf: 'center', marginTop: 12 }} onClick={start}>🔥 {t('intim_start')}</button></>}</div>
    <div className="grid">{[[since ?? '—', t('intim_days_since')], [month, t('intim_month')], [avg ? dur(avg) : '—', t('intim_avg')]].map(([n, l]) => <div key={l as string} className="card stat"><b className="num">{n}</b><span className="sm mut">{l}</span></div>)}</div>
    {couples.length > 0 && <div className="card col"><b>{t('intim_share')}</b><p className="sm mut">{t('intim_share_hint')}</p><div className="chips">{[home(s), ...couples.map(c => c.id)].map(id => <button key={id} className={'chip' + (where === id ? ' on' : '')} onClick={() => { setWhere(id); try { localStorage.setItem('lokami_intim_space', id) } catch { /* ignore */ } }}>{spaceName(s.spaces.find(x => x.id === id))}</button>)}</div></div>}
    {logs.length > 0 && <div className="card" style={{ padding: '4px 16px' }}>{logs.slice(0, 40).map(l => <button key={l.id} className="item" style={{ width: '100%', textAlign: 'left' }} onClick={() => l.created_by === me.id && setEdit(l)}>
      <span className="av">{l.created_by === me.id ? '🔥' : who(l)?.a}</span><span className="grow"><b style={{ fontWeight: 600 }}>{fmtDay(l.day)}</b><span className="sm mut" style={{ display: 'block' }}>{[l.started_at && l.ended_at ? dur(new Date(l.ended_at).getTime() - new Date(l.started_at).getTime()) : '', l.data.with as string, l.data.rating ? '★'.repeat(l.data.rating as number) : ''].filter(Boolean).join(' · ')}</span></span></button>)}</div>}
    {edit && <LogEdit kind="intim" log={edit === 'new' ? undefined : edit} space={where} onClose={() => setEdit(null)} />}
  </div>
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

const POO = ['🪨', '🥜', '🌽', '🍌', '☁️', '💧']
export function Poo() {
  const s = useStore(), sp = curSpace(s)!, me = s.profile!.id, logs = useLogs('poo').filter(l => l.space_id === sp.id), d = today()
  const mine = logs.filter(l => l.created_by === me), week = addDays(d, -6)
  const add = (type: number) => { tap(); upsert('logs', crypto.randomUUID(), { kind: 'poo', day: d, started_at: new Date().toISOString(), ended_at: null, data: { type }, deleted_at: null }, sp.id) }
  const per = sp.members.map(m => ({ m, n: logs.filter(l => l.created_by === m.id && l.day >= week).length })).sort((a, b) => b.n - a.n)
  return <div className="page">
    <div className="head"><h1>{t('poo')}</h1></div>
    <div className="card col"><b>{t('poo_log')}</b><div className="moods" style={{ gridTemplateColumns: 'repeat(6,1fr)' }}>{POO.map((em, i) => <button key={i} className="face" aria-label={t('poo_type') + ' ' + (i + 1)} onClick={() => add(i + 1)}><span>{em}</span></button>)}</div></div>
    <div className="grid"><div className="card stat"><b className="num">{mine.filter(l => l.day === d).length}</b><span className="sm mut">{t('poo_today')}</span></div><div className="card stat"><b className="num">{mine.filter(l => l.day >= week).length}</b><span className="sm mut">{t('poo_week')}</span></div></div>
    {sp.members.length > 1 && <div className="card" style={{ padding: '4px 16px' }}>{per.map((x, i) => <div key={x.m.id} className="item"><span className="av">{i === 0 && x.n ? '👑' : x.m.a}</span><b className="grow">{x.m.n}</b><span className="num">{x.n} · {t('poo_week')}</span></div>)}</div>}
    {mine.length > 0 && <div className="card" style={{ padding: '4px 16px' }}>{mine.slice(0, 15).map(l => <div key={l.id} className="item"><span className="av">{POO[((l.data.type as number) || 1) - 1]}</span><span className="grow sm">{fmtDay(l.day)} · {l.started_at ? new Date(l.started_at).toLocaleTimeString(document.documentElement.lang, { hour: '2-digit', minute: '2-digit' }) : ''}</span><button className="x" aria-label={t('delete')} onClick={() => remove('logs', l.id)}>×</button></div>)}</div>}
  </div>
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
