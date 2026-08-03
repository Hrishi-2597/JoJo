import React, { useState, useMemo } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { PLAN_NAMES } from '../../data/mockData'
import { srByFY, srPlanVsPlanByFY, srRegionPlans, srLobImpact } from '../../data/tsaData'
import { contributingFactors, FACTOR_TABLE_COLUMNS } from '../../data/insightFactors'
import { C, Visual, Tip, PlanDropdowns, PlanSelect, planSeriesColor, planVsPlanSeriesColor } from './TsaChartKit'

const PLANS = PLAN_NAMES.filter(p => p !== 'Actual')

// This page's own Plan Impact region set (AMER/APJ/EMEA/Global, see tsaData's
// IMPACT_REGIONS) is its own 4-region taxonomy, distinct from the 5-region
// NAMER/LATAM/APJ/EMEA/Global set the Holiday Calendar (and insightFactors' real-
// holiday lookup) uses — AMER maps onto NAMER for that lookup, APJ/EMEA match
// directly, Global has no clean match.
const HOLIDAY_REGION_MAP = { AMER: 'NAMER', APJ: 'APJ', EMEA: 'EMEA', Global: null }

// See AsuLayer.jsx's Visual1 for the full rationale — same multi-select Plan Name
// treatment (2026-07-30): empty selection shows the baseline Plan; 1 selected plan
// renders identically to the old single-select behavior; 2+ add one Plan bar per
// plan (planSeriesColor) and drop the Adherence line.
function Visual1({ filters, granularity, selectedPlans, onPlansChange }) {
  const plans = selectedPlans.length ? selectedPlans : [undefined]
  const perPlan = useMemo(() => plans.map(p => srByFY(filters, granularity, p)), [filters, granularity, plans])
  const data = useMemo(() => perPlan[0].map((row, i) => {
    const out = { period: row.period, actual: row.actual }
    plans.forEach((p, pi) => { out[`plan_${pi}`] = perPlan[pi][i].plan })
    if (plans.length === 1) out.adherence = perPlan[0][i].adherence
    return out
  }), [perPlan, plans])
  const table = useMemo(() => ({
    title: 'What contributed, by period',
    columns: FACTOR_TABLE_COLUMNS,
    rows: data.flatMap(d => contributingFactors(d.period, null, 1).map(f => ({ ...f, factor: `${d.period} — ${f.factor}` }))),
  }), [data])
  return (
    <Visual title="Actuals vs Plan Comparison" controls={<PlanSelect label="Plan Name" value={selectedPlans} onChange={onPlansChange} options={PLANS} />}
      info="SR actuals vs the selected plan(s) by fiscal period, with percent adherence shown when exactly one plan is selected."
      rca="SR actuals are outpacing plan as case complexity rises."
      clca="Add a complexity-adjusted buffer to the SR plan."
      table={table} comingSoon>
      <ResponsiveContainer width="100%" height={222}>
        <ComposedChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="l" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
          <YAxis yAxisId="r" orientation="right" domain={[60,110]} tick={{ fill: C.trend, fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={v => `${v}%`} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <ReferenceLine yAxisId="r" y={100} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 3" />
          <Bar yAxisId="l" dataKey="actual" name="Actuals" fill={C.metric1} opacity={0.8} radius={[3,3,0,0]} maxBarSize={40} />
          {plans.map((p, pi) => {
            const { color, opacity } = planSeriesColor(pi)
            return <Bar key={pi} yAxisId="l" dataKey={`plan_${pi}`} name={p ? `Plan (${p})` : 'Plan'} fill={color} opacity={opacity} radius={[3,3,0,0]} maxBarSize={40} />
          })}
          {plans.length === 1 && (
            <Line yAxisId="r" type="monotone" dataKey="adherence" name="Adherence %"
              stroke={C.trend} strokeWidth={2} dot={{ r: 3, fill: C.trend, strokeWidth: 0 }} activeDot={{ r: 5 }} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </Visual>
  )
}

// See AsuLayer.jsx's Visual2 for the full rationale — same multi-select Plan A/
// Plan B treatment (2026-07-31): each side calls srPlanVsPlanByFY independently
// (plan1 depends only on planA, plan2 only on planB), one extra bar per selected
// plan on each side, Variance % line only when exactly one plan is selected on
// each side.
function Visual2({ filters, granularity, plansA, plansB, onPlansChange }) {
  const aPlans = plansA.length ? plansA : [undefined]
  const bPlans = plansB.length ? plansB : [undefined]
  const perA = useMemo(() => aPlans.map(p => srPlanVsPlanByFY(filters, granularity, p, undefined)), [filters, granularity, aPlans])
  const perB = useMemo(() => bPlans.map(p => srPlanVsPlanByFY(filters, granularity, undefined, p)), [filters, granularity, bPlans])
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
    rows: data.flatMap(d => contributingFactors(d.period, null, 1).map(f => ({ ...f, factor: `${d.period} — ${f.factor}` }))),
  }), [data])
  return (
    <Visual title="Plan vs Plan Comparison" controls={<PlanDropdowns planA={plansA} planB={plansB} onChange={onPlansChange} options={PLANS} />}
      info="SR compared between the selected Plan A/Plan B plans by fiscal period, with percent variance shown when exactly one plan is selected on each side."
      rca="Plan variance for SR is widest in the most recent quarter."
      clca="Reconcile plans against the latest actuals before the next AOP cycle."
      table={table} comingSoon>
      <ResponsiveContainer width="100%" height={222}>
        <ComposedChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="l" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
          <YAxis yAxisId="r" orientation="right" tick={{ fill: C.trend, fontSize: 10 }} axisLine={false} tickLine={false}
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
            <Line yAxisId="r" type="monotone" dataKey="variance" name="Variance %" stroke={C.trend}
              strokeWidth={2} dot={{ r: 3, fill: C.trend, strokeWidth: 0 }} activeDot={{ r: 5 }} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </Visual>
  )
}

// See AsuLayer.jsx's Visual3 for the full rationale — srRegionPlans/srLobImpact are
// confirmed cosmetic (static, no plan dependency), so this stays
// first-selected-plan-only for labels only.
function Visual3({ filters, plansA, plansB, onPlansChange }) {
  const planA = plansA[0]
  const planB = plansB[0]
  const [selectedRegion, setSelectedRegion] = useState(null)
  const data = useMemo(() => srRegionPlans(filters), [filters])
  const lobImpact = useMemo(() => selectedRegion ? srLobImpact(selectedRegion) : [], [selectedRegion])
  const table = useMemo(() => ({
    title: 'What contributed, by region',
    columns: FACTOR_TABLE_COLUMNS,
    rows: data.flatMap(d => contributingFactors(d.region, HOLIDAY_REGION_MAP[d.region] ?? null, 1).map(f => ({ ...f, factor: `${d.region} — ${f.factor}` }))),
  }), [data])

  return (
    <Visual title="Plan Impact" subtitle="Click a region to see which LOBs contributed"
      controls={<PlanDropdowns planA={plansA} planB={plansB} onChange={onPlansChange} options={PLANS} />}
      info="Each region's SR gap between the two selected plans; click a region to see contributing LOBs."
      rca="SR impact concentrates in a small number of LOBs per region."
      clca="Prioritize staffing reviews for the top LOBs in the highest-impact region."
      table={table} comingSoon>
      <ResponsiveContainer width="100%" height={selectedRegion ? 140 : 210}>
        <ComposedChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} />
          <XAxis dataKey="region" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Bar dataKey="planA" name={planA || 'Plan A'} fill={C.metric1} opacity={0.8} radius={[3,3,0,0]} maxBarSize={40}
            onClick={d => setSelectedRegion(prev => prev === d.region ? null : d.region)} style={{ cursor: 'pointer' }} />
          <Bar dataKey="planB" name={planB || 'Plan B'} fill={C.metric2} opacity={0.8} radius={[3,3,0,0]} maxBarSize={40}
            onClick={d => setSelectedRegion(prev => prev === d.region ? null : d.region)} style={{ cursor: 'pointer' }} />
        </ComposedChart>
      </ResponsiveContainer>

      {selectedRegion && (
        <div className="animate-fade-in" style={{ marginTop: 4 }}>
          <p style={{ fontSize: 9.5, color: 'var(--text-faint)', marginBottom: 4, textAlign: 'center' }}>
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>{selectedRegion}</span> — LOB contribution to the gap
          </p>
          <div style={{ maxHeight: 130, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {lobImpact.map((l, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, padding: '2px 4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{l.lob}</span>
                <span style={{ fontWeight: 600, color: l.delta >= 0 ? C.ahead : C.behind }}>
                  {l.delta > 0 ? '+' : ''}{l.delta}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Visual>
  )
}

export default function SrLayer({ filters, granularity }) {
  const [open, setOpen] = useState(true)
  const [selectedPlans, setSelectedPlans] = useState([])
  const [plans, setPlans] = useState({ planA: [], planB: [] })
  const handlePlanChange = (key, val) => setPlans(p => ({ ...p, [key]: val }))

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
      <div className="layer-header" onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#070f1a', background: '#34d399', borderRadius: 4, padding: '2px 7px', letterSpacing: '0.04em' }}>02</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>SR Trend</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>— service request tracking</span>
        </div>
        <span style={{ fontSize: 11, color: '#34d399', transform: open ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▲</span>
      </div>
      {open && (
        <div style={{ padding: 12, display: 'flex', gap: 10 }}>
          <Visual1 filters={filters} granularity={granularity} selectedPlans={selectedPlans} onPlansChange={setSelectedPlans} />
          <Visual2 filters={filters} granularity={granularity} plansA={plans.planA} plansB={plans.planB} onPlansChange={handlePlanChange} />
          <Visual3 filters={filters} plansA={plans.planA} plansB={plans.planB} onPlansChange={handlePlanChange} />
        </div>
      )}
    </div>
  )
}
