# Technical Specification — TSG SPoG MSG Forecasting Dashboard

## Overview
A React application that renders an analytics dashboard for Enterprise's TSG Business, entered through an **"TSG SPoG" landing page** with two tiles — **MSG** and **TSA**. Each business section has its own internal Forecasting/Capacity Plan toggle in the header, so there are effectively **4 pages**: **MSG Forecasting** (call volume plans, actuals vs plan adherence, geographic accuracy distribution), **MSG Capacity Plan** (staffing, utilization, attrition, SL%), **TSA Forecasting** (ASU/SR/UCR service-unit tracking, built from slides 5–6 of `SPOG_views.pptx`; briefly named "MSG Capacity Planning" before a 2026-07-02 rename), and **TSA Capacity Plan** (FTE, attrition, workload distribution incl. a Sankey diagram, SLO). A home button next to the header logo returns to the landing tiles from either business section. All data is currently mocked — no backend — but every filter on every page is fully live: each recomputes cards and charts from a shared, filterable fact table (see Data Model below).

**Naming note (2026-07-27):** everything a *user sees* now reads ISG/ESG/HES instead of TSG/MSG/TSA, with the descriptive full names ("Enterprise Service Group"/"High End Storage") dropped entirely — see the design_choice.md entry for the exact scope. This document's own prose, and every internal file/folder/component/function name (`MsgCapacityPage.jsx`, `tsaCapacity/`, `TSA_ACTIVE_QUEUES`, etc.), still uses MSG/TSA throughout — none of that was renamed, only the live app's own displayed text. Read "MSG"/"TSA" below as "the code that now renders as ESG/HES in the UI," not as what's currently on screen.

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| UI Framework | React | 18.3.1 | Component-based rendering |
| Build Tool | Vite | 5.4.2 | Dev server, bundler |
| Styling | Tailwind CSS | 3.4.11 | Utility-first CSS |
| Charts | Recharts | 2.12.7 | Bar, Line, Composed, stacked charts |
| Geo Map | react-simple-maps | 3.0.0 | SVG world map rendering |
| Color Scale | d3-scale | 4.0.2 | Accuracy → color mapping |
| CI/CD | GitHub Actions | — | Auto-build and deploy |
| Hosting | GitHub Pages | — | Static site hosting |
| Deployment Action | peaceiris/actions-gh-pages | v4 | Pushes dist/ to gh-pages branch |

---

## Project Structure

```
SPoG/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD: build → push to gh-pages branch
├── src/
│   ├── main.jsx                # React root mount
│   ├── App.jsx                 # Shell: header + page toggle + theme toggle + footer
│   ├── index.css               # Tailwind imports + theme CSS variables (:root / [data-theme='light']) +
│   │                              global scrollbar/select/card/tooltip/etc. component classes
│   ├── components/
│   │   ├── PlanningSidebar.jsx # Collapsible left sidebar (2026-07-27) — 46px icon rail expands to a 360px
│   │   │                         panel (Fiscal Calendar / Planning Cycle), mounted once in App.jsx outside the
│   │   │                         page conditionals so it's present + keeps its open/closed state on every page
│   │   ├── FiscalCalendarView.jsx  # Renders src/data/planningCalendarData.js's FISCAL_CALENDAR as a single-
│   │   │                             column stack of quarters/months (reflowed from the source image's wide
│   │   │                             4-quarters-across layout to fit the 360px sidebar panel)
│   │   ├── PlanningCycleView.jsx   # Full Year / Current Cycle tabs; Full Year has a DB/OSP BinaryToggle over
│   │   │                             collapsible per-cycle week accordions; Current Cycle shows SR Model
│   │   │                             (DB+OSP) and Contacts Model (DB only) from the source's second sheet
│   │   ├── HolidayCalendarView.jsx # Third sidebar section (2026-07-27) — Region pill filter + searchable Country
│   │   │                             MultiSelectField over src/data/holidayCalendarData.js's 800-row real global
│   │   │                             holiday list, grouped into collapsible per-month accordions
│   │   ├── LandingPage.jsx     # "TSG SPoG" title + MSG/TSA tiles — the app's entry point (2026-07-03)
│   │   ├── ForecastingPage.jsx # MSG Forecasting page body (filters + cards + 3 layers + RCA/CLCA sidebar)
│   │   ├── SectionDivider.jsx  # Shared "KEY METRICS" / "ANALYSIS LAYERS" section label, used by every page
│   │   ├── Modal.jsx           # Shared popup modal — used by every page's Key Metrics card drill-downs
│   │   ├── GranularityToggle.jsx # Shared Quarter/Month/Week "View By" pill — page-wide chart-axis setting, used by every filter bar
│   │   ├── ChartKit.jsx        # Shared chart primitives (Visual, Tip, PlanDropdowns, PlanSelect, CategoryTick,
│   │   │                         truncate, BinaryToggle, GraphInsightButton, InfoButton) — promoted from
│   │   │                         tsa/TsaChartKit.jsx (2026-07-03) so both Capacity pages and both Forecasting pages
│   │   │                         share one implementation. GraphInsightButton (2026-07-10) is the small per-graph
│   │   │                         RCA/CLCA popup — Visual takes optional rca/clca string props and renders the button
│   │   │                         for free; MSG Forecasting's Layer1PlanOverPlan.jsx/Layer2ActualVsPlan.jsx (which
│   │   │                         predate this file and keep their own local Visual) import just the button and
│   │   │                         wire the same two props into their own local Visual instead. InfoButton
│   │   │                         (2026-07-23) is a separate "what this shows" popup (info prop, plain sentence, no
│   │   │                         RCA/CLCA framing) — see the dedicated section below for placement rules
│   │   ├── FilterPanel.jsx     # 12 filters in 4 icon-labeled clusters (Scope/Time/People/Geography) + applied-filter chips + GranularityToggle
│   │   ├── MetricCards.jsx     # 5 KPI cards, each opening its drill-down in Modal
│   │   ├── Layer1PlanOverPlan.jsx  # Plan vs Plan: 3 chart visuals + plan selectors
│   │   ├── Layer2ActualVsPlan.jsx  # Actual vs Plan: 3 chart visuals + stacked bar
│   │   ├── Layer3GeoMap.jsx    # World map with accuracy markers + summary table
│   │   ├── msgCapacity/         # MSG Capacity Plan page (all new, 2026-07-03; revised same day)
│   │   │   ├── MsgCapacityPage.jsx        # Page body: filters + cards + 4 layers (RCA/CLCA sidebar removed 2026-07-20, see below)
│   │   │   ├── MsgCapacityFilterPanel.jsx # Scope/Time/People/Geography clusters + DB/OSP pill + GranularityToggle
│   │   │   ├── MsgCapacityMetricCards.jsx # 5 KPI cards (Staffing/Utilization/SL%/Cases per FTE/Attrition), Modal drill-downs
│   │   │   ├── HeadcountLayer.jsx         # Layer 01 "Headcount and SL%" — staffing summary, attrition, actual-vs-plan+SL%+defaulters
│   │   │   ├── PlanOverPlanVariationLayer.jsx # Layer 02 "Plan over Plan Variation" — region/sub-region drill + queue-variance ranking
│   │   │   ├── UtilizationLayer.jsx       # Layer 03 "Utilization and Outage Analysis" — actual-vs-target trend w/ 3-aux tooltip, per-queue Aux ranking, leaves ranking
│   │   │   ├── MsgCapacityGeoMap.jsx      # Layer 04 — dual toggle (Headcount/SL% metric × Region/Sub-region view)
│   │   └── tsaCapacity/         # TSA Capacity Plan page (all new, 2026-07-03; revised same day)
│   │       ├── TsaCapacityPage.jsx           # Page body: filters (reuses tsa/TsaFilterPanel.jsx directly) + cards + 4 layers (RCA/CLCA sidebar removed 2026-07-20)
│   │       ├── TsaCapacityMetricCards.jsx    # 5 KPI cards (Staffing Summary/Attrition/Cases per FTE/Avg Case Time/SLO %)
│   │       ├── HeadcountAttritionLayer.jsx   # Layer 01 "Headcount and Utilization" — staffing, region/sub-region attrition drill, utilization variance
│   │       ├── PlanOverPlanVariationLayer.jsx # Layer 02 "Plan over Plan Variation" — region/sub-region drill + LOB-variance ranking
│   │       ├── WorkloadDistributionLayer.jsx # Layer 03 "Workload Distribution" — Sankey (LOB/CQN toggle), Average Case Time Variance, ACT trend
│   │       ├── TsaCapacityGeoMap.jsx         # Layer 04 (mockup labels it "Layer 5", renumbered — see design_choice.md) — worldwide SLO, Region/Sub-region toggle
│   │   └── tsa/                # TSA Forecasting page (all new, 2026-07-02; named "capacity/" until the same-day rename)
│   │       ├── TsaForecastingPage.jsx  # Page body: filters + cards + 4 layers (RCA/CLCA sidebar removed 2026-07-20)
│   │       ├── TsaFilterPanel.jsx      # 7 filters: LOB / FY-Qtr-Month-Week / Business Partner-Global Grouping + GranularityToggle;
│   │       │                            reused directly (unmodified) by tsaCapacity/TsaCapacityPage.jsx — identical field set
│   │       ├── TsaChartKit.jsx         # Re-export shim: `export { Modal } from '../Modal'; export * from '../ChartKit'`
│   │       │                            (was the canonical implementation until ChartKit.jsx was promoted, 2026-07-03)
│   │       ├── TsaMetricCards.jsx      # 5 KPI cards, each opening its drill-down in Modal (Total Queues/ASU/SR/CPASU/UCR)
│   │       ├── AsuLayer.jsx            # Layer 01 "ASU Trend" — Actuals vs Plan, Plan vs Plan, Plan Impact (region→LOB drill)
│   │       ├── SrLayer.jsx             # Layer 02 "SR Trend" — same structure as AsuLayer, SR metric
│   │       ├── AsuSrTrendLayer.jsx     # Layer 03 "ASU/UCR Impact on SR Analysis" — CPASU Trend, UCR Impact on SR, UCR Runrate+top-5-LOB modal
│   │       └── TsaGeoMap.jsx           # Layer 04 — choropleth by LOB adherence per region
│   └── data/
│       ├── mockData.js         # MSG Forecasting page's static mock data (CQNs, plans, KPIs, geo) — also exports matchesMulti, REGIONS,
│       │                         regionForCountry, CAPACITY_PLAN_NAMES, BUSINESS_ORGS, COUNTRIES/COUNTRY_REGION
│       │                         (2026-07-03), and other primitives tsaData.js/msgCapacityData.js/tsaCapacityData.js reuse
│       ├── tsaData.js          # TSA Forecasting page's data model (LOB list, ASU/SR/UCR series, LOB_QUEUES, region-impact deltas)
│       ├── msgCapacityData.js  # MSG Capacity Plan's data model (queue-level HC/utilization/SL/leaves fact table)
│       └── tsaCapacityData.js  # TSA Capacity Plan's data model (reuses tsaData.js's LOB_FACTS/filterLobs directly)
├── index.html                  # Vite entry HTML
├── vite.config.js              # base: '/TSG-SPoG/' for GitHub Pages paths
├── tailwind.config.js          # Custom navy color palette
├── postcss.config.js
├── package.json                # Scripts: dev / build / predeploy / deploy
└── README.md
```

---

## Component Architecture

```
App
├── <header>              — Page title, org label, live indicator
├── FilterPanel           — Controlled: filters state lifted to App; renders applied-filter chips
├── MetricCards(filters)  — cardData(filters) + filterQueues(filters) recomputed on every change
│   └── DrillDownModal    — Popup (shared Modal component), toggled by card click; rows scoped to match the
│                            clicked card; closing it only clears local `active` state, filters untouched
├── Layer1PlanOverPlan(filters) — Collapsible section, always at Fiscal Year granularity
│   ├── Visual1           — ComposedChart: planOverPlanByFY(filters), plan A/B dropdowns
│   ├── Visual2           — ComposedChart: planOverPlanByRegion(filters), Region x-axis
│   └── Visual3           — Diverging horizontal Bar: cqnPlanVariance(filters), green/red Cell by sign
├── Layer2ActualVsPlan(filters) — Collapsible section, always at Fiscal Year granularity
│   ├── Visual1           — ComposedChart: actualVsPlanByFY(filters) + Adherence% line
│   ├── Visual2           — Stacked BarChart: stackedAdherenceByFY(filters), LabelList per segment
│   └── Visual3           — Diverging horizontal Bar: cqnActualVariance(filters), green/red Cell by sign
└── Layer3GeoMap(filters) — Collapsible section
    ├── ComposableMap     — react-simple-maps world SVG, choropleth fill (no markers)
    │                        via regionForCountry/subRegionForCountry lookups
    └── Summary table     — geoRegionData(filters) or geoSubRegionRows(filters), by view mode
```

### TsaForecastingPage (rendered instead of ForecastingPage when the header toggle is on "TSA Forecasting")

```
TsaForecastingPage
├── TsaFilterPanel        — Controlled: filters state lifted to TsaForecastingPage
├── TsaMetricCards(filters, granularity) — tsaCardData(filters, granularity) recomputed on every change
│   └── DrillDownModal     — Popup (TsaChartKit's Modal), one of TotalQueuesSection/AsuTrendChart/
│                            SrDbOspChart/CpasuChart/CurrentUcrChart; closing it only clears local
│                            `active` state, filters prop is untouched
├── AsuLayer(filters)     — "ASU Trend", collapsible, badge "01"
│   ├── Visual1 "Actuals vs Plan Comparison"  — ComposedChart: asuByFY(filters) + Adherence% line, "Plan Name" dropdown
│   ├── Visual2 "Plan vs Plan Comparison"     — ComposedChart: asuPlanVsPlanByFY(filters) + Variance% line, Plan A/B dropdowns
│   └── Visual3 "Plan Impact"                 — ComposedChart: asuRegionPlans(filters) grouped bars (AMER/APJ/EMEA/Global);
│                                                clicking a region bar renders asuLobImpact(region) as an inline delta list
├── SrLayer(filters)      — "SR Trend", collapsible, badge "02"; same 3-visual structure/names as AsuLayer, SR metric
├── AsuSrTrendLayer(filters) — "ASU/UCR Impact on SR Analysis", collapsible, badge "03"
│   ├── Visual1 "CPASU Trend" — ComposedChart: cpasuByRegion(filters) grouped bars/line by default (one group per
│   │                           IMPACT_REGIONS entry); clicking a region switches to cpasuTrendByRegion(filters, region)
│   │                           at whichever granularity regionTrendGranularity(filters) resolves to (Week > Quarter > Year)
│   ├── Visual2 "UCR Impact on SR" — BarChart: srBotsByFY(filters), humanSR ("SR's") + botsSR ("UCR Handled SR's") stacked,
│   │                                SR Plan as a separate bar; PlanSelect in the corner (cornerControls, unwired)
│   └── Visual3 "UCR Runrate with Target" — ComposedChart: UCR_BY_FY directly (always all 3 FYs, ignores
│                                            Quarter/Week filters); clicking a year's bar opens a Modal listing
│                                            topNonAdherentLobsByYear(filters, year) — top 5 LOBs, not queues
└── TsaGeoMap(filters)    — Collapsible, badge "04"; same choropleth mechanism as Layer3GeoMap,
                            colored by geoAdherenceByRegion(filters); no Region/Sub-region toggle
```

### App (2026-07-03 restructure): landing tiles + per-business sub-toggle

```
App
├── view state: 'landing' | 'msg' | 'tsa' — top-level; no router, same reasoning as the original page toggle
├── msgSubPage / tsaSubPage state: 'forecasting' | 'capacity' each, independent — switching business and back
│                                   doesn't reset the other business's last-viewed sub-page
├── <header>
│   ├── HomeButton (only rendered when view is 'msg'|'tsa') — onClick sets view back to 'landing'
│   └── PageToggle (only rendered when view is 'msg'|'tsa') — options = SUB_PAGES[view], drives msgSubPage/tsaSubPage
├── LandingPage(onSelect=setView)          — rendered when view === 'landing'
├── ForecastingPage / MsgCapacityPage      — rendered when view === 'msg', by msgSubPage
└── TsaForecastingPage / TsaCapacityPage   — rendered when view === 'tsa', by tsaSubPage
```

### MsgCapacityPage (revised 2026-07-03 — see design_choice.md for the full rationale)

```
MsgCapacityPage
├── MsgCapacityFilterPanel  — Controlled: filters state lifted to MsgCapacityPage; combinedQueueName/
│                              capacityCode/planName(PLAN_NAMES)/fiscalYear/fiscalQuarter/fiscalWeek/
│                              channel/businessPartner/region/subRegion/dbOsp + GranularityToggle
│                              (businessOrg and country were removed; subRegion replaced country)
├── MsgCapacityMetricCards(filters, granularity) — capacityCardData(filters, granularity); 5 cards with
│   │                          YTD/YoY sub-messages (ytdSub helper, same pattern as TsaMetricCards.jsx) —
│   │                          except Cases per FTE (replaced Total FTE, 2026-07-03), which shows YTD only,
│   │                          no comparison/trend pip — each card a Modal drill-down
│   └── DrillDownModal — StaffingTrendChart / UtilizationTrendChart / SlTrendChart (line-only) /
│                         CasesPerFteTrendChart (actual+plan lines) / AttritionTrendChart
├── HeadcountLayer(filters, granularity)   — badge "01"
│   ├── Visual1 "Actual vs Plan Variation" (renamed) — ComposedChart: hcStaffingByFY(filters, granularity),
│   │                                                   PlanSelect now offers PLAN_NAMES; line renamed "Variation %"
│   ├── Visual2 "Attrition"          — Region/Sub-region-level default (attritionByDimension), click a bar to
│   │                                   drill into attritionTrendByDimension(filters, key, dimension, granularity);
│   │                                   custom tooltip also shows the raw attritionCount, not just the %
│   └── Visual3 "Headcount Impact on SL" (renamed) — ComposedChart: slTrendByFY(filters, granularity, planSelection);
│                                                     Region/Country toggle removed; own independent Plan dropdown
│                                                     (2026-07-23); defaulter list below now
│                                                     slDefaulterQueues(filters, planSelection) — actual>plan AND SL<90
├── PlanOverPlanVariationLayer(filters, granularity) — MSG-specific (no longer the shared component), badge "02"
│   ├── MainChart "Plan over Plan Variation" (renamed) — Region/Sub-region default view (planOverPlanByDimension),
│   │                                                     click a bar to drill into planOverPlanTrendByDimension;
│   │                                                     shared Plan A/Plan B PlanDropdowns (2026-07-23, replacing the
│   │                                                     old fixed "Plan A"/"Plan B" series) live here, driving both
│   │                                                     this chart and QueueVarianceChart below
│   └── QueueVarianceChart "Queues with Highest Variation" — diverging horizontal bars: planOverPlanQueueVariance(filters,
│                                                             planA, planB), worst |variance| first, value-labeled (same
│                                                             polish as Forecasting's Top Queues by Variance charts)
├── UtilizationLayer(filters, granularity) — renamed "Utilization and Outage Analysis", badge "03"
│   ├── Visual1 "Actual vs Target Utilization"     — time-axis BarChart+Line: utilizationByFY(filters, granularity)
│   │                                                 now includes an Adherence % line; tooltip shows top-3 auxBreakdown
│   ├── Visual2 "Utilization Defaulter Queues" (renamed) — queue-axis horizontal bars: utilizationByQueue(filters),
│   │                                                       each queue's tooltip now lists 2-3 auxes
│   └── Visual3 "Outage — Actual vs Target" (renamed 2026-07-23, was "Leave Impact — Actual vs Target") — queue-axis
│                                             horizontal bars: leavesByQueue(filters, plan), ascending; own independent
│                                             Plan dropdown (2026-07-23), series/tooltip labels read "Actual/Target Outage"
└── MsgCapacityGeoMap(filters)              — badge "04"; dual BinaryToggle (Headcount/SL% metric × Region/Sub-region view,
                                               replacing the earlier curated-14-country view)
```

### TsaCapacityPage (revised 2026-07-03 — mirrors MsgCapacityPage's revision pass, adapted to LOBs)

```
TsaCapacityPage
├── TsaFilterPanel(filters, onChange, granularity, onGranularityChange) — reused directly from tsa/TsaFilterPanel.jsx,
│                                                                          unmodified (identical field set: LOB/FY-Qtr-
│                                                                          Month-Week/Business Partner/Global Grouping;
│                                                                          Global Grouping options corrected 2026-07-03)
├── TsaCapacityMetricCards(filters, granularity) — tsaCapacityCardData(filters, granularity); 4 cards with YTD/YoY
│   │                          sub-messages (ytdSub, same pattern as TsaMetricCards.jsx/MsgCapacityMetricCards.jsx) for
│   │                          Staffing Summary (renamed from Total FTE)/Attrition/Avg Case Time; Cases per FTE
│   │                          unchanged. SLO % card removed 2026-07-23 (see design_choice.md) — was 5 cards, now 4.
│   │                          Each card a Modal drill-down
│   └── DrillDownModal — FteTrendChart / AttritionTrendChart / CasesPerFteTrendChart (line) /
│                         AvgCaseTimeTrendChart (line)
├── HeadcountAttritionLayer(filters, granularity) — renamed "Headcount and Utilization", badge "01"
│   ├── Visual1 "Actual vs Plan Variation" (renamed) — ComposedChart: fteByFY(filters, granularity, planName); line
│   │                                                   renamed "Variation %"; Plan dropdown added 2026-07-23 for parity
│   │                                                   with MSG Capacity's equivalent chart
│   ├── Visual2 "Attrition"          — Region/Sub-region-level default (tsaAttritionByDimension), click a bar to drill
│   │                                   into tsaAttritionTrendByDimension(filters, key, dimension, granularity);
│   │                                   custom tooltip also shows the raw attritionCount
│   └── Visual3 "Utilization Variance" (renamed) — ComposedChart: tsaUtilByFY(filters, granularity, lens); lens toggle
│                                                   relabeled Region/Sub-region (was Region/Country, always cosmetic)
├── PlanOverPlanVariationLayer(filters, granularity) — TSA-specific (no longer the shared component), badge "02"
│   ├── MainChart "Plan over Plan Variation" — Region/Sub-region default view (tsaPlanOverPlanByDimension), click a bar
│   │                                          to drill into tsaPlanOverPlanTrendByDimension; shared Plan A/Plan B
│   │                                          PlanDropdowns (2026-07-23, replacing the old fixed "Plan A"/"Plan B"
│   │                                          series) live here, driving both this chart and LobVarianceChart below
│   └── LobVarianceChart "LOBs with Highest Variation" — diverging horizontal bars: planOverPlanLobVariance(filters,
│                                                         planA, planB), worst |variance| first, value-labeled
├── WorkloadDistributionLayer(filters, granularity) — badge "03"
│   ├── Visual1 "Workload Distribution" (renamed) — recharts Sankey: workloadSankey(filters, mode), LOB/CQN BinaryToggle
│   │                                                (LOB mode: CQN tiers→real LOBs; CQN mode: LOB tiers→real TSA queues);
│   │                                                node hover (2026-07-20) shows every connected node on the other side
│   │                                                with value + % of the hovered node's own total (nodeHoverSummary(),
│   │                                                fixed top-right panel) — separate from the existing link-hover Tooltip,
│   │                                                which still shows one single flow at a time
│   └── Visual2 "Average Case Time Variance" (renamed, repointed) — ComposedChart: actHrsByFY(filters, granularity)
│                                                                    bars + Adherence % line + actHrsDefaulterLobs list
│   (Visual3 "ACT Trend — Actual vs Plan" removed entirely 2026-07-23 — layer is now exactly 2 visuals, filling the
│    row via each Visual's own flex-1, no layout change needed)
└── TsaCapacityGeoMap(filters)                — badge "04" (mockup calls it "Layer 5", renumbered — see design_choice.md);
                                                 Region/Sub-region BinaryToggle, same fallback-to-parent-region
                                                 mechanic as MsgCapacityGeoMap. Switched from SLO% to Headcount
                                                 2026-07-23 (see design_choice.md) — geoHeadcountByRegion/
                                                 geoHeadcountBySubRegion(filters) reshape tsaAttritionByDimension's
                                                 existing headcount split; color bands are relative to the current
                                                 view's own peak value (≥75%/50%/25% of max), not fixed thresholds
```

The shared `capacity/PlanOverPlanLayer.jsx` component (and its containing `capacity/` folder) was deleted 2026-07-03 once both Capacity pages had their own specialized Plan-over-Plan layer and nothing imported it anymore.

---

## Per-Graph and Per-Card RCA/CLCA Popup (2026-07-10)

Every chart-level visual on all 4 pages (31 `Visual`-wrapped charts + the 4 Geo Maps, which have their own
custom layout) carries a small "i" button (`GraphInsightButton`, `ChartKit.jsx`) in its top-left corner. Clicking
it shows one RCA sentence and one CLCA sentence specific to that graph. At the time this was built, each page
also had a page-level RCA/CLCA sidebar (`RcaClcaPanel.jsx`/`TsaRcaClcaPanel.jsx`/`MsgCapacityRcaClcaPanel.jsx`/
`TsaCapacityRcaClcaPanel.jsx`) with longer multi-bullet content; that sidebar was removed 2026-07-20 once this
per-graph button became the sole RCA/Insights surface (see the 2026-07-20 entry above and in `design_choice.md`).
`Visual` takes two new optional props, `rca`/`clca` (plain strings) — passing them renders the button; omitting both renders nothing, so every
other `Visual` call site in the app that hasn't been touched continues to work unchanged. The button always sits
top-left, opposite `cornerControls` (top-right), which many visuals already use for Region/Sub-region-style
toggles, so the two never collide. Content is illustrative (same convention as the sidebars), one sentence each,
per the explicit "don't exaggerate it, just a small pop-up" request.

**Follow-up the same day**: extended to all 20 KPI cards (5 cards × 4 pages) via the same `rca`/`clca` props on
each page's own local `Card` component (`MetricCards.jsx`, `TsaMetricCards.jsx`, `MsgCapacityMetricCards.jsx`,
`TsaCapacityMetricCards.jsx`), positioned top-right of the card. Each `Card` changed from a `<button>` to a
`<div role="button" tabIndex={0}>` so the new nested `GraphInsightButton` (a real `<button>`) isn't invalid
HTML inside another `<button>`; the insight button's wrapper stops click propagation so it doesn't also toggle
the card's drill-down modal.

**Superseded 2026-07-23 (cards only):** `rca`/`clca` were removed entirely from all 4 pages' local `Card`
components — KPI cards no longer show RCA/CLCA at all. `GraphInsightButton`/`rca`/`clca` on every `Visual`/
graph/geo map are untouched by this change; RCA/CLCA still exists, just only on visuals now, not cards.

## New "What This Shows" Info Button — Separate From RCA/CLCA (2026-07-23)

A second, independent popup component, `InfoButton` (`ChartKit.jsx`), added alongside (not instead of, on
visuals) `GraphInsightButton`. Takes one `info` string — a plain, factual sentence describing what the card/
chart shows, with no RCA/CLCA-style analysis framing. On a `Visual`, `info` renders inline in the title `<p>`
itself (flex row + small gap), not another absolute corner — this was deliberate so it never collides with
`cornerControls` (top-right: Region/Sub-region toggles, Plan dropdowns) or `GraphInsightButton` (top-left).
Mirrored into the two pre-ChartKit local `Visual` copies (`Layer1PlanOverPlan.jsx`/`Layer2ActualVsPlan.jsx`) and
into every geo map's own custom header layout. On the 4 pages' local `Card` components, `InfoButton` takes the
same top-right absolute slot `GraphInsightButton` used to occupy, now that cards no longer carry RCA/CLCA —
rendered via `<InfoButton info={info} align="right" />`. All ~20 cards and ~35 visuals/graphs/geo maps across
all 4 pages now have a working `info=` description.

## Theming (2026-07-02)

CSS custom properties in `src/index.css`, not a second stylesheet or CSS-in-JS. `:root` defines the dark
(default) values; `[data-theme='light']` on `<html>` overrides them. `App.jsx` owns the `theme` state
(`'dark'|'light'`), applies the attribute, and persists the choice to `localStorage` (`tsg-spog-theme`) —
set inside the `useState` initializer (not a `useEffect`) so the attribute is applied before first paint,
avoiding a flash of the wrong theme.

```
--bg-page / --bg-panel / --bg-raised / --bg-inset     — 4 background depth levels
--border-subtle / --border-default / --border-strong  — border opacity tiers
--text-primary / --text-secondary / --text-dim / --text-faint / --text-muted — text hierarchy
--accent, --accent-contrast                            — brand accent + its readable-on-fill text color
--accent-dim, --accent-glow                            — low-opacity accent tints
--tooltip-bg, --chart-grid, --select-bg(-hover)         — component-specific tokens
--scrollbar-track/-thumb(-hover), --shadow-card(-hover/-active) — misc
```

Every shared CSS class (`.card-panel`, `.chart-panel`, `.layer-header`, `.select-dark`, `.ms-*`,
`.filter-chip`, `.drill-toggle`/`.drill-btn`, `.chart-tooltip`, `.theme-toggle`, scrollbars, `body`) and
almost every component's inline background/border/text-color style reference these variables instead of
hardcoded hex — see `design_choice.md` for the full file list and the categories left un-themed on
purpose (chart series/data colors, region palettes, the geo accuracy scale, status badges, geo map
canvases). `.select-dark`'s embedded data-URI chevron SVG is the one exception that structurally can't
follow the theme (a baked-in `stroke` inside a `background-image: url("data:image/svg+xml,...")` can't
reference a page-level CSS variable) — it uses a fixed neutral slate that reads acceptably on both.

---

## Global Time-Granularity Toggle (2026-07-02)

`GranularityToggle.jsx` (shared) renders a Quarter/Month/Week pill inside both filter bars. The value lives
in `ForecastingPage`/`TsaForecastingPage` state (`granularity`, default `null` — no selection, meaning Fiscal
Year, same convention as every value filter defaulting to "All") alongside `filters`,
and flows down as a plain prop to every chart-rendering component — no context, no separate store, same
pattern as `filters` itself.

Shared math, in `mockData.js` (imported by `tsaData.js` where needed):
```
FISCAL_MONTH_LIST                      — FY25M01...FY27M12 (36 values); canonical here now, tsaData.js re-exports it
periodsForGranularity(granularity, years) — returns the ordered FISCAL_QUARTERS/FISCAL_MONTH_LIST/FISCAL_WEEK_LIST
                                             slice matching the given years, based on granularity ('Month'|'Week'|else Quarter)
expandToGranularity(fySeries, granularity, rawFields) — for ADDITIVE fields (volumes, counts, dollars):
                                             divides each FY row's listed fields across its sub-periods
                                             (÷4 Quarter, ÷12 Month, ÷52 Week) with a small deterministic
                                             wobble; returns fySeries unchanged if granularity is falsy/'Year'
expandRateToGranularity(fySeries, granularity, rateFields) — for RATE fields (percentages, targets):
                                             keeps each field at the parent FY's magnitude across every
                                             sub-period (wobble only, no division) — dividing a percentage
                                             by a period count would be meaningless
```

Selectors that accept a `granularity` argument (all default to `undefined`/`'Year'` — i.e. unchanged FY
behavior — when omitted, so any caller that doesn't pass one still works):
```
mockData.js:  planOverPlanByFY, actualVsPlanByFY, stackedAdherenceByFY (own bespoke expansion — renormalizes
              % buckets rather than dividing them), callVolumeByFY, dbOspVolumeByFY
tsaData.js:   asuByFY, srByFY, asuPlanVsPlanByFY, srPlanVsPlanByFY, cpasuByFY (derives from the above, no
              separate expansion needed), ucrByFY (uses expandRateToGranularity — see design_choice.md for
              the bug this avoided), srBotsByFY, srDbOspByFY (both derive from srByFY, no separate expansion),
              regionTrendGranularity(filters, granularity) / cpasuTrendByRegion(filters, region, granularity)
              — granularity now comes from the global toggle, not inferred from which time filter was selected
```

`topNonAdherentLobsByYear(filters, period, count)` (TSA) was generalized to derive its target fiscal year via
`period.slice(0, 4)`, since the "UCR Runrate with Target" chart it backs now renders at whatever granularity
is selected — a clicked bar can carry a quarter/month/week label, not just a bare fiscal year.

Charts whose x-axis isn't time — region (Plan Impact, both Geo Maps), queue (Top Queues by Variance), or
LOB (the LOB donut breakdowns) — don't take a `granularity` argument at all; there's no sub-year view of
"which region," so the toggle doesn't apply to them by design.

---

## State Management

No external state library. All state is local React `useState`:

| Component | State | Type |
|---|---|---|
| `App` | `view` ('landing'\|'msg'\|'tsa'); `msgSubPage`/`tsaSubPage` ('forecasting'\|'capacity', independent, default 'forecasting'); `theme` ('dark'\|'light', persisted to localStorage) | String, String, String, String |
| `ForecastingPage` | `filters`; `granularity` (null\|'Quarter'\|'Month'\|'Week', default null = Fiscal Year) | Object (12 filter keys), String or null |
| `MetricCards` | `active` (which card's modal is open) | String or null |
| `Layer1PlanOverPlan` | `plans` (planA/planB, reset by `filters.planName` via `useEffect`), `open` | Object, Boolean |
| `Layer2ActualVsPlan` | `plan` (reset by `filters.planName` via `useEffect`), `open` | String, Boolean |
| `Layer3GeoMap` | `viewMode` (Region/Country), `hovered`, `open` | String, Object, Boolean |
| `TsaForecastingPage` | `filters`; `granularity` (null\|'Quarter'\|'Month'\|'Week', default null = Fiscal Year) | Object (7 filter keys), String or null |
| `TsaMetricCards` | `active` (which card's modal is open); `TotalQueuesSection`'s `selectedRegion` (donut drill) | String or null, String or null |
| `AsuLayer` / `SrLayer` | `plan`, `plans` (planA/planB), `open`, `selectedRegion` (Visual3 drill state) | String, Object, Boolean, String or null |
| `AsuSrTrendLayer` | `open`; Visual1's `selectedRegion` (CPASU Trend drill); Visual2's `plan`; Visual3's `modalPeriod` | Boolean, String or null, String, String or null |
| `TsaGeoMap` | `open`, `hovered` | Boolean, Object |
| `MsgCapacityPage` / `TsaCapacityPage` | `filters`; `granularity` (same null-default convention) | Object, String or null |
| `MsgCapacityMetricCards` / `TsaCapacityMetricCards` | `active` (which card's modal is open) | String or null |
| `PlanOverPlanLayer` (shared) | `open`, `plans` (planA/planB) | Boolean, Object |
| `HeadcountLayer` / `HeadcountAttritionLayer` / `UtilizationLayer` / `WorkloadDistributionLayer` | `open`; per-visual `lens` (Region/Country) where applicable | Boolean, String |
| `MsgCapacityGeoMap` | `open`, `metric` (Headcount/SL%), `viewMode` (Region/Country), `hovered` | Boolean, String, String, Object |
| `TsaCapacityGeoMap` | `open`, `hovered` | Boolean, Object |

`filters` flows down as a prop to `MetricCards`, all three layers, and every Visual sub-component. Each chart/card recomputes its data via `useMemo(() => selectorFn(filters), [filters])`, calling into the selector functions exported from `mockData.js` (see Data Model). No FY/Quarter/Week drill-toggle state exists anymore — those were removed; the top filter bar's Fiscal Year/Quarter/Week filters are the only time control, and charts render at Fiscal Year granularity only.

---

## Data Model (`src/data/mockData.js`)

All 12 filters funnel into a small set of selector functions that take `filters` and return the exact data a chart/card needs. Static exports (all-caps) are the underlying datasets; lowercase functions are the live selectors components actually call.

**Filter value shape:** every filter except `dbOsp` is multi-select — its value is an array (`[]` = no selection = matches everything). `dbOsp` alone stays a plain string (`'DB'|'OSP'|'All'`) since it's a 3-way segmented pill (`FilterPanel.jsx`), not a searchable dropdown (`MultiSelectField.jsx`). `matchesMulti(selected, value)` in `mockData.js` is the shared "is this row in scope" check for array-valued filters.

### Constants
```
ACTIVE_QUEUE_NAMES   — 47 real active queue names (business-supplied; updated 2026-07-02, was 199)
INACTIVE_QUEUE_NAMES — 146 real inactive queue names (business-supplied, no UI yet; updated
                        2026-07-02, was 406)
CAPACITY_CODES       — ~610 real capacity codes (business-supplied)
PLAN_NAMES           — ['AOP_FY26Q4_AA', 'FY27 Q1 APR Plan', 'FY27 Q2 JUN Plan', 'FY27Q1_AA']
FISCAL_YEARS         — ['FY25', 'FY26', 'FY27']
FISCAL_QUARTERS      — FY25Q1 ... FY27Q4 (12 values, derived from FISCAL_YEARS) — filter only
FISCAL_WEEK_LIST     — FY25W01 ... FY27W52 (156 values, derived from FISCAL_YEARS) — filter only
REGIONS              — ['APJ', 'EMEA', 'Global', 'LATAM', 'NAMER']
SUB_REGIONS          — 24 real sub-region values (business-supplied)
BUSINESS_PARTNERS    — 7 real names (business-supplied)
L5_MANAGERS          — 15 real names (business-supplied)
inferRegion(name)    — regex-based mapping from a real queue name to one of REGIONS or 'Global'
```

### Queue fact table — the shared source of truth
```
ACTIVE_QUEUES — ACTIVE_QUEUE_NAMES.map(...) → Array<{
  name, region, subRegion, capacityCode, businessPartner, l5Manager, channel, dbOsp,
  offered, handled, accuracy, plan1, plan2, planVariance (getter), adherence (getter)
}>
```
Every queue gets `subRegion`/`capacityCode`/`businessPartner`/`l5Manager`/`channel`/`dbOsp` tags assigned deterministically (round-robin, `list[i % list.length]`) — the source lists don't specify a real per-queue mapping, so this is mock data enriched with realistic *structure* so every filter has something genuine to narrow, not a claimed real business relationship. `region` comes from `inferRegion(name)`.

```
filterQueues(filters) — returns ACTIVE_QUEUES rows matching all of: cqn, capacityCode,
  channel, businessPartner, region, subRegion, l5Manager (each an array via matchesMulti),
  plus dbOsp (single string, 'All' passes through)
effectiveFiscalYears(filters) — Week > Quarter > Year precedence → an array of matching
  FY strings (all 3 if nothing's selected; can span multiple years if the selection does)
```

### Inactive queue fact table + combined active/inactive selectors (2026-07-08)
```
INACTIVE_QUEUES — INACTIVE_QUEUE_NAMES.map(...) → Array<{ name, region, businessPartner }>
  region via the same inferRegion() regex as ACTIVE_QUEUES; businessPartner round-robin
  over BUSINESS_PARTNERS — the inactive roster came with no attributes beyond names, so
  these two are illustrative tags, same convention as ACTIVE_QUEUES's own tags
allQueuesByStatus(filters) — combined ACTIVE_QUEUES + INACTIVE_QUEUES rows, each tagged
  {status: 'Active'|'Inactive', accuracy: number|null}, narrowed ONLY by region/
  businessPartner (the two dimensions the inactive roster carries — the other 6 Queue
  filters only apply to the active side, same reasoning as the existing DB/OSP exemption
  for this card). Backs the Total Queues drill-down's region donut.
queuesByBusinessPartner(filters) — per-Business-Partner {businessPartner, active,
  inactive, total, activeNames[], inactiveNames[]}, sorted by total descending. Backs
  the drill-down's new Business Partner Breakdown table; the name arrays back the
  hover-to-see-queue-names tooltip on each count.
```

### Cards
```
cardData(filters, granularity) → {
  totalQueues, cqnVariance                      — from filterQueues({...filters, dbOsp:'All'}); NOT
                                                   granularity-aware (2026-07-20, deliberate — queue
                                                   roster/accuracy are flat, non-date-stamped facts, see
                                                   design_choice.md). cqnVariance's "within range"
                                                   threshold is accuracy >= 89 (tight on purpose — lands
                                                   the headline around 40-50%, not the ~75-80% a looser
                                                   threshold would give)
  callVolume (2026-07-20: granular)              — latest period off callVolumeByFY(filters, granularity)
                                                   (DB/OSP genuinely scopes volume here, via that
                                                   selector's own use of filterQueues(filters))
  forecastAccuracy (2026-07-20: granular)        — latest period off forecastAccuracyByFY(filters,
                                                   granularity); % stays flat across Quarter/Month/Week
                                                   within one FY (ratio-of-two-co-expanded-fields
                                                   flatness, see design_choice.md) — only moves at the
                                                   FY level
  dbOspSplit (2026-07-20)                       — latest period off dbOspVolumeByFY(filters, granularity),
                                                   ALWAYS from filterQueues({...filters, dbOsp:'All'}),
                                                   never the toggle-narrowed rows (that was circular —
                                                   filtered to "DB", every remaining row is DB, so it
                                                   always reported 100%/0%); summed by each queue's real
                                                   `offered` volume, not queue count, matching the card's
                                                   own "Offered volume" sublabel
}
```

### Card drill-down selectors (`MetricCards.jsx`)
```
callVolumeByFY(filters) — {period, offered, handled} per FY, narrowed to effectiveFiscalYears(filters);
  scaled by filterQueues(filters).length/ACTIVE_QUEUES.length off a per-FY baseline
  (BASE_CALL_VOLUME_BY_FY) that sums to the same 285.4K/268.7K totals as cardData's callVolume.
  Backs the Call Volume drill-down.
dbOspVolumeByFY(filters) — {period, db, osp} per FY: same BASE_CALL_VOLUME_BY_FY.offered baseline,
  split by each in-scope queue's dbOsp tag. Ignores filters.dbOsp itself (unlike callVolumeByFY) —
  every other filter still narrows the candidate queues. Backs the DB/OSP Split drill-down.
FORECAST_ACCURACY_BY_REGION / forecastAccuracyByRegion(filters) — {region, actual, forecast, accuracy}
  ×5 regions, static, narrowed to filters.region. Backs the Forecast Accuracy drill-down
  (bar: actual/forecast, line: accuracy% on a second axis).
CQN_VARIANCE_BY_FY — {fy, pct} ×3, static, curated to the 40-50% range (illustrative — no
  per-queue-per-year variance dataset exists yet). Backs the CQN Variance drill-down.
cqnVarianceQueuesByFY(filters, fy, count=5) — filterQueues({...filters, dbOsp:'All'}) filtered to
  |planVariance| <= 10, then a `count`-sized slice offset by the FY's index (so each year's
  pop-up shows a different-looking sample of the same real, currently-in-scope queues).
  Powers the modal opened by clicking a year's bar in the CQN Variance drill-down.
```

### Geo Map choropleth (`Layer3GeoMap.jsx`)
```
regionForCountry(name) — exact world-atlas topojson country name → 'NAMER'|'LATAM'|'APJ'|'EMEA'
  (everything not NAMER/LATAM/APJ and not Antarctica/Fr. S. Antarctic Lands defaults to EMEA —
  full-map coverage by elimination, illustrative continental split, not authoritative)
SUB_REGION_ACCURACY — accuracy per each of the 24 real SUB_REGIONS values, static/illustrative
subRegionForCountry(name) — country → one of the 24 sub-region keys, or null if unmapped
  ('Global' and 'Multiple SubRegions' are never mapped — they aren't places)
activeSubRegionKeys(filters) — filters.subRegion if set, else sub-regions whose representative
  country falls in a selected filters.region, else null (= show all)
geoRegionData(filters) / geoSubRegionRows(filters) — table rows for the summary table under the map
```
`Layer3GeoMap.jsx` fills each `<Geography>` by looking up its accuracy via the functions above
(no per-country lat/lng markers). In Sub-region view, a country with no specific sub-region tag
falls back to its parent region's accuracy at 35% opacity — full map coverage, but named
sub-regions still visually stand out at full opacity against the dimmed background.

### Layer 1 Data (Plan over Plan) — always Fiscal Year granularity
```
PLAN_VS_PLAN_BY_FY      — period, plan1, plan2, variance (computed getter) — 3 FYs, static
PLAN_VS_PLAN_BY_REGION  — region, plan1, plan2, variance — 5 regions, static
planOverPlanByFY(filters)     — PLAN_VS_PLAN_BY_FY narrowed to effectiveFiscalYears(filters)
planOverPlanByRegion(filters) — PLAN_VS_PLAN_BY_REGION narrowed to filters.region
cqnPlanVariance(filters, topN=5) — filterQueues({...filters, dbOsp:'All'}) → top-N by |planVariance|,
                                     or exactly the selected queues if filters.cqn is set.
                                     Rendered as a diverging bar (green ahead / red behind zero).
```

### Layer 2 Data (Actual vs Plan) — always Fiscal Year granularity
```
ACTUAL_VS_PLAN_BY_FY   — period, actual, plan, adherence (computed getter) — 3 FYs, static
STACKED_ADHERENCE      — fy, under10, between10and20, between20and30, above30 (% buckets,
                          bucketed by |variance| magnitude, not accuracy tier) — 3 FYs, static
actualVsPlanByFY(filters)      — ACTUAL_VS_PLAN_BY_FY narrowed to effectiveFiscalYears(filters)
stackedAdherenceByFY(filters)  — STACKED_ADHERENCE narrowed to effectiveFiscalYears(filters)
cqnActualVariance(filters, topN=5) — same queue scoping as cqnPlanVariance, ranked by |actual-vs-plan
                                       variance| (also a diverging bar, same green/red convention)
```

### Layer 3 Data (Geo) — see "Geo Map choropleth" above for the country-lookup functions
```
GEO_REGION_DATA — { region, accuracy, label } ×4 regions (NAMER/EMEA/APJ/LATAM — no 'Global' row)
geoRegionData(filters) — GEO_REGION_DATA narrowed to filters.region
```
Selecting Region = "Global" (or a Sub-region with no map presence) returns an empty array; `Layer3GeoMap.jsx` renders an explanatory empty state rather than a blank map.

---

## Data Model (`src/data/tsaData.js`)

Same conventions as `mockData.js`: static exports are datasets, lowercase functions are the live selectors components call. Imports `FISCAL_YEARS`, `FISCAL_QUARTERS`, `FISCAL_WEEK_LIST`, `BUSINESS_PARTNERS`, `REGIONS`, `regionForCountry`, and `matchesMulti` from `mockData.js` rather than duplicating them.

### Constants
```
LOB_LIST              — 33 real LOB names (business-supplied verbatim)
GLOBAL_GROUPING_LIST  — ['Consumer', 'Commercial', 'Enterprise'] — inferred, not yet user-confirmed
FISCAL_MONTH_LIST     — FY25M01 ... FY27M12 (36 values, derived from FISCAL_YEARS) — filter only
IMPACT_REGIONS        — ['AMER', 'APJ', 'EMEA', 'Global'] — the 4-region set for Plan Impact
                         (AsuLayer/SrLayer Visual3) and for CPASU Trend's region breakdown
                         (AsuSrTrendLayer Visual1), distinct from the 5-region REGIONS
LOB_QUEUES            — { 'High End Storage': { active: [...71 real names], inactive: [...~150 real names] } }
                         (business-supplied verbatim); other LOBs have no entry yet. Backs
                         TSA_ACTIVE_QUEUE_NAMES/TSA_ACTIVE_QUEUES below (Total Queues card).
TSA_ACTIVE_QUEUE_NAMES / TSA_INACTIVE_QUEUE_NAMES — = LOB_QUEUES['High End Storage'].active/.inactive,
                         used as the page-level TSA queue roster (not scoped to one LOB) since it's
                         the only real per-queue name data this page has
TSA_ACTIVE_QUEUES     — TSA_ACTIVE_QUEUE_NAMES.map(name => ({ name, region: inferRegion(name) })) —
                         inferRegion() is imported from mockData.js (newly exported), same
                         APJ/EMEA/LATAM/NAMER-prefix-else-Global logic as the Forecasting page's
                         own queue fact table. Backs the Total Queues card's region donut + table.
```

### LOB fact table
```
LOB_FACTS — LOB_LIST.map(...) → Array<{ lob, businessPartner, globalGrouping }>
  businessPartner/globalGrouping assigned round-robin (list[i % list.length]) — same
  "real names + illustrative structure" convention as ACTIVE_QUEUES in mockData.js
filterLobs(filters) — LOB_FACTS rows matching filters.lob / businessPartner / globalGrouping (matchesMulti)
tsaEffectiveFiscalYears(filters) — Week > Month > Quarter > Year precedence
lobScopeRatio(filters) — filterLobs(filters).length / LOB_LIST.length, used to scale FY series
  so a narrower LOB selection produces proportionally smaller ASU/SR numbers
```

### ASU / SR / CPASU
```
ASU_BY_FY, SR_BY_FY               — {period, plan, actual, adherence (getter)} × 3 FYs, static
ASU_PLAN_VS_PLAN_BY_FY, SR_PLAN_VS_PLAN_BY_FY — {period, plan1, plan2, variance (getter)} × 3 FYs, static
asuByFY(filters) / srByFY(filters)                 — narrowed to tsaEffectiveFiscalYears, scaled by lobScopeRatio
asuPlanVsPlanByFY(filters) / srPlanVsPlanByFY(filters) — same narrowing + scaling
cpasuByFY(filters) — cpasu = sr.actual / asu.actual per period, rounded to 2 decimals (backs the CPASU card + drill-down)
```

### UCR
```
UCR_BY_FY — {period, target, current, adherence (getter)} × 3 FYs, static (BASE_UCR_TARGET 82/85/88)
ucrByFY(filters, granularity) — narrowed to tsaEffectiveFiscalYears, then expandRateToGranularity'd on
  target/current (see "Global Time-Granularity Toggle" above). Backs both the Current UCR card's
  drill-down and AsuSrTrendLayer Visual3 ("UCR Runrate with Target") — Visual3 used to render UCR_BY_FY
  directly to force always-FY regardless of filters; it now goes through ucrByFY(filters, granularity)
  like everything else, per the 2026-07-02 granularity-toggle change.
srBotsByFY(filters, granularity) — {period, humanSR, botsSR (~35% of actual), plan} — rendered as "SR's" /
  "UCR Handled SR's" in AsuSrTrendLayer Visual2 (display names only; data keys unchanged). Granularity
  flows through via srByFY(filters, granularity) internally; no separate expansion needed here.
srDbOspByFY(filters) — {period, db (~70% of actual), osp} — backs the Service Requests card's drill-down,
  rendered as grouped columns (not stacked)
topNonAdherentLobsByYear(filters, fy, count=5) — {lob, runrate, target} × count, sorted ascending by
  runrate (worst first). Backs the "UCR Runrate with Target" year-click modal (AsuSrTrendLayer Visual3).
  Replaced the old ucrNonAdherentQueues() (queue-level, removed 2026-07-02) now that the drill-down is
  LOB-level.
```

### Region / LOB impact ("Plan Impact" drill-down)
```
ASU_REGION_PLANS, SR_REGION_PLANS — {region, planA, planB} × 4 IMPACT_REGIONS, static
asuRegionPlans(filters) / srRegionPlans(filters) — currently ignore filters (deck shows a fixed region view)
buildLobImpact(base) — per region, computes a delta for all 33 LOBs via
  residue = (i*17 + ri*41) % 131; delta = round(base * 0.10 * (residue-65)/65)
  17 is coprime with the prime modulus 131, so i → i*17 mod 131 is injective over i=0..32 — every
  LOB gets a distinct delta within a region. (Fixed 2026-07-02: the original `(i*7+ri*13)%21` formula
  only produced 3 distinct buckets, so several LOBs showed an identical delta value.)
asuLobImpact(region, count=6) / srLobImpact(region, count=6) — top-N by ascending delta, clicked from
  the region bar in AsuLayer/SrLayer Visual3
```

### CPASU Trend: region breakdown + time-granularity drill (AsuSrTrendLayer Visual1)
```
REGION_SHARE — { AMER: 0.38, EMEA: 0.27, APJ: 0.22, Global: 0.13 } — illustrative share-of-total
  split of the latest FY's aggregate ASU/SR across the 4 IMPACT_REGIONS
cpasuByRegion(filters) — {region, asu, sr, cpasu} × 4, the default (region) view: splits the latest
  in-scope FY's cpasuByFY() snapshot by REGION_SHARE
regionTrendGranularity(filters) — Week > Quarter > Year precedence over the top filter bar's time
  filters → {granularity, periods}; periods are real distinct values (e.g. the selected fiscal weeks),
  not collapsed to years like tsaEffectiveFiscalYears
cpasuTrendByRegion(filters, region) — {period, asu, sr, cpasu} × periods.length, the drill-down view once
  a region is clicked: divides each period's year's ASU/SR baseline by periodsPerYear(granularity)
  (52 for Week, 4 for Quarter, 1 for Year), scaled by REGION_SHARE, lobScopeRatio, and a small
  deterministic per-period/region wobble — fully synthetic, no real per-region/quarter/week dataset exists
```

### Geo Map (LOB adherence)
```
lobAdherenceValue(regionIndex, lobIndex) = 65 + ((regionIndex*7 + lobIndex*11) % 30) — illustrative
geoAdherenceByRegion(filters) — averages adherence across filterLobs(filters) (or all 33 LOBs if
  none selected) for each of the 5 REGIONS; consumed by TsaGeoMap's choropleth fill
```

### Cards
```
tsaCardData(filters, granularity) → { totalQueues, asuActuals, srActuals, cpasu, currentUcr }, each the
  latest-period snapshot (asu[asu.length-1] etc., where asu = asuByFY(filters, granularity)) off the
  selector functions above, except totalQueues ({ active, inactive } = TSA_ACTIVE_QUEUE_NAMES.length/
  TSA_INACTIVE_QUEUE_NAMES.length), which ignores filters entirely. asuActuals/srActuals/cpasu
  additionally carry { period, prevPeriod, yoyPct } — yoyPct is the % change vs the prior in-scope
  period AT WHATEVER GRANULARITY THE PAGE IS SET TO (2026-07-20 fix — previously always ignored
  granularity and compared FY-over-FY regardless of the toggle), null if there isn't a prior period,
  backing each card's "YTD <period>: ... vs <prevPeriod>" sub-message.
```

---

## Data Model (`src/data/msgCapacityData.js`) — MSG Capacity Plan (2026-07-03, revised 2026-07-03)

Same conventions as `mockData.js`/`tsaData.js`. Built from `ACTIVE_QUEUE_NAMES` (the same 47-queue roster MSG Forecasting uses) — every queue gets HC/utilization/SL/leaves fields in addition to Forecasting's existing tags. `subRegion` is read directly off `ACTIVE_QUEUES[i]` (same index, same source array) rather than independently assigned, so a queue's sub-region tag matches on both this page and MSG Forecasting.

```
AUX_CODES         — ['Aux 1' ... 'Aux 9'] — illustrative culprit-code taxonomy for utilization gaps
CAPACITY_QUEUES   — ACTIVE_QUEUE_NAMES.map(...) → Array<{
  name, region, subRegion, businessPartner, channel,
  planHC, actualHC, hcDelta (getter),
  utilTarget, utilActual, utilGap (getter), auxCulprit,
  slTarget, slActual,
  leavesPlan, leavesActual, leavesDelta (getter),
  popPlan1, popPlan2, popVariance (getter) — Plan-over-Plan headcount, distinct from planHC/actualHC
}>
filterCapacityQueues(filters) — narrows CAPACITY_QUEUES by combinedQueueName/capacityCode/channel/
  businessPartner/region/subRegion (matchesMulti) — businessOrg/country dropped 2026-07-03
shareByKey(rows, key) — deterministic {key: share} distribution of a queue set across 'region' or
  'subRegion', backing both the Attrition and Plan over Plan Variation region/sub-region drills
```

```
hcStaffingByFY(filters, granularity)       — {period, actual, plan, adherence} — HeadcountLayer Visual1 ("Actual vs Plan
                                              Variation") + FTE/Staffing card modal
attritionByFY(filters, granularity, lens)  — {period, headcount, attrition} — still backs the Attrition card's own Modal
                                              popup only (unchanged, "pop up view is good"); NOT used by HeadcountLayer
                                              Visual2 anymore, which uses the dimension selectors below instead
attritionByDimension(filters, dimension)   — {key, headcount, attrition, attritionCount} × regions or sub-regions —
  ('Region'|'SubRegion')                     HeadcountLayer Visual2's default view, sized by shareByKey
attritionTrendByDimension(filters, key,    — {period, headcount, attrition, attritionCount} — FY/granularity trend for
  dimension, granularity)                    one clicked region/sub-region key, same drill mechanic as tsaData.js's cpasuTrendByRegion
slTrendByFY(filters, granularity)          — {period, actual, plan, slPct} — HeadcountLayer Visual3 ("Headcount Impact
                                              on SL") + SL% card modal
slDefaulterQueues(filters, count=6)        — queues where actualHC > planHC AND slActual < 90, sorted by slActual
                                              ascending (worst SL first) — replaces the old actual>plan-only defaulterQueues
planOverPlanByDimension(filters, dimension) — {key, plan1, plan2, variance} × regions or sub-regions — PlanOverPlanVariationLayer's
                                               MainChart default view, sized by shareByKey
planOverPlanTrendByDimension(filters, key, — {period, plan1, plan2, variance} — FY/granularity trend for one clicked key
  dimension, granularity)
planOverPlanQueueVariance(filters, topN=8)  — {name, plan1, plan2, variance} sorted by |variance| DESCENDING — the
                                               "Queues with Highest Variation" ranked chart, this page's headline visual
utilizationByFY(filters, granularity)      — {period, actual, target, adherence, auxBreakdown, auxCulprit, auxImpactPct} —
                                              auxBreakdown is the top-3 Aux codes by impact (auxCulprit/auxImpactPct kept
                                              for back-compat = auxBreakdown[0]); attached AFTER expansion (by array
                                              index), not passed through expandRateToGranularity, since Aux codes are
                                              categorical/non-numeric fields the expansion helpers don't carry
utilizationByQueue(filters, topN=6)        — queue-axis ranking, sorted by |utilGap| DESCENDING (worst first), each row
                                              now carries `auxes` (3 distinct Aux codes) instead of a single auxCulprit
leavesByQueue(filters, topN=6)             — queue-axis ranking: top-N by |leavesDelta| descending, then re-sorted ascending by
                                              delta for display (see design_choice.md for the bug this fixes)
cpfByFY(filters, granularity)              — {period, actual, plan} — Cases per FTE card (rate-preserving expansion,
                                              replaced Total FTE 2026-07-03)
capacityCardData(filters, granularity)     — {staffing, utilization, sl, casesPerFte, attrition}. staffing/utilization/
                                              sl/attrition each carry {value/actual, period, prevPeriod, yoyPct} —
                                              both the headline value AND yoyPct now drill with granularity (2026-07-20,
                                              superseding the prior always-FY-over-FY design; reuses each metric's own
                                              granular selector for the prior-period comparison). casesPerFte carries only {actual, plan, period} —
                                              no prevPeriod/yoyPct, since its card is YTD-only by design (no comparison
                                              shown, see design_choice.md)
GEO_CAPACITY_BY_REGION / geoCapacityByRegion(filters) — {region, fulfillmentPct, slPct}
GEO_CAPACITY_BY_SUBREGION / geoCapacityBySubRegion(filters, metric) — {subRegion, value} × 24 real SUB_REGIONS values,
  replacing the earlier curated-14-country geoCapacityByCountry/COUNTRY_TO_WORLD_ATLAS_NAME machinery entirely
```

Business logic: Attrition % inverts the usual "higher actual is better" framing — an increase YoY is BAD (red), since
rising attrition is the problem being flagged; Staffing/Utilization/SL % keep the normal "growth is good" framing.
Cases per FTE (replaced Total FTE 2026-07-03) is YTD-only with no YoY comparison at all — see the capacityCardData
entry above. Plan Name filter options now come from `mockData.js`'s `PLAN_NAMES` (MSG Forecasting's own list), not a
page-specific plan list.

---

## Data Model (`src/data/tsaCapacityData.js`) — TSA Capacity Plan (2026-07-03, revised 2026-07-03)

Reuses `tsaData.js`'s `LOB_LIST`, `LOB_FACTS`, `LOB_QUEUES`, `filterLobs`, `tsaEffectiveFiscalYears` directly — this page's filter set is identical to TSA Forecasting's, so no separate fact table or filter function was built for the base LOB scoping. `subRegion` was added to `TSA_CAPACITY_LOBS` (round-robin over `SUB_REGIONS`) to back the region/sub-region drills and Geo Map view added in the revision pass.

```
lobScopeRatio(filters) — filterLobs(filters).length / LOB_FACTS.length (local copy of tsaData.js's private helper)
tsaShareByKey(rows, key) — deterministic {key: share} distribution of a LOB set across 'region' or 'subRegion',
  backing the Attrition and Plan over Plan Variation region/sub-region drills — same role as msgCapacityData.js's shareByKey
filterCapacityLobs(filters) — TSA_CAPACITY_LOBS rows narrowed to filterLobs(filters)'s in-scope LOB names
fteByFY(filters, granularity)             — {period, actual, plan, adherence} — Staffing Summary card (renamed from Total
                                              FTE) + HeadcountAttritionLayer Visual1 ("Actual vs Plan Variation")
tsaAttritionByFY(filters, granularity, lens) — {period, headcount, attrition} — still backs the Attrition card's own
                                              Modal popup only (unchanged); NOT used by HeadcountAttritionLayer Visual2
                                              anymore, which uses the dimension selectors below instead
tsaAttritionByDimension(filters, dimension) — {key, headcount, attrition, attritionCount} × regions or sub-regions —
  ('Region'|'SubRegion')                      HeadcountAttritionLayer Visual2's default view
tsaAttritionTrendByDimension(filters, key,  — {period, headcount, attrition, attritionCount} — FY/granularity trend for
  dimension, granularity)                     one clicked region/sub-region key
tsaUtilByFY(filters, granularity, lens)   — {period, actual, target, adherence} — HeadcountAttritionLayer Visual3
                                              ("Utilization Variance"); lens 'Region'|'Country' internally, relabeled
                                              Region/Sub-region in the UI (still a cosmetic nudge, not a real dimension split)
cpfByFY(filters, granularity)             — {period, actual, plan} — Cases per FTE card (rate-preserving expansion, unchanged)
actHrsByFY(filters, granularity)          — {period, actual, plan, adherence} — Avg Case Time card + Workload
  Distribution Visual2/Visual3; adherence = plan/actual*100 (a "lower is better" metric, so adherence >=100 means
  actual is at or under plan); rate-preserving expansion (avg case time is hours-per-case, not a summable volume)
actHrsDefaulterLobs(filters, count=6)     — {lob, actual, plan, delta} sorted by delta DESCENDING — LOBs running above
  target ACT, backing the "top LOBs above target" list under both Workload Distribution ACT visuals
geoHeadcountByRegion(filters) / geoHeadcountBySubRegion(filters) — {region/subRegion, headcount} — reshapes
  tsaAttritionByDimension's own headcount split for TsaCapacityGeoMap (2026-07-23, replacing the removed SLO%
  selectors below — see design_choice.md). Color bands relative to the current view's own peak value, not fixed
  thresholds, since headcount is a raw count rather than a 0-100% rate.
  (Removed 2026-07-23: geoSloByRegion/TSA_GEO_SLO_BY_REGION, geoSloBySubRegion/TSA_GEO_SLO_BY_SUBREGION, sloByFY,
  SLO_BY_FY — the SLO % card and its Geo Map coloring were both replaced; see design_choice.md.)
tsaCapacityCardData(filters, granularity) — {totalFte, attrition, casesPerFte, avgCaseTime}. totalFte/attrition/
  avgCaseTime each carry {actual, period, prevPeriod, yoyPct} — both the headline value AND yoyPct drill with
  granularity (2026-07-20); casesPerFte is unchanged ({actual, plan} only). No longer returns globalSlo (2026-07-23,
  SLO % card removed).
tsaPlanOverPlanByDimension(filters, dimension) — {key, plan1, plan2, variance} × regions or sub-regions — Plan over
  Plan Variation layer's MainChart default view
tsaPlanOverPlanTrendByDimension(filters, key, dimension, granularity) — {period, plan1, plan2, variance} — FY/granularity
  trend for one clicked key
planOverPlanLobVariance(filters, topN=8)  — {name, plan1, plan2, variance} sorted by |variance| DESCENDING — the
  "LOBs with Highest Variation" ranked chart (analogous to MSG's planOverPlanQueueVariance, ranking LOBs not queues)
workloadSankey(filters, mode='LOB')       — {nodes, links} recharts Sankey shape. mode 'LOB': 3 illustrative CQN
  priority-tier sources → 4 real LOB targets (Networking/Storage/Server/ScaleVault). mode 'CQN': 3 illustrative LOB
  priority-tier sources → 4 real TSA queue targets (filtered against LOB_QUEUES['High End Storage'].active to
  guarantee they're genuine); each link value scaled by lobScopeRatio(filters)
TSA_CAPACITY_LOBS                         — LOB_FACTS.map(...) + {region, subRegion, workloadPlan, workloadActual,
  actHrsPlan, actHrsActual, popPlan1, popPlan2, popVariance (getter)} — per-LOB fact table (spreads LOB_FACTS's own
  businessPartner/globalGrouping tags rather than re-deriving them); popPlan1/popPlan2 back planOverPlanLobVariance
```

`workloadByFY`/`WORKLOAD_BY_FY` (the original "Workload Act vs Plan" hours-based dataset) were removed 2026-07-03 once
Workload Distribution's Visual2 was repointed at the Average Case Time metric instead — nothing references the
workload-hours numbers anymore. The shared `capacity/PlanOverPlanLayer.jsx` this page used to import was also deleted
once `PlanOverPlanVariationLayer.jsx` replaced it (see design_choice.md).

Business logic, now YoY-based instead of vs-plan/vs-target: Staffing Summary flags a YoY increase as GOOD (green) —
this preserves the page's original "more heads is the safer direction" philosophy (the pre-revision Total FTE card
flagged understaffing, not overstaffing, as the risk — unlike MSG's Total FTE, which flags overstaffing). Attrition
and Avg Case Time flag a YoY increase as BAD (red) — both are genuine higher-is-worse metrics. Cases per FTE keeps
its original actual-vs-plan (not YoY) comparison, unchanged from before this revision pass. (SLO % card removed
2026-07-23 — see design_choice.md.)

---

## Data Model (`src/data/planningCalendarData.js`) — Fiscal Calendar + Planning Cycle (2026-07-27)

Unlike every other data file in this app, this one is 100% real content (dates, plan names, activity text, holidays)
supplied directly by the user — an FY27 fiscal calendar image and a planning-cycle Excel workbook (`ghgh.xlsx`,
sheets "Overall FY27" and "Current Planning cycle"). Nothing here is illustrative/mock.

```
FY_START = Date.UTC(2026, 0, 31)          — anchor date (a Saturday); everything else is computed from this
buildFiscalCalendar()                     — generates all 52 weeks via the standard 4-4-5 pattern (4,4,5 weeks per
  quarter's 3 months), weeks running Sat→Fri; QWKS resets 1-13 per quarter, WKS runs 1-52 continuously
FISCAL_CALENDAR                           — [{ label: 'Q1'..'Q4', months: [{ name, weeks: [{ qwks, wks,
  days: [{ date, day, type }] }] }] }] — type is null | 'sco' | 'holiday' | 'payDate'
ANNOTATIONS                               — 19 hardcoded {isoDate: type} entries transcribed from the supplied
  image — NOT a computed rule (real SCO dates don't follow a fixed cadence); holidays double-check as real US
  observed dates (Memorial Day, Independence Day observed, Labor Day, Thanksgiving + day after, a Dec 21-25
  shutdown week, New Year's Day)
FISCAL_YEAR_LABEL / FISCAL_YEAR_RANGE      — 'Fiscal Year 2027' / '(January 31, 2026 - January 29, 2027)', the
  range string computed from FY_START, not hardcoded
DB_WEEK_TEMPLATE                          — the 6-week Mon-Fri activity template shared by every DB-track plan
  cycle (April/Jun/Aug/Oct/Dec Plan) — the source Excel repeats this near-verbatim per cycle, so it's defined once
buildDbCycle(planName, startIso, overrides) — applies DB_WEEK_TEMPLATE starting at startIso, with per-cycle
  overrides (only April Plan's week-1 wording differs, adding "(ASU, ICR, UCR)")
OVERALL_DB_CYCLES                         — the 5 DB-track cycles across FY27 (April/Jun/Aug/Oct/Dec Plan)
OSP_Q_TEMPLATE / buildOspQCycle()         — same idea for the OSP track's Q3/Q4-style cycles (May Plan's own
  template is unique — only occurs once — so it's written out directly instead of templated)
OVERALL_OSP_CYCLES                        — May Plan (OSP), FY27 Q3 Plan (OSP), FY27 Q4 Plan (OSP)
CURRENT_CYCLE / CURRENT_CYCLE_LABEL       — the source's "Current Planning cycle" sheet, drilled into by call-
  volume model instead of by track: srModel: {db, osp}, contactsModel: {db, osp: null} — Contacts Model has no
  OSP counterpart in the source and runs 2 weeks longer than SR Model's own cycle
formatWeekRange(startIso)                 — 'Mon D - Fri D' display string for a week's Monday start date
```

Reading the raw XLSX required accounting for merged cells: a cycle's "Plan Name" cell sometimes sits at the merge's
own anchor row, sometimes in an unmerged row directly above the merge (an inconsistency in how the source workbook
was hand-built, not a parsing choice) — the extraction script checks both. A trailing 2-row scratch table in the
"Current Planning cycle" sheet (`Utilization/Outage/ESG/HES` percentages) didn't fit the planning-cycle narrative
and was excluded rather than guessed at. The workbook's "Sheet4" tab and its 2 hidden sheets were excluded per
direct request / since hidden sheets aren't part of the visible deliverable.

---

## Data Model (`src/data/holidayCalendarData.js`) — Holiday Calendar (2026-07-27)

Also 100% real content, supplied as `Hoilday.xlsx` (a single sheet, `Fiscal Quarter | Fiscal Month | Week no. |
Day of the week | Holiday Date | Name of the Holiday | Country | SubRegion | Region`).

```
HOLIDAYS           — 800 entries: { date, dow, month, quarter, name, country, subRegion, region }, sorted by
  date then country. `month`/`quarter` are real names ('February'..'January', 'Q1'..'Q4') derived from the
  source's own fiscal-month labels (2027M01..2027M12 -> February..January), verified to line up with this app's
  existing FISCAL_CALENDAR month boundaries before trusting them
HOLIDAY_REGIONS    — ['AMER', 'APJ', 'EMEA'] (derived, not hand-typed)
HOLIDAY_COUNTRIES  — 53 real country names, sorted (derived, not hand-typed)
```

One source row (Spain's "All Saints' Day (in lieu)", 2027-11-02, labeled `2028Q04`/`2028M10`) fell after FY27's own
end date (Jan 29, 2027) and was excluded — this view is scoped to FY27, matching the rest of the app.

---

## Build & Deployment

### Local build
```bash
npm run build   # → dist/ folder
```
Vite sets `base: '/TSG-SPoG/'` so all asset paths include the repo name prefix.

### CI/CD (`.github/workflows/deploy.yml`)
```
Trigger: push to main OR manual workflow_dispatch
Steps:
  1. checkout
  2. setup-node@v4 (node 20, npm cache)
  3. npm ci
  4. npm run build
  5. peaceiris/actions-gh-pages@v4 → pushes dist/ to gh-pages branch
```

### GitHub Pages config (manual, one-time)
- Settings → Pages → Source: `Deploy from a branch` → Branch: `gh-pages` → `/(root)`

---

## External Dependencies at Runtime

| Resource | URL | Used by |
|---|---|---|
| World GeoJSON | `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json` | Layer3GeoMap |

---

## Known Limitations

1. All 12 filters are live and recompute real charts/cards, but the underlying per-queue tags (capacity code, business partner, sub-region, L5 manager, channel, DB/OSP) are deterministic mock assignments, not real business relationships — no API/database exists to supply the real mapping
2. ~711KB bundle (recharts + react-simple-maps) — consider dynamic imports
3. No authentication, no role-based views
4. No mobile/responsive layout optimisation (designed for 1280px+ screens)
5. No drill-down UI for `INACTIVE_QUEUE_NAMES` (146 real names as of 2026-07-02) — only the count surfaces on the Total Queues card
6. Plan Name filter only pre-selects Plan A on Layer 1/2 — Plan B and the per-visual overrides are unaffected, by design (see `design_choice.md`)
7. `LOB_QUEUES['High End Storage']`'s real active/inactive queue names now back the TSA Forecasting Total Queues card, but are treated as the whole page's queue roster rather than scoped to that one LOB — the only real per-queue name data this page has (see `design_choice.md`); revisit if real per-LOB queue lists arrive for the other 32 LOBs
8. `GLOBAL_GROUPING_LIST` (TSA Forecasting) is an inference from an older PPT note, not explicitly confirmed by the user — revisit if it turns out to be wrong
9. TSA Forecasting's Geo Map has no Region/Sub-region toggle (unlike MSG Forecasting's) since the source deck only specifies a region-level view; ASU/SR region-plan visuals (`asuRegionPlans`/`srRegionPlans`) also don't yet respond to filters, since the deck shows a fixed region view
10. CPASU Trend's region-and-time drill-down (`cpasuTrendByRegion`) is fully synthetic — no real per-region/per-quarter/per-week ASU/SR dataset exists, same mock-data convention as everything else on this page
11. The Plan Name selector on "UCR Impact on SR" (AsuSrTrendLayer Visual2) doesn't yet feed into `srBotsByFY()` — cosmetic for now, same as AsuLayer/SrLayer Visual1's Plan dropdown
12. (Superseded 2026-07-20) All 4 pages' RCA/CLCA sidebars were removed entirely — RCA/Insights now live only on each graph/card's per-visual "i" button; that button's content remains illustrative example content, not yet connected to a real RCA workflow
14. TSA Capacity's Sankey diagram (`workloadSankey()`) uses an illustrative 3-tier CQN taxonomy as flow sources since this page's filter set has no real per-queue dimension — only the 4 target LOB names are real
15. TSA Capacity's Geo Map is single-metric (SLO only, region-only) — the mockup ("Layer 5", renumbered to 04) only specifies a region-level SLO heatmap, unlike MSG Capacity's dual metric/view-toggle map
16. The landing page, Capacity Plan pages, and per-business sub-toggle (2026-07-03) weren't visually clicked through in a rendered browser by the agent — no browser-automation tool available this session; verified via clean production build + Node data smoke tests only
17. MSG Capacity's Region/Sub-region drill (Attrition, Plan over Plan Variation) scales one FY-level baseline by each key's share of in-scope queues (`shareByKey`) — not a real per-region/sub-region historical dataset
18. The 2026-07-03 MSG Capacity revision pass (filters, YTD cards, Attrition/Plan-over-Plan drill, Utilization aux detail, Geo Map sub-region toggle) was verified via an extended Node smoke test + clean build only, same browser-automation gap as item 16
19. MSG Capacity's Cases per FTE card carries no `prevPeriod`/`yoyPct` in `capacityCardData` (unlike every other card) — this is intentional, not a partial implementation, since the card is YTD-only by design
20. TSA Capacity's `subRegion` tag on `TSA_CAPACITY_LOBS` and the resulting region/sub-region drills (Attrition, Plan over Plan Variation) and Geo Map sub-region view are all illustrative — no real per-LOB sub-region mapping exists, same convention as everywhere else in this app
21. TSA Capacity's Workload Distribution Visual2 ("Average Case Time Variance") and Visual3 ("ACT Trend — Actual vs Plan") now plot the identical `actHrsByFY` metric — intentional per direct request, not a duplication bug
22. `tsaUtilByFY`'s `lens` parameter is still internally `'Region'|'Country'` (only the UI label changed to Region/Sub-region) — the scaling itself remains a small cosmetic nudge, not a real sub-region-weighted calculation, unlike the Attrition/Plan-over-Plan drills which do use real share-weighted math
