import { useState } from 'react'
import { useStore, spaceTasks, curSpace, addTask, editTask, removeTask, type Task } from '../store'
import { t, tn } from '../lib/i18n'
import { today, diffDays, fmtDay } from '../lib/dates'
import { Sheet } from '../ui/Sheet'

export function dueLabel(d: string | null) {
  if (!d) return ''
  const n = diffDays(today(), d)
  return n < 0 ? t('overdue') : n === 0 ? t('today') : n === 1 ? t('tomorrow') : fmtDay(d)
}
export const sortTasks = (a: Task, b: Task) => (a.due || '9999').localeCompare(b.due || '9999') || a.edited_at.localeCompare(b.edited_at)

export function NewTask({ onClose, edit }: { onClose: () => void; edit?: Task }) {
  const s = useStore(), sp = curSpace(s)
  const [title, setTitle] = useState(edit?.title || ''), [due, setDue] = useState(edit?.due || ''), [who, setWho] = useState(edit?.assignee || '')
  function save(e: React.FormEvent) {
    e.preventDefault(); if (!title.trim()) return
    if (edit) editTask(edit.id, { title: title.trim(), due: due || null, assignee: who || null }); else addTask(title, due || null, who || null)
    onClose()
  }
  return <Sheet onClose={onClose}><form className="col" onSubmit={save}>
    <h2>{edit ? t('save') : t('task_new')}</h2>
    <input className="inp" autoFocus placeholder={t('task_placeholder')} value={title} onChange={e => setTitle(e.target.value)} maxLength={200} />
    <label className="label">{t('task_due')}<input className="inp" type="date" value={due} onChange={e => setDue(e.target.value)} /></label>
    {sp && sp.members.length > 1 && <div className="label">{t('task_for')}<div className="chips">
      <button type="button" className={'chip' + (!who ? ' on' : '')} onClick={() => setWho('')}>{t('anyone')}</button>
      {sp.members.map(m => <button type="button" key={m.id} className={'chip' + (who === m.id ? ' on' : '')} onClick={() => setWho(m.id)}>{m.a} {m.n}</button>)}
    </div></div>}
    <div className="row"><button className="btn" disabled={!title.trim()}>{edit ? t('save') : t('add')}</button><button type="button" className="btn ghost" onClick={onClose}>{t('cancel')}</button></div>
  </form></Sheet>
}

function Row({ tk }: { tk: Task }) {
  const s = useStore(), [edit, setEdit] = useState(false)
  const who = tk.assignee ? curSpace(s)?.members.find(m => m.id === tk.assignee) : null
  const late = tk.due && !tk.done && tk.due < today()
  return <div className={'item' + (tk.done ? ' done' : '')}>
    <button className={'check' + (tk.done ? ' on' : '')} aria-label={t('done')} aria-pressed={tk.done} onClick={() => editTask(tk.id, { done: !tk.done })}>✓</button>
    <button className="grow" style={{ textAlign: 'left' }} onClick={() => setEdit(true)}>
      <div className="title ell" style={{ fontWeight: 600 }}>{tk.title}</div>
      {(tk.due || who) && <div className="row sm mut" style={{ gap: 8 }}>{tk.due && <span className={late ? 'pill bad' : ''}>{dueLabel(tk.due)}</span>}{who && <span>{who.a} {who.n}</span>}</div>}
    </button>
    <button className="x" aria-label={t('delete')} onClick={() => removeTask(tk.id, t('undo'), t('deleted'))}>×</button>
    {edit && <NewTask edit={tk} onClose={() => setEdit(false)} />}
  </div>
}

export function Tasks() {
  const s = useStore(), all = spaceTasks(s), open = all.filter(x => !x.done).sort(sortTasks), done = all.filter(x => x.done).sort((a, b) => b.edited_at.localeCompare(a.edited_at))
  const [q, setQ] = useState('')
  return <div className="page">
    <div className="head"><div><h1>{t('tasks')}</h1><p className="sm mut">{open.length ? tn('tasks_info_left', open.length) : all.length ? t('tasks_all_done') : ''}</p></div></div>
    <form className="row" onSubmit={e => { e.preventDefault(); addTask(q); setQ('') }}>
      <input className="inp grow" placeholder={t('task_placeholder')} value={q} onChange={e => setQ(e.target.value)} maxLength={200} />
      <button className="btn" disabled={!q.trim()}>{t('add')}</button>
    </form>
    {!all.length ? <div className="empty"><b>✅</b>{t('tasks_empty')}</div> : <>
      {open.length > 0 && <div className="card" style={{ paddingTop: 4, paddingBottom: 4 }}>{open.map(x => <Row key={x.id} tk={x} />)}</div>}
      {done.length > 0 && <><p className="cap">{t('done_section')}</p><div className="card" style={{ paddingTop: 4, paddingBottom: 4 }}>{done.map(x => <Row key={x.id} tk={x} />)}</div></>}
    </>}
  </div>
}
