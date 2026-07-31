import React, { useMemo, useState } from 'react'
import { workloadActPerformanceByLob } from '../../data/tsaCapacityData'
import { CAPACITY_PLAN_NAMES } from '../../data/mockData'
import PerformanceMatrixTable from '../PerformanceMatrixTable'

// Capacity's own Plan Name dropdown convention excludes 'Actual' (it's the implicit
// baseline every other Plan-scaled selector on this page already treats it as) —
// same PLANS-filtering idiom HeadcountAttritionLayer/PlanOverPlanVariationLayer use.
const PLANS = CAPACITY_PLAN_NAMES.filter(p => p !== 'Actual')

// "Workload Performance" / "ACT Performance" (2026-07-29) — one toggle-driven table
// above the Geo Map, per direct request modeled on 2 real BI report screenshots
// (Fiscal Quarter groups × Actual/Plan/Adherence%, LOB rows), same shape as HES
// Forecasting's ASU/SR Performance table (shared PerformanceMatrixTable component).
export default function WorkloadActPerformanceTable({ filters }) {
  const [metric, setMetric] = useState('Workload')
  // Multi-select Plan (2026-07-30) — same first-selected-plan simplification as
  // AsuSrPerformanceTable.jsx (matrix table, one Plan column per quarter).
  const [selectedPlans, setSelectedPlans] = useState([])
  const plan = selectedPlans[0]

  const rows = useMemo(() => workloadActPerformanceByLob(filters, metric, plan), [filters, metric, plan])

  return (
    <PerformanceMatrixTable
      title={metric === 'ACT' ? 'ACT Performance' : 'Workload Performance'}
      infoText="Real per-LOB Actual vs Plan (selected Plan Name), by fiscal quarter, with adherence %."
      leftMetric="Workload" rightMetric="ACT" metric={metric} onMetricChange={setMetric}
      planOptions={PLANS} plan={selectedPlans} onPlanChange={setSelectedPlans}
      actualLabel="Actual" planLabel="Plan"
      rows={rows}
    />
  )
}
