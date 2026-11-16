import { useState } from 'react'
import { useStore, rows, upsert, home, getState } from '../store'
import { t } from '../lib/i18n'
import { today, addDays, fmtDay, num } from '../lib/dates'
import { dayId } from '../lib/me'
import { Bars } from '../ui/Bars'
import type { Health as H } from '../store'

const FIELDS = [['weight', '⚖️', 0.1, '#7c5cff'], ['sleep', '😴', 0.5, '#3b82f6'], ['water', '💧', 1, '#22b8cf'], ['steps', '👟', 100, '#19a57a']] as const
type F = typeof FIELDS[number][0]

export function Health() {
  const s = useStore(), me = s.profile!, h = home(s), day = today(), id = dayId(me.id, day), cur = s.db.health_logs[id]
  const [vals, setVals] = useState<Record<F, string>>(() => Object.fromEntries(FIELDS.map(([f]) => [f, cur?.[f] != null ? String(+Number(cur[f]).toFixed(1)) : ''])) as Record<F, string>)
  const save = (f: F, v: string) => { const n = v.trim() === '' ? null : parseFloat(v.replace(',', '.')); if (n !== null && !isFinite(n)) return
    const old = getState().db.health_logs[id]; if ((old?.[f] ?? null) === n) return
    upsert('health_logs', id, { day, [f]: n === null ? null : f === 'water' || f === 'steps' ? Math.round(n) : Math.round(n * 10) / 10, deleted_at: null } as Partial<H>, h) }
  const logs = rows('health_logs', h, s), days = Array.from({ length: 14 }, (_, i) => addDays(day, i - 13)), byDay: Record<string, H> = {}; logs.forEach(l => (byDay[l.day] = l))
  return <div className="page">
    <div className="head"><div><h1>{t('health')}</h1><p className="sm mut">🔒 {t('only_you')}</p></div></div>
    <div className="card col"><span className="cap">{fmtDay(day)}</span>
      <div className="hgrid">{FIELDS.map(([f, icon]) => <label key={f} className="label"><span>{icon} {t(f)}</span>
        <input className="inp num" inputMode="decimal" value={vals[f]} onChange={e => setVals({ ...vals, [f]: e.target.value })} onBlur={e => save(f, e.target.value)} /></label>)}</div>
      <p className="sm mut">{t('health_hint')}</p></div>
    <p className="cap">{t('last_14')}</p>
    <div className="grid">{FIELDS.map(([f, icon, , color]) => { const vs = days.map(d => byDay[d]?.[f] ?? null), got = vs.filter((v): v is number => v != null), avg = got.length ? got.reduce((a, b) => a + b, 0) / got.length : 0
      return <div key={f} className="card col" style={{ gap: 8 }}><div className="row between"><b className="sm">{icon} {t(f)}</b></div>
        <div className="num" style={{ fontSize: 22, fontWeight: 800 }}>{got.length ? num(+avg.toFixed(f === 'steps' || f === 'water' ? 0 : 1)) : '—'} <span className="sm mut">{t('avg')}</span></div>
        <Bars values={vs} labels={days.map(fmtDay)} color={color} /></div> })}</div>
  </div>
}
