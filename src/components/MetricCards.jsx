import React, { useMemo, useState } from 'react'
import {
  BarChart, LineChart, ComposedChart, PieChart, Pie, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'
import {
  cardData, callVolumeByFY, dbOspVolumeByFY, forecastAccuracyByFY, forecastAccuracyByRegionForYear,
  CQN_VARIANCE_BY_FY, cqnVarianceQueuesByFY, allQueuesByStatus, queuesByBusinessPartner,
} from '../data/mockData'
import { Modal } from './Modal'
import { InfoButton } from './ChartKit'

// pct: violet for the "% trend line" role — matches the app-wide convention that
// neutral analytical lines get violet, since green/handled already means something else here.
const C = { offered: 'var(--accent)', handled: '#34d399', db: 'var(--accent)', osp: '#fb923c', actual: 'var(--accent)', forecast: '#fb923c', line: '#34d399', pct: '#a78bfa', grid: 'var(--chart-grid)', tick: '#4a6a85' }
// Chart drill-downs are capped and centered so 3-5 categories don't stretch across the
// full dashboard width with huge gaps between bar groups.
const CHART_BOX = { maxWidth: 620, margin: '0 auto' }
const BAR_GAPS = { barCategoryGap: '20%', barGap: 6 }
// Distinct categorical colors for the region donut — deliberately avoids green/red,
// which are reserved elsewhere for ahead-of-plan/behind-plan semantics.
const REGION_COLORS = { APJ: 'var(--accent)', EMEA: '#fb923c', Global: '#a78bfa', LATAM: '#22d3ee', NAMER: '#fbbf24' }

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

function StatusPip({ ok }) {
  return (
    <span style={{
      display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
      background: ok ? '#34d399' : '#f87171',
      boxShadow: ok ? '0 0 6px rgba(52,211,153,0.7)' : '0 0 6px rgba(248,113,113,0.7)',
      flexShrink: 0,
    }} />
  )
}

// Changed from a plain <button> to a <div role="button"> (2026-07-10) so the new
// per-card InfoButton — a real nested <button> — doesn't sit inside another <button>
// element; the info button's wrapper stops click propagation so tapping it doesn't
// also toggle the card's own drill-down open/closed.
function Card({ id, icon, label, sublabel, value, sub, trend, onClick, active, info }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      className={`card-panel flex-1 min-w-0 text-left flex flex-col${active ? ' active' : ''}`}
      style={{ cursor: 'pointer', padding: 0, minHeight: 84, position: 'relative' }}
    >
      {info && (
        <div style={{ position: 'absolute', top: 6, right: 8, zIndex: 2 }} onClick={e => e.stopPropagation()}>
          <InfoButton info={info} align="right" />
        </div>
      )}
      <div style={{
        padding: '8px 12px 6px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ fontSize: 14, lineHeight: 1 }}>{icon}</span>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{label}</p>
          {sublabel && <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>{sublabel}</p>}
        </div>
      </div>

      <div style={{ padding: '8px 12px 10px', flex: 1 }}>
        <p className="num" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>
          {value}
        </p>
        {sub && (
          <p style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            {trend !== undefined && <StatusPip ok={trend} />}
            {sub}
          </p>
        )}
      </div>

      {active && (
        <div style={{
          height: 2, background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
          marginTop: 'auto',
        }} />
      )}
    </div>
  )
}

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', marginBottom: 5 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 11, color: p.color, marginBottom: 2 }}>
          {p.name}: <span style={{ fontWeight: 600 }}>
            {typeof p.value === 'number' && p.value > 100 ? p.value.toLocaleString() : `${p.value}%`}
          </span>
        </p>
      ))}
    </div>
  )
}

// Region donut now plots whichever status view is selected (All/Active/Inactive),
// but always shows the Active/Inactive split underneath the big number and in each
// slice's tooltip — regardless of which view is active — so "both" is always visible,
// not hidden behind the toggle. `allRows` (unfiltered by statusView) is what the
// breakdown numbers are computed from; `rows` (statusView-filtered) is what the pie
// itself plots.
function QueuesByRegionChart({ rows, allRows, selectedRegion, onSelectRegion }) {
  const data = useMemo(() => {
    const counts = {}
    rows.forEach(q => { counts[q.region] = (counts[q.region] || 0) + 1 })
    return Object.entries(counts)
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count)
  }, [rows])
  const total = rows.length

  const regionBreakdown = useMemo(() => {
    const b = {}
    allRows.forEach(q => {
      b[q.region] = b[q.region] || { active: 0, inactive: 0 }
      b[q.region][q.status === 'Active' ? 'active' : 'inactive']++
    })
    return b
  }, [allRows])

  const centerCount = selectedRegion ? (data.find(d => d.region === selectedRegion)?.count ?? 0) : total
  const centerBreakdown = selectedRegion
    ? (regionBreakdown[selectedRegion] || { active: 0, inactive: 0 })
    : Object.values(regionBreakdown).reduce((s, b) => ({ active: s.active + b.active, inactive: s.inactive + b.inactive }), { active: 0, inactive: 0 })

  return (
    <div style={{ ...CHART_BOX, position: 'relative' }}>
      <p style={{ fontSize: 9.5, color: 'var(--text-faint)', marginBottom: 6, textAlign: 'center' }}>Click a slice to see that region's queues</p>
      <ResponsiveContainer width="100%" height={230}>
        <PieChart>
          <Tooltip content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const { region, count } = payload[0].payload
            const bd = regionBreakdown[region] || { active: 0, inactive: 0 }
            return (
              <div className="chart-tooltip">
                <p style={{ fontSize: 10, fontWeight: 700, color: REGION_COLORS[region] || 'var(--accent)', marginBottom: 3 }}>{region}</p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{count} queues <span style={{ color: 'var(--text-faint)' }}>({total ? Math.round(count / total * 100) : 0}%)</span></p>
                <p style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 3, paddingTop: 3, borderTop: '1px solid var(--border-subtle)' }}>
                  Active <span style={{ color: '#34d399', fontWeight: 600 }}>{bd.active}</span> · Inactive <span style={{ color: '#f87171', fontWeight: 600 }}>{bd.inactive}</span>
                </p>
              </div>
            )
          }} />
          <Legend verticalAlign="bottom" height={30}
            onClick={e => onSelectRegion(e.value)}
            wrapperStyle={{ fontSize: 10, color: C.tick, cursor: 'pointer' }} />
          <Pie data={data} dataKey="count" nameKey="region" cx="50%" cy="46%"
            innerRadius={54} outerRadius={82} paddingAngle={2}
            onClick={d => onSelectRegion(d.region)} style={{ cursor: 'pointer' }}>
            {data.map((d, i) => (
              <Cell key={i} fill={REGION_COLORS[d.region] || C.tick}
                stroke="var(--bg-panel)" strokeWidth={2}
                opacity={selectedRegion == null || selectedRegion === d.region ? 0.92 : 0.25} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{
        position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%, -50%)',
        textAlign: 'center', pointerEvents: 'none',
      }}>
        <p className="num" style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{centerCount}</p>
        <p style={{ fontSize: 9, color: 'var(--text-faint)', marginTop: 2 }}>{selectedRegion || 'Queues'}</p>
        <p style={{ fontSize: 8.5, color: 'var(--text-faint)', marginTop: 3 }}>
          <span style={{ color: '#34d399', fontWeight: 600 }}>{centerBreakdown.active}</span> active ·{' '}
          <span style={{ color: '#f87171', fontWeight: 600 }}>{centerBreakdown.inactive}</span> inactive
        </p>
      </div>
    </div>
  )
}

// Status view (All/Active/Inactive) is a local drill-down control, separate from the
// page's ambient filters — it narrows what the donut/table show without touching
// `filters`, same "opening/closing this never touches filter state" principle as the
// rest of this modal.
function QueuesSection({ filters }) {
  const [statusView, setStatusView] = useState('All')
  const [selectedRegion, setSelectedRegion] = useState(null)
  const allRows = useMemo(() => allQueuesByStatus(filters), [filters])
  const statusRows = useMemo(() => statusView === 'All' ? allRows : allRows.filter(q => q.status === statusView), [allRows, statusView])
  const filteredRows = selectedRegion ? statusRows.filter(q => q.region === selectedRegion) : statusRows

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <div className="drill-toggle">
          {['All', 'Active', 'Inactive'].map(s => (
            <button key={s} onClick={() => setStatusView(s)} className={`drill-btn${statusView === s ? ' active' : ''}`}>{s}</button>
          ))}
        </div>
      </div>
      <QueuesByRegionChart rows={statusRows} allRows={allRows} selectedRegion={selectedRegion}
        onSelectRegion={r => setSelectedRegion(prev => prev === r ? null : r)} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0 6px' }}>
        <p style={{ fontSize: 10, color: 'var(--text-faint)' }}>
          {selectedRegion ? <><span style={{ color: 'var(--accent)', fontWeight: 600 }}>{selectedRegion}</span> — {filteredRows.length} {statusView.toLowerCase()} queues</> : `${statusView} — ${filteredRows.length} queues`}
        </p>
        {selectedRegion && (
          <button onClick={() => setSelectedRegion(null)} style={{
            fontSize: 10, color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer',
            textDecoration: 'underline', textDecorationColor: 'rgba(127,168,204,0.3)',
          }}>Clear</button>
        )}
      </div>
      <QueueTable rows={filteredRows} />
      <BusinessPartnerTable filters={filters} />
    </>
  )
}

function QueueTable({ rows }) {
  return (
    <div style={{ overflowX: 'auto', maxHeight: 220, overflowY: 'auto' }}>
      <table className="w-full" style={{ fontSize: 11, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
            <th style={{ textAlign: 'left', padding: '4px 12px 4px 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Queue</th>
            <th style={{ textAlign: 'left', padding: '4px 12px 4px 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Region</th>
            <th style={{ textAlign: 'left', padding: '4px 12px 4px 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
            <th style={{ textAlign: 'right', padding: '4px 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Accuracy</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((q, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <td style={{ padding: '5px 12px 5px 0', fontFamily: 'monospace', fontSize: 10, color: 'var(--text-dim)' }}>{q.name}</td>
              <td style={{ padding: '5px 12px 5px 0', color: 'var(--text-muted)' }}>{q.region}</td>
              <td style={{ padding: '5px 12px 5px 0' }}>
                <span className={`badge ${q.status === 'Active' ? 'badge-good' : 'badge-bad'}`}>{q.status}</span>
              </td>
              <td className="num" style={{ padding: '5px 0', textAlign: 'right', fontWeight: 600,
                color: q.accuracy == null ? 'var(--text-muted)' : q.accuracy >= 90 ? '#34d399' : q.accuracy >= 80 ? '#fbbf24' : '#f87171' }}>
                {q.accuracy == null ? '—' : `${q.accuracy}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// A count that reveals the queue names behind it on hover — "when we hover on that
// number we would be able to see the queue name," per direct request. Native title
// tooltips don't wrap/scroll well for a long name list, so this uses the same
// .chart-tooltip styling as every other hover popup in the app instead.
function HoverCount({ value, names, color }) {
  const [show, setShow] = useState(false)
  return (
    <span
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => names.length > 0 && setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span style={{
        fontWeight: 700, color, cursor: names.length > 0 ? 'pointer' : 'default',
        textDecoration: names.length > 0 ? 'underline dotted' : 'none', textUnderlineOffset: 3,
      }}>{value}</span>
      {show && (
        <div className="chart-tooltip animate-fade-in" style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 30,
          width: 230, maxHeight: 190, overflowY: 'auto', textAlign: 'left',
        }}>
          {names.map((n, i) => (
            <p key={i} style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-secondary)', padding: '2px 0', whiteSpace: 'nowrap' }}>{n}</p>
          ))}
        </div>
      )}
    </span>
  )
}

// Per-Business-Partner active/inactive split — "a table for BP queues list and a
// split of active and inactive queues for them," per direct request. Reflects the
// same ambient `filters` as the region donut above (region/businessPartner only, the
// two dimensions the inactive roster carries), independent of the donut's own
// statusView/selectedRegion drill state.
function BusinessPartnerTable({ filters }) {
  const rows = useMemo(() => queuesByBusinessPartner(filters), [filters])
  return (
    <div style={{ marginTop: 14 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-primary)' }}>Business Partner Breakdown</p>
      <p style={{ fontSize: 9.5, color: 'var(--text-faint)', marginBottom: 8 }}>Hover a count to see the queue names</p>
      {/* Deliberately no overflow wrapper here (unlike the other tables in this modal):
          setting even just overflow-x resolves overflow-y to 'auto' per the CSS spec
          (the two can't be split when one isn't 'visible'), which was clipping the
          HoverCount tooltip that pops out below each row. This table is only 4 narrow
          columns (Business Partner + 3 counts), so horizontal scroll was never actually
          needed — the Modal itself still scrolls vertically if the whole popup runs long. */}
      <div>
        <table className="w-full" style={{ fontSize: 11, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
              <th style={{ textAlign: 'left', padding: '4px 12px 4px 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Business Partner</th>
              <th style={{ textAlign: 'right', padding: '4px 10px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active</th>
              <th style={{ textAlign: 'right', padding: '4px 10px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Inactive</th>
              <th style={{ textAlign: 'right', padding: '4px 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((bp, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '5px 12px 5px 0', color: 'var(--text-secondary)' }}>{bp.businessPartner}</td>
                <td className="num" style={{ padding: '5px 10px', textAlign: 'right' }}>
                  <HoverCount value={bp.active} names={bp.activeNames} color="#34d399" />
                </td>
                <td className="num" style={{ padding: '5px 10px', textAlign: 'right' }}>
                  <HoverCount value={bp.inactive} names={bp.inactiveNames} color="#f87171" />
                </td>
                <td className="num" style={{ padding: '5px 0', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>{bp.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Abandon % (calls offered but not handled) replaced Handled % on the trend line —
// same second-axis "neutral rate" role, just a different percentage.
function VolumeByFYChart({ filters, granularity }) {
  const data = useMemo(() => callVolumeByFY(filters, granularity).map(d => ({
    ...d, abandonPct: d.offered ? +((d.offered - d.handled) / d.offered * 100).toFixed(1) : 0,
  })), [filters, granularity])
  return (
    <div style={CHART_BOX}>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }} {...BAR_GAPS}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="l" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
          <YAxis yAxisId="r" orientation="right" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: C.pct, fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={v => `${v}%`} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Bar yAxisId="l" dataKey="offered" name="Offered" fill={C.offered} opacity={0.85} radius={[3,3,0,0]} maxBarSize={54} />
          <Bar yAxisId="l" dataKey="handled" name="Handled" fill={C.handled} opacity={0.85} radius={[3,3,0,0]} maxBarSize={54} />
          <Line yAxisId="r" type="monotone" dataKey="abandonPct" name="Abandon %" stroke={C.pct}
            strokeWidth={2} dot={{ r: 3, fill: C.pct, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// Static reference list — real public holidays paired with real countries, illustrative
// dates (not tied to a specific calendar year) since offered/handled volume isn't
// broken out by holiday in the underlying data. Context for why Offered/Abandon %
// swings around these dates, same role the RCA/CLCA panels' illustrative content
// plays elsewhere in the app; lives beside the component that renders it rather than
// in mockData.js since nothing filters or computes off it.
const HOLIDAY_CALENDAR = [
  { date: 'Jan 1', holiday: "New Year's Day", country: 'Global' },
  { date: 'Jan 26', holiday: 'Republic Day', country: 'India' },
  { date: 'Feb 10', holiday: 'Lunar New Year', country: 'China' },
  { date: 'Mar 29', holiday: 'Good Friday', country: 'United Kingdom' },
  { date: 'May 1', holiday: 'Labour Day', country: 'Germany' },
  { date: 'Jul 4', holiday: 'Independence Day', country: 'United States' },
  { date: 'Sep 7', holiday: 'Independence Day', country: 'Brazil' },
  { date: 'Oct 20', holiday: 'Diwali', country: 'India' },
  { date: 'Nov 27', holiday: 'Thanksgiving', country: 'United States' },
  { date: 'Dec 25', holiday: 'Christmas Day', country: 'Global' },
]

function HolidayCalendar() {
  return (
    <div style={{ ...CHART_BOX, marginTop: 14 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-primary)' }}>Holiday Calendar</p>
      <p style={{ fontSize: 9.5, color: 'var(--text-faint)', marginBottom: 8 }}>Public holidays that can drive offered-volume swings in the affected country</p>
      <table className="w-full" style={{ fontSize: 11, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
            <th style={{ textAlign: 'left', padding: '4px 12px 4px 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date</th>
            <th style={{ textAlign: 'left', padding: '4px 12px 4px 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Holiday</th>
            <th style={{ textAlign: 'left', padding: '4px 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Country</th>
          </tr>
        </thead>
        <tbody>
          {HOLIDAY_CALENDAR.map((h, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <td style={{ padding: '5px 12px 5px 0', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h.date}</td>
              <td style={{ padding: '5px 12px 5px 0', color: 'var(--text-secondary)' }}>{h.holiday}</td>
              <td style={{ padding: '5px 0', color: 'var(--text-secondary)' }}>{h.country}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Changed from grouped columns to a line chart per direct request — same two series
// (DB Offered / OSP Offered), same colors, just plotted as trend lines instead of bars.
function DbOspByFYChart({ filters, granularity }) {
  const data = useMemo(() => dbOspVolumeByFY(filters, granularity), [filters, granularity])
  return (
    <div style={CHART_BOX}>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Line type="monotone" dataKey="db"  name="DB Offered"  stroke={C.db}  strokeWidth={2.5} dot={{ r: 3, fill: C.db, strokeWidth: 0 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="osp" name="OSP Offered" stroke={C.osp} strokeWidth={2.5} dot={{ r: 3, fill: C.osp, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Region breakdown — now reached by clicking a year in ForecastByFYChart below,
// rather than being the drill-down's own default view. `fy` selects which year's
// nudge to apply (forecastAccuracyByRegionForYear), keeping this view internally
// consistent with whichever year's bar was clicked.
function ForecastByRegionChart({ filters, fy }) {
  const data = useMemo(() => forecastAccuracyByRegionForYear(filters, fy), [filters, fy])
  return (
    <div style={CHART_BOX}>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }} {...BAR_GAPS}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} />
          <XAxis dataKey="region" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="l" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
          <YAxis yAxisId="r" orientation="right" domain={[0,100]} tick={{ fill: C.line, fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={v => `${v}%`} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Bar yAxisId="l" dataKey="actual"   name="Actual"   fill={C.actual}   opacity={0.85} radius={[3,3,0,0]} maxBarSize={30} />
          <Bar yAxisId="l" dataKey="forecast" name="Forecast" fill={C.forecast} opacity={0.85} radius={[3,3,0,0]} maxBarSize={30} />
          <Line yAxisId="r" type="monotone" dataKey="accuracy" name="Accuracy %" stroke={C.line}
            strokeWidth={2} dot={{ r: 3, fill: C.line, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// New default view (2026-07-08): Fiscal Year rollup, same Actual/Forecast bars +
// Accuracy% line shape as the region chart above. Clicking a year's bar opens
// ForecastYearRegionModal with that year's regional breakdown, mirroring the
// CQN Variance drill-down's own "click a year for detail" pattern in this file.
function ForecastByFYChart({ filters, onSelectYear }) {
  const data = useMemo(() => forecastAccuracyByFY(filters), [filters])
  return (
    <div style={CHART_BOX}>
      <p style={{ fontSize: 9.5, color: 'var(--text-faint)', marginBottom: 6, textAlign: 'center' }}>Click a year to see that year's regional breakdown</p>
      <ResponsiveContainer width="100%" height={205}>
        <ComposedChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }} {...BAR_GAPS}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="l" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
          <YAxis yAxisId="r" orientation="right" domain={[0,100]} tick={{ fill: C.line, fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={v => `${v}%`} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Bar yAxisId="l" dataKey="actual" name="Actual" fill={C.actual} opacity={0.85} radius={[3,3,0,0]} maxBarSize={54}
            onClick={d => onSelectYear(d.period)} style={{ cursor: 'pointer' }} />
          <Bar yAxisId="l" dataKey="forecast" name="Forecast" fill={C.forecast} opacity={0.85} radius={[3,3,0,0]} maxBarSize={54}
            onClick={d => onSelectYear(d.period)} style={{ cursor: 'pointer' }} />
          <Line yAxisId="r" type="monotone" dataKey="accuracy" name="Accuracy %" stroke={C.line}
            strokeWidth={2} dot={{ r: 3, fill: C.line, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// Nested pop-up opened by clicking a year in ForecastByFYChart — same custom fixed-
// overlay markup as YearQueueModal below (not the shared Modal component, since this
// is itself already nested inside a Modal).
function ForecastYearRegionModal({ fy, filters, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(4,9,15,0.7)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="animate-fade-in"
        style={{
          background: 'var(--bg-panel)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 10,
          padding: '16px 18px', width: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(56,189,248,0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{fy} — Regional Forecast Accuracy</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 10 }}>Actual vs Forecast by region for {fy}</p>
        <ForecastByRegionChart filters={filters} fy={fy} />
      </div>
    </div>
  )
}

function VarianceByFYChart({ filters, onSelectYear }) {
  return (
    <div style={CHART_BOX}>
      <p style={{ fontSize: 9.5, color: 'var(--text-faint)', marginBottom: 6, textAlign: 'center' }}>Click a year to see example queues within the ±10% band</p>
      <ResponsiveContainer width="100%" height={205}>
        <BarChart data={CQN_VARIANCE_BY_FY} margin={{ top: 4, right: 16, left: 0, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} />
          <XAxis dataKey="fy" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={v => `${v}%`} domain={[0, 60]} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.06)' }} />
          <Bar dataKey="pct" name="Within ±10%" radius={[4,4,0,0]} maxBarSize={90}
            onClick={d => onSelectYear(d.fy)} style={{ cursor: 'pointer' }}>
            {CQN_VARIANCE_BY_FY.map((d, i) => <Cell key={i} fill="var(--accent)" opacity={0.85} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function YearQueueModal({ fy, filters, onClose }) {
  const queues = useMemo(() => cqnVarianceQueuesByFY(filters, fy), [filters, fy])
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(4,9,15,0.7)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="animate-fade-in"
        style={{
          background: 'var(--bg-panel)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 10,
          padding: '16px 18px', width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(56,189,248,0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{fy} — Queues within ±10% variance</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 10 }}>Representative sample from the current filter scope</p>
        {queues.length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', padding: '12px 0' }}>No queues in the current filter scope.</p>
        ) : (
          <table className="w-full" style={{ fontSize: 11, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                <th style={{ textAlign: 'left', padding: '4px 12px 4px 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Queue</th>
                <th style={{ textAlign: 'right', padding: '4px 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Variance</th>
              </tr>
            </thead>
            <tbody>
              {queues.map((q, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '6px 12px 6px 0', fontFamily: 'monospace', fontSize: 10, color: 'var(--text-secondary)' }}>{q.name}</td>
                  <td className="num" style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600, color: '#34d399' }}>
                    {q.variance > 0 ? '+' : ''}{q.variance}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const MODAL_TITLES = {
  queues:   'Queue Directory — Active & Inactive',
  volume:   'Offered vs Handled — Fiscal Year',
  dbOsp:    'DB vs OSP Offered Volume',
  forecast: 'Forecast Accuracy — Fiscal Year',
  variance: 'Year-over-Year Forecast Variance',
}

// Opening/closing a card's popup only touches this component's own `active`
// state — `filters` keeps flowing from ForecastingPage unchanged, so closing
// the modal always returns to the dashboard exactly as filtered.
function DrillDownModal({ type, filters, granularity, onClose }) {
  const [selectedYear, setSelectedYear] = useState(null)
  const [selectedForecastYear, setSelectedForecastYear] = useState(null)
  return (
    <Modal title={MODAL_TITLES[type]} onClose={onClose}>
      {type === 'queues' && <QueuesSection filters={filters} />}
      {type === 'volume' && <><VolumeByFYChart filters={filters} granularity={granularity} /><HolidayCalendar /></>}
      {type === 'dbOsp' && <DbOspByFYChart filters={filters} granularity={granularity} />}
      {type === 'forecast' && <ForecastByFYChart filters={filters} onSelectYear={setSelectedForecastYear} />}
      {type === 'variance' && <VarianceByFYChart filters={filters} onSelectYear={setSelectedYear} />}

      {selectedYear && <YearQueueModal fy={selectedYear} filters={filters} onClose={() => setSelectedYear(null)} />}
      {selectedForecastYear && <ForecastYearRegionModal fy={selectedForecastYear} filters={filters} onClose={() => setSelectedForecastYear(null)} />}
    </Modal>
  )
}

export default function MetricCards({ filters, granularity }) {
  const [active, setActive] = useState(null)
  const d = useMemo(() => cardData(filters, granularity), [filters, granularity])
  const toggle = key => setActive(prev => prev === key ? null : key)

  return (
    <div style={{ padding: '0 16px 12px' }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <Card id="queues"
          icon="⬡" label="Total Queues" sublabel="Active"
          value={`${d.totalQueues.active}`}
          sub="Active queues"
          onClick={() => toggle('queues')} active={active === 'queues'}
          info="Count of active queues in the current roster, broken down by region and business partner."
        />
        <Card id="volume"
          icon="📞" label="Call Volume" sublabel="Offered & Handled"
          value={fmt(d.callVolume.offered)}
          sub={`${fmt(d.callVolume.handled)} handled · ${d.callVolume.abandonPct}% abandoned`}
          trend={d.callVolume.abandonPct <= 10}
          onClick={() => toggle('volume')} active={active === 'volume'}
          info="Offered and handled call volume for the selected period, with the resulting abandon rate."
        />
        <Card id="dbOsp"
          icon="⚖" label="DB / OSP Split"
          sublabel={filters.dbOsp === 'DB' ? 'Offered volume · DB only' : filters.dbOsp === 'OSP' ? 'Offered volume · OSP only' : 'Offered volume'}
          value={
            filters.dbOsp === 'DB' ? `${d.dbOspSplit.db}%`
            : filters.dbOsp === 'OSP' ? `${d.dbOspSplit.osp}%`
            : `${d.dbOspSplit.db}% / ${d.dbOspSplit.osp}%`
          }
          sub={
            filters.dbOsp === 'DB' ? `DB ${fmt(d.dbOspSplit.dbVol)}`
            : filters.dbOsp === 'OSP' ? `OSP ${fmt(d.dbOspSplit.ospVol)}`
            : `DB ${fmt(d.dbOspSplit.dbVol)}  ·  OSP ${fmt(d.dbOspSplit.ospVol)}`
          }
          onClick={() => toggle('dbOsp')} active={active === 'dbOsp'}
          info="Share of offered call volume routed through DB queues versus OSP queues."
        />
        <Card id="forecast"
          icon="◎" label="Forecast Accuracy" sublabel=""
          value={`${d.forecastAccuracy.value}%`}
          sub={`Target ${d.forecastAccuracy.target}% · ${d.forecastAccuracy.value >= d.forecastAccuracy.target ? 'On track' : 'Below target'}`}
          trend={d.forecastAccuracy.value >= d.forecastAccuracy.target}
          onClick={() => toggle('forecast')} active={active === 'forecast'}
          info="Actual volume compared against forecast for the selected period, measured against the accuracy target."
        />
        <Card id="variance"
          icon="±" label="Forecast Variance" sublabel="Within ±10%"
          value={`${d.cqnVariance.pct}%`}
          sub={`${d.cqnVariance.withinRange} of ${d.cqnVariance.total} queues`}
          trend={d.cqnVariance.pct >= 40}
          onClick={() => toggle('variance')} active={active === 'variance'}
          info="Share of queues, by fiscal year, whose plan-vs-plan variance falls within a ±10% band."
        />
      </div>

      {active && <DrillDownModal type={active} filters={filters} granularity={granularity} onClose={() => setActive(null)} />}
    </div>
  )
}
