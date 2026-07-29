import React, { useMemo, useState } from 'react'
import { asuSrPerformanceByLob } from '../../data/tsaData'
import { PLAN_NAMES } from '../../data/mockData'
import PerformanceMatrixTable from '../PerformanceMatrixTable'

// "ASU Performance" / "SR Performance" (2026-07-29) — one toggle-driven table above
// the Geo Map, per direct request modeled on 2 real BI report screenshots (Fiscal
// Quarter groups × Actual/Plan/Adherence%, LOB rows). Reuses this page's own LOB_LIST
// roster (via filterLobs, already wired into every filter on this page) rather than
// a disconnected new name list, so the LOB filter genuinely narrows these rows too.
export default function AsuSrPerformanceTable({ filters }) {
  const [metric, setMetric] = useState('ASU')
  const [plan, setPlan] = useState(PLAN_NAMES[0])

  const rows = useMemo(() => asuSrPerformanceByLob(filters, metric, plan), [filters, metric, plan])

  return (
    <PerformanceMatrixTable
      title={metric === 'SR' ? 'SR Performance' : 'ASU Performance'}
      infoText="Real per-LOB Actual vs Plan (selected Plan Name), by fiscal quarter, with adherence %."
      leftMetric="ASU" rightMetric="SR" metric={metric} onMetricChange={setMetric}
      planOptions={PLAN_NAMES} plan={plan} onPlanChange={setPlan}
      actualLabel={`${metric} Actuals`} planLabel={`${metric} Plan`}
      rows={rows}
    />
  )
}
