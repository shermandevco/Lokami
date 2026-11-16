import { useState } from 'react'
import { useStore, rows, upsert, remove, type Car, type CarLog } from '../store'
import { t } from '../lib/i18n'
import { today, diffDays, fmtDay, fmtFull, num } from '../lib/dates'
import { money } from '../lib/money'
import { pickCur } from './Budget'
import { Sheet } from '../ui/Sheet'
import type { Key } from '../i18n/en'

const ICONS = ['🚗', '🚙', '🏎️', '🚐', '🛻', '🏍️', '🛵', '🚲']
const KIND_ICON = { fuel: '⛽', service: '🔧', repair: '🛠️', other: '📎' } as const

/** Latest known mileage and what is coming up for a car. */
export function carStatus(car: Car, logs: CarLog[], now = today()) {
  const mine = logs.filter(l => l.car_id === car.id), km = Math.max(0, ...mine.map(l => l.mileage || 0))
  const lastService = Math.max(0, ...mine.filter(l => l.kind === 'service').map(l => l.mileage || 0))
  const serviceLeft = car.service_every && lastService ? lastService + car.service_every - km : null
  const dates = ([['insurance', car.insurance_until], ['inspection', car.inspection_until]] as const).filter(([, d]) => d).map(([k, d]) => ({ k, d: d!, left: diffDays(now, d!) }))
  const spent = mine.filter(l => l.day.startsWith(now.slice(0, 4))).reduce((a, l) => a + (l.cost || 0), 0)
  return { km, serviceLeft, dates, spent, logs: mine.sort((a, b) => b.day.localeCompare(a.day)) }
}

function CarEdit({ car, onClose }: { car?: Car; onClose: () => void }) {
  const [f, setF] = useState({ name: car?.name || '', plate: car?.plate || '', year: car?.year ? String(car.year) : '', icon: car?.icon || '🚗', service_every: car?.service_every ? String(car.service_every) : '15000', insurance_until: car?.insurance_until || '', inspection_until: car?.inspection_until || '' })
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })
  function save(e: React.FormEvent) { e.preventDefault(); if (!f.name.trim()) return
    upsert('cars', car?.id || crypto.randomUUID(), { name: f.name.trim(), plate: f.plate.trim() || null, year: +f.year || null, icon: f.icon, service_every: +f.service_every || null, insurance_until: f.insurance_until || null, inspection_until: f.inspection_until || null, deleted_at: null }); onClose() }
  return <Sheet onClose={onClose}><form className="col" onSubmit={save}>
    <h2>{car ? car.name : t('car_new')}</h2>
    <div className="chips">{ICONS.map(i => <button type="button" key={i} className={'chip' + (f.icon === i ? ' on' : '')} style={{ fontSize: 18, padding: '0 10px' }} onClick={() => setF({ ...f, icon: i })}>{i}</button>)}</div>
    <input className="inp" autoFocus placeholder={t('car_name')} value={f.name} maxLength={60} onChange={set('name')} />
    <div className="row"><input className="inp grow" placeholder={t('plate')} value={f.plate} maxLength={15} onChange={set('plate')} /><input className="inp" style={{ width: 96 }} inputMode="numeric" placeholder={t('year')} value={f.year} onChange={set('year')} /></div>
    <label className="label">{t('service_every')}<input className="inp" inputMode="numeric" value={f.service_every} onChange={set('service_every')} /></label>
    <div className="row"><label className="label grow">{t('insurance')}<input className="inp" type="date" value={f.insurance_until} onChange={set('insurance_until')} /></label><label className="label grow">{t('inspection')}<input className="inp" type="date" value={f.inspection_until} onChange={set('inspection_until')} /></label></div>
    <div className="row wrap"><button className="btn" disabled={!f.name.trim()}>{car ? t('save') : t('add')}</button><button type="button" className="btn ghost" onClick={onClose}>{t('cancel')}</button>
      {car && <button type="button" className="btn danger" onClick={() => { remove('cars', car.id); onClose() }}>{t('delete')}</button>}</div>
  </form></Sheet>
}

function LogEdit({ car, log, km, onClose }: { car: Car; log?: CarLog; km: number; onClose: () => void }) {
  const s = useStore(), cur = pickCur(s.lang)
  const [kind, setKind] = useState<CarLog['kind']>(log?.kind || 'fuel'), [title, setTitle] = useState(log?.title || ''), [cost, setCost] = useState(log?.cost != null ? String(log.cost) : ''), [mileage, setMileage] = useState(log?.mileage ? String(log.mileage) : km ? String(km) : ''), [day, setDay] = useState(log?.day || today())
  function save(e: React.FormEvent) { e.preventDefault()
    upsert('car_logs', log?.id || crypto.randomUUID(), { car_id: car.id, kind, title: title.trim() || null, cost: cost ? parseFloat(cost.replace(',', '.')) || null : null, mileage: +mileage || null, day, deleted_at: null }); onClose() }
  return <Sheet onClose={onClose}><form className="col" onSubmit={save}>
    <h2>{car.icon} {log ? t('save') : t('log_new')}</h2>
    <div className="seg">{(['fuel', 'service', 'repair', 'other'] as const).map(k => <button type="button" key={k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>{KIND_ICON[k]} {t(('kind_' + k) as Key)}</button>)}</div>
    <input className="inp" placeholder={t('note')} value={title} maxLength={120} onChange={e => setTitle(e.target.value)} />
    <div className="row"><label className="label grow">{t('cost')} ({cur})<input className="inp" inputMode="decimal" value={cost} onChange={e => setCost(e.target.value)} /></label><label className="label grow">{t('mileage')}<input className="inp" inputMode="numeric" value={mileage} onChange={e => setMileage(e.target.value)} /></label></div>
    <input className="inp" type="date" value={day} onChange={e => setDay(e.target.value)} />
    <div className="row wrap"><button className="btn">{log ? t('save') : t('add')}</button><button type="button" className="btn ghost" onClick={onClose}>{t('cancel')}</button>
      {log && <button type="button" className="btn danger" onClick={() => { remove('car_logs', log.id); onClose() }}>{t('delete')}</button>}</div>
  </form></Sheet>
}

export function Garage() {
  const s = useStore(), cars = rows('cars', s.cur, s), logs = rows('car_logs', s.cur, s), cur = pickCur(s.lang)
  const [edit, setEdit] = useState<Car | 'new' | null>(null), [log, setLog] = useState<{ car: Car; log?: CarLog; km: number } | null>(null)
  return <div className="page">
    <div className="head"><h1>{t('garage')}</h1><button className="btn" onClick={() => setEdit('new')}>{t('add')}</button></div>
    {!cars.length && <div className="empty"><b>🚗</b>{t('garage_empty')}</div>}
    {cars.map(car => { const st = carStatus(car, logs)
      return <div key={car.id} className="col">
        <div className="cc c2" style={{ height: 'auto', minHeight: 170 }}>
          <button className="row between" style={{ color: '#fff', textAlign: 'left' }} onClick={() => setEdit(car)}><span><span className="up">{[car.plate, car.year].filter(Boolean).join(' · ') || t('garage')}</span><h3>{car.name}</h3></span></button>
          {st.km > 0 && <div className="big num" style={{ fontSize: 36 }}>{num(st.km)} km</div>}
          {st.serviceLeft != null && <div className="line">{st.serviceLeft <= 0 ? '⚠️ ' + t('service_due') : t('next_service', num(st.serviceLeft))}</div>}
          <span className="deco">{car.icon}</span></div>
        {st.dates.length > 0 && <div className="chips">{st.dates.map(x => <span key={x.k} className={'chip' + (x.left < 30 ? ' on' : '')} title={fmtFull(x.d)}>{x.left < 0 ? '⚠️' : '📅'} {t(x.k as Key)} {fmtDay(x.d)}</span>)}</div>}
        <div className="card col" style={{ gap: 4 }}>
          <div className="row between"><span className="cap">{t('spent_year')}: {money(st.spent, cur)}</span><button className="btn sm" onClick={() => setLog({ car, km: st.km })}>{t('log_new')}</button></div>
          {st.logs.slice(0, 20).map(l => <button key={l.id} className="item" style={{ width: '100%', textAlign: 'left' }} onClick={() => setLog({ car, log: l, km: st.km })}>
            <span className="av">{KIND_ICON[l.kind]}</span><span className="grow"><b className="ell" style={{ display: 'block', fontWeight: 600 }}>{l.title || t(('kind_' + l.kind) as Key)}</b><span className="sm mut">{fmtDay(l.day)}{l.mileage ? ' · ' + num(l.mileage) + ' km' : ''}</span></span>
            {l.cost != null && <b className="num">{money(l.cost, cur)}</b>}</button>)}
        </div></div> })}
    {edit && <CarEdit car={edit === 'new' ? undefined : edit} onClose={() => setEdit(null)} />}
    {log && <LogEdit {...log} onClose={() => setLog(null)} />}
  </div>
}
