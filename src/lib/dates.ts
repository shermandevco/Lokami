import { locale } from './i18n'
const pad = (n: number) => String(n).padStart(2, '0')
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const today = () => ymd(new Date())
export const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
export const diffDays = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 864e5)
export const fmtDay = (s: string) => new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'long' }).format(parse(s))
export const fmtFull = (s: string) => new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'long', year: 'numeric' }).format(parse(s))
export const weekday = (d: Date) => { const w = new Intl.DateTimeFormat(locale(), { weekday: 'long' }).format(d); return w.charAt(0).toUpperCase() + w.slice(1) }
export const num = (n: number) => new Intl.NumberFormat(locale()).format(n)
