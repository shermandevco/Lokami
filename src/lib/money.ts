import type { Expense } from '../store'
import { locale } from './i18n'
export const CURRENCIES = ['PLN', 'UAH', 'EUR', 'USD', 'GBP', 'CZK', 'CHF']
export const CATEGORIES = ['food', 'home', 'transport', 'fun', 'health', 'shopping', 'travel', 'bills', 'other'] as const
export const CAT_ICON: Record<string, string> = { food: '🍝', home: '🏠', transport: '🚌', fun: '🎉', health: '💊', shopping: '🛍️', travel: '✈️', bills: '🧾', other: '📦' }
export const money = (n: number, cur: string) => new Intl.NumberFormat(locale(), { style: 'currency', currency: cur, maximumFractionDigits: n % 1 ? 2 : 0 }).format(n)
const cents = (n: number) => Math.round(n * 100)

/** Net balance per person in one currency, in cents: positive = others owe them. Split is equal, remainder cents go to the first people. */
export function balances(list: Expense[], currency: string): Record<string, number> {
  const b: Record<string, number> = {}
  for (const e of list) {
    if (e.deleted_at || e.currency !== currency || !e.paid_by || !e.split_ids.length) continue
    const total = cents(e.amount), n = e.split_ids.length, share = Math.floor(total / n), rest = total - share * n
    b[e.paid_by] = (b[e.paid_by] || 0) + total
    e.split_ids.forEach((id, i) => { b[id] = (b[id] || 0) - share - (i < rest ? 1 : 0) })
  }
  return b
}
export interface Transfer { from: string; to: string; cents: number }
/** Fewest transfers that settle all balances (greedy: biggest debtor pays biggest creditor). */
export function settle(b: Record<string, number>): Transfer[] {
  const debt = Object.entries(b).filter(([, v]) => v < 0).map(([k, v]) => [k, -v] as [string, number]).sort((x, y) => y[1] - x[1])
  const cred = Object.entries(b).filter(([, v]) => v > 0).sort((x, y) => y[1] - x[1])
  const out: Transfer[] = []; let i = 0, j = 0
  while (i < debt.length && j < cred.length) {
    const c = Math.min(debt[i][1], cred[j][1]); if (c > 0) out.push({ from: debt[i][0], to: cred[j][0], cents: c })
    debt[i][1] -= c; cred[j][1] -= c; if (!debt[i][1]) i++; if (!cred[j][1]) j++
  }
  return out
}
/** Spending per category for a month (settlements are not spending). */
export function byCategory(list: Expense[], month: string, currency: string) {
  const m: Record<string, number> = {}
  list.filter(e => !e.deleted_at && !e.settle && e.currency === currency && e.day.startsWith(month)).forEach(e => (m[e.category] = (m[e.category] || 0) + e.amount))
  return Object.entries(m).sort((a, b) => b[1] - a[1])
}
