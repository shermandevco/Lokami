import { useState } from 'react'
import { useStore, curSpace, setLayout, go, type Route } from '../store'
import { t } from '../lib/i18n'
import { MODULES, fits, onHome, type Group } from '../lib/modules'

/** Catalogue of every module: open any of them, and choose which ones live on the home screen. */
export function All() {
  const s = useStore(), sp = curSpace(s)!, lay = s.layouts[s.cur] || {}, adult = !!s.profile?.adult
  const [q, setQ] = useState('')
  const all = MODULES.filter(m => fits(m, sp.type, adult)), mods = q.trim() ? all.filter(m => t(m.label).toLowerCase().includes(q.trim().toLowerCase())) : all
  const recent = (s.recent || []).map(r => all.find(m => m.id === r)).filter((m): m is typeof all[number] => !!m).slice(0, 4)
  const toggle = (id: string, home: boolean, on: boolean) => home
    ? setLayout({ hidden: on ? [...(lay.hidden || []), id] : (lay.hidden || []).filter(x => x !== id) })
    : setLayout({ added: on ? (lay.added || []).filter(x => x !== id) : [...(lay.added || []), id] })
  const groups = [...new Set(mods.map(m => m.group))] as Group[]
  return <div className="page">
    <div className="head"><h1>{t('all_modules')}</h1></div>
    <input className="inp" type="search" placeholder={'🔍 ' + t('search')} value={q} onChange={e => setQ(e.target.value)} />
    {!q && recent.length > 0 && <><p className="cap">{t('recent')}</p><div className="grid">{recent.map(m => <button key={m.id} className="tile" style={{ minHeight: 96, "--c": m.color } as React.CSSProperties} onClick={() => go(m.id as Route)}><b>{t(m.label)}</b><span className="em" style={{ fontSize: 32 }}>{m.em}</span></button>)}</div></>}
    {groups.map(g => <div key={g} className="col"><p className="cap">{t(g)}</p>
      <div className="card" style={{ padding: '4px 16px' }}>{mods.filter(m => m.group === g).map(m => { const on = onHome(m, lay)
        return <div key={m.id} className="item"><button className="row grow" style={{ textAlign: 'left' }} onClick={() => go(m.id as Route)}><span className="av" style={{ background: m.color }}>{m.em}</span><b className="grow ell">{t(m.label)}</b></button>
          <button className={'chip' + (on ? ' on' : '')} aria-pressed={on} onClick={() => toggle(m.id, !!m.home, on)}>{on ? '✓ ' + t('pinned') : '+ ' + t('pin')}</button></div> })}</div></div>)}
    <p className="sm mut">{t('modules_hint')} {t('pin_hint')}</p>
    {!adult && <p className="sm mut">🔞 {t('adult_hint')}</p>}
  </div>
}
