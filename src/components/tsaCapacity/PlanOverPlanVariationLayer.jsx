import React, { useMemo, useState } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell, LabelList,
} from 'recharts'
import {
  tsaPlanOverPlanByDimension, tsaPlanOverPlanTrendByDimension, planOverPlanLobVariance,
} from '../../data/tsaCapacityData'
import { CAPACITY_PLAN_NAMES } from '../../data/mockData'
import { contributingFactors, FACTOR_TABLE_COLUMNS, varianceTier, varianceReason, VARIANCE_TABLE_COLUMNS } from '../../data/insightFactors'
import { C, Visual, Tip, PlanDropdowns, BinaryToggle, PillButton, CategoryTick, planVsPlanSeriesColor } from '../ChartKit'

// Local override of the shared VARIANCE_TABLE_COLUMNS' 'Queue' header — this page's
// ranked-variance chart ranks LOBs, not queues (TSA has no per-queue dimension), so
// the popup table should say what it actually contains rather than reuse the label
// the shared column spec happens to default to.
const LOB_VARIANCE_COLUMNS = VARIANCE_TABLE_COLUMNS.map(c => (c.key === 'name' ? { ...c, label: 'LOB' } : c))

// Plan A/B pickers exclude 'Actual' the same way Forecasting's plan dropdowns already
// do (see mockData.js's CAPACITY_PLAN_NAMES comment) — both charts below plot two
// named plan vintages against each other, not a plan against Actual.
const PLANS = CAPACITY_PLAN_NAMES.filter(p => p !== 'Actual')

// Placeholder passed for whichever of planA/planB isn't being extracted (2026-07-31)
// — tsaPlanOverPlanByDimension/tsaPlanOverPlanTrendByDimension only apply named-plan
// scaling when BOTH planA and planB are non-null (`usingNamedPlans = planA != null &&
// planB != null`), unlike tsaData.js's independent-per-side helpers. Passing this
// constant for the untouched slot keeps that gate satisfied so the real slot's value
// is still genuinely plan-reactive, while the untouched slot's own output is simply
// discarded by the caller.
const PLAN_PLACEHOLDER = PLANS[0]

// TSA-specific counterpart to msgCapacity/PlanOverPlanVariationLayer.jsx — same
// Region/Sub-region click-to-drill + ranked-variance-list structure, but ranking
// LOBs instead of queues (this page has no per-queue dimension), per direct request.
// Built as its own component rather than the shared capacity/PlanOverPlanLayer.jsx
// for the same reason MSG's version was: neither page's new capabilities apply to
// the other.
// `plansA`/`plansB` (2026-07-31, was a single planA/planB string pair) — same
// multi-select treatment as the Forecasting pages' Plan vs Plan charts. Each
// selector call uses PLAN_PLACEHOLDER for whichever slot isn't being extracted (see
// its comment above), so one extra bar renders per selected plan on either side.
// Variance % line only when exactly one plan is selected on each side.
function MainChart({ filters, granularity, plansA, plansB }) {
  const [dimension, setDimension] = useState('Region')
  const [selectedKey, setSelectedKey] = useState(null)
  const dimLabel = dimension === 'SubRegion' ? 'Sub-region' : 'Region'
  const aPlans = plansA.length ? plansA : [undefined]
  const bPlans = plansB.length ? plansB : [undefined]

  const dimDataA = useMemo(() => aPlans.map(p => tsaPlanOverPlanByDimension(filters, dimension, p, PLAN_PLACEHOLDER)), [filters, dimension, aPlans])
  const dimDataB = useMemo(() => bPlans.map(p => tsaPlanOverPlanByDimension(filters, dimension, PLAN_PLACEHOLDER, p)), [filters, dimension, bPlans])
  const dimData = useMemo(() => {
    const base = dimDataA[0] || []
    return base.map(row => {
      const out = { key: row.key }
      aPlans.forEach((p, pi) => { out[`planA_${pi}`] = dimDataA[pi].find(d => d.key === row.key)?.plan1 ?? 0 })
      bPlans.forEach((p, pi) => { out[`planB_${pi}`] = dimDataB[pi].find(d => d.key === row.key)?.plan2 ?? 0 })
      if (aPlans.length === 1 && bPlans.length === 1) {
        out.variance = out.planA_0 ? +((out.planB_0 - out.planA_0) / out.planA_0 * 100).toFixed(1) : 0
      }
      return out
    })
  }, [dimDataA, dimDataB, aPlans, bPlans])

  const trendDataA = useMemo(
    () => (selectedKey ? aPlans.map(p => tsaPlanOverPlanTrendByDimension(filters, selectedKey, dimension, granularity, p, PLAN_PLACEHOLDER)) : []),
    [filters, selectedKey, dimension, granularity, aPlans]
  )
  const trendDataB = useMemo(
    () => (selectedKey ? bPlans.map(p => tsaPlanOverPlanTrendByDimension(filters, selectedKey, dimension, granularity, PLAN_PLACEHOLDER, p)) : []),
    [filters, selectedKey, dimension, granularity, bPlans]
  )
  const trendData = useMemo(() => {
    if (!selectedKey) return []
    return trendDataA[0].map((row, i) => {
      const out = { period: row.period }
      aPlans.forEach((p, pi) => { out[`planA_${pi}`] = trendDataA[pi][i].plan1 })
      bPlans.forEach((p, pi) => { out[`planB_${pi}`] = trendDataB[pi][i].plan2 })
      if (aPlans.length === 1 && bPlans.length === 1) {
        out.variance = out.planA_0 ? +((out.planB_0 - out.planA_0) / out.planA_0 * 100).toFixed(1) : 0
      }
      return out
    })
  }, [trendDataA, trendDataB, selectedKey, aPlans, bPlans])

  const handleDimensionChange = val => {
    setDimension(val === 'Sub-region' ? 'SubRegion' : 'Region')
    setSelectedKey(null)
  }

  const data = selectedKey ? trendData : dimData
  const xKey = selectedKey ? 'period' : 'key'
  const handleBarClick = selectedKey ? undefined : (d => setSelectedKey(d.key))

  // Always built off the region/sub-region breakdown (not the drilled-into trend) —
  // a real region name is only passed in Region view since sub-region labels don't
  // map onto the Holiday Calendar's 3-region taxonomy (see insightFactors.js).
  const table = useMemo(() => ({
    title: `What contributed, by ${dimLabel.toLowerCase()}`,
    columns: FACTOR_TABLE_COLUMNS,
    rows: dimData.flatMap(d => contributingFactors(d.key, dimension === 'Region' ? d.key : null, 1).map(f => ({ ...f, factor: `${d.key} — ${f.factor}` }))),
  }), [dimData, dimension, dimLabel])

  return (
    <Visual title="Plan over Plan Variation"
      subtitle={selectedKey ? `${selectedKey} — headcount trend` : `Click a ${dimLabel.toLowerCase()} to see its trend`}
      cornerControls={<BinaryToggle leftLabel="Region" rightLabel="Sub-region" value={dimLabel} onChange={handleDimensionChange} />}
      controls={selectedKey && <PillButton onClick={() => setSelectedKey(null)}>← All {dimLabel}s</PillButton>}
      info="Headcount plan for the selected Plan A/Plan B plans, by region or sub-region, with percent variance shown when exactly one plan is selected on each side."
      rca="Headcount plan variance is widest for LOBs with the newest onboarding."
      clca="Re-baseline those LOBs' plans using actual ramp data before the next lock."
      table={table}>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} />
          <XAxis dataKey={xKey} tick={{ fill: C.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="l" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="r" orientation="right" tick={{ fill: C.trend, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <ReferenceLine yAxisId="r" y={0} stroke="rgba(255,255,255,0.1)" />
          {aPlans.map((p, pi) => {
            const { color, opacity } = planVsPlanSeriesColor(pi)
            return <Bar key={`a${pi}`} yAxisId="l" dataKey={`planA_${pi}`} name={p ? `Plan A (${p})` : 'Plan A'} fill={color} opacity={opacity} radius={[3,3,0,0]} maxBarSize={50}
              onClick={handleBarClick} style={{ cursor: selectedKey ? 'default' : 'pointer' }} />
          })}
          {bPlans.map((p, pi) => {
            const { color, opacity } = planVsPlanSeriesColor(aPlans.length + pi)
            return <Bar key={`b${pi}`} yAxisId="l" dataKey={`planB_${pi}`} name={p ? `Plan B (${p})` : 'Plan B'} fill={color} opacity={opacity} radius={[3,3,0,0]} maxBarSize={50}
              onClick={handleBarClick} style={{ cursor: selectedKey ? 'default' : 'pointer' }} />
          })}
          {aPlans.length === 1 && bPlans.length === 1 && (
            <Line yAxisId="r" type="monotone" dataKey="variance" name="Variance %" stroke={C.trend}
              strokeWidth={2} dot={{ r: 3, fill: C.trend, strokeWidth: 0 }} activeDot={{ r: 5 }} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </Visual>
  )
}

// Diverging bar per LOB, value-labeled — same polished convention as Forecasting's
// "Top Queues by Variance" charts and MSG Capacity's "Queues with Highest Variation".
// First-selected-plan-only (2026-07-31) — a ranked diverging bar chart has no single
// unambiguous rendering for N plans per side, same policy as every other
// ranked/impact chart in this rollout. The widget itself is still genuinely
// multi-select; only the calculation simplifies to the first pick on each side.
function LobVarianceChart({ filters, plansA, plansB }) {
  const planA = plansA[0]
  const planB = plansB[0]
  const data = useMemo(() => planOverPlanLobVariance(filters, 8, planA, planB), [filters, planA, planB])
  const niceMax = useMemo(() => Math.max(10, Math.ceil(Math.max(1, ...data.map(d => Math.abs(d.variance))) / 5) * 5), [data])
  const domainMax = niceMax * 1.3
  const ticks = [-niceMax, -niceMax / 2, 0, niceMax / 2, niceMax]

  // Full in-scope LOB roster (not just the chart's own top-N) bucketed into
  // High/Moderate/Low variance tiers with an illustrative likely-reason per LOB,
  // worst first — same treatment as Layer1PlanOverPlan.jsx's "Top Queues by Variance"
  // reference, adapted to this page's LOB-shaped data.
  const table = useMemo(() => {
    const all = planOverPlanLobVariance(filters, 999, planA, planB)
    return {
      title: 'Every LOB in scope, by variance tier',
      columns: LOB_VARIANCE_COLUMNS,
      rows: all
        .map(l => ({ name: l.name, tier: varianceTier(Math.abs(l.variance)).label, variance: `${l.variance > 0 ? '+' : ''}${l.variance}%`, reason: varianceReason(l.name), _abs: Math.abs(l.variance) }))
        .sort((a, b) => b._abs - a._abs),
    }
  }, [filters, planA, planB])

  const LobTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const row = payload[0]?.payload
    return (
      <div className="chart-tooltip">
        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', marginBottom: 5 }}>{label}</p>
        <p style={{ fontSize: 11, color: C.metric1 }}>Plan A: <span style={{ fontWeight: 600 }}>{row.plan1}</span></p>
        <p style={{ fontSize: 11, color: C.metric2 }}>Plan B: <span style={{ fontWeight: 600 }}>{row.plan2}</span></p>
      </div>
    )
  }

  return (
    <Visual title="LOBs with Highest Variation" subtitle="Plan A vs Plan B, worst variance first"
      info="Ranks LOBs by how far the selected Plan A and Plan B headcount diverge."
      rca="A small number of LOBs account for most of the plan-to-plan swing."
      clca="Review these LOBs' plans first — they carry the most headcount risk."
      table={table}>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} layout="vertical" margin={{ top: 4, right: 34, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} horizontal={false} />
          <XAxis type="number" domain={[-domainMax, domainMax]} ticks={ticks} tick={{ fill: C.tick, fontSize: 9 }} axisLine={false} tickLine={false}
            tickFormatter={v => `${v}%`} />
          <YAxis type="category" dataKey="name" tick={<CategoryTick />} width={150} axisLine={false} tickLine={false} />
          <Tooltip content={<LobTip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <ReferenceLine x={0} stroke="rgba(255,255,255,0.15)" />
          <Bar dataKey="variance" name="Variance %" radius={[3,3,3,3]} maxBarSize={18}>
            {data.map((d, i) => <Cell key={i} fill={d.variance >= 0 ? C.ahead : C.behind} opacity={0.9} />)}
            <LabelList dataKey={d => d.variance >= 0 ? d.variance : undefined} position="right"
              formatter={v => `+${v}%`} style={{ fontSize: 10.5, fontWeight: 700, fill: C.ahead }} />
            <LabelList dataKey={d => d.variance < 0 ? d.variance : undefined} position="left"
              formatter={v => `${v}%`} style={{ fontSize: 10.5, fontWeight: 700, fill: C.behind }} />
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </Visual>
  )
}

export default function PlanOverPlanVariationLayer({ filters, granularity }) {
  const [open, setOpen] = useState(true)
  // Shared Plan A/Plan B selection (2026-07-23) — one PlanDropdowns instance in the
  // layer's own body (not duplicated per chart) drives both MainChart and
  // LobVarianceChart below, so switching either plan updates both charts together.
  // Plan A/Plan B (2026-07-31, was a single pre-picked string each) — empty arrays
  // show the original static baseline (both selectors' usingNamedPlans gate stays
  // false), matching the empty-selection convention used everywhere else.
  const [plansA, setPlansA] = useState([])
  const [plansB, setPlansB] = useState([])
  const handlePlanChange = (key, val) => (key === 'planA' ? setPlansA(val) : setPlansB(val))

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
      <div className="layer-header" onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#070f1a', background: '#34d399', borderRadius: 4, padding: '2px 7px', letterSpacing: '0.04em' }}>02</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Plan over Plan Variation</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>— headcount plan variance by region &amp; LOB</span>
        </div>
        <span style={{ fontSize: 11, color: '#34d399', transform: open ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▲</span>
      </div>
      {open && (
        <>
          <div style={{ padding: '10px 12px 0', display: 'flex', justifyContent: 'flex-end' }}>
            <PlanDropdowns planA={plansA} planB={plansB} onChange={handlePlanChange} options={PLANS} />
          </div>
          <div style={{ padding: 12, display: 'flex', gap: 10 }}>
            <MainChart filters={filters} granularity={granularity} plansA={plansA} plansB={plansB} />
            <LobVarianceChart filters={filters} plansA={plansA} plansB={plansB} />
          </div>
        </>
      )}
    </div>
  )
}
