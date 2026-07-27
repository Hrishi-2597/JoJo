// Shared helpers (2026-07-27) backing every graph's new RCA/CLCA detail table across
// all 4 pages — contributing-factor tables for plan/actual comparisons, variance-tier
// + reason tables for "Top Queues/LOBs by Variance"-style rankings, and bucket-
// composition tables for distribution charts. One implementation so the same kind of
// popup looks and behaves consistently everywhere it's used.
import { HOLIDAYS } from './holidayCalendarData'

function hash(seed) {
  let h = 0
  const s = String(seed)
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 97
  return h
}

// ── Contributing factors (plan-comparison / actual-vs-plan charts) ───────────────
// Deterministic illustrative factors — NOT cross-referenced against the real Holiday
// Calendar here, because this app's chart periods (FY25/FY26/FY27, or Quarter/Month/
// Week sub-periods within them) are an independent illustrative labeling system, not
// tied to the one real FY27 calendar the sidebar's Holiday Calendar uses. Lining up an
// exact date against an illustrative period would be false precision, not a genuine
// cross-reference — see design_choice.md.
const ILLUSTRATIVE_FACTORS = [
  { factor: 'BP review delay', detail: 'Business partner sign-off landed after the plan lock date.' },
  { factor: 'Capacity ramp', detail: 'New headcount was still ramping up during this period.' },
  { factor: 'Seasonal demand shift', detail: 'Call volume moved earlier or later than the seasonal baseline.' },
  { factor: 'Escalation overflow', detail: 'A short-term escalation queue pulled volume from its usual routing.' },
  { factor: 'System/routing change', detail: 'A network or routing change affected part of the population mid-period.' },
  { factor: 'Cross-training gap', detail: 'Agents were still cross-training on the skill set this period needed.' },
  { factor: 'Late data extract', detail: 'The upstream actuals extract landed later than the usual cadence.' },
]

// Real, region-scoped holiday cross-reference (period-based charts don't get this —
// see the note above — but a REGION is a real, stable dimension both this app and the
// Holiday Calendar share, once mapped onto the Holiday Calendar's 3-region taxonomy).
const REGION_TO_HOLIDAY_REGION = { NAMER: 'AMER', LATAM: 'AMER', APJ: 'APJ', EMEA: 'EMEA' }

function realHolidayFactor(region) {
  const hr = REGION_TO_HOLIDAY_REGION[region]
  if (!hr) return null
  const matches = HOLIDAYS.filter(h => h.region === hr)
  if (!matches.length) return null
  const pick = matches[hash(region + 'holiday') % matches.length]
  return { factor: `Holiday: ${pick.name}`, detail: `${pick.country} · ${pick.date} (${pick.dow}) — real FY27 calendar` }
}

// `seed` should be something stable and specific to the chart point being explained
// (a period label, a period+region pair, etc.) so the same point always shows the same
// factors. `region`, if passed, adds one real holiday row via the mapping above.
export function contributingFactors(seed, region, count = 2) {
  const rows = []
  if (region) {
    const real = realHolidayFactor(region)
    if (real) rows.push(real)
  }
  const need = Math.max(0, count - rows.length)
  const h = hash(seed)
  for (let i = 0; i < need; i++) rows.push(ILLUSTRATIVE_FACTORS[(h + i * 17) % ILLUSTRATIVE_FACTORS.length])
  return rows
}

export const FACTOR_TABLE_COLUMNS = [
  { key: 'factor', label: 'Factor' },
  { key: 'detail', label: 'Detail', wrap: true },
]

// ── Variance tiers + reasons ("Top Queues/LOBs by Variance"-style rankings) ──────
// Thresholds calibrated against this app's real per-queue plan-variance range (~0.2%
// to ~7-8%, see mockData.js's ACTIVE_QUEUES comment) rather than picked arbitrarily.
export const VARIANCE_TIERS = [
  { key: 'high', label: 'High', min: 5 },
  { key: 'moderate', label: 'Moderate', min: 2 },
  { key: 'low', label: 'Low', min: 0 },
]

export function varianceTier(absVariance) {
  return VARIANCE_TIERS.find(t => absVariance >= t.min) ?? VARIANCE_TIERS[VARIANCE_TIERS.length - 1]
}

const VARIANCE_REASONS = [
  'Late plan sign-off pushed the baseline out of sync with actuals.',
  'A regional headcount change landed mid-cycle.',
  'Volume shifted between DB and OSP routing this period.',
  'A new queue is still ramping against an established plan.',
  'A short-term escalation absorbed volume from adjacent queues.',
  'The plan wasn’t re-baselined after a scope change.',
]

export function varianceReason(seed) {
  return VARIANCE_REASONS[hash(seed) % VARIANCE_REASONS.length]
}

export const VARIANCE_TABLE_COLUMNS = [
  { key: 'name', label: 'Queue', wrap: true },
  { key: 'tier', label: 'Tier' },
  { key: 'variance', label: 'Variance', align: 'right' },
  { key: 'reason', label: 'Likely reason', wrap: true },
]

// ── Bucket composition (distribution charts, e.g. Forecast Variance Distribution) ─
// The stacked-bar bucket percentages in mockData.js's STACKED_ADHERENCE are their own
// hand-curated illustrative aggregate (FY25-27 mix), independent of any single queue's
// real planVariance (which never exceeds ~8%) — so a literal per-queue breakdown of
// those buckets would show 3 of the 4 buckets as permanently empty. bucketQueues()
// below deterministically assigns in-scope queues to buckets IN THE SAME PROPORTIONS
// the chart already displays, with a synthesized (but stable, illustrative) variance
// value inside that bucket's own range — so clicking a bucket shows a believable,
// internally-consistent membership list instead of contradicting the chart above it.
const BUCKET_RANGES = {
  under10: [1, 9],
  between10and20: [10, 19],
  between20and30: [20, 29],
  above30: [30, 40],
}

const BUCKET_ORDER = ['under10', 'between10and20', 'between20and30', 'above30']
const BUCKET_LABEL = { under10: '< 10%', between10and20: '10–20%', between20and30: '20–30%', above30: '> 30%' }

function assignBuckets(rows, bucketShares) {
  const sorted = [...rows].sort((a, b) => hash(a.name) - hash(b.name))
  const total = sorted.length
  let cursor = 0
  const ranges = {}
  BUCKET_ORDER.forEach(k => {
    const count = Math.round((bucketShares[k] ?? 0) / 100 * total)
    ranges[k] = sorted.slice(cursor, cursor + count)
    cursor += count
  })
  return ranges
}

export function bucketQueues(rows, bucketShares, bucketKey) {
  const ranges = assignBuckets(rows, bucketShares)
  const [lo, hi] = BUCKET_RANGES[bucketKey] ?? [0, 9]
  return (ranges[bucketKey] ?? []).map(q => {
    const span = hi - lo
    const variance = span ? lo + (hash(q.name) % (span * 10)) / 10 : lo
    return { name: q.name, variance: +variance.toFixed(1), region: q.region }
  }).sort((a, b) => b.variance - a.variance)
}

// All 4 buckets combined into one table, each row tagged with which bucket it's in —
// backs a single popup table answering "which queues contributed to each band" instead
// of requiring one click per bucket.
export function allBucketsQueues(rows, bucketShares) {
  return BUCKET_ORDER.flatMap(key => bucketQueues(rows, bucketShares, key).map(q => ({ ...q, bucket: BUCKET_LABEL[key] })))
}

export const BUCKET_TABLE_COLUMNS = [
  { key: 'bucket', label: 'Bucket' },
  { key: 'name', label: 'Queue', wrap: true },
  { key: 'region', label: 'Region' },
  { key: 'variance', label: '|Variance| %', align: 'right' },
]
