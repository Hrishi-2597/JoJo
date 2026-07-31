import React, { useMemo, useState } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  fteByFY, tsaAttritionByDimension, tsaAttritionTrendByDimension,
} from '../../data/tsaCapacityData'
import { CAPACITY_PLAN_NAMES } from '../../data/mockData'
import { contributingFactors, FACTOR_TABLE_COLUMNS } from '../../data/insightFactors'
import { C, Visual, Tip, PlanSelect, BinaryToggle, PillButton, planSeriesColor } from '../ChartKit'

// Plan A/B-style pickers exclude 'Actual' the same way Forecasting's plan dropdowns
// already do (see mockData.js's CAPACITY_PLAN_NAMES comment) — this page's own bars
// already show Actual separately, so the picker only needs to offer named plan
// vintages to compare it against.
const PLANS = CAPACITY_PLAN_NAMES.filter(p => p !== 'Actual')

// Multi-select Plan (2026-07-30) — same full N-series treatment as AsuLayer.jsx's
// Visual1: empty selection shows the baseline Plan FTE; 1 plan renders identically
// to the old single-select behavior; 2+ add one Plan FTE bar per plan and drop the
// Variation % line.
function Visual1({ filters, granularity, selectedPlans, onPlansChange }) {
  const plans = selectedPlans.length ? selectedPlans : [undefined]
  const perPlan = useMemo(() => plans.map(p => fteByFY(filters, granularity, p)), [filters, granularity, plans])
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
    <Visual title="Actual vs Plan Variation" controls={<PlanSelect label="Plan" value={selectedPlans} onChange={onPlansChange} options={PLANS} />}
      info="Compares actual FTE staffing against the selected plan vintage(s), period by period, with a Variation % line shown when exactly one plan is selected."
      rca="Staffing variation widens in quarters right after a hiring freeze."
      clca="Smooth headcount ramp-up across quarters instead of freeze/unfreeze cycles."
      table={table}>
      <ResponsiveContainer width="100%" height={222}>
        <ComposedChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="l" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="r" orientation="right" tick={{ fill: C.trend, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Bar yAxisId="l" dataKey="actual" name="Actual FTE" fill={C.metric1} opacity={0.8} radius={[3,3,0,0]} maxBarSize={40} />
          {plans.map((p, pi) => {
            const { color, opacity } = planSeriesColor(pi)
            return <Bar key={pi} yAxisId="l" dataKey={`plan_${pi}`} name={p ? `Plan FTE (${p})` : 'Plan FTE'} fill={color} opacity={opacity} radius={[3,3,0,0]} maxBarSize={40} />
          })}
          {plans.length === 1 && (
            <Line yAxisId="r" type="monotone" dataKey="adherence" name="Variation %" stroke={C.trend} strokeWidth={2} dot={{ r: 3, fill: C.trend, strokeWidth: 0 }} activeDot={{ r: 5 }} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </Visual>
  )
}

// Custom tooltip so the raw attrition headcount (not just the %) is always visible —
// same "attrition % along with original number" treatment as MSG Capacity Plan.
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
// into that key's own FY/granularity trend — same click-to-drill mechanic as MSG
// Capacity Plan's Attrition visual (and TSA Forecasting's own CPASU Trend).
function Visual2({ filters, granularity }) {
  const [dimension, setDimension] = useState('Region')
  const [selectedKey, setSelectedKey] = useState(null)
  const dimLabel = dimension === 'SubRegion' ? 'Sub-region' : 'Region'
  const dimData = useMemo(() => tsaAttritionByDimension(filters, dimension), [filters, dimension])
  const trendData = useMemo(
    () => (selectedKey ? tsaAttritionTrendByDimension(filters, selectedKey, dimension, granularity) : []),
    [filters, selectedKey, dimension, granularity]
  )
  const handleDimensionChange = val => {
    setDimension(val === 'Sub-region' ? 'SubRegion' : 'Region')
    setSelectedKey(null)
  }

  const data = selectedKey ? trendData : dimData
  const xKey = selectedKey ? 'period' : 'key'
  const handleBarClick = selectedKey ? undefined : (d => setSelectedKey(d.key))

  // Always built off the region/sub-region breakdown (not the drilled-into trend),
  // same "explain the overall split" scope as the chart's own default view — a real
  // region name is only passed in Region view since sub-region labels don't map onto
  // the Holiday Calendar's 3-region taxonomy (see insightFactors.js).
  const table = useMemo(() => ({
    title: `What contributed, by ${dimLabel.toLowerCase()}`,
    columns: FACTOR_TABLE_COLUMNS,
    rows: dimData.flatMap(d => contributingFactors(d.key, dimension === 'Region' ? d.key : null, 1).map(f => ({ ...f, factor: `${d.key} — ${f.factor}` }))),
  }), [dimData, dimension, dimLabel])

  return (
    <Visual title="Attrition"
      subtitle={selectedKey ? `${selectedKey} — attrition trend` : `Click a ${dimLabel.toLowerCase()} to see its trend`}
      cornerControls={<BinaryToggle leftLabel="Region" rightLabel="Sub-region" value={dimLabel} onChange={handleDimensionChange} />}
      controls={selectedKey && <PillButton onClick={() => setSelectedKey(null)}>← All {dimLabel}s</PillButton>}
      info="Headcount and attrition % by region or sub-region; click a bar to see that key's own trend."
      rca="Attrition is highest in sub-regions with the longest backfill lead time."
      clca="Shorten the backfill pipeline for the sub-regions driving attrition."
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

export default function HeadcountAttritionLayer({ filters, granularity }) {
  const [open, setOpen] = useState(true)
  const [selectedPlans, setSelectedPlans] = useState([])

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
      <div className="layer-header" onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#070f1a', background: '#38bdf8', borderRadius: 4, padding: '2px 7px', letterSpacing: '0.04em' }}>01</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Headcount and Attrition</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>— staffing &amp; attrition</span>
        </div>
        <span style={{ fontSize: 11, color: '#38bdf8', transform: open ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▲</span>
      </div>
      {open && (
        <div style={{ padding: 12, display: 'flex', gap: 10 }}>
          <Visual1 filters={filters} granularity={granularity} selectedPlans={selectedPlans} onPlansChange={setSelectedPlans} />
          <Visual2 filters={filters} granularity={granularity} />
        </div>
      )}
    </div>
  )
}
