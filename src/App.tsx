import { useEffect, useRef } from 'react'
import { useStore, dismissToast, toast, go } from './store'
import { feed } from './screens/Feed'
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
  const Screen = { checkin: Checkin, insights: Insights, year: Year, budget: Budget, health: Health, garage: Garage, goals: Goals, hub: Hub, feed: Feed, shopping: Shopping, question: Question, today: Today, tasks: Tasks, planner: Planner, habits: Habits, mood: Mood, diary: Diary, people: People, profile: Profile }[s.route]
  return <>
    {!s.online && <div className="status">{t('offline')}</div>}
    <Screen key={s.route + s.cur} />
    <Nav />
    {s.toast && <div className="toast" role="status"><span className="grow">{s.toast.text}</span>{s.toast.action && <button onClick={() => { s.toast!.fn?.(); dismissToast() }}>{s.toast.action}</button>}</div>}
  </>
}
