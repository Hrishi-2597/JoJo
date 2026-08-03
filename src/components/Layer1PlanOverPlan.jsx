import React, { useEffect, useMemo, useState } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell, LabelList,
} from 'recharts'
import { PLAN_NAMES, planOverPlanByFY, planOverPlanByRegion, cqnPlanVariance } from '../data/mockData'
import {
  contributingFactors, FACTOR_TABLE_COLUMNS, varianceTier, varianceReason, VARIANCE_TABLE_COLUMNS,
} from '../data/insightFactors'
import { GraphInsightButton, InfoButton, PopupTable, PlanDropdowns, planVsPlanSeriesColor, ComingSoonOverlay } from './ChartKit'
import { Modal } from './Modal'

const PLANS = PLAN_NAMES.filter(p => p !== 'Actual')
// Blue/orange compare two neutral quantities (Plan A vs Plan B); violet is a neutral
// analytical trend (the variance line isn't inherently good or bad on its own);
// green/red are reserved for the diverging chart, where they mean ahead/behind.
const C = { plan1: '#38bdf8', plan2: '#fb923c', variance: '#a78bfa', ahead: '#34d399', behind: '#f87171', grid: 'var(--chart-grid)', tick: '#4a6a85' }

// Local PlanDropdowns duplicate removed 2026-07-31 in favor of the shared,
// now-multi-select ChartKit.jsx PlanDropdowns (same precedent as Layer2ActualVsPlan's
// PlanSelect cleanup) — the local `Visual`/`Tip`/`C` above still stay local since they
// predate the ChartKit.jsx promotion and are unrelated to this task.

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', marginBottom: 5 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 11, color: p.color, marginBottom: 2 }}>
          {p.name}: <span style={{ fontWeight: 600 }}>{typeof p.value === 'number' && p.value > 99 ? p.value.toLocaleString() : `${p.value}%`}</span>
        </p>
      ))}
    </div>
  )
}

// `table` opens in a Modal on clicking the title (the graph itself), not the RCA/CLCA
// button — see ChartKit.jsx's shared Visual for the full reasoning; this local copy
// (predates the shared ChartKit promotion) mirrors the same behavior.
function Visual({ title, subtitle, children, controls, rca, clca, table, info }) {
  const [tableOpen, setTableOpen] = useState(false)
  return (
    <div className="chart-panel flex-1 min-w-0 flex flex-col gap-2" style={{ position: 'relative' }}>
      {(rca || clca) && <div style={{ position: 'absolute', top: 10, left: 12, zIndex: 2 }}><GraphInsightButton rca={rca} clca={clca} /></div>}
      <p
        onClick={e => { if (table && !e.target.closest('button')) setTableOpen(true) }}
        title={table ? 'Click for details' : undefined}
        style={{
          fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: 5, cursor: table ? 'pointer' : undefined,
        }}
      >
        {title}{info && <InfoButton info={info} />}
      </p>
      {subtitle && <p style={{ fontSize: 9.5, color: 'var(--text-faint)', textAlign: 'center' }}>{subtitle}</p>}
      {controls && <div style={{ display: 'flex', justifyContent: 'center' }}>{controls}</div>}
      {children}
      {table && tableOpen && (
        <Modal title={table.title || title} onClose={() => setTableOpen(false)} width={560}>
          <ComingSoonOverlay><PopupTable table={table} /></ComingSoonOverlay>
        </Modal>
      )}
    </div>
  )
}

function truncate(str, n) {
  if (str.length <= n) return str
  const cut = str.slice(0, n)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > n * 0.55 ? cut.slice(0, lastSpace) : cut) + '…'
}

function QueueTick({ x, y, payload }) {
  return (
    <text x={x} y={y} dy={3} textAnchor="end" fontSize={9.5} fill="var(--text-secondary)">{truncate(payload.value, 24)}</text>
  )
}


// `plansA`/`plansB` (2026-07-31, was a single planA/planB string pair) — same
// multi-select treatment as AsuLayer.jsx's Visual2: planOverPlanByFY now takes
// planA/planB independently (plan1 only depends on planA, plan2 only on planB —
// see mockData.js), called once per selected plan on each side using `undefined` as
// a no-op placeholder for the other slot. Variance % line only when exactly one
// plan is selected on each side.
function Visual1({ filters, granularity, plansA, plansB, onPlansChange }) {
  const aPlans = plansA.length ? plansA : [undefined]
  const bPlans = plansB.length ? plansB : [undefined]
  const perA = useMemo(() => aPlans.map(p => planOverPlanByFY(filters, granularity, p, undefined)), [filters, granularity, aPlans])
  const perB = useMemo(() => bPlans.map(p => planOverPlanByFY(filters, granularity, undefined, p)), [filters, granularity, bPlans])
  const data = useMemo(() => perA[0].map((row, i) => {
    const out = { period: row.period }
    aPlans.forEach((p, pi) => { out[`planA_${pi}`] = perA[pi][i].plan1 })
    bPlans.forEach((p, pi) => { out[`planB_${pi}`] = perB[pi][i].plan2 })
    if (aPlans.length === 1 && bPlans.length === 1) {
      out.variance = out.planA_0 ? +((out.planB_0 - out.planA_0) / out.planA_0 * 100).toFixed(1) : 0
    }
    return out
  }), [perA, perB, aPlans, bPlans])
  const table = useMemo(() => ({
    title: 'What contributed, by period',
    columns: FACTOR_TABLE_COLUMNS,
    rows: data.flatMap(d => contributingFactors(d.period, null, 1).map(f => ({ ...f, period: d.period, factor: `${d.period} — ${f.factor}` }))),
  }), [data])
  return (
    <Visual title="PoP Variation" controls={<PlanDropdowns planA={plansA} planB={plansB} onChange={onPlansChange} />}
      rca="Plan-to-plan gaps widen most in quarters with late AOP updates."
      clca="Lock plan revisions earlier in the quarter to shrink the variance window."
      table={table}
      info="Plan A vs Plan B volume by fiscal year (or sub-period), with percent variance shown when exactly one plan is selected on each side.">
      <ResponsiveContainer width="100%" height={222}>
        <ComposedChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="l" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
          <YAxis yAxisId="r" orientation="right" tick={{ fill: C.variance, fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={v => `${v}%`} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <ReferenceLine yAxisId="r" y={0} stroke="rgba(255,255,255,0.1)" />
          {aPlans.map((p, pi) => {
            const { color, opacity } = planVsPlanSeriesColor(pi)
            return <Bar key={`a${pi}`} yAxisId="l" dataKey={`planA_${pi}`} name={p ? `Plan A (${p})` : 'Plan A'} fill={color} opacity={opacity} radius={[3,3,0,0]} maxBarSize={40} />
          })}
          {bPlans.map((p, pi) => {
            const { color, opacity } = planVsPlanSeriesColor(aPlans.length + pi)
            return <Bar key={`b${pi}`} yAxisId="l" dataKey={`planB_${pi}`} name={p ? `Plan B (${p})` : 'Plan B'} fill={color} opacity={opacity} radius={[3,3,0,0]} maxBarSize={40} />
          })}
          {aPlans.length === 1 && bPlans.length === 1 && (
            <Line yAxisId="r" type="monotone" dataKey="variance" name="Variance %" stroke={C.variance}
              strokeWidth={2} dot={{ r: 3, fill: C.variance, strokeWidth: 0 }} activeDot={{ r: 5 }} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </Visual>
  )
}

// planOverPlanByRegion is confirmed cosmetic (static per-region table, ignores any
// plan argument) — same first-selected-plan-only policy as ranked/impact charts
// elsewhere in this rollout, used here purely for the legend labels.
function Visual2({ filters, plansA, plansB, onPlansChange }) {
  const planA = plansA[0]
  const planB = plansB[0]
  const data = useMemo(() => planOverPlanByRegion(filters), [filters])
  const table = useMemo(() => ({
    title: 'What contributed, by region',
    columns: FACTOR_TABLE_COLUMNS,
    rows: data.flatMap(d => contributingFactors(d.region, d.region, 1).map(f => ({ ...f, factor: `${d.region} — ${f.factor}` }))),
  }), [data])
  return (
    <Visual title="Regional Plan Variance" controls={<PlanDropdowns planA={plansA} planB={plansB} onChange={onPlansChange} />}
      rca="LATAM and APJ tend to show the largest regional swings against Plan A."
      clca="Add a region-specific buffer to Plan B for the regions swinging most."
      table={table}
      info="Plan A vs Plan B volume by region, with the resulting variance % line.">
      <ResponsiveContainer width="100%" height={222}>
        <ComposedChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} />
          <XAxis dataKey="region" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="l" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
          <YAxis yAxisId="r" orientation="right" tick={{ fill: C.variance, fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={v => `${v}%`} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <ReferenceLine yAxisId="r" y={0} stroke="rgba(255,255,255,0.1)" />
          <Bar yAxisId="l" dataKey="plan1" name={planA || 'Plan A'} fill={C.plan1} opacity={0.8} radius={[3,3,0,0]} maxBarSize={50} />
          <Bar yAxisId="l" dataKey="plan2" name={planB || 'Plan B'} fill={C.plan2} opacity={0.8} radius={[3,3,0,0]} maxBarSize={50} />
          <Line yAxisId="r" type="monotone" dataKey="variance" name="Variance %" stroke={C.variance}
            strokeWidth={2} dot={{ r: 3, fill: C.variance, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </Visual>
  )
}

// Diverging bar: one bar per queue showing the variance itself (not two bars the
// reader has to compare) — green extends right (ahead of Plan A), red extends left
// (behind). Full plan1/plan2 values and the queue's full name are in the tooltip.
// cqnPlanVariance is confirmed cosmetic (each queue's plan1/plan2/planVariance are
// precomputed static fields, no plan argument) — first-selected-plan-only, same as
// Visual2 above.
function Visual3({ filters, plansA, plansB, onPlansChange }) {
  const planA = plansA[0]
  const planB = plansB[0]
  const data = useMemo(() => cqnPlanVariance(filters), [filters])
  // Round to a clean step so axis ticks land on whole numbers (-10/-5/0/5/10, not
  // whatever odd value the raw max happens to be), then pad the plotted domain —
  // not the ticks — so the value label at the end of the longest bar has room.
  const niceMax = useMemo(() => Math.max(10, Math.ceil(Math.max(...data.map(d => Math.abs(d.variance))) / 5) * 5), [data])
  const domainMax = niceMax * 1.3
  const ticks = [-niceMax, -niceMax / 2, 0, niceMax / 2, niceMax]
  // Full in-scope roster (not just the chart's own top-N) bucketed into High/Moderate/
  // Low variance tiers with an illustrative likely-reason per queue, worst first —
  // the chart above only has room for the extremes, this shows the whole picture.
  const table = useMemo(() => {
    const all = cqnPlanVariance(filters, 999)
    return {
      title: 'Every queue in scope, by variance tier',
      columns: VARIANCE_TABLE_COLUMNS,
      rows: all
        .map(q => ({ name: q.cqn, tier: varianceTier(Math.abs(q.variance)).label, variance: `${q.variance > 0 ? '+' : ''}${q.variance}%`, reason: varianceReason(q.cqn), _abs: Math.abs(q.variance) }))
        .sort((a, b) => b._abs - a._abs),
    }
  }, [filters])
  return (
    <Visual title="Top Queues by Variance"
      controls={<PlanDropdowns planA={plansA} planB={plansB} onChange={onPlansChange} />}
      rca="A small set of queues accounts for most of the plan-to-plan swing."
      clca="Prioritize a plan review for the queues topping this list before broader changes."
      table={table}
      info="The queues with the largest Plan A vs Plan B variance, ranked by magnitude regardless of direction.">
      <ResponsiveContainer width="100%" height={230}>
        <ComposedChart data={data} layout="vertical" margin={{ top: 4, right: 34, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} horizontal={false} />
          <XAxis type="number" domain={[-domainMax, domainMax]} ticks={ticks} tick={{ fill: C.tick, fontSize: 9 }} axisLine={false} tickLine={false}
            tickFormatter={v => `${v}%`} />
          <YAxis type="category" dataKey="cqn" tick={<QueueTick />} width={148} axisLine={false} tickLine={false} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <ReferenceLine x={0} stroke="rgba(255,255,255,0.15)" />
          <Bar dataKey="variance" name="Variance %" radius={[3,3,3,3]} maxBarSize={20}>
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

export default function Layer1PlanOverPlan({ filters, granularity }) {
  // Plan A/Plan B (2026-07-31, was a single pre-picked string pair) — empty arrays
  // show generic "Plan A"/"Plan B" baseline (unscaled) bars, matching the same
  // empty-selection convention as every other multi-select Plan dropdown.
  const [plans, setPlans] = useState({ planA: [], planB: [] })
  const [open, setOpen] = useState(true)
  const handlePlanChange = (key, val) => setPlans(p => ({ ...p, [key]: val }))

  // The top Plan Name filter sets the primary plan (A) shown across all three
  // visuals (using the first selection if multiple are chosen); each visual can
  // still be overridden independently via its own dropdowns.
  useEffect(() => {
    const picked = filters.planName?.[0]
    if (picked && PLANS.includes(picked)) {
      setPlans(p => ({
        planA: [picked],
        planB: p.planB[0] !== picked ? p.planB : [PLANS.find(pl => pl !== picked) || picked],
      }))
    }
  }, [filters.planName])

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
      <div className="layer-header" onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, color: '#070f1a', background: '#38bdf8',
            borderRadius: 4, padding: '2px 7px', letterSpacing: '0.04em',
          }}>01</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Plan over Plan
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>— variance analysis</span>
        </div>
        <span style={{ fontSize: 11, color: '#38bdf8', transform: open ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▲</span>
      </div>
      {open && (
        <div style={{ padding: 12, display: 'flex', gap: 10 }}>
          <Visual1 filters={filters} granularity={granularity} plansA={plans.planA} plansB={plans.planB} onPlansChange={handlePlanChange} />
          <Visual2 filters={filters} plansA={plans.planA} plansB={plans.planB} onPlansChange={handlePlanChange} />
          <Visual3 filters={filters} plansA={plans.planA} plansB={plans.planB} onPlansChange={handlePlanChange} />
        </div>
      )}
    </div>
  )
}
