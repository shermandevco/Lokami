import { useState } from 'react'
import { useStore, rows, upsert, remove } from '../store'
import { t, tn } from '../lib/i18n'

export function Shopping() {
  const s = useStore(), items = rows('shopping_items', s.cur, s), [title, setTitle] = useState(''), [qty, setQty] = useState('')
  const open = items.filter(x => !x.done).sort((a, b) => a.edited_at.localeCompare(b.edited_at)), done = items.filter(x => x.done).sort((a, b) => b.edited_at.localeCompare(a.edited_at))
  const who = (id: string | null) => s.spaces.find(x => x.id === s.cur)?.members.find(m => m.id === id)
  function add(e: React.FormEvent) { e.preventDefault(); if (!title.trim()) return; upsert('shopping_items', crypto.randomUUID(), { title: title.trim(), qty: qty.trim() || null, done: false, deleted_at: null }); setTitle(''); setQty('') }
  const row = (x: typeof items[number]) => <div key={x.id} className={'item' + (x.done ? ' done' : '')}>
    <button className={'check' + (x.done ? ' on' : '')} aria-label={t('bought')} aria-pressed={x.done} onClick={() => upsert('shopping_items', x.id, { done: !x.done })}>✓</button>
    <span className="grow"><span className="title ell" style={{ display: 'block', fontWeight: 600 }}>{x.title}</span>{(x.qty || (who(x.created_by) && who(x.created_by)!.id !== s.profile!.id)) && <span className="sm mut">{[x.qty, who(x.created_by)?.id !== s.profile!.id ? who(x.created_by)?.a : ''].filter(Boolean).join(' · ')}</span>}</span>
    <button className="x" aria-label={t('delete')} onClick={() => remove('shopping_items', x.id)}>×</button></div>
  return <div className="page">
    <div className="head"><div><h1>{t('shopping')}</h1><p className="sm mut">{open.length ? tn('shop_left', open.length) : ''}</p></div></div>
    <form className="row" onSubmit={add}><input className="inp grow" placeholder={t('shop_placeholder')} value={title} maxLength={120} onChange={e => setTitle(e.target.value)} />
      <input className="inp" style={{ width: 72 }} placeholder={t('qty')} value={qty} maxLength={20} onChange={e => setQty(e.target.value)} /><button className="btn" disabled={!title.trim()}>{t('add')}</button></form>
    {!items.length ? <div className="empty"><b>🛒</b>{t('shop_empty')}</div> : <>
      {open.length > 0 && <div className="card" style={{ padding: '4px 16px' }}>{open.map(row)}</div>}
      {done.length > 0 && <><div className="row between"><p className="cap">{t('bought')}</p><button className="btn sm ghost" onClick={() => done.forEach(x => upsert('shopping_items', x.id, { deleted_at: new Date().toISOString() }))}>{t('shop_clear')}</button></div>
        <div className="card" style={{ padding: '4px 16px' }}>{done.map(row)}</div></>}
    </>}
  </div>
}
