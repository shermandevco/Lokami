import { useState } from 'react'
import { useStore, rows, upsert, remove, curSpace } from '../store'
import { t, getLang } from '../lib/i18n'
import { DECKS, type Deck } from '../lib/decks'
import { tap } from '../lib/native'

const shuffle = (n: number) => { const a = Array.from({ length: n }, (_, i) => i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }
/** Conversation decks for the current space type. Level 3 decks are 18+ and need the age confirmation. */
export function Cards() {
  const s = useStore(), sp = curSpace(s)!, L = getLang(), adult = !!s.profile?.adult
  const decks = DECKS.filter(d => d.ty.includes(sp.type) && (d.lvl < 3 || adult))
  const [deck, setDeck] = useState<Deck | null>(null), [order, setOrder] = useState<number[]>([]), [pos, setPos] = useState(0), [anim, setAnim] = useState(0)
  const favs = rows('items', s.cur, s).filter(i => i.kind === 'fav')
  const open = (d: Deck) => { setDeck(d); setOrder(shuffle(d.q.length)); setPos(0) }
  const next = () => { tap(); setAnim(a => a + 1); setPos(p => (p + 1) % order.length) }
  if (deck) { const qi = order[pos], key = deck.id + ':' + qi, fav = favs.find(f => f.title === key)
    return <div className="page">
      <div className="head"><button className="btn ghost sm" onClick={() => setDeck(null)}>‹ {t('cards')}</button><span className="sm mut num">{pos + 1} / {order.length}</span></div>
      <button key={anim} className="qcard" style={{ background: `linear-gradient(140deg,${deck.c[0]},${deck.c[1]})` }} onClick={next}>
        <span className="up">{deck.em} {deck.n[L]} · {t('level', deck.lvl)}</span><p>{deck.q[qi][L]}</p><span className="sm" style={{ opacity: .8 }}>{t('card_next')} →</span></button>
      <div className="row" style={{ justifyContent: 'center' }}>
        <button className={'btn' + (fav ? '' : ' ghost')} onClick={() => fav ? remove('items', fav.id) : upsert('items', crypto.randomUUID(), { kind: 'fav', title: key, note: null, done: false, rating: null, for_user: null, data: {}, deleted_at: null })}>{fav ? '★' : '☆'} {t('card_save')}</button>
        <button className="btn" onClick={next}>{t('card_next')}</button></div>
    </div> }
  return <div className="page">
    <div className="head"><div><h1>{t('cards')}</h1><p className="sm mut">{t('cards_pick')}</p></div></div>
    <div className="grid">{decks.map(d => <button key={d.id} className="tile deck" style={{ background: `linear-gradient(140deg,${d.c[0]},${d.c[1]})`, color: '#fff' }} onClick={() => open(d)}>
      <b>{d.n[L]}</b><small style={{ color: 'rgba(255,255,255,.85)' }}>{d.q.length} · {t('level', d.lvl)}{d.lvl === 3 ? ' · 18+' : ''}</small><span className="em">{d.em}</span></button>)}</div>
    {favs.length > 0 && <><p className="cap">{t('card_saved')}</p><div className="card" style={{ padding: '4px 16px' }}>{favs.map(f => { const [id, i] = f.title.split(':'), d = DECKS.find(x => x.id === id); if (!d || !d.q[+i]) return null
      return <div key={f.id} className="item"><span className="av">{d.em}</span><span className="grow">{d.q[+i][L]}</span><button className="x" aria-label={t('delete')} onClick={() => remove('items', f.id)}>×</button></div> })}</div></>}
  </div>
}
