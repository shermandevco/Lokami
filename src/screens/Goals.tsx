import { useState } from 'react'
import { useStore, rows, upsert, remove, type Goal } from '../store'
import { t } from '../lib/i18n'
import { today, fmtDay, num, diffDays } from '../lib/dates'
import { Sheet } from '../ui/Sheet'

const ICONS = ['🎯', '📚', '🏃', '🎸', '🎨', '📷', '🧗', '🏊', '💰', '🌍', '🧩', '🍳', '✍️', '🎮', '🧶', '🌱']
export function goalStats(g: Goal, logs: { goal_id: string; amount: number; day: string }[], now = today()) {
  const mine = logs.filter(l => l.goal_id === g.id), total = mine.reduce((a, l) => a + l.amount, 0), month = mine.filter(l => l.day.startsWith(now.slice(0, 7))).reduce((a, l) => a + l.amount, 0)
  return { total, month, pct: g.target ? Math.min(1, total / g.target) : 0, reached: !!g.target && total >= g.target }
}

function GoalEdit({ goal, onClose }: { goal?: Goal; onClose: () => void }) {
  const [title, setTitle] = useState(goal?.title || ''), [icon, setIcon] = useState(goal?.icon || '🎯'), [target, setTarget] = useState(goal?.target ? String(goal.target) : ''), [unit, setUnit] = useState(goal?.unit || ''), [due, setDue] = useState(goal?.due || '')
  function save(e: React.FormEvent) { e.preventDefault(); if (!title.trim()) return
    upsert('goals', goal?.id || crypto.randomUUID(), { title: title.trim(), icon, target: parseFloat(target.replace(',', '.')) || null, unit: unit.trim() || null, due: due || null, done: false, deleted_at: null }); onClose() }
  return <Sheet onClose={onClose}><form className="col" onSubmit={save}>
    <h2>{goal ? goal.title : t('goal_new')}</h2>
    <div className="chips">{ICONS.map(i => <button type="button" key={i} className={'chip' + (icon === i ? ' on' : '')} style={{ fontSize: 18, padding: '0 10px' }} onClick={() => setIcon(i)}>{i}</button>)}</div>
    <input className="inp" autoFocus placeholder={t('goal_placeholder')} value={title} maxLength={80} onChange={e => setTitle(e.target.value)} />
    <div className="row"><label className="label grow">{t('target')}<input className="inp" inputMode="decimal" value={target} onChange={e => setTarget(e.target.value)} /></label><label className="label" style={{ width: 110 }}>{t('unit')}<input className="inp" value={unit} maxLength={16} onChange={e => setUnit(e.target.value)} /></label></div>
    <label className="label">{t('goal_due')}<input className="inp" type="date" value={due} onChange={e => setDue(e.target.value)} /></label>
    <p className="sm mut">{t('goal_hint')}</p>
    <div className="row wrap"><button className="btn" disabled={!title.trim()}>{goal ? t('save') : t('add')}</button><button type="button" className="btn ghost" onClick={onClose}>{t('cancel')}</button>
      {goal && <button type="button" className="btn danger" onClick={() => { remove('goals', goal.id); onClose() }}>{t('delete')}</button>}</div>
  </form></Sheet>
}

function Progress({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const [amount, setAmount] = useState('1'), [note, setNote] = useState('')
  const n = parseFloat(amount.replace(',', '.'))
  return <Sheet onClose={onClose}><form className="col" onSubmit={e => { e.preventDefault(); if (!n) return; upsert('goal_logs', crypto.randomUUID(), { goal_id: goal.id, day: today(), amount: n, note: note.trim() || null, deleted_at: null }); onClose() }}>
    <h2>{goal.icon} {goal.title}</h2>
    <div className="row"><input className="inp grow num" inputMode="decimal" autoFocus value={amount} onChange={e => setAmount(e.target.value)} style={{ fontSize: 22, fontWeight: 800 }} />{goal.unit && <span className="mut">{goal.unit}</span>}</div>
    <div className="chips">{[1, 5, 10, 30, 60].map(v => <button type="button" key={v} className="chip" onClick={() => setAmount(String(v))}>+{v}</button>)}</div>
    <input className="inp" placeholder={t('note')} value={note} maxLength={200} onChange={e => setNote(e.target.value)} />
    <div className="row"><button className="btn" disabled={!n}>{t('add')}</button><button type="button" className="btn ghost" onClick={onClose}>{t('cancel')}</button></div>
  </form></Sheet>
}

export function Goals() {
  const s = useStore(), goals = rows('goals', s.cur, s).sort((a, b) => a.edited_at.localeCompare(b.edited_at)), logs = rows('goal_logs', s.cur, s)
  const [edit, setEdit] = useState<Goal | 'new' | null>(null), [prog, setProg] = useState<Goal | null>(null)
  return <div className="page">
    <div className="head"><h1>{t('goals')}</h1><button className="btn" onClick={() => setEdit('new')}>{t('add')}</button></div>
    {!goals.length && <div className="empty"><b>🎯</b>{t('goals_empty')}</div>}
    <div className="col">{goals.map(g => { const st = goalStats(g, logs), left = g.due ? diffDays(today(), g.due) : null
      return <div key={g.id} className="card col" style={{ gap: 10 }}>
        <div className="row"><button className="row grow" style={{ textAlign: 'left' }} onClick={() => setEdit(g)}><span className="av">{g.icon}</span><span className="grow"><b className="ell" style={{ display: 'block' }}>{g.title}</b>
          <span className="sm mut">{g.target ? `${num(st.total)} / ${num(g.target)} ${g.unit || ''}` : t('month_total', `${num(st.month)} ${g.unit || ''}`.trim())}{g.due && !st.reached ? ' · ' + fmtDay(g.due) + (left !== null && left >= 0 ? '' : ' ⚠️') : ''}</span></span></button>
          <button className="btn sm" onClick={() => setProg(g)} aria-label={t('add_progress')}>+</button></div>
        {g.target ? <div className="meter" role="progressbar" aria-valuenow={Math.round(st.pct * 100)} aria-valuemin={0} aria-valuemax={100}><i style={{ transform: `scaleX(${st.pct})` }} /></div> : null}
        {st.reached && <span className="pill" style={{ alignSelf: 'flex-start' }}>{t('goal_done')}</span>}
      </div> })}</div>
    {edit && <GoalEdit goal={edit === 'new' ? undefined : edit} onClose={() => setEdit(null)} />}
    {prog && <Progress goal={prog} onClose={() => setProg(null)} />}
  </div>
}
