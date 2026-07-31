import React, { useMemo, useState } from 'react'
import {
  ComposedChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { PLAN_NAMES } from '../../data/mockData'
import { utilizationByFY, utilizationByQueue, leavesByQueue } from '../../data/msgCapacityData'
import {
  contributingFactors, FACTOR_TABLE_COLUMNS, varianceTier, varianceReason, VARIANCE_TABLE_COLUMNS,
} from '../../data/insightFactors'
import { C, Visual, Tip, CategoryTick, PlanSelect, planSeriesColor } from '../ChartKit'

// Same PLAN_NAMES list as Headcount and SL%'s "Actual vs Plan Variation" dropdown
// (2026-07-23 follow-up — was CAPACITY_PLAN_NAMES, switched so every recently-added
// Plan dropdown on this page draws from one consistent list).
const PLANS = PLAN_NAMES

// Extends the shared Tip with the top-3 Aux codes driving the gap (a shortfall can
// genuinely be caused by more than one Aux code, so the tooltip surfaces the top 3
// by impact rather than a single culprit) and an Adherence % line on a second axis.
function UtilFyTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="chart-tooltip">
      <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', marginBottom: 5 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 11, color: p.color, marginBottom: 2 }}>
          {p.name}: <span style={{ fontWeight: 600 }}>{p.value}%</span>
        </p>
      ))}
      {row.actual < row.target && row.auxBreakdown?.length > 0 && (
        <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 4, paddingTop: 4, borderTop: '1px solid var(--border-subtle)' }}>
          <p style={{ marginBottom: 2 }}>Driven by:</p>
          {row.auxBreakdown.map((a, i) => (
            <p key={i} style={{ marginLeft: 4 }}>
              <span style={{ color: C.behind, fontWeight: 600 }}>{a.code}</span> (-{a.impactPct}pt)
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

// Time-axis view — Fiscal Year default, drillable to Quarter/Week via the page-wide
// granularity toggle, same as every other Layer 1/2 time chart on this page. Now
// carries an Adherence % line on a second axis alongside Actual/Target.
// Own independent Plan dropdown (2026-07-23) — local state, not shared with Visual2/
// Visual3 below or with any other layer's Plan picker, per direct request that each
// graph in this section gets its own selection.
// Multi-select Plan (2026-07-30) — same full N-series treatment as AsuLayer.jsx's
// Visual1: empty selection shows the baseline Target; 1 plan renders identically to
// the old single-select behavior; 2+ add one Target bar per plan and drop the
// Adherence % line (ambiguous once more than one Target is shown).
function Visual1({ filters, granularity }) {
  const [selectedPlans, setSelectedPlans] = useState([])
  const plans = selectedPlans.length ? selectedPlans : [undefined]
  const perPlan = useMemo(() => plans.map(p => utilizationByFY(filters, granularity, p)), [filters, granularity, plans])
  const data = useMemo(() => perPlan[0].map((row, i) => {
    const out = { period: row.period, actual: row.actual, auxBreakdown: row.auxBreakdown }
    plans.forEach((p, pi) => { out[`target_${pi}`] = perPlan[pi][i].target })
    if (plans.length === 1) out.adherence = perPlan[0][i].adherence
    return out
  }), [perPlan, plans])
  // Period-based trend, no real region context here — same treatment as Visual1 on
  // Layer1PlanOverPlan/HeadcountLayer.
  const table = useMemo(() => ({
    title: 'What contributed, by period',
    columns: FACTOR_TABLE_COLUMNS,
    rows: data.flatMap(d => contributingFactors(d.period, null, 1).map(f => ({ ...f, factor: `${d.period} — ${f.factor}` }))),
  }), [data])
  return (
    <Visual title="Actual vs Target Utilization" subtitle="Hover a bar to see the Aux codes driving the gap"
      controls={<PlanSelect label="Plan" value={selectedPlans} onChange={setSelectedPlans} options={PLANS} />}
      info="Actual vs Target utilization % over time, with an Adherence % trend line (shown when exactly one plan is selected) and the Aux codes driving any gap."
      rca="Utilization shortfalls trace back to a handful of recurring Aux codes."
      clca="Add an Aux-code contingency buffer for queues with recurring exposure."
      table={table}>
      <ResponsiveContainer width="100%" height={222}>
        <ComposedChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="l" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
          <YAxis yAxisId="r" orientation="right" tick={{ fill: C.trend, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip content={<UtilFyTip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Bar yAxisId="l" dataKey="actual" name="Actual" fill={C.metric1} opacity={0.85} radius={[3,3,0,0]} maxBarSize={44} />
          {plans.map((p, pi) => {
            const { color, opacity } = planSeriesColor(pi)
            return <Bar key={pi} yAxisId="l" dataKey={`target_${pi}`} name={p ? `Target (${p})` : 'Target'} fill={color} opacity={opacity} radius={[3,3,0,0]} maxBarSize={44} />
          })}
          {plans.length === 1 && (
            <Line yAxisId="r" type="monotone" dataKey="adherence" name="Adherence %" stroke={C.trend} strokeWidth={2} dot={{ r: 3, fill: C.trend, strokeWidth: 0 }} activeDot={{ r: 5 }} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </Visual>
  )
}

// Shared horizontal-bar shell for the two queue-axis visuals below — same
// "long real queue names read better as horizontal bars" convention as the
// Forecasting page's Top Queues by Variance charts.
function QueueBarChart({ data, actualLabel, targetLabel, actualColor, targetColor, tooltipExtra }) {
  const QueueTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const row = payload[0]?.payload
    return (
      <div className="chart-tooltip">
        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', marginBottom: 5 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ fontSize: 11, color: p.color, marginBottom: 2 }}>
            {p.name}: <span style={{ fontWeight: 600 }}>{p.value}</span>
          </p>
        ))}
        {tooltipExtra && row && tooltipExtra(row)}
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 4" stroke={C.grid} horizontal={false} />
        <XAxis type="number" tick={{ fill: C.tick, fontSize: 9 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={<CategoryTick />} width={140} axisLine={false} tickLine={false} />
        <Tooltip content={<QueueTip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
        <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
        <Bar dataKey="actual" name={actualLabel} fill={actualColor} opacity={0.85} radius={[0,3,3,0]} maxBarSize={16} />
        <Bar dataKey="target" name={targetLabel} fill={targetColor} opacity={0.85} radius={[0,3,3,0]} maxBarSize={16} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Queue-axis view — which specific queues have the worst Aux-driven utilization
// gap, worst first. Each queue now lists 2-3 contributing Aux codes, not one.
// Own independent Plan dropdown, separate from Visual1's and Visual3's — see note above.
// Multi-select Plan (2026-07-30) — this is a ranked-by-queue horizontal bar chart,
// not a period trend, so showing N Target bars per queue row would multiply the bar
// count per row fast; uses the FIRST selected plan for calculation (a documented
// simplification), same as HeadcountLayer Visual3's defaulter table.
function Visual2({ filters }) {
  const [selectedPlans, setSelectedPlans] = useState([])
  const plan = selectedPlans[0]
  const data = useMemo(() => utilizationByQueue(filters, 6, plan), [filters, plan])
  // Full in-scope roster (not just the chart's own top-6), tiered High/Moderate/Low
  // with an illustrative likely-reason per queue, worst first — same treatment as the
  // "Top Queues by Variance" charts, adapted here to tier by |utilization gap| (a
  // percentage-point gap, same numeric scale as a plan-variance %) rather than a plan
  // A/B variance.
  const table = useMemo(() => {
    const all = utilizationByQueue(filters, 999, plan)
    return {
      title: 'Every queue in scope, by gap tier',
      columns: VARIANCE_TABLE_COLUMNS,
      rows: all
        .map(q => {
          const gap = +(q.actual - q.target).toFixed(1)
          return { name: q.name, tier: varianceTier(Math.abs(gap)).label, variance: `${gap > 0 ? '+' : ''}${gap}pt`, reason: varianceReason(q.name), _abs: Math.abs(gap) }
        })
        .sort((a, b) => b._abs - a._abs),
    }
  }, [filters, plan])
  return (
    <Visual title="Utilization Gap Queues" subtitle="Worst utilization gap first"
      controls={<PlanSelect label="Plan" value={selectedPlans} onChange={setSelectedPlans} options={PLANS} />}
      info="Queues with the largest gap between actual and target utilization, worst first."
      rca="These queues share the same 2-3 Aux codes as their main driver."
      clca="Target training/system-downtime fixes at the Aux codes shown here first."
      table={table}>
      <QueueBarChart
        data={data} actualLabel="Actual %" targetLabel="Target %" actualColor={C.metric1} targetColor={C.metric2}
        tooltipExtra={row => (
          <p style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 4, paddingTop: 4, borderTop: '1px solid var(--border-subtle)' }}>
            Adherence <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{row.adherence}%</span> · Driven by{' '}
            <span style={{ color: C.behind, fontWeight: 600 }}>{row.auxes?.join(', ')}</span>
          </p>
        )}
      />
    </Visual>
  )
}

// Shows which queues are burning through more outage (leave) time than planned, and
// by how much. Own independent Plan dropdown, separate from Visual1's and Visual2's.
// Multi-select Plan (2026-07-30) — same first-selected-plan simplification as
// Visual2 above (ranked-by-queue horizontal bar chart, not a period trend).
function Visual3({ filters }) {
  const [selectedPlans, setSelectedPlans] = useState([])
  const plan = selectedPlans[0]
  const data = useMemo(() => leavesByQueue(filters, 6, plan), [filters, plan])
  // Full in-scope roster (not just the chart's own top-6), tiered by |outage delta|
  // (a raw day-count gap, not a percentage — so the cell is labeled with a plain
  // signed number, not a "%"/"pt" suffix) — same ranked-queue treatment as Visual2,
  // adapted to this metric's own unit.
  const table = useMemo(() => {
    const all = leavesByQueue(filters, 999, plan)
    return {
      title: 'Every queue in scope, by outage gap tier',
      columns: VARIANCE_TABLE_COLUMNS,
      rows: all
        .map(q => ({ name: q.name, tier: varianceTier(Math.abs(q.delta)).label, variance: `${q.delta > 0 ? '+' : ''}${q.delta}`, reason: varianceReason(q.name), _abs: Math.abs(q.delta) }))
        .sort((a, b) => b._abs - a._abs),
    }
  }, [filters, plan])
  return (
    <Visual title="Outage — Actual vs Target" subtitle="Highest delta, ascending"
      controls={<PlanSelect label="Plan" value={selectedPlans} onChange={setSelectedPlans} options={PLANS} />}
      info="Queues with the largest gap between actual and target outage, ordered by delta."
      rca="Outages cluster in a few queues rather than spreading evenly."
      clca="Add contingent staffing coverage for the queues with the largest outage gap."
      table={table}>
      <QueueBarChart
        data={data} actualLabel="Actual Outage" targetLabel="Target Outage" actualColor={C.behind} targetColor={C.metric2}
        tooltipExtra={row => (
          <p style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 4, paddingTop: 4, borderTop: '1px solid var(--border-subtle)' }}>
            Delta <span style={{ fontWeight: 600, color: row.delta > 0 ? C.behind : C.ahead }}>{row.delta > 0 ? '+' : ''}{row.delta}</span>
          </p>
        )}
      />
    </Visual>
  )
}

export default function UtilizationLayer({ filters, granularity }) {
  const [open, setOpen] = useState(true)

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
      <div className="layer-header" onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#070f1a', background: '#fb923c', borderRadius: 4, padding: '2px 7px', letterSpacing: '0.04em' }}>03</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Utilization and Outage Analysis</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>— Aux-driven utilization &amp; outage</span>
        </div>
        <span style={{ fontSize: 11, color: '#fb923c', transform: open ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▲</span>
      </div>
      {open && (
        <div style={{ padding: 12, display: 'flex', gap: 10 }}>
          <Visual1 filters={filters} granularity={granularity} />
          <Visual2 filters={filters} />
          <Visual3 filters={filters} />
        </div>
      )}
    </div>
  )
}
