import { useEffect, useRef } from 'react'
import { useStore, dismissToast, toast, go } from './store'
import { feed } from './screens/Feed'
import { modColor } from './lib/modules'
import { t } from './lib/i18n'
import { Auth } from './screens/Auth'
import { Hub } from './screens/Hub'
import { Tasks } from './screens/Tasks'
import { People } from './screens/People'
import { Profile } from './screens/Profile'
import { Nav } from './ui/Nav'
import { Today } from './screens/Today'
import { Planner } from './screens/Planner'
import { Habits } from './screens/Habits'
import { Mood } from './screens/Mood'
import { Diary } from './screens/Diary'
import { All } from './screens/All'
import { ListScreen } from './screens/Lists'
import { Cards } from './screens/Cards'
import { Wheel, Challenge, Status, Intim, Dlog, Poo, Admin } from './screens/Extras'
import { Checkin } from './screens/Checkin'
import { Insights } from './screens/Insights'
import { Year } from './screens/Year'
import { Budget } from './screens/Budget'
import { Health } from './screens/Health'
import { Garage } from './screens/Garage'
import { Goals } from './screens/Goals'
import { Feed } from './screens/Feed'
import { Shopping } from './screens/Shopping'
import { Question } from './screens/Question'

export function App() {
  const s = useStore(), items = s.profile ? feed(s) : [], top = items[0], seenTop = useRef('')
  // In-app and system notification when someone else changes something while the app is open.
  useEffect(() => {
    if (!top) return; if (!seenTop.current) { seenTop.current = top.at; return } if (top.at <= seenTop.current) return; seenTop.current = top.at
    const p = s.spaces.flatMap(x => x.members).find(m => m.id === top.who), text = (p?.n || '') + ' ' + t(top.key) + (top.text ? ': ' + top.text : '')
    if (document.visibilityState === 'hidden' && 'Notification' in window && Notification.permission === 'granted') { try { new Notification('Lokami', { body: text, icon: 'icon-192.png' }) } catch { /* unsupported */ } }
    else if (s.route !== 'feed') toast(text, t('feed'), () => go('feed'))
  }, [top?.at])  // eslint-disable-line react-hooks/exhaustive-deps
  if (!s.ready) return null
  if (!s.profile) return <Auth />
  const Screen = { all: All, cards: Cards, wheel: Wheel, challenge: Challenge, status: Status, intim: Intim, dlog: Dlog, poo: Poo, admin: Admin,
    movies: () => <ListScreen route="movies" />, wishes: () => <ListScreen route="wishes" />, dreams: () => <ListScreen route="dreams" />, notes: () => <ListScreen route="notes" />, coupons: () => <ListScreen route="coupons" />, dates: () => <ListScreen route="dates" />,
    checkin: Checkin, insights: Insights, year: Year, budget: Budget, health: Health, garage: Garage, goals: Goals, hub: Hub, feed: Feed, shopping: Shopping, question: Question, today: Today, tasks: Tasks, planner: Planner, habits: Habits, mood: Mood, diary: Diary, people: People, profile: Profile }[s.route]
  return <>
    {!s.online && <div className="status">{t('offline')}</div>}
    {!['hub', 'today', 'profile', 'all', 'feed'].includes(s.route) && <div className="crumb"><button onClick={() => go(s.prev && s.prev !== s.route ? s.prev : 'hub')}><span aria-hidden="true">‹</span><i className="dot" style={{ '--c': modColor(s.route) } as React.CSSProperties} />{s.prev === 'all' ? t('all_modules') : s.prev === 'today' ? t('today') : 'Lokami'}</button></div>}
    <Screen key={s.route + s.cur} />
    <Nav />
    {s.toast && <div className="toast" role="status"><span className="grow">{s.toast.text}</span>{s.toast.action && <button onClick={() => { s.toast!.fn?.(); dismissToast() }}>{s.toast.action}</button>}</div>}
  </>
}
