import { useState } from 'react'
import { signIn, signUp, changeLang, useStore } from '../store'
import { t, LANGS } from '../lib/i18n'

export function Auth() {
  const s = useStore()
  const [mode, setMode] = useState<'in' | 'up'>('in'), [n, setN] = useState(''), [e, setE] = useState(''), [p, setP] = useState('')
  const [err, setErr] = useState(''), [info, setInfo] = useState(''), [busy, setBusy] = useState(false)
  const map = (m: string) => /invalid login/i.test(m) ? t('err_login') : /not confirmed/i.test(m) ? t('err_confirm') : /rate|too many/i.test(m) ? t('err_rate') : /already/i.test(m) ? t('err_exists') : /fetch|network/i.test(m) ? t('err_net') : m
  async function submit(ev: React.FormEvent) {
    ev.preventDefault(); setErr(''); setInfo('')
    if (mode === 'up' && !n.trim()) return setErr(t('err_name'))
    if (!/^\S+@\S+\.\S+$/.test(e)) return setErr(t('err_email'))
    if (p.length < 6) return setErr(t('err_password'))
    setBusy(true)
    const r = mode === 'in' ? await signIn(e.trim(), p) : await signUp(n.trim(), e.trim(), p)
    setBusy(false)
    if (r === 'confirm') { setInfo(t('check_email', e.trim())); setMode('in') } else if (r) setErr(map(r))
  }
  return <div className="auth">
    <div className="langs">{LANGS.map((l, i) => <button key={l.code} className={s.lang === i ? 'on' : ''} onClick={() => changeLang(i)}>{l.code.toUpperCase()}</button>)}</div>
    <div className="col" style={{ gap: 20 }}>
      <div className="brand"><span className="logo" />Lokami</div>
      <h1>{t('auth_title')}</h1>
      <p className="mut">{t('auth_sub')}</p>
      <p className="sm mut">{t('auth_meaning')}</p>
    </div>
    <form className="card col" onSubmit={submit} noValidate>
      <div className="seg"><button type="button" className={mode === 'in' ? 'on' : ''} onClick={() => setMode('in')}>{t('sign_in')}</button><button type="button" className={mode === 'up' ? 'on' : ''} onClick={() => setMode('up')}>{t('sign_up')}</button></div>
      {mode === 'up' && <input className="inp" placeholder={t('name')} value={n} onChange={x => setN(x.target.value)} autoComplete="given-name" maxLength={40} />}
      <input className="inp" type="email" placeholder={t('email')} value={e} onChange={x => setE(x.target.value)} autoComplete="email" />
      <input className="inp" type="password" placeholder={t('password')} value={p} onChange={x => setP(x.target.value)} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} />
      {err && <p className="sm" style={{ color: 'var(--bad)' }} role="alert">{err}</p>}
      {info && <p className="sm" style={{ color: 'var(--ok)' }}>{info}</p>}
      <button className="btn full" disabled={busy}>{mode === 'in' ? t('sign_in') : t('sign_up')}</button>
      <p className="sm mut">{t('auth_privacy')}</p>
    </form>
  </div>
}
