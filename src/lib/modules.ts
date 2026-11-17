import type { Key } from '../i18n/en'
import type { SpaceType } from '../store'
export type Group = 'grp_us' | 'grp_me' | 'grp_life' | 'grp_fun' | 'grp_adult'
export interface Mod { id: string; em: string; label: Key; group: Group; types: 'all' | 'shared' | 'solo' | SpaceType[]; adult?: boolean; home?: boolean }
/** Every module in the app. `home: true` = shown on the home screen by default; the rest live in “All modules” until pinned. */
export const MODULES: Mod[] = [
  { id: 'question', em: '💬', label: 'question', group: 'grp_us', types: 'shared', home: true },
  { id: 'checkin', em: '🫶', label: 'checkin', group: 'grp_us', types: 'shared', home: true },
  { id: 'tasks', em: '✅', label: 'tasks', group: 'grp_us', types: 'all', home: true },
  { id: 'shopping', em: '🛒', label: 'shopping', group: 'grp_us', types: 'shared', home: true },
  { id: 'planner', em: '🗓️', label: 'planner', group: 'grp_us', types: 'all', home: true },
  { id: 'cards', em: '🃏', label: 'cards', group: 'grp_us', types: 'all' },
  { id: 'status', em: '🟢', label: 'status', group: 'grp_us', types: 'shared' },
  { id: 'notes', em: '💌', label: 'notes', group: 'grp_us', types: 'shared' },
  { id: 'people', em: '👥', label: 'people', group: 'grp_us', types: 'shared', home: true },
  { id: 'habits', em: '🌱', label: 'habits', group: 'grp_me', types: 'solo', home: true },
  { id: 'mood', em: '🙂', label: 'mood', group: 'grp_me', types: 'solo', home: true },
  { id: 'diary', em: '📓', label: 'diary', group: 'grp_me', types: 'solo', home: true },
  { id: 'health', em: '❤️', label: 'health', group: 'grp_me', types: 'solo', home: true },
  { id: 'insights', em: '🔗', label: 'insights', group: 'grp_me', types: 'solo', home: true },
  { id: 'year', em: '✨', label: 'year', group: 'grp_me', types: 'all', home: true },
  { id: 'dlog', em: '💘', label: 'dlog', group: 'grp_me', types: 'solo' },
  { id: 'budget', em: '💸', label: 'budget', group: 'grp_life', types: 'all', home: true },
  { id: 'garage', em: '🚗', label: 'garage', group: 'grp_life', types: 'all', home: true },
  { id: 'goals', em: '🎯', label: 'goals', group: 'grp_life', types: 'all', home: true },
  { id: 'wishes', em: '🎁', label: 'wishes', group: 'grp_life', types: 'all' },
  { id: 'poo', em: '💩', label: 'poo', group: 'grp_life', types: ['solo', 'friends', 'mates', 'family'] },
  { id: 'movies', em: '🎬', label: 'movies', group: 'grp_fun', types: 'all' },
  { id: 'dates', em: '🌹', label: 'dates', group: 'grp_fun', types: ['couple', 'solo'] },
  { id: 'dreams', em: '🗺️', label: 'dreams', group: 'grp_fun', types: 'all' },
  { id: 'coupons', em: '🎟️', label: 'coupons', group: 'grp_fun', types: 'shared' },
  { id: 'wheel', em: '🎡', label: 'wheel', group: 'grp_fun', types: 'all' },
  { id: 'challenge', em: '🏆', label: 'challenge', group: 'grp_fun', types: 'all' },
  { id: 'intim', em: '🔥', label: 'intim', group: 'grp_adult', types: ['couple', 'solo'], adult: true },
]
export const fits = (m: Mod, type: SpaceType, adult: boolean) => (!m.adult || adult) && (m.types === 'all' || (m.types === 'shared' ? type !== 'solo' : m.types === 'solo' ? type === 'solo' : m.types.includes(type)))
export const onHome = (m: Mod, lay: { hidden?: string[]; added?: string[] }) => (m.home ? !(lay.hidden || []).includes(m.id) : (lay.added || []).includes(m.id))
