import { useState } from 'react'
import { useStore, go, type Route } from '../store'
import { t } from '../lib/i18n'
import { NewTask } from '../screens/Tasks'

const P: Record<string, string> = {
  hub: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  tasks: 'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9',
  people: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  profile: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  plus: 'M12 5v14M5 12h14',
}
const Ico = ({ d }: { d: string }) => <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>

export function Nav() {
  const s = useStore(); const [add, setAdd] = useState(false)
  const b = (r: Route) => <button className={s.route === r ? 'on' : ''} aria-label={t(r === 'hub' ? 'today' : r)} onClick={() => go(r)}><Ico d={P[r]} /></button>
  return <>
    <nav className="nav">{b('hub')}{b('tasks')}<button className="plus" aria-label={t('task_new')} onClick={() => setAdd(true)}><Ico d={P.plus} /></button>{b('people')}{b('profile')}</nav>
    {add && <NewTask onClose={() => setAdd(false)} />}
  </>
}
