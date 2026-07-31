import React, { useEffect, useMemo, useRef, useState } from 'react'
import { PLAN_NAMES } from '../../data/mockData'
import { queueHeadcountPerformance } from '../../data/msgCapacityData'
import { contributingFactors, FACTOR_TABLE_COLUMNS, varianceTier, varianceReason } from '../../data/insightFactors'
import { InfoButton, PlanSelect, PopupTable } from '../ChartKit'

const TIER_COLOR = { High: '#f87171', Moderate: '#fbbf24', Low: '#34d399' }

function TierDot({ tier }) {
  const color = TIER_COLOR[tier] ?? 'var(--text-muted)'
  return <span title={tier} style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}80`, display: 'inline-block' }} />
}

// Purple pill matching the same convention as the Forecasting page's Queue
// Performance table — clicking it opens a per-queue contributing-factors popup via
// the shared PopupTable renderer.
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

const COLUMNS = [
  { key: 'name', label: 'CQN', width: '26%' },
  { key: 'region', label: 'Region', width: '11%' },
  { key: 'actualHC', label: 'Actual HC', width: '12%', align: 'right' },
  { key: 'planHC', label: 'Plan HC', width: '12%', align: 'right' },
  { key: 'variance', label: 'Variance', width: '11%', align: 'right', sortable: true },
  { key: 'tier', label: 'Tier', width: '9%', align: 'center' },
  { key: 'rca', label: 'RCA/CLCA', width: '11%', align: 'center' },
]

// Sits directly above the Geo Map, same placement convention as the Forecasting
// page's own Queue Performance table — real per-queue Actual vs Plan headcount +
// variance, reusing the exact numbers slDefaulterQueues already computes from
// CAPACITY_QUEUES (not a new dataset), plus the same varianceTier/varianceReason
// treatment already used by this page's own "Queues with Highest Variation" and
// "Utilization Gap Queues" charts, per direct request to "take numbers similar to
// what we took for other graphs in same capacity page."
export default function QueuePerformanceTable({ filters }) {
  const [open, setOpen] = useState(true)
  // Multi-select Plan (2026-07-30) — this is a ranked queue list, not a period
  // trend, so it uses the FIRST selected plan for calculation (documented
  // simplification, same as UtilizationLayer's ranked-queue visuals).
  const [selectedPlans, setSelectedPlans] = useState([])
  const plan = selectedPlans[0]
  const [sortDir, setSortDir] = useState('desc')

  const rows = useMemo(() => {
    const base = queueHeadcountPerformance(filters, plan).map(q => ({
      ...q,
      tier: varianceTier(Math.abs(q.variance)).label,
      reason: varianceReason(q.name),
    }))
    const sorted = [...base].sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
    return sortDir === 'desc' ? sorted : sorted.reverse()
  }, [filters, plan, sortDir])

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
      <div className="layer-header" onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Queue Performance
          </span>
          <InfoButton info="Real per-queue Actual vs Plan headcount and variance for every queue in the current filter scope, worst variance first." />
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>— {rows.length} queue{rows.length === 1 ? '' : 's'} in scope</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--accent)', transform: open ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▲</span>
      </div>
      {open && (
        <div style={{ padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <PlanSelect label="Plan" value={selectedPlans} onChange={setSelectedPlans} options={PLAN_NAMES} />
          </div>
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
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
                  <tr key={r.name}>
                    <td style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</td>
                    <td style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text-dim)', borderBottom: '1px solid var(--border-subtle)' }}>{r.region}</td>
                    <td className="num" style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text-secondary)', textAlign: 'right', borderBottom: '1px solid var(--border-subtle)' }}>{r.actualHC}</td>
                    <td className="num" style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text-secondary)', textAlign: 'right', borderBottom: '1px solid var(--border-subtle)' }}>{r.planHC}</td>
                    <td className="num" style={{ padding: '6px 8px', fontSize: 11, fontWeight: 700, color: TIER_COLOR[r.tier], textAlign: 'right', borderBottom: '1px solid var(--border-subtle)' }}>{r.variance > 0 ? '+' : ''}{r.variance}%</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)' }}><TierDot tier={r.tier} /></td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)' }}><RcaClcaPill row={r} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
