import { describe, it, expect } from 'vitest'
import { enqueue, mergeRemote, nextCursor, alive, prune, type Row } from '../src/sync/engine'
const row = (id: string, edited: string, extra: Partial<Row & { space_id: string; title: string }> = {}) => ({ id, edited_at: edited, space_id: 's1', title: id, ...extra })

describe('enqueue', () => {
  it('keeps one op per record, newest last', () => {
    let q = enqueue([], { table: 'tasks', key: 'a', row: { v: 1 } })
    q = enqueue(q, { table: 'tasks', key: 'b', row: { v: 1 } })
    q = enqueue(q, { table: 'tasks', key: 'a', row: { v: 2 } })
    expect(q.map(o => o.key)).toEqual(['b', 'a'])
    expect(q[1].row.v).toBe(2)
  })
  it('does not mix tables', () => {
    const q = enqueue(enqueue([], { table: 'tasks', key: 'a', row: {} }), { table: 'space_layout', key: 'a', row: {} })
    expect(q).toHaveLength(2)
  })
})

describe('mergeRemote', () => {
  it('adds new remote rows and replaces synced local ones', () => {
    const out = mergeRemote({ a: row('a', '2026-01-01') }, [row('a', '2026-01-02', { title: 'new' }), row('b', '2026-01-01')], new Set())
    expect(out.a.title).toBe('new'); expect(Object.keys(out)).toEqual(['a', 'b'])
  })
  it('keeps a newer pending local edit', () => {
    const out = mergeRemote({ a: row('a', '2026-01-03', { title: 'mine' }) }, [row('a', '2026-01-02', { title: 'theirs' })], new Set(['a']))
    expect(out.a.title).toBe('mine')
  })
  it('lets a newer remote edit win over an older pending local edit', () => {
    const out = mergeRemote({ a: row('a', '2026-01-01', { title: 'mine' }) }, [row('a', '2026-01-02', { title: 'theirs' })], new Set(['a']))
    expect(out.a.title).toBe('theirs')
  })
  it('applies remote deletion', () => {
    const out = mergeRemote({ a: row('a', '2026-01-01') }, [row('a', '2026-01-02', { deleted_at: '2026-01-02' })], new Set())
    expect(alive(out)).toHaveLength(0)
  })
})

describe('nextCursor', () => {
  it('moves forward only', () => {
    expect(nextCursor('2026-01-05', [{ updated_at: '2026-01-03' }, { updated_at: '2026-01-07' }])).toBe('2026-01-07')
    expect(nextCursor('2026-01-05', [{ updated_at: '2026-01-03' }])).toBe('2026-01-05')
    expect(nextCursor('', [])).toBe('')
  })
})

describe('prune', () => {
  it('drops rows of left spaces and old tombstones', () => {
    const rows = { a: row('a', '1'), b: row('b', '1', { space_id: 'gone' }), c: row('c', '1', { deleted_at: '2025-01-01T00:00:00.000Z' }), d: row('d', '1', { deleted_at: '2026-06-09T00:00:00.000Z' }) }
    const out = prune(rows, new Set(['s1']), new Date('2026-06-10T00:00:00.000Z'))
    expect(Object.keys(out).sort()).toEqual(['a', 'd'])
  })
})
