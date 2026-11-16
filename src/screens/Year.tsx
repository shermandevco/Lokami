import { useState } from 'react'
import { useStore, curSpace } from '../store'
import { t } from '../lib/i18n'
import { today, num } from '../lib/dates'
import { myYear, ourYear } from '../lib/year'
import { money, CAT_ICON } from '../lib/money'
import { spaceName } from '../lib/space'
import { Bars } from '../ui/Bars'
import { MOOD_COLOR } from '../lib/me'
import type { Key } from '../i18n/en'

export function Year() {
  const s = useStore(), sp = curSpace(s)!, now = today(), shared = sp.type !== 'solo'
  const [tab, setTab] = useState<'me' | 'us'>(shared ? 'us' : 'me'), [year, setYear] = useState(now.slice(0, 4))
  const monthName = (i: number) => new Intl.DateTimeFormat(document.documentElement.lang, { month: 'long' }).format(new Date(2026, i, 1))
  const stat = (n: string | number, label: string, i: number) => <div key={label} className="card stat" style={{ animationDelay: i * 60 + 'ms' }}><b className="num">{n}</b><span className="sm mut">{label}</span></div>
  const me = myYear(s, year), us = shared ? ourYear(s, sp.id, sp.since, year, now) : null
  const mine = [[num(me.moodDays), t('y_mood_days')], [num(me.ticks), t('y_habit_ticks')], [me.longest ? num(me.longest) : '—', t('y_longest')], [num(me.pages), t('y_pages')], [num(me.words), t('y_words')], [num(me.tasks), t('y_tasks')],
    [num(me.events), t('y_events')], [me.currency ? money(me.spent, me.currency) : '—', t('y_spent')], [me.topCat ? CAT_ICON[me.topCat] + ' ' + t(('cat_' + me.topCat) as Key) : '—', t('y_top_cat')], [num(me.goals), t('y_goals')], [me.km ? num(me.km) : '—', t('y_km')]] as const
  const ours = us ? [[num(us.together), t('y_together')], [num(us.answers), t('y_answers')], [num(us.checkins), t('y_checkins')], [num(us.tasks), t('y_tasks')], [num(us.bought), t('y_bought')], [num(us.events), t('y_events')], [us.currency ? money(us.spent, us.currency) : '—', t('y_spent')]] as const : []
  const empty = tab === 'me' ? !me.moodDays && !me.pages && !me.ticks && !me.tasks : !!us && !us.answers && !us.tasks && !us.bought && !us.events
  const years = [now.slice(0, 4), String(+now.slice(0, 4) - 1)]
  return <div className="page">
    <div className="cc c3" style={{ height: 'auto', minHeight: 150 }}><span className="up">{tab === 'me' ? t('my_year') : spaceName(sp)}</span><div className="big num">{year}</div><span className="deco">{tab === 'me' ? '✨' : '💞'}</span></div>
    <div className="row between">{shared ? <div className="seg grow"><button className={tab === 'us' ? 'on' : ''} onClick={() => setTab('us')}>{t('our_year')}</button><button className={tab === 'me' ? 'on' : ''} onClick={() => setTab('me')}>{t('my_year')}</button></div> : <span />}
      <div className="chips" style={{ marginLeft: 8 }}>{years.map(y => <button key={y} className={'chip' + (y === year ? ' on' : '')} onClick={() => setYear(y)}>{y}</button>)}</div></div>
    {empty ? <div className="empty"><b>🗓️</b>{t('y_empty')}</div> : <>
      <div className="grid" key={tab + year}>{(tab === 'me' ? mine : ours).filter(([n]) => n !== '—' && n !== '0').map(([n, l], i) => stat(n, l, i))}</div>
      {tab === 'me' && me.moodDays > 0 && <div className="card col"><div className="row between"><h2>{t('y_mood_by_month')}</h2>{me.best >= 0 && <span className="pill">{t('y_best_month')}: {monthName(me.best)}</span>}</div>
        <Bars values={me.monthAvg} labels={me.monthAvg.map((_, i) => monthName(i))} color={MOOD_COLOR[4]} /></div>}
    </>}
  </div>
}
