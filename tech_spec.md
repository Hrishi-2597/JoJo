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
│   │   ├── QueuePerformanceTable.jsx # ESG Forecasting only (2026-07-27) — real per-queue CQN/Region/Forecast/
│   │   │                              Actual/Accuracy%/Status table sitting just above the Geo Map, filter- and
│   │   │                              granularity-aware (wraps mockData.js's queuePerformance(filters, override,
│   │   │                              granularity)); Acc% header is clickable to toggle ascending/descending
│   │   │                              sort; no Queue-code column shown (removed 2026-07-27 follow-up); per-row
│   │   │                              purple "RCA/CLCA" pill opens a contributing-factors popup via ChartKit's
│   │   │                              shared PopupTable
│   │   ├── PlanningSidebar.jsx # Collapsible left sidebar (2026-07-27) — 46px icon rail expands to a 360px
│   │   │                         panel (Fiscal Calendar / Planning Cycle / Holiday Calendar), mounted once in
│   │   │                         App.jsx outside the page conditionals so it keeps its open/closed state across
│   │   │                         every business-page switch; hidden on the landing page itself (2026-07-29,
│   │   │                         App.jsx gates it on `view !== 'landing'`) — see design_choice.md
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
│   │   │                         RCA/CLCA framing) — see the dedicated section below for placement rules.
│   │   │                         Visual gained an optional `table` prop (2026-07-27, {title?, columns, rows}):
│   │   │                         clicking the chart's TITLE (not GraphInsightButton, which briefly took `table`
│   │   │                         the same day and was reverted to RCA/CLCA-only) opens a Modal containing the
│   │   │                         new shared PopupTable component. Title was chosen as the click target
│   │   │                         specifically because it can't collide with a chart's own bar-click-drill
│   │   │                         behavior or its Plan/toggle controls — see design_choice.md. See
│   │   │                         src/data/insightFactors.js below for what generates `table`'s content
│   │   │                         PlanSelect (2026-07-30, signature change) — was a plain single-value <select>,
│   │   │                         now a thin wrapper around MultiSelectField.jsx (`value`/`onChange` are now an
│   │   │                         ARRAY of plan names, emptyLabel="Select Plan" override) — see design_choice.md.
│   │   │                         New planSeriesColor(index) cycles metric2/trend with stepped opacity for the
│   │   │                         Nth selected plan on charts that render one extra series per plan.
│   │   │                         PlanDropdowns (2026-07-31, same signature change) — was two plain single-value
│   │   │                         <select>s, now two MultiSelectFields (planA/planB are ARRAYs, onChange(key, val)
│   │   │                         unchanged). New planVsPlanSeriesColor(index) cycles all 3 non-status hues
│   │   │                         (metric1/metric2/trend — no competing "Actual" series in a pure Plan A vs Plan
│   │   │                         B context, unlike planSeriesColor) across the combined A-then-B series list.
│   │   │                         New ComingSoonOverlay (2026-07-31) — wraps a popup's real children in a dark+blur
│   │   │                         layer with a large "Coming Soon" pill, without removing the content underneath.
│   │   │                         Visual gained an opt-in `comingSoon` prop (default false, wraps table's PopupTable
│   │   │                         when true) — set on HES Forecasting's Visual call sites only (AsuLayer/SrLayer/
│   │   │                         AsuSrTrendLayer); ESG Forecasting's local Visual duplicates (Layer1PlanOverPlan.jsx/
│   │   │                         Layer2ActualVsPlan.jsx) wrap unconditionally instead, since those files are
│   │   │                         Forecasting-only already. Every Capacity page's Visual usage is unaffected.
│   │   ├── PerformanceMatrixTable.jsx # (2026-07-29) Generic LOB × Fiscal-Quarter matrix table — 2-row header (quarter
│   │   │                                groups, colSpan 3: Actual/Plan/Adherence%), BinaryToggle + PlanSelect above it,
│   │   │                                a purple RCA/CLCA pill per row (same convention as msgCapacity/
│   │   │                                QueuePerformanceTable.jsx) opening a contributingFactors-backed PopupTable.
│   │   │                                Consumed by tsa/AsuSrPerformanceTable.jsx and tsaCapacity/
│   │   │                                WorkloadActPerformanceTable.jsx — see those pages' own entries below
│   │   ├── FilterPanel.jsx     # 12 filters in 4 icon-labeled clusters (Scope/Time/People/Geography) + applied-filter chips + GranularityToggle
│   │   ├── MetricCards.jsx     # 5 KPI cards, each opening its drill-down in Modal
│   │   ├── Layer1PlanOverPlan.jsx  # Plan vs Plan: 3 chart visuals + plan selectors
│   │   ├── Layer2ActualVsPlan.jsx  # Actual vs Plan: 3 chart visuals + stacked bar
│   │   ├── Layer3GeoMap.jsx    # World map with accuracy markers; hover a region/sub-region for a popup with
│   │   │                         its accuracy% + queues (2026-07-27 — replaced the old below-map summary table)
│   │   ├── msgCapacity/         # MSG Capacity Plan page (all new, 2026-07-03; revised same day)
│   │   │   ├── MsgCapacityPage.jsx        # Page body: filters + cards + 4 layers (RCA/CLCA sidebar removed 2026-07-20, see below)
│   │   │   ├── MsgCapacityFilterPanel.jsx # Scope/Time/People/Geography clusters + DB/OSP pill + GranularityToggle
│   │   │   ├── MsgCapacityMetricCards.jsx # 5 KPI cards (Staffing/Utilization/SL%/Cases per FTE/Attrition), Modal drill-downs
│   │   │   ├── HeadcountLayer.jsx         # Layer 01 "Headcount and SL%" — staffing summary, attrition, actual-vs-plan+SL%+defaulters
│   │   │   ├── PlanOverPlanVariationLayer.jsx # Layer 02 "Plan over Plan Variation" — region/sub-region drill + queue-variance ranking
│   │   │   ├── UtilizationLayer.jsx       # Layer 03 "Utilization and Outage Analysis" — actual-vs-target trend w/ 3-aux tooltip,
│   │   │   │                                per-queue Aux ranking (renamed "Utilization Gap Queues" 2026-07-27, was "Utilization
│   │   │   │                                Defaulter Queues"), leaves ranking
│   │   │   ├── QueuePerformanceTable.jsx  # (2026-07-27) Real per-queue Actual vs Plan headcount + variance, own independent
│   │   │   │                                Plan dropdown, varianceTier/varianceReason treatment (same as this page's other
│   │   │   │                                ranked-queue charts), sits above the Geo Map — wraps msgCapacityData.js's
│   │   │   │                                queueHeadcountPerformance()
│   │   │   ├── MsgCapacityGeoMap.jsx      # Layer 04 — dual toggle (Headcount/SL% metric × Region/Sub-region view); below-map
│   │   │   │                                summary table removed 2026-07-27, existing hover tooltip is the only detail surface now
│   │   └── tsaCapacity/         # TSA Capacity Plan page (all new, 2026-07-03; revised same day)
│   │       ├── TsaCapacityPage.jsx           # Page body: filters (reuses tsa/TsaFilterPanel.jsx directly) + cards + 4 layers (RCA/CLCA sidebar removed 2026-07-20)
│   │       ├── TsaCapacityMetricCards.jsx    # 5 KPI cards (Staffing Summary/Attrition/Cases per FTE/Avg Case Time/SLO %)
│   │       ├── HeadcountAttritionLayer.jsx   # Layer 01 "Headcount and Attrition" (renamed 2026-07-28, was "...and Utilization") — staffing + region/sub-region attrition drill (Utilization Variance visual removed 2026-07-28)
│   │       ├── PlanOverPlanVariationLayer.jsx # Layer 02 "Plan over Plan Variation" — region/sub-region drill + LOB-variance ranking
│   │       ├── WorkloadDistributionLayer.jsx # Layer 03 "Workload Distribution" — Sankey (LOB/CQN toggle), Workload Impact on Headcount (2026-07-28, replaced Average Case Time Variance)
│   │       ├── WorkloadActPerformanceTable.jsx # (2026-07-29) No badge, sits above the Geo Map — toggle Workload/ACT retitles
│   │       │                                     "Workload Performance"/"ACT Performance"; wraps PerformanceMatrixTable.jsx +
│   │       │                                     tsaCapacityData.js's workloadActPerformanceByLob()
│   │       ├── TsaCapacityGeoMap.jsx         # Layer 04 (mockup labels it "Layer 5", renumbered — see design_choice.md) — colors by Headcount Adherence % vs the selected Plan Name (2026-07-29, was raw headcount relative-to-peak 2026-07-23, was SLO before that), Region/Sub-region toggle; per-LOB Actual/Planned headcount + variance hover popup
│   │   └── tsa/                # TSA Forecasting page (all new, 2026-07-02; named "capacity/" until the same-day rename)
│   │       ├── TsaForecastingPage.jsx  # Page body: filters + cards + 4 layers (RCA/CLCA sidebar removed 2026-07-20)
│   │       ├── TsaFilterPanel.jsx      # 7 filters: LOB / FY-Qtr-Month-Week / Business Partner-Global Grouping + GranularityToggle;
│   │       │                            reused directly (unmodified) by tsaCapacity/TsaCapacityPage.jsx — identical field set
│   │       ├── TsaChartKit.jsx         # Re-export shim: `export { Modal } from '../Modal'; export * from '../ChartKit'`
│   │       │                            (was the canonical implementation until ChartKit.jsx was promoted, 2026-07-03)
│   │       ├── TsaMetricCards.jsx      # 5 KPI cards, each opening its drill-down in Modal (Total Queues/ASU/SR/CPASU/UCR)
│   │       ├── AsuLayer.jsx            # Layer 01 "ASU Trend" — Actuals vs Plan, Plan vs Plan, Plan Impact (region→LOB drill)
│   │       ├── SrLayer.jsx             # Layer 02 "SR Trend" — same structure as AsuLayer, SR metric
│   │       ├── AsuSrTrendLayer.jsx     # Layer 03 "CPASU/UCR Trend" (renamed 2026-07-31, was "ASU/UCR Impact on SR Analysis") — CPASU Trend, UCR Impact on SR, UCR Runrate+top-5-LOB modal
│   │       ├── AsuSrPerformanceTable.jsx # (2026-07-29) No badge, sits above the Geo Map — toggle ASU/SR retitles "ASU
│   │       │                               Performance"/"SR Performance"; wraps PerformanceMatrixTable.jsx + tsaData.js's
│   │       │                               asuSrPerformanceByLob()
│   │       └── TsaGeoMap.jsx           # Layer 04 — colors by real ASU/SR Adherence % vs the selected Plan Name (2026-07-29,
│   │                                     was a filters-only synthetic adherence unrelated to either metric); ASU/SR
│   │                                     BinaryToggle + Plan Name dropdown + per-LOB Actual/Plan/Adherence% hover popup
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
├── AsuSrTrendLayer(filters) — "CPASU/UCR Trend" (renamed 2026-07-31, was "ASU/UCR Impact on SR Analysis"), collapsible, badge "03"
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
├── HeadcountAttritionLayer(filters, granularity) — renamed "Headcount and Attrition" (2026-07-28, was "...and
│   │                                                Utilization" — see below), badge "01"
│   ├── Visual1 "Actual vs Plan Variation" (renamed) — ComposedChart: fteByFY(filters, granularity, planName); line
│   │                                                   renamed "Variation %"; Plan dropdown added 2026-07-23 for parity
│   │                                                   with MSG Capacity's equivalent chart
│   └── Visual2 "Attrition"          — Region/Sub-region-level default (tsaAttritionByDimension), click a bar to drill
│                                       into tsaAttritionTrendByDimension(filters, key, dimension, granularity);
│                                       custom tooltip also shows the raw attritionCount
│   (Visual3 "Utilization Variance" removed entirely 2026-07-28, per direct request, to give Visual1/Visual2 more
│    room — layer is now exactly 2 visuals, filling the row via each Visual's own flex-1, no layout change needed;
│    tsaUtilByFY/TSA_UTIL_BY_FY removed from tsaCapacityData.js as dead code, this was their only consumer)
├── PlanOverPlanVariationLayer(filters, granularity) — TSA-specific (no longer the shared component), badge "02"
│   ├── MainChart "Plan over Plan Variation" — Region/Sub-region default view (tsaPlanOverPlanByDimension), click a bar
│   │                                          to drill into tsaPlanOverPlanTrendByDimension; shared Plan A/Plan B
│   │                                          PlanDropdowns (2026-07-23, replacing the old fixed "Plan A"/"Plan B"
│   │                                          series) live here, driving both this chart and LobVarianceChart below
│   └── LobVarianceChart "LOBs with Highest Variation" — diverging horizontal bars: planOverPlanLobVariance(filters,
│                                                         planA, planB), worst |variance| first, value-labeled
├── WorkloadDistributionLayer(filters) — badge "03" (dropped its unused `granularity` prop 2026-07-28 — see below)
│   ├── Visual1 "Workload Distribution" (renamed) — recharts Sankey: workloadSankey(filters, mode), LOB/CQN BinaryToggle
│   │                                                (LOB mode: CQN tiers→real LOBs; CQN mode: LOB tiers→real TSA queues);
│   │                                                node hover (2026-07-20) shows every connected node on the other side
│   │                                                with value + % of the hovered node's own total (nodeHoverSummary(),
│   │                                                fixed top-right panel) — separate from the existing link-hover Tooltip,
│   │                                                which still shows one single flow at a time
│   └── Visual2 "Workload Impact on Headcount" (2026-07-28, replaces "Average Case Time Variance") — ComposedChart:
│                                                workloadImpactOnHeadcount(filters), X-axis = CQN (real queue names,
│                                                same roster the Sankey's CQN mode draws from); SR bar (metric1) +
│                                                Workload Actual/Plan line pair (metric2, solid/dashed) on the primary
│                                                axis, Headcount line (trend) on the secondary axis; narrows to the
│                                                selected LOB's real CQNs via cqnsForFilters()/filterLobs; click-title
│                                                table shows the full in-scope CQN roster (cap=999)
│   (Visual3 "ACT Trend — Actual vs Plan" removed entirely 2026-07-23; "Average Case Time Variance" removed 2026-07-28 —
│    layer is still exactly 2 visuals, filling the row via each Visual's own flex-1, no layout change needed)
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

**Filter value shape:** every filter except `dbOsp` is multi-select — its value is an array (`[]` = no selection = matches everything). `dbOsp` alone stays a plain string (`'DB'|'OSP'|'All'`) since it's a 3-way segmented pill (`FilterPanel.jsx`), not a searchable dropdown (`MultiSelectField.jsx`). `matchesMulti(selected, value)` in `mockData.js` is the shared "is this row in scope" check for array-valued filters. `MultiSelectField.jsx` gained an `emptyLabel` prop (2026-07-30, default `'All'`, every existing filter-panel caller unaffected) — `ChartKit.jsx`'s `PlanSelect` now wraps this same component with `emptyLabel="Select Plan"` instead of maintaining a separate single-value `<select>`.

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
geoRegionData(filters) / geoSubRegionRows(filters) — {region/label, accuracy} rows backing the map's own
  coloring and the hover popup (2026-07-27 — the old below-map summary table these once fed was removed)
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
asuByFY(filters, granularity, planName) / srByFY(filters, granularity, planName) — narrowed to
  tsaEffectiveFiscalYears, scaled by lobScopeRatio. `planName` (2026-07-30) closes a formerly-documented
  cosmetic gap — AsuLayer/SrLayer Visual1's own Plan Name dropdown used to change state without ever
  feeding into this selector; now rescales `plan` via planPerformanceScale (reused from
  asuSrPerformanceByLob). Omitting planName keeps every other caller's output unchanged.
srBotsByFY(filters, granularity, planName) — {period, humanSR, botsSR, plan} — same 2026-07-30 fix,
  threads planName straight through to srByFY
asuPlanVsPlanByFY(filters) / srPlanVsPlanByFY(filters) — same narrowing + scaling
cpasuByFY(filters) — cpasu = sr.actual / asu.actual per period, rounded to 2 decimals (backs the CPASU card + drill-down)
planPerformanceScale(planName) (2026-07-29, private) — deterministic scale factor for a named Plan, hashed from
  the plan name string (~0.88x-1.12x) — backs asuSrPerformanceByLob's Plan Name dropdown, which genuinely
  rescales the Plan column (unlike AsuLayer/SrLayer Visual1's own cosmetic Plan Name dropdown — see Known
  Limitations, and design_choice.md for why this new table deliberately doesn't repeat that gap)
asuSrPerformanceByLob(filters, metric='ASU'|'SR', planName) (2026-07-29) — {lob, quarters: [{period, actual, plan,
  adherence}]} × every in-scope LOB (LOB_LIST via filterLobs, NOT the product names shown in this feature's
  reference screenshots — see design_choice.md). Each LOB's quarterly numbers are a deterministic SHARE of
  asuByFY/srByFY's own quarter-level total (weight total computed over whichever LOBs are actually in scope, so
  narrowing by filter still sums back correctly) — backs the "ASU Performance"/"SR Performance" table above the
  Geo Map (tsa/AsuSrPerformanceTable.jsx, wraps the shared PerformanceMatrixTable.jsx)
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
srDbOspByFY(filters, granularity) — {period, db, osp} — backs the Service Requests card's drill-down
  (grouped columns, not stacked) AND its card-face YTD bifurcation (2026-07-30). DB's share of `actual`
  now VARIES per period (~62-74%, was a fixed 70%) — a fixed ratio of the same total makes DB's/OSP's own
  YoY% identical to the combined %, verified to give a real, independent DB vs OSP YTD split instead
  (see design_choice.md); db+osp still sums to the exact same `actual` each period
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
REGION_ADHERENCE_BASE (2026-07-28) — { NAMER: 94, APJ: 86, EMEA: 75, LATAM: 63, Global: 80 }, a deliberately-spread
  per-region baseline mirroring ESG Forecasting's own curated GEO_REGION_DATA table
lobAdherenceValue(region, lobIndex) = clamp(50, 99, REGION_ADHERENCE_BASE[region] + ((lobIndex*11) % 30) - 15) —
  ±15 illustrative spread around the region's own base, so a LOB filter still moves the number
LOB_REGION_ASSIGNMENTS (2026-07-29, private) — each of the 33 real LOB_LIST entries assigned to one of
  the 4 real map regions (NAMER/LATAM/APJ/EMEA) round-robin by index — no real LOB-to-region mapping
  exists, same "real names, illustrative structure" placeholder convention as CQN_LOB_ASSIGNMENTS
  (tsaCapacityData.js); verified to partition all 33 LOBs with no overlap/gap
geoLobPerformanceByRegion(region, filters, metric='ASU'|'SR', planName) (2026-07-29) — {lob, actual, plan,
  adherence} × that region's LOBs, reusing asuSrPerformanceByLob directly (same selector the ASU/SR
  Performance table uses) and collapsed to the LATEST in-scope quarter — backs TsaGeoMap's per-LOB
  hover popup (a snapshot, not the table's full per-quarter history)
geoAdherenceWobble(lob) (2026-07-29, private) — deterministic ~0.6x-1.4x per-LOB multiplier, MAP-COLOR
  ONLY (does not touch geoLobPerformanceByRegion's own reconciling actual/plan numbers, which the hover
  popup shows verbatim) — needed because geoLobPerformanceByRegion's own actual/plan share cancels out
  in the ratio (every LOB gets the identical weight for both), which would otherwise color every region
  nearly the same; see design_choice.md
geoAdherenceByRegion(filters, metric='ASU'|'SR', planName) (2026-07-29, signature changed — was
  filters-only) — aggregates geoLobPerformanceByRegion's per-LOB actual/plan (weighted by
  geoAdherenceWobble) into one adherence % per region, for each of the 4 real map regions; consumed by
  TsaGeoMap's choropleth fill AND its hover headline — now genuinely reacts to the map's own metric
  toggle and Plan Name dropdown, replacing the previous filters-only synthetic-adherence version (see
  design_choice.md for both the 2026-07-28 spread fix and the 2026-07-29 plan-reactivity rework)
```

### Cards
```
tsaCardData(filters, granularity) → { totalQueues, asuActuals, srActuals, cpasu, currentUcr }, each the
  latest-period snapshot (asu[asu.length-1] etc., where asu = asuByFY(filters, granularity)) off the
  selector functions above, except totalQueues ({ active, inactive } = TSA_ACTIVE_QUEUE_NAMES.length/
  TSA_INACTIVE_QUEUE_NAMES.length — `inactive` still computed, only the CARD FACE stopped displaying it
  2026-07-30, see design_choice.md), which ignores filters entirely. asuActuals/srActuals/cpasu
  additionally carry { period, prevPeriod, yoyPct } — yoyPct is the % change vs the prior in-scope
  period AT WHATEVER GRANULARITY THE PAGE IS SET TO (2026-07-20 fix — previously always ignored
  granularity and compared FY-over-FY regardless of the toggle), null if there isn't a prior period,
  backing each card's "YTD <period>: ... vs <prevPeriod>" sub-message. srActuals additionally carries
  { db: {value, yoyPct}, osp: {value, yoyPct} } (2026-07-30) — per-channel YTD bifurcation from
  srDbOspByFY, backing the Service Requests card's own "DB ▲x% · OSP ▲y%" sub-line instead of one
  combined %.
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
hcStaffingByFY(filters, granularity, planSelection) — {period, actual, plan, adherence} — HeadcountLayer Visual1
  ("Actual vs Plan Variation") + FTE/Staffing card modal. planSelection (2026-07-30) closes a formerly-
  cosmetic gap (the dropdown changed state without affecting the chart) — reuses planMultiplier, the
  same mechanism slTrendByFY/slDefaulterQueues already use on this page
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
                                              ascending (worst SL first) — replaces the old actual>plan-only defaulterQueues.
                                              As of 2026-07-27, this list backs "Headcount Impact on SL"'s click-the-title
                                              detail table (full roster, count=999) rather than rendering permanently under
                                              the chart — see design_choice.md
queueHeadcountPerformance(filters, planSelection='Actual') — {name, region, actualHC, planHC, variance} for every in-scope
  queue, sorted by |variance| descending — backs the new QueuePerformanceTable.jsx (2026-07-27); planHC rescaled via
  planMultiplier() same as every other independent Plan dropdown on this page
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
(Removed 2026-07-28: tsaUtilByFY/TSA_UTIL_BY_FY — backed HeadcountAttritionLayer's "Utilization Variance" Visual3,
  removed entirely per direct request to give the remaining 2 visuals more room; this was its only consumer)
cpfByFY(filters, granularity)             — {period, actual, plan} — Cases per FTE card (rate-preserving expansion, unchanged)
actHrsByFY(filters, granularity)          — {period, actual, plan, adherence} — Avg Case Time card + Workload
  Distribution Visual2/Visual3; adherence = plan/actual*100 (a "lower is better" metric, so adherence >=100 means
  actual is at or under plan); rate-preserving expansion (avg case time is hours-per-case, not a summable volume)
(Removed 2026-07-28: actHrsDefaulterLobs — its only consumers were Workload Distribution Visual2's defaulter list and
  click-table, both removed when Visual2 was repointed at Workload Impact on Headcount; see design_choice.md.)
geoHeadcountEmphasis(key) (2026-07-28, private) — deterministic 0.25-1.6 multiplier, salted hash of `key`; layered
  onto the 2 selectors below ONLY (verified via grep to be their only consumer — Attrition/Plan-over-Plan call
  tsaAttritionByDimension directly, unaffected) to counter the round-robin LOB→region/sub-region tagging's
  near-identical headcount share per key, which previously left the map showing almost every region the same 1-2
  colors; see design_choice.md
geoHeadcountByRegion(filters, planName) / geoHeadcountBySubRegion(filters, planName) (signature changed
  2026-07-29, was filters-only) — {region/subRegion, headcount, adherence} — `headcount` reshapes
  tsaAttritionByDimension's own split (2026-07-23, replacing the removed SLO% selectors below — see
  design_choice.md), scaled by geoHeadcountEmphasis(key) (2026-07-28); `adherence` (new 2026-07-29) is a
  genuine Headcount-Actual-vs-selected-Plan percentage via regionHeadcountAdherence (below) — THIS field
  now drives TsaCapacityGeoMap's choropleth fill AND hover headline, using the SAME fixed 90/80/70
  thresholds every other Geo Map uses (no longer relative-to-peak — see design_choice.md for why the
  metric switch made that the correct call, not just a cosmetic tweak). `headcount` is kept as the hover
  popup's secondary reference number.
  (Removed 2026-07-23: geoSloByRegion/TSA_GEO_SLO_BY_REGION, geoSloBySubRegion/TSA_GEO_SLO_BY_SUBREGION, sloByFY,
  SLO_BY_FY — the SLO % card and its Geo Map coloring were both replaced; see design_choice.md.)
geoLobHeadcountByRegion(region, filters, planName) / geoLobHeadcountBySubRegion(subRegion, filters, planName)
  (2026-07-29) — {lob, actual, plan, variance} × that key's LOBs — backs TsaCapacityGeoMap's per-LOB hover
  popup (Actual vs Planned headcount + variance), separate from geoHeadcountByRegion/BySubRegion above
  (which drive the map's own choropleth coloring). Each LOB's share is computed from the Staffing Summary
  card's own FTE_BY_FY total, weight total computed over ALL in-scope LOBs (not just this key's) so shares
  are genuine fractions of the real grand total — verified to sum to exactly FTE_BY_FY's FY27 actual (480)
  across all 5 regions combined. planName reuses this page's own real PLAN_SCALE_BY_NAME.
geoHeadcountAdherenceWobble(lob) / regionHeadcountAdherence(key, dimension, filters, planName)
  (2026-07-29, private) — MAP-COLOR ONLY: geoLobHeadcountByRegion/BySubRegion's own actual/plan share
  cancels out in the ratio (every LOB gets the identical weight for both, by design, so totals reconcile
  to the real FTE_BY_FY total), which would otherwise color every region/sub-region nearly the same.
  geoHeadcountAdherenceWobble adds a deterministic ~0.6x-1.4x per-LOB spread scoped to this aggregation
  only — it does not touch geoLobHeadcountByRegion/BySubRegion's own reconciling numbers, which the hover
  popup's per-LOB list still shows verbatim; see design_choice.md
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
workloadActFyRows(baseActual, basePlan) (2026-07-29, private) — turns one LOB's flat workloadPlan/workloadActual or
  actHrsPlan/actHrsActual baseline into a 3-FY series (a modest deterministic YoY step), so it can run through the
  same mockData.js expand-to-quarter helpers every other time-series selector on this app already uses
workloadActPerformanceByLob(filters, metric='Workload'|'ACT', planName) (2026-07-29) — {lob, quarters: [{period,
  actual, plan, adherence}]} × every in-scope LOB (filterCapacityLobs). Workload uses the additive expansion (a
  volume, like ASU/SR); ACT uses the rate-preserving one (hours-per-case, same treatment actHrsByFY already gives
  it). No page-level FY total exists to share-weight from here (unlike asuSrPerformanceByLob on tsaData.js), so
  each LOB's own already-established number is expanded directly instead — see design_choice.md. planName reuses
  this page's own real PLAN_SCALE_BY_NAME. Backs the "Workload Performance"/"ACT Performance" table above the Geo
  Map (tsaCapacity/WorkloadActPerformanceTable.jsx, wraps the shared PerformanceMatrixTable.jsx)
CQN_LOB_ASSIGNMENTS (2026-07-28, private)  — TSA_ACTIVE_QUEUE_NAMES (tsaData.js, 71 real queues, the same roster
  workloadSankey's CQN mode draws from) each assigned to a LOB_LIST entry round-robin by index — no real queue-to-LOB
  mapping has been supplied, so this is the "real names, illustrative structure" placeholder (same convention
  LOB_FACTS uses for businessPartner/globalGrouping) until a real mapping arrives
cqnsForFilters(filters) (private)         — CQN_LOB_ASSIGNMENTS narrowed to filterLobs(filters)'s in-scope LOB names
  (falls back to the full 71-queue set if a filter combination leaves nothing in scope)
workloadImpactOnHeadcount(filters, cap=8) — {cqn, lob, sr, workloadActual, workloadPlan, headcount} × up to `cap` CQNs
  in scope — Workload Distribution Visual2 ("Workload Impact on Headcount", 2026-07-28, replacing "Average Case Time
  Variance"). SR scaled off tsaData.js's own SR_BY_FY plan (same magnitude as the SR chart on TSA Forecasting) ÷
  TSA_ACTIVE_QUEUE_NAMES.length; Workload Actual/Plan and Headcount are each a deterministic per-queue sub-share of
  their assigned LOB's own TSA_CAPACITY_LOBS fields (workloadPlan/workloadActual, popPlan1) — not invented numbers.
  Selecting a LOB filter narrows to that LOB's 2-3 real CQNs directly (via cqnsForFilters); unfiltered, the cap keeps
  the chart to 8 bars. The click-title table calls this with cap=999 for the full in-scope roster.
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

## Data Model (`src/data/insightFactors.js`) — Detail-Table Popup Content (2026-07-27)

Shared across all 4 pages — backs every graph's optional `table` popup content (see ChartKit.jsx's `GraphInsightButton`/`PopupTable` above).

```
contributingFactors(seed, region, count=2)  — [{factor, detail}]. `region` (one of NAMER|LATAM|APJ|EMEA) adds
  one REAL holiday row (cross-referenced from src/data/holidayCalendarData.js's real FY27 data); `Global` or
  a non-region seed skips that row. Remaining rows are deterministic illustrative factors (BP review delay,
  capacity ramp, seasonal shift, etc.) — NOT cross-referenced against real dates for period-based seeds, since
  this app's FY25/FY26/FY27 chart periods are an independent illustrative label system, not the one real FY27
  calendar the Holiday Calendar/Fiscal Calendar sidebar sections use.
FACTOR_TABLE_COLUMNS                        — {factor, detail} column spec for the above
varianceTier(absVariance) / varianceReason(seed) — {key,label} High/Moderate/Low tier (thresholds calibrated
  to this app's real ~0-8% per-queue plan-variance range) + a deterministic illustrative reason string, for
  every "Top Queues/LOBs by Variance"-style ranked chart's full-roster detail table
VARIANCE_TABLE_COLUMNS                      — {name, tier, variance, reason} column spec (pages with LOB-
  shaped, not queue-shaped, data define their own local column-label override — see e.g. AsuSrTrendLayer.jsx's
  LOB_VARIANCE_TABLE_COLUMNS — rather than this export's hardcoded "Queue" label)
bucketQueues(rows, bucketShares, bucketKey) / allBucketsQueues(rows, bucketShares) — deterministically assigns
  in-scope rows to distribution buckets IN THE SAME PROPORTIONS a stacked bucket chart already shows (its
  illustrative bucket % is a hand-curated aggregate independent of any single row's real variance), with a
  synthesized-but-stable value inside that bucket's own range — so a bucket-composition popup stays internally
  consistent with the chart above it instead of contradicting it
BUCKET_TABLE_COLUMNS                        — {bucket, name, region, variance} column spec
```

`mockData.js`'s `queuePerformance(filters, override, granularity)` — real per-queue {code, name, region,
forecast, actual, accuracy, status}, `code` a stable `Q-NNN` id (index in `ACTIVE_QUEUES`, unaffected by
filtering, no longer displayed in either table as of the 2026-07-27 follow-up — kept only as a React key),
`status` Good (≥90%) / Fair (≥75%) / Poor (<75%), sorted worst-accuracy-first. `override` is `{region}` or
`{subRegion}` for the Geo Map's hover-through (queue-level data has no clean sub-region-only selector
otherwise). `granularity` (2026-07-27 follow-up, optional/additive) re-derives forecast/actual per Quarter/
Month/Week via the same `expandToGranularity` wobble every other volume metric uses — accuracy/status stay
constant across granularity by construction (both sides of the ratio share the same wobble; see
design_choice.md). Backs both `QueuePerformanceTable.jsx` and `Layer3GeoMap.jsx`'s hover-region popup.

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
7. `LOB_QUEUES['High End Storage']`'s real active/inactive queue names now back the TSA Forecasting Total Queues card, but are treated as the whole page's queue roster rather than scoped to that one LOB — the only real per-queue name data this page has (see `design_choice.md`); revisit if real per-LOB queue lists arrive for the other 32 LOBs. Same caveat applies to TSA Capacity's `CQN_LOB_ASSIGNMENTS` (2026-07-28) — its queue→LOB pairing is a round-robin placeholder, not a real mapping; replace it once a real one is supplied
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
21. ~~TSA Capacity's Workload Distribution Visual2 ("Average Case Time Variance") and Visual3 ("ACT Trend — Actual vs Plan") now plot the identical `actHrsByFY` metric — intentional per direct request, not a duplication bug~~ — stale: Visual3 was removed entirely 2026-07-23, and Visual2 itself was replaced by "Workload Impact on Headcount" 2026-07-28 (no longer plots `actHrsByFY` at all); left struck through rather than renumbered, per this doc's own convention elsewhere
22. ~~`tsaUtilByFY`'s `lens` parameter is still internally `'Region'|'Country'` (only the UI label changed to Region/Sub-region) — the scaling itself remains a small cosmetic nudge, not a real sub-region-weighted calculation, unlike the Attrition/Plan-over-Plan drills which do use real share-weighted math~~ — moot: `tsaUtilByFY` and the "Utilization Variance" visual it backed were removed entirely 2026-07-28
23. All 4 Geo Maps' `<ComposableMap projectionConfig>` is `{ scale: 100, center: [10, 0] }` (2026-07-28, was `{ scale: 140, center: [10, 20] }` — the old values clipped everything north of ~80°N off the top of the fixed 800×600 viewBox; see `design_choice.md`). Keep these 4 in sync if either ever changes — there's no shared Geo Map component, each page's map duplicates this config independently
24. HES Capacity's Geo Map headcount (via `geoHeadcountEmphasis()`, 2026-07-28) is now deliberately scaled DIFFERENTLY from the plain headcount `tsaAttritionByDimension` returns for the same region/sub-region key — intentional, and safe, since nothing else in the app displays that same "headcount by region" value for a side-by-side comparison (grep-confirmed); don't reuse `geoHeadcountByRegion`/`geoHeadcountBySubRegion`'s output for anything other than this one map without accounting for the emphasis multiplier
25. Every "Plan Name" dropdown is multi-select (2026-07-30), but only period-trend Bar+Line charts actually render one series per selected plan — ranked-by-queue/LOB charts (`UtilizationLayer` Visual2/3, both `QueuePerformanceTable`s, `Layer2ActualVsPlan` Visual3), both Performance matrix tables, and both Geo Maps all use only `selectedPlans[0]` for calculation regardless of how many plans are checked; see design_choice.md for why full N-way support wasn't built for these chart shapes
26. Same as #25 but for every "Plan A / Plan B" `PlanDropdowns` (2026-07-31): full N-series rendering only on the charts whose entire purpose IS the Plan A/B comparison (`AsuLayer`/`SrLayer` Visual2, `Layer1PlanOverPlan` Visual1, both Capacity pages' `PlanOverPlanVariationLayer` `MainChart`s) — the region/impact/ranked-variance charts sharing those same widgets (`AsuLayer`/`SrLayer` Visual3, `Layer1PlanOverPlan` Visual2/3, `LobVarianceChart`, `QueueVarianceChart`) use only `plansA[0]`/`plansB[0]` regardless of how many plans are checked on either side, same rationale as #25
27. The `ComingSoonOverlay` (2026-07-31) only covers ESG/HES Forecasting's graph pop-ups (the `table`-prop Modal+PopupTable mechanic, plus `AsuSrTrendLayer`'s separate bar-click "Top 5 Non-Adherent LOBs" modal) — it deliberately does NOT cover the smaller per-row "RCA/CLCA" pill popups (`PerformanceMatrixTable.jsx`, both `QueuePerformanceTable.jsx` files), since those are a different, pre-existing interaction (not "click the graph's title") and are shared with Capacity pages, which were out of scope for this request
