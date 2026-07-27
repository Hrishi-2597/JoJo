import React, { useMemo, useState } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell, LabelList,
} from 'recharts'
import { PLAN_NAMES } from '../../data/mockData'
import {
  planOverPlanByDimension, planOverPlanTrendByDimension, planOverPlanQueueVariance,
} from '../../data/msgCapacityData'
import {
  contributingFactors, FACTOR_TABLE_COLUMNS, varianceTier, varianceReason, VARIANCE_TABLE_COLUMNS,
} from '../../data/insightFactors'
import { C, Visual, Tip, BinaryToggle, PillButton, CategoryTick, PlanDropdowns } from '../ChartKit'

// Real, user-selectable Plan A/Plan B (2026-07-23) — uses the same PLAN_NAMES list as
// Headcount and SL%'s "Actual vs Plan Variation" dropdown (2026-07-23 follow-up — was
// CAPACITY_PLAN_NAMES, switched so every recently-added Plan dropdown on this page
// draws from one consistent list).
const PLANS = PLAN_NAMES

// MSG-specific replacement for the shared capacity/PlanOverPlanLayer.jsx — this page's
// version got its own Region/Sub-region drill and a queue-variance ranking on top of
// the base chart, none of which apply to TSA Capacity's simpler plan-vs-plan layer,
// so it was built as its own component rather than growing the shared one with
// MSG-only branches (see design_choice.md).
function MainChart({ filters, granularity, planA, planB, onPlanChange }) {
  const [dimension, setDimension] = useState('Region')
  const [selectedKey, setSelectedKey] = useState(null)
  const dimLabel = dimension === 'SubRegion' ? 'Sub-region' : 'Region'
  const dimData = useMemo(() => planOverPlanByDimension(filters, dimension, planA, planB), [filters, dimension, planA, planB])
  const trendData = useMemo(
    () => (selectedKey ? planOverPlanTrendByDimension(filters, selectedKey, dimension, granularity, planA, planB) : []),
    [filters, selectedKey, dimension, granularity, planA, planB]
  )
  const handleDimensionChange = val => {
    setDimension(val === 'Sub-region' ? 'SubRegion' : 'Region')
    setSelectedKey(null)
  }

  const data = selectedKey ? trendData : dimData
  const xKey = selectedKey ? 'period' : 'key'
  const handleBarClick = selectedKey ? undefined : (d => setSelectedKey(d.key))

  // Default view: one row per region/sub-region key — real region name passed through
  // (in Region view only) for the holiday cross-reference. Drilled-in view: same idea
  // but per period within the selected key's own trend, since the chart itself has
  // switched to showing that — same drill-aware treatment as HeadcountLayer's Attrition.
  const table = useMemo(() => {
    if (selectedKey) {
      const regionArg = dimension === 'Region' ? selectedKey : null
      return {
        title: `What contributed, by period — ${selectedKey}`,
        columns: FACTOR_TABLE_COLUMNS,
        rows: trendData.flatMap(d => contributingFactors(`${selectedKey}-${d.period}`, regionArg, 1).map(f => ({ ...f, factor: `${d.period} — ${f.factor}` }))),
      }
    }
    return {
      title: `What contributed, by ${dimLabel.toLowerCase()}`,
      columns: FACTOR_TABLE_COLUMNS,
      rows: dimData.flatMap(d => contributingFactors(d.key, dimension === 'Region' ? d.key : null, 1).map(f => ({ ...f, factor: `${d.key} — ${f.factor}` }))),
    }
  }, [selectedKey, trendData, dimData, dimension, dimLabel])

  return (
    <Visual title="Plan over Plan Variation"
      subtitle={selectedKey ? `${selectedKey} — headcount trend` : `Click a ${dimLabel.toLowerCase()} to see its trend`}
      cornerControls={<BinaryToggle leftLabel="Region" rightLabel="Sub-region" value={dimLabel} onChange={handleDimensionChange} />}
      controls={
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', justifyContent: 'center' }}>
          <PlanDropdowns planA={planA} planB={planB} onChange={onPlanChange} options={PLANS} />
          {selectedKey && <PillButton onClick={() => setSelectedKey(null)}>← All {dimLabel}s</PillButton>}
        </div>
      }
      info="Plan A vs Plan B headcount by region or sub-region; click a bar to drill into that key's own trend."
      rca="Headcount plan variance is widest in the regions with the newest queues."
      clca="Re-baseline those regions' plans using actual ramp data before the next lock."
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
          <Bar yAxisId="l" dataKey="plan1" name={planA} fill={C.metric1} opacity={0.8} radius={[3,3,0,0]} maxBarSize={50}
            onClick={handleBarClick} style={{ cursor: selectedKey ? 'default' : 'pointer' }} />
          <Bar yAxisId="l" dataKey="plan2" name={planB} fill={C.metric2} opacity={0.8} radius={[3,3,0,0]} maxBarSize={50}
            onClick={handleBarClick} style={{ cursor: selectedKey ? 'default' : 'pointer' }} />
          <Line yAxisId="r" type="monotone" dataKey="variance" name="Variance %" stroke={C.trend}
            strokeWidth={2} dot={{ r: 3, fill: C.trend, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </Visual>
  )
}

// The headline visual on this layer per direct request ("the most important graph...
// make it worth") — a diverging bar per queue (not two bars to compare by eye),
// value-labeled at the bar end, same polished convention as Forecasting's own
// "Top Queues by Variance" charts (Layer1PlanOverPlan.jsx).
function QueueVarianceChart({ filters, planA, planB }) {
  const data = useMemo(() => planOverPlanQueueVariance(filters, 8, planA, planB), [filters, planA, planB])
  const niceMax = useMemo(() => Math.max(10, Math.ceil(Math.max(1, ...data.map(d => Math.abs(d.variance))) / 5) * 5), [data])
  const domainMax = niceMax * 1.3
  const ticks = [-niceMax, -niceMax / 2, 0, niceMax / 2, niceMax]
  // Full in-scope roster (not just the chart's own top-8), tiered High/Moderate/Low
  // with an illustrative likely-reason per queue, worst first — same treatment as
  // Layer1PlanOverPlan's Visual3 on the Forecasting page.
  const table = useMemo(() => {
    const all = planOverPlanQueueVariance(filters, 999, planA, planB)
    return {
      title: 'Every queue in scope, by variance tier',
      columns: VARIANCE_TABLE_COLUMNS,
      rows: all
        .map(q => ({ name: q.name, tier: varianceTier(Math.abs(q.variance)).label, variance: `${q.variance > 0 ? '+' : ''}${q.variance}%`, reason: varianceReason(q.name), _abs: Math.abs(q.variance) }))
        .sort((a, b) => b._abs - a._abs),
    }
  }, [filters, planA, planB])

  const QueueTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const row = payload[0]?.payload
    return (
      <div className="chart-tooltip">
        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', marginBottom: 5 }}>{label}</p>
        <p style={{ fontSize: 11, color: C.metric1 }}>{planA}: <span style={{ fontWeight: 600 }}>{row.plan1}</span></p>
        <p style={{ fontSize: 11, color: C.metric2 }}>{planB}: <span style={{ fontWeight: 600 }}>{row.plan2}</span></p>
      </div>
    )
  }

  return (
    <Visual title="Queues with Highest Variation" subtitle={`${planA} vs ${planB}, worst variance first`}
      info="Queues with the largest Plan A vs Plan B headcount swing, worst first."
      rca="A small number of queues account for most of the plan-to-plan swing."
      clca="Review these queues' plans first — they carry the most headcount risk."
      table={table}>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} layout="vertical" margin={{ top: 4, right: 34, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} horizontal={false} />
          <XAxis type="number" domain={[-domainMax, domainMax]} ticks={ticks} tick={{ fill: C.tick, fontSize: 9 }} axisLine={false} tickLine={false}
            tickFormatter={v => `${v}%`} />
          <YAxis type="category" dataKey="name" tick={<CategoryTick />} width={150} axisLine={false} tickLine={false} />
          <Tooltip content={<QueueTip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
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
  // Shared Plan A/Plan B selection (2026-07-23) — both charts in this layer represent
  // the same two chosen plans, so they read one selection here rather than each
  // keeping an independent copy (unlike UtilizationLayer's 3 visuals, which are
  // deliberately independent).
  const [plans, setPlans] = useState({ planA: PLANS[0], planB: PLANS[1] || PLANS[0] })
  const handlePlanChange = (key, val) => setPlans(p => ({ ...p, [key]: val }))

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
      <div className="layer-header" onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#070f1a', background: '#34d399', borderRadius: 4, padding: '2px 7px', letterSpacing: '0.04em' }}>02</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Plan over Plan Variation</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>— headcount plan variance by region &amp; queue</span>
        </div>
        <span style={{ fontSize: 11, color: '#34d399', transform: open ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▲</span>
      </div>
      {open && (
        <div style={{ padding: 12, display: 'flex', gap: 10 }}>
          <MainChart filters={filters} granularity={granularity} planA={plans.planA} planB={plans.planB} onPlanChange={handlePlanChange} />
          <QueueVarianceChart filters={filters} planA={plans.planA} planB={plans.planB} />
        </div>
      )}
    </div>
  )
}
