# Prompt Trail — TSG SPoG Project

Chronological log of every user prompt and the corresponding actions taken.

---

## Prompt 1 — 2026-06-30
**Input:** `/model` (set model to Sonnet 4.6 1M context)
**Action:** Model set, no code changes.

---

## Prompt 2 — 2026-06-30
**Input:** `so can you read the ppt in @SPOG_views.pptx and understand it?`

**Action:**
- Located `SPOG_views.pptx` via Glob
- Extracted text from all 16 slides by unzipping the PPTX (ZIP format) and regex-parsing `<a:t>` XML tags via PowerShell
- Parsed and summarized 3 dashboard domains:
  1. Call Center / WFM Analytics (slides 1–9)
  2. Forecast Trend Dashboard (slides 10–13)
  3. Shipment Trend Dashboard (slides 14–16)
- Documented key terminology: CQN, DB/OSP, ASU, SR, UCR, SLO, LOB, FTE, CPASU, AOP

---

## Prompt 3 — 2026-06-30
**Input:** `This is SPoG for TSG Business and particular for Enterprise Service Group(MSG) Forecasting Page and we want to built an interactive UI and also check for GIT credentials.` *(with git init commands and 2 screenshot images)*

**Images provided:** Screenshots of the MSG Forecasting design spec showing filter panel layout, 5 KPI cards, Layer 1 (Plan over Plan) and Layer 2 (Actual vs Plan) graph layouts.

**Action:**
- Checked git credentials: user=`Hrishi-2597`, email=`hrishikesh.yadav@alignedautomation.com`
- Confirmed Node v24 / npm v11 available
- Scaffolded full React + Vite project manually (no create-vite, all files written directly)
- Created project structure:
  ```
  src/
    components/FilterPanel.jsx
    components/MetricCards.jsx
    components/Layer1PlanOverPlan.jsx
    components/Layer2ActualVsPlan.jsx
    components/Layer3GeoMap.jsx
    data/mockData.js
    App.jsx  main.jsx  index.css
  package.json  vite.config.js  tailwind.config.js
  postcss.config.js  index.html  .gitignore
  ```
- Installed dependencies via `npm install`
- Built successfully (`vite build` → 682KB bundle, no errors)
- `git init`, created README.md, committed, set remote to `https://github.com/Hrishi-2597/TSG-SPoG.git`
- Pushed to GitHub (`main` branch)

---

## Prompt 4 — 2026-06-30
**Input:** `when everything is built push to github pages and setup everything deploy it and give the hosted link in the chat`

**Action:**
- Set `vite.config.js` base to `/TSG-SPoG/` for correct asset paths
- Added `predeploy` / `deploy` scripts to `package.json`
- Created `.github/workflows/deploy.yml` using `actions/configure-pages@v4` + `actions/deploy-pages@v4`
- Fixed `Layer3GeoMap.jsx`: removed `ZoomableGroup` (removed in react-simple-maps v3)
- Pushed to GitHub → Actions workflow triggered and completed with `success`
- Verified HTTP 200 at `https://hrishi-2597.github.io/TSG-SPoG/`
- **Issue discovered:** site served raw source `index.html` (with `src="/src/main.jsx"`) — GitHub Pages was still set to "Deploy from branch: main", not GitHub Actions

---

## Prompt 5 — 2026-06-30
**Input:** `The link is not loading on website`

**Action:**
- Diagnosed: `https://hrishi-2597.github.io/TSG-SPoG/` returned raw source `<script src="/src/main.jsx">` instead of compiled assets
- Root cause: GitHub Pages was configured to serve from `main` branch (raw files), not the Actions artifact
- Fix: updated workflow to use `peaceiris/actions-gh-pages@v4` which pushes `dist/` to `gh-pages` branch
- Verified `gh-pages` branch was created with correct built `index.html` (`src="/TSG-SPoG/assets/index-KRutg-Ok.js"`)
- Pages workflow completed with `success`
- Remaining step for user: go to Settings → Pages → Source → `gh-pages` branch

---

## Prompt 6 — 2026-06-30
**Input:** `create a handoff.md, create prompt_trail.md create tech_spec.md, create design_choice.md and keep it updated as each prompt is given keep on updating`

**Action:**
- Created this file (`prompt_trail.md`) and three companion docs
- All 4 files placed in project root (`C:\...\Desktop\SPoG\`)
- Committed to git and pushed

---

---

## Prompt 7 — 2026-06-30
**Input:** `I HAVE added the UI skill and use that to improve the overall UI.`

**Action:**
- Invoked `frontend-design` skill with full dashboard context
- Read all 8 source files (index.css, tailwind.config.js, App.jsx, FilterPanel.jsx, MetricCards.jsx, Layer1, Layer2, Layer3)
- Designed a premium enterprise analytics overhaul. Key decisions:
  - Font: **Space Grotesk** (Google Fonts) — geometric, tabular numerals, technical character
  - Palette: Deeper base `#070f1a`, translucent borders (`rgba(255,255,255,0.07)`), cooler accent `#38bdf8`
  - Signature: **Luminous top-edge card glow** — CSS `::before` gradient line on KPI cards that fans out and glows on hover/active
  - Filter dropdowns: replaced jarring white `bg-white` selects with `.select-dark` (dark bg, accent focus ring)
  - DrillToggle: pill-shaped rounded control replacing rectangular box
  - Layer headers: left `2px` accent border + gradient background + numbered badges `01/02/03`
  - Chart panels: `.chart-panel` inset dark container (`#0a1522`) replacing flat `bg-navy-800`
  - Tooltips: backdrop-blur with accent border
  - Recharts: removed axis lines/tick lines, reduced grid opacity, set `maxBarSize`, `activeDot`
  - Geo map: inner glow on container, `drop-shadow` filter on accuracy markers, glow-dot legend
  - Active filter count badge in filter panel
- Built successfully (687KB, no errors)
- Committed and pushed → GitHub Actions deploying to gh-pages

**Also noted:** User asked to push after every update — will do going forward.

<!-- NEW PROMPTS APPENDED BELOW THIS LINE -->

## Prompt 8 — 2026-07-02
**Input:** `add this repository https://github.com/Hrishi-2597/TSG-SPoG.git and follow the important documents`

**Action:**
- Cloned the repo fresh to `C:\Users\hrishikesh.yadav\TSG-SPoG` (new machine/session, no prior local checkout)
- Read `README.md`, `handoff.md`, `tech_spec.md`, `design_choice.md`, `prompt_trail.md` in full
- Confirmed git remote/branches (`main`, `gh-pages`) and toolchain (Node v24, npm v11)
- Saved the "update these 4 docs + push after every change" convention to persistent memory so it's followed automatically in future sessions on this machine

---

## Prompt 9 — 2026-07-02
**Input:** Large multi-part request for the TSA Forecasting page: (1) card drill-downs → popup modals that preserve filters on close; (2) rename ASU/SR Actuals cards, add YTD messages with increase/decrease, change SR popup to a column chart, change CPASU popup to a CPASU-only line chart; (3) rename ASU Layer/SR Layer → ASU Trend/SR Trend and their 3 visuals ("Actuals vs Plan Comparison" with a "Plan Name" dropdown, "Plan vs Plan Comparison", "Plan Impact" with 4 regions AMER/APJ/EMEA/Global); (4) rename "ASU Impact on SR Trend" → "ASU/UCR Impact on SR Analysis", redesign its CPASU Trend visual to show regions by default and drill into a clicked region's trend at the top filter bar's time granularity, rename SR(Human)/SR(Bots) series and add a corner Plan selector on "UCR Impact on SR", and change "UCR Runrate with Target" to a fixed-FY chart with a year-click modal listing the top 5 non-adherent LOBs

**Action:**
- `TsaChartKit.jsx`: added a shared `Modal` popup component, a `cornerControls` slot on `Visual`, and a `PillButton` helper
- `tsaData.js`: added `yoyPct` to `tsaCardData()`'s ASU/SR/CPASU metrics; changed `IMPACT_REGIONS` to `['AMER','APJ','EMEA','Global']`; added `cpasuByRegion`/`regionTrendGranularity`/`cpasuTrendByRegion` for the CPASU Trend redesign; added `topNonAdherentLobsByYear`; removed the now-dead `ucrNonAdherentQueues` (queue-level) and its fallback constant, along with the unused `asuSrTrendByFY`/`asuSrTrendCountries` Region/Country-toggle functions
- `TsaMetricCards.jsx`: card drill-downs now open in the new `Modal`; renamed "ASU Actuals"→"Active Service Units" and "SR Actuals"→"Service Requests"; all three of ASU/SR/CPASU show a YTD year-over-year message instead of "Plan X"; SR's DB/OSP popup changed to grouped columns; CPASU's popup changed to a CPASU-only line chart
- `AsuLayer.jsx` / `SrLayer.jsx`: renamed layer headers to "ASU Trend"/"SR Trend" and all 3 visual titles; Plan dropdown relabeled "Plan Name"
- `AsuSrTrendLayer.jsx`: renamed layer header to "ASU/UCR Impact on SR Analysis"; Visual1 ("CPASU Trend") rebuilt with region-default + click-to-drill-into-time-granularity; Visual2 series renamed to "SR's"/"UCR Handled SR's" plus a corner Plan selector; Visual3 now always shows all 3 FYs and opens a modal with the top 5 non-adherent LOBs on year click
- Ran `npm install` (dependencies weren't present in this fresh clone), `npm run build` (clean), and grepped the whole `src/` tree for stale old titles/removed function names — none found
- Started the Vite dev server and confirmed it serves HTTP 200; this session's environment has no browser-automation tool available, so the popups/drill-throughs were verified by a clean production build and code/grep review rather than a live click-through — flagged to the user as a follow-up to verify manually
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md` with the full change set; committed and pushed to `main`

---

## Prompt 10 — 2026-07-02
**Input:** `remove the UCR card from the last and the front add the total queues card similarly we did for MSG Forecasting..I have already given you a list of active and inactive queues for TSA.and drilldown should be similar pie chart we did for MSG Forecasting.Also add RCA and RLCA section similarly we did for MSG Forecasting.`

**Action:**
- Removed the "UCR Impacted SR" card (was last) and its `ucrImpactedSrByFY()` selector (dead code)
- Added a "Total Queues" card at the front of the Key Metrics row, worded/styled identically to the Forecasting page's ("Active / Inactive" sublabel, `active / total` value, "N inactive" sub-line)
- Reused `LOB_QUEUES['High End Storage']`'s real 71 active / ~150 inactive queue names as the page-level TSA queue roster (new `TSA_ACTIVE_QUEUE_NAMES`/`TSA_INACTIVE_QUEUE_NAMES`/`TSA_ACTIVE_QUEUES` in `tsaData.js`) — the only real per-queue name data supplied for this page, so it backs the Total Queues card directly rather than staying scoped to one LOB
- Exported `inferRegion()` from `mockData.js` (was file-local) and reused it to tag each TSA active queue with a region
- Built a region-donut-then-table drill-down for the new card, mirroring the Forecasting page's `QueuesByRegionChart`/`QueueTable` (click a slice/legend entry to filter, "Clear" to reset), minus the Accuracy column since that concept doesn't exist for TSA queues
- Created `TsaRcaClcaPanel.jsx` with TSA-specific illustrative RCA/CLCA content (ASU/SR/CPASU/UCR-themed, not a copy of the Forecasting page's queue/call-volume-themed copy) and wired it into `TsaForecastingPage.jsx` as a sticky sidebar alongside Layers 1-4, matching `ForecastingPage.jsx`'s exact layout
- Ran `npm run build` (clean) and grepped for stale references to the removed card/selector — none found
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md` with the full change set; committed and pushed to `main`

---

## Prompt 11 — 2026-07-02
**Input:** `When a user clicks on any card, display the detailed view as a popup modal instead of navigating to a new page. The popup should allow users to close it and return to the dashboard without losing their current filter selections - do this for MSG Forecasting as well`

**Action:**
- Extracted the `Modal` component (built for TSA Forecasting's cards) out of `TsaChartKit.jsx` into a shared `src/components/Modal.jsx`; `TsaChartKit.jsx` now re-exports it so no existing TSA import needed to change
- `MetricCards.jsx` (MSG Forecasting): renamed `DrillDownPanel` → `DrillDownModal`, wrapped in the shared `Modal`; the nested `YearQueueModal` (CQN Variance year-click drill) needed no changes — it's now a modal nested inside a modal instead of nested inside an inline panel
- This supersedes the Forecasting page's original "Drill-down as inline panel (not modal)" decision, noted in `design_choice.md`
- Ran `npm run build` (clean) and grepped for stale `DrillDownPanel` references — none found
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md` with the change; committed and pushed to `main`

---

## Prompt 12 — 2026-07-02
**Input:** Two lists of real queue names pasted in chat, labeled "Inactive queues list for MSG Forecasting and CCC MidRange Mandarin" and "Active queues for MSG Forecasting - update accordingly"

**Action:**
- Cross-checked both pasted lists against the existing `ACTIVE_QUEUE_NAMES`/`INACTIVE_QUEUE_NAMES` in `mockData.js`: every name in the "active" list was already somewhere in the old active list, every name in the "inactive" list was already somewhere in the old inactive list — confirmed this is a pruned/corrected roster, not new additions
- Replaced `ACTIVE_QUEUE_NAMES` wholesale with the new 47-name list, and `INACTIVE_QUEUE_NAMES` wholesale with the new 146-name list (145 pasted names + `'CCC MidRange Mandarin'`, which the label indicated moved from active to inactive)
- Verified via a small Node script: exact counts (47/146), no duplicates within either list, no overlap between the two lists
- Confirmed no code (only the two array literals) needed to change — `filterQueues`, `callVolumeByFY`, `dbOspVolumeByFY`, `cardData`, and the CQN-variance selectors all read `ACTIVE_QUEUE_NAMES.length`/`ACTIVE_QUEUES.length` dynamically, not a hardcoded `199`
- Sanity-checked `inferRegion()` against the new active names — reasonable region spread (EMEA/Global/APJ/LATAM), no crashes, no `NAMER` entries this time (handled fine by existing empty-region UI states)
- Ran `npm run build` (clean)
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md` — corrected every stale `199`/`406`/`605` count reference, generalized two prose references to the ratio formula that had named the old `199` divisor explicitly so they won't go stale again; committed and pushed to `main`

---

## Prompt 13 — 2026-07-02
**Input:** Screenshot of the TSA Forecasting filter bar showing a visible gap between Fiscal Week and Business Partner, with instructions to fill it and to add a light/dark mode toggle for both pages

**Action:**
- Root-caused the gap: `TsaFilterPanel.jsx`'s `Cluster` grid div was missing `flex-1 min-w-0` (the Forecasting page's `FilterPanel.jsx` `Cluster` already had it), so the Time cluster's flex-grown width went unclaimed as blank space instead of stretching its 4 dropdown columns. One-line fix.
- Built a full light/dark theme toggle:
  - New CSS custom-property system in `index.css` (`:root` dark defaults, `[data-theme='light']` overrides) covering background depth levels, border tiers, text hierarchy, accent + accent-contrast, tooltip/chart-grid/select tokens, scrollbars, and card shadows
  - Rerouted every shared CSS class (`.card-panel`, `.chart-panel`, `.layer-header`, `.select-dark`, `.ms-*`, `.filter-chip`, `.drill-toggle`/`.drill-btn`, `.chart-tooltip`, scrollbars) to the new variables
  - Added a sun/moon `ThemeToggle` in `App.jsx`'s header, state persisted to `localStorage`, applied via a `data-theme` attribute set in the `useState` initializer to avoid a flash on load
  - Rerouted inline "chrome" colors (backgrounds/borders/text) across `App.jsx`, `SectionDivider.jsx`, `FilterPanel.jsx`/`TsaFilterPanel.jsx`, `MultiSelectField.jsx`, `MetricCards.jsx`/`TsaMetricCards.jsx`, `Modal.jsx`, `RcaClcaPanel.jsx`/`TsaRcaClcaPanel.jsx`, `TsaChartKit.jsx`, and all 7 layer/geo-map files
  - Deliberately left chart series/data colors, region palettes, the geo accuracy scale, status badges, and the geo maps' own canvases un-themed (constant across both modes) — see `design_choice.md`
- Ran `npm run build` (clean), grepped the compiled CSS to confirm both `:root` and `[data-theme='light']` blocks survived Tailwind/PostCSS, and grepped the whole component tree to confirm no stray hardcoded chrome colors were left unconverted
- This session's environment has no browser-automation tool, so the toggle wasn't visually clicked through in a rendered browser — flagged to the user as a follow-up to verify manually
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md` with the full change set; committed and pushed to `main`

---

## Prompt 14 — 2026-07-02
**Input:** Add a page-wide Quarter/Month/Week filter for both pages ("in order - Quarter | Month | Week"), with every graph interacting with it, researched and placed well at the top; also rename TSA's ASU Layer subtitle from "average service unit" to "Active Service Unit"

**Action:**
- Ran a web search on dashboard time-granularity/date-filter placement conventions before building anything, per the explicit request — findings (page-wide filters belong in the horizontal filter toolbar; granularity toggles sit prominently near other filters) informed placing the new control inside each filter bar rather than the header or a new toolbar row; cited in `design_choice.md`
- Built a shared `GranularityToggle.jsx` (Quarter/Month/Week pill, same `.drill-toggle` styling as the DB/OSP and page toggles) and added it to the top-right of both `FilterPanel.jsx` and `TsaFilterPanel.jsx`'s filter-bar rows
- Lifted `granularity` state (default `'Quarter'`) into `ForecastingPage.jsx`/`TsaForecastingPage.jsx` alongside `filters`, threaded as a prop into every chart component with a time axis
- Added `FISCAL_MONTH_LIST` (moved to `mockData.js`, `tsaData.js` now re-exports it), `periodsForGranularity()`, `expandToGranularity()` (additive fields — volumes/counts, divides across sub-periods with a wobble) and `expandRateToGranularity()` (rate fields — percentages/targets, keeps magnitude constant across sub-periods) to `mockData.js`
- Applied granularity to every period-keyed selector on both pages: MSG's `planOverPlanByFY`, `actualVsPlanByFY`, `stackedAdherenceByFY` (own bespoke bucket-renormalizing expansion, not either generic helper), `callVolumeByFY`, `dbOspVolumeByFY`; TSA's `asuByFY`, `srByFY`, `asuPlanVsPlanByFY`, `srPlanVsPlanByFY`, `cpasuByFY`, `ucrByFY`, `srBotsByFY`, `srDbOspByFY`, and `regionTrendGranularity`/`cpasuTrendByRegion` (now driven by the global toggle instead of inferring granularity from which time filter was selected)
- Caught and fixed a real bug during this pass: `ucrByFY` initially used the additive `expandToGranularity` on target/current, which are percentages — dividing an 88% target by 52 weeks would have shown ~1.7% at Week granularity. Fixed by routing rate fields through the new `expandRateToGranularity` instead
- This supersedes two same-day decisions: "UCR Runrate with Target" (fixed to always-FY earlier the same day) and the CPASU Trend region-drill's filter-bar-inferred granularity both now follow the new global toggle, since the request was explicit that every time-axis chart should respond to it
- Generalized `topNonAdherentLobsByYear` to accept any period label (not just a bare fiscal year), deriving the target year via the first 4 characters, since its host chart can now render at quarter/month/week granularity
- Renamed AsuLayer's subtitle from "— average service unit tracking" to "— Active Service Unit tracking"
- Verified with `npm run build` (clean) plus a throwaway Node script exercising every changed selector at Quarter/Month/Week directly (not just via the build) — confirmed correct period counts (12/36/156), additive fields summing back close to their FY totals, rate fields staying in range instead of being divided down, and the generalized LOB-modal function handling non-year period labels
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md` with the full change set; committed and pushed to `main`

---

## Prompt 15 — 2026-07-02
**Input:** Screenshot showing "PoP Variation" rendering 12 quarterly bars by default; feedback that the granularity feature itself is correct but every view should default to Fiscal Year (as before) with nothing pre-selected in the Quarter/Month/Week toggle, for both pages

**Action:**
- Changed `granularity` state default from `'Quarter'` to `null` in `ForecastingPage.jsx`/`TsaForecastingPage.jsx` — `null` means Fiscal Year, matching the convention every value filter already uses (`[]` = "All", not a pre-picked option)
- Changed `GranularityToggle.jsx` so clicking the already-active pill deselects it back to `null`, instead of always keeping exactly one of Quarter/Month/Week active (that all-times-one-active behavior stays correct for the separate DB/OSP pill, which is a genuine 3-way exclusive choice)
- Fixed a latent bug this surfaced: `regionTrendGranularity()`'s `= 'Quarter'` default parameter only applies when the argument is omitted, not when it's explicitly `null` — since the real caller now always passes the toggle's actual value (including `null`), the default silently never fired and `null` fell through to the Quarter branch of `periodsForGranularity()` anyway. Fixed with an explicit falsy/`'Year'` check that returns plain fiscal years, matching every other granularity-aware selector
- Re-verified with the same throwaway-Node-script approach as before: confirmed `planOverPlanByFY`, `actualVsPlanByFY`, `asuByFY`, `ucrByFY` all return plain `['FY25','FY26','FY27']` both when `granularity` is omitted and when explicitly `null`, and `regionTrendGranularity(filters, null)` now correctly returns `{granularity: 'Year', periods: ['FY25','FY26','FY27']}`
- Ran `npm run build` (clean)
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md`; committed and pushed to `main`

---

## Prompt 16 — 2026-07-02/03
**Input:** "Let's build Capacity Planning pages for both MSG and TSA" — followed by an explanation of the intended navigation before any screenshots: 4 pages total (MSG Forecasting, MSG Capacity Plan, TSA Forecasting, TSA Capacity Plan), entered via a new "TSG SPoG" landing page with MSG/TSA tiles, each opening into an internal Forecasting/Capacity Plan toggle; confirmed a home button next to the logo for getting back to the tiles; then 5 mockup screenshots + real filter/queue/LOB lists, with an explicit invitation to ask clarifying questions before building. One clarifying question was asked (twice, at the user's request) about an ambiguous pair of Utilization-layer visual descriptions on MSG Capacity.

**Action:**
- Promoted `TsaChartKit.jsx`'s primitives (`Visual`, `Tip`, `PlanDropdowns`, `PlanSelect`, `CategoryTick`, `truncate`, `PillButton`) into a new shared `src/components/ChartKit.jsx`, plus a new `BinaryToggle` component; `TsaChartKit.jsx` became a 2-line re-export shim so no existing import broke
- Added `CAPACITY_PLAN_NAMES`, `BUSINESS_ORGS`, `COUNTRIES`/`COUNTRY_REGION` to `mockData.js`
- Built `src/data/msgCapacityData.js` from scratch (queue-level HC/utilization/SL/leaves fact table off the existing 47-queue `ACTIVE_QUEUE_NAMES` roster) and Node-smoke-tested every selector before building any UI — caught and fixed two real sorting bugs (`utilizationByQueue` was surfacing best-adherence queues instead of worst; `leavesByQueue` was missing large positive-delta outliers)
- Asked the same clarifying question twice via `AskUserQuestion` (user said "wait" then "ask again" then "ask the same question again you asked me earlier") about MSG Capacity's two near-identically-worded Utilization visuals — confirmed both times: Visual 1 is a time-axis trend with an Aux-code tooltip, Visual 2 is a per-queue ranking chart
- Built the full MSG Capacity Plan page (`src/components/msgCapacity/`): filter panel, 5 metric cards with Modal drill-downs, `HeadcountLayer` (badge 01), a new shared `src/components/capacity/PlanOverPlanLayer.jsx` (badge 02, built to be reused by TSA Capacity too), `UtilizationLayer` (badge 03), and a dual-toggle (Headcount/SL% × Region/Country) geo map (badge 04)
- Built `src/data/tsaCapacityData.js`, reusing `tsaData.js`'s `LOB_LIST`/`LOB_FACTS`/`filterLobs`/`tsaEffectiveFiscalYears` directly since this page's filter set is identical to TSA Forecasting's; Node-smoke-tested every selector (fteByFY, tsaAttritionByFY, tsaUtilByFY, cpfByFY, actHrsByFY, geoSloByRegion, planOverPlanFteByFY, workloadSankey, workloadByFY) across all 4 granularities and with filters applied
- Built the full TSA Capacity Plan page (`src/components/tsaCapacity/`), reusing `tsa/TsaFilterPanel.jsx` directly (unmodified — identical filter fields): 5 metric cards, `HeadcountAttritionLayer` (badge 01), the shared `PlanOverPlanLayer` (badge 02), `WorkloadDistributionLayer` (badge 03 — new recharts `Sankey` diagram, first use of Sankey in this codebase, with a custom labeled node renderer), and a single-metric SLO-by-region geo map — renumbered from the mockup's "Layer 5" (which skips a Layer 4 entirely) to badge 04 for sequential consistency
- Built `LandingPage.jsx` ("TSG SPoG" title, MSG/TSA tiles) and restructured `App.jsx`: `view` state (`'landing'|'msg'|'tsa'`) replaces the old 2-way page toggle; `msgSubPage`/`tsaSubPage` state (independent, default `'forecasting'`) drives each business's internal Forecasting/Capacity Plan toggle; a `HomeButton` next to the logo (rendered only inside a business section) returns to the landing tiles
- Verified with `npm run build` (clean, 1175 modules, everything wired into `App.jsx`) — this is the first build that actually exercises every new file, since earlier builds during this pass had nothing importing the new components yet
- Started the dev server and opened it in the user's browser for manual click-through verification (tiles → per-business toggle → Sankey diagram → home button) — this session's environment has no browser-automation tool, so the agent couldn't verify the rendered UI itself
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md` with the full change set; committed and pushed to `main`

---

## Prompt 17 — 2026-07-03
**Input:** A detailed, itemized revision list for the MSG Capacity Plan page only, covering Filters (reuse MSG Forecasting's Plan Name list, remove Business Org, replace Country with Sub-region), Cards (YTD instead of target, drilling with the granularity slicer, inverted color logic for Total FTE/Attrition), and 8 numbered Graph changes (renames, a real region/sub-region click-to-drill for Attrition and a new Plan over Plan Variation layer, a stricter SL-defaulter rule, a multi-Aux breakdown with an added Adherence line, and a Geo Map toggle swap).

**Action:**
- Data layer (`msgCapacityData.js`): swapped `country` for `subRegion` on `CAPACITY_QUEUES` (reusing `ACTIVE_QUEUES[i].subRegion` directly rather than re-deriving it), dropped `businessOrg`/`country` from `filterCapacityQueues`; added `period`/`prevPeriod`/`yoyPct` to `capacityCardData` for all 5 metrics and threaded `granularity` through so headline values drill with the slicer; added `attritionByDimension`/`attritionTrendByDimension` and `planOverPlanByDimension`/`planOverPlanTrendByDimension` (region/sub-region default view + click-to-drill FY/granularity trend, mirroring TSA Forecasting's `cpasuByRegion`/`cpasuTrendByRegion` pattern), backed by a new shared `shareByKey` helper; renamed `defaulterQueues` to `slDefaulterQueues` with the new `actualHC>planHC AND slActual<90` rule; added per-queue `popPlan1`/`popPlan2`/`popVariance` fields and `planOverPlanQueueVariance` (sorted by `|variance|` descending); extended `utilizationByFY` with a 3-code `auxBreakdown` (was a single `auxCulprit`) and `utilizationByQueue` with a 3-code `auxes` array; replaced the curated-14-country `geoCapacityByCountry`/`COUNTRY_TO_WORLD_ATLAS_NAME` machinery with `GEO_CAPACITY_BY_SUBREGION`/`geoCapacityBySubRegion` over the real 24 `SUB_REGIONS`
- Node-smoke-tested every new/changed selector (subRegion tagging, YTD/YoY at all 4 granularities including the single-FY-in-scope null case, region+sub-region drill at Year and Quarter granularity, the SL-defaulter AND condition, queue-variance and aux-breakdown sort order, sub-region geo data) before touching any UI
- `MsgCapacityFilterPanel.jsx`: Plan Name now uses `mockData.js`'s `PLAN_NAMES` (default `[]`, no more pre-selected `'Actual'`), Business Org field removed, Country field replaced with Sub-region (`SUB_REGIONS`); `MsgCapacityPage.jsx`'s `DEFAULT_FILTERS` updated to match
- `MsgCapacityMetricCards.jsx`: added a `ytdSub` helper (copied structurally from `TsaMetricCards.jsx`) and wired all 5 cards to it; Total FTE/Attrition pass `lowerIsBetter: true` so a YoY increase shows red
- `HeadcountLayer.jsx`: Visual1 renamed "Actual vs Plan Variation" (line renamed "Variation %", Plan selector now offers `PLAN_NAMES`); Visual2 Attrition rebuilt as a region/sub-region click-to-drill chart with a custom tooltip showing the raw attritted-employee count; Visual3 renamed "Headcount Impact on SL", its Region/Country toggle removed, defaulter list switched to the new dual-condition rule
- Built a new MSG-only `PlanOverPlanVariationLayer.jsx` (region/sub-region click-to-drill main chart + a "Queues with Highest Variation" diverging ranked bar chart reusing the polished value-labeled convention from Forecasting's own "Top Queues by Variance" charts) and swapped `MsgCapacityPage.jsx` to use it instead of the shared `capacity/PlanOverPlanLayer.jsx` (TSA Capacity's usage of the shared component is untouched); removed the now-dead `planOverPlanHCByFY` selector
- `UtilizationLayer.jsx`: layer renamed "Utilization and Outage Analysis"; Visual1 gained an Adherence % line and a tooltip listing the top-3 Aux breakdown; Visual2 renamed "Utilization Defaulter Queues" (2-3 auxes per queue); Visual3 renamed "Leave Impact — Actual vs Target" (a name the agent chose, since the user asked for one without supplying it)
- `MsgCapacityGeoMap.jsx`: Region/Country toggle replaced with Region/Sub-region, mirroring `Layer3GeoMap.jsx`'s exact fallback-to-parent-region-at-35%-opacity mechanic
- Verified with `npm run build` (clean, 1176 modules) and a full grep sweep confirming no stale `businessOrg`/`COUNTRIES`/`CAPACITY_PLAN_NAMES`/`geoCapacityByCountry` references remained anywhere in the MSG Capacity component tree or data module
- Restarted the dev server and reopened it in the user's browser for manual verification (no browser-automation tool available this session)
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md` with the full change set; committed and pushed to `main`

---

## Prompt 18 — 2026-07-03
**Input:** "Change the Total FTE card to Cases per FTE - and show the card as YTD only and when pop-up opens it should show - cases per FTE actual and Plan. Also add a RCA and RLCA section as we did for MSG Forecasting."

**Action:**
- `msgCapacityData.js`: added `CPF_BY_FY` baseline + `cpfByFY(filters, granularity)` (rate-preserving expansion); `capacityCardData` dropped `totalFte` entirely and added `casesPerFte: {actual, plan, period}` — deliberately no `prevPeriod`/`yoyPct`, since this card shows YTD only
- `MsgCapacityMetricCards.jsx`: replaced the Total FTE card with Cases per FTE (new icon, `YTD <period>: <value>` sub-line with no comparison/trend pip — a one-off exception to the `ytdSub` pattern used by the other 4 cards); added a new `CasesPerFteTrendChart` (Actual + Plan dashed lines) for the popup, replacing the old `fte` modal type
- Built `MsgCapacityRcaClcaPanel.jsx` — same sticky-sidebar-next-to-Analysis-Layers mechanism as `RcaClcaPanel`/`TsaRcaClcaPanel`, with its own illustrative content written in this page's vocabulary (staffing/utilization/SL/attrition/Cases-per-FTE), not copied from either Forecasting page; wired into `MsgCapacityPage.jsx` with the identical flex layout `TsaForecastingPage.jsx` uses
- Node-smoke-tested `capacityCardData`/`cpfByFY` (casesPerFte present and numeric at all 4 granularities, `totalFte` confirmed removed); ran `npm run build` (clean, 1177 modules); grepped the MSG Capacity component tree to confirm no stray `totalFte`/`'fte'` references remained
- Restarted the dev server and reopened it in the user's browser for manual verification (no browser-automation tool available this session)
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md` with the full change set; committed and pushed to `main`

---

## Prompt 19 — 2026-07-03
**Input:** "Lets move on to TSA Capacity Planning" — a detailed revision list (with a screenshot of the real Global Grouping options) covering Filters, Cards, the Headcount/Attrition layer (renamed "Headcount and Utilization"), Workload Distribution, Geo Map, and adding an RCA/CLCA section "like we did for MSG Capacity." The message also contained a large block of text identical to the prior MSG Capacity revision request (with one added phrase) — treated as accidental leftover clipboard content, not new instructions, since it referred to "MSG Capacity Planning" throughout and that work was already completed.

**Action:**
- `tsaData.js`: replaced the inferred `GLOBAL_GROUPING_LIST` (`['Consumer','Commercial','Enterprise']`) with the real 5-value list from the screenshot — affects TSA Forecasting's Global Grouping filter too, since both TSA pages share this constant
- `tsaCapacityData.js`: added a `subRegion` tag to `TSA_CAPACITY_LOBS` (round-robin over `SUB_REGIONS`) and a `tsaShareByKey` helper; added `period`/`prevPeriod`/`yoyPct` to `tsaCapacityCardData` for Staffing Summary/Attrition/Avg Case Time/SLO % (Cases per FTE untouched) and threaded `granularity` through; added `tsaAttritionByDimension`/`tsaAttritionTrendByDimension` and `tsaPlanOverPlanByDimension`/`tsaPlanOverPlanTrendByDimension` (region/sub-region click-to-drill, mirroring MSG's pattern); added per-LOB `popPlan1`/`popPlan2`/`popVariance` and `planOverPlanLobVariance`; extended `workloadSankey` with a `mode` param ('LOB'/'CQN') so the toggle can route illustrative tiers into either real LOB names or 4 real TSA queue names (validated against `LOB_QUEUES['High End Storage'].active`); added `adherence` to `actHrsByFY` and a new `actHrsDefaulterLobs` selector; added `geoSloBySubRegion`/`TSA_GEO_SLO_BY_SUBREGION`; removed the now-dead `workloadByFY`/`WORKLOAD_BY_FY` and `planOverPlanFteByFY`
- Node-smoke-tested every new/changed selector (subRegion tagging, YTD/YoY at all 4 granularities, region+sub-region drill at Year/Quarter, Sankey LOB/CQN mode shapes including confirming the 4 real queue names resolve, ACT adherence + defaulter sort order, sub-region geo data) before touching UI
- `TsaCapacityMetricCards.jsx`: renamed Total FTE → Staffing Summary and Global SLO → SLO %, wired a `ytdSub` helper (Attrition/Avg Case Time `lowerIsBetter: true`); Cases per FTE left unchanged
- `HeadcountAttritionLayer.jsx`: renamed layer "Headcount and Utilization"; Visual1 renamed "Actual vs Plan Variation" (line renamed "Variation %"); Visual2 Attrition rebuilt as a region/sub-region click-to-drill chart with a raw-attritted-count tooltip; Visual3 renamed "Utilization Variance," its Region/Country toggle relabeled Region/Sub-region
- Built a new TSA-specific `PlanOverPlanVariationLayer.jsx` (region/sub-region drill + a "LOBs with Highest Variation" diverging ranked chart) and swapped `TsaCapacityPage.jsx` to use it; deleted the now-orphaned shared `capacity/PlanOverPlanLayer.jsx` and its empty folder once a repo-wide grep confirmed nothing imported it anymore
- `WorkloadDistributionLayer.jsx`: Visual1 renamed "Workload Distribution" with a new LOB/CQN `BinaryToggle`; Visual2 renamed "Average Case Time Variance" and repointed at `actHrsByFY` (bars + new Adherence % line + top-LOBs-above-target list), reinterpreting the original "Workload Act vs Plan" name as having always meant Average Case Time; Visual3 "ACT Trend — Actual vs Plan" kept as a trend line but gained the same Adherence % line and defaulter list
- `TsaCapacityGeoMap.jsx`: added a Region/Sub-region `BinaryToggle` mirroring `MsgCapacityGeoMap.jsx`'s exact fallback-to-parent-region-at-35%-opacity mechanic
- Built `TsaCapacityRcaClcaPanel.jsx` (own vocabulary: staffing/attrition/Cases-per-FTE/Average-Case-Time/SLO) and wired it into `TsaCapacityPage.jsx` with the same sticky-sidebar layout as the other three pages
- Verified with `npm run build` (clean, 1178 modules) and a grep sweep confirming no stale references to the deleted selectors/component remained; also caught and fixed two stale paragraphs in `tech_spec.md` left over from the MSG Capacity revision pass (still describing a "Total FTE" card and business-logic rule that no longer exists after that pass swapped it for Cases per FTE)
- Restarted the dev server and reopened it in the user's browser for manual verification (no browser-automation tool available this session)
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md` with the full change set; committed and pushed to `main`

---

## Prompt 20 — 2026-07-06
**Input:** "change the live FY26 to FY27 for all the pages"

**Action:**
- Grepped for "Live · FY26" and found a single occurrence in `App.jsx`'s header — shared markup rendered once above every page (landing + all 4 business pages), so a one-line edit to "Live · FY27" applied everywhere without touching each page individually
- Ran `npm run build` (clean) to confirm; updated `handoff.md`; committed and pushed to `main`

---

## Prompt 21 — 2026-07-06
**Input:** Screenshot of TSA Capacity's Workload Distribution layer showing the 3-visual row badly cramped, with the request "make the RCA and CLCA section small for all the pages... you can reduce the size of lines." Mid-task, a follow-up message: "Also remove the adherence line from the ACT graph for TSA Capacity planning."

**Action:**
- Narrowed the RCA/CLCA sidebar from `width: 300` to `width: 220` in all 4 page files (`ForecastingPage.jsx`, `TsaForecastingPage.jsx`, `MsgCapacityPage.jsx`, `TsaCapacityPage.jsx`) — freeing up width for the main 3-visual-per-row chart area
- Compacted the shared `Section` component in all 4 RCA/CLCA panel files to match the narrower column (smaller badge/title/subtitle/list-item type, tighter line-height and gaps, reduced padding); also shrank the "RCA & CLCA" header label
- Removed the Adherence % line (and its now-unused right axis) from TSA Capacity's "ACT Trend — Actual vs Plan" (`WorkloadDistributionLayer.jsx` Visual3) — read "the ACT graph" as the one chart literally titled "ACT Trend," leaving "Average Case Time Variance" (Visual2, same underlying metric) with its own Adherence % line untouched
- Ran `npm run build` (clean) to confirm both changes; updated `handoff.md`; committed and pushed to `main`

---

## Prompt 22 — 2026-07-08
**Input:** "For MSG Forecasting tab we have total queues card and a dropdown for it...we need to make it more interactive...right now we are showing only active queues in the donut chart..we need to figure out a way to show both active and inactive queues..and also a table for BP queues list and a split of active and inactive queues for them-and when we hover on that number we would be able to see the queue name."

**Action:**
- `mockData.js`: added `INACTIVE_QUEUES` (146 inactive queue names tagged with `region`/`businessPartner`, same illustrative-tagging convention as `ACTIVE_QUEUES`); added `allQueuesByStatus(filters)` (combined active+inactive rows tagged with `status`, narrowed by region/businessPartner only) and `queuesByBusinessPartner(filters)` (per-BP active/inactive counts + the queue-name arrays behind each count)

---

## Prompt 23 — 2026-07-16
**Input:** Prepare a sanitized fork of this project for public release.

**Action:**
- Produced this fork as a public-release-ready copy: internal organization identifiers, business-unit/segment codes, and product/technology line names throughout the codebase and these four docs were replaced with generic placeholder terms, preserving structure and functionality exactly (mock numbers/illustrative data untouched). No build logic changed as a result.
- Verified `npm run build` succeeds and re-ran a repo-wide sweep to confirm no original identifiers remain.
- Node-smoke-tested both new selectors (tagging present, counts sum back to the full rosters, region/BP filters narrow correctly, BP rows sorted by total) before touching the UI
- `MetricCards.jsx`: reworked the Total Queues drill-down — `QueuesByRegionChart` now plots whichever of an All/Active/Inactive segmented pill is selected, but always shows the region's Active/Inactive split in the center label and every slice's tooltip regardless of the toggle position; `QueueTable` now lists both rosters with a Status badge column (inactive rows show "—" for Accuracy); added a new `BusinessPartnerTable` below it (Business Partner / Active / Inactive / Total) with a `HoverCount` component that reveals the underlying queue names in a styled tooltip on hover
- Renamed the modal title from "Active Queue Directory" to "Queue Directory — Active & Inactive"; removed the now-unused `filterQueues`/`structuralRows` plumbing this replaced
- Ran `npm run build` (clean); started the dev server and opened it in the user's browser for manual verification (no browser-automation tool available this session)
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md` with the full change set; committed and pushed to `main`

---

## Prompt 23 — 2026-07-08
**Input:** "the Business partner table is good but when i hover over the count the queue names are not coming up properly -maybe a scroll required there"

**Action:**
- Root-caused: the Business Partner table's wrapper div with `overflowX: 'auto'` was clipping the `HoverCount` tooltip vertically — setting only `overflow-x` to a non-`visible` value resolves `overflow-y` to `'auto'` too per the CSS spec, so the wrapper was silently clipping the popup even though only horizontal scroll was intended
- Removed the wrapper's overflow styling entirely (the table is 4 narrow columns, never actually needed horizontal scroll); flipped the tooltip to open below the row instead of above
- Verified with `npm run build` (clean); dev server was already running with HMR, confirmed the fix picked up live
- Updated `handoff.md`; committed and pushed to `main`

---

## Prompt 24 — 2026-07-08
**Input:** "Also call volume card - instead of handled % add abandon % line - logic % of calls abandoned"

**Action:**
- `MetricCards.jsx`'s `VolumeByFYChart` (Call Volume card's drill-down chart): replaced the `handledPct` line with `abandonPct = (offered - handled) / offered * 100`, renamed to "Abandon %"; kept the same axis/color role since it's still a neutral supplementary rate line, not a variance metric
- Left the Call Volume card's own face text untouched (still shows handled volume + handle rate) since the request specifically named "a line," i.e. the drill-down chart
- Verified with `npm run build` (clean); updated `handoff.md`; committed and pushed to `main`

---

## Prompt 29 — 2026-07-10
**Input:** "i want a extra drill down for RCA and CLCA for each and every graph not cards - for MSG and TSA pages...dont exhaugarete it just a small pop up is fine" — asked a scope-clarifying question first (all 4 pages vs. just the 2 Forecasting pages); user confirmed all 4.

**Action:**
- Added a new shared `GraphInsightButton` component to `ChartKit.jsx` — a small circular "i" toggle that opens a compact popup with one RCA sentence + one CLCA sentence, reusing the existing `.chart-tooltip` styling
- Wired it into the shared `Visual` component via two new optional props (`rca`/`clca`); passing them renders the button in the visual's top-left corner (opposite `cornerControls`, which many visuals use for Region/Sub-region toggles); omitting both renders nothing, so every untouched `Visual` call site elsewhere kept working
- Added `rca`/`clca` one-liners to all 31 chart-panel visuals across all 4 pages: MSG Forecasting (`Layer1PlanOverPlan.jsx` ×3, `Layer2ActualVsPlan.jsx` ×3 — both predate the shared `ChartKit.jsx` and got the same prop handling added to their own local `Visual` instead of being migrated), TSA Forecasting (`AsuLayer.jsx` ×3, `SrLayer.jsx` ×3, `AsuSrTrendLayer.jsx` ×3), MSG Capacity Plan (`HeadcountLayer.jsx` ×3, `PlanOverPlanVariationLayer.jsx` ×2, `UtilizationLayer.jsx` ×3), TSA Capacity Plan (`HeadcountAttritionLayer.jsx` ×3, `PlanOverPlanVariationLayer.jsx` ×2, `WorkloadDistributionLayer.jsx` ×3)
- Added the same button directly (not via `Visual`, since these use a custom layout) to all 4 Geo Maps — `Layer3GeoMap.jsx`, `TsaGeoMap.jsx`, `MsgCapacityGeoMap.jsx`, `TsaCapacityGeoMap.jsx` — positioned in each map's existing toggle row via `justify-content: space-between`
- Verified with `npm run build` (clean) and a grep sweep confirming exactly 35 matching `rca=`/`clca=` pairs (one per graph, none missing, none orphaned)
- Started the dev server and opened it in the user's browser for manual verification (no browser-automation tool available this session)
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md` with the full change set; committed and pushed to `main`

---

## Prompt 30 — 2026-07-10
**Input:** "Also add i button for each and every card and graph..across all 4pages"

**Action:**
- Extended the per-graph `GraphInsightButton` popup (added earlier the same day) to every KPI card — 20 total, 5 cards × 4 pages
- Changed each page's local `Card` component (`MetricCards.jsx`, `TsaMetricCards.jsx`, `MsgCapacityMetricCards.jsx`, `TsaCapacityMetricCards.jsx`) from a `<button>` to a `<div role="button" tabIndex={0}>` with an explicit Enter/Space `onKeyDown` handler — necessary since the new insight button is a real nested `<button>`, which HTML doesn't allow inside another `<button>`
- Added `rca`/`clca` one-liners to all 20 card call sites, positioned top-right of each card (opposite corner from the graph placement, since cards have no existing top-right control to avoid)
- Verified with `npm run build` (clean) and a grep sweep confirming 6 `rca=` matches per file (1 destructure + 5 cards) across all 4 metric-card files
- Started the dev server and opened it in the user's browser for manual verification (no browser-automation tool available this session)
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md` with the full change set; committed and pushed to `main`

---

## Prompt 28 — 2026-07-08
**Input:** "for forecast accuracy dropdown instead of showing region as default..show year wise accuracy as default and when user clicks on a particular year it should open a pop up again to show region wise"

**Action:**
- `mockData.js`: added `forecastAccuracyByFY(filters)` (FY rollup of the existing `FORECAST_ACCURACY_BY_REGION` baseline, forecast held flat across years with only actual/accuracy nudged per year) and `forecastAccuracyByRegionForYear(filters, fy)` (region breakdown for one year, using the same nudge so both views' totals reconcile); removed the old un-scoped `forecastAccuracyByRegion` once nothing called it anymore
- Node-smoke-tested both selectors (FY narrowing, region-filter narrowing, and that a year's region-breakdown sums reconcile with that year's FY-rollup row) before touching the UI
- `MetricCards.jsx`: repurposed `ForecastByRegionChart` to take a `fy` prop (now only reached via drill-in, not the default view); added `ForecastByFYChart` (Actual/Forecast/Accuracy% by fiscal year, click a bar to drill in) as the new default; added `ForecastYearRegionModal`, a nested pop-up mirroring the existing `YearQueueModal`'s custom-overlay pattern, rendering `ForecastByRegionChart` scoped to the clicked year; renamed the modal title to "Forecast Accuracy — Fiscal Year"
- Verified with `npm run build` (clean) and a grep sweep confirming no stale references to the removed selector remained; updated `handoff.md`; committed and pushed to `main`

---

## Prompt 27 — 2026-07-08
**Input:** "also add line chart for DB/OSP instead of column chart"

**Action:**
- `MetricCards.jsx`'s `DbOspByFYChart`: swapped `BarChart`+`Bar` for `LineChart`+`Line` (added the `LineChart` import), keeping the same two series (DB Offered / OSP Offered) and colors
- Verified with `npm run build` (clean); updated `handoff.md`; committed and pushed to `main`

---

## Prompt 26 — 2026-07-08
**Input:** "also add a holiday list with country in this card.."

**Action:**
- Added a static `HOLIDAY_CALENDAR` reference list to `MetricCards.jsx` (real holidays + real countries, illustrative dates) and a new `HolidayCalendar` table component, rendered below the chart in the Call Volume card's drill-down modal
- Kept the data in the component file rather than `mockData.js`, matching the RCA/CLCA panels' precedent for static illustrative content that nothing filters or computes off of
- Verified with `npm run build` (clean); updated `handoff.md`; committed and pushed to `main`

---

## Prompt 25 — 2026-07-08
**Input:** Screenshot of the Call Volume card's default face ("177.2K handled · 94.1%") with the request "on the default view replace handled % with abandoned %"

**Action:**
- `mockData.js`'s `cardData()`: added `abandonPct` to `callVolume` alongside the existing `handlePct` (computed directly as `(offered-handled)/offered*100`, not derived from `handlePct`, so it stays independently correct)
- `MetricCards.jsx`'s Call Volume `Card`: sub-text changed from `"{handled} handled · {handlePct}%"` to `"{handled} handled · {abandonPct}% abandoned"`; the green/red trend threshold reframed from `handlePct >= 90` to the numerically equivalent `abandonPct <= 10`, so status coloring behavior is unchanged
- Verified with `npm run build` (clean); updated `handoff.md`; committed and pushed to `main`

---

## Prompt 31 — 2026-07-20
**Input:** "Implement RCA/Insights as a flip-over or info button on each visual instead of displaying RCA text on the right panel. Implement this on each and every graph."

**Action:**
- Confirmed every graph and card already had the per-visual "i" `GraphInsightButton` popup (built 2026-07-10, 62 `rca=`/`clca=` call sites across 19 files) — the requested mechanism already existed, so no new component was built
- Removed the page-level RCA/CLCA sticky sidebar from all 4 pages (`ForecastingPage.jsx`, `TsaForecastingPage.jsx`, `MsgCapacityPage.jsx`, `TsaCapacityPage.jsx`) — dropped the `flex` row + 220px sticky column wrapper, Analysis Layers now render full-width in a single column
- Deleted the 4 now-unused sidebar components: `RcaClcaPanel.jsx`, `TsaRcaClcaPanel.jsx`, `MsgCapacityRcaClcaPanel.jsx`, `TsaCapacityRcaClcaPanel.jsx`
- Went with the info-button option (not a flip-card animation) since it already existed and was already wired everywhere — see `design_choice.md` for the full reasoning
- Verified with `npm run build` (clean, 1174 modules, down from 1178) and a grep sweep confirming zero remaining `RcaClcaPanel` references anywhere in `src/`
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md` with the full change set; committed and pushed to `main`

---

## Prompt 32 — 2026-07-20
**Input:** Screenshot of the Call Volume card with its "i" button open, showing the RCA/CLCA popup clipped at the right edge of the screen ("RCA... Ab... ho..." visible, rest cut off)

**Action:**
- Root-caused: `GraphInsightButton`'s popup always anchored via `left: 0`, but on cards the button itself sits at the top-right corner — opening a 220px popup further right from there pushes most of it off-screen
- Added an `align` prop (`'left'` default, `'right'`) to `GraphInsightButton` (`ChartKit.jsx`) controlling `left: 0` vs `right: 0` anchoring
- Passed `align="right"` from all 4 card files (`MetricCards.jsx`, `TsaMetricCards.jsx`, `MsgCapacityMetricCards.jsx`, `TsaCapacityMetricCards.jsx`); left graphs/Geo Maps on the default (`align="left"`) since their button sits top-left, where opening rightward was never a problem
- Verified with `npm run build` (clean)
- Updated `handoff.md`, `design_choice.md`; committed and pushed to `main`

---

## Prompt 33 — 2026-07-20
**Input:** Screenshot of the Forecast Accuracy card's popup showing "CLCA" label with its text cut off below — "now CLCA section is down and not able to see it clearly"

**Action:**
- Root-caused: `.card-panel` had `overflow: hidden` (for rounded-corner clipping) — since the insight popup is a DOM child of the card, growing taller than the card (RCA + CLCA text) got clipped at the card's own bottom edge
- Removed `overflow: hidden` from `.card-panel` in `index.css`; confirmed nothing else in the card relies on it (the top glow `::before` bar and bottom active-state bar are both already inset within the card's width)
- Verified with `npm run build` (clean)
- Updated `handoff.md`, `design_choice.md`; committed and pushed to `main`

---

## Prompt 35 — 2026-07-20
**Input:** "1. Fix DB vs OSP percentage calculations and interaction behavior (when overall view is 66% and 34% and then i switch to DB for example it should show 64% and for OSP it should show 36%). 2. the Sankey chart - when we hover over a LOB or CQN it should show the LOB supporting CQN's and vice versa as list on hover and the percentage split example - If 1 lob is supporting 5 CQN then % of volume of each CQN and vice versa. 3. Compare Month-over-Month and Quarter-over-Quarter instead of always comparing against last year where applicable."

**Action:**
- **(1) DB/OSP Split card:** root-caused `mockData.js`'s `cardData()` computing the split from `filterQueues(filters)` — already narrowed by the active DB/OSP pill — so selecting "DB"/"OSP" always degenerated to 100%/0%. Fixed to always compute from a `{...filters, dbOsp:'All'}`-scoped row set, summed by each queue's real `offered` volume (not queue count, matching the card's own "Offered volume" sublabel). Verified via Node smoke test: split now holds steady (66%/34%) across All/DB/OSP instead of collapsing to 100/0.
- **(2) Sankey hover:** added `nodeHoverSummary()` to `WorkloadDistributionLayer.jsx` — hovering a LOB or CQN node now shows every node on the other side it connects to, with value + % of the hovered node's own total, via a fixed top-right panel (same convention as the Geo Maps' hover tooltip). Reuses the existing `sourceLinks`/`targetLinks` node payload the custom `SankeyNode` already destructured; no new data plumbing needed.
- **(3) MoM/QoQ instead of always YoY:** `tsaData.js`'s `tsaCardData(filters)` never accepted/forwarded `granularity` to `asuByFY`/`srByFY`/`cpasuByFY` — a real bug, fixed by threading it through (`TsaMetricCards.jsx` now passes `granularity`). Asked the user whether the same change should override MSG/TSA Capacity's *deliberate* prior "always FY-over-FY" design decision too — confirmed yes. Extended `capacityCardData`/`tsaCapacityCardData` to reuse each metric's existing granular selector for the prior-period comparison instead of a separate FY-only lookup; added a new `sloByFY(filters, granularity)` (no granular Global SLO series existed before) and added `bench` to `tsaAttritionByFY`'s rate expansion; fixed a `.slice(0,4)` bug this surfaced in `msgCapacityData.js`'s `target` lookups (keyed by bare FY, but the period is now granular).
- Verified all three with `npm run build` (clean) plus a Node smoke test on `capacityCardData`/`tsaCapacityCardData` at Year/Quarter/Month — correct periods/targets/deltas, no `NaN`/undefined. Noted one non-bug caveat: MSG Capacity's "Staffing" card shows ~0% MoM/QoQ since it's a ratio where `expandToGranularity` cancels out across numerator/denominator — inherent to the existing expansion helper.
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md` with the full change set; committed and pushed to `main`

---

## Prompt 36 — 2026-07-20
**Input:** "When I hover over sankey its not appearing"

**Action:**
- Root-caused: `SankeyNode`'s `onMouseEnter`/`onMouseLeave` were on the wrapping `<g>`, which has no geometry of its own — SVG groups without their own shape don't reliably register hover
- Moved the handlers onto a new invisible hit-area `<rect>` (padded ~74px toward the label side), matching the pattern already working elsewhere in this app (Geo Maps attach hover handlers directly to the shape, not a wrapper); added `pointerEvents: 'none'` to the visible Rectangle/text so they don't intercept events meant for the hit-area rect underneath
- No browser-automation tool available this session, so this couldn't be visually click-tested — flagged to the user
- Verified with `npm run build` (clean)
- Updated `handoff.md`; committed and pushed to `main`

---

## Prompt 37 — 2026-07-20
**Input:** "still not able to see"

**Action:**
- The hit-area-rect fix from the prior prompt still didn't work — stopped guessing and read `node_modules/recharts/es6/chart/Sankey.js` directly
- Found the actual mechanism: Recharts wraps every node in its own internal `<Layer>` and only exposes hover via `onMouseEnter`/`onMouseLeave` props on the `<Sankey>` element itself (called as `(elementProps, type, event)`) — custom props passed to the `node={<SankeyNode/>}` render-prop element are never read for hover purposes, so both prior attempts were targeting an API surface that doesn't do anything
- Reverted `SankeyNode` to purely presentational; wired `handleMouseEnter`/`handleMouseLeave` as top-level `onMouseEnter`/`onMouseLeave` props on `<Sankey>`, filtering to `type === 'node'` (confirmed via source that `this.props.onMouseEnter`/`onMouseLeave` are read directly, not filtered)
- Verified with `npm run build` (clean); flagged again that this couldn't be visually click-tested (no browser-automation tool this session), but confidence is now grounded in the library's actual source rather than an assumption
- Updated `handoff.md`; committed and pushed to `main`

---

## Prompt 38 — 2026-07-20
**Input:** Screenshot of the DB/OSP Split card showing "66% / 34%" while the DB pill is active, with the clarification "when i click on DB it should show only 66% and when i click on OSP it should show 34%"

**Action:**
- Clarified the intended UI behavior: the earlier split-calculation fix (stable 66%/34%, never 100/0) was correct, but the card was still displaying both numbers together regardless of which pill was selected
- `MetricCards.jsx`'s `dbOsp` Card now branches `value`/`sub`/`sublabel` on `filters.dbOsp`: DB → single "66%" + "DB 124.2K"; OSP → single "34%" + "OSP 64.0K"; All → unchanged combined "66% / 34%" display
- Verified with `npm run build` (clean)
- Updated `handoff.md`; committed and pushed to `main`

---

## Prompt 39 — 2026-07-20
**Input:** "When I hover over sankey graph it shows blank page"

**Action:**
- Read `node_modules/recharts/es6/chart/Sankey.js`'s `computeData` more closely and found: a node's `sourceLinks`/`targetLinks` are arrays of link INDICES (plain numbers), not resolved link objects (`sourceLinks.push(i)`, dereferenced elsewhere as `links[node.sourceLinks[j]]`) — `nodeHoverSummary()` was doing `l.target.name` on what turned out to be a bare number, throwing `TypeError: Cannot read properties of undefined` on the very first node hover, an uncaught render error that blanked the whole app
- Rewrote `nodeHoverSummary(data, nodeIndex)` to filter the flat `{nodes, links}` object already built for `<Sankey data={data}>` directly by the hovered node's plain `index`, instead of touching Recharts' internal index arrays
- Verified with a Node smoke test against real `workloadSankey()` output (both LOB/CQN modes) — correct names/values, percentages summing to 100%, no exception; this is the first part of the whole Sankey hover feature actually verified against real data rather than reasoned about
- Verified with `npm run build` (clean)
- Updated `handoff.md`; committed and pushed to `main`

---

## Prompt 40 — 2026-07-20
**Input:** Screenshot of the ESG/MSG Forecasting filter bar with View By set to "Quarter", with "all the views in the cards should change according to view by - quarter,month,week"

**Action:**
- Root-caused: `cardData(filters)` never accepted `granularity` — Call Volume/DB/OSP Split were flat aggregates, and `forecastAccuracyByFY` didn't accept granularity either, so all 5 cards were frozen at the Year-level totals regardless of the View By toggle
- Made 3 of 5 cards granular: Call Volume and DB/OSP Split now read the latest period off their existing granular selectors (`callVolumeByFY`, `dbOspVolumeByFY`); extended `forecastAccuracyByFY` with an optional `granularity` param (additive — its existing caller, the drill-down chart, deliberately keeps calling it without one, preserving that chart's established FY-only design from 2026-07-08)
- Deliberately left Total Queues and CQN Variance unchanged — both are flat, non-date-stamped queue-roster facts in this data model with no real per-quarter value to show
- Also fixed `dbOspVolumeByFY` to be volume-weighted (was still queue-count-based, inconsistent with the `cardData` split fix from earlier the same day)
- Verified with a Node smoke test (`cardData` at Year/Quarter/Month/Week, with and without a DB/OSP pill) — Call Volume and DB/OSP volumes scale correctly per period; noted Forecast Accuracy's % legitimately stays flat within a fiscal year (same ratio-cancellation reasoning as MSG Capacity's Staffing card)
- Verified with `npm run build` (clean)
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md` with the full change set; committed and pushed to `main`

---

## Prompt 34 — 2026-07-20
**Input:** "Allow clicking on a region to highlight only the selected area instead of showing all regions together"

**Action:**
- All 4 Geo Maps (`Layer3GeoMap.jsx`, `TsaGeoMap.jsx`, `MsgCapacityGeoMap.jsx`, `TsaCapacityGeoMap.jsx`) previously had hover-only tooltips and no click interaction — added a `selectedKey` state to each
- Clicking a region/sub-region on the map, or its row in the summary table, now spotlights it: full opacity + accent-colored border, every other region dims to ~10% opacity; re-clicking the same one, a new "Clear" link next to the subtitle, or switching Region/Sub-region view resets it
- Table rows are now clickable (previously hover-highlight only) and bold+tint the selected row
- Region/Sub-region view toggle clears the selection (different key domains); `MsgCapacityGeoMap`'s Headcount/SL% metric toggle deliberately does not (same area, different metric)
- Verified with `npm run build` (clean)

---

## Prompt 41 — 2026-07-23
**Input:** Large multi-part request across all 4 pages: (1) MSG Forecasting — rename "CQN Variance" card to "Forecast Variance"; (2) MSG Capacity Plan — rename "Leave Impact — Actual vs Target" to "Outage — Actual vs Target", including the hover/legend series names ("Leaves"→"Outage"); (3) MSG Capacity Plan — add a Plan dropdown to "Headcount Impact on SL", "Plan over Plan Variation" + "Queues with Highest Variation" (Plan A/Plan B, shared), and each of the 3 "Utilization and Outage Analysis" graphs (independent dropdowns); (4) MSG Forecasting — add a Plan dropdown to "Top Queues by Variance"; (5) TSA Capacity Plan — add a Plan dropdown to "Actual vs Plan Variation" (Headcount and Utilization layer), Plan A/Plan B dropdowns (shared) on "Plan over Plan Variation" + "LOBs with Highest Variation"; (6) TSA Capacity Plan — remove "ACT Trend — Actual vs Plan" from the Workload Distribution layer, leaving 2 graphs; (7) remove RCA/CLCA from every KPI card across all 4 pages (kept only on graphs/visuals/geo maps); (8) add a new, separate "i" info button to every card AND every visual across all 4 pages, showing a plain one-sentence description of what that card/chart shows (distinct from the existing RCA/CLCA analysis button).

**Action:**
- Built shared infra first: new `InfoButton` component in `ChartKit.jsx` (single `info` string, no RCA/CLCA framing) wired into the shared `Visual` (renders inline next to the title, so it never collides with `cornerControls` top-right or `GraphInsightButton` top-left); mirrored the same `info` prop into the two pre-ChartKit local `Visual` copies in `Layer1PlanOverPlan.jsx`/`Layer2ActualVsPlan.jsx`. Reused the already-existing `PlanDropdowns` (Plan A/B) and `PlanSelect` (single) — no new dropdown components needed.
- Then ran 4 independent agents in parallel, one per page (disjoint files, no conflicts):
  - **MSG Forecasting**: `MetricCards.jsx`'s `label="CQN Variance"` → `"Forecast Variance"`; `Layer2ActualVsPlan.jsx`'s `Visual3` ("Top Queues by Variance") gained a real `PlanSelect` — required extending `cqnActualVariance()` in `mockData.js` with an additive `planName` param + a new `PLAN_ACTUAL_VARIANCE_NUDGE` lookup so the numbers genuinely rescale per plan; cards' `Card` swapped `rca`/`clca`/`GraphInsightButton` for a new `info` prop/`InfoButton`; every card and every visual (Layer1/2/3) got a factual one-sentence `info=`.
  - **MSG Capacity Plan**: `UtilizationLayer.jsx`'s `Visual3` renamed to "Outage — Actual vs Target" (`actualLabel`/`targetLabel` → "Actual/Target Outage", rca/clca copy reworded, stale comment fixed); `HeadcountLayer.jsx`'s `Visual3` ("Headcount Impact on SL") got its own independent Plan dropdown (extended `slTrendByFY`/`slDefaulterQueues` with an additive `planSelection` param + a new `planMultiplier()` helper); `PlanOverPlanVariationLayer.jsx` got a shared Plan A/Plan B `PlanDropdowns` driving both `MainChart` and `QueueVarianceChart` (extended `planOverPlanByDimension`/`planOverPlanTrendByDimension`/`planOverPlanQueueVariance` additively, using `CAPACITY_PLAN_NAMES`); `UtilizationLayer.jsx`'s 3 visuals each got their own independent Plan dropdown (`utilizationByFY`/`utilizationByQueue`/`leavesByQueue` each extended additively); cards + every visual got `info=`.
  - **TSA Forecasting**: no structural changes requested here — just removed `rca`/`clca` from `TsaMetricCards.jsx`'s cards (swapped for `InfoButton`/`info`) and added `info=` to all 5 cards + all visuals (`AsuLayer.jsx`, `SrLayer.jsx`, `AsuSrTrendLayer.jsx`, `TsaGeoMap.jsx`), leaving existing rca/clca on visuals untouched.
  - **TSA Capacity Plan**: `HeadcountAttritionLayer.jsx`'s `Visual1` ("Actual vs Plan Variation") got a Plan dropdown for parity with MSG's equivalent chart (extended `fteByFY()` with an additive `planName` param + `PLAN_SCALE_BY_NAME`); `PlanOverPlanVariationLayer.jsx` got a shared Plan A/Plan B `PlanDropdowns` driving both `MainChart` and `LobVarianceChart` (extended `tsaPlanOverPlanByDimension`/`tsaPlanOverPlanTrendByDimension`/`planOverPlanLobVariance` additively); `WorkloadDistributionLayer.jsx`'s `Visual3` ("ACT Trend — Actual vs Plan") deleted entirely, along with its now-unused `LineChart` import — the remaining 2 visuals fill the row via their existing `flex-1` class, no layout fix needed; cards + every remaining visual got `info=`.
- All 4 agents deliberately left every existing `rca=`/`clca=` prop on graphs/visuals/geo maps untouched — only the 20 KPI cards (5 per page × 4 pages) lost RCA/CLCA.
- Verified with `npm run build` (clean, 1174 modules) after all 4 agents completed; grepped all 4 card files to confirm zero remaining `rca=`/`clca=` occurrences.
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md`; committed and pushed to `main`.

---

## Prompt 42 — 2026-07-23
**Input:** "In MSG Capacity Plan tab - In headcount and SL% LAYER for headcount impact on SL%. under plan use the same plans we used for actual vs plan variation. use the same plans for recently added dropdowns for other graphs as well."

**Action:**
- Found the inconsistency: "Actual vs Plan Variation" (`HeadcountLayer.jsx` Visual1, pre-existing) uses `PLAN_NAMES`; all 5 dropdowns added earlier today on this page ("Headcount Impact on SL", Plan over Plan Variation + Queues with Highest Variation's shared Plan A/Plan B, and each of the 3 Utilization and Outage Analysis graphs) had used `CAPACITY_PLAN_NAMES` instead — a different real plan-name list.
- Switched all 5 to `PLAN_NAMES` (`HeadcountLayer.jsx` Visual3, `UtilizationLayer.jsx` Visual1/2/3, `PlanOverPlanVariationLayer.jsx`'s shared `PLANS` constant) — confirmed no data-layer change was needed since `planMultiplier()` hashes whatever plan-name string it's given rather than assuming a specific list.
- Verified with `npm run build` (clean, 1174 modules); grepped `msgCapacity/` for stray `CAPACITY_PLAN_NAMES` code references — none remain.
- Updated `handoff.md`; committed and pushed to `main`.

---

## Prompt 43 — 2026-07-23
**Input:** "From the TSA Capacity Plan tab remove the SLO%. And from the geo map remove the SLO% and show only the Headcount."

**Action:**
- Removed the "SLO %" KPI card entirely from `TsaCapacityMetricCards.jsx` (Key Metrics row now 4 cards, was 5) — along with its `GlobalSloByRegionChart` drill-down, its `MODAL_TITLES.globalSlo` entry, and the `globalSlo` field in `tsaCapacityCardData()`.
- Deleted the now-dead SLO data functions/constants from `tsaCapacityData.js`: `sloByFY`, `SLO_BY_FY`, `TSA_GEO_SLO_BY_REGION`, `TSA_GEO_SLO_BY_SUBREGION`, `geoSloByRegion`, `geoSloBySubRegion`.
- Switched `TsaCapacityGeoMap.jsx` from SLO% to real Headcount: new `geoHeadcountByRegion`/`geoHeadcountBySubRegion(filters)` selectors reshape the existing `tsaAttritionByDimension()` region/sub-region headcount split (already backing the Attrition visual) rather than inventing separate data — this also fixed a latent bug where the old SLO selectors silently ignored the `filters` argument entirely. Since headcount is a raw count (not 0-100%), color bands became relative to the current view's own peak value (≥75%/50%/25% of max → Highest/High/Moderate/Lowest) instead of fixed absolute thresholds, so the same 4-color read stays meaningful across the very different Region (~4 keys, 600s) vs Sub-region (~24 keys, 200s) scales.
- Verified with `npm run build` (clean, 1174 modules) and a Node smoke test of the new selectors + `tsaCapacityCardData` (confirmed realistic headcount values and that `globalSlo` no longer appears); grepped `src/` for stray SLO references — none remain outside comments.
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md`; committed and pushed to `main`.
- Updated `handoff.md`, `design_choice.md`; committed and pushed to `main`

---

## Prompt 44 — 2026-07-27
**Input:** (1) "go through this file [C:\Users\hrishikesh.yadav\Downloads\ghgh.xlsx] and add planning cycle to our SPoG. the excel contains two sheets Overall FY27 and Current planning cycle. ignore sheet 4. It should not look like excel - feel free to make a good view accordingly." (2) "Also add this Fiscal calender [image] ... Make a section if required on the left side ... make design accordingly and add the calender and planning cycle to all the pages"

**Action:**
- Unzipped and parsed `ghgh.xlsx`'s raw OOXML (workbook.xml → sheet name/rId mapping, sharedStrings.xml, per-sheet mergeCells) to extract "Overall FY27" and "Current Planning cycle" cleanly — required correctly accounting for merged Plan Name cells and a workbook inconsistency (some cycles' plan-name text sits at the merge's anchor row, others sit in an unmerged row directly above the merge); re-verified with a corrected second parse before trusting any of it. Excluded the visible "Sheet4" tab and 2 hidden sheets (out of scope per the request), and a disconnected 2-row scratch table (`Utilization/Outage/ESG/HES`) that didn't fit the planning-cycle narrative.
- Read the supplied Fiscal Calendar image directly to transcribe its exact structure (4-4-5 week pattern, Sat-Fri columns, QWKS/WKS numbering) and its 19 SCO/Holiday/Pay Date annotated dates — cross-checked the holidays against real US observed dates (Memorial Day, Independence Day observed, Labor Day, Thanksgiving + day after, a Dec 21-25 shutdown week, New Year's Day) as a sanity check, all matched.
- Asked 3 clarifying questions before building anything global: sidebar placement mechanism (rail + inline-expanding panel vs. modal vs. new page — chose **collapsed sidebar, expands inline**), DB/OSP track presentation (side-by-side vs. **toggle** — chose toggle), and how Overall FY27 relates to Current Planning Cycle (**two tabs in one panel** — chose this).
- Built `src/data/planningCalendarData.js`: `FISCAL_CALENDAR` generated programmatically from one anchor date + the 4-4-5 pattern (not hardcoded day-by-day) with the 19 real annotated dates layered on top; Planning Cycle data as `OVERALL_DB_CYCLES`/`OVERALL_OSP_CYCLES`/`CURRENT_CYCLE`, using shared week-templates (`DB_WEEK_TEMPLATE`, `OSP_Q_TEMPLATE`) since the source Excel genuinely repeats near-identical 6-week templates per cycle, applied with real per-cycle overrides rather than hand-duplicating the same text 5+ times.
- Built `PlanningSidebar.jsx` (46px collapsed icon rail → 360px inline-expanding panel, mounted once in `App.jsx` outside the page conditionals so it's on every page and keeps its state across navigation), `FiscalCalendarView.jsx` (reflows the source image's wide 4-quarters-across layout into a single scrollable column to fit the sidebar, same SCO/Holiday/Pay Date color coding), and `PlanningCycleView.jsx` (Full Year / Current Cycle tabs; Full Year has a DB/OSP `BinaryToggle` over collapsible per-cycle week accordions; Current Cycle shows SR Model (DB+OSP) and Contacts Model (DB only, per the source) from the workbook's second sheet).
- Verified with a Node smoke test of the data file (52 weeks, all 19 annotations land on the right dates, April Plan's weeks match the Excel exactly) and `npm run build` (clean, 1178 modules). Caught and fixed a real layout bug during the build: the sidebar's sticky box used a fixed `height: 100vh`, which would have reserved dead scroll space below the header on every page since a `position: sticky` element's box still counts toward document height even once stuck — switched to `maxHeight: 100vh`.
- Started the dev server and opened it in the user's browser; this environment has no browser-automation tool, so the sidebar's expand/collapse interaction and the reflowed calendar layout weren't visually click-tested by the agent itself — flagged as a follow-up to verify manually.
- Updated `handoff.md`, `tech_spec.md` (added the new Data Model section + fixed stale SLO references left over from the 2026-07-23 removal that hadn't been updated in this file yet), `design_choice.md`; committed and pushed to `main`.

---

## Prompt 45 — 2026-07-27
**Input:** "C:\Users\hrishikesh.yadav\Downloads\Hoilday.xlsx also add this holiday calender"

**Action:**
- Unzipped and parsed `Hoilday.xlsx` (single sheet, 801 rows: Fiscal Quarter/Fiscal Month/Week no./Day of the week/Holiday Date/Name of the Holiday/Country/SubRegion/Region) — a real global holiday list for FY27: 800 holidays (after excluding 1 out-of-range row), 53 countries, 3 regions (AMER/APJ/EMEA).
- Verified the source's own fiscal-month labels (`2027M01`..`2027M12`) line up exactly with this app's existing `FISCAL_CALENDAR` month boundaries (e.g. February's holidays run through Feb 27, matching that fiscal month's own last week) before trusting them for the month-name mapping used to group the view.
- Excluded 1 row (Spain's "All Saints' Day (in lieu)", 2027-11-02, labeled `2028Q04`) — it falls after FY27's own end date (Jan 29, 2027), out of scope for a view framed around FY27.
- Generated `src/data/holidayCalendarData.js` (`HOLIDAYS` × 800, `HOLIDAY_REGIONS`, `HOLIDAY_COUNTRIES`) from the parsed workbook rather than hand-typing, and verified it imports cleanly under Node before building UI on top of it.
- Built `HolidayCalendarView.jsx` — a third sidebar section (🌍 Holiday Calendar, alongside 📅 Fiscal Calendar and 🗓 Planning Cycle) with a Region pill filter and a searchable Country multi-select (reusing the existing `MultiSelectField.jsx` rather than building a new filter component), results grouped into collapsible per-month accordions — necessary given 800 rows would be unusable as a flat list.
- Wired the new section into `PlanningSidebar.jsx`. Verified with `npm run build` (clean, 1180 modules, up from 1178).
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md`; committed and pushed to `main`.

---

## Prompt 46 — 2026-07-27
**Input:** "Now do one change - Rename TSG to ISG and MSG TO ESG and TSA to HES ..JUST remove the fullform like Enterprise service group and high end storage whereever mentioned."

**Action:**
- Grepped the whole `src/` tree for every TSG/MSG/TSA/"Enterprise Service Group"/"High End Storage" occurrence and categorized each one before touching anything: genuine user-facing text (headers, titles, badges, modal titles, tile labels) vs. code comments vs. real supplied data that happens to contain the old acronyms as a substring.
- Renamed every user-facing occurrence: `index.html`'s `<title>`, the header title/subtitle/home-button labels, the landing page's heading + tile labels/descriptions, business badges, the footer, the sub-page toggle labels (ESG/HES Forecasting/Capacity Plan), the HES Total Queues card's modal title + info description, and the illustrative (currently unused) `BUSINESS_ORGS` filter list. `fullName` fields (`Enterprise Service Group`/`High End Storage`) were deleted entirely along with their rendering, not swapped for new full names, per direct request.
- Deliberately left unchanged: every internal code identifier (`MsgCapacityPage.jsx`, `tsaCapacity/` folder, `TSA_ACTIVE_QUEUES`, etc.) and code comment — renaming those would be a much larger architecture refactor than a branding change, and they're invisible to anyone using the app. Also left untouched: `tsaData.js`'s `LOB_LIST`/`LOB_QUEUES['High End Storage']` (a real supplied LOB name, not branding) and `mockData.js`'s `INACTIVE_QUEUE_NAMES` entries like "Brazil MSG CTE" (real supplied queue names containing "MSG" as a coincidental substring) — both are real business-supplied data this app has always preserved exactly as given.
- Verified with `npm run build` (clean, 1180 modules) and a direct search of the built JS bundle (not just source) for every old branding string — confirmed the only remaining "High End Storage" occurrences are the real LOB data noted above.
- Updated `handoff.md`, `tech_spec.md` (added a naming note to the Overview clarifying the doc's own prose and internal code still say MSG/TSA), `design_choice.md`; committed and pushed to `main`.

---

## Prompt 47 — 2026-07-27
**Input:** "Also in ESG Forecasting rename the geo map from Global adherence map to Global Forecast Accuracy Heatmap."

**Action:**
- `Layer3GeoMap.jsx`: renamed the centered map title from "Global Adherence Heatmap" to "Global Forecast Accuracy Heatmap" — left the layer subtitle, RCA/CLCA copy, and info-button description as-is (all still reference "adherence," the metric's real name in the data model); only the one title line was asked for.
- Verified with `npm run build` (clean, 1180 modules).
- Updated `handoff.md`; committed and pushed to `main`.

---

## Prompt 48 — 2026-07-27
**Input:** Large multi-part request: (1) every graph should show a popup like the cards do, but with a real table inside (e.g. for a plan comparison, what factors contributed — holidays, etc.); don't do this for geo maps. (2) "Top Queues by Variance" should show a table of queues tiered high/moderate/low variance, with a reason for each. (3) "Forecast Variance Distribution" — hovering a bucket % should instead show a table of which queues contributed what % to that bucket. (4) Before the Geo Map, add a "Queue Performance" table matching a supplied reference image (Queue/Name/Region/Forecast/Actual/Acc%/Status/RCA-CLCA columns), clicking RCA/CLCA gives details, filter-aware. (5) Rename "Global Forecast Accuracy Heatmap" to "Global Forecast Accuracy", remove the table beneath the map, and clicking a region should show that region's queues (actual/forecast/accuracy/status).

**Action:**
- Asked 3 clarifying questions before building anything: page scope (all 4 pages vs ESG Forecasting only — chose **all 4 pages** for the general table-popup pattern), whether the new tables live in the existing RCA/CLCA button or a new one (chose **enhance existing RCA/CLCA**), and the Geo Map's default state after removing its table (chose **auto-show the first/top region's queues**).
- Extended `GraphInsightButton` (`ChartKit.jsx`) with an optional `table` prop (`{title?, columns, rows}`) rendered via a new shared `PopupTable` component — popup widens from 220px to 440px, gains click-outside-to-close. The shared `Visual` wrapper forwards `table` through.
- Built `src/data/insightFactors.js` — `contributingFactors()` (illustrative factors + a REAL holiday cross-reference when a real region is passed, using the Holiday Calendar data built earlier this same day; deliberately NOT cross-referenced by chart period, since this app's FY25/26/27 period labels are an independent illustrative system, not tied to the one real FY27 calendar), `varianceTier`/`varianceReason` (High/Moderate/Low tiers calibrated to this app's real ~0-8% variance range, for full-roster "Top Queues/LOBs by Variance" tables), and `bucketQueues`/`allBucketsQueues` (deterministically assigns queues to a distribution chart's buckets in the SAME proportions it already shows, since the illustrative bucket % is independent of any single queue's real variance and a literal filter would leave most buckets empty).
- Built ESG Forecasting directly (the page all the concrete examples came from): wired `table=` into all 6 Layer1/Layer2 charts; added `queuePerformance(filters, override)` to `mockData.js` (real per-queue Forecast/Actual/Accuracy%/Status, stable `Q-NNN` codes, worst-accuracy-first) and a new `QueuePerformanceTable.jsx` (matching the supplied reference image, purple RCA/CLCA pill per row) placed before the Geo Map; redesigned `Layer3GeoMap.jsx` (title shortened to "Global Forecast Accuracy", old summary table removed, replaced by a click-region/sub-region queue table defaulting to the first in-scope region).
- Dispatched 3 parallel background agents to apply the same table-popup pattern to ESG Capacity Plan, HES Forecasting, and HES Capacity Plan (NOT the Queue Performance table or Geo Map redesign — scoped to ESG Forecasting only, since those were Forecasting-shaped specifics, not part of the general pattern). Two agents independently discovered a real bug — the shared `Visual` never actually forwarded `table` to `GraphInsightButton` — one fixed it directly in `ChartKit.jsx`; the third (told not to touch shared files) worked around it with local per-file `Visual` shadow copies, which were then removed and reverted to the shared import once the real fix was confirmed in place, avoiding a silent future divergence.
- Verified with `npm run build` (clean, 1182 modules) after all agents' work landed, plus a `queuePerformance()` Node smoke test (47 unique codes, region/sub-region overrides both work) before wiring it into components.
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md`; committed and pushed to `main`.

---

## Prompt 49 — 2026-07-27
**Input:** Four-part correction: (1) the detail-table popup should open on clicking the graph, not the RCA/CLCA "i" button — RCA/CLCA stays RCA/CLCA-only; scoped to visuals only. (2) Geo Map — remove the table beneath it; hovering a region should show its queues as a popup, not a table that pushes content down. (3) [reference image of the Queue Performance table] remove the Queue column, rename "Name" to "CQN", add a sort option based on accuracy, and the table should respond to the View By filters too. (4) Remove the table beneath each geo map across all 4 pages.

**Action:**
- Reverted `GraphInsightButton` (`ChartKit.jsx`) to pure RCA/CLCA (removed its brief `table` prop). Moved the table/modal behavior into the shared `Visual` component itself: clicking the chart's TITLE (not any button) opens a `Modal` (the same shared one KPI card drill-downs use) containing `PopupTable`. Title was chosen deliberately as the one click target that can't collide with a chart's own bar-click-drill behavior or its Plan/toggle controls — the click handler explicitly ignores clicks on nested `<button>`s. Since ~26 chart files already just pass `table={...}` to `<Visual>`, this required editing only 3 places: the shared `Visual` plus the two local `Visual` copies in `Layer1PlanOverPlan.jsx`/`Layer2ActualVsPlan.jsx` — no changes to any individual chart file.
- `Layer3GeoMap.jsx`: removed the "queues below the map" table added earlier the same day; hovering a region/sub-region now shows its queues in the same floating popup that already showed accuracy% on hover. Added a `granularity` prop, threaded into `queuePerformance()`.
- `mockData.js`'s `queuePerformance()` gained a `granularity` parameter — each queue's flat forecast/actual is expanded across Quarter/Month/Week via the same wobble mechanism used everywhere else in the app. Noted and documented (not silently shipped) that Accuracy%/Status stay constant across granularity by construction, since both sides of that ratio share the same wobble — same limitation already documented elsewhere in this app for ratio metrics.
- `QueuePerformanceTable.jsx`: removed the Queue (Q-NNN) column from display, renamed "Name" to "CQN" (this app's own real term, matching `cqnPlanVariance`/`cqnActualVariance`'s existing field name), made the Acc% header clickable to toggle ascending/descending sort, and passed `granularity` through.
- Removed the summary table beneath all 3 remaining pages' geo maps (`MsgCapacityGeoMap.jsx`, `TsaGeoMap.jsx`, `TsaCapacityGeoMap.jsx`) — their own existing hover tooltips (name + value) were left untouched; no hover-queue-table was added there since those pages don't have ESG Forecasting's per-queue forecast-accuracy data model.
- Verified with `npm run build` (clean, 1182 modules), a grep sweep confirming no stray `GraphInsightButton`+`table` usage or leftover geo-map summary-table markup anywhere, and a Node smoke test of granularity-aware `queuePerformance()` (Forecast/Actual scale down correctly per period; Accuracy confirmed constant, matching the documented limitation).
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md`; committed and pushed to `main`.

---

## Prompt 50 — 2026-07-27
**Input:** For ESG Capacity Plan: (1) [image of "Headcount Impact on SL" with an always-visible "Over-plan queues still below 90% SL" list baked into the card] show that as a table on click instead of an extended version permanently in the graph — replace whatever click-popup already exists on that graph with this table. (2) [image confirming the list content] (3) [image of "Utilization Defaulter Queues"] rename it to something else. Also add a queue performance table showing actual vs plan with variance, using numbers similar to what's already used for other graphs on this same page.

**Action:**
- `HeadcountLayer.jsx` Visual3 ("Headcount Impact on SL"): removed the "Over-plan queues still below 90% SL" list from its permanent, always-rendered spot under the chart. It now lives entirely in the click-the-title detail table, replacing the generic `contributingFactors`-based table this chart had briefly gotten — the defaulter list is this chart's own real, concrete detail, so a second, less specific table alongside it was redundant. The table now shows the full roster (not just the top 6 the inline version was capped at).
- `UtilizationLayer.jsx`: renamed "Utilization Defaulter Queues" to **"Utilization Gap Queues"** — the request didn't specify a replacement name, so picked a neutral term matching the chart's own subtitle ("Worst utilization gap first") and dropping "Defaulter"'s blame-oriented framing; flagged clearly as an inferred choice.
- Added `queueHeadcountPerformance(filters, planSelection)` to `msgCapacityData.js` — real per-queue Actual vs Plan headcount + variance, reusing the exact `planHC`/`actualHC` fields `slDefaulterQueues` already computes from `CAPACITY_QUEUES` (not new data). Built `msgCapacity/QueuePerformanceTable.jsx` (placed above the Geo Map, same convention as ESG Forecasting's own Queue Performance table) with its own independent Plan dropdown, a clickable Variance column for sort, and the SAME `varianceTier`/`varianceReason` treatment already used by this page's other ranked-queue charts ("Queues with Highest Variation," the renamed "Utilization Gap Queues") rather than ESG Forecasting's accuracy-based Good/Fair/Poor status — per "take numbers similar to what we took for other graphs in same capacity page."
- Verified with `npm run build` (clean, 1183 modules) and a Node smoke test of `queueHeadcountPerformance()` confirming realistic per-queue variance values and that its Plan dropdown genuinely rescales `planHC`.
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md`; committed and pushed to `main`.

---

## Prompt 51 — 2026-07-28
**Input:** For HES Capacity: [image of "03 WORKLOAD DISTRIBUTION" with the Sankey and "Average Case Time Variance" side by side] remove the Average Case Time graph and add a graph named "Workload Impact on Headcount" — SR as a column, Workload Actual and Plan as lines, Headcount as a line on the secondary axis. Make SR/Workload/Headcount values similar in scale to other graphs on this page. X-axis should show CQN, reusing the CQNs from the Workload Distribution graph — when a LOB is selected in the filters, the graph should show that LOB's respective CQNs. Add a relevant click-popup for these metrics.

**Action:**
- Removed `WorkloadDistributionLayer.jsx` Visual2 ("Average Case Time Variance" — bars + adherence line + defaulter list) entirely; removed the now-dead `actHrsDefaulterLobs` selector from `tsaCapacityData.js` (its only consumer). `actHrsByFY` itself was left untouched — still used by this page's own Avg Case Time metric card.
- Built a new `workloadImpactOnHeadcount(filters, cap=8)` selector: SR scaled off `tsaData.js`'s existing `SR_BY_FY` plan ÷ total active queues; Workload Actual/Plan and Headcount each a deterministic per-queue sub-share of their assigned LOB's own `TSA_CAPACITY_LOBS` fields (`workloadPlan`/`workloadActual`, `popPlan1`) — no invented scale, per "make values similar to volume we used in other graphs."
- X-axis uses real CQNs from `TSA_ACTIVE_QUEUE_NAMES` (the same roster the adjacent Sankey's CQN mode already draws from). Since no real queue-to-LOB mapping exists in this app (only "High End Storage" has a real per-queue roster), added `CQN_LOB_ASSIGNMENTS` — each real queue assigned to a `LOB_LIST` entry round-robin by index, same illustrative-structure convention `LOB_FACTS` already uses for businessPartner/globalGrouping — and `cqnsForFilters()`, which narrows that assignment through this page's existing `filterLobs(filters)`. Selecting a LOB now genuinely narrows the chart to that LOB's real CQNs.
- New "Workload Impact on Headcount" `ComposedChart`: SR bar (`metric1`), Workload Actual/Plan solid/dashed line pair sharing `metric2` (reusing an existing dual-line convention from `TsaCapacityMetricCards.jsx` rather than introducing a 4th categorical color, since `ahead`/`behind` are reserved status colors), Headcount line on the secondary axis (`trend`) — no new color introduced. A custom `CqnTick` truncates the long real queue names on the X-axis (`CategoryTick` is built for Y-axis category labels, not a fit here).
- Wired the click-title popup (existing shared `Visual`/`table` convention) with columns CQN/LOB/SR/Workload Actual/Workload Plan/Headcount, calling the selector with `cap=999` for the full in-scope roster.
- Verified with `npm run build` (clean, 1183 modules) and a Node smoke test of `workloadImpactOnHeadcount()`: unfiltered returns 8 CQNs spread across different LOBs; `lob: ['High End Storage']` narrows to 3 real "High End Storage" queues; `lob: ['BackupWave']` narrows to 3 different real queues — confirming genuine LOB-aware filtering with realistic values.
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md`; committed and pushed to `main`.

---

## Prompt 52 — 2026-07-28
**Input:** Also all the geo map in all the tabs have the visual cut at the top..please fix that

**Action:**
- Traced the root cause rather than guessing: all 4 Geo Maps (`Layer3GeoMap.jsx`, `MsgCapacityGeoMap.jsx`, `TsaGeoMap.jsx`, `TsaCapacityGeoMap.jsx`) share the identical `<ComposableMap projectionConfig={{ scale: 140, center: [10, 20] }}>` on react-simple-maps' fixed 800×600 SVG viewBox (independent of each map's own container `height: 380` CSS — that wasn't the culprit). Ran the actual `d3-geo` Mercator projection this app already depends on through a Node script at real latitudes and confirmed anything north of ~80°N (Greenland's tip, Svalbard, the northern edges of Canada/Russia/Scandinavia) projected to a negative y-coordinate, silently clipped by the SVG viewBox — a flat cut across the top of every map.
- Changed `projectionConfig` to `{ scale: 100, center: [10, 0] }` in all 4 files — both the scale reduction and the center-latitude shift (20°N → equator) were needed together, not either alone, to redistribute the fixed vertical budget so it covers up to ~84°N with margin while the (already-fine) southern edge keeps comfortable clearance too. Re-verified numerically: Greenland (83.6°N) moved from y≈-54 (clipped) to y≈12 (visible); Svalbard (80°N) from y≈9 to y≈56; mainland Russia/Canada (75°N) to y≈97; Tierra del Fuego (-56°) still comfortably at y≈419.
- Verified with `npm run build` (clean, 1183 modules).
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md`; committed and pushed to `main`.

---

## Prompt 53 — 2026-07-28
**Input:** Also remove the utilization variance graph from HES capacity planning and use the space to accomodate remaining two graphs

**Action:**
- Removed `HeadcountAttritionLayer.jsx` (tsaCapacity) Visual3 "Utilization Variance" entirely, along with its now-dead `tsaUtilByFY`/`TSA_UTIL_BY_FY` selector in `tsaCapacityData.js` (Visual3 was their only consumer).
- No layout code needed to "use the space" — every `Visual` panel already carries `flex-1` in a plain flexbox row, so the remaining "Actual vs Plan Variation" and "Attrition" visuals automatically expand into the freed width, same mechanic already established when `WorkloadDistributionLayer`'s own Visual3 was removed 2026-07-23.
- Renamed the layer "Headcount and Utilization" → "Headcount and Attrition" (subtitle updated to match) since Utilization Variance was this layer's only utilization content — a direct, minimal consequence of the removal, not a separately requested change.
- Verified with `npm run build` (clean, 1183 modules) and a grep sweep confirming no remaining reference to `tsaUtilByFY`/`TSA_UTIL_BY_FY`/"Utilization Variance" anywhere in the codebase.
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md`; committed and pushed to `main`.

---

## Prompt 54 — 2026-07-28
**Input:** Also for the Geo Map in HES Forecasting and HES Capacity the color coding is same for all the region like its showing green and blue ..make it similar what we did for ESG Forecasting

**Action:**
- Traced both root causes with real numbers before changing anything. HES Forecasting's `geoAdherenceByRegion` (`tsaData.js`) averaged a modulo-30 per-LOB formula across all 33 LOBs — a complete residue cycle, so every region's average converged to the same ~79-80 regardless of region (verified with a Node script: all 5 regions within 1 point of each other). HES Capacity's `geoHeadcountByRegion`/`geoHeadcountBySubRegion` (`tsaCapacityData.js`) reshape a headcount split driven by round-robin LOB→region/sub-region tagging (33 LOBs over 5 regions ≈ 18-21% share each; over 24 sub-regions ≈ 1-2 LOBs each) — too even for the map's relative-to-peak color bands to ever surface more than green/blue. Neither was a color-threshold bug, both were genuinely too little underlying spread.
- HES Forecasting fix: added `REGION_ADHERENCE_BASE` (`{ NAMER: 94, APJ: 86, EMEA: 75, LATAM: 63, Global: 80 }`), mirroring ESG Forecasting's own curated `GEO_REGION_DATA` table — per-LOB values still vary ±15 around each region's base (clamped 50-99) so a LOB filter still moves the number.
- HES Capacity fix: added `geoHeadcountEmphasis(key)` — a deterministic, verified well-spread multiplier (0.25-1.6, salted hash) layered on top of the real share-weighted headcount, scoped to ONLY `geoHeadcountByRegion`/`geoHeadcountBySubRegion` (grep-confirmed these are the only consumers, so Attrition/Plan-over-Plan's own headcount numbers for the same keys are untouched).
- Verified by running the actual selectors through the real `acColor`/`hcColor` tier functions (not hand-derived): all 4 real map regions (APJ/EMEA/LATAM/NAMER) now land in 4 different color tiers on both pages, and HES Capacity's ~22 real map sub-regions span all 4 tiers too. Re-verified LOB-filtered scenarios still narrow/rescale correctly.
- Verified with `npm run build` (clean, 1183 modules).
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md`; committed and pushed to `main`.

---

## Prompt 55 — 2026-07-28
**Input:** [image of the "Worldwide Headcount Heatmap" legend row showing "≥ 75% of peak Highest / 50–75% of peak High / 25–50% of peak Moderate / < 25% of peak Lowest"] also remove this of peak highest and all ..make it similar to other Geo Map

**Action:**
- Reworded `TsaCapacityGeoMap.jsx`'s legend to "≥ 75% Excellent / 50–75% Good / 25–50% Fair / < 25% Critical" — same "X% Word" style and adjectives the other 3 Geo Maps already use, dropping the "of peak Highest/High/Moderate/Lowest" phrasing.
- Kept the underlying 75/50/25% thresholds unchanged — those are a % of the current view's own peak headcount (a relative scale, since headcount is a raw count, not a 0-100 rate), not the other maps' 90/80/70% of an absolute rate; copying those numbers over would have silently undone the color-spread fix from earlier the same day. The relative basis is still explained via this chart's own InfoButton text, just no longer spelled out in the legend row.
- Verified with `npm run build` (clean, 1183 modules).
- Updated `handoff.md`, `design_choice.md`; committed and pushed to `main`.

---

## Prompt 56 — 2026-07-29
**Input:** [image of the landing page showing a left sidebar with Fiscal Calendar/Planning Cycle/Holiday Calendar icons] remove the fiscal calender,planning cycle and holiday calender from the landing page

**Action:**
- `App.jsx`: `<PlanningSidebar />` (the 3-icon rail — Fiscal Calendar/Planning Cycle/Holiday Calendar) now renders only when `view !== 'landing'`, instead of unconditionally for every view. Still mounted once outside the page conditionals (not duplicated per business page), so its expand/collapse state keeps surviving switches between ESG/HES and Forecasting/Capacity Plan — only the landing tile screen itself no longer shows it.
- Verified with `npm run build` (clean, 1183 modules).
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md`; committed and pushed to `main`.

---

## Prompt 57 — 2026-07-29
**Input:** [4 reference screenshots of real BI-style tables: "ASU (Actuals vs Plan)", "SR (Actual vs Plan Comparison)", "ACT (Actual vs Plan Comparison)", "Workload (Actual vs Plan Comparison)" — each a Fiscal-Quarter-grouped LOB × Actual/Plan/Adherence% matrix] Add tables above the Geo Map on both HES Forecasting and HES Capacity: (1) HES Forecasting — image #12 named "ASU Performance", image #13 named "SR Performance", unified via a toggle (switching ASU↔SR shows the respective fields), with a shared Plan Name dropdown for both toggle positions, adjusted accordingly, plus an RCA/CLCA column at the end with its own pop-up. (2) HES Capacity — same toggle/table pattern: image #14 named "Workload Performance", image #15 named "ACT Performance", same RCA/CLCA column + pop-up.

**Action:**
- Built a new shared `PerformanceMatrixTable.jsx` — a generic LOB × Fiscal-Quarter matrix (2-row header, quarter groups spanning 3 sub-columns via colSpan/rowSpan: Actual/Plan/Adherence%), a `BinaryToggle` swapping which metric shows (retitles the table), a shared `PlanSelect` "Plan Name" dropdown, and a purple RCA/CLCA pill per row (same convention `msgCapacity/QueuePerformanceTable.jsx` already established) opening a `contributingFactors`-backed `PopupTable`. No numbered layer badge, sits above the Geo Map — same precedent `QueuePerformanceTable.jsx` already set on ESG Capacity.
- Deliberately reused each page's own existing `LOB_LIST`/`filterLobs` roster for rows rather than the literal product names visible in the 4 screenshots (APEX, AVAMAR, AZURE, CENTERA, CLARIION, COMPELLENT, CONNECTRIX, DATADOMAIN, etc.) — those read as a real BI export used as a structural/layout reference, and introducing a disconnected new name-space would break this page's "every visual shares one filter-integrated LOB roster" convention. Flagged explicitly in `design_choice.md` as a consequential interpretation call.
- HES Forecasting: new `asuSrPerformanceByLob(filters, metric, planName)` in `tsaData.js` — each in-scope LOB takes a deterministic share of `asuByFY`/`srByFY`'s own quarter-level total, so rows sum back to the real page total (verified: 3,883 vs 3,882, a 1-unit rounding gap). New `planPerformanceScale()` makes the Plan Name dropdown genuinely functional — deliberately not reusing `AsuLayer`/`SrLayer` Visual1's own documented-cosmetic Plan dropdown. Wrapped in `tsa/AsuSrPerformanceTable.jsx`, wired into `TsaForecastingPage.jsx` above `TsaGeoMap`.
- HES Capacity: new `workloadActPerformanceByLob(filters, metric, planName)` in `tsaCapacityData.js` — expands each in-scope LOB's own existing flat `workloadPlan`/`workloadActual`/`actHrsPlan`/`actHrsActual` baseline into a 3-FY series then to quarters (additive for Workload, rate-preserving for ACT), since there's no page-level FY total to share-weight from here (unlike the Forecasting side). Plan Name dropdown reuses this page's own real `PLAN_SCALE_BY_NAME`. Wrapped in `tsaCapacity/WorkloadActPerformanceTable.jsx`, wired into `TsaCapacityPage.jsx` above `TsaCapacityGeoMap`.
- Reconciled a likely mix-up in the request: image #14 was paired with "Workload Performance" and #15 with "ACT Performance," but the images' own headers say the reverse. Built each name against its own already-established metric fields rather than image order — both templates are structurally identical, so this only affects which image number a name was nominally attached to.
- Verified with `npm run build` (clean, 1186 modules, 3 new files) and Node smoke tests of both new selectors: row/quarter counts, single-LOB and fiscal-year filter narrowing, ACT's rate-preserving values, and the ASU sum-back-to-page-total check.
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md`; committed and pushed to `main`.

---

## Prompt 58 — 2026-07-29
**Input:** [image of the ASU Performance table showing vertical dividers only at quarter-group boundaries and the LOB column, none between the Actual/Plan/Adherence% sub-columns] apply vertical borders as well..for all the 4 tables

**Action:**
- `PerformanceMatrixTable.jsx`'s shared `SUBHEAD_STYLE`/`DATA_CELL` gained a `borderRight`, and the RCA/CLCA body cell gained a matching `borderLeft`, giving every column a vertical divider (not just quarter-group boundaries and the LOB column). Since this is the one shared component behind all 4 tables, the single change applies to ASU Performance, SR Performance, Workload Performance, and ACT Performance at once.
- Verified with `npm run build` (clean).
- Updated `handoff.md`; committed and pushed to `main`.

---

## Prompt 59 — 2026-07-29
**Input:** [image of the ASU Performance table, scrolled down, showing ghosted numbers ("51 58 87.9%...") overlapping the "FY26 Q1"/"FY26 Q2" sticky quarter header] Also while scrolling up the upward numbers are visible on the column headers and causing hinderance in the visibility please fix that for all the 4 tables

**Action:**
- Root-caused: `PerformanceMatrixTable.jsx`'s quarter-group header cells used `background: 'var(--accent-dim)'` — a translucent `rgba()` tint (`rgba(56,189,248,0.12)` dark / `rgba(2,132,199,0.09)` light), not an opaque color. Since the `<thead>` is `position: sticky`, scrolled-past body rows sat directly behind the header and showed through it as the user scrolled — exactly matching the reported ghosting.
- Fixed by layering the same `--accent-dim` tint over an opaque `--bg-panel` backdrop (`linear-gradient(var(--accent-dim), var(--accent-dim)), var(--bg-panel)`) — same visual color, now fully opaque. Confirmed the LOB/RCA header cells (`--bg-panel`) and the Actual/Plan/Adherence% sub-header row (`--bg-inset`) were already solid hex colors, so they didn't have this bug.
- Single shared component behind all 4 tables, so the one fix applies to ASU Performance, SR Performance, Workload Performance, and ACT Performance at once.
- Verified with `npm run build` (clean).
- Updated `handoff.md`, `design_choice.md`; committed and pushed to `main`.

---

## Prompt 60 — 2026-07-29
**Input:** Also can you freeze the LOB column for all the tables

**Action:**
- `PerformanceMatrixTable.jsx`: the LOB column's header cell and every body row's LOB cell are now `position: sticky, left: 0` (`zIndex: 4` on the header so it also stays above the vertically-sticky quarter header at the top-left corner; `zIndex: 1` on body cells so they stay above the scrolling data columns) — a standard "frozen first column" behavior, stacking with the already-sticky header.
- Single shared component behind all 4 tables, so the fix applies to ASU Performance, SR Performance, Workload Performance, and ACT Performance at once.
- Verified with `npm run build` (clean).
- Updated `handoff.md`; committed and pushed to `main`.

---

## Prompt 61 — 2026-07-29
**Input:** [image of the "UCR Impact on SR" chart showing its "PLAN" label/dropdown crowding the title's info button] for UCR Impact on SR graph you can bring the visual little down as plan name drop down looks clumsy..make it more readbale

**Action:**
- `AsuSrTrendLayer.jsx` Visual2 ("UCR Impact on SR"): moved its `PlanSelect` from `cornerControls` (absolutely positioned, no reserved space — meant for narrow controls like a `BinaryToggle`) to `controls` (normal flow, centered below the title/subtitle). This page's own sibling charts (`AsuLayer`/`SrLayer` Visual1) already use `controls` for their Plan Name picker — `cornerControls` on this one chart was the inconsistency, not the intended pattern.
- Verified with `npm run build` (clean).
- Updated `handoff.md`, `design_choice.md`; committed and pushed to `main`.

---

## Prompt 62 — 2026-07-29
**Input:** For HES forecasting geo map - give option to select Plan name as well and upon hover over a particular region it should show the region's LOB'S with actual and plan volume along with adherence. Same for HES capacity plan - it should show actual and planned headcount along with variation.

**Action:**
- `TsaGeoMap.jsx` (HES Forecasting): added an ASU/SR `BinaryToggle` (inferred addition — "volume" is ambiguous between this page's two established metrics, and defaulting silently to one felt riskier than reusing the toggle pattern the adjacent ASU/SR Performance table already established) and a "Plan Name" `PlanSelect`, both in a new flex controls row (also moved the previously absolutely-positioned `GraphInsightButton` into this same row, avoiding the exact overlap bug just fixed on "UCR Impact on SR"). Hovering a region now shows a scrollable per-LOB list (Actual/Plan/Adherence%) beneath the existing accuracy%. New `geoLobPerformanceByRegion(region, filters, metric, planName)` in `tsaData.js` reuses `asuSrPerformanceByLob` directly, collapsed to the latest in-scope quarter. Added `LOB_REGION_ASSIGNMENTS` (round-robin over the 4 real map regions) since no real LOB-to-region mapping exists — verified it partitions all 33 LOBs cleanly.
- `TsaCapacityGeoMap.jsx` (HES Capacity): added a "Plan Name" `PlanSelect` next to the existing Region/Sub-region toggle. Hovering now shows a scrollable per-LOB list (Actual/Planned headcount + variance %). New `geoLobHeadcountByRegion`/`geoLobHeadcountBySubRegion` in `tsaCapacityData.js` — a deterministic per-LOB share of the Staffing Summary card's own `FTE_BY_FY` total (weight computed over ALL in-scope LOBs so shares are genuine fractions of the real grand total — verified: summed to exactly 480 against `FTE_BY_FY`'s FY27 actual). Added `isRegionKey` tracking to the hover handler (same pattern `Layer3GeoMap.jsx` already uses) so the popup calls the right selector for a real sub-region vs a fallback parent-region.
- Verified with `npm run build` (clean, 1186 modules) and Node smoke tests of both new selectors: region/sub-region partition and lookup correctness, Plan Name genuinely rescaling the Plan/Planned column, and both sum-back-to-real-total checks passing.
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md`; committed and pushed to `main`.

---

## Prompt 63 — 2026-07-29
**Input:** also change the color coding as we select each plan

**Action:**
- Root issue: after adding the Plan Name dropdown, selecting a different plan changed both maps' hover popup numbers but left the map's OWN fill colors completely static, since the choropleth coloring was on an entirely Plan-blind metric on both pages.
- `TsaGeoMap.jsx`/`tsaData.js`: `geoAdherenceByRegion` now takes `(filters, metric, planName)` and colors by real ASU/SR adherence-to-plan (aggregating `geoLobPerformanceByRegion` per region), replacing the old synthetic per-region adherence unrelated to either metric.
- `TsaCapacityGeoMap.jsx`/`tsaCapacityData.js`: `geoHeadcountByRegion`/`geoHeadcountBySubRegion` now take `planName` and return `{region/subRegion, headcount, adherence}`, coloring by Headcount Adherence % instead of raw headcount level relative to the current view's peak. Since adherence is a genuine 0-100% rate, switched from relative-to-peak color bands to the same fixed 90/80/70 thresholds every other Geo Map already uses — legend, bottom-corner scale, and hover headline all updated to match.
- Discovered mid-build (verified with real numbers) that both underlying per-LOB selectors give every LOB an identical actual/plan ratio by design (so their totals reconcile to the real page total) — aggregating that straight into map colors would have shown almost every region the same color, the same class of bug already fixed twice this week. Added map-color-ONLY deterministic wobble functions (`geoAdherenceWobble`, `geoHeadcountAdherenceWobble`) on top, leaving the hover popup's own reconciling Actual/Plan/Adherence numbers untouched.
- Verified with `npm run build` (clean, 1186 modules) and Node smoke tests confirming both maps' colors now genuinely shift when Plan Name changes, with real color variety across regions within a single plan selection.
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md`; committed and pushed to `main`.

---

## Prompt 64 — 2026-07-30
**Input:** For ESG Forecasting and HES Forecasting - remove the Inactive queues from the total queues card - show only active queues. Also for Service request card- show the YTD performance split for DB and OSP AS WELL currently its showing 18.6% but it doesnt give the bifurcation of DB and OSP % change for YTd. Also give the multi select option in all the dropdown we have given for the graphs, currently its giving us on only 1 option to select. (Follow-up clarification, with a screenshot of "Actuals vs Plan Comparison": instead of a pre-picked default, rename the dropdown "Select Plan," list all plans with a checkbox at the start of each, so selecting a plan shows that plan's values for the period in scope.)

**Action:**
- **Total Queues card, both pages**: `MetricCards.jsx`/`TsaMetricCards.jsx` now show just the active count — dropped the "N inactive queues" sub-line and "active/total" value format. Neither drill-down modal touched (HES's directory already only listed active queues; ESG's fuller "Queue Directory — Active & Inactive" was left as a separate, deliberately-scoped feature).
- **Service Requests card YTD bifurcation**: root-caused why the DB/OSP split wasn't meaningful — `srDbOspByFY` used a FIXED 70/30 ratio of the same total, so DB's/OSP's own YoY% were mathematically identical to the combined % (verified: all three at 7.8% on a sample year). Changed to a per-period VARYING share (~62-74%), giving genuinely independent DB/OSP trajectories while still summing to the same combined actual. New `srChannelYtdSub()` renders "YTD FY27: DB ▲17.2% · OSP ▼5.5%" in place of the old single %.
- **Multi-select Plan Name dropdowns, app-wide**: converted `ChartKit.jsx`'s `PlanSelect` into a thin wrapper around the same `MultiSelectField` the filter panel already uses (added an `emptyLabel` prop, default `'All'`, overridden to `'Select Plan'` here), matching the requested checkbox-per-option UI exactly. Rolled out across all 16 call sites in 13 files: full multi-series rendering (one extra Plan/Target bar per selected plan, Adherence line drops at 2+) on every period-trend chart (`AsuLayer`/`SrLayer` Visual1 built first as the reference implementation, `HeadcountLayer` Visual1/3, `UtilizationLayer` Visual1, `HeadcountAttritionLayer` Visual1, `AsuSrTrendLayer`'s "UCR Impact on SR", ESG's `Layer2ActualVsPlan` Visual1); first-selected-plan-only for ranked lists/matrix tables/Geo Maps, where "N plans" has no single unambiguous rendering (documented per file). Along the way, closed 3 long-standing cosmetic gaps (`asuByFY`/`srByFY`, `hcStaffingByFY`, `srBotsByFY` — dropdowns that changed state but never touched the chart's numbers) by reusing each page's own existing plan-scale mechanism. New `planSeriesColor()` cycles `metric2`/`trend` with stepped opacity rather than introducing new hues or reusing reserved status colors.
- Verified with `npm run build` (clean, 1186 modules), a grep sweep confirming no remaining `PlanSelect` call site still passes a bare string, and Node smoke tests of `asuByFY`/`srBotsByFY`/`hcStaffingByFY` confirming genuine plan-driven rescaling.
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md`; committed, pushed to `main`, and deployed to GitHub Pages (`npm run deploy`).

---

## Prompt 65 — 2026-07-31
**Input:** give multiselect options for plan A and Plan B as well, wherever applicable across graphs

**Action:**
- Inventoried all `PlanDropdowns` (Plan A/Plan B) usages across 5 files — `AsuLayer.jsx`/`SrLayer.jsx` (Visual2/Visual3), `Layer1PlanOverPlan.jsx` (all 3 visuals, plus its own local `PlanDropdowns` duplicate), and both Capacity pages' `PlanOverPlanVariationLayer.jsx` — and confirmed which underlying selectors were cosmetic (ignored `planA`/`planB` entirely) vs already genuinely plan-reactive.
- `ChartKit.jsx`'s `PlanDropdowns` converted to two `MultiSelectField`s (`planA`/`planB` now arrays, `onChange(key, val)` signature unchanged) — same treatment as the prior day's `PlanSelect`. New `planVsPlanSeriesColor(index)` cycles all 3 non-status hues (`metric1`/`metric2`/`trend`, since a pure Plan A vs Plan B context has no competing "Actual" series reserving `metric1`), used across a single combined A-then-B series index.
- **Full multi-series rendering** (one extra Plan A-family/Plan B-family bar per selected plan, Variance % line only at exactly 1+1) on the charts whose entire purpose IS the comparison: `AsuLayer`/`SrLayer` Visual2, `Layer1PlanOverPlan` Visual1, and both Capacity pages' `MainChart`. Closed 2 more cosmetic gaps to make this real: `asuPlanVsPlanByFY`/`srPlanVsPlanByFY` (`tsaData.js`) and a new `planNameScale()` in `mockData.js` now rescale `plan1`/`plan2` independently per side via each page's existing scale mechanism. The Capacity pages' selectors were already genuinely plan-reactive — extracted one side at a time using a placeholder for the untouched slot (`PLAN_PLACEHOLDER` for TSA Capacity, whose selectors gate on both being non-null; plain `undefined` for MSG Capacity, whose selectors have no such gate).
- **First-selected-plan-only** on the sibling region/impact/ranked charts sharing those same widgets: `AsuLayer`/`SrLayer` Visual3, `Layer1PlanOverPlan` Visual2/3, and both Capacity pages' ranked variance charts (`LobVarianceChart`/`QueueVarianceChart`) — confirmed their underlying selectors stay static/illustrative, so only labels/tooltips needed array-safe fallbacks (`plansA[0] || 'Plan A'`, etc.).
- Removed `Layer1PlanOverPlan.jsx`'s local `PlanDropdowns` duplicate in favor of the shared, now-multi-select `ChartKit.jsx` one.
- Every `plans.planA`/`plans.planB` (or equivalent) state converted from a pre-picked string to an empty array, matching the established empty-selection convention.
- Verified with `npm run build` (clean, 1186 modules), a grep sweep confirming no remaining `PlanDropdowns` call site still passes a bare string, and Node smoke tests confirming `asuPlanVsPlanByFY`/`srPlanVsPlanByFY`/`planOverPlanByFY` now vary independently per side, and that both Capacity pages' region/sub-region key order stays stable across different `planA`/`planB` choices (needed for the safe key-based series merge).
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md`; committed and pushed to `main`.

---

## Prompt 66 — 2026-07-31
**Input:** change the layer name to - CPASU/UCR Trend *(screenshot of HES Forecasting Layer 03's header, "ASU/UCR IMPACT ON SR ANALYSIS — CPASU & UCR runrate")*

**Action:**
- `AsuSrTrendLayer.jsx`'s layer header text changed from "ASU/UCR Impact on SR Analysis" to "CPASU/UCR Trend" — subtitle, badge, and visuals untouched.
- Verified with `npm run build` (clean, 1186 modules).
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md`; committed and pushed to `main`.

---

## Prompt 67 — 2026-07-31
**Input:** For both ESG and HES for graphs only - when we click on the title of the graphs it shows pop-up. It should be like when i click on any part of the graph it should show the pop-up and also give a disclaimer or a note to let the users know that a graph is clickable. Also on the pop-up Add a professional overlay over the visual/page. At the top center display a large title: COMING SOON. Do NOT completely hide the visual. Keep all original elements: Charts, Tables, Cards, Legends, Filters, Icons, Buttons, Titles. Only apply the blur and dark overlay. Do this for all the visuals.

**Action:**
- Asked 2 clarifying questions before touching ~10 files, since the request could otherwise conflict with existing click behavior or fully replace real data with a placeholder: (1) whether widening the click target to "anywhere on the graph" should override existing drill-down-bar-clicks/Plan-dropdowns/toggles; (2) whether the pop-up should show real content blurred, or a dedicated no-data placeholder.
- User's answers: discard the click-widening idea entirely (title-only clicking stays exactly as it already worked, no disclaimer added) — focus only on the pop-up content: real content, blurred + darkened.
- New shared `ComingSoonOverlay` in `ChartKit.jsx` — wraps a pop-up's real children (rendered exactly as before, nothing removed), then layers a dark (`rgba(4,10,18,0.62)`) + blurred (`backdrop-filter: blur(5px)`) overlay on top with a large "Coming Soon" pill centered at the top.
- Applied to every ESG/HES Forecasting graph's title-click pop-up: `Visual` (`ChartKit.jsx`) gained an opt-in `comingSoon` prop (default `false`), set on `AsuLayer.jsx`/`SrLayer.jsx`/`AsuSrTrendLayer.jsx`'s `Visual` calls (HES Forecasting); `Layer1PlanOverPlan.jsx`/`Layer2ActualVsPlan.jsx`'s own local `Visual` duplicates (ESG Forecasting) wrap unconditionally, since those files are Forecasting-only already. Also wrapped `AsuSrTrendLayer`'s separate bar-click "Top 5 Non-Adherent LOBs" modal. Every Capacity page and every KPI card drill-down is untouched — same shared `Modal`/`PopupTable`, no overlay.
- Deliberately left the per-row "RCA/CLCA" pill popups (`PerformanceMatrixTable.jsx`, both `QueuePerformanceTable.jsx` files) alone — a different, pre-existing interaction shared with Capacity pages, not "click the graph's title."
- Verified with `npm run build` (clean, 1186 modules) and a grep sweep of every `PopupTable`/`Modal` usage across both Forecasting pages to confirm complete, correctly-scoped coverage; no browser-automation tool was available this session to click through it visually (same known gap noted elsewhere in this project).
- Updated `handoff.md`, `tech_spec.md`, `design_choice.md`; committed and pushed to `main`.
