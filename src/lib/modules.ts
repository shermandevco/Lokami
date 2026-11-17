import type { Key } from '../i18n/en'
import type { SpaceType } from '../store'
export type Group = 'grp_us' | 'grp_me' | 'grp_life' | 'grp_fun' | 'grp_adult'
export interface Mod { id: string; em: string; color: string; label: Key; group: Group; types: 'all' | 'shared' | 'solo' | SpaceType[]; adult?: boolean; home?: boolean }
/** Every module in the app. `home: true` = shown on the home screen by default; the rest live in “All modules” until pinned. */
export const MODULES: Mod[] = [
  { id: 'question', color: 'var(--lav)', em: '💬', label: 'question', group: 'grp_us', types: 'shared', home: true },
  { id: 'checkin', color: 'var(--peach)', em: '🫶', label: 'checkin', group: 'grp_us', types: 'shared', home: true },
  { id: 'tasks', color: '#fffdf8', em: '✅', label: 'tasks', group: 'grp_us', types: 'all', home: true },
  { id: 'shopping', color: 'var(--lime)', em: '🛒', label: 'shopping', group: 'grp_us', types: 'shared', home: true },
  { id: 'planner', color: 'var(--sky)', em: '🗓️', label: 'planner', group: 'grp_us', types: 'all' },
  { id: 'cards', color: 'var(--pink)', em: '🃏', label: 'cards', group: 'grp_us', types: 'all' },
  { id: 'status', color: 'var(--mint)', em: '🟢', label: 'status', group: 'grp_us', types: 'shared' },
  { id: 'notes', color: 'var(--sun)', em: '💌', label: 'notes', group: 'grp_us', types: 'shared' },
  { id: 'people', color: 'var(--sand)', em: '👥', label: 'people', group: 'grp_us', types: 'shared', home: true },
  { id: 'habits', color: 'var(--mint)', em: '🌱', label: 'habits', group: 'grp_me', types: 'solo', home: true },
  { id: 'mood', color: 'var(--sun)', em: '🙂', label: 'mood', group: 'grp_me', types: 'solo', home: true },
  { id: 'diary', color: 'var(--peach)', em: '📓', label: 'diary', group: 'grp_me', types: 'solo', home: true },
  { id: 'health', color: 'var(--coral)', em: '❤️', label: 'health', group: 'grp_me', types: 'solo', home: true },
  { id: 'insights', color: 'var(--lav)', em: '🔗', label: 'insights', group: 'grp_me', types: 'solo', home: true },
  { id: 'year', color: 'var(--sky)', em: '✨', label: 'year', group: 'grp_me', types: 'all', home: true },
  { id: 'dlog', color: 'var(--pink)', em: '💘', label: 'dlog', group: 'grp_me', types: 'solo' },
  { id: 'budget', color: 'var(--lime)', em: '💸', label: 'budget', group: 'grp_life', types: 'all', home: true },
  { id: 'garage', color: 'var(--sky)', em: '🚗', label: 'garage', group: 'grp_life', types: 'all', home: true },
  { id: 'goals', color: 'var(--peach)', em: '🎯', label: 'goals', group: 'grp_life', types: 'all', home: true },
  { id: 'wishes', color: 'var(--pink)', em: '🎁', label: 'wishes', group: 'grp_life', types: 'all' },
  { id: 'poo', color: 'var(--sand)', em: '💩', label: 'poo', group: 'grp_life', types: ['solo', 'friends', 'mates', 'family'] },
  { id: 'movies', color: 'var(--lav)', em: '🎬', label: 'movies', group: 'grp_fun', types: 'all' },
  { id: 'dates', color: 'var(--pink)', em: '🌹', label: 'dates', group: 'grp_fun', types: ['couple', 'solo'] },
  { id: 'dreams', color: 'var(--mint)', em: '🗺️', label: 'dreams', group: 'grp_fun', types: 'all' },
  { id: 'coupons', color: 'var(--sun)', em: '🎟️', label: 'coupons', group: 'grp_fun', types: 'shared' },
  { id: 'wheel', color: 'var(--peach)', em: '🎡', label: 'wheel', group: 'grp_fun', types: 'all' },
  { id: 'challenge', color: 'var(--lime)', em: '🏆', label: 'challenge', group: 'grp_fun', types: 'all' },
  { id: 'intim', color: 'var(--coral)', em: '🔥', label: 'intim', group: 'grp_adult', types: ['couple', 'solo'], adult: true },
]
export const fits = (m: Mod, type: SpaceType, adult: boolean) => (!m.adult || adult) && (m.types === 'all' || (m.types === 'shared' ? type !== 'solo' : m.types === 'solo' ? type === 'solo' : m.types.includes(type)))
export const onHome = (m: Mod, lay: { hidden?: string[]; added?: string[] }) => (m.home ? !(lay.hidden || []).includes(m.id) : (lay.added || []).includes(m.id))

export const modColor = (id: string) => MODULES.find(m => m.id === id)?.color || 'var(--surface)'
