import { useStore, rows, home, go, editTask } from '../store'
import { t } from '../lib/i18n'
import { today, weekday, fmtFull } from '../lib/dates'
import { doneDays } from '../lib/me'
import { MoodPicker } from './Mood'
import { toggleHabit } from './Habits'
import { dueLabel } from './Tasks'

export function Today() {
  const s = useStore(), me = s.profile!, h = home(s), day = today(), hr = new Date().getHours()
  const hello = t(hr < 12 ? 'hello_morning' : hr < 18 ? 'hello_day' : 'hello_evening', me.n)
  const habits = rows('habits', h, s).filter(x => !x.archived).sort((a, b) => a.sort - b.sort), logs = rows('habit_logs', h, s)
  const ids = new Set(s.spaces.map(x => x.id))
  const tasks = Object.values(s.db.tasks).filter(x => ids.has(x.space_id) && !x.deleted_at && !x.done && x.due && x.due <= day && (!x.assignee || x.assignee === me.id))
  const events = Object.values(s.db.events).filter(e => ids.has(e.space_id) && !e.deleted_at && e.day === day).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'))
  const page = s.db.diary_pages[me.id + ':' + day]
  const spaceName = (id: string) => { const x = s.spaces.find(y => y.id === id); return x && x.type !== 'solo' ? (x.name || '') : '' }
  return <div className="page">
    <div className="head"><div><p className="cap">{weekday(new Date())} · {fmtFull(day)}</p><h1>{hello}</h1></div></div>
    <div className="card col"><h2>{t('mood_q')}</h2><MoodPicker compact /></div>
    {habits.length > 0 && <div className="card col"><div className="row between"><h2>{t('habits')}</h2><button className="sm mut" onClick={() => go('habits')}>{t('habits_today', habits.filter(x => doneDays(logs, x.id).has(day)).length, habits.length)} ›</button></div>
      <div className="chips">{habits.map(x => { const on = doneDays(logs, x.id).has(day); return <button key={x.id} className={'chip' + (on ? ' on' : '')} aria-pressed={on} onClick={() => toggleHabit(x, day, !on, h)}>{x.icon} {x.title}</button> })}</div></div>}
    <div className="card col"><div className="row between"><h2>{t('agenda')}</h2><button className="sm mut" onClick={() => go('planner')}>{t('planner')} ›</button></div>
      {!events.length && !tasks.length ? <p className="mut sm">{t('nothing_today')}</p> : <div>
        {events.map(e => <div key={e.id} className="item"><span className="time num">{e.time || '•'}</span><span className="grow ell" style={{ fontWeight: 600 }}>{e.title}</span><span className="sm mut">{spaceName(e.space_id)}</span></div>)}
        {tasks.map(x => <div key={x.id} className="item"><button className="check" aria-label={t('done')} onClick={() => editTask(x.id, { done: true })}>✓</button><span className="grow ell" style={{ fontWeight: 600 }}>{x.title}</span>{x.due! < day && <span className="pill bad">{dueLabel(x.due)}</span>}<span className="sm mut">{spaceName(x.space_id)}</span></div>)}
      </div>}</div>
    <button className="card row" style={{ textAlign: 'left' }} onClick={() => go('diary')}><span className="av">📓</span><span className="grow"><b>{t('diary')}</b><span className="sm mut ell" style={{ display: 'block' }}>{page?.body?.trim() ? page.body.trim().slice(0, 80) : t('diary_write')}</span></span><span className="mut">›</span></button>
  </div>
}
