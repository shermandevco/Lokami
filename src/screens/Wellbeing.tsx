import { useState } from 'react'
import { useStore, rows, upsert, remove, home, toast, type Item } from '../store'
import { t, tn } from '../lib/i18n'
import { today, addDays, fmtDay, num, diffDays } from '../lib/dates'
import { dayId } from '../lib/me'
import { money, CURRENCIES } from '../lib/money'
import { pickCur } from './Budget'
import { tap } from '../lib/native'
import { Bars } from '../ui/Bars'
import { Sheet } from '../ui/Sheet'

const goalKey = 'lokami_water_goal'
const getGoal = () => { try { return Math.max(1, +(localStorage.getItem(goalKey) || 8)) } catch { return 8 } }

/** Water: a glass that fills up, +/- in one tap, a daily goal and the last 7 days. Stored with the health log. */
export function Water() {
  const s = useStore(), me = s.profile!, h = home(s), d = today(), id = dayId(me.id, d), w = (s.db.health_logs[id]?.water as number) || 0
  const [goal, setGoalS] = useState(getGoal()), pct = Math.min(1, w / goal)
  const setW = (n: number) => { tap(); upsert('health_logs', id, { day: d, water: Math.max(0, n), deleted_at: null }, h); if (n === goal) toast('💧 ' + t('goal_done')) }
  const setGoal = (g: number) => { const v = Math.min(30, Math.max(1, g)); setGoalS(v); try { localStorage.setItem(goalKey, String(v)) } catch { /* ignore */ } }
  const days = Array.from({ length: 7 }, (_, i) => addDays(d, i - 6)), vals = days.map(x => (s.db.health_logs[dayId(me.id, x)]?.water as number) || null)
  const streak = (() => { let n = 0; for (let x = (w >= goal ? d : addDays(d, -1)); ((s.db.health_logs[dayId(me.id, x)]?.water as number) || 0) >= goal; x = addDays(x, -1)) n++; return n })()
  return <div className="page">
    <div className="head"><div><h1>{t('water_t')}</h1><p className="sm mut">🔒 {t('only_you')}</p></div></div>
    <div className="card col" style={{ alignItems: 'center', background: 'var(--sky)', color: 'var(--on)' }}>
      <div className="glass" aria-label={w + '/' + goal}><i style={{ transform: `scaleY(${pct})` }} /><b className="num">{w}<small>/{goal}</small></b></div>
      <div className="row"><button className="icon" aria-label="−1" onClick={() => setW(w - 1)}>−</button><button className="btn" style={{ background: '#fff' }} onClick={() => setW(w + 1)}>💧 +1 {t('glass')}</button></div>
      <span className="sm" style={{ fontWeight: 700 }}>{streak ? '🔥 ' + tn('streak', streak) : t('water_hint')}</span>
    </div>
    <div className="card col"><div className="row between"><b>{t('water_goal')}</b><div className="row" style={{ gap: 6 }}><button className="icon" style={{ width: 38, height: 38 }} onClick={() => setGoal(goal - 1)}>−</button><b className="num" style={{ minWidth: 28, textAlign: 'center' }}>{goal}</b><button className="icon" style={{ width: 38, height: 38 }} onClick={() => setGoal(goal + 1)}>+</button></div></div>
      <span className="cap">{t('last_7')}</span><Bars values={vals} labels={days.map(fmtDay)} color="var(--sky)" /></div>
  </div>
}

const MILES = [1, 3, 7, 14, 30, 60, 90, 180, 365, 730, 1000]
const QICONS = ['🚭', '🍺', '📱', '🍬', '🎮', '☕', '🎰', '🛍️', '🌿', '💊', '🍔', '🔞']
interface QData { since: string; cost?: number; cur?: string; relapses?: string[]; best?: number }
const qd = (i: Item) => i.data as unknown as QData
/** Quitting a habit: days free, money saved, milestones; a slip restarts the counter without blame. */
export function Quit() {
  const s = useStore(), h = home(s), list = rows('items', h, s).filter(i => i.kind === 'quit'), [edit, setEdit] = useState<Item | 'new' | null>(null), [slip, setSlip] = useState<Item | null>(null), now = Date.now()
  return <div className="page">
    <div className="head"><div><h1>{t('quit_t')}</h1><p className="sm mut">🔒 {t('only_you')}</p></div><button className="btn" onClick={() => setEdit('new')}>{t('add')}</button></div>
    {!list.length && <div className="empty"><b>🌱</b>{t('quit_empty')}</div>}
    {list.map(i => { const q = qd(i), ms = now - new Date(q.since).getTime(), days = Math.floor(ms / 864e5), hrs = Math.floor((ms % 864e5) / 36e5)
      const next = MILES.find(m => m > days) || days + 365, best = Math.max(q.best || 0, days), saved = q.cost ? q.cost * ms / 864e5 : 0
      return <div key={i.id} className="card col" style={{ background: 'var(--mint)', color: 'var(--on)' }}>
        <div className="row between"><button className="row" style={{ textAlign: 'left' }} onClick={() => setEdit(i)}><span className="av" style={{ background: '#fff' }}>{(q as { icon?: string }).icon || '🌱'}</span><b style={{ fontSize: 19 }}>{i.title}</b></button><span className="pill" style={{ background: '#fff' }}>🏆 {best} {t('days_short')}</span></div>
        <div className="row" style={{ alignItems: 'baseline', gap: 8 }}><span className="num" style={{ fontSize: 64, fontWeight: 800, letterSpacing: '-.05em', lineHeight: 1 }}>{days}</span><b>{tn('day', days)} {hrs} h</b></div>
        <div className="meter" style={{ background: '#fff' }}><i style={{ transform: `scaleX(${Math.min(1, days / next)})`, background: '#1d1a16' }} /></div>
        <div className="row between sm" style={{ fontWeight: 700 }}><span>{t('quit_next', next, tn('in_days', next - days))}</span>{saved > 0 && <span>💰 {money(Math.floor(saved), q.cur || pickCur(s.lang))}</span>}</div>
        <div className="row"><button className="btn ghost sm" onClick={() => setSlip(i)}>{t('quit_slip')}</button>{(q.relapses || []).length > 0 && <span className="sm" style={{ opacity: .75 }}>{t('quit_restarts', (q.relapses || []).length)}</span>}</div>
      </div> })}
    <p className="sm mut">{t('quit_note')}</p>
    {edit && <QuitEdit item={edit === 'new' ? undefined : edit} onClose={() => setEdit(null)} />}
    {slip && <Sheet onClose={() => setSlip(null)}><h2>{t('quit_slip_q')}</h2><p className="mut">{t('quit_slip_hint')}</p>
      <div className="row wrap"><button className="btn" onClick={() => { const q = qd(slip), days = diffDays(q.since.slice(0, 10), today()); upsert('items', slip.id, { data: { ...q, since: new Date().toISOString(), best: Math.max(q.best || 0, days), relapses: [...(q.relapses || []), new Date().toISOString()] } as never }); setSlip(null); toast('🌱 ' + t('quit_again')) }}>{t('quit_restart')}</button><button className="btn ghost" onClick={() => setSlip(null)}>{t('cancel')}</button></div></Sheet>}
  </div>
}
function QuitEdit({ item, onClose }: { item?: Item; onClose: () => void }) {
  const s = useStore(), q = item ? qd(item) : null
  const [title, setTitle] = useState(item?.title || ''), [icon, setIcon] = useState((q as { icon?: string } | null)?.icon || '🚭'), [since, setSince] = useState(q ? q.since.slice(0, 10) : today()), [cost, setCost] = useState(q?.cost ? String(q.cost) : ''), [cur, setCur] = useState(q?.cur || pickCur(s.lang))
  const save = () => { if (!title.trim()) return; const keepTime = q && q.since.slice(0, 10) === since
    upsert('items', item?.id || crypto.randomUUID(), { kind: 'quit', title: title.trim(), note: null, done: false, rating: null, for_user: null, data: { ...(q || {}), icon, since: keepTime ? q!.since : new Date(since + 'T' + (since === today() ? new Date().toTimeString().slice(0, 5) : '00:00')).toISOString(), cost: parseFloat(cost.replace(',', '.')) || undefined, cur } as never, deleted_at: null }, home(s)); onClose() }
  return <Sheet onClose={onClose}><h2>{item ? item.title : t('quit_new')}</h2>
    <div className="chips">{QICONS.map(i => <button key={i} className={'chip' + (icon === i ? ' on' : '')} style={{ fontSize: 18, padding: '0 10px' }} onClick={() => setIcon(i)}>{i}</button>)}</div>
    <input className="inp" autoFocus placeholder={t('quit_ph')} value={title} maxLength={60} onChange={e => setTitle(e.target.value)} />
    <label className="label">{t('quit_since')}<input className="inp" type="date" value={since} max={today()} onChange={e => setSince(e.target.value)} /></label>
    <div className="row"><label className="label grow">{t('quit_cost')}<input className="inp" inputMode="decimal" value={cost} onChange={e => setCost(e.target.value)} /></label>
      <label className="label" style={{ width: 100 }}>{t('currency')}<select className="inp" value={cur} onChange={e => setCur(e.target.value)}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></label></div>
    <div className="row wrap"><button className="btn" disabled={!title.trim()} onClick={save}>{item ? t('save') : t('add')}</button><button className="btn ghost" onClick={onClose}>{t('cancel')}</button>{item && <button className="btn danger" onClick={() => { remove('items', item.id); onClose() }}>{t('delete')}</button>}</div></Sheet>
}
void num
