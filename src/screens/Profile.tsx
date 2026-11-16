import { useState } from 'react'
import { useStore, setLook, changeLang, updateProfile, signOut, deleteAccount, toast } from '../store'
import { t, LANGS } from '../lib/i18n'
import { Sheet } from '../ui/Sheet'

const ACCENTS = ['#e6336e', '#7c5cff', '#3b82f6', '#19a57a', '#f08a24', '#17171a']
const BGS = ['plain', 'accent', 'aurora', 'sunset', 'ocean', 'forest']
const AVATARS = ['🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸', '🐵', '🦄', '🐙', '🌸', '🌻', '🍀', '⭐', '🌙', '🔥']

export function Profile() {
  const s = useStore(), me = s.profile!, [name, setName] = useState(me.n), [del, setDel] = useState(false)
  return <div className="page">
    <div className="head"><h1>{t('profile')}</h1></div>
    <div className="card col">
      <div className="row"><span className="av" style={{ width: 56, height: 56, fontSize: 30 }}>{me.a}</span>
        <div className="grow col" style={{ gap: 2 }}><input className="inp" value={name} maxLength={40} onChange={e => setName(e.target.value)} onBlur={() => name.trim() && name.trim() !== me.n && updateProfile({ n: name.trim() })} aria-label={t('name')} /><span className="sm mut ell">{me.email}</span></div></div>
      <div className="label">{t('avatar')}<div className="chips">{AVATARS.map(a => <button key={a} className={'chip' + (me.a === a ? ' on' : '')} style={{ fontSize: 18, padding: '0 10px' }} onClick={() => updateProfile({ a })}>{a}</button>)}</div></div>
    </div>
    <div className="card col"><h2>{t('appearance')}</h2>
      <div className="label">{t('theme')}<div className="seg">{(['auto', 'light', 'dark'] as const).map(m => <button key={m} className={s.look.mode === m ? 'on' : ''} onClick={() => setLook({ mode: m })}>{t(('theme_' + m) as 'theme_auto')}</button>)}</div></div>
      <div className="label">{t('accent')}<div className="chips">{ACCENTS.map(c => <button key={c} aria-label={c} className={'swatch' + (s.look.accent === c ? ' on' : '')} style={{ background: c }} onClick={() => setLook({ accent: c })} />)}</div></div>
      <div className="label">{t('background')}<div className="chips">{BGS.map(b => <button key={b} aria-label={b} data-bg={b} className={'bgsw' + (s.look.bg === b ? ' on' : '')} style={bgStyle(b)} onClick={() => setLook({ bg: b })} />)}</div></div>
      <div className="label">{t('language')}<div className="seg">{LANGS.map((l, i) => <button key={l.code} className={s.lang === i ? 'on' : ''} onClick={() => changeLang(i)}>{l.label}</button>)}</div></div>
    </div>
    {'Notification' in window && Notification.permission === 'default' && <button className="btn ghost" onClick={() => Notification.requestPermission().then(() => toast('🔔'))}>🔔 {t('notif_on')}</button>}
    <div className="row wrap"><button className="btn ghost" onClick={() => signOut()}>{t('sign_out')}</button><button className="btn danger" onClick={() => setDel(true)}>{t('delete_account')}</button></div>
    <p className="sm mut">Lokami 2.0 · <a href="../" style={{ color: 'inherit' }}>{t('open_classic')}</a></p>
    {del && <Sheet onClose={() => setDel(false)}><h2>{t('delete_q')}</h2><p className="mut">{t('delete_hint')}</p>
      <div className="row wrap"><button className="btn" style={{ background: 'var(--bad)' }} onClick={async () => { if (!(await deleteAccount())) toast(t('err_net')) }}>{t('delete_yes')}</button><button className="btn ghost" onClick={() => setDel(false)}>{t('cancel')}</button></div></Sheet>}
  </div>
}
const G: Record<string, string> = { accent: 'var(--accent)', aurora: '#7c5cff,#19c3a6', sunset: '#ff7850,#ec4899', ocean: '#3882f6,#22d3ee', forest: '#22a06e,#a0c846' }
const bgStyle = (b: string) => b === 'plain' ? {} : { background: b === 'accent' ? 'linear-gradient(135deg,var(--accent),var(--bg))' : `linear-gradient(135deg,${G[b]})` }
