import React, { useMemo, useState } from 'react'
import SectionDivider from '../SectionDivider'

// HES metric glossary (2026-10-15, per direct request: "create a glossary for our HES
// SPOG — like what formulae we used for our current visuals").
//
// Every formula below was read off the actual selectors in src/data/tsaData.js and
// src/data/tsaCapacityData.js rather than written from memory, and each entry names
// the function it comes from so a reader can go verify it. If a selector changes,
// THIS FILE IS NOT AUTOMATICALLY RIGHT — the `source` field is the thing to check
// against. Kept as plain data rather than generated from the code because the
// business-facing wording is the point; the formula is only half of each entry.

// Mechanics that apply across many metrics, pulled out so individual entries don't
// repeat them.
const MECHANICS = [
  {
    term: 'In-scope LOB ratio',
    source: 'tsaData.js · lobScopeRatio()',
    definition:
      'Every volume on HES Forecasting scales with how much of the business the filters leave in view. Narrow to a few LOBs and the volumes shrink proportionally, rather than staying at a full-portfolio number that no longer matches the filter bar.',
    formula: 'ratio = LOBs matching the filters ÷ 33 total LOBs',
  },
  {
    term: 'Fiscal years in scope',
    source: 'tsaData.js · tsaEffectiveFiscalYears()',
    definition:
      'Which years a chart covers is taken from the most specific time filter set, in the order Week → Month → Quarter → Year. Picking FY26Q2 scopes the chart to FY26; picking nothing shows all three years.',
    formula: 'first non-empty of: Fiscal Week → Fiscal Month → Fiscal Quarter → Fiscal Year (else FY25–FY27)',
  },
  {
    term: 'View By — volumes',
    source: 'mockData.js · expandToGranularity()',
    definition:
      'Switching View By to Quarter, Month or Week divides each year\'s volume across its sub-periods, because a volume is additive — four quarters must add back up to the year. A small repeatable variation stops every sub-period being identical.',
    formula: 'sub-period value = FY value ÷ periods per year (4 / 12 / 52) × variation (0.90–1.10)',
  },
  {
    term: 'View By — rates',
    source: 'mockData.js · expandRateToGranularity()',
    definition:
      'Rates behave the opposite way. A percentage, a ratio or an hours-per-case figure is NOT divided when you go from year to quarter — a 7% attrition rate is still roughly 7% in Q1. Dividing it by four would be meaningless, so rates keep their parent year\'s level.',
    formula: 'sub-period value = FY value × variation (0.96–1.04) — never divided',
  },
  {
    term: 'Period-over-period change',
    source: 'tsaData.js / tsaCapacityData.js · yoyPct()',
    definition:
      'The ▲/▼ figure on a KPI card compares the latest period in view with the one before it — at whatever View By is set to, so it is quarter-over-quarter in Quarter view, not always year-over-year. When the filters leave only one period there is nothing to compare, and the card says so instead of showing 0%.',
    formula: 'change % = (current − prior) ÷ prior × 100 · blank when no prior period in scope',
  },
  {
    term: 'Plan Name scaling',
    source: 'tsaData.js · planPerformanceScale()',
    definition:
      'Picking a named plan vintage rescales the Plan series by a factor derived from the plan\'s name, so each named plan is consistently a little higher or lower than the baseline and the same plan always gives the same number.',
    formula: 'factor = 0.88 + (hash of plan name ÷ 96) × 0.24 → roughly 0.88×–1.12×',
  },
]

const FORECASTING = [
  {
    term: 'Total LOB',
    where: ['KPI card'],
    source: 'tsaData.js · tsaCardData().totalLobs',
    definition: 'How many lines of business the current filters leave in view, out of 33.',
    formula: 'count of LOBs matching LOB + Business Partner + Global Grouping + Queue filters',
  },
  {
    term: 'ASU — Active Service Units',
    where: ['KPI card', 'ASU Trend', 'CPASU Trend'],
    source: 'tsaData.js · asuByFY()',
    definition:
      'The installed base under active service. Actuals are the measured figure; Plan is the committed target for the same period, both narrowed to whatever the filters leave in scope.',
    formula: 'Actuals = FY baseline × in-scope LOB ratio\nPlan = FY baseline × in-scope LOB ratio × Plan Name factor',
  },
  {
    term: 'SR — Service Requests',
    where: ['KPI card', 'SR Trend', 'CPASU Trend', 'UCR Impact on SR'],
    source: 'tsaData.js · srByFY()',
    definition: 'Service request volume for the period, on the same Actuals-and-Plan shape as ASU.',
    formula: 'Actuals = FY baseline × in-scope LOB ratio\nPlan = FY baseline × in-scope LOB ratio × Plan Name factor',
  },
  {
    term: 'Adherence %',
    where: ['ASU Trend', 'SR Trend', 'ASU / SR Performance'],
    source: 'tsaData.js · asuByFY() / srByFY()',
    definition:
      'How close actuals landed to plan. 100% is exactly on plan; under 100% means actuals came in below what was planned.',
    formula: 'Adherence % = Actuals ÷ Plan × 100',
  },
  {
    term: 'Variance % (Plan vs Plan)',
    where: ['ASU Trend', 'SR Trend'],
    source: 'tsaData.js · asuPlanVsPlanByFY() / srPlanVsPlanByFY()',
    definition:
      'How far the second plan vintage moved from the first. Positive means Plan B is higher than Plan A for that period.',
    formula: 'Variance % = (Plan B − Plan A) ÷ Plan A × 100',
  },
  {
    term: 'CPASU — Cost Per Active Service Unit',
    where: ['KPI card', 'CPASU Trend'],
    source: 'tsaData.js · cpasuByFY()',
    definition:
      'Service requests raised per unit of installed base — the page\'s cost-to-serve indicator. Lower is better: it means the same installed base is generating fewer requests. Both inputs are actuals, never plan.',
    formula: 'CPASU = SR Actuals ÷ ASU Actuals (2 decimal places)',
  },
  {
    term: 'UCR — Current, Target and Adherence',
    where: ['KPI card', 'UCR Runrate with Target'],
    source: 'tsaData.js · ucrByFY()',
    definition:
      'The UCR runrate against its target for the period. Targets step up across the three years (82% → 85% → 88%). Adherence expresses the runrate as a share of its own target, so 100% means the target was met exactly.',
    formula: 'Adherence % = Current ÷ Target × 100\nUCR is a rate — it is not divided when View By changes',
  },
  {
    term: 'UCR-handled SR (bot deflection)',
    where: ['UCR Impact on SR'],
    source: 'tsaData.js · srBotsByFY()',
    definition:
      'Splits the same SR actual into the share handled by automation and the share still handled by a person. The two segments always add back to the SR total — this is a split of one number, not two separate measures.',
    formula: 'UCR Handled = SR Actuals × 35%\nSR’s (human) = SR Actuals − UCR Handled',
  },
  {
    term: 'DB / OSP split',
    where: ['Service Requests card pop-up'],
    source: 'tsaData.js · srDbOspByFY()',
    definition:
      'The same SR actual split by handling channel — in-house (DB) versus outsourced partner (OSP). The DB share moves period to period rather than sitting at a fixed fraction, so each channel has its own genuine rate of change.',
    formula: 'DB = SR Actuals × DB share (varies 0.62–0.74 by period)\nOSP = SR Actuals − DB',
  },
  {
    term: 'Top non-adherent LOBs',
    where: ['UCR Runrate with Target — bar click'],
    source: 'tsaData.js · topNonAdherentLobsByYear()',
    definition:
      'For a clicked period, the LOBs sitting furthest below that period\'s UCR target, worst first. The gap shown is target minus runrate.',
    formula: 'runrate = target − (2 + ((LOB index × 5 + year index × 11) mod 15) ÷ 2)\nsorted ascending by runrate, top 5',
  },
  {
    term: 'ASU / SR Performance by LOB',
    where: ['ASU / SR Performance table'],
    source: 'tsaData.js · asuSrPerformanceByLob()',
    definition:
      'Breaks the quarterly ASU or SR total down per line of business. Each LOB gets a fixed share, and the shares are computed over the LOBs actually in scope — so the rows always add back to the quarterly total shown on the trend charts above.',
    formula: 'LOB share = LOB weight ÷ total weight of in-scope LOBs\nLOB value = quarter total × share\nweight = 0.5 + ((LOB index × 13) mod 37) ÷ 37 × 2.5',
  },
]

const CAPACITY = [
  {
    term: 'Total Queues',
    where: ['KPI card'],
    source: 'TsaCapacityMetricCards.jsx',
    definition:
      'Active HES queues in view — the full roster of 78 unless specific queues are selected in the filter bar, in which case it counts just those.',
    formula: 'selected queues, else all 78 active queues',
  },
  {
    term: 'Staffing — Actual vs Plan FTE',
    where: ['KPI card', 'Actual vs Plan Variation'],
    source: 'tsaCapacityData.js · fteByFY()',
    definition:
      'Headcount actually in seat against the headcount the plan called for. Understaffing shows as adherence below 100%.',
    formula: 'Adherence % = Actual FTE ÷ Plan FTE × 100',
  },
  {
    term: 'Attrition %',
    where: ['KPI card', 'Attrition'],
    source: 'tsaCapacityData.js · tsaAttritionByFY()',
    definition:
      'The rate at which people are leaving, against a benchmark that tightens across the three years (7.5% → 7.2% → 7.0%). It is a rate, so it holds its level when you change View By rather than being divided down.',
    formula: 'Attrition % = benchmark × variation\nLeavers = Headcount × Attrition % ÷ 100',
  },
  {
    term: 'Attrition by region / sub-region',
    where: ['Attrition — region drill'],
    source: 'tsaCapacityData.js · tsaAttritionByDimension()',
    definition:
      'Spreads the latest period\'s headcount across regions by how much of the in-scope business sits in each, then varies the attrition rate per region so concentration is visible rather than averaged away.',
    formula: 'region share = LOBs in that region ÷ in-scope LOBs\nregion headcount = latest period headcount × share',
  },
  {
    term: 'Cases per FTE',
    where: ['KPI card'],
    source: 'tsaCapacityData.js · cpfByFY()',
    definition:
      'Average cases handled per head, against the planned rate. Running above plan indicates overload rather than productivity, which is why the card flags high values rather than celebrating them.',
    formula: 'Actual and Plan are rates — held at their period level, not divided by View By',
  },
  {
    term: 'Avg Case Time',
    where: ['KPI card'],
    source: 'tsaCapacityData.js · actHrsByFY()',
    definition:
      'Average hours spent per case. Note the adherence here is deliberately INVERTED compared with every other metric on the dashboard, because shorter is better: adherence reads at or above 100% when actual time is at or under plan.',
    formula: 'Adherence % = Plan ÷ Actual × 100  ← inverted on purpose',
  },
  {
    term: 'Plan over Plan variance',
    where: ['Plan over Plan Variation'],
    source: 'tsaCapacityData.js · tsaPlanOverPlanByDimension()',
    definition:
      'Compares two headcount plan vintages for the same region, so you can see what moved between planning cycles rather than only where the latest plan landed.',
    formula: 'Variance % = (Plan B − Plan A) ÷ Plan A × 100\nregion value = latest period plan × region share',
  },
  {
    term: 'CQNs with Highest Variation',
    where: ['Plan over Plan Variation'],
    source: 'tsaCapacityData.js · planOverPlanLobVariance()',
    definition:
      'Ranks entries by how far their two plans diverge, biggest movement first — in either direction, since a plan cut by 15% matters as much as one raised by 15%.',
    formula: 'Variance % = (Plan B − Plan A) ÷ Plan A × 100\nsorted by |Variance %| descending, top 8',
  },
  {
    term: 'Workload Distribution',
    where: ['Workload Distribution'],
    source: 'tsaCapacityData.js · workloadSankey()',
    definition:
      'Traces demand from priority tiers through to the lines of business or queues that absorb it. Flow widths scale with how much of the business the filters leave in view.',
    formula: 'flow = max(1, 120 × in-scope LOB ratio × (0.4 + ((source index × 7 + target index × 11) mod 13) ÷ 20))',
  },
  {
    term: 'Headcount Adherence % (map)',
    where: ['Geo Map'],
    source: 'tsaCapacityData.js · regionHeadcountAdherence()',
    definition:
      'Colours each region by how well staffed it is against plan. This figure carries a deliberate per-LOB spread so regions are genuinely distinguishable on the map; the hover panel\'s per-LOB numbers are the unadjusted ones.',
    formula: 'Adherence % = Σ(LOB actual × spread factor) ÷ Σ(LOB plan) × 100',
  },
]

function Entry({ item }) {
  return (
    <div className="chart-panel" style={{ display: 'grid', gap: 8, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{item.term}</h3>
        {item.where?.map(w => (
          <span key={w} style={{
            fontSize: 9.5, color: 'var(--text-dim)', border: '1px solid var(--border-subtle)',
            borderRadius: 999, padding: '1px 8px', whiteSpace: 'nowrap',
          }}>{w}</span>
        ))}
      </div>
      <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0, maxWidth: '78ch' }}>
        {item.definition}
      </p>
      <pre style={{
        margin: 0, padding: '9px 12px', borderRadius: 6, background: 'var(--bg-inset)',
        border: '1px solid var(--border-subtle)', color: 'var(--text-primary)',
        fontSize: 11.5, lineHeight: 1.6, fontFamily: 'ui-monospace, Consolas, monospace',
        whiteSpace: 'pre-wrap', overflowX: 'auto',
      }}>{item.formula}</pre>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, fontFamily: 'ui-monospace, Consolas, monospace' }}>
        {item.source}
      </p>
    </div>
  )
}

function Group({ label, items }) {
  if (!items.length) return null
  return (
    <>
      <SectionDivider label={label} />
      <div style={{ padding: '0 16px 12px', display: 'grid', gap: 10 }}>
        {items.map(i => <Entry key={i.term} item={i} />)}
      </div>
    </>
  )
}

export default function GlossaryPage() {
  const [q, setQ] = useState('')

  const [mech, fc, cap] = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return [MECHANICS, FORECASTING, CAPACITY]
    const hit = i => [i.term, i.definition, i.formula, i.source, ...(i.where || [])]
      .join(' ').toLowerCase().includes(needle)
    return [MECHANICS.filter(hit), FORECASTING.filter(hit), CAPACITY.filter(hit)]
  }, [q])

  const total = mech.length + fc.length + cap.length

  return (
    <>
      <div style={{ padding: '18px 16px 4px', display: 'grid', gap: 10, maxWidth: 900 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Metric glossary
        </h2>
        <p style={{ fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.55, margin: 0, maxWidth: '72ch' }}>
          What every number on the HES pages means and exactly how it is calculated. Each entry names the
          selector it comes from, so a figure can be traced from the chart back to the code behind it.
        </p>
        <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.55, margin: 0, maxWidth: '72ch' }}>
          Names throughout — lines of business, queues, business partners — are the real
          business-supplied ones. The numeric values are illustrative and deterministic, standing in until
          the live data feeds are connected; the formulae below are what will run against that real data.
        </p>
        <input
          id="glossary-search"
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search a metric, a formula or a chart name…"
          aria-label="Search the glossary"
          className="ms-search"
          style={{ maxWidth: 380, fontSize: 12, padding: '7px 10px' }}
        />
        {q.trim() && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
            {total === 0 ? 'No metric matches that.' : `${total} ${total === 1 ? 'entry' : 'entries'} match.`}
          </p>
        )}
      </div>

      <Group label="How periods and filters work" items={mech} />
      <Group label="HES Forecasting" items={fc} />
      <Group label="HES Capacity Planning" items={cap} />
    </>
  )
}
