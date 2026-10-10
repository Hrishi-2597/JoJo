import React, { useMemo, useState } from 'react'
import MetricIcon from '../MetricIcon'
import {
  ComposedChart, BarChart, LineChart, PieChart, Pie, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'
import {
  tsaCardData, asuByFY, srDbOspByFY, cpasuByFY, ucrByFY, filterLobs,
} from '../../data/tsaData'
import { C, Tip, Modal, InfoButton, TSA_TREND_COLORS, TSA_METRIC_COLORS } from './TsaChartKit'

const CHART_BOX = { maxWidth: 620, margin: '0 auto' }
// Palette for the Total LOB card's Global Grouping donut (2026-10-07, replaces the
// old Total Queues card's region palette — that card, and its region colors, moved
// to HES Capacity Planning's own TsaCapacityMetricCards.jsx unchanged).
const GLOBAL_GROUPING_COLORS = {
  'COMPUTE/NETWORKING': 'var(--accent)', 'DPU/UDX': '#fb923c', HCX: '#a78bfa',
  OTHER: '#22d3ee', 'PRIMARY/MIDRANGE': '#fbbf24',
}

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
          <CartesianGrid vertical={false} stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: C.tick, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Line type="monotone" dataKey="actual" name="ASU Actuals" stroke={TSA_METRIC_COLORS.asu.base} strokeWidth={2.5} dot={{ r: 3, fill: TSA_METRIC_COLORS.asu.base, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Grouped columns, not stacked — DB and OSP render as two side-by-side bars per
// fiscal year instead of one stacked bar, per the requested chart-type change.
// Colors (2026-10-11): not an Actuals-vs-Plan chart, so it uses the warm CPASU/UCR
// Trend family (TSA_TREND_COLORS) rather than the blue/teal Plan palette, same as
// AsuSrTrendLayer.jsx and CurrentUcrChart below.
function SrDbOspChart({ filters, granularity }) {
  const data = useMemo(() => srDbOspByFY(filters, granularity), [filters, granularity])
  return (
    <div style={CHART_BOX}>
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: C.tick, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Bar dataKey="db" name="DB" fill={TSA_TREND_COLORS.gold} radius={[2,2,0,0]} maxBarSize={44} />
          <Bar dataKey="osp" name="OSP" fill={TSA_TREND_COLORS.orange} radius={[2,2,0,0]} maxBarSize={44} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Line-only, CPASU alone — the bars (SR/ASU) that used to share this chart were
// dropped per the requested "just CPASU over years" redesign. Colors (2026-10-11):
// part of the CPASU/UCR Trend family — same Magenta as AsuSrTrendLayer.jsx's own
// CPASU line, per direct request that "ALL charts" in this family get the warm
// CPASU/UCR Trend palette rather than the shared trend-violet.
function CpasuChart({ filters, granularity }) {
  const data = useMemo(() => cpasuByFY(filters, granularity), [filters, granularity])
  return (
    <div style={CHART_BOX}>
      <ResponsiveContainer width="100%" height={210}>
        <LineChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: TSA_TREND_COLORS.magenta, fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Line type="monotone" dataKey="cpasu" name="CPASU" stroke={TSA_TREND_COLORS.magenta} strokeWidth={2.5} dot={{ r: 3, fill: TSA_TREND_COLORS.magenta, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Colors (2026-10-11): part of the CPASU/UCR Trend family — same Gold/Orange/Magenta
// as AsuSrTrendLayer.jsx's own UCR-related visuals, per direct request.
function CurrentUcrChart({ filters, granularity }) {
  const data = useMemo(() => ucrByFY(filters, granularity), [filters, granularity])
  return (
    <div style={CHART_BOX}>
      <ResponsiveContainer width="100%" height={210}>
        <ComposedChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="l" tick={{ fill: C.tick, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0,100]} tickFormatter={v => `${v}%`} />
          <YAxis yAxisId="r" orientation="right" tick={{ fill: TSA_TREND_COLORS.magenta, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Bar yAxisId="l" dataKey="current" name="Current" fill={TSA_TREND_COLORS.gold} radius={[2,2,0,0]} maxBarSize={54} />
          <Bar yAxisId="l" dataKey="target" name="Target" fill={TSA_TREND_COLORS.orange} radius={[2,2,0,0]} maxBarSize={54} />
          <Line yAxisId="r" type="monotone" dataKey="adherence" name="Adherence %" stroke={TSA_TREND_COLORS.magenta} strokeWidth={2} dot={{ r: 3, fill: TSA_TREND_COLORS.magenta, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// Global Grouping-breakdown donut for the Total LOB card (2026-10-07, replaces the
// old Total Queues card's region donut here) — same click-a-slice-to-drill mechanic:
// click a slice (or its legend entry) to narrow the table below to that Global
// Grouping; click again to clear.
function LobsByGlobalGroupingChart({ rows, selectedGroup, onSelectGroup }) {
  const data = useMemo(() => {
    const counts = {}
    rows.forEach(l => { counts[l.globalGrouping] = (counts[l.globalGrouping] || 0) + 1 })
    return Object.entries(counts)
      .map(([globalGrouping, count]) => ({ globalGrouping, count }))
      .sort((a, b) => b.count - a.count)
  }, [rows])
  const total = rows.length
  const centerCount = selectedGroup ? (data.find(d => d.globalGrouping === selectedGroup)?.count ?? 0) : total

  return (
    <div style={{ ...CHART_BOX, position: 'relative' }}>
      <p style={{ fontSize: 9.5, color: 'var(--text-faint)', marginBottom: 6, textAlign: 'center' }}>Click a slice to see that grouping's LOBs</p>
      <ResponsiveContainer width="100%" height={230}>
        <PieChart>
          <Tooltip content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const { globalGrouping, count } = payload[0].payload
            return (
              <div className="chart-tooltip">
                <p style={{ fontSize: 10, fontWeight: 700, color: GLOBAL_GROUPING_COLORS[globalGrouping] || 'var(--accent)', marginBottom: 3 }}>{globalGrouping}</p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{count} LOBs <span style={{ color: 'var(--text-faint)' }}>({total ? Math.round(count / total * 100) : 0}%)</span></p>
              </div>
            )
          }} />
          <Legend verticalAlign="bottom" height={30}
            onClick={e => onSelectGroup(e.value)}
            wrapperStyle={{ fontSize: 10, color: C.tick, cursor: 'pointer' }} />
          <Pie data={data} dataKey="count" nameKey="globalGrouping" cx="50%" cy="46%"
            innerRadius={54} outerRadius={82} paddingAngle={2}
            onClick={d => onSelectGroup(d.globalGrouping)} style={{ cursor: 'pointer' }}>
            {data.map((d, i) => (
              <Cell key={i} fill={GLOBAL_GROUPING_COLORS[d.globalGrouping] || C.tick}
                stroke="var(--bg-panel)" strokeWidth={2}
                opacity={selectedGroup == null || selectedGroup === d.globalGrouping ? 0.92 : 0.25} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{
        position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%, -50%)',
        textAlign: 'center', pointerEvents: 'none',
      }}>
        <p className="num" style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{centerCount}</p>
        <p style={{ fontSize: 9, color: 'var(--text-faint)', marginTop: 2 }}>{selectedGroup || 'LOBs'}</p>
      </div>
    </div>
  )
}

function LobTable({ rows }) {
  return (
    <div style={{ overflowX: 'auto', maxHeight: 220, overflowY: 'auto' }}>
      <table className="w-full" style={{ fontSize: 11, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
            <th style={{ textAlign: 'left', padding: '4px 12px 4px 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>LOB</th>
            <th style={{ textAlign: 'right', padding: '4px 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Global Grouping</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((l, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <td style={{ padding: '5px 12px 5px 0', fontFamily: 'monospace', fontSize: 10, color: 'var(--text-dim)' }}>{l.lob}</td>
              <td style={{ padding: '5px 0', textAlign: 'right', color: 'var(--text-muted)' }}>{l.globalGrouping}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// `filters` — narrows the drill-down list/donut by every LOB-scoping filter (lob/
// businessPartner/globalGrouping/queue, via filterLobs()), matching the card's own
// headline count (tsaCardData's totalLobs.active) so the two never disagree.
function TotalLobsSection({ filters }) {
  const [selectedGroup, setSelectedGroup] = useState(null)
  const scopedLobs = useMemo(() => filterLobs(filters), [filters])
  const filteredRows = selectedGroup ? scopedLobs.filter(l => l.globalGrouping === selectedGroup) : scopedLobs
  return (
    <>
      <LobsByGlobalGroupingChart rows={scopedLobs} selectedGroup={selectedGroup}
        onSelectGroup={g => setSelectedGroup(prev => prev === g ? null : g)} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0 6px' }}>
        <p style={{ fontSize: 10, color: 'var(--text-faint)' }}>
          {selectedGroup ? <><span style={{ color: 'var(--accent)', fontWeight: 600 }}>{selectedGroup}</span> — {filteredRows.length} LOBs</> : `All groupings — ${filteredRows.length} LOBs`}
        </p>
        {selectedGroup && (
          <button onClick={() => setSelectedGroup(null)} style={{
            fontSize: 10, color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer',
            textDecoration: 'underline', textDecorationColor: 'rgba(127,168,204,0.3)',
          }}>Clear</button>
        )}
      </div>
      <LobTable rows={filteredRows} />
    </>
  )
}

const MODAL_TITLES = {
  totalLobs: 'HES LOB Directory',
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
      {type === 'totalLobs' && <TotalLobsSection filters={filters} />}
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
        <Card icon={<MetricIcon name="lob" />} label="Total LOB" sublabel="Active"
          value={`${d.totalLobs.active}`}
          sub="Active HES LOBs"
          onClick={() => toggle('totalLobs')} active={active === 'totalLobs'}
          info="Count of in-scope HES LOBs by Global Grouping." />
        <Card icon={<MetricIcon name="asu" />} label="Active Service Units" sublabel="Trend over time"
          value={fmt(d.asuActuals.value)}
          sub={asuYtd.text} trend={asuYtd.trend}
          onClick={() => toggle('asu')} active={active === 'asu'}
          info="Active Service Units (ASU) actuals to date, with year-over-year change." />
        <Card icon={<MetricIcon name="sr" />} label="Service Requests" sublabel="DB / OSP handled"
          value={fmt(d.srActuals.value)}
          sub={srYtd.text} trend={srYtd.trend}
          onClick={() => toggle('sr')} active={active === 'sr'}
          info="Service Requests handled across DB and OSP channels, with year-over-year change." />
        <Card icon={<MetricIcon name="ratio" />} label="CPASU" sublabel="SR ÷ ASU"
          value={d.cpasu.value.toFixed(2)}
          sub={cpasuYtd.text} trend={cpasuYtd.trend}
          onClick={() => toggle('cpasu')} active={active === 'cpasu'}
          info="Cases Per Active Service Unit — Service Requests divided by ASU, with year-over-year change." />
        <Card icon={<MetricIcon name="target" />} label="Current UCR" sublabel="vs Target"
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
