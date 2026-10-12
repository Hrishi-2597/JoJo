// The HES colour palette, shared by BOTH HES pages — Forecasting (tsa/) and
// Capacity Planning (tsaCapacity/). Extracted from tsa/TsaChartKit.jsx on
// 2026-10-12, when Capacity was asked to "use similar color scheme as well";
// TsaChartKit.jsx now re-exports everything here, so no HES Forecasting component
// needed to change its imports.
//
// Deliberately NOT merged into ChartKit.jsx's shared `C` — that object, and the
// planSeriesColor/planVsPlanSeriesColor helpers that cycle it, are also used by the
// MSG Forecasting and MSG Capacity pages, which nobody has asked to restyle. Keeping
// the HES palette in its own module means it can never leak onto those pages, while
// still being one source of truth across the two pages that DO share the scheme.
//
// Values come from a business-supplied reference swatch (light-background corporate
// report tones that read fine on dark). The one exception is TSA_TREND_COLORS.magenta,
// brightened from the swatch's #800074 for legibility as a thin line stroke against
// this dashboard's dark panels — same hue family, adapted for contrast.

// The Actuals-vs-Plan family.
//   planA  — the single "Plan" dimension, and the Plan A side of a Plan-vs-Plan chart
//   planB  — the Plan B side
//   actual — the Actuals series on pages whose metrics have no identity colour of
//            their own. HES Capacity is that case: its measures (FTE, headcount,
//            cases/FTE, case time) are all "the actual", so one shared teal is
//            correct there. HES Forecasting is NOT — its ASU and SR actuals must be
//            distinguishable, so those charts use TSA_METRIC_COLORS instead.
export const TSA_PLAN_COLORS = { planA: '#8cc5e3', planB: '#1a80bb', actual: '#298c8c' }

// Metric identity colours (HES Forecasting). ASU is always teal and SR always
// orange, in every chart plotting either as a whole metric — without this, both
// metrics' actuals drew the same teal and couldn't be told apart.
export const TSA_METRIC_COLORS = { asu: '#298c8c', sr: '#ea801c' }

// The CPASU/UCR Trend family (HES Forecasting) — a warm set kept distinct from the
// cool Actuals-vs-Plan colours above, per request. `blue`/`grey` are used only by
// "UCR Impact on SR", pinned to a specific Blue/Orange/Grey combination.
export const TSA_TREND_COLORS = {
  gold: '#f1a226', orange: '#ea801c', magenta: '#d946ef',
  blue: '#1a80bb', grey: '#b8b8b8',
}

// Colour for the Nth selected "Plan" where a chart has one open-ended multi-select
// Plan dimension (no A/B split) — alternates Light Blue/Medium Blue with stepped
// opacity, so an open-ended number of selected plans stays distinguishable without
// adding hues. The first (and usually only) plan takes Light Blue, keeping it clearly
// separate from the Actuals bar beside it.
export function tsaPlanColor(index) {
  const hue = index % 2 === 0 ? TSA_PLAN_COLORS.planA : TSA_PLAN_COLORS.planB
  const opacity = Math.max(0.35, 1 - Math.floor(index / 2) * 0.25)
  return { color: hue, opacity }
}

// Colour for the Nth selected plan on ONE side (A or B) of a Plan A vs Plan B
// comparison — every Plan A bar is Light Blue and every Plan B bar Medium Blue, no
// matter how many are selected on either side (opacity steps down per extra
// selection). A firmer "the colour tells you which side" guarantee than the shared
// planVsPlanSeriesColor's single combined-index cycle.
export function tsaPlanSideColor(side, index) {
  const hue = side === 'A' ? TSA_PLAN_COLORS.planA : TSA_PLAN_COLORS.planB
  const opacity = Math.max(0.4, 1 - index * 0.2)
  return { color: hue, opacity }
}
