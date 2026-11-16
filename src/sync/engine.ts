/** Pure sync logic: no network, no storage. Covered by tests/engine.test.ts. */
export interface Row { id: string; edited_at: string; updated_at?: string; deleted_at?: string | null }
export interface Op { table: string; key: string; row: Record<string, unknown> }

/** Queue an operation; a newer op for the same record replaces the older one. */
export function enqueue(outbox: Op[], op: Op): Op[] {
  return [...outbox.filter(o => !(o.table === op.table && o.key === op.key)), op]
}

/**
 * Merge rows pulled from the server into the local set (last write wins per record).
 * A local row survives only if it still has a pending op and was edited later than the remote copy.
 */
export function mergeRemote<T extends Row>(local: Record<string, T>, remote: T[], pending: Set<string>): Record<string, T> {
  const out = { ...local }
  for (const r of remote) {
    const mine = out[r.id]
    if (mine && pending.has(r.id) && mine.edited_at > r.edited_at) continue
    out[r.id] = r
  }
  return out
}

/** Highest server timestamp seen so far: the cursor for the next incremental pull. */
export function nextCursor(prev: string, rows: { updated_at?: string }[]): string {
  return rows.reduce((c, r) => (r.updated_at && r.updated_at > c ? r.updated_at : c), prev)
}

export const alive = <T extends Row>(rows: Record<string, T>): T[] => Object.values(rows).filter(r => !r.deleted_at)

/** Drop tombstones older than `days` and rows of spaces the user no longer belongs to. */
export function prune<T extends Row & { space_id: string }>(rows: Record<string, T>, spaceIds: Set<string>, now: Date, days = 30): Record<string, T> {
  const limit = new Date(now.getTime() - days * 864e5).toISOString()
  const out: Record<string, T> = {}
  for (const r of Object.values(rows)) if (spaceIds.has(r.space_id) && !(r.deleted_at && r.deleted_at < limit)) out[r.id] = r
  return out
}
