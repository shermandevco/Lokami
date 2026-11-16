import { useStore, rows, home } from '../store'
import { t, tn } from '../lib/i18n'
import { connections } from '../lib/insights'
import { MOOD_FACE } from '../lib/me'
import type { Key } from '../i18n/en'

export function Insights() {
  const s = useStore(), h = home(s)
  const list = connections(rows('moods', h, s), rows('health_logs', h, s), rows('habit_logs', h, s), rows('habits', h, s), rows('diary_pages', h, s), tag => t(('tag_' + tag) as Key))
  const label = (k: string, l: string) => k === 'diary' ? t('diary_day') : ['sleep7', 'steps8k', 'water6'].includes(k) ? t(k as Key) : l
  return <div className="page">
    <div className="head"><div><h1>{t('insights')}</h1><p className="sm mut">🔒 {t('insights_sub')}</p></div></div>
    {!list.length ? <div className="empty"><b>🔗</b>{t('insights_empty')}</div> : <div className="col">{list.map(x => { const up = x.withAvg > x.withoutAvg
      return <div key={x.key} className="card col" style={{ gap: 10 }}>
        <div className="row between"><b>{label(x.key, x.label)}</b><span className={'pill' + (up ? '' : ' bad')}>{up ? '+' : '−'}{Math.abs(x.withAvg - x.withoutAvg).toFixed(1)}</span></div>
        {([[t('ins_with'), x.withAvg], [t('ins_without'), x.withoutAvg]] as const).map(([k, v]) => <div key={k} className="row sm" style={{ gap: 8 }}>
          <span className="mut" style={{ width: 52 }}>{k}</span><div className="meter grow"><i style={{ transform: `scaleX(${v / 5})`, background: up === (k === t('ins_with')) ? 'var(--ok)' : 'var(--mut)' }} /></div><span className="num" style={{ width: 52, textAlign: 'right' }}>{MOOD_FACE[Math.round(v)]} {v.toFixed(1)}</span></div>)}
        <span className="sm mut">{t('ins_days', x.n, x.m)}</span></div> })}
      <p className="sm mut">{t('insights_note')}</p></div>}
  </div>
}
void tn
