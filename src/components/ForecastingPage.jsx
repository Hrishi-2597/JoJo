import React, { useState } from 'react'
import FilterPanel from './FilterPanel'
import MetricCards from './MetricCards'
import Layer1PlanOverPlan from './Layer1PlanOverPlan'
import Layer2ActualVsPlan from './Layer2ActualVsPlan'
import Layer3GeoMap from './Layer3GeoMap'
import QueuePerformanceTable from './QueuePerformanceTable'
import SectionDivider from './SectionDivider'

// Every filter below is multi-select: [] means "no selection = All". DB/OSP alone stays
// a single string since it's a 3-way segmented pill, not a searchable dropdown.
const DEFAULT_FILTERS = {
  cqn:            [],
  capacityCode:   [],
  planName:       [],
  fiscalYear:     [],
  fiscalQuarter:  [],
  fiscalWeek:     [],
  channel:        [],
  businessPartner:[],
  region:         [],
  subRegion:      [],
  l5Manager:      [],
  dbOsp:          'DB',
}

export default function ForecastingPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  // Page-wide "view by" granularity — Quarter/Month/Week — separate from the value
  // filters above: it changes what axis every time-series chart renders at, not
  // which rows are in scope. Defaults to null (= Fiscal Year, every chart's original
  // behavior) — nothing is pre-selected, same as the value filters above defaulting
  // to "All". See design_choice.md for why it isn't one of the MultiSelectField filters.
  const [granularity, setGranularity] = useState(null)

  return (
    <>
      {/* ── Filters ──────────────────────────────────────────────── */}
      <FilterPanel filters={filters} onChange={setFilters} granularity={granularity} onGranularityChange={setGranularity} />

      {/* ── KPI Cards — full width, cards sit alone here ────────────── */}
      <SectionDivider label="Key Metrics" />
      <MetricCards filters={filters} granularity={granularity} />

      {/* ── Analysis Layers — RCA/CLCA now lives on each graph's "i" button ── */}
      <SectionDivider label="Analysis Layers" />
      <div className="px-4 pb-4 flex flex-col gap-3">
        <Layer1PlanOverPlan filters={filters} granularity={granularity} />
        <Layer2ActualVsPlan filters={filters} granularity={granularity} />
        <QueuePerformanceTable filters={filters} granularity={granularity} />
        <Layer3GeoMap filters={filters} granularity={granularity} />
      </div>
    </>
  )
}
