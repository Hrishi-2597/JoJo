// Mock data + selectors for the TSA Capacity Plan page (Total FTE / Attrition /
// Cases-per-FTE / Avg Case Time). Its filter set (LOB / FY-Qtr-Month-
// Week / Business Partner / Global Grouping) is IDENTICAL to TSA Forecasting's, so
// this page reuses TSA Forecasting's own LOB fact table, filter function, and
// filter-panel component directly rather than duplicating them — only the metrics
// are new.
import {
  LOB_LIST, GLOBAL_GROUPING_LIST, LOB_FACTS, LOB_QUEUES, filterLobs, tsaEffectiveFiscalYears,
  SR_BY_FY, TSA_ACTIVE_QUEUE_NAMES,
} from './tsaData'
import {
  FISCAL_YEARS, REGIONS, SUB_REGIONS, matchesMulti, expandToGranularity, expandRateToGranularity,
} from './mockData'

function lobScopeRatio(filters) {
  const total = LOB_FACTS.length
  return total ? filterLobs(filters).length / total : 0
}

// Deterministic {key: share} distribution of a LOB set across 'region' or
// 'subRegion' — same role as msgCapacityData.js's shareByKey, backing the
// Attrition and Plan over Plan Variation region/sub-region drills below.
function tsaShareByKey(rows, key) {
  const counts = {}
  rows.forEach(l => { if (l[key] != null) counts[l[key]] = (counts[l[key]] || 0) + 1 })
  const total = rows.length || 1
  return Object.fromEntries(Object.entries(counts).map(([k, c]) => [k, c / total]))
}

// In-scope TSA_CAPACITY_LOBS rows for the current filters (lob/businessPartner/
// globalGrouping) — filterLobs(filters) narrows LOB_FACTS, this maps that back onto
// the capacity-specific per-LOB rows so region/sub-region drills stay filter-aware.
function filterCapacityLobs(filters) {
  const inScope = new Set(filterLobs(filters).map(l => l.lob))
  const rows = TSA_CAPACITY_LOBS.filter(l => inScope.has(l.lob))
  return rows.length ? rows : TSA_CAPACITY_LOBS
}

// ── Total FTE ──────────────────────────────────────────────────────────────
const BASE_FTE_PLAN = { FY25: 460, FY26: 500, FY27: 528 }

// Named-plan scale factors (2026-07-23) — backs both the "Actual vs Plan Variation"
// PlanSelect (HeadcountAttritionLayer) and the Plan A/Plan B PlanDropdowns (Plan over
// Plan Variation layer). Keyed off CAPACITY_PLAN_NAMES (mockData.js) minus 'Actual' —
// each named plan vintage nudges the base FTE plan up/down so picking a different
// plan genuinely changes the numbers, not just the label. `planFyValue`/`lobPlanValue`
// are the shared lookup helpers; a missing/undefined planName falls back to a 1x
// scale so every caller that doesn't pass one keeps its original output (additive).
const PLAN_SCALE_BY_NAME = { 'Dec Plan': 1, 'Jan Plan': 1.04, 'April Plan': 0.97 }

function planFyValue(fy, planName) {
  const scale = planName ? (PLAN_SCALE_BY_NAME[planName] ?? 1) : 1
  return Math.round(BASE_FTE_PLAN[fy] * scale)
}

function lobPlanValue(l, planName) {
  const scale = planName ? (PLAN_SCALE_BY_NAME[planName] ?? 1) : 1
  return Math.round(l.popPlan1 * scale)
}

export const FTE_BY_FY = FISCAL_YEARS.map((fy, i) => ({
  period: fy,
  plan: BASE_FTE_PLAN[fy],
  actual: Math.round(BASE_FTE_PLAN[fy] * (0.90 + (i * 3 % 5) / 100)),
  get adherence() { return +((this.actual / this.plan) * 100).toFixed(1) },
}))

// `planName` (optional, added 2026-07-23) lets HeadcountAttritionLayer's Visual1
// PlanSelect swap which named plan vintage the "plan" bar/adherence line reflects —
// omit it (existing callers, e.g. the cards' FteTrendChart) and behavior is unchanged.
export function fteByFY(filters = {}, granularity, planName) {
  const years = tsaEffectiveFiscalYears(filters)
  const fyRows = FTE_BY_FY.filter(d => years.includes(d.period))
    .map(d => ({ period: d.period, plan: planName ? planFyValue(d.period, planName) : d.plan, actual: d.actual }))
  return expandToGranularity(fyRows, granularity, ['plan', 'actual'])
    .map(d => ({ ...d, adherence: d.plan ? +((d.actual / d.plan) * 100).toFixed(1) : 0 }))
}

// ── Attrition (Layer 1, Visual 2) ──────────────────────────────────────────
const BASE_ATTRITION_BENCH = { FY25: 7.5, FY26: 7.2, FY27: 7.0 }

export const TSA_ATTRITION_BY_FY = FISCAL_YEARS.map((fy, i) => ({
  period: fy,
  headcount: 3000 + ((i * 233) % 1200),
  bench: BASE_ATTRITION_BENCH[fy],
  attrition: +(BASE_ATTRITION_BENCH[fy] * (1.1 + (i * 4 % 6) / 100)).toFixed(1),
}))

export function tsaAttritionByFY(filters = {}, granularity, lens = 'Region') {
  const years = tsaEffectiveFiscalYears(filters)
  const lensScale = lens === 'Country' ? 0.97 : 1
  const fyRows = TSA_ATTRITION_BY_FY.filter(d => years.includes(d.period))
    .map(d => ({ period: d.period, headcount: Math.round(d.headcount * lensScale), attrition: d.attrition, bench: d.bench }))
  const expandedHc = expandToGranularity(fyRows, granularity, ['headcount'])
  // bench (the attrition benchmark target) rides along as a rate field too — added
  // 2026-07-20 so tsaCapacityCardData's Attrition card can read it straight off this
  // granular series instead of falling back to the FY-only raw table.
  const expandedRate = expandRateToGranularity(fyRows, granularity, ['attrition', 'bench'])
  return expandedHc.map((d, i) => ({ ...d, attrition: expandedRate[i].attrition, bench: expandedRate[i].bench }))
}

// Region/Sub-region default view for HeadcountAttritionLayer Visual2 — one row per
// key, sized by each key's share of currently in-scope LOBs; clicking a key drills
// into tsaAttritionTrendByDimension below. Same mechanic as msgCapacityData.js's
// attritionByDimension, adapted to this page's LOB fact table.
export function tsaAttritionByDimension(filters = {}, dimension = 'Region') {
  const key = dimension === 'SubRegion' ? 'subRegion' : 'region'
  const rows = filterCapacityLobs(filters)
  const shares = tsaShareByKey(rows, key)
  const years = tsaEffectiveFiscalYears(filters)
  const fyRows = TSA_ATTRITION_BY_FY.filter(d => years.includes(d.period))
  const latest = fyRows[fyRows.length - 1] || TSA_ATTRITION_BY_FY[TSA_ATTRITION_BY_FY.length - 1]
  return Object.entries(shares)
    .map(([k, share], i) => {
      const headcount = Math.round(latest.headcount * share)
      const attrition = +(latest.attrition * (0.9 + ((i * 7) % 13) / 50)).toFixed(1)
      return { key: k, headcount, attrition, attritionCount: Math.round(headcount * attrition / 100) }
    })
    .sort((a, b) => b.headcount - a.headcount)
}

// FY/granularity trend for one clicked region/sub-region key, same drill mechanic
// as msgCapacityData.js's attritionTrendByDimension.
export function tsaAttritionTrendByDimension(filters = {}, key, dimension = 'Region', granularity) {
  const dimKey = dimension === 'SubRegion' ? 'subRegion' : 'region'
  const rows = filterCapacityLobs(filters)
  const shares = tsaShareByKey(rows, dimKey)
  const share = shares[key] ?? (1 / (Object.keys(shares).length || 1))
  const years = tsaEffectiveFiscalYears(filters)
  const fyRows = TSA_ATTRITION_BY_FY.filter(d => years.includes(d.period))
    .map(d => ({ period: d.period, headcount: Math.round(d.headcount * share), attrition: d.attrition }))
  const expandedHc = expandToGranularity(fyRows, granularity, ['headcount'])
  const expandedRate = expandRateToGranularity(fyRows, granularity, ['attrition'])
  return expandedHc.map((d, i) => ({
    ...d, attrition: expandedRate[i].attrition,
    attritionCount: Math.round(d.headcount * expandedRate[i].attrition / 100),
  }))
}

// ── Geo Map: Headcount by region/sub-region (2026-07-23, replacing the Geo Map's
// old SLO% coloring — see design_choice.md) — reshapes tsaAttritionByDimension's
// existing region/sub-region headcount split into the {region/subRegion, headcount}
// pair the geo map expects, so it's genuinely filter-aware (the SLO selectors it
// replaces ignored filters entirely).
//
// 2026-07-28: the region/sub-region LOB tagging on TSA_CAPACITY_LOBS is a round-robin
// placeholder (no real per-LOB region mapping exists — see tech_spec.md), which leaves
// every key with a near-identical share of total headcount — 33 LOBs over 5 regions
// gives each ~18-21%, so the map's relative-to-peak coloring showed almost every
// region the same 1-2 colors. geoHeadcountEmphasis() layers a deterministic, verified
// well-spread multiplier on top, scoped to ONLY these 2 selectors (nothing else
// consumes them — the Attrition/Plan-over-Plan charts call their own selectors
// directly), so this doesn't change any other chart's headcount numbers for the same
// region/sub-region. Verified empirically (not just by construction) that all 4 real
// map regions (APJ/EMEA/LATAM/NAMER) land in 4 different color tiers.
const GEO_EMPHASIS_SALT = 'r160'
function geoHeadcountEmphasis(key) {
  let hash = 0
  const s = key + GEO_EMPHASIS_SALT
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0
  return 0.25 + (hash % 1000) / 1000 * 1.35
}

// 2026-07-29: the map's own choropleth now colors by Headcount ADHERENCE (actual vs
// the selected Plan Name) instead of raw headcount level, so picking a different
// Plan Name genuinely repaints the map — see regionHeadcountAdherence below (defined
// further down, hoisted like every other function declaration in this module).
// `headcount` is kept alongside `adherence` for the hover popup's existing headline
// reference; `adherence` is the new field driving the fill color.
export function geoHeadcountByRegion(filters = {}, planName) {
  return tsaAttritionByDimension(filters, 'Region')
    .map(r => ({
      region: r.key,
      headcount: Math.round(r.headcount * geoHeadcountEmphasis(r.key)),
      adherence: regionHeadcountAdherence(r.key, 'Region', filters, planName),
    }))
}

export function geoHeadcountBySubRegion(filters = {}, planName) {
  return tsaAttritionByDimension(filters, 'SubRegion')
    .map(r => ({
      subRegion: r.key,
      headcount: Math.round(r.headcount * geoHeadcountEmphasis(r.key)),
      adherence: regionHeadcountAdherence(r.key, 'SubRegion', filters, planName),
    }))
}

// Per-LOB Actual vs Planned headcount + variance for one region/sub-region's hovered
// Geo Map popup (2026-07-29) — a deterministic per-LOB SHARE of the Staffing Summary
// card's own FTE_BY_FY total (weight total computed over ALL in-scope LOBs, not just
// this key's, so each region/sub-region's rows are a genuine fraction of the real
// grand total, same "sums back to the real total" property tsaData.js's
// asuSrPerformanceByLob already has). Plan Name reuses this page's own real
// PLAN_SCALE_BY_NAME. Separate from geoHeadcountByRegion/BySubRegion above, which
// drive the map's OWN choropleth coloring — this backs the hover popup's per-LOB list.
const GEO_LOB_HEADCOUNT_WEIGHTS = LOB_LIST.map((_, i) => 0.5 + ((i * 13) % 37) / 37 * 2.5)

function lobHeadcountForKey(key, dimension, filters, planName) {
  const dimKey = dimension === 'SubRegion' ? 'subRegion' : 'region'
  const years = tsaEffectiveFiscalYears(filters)
  const latestFy = years[years.length - 1] || 'FY27'
  const totalRow = FTE_BY_FY.find(d => d.period === latestFy) || FTE_BY_FY[FTE_BY_FY.length - 1]
  const scale = planName ? (PLAN_SCALE_BY_NAME[planName] ?? 1) : 1
  const allLobs = filterCapacityLobs(filters)
  const weightTotal = allLobs.reduce((sum, l) => sum + (GEO_LOB_HEADCOUNT_WEIGHTS[LOB_LIST.indexOf(l.lob)] ?? 1), 0) || 1
  return allLobs
    .filter(l => l[dimKey] === key)
    .map(l => {
      const weight = GEO_LOB_HEADCOUNT_WEIGHTS[LOB_LIST.indexOf(l.lob)] ?? 1
      const share = weight / weightTotal
      const actual = Math.round(totalRow.actual * share)
      const plan = Math.round(totalRow.plan * scale * share)
      return { lob: l.lob, actual, plan, variance: plan ? +((actual - plan) / plan * 100).toFixed(1) : 0 }
    })
}

export function geoLobHeadcountByRegion(region, filters = {}, planName) {
  return lobHeadcountForKey(region, 'Region', filters, planName)
}

export function geoLobHeadcountBySubRegion(subRegion, filters = {}, planName) {
  return lobHeadcountForKey(subRegion, 'SubRegion', filters, planName)
}

// lobHeadcountForKey's own actual/plan reconcile to the real page-level total (every
// LOB gets the identical weight-based share for both, by design), which means the
// RATIO between them is nearly constant across LOBs — correct for a reconciling
// total, wrong for a choropleth, which needs real region-to-region spread.
// geoHeadcountAdherenceWobble() adds a deterministic per-LOB spread scoped to THIS
// map-coloring calculation only — it does not touch lobHeadcountForKey's own
// reconciling numbers (still shown verbatim in the hover popup's per-LOB list), same
// "separate, non-reconciling, map-color-only multiplier" precedent as
// geoHeadcountEmphasis() above.
function geoHeadcountAdherenceWobble(lob) {
  const i = LOB_LIST.indexOf(lob)
  return 0.6 + ((i * 17) % 80) / 100
}

function regionHeadcountAdherence(key, dimension, filters, planName) {
  const rows = lobHeadcountForKey(key, dimension, filters, planName)
  const actualSum = rows.reduce((sum, r) => sum + r.actual * geoHeadcountAdherenceWobble(r.lob), 0)
  const planSum = rows.reduce((sum, r) => sum + r.plan, 0)
  return planSum ? Math.round((actualSum / planSum) * 100) : 0
}

// ── Cases per FTE / Avg Case Time (cards only) ─────────────────────────────
const BASE_CPF_PLAN = { FY25: 15.5, FY26: 16.2, FY27: 16.9 }
export const CPF_BY_FY = FISCAL_YEARS.map((fy, i) => ({
  period: fy, plan: BASE_CPF_PLAN[fy],
  actual: +(BASE_CPF_PLAN[fy] * (1.1 + (i * 5 % 8) / 100)).toFixed(1),
}))

// Cases per FTE is a rate (cases handled per head), so its trend chart uses the
// rate-preserving expansion, same as actHrsByFY below.
export function cpfByFY(filters = {}, granularity) {
  const years = tsaEffectiveFiscalYears(filters)
  const fyRows = CPF_BY_FY.filter(d => years.includes(d.period)).map(d => ({ period: d.period, actual: d.actual, plan: d.plan }))
  return expandRateToGranularity(fyRows, granularity, ['actual', 'plan'])
}

const BASE_ACT_PLAN = { FY25: 3.6, FY26: 3.8, FY27: 4.0 }
export const ACT_BY_FY = FISCAL_YEARS.map((fy, i) => ({
  period: fy, plan: BASE_ACT_PLAN[fy],
  actual: +(BASE_ACT_PLAN[fy] * (1.2 + (i * 4 % 10) / 100)).toFixed(1),
}))

// Avg Case Time is a rate (hours per case), not a summable volume, so its trend
// chart uses the rate-preserving expansion, same reasoning as UCR target/current
// on TSA Forecasting. `adherence` is plan/actual (not actual/target) since this is a
// "lower is better" metric — adherence reads >=100 when actual is at or under plan,
// <100 when it's running long, same directional convention as Cases per FTE's
// "overload" framing on this page's cards.
export function actHrsByFY(filters = {}, granularity) {
  const years = tsaEffectiveFiscalYears(filters)
  const fyRows = ACT_BY_FY.filter(d => years.includes(d.period)).map(d => ({ period: d.period, actual: d.actual, plan: d.plan }))
  return expandRateToGranularity(fyRows, granularity, ['actual', 'plan'])
    .map(d => ({ ...d, adherence: d.actual ? +((d.plan / d.actual) * 100).toFixed(1) : 0 }))
}

// Year-over-year % change between the latest in-scope FY and the one before it;
// null when there's no prior year in scope, same convention as msgCapacityData.js's yoyPct.
function yoyPct(curr, prev) {
  if (prev === undefined || prev === null || !prev) return null
  return +(((curr - prev) / prev) * 100).toFixed(1)
}

// ── Card headlines ─────────────────────────────────────────────────────────
// The headline `value`/`actual` AND the `period`/`prevPeriod`/`yoyPct` comparison
// both drill with the page-wide granularity slicer — 2026-07-20 change, superseding
// the prior "comparison always stays FY-over-FY" decision, per direct request
// (compare Month-over-Month/Quarter-over-Quarter instead of always last year). Each
// metric already has a granularity-aware selector built for its own drill-down
// chart, so this just reuses the last two entries of those series instead of a
// separate FY-only lookup. Cases per FTE is unchanged (still a plain Plan-based
// sub-line with no yoyPct field at all). SLO % card removed 2026-07-23 (see
// design_choice.md) — globalSlo is no longer part of this return shape.
export function tsaCapacityCardData(filters = {}, granularity) {
  const years = tsaEffectiveFiscalYears(filters)
  const fteGranular = fteByFY(filters, granularity)
  const attritionGranular = tsaAttritionByFY(filters, granularity)
  const cpf = CPF_BY_FY.filter(d => years.includes(d.period))
  const actGranular = actHrsByFY(filters, granularity)

  const latestFte = fteGranular[fteGranular.length - 1]
  const prevFte = fteGranular[fteGranular.length - 2]
  const latestAttrition = attritionGranular[attritionGranular.length - 1]
  const prevAttrition = attritionGranular[attritionGranular.length - 2]
  const latestCpf = cpf[cpf.length - 1]
  const latestAct = actGranular[actGranular.length - 1]
  const prevAct = actGranular[actGranular.length - 2]

  return {
    totalFte: {
      actual: latestFte?.actual ?? 0, plan: latestFte?.plan ?? 0,
      period: latestFte?.period, prevPeriod: prevFte?.period, yoyPct: yoyPct(latestFte?.actual, prevFte?.actual),
    },
    attrition: {
      actual: latestAttrition?.attrition ?? 0, bench: latestAttrition?.bench ?? 0,
      period: latestAttrition?.period, prevPeriod: prevAttrition?.period, yoyPct: yoyPct(latestAttrition?.attrition, prevAttrition?.attrition),
    },
    casesPerFte: { actual: latestCpf?.actual ?? 0, plan: latestCpf?.plan ?? 0 },
    avgCaseTime: {
      actual: latestAct?.actual ?? 0, plan: latestAct?.plan ?? 0,
      period: latestAct?.period, prevPeriod: prevAct?.period, yoyPct: yoyPct(latestAct?.actual, prevAct?.actual),
    },
  }
}

// ── Plan over Plan headcount comparison (Layer 2) ──────────────────────────
export const TSA_CAPACITY_PLAN_VS_PLAN_BY_FY = FISCAL_YEARS.map((fy, i) => ({
  period: fy,
  plan1: BASE_FTE_PLAN[fy],
  plan2: Math.round(BASE_FTE_PLAN[fy] * (0.95 + (i * 7 % 11) / 100)),
}))

// Region/Sub-region default view for the TSA Plan over Plan Variation layer — same
// share-weighted mechanic as msgCapacityData.js's planOverPlanByDimension. `planA`/
// `planB` (optional, added 2026-07-23) let the layer's shared PlanDropdowns pick real
// named plan vintages instead of the fixed plan1/plan2 baseline; omitting both keeps
// the original TSA_CAPACITY_PLAN_VS_PLAN_BY_FY-based output unchanged.
export function tsaPlanOverPlanByDimension(filters = {}, dimension = 'Region', planA, planB) {
  const key = dimension === 'SubRegion' ? 'subRegion' : 'region'
  const rows = filterCapacityLobs(filters)
  const shares = tsaShareByKey(rows, key)
  const years = tsaEffectiveFiscalYears(filters)
  const usingNamedPlans = planA != null && planB != null
  const fyRows = usingNamedPlans
    ? years.map(fy => ({ period: fy, plan1: planFyValue(fy, planA), plan2: planFyValue(fy, planB) }))
    : TSA_CAPACITY_PLAN_VS_PLAN_BY_FY.filter(d => years.includes(d.period))
  const latest = fyRows[fyRows.length - 1] || TSA_CAPACITY_PLAN_VS_PLAN_BY_FY[TSA_CAPACITY_PLAN_VS_PLAN_BY_FY.length - 1]
  return Object.entries(shares)
    .map(([k, share]) => {
      const plan1 = Math.round(latest.plan1 * share)
      const plan2 = Math.round(latest.plan2 * share)
      return { key: k, plan1, plan2, variance: plan1 ? +((plan2 - plan1) / plan1 * 100).toFixed(1) : 0 }
    })
    .sort((a, b) => b.plan1 - a.plan1)
}

// FY/granularity trend for one clicked region/sub-region key, same drill mechanic
// as msgCapacityData.js's planOverPlanTrendByDimension. `planA`/`planB` optional, same
// additive convention as tsaPlanOverPlanByDimension above.
export function tsaPlanOverPlanTrendByDimension(filters = {}, key, dimension = 'Region', granularity, planA, planB) {
  const dimKey = dimension === 'SubRegion' ? 'subRegion' : 'region'
  const rows = filterCapacityLobs(filters)
  const shares = tsaShareByKey(rows, dimKey)
  const share = shares[key] ?? (1 / (Object.keys(shares).length || 1))
  const years = tsaEffectiveFiscalYears(filters)
  const usingNamedPlans = planA != null && planB != null
  const fyRows = (usingNamedPlans
    ? years.map(fy => ({ period: fy, plan1: planFyValue(fy, planA), plan2: planFyValue(fy, planB) }))
    : TSA_CAPACITY_PLAN_VS_PLAN_BY_FY.filter(d => years.includes(d.period))
  ).map(d => ({ period: d.period, plan1: Math.round(d.plan1 * share), plan2: Math.round(d.plan2 * share) }))
  return expandToGranularity(fyRows, granularity, ['plan1', 'plan2'])
    .map(d => ({ ...d, variance: d.plan1 ? +((d.plan2 - d.plan1) / d.plan1 * 100).toFixed(1) : 0 }))
}

// LOBs with the highest Plan-over-Plan headcount variation, worst (largest
// |variance|) first — the ranked list under the Plan over Plan Variation layer,
// analogous to msgCapacityData.js's planOverPlanQueueVariance but for LOBs. `planA`/
// `planB` optional (2026-07-23): when both are given, each LOB's popPlan1 baseline is
// re-scaled per the selected named plans (lobPlanValue) instead of the fixed
// popPlan1/popPlan2/popVariance getters, so the ranked list genuinely reacts to the
// same Plan A/Plan B selection as tsaPlanOverPlanByDimension above.
export function planOverPlanLobVariance(filters = {}, topN = 8, planA, planB) {
  const rows = filterCapacityLobs(filters)
  const usingNamedPlans = planA != null && planB != null
  return rows
    .map(l => {
      const plan1 = usingNamedPlans ? lobPlanValue(l, planA) : l.popPlan1
      const plan2 = usingNamedPlans ? lobPlanValue(l, planB) : l.popPlan2
      const variance = plan1 ? +((plan2 - plan1) / plan1 * 100).toFixed(1) : 0
      return { name: l.lob, plan1, plan2, variance }
    })
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
    .slice(0, topN)
}

// ── Workload distribution (Layer 3) — per-LOB fact table ───────────────────
// Reuses LOB_FACTS's own businessPartner/globalGrouping tagging so a given LOB
// carries the same tags across both TSA pages, rather than re-deriving them with
// a different index formula.
export const TSA_CAPACITY_LOBS = LOB_FACTS.map((l, i) => {
  const popPlan1 = 8 + (i % 12)
  const popPlan2 = Math.round(popPlan1 * (0.82 + (i % 17) * 0.018))
  return {
    ...l,
    region: REGIONS[i % REGIONS.length],
    subRegion: SUB_REGIONS[i % SUB_REGIONS.length],
    workloadPlan: 500 + (i % 10) * 80,
    workloadActual: Math.round((500 + (i % 10) * 80) * (0.7 + (i % 9) * 0.05)),
    actHrsPlan: 6 + (i % 5),
    actHrsActual: +((6 + (i % 5)) * (0.9 + (i % 7) * 0.05)).toFixed(1),
    // Plan-over-Plan (Plan A vs Plan B) headcount per LOB — backs the "LOBs with
    // highest variation" ranking under the Plan over Plan Variation layer.
    popPlan1, popPlan2,
    get popVariance() { return this.popPlan1 ? +((this.popPlan2 - this.popPlan1) / this.popPlan1 * 100).toFixed(1) : 0 },
  }
})

// ── Workload/ACT Performance table (above the Geo Map) — LOB × Fiscal Quarter matrix ─
// Each in-scope LOB already has its own flat workloadPlan/workloadActual and
// actHrsPlan/actHrsActual baseline on TSA_CAPACITY_LOBS — this turns that single
// flat number into a 3-FY series (a modest deterministic YoY step, same shape as
// this page's other FY baselines, e.g. BASE_FTE_PLAN) and expands it to quarters
// via the SAME mockData.js helpers every other time-series selector on this app
// already uses: the additive one for Workload (a volume, like ASU/SR), the
// rate-preserving one for ACT (hours-per-case, a rate — same treatment actHrsByFY
// already gives it).
function workloadActFyRows(baseActual, basePlan) {
  return FISCAL_YEARS.map((fy, i) => ({
    period: fy,
    actual: Math.round(baseActual * (0.94 + i * 0.05)),
    plan: Math.round(basePlan * (0.94 + i * 0.05)),
  }))
}

export function workloadActPerformanceByLob(filters = {}, metric = 'Workload', planName) {
  const years = tsaEffectiveFiscalYears(filters)
  const scale = planName ? (PLAN_SCALE_BY_NAME[planName] ?? 1) : 1
  return filterCapacityLobs(filters).map(l => {
    const [baseActual, basePlan] = metric === 'ACT' ? [l.actHrsActual, l.actHrsPlan] : [l.workloadActual, l.workloadPlan]
    const fyRows = workloadActFyRows(baseActual, basePlan).filter(d => years.includes(d.period))
    const expanded = metric === 'ACT'
      ? expandRateToGranularity(fyRows, 'Quarter', ['actual', 'plan'])
      : expandToGranularity(fyRows, 'Quarter', ['actual', 'plan'])
    const quarters = expanded.map(q => {
      const plan = Math.round(q.plan * scale)
      return { period: q.period, actual: q.actual, plan, adherence: plan ? +((q.actual / plan) * 100).toFixed(1) : 0 }
    })
    return { lob: l.lob, quarters }
  })
}

// ── Workload Impact on Headcount (Layer 3, replacing "Average Case Time Variance",
// 2026-07-28) — per-CQN detail using the SAME real queue-name roster the adjacent
// Workload Distribution Sankey draws from (TSA_ACTIVE_QUEUE_NAMES, sourced from
// LOB_QUEUES['High End Storage'] — the only real per-queue list this app has). No
// real queue-to-LOB mapping has been supplied, so each queue is assigned to a
// LOB_LIST entry round-robin by index — same "real names, illustrative structure"
// approach LOB_FACTS already uses for businessPartner/globalGrouping — so picking a
// LOB from the filter panel narrows to a genuine, real-named CQN subset instead of
// an arbitrary one.
const CQN_LOB_ASSIGNMENTS = TSA_ACTIVE_QUEUE_NAMES.map((name, i) => ({ name, lob: LOB_LIST[i % LOB_LIST.length] }))

function cqnsForFilters(filters) {
  const inScope = new Set(filterLobs(filters).map(l => l.lob))
  const scoped = CQN_LOB_ASSIGNMENTS.filter(q => inScope.has(q.lob))
  return scoped.length ? scoped : CQN_LOB_ASSIGNMENTS
}

// SR/Workload/Headcount scaled off this page's own existing conventions rather than
// invented outright: SR off TSA Forecasting's own SR_BY_FY plan (tsaData.js, same
// magnitude as the SR chart on that page), Workload off TSA_CAPACITY_LOBS' own
// workloadPlan/workloadActual per LOB, Headcount off TSA_CAPACITY_LOBS' popPlan1
// (already documented there as the Plan-over-Plan headcount-per-LOB field) — each
// queue takes a deterministic sub-share of its assigned LOB's totals. `cap` (default
// 8) keeps the chart legible when unfiltered; the click-popup table calls with a
// much higher cap to show the full in-scope roster. A single-LOB filter typically
// narrows to 2-3 queues, well under the default cap either way.
export function workloadImpactOnHeadcount(filters = {}, cap = 8) {
  const years = tsaEffectiveFiscalYears(filters)
  const latestFy = years[years.length - 1] || 'FY27'
  const srRow = SR_BY_FY.find(d => d.period === latestFy) || SR_BY_FY[SR_BY_FY.length - 1]
  const srPerQueueBase = srRow.plan / TSA_ACTIVE_QUEUE_NAMES.length

  return cqnsForFilters(filters).slice(0, cap).map((q, i) => {
    const lobRow = TSA_CAPACITY_LOBS.find(l => l.lob === q.lob)
    const queueCount = CQN_LOB_ASSIGNMENTS.filter(c => c.lob === q.lob).length || 1
    const sr = Math.round(srPerQueueBase * (0.7 + ((i * 7 + q.name.length) % 11) * 0.04))
    const workloadPlan = Math.round((lobRow?.workloadPlan ?? 620) / queueCount)
    const workloadActual = Math.round((lobRow?.workloadActual ?? workloadPlan) / queueCount)
    const headcount = Math.max(1, Math.round((lobRow?.popPlan1 ?? 10) / queueCount))
    return { cqn: q.name, lob: q.lob, sr, workloadActual, workloadPlan, headcount }
  })
}

// Illustrative Sankey, now with two modes (2026-07-03): 'LOB' flows 3 illustrative
// CQN priority tiers into 4 real LOB names; 'CQN' flows 3 illustrative LOB-priority
// tiers into 4 real TSA queue names (pulled from LOB_QUEUES['High End Storage'] —
// the only real per-queue list this page has access to). Neither direction has a
// real per-queue-to-LOB mapping, so both tier label sets stay illustrative while the
// leaf nodes they flow into are always real business names.
const SANKEY_CQN_TIERS = ['CQN-Standard', 'CQN-Critical', 'CQN-Enterprise']
const SANKEY_LOBS = ['Networking', 'Storage', 'Server', 'ScaleVault']
const SANKEY_LOB_TIERS = ['LOB-Storage', 'LOB-Networking', 'LOB-Compute']
// Filtered against the real active-queue list so this stays a genuine subset of
// LOB_QUEUES rather than a hand-typed name that could drift from the source data.
const SANKEY_QUEUES = ['Global Networking', 'Global ApexArray Backline', 'GLOBAL UDX ScaleVault', 'Global RailFlex']
  .filter(name => LOB_QUEUES['High End Storage'].active.includes(name))

export function workloadSankey(filters = {}, mode = 'LOB') {
  const ratio = lobScopeRatio(filters) || 1
  const sources = mode === 'CQN' ? SANKEY_LOB_TIERS : SANKEY_CQN_TIERS
  const targets = mode === 'CQN' ? SANKEY_QUEUES : SANKEY_LOBS
  const nodes = [...sources, ...targets].map(name => ({ name }))
  const links = []
  sources.forEach((src, si) => {
    targets.forEach((tgt, ti) => {
      const value = Math.max(1, Math.round(120 * ratio * (0.4 + ((si * 7 + ti * 11) % 13) / 20)))
      links.push({ source: si, target: sources.length + ti, value })
    })
  })
  return { nodes, links }
}

export { LOB_LIST, GLOBAL_GROUPING_LIST }
