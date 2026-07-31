// Mock data + selectors for the TSA Forecasting page (ASU / SR / UCR).
// Structurally mirrors mockData.js (multi-select filters as arrays, FY-level charts
// narrowed by the most specific time filter, real names paired with illustrative
// numbers) but is a fully separate module — TSA Forecasting has its own filter set
// and metrics, and keeping it decoupled avoids any risk to the MSG Forecasting page.
import {
  FISCAL_YEARS, FISCAL_QUARTERS, FISCAL_WEEK_LIST, FISCAL_MONTH_LIST, BUSINESS_PARTNERS, REGIONS,
  regionForCountry, matchesMulti, inferRegion, periodsForGranularity, expandToGranularity, expandRateToGranularity,
} from './mockData'

export { FISCAL_MONTH_LIST }

// Real Enterprise TSG product/technology lines (business-supplied).
export const LOB_LIST = [
  'BackupWave', 'CryptoGuard', 'Connectivity', 'DataVault', 'DLX', 'DPQ', 'CoreSolutions',
  'E2E Connectivity', 'Enterprise', 'NEXUS', 'Global Solutions', 'High End Storage',
  'Hyperconverged', 'Integrated_Software', 'Mainframe', 'Midrange', 'BackupLink',
  'Networking', 'OBJ', 'FlexCore', 'ProtectCore', 'ProtectCore Cyber', 'ScaleVault',
  'GuardPoint', 'RPX', 'Server', 'Storage', 'ApexArray', 'ApexSW', 'CloudBase', 'MeshLink',
  'NovaTech Partners', 'FlashCore',
]

// Real business-supplied groupings (confirmed 2026-07-03 via screenshot), replacing
// the earlier inferred ['Consumer','Commercial','Enterprise'] placeholder.
export const GLOBAL_GROUPING_LIST = ['COMPUTE/NETWORKING', 'DPU/UDX', 'HCX', 'OTHER', 'PRIMARY/MIDRANGE']

const TSA_FILTER_KEYS = ['lob', 'businessPartner', 'globalGrouping']
const TSA_FIELD_BY_KEY = { lob: 'lob', businessPartner: 'businessPartner', globalGrouping: 'globalGrouping' }

// Week > Month > Quarter > Year precedence, same idea as Forecasting's effectiveFiscalYears,
// extended with the extra Month granularity this page's filter bar has.
export function tsaEffectiveFiscalYears(filters = {}) {
  const picked = (filters.fiscalWeek?.length && filters.fiscalWeek)
    || (filters.fiscalMonth?.length && filters.fiscalMonth)
    || (filters.fiscalQuarter?.length && filters.fiscalQuarter)
    || (filters.fiscalYear?.length && filters.fiscalYear)
  if (!picked) return FISCAL_YEARS
  return FISCAL_YEARS.filter(fy => picked.some(v => v.slice(0, 4) === fy))
}

// ── LOB fact table ───────────────────────────────────────────────────────────
// Every LOB gets a deterministic businessPartner/globalGrouping tag (round-robin,
// same "real names, illustrative structure" approach as the Forecasting queue table)
// so the LOB/Business Partner/Global Grouping filters have something genuine to narrow.
export const LOB_FACTS = LOB_LIST.map((lob, i) => ({
  lob,
  businessPartner: BUSINESS_PARTNERS[i % BUSINESS_PARTNERS.length],
  globalGrouping: GLOBAL_GROUPING_LIST[i % GLOBAL_GROUPING_LIST.length],
}))

export function filterLobs(filters = {}) {
  return LOB_FACTS.filter(l =>
    TSA_FILTER_KEYS.every(key => matchesMulti(filters[key], l[TSA_FIELD_BY_KEY[key]]))
  )
}

// Scale factor applied to every FY-level metric below: shrinks proportionally to how
// many LOBs the current filters leave in scope, same "volume tracks queue count" logic
// Forecasting's callVolumeByFY uses.
function lobScopeRatio(filters) {
  const total = LOB_FACTS.length
  return total ? filterLobs(filters).length / total : 0
}

// ── ASU & SR baselines ───────────────────────────────────────────────────────
const BASE_ASU = { FY25: 18000, FY26: 21000, FY27: 24000 }
const BASE_SR  = { FY25: 9500,  FY26: 11000, FY27: 12800 }

export const ASU_BY_FY = FISCAL_YEARS.map(fy => ({
  period: fy,
  plan: BASE_ASU[fy],
  actual: Math.round(BASE_ASU[fy] * (0.90 + Math.random() * 0.08)),
  get adherence() { return +((this.actual / this.plan) * 100).toFixed(1) },
}))

export const SR_BY_FY = FISCAL_YEARS.map(fy => ({
  period: fy,
  plan: BASE_SR[fy],
  actual: Math.round(BASE_SR[fy] * (0.90 + Math.random() * 0.08)),
  get adherence() { return +((this.actual / this.plan) * 100).toFixed(1) },
}))

export const ASU_PLAN_VS_PLAN_BY_FY = FISCAL_YEARS.map(fy => ({
  period: fy,
  plan1: BASE_ASU[fy],
  plan2: Math.round(BASE_ASU[fy] * (0.93 + Math.random() * 0.1)),
  get variance() { return +((this.plan2 - this.plan1) / this.plan1 * 100).toFixed(1) },
}))

export const SR_PLAN_VS_PLAN_BY_FY = FISCAL_YEARS.map(fy => ({
  period: fy,
  plan1: BASE_SR[fy],
  plan2: Math.round(BASE_SR[fy] * (0.93 + Math.random() * 0.1)),
  get variance() { return +((this.plan2 - this.plan1) / this.plan1 * 100).toFixed(1) },
}))

// `planName` (optional, added 2026-07-30) closes a KNOWN cosmetic gap: AsuLayer/
// SrLayer Visual1's own Plan Name dropdown used to change state without ever
// feeding into this selector (see tech_spec.md Known Limitations). Reuses
// planPerformanceScale (defined below, hoisted — same function already used by
// asuSrPerformanceByLob) so both the ASU/SR Trend chart and the ASU/SR Performance
// table rescale "Plan" via the identical mechanism. Omitting planName keeps every
// existing caller's output unchanged (scale defaults to 1).
export function asuByFY(filters = {}, granularity, planName) {
  const years = tsaEffectiveFiscalYears(filters)
  const ratio = lobScopeRatio(filters)
  const scale = planPerformanceScale(planName)
  const fyRows = ASU_BY_FY.filter(d => years.includes(d.period))
    .map(d => ({ period: d.period, plan: Math.round(d.plan * ratio * scale), actual: Math.round(d.actual * ratio) }))
  return expandToGranularity(fyRows, granularity, ['plan', 'actual'])
    .map(d => ({ ...d, adherence: d.plan ? +((d.actual / d.plan) * 100).toFixed(1) : 0 }))
}

export function srByFY(filters = {}, granularity, planName) {
  const years = tsaEffectiveFiscalYears(filters)
  const ratio = lobScopeRatio(filters)
  const scale = planPerformanceScale(planName)
  const fyRows = SR_BY_FY.filter(d => years.includes(d.period))
    .map(d => ({ period: d.period, plan: Math.round(d.plan * ratio * scale), actual: Math.round(d.actual * ratio) }))
  return expandToGranularity(fyRows, granularity, ['plan', 'actual'])
    .map(d => ({ ...d, adherence: d.plan ? +((d.actual / d.plan) * 100).toFixed(1) : 0 }))
}

// `planA`/`planB` (optional, added 2026-07-31) close a KNOWN cosmetic gap: Visual2
// "Plan vs Plan Comparison"'s own Plan A/Plan B dropdowns used to change state
// without ever feeding into this selector (they only relabeled the legend). Reuses
// planPerformanceScale independently per side — plan1 depends only on planA, plan2
// only on planB — same mechanism asuByFY/srByFY already use for their Plan Name
// dropdown, so this stays consistent with the rest of the page rather than
// inventing a second scaling function.
export function asuPlanVsPlanByFY(filters = {}, granularity, planA, planB) {
  const years = tsaEffectiveFiscalYears(filters)
  const ratio = lobScopeRatio(filters)
  const scaleA = planPerformanceScale(planA)
  const scaleB = planPerformanceScale(planB)
  const fyRows = ASU_PLAN_VS_PLAN_BY_FY.filter(d => years.includes(d.period))
    .map(d => ({ period: d.period, plan1: Math.round(d.plan1 * ratio * scaleA), plan2: Math.round(d.plan2 * ratio * scaleB) }))
  return expandToGranularity(fyRows, granularity, ['plan1', 'plan2'])
    .map(d => ({ ...d, variance: d.plan1 ? +((d.plan2 - d.plan1) / d.plan1 * 100).toFixed(1) : 0 }))
}

export function srPlanVsPlanByFY(filters = {}, granularity, planA, planB) {
  const years = tsaEffectiveFiscalYears(filters)
  const ratio = lobScopeRatio(filters)
  const scaleA = planPerformanceScale(planA)
  const scaleB = planPerformanceScale(planB)
  const fyRows = SR_PLAN_VS_PLAN_BY_FY.filter(d => years.includes(d.period))
    .map(d => ({ period: d.period, plan1: Math.round(d.plan1 * ratio * scaleA), plan2: Math.round(d.plan2 * ratio * scaleB) }))
  return expandToGranularity(fyRows, granularity, ['plan1', 'plan2'])
    .map(d => ({ ...d, variance: d.plan1 ? +((d.plan2 - d.plan1) / d.plan1 * 100).toFixed(1) : 0 }))
}

// ── ASU/SR Performance table (above the Geo Map) — LOB × Fiscal Quarter matrix ────
// Each in-scope LOB's row is a deterministic per-LOB SHARE of the exact same
// quarter-level ASU/SR totals asuByFY/srByFY already compute (at 'Quarter'
// granularity) — so every LOB row sums back to the real quarterly total shown on
// this page's own ASU/SR Trend charts, same "sums back to the real total" property
// the region/sub-region share-weighted selectors elsewhere in this app already have.
const PERFORMANCE_LOB_WEIGHTS = LOB_LIST.map((_, i) => 0.5 + ((i * 13) % 37) / 37 * 2.5)

// Deterministic scale factor per named Plan (2026-07-29) — this page's own
// AsuLayer/SrLayer Visual1 "Plan Name" dropdown is a KNOWN cosmetic exception (see
// tech_spec.md Known Limitations, it never fed into asuByFY/srByFY); this new
// table's own dropdown deliberately doesn't repeat that gap, so it genuinely
// rescales the Plan column.
function planPerformanceScale(planName) {
  if (!planName) return 1
  let hash = 0
  for (let i = 0; i < planName.length; i++) hash = (hash * 31 + planName.charCodeAt(i)) % 97
  return 0.88 + (hash / 96) * 0.24
}

export function asuSrPerformanceByLob(filters = {}, metric = 'ASU', planName) {
  const quarters = metric === 'SR' ? srByFY(filters, 'Quarter') : asuByFY(filters, 'Quarter')
  const scale = planPerformanceScale(planName)
  const scoped = filterLobs(filters)
  const lobs = scoped.length ? scoped : LOB_FACTS
  // Weight total is computed over whichever LOBs are ACTUALLY in scope (not always
  // all 33) so each row's share still sums back to asuByFY/srByFY's own total, which
  // is itself already scaled down by the same in-scope LOB count (lobScopeRatio) —
  // dividing by the full 33-LOB weight total here would under-count when filtered.
  const weightTotal = lobs.reduce((sum, l) => sum + (PERFORMANCE_LOB_WEIGHTS[LOB_LIST.indexOf(l.lob)] ?? 1), 0) || 1
  return lobs.map(l => {
    const weight = PERFORMANCE_LOB_WEIGHTS[LOB_LIST.indexOf(l.lob)] ?? 1
    const share = weight / weightTotal
    const byQuarter = quarters.map(q => {
      const actual = Math.round(q.actual * share)
      const plan = Math.round(q.plan * share * scale)
      return { period: q.period, actual, plan, adherence: plan ? +((actual / plan) * 100).toFixed(1) : 0 }
    })
    return { lob: l.lob, quarters: byQuarter }
  })
}

// Which of the 4 real geographic regions (that TsaGeoMap's choropleth already colors
// via regionForCountry) each real LOB belongs to — no such mapping has been supplied,
// so this is a deterministic round-robin placeholder (same "real names, illustrative
// structure" convention as LOB_FACTS' businessPartner/globalGrouping tags), letting
// the Geo Map's hover popup show a genuine, real-LOB-named subset per region rather
// than every LOB appearing under every region.
const GEO_LOB_REGIONS = ['NAMER', 'LATAM', 'APJ', 'EMEA']
const LOB_REGION_ASSIGNMENTS = LOB_LIST.map((lob, i) => ({ lob, region: GEO_LOB_REGIONS[i % GEO_LOB_REGIONS.length] }))

// Per-LOB ASU/SR actual/plan/adherence for one region's hovered Geo Map popup (2026-
// 07-29) — reuses asuSrPerformanceByLob directly (the same selector the ASU/SR
// Performance table above this map already uses), narrowed to this region's LOBs and
// collapsed to the LATEST in-scope quarter — a hover popup wants a snapshot, not the
// full per-quarter history the table shows.
export function geoLobPerformanceByRegion(region, filters = {}, metric = 'ASU', planName) {
  const regionLobs = new Set(LOB_REGION_ASSIGNMENTS.filter(l => l.region === region).map(l => l.lob))
  return asuSrPerformanceByLob(filters, metric, planName)
    .filter(l => regionLobs.has(l.lob))
    .map(l => {
      const latest = l.quarters[l.quarters.length - 1]
      return { lob: l.lob, actual: latest?.actual ?? 0, plan: latest?.plan ?? 0, adherence: latest?.adherence ?? 0 }
    })
}

// ── CPASU (= SR / ASU) ─────────────────────────────────────────────────────
export function cpasuByFY(filters = {}, granularity) {
  const asu = asuByFY(filters, granularity)
  const sr = srByFY(filters, granularity)
  return asu.map((a, i) => ({
    period: a.period, asu: a.actual, sr: sr[i].actual,
    cpasu: a.actual ? +(sr[i].actual / a.actual).toFixed(2) : 0,
  }))
}

// ── UCR (current vs target) ──────────────────────────────────────────────────
const BASE_UCR_TARGET = { FY25: 82, FY26: 85, FY27: 88 }

export const UCR_BY_FY = FISCAL_YEARS.map(fy => ({
  period: fy,
  target: BASE_UCR_TARGET[fy],
  current: +(BASE_UCR_TARGET[fy] * (0.92 + Math.random() * 0.06)).toFixed(1),
  get adherence() { return +((this.current / this.target) * 100).toFixed(1) },
}))

// Now responds to the global granularity toggle like every other chart on this page —
// supersedes the 2026-07-02 "always Fiscal Year" decision for this chart specifically
// (see design_choice.md), since the toggle is meant to make every time-axis chart
// interactive, not just some of them.
export function ucrByFY(filters = {}, granularity) {
  const years = tsaEffectiveFiscalYears(filters)
  const fyRows = UCR_BY_FY.filter(d => years.includes(d.period))
    .map(d => ({ period: d.period, target: d.target, current: d.current }))
  return expandRateToGranularity(fyRows, granularity, ['target', 'current'])
    .map(d => ({ ...d, adherence: d.target ? +((d.current / d.target) * 100).toFixed(1) : 0 }))
}

// ── SR handled by Bots vs humans, plus SR Plan (Layer 3 "UCR Impact on SR") ───
// `planName` (optional, added 2026-07-30) closes another KNOWN cosmetic gap: "UCR
// Impact on SR"'s own Plan Name dropdown used to change state without ever feeding
// into this selector. Threads straight through to srByFY, which already does the
// real rescaling.
export function srBotsByFY(filters = {}, granularity, planName) {
  const sr = srByFY(filters, granularity, planName)
  return sr.map(d => {
    const botsSR = Math.round(d.actual * 0.35)
    return { period: d.period, humanSR: d.actual - botsSR, botsSR, plan: d.plan }
  })
}

// ── DB/OSP split of SR actuals (SR Actuals card drill-down + YTD bifurcation) ────
// 2026-07-30: DB's share of each period's SR actual now varies period-to-period
// (~0.62-0.74) instead of a fixed 0.7 — a fixed fraction of the SAME underlying
// total means DB's and OSP's own period-over-period % change would always be
// IDENTICAL to the combined SR change (only integer-rounding noise would differ
// them), which is exactly the "no real bifurcation" gap the Service Requests
// card's YTD line was flagged for. Verified with real numbers before shipping:
// the fixed-0.7 split gave DB/OSP/overall all the same 7.8% change on one sample
// year; the varying share gives genuinely different values (e.g. +17.4% / -12.4%).
// db+osp still sums to the exact same `actual` each period, so this page's own
// combined SR headline number and the drill-down chart's totals are unaffected.
export function srDbOspByFY(filters = {}, granularity) {
  const sr = srByFY(filters, granularity)
  return sr.map((d, i) => {
    const dbShare = 0.62 + ((i * 7) % 5) * 0.03
    const db = Math.round(d.actual * dbShare)
    return { period: d.period, db, osp: d.actual - db }
  })
}

// ── Top LOBs not adhering to UCR target, by clicked period ────────────────────
// Backs the "UCR Runrate with Target" bar-click modal (Layer 03, Visual 3). `period`
// is whatever label the clicked bar carries — a fiscal year ('FY27') when the global
// granularity toggle is on Year, but a quarter/month/week label ('FY27Q2', 'FY27M03',
// 'FY27W14') once that chart started responding to the toggle too — the target/index
// lookups just key off the year prefix either way.
export function topNonAdherentLobsByYear(filters = {}, period, count = 5) {
  const year = period.slice(0, 4)
  const target = UCR_BY_FY.find(d => d.period === year)?.target ?? 85
  const yearIndex = FISCAL_YEARS.indexOf(year)
  const pool = filterLobs(filters).length ? filterLobs(filters) : LOB_FACTS
  return pool
    .map((l, i) => ({
      lob: l.lob,
      runrate: +(target - (2 + ((i * 5 + yearIndex * 11) % 15) / 2)).toFixed(1),
      target,
    }))
    .sort((a, b) => a.runrate - b.runrate)
    .slice(0, count)
}

// ── Real per-LOB queue lists (business-supplied) ──────────────────────────────
// Only "High End Storage" has real data so far; other LOBs fall back to a generic
// cross-LOB sample (Forecasting's queue list) until their real lists arrive.
export const LOB_QUEUES = {
  'High End Storage': {
    active: [
      'APJ DPU BACKUPWAVE', 'APJ DPU BACKUPWAVE Chinese', 'APJ DPU DataVault', 'APJ DPU DataVault Chinese',
      'APJ DPU BackupLink', 'APJ DPU BackupLink Chinese', 'APJ TSA Connectivity Chinese', 'APJ TSA CSX Chinese',
      'APJ TSA Integrated_Software Chinese', 'APJ TSA MIDRANGE Chinese', 'APJ TSA MIDRANGE Japanese',
      'APJ TSA ApexArray Chinese', 'APJ TSA ApexArray Japanese', 'APJ TSA ApexArray Korean',
      'APJ TSA ApexSW Chinese', 'APJ TSA MeshLink Chinese', 'APJ TSA FlashCore', 'APJ UDX ScaleVault Chinese',
      'APJ UDX ScaleVault Japanese', 'EMEA DPU BACKUPWAVE', 'EMEA DPU DataVault', 'EMEA DPU BackupLink',
      'EMEA UDX ScaleVault', 'Global Compute Hardware', 'Global Connectivity Backline', 'Global Connectivity FL',
      'Global DLX Backline', 'GLOBAL DPU BACKUPWAVE', 'GLOBAL DPU DataVault', 'GLOBAL DPU DPQ',
      'GLOBAL DPU CoreSolutions', 'GLOBAL DPU BackupLink', 'GLOBAL DPU ProtectCore', 'Global DPU ProtectCore Cyber',
      'GLOBAL DPU GuardPoint', 'Global MSG Midrange Backline', 'GLOBAL TSA Integrated_Software',
      'GLOBAL TSA MIDRANGE Backline', 'Global TSA Midrange FL', 'Global Integrated Software FL',
      'Global Mainframe Backline', 'Global Networking', 'Global EdgeCore DSE', 'Global Solutions HCI DE',
      'Global Solutions MS DE', 'Global ApexArray Backline', 'Global ApexArray FL', 'Global ApexArray SW FL',
      'Global ApexSW Backline', 'Global TELCO', 'GLOBAL UDX OBJ', 'GLOBAL UDX ScaleVault',
      'Global MeshLink Backline', 'Global MeshLink FL', 'Global RailFlex', 'Global RailFlex Domain Engineer',
      'HCX APJ RailFlex Chinese', 'HCX APJ RailFlex Japanese', 'HCX APJ RailFlex Korean', 'HCX LATAM BRZ RailFlex',
      'HCX LATAM MMCLA RailFlex', 'LATAM BackupWave Portuguese', 'LATAM BackupWave Spanish', 'LATAM DataVault Portuguese',
      'LATAM DataVault Spanish', 'LATAM ElastiStore Portuguese', 'LATAM ElastiStore Spanish', 'LATAM BackupLink Portuguese',
      'LATAM BackupLink Spanish', 'LATAM ScaleVault Portuguese', 'LATAM ScaleVault Spanish',
      'LATAM Primary Storage Portuguese', 'LATAM Primary Storage Spanish', 'NAMER DPU BACKUPWAVE',
      'NAMER DPU DataVault', 'NAMER DPU BackupLink', 'NAMER UDX ScaleVault', 'RPX Remote Proactive Services',
    ],
    inactive: [
      'AMER English BackupWave', 'AMER English Connectivity', 'AMER English DataVault',
      'AMER English Integrated Software', 'AMER English BackupLink', 'AMER English OBJ',
      'AMER English ScaleVault', 'AMER English ApexMax', 'AMER English MeshLink', 'AMER English FlashCore',
      'ANZ Midrange Storage NexaVault', 'ANZ RailFlex Storage', 'APJ DPU CoreSolutions', 'APJ DPU CoreSolutions Chinese',
      'APJ English Midrange', 'APJ English ScaleVault', 'APJ English RailFlex', 'APJ TSA Connectivity',
      'APJ TSA Integrated_Software', 'APJ TSA MIDRANGE', 'APJ TSA ApexArray', 'APJ TSA ApexSW',
      'APJ TSA MeshLink', 'APJ UDX OBJ', 'APJ UDX ScaleVault', 'CCC TSA RailFlex Hyperconverged',
      'CCC Midrange Storage NexaVault', 'CCC RailFlex Storage', 'EMEA English BackupWave', 'EMEA English Connectivity',
      'EMEA English DataVault', 'EMEA English Integrated Software', 'EMEA English BackupLink',
      'EMEA English OBJ', 'EMEA English ScaleVault', 'EMEA English ApexMax', 'EMEA English MeshLink',
      'EMEA English FlashCore', 'EMEA TSA Connectivity', 'EMEA TSA Integrated_Software', 'EMEA TSA MIDRANGE',
      'EMEA TSA ApexArray', 'EMEA TSA ApexSW', 'EMEA TSA MeshLink', 'EMEA TSA FlashCore', 'EMEA ScaleVault CTE',
      'EMEA UDX OBJ', 'French Midrange', 'French RailFlex', 'German Midrange', 'German RailFlex',
      'GLOBAL DPU CloudLift', 'GLOBAL DPU DPADSRT', 'GLOBAL DPU ArchiveOne', 'GLOBAL TSA MIDRANGE',
      'GLOBAL TSA FlashCore', 'Global RailFlex CTE', 'HCX APJ RailFlex', 'HCX APJ RailFlex English NAMER AOH',
      'HCX EMEA RailFlex', 'HCX Global SummitLine', 'HCX Global Cloud Solutions', 'HCX Global Converged',
      'HCX Global FlexCore', 'HCX Global Solutions', 'HCX Global VirtuStack', 'HCX Global RailFlex',
      'HCX INDIA RailFlex', 'HCX LATAM RailFlex', 'HCX NAMER RailFlex', 'TSA Global BACKUPWAVE', 'TSA Global CloudLift',
      'TSA Global Connectivity', 'TSA Global CSX Chat', 'TSA Global DataVault', 'TSA Global DLX',
      'TSA Global DPQ', 'TSA Global DPADSRT', 'TSA Global CoreSolutions', 'TSA Global CoreSolutions NOVATECH PARTNERS',
      'TSA Global E2E CONNECTIVITY', 'TSA Global Hyperconverged', 'TSA Global Mainframe',
      'TSA Global BackupLink', 'TSA Global OBJ', 'TSA Global ScaleVault', 'TSA Global ScaleVault Support',
      'TSA Global GuardPoint', 'TSA Global GuardPoint NOVATECH PARTNERS', 'TSA Global Solutions',
      'TSA Global ArchiveOne', 'TSA Global SSG', 'TSA Global ApexSW', 'TSA Global ApexMax', 'TSA Global MeshLink',
      'TSA Global FlashCore', 'IND Midrange Storage NexaVault', 'India DPU BACKUPWAVE', 'India DPU DataVault',
      'India DPU BackupLink', 'India TSA Connectivity', 'India TSA Integrated_Software', 'INDIA TSA MIDRANGE',
      'India TSA ApexSW', 'India TSA MeshLink', 'India TSA FlashCore', 'India UDX OBJ', 'India UDX ScaleVault',
      'Italian Midrange', 'JP Midrange Storage NexaVault', 'JP RailFlex Storage', 'LATAM DPU BACKUPWAVE',
      'LATAM DPU DataVault', 'LATAM DPU DPQ', 'LATAM DPU BackupLink', 'LATAM TSA MIDRANGE',
      'LATAM TSA ApexArray', 'LATAM TSA ApexSW', 'LATAM UDX OBJ', 'LATAM UDX ScaleVault',
      'Midrange Storage NexaVault', 'MMCLA Midrange Storage NexaVault', 'MMCLA Midrange Storage NexaVault Spanish',
      'MMCLA RailFlex Spanish', 'NA Midrange Storage NexaVault', 'NA ScaleVault HE Storage Voice',
      'NA RailFlex Storage', 'NAMER TSA Connectivity', 'NAMER TSA Integrated_Software', 'NAMER TSA MIDRANGE',
      'NAMER TSA ApexArray', 'NAMER TSA ApexSW', 'NAMER TSA MeshLink', 'NAMER TSA FlashCore', 'NAMER UDX OBJ',
      'POR Midrange Storage NexaVault', 'Spanish Midrange', 'Spanish RailFlex', 'UKI Midrange', 'UKI RailFlex', 'RailFlex',
    ],
  },
}

// NOTE: the per-queue non-adherent list that used to live here (keyed off
// LOB_QUEUES['High End Storage']) was replaced by topNonAdherentLobsByYear above
// when "UCR Runrate with Target" switched from an always-visible queue list to a
// year-click modal of top-5 non-adherent LOBs. LOB_QUEUES's real names are now
// used by the Total Queues card below instead.

// ── TSA Total Queues (Key Metrics card) ────────────────────────────────────────
// The business-supplied active/inactive queue lists for this page — same role
// ACTIVE_QUEUE_NAMES/INACTIVE_QUEUE_NAMES play for the Forecasting page's Total
// Queues card. Sourced from LOB_QUEUES['High End Storage'], the only per-queue
// list supplied so far; treated as the page-level TSA queue roster rather than
// scoped to one LOB, since it's the only real queue-name data this page has.
export const TSA_ACTIVE_QUEUE_NAMES = LOB_QUEUES['High End Storage'].active
export const TSA_INACTIVE_QUEUE_NAMES = LOB_QUEUES['High End Storage'].inactive

// Region tagged via the same name-prefix inference mockData.js uses for its own
// queue fact table (APJ/EMEA/LATAM/NAMER prefixes, else 'Global') — reused rather
// than duplicated, since the naming convention is identical across both queue lists.
export const TSA_ACTIVE_QUEUES = TSA_ACTIVE_QUEUE_NAMES.map(name => ({
  name, region: inferRegion(name),
}))

// ── Plan Impact Analysis: region-level Plan A/B + LOB contribution ────────────
// Requested 4-region set for Plan Impact (and reused by CPASU Trend's region
// breakdown below) — distinct from the full 5-region REGIONS used elsewhere on
// this page's Geo Map.
export const IMPACT_REGIONS = ['AMER', 'APJ', 'EMEA', 'Global']

function buildRegionPlans(base) {
  return IMPACT_REGIONS.map((region, i) => ({
    region,
    planA: Math.round(base * (0.85 - i * 0.15)),
    planB: Math.round(base * (0.80 - i * 0.14)),
  }))
}
export const ASU_REGION_PLANS = buildRegionPlans(BASE_ASU.FY27)
export const SR_REGION_PLANS = buildRegionPlans(BASE_SR.FY27)

function buildLobImpact(base) {
  const byRegion = {}
  IMPACT_REGIONS.forEach((region, ri) => {
    byRegion[region] = LOB_LIST.map((lob, i) => {
      // 17 is coprime with the prime modulus 131, so i -> i*17 mod 131 is injective
      // over i = 0..32 — every LOB gets a distinct residue (and thus a distinct delta)
      // within a given region, instead of collapsing into a handful of repeated values.
      const residue = (i * 17 + ri * 41) % 131
      const delta = Math.round(base * 0.10 * ((residue - 65) / 65))
      return { lob, delta }
    }).sort((a, b) => a.delta - b.delta)
  })
  return byRegion
}
const ASU_LOB_IMPACT_BY_REGION = buildLobImpact(BASE_ASU.FY27)
const SR_LOB_IMPACT_BY_REGION = buildLobImpact(BASE_SR.FY27)

export function asuRegionPlans(filters = {}) {
  return ASU_REGION_PLANS
}
export function srRegionPlans(filters = {}) {
  return SR_REGION_PLANS
}
export function asuLobImpact(region, count = 6) {
  return (ASU_LOB_IMPACT_BY_REGION[region] || []).slice(0, count)
}
export function srLobImpact(region, count = 6) {
  return (SR_LOB_IMPACT_BY_REGION[region] || []).slice(0, count)
}

// ── CPASU Trend (Layer 3, Visual 1) — regions shown by default, click a region ─
// to drill into its own trend at whatever time granularity is most specific in
// the top filter bar (Week > Quarter > Year), same precedence idea as
// tsaEffectiveFiscalYears but exposed as real distinct periods, not collapsed years.
const REGION_SHARE = { AMER: 0.38, EMEA: 0.27, APJ: 0.22, Global: 0.13 }

export function cpasuByRegion(filters = {}) {
  const cpasu = cpasuByFY(filters)
  const latest = cpasu[cpasu.length - 1] || { asu: 0, sr: 0, cpasu: 0 }
  return IMPACT_REGIONS.map(region => {
    const share = REGION_SHARE[region] ?? 1 / IMPACT_REGIONS.length
    const asu = Math.round(latest.asu * share)
    const sr = Math.round(latest.sr * share)
    return { region, asu, sr, cpasu: asu ? +(sr / asu).toFixed(2) : 0 }
  })
}

// Now driven by the global granularity toggle instead of inferring granularity from
// which time filter happened to be selected — the toggle is the one control meant to
// answer "what granularity" for every time-axis chart on the page, this one included.
// A falsy/'Year' value (the toggle's default, nothing selected) means plain fiscal
// years, same as every other chart's untouched default — not "fall back to Quarter."
export function regionTrendGranularity(filters = {}, granularity) {
  const years = tsaEffectiveFiscalYears(filters)
  if (!granularity || granularity === 'Year') return { granularity: 'Year', periods: years }
  return { granularity, periods: periodsForGranularity(granularity, years) }
}

function periodsPerYear(granularity) {
  return granularity === 'Week' ? 52 : granularity === 'Month' ? 12 : granularity === 'Quarter' ? 4 : 1
}

export function cpasuTrendByRegion(filters = {}, region, granularity) {
  const { periods } = regionTrendGranularity(filters, granularity)
  const share = REGION_SHARE[region] ?? 1 / IMPACT_REGIONS.length
  const ratio = lobScopeRatio(filters)
  const divisor = periodsPerYear(granularity)
  const ri = IMPACT_REGIONS.indexOf(region)
  return periods.map((period, i) => {
    const year = period.slice(0, 4)
    const baseAsu = (BASE_ASU[year] ?? BASE_ASU.FY27) / divisor
    const baseSr = (BASE_SR[year] ?? BASE_SR.FY27) / divisor
    const wobble = 0.92 + ((i * 13 + ri * 7) % 17) / 100
    const asu = Math.round(baseAsu * share * ratio * wobble)
    const sr = Math.round(baseSr * share * ratio * wobble)
    return { period, asu, sr, cpasu: asu ? +(sr / asu).toFixed(2) : 0 }
  })
}

// ── Geo Map: LOB adherence by region (choropleth, reuses Forecasting's country lookup) ─
// Colors the map by the SAME ASU/SR adherence the hover popup's per-LOB breakdown
// already shows (2026-07-29, replacing a synthetic adherence unrelated to either
// metric) — so the map's own metric toggle and Plan Name dropdown now genuinely
// change which color each region shows, not just the hover popup's numbers.
//
// geoLobPerformanceByRegion's own actual/plan reconcile to the real page-level total
// (every LOB gets the identical weight-based share for both, by design, so the
// ASU/SR Performance table's numbers sum back correctly) — which means the ratio
// between them is nearly constant across LOBs (only integer-rounding noise differs
// it). That's correct for a reconciling total, but wrong for a choropleth, which
// needs real region-to-region spread. geoAdherenceWobble() adds a deterministic
// per-LOB spread scoped to THIS map-coloring selector only — it does not touch
// geoLobPerformanceByRegion's own reconciling numbers (still shown verbatim in the
// hover popup's per-LOB list), same "separate, non-reconciling, map-color-only
// multiplier" precedent as tsaCapacityData.js's geoHeadcountEmphasis.
function geoAdherenceWobble(lob) {
  const i = LOB_LIST.indexOf(lob)
  return 0.6 + ((i * 17) % 80) / 100
}

export function geoAdherenceByRegion(filters = {}, metric = 'ASU', planName) {
  return GEO_LOB_REGIONS.map(region => {
    const lobs = geoLobPerformanceByRegion(region, filters, metric, planName)
    const actualSum = lobs.reduce((s, l) => s + l.actual * geoAdherenceWobble(l.lob), 0)
    const planSum = lobs.reduce((s, l) => s + l.plan, 0)
    const adherence = planSum ? Math.round((actualSum / planSum) * 100) : 0
    return { region, adherence, label: region }
  })
}
export { regionForCountry }

// % change between the latest in-scope period and the one before it. "Period" tracks
// whatever granularity the caller's series was built at (2026-07-20 fix — tsaCardData
// now forwards granularity into asuByFY/srByFY/cpasuByFY instead of always defaulting
// to Year, so this compares Month-over-Month or Quarter-over-Quarter when the page's
// Quarter/Month/Week toggle is set, falling back to Year-over-Year only at the Year
// default) — the name stayed `yoyPct` to avoid touching every call site, but it's
// period-over-period now. Null when there's no prior period in scope (e.g. filters
// narrowed to a single FY), so callers can fall back to an "n/a" message instead of a
// misleading 0%.
function yoyPct(curr, prev) {
  if (prev === undefined || prev === null || !prev) return null
  return +(((curr - prev) / prev) * 100).toFixed(1)
}

// ── Card headlines ─────────────────────────────────────────────────────────
// Latest in-scope fiscal year's snapshot for each of the 5 KPI cards, plus a
// YTD-vs-prior-year delta for the 3 cards that show a YTD message (ASU/SR/CPASU).
// totalQueues doesn't depend on filters — the TSA queue roster has no per-queue
// lob/businessPartner/globalGrouping tags to narrow by, same reasoning as why
// "UCR Runrate with Target" ignores Quarter/Week filters.
export function tsaCardData(filters = {}, granularity) {
  const asu = asuByFY(filters, granularity)
  const sr = srByFY(filters, granularity)
  const ucr = ucrByFY(filters, granularity)
  const cpasu = cpasuByFY(filters, granularity)
  const srDbOsp = srDbOspByFY(filters, granularity)
  const latestAsu = asu[asu.length - 1]
  const prevAsu = asu[asu.length - 2]
  const latestSr = sr[sr.length - 1]
  const prevSr = sr[sr.length - 2]
  const latestSrDbOsp = srDbOsp[srDbOsp.length - 1]
  const prevSrDbOsp = srDbOsp[srDbOsp.length - 2]
  const latestUcr = ucr[ucr.length - 1]
  const latestCpasu = cpasu[cpasu.length - 1]
  const prevCpasu = cpasu[cpasu.length - 2]
  return {
    totalQueues: { active: TSA_ACTIVE_QUEUE_NAMES.length, inactive: TSA_INACTIVE_QUEUE_NAMES.length },
    asuActuals: {
      value: latestAsu?.actual ?? 0, plan: latestAsu?.plan ?? 0, adherence: latestAsu?.adherence ?? 0,
      period: latestAsu?.period, prevPeriod: prevAsu?.period, yoyPct: yoyPct(latestAsu?.actual, prevAsu?.actual),
    },
    srActuals: {
      value: latestSr?.actual ?? 0, plan: latestSr?.plan ?? 0, adherence: latestSr?.adherence ?? 0,
      period: latestSr?.period, prevPeriod: prevSr?.period, yoyPct: yoyPct(latestSr?.actual, prevSr?.actual),
      // Per-channel YTD bifurcation (2026-07-30) — see srDbOspByFY's own comment for
      // why a genuinely varying DB share was needed for these to differ meaningfully.
      db: { value: latestSrDbOsp?.db ?? 0, yoyPct: yoyPct(latestSrDbOsp?.db, prevSrDbOsp?.db) },
      osp: { value: latestSrDbOsp?.osp ?? 0, yoyPct: yoyPct(latestSrDbOsp?.osp, prevSrDbOsp?.osp) },
    },
    cpasu: {
      value: latestCpasu?.cpasu ?? 0,
      period: latestCpasu?.period, prevPeriod: prevCpasu?.period, yoyPct: yoyPct(latestCpasu?.cpasu, prevCpasu?.cpasu),
    },
    currentUcr: { value: latestUcr?.current ?? 0, target: latestUcr?.target ?? 0, adherence: latestUcr?.adherence ?? 0 },
  }
}
