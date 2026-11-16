import { useSyncExternalStore } from 'react'
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import { sb } from './lib/supabase'
import { detectLang, setLang, getLang, t } from './lib/i18n'
import { enqueue, mergeRemote, nextCursor, prune, type Op } from './sync/engine'

export type SpaceType = 'solo' | 'couple' | 'friends' | 'mates' | 'family'
export interface Member { id: string; n: string; a: string }
export interface Space { id: string; type: SpaceType; name: string; code: string; owner: string; since: string; members: Member[] }
export interface Task { id: string; space_id: string; created_by: string | null; title: string; due: string | null; done: boolean; assignee: string | null; edited_at: string; updated_at?: string; deleted_at?: string | null }
export interface Base { id: string; space_id: string; created_by: string | null; edited_at: string; updated_at?: string; deleted_at?: string | null }
export interface Event extends Base { title: string; day: string; time: string | null; note: string | null }
export interface Habit extends Base { title: string; icon: string; sort: number; archived: boolean }
export interface HabitLog extends Base { habit_id: string; day: string; done: boolean }
export interface Mood extends Base { day: string; score: number; tags: string[]; note: string | null }
export interface DiaryPage extends Base { day: string; body: string }
export interface Tables { tasks: Task; events: Event; habits: Habit; habit_logs: HabitLog; moods: Mood; diary_pages: DiaryPage }
export type Table = keyof Tables
export const TABLES: Table[] = ['tasks', 'events', 'habits', 'habit_logs', 'moods', 'diary_pages']
type Db = { [K in Table]: Record<string, Tables[K]> }
const emptyDb = (): Db => ({ tasks: {}, events: {}, habits: {}, habit_logs: {}, moods: {}, diary_pages: {} })
export interface Layout { tiles?: string[]; sizes?: Record<string, 's' | 'w' | 'l'>; cards?: string[] }
export interface Look { mode: 'auto' | 'light' | 'dark'; accent: string; bg: string }
export interface Profile { id: string; email: string; n: string; a: string; home: string; cur: string }
export type Route = 'hub' | 'today' | 'tasks' | 'planner' | 'habits' | 'mood' | 'diary' | 'people' | 'profile'

export interface State {
  ready: boolean; profile: Profile | null; spaces: Space[]; cur: string
  db: Db; layouts: Record<string, Layout>
  outbox: Op[]; cursor: Partial<Record<Table, string>>; look: Look; lang: number
  route: Route; online: boolean; syncing: boolean; toast: { text: string; action?: string; fn?: () => void } | null
}
const LOOK: Look = { mode: 'auto', accent: '#e6336e', bg: 'plain' }
const initial = (): State => ({ ready: false, profile: null, spaces: [], cur: '', db: emptyDb(), layouts: {}, outbox: [], cursor: {}, look: LOOK, lang: detectLang(), route: 'hub', online: navigator.onLine, syncing: false, toast: null })

let state = initial()
const subs = new Set<() => void>()
export const getState = () => state
export function useStore(): State { return useSyncExternalStore(f => { subs.add(f); return () => subs.delete(f) }, () => state) }
function set(p: Partial<State>, persist = true) { state = { ...state, ...p }; subs.forEach(f => f()); if (persist) save() }
;(window as unknown as { __store: unknown }).__store = { get: getState, set }

/* ---------- local persistence (works offline) ---------- */
const PERSIST: (keyof State)[] = ['profile', 'spaces', 'cur', 'db', 'layouts', 'outbox', 'cursor', 'look', 'lang']
const key = (uid: string) => 'lokami2:' + uid
let saveT = 0
function save() { if (!state.profile) return; clearTimeout(saveT); saveT = window.setTimeout(() => { const s = state; if (!s.profile) return; const o: Record<string, unknown> = {}; PERSIST.forEach(k => (o[k] = s[k])); idbSet(key(s.profile.id), o).catch(() => {}) }, 200) }

/* ---------- look ---------- */
export function applyLook() {
  const r = document.documentElement, l = state.look
  const dark = l.mode === 'dark' || (l.mode === 'auto' && window.matchMedia('(prefers-color-scheme:dark)').matches)
  r.dataset.mode = dark ? 'dark' : 'light'; r.dataset.bg = l.bg; r.style.setProperty('--accent', l.accent)
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#0e0e10' : '#f5f5f6')
}
window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change', applyLook)
export function setLook(p: Partial<Look>) { set({ look: { ...state.look, ...p } }); applyLook(); pushPrefs() }
export function changeLang(i: number) { setLang(i); set({ lang: i }); try { localStorage.setItem('lokami_lang', String(i)) } catch { /* private mode */ } pushPrefs() }
let prefsT = 0
function pushPrefs() { clearTimeout(prefsT); prefsT = window.setTimeout(async () => { const p = state.profile; if (!p) return; const { data } = await sb.from('profiles').select('ui').eq('id', p.id).maybeSingle(); await sb.from('profiles').update({ ui: { ...(data?.ui || {}), v2: state.look }, lang: state.lang === 0 ? 0 : state.lang === 1 ? 1 : 2, n: p.n, a: p.a, cur: state.cur }).eq('id', p.id) }, 600) }

/* ---------- helpers ---------- */
export const curSpace = (s: State = state) => s.spaces.find(x => x.id === s.cur) || s.spaces[0]
export const rows = <K extends Table>(table: K, space: string, s: State = state): Tables[K][] => Object.values(s.db[table]).filter(x => x.space_id === space && !x.deleted_at) as Tables[K][]
export const spaceTasks = (s: State = state) => rows('tasks', s.cur, s)
export const home = (s: State = state) => s.profile?.home || ''
export const go = (route: Route) => { set({ route }, false); window.scrollTo(0, 0) }
export function toast(text: string, action?: string, fn?: () => void) { set({ toast: { text, action, fn } }, false); window.setTimeout(() => { if (state.toast?.text === text) set({ toast: null }, false) }, action ? 4500 : 2400) }
export const dismissToast = () => set({ toast: null }, false)
export function switchSpace(id: string) { if (!state.spaces.some(s => s.id === id)) return; set({ cur: id, route: 'hub' }); window.scrollTo(0, 0); pushPrefs() }
export function updateProfile(p: Partial<Pick<Profile, 'n' | 'a'>>) { if (!state.profile) return; const profile = { ...state.profile, ...p }; set({ profile, spaces: state.spaces.map(s => ({ ...s, members: s.members.map(m => (m.id === profile.id ? { ...m, n: profile.n, a: profile.a } : m)) })) }); pushPrefs() }

/* ---------- mutations: local first, then queued for the server ---------- */
function queue(op: Op) { set({ outbox: enqueue(state.outbox, op) }); schedule() }
export function put<K extends Table>(table: K, r: Tables[K]) { set({ db: { ...state.db, [table]: { ...state.db[table], [r.id]: r } } }); const { updated_at: _u, ...row } = r as Base; void _u; queue({ table, key: r.id, row }) }
/** Create or patch a row; new rows get id, owner and timestamps. */
export function upsert<K extends Table>(table: K, id: string, patch: Partial<Tables[K]>, space: string = state.cur) {
  const old = state.db[table][id]
  put(table, { ...(old || { id, space_id: space, created_by: state.profile?.id || null, deleted_at: null }), ...patch, edited_at: new Date().toISOString() } as Tables[K])
}
export function remove(table: Table, id: string) { upsert(table, id, { deleted_at: new Date().toISOString() } as never); toast(t('deleted'), t('undo'), () => upsert(table, id, { deleted_at: null } as never)) }
const putTask = (tk: Task) => put('tasks', tk)
export function addTask(title: string, due: string | null = null, assignee: string | null = null) {
  const p = state.profile; if (!p || !title.trim()) return
  putTask({ id: crypto.randomUUID(), space_id: state.cur, created_by: p.id, title: title.trim().slice(0, 200), due, done: false, assignee, edited_at: new Date().toISOString(), deleted_at: null })
}
export function editTask(id: string, p: Partial<Pick<Task, 'title' | 'due' | 'done' | 'assignee' | 'deleted_at'>>) { const tk = state.db.tasks[id]; if (tk) putTask({ ...tk, ...p, edited_at: new Date().toISOString() }) }
export function removeTask(id: string, undoLabel: string, deletedLabel: string) { editTask(id, { deleted_at: new Date().toISOString() }); toast(deletedLabel, undoLabel, () => editTask(id, { deleted_at: null })) }
export function setLayout(p: Partial<Layout>) { const layout = { ...(state.layouts[state.cur] || {}), ...p }; set({ layouts: { ...state.layouts, [state.cur]: layout } }); queue({ table: 'space_layout', key: state.cur, row: { space_id: state.cur, layout } }) }

/* ---------- sync ---------- */
let flushT = 0, busy = false, again = false
function schedule(ms = 400) { clearTimeout(flushT); flushT = window.setTimeout(syncNow, ms) }
async function flush() {
  for (const op of [...state.outbox]) {
    const { error } = await sb.from(op.table).upsert(op.row, { onConflict: op.table === 'space_layout' ? 'space_id' : 'id' })
    if (error && !error.code) throw error                     // network: keep the op, try later
    if (error) console.warn('Lokami sync rejected', op.table, error.message)
    set({ outbox: state.outbox.filter(o => o !== op && !(o.table === op.table && o.key === op.key && o.row === op.row)) })
  }
}
async function pull() {
  const me = state.profile; if (!me) return
  const mem = await sb.from('space_members').select('space_id,user_id'); if (mem.error) throw mem.error
  const by: Record<string, string[]> = {}; mem.data.forEach(m => (by[m.space_id] = by[m.space_id] || []).push(m.user_id))
  const ids = Object.keys(by).filter(id => by[id].includes(me.id)); if (!ids.length) return
  const uids = [...new Set(ids.flatMap(id => by[id]))]
  const since = (tb: Table) => state.cursor[tb]
  const q = (tb: Table) => since(tb) ? sb.from(tb).select('*').in('space_id', ids).gt('updated_at', since(tb)!) : sb.from(tb).select('*').in('space_id', ids).is('deleted_at', null)
  const [sp, pf, lo, ...got] = await Promise.all([
    sb.from('spaces').select('id,type,name,code,owner,data').in('id', ids),
    sb.from('profiles').select('id,n,a').in('id', uids),
    sb.from('space_layout').select('space_id,layout').in('space_id', ids),
    ...TABLES.map(q),
  ])
  if (sp.error || pf.error || lo.error) throw sp.error || pf.error || lo.error
  for (const g of got) if (g.error) throw g.error
  const people: Record<string, Member> = {}; pf.data!.forEach(p => (people[p.id] = { id: p.id, n: p.n || '—', a: p.a || '🙂' }))
  const spaces: Space[] = sp.data!.map(s => ({ id: s.id, type: s.type, name: s.name || '', code: s.code, owner: s.owner, since: (s.data && s.data.since) || '', members: by[s.id].map(u => people[u] || { id: u, n: '—', a: '🙂' }) }))
    .sort((a, b) => (a.id === me.home ? -1 : b.id === me.home ? 1 : a.name.localeCompare(b.name)))
  const db = { ...state.db } as Record<Table, Record<string, Base>>, cursor = { ...state.cursor }, idset = new Set(ids)
  TABLES.forEach((tb, i) => {
    const data = got[i].data as Base[], pending = new Set(state.outbox.filter(o => o.table === tb).map(o => o.key))
    db[tb] = prune(mergeRemote(state.db[tb] as Record<string, Base>, data, pending), idset, new Date())
    cursor[tb] = nextCursor(cursor[tb] || '', data)
  })
  const layouts = { ...state.layouts }; const pl = new Set(state.outbox.filter(o => o.table === 'space_layout').map(o => o.key))
  lo.data!.forEach(l => { if (!pl.has(l.space_id)) layouts[l.space_id] = l.layout || {} })
  set({ spaces, db: db as Db, layouts, cursor, cur: spaces.some(s => s.id === state.cur) ? state.cur : me.home })
}
export async function syncNow() {
  if (!state.profile) return; if (busy) { again = true; return }
  busy = true; set({ syncing: true }, false)
  try { await flush(); await pull(); set({ online: true }, false) } catch { set({ online: false }, false) }
  busy = false; set({ syncing: false }, false); if (again) { again = false; schedule(50) }
}
let chan: ReturnType<typeof sb.channel> | null = null, poll = 0
function listen() {
  if (chan) sb.removeChannel(chan)
  chan = sb.channel('lokami2'); TABLES.forEach(tb => { chan!.on('postgres_changes', { event: '*', schema: 'public', table: tb }, () => schedule(150)) }); chan.on('postgres_changes', { event: '*', schema: 'public', table: 'space_layout' }, () => schedule(150)).on('postgres_changes', { event: '*', schema: 'public', table: 'space_members' }, () => schedule(150)).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => schedule(800)).subscribe()
  clearInterval(poll); poll = window.setInterval(syncNow, 30000)
}
window.addEventListener('online', () => syncNow()); window.addEventListener('offline', () => set({ online: false }, false))
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncNow() })

/* ---------- session ---------- */
async function enter(user: { id: string; email?: string; user_metadata?: { n?: string } }) {
  const cached = (await idbGet(key(user.id)).catch(() => null)) as Partial<State> | null
  if (cached && (cached as { tasks?: Db['tasks'] }).tasks) { cached.db = { ...emptyDb(), tasks: (cached as { tasks: Db['tasks'] }).tasks }; cached.cursor = {} }   // v2.0 cache shape
  if (cached) cached.db = { ...emptyDb(), ...(cached.db || {}) }
  if (cached?.profile) { set({ ...cached, ready: true }, false); setLang(state.lang); applyLook() }
  try {
    const name = user.user_metadata?.n || (user.email || '').split('@')[0]
    const home = await sb.rpc('ensure_profile', { p_name: name, p_lang: getLang() }); if (home.error) throw home.error
    const p = await sb.from('profiles').select('id,n,a,home,cur,lang,ui').eq('id', user.id).single(); if (p.error) throw p.error
    const profile: Profile = { id: user.id, email: user.email || '', n: cached?.profile?.n || p.data.n, a: cached?.profile?.a || p.data.a || '🦊', home: p.data.home, cur: p.data.cur || p.data.home }
    const look: Look = cached?.look || { ...LOOK, ...(p.data.ui?.v2 || {}) }
    const lang = cached?.lang ?? (typeof p.data.lang === 'number' ? p.data.lang : state.lang)
    set({ profile, look, lang, cur: cached?.cur || profile.cur, ready: true }); setLang(lang); applyLook()
    await syncNow(); listen()
  } catch { if (!cached?.profile) { set({ ready: true, profile: null }, false) } else { set({ online: false }, false); listen() } }
}
export async function boot() {
  try { const l = localStorage.getItem('lokami_lang'); if (l !== null) state.lang = +l } catch { /* ignore */ }
  setLang(state.lang); applyLook()
  const { data } = await sb.auth.getSession().catch(() => ({ data: { session: null } }))
  if (data.session) await enter(data.session.user); else set({ ready: true }, false)
}
export async function signIn(email: string, password: string) { const { data, error } = await sb.auth.signInWithPassword({ email, password }); if (error) return error.message; await enter(data.user); return '' }
export async function signUp(name: string, email: string, password: string): Promise<'' | 'confirm' | string> {
  const { data, error } = await sb.auth.signUp({ email, password, options: { data: { n: name }, emailRedirectTo: location.origin + location.pathname } })
  if (error) return error.message
  if (data.user && Array.isArray(data.user.identities) && !data.user.identities.length) return 'already'
  if (!data.session || !data.user) return 'confirm'
  await enter(data.user); return ''
}
function leaveSession() { if (chan) sb.removeChannel(chan); chan = null; clearInterval(poll); const lang = state.lang; state = { ...initial(), ready: true, lang }; subs.forEach(f => f()); applyLook() }
export async function signOut() { await syncNow(); await sb.auth.signOut().catch(() => {}); leaveSession() }
export async function deleteAccount() { const uid = state.profile?.id; const { error } = await sb.rpc('delete_account'); if (error) return false; if (uid) await idbDel(key(uid)).catch(() => {}); await sb.auth.signOut().catch(() => {}); leaveSession(); return true }
export async function createSpace(type: SpaceType, name: string, since: string) { const { data, error } = await sb.rpc('create_space', { p_type: type, p_name: name, p_since: since || null }); if (error) return false; await syncNow(); switchSpace(data as string); return true }
export async function joinSpace(code: string): Promise<'' | 'not_found' | 'already' | 'full' | 'net'> { const { data, error } = await sb.rpc('join_space', { p_code: code }); if (error) { const m = error.message || ''; return /not_found/.test(m) ? 'not_found' : /already/.test(m) ? 'already' : /full/.test(m) ? 'full' : 'net' } await syncNow(); switchSpace(data as string); return '' }
export async function leaveSpace(id: string) { const { error } = await sb.rpc('leave_space', { p_space: id }); if (error) return false; set({ cur: state.profile!.home, route: 'hub' }); await syncNow(); return true }
