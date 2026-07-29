import React, { useState } from 'react'
import TsaFilterPanel from '../tsa/TsaFilterPanel'
import TsaCapacityMetricCards from './TsaCapacityMetricCards'
import HeadcountAttritionLayer from './HeadcountAttritionLayer'
import PlanOverPlanVariationLayer from './PlanOverPlanVariationLayer'
import WorkloadDistributionLayer from './WorkloadDistributionLayer'
import WorkloadActPerformanceTable from './WorkloadActPerformanceTable'
import TsaCapacityGeoMap from './TsaCapacityGeoMap'
import SectionDivider from '../SectionDivider'

// Same filter field set as TSA Forecasting (LOB / FY-Qtr-Month-Week / Business
// Partner / Global Grouping) — TsaFilterPanel is reused directly rather than
// duplicated, since it's a stateless controlled component with no page-specific
// hardcoding.
const DEFAULT_FILTERS = {
  lob: [],
  fiscalYear: [],
  fiscalQuarter: [],
  fiscalMonth: [],
  fiscalWeek: [],
  businessPartner: [],
  globalGrouping: [],
}

export default function TsaCapacityPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [granularity, setGranularity] = useState(null)

  return (
    <>
      <TsaFilterPanel filters={filters} onChange={setFilters} granularity={granularity} onGranularityChange={setGranularity} />

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
