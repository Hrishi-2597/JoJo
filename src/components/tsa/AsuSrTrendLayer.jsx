import React, { useMemo, useState } from 'react'
import {
  ComposedChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { PLAN_NAMES } from '../../data/mockData'
import {
  cpasuByRegion, regionTrendGranularity, cpasuTrendByRegion, srBotsByFY,
  ucrByFY, topNonAdherentLobsByYear,
} from '../../data/tsaData'
import { contributingFactors, FACTOR_TABLE_COLUMNS, varianceTier, varianceReason } from '../../data/insightFactors'
import { C, Visual, Tip, PlanSelect, Modal, PillButton } from './TsaChartKit'

const PLANS = PLAN_NAMES.filter(p => p !== 'Actual')

// CPASU Trend's regions (AMER/APJ/EMEA/Global, see tsaData's IMPACT_REGIONS) are this
// page's own 4-region taxonomy, distinct from the 5-region NAMER/LATAM/APJ/EMEA/Global
// set the Holiday Calendar (and insightFactors' real-holiday lookup) uses — AMER maps
// onto NAMER for that lookup, APJ/EMEA match directly, Global has no clean match.
const HOLIDAY_REGION_MAP = { AMER: 'NAMER', APJ: 'APJ', EMEA: 'EMEA', Global: null }

// "UCR Runrate with Target" ranks LOBs, not queues, so its variance-tier table gets
// its own column labels (copy of insightFactors' VARIANCE_TABLE_COLUMNS shape with
// 'Queue' swapped for 'LOB') rather than reusing that export's literal 'Queue' label.
const LOB_VARIANCE_TABLE_COLUMNS = [
  { key: 'name', label: 'LOB', wrap: true },
  { key: 'tier', label: 'Tier' },
  { key: 'variance', label: 'Gap vs Target', align: 'right' },
  { key: 'reason', label: 'Likely reason', wrap: true },
]

// Regions render by default (one bar-pair per region); clicking a region drills
// into that region's own trend at whatever granularity the page-wide View By
// toggle is set to.
function Visual1({ filters, granularity: pageGranularity }) {
  const [selectedRegion, setSelectedRegion] = useState(null)
  const regionData = useMemo(() => cpasuByRegion(filters), [filters])
  const { granularity } = useMemo(() => regionTrendGranularity(filters, pageGranularity), [filters, pageGranularity])
  const trendData = useMemo(
    () => (selectedRegion ? cpasuTrendByRegion(filters, selectedRegion, pageGranularity) : []),
    [filters, selectedRegion, pageGranularity]
  )

  const data = selectedRegion ? trendData : regionData
  const xKey = selectedRegion ? 'period' : 'region'
  const handleBarClick = selectedRegion ? undefined : (d => setSelectedRegion(d.region))

  // Table follows whichever view is currently on screen — region-level factors by
  // default, or per-period factors for the drilled-into region's own trend (seeded
  // by region+period so each period still gets a distinct, stable factor while the
  // holiday cross-reference stays fixed to the selected region).
  const table = useMemo(() => {
    if (selectedRegion) {
      const holidayRegion = HOLIDAY_REGION_MAP[selectedRegion] ?? null
      return {
        title: `What contributed, by period — ${selectedRegion}`,
        columns: FACTOR_TABLE_COLUMNS,
        rows: trendData.flatMap(d => contributingFactors(`${selectedRegion}-${d.period}`, holidayRegion, 1)
          .map(f => ({ ...f, factor: `${d.period} — ${f.factor}` }))),
      }
    }
    return {
      title: 'What contributed, by region',
      columns: FACTOR_TABLE_COLUMNS,
      rows: regionData.flatMap(d => contributingFactors(d.region, HOLIDAY_REGION_MAP[d.region] ?? null, 1)
        .map(f => ({ ...f, factor: `${d.region} — ${f.factor}` }))),
    }
  }, [selectedRegion, regionData, trendData])

  return (
    <Visual title="CPASU Trend"
      subtitle={selectedRegion ? `${selectedRegion} — ${granularity} view` : 'Click a region to see its trend'}
      controls={selectedRegion && <PillButton onClick={() => setSelectedRegion(null)}>← All Regions</PillButton>}
      info="ASU, SR, and CPASU by region; click a region to drill into its trend over time."
      rca="CPASU is rising fastest in regions with the lowest bot deflection."
      clca="Expand bot-deflection coverage in the regions driving the CPASU increase."
      table={table}>
      <ResponsiveContainer width="100%" height={222}>
        <ComposedChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} />
          <XAxis dataKey={xKey} tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="l" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
          <YAxis yAxisId="r" orientation="right" tick={{ fill: C.trend, fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Bar yAxisId="l" dataKey="asu" name="ASU" fill={C.metric1} opacity={0.8} radius={[3,3,0,0]} maxBarSize={40}
            onClick={handleBarClick} style={{ cursor: selectedRegion ? 'default' : 'pointer' }} />
          <Bar yAxisId="l" dataKey="sr" name="SR" fill={C.metric2} opacity={0.8} radius={[3,3,0,0]} maxBarSize={40}
            onClick={handleBarClick} style={{ cursor: selectedRegion ? 'default' : 'pointer' }} />
          <Line yAxisId="r" type="monotone" dataKey="cpasu" name="CPASU" stroke={C.trend}
            strokeWidth={2} dot={{ r: 3, fill: C.trend, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </Visual>
  )
}

function Visual2({ filters, granularity }) {
  const [plan, setPlan] = useState('FY27 Q1 APR Plan')
  const data = useMemo(() => srBotsByFY(filters, granularity), [filters, granularity])
  const table = useMemo(() => ({
    title: 'What contributed, by period',
    columns: FACTOR_TABLE_COLUMNS,
    rows: data.flatMap(d => contributingFactors(d.period, null, 1).map(f => ({ ...f, factor: `${d.period} — ${f.factor}` }))),
  }), [data])
  return (
    <Visual title="UCR Impact on SR" cornerControls={<PlanSelect value={plan} onChange={setPlan} options={PLANS} />}
      info="Human-handled vs bot (UCR) handled SR volume against the SR plan, by period."
      rca="Bot-handled SR's are growing faster than the plan assumed."
      clca="Fold observed bot deflection into next quarter's SR plan."
      table={table}>
      <ResponsiveContainer width="100%" height={222}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Bar dataKey="humanSR" name="SR's" stackId="sr" fill={C.metric1} opacity={0.85} maxBarSize={44} />
          <Bar dataKey="botsSR"  name="UCR Handled SR's" stackId="sr" fill={C.trend} opacity={0.85} radius={[3,3,0,0]} maxBarSize={44} />
          <Bar dataKey="plan"    name="SR Plan"    fill={C.metric2} opacity={0.7} radius={[3,3,0,0]} maxBarSize={44} />
        </BarChart>
      </ResponsiveContainer>
    </Visual>
  )
}

// Now responds to the page-wide View By granularity toggle like every other chart
// on this page (superseding the earlier "always Fiscal Year" decision — see
// design_choice.md) — clicking a bar opens a modal with that period's top 5 LOBs
// furthest from the UCR target, replacing the old always-visible queue list.
function Visual3({ filters, granularity }) {
  const [modalPeriod, setModalPeriod] = useState(null)
  const data = useMemo(() => ucrByFY(filters, granularity), [filters, granularity])
  const topLobs = useMemo(
    () => (modalPeriod ? topNonAdherentLobsByYear(filters, modalPeriod) : []),
    [filters, modalPeriod]
  )
  // The chart itself is a period trend, but the real diagnostic depth here is per-LOB
  // (topNonAdherentLobsByYear already ranks LOBs by how far they sit from the UCR
  // target) — so the "i" popup uses the same variance-tier + reason treatment as the
  // ranked-queue charts elsewhere, scoped to the latest in-view period's full LOB
  // roster (not just its top 5), rather than a period-based contributing-factors table.
  const latestPeriod = data[data.length - 1]?.period
  const table = useMemo(() => {
    if (!latestPeriod) return { title: 'Every LOB in scope, by adherence gap', columns: LOB_VARIANCE_TABLE_COLUMNS, rows: [] }
    const all = topNonAdherentLobsByYear(filters, latestPeriod, 999)
    return {
      title: `Every LOB in scope, by adherence gap — ${latestPeriod}`,
      columns: LOB_VARIANCE_TABLE_COLUMNS,
      rows: all
        .map(l => {
          const gap = +(l.target - l.runrate).toFixed(1)
          return {
            name: l.lob,
            tier: varianceTier(Math.abs(gap)).label,
            variance: `${gap > 0 ? '-' : gap < 0 ? '+' : ''}${Math.abs(gap)}%`,
            reason: varianceReason(l.lob),
            _abs: Math.abs(gap),
          }
        })
        .sort((a, b) => b._abs - a._abs),
    }
  }, [filters, latestPeriod])

  return (
    <Visual title="UCR Runrate with Target" subtitle="Click a bar to see that period's top 5 non-adherent LOBs"
      info="UCR runrate against target by period; click a bar to see that period's top non-adherent LOBs."
      rca="Non-adherent LOBs share a common low bot-deflection profile."
      clca="Prioritize automation coverage for the LOBs on the non-adherent list."
      table={table}>
      <ResponsiveContainer width="100%" height={210}>
        <ComposedChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Bar dataKey="current" name="Runrate" fill={C.metric1} opacity={0.85} radius={[3,3,0,0]} maxBarSize={40}
            onClick={d => setModalPeriod(d.period)} style={{ cursor: 'pointer' }} />
          <Line type="monotone" dataKey="target" name="Target" stroke={C.behind} strokeWidth={2} strokeDasharray="4 3"
            dot={{ r: 3, fill: C.behind, strokeWidth: 0 }} />
        </ComposedChart>
      </ResponsiveContainer>

      {modalPeriod && (
        <Modal title={`${modalPeriod} — Top 5 Non-Adherent LOBs`} onClose={() => setModalPeriod(null)} width={420}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {topLobs.map((l, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', fontSize: 11.5, padding: '5px 8px',
                background: i % 2 ? 'transparent' : 'rgba(255,255,255,0.03)', borderRadius: 5,
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>{l.lob}</span>
                <span style={{ fontWeight: 600, color: C.behind }}>
                  {l.runrate}% <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>vs {l.target}%</span>
                </span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </Visual>
  )
}

export default function AsuSrTrendLayer({ filters, granularity }) {
  const [open, setOpen] = useState(true)

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
      <div className="layer-header" onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#070f1a', background: '#fb923c', borderRadius: 4, padding: '2px 7px', letterSpacing: '0.04em' }}>03</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ASU/UCR Impact on SR Analysis</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>— CPASU &amp; UCR runrate</span>
        </div>
        <span style={{ fontSize: 11, color: '#fb923c', transform: open ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▲</span>
      </div>
      {open && (
        <div style={{ padding: 12, display: 'flex', gap: 10 }}>
          <Visual1 filters={filters} granularity={granularity} />
          <Visual2 filters={filters} granularity={granularity} />
          <Visual3 filters={filters} granularity={granularity} />
        </div>
      )}
    </div>
  )
}
