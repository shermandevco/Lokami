import { describe, it, expect } from 'vitest'
import { streak, average } from '../src/lib/me'
import { addDays, weekStart } from '../src/lib/dates'
describe('personal stats', () => {
  it('counts a streak ending today or yesterday', () => {
    expect(streak(new Set(['2026-11-14', '2026-11-15', '2026-11-16']), '2026-11-16')).toBe(3)
    expect(streak(new Set(['2026-11-14', '2026-11-15']), '2026-11-16')).toBe(2)
    expect(streak(new Set(['2026-11-13']), '2026-11-16')).toBe(0)
  })
  it('averages moods within the window', () => {
    const m = (day: string, score: number) => ({ day, score }) as never
    expect(average([m('2026-11-16', 5), m('2026-11-15', 3), m('2026-09-01', 1)], 30, '2026-11-16')).toBe(4)
    expect(average([], 30, '2026-11-16')).toBe(0)
  })
  it('handles dates across months and weeks', () => {
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01')
    expect(weekStart('2026-11-16')).toBe('2026-11-16')
    expect(weekStart('2026-11-22')).toBe('2026-11-16')
  })
})
import { milestones } from '../src/lib/milestones'
import { questionFor, QUESTIONS } from '../src/lib/questions'
describe('we', () => {
  it('lists upcoming milestones in order, day 1 = start date', () => {
    const m = milestones('2026-01-01', '2026-01-01')
    expect(m[0]).toEqual({ day: '2026-04-10', kind: 'days', n: 100 })
    expect(m.find(x => x.kind === 'years')!.day).toBe('2027-01-01')
  })
  it('picks the same question for everyone in a space on a day, and a new one the next day', () => {
    const a = questionFor('abc', '2026-11-16', '2026-01-01'), b = questionFor('abc', '2026-11-17', '2026-01-01')
    expect(a).toBe(questionFor('abc', '2026-11-16', '2026-01-01')); expect(b).toBe((a + 1) % QUESTIONS); expect(a).toBeGreaterThanOrEqual(0)
  })
})
