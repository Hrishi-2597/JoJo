import React, { useEffect, useMemo, useState } from 'react'
import {
  ComposedChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell, LabelList,
} from 'recharts'
import { PLAN_NAMES, actualVsPlanByFY, stackedAdherenceByFY, cqnActualVariance, filterQueues } from '../data/mockData'
import {
  contributingFactors, FACTOR_TABLE_COLUMNS, varianceTier, varianceReason, VARIANCE_TABLE_COLUMNS,
  allBucketsQueues, BUCKET_TABLE_COLUMNS,
} from '../data/insightFactors'
import { GraphInsightButton, InfoButton, PopupTable, PlanSelect, ComingSoonOverlay } from './ChartKit'
import { Modal } from './Modal'

const PLANS = PLAN_NAMES.filter(p => p !== 'Actual')
const C = { actual: '#38bdf8', plan: '#fb923c', line: '#34d399', ahead: '#34d399', behind: '#f87171', grid: 'var(--chart-grid)', tick: '#4a6a85' }
// Graduated severity scale — green (tight to plan) through red (way off), matching the
// new "how far off plan" bucketing instead of the old absolute accuracy tiers.
const STACK = { under10: '#34d399', between10and20: '#38bdf8', between20and30: '#fbbf24', above30: '#f87171' }
const STACK_LABEL_COLOR = { under10: '#052e1f', between10and20: '#04202f', between20and30: '#3d2c02', above30: '#fef2f2' }
const STACK_META = [
  { key: 'under10', label: '< 10%' },
  { key: 'between10and20', label: '10–20%' },
  { key: 'between20and30', label: '20–30%' },
  { key: 'above30', label: '> 30%' },
]

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

function Visual1({ filters, granularity, selectedPlans, onPlansChange }) {
  const data = useMemo(() => actualVsPlanByFY(filters, granularity), [filters, granularity])
  const table = useMemo(() => ({
    title: 'What contributed, by period',
    columns: FACTOR_TABLE_COLUMNS,
    rows: data.flatMap(d => contributingFactors(d.period, null, 1).map(f => ({ ...f, factor: `${d.period} — ${f.factor}` }))),
  }), [data])
  return (
    <Visual title="Actual vs Plan Variation" controls={<PlanSelect value={selectedPlans} onChange={onPlansChange} options={PLANS} />}
      rca="Adherence dips concentrate in quarters with seasonal call spikes."
      clca="Build a seasonal overlay into the forecast model for those quarters."
      table={table}
      info="Actual volume against plan volume by fiscal year (or sub-period), with the resulting adherence % line.">
      <ResponsiveContainer width="100%" height={222}>
        <ComposedChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="l" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
          <YAxis yAxisId="r" orientation="right" domain={[60,110]} tick={{ fill: C.line, fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={v => `${v}%`} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <ReferenceLine yAxisId="r" y={100} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 3" />
          <Bar yAxisId="l" dataKey="actual" name="Actuals" fill={C.actual} opacity={0.8} radius={[3,3,0,0]} maxBarSize={40} />
          <Bar yAxisId="l" dataKey="plan"   name="Plan"    fill={C.plan}   opacity={0.8} radius={[3,3,0,0]} maxBarSize={40} />
          <Line yAxisId="r" type="monotone" dataKey="adherence" name="Adherence %"
            stroke={C.line} strokeWidth={2} dot={{ r: 3, fill: C.line, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </Visual>
  )
}

function Visual2({ filters, granularity, selectedPlans, onPlansChange }) {
  const data = useMemo(() => stackedAdherenceByFY(filters, granularity), [filters, granularity])
  // Same DB/OSP-agnostic queue count the Total Queues card uses — converts each
  // bucket's % into "how many queues" for the tooltip, since a bare % repeats what
  // the on-bar label already shows.
  const scopedQueues = useMemo(() => filterQueues({ ...filters, dbOsp: 'All' }), [filters])
  const totalQueues = scopedQueues.length
  // Every bucket's queue composition for the latest in-scope period, in one table —
  // answers "which queues contributed what % to that bucket" without needing a
  // separate click per bucket. See insightFactors.js for why this is a deterministic,
  // chart-consistent assignment rather than a literal filter of real per-queue variance
  // (STACKED_ADHERENCE's bucket mix is its own illustrative aggregate).
  const latest = data[data.length - 1]
  const table = useMemo(() => ({
    title: latest ? `Bucket composition — ${latest.fy}` : 'Bucket composition',
    columns: BUCKET_TABLE_COLUMNS,
    rows: latest ? allBucketsQueues(scopedQueues, latest) : [],
  }), [scopedQueues, latest])
  const StackedTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="chart-tooltip">
        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', marginBottom: 5 }}>{label}</p>
        {payload.map((p, i) => {
          const count = Math.round(p.value / 100 * totalQueues)
          return (
            <p key={i} style={{ fontSize: 11, color: p.color, marginBottom: 2 }}>
              {p.name}: <span style={{ fontWeight: 600 }}>{count} queue{count === 1 ? '' : 's'}</span>
            </p>
          )
        })}
      </div>
    )
  }
  return (
    <Visual title="Forecast Variance Distribution" controls={<PlanSelect value={selectedPlans} onChange={onPlansChange} options={PLANS} />}
      rca="The >30% variance band has been growing year over year."
      clca="Audit queues in the >30% band first — they disproportionately hurt overall accuracy."
      table={table}
      info="Percentage of the queue population per fiscal year, bucketed by how far actuals landed from plan.">
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginTop: 2 }}>
        {STACK_META.map(({ key, label }) => (
          <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--text-dim)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: STACK[key], display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={207}>
        <BarChart data={data} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} />
          <XAxis dataKey="fy" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={v => `${v}%`} domain={[0,100]} />
          <Tooltip content={<StackedTip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          {STACK_META.map(({ key, label }, i) => (
            <Bar key={key} dataKey={key} name={label} stackId="a" fill={STACK[key]}
              radius={i === STACK_META.length - 1 ? [3,3,0,0] : undefined}>
              <LabelList dataKey={key} position="center" formatter={v => `${v}%`}
                style={{ fontSize: 9.5, fontWeight: 700, fill: STACK_LABEL_COLOR[key] }} />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Visual>
  )
}

// Diverging bar: one bar per queue showing the actual-vs-plan variance itself, green
// extending right (ahead), red extending left (behind) — same treatment as Layer 1's
// CQN chart, so the two "highest variance" visuals read consistently across layers.
// Multi-select Plan (2026-07-30) — this is a ranked queue list, not a period trend,
// so it uses the FIRST selected plan for calculation (documented simplification,
// same policy as every other ranked-list consumer in this rollout).
function Visual3({ filters, selectedPlans, onPlansChange }) {
  const selectedPlan = selectedPlans[0]
  const sorted = useMemo(() => cqnActualVariance(filters, 5, selectedPlan), [filters, selectedPlan])
  // Round to a clean step so axis ticks land on whole numbers (-10/-5/0/5/10, not
  // whatever odd value the raw max happens to be), then pad the plotted domain —
  // not the ticks — so the value label at the end of the longest bar has room.
  const niceMax = useMemo(() => Math.max(10, Math.ceil(Math.max(...sorted.map(d => Math.abs(d.variance))) / 5) * 5), [sorted])
  const domainMax = niceMax * 1.3
  const ticks = [-niceMax, -niceMax / 2, 0, niceMax / 2, niceMax]
  // Full in-scope roster, tiered High/Moderate/Low with an illustrative likely-reason
  // per queue — same treatment as Layer 1's Plan A/B version of this chart.
  const table = useMemo(() => {
    const all = cqnActualVariance(filters, 999, selectedPlan)
    return {
      title: 'Every queue in scope, by variance tier',
      columns: VARIANCE_TABLE_COLUMNS,
      rows: all
        .map(q => ({ name: q.cqn, tier: varianceTier(Math.abs(q.variance)).label, variance: `${q.variance > 0 ? '+' : ''}${q.variance}%`, reason: varianceReason(q.cqn), _abs: Math.abs(q.variance) }))
        .sort((a, b) => b._abs - a._abs),
    }
  }, [filters, selectedPlan])
  return (
    <Visual title="Top Queues by Variance"
      controls={<PlanSelect value={selectedPlans} onChange={onPlansChange} options={PLANS} />}
      rca="Actual-vs-plan misses cluster in a handful of high-volume queues."
      clca="Re-baseline those queues' plans using the last two quarters of actuals."
      table={table}
      info="The queues with the largest actual-vs-plan variance, ranked by magnitude regardless of direction.">
      <ResponsiveContainer width="100%" height={230}>
        <ComposedChart data={sorted} layout="vertical" margin={{ top: 4, right: 34, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} horizontal={false} />
          <XAxis type="number" domain={[-domainMax, domainMax]} ticks={ticks} tick={{ fill: C.tick, fontSize: 9 }} axisLine={false} tickLine={false}
            tickFormatter={v => `${v}%`} />
          <YAxis type="category" dataKey="cqn" tick={<QueueTick />} width={148} axisLine={false} tickLine={false} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <ReferenceLine x={0} stroke="rgba(255,255,255,0.15)" />
          <Bar dataKey="variance" name="Variance %" radius={[3,3,3,3]} maxBarSize={20}>
            {sorted.map((d, i) => <Cell key={i} fill={d.variance >= 0 ? C.ahead : C.behind} opacity={0.9} />)}
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

export default function Layer2ActualVsPlan({ filters, granularity }) {
  const [open, setOpen] = useState(true)
  // Multi-select Plan (2026-07-30, was a single pre-picked string; now defaults to
  // empty/"Select Plan" like every other Plan dropdown in this rollout) — shared
  // across all 3 visuals, same as before. Still syncs from the top filter panel's
  // own Plan Name field when that's set, now wrapped in an array.
  const [selectedPlans, setSelectedPlans] = useState([])

  useEffect(() => {
    const picked = filters.planName?.[0]
    if (picked && PLANS.includes(picked)) setSelectedPlans([picked])
  }, [filters.planName])

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
      <div className="layer-header" onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, color: '#070f1a', background: '#34d399',
            borderRadius: 4, padding: '2px 7px', letterSpacing: '0.04em',
          }}>02</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Actual vs Plan
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>— adherence tracking</span>
        </div>
        <span style={{ fontSize: 11, color: '#34d399', transform: open ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▲</span>
      </div>
      {open && (
        <div style={{ padding: 12, display: 'flex', gap: 10 }}>
          <Visual1 filters={filters} granularity={granularity} selectedPlans={selectedPlans} onPlansChange={setSelectedPlans} />
          <Visual2 filters={filters} granularity={granularity} selectedPlans={selectedPlans} onPlansChange={setSelectedPlans} />
          <Visual3 filters={filters} selectedPlans={selectedPlans} onPlansChange={setSelectedPlans} />
        </div>
      )}
    </div>
  )
}
