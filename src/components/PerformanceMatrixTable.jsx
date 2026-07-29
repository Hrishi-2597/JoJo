import React, { useEffect, useMemo, useRef, useState } from 'react'
import { contributingFactors, FACTOR_TABLE_COLUMNS } from '../data/insightFactors'
import { BinaryToggle, InfoButton, PlanSelect, PopupTable } from './ChartKit'

// 'FY27Q1' -> 'FY27 Q1'
function formatQuarter(period) {
  return period.replace(/(FY\d{2})(Q\d)/, '$1 $2')
}

const SUBHEAD_STYLE = {
  background: 'var(--bg-inset)', color: 'var(--text-muted)', textAlign: 'right', padding: '5px 8px',
  fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em',
  borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)', whiteSpace: 'nowrap',
}
const DATA_CELL = {
  padding: '5px 8px', fontSize: 10.5, color: 'var(--text-secondary)', textAlign: 'right',
  borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)', whiteSpace: 'nowrap',
}

// Same purple RCA/CLCA pill + PopupTable convention msgCapacity/QueuePerformanceTable.jsx
// already established for a per-row popup — reused here rather than re-invented.
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
    title: `Contributing factors — ${row.lob}`,
    columns: FACTOR_TABLE_COLUMNS,
    rows: contributingFactors(row.lob, null, 2),
  }), [row.lob])

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
        <div className="chart-tooltip animate-fade-in" style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 30, width: 340, textAlign: 'left' }}>
          <PopupTable table={table} maxHeight={200} />
        </div>
      )}
    </div>
  )
}

// Generic LOB × Fiscal Quarter performance matrix (2026-07-29) — shared by HES
// Forecasting's ASU/SR Performance table and HES Capacity's Workload/ACT Performance
// table, since both were requested with the identical shape: Fiscal-Quarter-grouped
// Actual/Plan/Adherence% triplets per LOB, a metric toggle, a single Plan Name
// dropdown shared across both toggle positions, and a per-row RCA/CLCA popup column.
// No numbered layer badge (matches QueuePerformanceTable's own precedent for an
// "extra table above the Geo Map" — that page's badges 01-04 stay untouched).
export default function PerformanceMatrixTable({
  title, infoText, leftMetric, rightMetric, metric, onMetricChange,
  planOptions, plan, onPlanChange, rows, actualLabel, planLabel,
}) {
  const [open, setOpen] = useState(true)
  const periods = rows[0]?.quarters.map(q => q.period) ?? []
  const colCount = 1 + periods.length * 3 + 1

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
      <div className="layer-header" onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {title}
          </span>
          <InfoButton info={infoText} />
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>— {rows.length} LOB{rows.length === 1 ? '' : 's'} in scope</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--accent)', transform: open ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▲</span>
      </div>
      {open && (
        <div style={{ padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 24, marginBottom: 10, flexWrap: 'wrap' }}>
            <BinaryToggle leftLabel={leftMetric} rightLabel={rightMetric} value={metric} onChange={onMetricChange} />
            <PlanSelect label="Plan Name" value={plan} onChange={onPlanChange} options={planOptions} />
          </div>
          <div style={{ maxHeight: 440, overflow: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 6 }}>
            <table style={{ borderCollapse: 'collapse', width: 'max-content', minWidth: '100%' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 3 }}>
                <tr>
                  <th rowSpan={2} style={{
                    position: 'sticky', left: 0, zIndex: 4,
                    background: 'var(--bg-panel)', textAlign: 'left', padding: '6px 10px', fontSize: 9.5, fontWeight: 700,
                    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em',
                    borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)', minWidth: 150,
                  }}>LOB</th>
                  {periods.map(p => (
                    <th key={p} colSpan={3} style={{
                      // `--accent-dim` is a translucent rgba() tint (by design, for inline badges)
                      // — used bare here it let scrolled body rows show through this sticky header
                      // as the table scrolled. Layering it over an opaque `--bg-panel` backdrop
                      // keeps the same tinted look while making the header fully opaque.
                      background: 'linear-gradient(var(--accent-dim), var(--accent-dim)), var(--bg-panel)',
                      color: 'var(--accent)', textAlign: 'center', padding: '6px 8px',
                      fontSize: 9.5, fontWeight: 700, borderBottom: '1px solid var(--border-subtle)', borderLeft: '1px solid var(--border-subtle)',
                    }}>{formatQuarter(p)}</th>
                  ))}
                  <th rowSpan={2} style={{
                    background: 'var(--bg-panel)', textAlign: 'center', padding: '6px 8px', fontSize: 9.5, fontWeight: 700,
                    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em',
                    borderBottom: '1px solid var(--border-subtle)', borderLeft: '1px solid var(--border-subtle)', minWidth: 90,
                  }}>RCA/CLCA</th>
                </tr>
                <tr>
                  {periods.flatMap(p => ([
                    <th key={`${p}-a`} style={SUBHEAD_STYLE}>{actualLabel}</th>,
                    <th key={`${p}-p`} style={SUBHEAD_STYLE}>{planLabel}</th>,
                    <th key={`${p}-adh`} style={SUBHEAD_STYLE}>Adherence %</th>,
                  ]))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={colCount} style={{ padding: '16px 0', textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>No LOBs match the current filters.</td></tr>
                )}
                {rows.map(r => (
                  <tr key={r.lob}>
                    <td style={{
                      position: 'sticky', left: 0, zIndex: 1,
                      background: 'var(--bg-panel)', padding: '6px 10px', fontSize: 11, fontWeight: 600, color: 'var(--text-primary)',
                      borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)', whiteSpace: 'nowrap',
                    }}>{r.lob}</td>
                    {r.quarters.flatMap(q => ([
                      <td key={`${q.period}-a`} className="num" style={DATA_CELL}>{q.actual.toLocaleString()}</td>,
                      <td key={`${q.period}-p`} className="num" style={DATA_CELL}>{q.plan.toLocaleString()}</td>,
                      <td key={`${q.period}-adh`} className="num" style={{ ...DATA_CELL, fontWeight: 600, color: q.adherence >= 100 ? '#34d399' : q.adherence >= 90 ? 'var(--text-secondary)' : '#f87171' }}>{q.adherence}%</td>,
                    ]))}
                    <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)', borderLeft: '1px solid var(--border-subtle)' }}>
                      <RcaClcaPill row={r} />
                    </td>
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
