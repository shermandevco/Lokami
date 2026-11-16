/** Tiny bar chart: heights scale to the max value; empty days show a stub. Labels for screen readers. */
export function Bars({ values, labels, color = 'var(--accent)' }: { values: (number | null)[]; labels: string[]; color?: string }) {
  const max = Math.max(1, ...values.map(v => v || 0))
  return <div className="bars" role="img" aria-label={values.map((v, i) => labels[i] + ': ' + (v ?? '—')).join(', ')}>
    {values.map((v, i) => <i key={i} style={{ height: v ? Math.max(6, (v / max) * 100) + '%' : 3, background: v ? color : 'var(--line)' }} />)}
  </div>
}
