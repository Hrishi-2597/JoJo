import React, { useEffect, useRef, useState } from 'react'

// Shared chart primitives used across every page (Forecasting, TSA Forecasting, and
// both Capacity Plan pages) — one Visual wrapper / Tip / plan-picker implementation
// instead of near-duplicates per page. Originally lived in tsa/TsaChartKit.jsx;
// promoted here once a second page family (Capacity Plan) needed the exact same
// pieces — TsaChartKit.jsx now re-exports everything from here so none of its
// existing imports had to change.

// Same color-role convention established on the Forecasting page: blue/orange compare
// two neutral quantities, violet is a neutral trend line, green/red mean ahead/behind.
export const C = {
  metric1: '#38bdf8', metric2: '#fb923c', trend: '#a78bfa',
  ahead: '#34d399', behind: '#f87171',
  grid: 'var(--chart-grid)', tick: '#4a6a85',
}

// Small per-graph RCA/CLCA popup (2026-07-10) — a lightweight "i" button, deliberately
// not a full sidebar-style panel: one RCA sentence + one CLCA sentence, since the
// request was explicit about keeping this small ("don't exaggerate it"). Lives in its
// own corner (top-left) so it never collides with cornerControls (top-right), which
// most Region/Sub-region toggles already occupy.
//
// Extended 2026-07-27 with an optional `table` prop ({ title?, columns, rows }) — per
// direct request that clicking RCA/CLCA "give details" in tabular form (contributing
// factors, variance tiers + reasons, bucket composition, etc.), instead of a 4th popup
// button being added per graph. When `table` is present the popup widens from 220px to
// fit real data and gains a click-outside-to-close handler (a plain two-sentence popup
// doesn't need one; a popup big enough to hold a table does).
export function GraphInsightButton({ rca, clca, table, align = 'left' }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open || !table) return
    const onMouseDown = e => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false) }
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, table])

  if (!rca && !clca && !table) return null
  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="RCA / CLCA for this graph"
        aria-label="RCA / CLCA for this graph"
        style={{
          width: 17, height: 17, borderRadius: '50%', border: '1px solid rgba(56,189,248,0.35)',
          background: open ? 'var(--accent)' : 'var(--bg-inset)', color: open ? 'var(--accent-contrast)' : 'var(--accent)',
          fontSize: 9, fontWeight: 700, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', padding: 0, fontStyle: 'italic',
        }}
      >i</button>
      {open && (
        <div className="chart-tooltip animate-fade-in" style={{
          position: 'absolute', top: 'calc(100% + 6px)', zIndex: 20, width: table ? 440 : 220, textAlign: 'left',
          ...(align === 'right' ? { right: 0 } : { left: 0 }),
        }}>
          {rca && (
            <>
              <p style={{ fontSize: 8.5, fontWeight: 700, color: '#38bdf8', letterSpacing: '0.04em' }}>RCA</p>
              <p style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.35, marginTop: 1, marginBottom: clca ? 6 : 0 }}>{rca}</p>
            </>
          )}
          {clca && (
            <>
              <p style={{ fontSize: 8.5, fontWeight: 700, color: '#34d399', letterSpacing: '0.04em' }}>CLCA</p>
              <p style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.35, marginTop: 1 }}>{clca}</p>
            </>
          )}
          {table && <PopupTable table={table} topMargin={rca || clca ? 8 : 0} />}
        </div>
      )}
    </div>
  )
}

// Generic {columns, rows} table renderer shared by every GraphInsightButton `table`
// payload — one implementation so every graph's detail popup looks consistent.
export function PopupTable({ table, topMargin = 0 }) {
  const { title, columns, rows } = table
  return (
    <div style={{ marginTop: topMargin }}>
      {title && <p style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.04em', marginBottom: 4 }}>{title.toUpperCase()}</p>}
      <div style={{ maxHeight: 220, overflowY: 'auto', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {columns.map(c => (
                <th key={c.key} style={{
                  position: 'sticky', top: 0, background: 'var(--tooltip-bg)',
                  textAlign: c.align || 'left', padding: '3px 6px 3px 0', fontSize: 8.5, fontWeight: 700,
                  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em',
                  borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap',
                }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={columns.length} style={{ padding: '8px 0', fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>No rows in scope.</td></tr>
            )}
            {rows.map((r, i) => (
              <tr key={i}>
                {columns.map(c => (
                  <td key={c.key} className={typeof r[c.key] === 'number' ? 'num' : undefined} style={{
                    textAlign: c.align || 'left', padding: '4px 6px 4px 0', fontSize: 10, color: 'var(--text-secondary)',
                    borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--border-subtle)', whiteSpace: c.wrap ? 'normal' : 'nowrap',
                  }}>
                    {r[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function Visual({ title, subtitle, children, controls, cornerControls, rca, clca, table, info }) {
  return (
    <div className="chart-panel flex-1 min-w-0 flex flex-col gap-2" style={{ position: 'relative' }}>
      {cornerControls && <div style={{ position: 'absolute', top: 10, right: 12, zIndex: 2 }}>{cornerControls}</div>}
      {(rca || clca || table) && <div style={{ position: 'absolute', top: 10, left: 12, zIndex: 2 }}><GraphInsightButton rca={rca} clca={clca} table={table} /></div>}
      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
        {title}{info && <InfoButton info={info} />}
      </p>
      {subtitle && <p style={{ fontSize: 9.5, color: 'var(--text-faint)', textAlign: 'center' }}>{subtitle}</p>}
      {controls && <div style={{ display: 'flex', justifyContent: 'center' }}>{controls}</div>}
      {children}
    </div>
  )
}

// Plain "what does this show" description button (2026-07-23) — deliberately separate
// from GraphInsightButton's RCA/CLCA analysis above: one neutral sentence explaining
// what the card/graph is trying to show, no root-cause or corrective-action framing.
// On a Visual it sits inline right next to the title (not an absolute corner) so it
// never collides with cornerControls (top-right) or GraphInsightButton (top-left).
// On KPI cards it takes the top-right corner slot GraphInsightButton used to occupy,
// now that cards no longer carry RCA/CLCA at all.
export function InfoButton({ info, align = 'left' }) {
  const [open, setOpen] = useState(false)
  if (!info) return null
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="What this shows"
        aria-label="What this shows"
        style={{
          width: 15, height: 15, borderRadius: '50%', border: '1px solid rgba(167,139,250,0.45)',
          background: open ? '#a78bfa' : 'var(--bg-inset)', color: open ? '#0b1220' : '#a78bfa',
          fontSize: 8.5, fontWeight: 700, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', padding: 0, fontStyle: 'italic', flexShrink: 0,
        }}
      >i</button>
      {open && (
        <div className="chart-tooltip animate-fade-in" style={{
          position: 'absolute', top: 'calc(100% + 6px)', zIndex: 20, width: 200, textAlign: 'left',
          ...(align === 'right' ? { right: 0 } : { left: 0 }),
        }}>
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.35 }}>{info}</p>
        </div>
      )}
    </div>
  )
}

export function PillButton({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      fontSize: 10, fontWeight: 600, color: 'var(--accent)', background: 'rgba(56,189,248,0.08)',
      border: '1px solid rgba(56,189,248,0.25)', borderRadius: 14, padding: '3px 11px', cursor: 'pointer',
    }}>
      {children}
    </button>
  )
}

export const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', marginBottom: 5 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 11, color: p.color, marginBottom: 2 }}>
          {p.name}: <span style={{ fontWeight: 600 }}>
            {typeof p.value === 'number' && p.value > 99 ? p.value.toLocaleString() : p.value}
          </span>
        </p>
      ))}
    </div>
  )
}

export function truncate(str, n) {
  if (str.length <= n) return str
  const cut = str.slice(0, n)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > n * 0.55 ? cut.slice(0, lastSpace) : cut) + '…'
}

export function CategoryTick({ x, y, payload }) {
  return (
    <text x={x} y={y} dy={3} textAnchor="end" fontSize={9.5} fill="var(--text-secondary)">{truncate(String(payload.value), 22)}</text>
  )
}

export function PlanDropdowns({ planA, planB, onChange, options }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
      {[['planA', planA, 'A'], ['planB', planB, 'B']].map(([key, val, lbl]) => (
        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Plan {lbl}
          </label>
          <select value={val} onChange={e => onChange(key, e.target.value)} className="select-dark">
            {options.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      ))}
    </div>
  )
}

export function PlanSelect({ value, onChange, options, label = 'Plan' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <label style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="select-dark">
        {options.map(p => <option key={p}>{p}</option>)}
      </select>
    </div>
  )
}

// 3-way segmented pill for Region/Country-style toggles (used by every geo map and
// several trend visuals) — knob-slide switch between exactly two named states.
export function BinaryToggle({ leftLabel, rightLabel, value, onChange }) {
  const isRight = value === rightLabel
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10 }}>
      <span style={{ color: !isRight ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 500 }}>{leftLabel}</span>
      <button onClick={() => onChange(isRight ? leftLabel : rightLabel)}
        style={{ position: 'relative', display: 'inline-flex', alignItems: 'center',
          width: 32, height: 17, borderRadius: 9,
          background: isRight ? 'var(--accent)' : 'var(--bg-inset)',
          border: 'none', cursor: 'pointer', transition: 'background 0.2s', padding: 0 }}>
        <span style={{ position: 'absolute', top: 2, left: isRight ? 17 : 2,
          width: 13, height: 13, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
      </button>
      <span style={{ color: isRight ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 500 }}>{rightLabel}</span>
    </div>
  )
}
