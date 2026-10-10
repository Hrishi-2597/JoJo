import React, { useMemo, useState } from 'react'
import MetricIcon from '../MetricIcon'
import {
  ComposedChart, LineChart, PieChart, Pie, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'
import {
  tsaCapacityCardData, fteByFY, tsaAttritionByFY, cpfByFY, actHrsByFY,
} from '../../data/tsaCapacityData'
import { TSA_ACTIVE_QUEUES, TSA_ACTIVE_QUEUE_NAMES } from '../../data/tsaData'
import { C, Tip, InfoButton } from '../ChartKit'
import { Modal } from '../Modal'

const CHART_BOX = { maxWidth: 620, margin: '0 auto' }
// Transferred from HES Forecasting's TsaMetricCards.jsx (2026-10-07, per direct
// request, unchanged) along with the Total Queues card itself — same region
// palette so regions look the same everywhere in the app, not just on that page.
const REGION_COLORS = { APJ: 'var(--accent)', EMEA: '#fb923c', Global: '#a78bfa', LATAM: '#22d3ee', NAMER: '#fbbf24' }

function StatusPip({ ok }) {
  return (
    <span style={{
      display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
      background: ok ? '#34d399' : '#f87171',
      flexShrink: 0,
    }} />
  )
}

// Changed from a plain <button> to a <div role="button"> (2026-07-10) so the
// per-card InfoButton — a real nested <button> — doesn't sit inside another <button>
// element; its wrapper stops click propagation so tapping it doesn't also toggle the
// card's own drill-down. RCA/CLCA (GraphInsightButton) removed from cards 2026-07-23
// in favor of this plain "what does this show" InfoButton — graphs elsewhere on the
// page still carry rca/clca.
function Card({ icon, label, sublabel, value, sub, trend, onClick, active, info }) {
  return (
    <div role="button" tabIndex={0} onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      className={`card-panel flex-1 min-w-0 text-left flex flex-col${active ? ' active' : ''}`}
      style={{ cursor: 'pointer', padding: 0, minHeight: 84, position: 'relative' }}>
      {info && (
        <div style={{ position: 'absolute', top: 6, right: 8, zIndex: 2 }} onClick={e => e.stopPropagation()}>
          <InfoButton info={info} align="right" />
        </div>
      )}
      <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 14, lineHeight: 1 }}>{icon}</span>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{label}</p>
          {sublabel && <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>{sublabel}</p>}
        </div>
      </div>
      <div style={{ padding: '8px 12px 10px', flex: 1 }}>
        <p className="num" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</p>
        {sub && (
          <p style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            {trend !== undefined && <StatusPip ok={trend} />}
            {sub}
          </p>
        )}
      </div>
      {active && <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, var(--accent), transparent)', marginTop: 'auto' }} />}
    </div>
  )
}

function FteTrendChart({ filters, granularity }) {
  const data = useMemo(() => fteByFY(filters, granularity), [filters, granularity])
  return (
    <div style={CHART_BOX}>
      <ResponsiveContainer width="100%" height={210}>
        <ComposedChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="l" tick={{ fill: C.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="r" orientation="right" tick={{ fill: C.trend, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Bar yAxisId="l" dataKey="actual" name="Actual FTE" fill={C.metric1} radius={[2,2,0,0]} maxBarSize={44} />
          <Bar yAxisId="l" dataKey="plan" name="Plan FTE" fill={C.metric2} radius={[2,2,0,0]} maxBarSize={44} />
          <Line yAxisId="r" type="monotone" dataKey="adherence" name="Staffing %" stroke={C.trend} strokeWidth={2} dot={{ r: 3, fill: C.trend, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

function AttritionTrendChart({ filters, granularity }) {
  const data = useMemo(() => tsaAttritionByFY(filters, granularity), [filters, granularity])
  return (
    <div style={CHART_BOX}>
      <ResponsiveContainer width="100%" height={210}>
        <ComposedChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="l" tick={{ fill: C.tick, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}K` : v} />
          <YAxis yAxisId="r" orientation="right" tick={{ fill: C.behind, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Bar yAxisId="l" dataKey="headcount" name="Headcount" fill={C.metric1} radius={[2,2,0,0]} maxBarSize={44} />
          <Line yAxisId="r" type="monotone" dataKey="attrition" name="Attrition %" stroke={C.behind} strokeWidth={2} dot={{ r: 3, fill: C.behind, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

function CasesPerFteTrendChart({ filters, granularity }) {
  const data = useMemo(() => cpfByFY(filters, granularity), [filters, granularity])
  return (
    <div style={CHART_BOX}>
      <ResponsiveContainer width="100%" height={210}>
        <LineChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: C.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Line type="monotone" dataKey="actual" name="Cases/FTE" stroke={C.behind} strokeWidth={2.5} dot={{ r: 3, fill: C.behind, strokeWidth: 0 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="plan" name="Plan" stroke={C.metric2} strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3, fill: C.metric2, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Plan line removed (2026-09-03, per direct request) — pop-up now shows actuals
// only. `actHrsByFY` itself is untouched (still computes plan/adherence for
// tsaCapacityCardData's own headline use) — this is a display-only change, not a
// data-layer one.
function AvgCaseTimeTrendChart({ filters, granularity }) {
  const data = useMemo(() => actHrsByFY(filters, granularity), [filters, granularity])
  return (
    <div style={CHART_BOX}>
      <ResponsiveContainer width="100%" height={210}>
        <LineChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: C.tick, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}h`} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Line type="monotone" dataKey="actual" name="Avg Case Time (hrs)" stroke={C.behind} strokeWidth={2.5} dot={{ r: 3, fill: C.behind, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Region-breakdown donut for the Total Queues card — transferred from HES
// Forecasting's TsaMetricCards.jsx (2026-10-07, per direct request, unchanged):
// click a slice (or its legend entry) to narrow the table below to that region;
// click again to clear.
function QueuesByRegionChart({ rows, selectedRegion, onSelectRegion }) {
  const data = useMemo(() => {
    const counts = {}
    rows.forEach(q => { counts[q.region] = (counts[q.region] || 0) + 1 })
    return Object.entries(counts)
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count)
  }, [rows])
  const total = rows.length
  const centerCount = selectedRegion ? (data.find(d => d.region === selectedRegion)?.count ?? 0) : total

  return (
    <div style={{ ...CHART_BOX, position: 'relative' }}>
      <p style={{ fontSize: 9.5, color: 'var(--text-faint)', marginBottom: 6, textAlign: 'center' }}>Click a slice to see that region's queues</p>
      <ResponsiveContainer width="100%" height={230}>
        <PieChart>
          <Tooltip content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const { region, count } = payload[0].payload
            return (
              <div className="chart-tooltip">
                <p style={{ fontSize: 10, fontWeight: 700, color: REGION_COLORS[region] || 'var(--accent)', marginBottom: 3 }}>{region}</p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{count} queues <span style={{ color: 'var(--text-faint)' }}>({total ? Math.round(count / total * 100) : 0}%)</span></p>
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
        position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%, -50%)',
        textAlign: 'center', pointerEvents: 'none',
      }}>
        <p className="num" style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{centerCount}</p>
        <p style={{ fontSize: 9, color: 'var(--text-faint)', marginTop: 2 }}>{selectedRegion || 'Queues'}</p>
      </div>
    </div>
  )
}

function QueueTable({ rows }) {
  return (
    <div style={{ overflowX: 'auto', maxHeight: 220, overflowY: 'auto' }}>
      <table className="w-full" style={{ fontSize: 11, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
            <th style={{ textAlign: 'left', padding: '4px 12px 4px 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Queue</th>
            <th style={{ textAlign: 'right', padding: '4px 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Region</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((q, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <td style={{ padding: '5px 12px 5px 0', fontFamily: 'monospace', fontSize: 10, color: 'var(--text-dim)' }}>{q.name}</td>
              <td style={{ padding: '5px 0', textAlign: 'right', color: 'var(--text-muted)' }}>{q.region}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// `filters` — narrows the drill-down list/donut to the selected Queue filter,
// matching the card's own headline count so the two never disagree once a queue
// selection is in scope.
function TotalQueuesSection({ filters }) {
  const [selectedRegion, setSelectedRegion] = useState(null)
  const scopedQueues = filters.queue?.length ? TSA_ACTIVE_QUEUES.filter(q => filters.queue.includes(q.name)) : TSA_ACTIVE_QUEUES
  const filteredRows = selectedRegion ? scopedQueues.filter(q => q.region === selectedRegion) : scopedQueues
  return (
    <>
      <QueuesByRegionChart rows={scopedQueues} selectedRegion={selectedRegion}
        onSelectRegion={r => setSelectedRegion(prev => prev === r ? null : r)} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0 6px' }}>
        <p style={{ fontSize: 10, color: 'var(--text-faint)' }}>
          {selectedRegion ? <><span style={{ color: 'var(--accent)', fontWeight: 600 }}>{selectedRegion}</span> — {filteredRows.length} queues</> : `All regions — ${filteredRows.length} queues`}
        </p>
        {selectedRegion && (
          <button onClick={() => setSelectedRegion(null)} style={{
            fontSize: 10, color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer',
            textDecoration: 'underline', textDecorationColor: 'rgba(127,168,204,0.3)',
          }}>Clear</button>
        )}
      </div>
      <QueueTable rows={filteredRows} />
    </>
  )
}

const MODAL_TITLES = {
  totalQueues: 'HES Queue Directory',
  fte: 'Staffing Summary — Actual vs Plan',
  attrition: 'Headcount & Attrition Trend',
  casesPerFte: 'Cases per FTE — Actual vs Plan',
  avgCaseTime: 'Avg Case Time — Actual',
}

// Builds the "YTD <period>: <value> · ▲/▼ X% vs <prevPeriod>" sub-message, same
// pattern as TsaMetricCards.jsx/MsgCapacityMetricCards.jsx. `lowerIsBetter` flips
// which direction counts as "good" (green): Attrition and Avg Case Time are worse
// when they climb YoY, unlike Staffing Summary/SLO % where growth is the good direction.
function ytdSub(metric, formattedValue, { lowerIsBetter = false } = {}) {
  if (metric.yoyPct === null || metric.yoyPct === undefined) {
    return { text: `YTD ${metric.period}: ${formattedValue} · no prior year in scope`, trend: undefined }
  }
  const up = metric.yoyPct >= 0
  const good = lowerIsBetter ? !up : up
  return { text: `YTD ${metric.period}: ${formattedValue} · ${up ? '▲' : '▼'} ${Math.abs(metric.yoyPct)}% vs ${metric.prevPeriod}`, trend: good }
}

function DrillDownModal({ type, filters, granularity, onClose }) {
  return (
    <Modal title={MODAL_TITLES[type]} onClose={onClose}>
      {type === 'totalQueues' && <TotalQueuesSection filters={filters} />}
      {type === 'fte' && <FteTrendChart filters={filters} granularity={granularity} />}
      {type === 'attrition' && <AttritionTrendChart filters={filters} granularity={granularity} />}
      {type === 'casesPerFte' && <CasesPerFteTrendChart filters={filters} granularity={granularity} />}
      {type === 'avgCaseTime' && <AvgCaseTimeTrendChart filters={filters} granularity={granularity} />}
    </Modal>
  )
}

// Total FTE / Attrition / Cases per FTE / Avg Case Time are all "lower is better"
// in the opposite sense of MSG Capacity's cards: understaffing (actual < plan FTE)
// is flagged red here, and overload (actual > plan on the other three) is flagged
// red — see design_choice.md for why this differs from MsgCapacityMetricCards.
export default function TsaCapacityMetricCards({ filters, granularity }) {
  const [active, setActive] = useState(null)
  const d = useMemo(() => tsaCapacityCardData(filters, granularity), [filters, granularity])
  const toggle = key => setActive(prev => prev === key ? null : key)

  const staffingYtd = ytdSub(d.totalFte, d.totalFte.actual.toLocaleString())
  const attritionYtd = ytdSub(d.attrition, `${d.attrition.actual}%`, { lowerIsBetter: true })
  const avgCaseTimeYtd = ytdSub(d.avgCaseTime, `${d.avgCaseTime.actual}h`, { lowerIsBetter: true })
  // Transferred from HES Forecasting's own tsaCardData() (2026-10-07, per direct
  // request, unchanged) — same one-liner: honors the Queue filter itself, defaults
  // to the full active roster otherwise.
  const activeQueueCount = filters.queue?.length ? filters.queue.length : TSA_ACTIVE_QUEUE_NAMES.length

  return (
    <div style={{ padding: '0 16px 12px' }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <Card icon={<MetricIcon name="queues" />} label="Total Queues" sublabel="Active"
          value={`${activeQueueCount}`}
          sub="Active HES queues"
          onClick={() => toggle('totalQueues')} active={active === 'totalQueues'}
          info="Count of active HES queues by region." />
        <Card icon={<MetricIcon name="staffing" />} label="Staffing Summary"
          value={d.totalFte.actual.toLocaleString()}
          sub={staffingYtd.text} trend={staffingYtd.trend}
          onClick={() => toggle('fte')} active={active === 'fte'}
          info="Actual FTE staffing against the FTE plan for the latest in-scope period." />
        <Card icon={<MetricIcon name="attrition" />} label="Attrition %"
          value={`${d.attrition.actual}%`}
          sub={attritionYtd.text} trend={attritionYtd.trend}
          onClick={() => toggle('attrition')} active={active === 'attrition'}
          info="Attrition rate for the latest in-scope period, compared against the prior period." />
        <Card icon={<MetricIcon name="cases" />} label="Cases per FTE"
          value={d.casesPerFte.actual}
          sub={`Plan ${d.casesPerFte.plan}`}
          trend={d.casesPerFte.actual <= d.casesPerFte.plan}
          onClick={() => toggle('casesPerFte')} active={active === 'casesPerFte'}
          info="Average cases handled per FTE, compared against the planned cases-per-FTE rate." />
        <Card icon={<MetricIcon name="time" />} label="Avg Case Time"
          value={`${d.avgCaseTime.actual}h`}
          sub={avgCaseTimeYtd.text} trend={avgCaseTimeYtd.trend}
          onClick={() => toggle('avgCaseTime')} active={active === 'avgCaseTime'}
          info="Average hours spent per case for the latest in-scope period, compared against the prior period." />
      </div>

      {active && <DrillDownModal type={active} filters={filters} granularity={granularity} onClose={() => setActive(null)} />}
    </div>
  )
}
