import { useState } from 'react'
import { useStore, curSpace, leaveSpace, toast } from '../store'
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
