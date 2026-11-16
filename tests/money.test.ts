import { describe, it, expect } from 'vitest'
import { balances, settle, byCategory } from '../src/lib/money'
const e = (amount: number, paid_by: string, split_ids: string[], extra = {}) => ({ id: Math.random() + '', amount, paid_by, split_ids, currency: 'PLN', day: '2026-11-10', category: 'food', settle: false, deleted_at: null, ...extra }) as never
describe('debts', () => {
  it('splits equally and nets out', () => {
    const b = balances([e(90, 'a', ['a', 'b', 'c']), e(30, 'b', ['a', 'b'])], 'PLN')
    expect(b).toEqual({ a: 4500, b: -1500, c: -3000 })
    expect(settle(b)).toEqual([{ from: 'c', to: 'a', cents: 3000 }, { from: 'b', to: 'a', cents: 1500 }])
  })
  it('keeps every cent when the split is uneven', () => {
    const b = balances([e(10, 'a', ['a', 'b', 'c'])], 'PLN')
    expect(Object.values(b).reduce((x, y) => x + y, 0)).toBe(0)
  })
  it('a settlement clears the debt and is not counted as spending', () => {
    const list = [e(50, 'a', ['b']), e(50, 'b', ['a'], { settle: true })]
    expect(settle(balances(list, 'PLN'))).toEqual([])
    expect(byCategory(list, '2026-11', 'PLN')).toEqual([['food', 50]])
  })
  it('ignores other currencies and deleted rows', () => {
    expect(balances([e(10, 'a', ['b'], { currency: 'EUR' }), e(10, 'a', ['b'], { deleted_at: 'x' })], 'PLN')).toEqual({})
  })
})
import { connections } from '../src/lib/insights'
describe('connections', () => {
  const day = (i: number) => '2026-10-' + String(i + 1).padStart(2, '0')
  it('reports a factor only with enough days on both sides', () => {
    const moods = Array.from({ length: 12 }, (_, i) => ({ day: day(i), score: i % 2 ? 5 : 2, tags: i % 2 ? ['sport'] : [] })) as never[]
    const r = connections(moods, [], [], [], [], t => t)
    expect(r[0].key).toBe('tag:sport'); expect(r[0].withAvg).toBe(5); expect(r[0].withoutAvg).toBe(2)
    expect(connections(moods.slice(0, 6), [], [], [], [], t => t)).toEqual([])
  })
})
