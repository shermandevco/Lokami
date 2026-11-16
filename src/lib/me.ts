import type { HabitLog, Mood } from '../store'
import { addDays, today } from './dates'
export const MOOD_FACE = ['', '😣', '😕', '😐', '🙂', '😄']
export const MOOD_COLOR = ['', '#d65a5a', '#e89a5a', '#d8c25a', '#7cc47a', '#2fa07a']
export const MOOD_TAGS = ['sleep', 'work', 'sport', 'people', 'health', 'food', 'weather', 'rest'] as const
export const habitLogId = (habit: string, day: string) => habit + ':' + day
export const dayId = (user: string, day: string) => user + ':' + day
/** Consecutive done days ending today (or yesterday, if today is not ticked yet). */
export function streak(done: Set<string>, from = today()): number {
  let d = done.has(from) ? from : addDays(from, -1), n = 0
  while (done.has(d)) { n++; d = addDays(d, -1) }
  return n
}
export const doneDays = (logs: HabitLog[], habit: string) => new Set(logs.filter(l => l.habit_id === habit && l.done).map(l => l.day))
export function average(moods: Mood[], days = 30, to = today()) {
  const from = addDays(to, -days + 1), xs = moods.filter(m => m.day >= from && m.day <= to)
  return xs.length ? xs.reduce((a, m) => a + m.score, 0) / xs.length : 0
}
