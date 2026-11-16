import type { State } from '../store'
import { streak } from './me'
import { diffDays } from './dates'
/** Plain counts for one calendar year. Everything is computed on the device from the user's own rows. */
export function myYear(s: State, year: string) {
  const h = s.profile!.home, inY = (d?: string | null) => !!d && d.startsWith(year), alive = <T extends { deleted_at?: string | null; space_id: string }>(o: Record<string, T>, sp?: string) => Object.values(o).filter(r => !r.deleted_at && (!sp || r.space_id === sp))
  const moods = alive(s.db.moods, h).filter(m => inY(m.day)), months: number[][] = Array.from({ length: 12 }, () => [])
  moods.forEach(m => months[+m.day.slice(5, 7) - 1].push(m.score))
  const monthAvg = months.map(xs => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null))
  const best = monthAvg.reduce<number>((bi, v, i) => (v != null && (monthAvg[bi] == null || v > monthAvg[bi]!) ? i : bi), 0)
  const logs = alive(s.db.habit_logs, h).filter(l => l.done && inY(l.day)), byHabit: Record<string, Set<string>> = {}; logs.forEach(l => (byHabit[l.habit_id] = byHabit[l.habit_id] || new Set()).add(l.day))
  let longest = 0; Object.values(byHabit).forEach(set => [...set].forEach(d => { longest = Math.max(longest, streak(set, d)) }))
  const pages = alive(s.db.diary_pages, h).filter(p => inY(p.day) && p.body.trim())
  const myTasks = Object.values(s.db.tasks).filter(x => !x.deleted_at && x.done && inY(x.edited_at) && (x.assignee === s.profile!.id || (!x.assignee && x.created_by === s.profile!.id)))
  const exp = alive(s.db.expenses, h).filter(e => inY(e.day) && !e.settle), cat: Record<string, number> = {}; exp.forEach(e => (cat[e.category] = (cat[e.category] || 0) + e.amount))
  const goals = alive(s.db.goals, h).filter(g => g.target && alive(s.db.goal_logs, h).filter(l => l.goal_id === g.id).reduce((a, l) => a + l.amount, 0) >= g.target)
  const kms = Object.values(alive(s.db.car_logs, h).filter(l => l.mileage).reduce<Record<string, number[]>>((m, l) => ((m[l.car_id] = m[l.car_id] || []).push(l.mileage!), m), {})).reduce((a, xs) => a + Math.max(...xs) - Math.min(...xs), 0)
  return { moodDays: moods.length, monthAvg, best: monthAvg[best] != null ? best : -1, ticks: logs.length, longest, pages: pages.length, words: pages.reduce((a, p) => a + p.body.trim().split(/\s+/).length, 0),
    tasks: myTasks.length, events: alive(s.db.events, h).filter(e => inY(e.day)).length, spent: exp.reduce((a, e) => a + e.amount, 0), topCat: Object.entries(cat).sort((a, b) => b[1] - a[1])[0]?.[0], goals: goals.length, km: kms,
    currency: exp[0]?.currency }
}
export function ourYear(s: State, spaceId: string, since: string, year: string, today: string) {
  const inY = (d?: string | null) => !!d && d.startsWith(year), rows = <T extends { deleted_at?: string | null; space_id: string }>(o: Record<string, T>) => Object.values(o).filter(r => !r.deleted_at && r.space_id === spaceId)
  const start = since && since > year + '-01-01' ? since : year + '-01-01', end = today < year + '-12-31' ? today : year + '-12-31'
  return { together: since && since <= end ? diffDays(start, end) + 1 : 0, answers: rows(s.db.answers).filter(a => inY(a.day)).length, tasks: rows(s.db.tasks).filter(x => x.done && inY(x.edited_at)).length,
    bought: rows(s.db.shopping_items).filter(x => x.done && inY(x.edited_at)).length, events: rows(s.db.events).filter(e => inY(e.day)).length, checkins: rows(s.db.checkins).filter(c => inY(c.week)).length,
    spent: rows(s.db.expenses).filter(e => inY(e.day) && !e.settle).reduce((a, e) => a + e.amount, 0), currency: rows(s.db.expenses)[0]?.currency }
}
