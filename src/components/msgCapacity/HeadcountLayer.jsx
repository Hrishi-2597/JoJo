import React, { useMemo, useState } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { PLAN_NAMES } from '../../data/mockData'
import {
  hcStaffingByFY, attritionByDimension, attritionTrendByDimension, slTrendByFY, slDefaulterQueues,
} from '../../data/msgCapacityData'
import { contributingFactors, FACTOR_TABLE_COLUMNS } from '../../data/insightFactors'
import { C, Visual, Tip, PlanSelect, BinaryToggle, PillButton, planSeriesColor } from '../ChartKit'

const PLANS = PLAN_NAMES

// Multi-select Plan (2026-07-30, was a single pre-picked string — see ChartKit's
// PlanSelect for the widget change and AsuLayer.jsx's Visual1 for the full
// rationale): empty selection shows the baseline Plan HC; 1 selected plan renders
// identically to the old single-select behavior; 2+ add one Plan HC bar per plan
// and drop the Variation % line (ambiguous once more than one plan is shown).
function Visual1({ filters, granularity, selectedPlans, onPlansChange }) {
  const plans = selectedPlans.length ? selectedPlans : [undefined]
  const perPlan = useMemo(() => plans.map(p => hcStaffingByFY(filters, granularity, p)), [filters, granularity, plans])
  const data = useMemo(() => perPlan[0].map((row, i) => {
    const out = { period: row.period, actual: row.actual }
    plans.forEach((p, pi) => { out[`plan_${pi}`] = perPlan[pi][i].plan })
    if (plans.length === 1) out.adherence = perPlan[0][i].adherence
    return out
  }), [perPlan, plans])
  // Period-based trend, no real region context to cross-reference — same treatment
  // as Layer1PlanOverPlan's Visual1 on the Forecasting page.
  const table = useMemo(() => ({
    title: 'What contributed, by period',
    columns: FACTOR_TABLE_COLUMNS,
    rows: data.flatMap(d => contributingFactors(d.period, null, 1).map(f => ({ ...f, factor: `${d.period} — ${f.factor}` }))),
  }), [data])
  return (
    <Visual title="Actual vs Plan Variation" controls={<PlanSelect label="Plan" value={selectedPlans} onChange={onPlansChange} options={PLANS} />}
      info="Actual headcount vs the planned headcount, by fiscal period, with a Variation % trend line shown when exactly one plan is selected."
      rca="Staffing variation is largest in quarters right after a hiring freeze."
      clca="Smooth headcount ramp-up across quarters instead of a single freeze/unfreeze cycle."
      table={table}>
      <ResponsiveContainer width="100%" height={222}>
        <ComposedChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="l" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="r" orientation="right" tick={{ fill: C.trend, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Bar yAxisId="l" dataKey="actual" name="Actual HC" fill={C.metric1} opacity={0.8} radius={[3,3,0,0]} maxBarSize={40} />
          {plans.map((p, pi) => {
            const { color, opacity } = planSeriesColor(pi)
            return <Bar key={pi} yAxisId="l" dataKey={`plan_${pi}`} name={p ? `Plan HC (${p})` : 'Plan HC'} fill={color} opacity={opacity} radius={[3,3,0,0]} maxBarSize={40} />
          })}
          {plans.length === 1 && (
            <Line yAxisId="r" type="monotone" dataKey="adherence" name="Variation %" stroke={C.trend} strokeWidth={2} dot={{ r: 3, fill: C.trend, strokeWidth: 0 }} activeDot={{ r: 5 }} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </Visual>
  )
}

// Custom tooltip so the raw attrition headcount (not just the %) is always visible,
// not only inferrable by eye from the bar — "attrition % along with original number"
// per the request.
function AttritionTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  return (
    <div className="chart-tooltip">
      <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', marginBottom: 5 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 11, color: p.color, marginBottom: 2 }}>
          {p.name}: <span style={{ fontWeight: 600 }}>{typeof p.value === 'number' && p.value > 99 ? p.value.toLocaleString() : p.value}</span>
        </p>
      ))}
      {row?.attritionCount != null && (
        <p style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 4, paddingTop: 4, borderTop: '1px solid var(--border-subtle)' }}>
          ≈ <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{row.attritionCount.toLocaleString()}</span> employees attritted
        </p>
      )}
    </div>
  )
}

// Region/Sub-region renders by default (one bar+line per key); clicking a bar drills
// into that key's own FY/granularity trend, same "click to drill" mechanic as TSA
// Forecasting's CPASU Trend (AsuSrTrendLayer Visual1). Switching the Region/Sub-region
// toggle while drilled in resets the drill, since a selected key from one dimension
// has no matching key in the other.
function Visual2({ filters, granularity }) {
  const [dimension, setDimension] = useState('Region')
  const [selectedKey, setSelectedKey] = useState(null)
  const dimLabel = dimension === 'SubRegion' ? 'Sub-region' : 'Region'
  const dimData = useMemo(() => attritionByDimension(filters, dimension), [filters, dimension])
  const trendData = useMemo(
    () => (selectedKey ? attritionTrendByDimension(filters, selectedKey, dimension, granularity) : []),
    [filters, selectedKey, dimension, granularity]
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
  // switched to showing that.
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
    <Visual title="Attrition"
      subtitle={selectedKey ? `${selectedKey} — attrition trend` : `Click a ${dimLabel.toLowerCase()} to see its trend`}
      cornerControls={<BinaryToggle leftLabel="Region" rightLabel="Sub-region" value={dimLabel} onChange={handleDimensionChange} />}
      controls={selectedKey && <PillButton onClick={() => setSelectedKey(null)}>← All {dimLabel}s</PillButton>}
      info="Headcount and attrition % by region or sub-region; click a bar to drill into that key's own trend."
      rca="Attrition is concentrated in regions with the longest backfill lead time."
      clca="Shorten the backfill pipeline for the regions driving attrition."
      table={table}>
      <ResponsiveContainer width="100%" height={222}>
        <ComposedChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} />
          <XAxis dataKey={xKey} tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="l" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}K` : v} />
          <YAxis yAxisId="r" orientation="right" tick={{ fill: C.behind, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip content={<AttritionTip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Bar yAxisId="l" dataKey="headcount" name="Headcount" fill={C.metric1} opacity={0.8} radius={[3,3,0,0]} maxBarSize={40}
            onClick={handleBarClick} style={{ cursor: selectedKey ? 'default' : 'pointer' }} />
          <Line yAxisId="r" type="monotone" dataKey="attrition" name="Attrition %" stroke={C.behind} strokeWidth={2} dot={{ r: 3, fill: C.behind, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </Visual>
  )
}

const DEFAULTER_TABLE_COLUMNS = [
  { key: 'name', label: 'CQN', wrap: true },
  { key: 'sl', label: 'SL %', align: 'right' },
  { key: 'hc', label: 'HC Actual vs Plan', align: 'right' },
]

// Renamed from "Actual vs Plan Trend with SL%"; the Region/Country toggle is gone
// (not requested here) and the defaulter list uses a stricter, more actionable rule:
// over-plan headcount that STILL hasn't fixed SL — see slDefaulterQueues in
// msgCapacityData.js. Own independent Plan dropdown (2026-07-23, local state passed
// down from HeadcountLayer), separate from Visual1's Plan picker — each graph in this
// layer keeps its own selection. Uses the same PLAN_NAMES list as Visual1's own Plan
// dropdown (2026-07-23 follow-up — was CAPACITY_PLAN_NAMES, switched for consistency
// across every dropdown on this layer).
//
// The defaulter list used to render permanently under the chart, extending the card's
// height (2026-07-27 follow-up: moved into the click-the-title detail table instead,
// replacing the generic "what contributed" factors table this chart briefly had — the
// defaulter list IS this chart's real, concrete detail, so it belongs there rather than
// a second, less specific table).
// Multi-select Plan (2026-07-30) — slPct is an independent real SL% value (rides
// along on SL_TREND_BY_FY, not derived from actual/plan), so unlike Visual1's
// Variation % line it stays visible regardless of how many plans are selected. The
// defaulter table is inherently a single-plan comparison (an over/under-plan
// judgment per queue) — with 2+ plans selected it uses the FIRST one, a documented
// simplification rather than attempting a multi-plan defaulter list.
function Visual3({ filters, granularity, slPlans, onSlPlansChange }) {
  const plans = slPlans.length ? slPlans : [undefined]
  const perPlan = useMemo(() => plans.map(p => slTrendByFY(filters, granularity, p)), [filters, granularity, plans])
  const data = useMemo(() => perPlan[0].map((row, i) => {
    const out = { period: row.period, actual: row.actual, slPct: row.slPct }
    plans.forEach((p, pi) => { out[`plan_${pi}`] = perPlan[pi][i].plan })
    return out
  }), [perPlan, plans])
  const table = useMemo(() => {
    const defaulters = slDefaulterQueues(filters, 999, plans[0])
    return {
      title: 'Over-plan queues still below 90% SL',
      columns: DEFAULTER_TABLE_COLUMNS,
      rows: defaulters.map(q => ({
        name: q.name,
        sl: `${q.slActual}%`,
        hc: `${q.actualHC} vs ${q.planHC} plan (+${q.hcDelta})`,
      })),
    }
  }, [filters, plans])
  return (
    <Visual title="Headcount Impact on SL"
      controls={<PlanSelect label="Plan" value={slPlans} onChange={onSlPlansChange} options={PLANS} />}
      info="Actual vs Plan headcount alongside SL % trend, plus over-plan queues still missing their SL target."
      rca="Extra headcount alone hasn't closed the SL gap for these defaulter queues."
      clca="Prioritize a skill-mix/routing review for those queues over further hiring."
      table={table}>
      <ResponsiveContainer width="100%" height={175}>
        <ComposedChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="l" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}K` : v} />
          <YAxis yAxisId="r" orientation="right" tick={{ fill: C.trend, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Bar yAxisId="l" dataKey="actual" name="Actual" fill={C.metric1} opacity={0.8} radius={[3,3,0,0]} maxBarSize={36} />
          {plans.map((p, pi) => {
            const { color, opacity } = planSeriesColor(pi)
            return <Bar key={pi} yAxisId="l" dataKey={`plan_${pi}`} name={p ? `Plan (${p})` : 'Plan'} fill={color} opacity={opacity} radius={[3,3,0,0]} maxBarSize={36} />
          })}
          <Line yAxisId="r" type="monotone" dataKey="slPct" name="SL %" stroke={C.trend} strokeWidth={2} dot={{ r: 3, fill: C.trend, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </Visual>
  )
}

export default function HeadcountLayer({ filters, granularity }) {
  const [open, setOpen] = useState(true)
  const [selectedPlans, setSelectedPlans] = useState([])
  const [slPlans, setSlPlans] = useState([])

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
      <div className="layer-header" onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#070f1a', background: '#38bdf8', borderRadius: 4, padding: '2px 7px', letterSpacing: '0.04em' }}>01</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Headcount and SL%</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>— staffing, attrition &amp; service level</span>
        </div>
        <span style={{ fontSize: 11, color: '#38bdf8', transform: open ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▲</span>
      </div>
      {open && (
        <div style={{ padding: 12, display: 'flex', gap: 10 }}>
          <Visual1 filters={filters} granularity={granularity} selectedPlans={selectedPlans} onPlansChange={setSelectedPlans} />
          <Visual2 filters={filters} granularity={granularity} />
          <Visual3 filters={filters} granularity={granularity} slPlans={slPlans} onSlPlansChange={setSlPlans} />
        </div>
      )}
    </div>
  )
}
