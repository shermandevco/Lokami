import { useStore, dismissToast } from './store'
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

export function App() {
  const s = useStore()
  if (!s.ready) return null
  if (!s.profile) return <Auth />
  const Screen = { hub: Hub, today: Today, tasks: Tasks, planner: Planner, habits: Habits, mood: Mood, diary: Diary, people: People, profile: Profile }[s.route]
  return <>
    {!s.online && <div className="status">{t('offline')}</div>}
    <Screen key={s.route + s.cur} />
    <Nav />
    {s.toast && <div className="toast" role="status"><span className="grow">{s.toast.text}</span>{s.toast.action && <button onClick={() => { s.toast!.fn?.(); dismissToast() }}>{s.toast.action}</button>}</div>}
  </>
}
