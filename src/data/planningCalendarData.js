// Fiscal Calendar + Planning Cycle data (2026-07-27) — both extracted from real
// business-supplied sources: the Fiscal Calendar from a supplied FY27 calendar
// image, the Planning Cycle from a supplied Excel workbook (ghgh.xlsx, sheets
// "Overall FY27" and "Current Planning cycle"). Unlike the rest of this app's mock
// data, everything in this file is REAL content, not illustrative — dates, plan
// names, activity text, and holiday/SCO/Pay Date markers are all as-supplied.

const DAY_MS = 86400000

function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`)
  return new Date(d.getTime() + n * DAY_MS).toISOString().slice(0, 10)
}

// ── Fiscal Calendar ──────────────────────────────────────────────────────────
// FY27 runs Jan 31, 2026 (a Saturday) through Jan 29, 2027 — a standard 4-4-5
// retail calendar: 4 quarters × (4, 4, 5)-week months = 52 weeks total. Weeks run
// Saturday→Friday (matching the supplied calendar image's S S M T W T F columns).
const FY_START = Date.UTC(2026, 0, 31)
const MONTH_NAMES = [
  'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December', 'January',
]
const WEEKS_PER_MONTH = [4, 4, 5] // repeats every quarter
export const DOW_LABELS = ['S', 'S', 'M', 'T', 'W', 'T', 'F'] // Sat, Sun, Mon, Tue, Wed, Thu, Fri

// Exact annotated dates from the supplied FY27 calendar image — SCO (fiscal
// month-end cutoff), Holiday, and Pay Date. Not a computed rule (the real SCO
// dates don't follow a fixed formula); reproduced as-shown.
const ANNOTATIONS = {
  '2026-02-27': 'sco',
  '2026-03-27': 'sco',
  '2026-05-25': 'holiday',   // Memorial Day
  '2026-06-26': 'sco',
  '2026-07-03': 'holiday',   // Independence Day (observed)
  '2026-08-13': 'holiday',
  '2026-08-28': 'sco',
  '2026-09-07': 'holiday',   // Labor Day
  '2026-09-25': 'sco',
  '2026-11-26': 'holiday',   // Thanksgiving
  '2026-11-27': 'holiday',   // Day after Thanksgiving
  '2026-12-21': 'holiday',
  '2026-12-22': 'holiday',
  '2026-12-23': 'holiday',
  '2026-12-24': 'holiday',
  '2026-12-25': 'holiday',   // Christmas
  '2027-01-01': 'holiday',   // New Year's Day
  '2027-01-18': 'payDate',
  '2027-01-29': 'sco',       // fiscal year-end
}

function isoDate(ms) {
  return new Date(ms).toISOString().slice(0, 10)
}

function buildFiscalCalendar() {
  const quarters = []
  let weekIndex = 0 // 0-based, WKS = weekIndex + 1
  for (let q = 0; q < 4; q++) {
    let qwks = 1
    const months = []
    for (let m = 0; m < 3; m++) {
      const weeks = []
      for (let w = 0; w < WEEKS_PER_MONTH[m]; w++) {
        const weekStartMs = FY_START + weekIndex * 7 * DAY_MS
        const days = []
        for (let d = 0; d < 7; d++) {
          const ms = weekStartMs + d * DAY_MS
          const iso = isoDate(ms)
          days.push({ date: iso, day: new Date(ms).getUTCDate(), type: ANNOTATIONS[iso] || null })
        }
        weeks.push({ qwks, wks: weekIndex + 1, days })
        qwks++
        weekIndex++
      }
      months.push({ name: MONTH_NAMES[q * 3 + m], weeks })
    }
    quarters.push({ label: `Q${q + 1}`, months })
  }
  return quarters
}

export const FISCAL_CALENDAR = buildFiscalCalendar()
export const FISCAL_YEAR_LABEL = 'Fiscal Year 2027'
export const FISCAL_YEAR_RANGE = (() => {
  const fmt = iso => {
    const d = new Date(`${iso}T00:00:00Z`)
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  }
  const start = isoDate(FY_START)
  const end = isoDate(FY_START + (52 * 7 - 1) * DAY_MS)
  return `(${fmt(start)} - ${fmt(end)})`
})()

// ── Planning Cycle ───────────────────────────────────────────────────────────
// A recurring monthly forecast/capacity-planning workflow, run in two parallel
// tracks: DB (the standard track) and OSP. Each cycle is a run of weeks with
// Mon-Fri activity text; most weeks reuse an identical template shifted in time
// (this really is how the source Excel repeats it), so the DB template and the
// OSP-Q template are each defined once and applied per cycle with only the real
// per-cycle exceptions (a plan's own week-1 wording, a shorter/longer run).

const DB_WEEK_TEMPLATE = [
  { mon: 'Deadline for VMR / ASU File', tue: 'Publish in PBI', wed: 'BPs review', thu: 'BPs review', fri: 'Sign Off VMR / ASU File\nCadmus Network change request' },
  { tue: 'Generate Forecast', wed: 'Generate Forecast', thu: 'Generate Forecast', fri: 'Generate Forecast' },
  { tue: 'BPs review First Cut', wed: 'BPs review First Cut', thu: 'Generate Forecast_Rework', fri: 'Generate Forecast_Rework' },
  { tue: 'BPs review Second Cut', wed: 'Sign off the Forecast', thu: 'Capacity / HC Plan', fri: 'Capacity / HC Plan' },
  { tue: 'Capacity / HC Plan', wed: 'BPs review First Cut', thu: 'BPs review First Cut', fri: 'Capacity / HC Plan Adjust' },
  { tue: 'BPs review Second Cut', wed: 'Sign off the HC', thu: 'Review Consolidation reports', fri: 'Publish Consolidated reports' },
]

function buildDbCycle(planName, startIso, overrides = {}) {
  return {
    plan: planName,
    weeks: DB_WEEK_TEMPLATE.map((tmpl, i) => ({
      start: addDays(startIso, i * 7),
      ...tmpl,
      ...(overrides[i] || {}),
    })),
  }
}

export const OVERALL_DB_CYCLES = [
  buildDbCycle('April Plan', '2026-02-23', { 0: { mon: 'Deadline for VMR / ASU File (ASU, ICR, UCR)' } }),
  buildDbCycle('Jun Plan', '2026-04-20'),
  buildDbCycle('Aug Plan', '2026-07-13'),
  buildDbCycle('Oct Plan', '2026-09-14'),
  buildDbCycle('Dec Plan / Phase 1 AOP Plan', '2026-11-09'),
]

const OSP_Q_TEMPLATE = [
  { mon: 'Deadline for VMR / ASU File', tue: 'Publish in PBI', fri: 'Sign Off VMR / ASU File' },
  { tue: 'Generate Forecast', wed: 'Generate Forecast', thu: 'Generate Forecast', fri: 'Generate Forecast' },
  { tue: 'Internal AA Review', wed: 'BPs review First Cut', thu: 'BPs review First Cut', fri: 'Forecast Rework' },
  { tue: 'Internal AA Review', wed: 'Internal AA Review', thu: 'BPs review Second Cut', fri: 'BPs review Second Cut' },
  { tue: 'Review with Marie', wed: 'Review with Marie', thu: 'Review with Marie', fri: 'Operations Sign off' },
  {},
]

function buildOspQCycle(planName, startIso) {
  return {
    plan: planName,
    weeks: OSP_Q_TEMPLATE.map((tmpl, i) => ({ start: addDays(startIso, i * 7), ...tmpl })),
  }
}

export const OVERALL_OSP_CYCLES = [
  {
    plan: 'May Plan (OSP)',
    weeks: [
      { start: '2026-03-30', mon: 'Extract Actual, Contacts, SRs', tue: 'Generate Forecast', wed: 'Generate Forecast', thu: 'Generate Forecast', fri: 'Generate Forecast' },
      { start: '2026-04-06', tue: 'BPs review First Cut', wed: 'BPs review First Cut', thu: 'Generate Forecast_Rework', fri: 'Generate Forecast_Rework' },
      { start: '2026-04-13', tue: 'BPs review Second Cut', wed: 'Sign off the Forecast', thu: 'Upload the data in Table', fri: 'Review with Marie' },
      { start: '2026-04-20', tue: 'Review with Marie', wed: 'Review with Marie', thu: 'Sign off the Forecast' },
    ],
  },
  buildOspQCycle('FY27 Q3 Plan (OSP)', '2026-07-13'),
  buildOspQCycle('FY27 Q4 Plan (OSP)', '2026-09-21'),
]

// "Current Planning Cycle" (source sheet 2) — the same Aug Plan / FY27 Q3 window
// as the Overall FY27 timeline above, but drilled into by call-volume model (SR
// Model vs Contacts Model) rather than by DB/OSP track. SR Model's DB side is
// identical to Overall FY27's own Aug Plan; its OSP side carries a bit more
// week-1 detail than the Overall sheet did. Contacts Model has no OSP
// counterpart in the source and runs 2 weeks longer than SR Model.
export const CURRENT_CYCLE_LABEL = 'Aug Plan / FY27 Q3'

export const CURRENT_CYCLE = {
  srModel: {
    db: buildDbCycle('Aug Plan', '2026-07-13'),
    osp: {
      plan: 'FY27 Q3 Plan (OSP)',
      weeks: [
        { start: '2026-07-13', mon: 'Deadline for VMR / ASU File', tue: 'Generate Forecast', wed: 'Generate Forecast', thu: 'Generate Forecast', fri: 'Sign Off VMR / ASU File' },
        { start: '2026-07-20', tue: 'Generate Forecast', wed: 'Generate Forecast', thu: 'Generate Forecast', fri: 'Generate Forecast' },
        { start: '2026-07-27', tue: 'Internal AA Review', wed: 'BPs review First Cut', thu: 'BPs review First Cut', fri: 'Forecast Rework' },
        { start: '2026-08-03', tue: 'Internal AA Review', wed: 'Internal AA Review', thu: 'BPs review Second Cut', fri: 'BPs review Second Cut' },
        { start: '2026-08-10', tue: 'Review with Marie', wed: 'Review with Marie', thu: 'Review with Marie', fri: 'Operations Sign off' },
        { start: '2026-08-17' },
      ],
    },
  },
  contactsModel: {
    db: {
      plan: 'Aug Plan',
      weeks: [
        { start: '2026-07-13', mon: 'Deadline for VMR / ASU File', tue: 'Publish in PBI', wed: 'BPs review', thu: 'BPs review', fri: 'Sign Off VMR / ASU File\nCadmus Network change request' },
        { start: '2026-07-20', tue: 'Generate Forecast', wed: 'Generate Forecast', thu: 'Generate Forecast', fri: 'Generate Forecast' },
        { start: '2026-07-27', tue: 'Generate Forecast', wed: 'Generate Forecast', thu: 'Generate Forecast', fri: 'Generate Forecast' },
        { start: '2026-08-03', tue: 'BPs review First Cut', wed: 'BPs review First Cut', thu: 'Generate Forecast_Rework', fri: 'Generate Forecast_Rework' },
        { start: '2026-08-10', tue: 'BPs review Second Cut', wed: 'Sign off the Forecast', thu: 'Capacity / HC Plan', fri: 'Capacity / HC Plan' },
        { start: '2026-08-17', tue: 'Capacity / HC Plan', wed: 'Capacity / HC Plan', thu: 'Capacity / HC Plan', fri: 'Capacity / HC Plan' },
        { start: '2026-08-24', tue: 'Capacity / HC Plan', wed: 'BPs review First Cut', thu: 'BPs review First Cut', fri: 'Capacity / HC Plan Adjust' },
        { start: '2026-08-31', tue: 'BPs review Second Cut', wed: 'Sign off the HC', thu: 'Review Consolidation reports', fri: 'Publish Consolidated reports' },
      ],
    },
    osp: null, // no OSP track for Contacts Model in the source sheet
  },
}

export function formatWeekRange(startIso) {
  const start = new Date(`${startIso}T00:00:00Z`)
  const end = new Date(start.getTime() + 4 * DAY_MS) // Mon start -> Fri end
  const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  return `${fmt(start)} - ${fmt(end)}`
}
