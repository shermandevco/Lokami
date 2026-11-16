import { useEffect, useState } from 'react'
import { useStore, rows, upsert, curSpace, type Checkin as C } from '../store'
import { sb } from '../lib/supabase'
import { t } from '../lib/i18n'
import { today, weekStart, fmtDay } from '../lib/dates'
import type { Key } from '../i18n/en'

const QS = ['close', 'heard', 'fun', 'load'] as const
const DOTS = ['', '😞', '😕', '😐', '🙂', '😍']
/** Weekly check-in. Like the question of the day, other answers come from the server only after you submit yours. */
export function Checkin() {
  const s = useStore(), sp = curSpace(s)!, me = s.profile!, week = weekStart(today()), id = sp.id + ':' + week + ':' + me.id, mine = s.db.checkins[id]
  const [f, setF] = useState<Partial<C>>(mine || {}), [editing, setEditing] = useState(!mine), [done, setDone] = useState<string[]>([])
  useEffect(() => { sb.rpc('checked_in_by', { sid: sp.id, w: week }).then(({ data }) => { if (Array.isArray(data)) setDone(data as string[]) }, () => {}) }, [sp.id, week, mine?.id])
  const all = rows('checkins', sp.id, s), others = all.filter(c => c.week === week && c.created_by !== me.id), member = (u: string | null) => sp.members.find(m => m.id === u)
  const ready = QS.every(q => f[q])
  const save = () => { upsert('checkins', id, { week, close: f.close ?? null, heard: f.heard ?? null, fun: f.fun ?? null, load: f.load ?? null, thanks: f.thanks?.trim() || null, wish: f.wish?.trim() || null, deleted_at: null }, sp.id); setEditing(false) }
  const view = (c: C) => { const m = member(c.created_by); return <div key={c.id} className="card col ans" style={{ gap: 8 }}>
    <b>{m?.a} {m?.n}</b>{QS.map(q => <div key={q} className="row between sm"><span className="mut">{t(('ci_' + q) as Key)}</span><span style={{ fontSize: 20 }}>{DOTS[c[q] || 0]}</span></div>)}
    {c.thanks && <p><span className="sm mut">{t('ci_thanks')}:</span><br />{c.thanks}</p>}{c.wish && <p><span className="sm mut">{t('ci_wish')}:</span><br />{c.wish}</p>}</div> }
  const past = [...new Set(all.filter(c => c.week < week).map(c => c.week))].sort().reverse().slice(0, 8)
  const waiting = done.filter(u => u !== me.id).map(u => member(u)?.n).filter(Boolean)
  return <div className="page">
    <div className="head"><div><h1>{t('checkin')}</h1><p className="sm mut">{t('ci_week', fmtDay(week))}</p></div></div>
    {editing ? <div className="card col">
      <p className="sm mut">{t('checkin_sub')}</p>
      {QS.map(q => <div key={q} className="label">{t(('ci_' + q) as Key)}<div className="moods">{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" aria-pressed={f[q] === n} className={'face' + (f[q] === n ? ' on' : '')} onClick={() => setF({ ...f, [q]: n })}><span>{DOTS[n]}</span></button>)}</div></div>)}
      <label className="label">{t('ci_thanks')}<textarea className="inp" style={{ minHeight: 70, padding: 12 }} maxLength={1000} value={f.thanks || ''} onChange={e => setF({ ...f, thanks: e.target.value })} /></label>
      <label className="label">{t('ci_wish')}<textarea className="inp" style={{ minHeight: 70, padding: 12 }} maxLength={1000} value={f.wish || ''} onChange={e => setF({ ...f, wish: e.target.value })} /></label>
      {waiting.length > 0 && <p className="sm mut">🔒 {t('ci_done_by', waiting.join(', '))}. {t('ci_hidden')}</p>}
      <button className="btn" disabled={!ready} onClick={save}>{t('ci_send')}</button></div>
    : <>{view(mine!)}<button className="btn sm ghost" onClick={() => setEditing(true)}>{t('answer_edit')}</button>
      {others.length ? <>{others.map(view)}<p className="sm mut" style={{ textAlign: 'center' }}>💬 {t('ci_talk')}</p></> : <p className="mut sm" style={{ textAlign: 'center' }}>{t('answer_wait')}</p>}</>}
    {past.length > 0 && <><p className="cap">{t('ci_past')}</p>{past.map(w => <div key={w} className="card col" style={{ gap: 6 }}><span className="sm mut">{t('ci_week', fmtDay(w))}</span>
      {all.filter(c => c.week === w).map(c => <div key={c.id} className="row between sm"><span>{member(c.created_by)?.a} {member(c.created_by)?.n}</span><span>{QS.map(q => DOTS[c[q] || 0]).join(' ')}</span></div>)}</div>)}</>}
  </div>
}
