import React, { useState } from 'react'
import TsaFilterPanel from './TsaFilterPanel'
import TsaMetricCards from './TsaMetricCards'
import AsuLayer from './AsuLayer'
import SrLayer from './SrLayer'
import AsuSrTrendLayer from './AsuSrTrendLayer'
import AsuSrPerformanceTable from './AsuSrPerformanceTable'
import TsaGeoMap from './TsaGeoMap'
import SectionDivider from '../SectionDivider'

// Every filter is multi-select: [] means "no selection = All" — same convention as
// the Forecasting page's filters.
const DEFAULT_FILTERS = {
  lob: [],
  fiscalYear: [],
  fiscalQuarter: [],
  fiscalMonth: [],
  fiscalWeek: [],
  businessPartner: [],
  globalGrouping: [],
}

export default function TsaForecastingPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  // Page-wide "view by" granularity — Quarter/Month/Week — separate from the value
  // filters above: it changes what axis every time-series chart renders at, not
  // which rows are in scope. Defaults to null (= Fiscal Year, every chart's original
  // behavior) — nothing is pre-selected, same as the value filters above defaulting
  // to "All". See design_choice.md for why it isn't one of the MultiSelectField filters.
  const [granularity, setGranularity] = useState(null)

  return (
    <>
      <TsaFilterPanel filters={filters} onChange={setFilters} granularity={granularity} onGranularityChange={setGranularity} />

      <SectionDivider label="Key Metrics" />
      <TsaMetricCards filters={filters} granularity={granularity} />

      <SectionDivider label="Analysis Layers" />
      <div className="px-4 pb-4 flex flex-col gap-3">
        <AsuLayer filters={filters} granularity={granularity} />
        <SrLayer filters={filters} granularity={granularity} />
        <AsuSrTrendLayer filters={filters} granularity={granularity} />
        <AsuSrPerformanceTable filters={filters} />
        <TsaGeoMap filters={filters} />
      </div>
    </>
  )
}
