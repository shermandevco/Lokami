import { useEffect, useState } from 'react'
import { sb } from '../lib/supabase'
import { useStore, rows, upsert, curSpace } from '../store'
import { t } from '../lib/i18n'
import { today, fmtDay } from '../lib/dates'
import { questionFor, questionText } from '../lib/questions'

/** Answers of others arrive from the server only after you answer (row-level security), so the reveal is real, not a client trick. */
export function Question() {
  const s = useStore(), sp = curSpace(s)!, me = s.profile!, day = today(), q = questionFor(sp.id, day, sp.since)
  const id = sp.id + ':' + day + ':' + me.id, mine = s.db.answers[id]
  const [body, setBody] = useState(mine?.body || ''), [editing, setEditing] = useState(!mine)
  const all = rows('answers', sp.id, s), todays = all.filter(a => a.day === day && a.created_by !== me.id)
  const others = sp.members.filter(m => m.id !== me.id)
  const [done, setDone] = useState<string[]>([])
  useEffect(() => { sb.rpc('answered_by', { sid: sp.id, d: day }).then(({ data }) => { if (Array.isArray(data)) setDone(data as string[]) }, () => {}) }, [sp.id, day, mine?.id])
  const past = [...new Set(all.filter(a => a.day < day).map(a => a.day))].sort().reverse().slice(0, 14)
  const send = (e: React.FormEvent) => { e.preventDefault(); if (!body.trim()) return; upsert('answers', id, { day, q, body: body.trim(), deleted_at: null }, sp.id); setEditing(false) }
  const bubble = (who: string, a: string, text: string, i = 0) => <div key={who + i} className="ans" style={{ animationDelay: i * 80 + 'ms' }}><span className="av">{a}</span><div className="grow"><b className="sm">{who}</b><p>{text}</p></div></div>
  return <div className="page">
    <div className="head"><div><h1>{t('question')}</h1><p className="sm mut">{fmtDay(day)}</p></div></div>
    <div className="cc c1" style={{ height: 'auto', minHeight: 160 }}><span className="up">{t('question')}</span><h3 style={{ maxWidth: '100%' }}>{questionText(q)}</h3></div>
    {editing ? <form className="card col" onSubmit={send}><textarea className="inp" style={{ minHeight: 110, padding: 12, resize: 'vertical' }} autoFocus placeholder={t('answer_placeholder')} value={body} maxLength={2000} onChange={e => setBody(e.target.value)} />
      <button className="btn" disabled={!body.trim()}>{t('answer_send')}</button></form>
      : <div className="card col">{bubble(me.n, me.a, mine!.body)}<button className="btn sm ghost" onClick={() => setEditing(true)}>{t('answer_edit')}</button></div>}
    {mine && !editing ? <div className="col">{todays.length ? todays.map((a, i) => { const m = others.find(x => x.id === a.created_by); return bubble(m?.n || '—', m?.a || '🙂', a.body, i + 1) }) : <p className="mut sm" style={{ textAlign: 'center' }}>{t('answer_wait')}</p>}</div>
      : others.length > 0 && <div className="row" style={{ justifyContent: 'center', gap: 8 }}>{others.map(m => <span key={m.id} className={'chip' + (done.includes(m.id) ? ' on' : '')}>{done.includes(m.id) ? '✓' : '…'} {m.a} {m.n}</span>)}</div>}
    {!mine && done.filter(id => id !== me.id).map(id => <p key={id} className="sm mut" style={{ textAlign: 'center' }}>🔒 {t('answer_hidden', others.find(m => m.id === id)?.n || '—')}</p>)}
    {past.length > 0 && <><p className="cap">{t('past_questions')}</p>{past.map(d => { const xs = all.filter(a => a.day === d); return <div key={d} className="card col" style={{ gap: 8 }}>
      <span className="sm mut">{fmtDay(d)}</span><b>{questionText(xs[0].q)}</b>{xs.map(a => { const m = sp.members.find(x => x.id === a.created_by); return <p key={a.id} className="sm"><b>{m?.a} {m?.n}:</b> {a.body}</p> })}</div> })}</>}
  </div>
}
