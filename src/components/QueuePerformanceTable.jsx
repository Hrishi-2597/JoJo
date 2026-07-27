import React, { useEffect, useMemo, useRef, useState } from 'react'
import { queuePerformance } from '../data/mockData'
import { contributingFactors, FACTOR_TABLE_COLUMNS } from '../data/insightFactors'
import { InfoButton, PopupTable } from './ChartKit'

const STATUS_COLOR = { Good: '#34d399', Fair: '#fbbf24', Poor: '#f87171' }

function StatusDot({ status }) {
  const color = STATUS_COLOR[status] ?? 'var(--text-muted)'
  return <span title={status} style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}80`, display: 'inline-block' }} />
}

// Purple pill button matching the supplied reference image exactly (rather than the
// small circular "i" used elsewhere) — clicking it opens the same GraphInsightButton-
// style popup table, scoped to this one row's queue, via the shared PopupTable renderer.
function RcaClcaPill({ row }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onMouseDown = e => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false) }
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const table = useMemo(() => ({
    title: `Contributing factors — ${row.name}`,
    columns: FACTOR_TABLE_COLUMNS,
    rows: contributingFactors(row.name, row.region, 2),
  }), [row.name, row.region])

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          fontSize: 9.5, fontWeight: 700, letterSpacing: '0.02em', color: '#f5f3ff',
          background: open ? '#6d28d9' : '#7c3aed', border: 'none', borderRadius: 5,
          padding: '4px 10px', cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        RCA/CLCA
      </button>
      {open && (
        <div className="chart-tooltip animate-fade-in" style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 30, width: 360, textAlign: 'left' }}>
          <PopupTable table={table} maxHeight={220} />
        </div>
      )}
    </div>
  )
}

// Queue column (the synthetic Q-NNN code) removed and "Name" renamed to "CQN" per
// direct request (2026-07-27) — CQN is this app's own real term for a queue name
// (see mockData.js's cqnPlanVariance/cqnActualVariance, which already key rows by
// `cqn` rather than `name`).
const COLUMNS = [
  { key: 'name', label: 'CQN', width: '32%' },
  { key: 'region', label: 'Region', width: '12%' },
  { key: 'forecast', label: 'Forecast', width: '14%', align: 'right' },
  { key: 'actual', label: 'Actual', width: '14%', align: 'right' },
  { key: 'accuracy', label: 'Acc%', width: '10%', align: 'right', sortable: true },
  { key: 'status', label: 'Status', width: '9%', align: 'center' },
  { key: 'rca', label: 'RCA/CLCA', width: '11%', align: 'center' },
]

// Sits directly above the Geo Map, per direct request — real per-queue forecast vs
// actual vs accuracy, filtered by whatever the page's own filter bar currently has in
// scope (queuePerformance() just wraps filterQueues, so it's automatically live) AND
// by the page-wide View By granularity toggle (2026-07-27 follow-up — queuePerformance
// now accepts it as a third argument).
export default function QueuePerformanceTable({ filters, granularity }) {
  const [open, setOpen] = useState(true)
  // Sort by accuracy (2026-07-27, per direct request) — 'asc' (worst first, the
  // original default) or 'desc'; click the Acc% header to toggle.
  const [sortDir, setSortDir] = useState('asc')
  const rows = useMemo(() => {
    const base = queuePerformance(filters, undefined, granularity)
    return sortDir === 'asc' ? base : [...base].reverse()
  }, [filters, granularity, sortDir])

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
      <div className="layer-header" onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Queue Performance
          </span>
          <InfoButton info="Per-queue forecast vs actual volume and accuracy % for every queue in the current filter scope, worst accuracy first." />
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>— {rows.length} queue{rows.length === 1 ? '' : 's'} in scope</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--accent)', transform: open ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▲</span>
      </div>
      {open && (
        <div style={{ padding: 12, maxHeight: 360, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                {COLUMNS.map(c => (
                  <th key={c.key}
                    onClick={c.sortable ? () => setSortDir(d => d === 'asc' ? 'desc' : 'asc') : undefined}
                    title={c.sortable ? 'Click to sort' : undefined}
                    style={{
                      position: 'sticky', top: 0, background: 'var(--bg-panel)', width: c.width,
                      textAlign: c.align || 'left', padding: '6px 8px', fontSize: 9.5, fontWeight: 700,
                      color: c.sortable ? 'var(--accent)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em',
                      borderBottom: '1px solid var(--border-subtle)', cursor: c.sortable ? 'pointer' : undefined, userSelect: 'none',
                    }}>
                    {c.label}{c.sortable && <span style={{ marginLeft: 3 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={COLUMNS.length} style={{ padding: '16px 0', textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>No queues match the current filters.</td></tr>
              )}
              {rows.map(r => (
                <tr key={r.code}>
                  <td style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</td>
                  <td style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text-dim)', borderBottom: '1px solid var(--border-subtle)' }}>{r.region}</td>
                  <td className="num" style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text-secondary)', textAlign: 'right', borderBottom: '1px solid var(--border-subtle)' }}>{r.forecast.toLocaleString()}</td>
                  <td className="num" style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text-secondary)', textAlign: 'right', borderBottom: '1px solid var(--border-subtle)' }}>{r.actual.toLocaleString()}</td>
                  <td className="num" style={{ padding: '6px 8px', fontSize: 11, fontWeight: 700, color: STATUS_COLOR[r.status], textAlign: 'right', borderBottom: '1px solid var(--border-subtle)' }}>{r.accuracy}%</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)' }}><StatusDot status={r.status} /></td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)' }}><RcaClcaPill row={r} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
