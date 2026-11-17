import { useState } from 'react'
import { useStore, rows, upsert, remove, curSpace, type Expense } from '../store'
import { t } from '../lib/i18n'
import { today, fmtDay } from '../lib/dates'
import { CURRENCIES, CATEGORIES, CAT_ICON, money, balances, settle, byCategory } from '../lib/money'
import { Sheet } from '../ui/Sheet'
import type { Key } from '../i18n/en'

const defCur = () => { try { return localStorage.getItem('lokami_cur') || '' } catch { return '' } }
export const pickCur = (lang: number) => defCur() || ['UAH', 'EUR', 'PLN'][lang]

export function ExpenseEdit({ ex, cur, onClose }: { ex?: Expense; cur: string; onClose: () => void }) {
  const s = useStore(), sp = curSpace(s)!, me = s.profile!.id, multi = sp.members.length > 1
  const [title, setTitle] = useState(ex?.title || ''), [amount, setAmount] = useState(ex ? String(ex.amount) : ''), [currency, setCurrency] = useState(ex?.currency || cur)
  const [category, setCategory] = useState(ex?.category || 'food'), [day, setDay] = useState(ex?.day || today()), [paid, setPaid] = useState(ex?.paid_by || me), [split, setSplit] = useState<string[]>(ex?.split_ids || sp.members.map(m => m.id))
  const n = parseFloat(amount.replace(',', '.'))
  function save(e: React.FormEvent) { e.preventDefault(); if (!title.trim() || !(n > 0) || (multi && !split.length)) return
    try { localStorage.setItem('lokami_cur', currency) } catch { /* ignore */ }
    upsert('expenses', ex?.id || crypto.randomUUID(), { title: title.trim(), amount: Math.round(n * 100) / 100, currency, category, day, paid_by: multi ? paid : me, split_ids: multi ? split : [me], settle: false, deleted_at: null }); onClose() }
  return <Sheet onClose={onClose}><form className="col" onSubmit={save}>
    <h2>{ex ? ex.title : t('expense_new')}</h2>
    <div className="row"><input className="inp grow" inputMode="decimal" autoFocus placeholder={t('amount')} value={amount} onChange={e => setAmount(e.target.value)} style={{ fontSize: 22, fontWeight: 800 }} />
      <select className="inp" style={{ width: 96 }} value={currency} onChange={e => setCurrency(e.target.value)} aria-label={t('currency')}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></div>
    <input className="inp" placeholder={t('expense_placeholder')} value={title} maxLength={120} onChange={e => setTitle(e.target.value)} />
    <div className="chips">{CATEGORIES.map(c => <button type="button" key={c} className={'chip' + (category === c ? ' on' : '')} onClick={() => setCategory(c)}>{CAT_ICON[c]} {t(('cat_' + c) as Key)}</button>)}</div>
    <input className="inp" type="date" value={day} onChange={e => setDay(e.target.value)} aria-label={t('task_due')} />
    {multi && <><div className="label">{t('paid_by')}<div className="chips">{sp.members.map(m => <button type="button" key={m.id} className={'chip' + (paid === m.id ? ' on' : '')} onClick={() => setPaid(m.id)}>{m.a} {m.n}</button>)}</div></div>
      <div className="label">{t('split_between')}<div className="chips">{sp.members.map(m => { const on = split.includes(m.id); return <button type="button" key={m.id} aria-pressed={on} className={'chip' + (on ? ' on' : '')} onClick={() => setSplit(on ? split.filter(x => x !== m.id) : [...split, m.id])}>{on ? '✓ ' : ''}{m.a} {m.n}</button> })}</div></div></>}
    <div className="row wrap"><button className="btn" disabled={!title.trim() || !(n > 0)}>{ex ? t('save') : t('add')}</button><button type="button" className="btn ghost" onClick={onClose}>{t('cancel')}</button>
      {ex && <button type="button" className="btn danger" onClick={() => { remove('expenses', ex.id); onClose() }}>{t('delete')}</button>}</div>
  </form></Sheet>
}

export function Budget() {
  const s = useStore(), sp = curSpace(s)!, list = rows('expenses', s.cur, s), [cur, setCur] = useState(pickCur(s.lang)), [edit, setEdit] = useState<Expense | 'new' | null>(null)
  const month = today().slice(0, 7), cats = byCategory(list, month, cur), total = cats.reduce((a, [, v]) => a + v, 0)
  const used = [...new Set([cur, ...list.map(e => e.currency)])]
  const multi = sp.members.length > 1, transfers = multi ? settle(balances(list, cur)) : []
  const who = (id: string | null) => sp.members.find(m => m.id === id)
  const hist = list.filter(e => e.currency === cur).sort((a, b) => b.day.localeCompare(a.day) || b.edited_at.localeCompare(a.edited_at)).slice(0, 60)
  return <div className="page">
    <div className="head"><h1>{t('budget')}</h1><button className="btn" onClick={() => setEdit('new')}>{t('add')}</button></div>
    {used.length > 1 && <div className="chips">{used.map(c => <button key={c} className={'chip' + (c === cur ? ' on' : '')} onClick={() => setCur(c)}>{c}</button>)}</div>}
    <div className="card col"><span className="cap">{t('this_month')}</span><div className="num" style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-.03em' }}>{money(total, cur)}</div>
      {total > 0 && <><div className="stack">{cats.map(([c, v]) => <i key={c} title={t(('cat_' + c) as Key)} style={{ flex: v, background: `hsl(${CATEGORIES.indexOf(c as never) * 40} 65% 58%)` }} />)}</div>
        <div className="col" style={{ gap: 6 }}>{cats.map(([c, v]) => <div key={c} className="row between sm"><span>{CAT_ICON[c]} {t(('cat_' + c) as Key)}</span><b className="num">{money(v, cur)}</b></div>)}</div></>}
    </div>
    {multi && <div className="card col"><h2>{t('debts')}</h2>{!transfers.length ? <p className="mut sm">{t('all_settled')}</p> : transfers.map(x => <div key={x.from + x.to} className="row">
      <span className="grow">{who(x.from)?.a} {who(x.from)?.n} → {who(x.to)?.a} {who(x.to)?.n}</span><b className="num">{money(x.cents / 100, cur)}</b>
      <button className="btn sm ghost" onClick={() => upsert('expenses', crypto.randomUUID(), { title: t('settled'), amount: x.cents / 100, currency: cur, category: 'other', day: today(), paid_by: x.from, split_ids: [x.to], settle: true, deleted_at: null })}>{t('settle_up')}</button></div>)}</div>}
    <p className="cap">{t('history')}</p>
    {!hist.length ? <div className="empty"><b>💸</b>{t('budget_empty')}</div> : <div className="card" style={{ padding: '4px 16px' }}>{hist.map(e => <button key={e.id} className="item" style={{ width: '100%', textAlign: 'left' }} onClick={() => setEdit(e)}>
      <span className="av">{e.settle ? '🤝' : CAT_ICON[e.category] || '📦'}</span><span className="grow"><b className="ell" style={{ display: 'block', fontWeight: 600 }}>{e.title}</b><span className="sm mut">{fmtDay(e.day)}{multi && who(e.paid_by) ? ' · ' + who(e.paid_by)!.a + ' ' + who(e.paid_by)!.n : ''}</span></span>
      <b className="num">{money(e.amount, e.currency)}</b></button>)}</div>}
    {edit && <ExpenseEdit ex={edit === 'new' ? undefined : edit} cur={cur} onClose={() => setEdit(null)} />}
  </div>
}
