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
// Across these palettes the reference swatch's hex values are used verbatim —
// they're light-background corporate-report tones, but they read fine on dark. The
// exceptions are TSA_TREND_COLORS.magenta (brightened from the reference's #800074
// for legibility as a thin line stroke on dark panels) and TSA_METRIC_COLORS.sr.light
// (the swatch supplied no light orange, so it's derived). See design_choice.md.
//
// (Removed 2026-10-11: TSA_PLAN_COLORS = { planA: '#8cc5e3', planB: '#1a80bb' } —
// one shared blue pair used for the plan side of BOTH AsuLayer and SrLayer. That
// was the inconsistency behind "in plan over plan for ASU you used blue": plan
// series ignored which metric they belonged to. Plan colors now come from the
// metric's own ramp (TSA_METRIC_COLORS below), so nothing referenced these two any
// more. A happy consequence: TSA_TREND_COLORS.blue no longer duplicates planB's hex,
// so the deliberate-collision caveat recorded against it on 2026-10-11 is now moot.)

// TSA_TREND_COLORS backs AsuSrTrendLayer's "CPASU/UCR Trend" layer and
// TsaMetricCards' CPASU/UCR-card drill-downs — none of these are Actuals-vs-Plan
// charts, so per direct request they use a warm gold/orange/magenta family.
//
// `blue`/`grey` (2026-10-11) were added for "UCR Impact on SR" alone, after a
// follow-up request pinned that one chart to a specific Blue/Orange/Grey combination
// from the reference swatch. `blue` is now unique to that chart.
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
// Each metric owns a two-step SEQUENTIAL RAMP, not a single hue (extended 2026-10-11
// from the flat {asu, sr} pair added earlier the same day, per the follow-up: "the
// plan over plan colors should be different for ASU and SR... you used mid teal for
// actuals, plan light teal, and then in plan over plan for ASU you used blue").
//
// `base` is the metric's actuals; `light` is its plan side. So an ASU chart is teal
// top to bottom and an SR chart is orange top to bottom — Actuals vs Plan AND Plan
// vs Plan — and you can tell which metric you're looking at from across the room
// without reading the title. Previously only the actuals bar carried the metric
// colour and every plan series fell back to the same two blues on both layers,
// which is exactly the inconsistency being called out.
//
// Teal's two steps are the reference swatch's own sequential pair (Light Teal
// #9fc8c8 / Med Teal #298c8c). The swatch never supplied a light orange, so
// `sr.light` is derived the same way that pair is — same hue, roughly half the
// saturation, substantially higher lightness — keeping it a muted corporate tint
// rather than a bright pastel, per "choose your colour palette as needed... must be
// corporate standard".
export const TSA_METRIC_COLORS = {
  asu: { base: '#298c8c', light: '#9fc8c8' }, // Med Teal / Light Teal
  sr: { base: '#ea801c', light: '#f0bd8a' },  // Orange / Light Orange (derived)
}

// Both helpers now take the METRIC ('asu' | 'sr') as their first argument, so the
// plan series stay inside their chart's own colour family instead of every layer
// falling back to one shared blue pair.

// Colour for the Nth selected "Plan" in AsuLayer/SrLayer's Visual1 (one open-ended
// multi-select Plan Name dimension, no A/B split). Alternates the metric's light and
// base steps, with the same opacity stepping as the shared planSeriesColor, so an
// open-ended number of selected plans stays distinguishable without new hues. The
// FIRST (and usually only) plan takes `light`, which keeps it clearly separate from
// the Actuals bar beside it — that one is always `base`.
export function tsaPlanColor(metric, index) {
  const fam = TSA_METRIC_COLORS[metric] || TSA_METRIC_COLORS.asu
  const hue = index % 2 === 0 ? fam.light : fam.base
  const opacity = Math.max(0.35, 1 - Math.floor(index / 2) * 0.25)
  return { color: hue, opacity }
}

// Colour for the Nth selected plan on ONE side (A or B) of a Plan A vs Plan B
// comparison (AsuLayer/SrLayer's Visual2) — every Plan A bar is the metric's light
// step and every Plan B bar its base step, no matter how many are selected on either
// side (opacity steps down per extra selection). Keeps the firm "the colour tells you
// which side" guarantee from before, now within the metric's own family. There's no
// Actuals series in this chart, so reusing `base` for Plan B collides with nothing.
export function tsaPlanSideColor(metric, side, index) {
  const fam = TSA_METRIC_COLORS[metric] || TSA_METRIC_COLORS.asu
  const hue = side === 'A' ? fam.light : fam.base
  const opacity = Math.max(0.4, 1 - index * 0.2)
  return { color: hue, opacity }
}

// (Removed 2026-10-11: tsaTrendPlanColor — it cycled Magenta/Gold for the Nth
// selected plan on AsuSrTrendLayer's "UCR Impact on SR" chart, which was its only
// consumer. That chart's Plan Name dropdown was removed the same day per direct
// request, so with exactly one fixed plan there's no longer a series to cycle; the
// bar now takes TSA_TREND_COLORS.magenta directly — the same color index 0 returned,
// so the chart looks unchanged.)
