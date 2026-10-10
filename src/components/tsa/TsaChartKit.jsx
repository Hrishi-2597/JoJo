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
// TSA_PLAN_COLORS backs the PLAN side of AsuLayer/SrLayer's Actuals-vs-Plan charts:
// Plan A (or the single "Plan" dimension in Visual1) in Light Blue, Plan B in
// Medium Blue — a provided 2-tone-blue combination, not an invented one.
// (Its `actual: '#298c8c'` key was removed 2026-10-11: the Actuals bar is no longer
// a plan-palette color at all, it's whichever metric the chart plots — see
// TSA_METRIC_COLORS below. Nothing else referenced the key.)
//
// Across all three palettes here, the reference swatch's hex values are used
// verbatim — they're light-background corporate-report tones, but they read fine on
// dark. The single exception is TSA_TREND_COLORS.magenta, brightened from the
// reference's #800074 for legibility as a thin line stroke against this dashboard's
// dark panels — same hue family, adapted for contrast (see design_choice.md).
export const TSA_PLAN_COLORS = { planA: '#8cc5e3', planB: '#1a80bb' }

// TSA_TREND_COLORS backs AsuSrTrendLayer's "CPASU/UCR Trend" layer and
// TsaMetricCards' CPASU/UCR-card drill-downs — none of these are Actuals-vs-Plan
// charts, so per direct request they use a warm gold/orange/magenta family,
// deliberately distinct from the cool blue/teal family above so the two chart
// families stay visually distinguishable from one another at a glance.
//
// `blue`/`grey` (2026-10-11) are the exception, added for "UCR Impact on SR" alone
// after a follow-up request pinned that one chart to a specific Blue/Orange/Grey
// combination from the same reference swatch. Note `blue` is the same hex as
// TSA_PLAN_COLORS.planB — intentional per that request, and harmless in practice
// since the two never appear in the same chart (planB only shows in AsuLayer/
// SrLayer's Plan-vs-Plan visuals, a different layer entirely).
//
// Grey for the plan series is a happy side effect worth keeping: neutral grey for
// a plan/target/benchmark is a long-standing business-chart convention, since it
// lets the actuals carry all the color and reads instantly as "the baseline".
export const TSA_TREND_COLORS = {
  gold: '#f1a226', orange: '#ea801c', magenta: '#d946ef',
  blue: '#1a80bb', grey: '#b8b8b8',
}

// Metric identity colors (2026-10-11, per direct request: "make color coding same
// for all the ASU actuals, SR actuals wherever mentioned... user should be able to
// identify the difference"). ASU is ALWAYS teal and SR is ALWAYS orange, in every
// chart where that metric is plotted as a whole.
//
// This was a real defect before, not just an inconsistency: AsuLayer's and SrLayer's
// "Actuals" bars both drew from TSA_PLAN_COLORS.actual, so ASU actuals and SR
// actuals were the SAME teal — the exact thing the request says a reader must be
// able to tell apart. Meanwhile ASU separately appeared as gold (CPASU Trend) and
// sky blue (its own card drill-down), and SR as orange and blue elsewhere.
//
// Teal/orange was chosen over reusing either blue because both Plan A (#8cc5e3) and
// Plan B (#1a80bb) already own blues, and a metric color that collides with a plan
// color inside the same layer would trade one ambiguity for another. It's also a
// complementary (cool/warm) pair, which keeps the two readable for the common forms
// of color-vision deficiency — blue-vs-teal would not have.
//
// SUPERSEDES two earlier instructions, deliberately:
//   - "Actuals Med teal" now holds for ASU's actuals only; SR's actuals are orange,
//     because the two are explicitly required to differ.
//   - "CPASU/UCR Trend: any palette apart from actuals-vs-plan colors" — that
//     layer's ASU/SR bars now use these metric colors, since one color per metric
//     everywhere is the stronger guarantee of the two.
export const TSA_METRIC_COLORS = { asu: '#298c8c', sr: '#ea801c' }

// Color for the Nth selected "Plan" in AsuLayer/SrLayer's Visual1 (one open-ended
// multi-select Plan Name dimension, no A/B split) — alternates Light Blue/Medium
// Blue with the same opacity-stepping convention as the shared planSeriesColor, so
// an open-ended number of selected plans stays distinguishable without adding hues.
export function tsaPlanColor(index) {
  const hue = index % 2 === 0 ? TSA_PLAN_COLORS.planA : TSA_PLAN_COLORS.planB
  const opacity = Math.max(0.35, 1 - Math.floor(index / 2) * 0.25)
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
  const opacity = Math.max(0.4, 1 - index * 0.2)
  return { color: hue, opacity }
}

// (Removed 2026-10-11: tsaTrendPlanColor — it cycled Magenta/Gold for the Nth
// selected plan on AsuSrTrendLayer's "UCR Impact on SR" chart, which was its only
// consumer. That chart's Plan Name dropdown was removed the same day per direct
// request, so with exactly one fixed plan there's no longer a series to cycle; the
// bar now takes TSA_TREND_COLORS.magenta directly — the same color index 0 returned,
// so the chart looks unchanged.)
