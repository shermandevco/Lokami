import { useState } from 'react'
import { useStore, rows, upsert, remove, editTask, type Event } from '../store'
import { t } from '../lib/i18n'
import { today, addDays, weekStart, fmtWeekday, fmtFull, parse } from '../lib/dates'
import { Sheet } from '../ui/Sheet'

export function EventEdit({ ev, day, onClose }: { ev?: Event; day?: string; onClose: () => void }) {
  const [title, setTitle] = useState(ev?.title || ''), [d, setD] = useState(ev?.day || day || today()), [time, setTime] = useState(ev?.time || ''), [note, setNote] = useState(ev?.note || '')
  function save(e: React.FormEvent) { e.preventDefault(); if (!title.trim() || !d) return
    upsert('events', ev?.id || crypto.randomUUID(), { title: title.trim(), day: d, time: time || null, note: note.trim() || null, deleted_at: null }); onClose() }
  return <Sheet onClose={onClose}><form className="col" onSubmit={save}>
    <h2>{ev ? ev.title : t('event_new')}</h2>
    <input className="inp" autoFocus placeholder={t('event_placeholder')} value={title} maxLength={200} onChange={e => setTitle(e.target.value)} />
    <div className="row"><label className="label grow">{t('task_due')}<input className="inp" type="date" value={d} onChange={e => setD(e.target.value)} /></label>
      <label className="label grow">{t('time')}<input className="inp" type="time" value={time} onChange={e => setTime(e.target.value)} /></label></div>
    <input className="inp" placeholder={t('note')} value={note} maxLength={2000} onChange={e => setNote(e.target.value)} />
    <div className="row wrap"><button className="btn" disabled={!title.trim()}>{ev ? t('save') : t('add')}</button><button type="button" className="btn ghost" onClick={onClose}>{t('cancel')}</button>
      {ev && <button type="button" className="btn danger" onClick={() => { remove('events', ev.id); onClose() }}>{t('delete')}</button>}</div>
  </form></Sheet>
}

export function Planner() {
  const s = useStore(), [day, setDay] = useState(today()), [edit, setEdit] = useState<Event | 'new' | null>(null)
  const start = weekStart(day), week = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  const events = rows('events', s.cur, s), tasks = rows('tasks', s.cur, s)
  const busy = new Set([...events.map(e => e.day), ...tasks.filter(x => x.due && !x.done).map(x => x.due!)])
  const dayEvents = events.filter(e => e.day === day).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'))
  const dayTasks = tasks.filter(x => x.due === day)
  const month = new Intl.DateTimeFormat(document.documentElement.lang, { month: 'long', year: 'numeric' }).format(parse(day))
  return <div className="page">
    <div className="head"><div><h1>{t('planner')}</h1><p className="sm mut" style={{ textTransform: 'capitalize' }}>{month}</p></div><button className="btn" onClick={() => setEdit('new')}>{t('add')}</button></div>
    <div className="row" style={{ gap: 8 }}>
      <button className="icon" aria-label={t('prev_day')} onClick={() => setDay(addDays(day, -7))}>‹</button>
      <div className="strip grow">{week.map(d => <button key={d} className={'sd' + (d === day ? ' on' : '') + (d === today() ? ' now' : '')} onClick={() => setDay(d)} aria-pressed={d === day}>
        <small>{fmtWeekday(d)}</small><b>{parse(d).getDate()}</b>{busy.has(d) && <i />}</button>)}</div>
      <button className="icon" aria-label={t('next_day')} onClick={() => setDay(addDays(day, 7))}>›</button>
    </div>
    {day !== today() && <button className="chip" style={{ alignSelf: 'center' }} onClick={() => setDay(today())}>{t('go_today')}</button>}
    <p className="cap">{fmtFull(day)}</p>
    {!dayEvents.length && !dayTasks.length ? <div className="empty"><b>🗓️</b>{t('day_empty')}</div> :
      <div className="card" style={{ padding: '4px 16px' }}>
        {dayEvents.map(e => <button key={e.id} className="item" style={{ width: '100%', textAlign: 'left' }} onClick={() => setEdit(e)}>
          <span className="time num">{e.time || '•'}</span><span className="grow"><b className="ell" style={{ display: 'block', fontWeight: 600 }}>{e.title}</b>{e.note && <span className="sm mut ell" style={{ display: 'block' }}>{e.note}</span>}</span></button>)}
        {dayTasks.map(x => <div key={x.id} className={'item' + (x.done ? ' done' : '')}><button className={'check' + (x.done ? ' on' : '')} aria-label={t('done')} onClick={() => editTask(x.id, { done: !x.done })}>✓</button><span className="title grow ell" style={{ fontWeight: 600 }}>{x.title}</span></div>)}
      </div>}
    {edit && <EventEdit ev={edit === 'new' ? undefined : edit} day={day} onClose={() => setEdit(null)} />}
  </div>
}
