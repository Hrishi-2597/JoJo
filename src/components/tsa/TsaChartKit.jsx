// Thin re-export shim — the actual implementations moved to ../ChartKit.jsx once the
// Capacity Plan pages needed the exact same primitives. Kept so none of this file's
// existing importers (AsuLayer, SrLayer, AsuSrTrendLayer, TsaMetricCards, etc.) needed
// to change their import paths.
export { Modal } from '../Modal'
export * from '../ChartKit'

// The HES colour palette (TSA_PLAN_COLORS / TSA_METRIC_COLORS / TSA_TREND_COLORS and
// the tsaPlanColor / tsaPlanSideColor helpers) moved to ../hesPalette.js on
// 2026-10-12, when HES Capacity Planning was asked to adopt the same scheme and the
// two HES pages needed one source of truth rather than a copy each. Re-exported from
// here so every existing `from './TsaChartKit'` import keeps working untouched.
export * from '../hesPalette'

// (Removed 2026-10-11: tsaTrendPlanColor — it cycled Magenta/Gold for the Nth
// selected plan on AsuSrTrendLayer's "UCR Impact on SR" chart, which was its only
// consumer. That chart's Plan Name dropdown was removed the same day per direct
// request, so with exactly one fixed plan there's no longer a series to cycle; the
// bar now takes TSA_TREND_COLORS.magenta directly — the same color index 0 returned,
// so the chart looks unchanged.)
