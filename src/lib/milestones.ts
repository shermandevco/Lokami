import { addDays, diffDays, parse, ymd } from './dates'
export interface Milestone { day: string; kind: 'days' | 'years'; n: number }
/** Round day counts plus yearly anniversaries, in date order. Day 1 = the start date. */
export function milestones(since: string, from: string, count = 4): Milestone[] {
  if (!since) return []
  const out: Milestone[] = []
  for (const n of [100, 200, 300, 500, 777, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10000]) out.push({ day: addDays(since, n - 1), kind: 'days', n })
  const s = parse(since)
  for (let y = 1; y <= 60; y++) { const d = new Date(s.getFullYear() + y, s.getMonth(), s.getDate()); out.push({ day: ymd(d), kind: 'years', n: y }) }
  return out.filter(m => m.day >= from).sort((a, b) => a.day.localeCompare(b.day)).slice(0, count)
}
export const isToday = (m: Milestone, today: string) => m.day === today
export const daysUntil = (m: Milestone, today: string) => diffDays(today, m.day)
