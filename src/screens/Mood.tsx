import { useState, useRef, useEffect } from 'react'
import { useStore, rows, upsert, home, go } from '../store'
import { t } from '../lib/i18n'
import { today, addDays, parse, fmtFull } from '../lib/dates'
import { MOOD_FACE, MOOD_COLOR, MOOD_TAGS, dayId, average } from '../lib/me'
import type { Key } from '../i18n/en'

/** Five faces; picking one saves the day's mood immediately. */
export function MoodPicker({ day = today(), compact = false }: { day?: string; compact?: boolean }) {
  const s = useStore(), me = s.profile!, id = dayId(me.id, day), m = s.db.moods[id]
  const cur = m && !m.deleted_at ? m.score : 0
  const pick = (score: number) => upsert('moods', id, { day, score, tags: m?.tags || [], note: m?.note || null, deleted_at: null }, home(s))
  return <div className="moods" role="radiogroup" aria-label={t('mood_q')}>
    {[1, 2, 3, 4, 5].map(n => <button key={n} role="radio" aria-checked={cur === n} aria-label={t(('mood_' + n) as Key)} className={'face' + (cur === n ? ' on' : '')} onClick={() => pick(n)}>
      <span>{MOOD_FACE[n]}</span>{!compact && <small>{t(('mood_' + n) as Key)}</small>}</button>)}
  </div>
}

/** GitHub-style year grid: colour = mood, dot = diary page. Tapping a cell opens that day in the diary. */
export function YearCells({ onPick }: { onPick?: (day: string) => void }) {
  const s = useStore(), h = home(s), end = today(), start = addDays(end, -363 - ((parse(end).getDay() + 6) % 7))
  const moods: Record<string, number> = {}; rows('moods', h, s).forEach(m => (moods[m.day] = m.score))
  const pages = new Set(rows('diary_pages', h, s).filter(p => p.body.trim()).map(p => p.day))
  const box = useRef<HTMLDivElement>(null); useEffect(() => { if (box.current) box.current.scrollLeft = box.current.scrollWidth }, [])
  const days: string[] = []; for (let d = start; d <= end; d = addDays(d, 1)) days.push(d)
  return <div ref={box} className="year" role="grid" aria-label={t('year_cells')}>
    {days.map(d => <button key={d} title={fmtFull(d)} aria-label={fmtFull(d)} className={'cell' + (pages.has(d) ? ' dot' : '') + (d === end ? ' now' : '')}
      style={moods[d] ? { background: MOOD_COLOR[moods[d]] } : undefined} onClick={() => onPick?.(d)} />)}
  </div>
}

export function Mood() {
  const s = useStore(), me = s.profile!, day = today(), id = dayId(me.id, day), m = s.db.moods[id]
  const [note, setNote] = useState(m?.note || '')
  const all = rows('moods', home(s), s), avg = average(all)
  const toggle = (tag: string) => { if (!m) return; const tags = m.tags.includes(tag) ? m.tags.filter(x => x !== tag) : [...m.tags, tag]; upsert('moods', id, { tags }) }
  return <div className="page">
    <div className="head"><div><h1>{t('mood')}</h1><p className="sm mut">🔒 {t('only_you')}</p></div></div>
    <div className="card col"><h2>{t('mood_q')}</h2><MoodPicker />
      {m && !m.deleted_at && <>
        <div className="label">{t('mood_tags')}<div className="chips">{MOOD_TAGS.map(tag => <button key={tag} className={'chip' + (m.tags.includes(tag) ? ' on' : '')} onClick={() => toggle(tag)}>{t(('tag_' + tag) as Key)}</button>)}</div></div>
        <input className="inp" placeholder={t('mood_note')} value={note} maxLength={500} onChange={e => setNote(e.target.value)} onBlur={() => note !== (m.note || '') && upsert('moods', id, { note: note || null })} />
      </>}
    </div>
    <div className="card col"><div className="row between"><h2>{t('year_cells')}</h2>{avg > 0 && <span className="pill">{t('mood_avg')}: {MOOD_FACE[Math.round(avg)]} {avg.toFixed(1)}</span>}</div>
      {all.length ? <YearCells onPick={() => go('diary')} /> : <p className="mut sm">{t('mood_none')}</p>}
    </div>
  </div>
}
