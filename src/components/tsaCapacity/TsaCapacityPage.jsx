import React, { useState } from 'react'
import TsaFilterPanel from '../tsa/TsaFilterPanel'
import TsaCapacityMetricCards from './TsaCapacityMetricCards'
import HeadcountAttritionLayer from './HeadcountAttritionLayer'
import PlanOverPlanVariationLayer from './PlanOverPlanVariationLayer'
import WorkloadDistributionLayer from './WorkloadDistributionLayer'
import WorkloadActPerformanceTable from './WorkloadActPerformanceTable'
import TsaCapacityGeoMap from './TsaCapacityGeoMap'
import SectionDivider from '../SectionDivider'

// Filter field set as TSA Forecasting's, MINUS LOB and Global Grouping and PLUS
// Queue (2026-09-03, per direct request) — TsaFilterPanel is reused directly rather
// than duplicated, since it's a stateless controlled component with no page-specific
// hardcoding; the new `includeLob={false}`/`includeGlobalGrouping={false}`/
// `includeQueue` props below configure it for this page specifically. Dropping LOB
// doesn't lose real narrowing power here: every chart on this page already funnels
// through tsaData.js's filterLobs(), which already applies the Queue filter (via
// matchesQueueFilter) — so Queue effectively takes over LOB's old role as this
// page's own "scope" control, using the exact mechanism HES Forecasting's own Queue
// filter already proved out.
const DEFAULT_FILTERS = {
  queue: [],
  fiscalYear: [],
  fiscalQuarter: [],
  fiscalMonth: [],
  fiscalWeek: [],
  businessPartner: [],
}

export default function TsaCapacityPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [granularity, setGranularity] = useState(null)

  return (
    <>
      <TsaFilterPanel filters={filters} onChange={setFilters} granularity={granularity} onGranularityChange={setGranularity}
        includeQueue includeLob={false} includeGlobalGrouping={false} />

      <SectionDivider label="Key Metrics" />
      <TsaCapacityMetricCards filters={filters} granularity={granularity} />

      <SectionDivider label="Analysis Layers" />
      <div className="px-4 pb-4 flex flex-col gap-3">
        <HeadcountAttritionLayer filters={filters} granularity={granularity} />
        <PlanOverPlanVariationLayer filters={filters} granularity={granularity} />
        <WorkloadDistributionLayer filters={filters} granularity={granularity} />
        <WorkloadActPerformanceTable filters={filters} />
        <TsaCapacityGeoMap filters={filters} />
      </div>
    </>
  )
}
