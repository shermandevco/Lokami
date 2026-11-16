import { en, type Key } from '../i18n/en'
import { uk } from '../i18n/uk'
import { pl } from '../i18n/pl'
export const LANGS = [{ code: 'uk', label: 'Українська', dict: uk }, { code: 'en', label: 'English', dict: en as Record<Key, string> }, { code: 'pl', label: 'Polski', dict: pl }] as const
let cur = 1
export const getLang = () => cur
export function setLang(i: number) { cur = i >= 0 && i < LANGS.length ? i : 1; document.documentElement.lang = LANGS[cur].code }
export function detectLang(): number { const n = (navigator.language || 'en').toLowerCase(); return n.startsWith('uk') || n.startsWith('ru') ? 0 : n.startsWith('pl') ? 2 : 1 }
export const locale = () => ['uk-UA', 'en-GB', 'pl-PL'][cur]
export function t(key: Key, ...args: (string | number)[]): string {
  let s: string = LANGS[cur].dict[key] ?? en[key] ?? key
  args.forEach((a, i) => { s = s.replace('{' + i + '}', String(a)) })
  return s
}
/** Plural: picks key_one for 1, key_other otherwise (catalogue keeps two forms per noun). */
export function tn(base: 'day' | 'tasks_info_left' | 'people_info' | 'streak' | 'shop_left' | 'in_days', n: number): string {
  const one = cur === 1 ? n === 1 : n % 10 === 1 && n % 100 !== 11
  return t((base + (one ? '_one' : '_other')) as Key, n)
}
