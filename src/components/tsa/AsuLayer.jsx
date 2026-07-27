import React, { useEffect, useMemo, useState } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { PLAN_NAMES } from '../../data/mockData'
import { asuByFY, asuPlanVsPlanByFY, asuRegionPlans, asuLobImpact, IMPACT_REGIONS } from '../../data/tsaData'
import { contributingFactors, FACTOR_TABLE_COLUMNS } from '../../data/insightFactors'
import { C, Visual, Tip, PlanDropdowns, PlanSelect } from './TsaChartKit'

const PLANS = PLAN_NAMES.filter(p => p !== 'Actual')

// This page's own Plan Impact region set (IMPACT_REGIONS = AMER/APJ/EMEA/Global) is
// its own 4-region taxonomy, distinct from the 5-region NAMER/LATAM/APJ/EMEA/Global
// set the Holiday Calendar (and insightFactors' real-holiday lookup) uses — AMER maps
// onto NAMER for that lookup, APJ/EMEA match directly, Global has no clean match.
const HOLIDAY_REGION_MAP = { AMER: 'NAMER', APJ: 'APJ', EMEA: 'EMEA', Global: null }

function Visual1({ filters, granularity, selectedPlan, onPlanChange }) {
  const data = useMemo(() => asuByFY(filters, granularity), [filters, granularity])
  const table = useMemo(() => ({
    title: 'What contributed, by period',
    columns: FACTOR_TABLE_COLUMNS,
    rows: data.flatMap(d => contributingFactors(d.period, null, 1).map(f => ({ ...f, factor: `${d.period} — ${f.factor}` }))),
  }), [data])
  return (
    <Visual title="Actuals vs Plan Comparison" controls={<PlanSelect label="Plan Name" value={selectedPlan} onChange={onPlanChange} options={PLANS} />}
      info="ASU actuals vs the selected plan by fiscal period, with percent adherence."
      rca="ASU actuals are trending below plan in the most recent fiscal year."
      clca="Re-forecast ASU using the latest onboarding velocity before the next lock."
      table={table}>
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
          <Bar yAxisId="l" dataKey="plan"   name="Plan"    fill={C.metric2} opacity={0.8} radius={[3,3,0,0]} maxBarSize={40} />
          <Line yAxisId="r" type="monotone" dataKey="adherence" name="Adherence %"
            stroke={C.trend} strokeWidth={2} dot={{ r: 3, fill: C.trend, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </Visual>
  )
}

function Visual2({ filters, granularity, planA, planB, onPlanChange }) {
  const data = useMemo(() => asuPlanVsPlanByFY(filters, granularity), [filters, granularity])
  const table = useMemo(() => ({
    title: 'What contributed, by period',
    columns: FACTOR_TABLE_COLUMNS,
    rows: data.flatMap(d => contributingFactors(d.period, null, 1).map(f => ({ ...f, factor: `${d.period} — ${f.factor}` }))),
  }), [data])
  return (
    <Visual title="Plan vs Plan Comparison" controls={<PlanDropdowns planA={planA} planB={planB} onChange={onPlanChange} options={PLANS} />}
      info="ASU compared between two selected plans by fiscal period, with percent variance."
      rca="Plan B consistently understates ASU relative to Plan A."
      clca="Reconcile the two plans against actuals before selecting a primary."
      table={table}>
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
          <Bar yAxisId="l" dataKey="plan1" name={planA} fill={C.metric1} opacity={0.8} radius={[3,3,0,0]} maxBarSize={40} />
          <Bar yAxisId="l" dataKey="plan2" name={planB} fill={C.metric2} opacity={0.8} radius={[3,3,0,0]} maxBarSize={40} />
          <Line yAxisId="r" type="monotone" dataKey="variance" name="Variance %" stroke={C.trend}
            strokeWidth={2} dot={{ r: 3, fill: C.trend, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </Visual>
  )
}

// Click a region's bar to drill into which LOBs contributed to that region's Plan A
// vs Plan B gap — same "click to narrow, inline panel" pattern as the Forecasting
// page's Total Queues donut and CQN Variance year-modal.
function Visual3({ filters, planA, planB, onPlanChange }) {
  const [selectedRegion, setSelectedRegion] = useState(null)
  const data = useMemo(() => asuRegionPlans(filters), [filters])
  const lobImpact = useMemo(() => selectedRegion ? asuLobImpact(selectedRegion) : [], [selectedRegion])
  const table = useMemo(() => ({
    title: 'What contributed, by region',
    columns: FACTOR_TABLE_COLUMNS,
    rows: data.flatMap(d => contributingFactors(d.region, HOLIDAY_REGION_MAP[d.region] ?? null, 1).map(f => ({ ...f, factor: `${d.region} — ${f.factor}` }))),
  }), [data])

  return (
    <Visual title="Plan Impact" subtitle="Click a region to see which LOBs contributed"
      controls={<PlanDropdowns planA={planA} planB={planB} onChange={onPlanChange} options={PLANS} />}
      info="Each region's ASU gap between the two selected plans; click a region to see contributing LOBs."
      rca="A few LOBs drive most of each region's ASU impact."
      clca="Focus region reviews on the top-contributing LOBs shown here."
      table={table}>
      <ResponsiveContainer width="100%" height={selectedRegion ? 140 : 210}>
        <ComposedChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} />
          <XAxis dataKey="region" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Bar dataKey="planA" name={planA} fill={C.metric1} opacity={0.8} radius={[3,3,0,0]} maxBarSize={40}
            onClick={d => setSelectedRegion(prev => prev === d.region ? null : d.region)} style={{ cursor: 'pointer' }} />
          <Bar dataKey="planB" name={planB} fill={C.metric2} opacity={0.8} radius={[3,3,0,0]} maxBarSize={40}
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

export default function AsuLayer({ filters, granularity }) {
  const [open, setOpen] = useState(true)
  const [plan, setPlan] = useState('FY27 Q1 APR Plan')
  const [plans, setPlans] = useState({ planA: 'AOP_FY26Q4_AA', planB: 'FY27 Q1 APR Plan' })
  const handlePlanChange = (key, val) => setPlans(p => ({ ...p, [key]: val }))

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
      <div className="layer-header" onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#070f1a', background: '#38bdf8', borderRadius: 4, padding: '2px 7px', letterSpacing: '0.04em' }}>01</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ASU Trend</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>— Active Service Unit tracking</span>
        </div>
        <span style={{ fontSize: 11, color: '#38bdf8', transform: open ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▲</span>
      </div>
      {open && (
        <div style={{ padding: 12, display: 'flex', gap: 10 }}>
          <Visual1 filters={filters} granularity={granularity} selectedPlan={plan} onPlanChange={setPlan} />
          <Visual2 filters={filters} granularity={granularity} planA={plans.planA} planB={plans.planB} onPlanChange={handlePlanChange} />
          <Visual3 filters={filters} planA={plans.planA} planB={plans.planB} onPlanChange={handlePlanChange} />
        </div>
      )}
    </div>
  )
}
