import { useState } from 'react'
import { useStore, curSpace, leaveSpace, toast, rows, upsert } from '../store'
import { today, diffDays, fmtFull, num } from '../lib/dates'
import { t, tn } from '../lib/i18n'
import { spaceName } from '../lib/space'
import { Sheet } from '../ui/Sheet'

export function People() {
  const s = useStore(), sp = curSpace(s), me = s.profile!, [ask, setAsk] = useState(false)
  if (!sp) return null
  const copy = () => navigator.clipboard?.writeText(sp.code).then(() => toast(t('copied'))).catch(() => {})
  return <div className="page">
    <div className="head"><div><h1>{t('people')}</h1><p className="sm mut">{spaceName(sp)} · {tn('people_info', sp.members.length)}</p></div></div>
    <div className="card" style={{ padding: '4px 16px' }}>{sp.members.map(m => <div key={m.id} className="item">
      <span className="av">{m.a}</span><b className="grow ell">{m.n}</b>
      {m.id === me.id && <span className="pill">{t('you')}</span>}{m.id === sp.owner && <span className="sm mut">{t('owner')}</span>}
    </div>)}</div>
    {sp.members.length > 2 && <Pairs />}
    {sp.type === 'solo' ? <p className="sm mut">{t('alone_here')}</p> : <>
      <div className="card col"><h2>{t('invite_title')}</h2><p className="sm mut">{t('invite_hint')}</p>
        <div className="codebox">{sp.code.split('').map((c, i) => <b key={i}>{c}</b>)}</div>
        <button className="btn" style={{ alignSelf: 'center' }} onClick={copy}>{t('copy')}</button></div>
      <button className="btn danger" onClick={() => setAsk(true)}>{t('leave')}</button>
    </>}
    {ask && <Sheet onClose={() => setAsk(false)}><h2>{t('leave_q', spaceName(sp))}</h2><p className="mut">{t('leave_hint')}</p>
      <div className="row"><button className="btn" style={{ background: 'var(--bad)' }} onClick={async () => { setAsk(false); if (!(await leaveSpace(sp.id))) toast(t('err_net')) }}>{t('leave')}</button><button className="btn ghost" onClick={() => setAsk(false)}>{t('cancel')}</button></div></Sheet>}
  </div>
}

export const pairId = (space: string, x: string, y: string) => { const [a, b] = [x, y].sort(); return { id: space + ':' + a + ':' + b, a, b } }
/** Every pair in a group has its own "known each other since" date. Anyone can see them; only the two people in a pair can set theirs. */
function Pairs() {
  const s = useStore(), sp = curSpace(s)!, me = s.profile!.id, dates = rows('pair_dates', sp.id, s), [edit, setEdit] = useState<{ a: string; b: string } | null>(null), [val, setVal] = useState('')
  const pairs: { a: typeof sp.members[number]; b: typeof sp.members[number] }[] = []
  sp.members.forEach((x, i) => sp.members.slice(i + 1).forEach(y => pairs.push({ a: x, b: y })))
  pairs.sort((p, q) => Number(q.a.id === me || q.b.id === me) - Number(p.a.id === me || p.b.id === me))
  const find = (x: string, y: string) => dates.find(d => d.id === pairId(sp.id, x, y).id)
  return <div className="card col"><h2>{t('pairs_title')}</h2><p className="sm mut">{t('pairs_hint')}</p>
    {pairs.map(({ a, b }) => { const d = find(a.id, b.id), mine = a.id === me || b.id === me, days = d ? diffDays(d.since, today()) + 1 : 0
      return <div key={a.id + b.id} className="item">
        <span className="row" style={{ gap: 0 }}><span className="av" style={{ width: 38, height: 38, fontSize: 18 }}>{a.a}</span><span className="av" style={{ width: 38, height: 38, fontSize: 18, marginLeft: -10, background: 'var(--pink)' }}>{b.a}</span></span>
        <span className="grow"><b className="ell" style={{ display: 'block' }}>{a.id === me ? t('you') : a.n} & {b.id === me ? t('you') : b.n}</b>
          <span className="sm mut">{d ? `${num(days)} ${tn('day', days)} · ${fmtFull(d.since)}` : t('pairs_none')}</span></span>
        {mine && <button className="btn sm ghost" onClick={() => { setEdit({ a: a.id, b: b.id }); setVal(d?.since || '') }}>{d ? '✎' : t('set_date')}</button>}</div> })}
    {edit && <Sheet onClose={() => setEdit(null)}><h2>{t('pairs_since')}</h2>
      <input className="inp" type="date" value={val} max={today()} onChange={e => setVal(e.target.value)} />
      <div className="row"><button className="btn" disabled={!val} onClick={() => { const p = pairId(sp.id, edit.a, edit.b); upsert('pair_dates', p.id, { a: p.a, b: p.b, since: val, deleted_at: null }, sp.id); setEdit(null) }}>{t('save')}</button><button className="btn ghost" onClick={() => setEdit(null)}>{t('cancel')}</button></div></Sheet>}
  </div>
}
