// Thin re-export shim — the actual implementations moved to ../ChartKit.jsx once the
// Capacity Plan pages needed the exact same primitives. Kept so none of this file's
// existing importers (AsuLayer, SrLayer, AsuSrTrendLayer, TsaMetricCards, etc.) needed
// to change their import paths.
export { Modal } from '../Modal'
export * from '../ChartKit'

// HES Forecasting's own column-chart palette (2026-10-11, per direct request with a
// reference swatch image). Deliberately NOT added to ChartKit.jsx's shared `C` —
// that object (and planSeriesColor/planVsPlanSeriesColor, which cycle it) is reused
// by MSG Forecasting and both Capacity pages, none of which this request touches.
// This file is imported exclusively by tsa/*.jsx (HES Forecasting), so anything
// defined only here can never leak onto a page the request didn't ask to change.
//
// TSA_PLAN_COLORS backs AsuLayer/SrLayer's Actuals-vs-Plan charts: Plan A (or the
// single "Plan" dimension in Visual1) in Light Blue, Plan B in Medium Blue, Actuals
// in Medium Teal — a provided 2-tone-blue + teal combination, not an invented one.
// The reference swatch's exact hex values are light-background corporate-report
// tones; `magenta` below is brightened from the reference's #800074 for legibility
// as a thin line stroke against this dashboard's dark panels — same hue family,
// adapted for contrast (see design_choice.md).
export const TSA_PLAN_COLORS = { planA: '#8cc5e3', planB: '#1a80bb', actual: '#298c8c' }

// TSA_TREND_COLORS backs AsuSrTrendLayer's "CPASU/UCR Trend" layer (all 3 visuals)
// and TsaMetricCards' CPASU/UCR-card drill-downs — none of these are Actuals-vs-Plan
// charts, so per direct request they use a warm gold/orange/magenta family instead,
// deliberately distinct from the cool blue/teal family above so the two chart
// families stay visually distinguishable from one another at a glance.
export const TSA_TREND_COLORS = { gold: '#f1a226', orange: '#ea801c', magenta: '#d946ef' }

// Color for the Nth selected "Plan" in AsuLayer/SrLayer's Visual1 (one open-ended
// multi-select Plan Name dimension, no A/B split) — alternates Light Blue/Medium
// Blue with the same opacity-stepping convention as the shared planSeriesColor, so
// an open-ended number of selected plans stays distinguishable without adding hues.
export function tsaPlanColor(index) {
  const hue = index % 2 === 0 ? TSA_PLAN_COLORS.planA : TSA_PLAN_COLORS.planB
  const opacity = Math.max(0.35, 0.85 - Math.floor(index / 2) * 0.25)
  return { color: hue, opacity }
}

// Color for the Nth selected plan on ONE side (A or B) of a Plan A vs Plan B
// comparison (AsuLayer/SrLayer's Visual2) — every Plan A bar is Light Blue, every
// Plan B bar is Medium Blue, no matter how many are selected on either side
// (opacity steps down per extra selection on that side). A firmer "the color tells
// you which side" guarantee than the shared planVsPlanSeriesColor's single
// combined-index cycle, which this layer's explicit Plan A/Plan B request calls for.
export function tsaPlanSideColor(side, index) {
  const hue = side === 'A' ? TSA_PLAN_COLORS.planA : TSA_PLAN_COLORS.planB
  const opacity = Math.max(0.4, 0.95 - index * 0.2)
  return { color: hue, opacity }
}

// Color for the Nth selected plan in AsuSrTrendLayer's "UCR Impact on SR" chart (its
// one open-ended multi-select "SR Plan" bar) — alternates Magenta/Gold with the same
// opacity-stepping convention as tsaPlanColor above, kept in the warm CPASU/UCR
// Trend family since this chart isn't an Actuals-vs-Plan comparison.
export function tsaTrendPlanColor(index) {
  const hue = index % 2 === 0 ? TSA_TREND_COLORS.magenta : TSA_TREND_COLORS.gold
  const opacity = Math.max(0.35, 0.85 - Math.floor(index / 2) * 0.25)
  return { color: hue, opacity }
}
