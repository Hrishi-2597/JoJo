import React, { useMemo, useState } from 'react'
import {
  ComposedChart, BarChart, LineChart, PieChart, Pie, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'
import {
  tsaCardData, asuByFY, srDbOspByFY, cpasuByFY, ucrByFY, TSA_ACTIVE_QUEUES,
} from '../../data/tsaData'
import { C, Tip, Modal, InfoButton } from './TsaChartKit'

const CHART_BOX = { maxWidth: 620, margin: '0 auto' }
// Same region palette as the Forecasting page's Total Queues donut (MetricCards.jsx)
// — regions should look the same everywhere in the app, not just on this page.
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
// per-card InfoButton — a real nested <button> — doesn't sit inside another
// <button> element; its wrapper stops click propagation so tapping it doesn't also
// toggle the card's own drill-down.
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

function AsuTrendChart({ filters, granularity }) {
  const data = useMemo(() => asuByFY(filters, granularity), [filters, granularity])
  return (
    <div style={CHART_BOX}>
      <ResponsiveContainer width="100%" height={210}>
        <LineChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Line type="monotone" dataKey="actual" name="ASU Actuals" stroke={C.metric1} strokeWidth={2.5} dot={{ r: 3, fill: C.metric1, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Grouped columns, not stacked — DB and OSP render as two side-by-side bars per
// fiscal year instead of one stacked bar, per the requested chart-type change.
function SrDbOspChart({ filters, granularity }) {
  const data = useMemo(() => srDbOspByFY(filters, granularity), [filters, granularity])
  return (
    <div style={CHART_BOX}>
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Bar dataKey="db" name="DB" fill={C.metric1} opacity={0.85} radius={[3,3,0,0]} maxBarSize={44} />
          <Bar dataKey="osp" name="OSP" fill={C.metric2} opacity={0.85} radius={[3,3,0,0]} maxBarSize={44} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Line-only, CPASU alone — the bars (SR/ASU) that used to share this chart were
// dropped per the requested "just CPASU over years" redesign.
function CpasuChart({ filters, granularity }) {
  const data = useMemo(() => cpasuByFY(filters, granularity), [filters, granularity])
  return (
    <div style={CHART_BOX}>
      <ResponsiveContainer width="100%" height={210}>
        <LineChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: C.trend, fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Line type="monotone" dataKey="cpasu" name="CPASU" stroke={C.trend} strokeWidth={2.5} dot={{ r: 3, fill: C.trend, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function CurrentUcrChart({ filters, granularity }) {
  const data = useMemo(() => ucrByFY(filters, granularity), [filters, granularity])
  return (
    <div style={CHART_BOX}>
      <ResponsiveContainer width="100%" height={210}>
        <ComposedChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="l" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} domain={[0,100]} tickFormatter={v => `${v}%`} />
          <YAxis yAxisId="r" orientation="right" tick={{ fill: C.trend, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Bar yAxisId="l" dataKey="current" name="Current" fill={C.metric1} opacity={0.85} radius={[3,3,0,0]} maxBarSize={54} />
          <Bar yAxisId="l" dataKey="target" name="Target" fill={C.metric2} opacity={0.85} radius={[3,3,0,0]} maxBarSize={54} />
          <Line yAxisId="r" type="monotone" dataKey="adherence" name="Adherence %" stroke={C.trend} strokeWidth={2} dot={{ r: 3, fill: C.trend, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// Region-breakdown donut for the Total Queues card — same mechanic as the
// Forecasting page's QueuesByRegionChart (MetricCards.jsx): click a slice (or its
// legend entry) to narrow the table below to that region; click again to clear.
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

function TotalQueuesSection() {
  const [selectedRegion, setSelectedRegion] = useState(null)
  const filteredRows = selectedRegion ? TSA_ACTIVE_QUEUES.filter(q => q.region === selectedRegion) : TSA_ACTIVE_QUEUES
  return (
    <>
      <QueuesByRegionChart rows={TSA_ACTIVE_QUEUES} selectedRegion={selectedRegion}
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
  asu:         'Active Service Units — Trend',
  sr:          'Service Requests — DB vs OSP',
  cpasu:       'CPASU Trend',
  ucr:         'Current UCR vs Target',
}

// Opening/closing a card's popup only touches this component's own `active`
// state — the `filters` prop keeps flowing from TsaForecastingPage unchanged,
// so closing the modal always returns to the dashboard exactly as filtered.
function DrillDownModal({ type, filters, granularity, onClose }) {
  return (
    <Modal title={MODAL_TITLES[type]} onClose={onClose}>
      {type === 'totalQueues' && <TotalQueuesSection />}
      {type === 'asu' && <AsuTrendChart filters={filters} granularity={granularity} />}
      {type === 'sr' && <SrDbOspChart filters={filters} granularity={granularity} />}
      {type === 'cpasu' && <CpasuChart filters={filters} granularity={granularity} />}
      {type === 'ucr' && <CurrentUcrChart filters={filters} granularity={granularity} />}
    </Modal>
  )
}

// Builds the "YTD <period>: <value> · ▲/▼ X% vs <prevPeriod>" sub-message shared
// by the ASU/SR/CPASU cards, replacing the old static "Plan ..." line. `lowerIsBetter`
// flips which direction counts as "good" (green) — CPASU is better when it falls.
function ytdSub(metric, formattedValue, { lowerIsBetter = false } = {}) {
  if (metric.yoyPct === null || metric.yoyPct === undefined) {
    return { text: `YTD ${metric.period}: ${formattedValue} · no prior year in scope`, trend: undefined }
  }
  const up = metric.yoyPct >= 0
  const good = lowerIsBetter ? !up : up
  return { text: `YTD ${metric.period}: ${formattedValue} · ${up ? '▲' : '▼'} ${Math.abs(metric.yoyPct)}% vs ${metric.prevPeriod}`, trend: good }
}

// Same "YTD <period>: ..." shape as ytdSub, but bifurcated into DB/OSP's OWN
// period-over-period % change (2026-07-30) instead of one combined SR %, per direct
// request — the single "▲ 18.6%" line didn't say whether DB or OSP was driving it.
function srChannelYtdSub(metric) {
  if (metric.yoyPct === null || metric.yoyPct === undefined) {
    return { text: `YTD ${metric.period}: no prior year in scope`, trend: undefined }
  }
  const dbUp = metric.db.yoyPct >= 0
  const ospUp = metric.osp.yoyPct >= 0
  const dbText = metric.db.yoyPct == null ? 'n/a' : `${dbUp ? '▲' : '▼'} ${Math.abs(metric.db.yoyPct)}%`
  const ospText = metric.osp.yoyPct == null ? 'n/a' : `${ospUp ? '▲' : '▼'} ${Math.abs(metric.osp.yoyPct)}%`
  return { text: `YTD ${metric.period}: DB ${dbText} · OSP ${ospText}`, trend: metric.yoyPct >= 0 }
}

export default function TsaMetricCards({ filters, granularity }) {
  const [active, setActive] = useState(null)
  const d = useMemo(() => tsaCardData(filters, granularity), [filters, granularity])
  const toggle = key => setActive(prev => prev === key ? null : key)

  const asuYtd = ytdSub(d.asuActuals, fmt(d.asuActuals.value))
  const srYtd = srChannelYtdSub(d.srActuals)
  const cpasuYtd = ytdSub(d.cpasu, d.cpasu.value.toFixed(2), { lowerIsBetter: true })

  return (
    <div style={{ padding: '0 16px 12px' }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <Card icon="⬡" label="Total Queues" sublabel="Active"
          value={`${d.totalQueues.active}`}
          sub="Active HES queues"
          onClick={() => toggle('totalQueues')} active={active === 'totalQueues'}
          info="Count of active HES queues by region." />
        <Card icon="📶" label="Active Service Units" sublabel="Trend over time"
          value={fmt(d.asuActuals.value)}
          sub={asuYtd.text} trend={asuYtd.trend}
          onClick={() => toggle('asu')} active={active === 'asu'}
          info="Active Service Units (ASU) actuals to date, with year-over-year change." />
        <Card icon="🎫" label="Service Requests" sublabel="DB / OSP handled"
          value={fmt(d.srActuals.value)}
          sub={srYtd.text} trend={srYtd.trend}
          onClick={() => toggle('sr')} active={active === 'sr'}
          info="Service Requests handled across DB and OSP channels, with year-over-year change." />
        <Card icon="➗" label="CPASU" sublabel="SR ÷ ASU"
          value={d.cpasu.value.toFixed(2)}
          sub={cpasuYtd.text} trend={cpasuYtd.trend}
          onClick={() => toggle('cpasu')} active={active === 'cpasu'}
          info="Cases Per Active Service Unit — Service Requests divided by ASU, with year-over-year change." />
        <Card icon="🎯" label="Current UCR" sublabel="vs Target"
          value={`${d.currentUcr.value}%`}
          sub={`Target ${d.currentUcr.target}% · ${d.currentUcr.adherence}% adherence`}
          trend={d.currentUcr.adherence >= 95}
          onClick={() => toggle('ucr')} active={active === 'ucr'}
          info="Current UCR rate against its target, with overall adherence percentage." />
      </div>

      {active && <DrillDownModal type={active} filters={filters} granularity={granularity} onClose={() => setActive(null)} />}
    </div>
  )
}
