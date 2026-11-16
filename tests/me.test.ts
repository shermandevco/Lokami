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
