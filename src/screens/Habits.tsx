import { tap } from '../lib/native'
import { useRef, useState } from 'react'
import { useStore, rows, upsert, remove, home } from '../store'
import { t, tn } from '../lib/i18n'
import { today, addDays, fmtWeekday } from '../lib/dates'
import { habitLogId, doneDays, streak } from '../lib/me'
import { Sheet } from '../ui/Sheet'
import { useSortable } from '../ui/useSortable'
import type { Habit as H } from '../store'

const ICONS = ['💧', '🏃', '📖', '🧘', '🥗', '😴', '🦷', '💊', '🚶', '🎸', '✍️', '🌱', '🚭', '💪', '🧠', '⭐']
export const toggleHabit = (h: H, day: string, done: boolean, space: string) => upsert('habit_logs', habitLogId(h.id, day), { habit_id: h.id, day, done, deleted_at: null }, space)


export function HabitEdit({ habit, onClose }: { habit?: H; onClose: () => void }) {
  const s = useStore(), [title, setTitle] = useState(habit?.title || ''), [icon, setIcon] = useState(habit?.icon || '💧')
  function save(e: React.FormEvent) { e.preventDefault(); if (!title.trim()) return
    upsert('habits', habit?.id || crypto.randomUUID(), { title: title.trim(), icon, sort: habit?.sort ?? Date.now() % 1e9, archived: false }, home(s)); onClose() }
  return <Sheet onClose={onClose}><form className="col" onSubmit={save}>
    <h2>{habit ? habit.title : t('habit_new')}</h2>
    <input className="inp" autoFocus placeholder={t('habit_placeholder')} value={title} maxLength={80} onChange={e => setTitle(e.target.value)} />
    <div className="chips">{ICONS.map(i => <button type="button" key={i} className={'chip' + (icon === i ? ' on' : '')} style={{ fontSize: 18, padding: '0 10px' }} onClick={() => setIcon(i)}>{i}</button>)}</div>
    <div className="row wrap"><button className="btn" disabled={!title.trim()}>{habit ? t('save') : t('add')}</button><button type="button" className="btn ghost" onClick={onClose}>{t('cancel')}</button>
      {habit && <button type="button" className="btn danger" onClick={() => { remove('habits', habit.id); onClose() }}>{t('delete')}</button>}</div>
  </form></Sheet>
}

export function Habits() {
  const s = useStore(), sp = home(s), day = today(), list = useRef<HTMLDivElement>(null)
  const habits = rows('habits', sp, s).filter(h => !h.archived).sort((a, b) => a.sort - b.sort), logs = rows('habit_logs', sp, s)
  const [edit, setEdit] = useState<H | null | 'new'>(null)
  const week = Array.from({ length: 7 }, (_, i) => addDays(day, i - 6))
  useSortable(list, ids => ids.forEach((id, i) => { const h = s.db.habits[id]; if (h && h.sort !== i) upsert('habits', id, { sort: i }) }), {}, habits.length)
  const doneToday = habits.filter(h => doneDays(logs, h.id).has(day)).length
  return <div className="page">
    <div className="head"><div><h1>{t('habits')}</h1><p className="sm mut">{habits.length ? t('habits_today', doneToday, habits.length) : '🔒 ' + t('only_you')}</p></div><button className="btn" onClick={() => setEdit('new')}>{t('add')}</button></div>
    {!habits.length ? <div className="empty"><b>🌱</b>{t('habits_empty')}</div> :
      <div className="col" ref={list}>{habits.map(h => { const dd = doneDays(logs, h.id), n = streak(dd)
        return <div key={h.id} data-id={h.id} className="card habit">
          <button className="row grow" style={{ textAlign: 'left' }} onClick={() => setEdit(h)}><span className="av">{h.icon}</span><span className="grow"><b className="ell" style={{ display: 'block' }}>{h.title}</b><span className="sm mut">{n ? tn('streak', n) : '—'}</span></span></button>
          <div className="week">{week.map(d => <button key={d} aria-label={h.title + ' ' + d} aria-pressed={dd.has(d)} className={'wd' + (dd.has(d) ? ' on' : '') + (d === day ? ' now' : '')} onClick={() => (tap(), 0) || toggleHabit(h, d, !dd.has(d), sp)}><small>{fmtWeekday(d).slice(0, 2)}</small><i>✓</i></button>)}</div>
        </div> })}</div>}
    {edit && <HabitEdit habit={edit === 'new' ? undefined : edit} onClose={() => setEdit(null)} />}
  </div>
}
