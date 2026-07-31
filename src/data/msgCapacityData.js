// Mock data + selectors for the MSG Capacity Plan page (Staffing / Utilization /
// SL% / FTE / Attrition). Structurally mirrors mockData.js/tsaData.js — multi-select
// filters as arrays, FY-level series narrowed by the most specific time filter and
// expandable to the page-wide Quarter/Month/Week granularity toggle, real queue names
// paired with illustrative numbers — but is its own module since this page has a
// different metric set and its own two new filter dimensions (Country, Business Org).
import {
  FISCAL_YEARS, ACTIVE_QUEUE_NAMES, ACTIVE_QUEUES, CAPACITY_CODES, BUSINESS_PARTNERS, CHANNELS,
  REGIONS, SUB_REGIONS, inferRegion, matchesMulti, effectiveFiscalYears,
  expandToGranularity, expandRateToGranularity, regionForCountry, subRegionForCountry,
} from './mockData'

// Deterministic per-plan-name scale factor so every "which Plan" dropdown added across
// this page (2026-07-23) genuinely changes the numbers it drives, not just a label —
// 'Actual' (or no selection) is the neutral baseline (1x); every other CAPACITY_PLAN_NAMES
// value gets its own stable multiplier derived from the plan name itself, same
// "illustrative structure, deterministic not random" convention as the rest of this file.
export function planMultiplier(planName) {
  if (!planName || planName === 'Actual') return 1
  let hash = 0
  for (let i = 0; i < planName.length; i++) hash = (hash * 31 + planName.charCodeAt(i)) % 97
  return +(0.85 + (hash % 30) / 100).toFixed(3)
}

// Real call-center auxiliary/off-productive codes (break, training, meeting, etc.) —
// kept as plain "Aux 1".."Aux 9" labels rather than invented category names, matching
// how the source mockup names them.
export const AUX_CODES = Array.from({ length: 9 }, (_, i) => `Aux ${i + 1}`)

const CAPACITY_FILTER_KEYS = ['combinedQueueName', 'capacityCode', 'channel', 'businessPartner', 'region', 'subRegion']
const CAPACITY_FIELD_BY_KEY = {
  combinedQueueName: 'name', capacityCode: 'capacityCode', channel: 'channel',
  businessPartner: 'businessPartner', region: 'region', subRegion: 'subRegion',
}

// ── Queue fact table ─────────────────────────────────────────────────────────
// Reuses the Forecasting page's real queue names, tagged with capacity-specific
// illustrative numbers (planned/actual headcount, utilization, SL, leaves) —
// same "real names + illustrative structure" convention as ACTIVE_QUEUES. Sub-region
// is read directly off ACTIVE_QUEUES[i] (same name, same index, same source array)
// instead of re-assigned independently, so a given queue carries the identical
// sub-region tag on both this page and MSG Forecasting.
export const CAPACITY_QUEUES = ACTIVE_QUEUE_NAMES.map((name, i) => {
  const planHC = 8 + (i % 12)
  const actualHC = Math.round(planHC * (0.82 + (i % 13) * 0.02))
  const utilTarget = 80 + (i % 10)
  const utilActual = +(utilTarget * (0.88 + (i % 9) * 0.02)).toFixed(1)
  const slTarget = 80 + (i % 8)
  const slActual = +(slTarget * (0.90 + (i % 11) * 0.015)).toFixed(1)
  const leavesPlan = 2 + (i % 6)
  const leavesActual = Math.round(leavesPlan * (0.7 + (i % 7) * 0.1))
  // Plan-over-Plan (Plan A vs Plan B) headcount, distinct from planHC/actualHC above
  // (which compare Plan vs Actual, a different axis) — backs the "queues with highest
  // variation" ranking under the Plan over Plan Variation layer.
  const popPlan1 = planHC
  const popPlan2 = Math.round(popPlan1 * (0.82 + (i % 17) * 0.018))
  return {
    name,
    region: inferRegion(name),
    subRegion: ACTIVE_QUEUES[i]?.subRegion,
    capacityCode: CAPACITY_CODES[i % CAPACITY_CODES.length],
    businessPartner: BUSINESS_PARTNERS[i % BUSINESS_PARTNERS.length],
    channel: CHANNELS[i % CHANNELS.length],
    dbOsp: i % 3 === 0 ? 'OSP' : 'DB',
    planHC, actualHC,
    get hcDelta() { return this.actualHC - this.planHC },
    utilTarget, utilActual,
    get utilGap() { return +(this.utilActual - this.utilTarget).toFixed(1) },
    auxCulprit: AUX_CODES[i % AUX_CODES.length],
    slTarget, slActual,
    leavesPlan, leavesActual,
    get leavesDelta() { return this.leavesActual - this.leavesPlan },
    popPlan1, popPlan2,
    get popVariance() { return this.popPlan1 ? +((this.popPlan2 - this.popPlan1) / this.popPlan1 * 100).toFixed(1) : 0 },
  }
})

export function filterCapacityQueues(filters = {}) {
  return CAPACITY_QUEUES.filter(q => {
    const multiOk = CAPACITY_FILTER_KEYS.every(key => matchesMulti(filters[key], q[CAPACITY_FIELD_BY_KEY[key]]))
    const dbOsp = filters.dbOsp
    return multiOk && (!dbOsp || dbOsp === 'All' || q.dbOsp === dbOsp)
  })
}

// Deterministic distribution of a queue set across whichever dimension ('region'|
// 'subRegion') is asked for — backs both the Attrition drill's default region/
// sub-region-level view and the Plan over Plan Variation layer's same toggle,
// instead of hand-maintaining a separate hardcoded share table per dimension.
function shareByKey(rows, key) {
  const counts = {}
  rows.forEach(q => { if (q[key] != null) counts[q[key]] = (counts[q[key]] || 0) + 1 })
  const total = rows.length || 1
  return Object.fromEntries(Object.entries(counts).map(([k, c]) => [k, c / total]))
}

function capacityScopeRatio(filters) {
  const total = CAPACITY_QUEUES.length
  return total ? filterCapacityQueues(filters).length / total : 0
}

// ── Headcount (Staffing) ───────────────────────────────────────────────────────
const BASE_HC_PLAN = { FY25: 3150, FY26: 3320, FY27: 3500 }

export const HC_BY_FY = FISCAL_YEARS.map((fy, i) => ({
  period: fy,
  plan: BASE_HC_PLAN[fy],
  actual: Math.round(BASE_HC_PLAN[fy] * (0.92 + (i * 5 % 7) / 100)),
  get adherence() { return +((this.actual / this.plan) * 100).toFixed(1) },
}))

// `planSelection` (2026-07-30) closes a KNOWN cosmetic gap: Visual1's own Plan
// dropdown used to change state without ever feeding into this selector. Reuses
// planMultiplier — same mechanism slTrendByFY/slDefaulterQueues already use — so
// every Plan-scaled selector on this page rescales "plan" via the identical
// function. Omitting planSelection keeps every existing caller's output unchanged.
export function hcStaffingByFY(filters = {}, granularity, planSelection) {
  const years = effectiveFiscalYears(filters)
  const ratio = capacityScopeRatio(filters)
  const mult = planMultiplier(planSelection)
  const fyRows = HC_BY_FY.filter(d => years.includes(d.period))
    .map(d => ({ period: d.period, plan: Math.round(d.plan * ratio * mult), actual: Math.round(d.actual * ratio) }))
  return expandToGranularity(fyRows, granularity, ['plan', 'actual'])
    .map(d => ({ ...d, adherence: d.plan ? +((d.actual / d.plan) * 100).toFixed(1) : 0 }))
}

// ── Attrition (Layer 1, Visual 2) — headcount + attrition %, Region/Country lens ──
const BASE_ATTRITION_TARGET = { FY25: 8.5, FY26: 8, FY27: 7.5 }

export const ATTRITION_BY_FY = FISCAL_YEARS.map((fy, i) => ({
  period: fy,
  headcount: 3000 + ((i * 137) % 1000),
  attrition: +(BASE_ATTRITION_TARGET[fy] * (1.1 + (i * 3 % 9) / 100)).toFixed(1),
}))

// `lens` ('Region'|'Country') is a cosmetic scoping toggle — a small deterministic
// scale factor stands in for a real per-region/per-country attrition dataset, same
// "illustrative structure" convention used everywhere else in the app for a control
// that's real and interactive but not backed by a full new dimension of source data.
export function attritionByFY(filters = {}, granularity, lens = 'Region') {
  const years = effectiveFiscalYears(filters)
  const lensScale = lens === 'Country' ? 0.97 : 1
  const fyRows = ATTRITION_BY_FY.filter(d => years.includes(d.period))
    .map(d => ({ period: d.period, headcount: Math.round(d.headcount * lensScale), attrition: d.attrition }))
  const expandedHc = expandToGranularity(fyRows, granularity, ['headcount'])
  const expandedRate = expandRateToGranularity(fyRows, granularity, ['attrition'])
  return expandedHc.map((d, i) => ({ ...d, attrition: expandedRate[i].attrition }))
}

// Region/Sub-region default view for HeadcountLayer Visual2 — one row per key
// (region or sub-region), sized by each key's share of the currently in-scope
// queues, at the latest in-scope FY's attrition%. Clicking a row drills into
// attritionTrendByDimension below instead of showing a flat per-key number.
export function attritionByDimension(filters = {}, dimension = 'Region') {
  const key = dimension === 'SubRegion' ? 'subRegion' : 'region'
  const scoped = filterCapacityQueues(filters)
  const rows = scoped.length ? scoped : CAPACITY_QUEUES
  const shares = shareByKey(rows, key)
  const years = effectiveFiscalYears(filters)
  const fyRows = ATTRITION_BY_FY.filter(d => years.includes(d.period))
  const latest = fyRows[fyRows.length - 1] || ATTRITION_BY_FY[ATTRITION_BY_FY.length - 1]
  return Object.entries(shares)
    .map(([k, share], i) => {
      const headcount = Math.round(latest.headcount * share)
      const attrition = +(latest.attrition * (0.9 + ((i * 7) % 13) / 50)).toFixed(1)
      return { key: k, headcount, attrition, attritionCount: Math.round(headcount * attrition / 100) }
    })
    .sort((a, b) => b.headcount - a.headcount)
}

// FY/granularity trend for one clicked region/sub-region key — same "click a region
// to drill into its own time trend" mechanic as tsaData.js's cpasuByRegion/
// cpasuTrendByRegion, scaled by that key's share of the currently in-scope queues
// so the drilled trend still respects whatever the top filters/granularity are set to.
export function attritionTrendByDimension(filters = {}, key, dimension = 'Region', granularity) {
  const dimKey = dimension === 'SubRegion' ? 'subRegion' : 'region'
  const scoped = filterCapacityQueues(filters)
  const rows = scoped.length ? scoped : CAPACITY_QUEUES
  const shares = shareByKey(rows, dimKey)
  const share = shares[key] ?? (1 / (Object.keys(shares).length || 1))
  const years = effectiveFiscalYears(filters)
  const fyRows = ATTRITION_BY_FY.filter(d => years.includes(d.period))
    .map(d => ({ period: d.period, headcount: Math.round(d.headcount * share), attrition: d.attrition }))
  const expandedHc = expandToGranularity(fyRows, granularity, ['headcount'])
  const expandedRate = expandRateToGranularity(fyRows, granularity, ['attrition'])
  return expandedHc.map((d, i) => ({
    ...d, attrition: expandedRate[i].attrition,
    attritionCount: Math.round(d.headcount * expandedRate[i].attrition / 100),
  }))
}

// ── Actual vs Plan trend with SL% (Layer 1, Visual 3) ─────────────────────────
const BASE_SL_TARGET = { FY25: 82, FY26: 84, FY27: 86 }

export const SL_TREND_BY_FY = FISCAL_YEARS.map((fy, i) => ({
  period: fy,
  actual: BASE_HC_PLAN[fy] * (0.9 + (i * 4 % 6) / 100),
  plan: BASE_HC_PLAN[fy],
  slPct: +(BASE_SL_TARGET[fy] * (1.0 + (i * 3 % 8) / 100)).toFixed(1),
})).map(d => ({ ...d, actual: Math.round(d.actual) }))

// `planSelection` (added 2026-07-23, optional/additive — existing callers that omit
// it keep getting the 'Actual' baseline, i.e. unchanged output) scales the Plan HC
// bar via planMultiplier so Headcount Impact on SL's own Plan dropdown genuinely
// moves the chart, not just its label.
export function slTrendByFY(filters = {}, granularity, planSelection = 'Actual') {
  const years = effectiveFiscalYears(filters)
  const ratio = capacityScopeRatio(filters)
  const mult = planMultiplier(planSelection)
  const fyRows = SL_TREND_BY_FY.filter(d => years.includes(d.period))
    .map(d => ({ period: d.period, actual: Math.round(d.actual * ratio), plan: Math.round(d.plan * ratio * mult), slPct: d.slPct }))
  const expandedVol = expandToGranularity(fyRows, granularity, ['actual', 'plan'])
  const expandedRate = expandRateToGranularity(fyRows, granularity, ['slPct'])
  return expandedVol.map((d, i) => ({ ...d, slPct: expandedRate[i].slPct }))
}

// Headcount-Impact-on-SL defaulter list (Layer 1, Visual 3): queues that are both
// over their headcount plan AND still missing SL — i.e. extra heads didn't fix the
// service-level problem, which is the actionable signal this list is meant to
// surface (a queue merely over plan with healthy SL isn't a defaulter by this logic).
// `planSelection` (optional/additive, defaults to the 'Actual' baseline so existing
// callers are unaffected) re-scales each queue's plan HC before the over-plan test,
// so picking a different plan can genuinely change which queues qualify and their
// shown HC delta, not just relabel the list.
export function slDefaulterQueues(filters = {}, count = 6, planSelection = 'Actual') {
  const mult = planMultiplier(planSelection)
  return filterCapacityQueues(filters)
    .map(q => ({ ...q, planHC: Math.round(q.planHC * mult) }))
    .filter(q => q.actualHC > q.planHC && q.slActual < 90)
    .sort((a, b) => a.slActual - b.slActual)
    .slice(0, count)
    .map(q => ({ name: q.name, actualHC: q.actualHC, planHC: q.planHC, hcDelta: q.actualHC - q.planHC, slActual: q.slActual }))
}

// ── Queue Performance table (2026-07-27) ──────────────────────────────────────
// Real per-queue Actual vs Plan headcount + variance, sitting just above the Geo
// Map — same "real numbers already used by other graphs on this page" data as
// slDefaulterQueues above (planHC/actualHC straight off CAPACITY_QUEUES), not a new
// dataset. `planSelection` rescales planHC via the same planMultiplier() every other
// independent Plan dropdown on this page already uses.
export function queueHeadcountPerformance(filters = {}, planSelection = 'Actual') {
  const mult = planMultiplier(planSelection)
  return filterCapacityQueues(filters)
    .map(q => {
      const planHC = Math.round(q.planHC * mult)
      const variance = planHC ? +((q.actualHC - planHC) / planHC * 100).toFixed(1) : 0
      return { name: q.name, region: q.region, actualHC: q.actualHC, planHC, variance }
    })
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
}

// ── Plan over Plan headcount comparison (Layer 2) ─────────────────────────────
// FY-level baseline that planOverPlanByDimension/planOverPlanTrendByDimension below
// scale per region/sub-region share — this page's Plan over Plan Variation layer
// only ever shows the region/sub-region drill, not a flat FY-only chart, so there's
// no standalone planOverPlanByFY selector here (unlike TSA Capacity's simpler layer).
export const CAPACITY_PLAN_VS_PLAN_BY_FY = FISCAL_YEARS.map((fy, i) => ({
  period: fy,
  plan1: BASE_HC_PLAN[fy],
  plan2: Math.round(BASE_HC_PLAN[fy] * (0.95 + (i * 7 % 11) / 100)),
  get variance() { return +((this.plan2 - this.plan1) / this.plan1 * 100).toFixed(1) },
}))

// Region/Sub-region default view for the Plan over Plan Variation layer — same
// share-weighted mechanic as attritionByDimension, applied to Plan A/B headcount
// instead of attrition.
// `planA`/`planB` (added 2026-07-23, optional/additive so any caller that omits them
// keeps the prior 'Actual'-vs-'Dec Plan' baseline behavior) let the layer's real Plan
// A/Plan B dropdowns genuinely reweight plan1/plan2 via planMultiplier, instead of the
// two series being fixed numbers with only their legend labels swappable.
export function planOverPlanByDimension(filters = {}, dimension = 'Region', planA = 'Actual', planB = 'Dec Plan') {
  const key = dimension === 'SubRegion' ? 'subRegion' : 'region'
  const scoped = filterCapacityQueues(filters)
  const rows = scoped.length ? scoped : CAPACITY_QUEUES
  const shares = shareByKey(rows, key)
  const years = effectiveFiscalYears(filters)
  const fyRows = CAPACITY_PLAN_VS_PLAN_BY_FY.filter(d => years.includes(d.period))
  const latest = fyRows[fyRows.length - 1] || CAPACITY_PLAN_VS_PLAN_BY_FY[CAPACITY_PLAN_VS_PLAN_BY_FY.length - 1]
  const multA = planMultiplier(planA)
  const multB = planMultiplier(planB)
  return Object.entries(shares)
    .map(([k, share]) => {
      const plan1 = Math.round(latest.plan1 * share * multA)
      const plan2 = Math.round(latest.plan2 * share * multB)
      return { key: k, plan1, plan2, variance: plan1 ? +((plan2 - plan1) / plan1 * 100).toFixed(1) : 0 }
    })
    .sort((a, b) => b.plan1 - a.plan1)
}

// FY/granularity trend for one clicked region/sub-region key, same drill mechanic
// as attritionTrendByDimension. planA/planB same as planOverPlanByDimension above.
export function planOverPlanTrendByDimension(filters = {}, key, dimension = 'Region', granularity, planA = 'Actual', planB = 'Dec Plan') {
  const dimKey = dimension === 'SubRegion' ? 'subRegion' : 'region'
  const scoped = filterCapacityQueues(filters)
  const rows = scoped.length ? scoped : CAPACITY_QUEUES
  const shares = shareByKey(rows, dimKey)
  const share = shares[key] ?? (1 / (Object.keys(shares).length || 1))
  const years = effectiveFiscalYears(filters)
  const multA = planMultiplier(planA)
  const multB = planMultiplier(planB)
  const fyRows = CAPACITY_PLAN_VS_PLAN_BY_FY.filter(d => years.includes(d.period))
    .map(d => ({ period: d.period, plan1: Math.round(d.plan1 * share * multA), plan2: Math.round(d.plan2 * share * multB) }))
  return expandToGranularity(fyRows, granularity, ['plan1', 'plan2'])
    .map(d => ({ ...d, variance: d.plan1 ? +((d.plan2 - d.plan1) / d.plan1 * 100).toFixed(1) : 0 }))
}

// Queues with the highest Plan-over-Plan headcount variation, worst (largest
// |variance|) first — the ranked list under the Plan over Plan Variation layer,
// meant to be the page's headline "what's actually driving plan risk" visual.
// planA/planB same as planOverPlanByDimension above — reweights each queue's own
// popPlan1/popPlan2 baseline instead of the fixed per-queue numbers.
export function planOverPlanQueueVariance(filters = {}, topN = 8, planA = 'Actual', planB = 'Dec Plan') {
  const rows = filterCapacityQueues(filters)
  const hasQueue = filters.combinedQueueName?.length > 0
  const list = hasQueue ? rows : rows.slice()
  const multA = planMultiplier(planA)
  const multB = planMultiplier(planB)
  return list
    .map(q => {
      const plan1 = Math.round(q.popPlan1 * multA)
      const plan2 = Math.round(q.popPlan2 * multB)
      return { name: q.name, plan1, plan2, variance: plan1 ? +((plan2 - plan1) / plan1 * 100).toFixed(1) : 0 }
    })
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
    .slice(0, topN)
}

// ── Utilization time trend (Layer 3, Visual 1) — Aux culprit added after expansion ─
const BASE_UTIL_TARGET = { FY25: 82, FY26: 84, FY27: 86 }

export const UTIL_BY_FY = FISCAL_YEARS.map((fy, i) => ({
  period: fy,
  target: BASE_UTIL_TARGET[fy],
  actual: +(BASE_UTIL_TARGET[fy] * (0.95 + (i * 6 % 10) / 100)).toFixed(1),
}))

// `planSelection` (optional/additive, defaults to the 'Actual' baseline so existing
// callers — the KPI cards' trend popups — see unchanged output) rescales the Target
// series via planMultiplier so this visual's own Plan dropdown genuinely moves the
// target bar and the adherence % derived from it.
export function utilizationByFY(filters = {}, granularity, planSelection = 'Actual') {
  const years = effectiveFiscalYears(filters)
  const mult = planMultiplier(planSelection)
  const fyRows = UTIL_BY_FY.filter(d => years.includes(d.period))
    .map(d => ({ period: d.period, target: +(d.target * mult).toFixed(1), actual: d.actual }))
  const expanded = expandRateToGranularity(fyRows, granularity, ['target', 'actual'])
  // Aux breakdown (top 3 contributing codes) and adherence % are added per resulting
  // period (not carried through the expansion helper, which only knows about the rate
  // fields it's told to keep) so the tooltip has something to show at every
  // granularity, not just Year. A gap can genuinely be driven by more than one Aux
  // code, so the tooltip shows the top 3 by impact rather than a single culprit.
  return expanded.map((d, i) => {
    const auxBreakdown = [0, 1, 2]
      .map(k => ({
        code: AUX_CODES[(i + k * 2) % AUX_CODES.length],
        impactPct: +(1.5 + ((i * 5 + k * 7) % 7)).toFixed(1),
      }))
      .sort((a, b) => b.impactPct - a.impactPct)
    return {
      ...d,
      adherence: d.target ? +((d.actual / d.target) * 100).toFixed(1) : 0,
      auxBreakdown,
      auxCulprit: auxBreakdown[0].code,
      auxImpactPct: auxBreakdown[0].impactPct,
    }
  })
}

// ── Utilization by queue — "Utilization Defaulter Queues" (Layer 3, Visual 2) ─
// Top-N queues by |utilization gap|, worst first — same "top queues" ranking
// convention as the Forecasting page's diverging variance charts. Each queue now
// carries its top 3 contributing Aux codes, not just a single culprit.
// `planSelection` (optional/additive, defaults to 'Actual' so existing behavior is
// unchanged) rescales each queue's own utilTarget via planMultiplier — this visual's
// own Plan dropdown then genuinely moves the displayed target/adherence per queue.
export function utilizationByQueue(filters = {}, topN = 6, planSelection = 'Actual') {
  const mult = planMultiplier(planSelection)
  const rows = filterCapacityQueues(filters)
  const hasQueue = filters.combinedQueueName?.length > 0
  const list = hasQueue ? rows : [...rows].sort((a, b) => Math.abs(b.utilGap) - Math.abs(a.utilGap)).slice(0, topN)
  return list.map(q => {
    const ci = AUX_CODES.indexOf(q.auxCulprit)
    const auxes = [q.auxCulprit, AUX_CODES[(ci + 3) % AUX_CODES.length], AUX_CODES[(ci + 6) % AUX_CODES.length]]
    const target = +(q.utilTarget * mult).toFixed(1)
    return {
      name: q.name, actual: q.utilActual, target,
      adherence: target ? +((q.utilActual / target) * 100).toFixed(1) : 0,
      auxCulprit: q.auxCulprit,
      auxes,
    }
  })
}

// ── Outage: Actual vs Target Leaves by queue (Layer 3, Visual 3) ──────────────
// Picks the queues with the biggest |actual-vs-plan leaves| gap first (so the real
// problem queues aren't missed), then displays that shortlist in ascending order
// by delta, per the requested "arranged in ascending order."
// `planSelection` (optional/additive, defaults to 'Actual' so existing behavior is
// unchanged) rescales each queue's own leavesPlan (the Target series) via
// planMultiplier — this visual's own Plan dropdown then genuinely moves the target
// bar and the delta computed from it.
export function leavesByQueue(filters = {}, topN = 6, planSelection = 'Actual') {
  const mult = planMultiplier(planSelection)
  const rows = filterCapacityQueues(filters)
  const hasQueue = filters.combinedQueueName?.length > 0
  const list = hasQueue ? rows : [...rows].sort((a, b) => Math.abs(b.leavesDelta) - Math.abs(a.leavesDelta)).slice(0, topN)
  return list
    .map(q => {
      const target = Math.round(q.leavesPlan * mult)
      return { name: q.name, actual: q.leavesActual, target, delta: q.leavesActual - target }
    })
    .sort((a, b) => a.delta - b.delta)
}

// ── Cases per FTE (Key Metrics card) ──────────────────────────────────────────
const BASE_CPF_PLAN = { FY25: 14.5, FY26: 15.2, FY27: 16.0 }

export const CPF_BY_FY = FISCAL_YEARS.map((fy, i) => ({
  period: fy, plan: BASE_CPF_PLAN[fy],
  actual: +(BASE_CPF_PLAN[fy] * (1.05 + (i * 4 % 8) / 100)).toFixed(1),
}))

// Cases per FTE is a rate (cases handled per head), so its trend chart uses the
// rate-preserving expansion, same reasoning as UCR target/current on TSA Forecasting.
export function cpfByFY(filters = {}, granularity) {
  const years = effectiveFiscalYears(filters)
  const fyRows = CPF_BY_FY.filter(d => years.includes(d.period)).map(d => ({ period: d.period, actual: d.actual, plan: d.plan }))
  return expandRateToGranularity(fyRows, granularity, ['actual', 'plan'])
}

// Year-over-year % change between the latest in-scope FY and the one before it;
// null when there's no prior year in scope, same convention as tsaData.js's yoyPct.
function yoyPct(curr, prev) {
  if (prev === undefined || prev === null || !prev) return null
  return +(((curr - prev) / prev) * 100).toFixed(1)
}

// ── Card headlines ─────────────────────────────────────────────────────────
// The headline `value`/`actual` AND the `period`/`prevPeriod`/`yoyPct` comparison
// both drill with the page-wide Quarter/Month/Week slicer (granularity) — 2026-07-20
// change, superseding the prior "comparison always stays FY-over-FY" decision, per
// direct request ("compare Month-over-Month and Quarter-over-Quarter instead of
// always comparing against last year where applicable"). Each metric already has a
// granularity-aware selector (hcStaffingByFY/utilizationByFY/slTrendByFY/
// attritionByFY) built for its own drill-down chart, so no new expansion logic was
// needed — this just reuses the last two entries of those same series for the
// latest/prev comparison instead of a separate FY-only lookup. Staffing/Utilization/
// SL adherence % naturally don't shift with queue-scoping filters (both sides of each
// ratio scale together) — only headcount totals (Total FTE) visibly respond, same
// reasoning as the Forecasting/TSA cards' rate metrics.
export function capacityCardData(filters = {}, granularity) {
  const years = effectiveFiscalYears(filters)
  const hcGranular = hcStaffingByFY(filters, granularity)
  const utilGranular = utilizationByFY(filters, granularity)
  const slGranular = slTrendByFY(filters, granularity)
  const attritionGranular = attritionByFY(filters, granularity)
  const cpfFY = CPF_BY_FY.filter(d => years.includes(d.period))

  const latestHc = hcGranular[hcGranular.length - 1]
  const prevHc = hcGranular[hcGranular.length - 2]
  const latestUtil = utilGranular[utilGranular.length - 1]
  const prevUtil = utilGranular[utilGranular.length - 2]
  const latestSl = slGranular[slGranular.length - 1]
  const prevSl = slGranular[slGranular.length - 2]
  const latestAttrition = attritionGranular[attritionGranular.length - 1]
  const prevAttrition = attritionGranular[attritionGranular.length - 2]
  const latestCpf = cpfFY[cpfFY.length - 1]

  return {
    staffing: {
      value: latestHc?.adherence ?? 0,
      period: latestHc?.period, prevPeriod: prevHc?.period, yoyPct: yoyPct(latestHc?.adherence, prevHc?.adherence),
    },
    utilization: {
      actual: latestUtil?.actual ?? 0, target: latestUtil?.target ?? 0,
      period: latestUtil?.period, prevPeriod: prevUtil?.period, yoyPct: yoyPct(latestUtil?.actual, prevUtil?.actual),
    },
    sl: {
      // BASE_SL_TARGET is keyed by bare FY ("FY27"), but latestSl.period may now be a
      // granular label ("FY27 Q1") — the first 4 characters are always the FY, same
      // convention periodsForGranularity() already relies on (p.slice(0,4)).
      actual: latestSl?.slPct ?? 0, target: latestSl ? BASE_SL_TARGET[latestSl.period.slice(0, 4)] : 0,
      period: latestSl?.period, prevPeriod: prevSl?.period, yoyPct: yoyPct(latestSl?.slPct, prevSl?.slPct),
    },
    casesPerFte: {
      actual: latestCpf?.actual ?? 0, plan: latestCpf?.plan ?? 0, period: latestCpf?.period,
    },
    attrition: {
      actual: latestAttrition?.attrition ?? 0, target: latestAttrition ? BASE_ATTRITION_TARGET[latestAttrition.period.slice(0, 4)] : 0,
      period: latestAttrition?.period, prevPeriod: prevAttrition?.period, yoyPct: yoyPct(latestAttrition?.attrition, prevAttrition?.attrition),
    },
  }
}

// ── Geo Map: headcount fulfillment % / SL% by region, with a Sub-region lens ──────
// Same choropleth mechanism as Layer3GeoMap/TsaGeoMap (region fill, dimmed fallback
// for non-highlighted areas in Sub-region view) but colored by whichever of the two
// capacity metrics the map's own toggle picks. Sub-region view uses the same real
// 24 SUB_REGIONS values (and subRegionForCountry lookup) as MSG Forecasting's own
// Geo Map, replacing the earlier curated 14-country view entirely.
export const GEO_CAPACITY_BY_REGION = [
  { region: 'NAMER', fulfillmentPct: 96, slPct: 92 },
  { region: 'EMEA', fulfillmentPct: 91, slPct: 81 },
  { region: 'APJ', fulfillmentPct: 94, slPct: 88 },
  { region: 'LATAM', fulfillmentPct: 88, slPct: 76 },
]

export function geoCapacityByRegion(filters = {}) {
  return GEO_CAPACITY_BY_REGION.filter(d => matchesMulti(filters.region, d.region))
}

// Per-sub-region value nudges a rotating region baseline deterministically, same
// "real names + illustrative structure" convention as mockData.js's SUB_REGION_ACCURACY.
export const GEO_CAPACITY_BY_SUBREGION = SUB_REGIONS.map((subRegion, i) => {
  const base = GEO_CAPACITY_BY_REGION[i % GEO_CAPACITY_BY_REGION.length]
  return {
    subRegion,
    fulfillmentPct: Math.max(60, Math.min(100, base.fulfillmentPct + ((i * 7) % 9) - 4)),
    slPct: Math.max(60, Math.min(100, base.slPct + ((i * 5) % 9) - 4)),
  }
})

export function geoCapacityBySubRegion(filters = {}, metric = 'fulfillmentPct') {
  return GEO_CAPACITY_BY_SUBREGION
    .filter(d => matchesMulti(filters.subRegion, d.subRegion))
    .map(d => ({ subRegion: d.subRegion, value: d[metric] }))
}

export { regionForCountry, subRegionForCountry }
