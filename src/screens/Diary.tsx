import { useEffect, useRef, useState } from 'react'
import { useStore, upsert, home, getState } from '../store'
import { t } from '../lib/i18n'
import { today, addDays, fmtFull, fmtWeekday } from '../lib/dates'
import { dayId, MOOD_FACE } from '../lib/me'
import { YearCells } from './Mood'

/** Notebook: one page per day, pages turn with a short rotate (transform only); text autosaves. */
export function Diary() {
  const s = useStore(), me = s.profile!, [day, setDay] = useState(today()), [dir, setDir] = useState<'' | 'l' | 'r'>('')
  const id = dayId(me.id, day), page = s.db.diary_pages[id], mood = s.db.moods[id]
  const [body, setBody] = useState(page?.body || ''), [saved, setSaved] = useState(false), timer = useRef(0)
  useEffect(() => { setBody(getState().db.diary_pages[dayId(me.id, day)]?.body || '') }, [day, me.id])
  useEffect(() => { if (page && document.activeElement?.tagName !== 'TEXTAREA') setBody(page.body) }, [page?.edited_at])  // remote edits from another device
  const write = (v: string) => { setBody(v); setSaved(false); clearTimeout(timer.current); timer.current = window.setTimeout(() => { upsert('diary_pages', id, { day, body: v, deleted_at: null }, home(getState())); setSaved(true) }, 600) }
  const flip = (n: number) => { const next = addDays(day, n); if (next > today()) return; clearTimeout(timer.current); if (body !== (page?.body || '')) upsert('diary_pages', id, { day, body, deleted_at: null }, home(s)); setDir(n < 0 ? 'l' : 'r'); setDay(next) }
  const open = (d: string) => { setDir(d < day ? 'l' : 'r'); setDay(d); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  return <div className="page">
    <div className="head"><div><h1>{t('diary')}</h1><p className="sm mut">🔒 {t('only_you')}</p></div></div>
    <div className="book">
      <div key={day} className={'paper ' + dir}>
        <div className="row between"><div><b>{fmtWeekday(day, 'long')}</b><div className="sm mut">{fmtFull(day)}</div></div><span style={{ fontSize: 28 }}>{mood && !mood.deleted_at ? MOOD_FACE[mood.score] : ''}</span></div>
        <textarea className="lines" value={body} placeholder={t('diary_placeholder')} maxLength={20000} onChange={e => write(e.target.value)} aria-label={t('diary')} />
        <div className="row between"><button className="icon" aria-label={t('prev_day')} onClick={() => flip(-1)}>‹</button><span className="sm mut">{saved ? t('diary_saved') : ''}</span><button className="icon" aria-label={t('next_day')} disabled={day >= today()} onClick={() => flip(1)}>›</button></div>
      </div>
    </div>
    <div className="card col"><div className="row between"><h2>{t('year_cells')}</h2><span className="sm mut">{t('legend_diary')}</span></div><YearCells onPick={open} /></div>
  </div>
}
