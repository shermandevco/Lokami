import type { Mood, Health, HabitLog, Habit, DiaryPage } from '../store'
export interface Insight { key: string; label: string; withAvg: number; withoutAvg: number; n: number; m: number }
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
/**
 * Compare average mood on days when a factor was present vs absent. Only reported when both sides have
 * at least `min` days and the gap is at least 0.4 points: this is a pattern in your own notes, not proof of cause.
 */
export function connections(moods: Mood[], health: Health[], logs: HabitLog[], habits: Habit[], pages: DiaryPage[], tagLabel: (t: string) => string, min = 5): Insight[] {
  const mood: Record<string, number> = {}; moods.forEach(m => (mood[m.day] = m.score))
  const days = Object.keys(mood), out: Insight[] = []
  const test = (key: string, label: string, has: (d: string) => boolean | null) => {
    const a: number[] = [], b: number[] = []
    days.forEach(d => { const h = has(d); if (h === null) return; (h ? a : b).push(mood[d]) })
    if (a.length >= min && b.length >= min && Math.abs(avg(a) - avg(b)) >= 0.4) out.push({ key, label, withAvg: avg(a), withoutAvg: avg(b), n: a.length, m: b.length })
  }
  const tagSet = new Set(moods.flatMap(m => m.tags)); const tags: Record<string, Set<string>> = {}; moods.forEach(m => m.tags.forEach(t => (tags[t] = tags[t] || new Set()).add(m.day)))
  tagSet.forEach(t => test('tag:' + t, tagLabel(t), d => tags[t].has(d)))
  const hd: Record<string, Health> = {}; health.forEach(h => (hd[h.day] = h))
  test('sleep7', 'sleep7', d => (hd[d]?.sleep == null ? null : hd[d].sleep! >= 7))
  test('steps8k', 'steps8k', d => (hd[d]?.steps == null ? null : hd[d].steps! >= 8000))
  test('water6', 'water6', d => (hd[d]?.water == null ? null : hd[d].water! >= 6))
  habits.forEach(h => { const done = new Set(logs.filter(l => l.habit_id === h.id && l.done).map(l => l.day)); test('habit:' + h.id, h.icon + ' ' + h.title, d => done.has(d)) })
  const written = new Set(pages.filter(p => p.body.trim()).map(p => p.day)); test('diary', 'diary', d => written.has(d))
  return out.sort((x, y) => Math.abs(y.withAvg - y.withoutAvg) - Math.abs(x.withAvg - x.withoutAvg))
}
