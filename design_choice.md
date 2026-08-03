# Design Choices — TSG SPoG MSG Forecasting Dashboard

A record of every significant design decision made, with the reasoning behind it.

---

## Graph Pop-Ups Get a "Coming Soon" Overlay That Obscures, Not Removes, the Real Content (2026-07-31)

**Decision:** Every ESG/HES Forecasting graph's existing click-title pop-up (and `AsuSrTrendLayer`'s separate bar-click "Top 5 Non-Adherent LOBs" modal) now renders its real content exactly as before, then layers a dark (`rgba(4,10,18,0.62)`) + blurred (`backdrop-filter: blur(5px)`) overlay on top with a large "Coming Soon" pill centered at the top. New shared `ComingSoonOverlay` in `ChartKit.jsx` wraps `children` rather than replacing them.

**Why:** Directly requested, explicitly and repeatedly: "Do NOT completely hide the visual... Keep all original elements... Only apply the blur and dark overlay." A dedicated placeholder card (no real data rendered at all) was considered and rejected via a direct follow-up question — the user chose "real content, blurred + darkened" specifically. Layering the overlay as a sibling on top of the untouched children (rather than conditionally swapping what renders) is also the simplest implementation that can't accidentally regress the real content's own behavior (scrolling, sticky headers, etc.) since nothing about the wrapped content itself changed.

## "Coming Soon" Overlay Is Opt-In Per Visual, Not a Global Default (2026-07-31)

**Decision:** The shared `Visual` component (`ChartKit.jsx`) gained a new `comingSoon` prop, default `false`. It's only set to `true` on HES Forecasting's `Visual` call sites (`AsuLayer.jsx`, `SrLayer.jsx`, `AsuSrTrendLayer.jsx`). ESG Forecasting's `Layer1PlanOverPlan.jsx`/`Layer2ActualVsPlan.jsx` have their own local `Visual` duplicates (pre-dating the shared `ChartKit.jsx` promotion) and wrap unconditionally instead, since those files are exclusively ESG Forecasting already. Every Capacity page, and every KPI card's own drill-down `Modal`, is completely unaffected.

**Why:** The request explicitly scoped this to "ESG and HES" (this session's established shorthand for the MSG/TSA Forecasting pages specifically, distinct from "ESG Capacity"/"HES Capacity") "for graphs only" — not KPI cards, and not the Capacity Plan pages, which share the exact same `Visual`/`Modal`/`PopupTable` components. An opt-in prop (rather than a blanket change to `Visual`'s default behavior) is the only way to apply this to some `Visual` consumers and not others without forking the shared component or touching files nobody asked to change.

## Click-Target Widening Was Explicitly Discarded Mid-Request (2026-07-31)

**Decision:** The original request also asked to widen the click target from "the title only" to "any part of the graph," plus a visible "this graph is clickable" disclaimer. Both were dropped after a direct follow-up question surfaced the conflict: several charts already have their OWN click behavior on non-title areas (drill-down bars, Plan/Region dropdowns, `BinaryToggle`s) that widening the click target would have overridden or collided with. The user chose to discard that half of the request entirely and keep title-only clicking exactly as it already worked.

**Why:** Guessing an implementation here risked silently breaking already-shipped, working interactions (region drill-down, Plan pickers) that were never mentioned as something to change. Surfacing the conflict directly, rather than picking a side unilaterally, let the user make the call with an actual regression risk. The rest of the original request (the pop-up's own content getting the "Coming Soon" treatment) proceeded on its own merits, independent of this discarded half.

## HES Forecasting Layer 03 Renamed "CPASU/UCR Trend" (2026-07-31)

**Decision:** `AsuSrTrendLayer.jsx`'s layer header — "ASU/UCR Impact on SR Analysis" → "CPASU/UCR Trend". Subtitle ("— CPASU & UCR runrate"), badge "03", and all 3 visuals underneath are unchanged.

**Why:** Direct rename request with a screenshot — a plain relabeling, no structural or data change implied.

---

## Total Queues Card Face Shows Active Only; the Drill-Down Directories Were Left Alone (2026-07-30)

**Decision:** Both ESG Forecasting's and HES Forecasting's "Total Queues" KPI card now shows just the active count (value + sublabel + sub-line all dropped "Inactive"). Neither page's drill-down modal was touched — HES Forecasting's directory already only listed active queues before this change; ESG Forecasting's "Queue Directory — Active & Inactive" modal (with its own Business Partner active/inactive split table) was left exactly as built.

**Why:** The request named "the total queues card" specifically. ESG Forecasting's fuller active+inactive directory was a separate, deliberately-scoped feature built earlier in this project for a different reason (a real inactive-queue count is still operationally useful in a detail view) — removing it wholesale would undo real, working functionality nobody asked to remove, just to make the summary card's headline number consistent with what it now advertises.

## SR Card's DB/OSP YTD Needed a Genuinely-Varying Split, Not Just a New Sub-Line (2026-07-30)

**Decision:** Fixed the Service Requests card showing only one combined YTD % (no DB/OSP breakdown) by first changing `srDbOspByFY`'s DB/OSP split from a FIXED 70/30 ratio of the same total to a per-period VARYING share (~62-74%), before building the new sub-line.

**Why:** Verified with real numbers before writing any UI: a fixed-ratio split of the same underlying total produces IDENTICAL year-over-year % change for DB, OSP, and the combined total (confirmed: all three came out to exactly 7.8% on a sample year) — a "bifurcation" that would show the same number twice under two different labels, not a real breakdown. The varying-share version gives DB and OSP genuinely independent trajectories (e.g. +17.4% / -12.4% on the same sample) while still summing to the exact same combined SR actual each period, so nothing else that reads `srDbOspByFY`'s totals (the existing DB vs OSP drill-down chart) changed.

## Plan Name Dropdowns Became Multi-Select via the Existing Filter-Panel Widget, Not a New One (2026-07-30)

**Decision:** Every chart-level "Plan Name" `PlanSelect` across the app was converted from a plain single-value `<select>` to a checkbox multi-select, by making `PlanSelect` a thin wrapper around the SAME `MultiSelectField` component the top filter panel already uses for LOB/Business Partner/etc. (adding one new `emptyLabel` prop, default `'All'`, overridden to `'Select Plan'` for this use).

**Why:** Directly requested with a concrete visual example (a checkbox per option, defaulting to an unselected "Select Plan" placeholder rather than a pre-picked value). Building a second, bespoke multi-select widget from scratch would have produced a dropdown that looked and behaved slightly differently from the one already used everywhere else in the filter panel — reusing `MultiSelectField` guarantees identical interaction (search box, Select all/Clear, checkbox rows, click-outside-to-close) with a single, already-proven implementation, and the one-line `emptyLabel` addition doesn't affect any of the filter panel's own existing usages (their default stays `'All'`).

## Multiple Selected Plans Render as Extra Series on Trend Charts, But Only the First Plan on Ranked Lists/Tables/Maps (2026-07-30)

**Decision:** Selecting 2+ plans behaves differently depending on the chart shape: period-trend Bar+Line combo charts (ASU/SR Trend Visual1, Headcount/Attrition Visual1, Utilization Visual1, UCR Impact on SR, ESG Forecasting's Actual vs Plan Variation) render one additional "Plan" bar per selected plan (cycling a 2-hue rotation with stepped opacity via a new `planSeriesColor` helper) and drop any Adherence/Variation % line once more than one plan is shown. Ranked-by-queue/LOB horizontal bar charts, the two Performance matrix tables, and both Geo Maps instead use only the FIRST selected plan for calculation — the widget is genuinely multi-select everywhere, but the math only follows suit where "N plans" has an unambiguous visual answer.

**Why:** A trend chart's Plan bar is a single, well-defined series per period — adding one more bar per selected plan is a direct, honest generalization with an obvious rendering (this is also how the existing Plan A/Plan B `PlanDropdowns` comparison charts already work, just extended from exactly-2 to N). A ranked queue list, a LOB × Fiscal-Quarter matrix, and a choropleth region color are each fundamentally ONE value per row/cell/region — "2 plans" has no single correct visual answer there (N sets of sub-columns? N bars per already-crowded queue row? which of 2 colors wins?) without a disproportionate redesign of features that were scoped and shipped for a different reason. Rather than guess an answer nobody asked for, these fall back to the first selected plan, clearly documented in each file's own comment, with the multi-select widget itself still available everywhere for consistency.

## Adherence Line Drops When 2+ Plans Are Compared on a Trend Chart (2026-07-30)

**Decision:** On every trend chart that gained multi-plan bars, the Adherence %/Variation % line (previously always shown) is now only rendered when exactly one plan is selected (or none, showing the baseline).

**Why:** Adherence is defined against ONE plan (`actual ÷ plan × 100`) — with 2+ plans compared, "adherence" would need to become 2+ separate lines on the same secondary axis, which clutters fast and duplicates information already visible from comparing the bar heights directly. Dropping it only when genuinely ambiguous (N>1), while keeping it exactly as before for the single-plan case (the vast majority of real usage), preserves 100% of the original chart's behavior for anyone who picks one plan, which is functionally identical to today's default.

## Two Long-Documented Cosmetic Plan Dropdowns Were Fixed as Part of This Rollout, Not Left As-Is (2026-07-30)

**Decision:** While converting `AsuLayer`/`SrLayer` Visual1's Plan Name dropdown (`asuByFY`/`srByFY`), `msgCapacity/HeadcountLayer` Visual1 (`hcStaffingByFY`), and `AsuSrTrendLayer`'s "UCR Impact on SR" (`srBotsByFY`) to multi-select, each selector was ALSO given a genuine `planName` parameter — all three were previously documented Known Limitations where the dropdown changed UI state but never fed into the chart's numbers at all.

**Why:** Building genuine multi-plan-series rendering on top of a dropdown that doesn't affect the data at all would have been actively misleading — selecting 2 plans would show 2 identical bars. Since the underlying fix (threading a plan-name-driven scale factor into the selector, reusing each page's own already-established scaling mechanism — `planPerformanceScale` on Forecasting, `planMultiplier` on Capacity) was a small, mechanical, low-risk addition once the pattern already existed elsewhere on the same page, it made no sense to ship a "multi-select" UI on top of a control that still silently did nothing.

---

## Plan A / Plan B Dropdowns Extended to Multi-Select, Same Pattern as Plan Name (2026-07-31)

**Decision:** Every "Plan A / Plan B" `PlanDropdowns` across the app (`AsuLayer`/`SrLayer`, `Layer1PlanOverPlan`, both Capacity pages' `PlanOverPlanVariationLayer`) was converted from two plain single-value `<select>`s to two `MultiSelectField`s, mirroring the prior day's `PlanSelect` rollout exactly: `planA`/`planB` are now arrays, `onChange(key, val)`'s signature stayed the same so no call site needed to change how it invokes the handler. A new `planVsPlanSeriesColor(index)` cycles all 3 non-status hues (`metric1`/`metric2`/`trend`) rather than reusing `planSeriesColor`'s 2-hue rotation, since a pure Plan A vs Plan B context has no competing "Actual" series reserving `metric1`.

**Why:** Direct follow-up request ("give multiselect options for plan A and Plan B as well, wherever applicable across graphs") explicitly generalizing the prior day's accepted `PlanSelect` treatment to the other dropdown family in the app. No new clarification was needed — the shape of the problem (multi-select widget + full-N-series-on-trend-charts / first-plan-only-on-ranked-charts) had already been decided and validated for `PlanSelect`; extending the identical reasoning to a two-sided A/B picker was the reasonable, consistent continuation rather than a decision requiring fresh input.

## Plan A/B Multi-Series Uses a Combined A-then-B Color Index, Not Separate "A-Family"/"B-Family" Hue Sets (2026-07-31)

**Decision:** When N plans are selected on the A side and M on the B side, all N+M bars draw their color from one running index (`planVsPlanSeriesColor(0..N+M-1)`) — all A-side bars first, then all B-side bars — rather than giving each side its own independent hue rotation.

**Why:** The safe non-status palette only has 3 hues (`metric1`/`metric2`/`trend`) before colors start repeating; splitting them into a 1.5-hue "A-family" and a 1.5-hue "B-family" would run out of visual distinctness even faster than the combined approach, and would make an A-side bar and a B-side bar accidentally share the exact same color at low selection counts (e.g. 1 A-plan and 1 B-plan both landing on the same hue). A single combined index guarantees the first A-plan and first B-plan always get visually distinct colors, which matters far more than preserving a strict "blue-ish is always A" convention that breaks down after 2 selections anyway.

## Closed the Plan A/B Cosmetic Gap Only Where the Chart's Entire Purpose IS the Comparison (2026-07-31)

**Decision:** `asuPlanVsPlanByFY`/`srPlanVsPlanByFY` (`tsaData.js`) and a new `planNameScale()` (`mockData.js`, mirroring `tsaData.js`'s `planPerformanceScale`) now genuinely rescale `plan1`/`plan2` by `planA`/`planB` — closing a cosmetic gap where these dropdowns previously only relabeled fixed bars. This was done for `AsuLayer`/`SrLayer` Visual2 ("Plan vs Plan Comparison") and `Layer1PlanOverPlan` Visual1 ("PoP Variation") specifically. The sibling region/impact/ranked charts in the SAME files (`AsuLayer`/`SrLayer` Visual3 "Plan Impact", `Layer1PlanOverPlan` Visual2/3) were deliberately left static/cosmetic, receiving only the multi-select widget and array-safe labels.

**Why:** Same "cheap, directly relevant, in-scope" bar the prior day's rollout used for its 3 cosmetic-gap fixes — a chart literally titled "Plan vs Plan Comparison" showing two identical bars regardless of which two plans are picked is actively misleading, and the fix reuses each page's own already-established scale mechanism, so the risk is low. The region/impact/ranked charts, by contrast, are already governed by the separate "first-selected-plan-only, no new selector wiring" policy for ranked/impact chart shapes (see the 2026-07-30 entry above) — rewiring their underlying static datasets would be new, non-trivial selector work outside that established boundary, not a cheap while-I'm-here fix.

## Capacity Pages' Already-Functional Plan A/B Selectors Use a Placeholder Argument to Extract One Side at a Time (2026-07-31)

**Decision:** Both Capacity pages' `PlanOverPlanVariationLayer.jsx` `MainChart`s call their already-plan-reactive selectors (`tsaPlanOverPlanByDimension`/`tsaPlanOverPlanTrendByDimension`, `planOverPlanByDimension`/`planOverPlanTrendByDimension`) once per selected plan on each side, passing a placeholder value for the untouched slot and keeping only the field that slot's real argument controls (`plan1` for `planA`, `plan2` for `planB`). TSA Capacity's selectors need a real, valid plan name as the placeholder (`PLAN_PLACEHOLDER`, a fixed constant) because they only apply named-plan scaling when BOTH `planA` and `planB` are non-null; MSG Capacity's selectors have no such gate (`planMultiplier(undefined)` safely returns a 1x no-op), so plain `undefined` works there.

**Why:** Confirmed via source that each selector's `plan1`/`plan2` fields are computed fully independently (`planFyValue(fy, planA)` / `planFyValue(fy, planB)`, or `planMultiplier(planA)` / `planMultiplier(planB)`) — changing the untouched slot's argument never affects the field being extracted, so this avoids having to modify either selector's signature to accept arrays directly, at the cost of one "wasted" field per call. Verified with a Node smoke test that both selectors' region/sub-region key ORDER stays identical across different `planA`/`planB` values (both selectors sort by a share-weighted magnitude that a single scalar multiplier can't reorder), which is what makes it safe to merge each per-plan result back together by matching `key`.

---

## Both Geo Maps' Choropleth Now Colors by Plan Adherence, Not a Plan-Blind Metric (2026-07-29)

**Decision:** Both `TsaGeoMap.jsx` and `TsaCapacityGeoMap.jsx` now color their regions/sub-regions by a genuine adherence-to-Plan percentage (`geoAdherenceByRegion(filters, metric, planName)` for Forecasting; `geoHeadcountByRegion`/`geoHeadcountBySubRegion(filters, planName)` for Capacity), replacing colorings that were entirely blind to the Plan Name selector — Forecasting's map previously colored a synthetic per-region adherence unrelated to ASU/SR; Capacity's map previously colored raw headcount level relative to the current view's own peak.

**Why:** Directly reported — after adding the Plan Name dropdown the same day, selecting a different plan visibly changed the hover popup's numbers but left the map's own fill colors completely static, which reads as a half-wired control. The fix had to change what the CHOROPLETH itself represents, not just add a cosmetic redraw — coloring by adherence-to-the-selected-plan is the one metric that's both meaningful for a "how are we doing vs plan" map and genuinely reactive to the Plan Name control by construction (a different plan changes the denominator, hence the adherence value, hence the color).

**Consequence for HES Capacity specifically:** switching Capacity's map from a raw-headcount-level metric to an adherence PERCENTAGE meant its color thresholds could — and should — switch from the relative-to-peak bands (`≥75%/50-75%/25-50%/<25%` of the current view's own peak, needed because raw headcount isn't a 0-100 rate) to the SAME fixed 90/80/70 thresholds every other Geo Map already uses, since adherence genuinely is a 0-100(+)% rate. This also fixed a latent inconsistency (Capacity's map was the only one of the 4 not using the shared threshold convention) as a side effect of making it plan-reactive, not as a separate ask.

## Map-Coloring Adherence Needed Its Own Deterministic Spread, Separate From the Reconciling Hover Numbers (2026-07-29)

**Decision:** Both new map-coloring functions layer a deterministic per-LOB "wobble" (`geoAdherenceWobble`/`geoHeadcountAdherenceWobble`, ~0.6x-1.4x) onto the actual side of the adherence ratio, purely for the choropleth — the hover popup's own per-LOB Actual/Plan/Adherence numbers (from `geoLobPerformanceByRegion`/`geoLobHeadcountByRegion`/`BySubRegion`) are untouched by this wobble and stay exactly as verified when they were built.

**Why:** Discovered while wiring this up (verified with real numbers, not assumed): both underlying per-LOB selectors give every LOB the SAME weight-based share for both actual and plan (by design, so their totals reconcile to the real page-level total) — which means the actual/plan RATIO is nearly identical across every LOB, and by extension across every region, regardless of which LOBs happen to be assigned to it. Aggregating that ratio straight into map colors would have shown almost every region the same color — the exact class of bug already fixed twice this week for these same 2 maps' PREVIOUS color sources. Rather than compromise the reconciling hover numbers (whose "sums back to the real total" property was deliberately built and verified), a separate, map-color-only wobble was added — same "separate, non-reconciling, map-color-only multiplier" precedent as `geoHeadcountEmphasis` (2026-07-28). Verified empirically that the map now shows genuine region-to-region color variety AND repaints when the Plan Name changes.

---

## HES Forecasting's Geo Map Got an ASU/SR Toggle Too, Not Just the Requested Plan Name Dropdown (2026-07-29)

**Decision:** Along with the explicitly-requested Plan Name dropdown, `TsaGeoMap.jsx` also gained an ASU/SR `BinaryToggle` controlling which metric the hover popup's per-LOB breakdown shows.

**Why:** The request asked for the hover popup to show "actual and plan volume along with adherence" — but this page has two distinct, equally-established volume metrics (ASU and SR), and defaulting silently to just one without offering the other would be an arbitrary, undisclosed choice on a highly visible feature. The map's own adjacent "ASU Performance"/"SR Performance" table (added the same week) already established exactly this ASU/SR toggle pattern for LOB-level volume data — reusing it here, rather than guessing a single metric, keeps the map consistent with its own neighbor and avoids the user having to ask for the other metric separately. HES Capacity's equivalent addition did NOT get an analogous toggle, since that request named a single, unambiguous metric (headcount) with no second option to choose between.

## Geo Map Hover Popups Reuse Each Page's Existing Per-LOB Selectors, Not New Calculations (2026-07-29)

**Decision:** `TsaGeoMap.jsx`'s new per-LOB hover breakdown calls `tsaData.js`'s `asuSrPerformanceByLob` (the exact selector the ASU/SR Performance table already uses), narrowed to whichever LOBs are assigned to the hovered region and collapsed to the latest in-scope quarter. `TsaCapacityGeoMap.jsx`'s new per-LOB headcount breakdown shares its per-LOB weighting scheme with the Staffing Summary card's own `FTE_BY_FY` total, the same "sums back to the real total" property established for the Performance tables.

**Why:** Both new hover popups needed "per-LOB actual/plan(/adherence or variance)" data that's structurally identical to what the Performance tables already compute — building a second, parallel calculation for the map would risk the two surfaces silently drifting apart (map says one number, table says another, for what a user would reasonably expect to be the same underlying fact). Reusing the existing selector (for Forecasting) and the existing weighting convention (for Capacity, where no page-level FY total existed yet for headcount specifically, so a new but consistently-styled weight array was added) keeps exactly one source of truth per metric.

## No Real LOB-to-Region Mapping Exists, So the Geo Map Hover Uses a Deterministic Placeholder Assignment (2026-07-29)

**Decision:** `TsaGeoMap.jsx`'s per-LOB hover breakdown needed to know which of the 4 real geographic regions each of the 33 real LOBs belongs to — no such mapping has ever been supplied for this page, so a new `LOB_REGION_ASSIGNMENTS` (round-robin by index over NAMER/LATAM/APJ/EMEA) fills the gap.

**Why:** Same "real names, illustrative structure" convention already used everywhere else in this app when a real per-item relationship hasn't been supplied yet (e.g. `LOB_FACTS`' businessPartner/globalGrouping tags, `CQN_LOB_ASSIGNMENTS` for the Workload Impact on Headcount chart) — every LOB name shown in the popup is still a genuine, real business name, just its REGION assignment is a placeholder pending real data. Verified the partition is clean (33 LOBs split exactly across the 4 regions with no overlap or gap) before shipping.

---

## "UCR Impact on SR"'s Plan Dropdown Moved From `cornerControls` to `controls` (2026-07-29)

**Decision:** `AsuSrTrendLayer.jsx`'s Visual2 ("UCR Impact on SR") now passes its `PlanSelect` via `Visual`'s `controls` prop (normal document flow, centered below the title/subtitle) instead of `cornerControls` (absolutely positioned, top-right corner).

**Why:** Directly reported as looking "clumsy" with a screenshot showing the "PLAN" label crowding the title's own info button. `cornerControls` is an absolutely-positioned slot that doesn't reserve any vertical space — it's the right fit for a narrow, short control like a `BinaryToggle`, but a `PlanSelect` renders a label ABOVE its dropdown (two lines), which is tall enough to visually overlap the title row when floated on top of it. This page's own sibling charts (`AsuLayer`/`SrLayer` Visual1) already use `controls` for their own "Plan Name" `PlanSelect` — `cornerControls` on this one chart was the inconsistent choice, not the norm; switching it to match fixes the overlap and brings it in line with its neighbors on the same page.

---

## Sticky Header's Tint Stays Layered Over an Opaque Backdrop, Not Swapped for a Solid Color (2026-07-29)

**Decision:** Fixed the Performance tables' quarter-group header showing scrolled rows bleeding through it by layering `var(--accent-dim)` over `var(--bg-panel)` (`linear-gradient(var(--accent-dim), var(--accent-dim)), var(--bg-panel)`), instead of replacing `--accent-dim` with a new solid, non-transparent color constant.

**Why:** `--accent-dim` is deliberately translucent everywhere else it's used in this app (badges, dim highlights) — it's meant to tint whatever's behind it, which is exactly what broke here once that "behind it" became a sticky header with scrollable content underneath. Introducing a brand-new opaque color constant just for this one header would both duplicate `--accent-dim`'s intended hue in a second place (drifting out of sync if the accent color ever changes) and wouldn't generalize to any other sticky-over-scrollable-content case that comes up later. Layering the existing translucent variable over an existing opaque one keeps a single source of truth for the tint color while making the composited result opaque — a reusable pattern, not a one-off patch.

## New Performance Tables Reuse This App's Own LOB Roster, Not the Screenshots' Literal Product Names (2026-07-29)

**Decision:** The 4 new "Performance" tables (ASU/SR on HES Forecasting, Workload/ACT on HES Capacity) use each page's own existing `LOB_LIST`/`filterLobs` roster for rows — NOT the specific product names visible in the 4 reference screenshots (APEX, AVAMAR, AZURE, CENTERA, CLARIION, COMPELLENT, CONNECTRIX, DATADOMAIN, CELERRA, ATMOS, BSAFE, CLOUDIQ, CLOUDLINK, DLM, DATA PROTECTION ADVISOR, CLOUD SERVERS, CLOUD TIERING APPLIANCE, APPSYNC).

**Why:** The screenshots read as a real BI-tool export (Power BI-style matrix, literal field names like `FISC_QTR_VAL`/`Key` leaking through as column headers on 2 of the 4) — treated as a STRUCTURAL reference for "build a table shaped like this," not literal row data to copy in, especially since each screenshot is a partial, scrolled view (Q4 cut off, more rows below the fold) that can't be faithfully reproduced in full anyway. Introducing those product names as a brand-new, disconnected roster would also mean the new tables' LOB filter wouldn't match the page's own existing LOB dropdown (still built on `LOB_LIST`), breaking the "every visual on a page shares one filter-integrated roster" convention this whole app already follows. Reusing `LOB_LIST` keeps these new tables genuinely filter-aware (LOB/Business Partner/Global Grouping/fiscal-period filters all narrow them, same as every other visual on the page) at the cost of not literally matching the screenshots' row names — flagged here explicitly since it's a real, consequential interpretation call, not an obvious one.

## ASU/SR Performance Rows Are Share-Weighted From a Real Total; Workload/ACT Performance Rows Expand Each LOB's Own Baseline (2026-07-29)

**Decision:** `asuSrPerformanceByLob` (HES Forecasting) derives each LOB's quarterly numbers as a deterministic SHARE of `asuByFY`/`srByFY`'s own quarter-level total, so every row sums back to the real page-level total (verified: LOB rows for FY25Q1 summed to 3,883 actual against the page total's 3,882 — a 1-unit rounding gap, same tolerance every other share-weighted selector in this app accepts). `workloadActPerformanceByLob` (HES Capacity) instead expands EACH LOB's own existing flat `workloadPlan`/`workloadActual`/`actHrsPlan`/`actHrsActual` baseline (already on `TSA_CAPACITY_LOBS`) into a 3-FY series with a modest YoY step, then to quarters.

**Why:** The two pages' underlying data shapes are genuinely different, not an inconsistency to fix: TSA Forecasting already has a real page-level FY/quarter ASU and SR total (`ASU_BY_FY`/`SR_BY_FY`) worth reconciling against, so share-weighting preserves that "adds up to the real total" property, same as this app's region/sub-region share-weighted selectors elsewhere. TSA Capacity has no equivalent FY-level Workload or Headcount-hours total to reconcile against — only a flat per-LOB baseline — so there's nothing to share-weight FROM; expanding each LOB's own number directly is the more honest approach; inventing a fake page-level "Workload total" just to share-weight from it would be a needless extra layer of illustrative structure with nothing real underneath it.

## New "Performance" Tables' Plan Name Dropdown Is Functional, Unlike This Page's Existing Cosmetic One (2026-07-29)

**Decision:** Both HES Forecasting's ASU/SR Performance table and HES Capacity's Workload/ACT Performance table have a Plan Name dropdown that genuinely rescales the Plan column — HES Forecasting via a new deterministic `planPerformanceScale()` hash, HES Capacity via the page's own existing `PLAN_SCALE_BY_NAME` (already used by the Attrition/Plan-over-Plan Plan pickers). Neither reuses or extends the KNOWN, documented cosmetic Plan Name dropdown on `AsuLayer`/`SrLayer` Visual1 ("Actuals vs Plan Comparison"), which changes state but never actually feeds into `asuByFY`/`srByFY` (see `tech_spec.md` Known Limitations).

**Why:** The user's own instruction was explicit that this dropdown should "adjust accordingly" per toggle position — a functional requirement, not a cosmetic one — and this app's established convention for every OTHER Plan dropdown (Capacity pages' `PlanSelect`/`PlanDropdowns`) is that it "genuinely changes displayed numbers, never decoratively." Building a 5th cosmetic Plan dropdown to match the one pre-existing cosmetic exception on this page would have been copying a known gap rather than the app's actual, intended convention.

## New Performance Tables Share One Generic Component, No Numbered Layer Badge (2026-07-29)

**Decision:** Built one shared `PerformanceMatrixTable.jsx` (LOB × Fiscal-Quarter matrix, metric toggle, Plan dropdown, RCA/CLCA pill column) consumed by both pages' thin per-page wrapper (`tsa/AsuSrPerformanceTable.jsx`, `tsaCapacity/WorkloadActPerformanceTable.jsx`), rather than writing the ~150-line table markup 4 times (2 metrics × 2 pages). Neither table carries a numbered layer badge (01/02/03/04) — it sits above the Geo Map with a plain title bar instead.

**Why:** All 4 requested tables share the exact same shape (toggle → title change, Fiscal-Quarter-grouped Actual/Plan/Adherence% triplets, per-row RCA/CLCA popup) — a generic component avoids 4 near-identical copies drifting out of sync over time, same reasoning behind every other shared primitive in `ChartKit.jsx`. Skipping a numbered badge directly follows the precedent ESG Capacity's `QueuePerformanceTable.jsx` already set for "an extra table placed above the Geo Map" — that page's own 01-04 badges stayed untouched when it was added, and the same logic applies here: inserting a table shouldn't force renumbering an already-established badge sequence.

## Two Reference Images' Table/Name Pairing Was Reconciled by Metric, Not Image Order (2026-07-29)

**Decision:** The request paired image #14 with "Workload Performance" and image #15 with "ACT Performance," but image #14's own header literally reads "ACT (Actual vs Plan Comparison)" and image #15's reads "Workload (Actual vs Plan Comparison)" — the reverse. Built "Workload Performance" using this page's own `workloadPlan`/`workloadActual` fields and "ACT Performance" using `actHrsPlan`/`actHrsActual`, matching each NAME to its own already-established metric rather than to the (apparently swapped) image number.

**Why:** Both reference images are structurally IDENTICAL templates (Fiscal Quarter groups × Actual/Plan/Adherence%, LOB rows) — the swap has zero effect on the resulting table's shape, only on which literal image number a metric's name happened to be attached to in the request text, almost certainly an incidental mix-up rather than an intentional instruction to rename the metrics themselves. Reconciling by metric name (which the rest of the request's own vocabulary — "Workload," "ACT" — and this page's existing data model already define unambiguously) is safer than reconciling by image index.

---

## PlanningSidebar Hidden on the Landing Page, Still Shared Across Business Pages (2026-07-29)

**Decision:** `PlanningSidebar` (Fiscal Calendar / Planning Cycle / Holiday Calendar) now renders only when `view !== 'landing'` in `App.jsx`, instead of unconditionally for every view.

**Why:** Directly requested — the landing page is just the ESG/HES business-selector tile screen, not a Forecasting/Capacity Plan view with its own fiscal periods to reference, so the calendar/cycle/holiday tools didn't have anything to attach to there. `PlanningSidebar` stays mounted once in `App.jsx` (not per-page) specifically so its expand/collapse state persists across business-page switches — a single `view !== 'landing'` condition around the existing mount point preserves that, rather than duplicating the component into each business page's own render tree.

## HES Capacity Geo Map's Legend Wording Matches the Other 3 Maps, Thresholds Don't (2026-07-28)

**Decision:** Reworded `TsaCapacityGeoMap.jsx`'s legend from "≥ 75% of peak Highest / 50–75% of peak High / 25–50% of peak Moderate / < 25% of peak Lowest" to "≥ 75% Excellent / 50–75% Good / 25–50% Fair / < 25% Critical" — same "X% Word" style and same 4 adjectives as the other 3 Geo Maps' legends — but kept the 75/50/25% THRESHOLDS themselves, rather than copying the other maps' 90/80/70%.

**Why:** Directly requested ("remove this of peak highest and all... make it similar to other Geo Map"). Only the wording was in scope, not the underlying calculation — this map's 75/50/25% thresholds are a % of the CURRENT view's own peak headcount (a relative scale, since headcount is a raw count, not a 0-100 rate, per `hcColor`'s own file comment), not a % of an absolute 0-100 metric the way the other 3 maps' accuracy/fulfillment/SL% readings are. Copying the other maps' 90/80/70% thresholds onto a relative-to-peak scale would silently change which regions land in which tier (undoing the color-spread verification just done the same day — see the geo map color-spread entry above), for a request that only asked about label wording. The relative basis is still disclosed in this chart's own `InfoButton` text ("...colored relative to the highest-staffed area in the current view"), so dropping "of peak" from the legend doesn't remove that information, just moves it out of the legend row.

## Geo Map Color Spread Needed a Deliberately-Curated Baseline, Not Just a Formula Tweak (2026-07-28)

**Decision:** Fixed HES Forecasting's and HES Capacity's Geo Maps both showing near-uniform colors across every region by giving each selector a deliberately-spread per-key baseline (`REGION_ADHERENCE_BASE` in `tsaData.js`; `geoHeadcountEmphasis()` in `tsaCapacityData.js`) instead of tweaking the existing formula's constants.

**Why:** Traced both root causes with real numbers before touching anything (never guessed): HES Forecasting's `geoAdherenceByRegion` averaged a modulo-30 per-LOB formula across all 33 LOBs — a complete residue cycle, so every region's average converged to the same ~79-80 regardless of which region it was, verified with a Node script showing all 5 regions landing within 1 point of each other. HES Capacity's `geoHeadcountByRegion`/`geoHeadcountBySubRegion` reshape a headcount split driven by round-robin LOB→region/sub-region tagging (33 LOBs over 5 regions ≈ 18-21% share each, or over 24 sub-regions ≈ 1-2 LOBs each) — inherently too even for the map's relative-to-peak color bands to ever show more than 1-2 colors, confirmed the same way. Neither was a coloring-threshold bug; both were a genuine lack of underlying spread, so the fix had to add real spread, not retune `acColor`/`hcColor`. Modeled the fix directly on ESG Forecasting's own `GEO_REGION_DATA`/`SUB_REGION_ACCURACY` — small, deliberately-curated per-key tables spanning all 4 tiers — rather than leaving the map to derive its colors from a formula whose averaging behavior wasn't designed with visual differentiation in mind.

**Scoping choice:** `geoHeadcountEmphasis()` was added ONLY inside `geoHeadcountByRegion`/`geoHeadcountBySubRegion`, not into the underlying `tsaAttritionByDimension` or the round-robin LOB tagging on `TSA_CAPACITY_LOBS` itself — confirmed via grep that nothing else in the app consumes these two geo selectors, so widening their spread doesn't change the Attrition or Plan-over-Plan visuals' own headcount numbers for the same region/sub-region, keeping this a genuinely map-only fix for a map-only complaint.

**Verification:** Both fixes were checked by running the actual selector functions (not a hand-derived approximation) through the real `acColor`/`hcColor` tier functions — confirmed all 4 real map regions (APJ/EMEA/LATAM/NAMER) land in 4 different tiers on both pages, and HES Capacity's ~22 real map sub-regions span all 4 tiers too, not just green/blue.

## Removing a Visual Renames Its Layer Too, When the Layer Name No Longer Fits (2026-07-28)

**Decision:** Removing "Utilization Variance" from `HeadcountAttritionLayer` also renamed the layer itself from "Headcount and Utilization" to "Headcount and Attrition" (and its subtitle from "staffing, attrition & utilization" to "staffing & attrition"), even though only the chart removal was explicitly requested.

**Why:** "Utilization Variance" was this layer's ONLY utilization content — after removing it, a header still reading "Headcount and Utilization" would name a concept the layer no longer covers at all, the same kind of staleness this project's docs already avoid leaving behind. This is a direct, minimal consequence of the requested removal (keeping the header accurate), not scope creep — no other layer content, layout, or naming was touched.

## A Removed Chart's Layout Space Goes to Its Siblings via Existing flex-1, Not a New Layout (2026-07-28)

**Decision:** With "Utilization Variance" removed, `HeadcountAttritionLayer`'s remaining 2 visuals automatically fill the freed space — no new CSS, grid, or width overrides were added.

**Why:** Every `Visual` panel already carries `flex-1` in the shared `ChartKit.jsx` component, inside a plain flexbox row (not a fixed CSS grid) — removing one child lets its siblings' `flex-1` claim the freed space automatically. This is the exact same mechanic already used when `WorkloadDistributionLayer`'s own Visual3 ("ACT Trend — Actual vs Plan") was removed 2026-07-23, dropping that layer from 3 visuals to 2 with no layout changes needed — "removing a chart from a flex row already produces the requested layout for free" is now an established pattern in this codebase, not something to solve freshly each time.

## Geo Map Projection Recentered South, Not Just Rescaled, to Stop Clipping the Top (2026-07-28)

**Decision:** All 4 Geo Maps' `projectionConfig` changed from `{ scale: 140, center: [10, 20] }` to `{ scale: 100, center: [10, 0] }` — both the scale reduction AND the center-latitude change (20°N → 0°) were needed, not just one.

**Why:** Per direct report that every Geo Map's visual was cut off at the top. Tracing the actual d3-geo Mercator math (all 4 maps use react-simple-maps' default 800×600 viewBox, unchanged by the container's own CSS height) showed the old settings put anything north of ~80°N at a negative y-coordinate — silently clipped by the SVG viewBox, not a CSS overflow issue, so nothing about the container's own `height`/`overflow` styling was at fault. Reducing scale alone would still center the visible window on 20°N and waste it on latitudes nobody needed (open ocean north of Scandinavia while still nearly clipping Greenland); moving the center latitude down to 0° (equator) redistributes the same vertical budget so it actually covers up to ~84°N (Greenland's tip, with margin) while the southern edge — already unclipped before — keeps a comfortable margin too. Verified numerically (not just by eyeballing) with a Node script driving the real `d3-geo` projection this app already depends on, checking specific real latitudes (Greenland 83.6°N, Svalbard 80°N, mainland Russia/Canada 75°N, Tierra del Fuego -56°) before and after.

## A Queue-to-LOB Mapping With No Real Source Gets a Deterministic Placeholder, Not Invented Names (2026-07-28)

**Decision:** "Workload Impact on Headcount"'s CQN-per-LOB filtering (`CQN_LOB_ASSIGNMENTS` in `tsaCapacityData.js`) assigns each of the 71 REAL queue names in `TSA_ACTIVE_QUEUE_NAMES` to a `LOB_LIST` entry round-robin by index, rather than either (a) inventing plausible-looking fake queue names per LOB, or (b) leaving every LOB's CQN list identical/unfiltered.

**Why:** Directly requested "when I select a particular LOB... the graph should show the respective CQN of that LOB," but no real queue-to-LOB mapping has ever been supplied to this app — `LOB_QUEUES` only has a real roster for one LOB ("High End Storage"), a known limitation already documented for the Total Queues card. Inventing new "real-sounding" queue names per LOB would violate this project's standing rule of never fabricating fake real-sounding names; leaving the chart unfiltered by LOB would ignore an explicit, unambiguous instruction. Round-robin assignment over the REAL 71-name roster is the same "real names, illustrative structure" compromise `LOB_FACTS` already uses for `businessPartner`/`globalGrouping` tagging — every CQN shown anywhere is still a genuine business-supplied name, just its LOB assignment is a placeholder pending real data, flagged directly in both `tech_spec.md`'s Known Limitations and inline in the code.

## Workload Impact on Headcount's Numbers Are Each Metric's Own LOB-Level Field, Sub-Divided by Queue Count (2026-07-28)

**Decision:** SR is scaled off `tsaData.js`'s existing `SR_BY_FY` plan (TSA Forecasting's own SR chart baseline) divided across all active queues; Workload Actual/Plan and Headcount are each a deterministic per-queue share of their assigned LOB's own `TSA_CAPACITY_LOBS` fields (`workloadPlan`/`workloadActual`, `popPlan1`) — none of the three metrics uses a freshly-invented scale.

**Why:** Directly requested ("make values for SR, Workload, Headcount similar to volume we used in other graphs"). Every one of these three metrics already exists elsewhere on this app at LOB or page level with an established, realistic magnitude; sub-dividing those existing totals by each LOB's queue count keeps a per-CQN row's numbers proportionate to what the same LOB already shows in its other charts (e.g. the LOB's own workload/headcount rolls up correctly across its queues) instead of introducing a fourth, disconnected illustrative scale just for this one chart.

## Workload Actual/Plan Share One Hue (Solid/Dashed), Not a Third Categorical Color (2026-07-28)

**Decision:** "Workload Impact on Headcount" uses only 3 hues for 4 series: SR (bar, `metric1`), Workload Actual/Plan (both `metric2`, solid vs dashed line), Headcount (`trend`, secondary axis). No new categorical color was introduced.

**Why:** This app's palette deliberately reserves `ahead`/`behind` (green/red) as status colors for positive/negative variance, not general series identity — reusing them here for a plain "Workload Actual" line would misuse a reserved color the way the dataviz guidance explicitly warns against. Rather than inventing a new, unvalidated 6th hue for a single chart, this reuses a pattern already established elsewhere in this exact codebase (`TsaCapacityMetricCards.jsx`'s Cases/FTE and Avg Case Time trend charts already pair an actual/plan line as one hue, solid vs dashed) — keeping the palette's fixed, validated set intact while still making Actual and Plan visually distinguishable via stroke pattern, and reserving `trend` (violet) for Headcount matches its established role everywhere else in this app as "the secondary-axis line's color."

---

## A Chart's Detail Table Should Be Its Real Data, Not a Second Generic One (2026-07-27)

**Decision:** "Headcount Impact on SL"'s click-table shows the actual "over-plan queues still below 90% SL" list (the chart's own real, concrete detail) instead of the generic `contributingFactors`-based "what contributed, by period" table every other time-based chart on this page got.

**Why:** This chart already had a specific, concrete answer to "give me more detail" — the defaulter list — sitting permanently in the card body. Once the click-table mechanism existed, keeping BOTH (a generic illustrative factors table on click, plus the real defaulter list still hardcoded into the card) would mean two tables saying different things about the same chart, with the more useful one relegated to permanent card real estate while the less specific one got the new interactive treatment. Moving the real defaulter list into the click-table and dropping the generic one resolved that — every chart's table should be its most useful concrete detail, not whichever table happened to be templated onto it first.

## Queue Performance Table Reuses This Page's Own Variance-Tier Convention (2026-07-27)

**Decision:** ESG Capacity Plan's new Queue Performance table colors/ranks queues using the same `varianceTier`/`varianceReason` treatment already applied to this page's "Queues with Highest Variation" and "Utilization Gap Queues" — not the Good/Fair/Poor accuracy-based status ESG Forecasting's own Queue Performance table uses.

**Why:** Directly requested ("take numbers similar to what we took for other graphs in same capacity page"). This page's other ranked-queue charts already establish "worst |variance| first, tiered High/Moderate/Low" as the page's own vocabulary for this kind of table — headcount actual-vs-plan variance fits that pattern directly, and reusing it keeps every ranked table on this page reading the same way instead of introducing ESG Forecasting's accuracy-percentage framing where it doesn't apply (headcount variance isn't an accuracy metric — over or under plan isn't inherently "good" or "bad" the way a forecast miss is).

---

## Table Click Target Is the Chart Title, Not the Whole Chart Body (2026-07-27)

**Decision:** Clicking a graph to open its detail table means clicking the chart's TITLE text specifically — not any point on the chart body, and not the RCA/CLCA "i" button (reverted to RCA/CLCA-only, per direct correction the same day).

**Why:** Directly asked for "click on the graph," but many charts already have their own click behavior on the chart body itself (bars that drill into a region's trend, e.g. Attrition/Plan-over-Plan region charts) or interactive controls (Plan dropdowns, Region/Sub-region toggles) rendered inside the same panel. Making the whole panel clickable would fire the table-open behavior on TOP of those existing interactions — clicking a bar to drill into its trend would also pop a table open, a confusing double-action. The title text is the one spot on every chart panel that never has, and structurally can't collide with, another click handler — it's clickable on every chart uniformly, with zero risk of interfering with anything that chart already does. The click handler still explicitly excludes clicks on any nested `<button>` (the inline InfoButton sits right next to the title) so that keeps working independently.

## Geo Map Queue Detail Is a Hover Popup, Not a Table That Pushes the Page Down (2026-07-27)

**Decision:** ESG Forecasting's Geo Map shows a region/sub-region's queues in the same floating box that already appears on hover (previously just region name + accuracy%) — not a table rendered in the page's normal flow beneath the map (which is what the first pass at this built, then was corrected the same day).

**Why:** Directly requested — a table beneath the map pushes the rest of the page down every time it's visible, which reads as a layout shift rather than a lightweight detail lookup. A hover popup is transient (appears on mouseenter, disappears on mouseleave) and doesn't affect any other element's position, matching how a choropleth map is normally explored — mouse over the area you're curious about, glance at the numbers, move on.

## Table Content Changes with View By, Even Though Accuracy% Structurally Can't (2026-07-27)

**Decision:** `queuePerformance()`'s new `granularity` parameter genuinely re-derives Forecast and Actual volume per Quarter/Month/Week (via the same `expandToGranularity` wobble mechanism used everywhere else in this app), even knowing this makes Accuracy%/Status mathematically constant across every granularity for a given queue.

**Why:** This is the same shared-wobble mechanism already used for every other volume metric in the app, and the same ratio-invariance limitation is already documented elsewhere (e.g. MSG Capacity's Staffing card) — both sides of the ratio scale by the identical per-period multiplier, so the ratio itself can't move. Building an independent-wobble variant just for this one selector, so Accuracy% could vary too, would be inventing a new, one-off illustrative mechanism inconsistent with how every other ratio in this codebase behaves — the honest choice was to reuse the established pattern and document the resulting limitation clearly, rather than quietly making this one selector behave differently from all its siblings.

---

## Detail Tables Live in the Existing RCA/CLCA Button, Not a New One (2026-07-27)

**Decision:** Every graph's new tabular "what contributed"/"variance breakdown"/"bucket composition" content was added as an optional `table` prop on the EXISTING `GraphInsightButton` (RCA/CLCA popup), not a fourth button per chart.

**Why:** Directly asked the user this exact question before touching any code — they confirmed clicking RCA/CLCA should "give details," matching the literal wording of the request. Every chart already carries up to 2 buttons in its corners (`GraphInsightButton` top-left, `cornerControls`/Plan-dropdowns top-right); a 3rd/4th button per chart would crowd every visual in the app for a feature that's conceptually the same button doing more (RCA already means "root cause," which is exactly what a contributing-factors table is).

## Real Holiday Cross-Reference Only by Region, Never by Chart Period (2026-07-27)

**Decision:** `contributingFactors()` only pulls a real holiday row when given a real region (NAMER/LATAM/APJ/EMEA). It never attempts to match a chart's period label (FY25/FY26/FY27, or a Quarter/Month/Week sub-period) against a real calendar date.

**Why:** This app's mock chart periods and the real FY27 Fiscal/Holiday Calendar (built 2026-07-27, same day) are two independent systems that happen to share the label "FY27" — the mock periods are a purely illustrative labeling convention with no anchor date, while the Holiday Calendar is anchored to one real fiscal year (Jan 31, 2026 – Jan 29, 2027). Forcing a mapping between an illustrative "FY27 Q2" chart period and a specific real calendar week would be false precision dressed up as a genuine cross-reference — worse than not cross-referencing at all, since it would look authoritative without being true. Region, by contrast, is a real, stable dimension both systems genuinely share (once mapped onto the Holiday Calendar's 3-region taxonomy) — so region-scoped factor tables get a real holiday row, period-scoped ones stay illustrative-only.

## Bucket-Composition Tables Match the Chart's Own Illustrative Percentages, Not Literal Per-Queue Variance (2026-07-27)

**Decision:** `bucketQueues()`/`allBucketsQueues()` deterministically assign in-scope queues to a distribution chart's buckets in the SAME proportions the chart already displays, rather than literally filtering queues by their real variance value into those bucket ranges.

**Why:** "Forecast Variance Distribution"'s bucket percentages (`STACKED_ADHERENCE` in `mockData.js`) are their own hand-curated illustrative aggregate, built independently of any single queue's real plan-variance (which never exceeds ~8%, per `ACTIVE_QUEUES`'s own documented range). A literal per-queue filter into the chart's 4 buckets (<10%/10-20%/20-30%/>30%) would leave 3 of them permanently empty — clicking through would contradict the chart it's supposed to explain. Assigning queues proportionally, with a synthesized-but-stable value inside each bucket's own range, keeps the popup internally consistent with what the chart already shows, which matters more here than literal derivation from a field that was never designed to produce that spread.

## Queue Performance Table + Geo Map Redesign Stay ESG-Forecasting-Specific (2026-07-27)

**Decision:** The new `QueuePerformanceTable.jsx` and the Geo Map's redesign (rename, summary-table removal, click-region queue table) were built only for ESG Forecasting — not replicated onto ESG Capacity, HES Forecasting, or HES Capacity's own geo maps or as new summary tables there, even though the broader "add a table popup to every graph" request was confirmed in scope for all 4 pages.

**Why:** Every concrete detail in the request (the reference image, "Forecast" vs "Actual" volume columns, "queues" specifically) was Forecasting-shaped — a per-queue forecast-accuracy concept that doesn't map cleanly onto the Capacity pages (which are about headcount/utilization, not per-queue call-volume accuracy) without inventing a different data concept the request never described. The general table-popup-in-RCA/CLCA pattern (contributing factors, variance tiers, bucket composition) is genuinely reusable across chart TYPES regardless of page, which is why that part extended everywhere; the Queue Performance table and Geo Map redesign are a specific new UI section/behavior tied to data (per-queue forecast accuracy) that only exists in this exact shape on one page.

## Rebrand Touches User-Facing Text Only, Not Internal Code or Real Data (2026-07-27)

**Decision:** Renaming TSG->ISG, MSG->ESG, TSA->HES (and dropping "Enterprise Service Group"/"High End Storage" entirely) was scoped to strings a user actually sees — headers, titles, badges, modal titles, info descriptions. Internal code (component/file/folder names, function names, data exports, code comments) still says MSG/TSA, and two categories of real data were left untouched even though they contain the old acronyms as substrings.

**Why not rename the code too:** `MsgCapacityPage.jsx`, `tsaCapacity/`, `TSA_ACTIVE_QUEUES`, and every comment referencing "MSG Forecasting" or "TSA Capacity" for context are internal identifiers invisible to anyone using the app. Renaming them would touch dozens of files and every import path for zero user-visible benefit, and would be a fundamentally different (and much riskier) task than a branding change — nothing in the request asked for an architecture rename, and conflating the two would turn a quick, safe text change into a large refactor.

**Why not rename "High End Storage" inside `LOB_LIST`/`LOB_QUEUES`, or "MSG" inside `INACTIVE_QUEUE_NAMES`:** these are real, business-supplied data (a genuine LOB name, and real queue names like "Brazil MSG CTE") — not the app's own descriptive branding text, which is what the request was actually about. This app has a standing convention of reproducing real supplied names exactly as given rather than editing them to fit the app's own presentation choices (see the "real names + illustrative structure" convention throughout `design_choice.md`); a coincidental substring match against the old business-unit acronym isn't grounds for altering real reference data.

## Holiday Calendar: Filter First, Don't Dump 800 Rows (2026-07-27)

**Decision:** `HolidayCalendarView.jsx` defaults to a Region pill (starting on "All") plus a searchable Country multi-select, with results grouped into collapsible per-month accordions (only the first month open by default) — never a flat unfiltered list of all 800 rows.

**Why:** The source data is comprehensive (800 holidays, 53 countries) precisely because it needs to answer "who's out on a given date" across a global operation — but that same comprehensiveness makes an unfiltered dump unusable in a 360px sidebar panel. Reused the existing `MultiSelectField.jsx` (the same searchable-checkbox-list component the filter bars already use) for the Country filter instead of building a second one, so the interaction pattern is already familiar to anyone who's used this app's other filters.

## Fiscal Calendar Reflows to a Single Column Instead of Cramming the Source's Wide Layout (2026-07-27)

**Decision:** The supplied FY27 calendar image shows all 4 quarters side by side (12 month tables across the full page width). `FiscalCalendarView.jsx` instead stacks quarters/months vertically in a single column.

**Why:** This view lives inside a 360px sidebar panel (see below), not a full-width page — the source's 4-quarters-across layout would force each of the 12 month tables to be too narrow to read (7 day columns + QWKS/WKS need real width for legible digits). Reflowing to one column keeps every cell readable at the cost of a long vertical scroll, which is fine for reference content the user is looking something up in, not reading top-to-bottom in one sitting. The DATA and visual language (QWKS/WKS numbering, SCO/Holiday/Pay Date color coding) are reproduced exactly as shown — only the arrangement changed to fit the container.

## Planning Cycle + Fiscal Calendar Live in One Shared Sidebar Instance, Not Per-Page (2026-07-27)

**Decision:** `PlanningSidebar.jsx` is mounted exactly once, in `App.jsx`, outside the `{view === 'msg' && ...}` / `{view === 'tsa' && ...}` conditionals — not imported into each of the 4 business pages separately.

**Why:** The request was to add this "to all the pages." Mounting one shared instance above the page-switching logic means its expand/collapse state (which section is open, if any) survives navigating between MSG/TSA and Forecasting/Capacity Plan — a user who opens the Fiscal Calendar, then switches pages to check something, doesn't lose their place. Duplicating the sidebar into every page component would reset that state on every navigation and risk the 4 copies drifting out of sync with each other over time.

**Collapsed rail vs. expanded panel, not a modal:** directly asked the user whether this should be a slide-out/modal overlay or an inline-expanding sidebar section — they chose inline expansion (pushes page content right), so the sidebar's own box-model width (46px collapsed, 406px with a section open) is a real layout participant, not an overlay. This is also why `PlanningSidebar` uses `maxHeight: 100vh` rather than a fixed `height: 100vh` on its sticky-positioned box — a fixed height would have reserved dead scroll space below the header on every page (a `position: sticky` element's box still counts toward document height even once "stuck"), while `maxHeight` only grows to fit whatever's actually inside (a couple of icons when collapsed, a long scrollable calendar when a section is open).

## DB/OSP as a Toggle, Not Side-by-Side, in the Planning Cycle View (2026-07-27)

**Decision:** `PlanningCycleView.jsx`'s Full Year tab shows one track (DB or OSP) at a time via a `BinaryToggle`, rather than both tracks side by side as the source Excel itself lays them out.

**Why:** Directly asked the user this exact question, given the source spreadsheet's own two-columns-side-by-side layout — they chose a toggle instead, consistent with how DB/OSP is already presented as a toggle/pill filter elsewhere in this app (e.g. the MSG Forecasting DB/OSP Split card), rather than introducing a second side-by-side pattern unique to this one view.

## TSA Capacity Geo Map: Reuse the Attrition Visual's Headcount Split, Don't Invent New Data (2026-07-23)

**Decision:** When switching the Geo Map from SLO% to Headcount, the new `geoHeadcountByRegion`/`geoHeadcountBySubRegion` selectors reshape the EXISTING `tsaAttritionByDimension()` output (already computing a real region/sub-region headcount split for the Attrition visual in `HeadcountAttritionLayer.jsx`) rather than inventing a second, parallel headcount-by-region dataset.

**Why:** Two independent "headcount by region" numbers elsewhere in the same page would eventually drift out of sync with each other (different rounding, different share-weighting) and readers comparing the Attrition visual against the Geo Map would see two different headcount figures for the same region with no explanation why. Reusing one function as the single source of truth avoids that, and as a side effect fixes a latent staleness bug: the old `geoSloByRegion()`/`geoSloBySubRegion()` didn't even accept a real `filters` argument (calling them with filters was silently a no-op) and always returned the same 4/24 fixed rows — the new selectors are genuinely filter-aware because `tsaAttritionByDimension` already was.

**Why relative-to-peak color bands, not fixed thresholds:** SLO%/utilization/adherence are naturally 0-100% rates, so a fixed "≥90% excellent / <70% critical" threshold means the same thing at any scale. Headcount is a raw count with no natural ceiling, and Region view's ~4 buckets (counts in the 600s) and Sub-region view's ~24 buckets (counts in the 200s) differ by roughly 3x — a fixed threshold tuned for one view would misrepresent the other. Banding by percentage of the current view's own peak value keeps the same 4-color read meaningful regardless of which view (or what the underlying mock numbers happen to be) is active.

## Second, Separate "i" Button for Plain Descriptions — Not a Repurposed RCA/CLCA Button (2026-07-23)

**Decision:** Added a brand-new `InfoButton` component (`ChartKit.jsx`), entirely separate from the existing `GraphInsightButton` (RCA/CLCA). It takes one plain `info` sentence — what the card/chart is showing — with no root-cause or corrective-action framing at all.

**Why:** Directly asked the user whether this should be a second button or a repurposing of the existing RCA/CLCA slot on cards (since RCA/CLCA was being removed from cards in the same request) — confirmed they want a genuinely separate mechanism, not a relabeled one. Keeping the two conceptually distinct (RCA/CLCA = analysis, InfoButton = plain description) means visuals can carry both at once without either one's content bleeding into the other's framing.

**Placement — inline next to the title, not another absolute corner:** Cards already had exactly one free corner (top-right, freed up once RCA/CLCA left cards), so `InfoButton` slots in there directly. Visuals are more contested — `cornerControls` already claims top-right (Region/Sub-region toggles, Plan selectors) and `GraphInsightButton` already claims top-left. Rather than invent a third absolute-positioned corner (fragile once a chart has both a toggle AND a Plan dropdown in `cornerControls`), `InfoButton` renders inline in the title `<p>` itself (flex row, small gap) — it scales with however many controls a given visual already has and can never collide with them.

## Plan Dropdowns Must Move Real Numbers, Not Just Decorate (2026-07-23)

**Decision:** Every new Plan/Plan-A/Plan-B dropdown added in this pass had to change the underlying selector's actual output when switched — verified per chart before considering the task done, not just wired up visually.

**Why:** Several of the charts getting a new dropdown (MSG Capacity's "Plan over Plan Variation"/"Queues with Highest Variation", TSA Capacity's equivalents) previously showed **fixed, hardcoded** "Plan A"/"Plan B" values — there was no real per-plan data path to hang a dropdown off of. A dropdown that doesn't move the chart is worse than no dropdown (it implies a capability that doesn't exist). Each selector behind these charts (`cqnActualVariance`, `slTrendByFY`/`slDefaulterQueues`, `planOverPlanByDimension`/`planOverPlanTrendByDimension`/`planOverPlanQueueVariance`, `utilizationByFY`/`utilizationByQueue`/`leavesByQueue`, `fteByFY`, `tsaPlanOverPlanByDimension`/`tsaPlanOverPlanTrendByDimension`/`planOverPlanLobVariance`) gained a new **additive, defaulted** parameter (a plan name, or a `planA`/`planB` pair) plus a small deterministic per-plan multiplier/nudge table, so picking a different plan measurably rescales the chart's values — while every pre-existing caller that omits the new parameter gets byte-identical output to before (same non-breaking-parameter convention already established elsewhere in this codebase, e.g. Forecast Accuracy's optional `granularity` param from 2026-07-20).

**Shared vs. independent dropdown state, per the user's own distinction:** Where a request named several individual graphs getting "a dropdown" (MSG Capacity's Headcount Impact on SL; each of the 3 Utilization and Outage Analysis graphs), each got its own independent local state — deliberately not synced, since they're unrelated metrics that happen to sit near each other. Where a request paired two charts that are inherently the same Plan-A/Plan-B comparison shown two ways (a trend chart + a ranked-variance chart, both already reading "Plan A vs Plan B" in their subtitle), the dropdown state was lifted to the shared layer component and rendered once — two dropdowns for the same comparison would invite them to disagree with each other.

## RCA/CLCA Kept on Every Visual, Removed Only From Cards (2026-07-23)

**Decision:** RCA/CLCA (`GraphInsightButton`, `rca`/`clca` props) was removed entirely from the 4 pages' local `Card` components (20 KPI cards total) but left completely untouched on every graph/chart/geo map.

**Why:** Direct request — "remove RCA and CLCA from all the cards across all pages, keep it only for visuals." Cards are a compact, glanceable summary; a chart is where root-cause/corrective-action framing has room to be useful without crowding a small tile. Mechanically this was straightforward since each page's KPI cards were already a self-contained local `Card` component distinct from the shared `Visual` wrapper used by every chart — no shared code path had to be forked, just edited independently per page.

## All 3 Cards Pages: Compare Against the Selected Granularity's Prior Period, Not Always FY (2026-07-20)

**Decision:** All three pages whose cards carry a "vs prior period" comparison — TSA Forecasting (`tsaCardData`), MSG Capacity (`capacityCardData`), TSA Capacity (`tsaCapacityCardData`) — now compare against the immediately-prior period at whatever granularity the page's Quarter/Month/Week toggle is set to (Month-over-Month, Quarter-over-Quarter, etc.), falling back to Year-over-Year only when the toggle is at its Year default.

**Why (TSA Forecasting):** Requested directly — "Compare Month-over-Month and Quarter-over-Quarter instead of always comparing against last year where applicable." `tsaCardData(filters)` never accepted a `granularity` argument, so it always called `asuByFY`/`srByFY`/`cpasuByFY` with granularity omitted (defaulting to Year), even though `TsaMetricCards.jsx` had `granularity` available the whole time (its drill-down charts already used it correctly). This was a straightforward missing-parameter bug, not a deliberate choice.

**Why (MSG/TSA Capacity) — overriding an earlier, deliberate decision:** Both Capacity pages' card functions had an explicit prior design choice (documented in their own code comments) to always compare FY-over-FY "since a granular sub-year YoY comparison has no real baseline to compare against (the sub-period numbers are themselves synthesized from the FY total)." That reasoning is real, but the new request explicitly asks for the opposite behavior across the app "where applicable" — asked the user directly whether to override it here too, given it wasn't a bug like TSA Forecasting's; confirmed yes. Every metric on both Capacity pages already had (or, for TSA Capacity's Global SLO, now has — see the new `sloByFY` below) a granularity-aware selector built for its own drill-down chart, so this reuses the last two entries of those same series rather than the separate FY-only lookups the card functions used before. Added `sloByFY(filters, granularity)` to `tsaCapacityData.js` (rate-expanding both `actual` and `target`) since no granular Global SLO series existed yet; added `bench` to `tsaAttritionByFY`'s rate expansion so the Attrition card's benchmark value survives the switch away from the FY-only table. `MsgCapacityData.js`'s `sl`/`attrition` card sections also needed a `.slice(0, 4)` fix on their `target` lookups — `BASE_SL_TARGET`/`BASE_ATTRITION_TARGET` are keyed by bare FY ("FY27"), but the period label is now granular ("FY27 Q1"); the first 4 characters are always the FY, same convention `periodsForGranularity()` already relies on.

**A caveat worth knowing, not a new bug:** MSG Capacity's "Staffing" card can show ~0% Month/Quarter-over-Month/Quarter change even though the headline number itself is genuinely granular. That's because Staffing's value is a ratio (`actual/plan` headcount) where both sides are expanded together by `expandToGranularity`'s *same* per-period wobble — the wobble cancels out in the ratio, so the ratio is mathematically constant within a fiscal year by construction, and only moves at an FY boundary crossing. Confirmed via Node smoke test that other rate-native metrics (SL%, Attrition%, Global SLO) do show real non-zero period-over-period movement at Month/Quarter — only ratio-of-two-co-expanded-volumes metrics have this flatness, and it's a property of the shared expansion helper, not something this fix introduced or could fix without changing how the underlying mock data is synthesized.

**Scope — why not the main MSG/ESG Forecasting page:** `cardData()` in `mockData.js` doesn't show any period-over-period comparison on its cards at all (Call Volume shows abandon %, Forecast Accuracy shows vs-target, etc.) — nothing there for this fix to apply to, matching the request's own "where applicable" qualifier.

## MSG Forecasting Cards: Granular Where the Data Model Supports It, Not Faked Where It Doesn't (2026-07-20)

**Decision:** Call Volume, DB/OSP Split, and Forecast Accuracy now read the latest in-scope period off their own granularity-aware selector (`callVolumeByFY`, `dbOspVolumeByFY`, `forecastAccuracyByFY`); Total Queues and CQN Variance stay exactly as they were, unaffected by the View By toggle.

**Why the split:** Requested directly, via screenshot, that "all the views in the cards should change according to view by." Three of the five metrics already have (or, for Forecast Accuracy, could cheaply gain) a real per-quarter/month baseline in this data model — Call Volume and DB/OSP volume both derive from `BASE_CALL_VOLUME_BY_FY`, and Forecast Accuracy derives from `FORECAST_ACCURACY_BY_REGION` + a per-FY nudge, all of which are legitimately expandable to sub-year periods via the same `expandToGranularity`/`expandRateToGranularity` machinery every other granular chart on this page already uses. Total Queues (`ACTIVE_QUEUE_NAMES.length`/`INACTIVE_QUEUE_NAMES.length`) and CQN Variance (`structuralRows.filter(q => q.accuracy >= 89)`) have no such baseline — a queue is simply active or not, and carries one flat `.accuracy` number; there is no quarter-by-quarter version of either fact in this dataset. Inventing one (e.g. randomly perturbing the count per quarter) would produce a number that responds to the toggle but represents nothing — worse than a card that honestly doesn't change, since it would look like real information.

**forecastAccuracyByFY's `granularity` param is additive, not a replacement:** the Forecast Accuracy card's own drill-down chart (`ForecastByFYChart`) was deliberately built 2026-07-08 to always show one bar per fiscal year regardless of the page's View By toggle (see that entry). Extending the underlying selector to optionally accept granularity — used only by `cardData()` — makes the card headline responsive without disturbing that chart's established design; `ForecastByFYChart`'s own call site is untouched.

**A caveat surfaced by this work, not a new bug:** Forecast Accuracy's % is flat across Quarter/Month/Week (only moves at the Fiscal Year level) — it's `actual/forecast`, and `expandToGranularity` applies the identical wobble to both fields for a given sub-period, so the ratio cancels out mathematically. This is the same phenomenon already documented for MSG Capacity's Staffing card; Call Volume and DB/OSP Split don't have it since their headline numbers are absolute volumes, not ratios of two co-expanded fields.

**Also fixed as part of this pass:** `dbOspVolumeByFY` was still queue-count-weighted (`rows.filter(dbOsp==='DB').length / rows.length`), inconsistent with the volume-weighted fix already applied to `cardData`'s own DB/OSP split calculation earlier the same day. Switched it to the same `offered`-volume-weighted ratio so the card and its own drill-down chart agree.

## DB/OSP Split: Always Full-Population, Volume-Weighted (2026-07-20)

**Decision:** `cardData()`'s DB/OSP Split percentage is computed from a row set forced to `dbOsp: 'All'` (ignoring the current pill), summed by each queue's `offered` volume rather than counted by queue.

**Why:** Requested directly — "Fix DB vs OSP percentage calculations and interaction behavior." The prior code reused `filterQueues(filters)` (already narrowed by the active DB/OSP pill) for this specific split, which is circular: filtered to "DB", every row IS DB, so the split always degenerated to 100%/0% the moment you left "All". Forcing `dbOsp: 'All'` for this one calculation (same pattern `structuralRows` already used a few lines above it) makes the split meaningful and stable regardless of which pill is active. Switched from a queue-count ratio to an `offered`-volume-weighted ratio because the card's own sublabel says "Offered volume" — a raw count of queues was never actually the metric the label promised, even though for this dataset the two ratios happen to land close together (66%/34% either way, since OSP-tagged queues are evenly spread across the index range that drives each queue's synthetic `offered` value).

**Not changed:** the `offered`/`handled` totals shown elsewhere on the card (and used to derive `dbVol`/`ospVol`) are still correctly scoped by the DB/OSP pill — that part was already working as intended; only the split *percentage* was broken.

## Sankey: Node Hover Shows Every Connected Flow + Share (2026-07-20)

**Decision:** Hovering a Sankey node (LOB or CQN) shows a small list of every node it connects to on the other side, each annotated with its value and % of the hovered node's total — via a new `nodeHoverSummary()` reading `payload.sourceLinks`/`targetLinks`.

**Why:** Requested directly — "when we hover over a LOB or CQN it should show the LOB supporting CQN's and vice versa as list on hover and the percentage split." The existing link-hover `Tooltip` only ever showed one single source→target flow at a time; there was no way to see, in one glance, everything a given LOB feeds into (or everything feeding a given CQN) with relative weight. Reused the same `sourceLinks`/`targetLinks` node payload the existing custom `SankeyNode` already destructures (`isSource = payload.sourceLinks.length > 0`), so no new data plumbing from `tsaCapacityData.js` was needed — this is a presentation-only addition on top of the existing bipartite Sankey structure.

**Why a fixed-corner panel, not a tooltip following the cursor:** Matches the same convention already used for the Geo Maps' hover tooltip (`hovered` state, absolute-positioned top-right) — avoids depending on the Sankey's internal SVG coordinate space lining up with actual on-screen pixels through `ResponsiveContainer`'s scaling, which a cursor-following tooltip positioned from the node's `x`/`y` payload would risk getting wrong.

## Geo Maps: Click-to-Spotlight a Region, Dim the Rest (2026-07-20)

**Decision:** Clicking a region/sub-region on any of the 4 Geo Maps (or its row in the table below) sets it as the sole "selected" area — full opacity + accent border — while every other region drops to ~10% fill-opacity. Re-clicking the same one, a "Clear" link, or switching Region/Sub-region view clears the selection back to showing everything at full weight.

**Why:** Requested directly — "Allow clicking on a region to highlight only the selected area instead of showing all regions together." All 4 maps previously had zero click interaction (hover-only tooltips), so this is new behavior added consistently to all 4 rather than a rework of an existing one.

**Why dim instead of hide:** Fully hiding non-selected regions (fill → transparent/background color) would make the map look broken/empty rather than "spotlighted," and would lose the at-a-glance context of how the selected region compares to its neighbors. A heavy but non-zero opacity (0.1) keeps the geography outlines visible as context while making unmistakably clear which one is selected.

**Why clear on Region/Sub-region toggle but not on the metric toggle (MsgCapacityGeoMap):** Region and Sub-region views key off entirely different name sets (`regionForCountry` vs `subRegionForCountry`) — a selection made in one view wouldn't correspond to anything meaningful in the other, so keeping it would either silently show nothing selected or, worse, coincidentally match an unrelated area with the same name. The Headcount/SL% metric toggle only changes which value colors the same set of regions, so keeping the selection across that toggle is the more useful default (compare the same region's two metrics back to back).

## Card Insight Popup: Removed `overflow: hidden` from `.card-panel` (2026-07-20)

**Decision:** Dropped `overflow: hidden` from `.card-panel`'s CSS rather than reworking the popup to render outside the card (e.g. via a portal).

**Why:** The popup is a DOM child of the card (so it can position itself relative to the card's own button), which means any `overflow: hidden` on the card clips the popup too — reported via screenshot showing the CLCA text cut off at the card's bottom edge. A portal would fully decouple the popup from the card's box model but requires computing screen coordinates from the button's `getBoundingClientRect()` and keeping them in sync on scroll/resize — real work for a bug whose actual cause was a CSS property that wasn't protecting anything else. Confirmed nothing else in the card needs the clipping (both the top `::before` glow line and the bottom active-state bar are already inset within the card's own width) — a bigger portal-based rewrite would be the right move on the day the card actually needs true corner-clipped content again, not now.

## Card Insight Popup: Right-Anchored, Not Left (2026-07-20)

**Decision:** `GraphInsightButton` now takes an `align` prop (`'left'`|`'right'`) instead of always anchoring its popup's left edge to the button.

**Why:** Reported via screenshot — on cards, the button sits top-right, but the popup was still opening with its left edge at the button (i.e. extending further right), pushing it off the visible edge of the screen. Graphs/Geo Maps put the button top-left, where opening rightward was always fine — the bug only affected cards. Rather than hardcode a card-specific popup component, the existing shared one just gained a direction switch, defaulting to the graphs' existing behavior so nothing else had to change.

## RCA/Insights: Per-Graph "i" Button Only, Sidebar Removed (2026-07-20)

**Decision:** Removed the page-level RCA/CLCA sticky sidebar entirely (all 4 pages). RCA/Insights now live exclusively on each graph/card's own "i" info-button popup (`GraphInsightButton`, built 2026-07-10).

**Why:** Requested directly — "Implement RCA/Insights as a flip-over or info button on each visual instead of displaying RCA text on the right panel." Since every visual and card already had the per-graph "i" button wired up from the earlier pass, no new UI needed to be built; the sidebar had become a redundant second copy of the same insight, just at paragraph length instead of one sentence. Removing it also gives Analysis Layers the full page width back instead of sharing it with a 220px column.

**Not built:** the "flip-over" card-flip alternative the request also offered as an option. Went with the info-button route since it already existed, was already wired to all 62 rca/clca call sites, and matches the same "small popup, don't exaggerate it" precedent set when the per-graph button was first built. Revisit if a literal flip animation is wanted later.

---

## Visual Design

### Color Palette — Dark Navy Theme
**Decision:** Custom navy palette (`navy-900` → `navy-400`) with `#4fc3f7` accent.
```
navy-900: #0d1b2a  ← page background
navy-800: #112240  ← panel/section background
navy-700: #1a3456  ← filter bar, layer headers
navy-600: #1e3f6e  ← card bodies, chart backgrounds
navy-500: #2a5298  ← card headers
accent:   #4fc3f7  ← highlights, actuals bars, line charts
```
**Why:** Matches the dark navy theme shown in the PPT screenshots. Dark backgrounds reduce eye strain in ops-center environments and make colored chart data pop clearly.

### Typography
**Decision:** `'Segoe UI', system-ui, sans-serif` — no custom font loaded.
**Why:** Avoids a network request, matches Windows/Enterprise corporate environments, and renders crisply at small sizes (10–12px labels in chart axes).

### Text Size Strategy
- Filter labels: 10px uppercase tracking-wide
- Card titles: 11px bold
- Chart axis ticks: 9–10px
- Section headers: 12px bold uppercase
**Why:** Dense dashboard — space is at a premium. Labels need to be readable but not compete with chart data.

---

## Layout

### Three-column graph layout (all 3 visuals side by side)
**Decision:** Each graph layer renders its 3 visuals in a `flex gap-3` row.
**Why:** Directly mirrors the PPT design spec which shows Visual 1, 2, 3 side-by-side. Maximises horizontal screen real estate for comparison.

### Collapsible layers (accordion)
**Decision:** Each layer (1/2/3) has a clickable header that toggles content visibility.
**Why:** Lets users focus on one layer at a time. All 3 open simultaneously would be ~1200px tall and require constant scrolling.

### Filter panel — 2 rows × 6 columns (superseded 2026-07-01)
**Decision:** 12 filters laid out in a `grid-cols-6` grid inside the filter bar.
**Why:** Exactly matches the PPT screenshot layout (6 filters per row). Keeps the filter panel compact (two rows) so it doesn't eat into chart space.
**Update:** Replaced by the clustered filter bar below — the flat 6-per-row grid read as a generic BI slicer panel, which is exactly what the redesign was asked to move away from.

### Left-side section labels ("Cards", "Graphs")
**Decision:** Removed the vertical text labels from the PPT spec — not included in the UI.
**Why:** They were design-annotation labels in the spec document (for explaining the mockup to stakeholders), not actual UI elements. Including them would look odd in a real app.

---

## Component Decisions

### Filters lifted to App.jsx
**Decision:** `filters` state lives in `App`, passed down as props.
**Why:** All 3 layers + cards need to respond to the same filter state. Lifting to the nearest common ancestor avoids prop drilling through multiple layers and makes filter-to-data wiring straightforward when real data is connected.

### Drill-down as inline panel (not modal)
**Decision:** Clicking a KPI card opens a panel directly below the cards row, not a modal overlay.
**Why:** Modals interrupt workflow. An inline panel lets the user see both the card value and the detail table simultaneously without losing context of other cards.
**One deliberate exception (2026-07-01):** Clicking a year's bar inside the CQN Variance drill-down opens an actual modal (backdrop + centered card) listing that year's example queues. This is a second level of drill nested inside the first — by the time you're two levels deep, "context of the other cards" isn't the thing you're trying to preserve; a floating overlay reads more clearly than squeezing another chart into an already-open panel.
**Superseded (2026-07-02):** Requested directly for both pages — card drill-downs now open in the shared `Modal` (`src/components/Modal.jsx`), same as TSA Forecasting. See "Card drill-downs: modal popups on the Forecasting page too" below. The CQN Variance year-click modal is unaffected (still its own nested overlay), it's just nested one level deeper now (a modal inside a modal) instead of a modal inside an inline panel.

### Drill toggle (FY / Quarter / Week) as segmented control (removed 2026-07-01)
**Decision:** Three-button segmented control per visual instead of a dropdown.
**Why:** Users switch frequently between fiscal granularities. One-click toggle is faster than open-select-close. The options are fixed (only 3), so a segmented control is appropriate.
**Update:** Removed once the top filter bar gained real Fiscal Year/Quarter/Week filters — having both a top-level time filter and a per-chart time toggle was a duplicate control surface. Layer 1/2 Visual 1 now always render at Fiscal Year granularity; the top filters (whichever is most specific) pick which year shows. The `.drill-toggle`/`.drill-btn` CSS classes weren't deleted — they're reused for the new DB/OSP segmented pill in the filter bar.

### Plan A / Plan B as separate dropdowns per visual
**Decision:** Each visual in Layer 1 has its own Plan A / Plan B selector.
**Why:** PPT spec explicitly states "2 dropdowns at the top right of each graph to select two different plans." Independent per-visual allows comparing different plan pairs across visuals simultaneously.

### Layer 2 Visual 2 — stacked bar (not grouped)
**Decision:** Stacked 100% bar chart showing adherence buckets (Excellent/Good/Fair/Poor) per fiscal year.
**Why:** The PPT screenshot shows a stacked percentage chart (FY25/26/27 with % breakdowns like 43%/36%/9%/13%). Stacked format communicates the distribution of queues across performance tiers, which grouped bars would obscure.

### CQN chart orientation — horizontal bars
**Decision:** Visual 3 in both Layer 1 and Layer 2 uses a horizontal (layout="vertical") bar chart.
**Why:** Real queue names (e.g. `EMEA DPU BACKUPWAVE`, `NAMER DPU DataVault`) are long strings — they fit naturally on the Y axis. Vertical bars with queue names on the X axis would require angled labels and wasted space. YAxis width was widened to 130px (from the original CQN-code-era 58–60px) once real names replaced short placeholder codes.

---

## Chart Library

### Recharts (not Chart.js or Victory)
**Decision:** Recharts v2.12.
**Why:**
- Native React component model (no imperative canvas API)
- `ComposedChart` natively supports bars + lines on dual Y-axes — exactly what Plan vs Variance and Actual vs Adherence require
- Good TypeScript support, active maintenance
- Lighter than Victory, more customisable than nivo for this use case

### react-simple-maps (not Leaflet or Mapbox)
**Decision:** react-simple-maps v3 with world-atlas topojson from CDN.
**Why:**
- Pure SVG — no tile server, no API key, no map token required
- Lightweight and renders within the React tree
- `ComposableMap` + `Geographies` + `Marker` pattern is straightforward for dropping accuracy indicators on regions/countries
- Leaflet would add ~150KB and requires a separate CSS file + imperative setup

### Dual Y-axis on all ComposedCharts
**Decision:** Left Y-axis = volume (call counts), Right Y-axis = percentage (variance/adherence).
**Why:** Volume values (20K–300K) and percentage values (−10% to +10%) are on completely different scales. A single Y-axis would flatten the line into near-zero.

---

## Accuracy Color Scale (Geo Map)

| Range | Color | Label |
|---|---|---|
| ≥ 90% | `#2e7d32` (dark green) | Excellent |
| 80–90% | `#1976d2` (blue) | Good |
| 70–80% | `#e65100` (orange) | Fair |
| < 70% | `#b71c1c` (dark red) | Critical |

**Why:** Traffic-light metaphor extended to 4 bands. Green/blue/orange/red maps intuitively to performance tiers. Blue for "Good" (not yellow) avoids green/yellow/red colorblindness issues (deuteranopia).

---

## CI/CD Design

### peaceiris/actions-gh-pages over actions/deploy-pages
**Decision:** Switched from `actions/configure-pages + actions/deploy-pages@v4` to `peaceiris/actions-gh-pages@v4`.
**Why:**
- `actions/deploy-pages` requires GitHub Pages to be set to "GitHub Actions" as source — this is a manual repo setting that isn't auto-applied when Pages was already configured to deploy from a branch
- `peaceiris/actions-gh-pages` pushes the `dist/` output to a `gh-pages` branch, which works with the classic "Deploy from branch" Pages setup
- More predictable — the `gh-pages` branch is visible in the repo, easy to inspect and debug

### vite base = '/TSG-SPoG/'
**Decision:** Set `base: '/TSG-SPoG/'` in `vite.config.js`.
**Why:** GitHub Pages serves project sites (non-org/non-custom-domain) under `/<repo-name>/`. Without this base, all asset paths (`/assets/index.js`) resolve to the root domain and return 404.

---

---

## UI Overhaul (2026-06-30) — Changes Applied

### Font: Space Grotesk
**Decision:** Replaced `Segoe UI, system-ui` with Space Grotesk (Google Fonts, 300–700 weight range).
**Why:** Segoe UI is a neutral system font with no personality. Space Grotesk is geometric and slightly technical — it signals "data tool" without feeling cold. `font-variant-numeric: tabular-nums` applied globally so all numbers in tables and cards align in columns.

### Signature Element: Luminous Card Top-Edge Glow
**Decision:** CSS `::before` pseudo-element on every KPI card — a `linear-gradient(90deg, transparent, #38bdf8, transparent)` line at the top that fans out (left/right bounds expand) and increases opacity on hover; full-width with box-shadow glow when active.
**Why:** Operations dashboards need to communicate "this data is live". The glow treatment makes cards feel like illuminated data panels without adding animation overhead. It's the one memorable thing in the design — everything else is quiet.

### Filter Dropdowns: Dark `.select-dark`
**Decision:** Removed `bg-white text-gray-800` from filter selects. Created `.select-dark` CSS class: `background: #0c1929`, accent-colored SVG chevron, translucent border, focus ring.
**Why:** White dropdowns in a dark dashboard are a visual scream. This was the single biggest regression in the original design.

### Layer Headers: Accent Left-Border + Numbered Badges
**Decision:** Each layer has a `2px solid #38bdf8` left border, horizontal gradient background, and a colored number badge (`01` in accent blue, `02` in teal-green, `03` in orange).
**Why:** The original `Layer 1 / Layer 2 / Layer 3` labels had no visual weight. The numbered badge creates hierarchy and lets the eye navigate to sections quickly. Three different badge colors distinguish the layers at a glance.

### Chart Panels: `.chart-panel` Dark Inset
**Decision:** Chart visual containers now use `background: #0a1522` (darker than the layer surface) with `border: 1px solid rgba(255,255,255,0.06)`.
**Why:** Creates visible depth — the layer container → chart panel → chart itself has three distinct tonal levels. Charts no longer float on flat surfaces.

### Pill DrillToggle
**Decision:** FY/Quarter/Week segmented control changed from rectangular box buttons to a pill container with rounded buttons. Active state: `background: #38bdf8; color: #070f1a`.
**Why:** The rectangle toggle had no roundness and looked like a table row. The pill form is a standard pattern for mutually-exclusive quick filters and reads as interactive at a glance.

### Recharts Axis Cleanup
**Decision:** Removed `axisLine` and `tickLine` from all XAxis/YAxis. Reduced CartesianGrid to `rgba(255,255,255,0.05)` strokeDasharray `2 4`. Added `maxBarSize` cap on all bars.
**Why:** Axis lines double-draw the chart border and add visual noise. With a dark background, tick marks alone are sufficient for reference. Capping bar size prevents bars from becoming wall-to-wall at low data counts.

### Tooltip: Backdrop Blur + Accent Border
**Decision:** `.chart-tooltip` uses `backdrop-filter: blur(8px)`, `background: rgba(12,25,41,0.96)`, `border: 1px solid rgba(56,189,248,0.25)`.
**Why:** Glassmorphism on the tooltip keeps it legible without completely blocking the chart behind it. The accent border connects it visually to the hovered data point.

### Geo Map Marker Glow
**Decision:** SVG `filter: drop-shadow(0 0 6px <color>)` on each accuracy circle, with glow intensity matching the accuracy color (green/blue/orange/red).
**Why:** Plain colored circles on a dark map are hard to find at small sizes. The drop-shadow creates a halo that draws the eye to marker locations without requiring larger circles.

---

## Filter Bar Redesign & Live Filtering (2026-07-01)

### Clustered filter bar, not a flat dropdown grid
**Decision:** Regrouped the 12 filters into 4 icon-labeled clusters — Scope (Queue Name, Capacity Code, Plan Name), Time (Fiscal Year/Quarter/Week), People (Channel, Business Partner, L5 Manager), Geography (Region, Sub-region, DB/OSP) — with a thin accent-gradient divider between the two clusters on each row, and a small inline icon (stack / clock / person / globe) per cluster instead of one generic filter icon for the whole bar.
**Why:** The brief explicitly asked for something that doesn't read as generic BI slicers. A wall of 12 identical dropdown boxes is exactly that; grouping by what the filter actually answers (what/when/who/where) gives the bar real structure instead of decoration, and the icons let the eye chunk the bar without reading every label.

### Underline-tab select styling instead of bordered boxes
**Decision:** `.select-dark` dropped its full border/box background for a nearly-transparent field with a bottom accent underline that only lights up on hover/focus (`border-bottom` from `rgba(255,255,255,0.09)` to `#38bdf8`), plus a softer custom chevron.
**Why:** Boxed dropdowns in a row are the single most recognizable "BI slicer panel" signature. An underline-tab treatment reads as a quiet, integrated control — closer to how a native ops console treats inputs.
**Update (2026-07-01):** The 11 non-DB/OSP filters are no longer native `<select>` elements — see "Searchable multi-select filters" below — but `.ms-field` carries the exact same underline-tab visual treatment, so the look didn't change, only the interaction model underneath it.

### Searchable multi-select filters (2026-07-01)
**Decision:** Built a custom `MultiSelectField` (button + popover: search box, "Select all"/"Clear", checkbox list, native `accent-color` checkboxes) to replace every native `<select>` except the DB/OSP pill.
**Why:** Queue Name (199 options) and Capacity Code (~610) were unusable as plain dropdowns — no way to search, no way to pick more than one. A checkbox-list-with-search is structurally what Power BI's slicer does too, but the mechanism being similar doesn't make it wrong; the execution is what was asked to differ (dark glass panel, accent glow border, underline-tab trigger matching the rest of the bar) rather than the interaction pattern itself, which is the correct tool for "search + multi-select" regardless of what tool popularized it.
**Consequence:** Every filter value became an array (`[]` = no selection = "All") except `dbOsp`, which stayed a single string since the pill is a 3-way exclusive control, not a search-and-multi-select case. `mockData.js`'s `matchesMulti()` helper and `effectiveFiscalYears()` (renamed from the old singular `effectiveFiscalYear`) are the seams where every chart/card selector adapted to array-valued filters.

### Monospace font for Queue Name & Capacity Code values
**Decision:** Those two fields render in a system monospace stack; every other filter stays in Space Grotesk.
**Why:** They're literal system codes (`AM02`, `EMEA DPU BACKUPWAVE`), not prose — the drill-down table already used monospace for queue names (see Layer 3 CQN tables). Extending that convention to the filter itself makes "this is a code" legible at a glance, and costs no extra font request since it's a system stack, not a webfont.

### DB/OSP as a segmented pill, not a third binary dropdown
**Decision:** Reused the existing `.drill-toggle`/`.drill-btn` pill pattern (freed up once the per-chart FY/Quarter/Week toggle was removed) for DB/OSP/All.
**Why:** It's a 3-option exclusive choice — a dropdown for that is more clicks than it needs to be, and the pill pattern was already proven elsewhere in the app. Reusing it is more coherent than inventing a second toggle style.

### Applied-filter chip strip (the signature element)
**Decision:** Once any filter is off "All", a "Scoped by" strip appears below the filter bar — one glowing chip per active filter (`Label: Value ×`), plus "Clear all". Uses the same accent-glow language as the KPI cards' top-edge signature (glow intensifies on hover).
**Why:** This is the one thing a Power BI-style slicer panel doesn't have: a persistent, at-a-glance answer to "what is this view currently scoped to?" Real ops dashboards (Datadog, Grafana) surface active scope as removable tags for exactly this reason — it turns 12 independent dropdowns into one coherent "current view" statement, and it doubles as the fastest way to back out of a filter without hunting for which dropdown you changed.

### Live filtering via a queue fact table, not per-chart special cases
**Decision:** `ACTIVE_QUEUES` became a fact table — every queue carries region, sub-region, capacity code, business partner, L5 manager, channel, and DB/OSP tags. `filterQueues(filters)` is the single function every card and CQN-variance chart calls; `cardData(filters)`, `cqnPlanVariance(filters)`, `cqnActualVariance(filters)` all sit on top of it.
**Why:** The brief asked for every filter to visibly affect the graphs. Faking that per-chart with unrelated random scaling would look plausible but be dishonest math. A shared fact table means every filter's effect is a real re-aggregation (a real count, a real average, a real top-N) — slower to build than a fudge factor, but the numbers on screen are always literally true given the mock tags.

### DB/OSP scopes volume, not queue-portfolio membership
**Decision:** Total Queues / Forecast Accuracy / CQN Variance / both CQN-variance charts filter on 7 of the 8 queue dimensions but explicitly ignore DB/OSP; Call Volume / DB-OSP Split respect it.
**Why:** The app's default filter state has always been `dbOsp: 'DB'` (pre-existing, not new). Once filtering became real, that default was silently shrinking "Total Queues" from 199 to ~132 on first load — a queue's existence and accuracy don't depend on which slice of its call volume you're viewing, so that default shouldn't touch portfolio-level metrics. Caught by screenshotting the live app during verification, not by inspection.

---

## Chart Redesign, Geo Choropleth, RCA/CLCA Sidebar (2026-07-01)

### Centered chart titles
**Decision:** Every chart panel's title moved from a left-aligned row shared with its controls to its own centered row at the top; controls (plan pickers) moved to a second, also-centered row underneath.
**Why:** Directly requested. A left-aligned title fighting for space with right-aligned dropdowns reads as "the title lost a negotiation with the toolbar" — centering the title on its own line gives it clear top billing and reads as a proper chart heading rather than a form-field label.

### Diverging bar chart instead of two adjacent bars (CQN variance)
**Decision:** Both "CQN Highest Variance" charts (renamed "Top Queue Variance") now render one bar per queue — the variance itself — extending right (green) or left (red) from a zero baseline, instead of two side-by-side bars (Plan A vs Plan B, or Actual vs Plan) the reader had to compare by eye.
**Why:** The two-bars-per-queue version made the reader do the subtraction mentally for every row; a diverging bar shows the answer (the gap) directly, and the color does double duty as both a legend and a "good/bad" signal. This is the single biggest visualization upgrade in this pass — everything else here is refinement, this changed what the chart is actually plotting.
**Follow-up (2026-07-02):** First pass still wasn't reading well — every bar in a given "top-5 by magnitude" pull tends to cluster near the same value (see next entry), so bars looked nearly identical with nothing to visually latch onto. Added a value label at the end of each bar (`+7%`/`-7%`, colored to match) so the exact number is always visible regardless of how similar the bars look, split into two `LabelList`s using Recharts' own `position="left"`/`"right"` (a hand-computed `x`/`width` version drifted the label into the bar interior — Recharts' built-in positioning is more reliable than re-deriving bar geometry). Also rounded the axis domain/ticks to clean 5%-step values instead of whatever odd number the raw max happened to produce, and widened + smartened the queue-name truncation (breaks at the last word boundary instead of mid-word).

### Reserving color semantics: violet for neutral trends, green/red for ahead/behind
**Decision:** The Fiscal Year / Regional Plan Variance line moved from red (`#f87171`) to violet (`#a78bfa`); green/red are now used exclusively on the diverging bar charts to mean ahead-of-plan/behind-plan.
**Why:** A trend line showing "variance %" isn't inherently good or bad by itself (that judgment depends on direction and magnitude together) — coloring it red implied "this is bad" regardless of value. Freeing red for its one true job (behind plan) and giving neutral analytical lines their own color makes the color vocabulary consistent across every chart: if it's red, something is behind; nothing else claims that color.

### Forecast Variance Distribution: re-bucketed by magnitude, not accuracy tier, with data labels
**Decision:** Replaced the ≥90%/80–90%/70–80%/<70% accuracy-tier buckets with <10%/10–20%/20–30%/>30% variance-magnitude buckets, a green→blue→amber→red graduated scale, and a `LabelList` printing each segment's % directly on the bar.
**Why:** Requested directly, and it's a clearer story either way — "how far off plan is this population" (variance magnitude) is a more actionable framing for a forecasting dashboard than "what tier is this population in" (accuracy tier), and printing the value on the segment means a reader doesn't have to eyeball stacked-bar heights against the Y-axis to know a number.

### Geo Map: choropleth instead of circle markers, Sub-region instead of Country
**Decision:** Removed all `<Marker>` circles; every country `<Geography>` is now filled by its region's (or sub-region's) accuracy color directly. The Country/Region toggle became Sub-region/Region, backed by the real 24 `SUB_REGIONS` values instead of a hardcoded 14-country list.
**Why:** Requested directly — "highlight the geography... as green" is a choropleth by definition, and circles sitting on top of an otherwise-flat map don't communicate "this whole area is this color" the way a filled shape does. Sub-region replacing Country also makes the drill-down consistent with the filter bar, which already has a real "Sub-region" filter with real values.

### Illustrative country→region/sub-region mapping, with a dimmed regional fallback in Sub-region view
**Decision:** `regionForCountry()`/`subRegionForCountry()` in `mockData.js` are a hand-built, clearly-labeled-as-illustrative mapping (e.g., "ROLA" → Argentina/Chile/Colombia/Peru/etc.), not authoritative geography or real org data. In Sub-region view, a country with no specific sub-region tag falls back to its parent region's accuracy at 35% opacity, so the whole map is covered but named sub-regions still visually "pop" at full opacity against the dimmed background.
**Why:** Several real sub-region values (ROLA, UKI, CER, SER, Nordics, EC) are groups of countries, not single places, and there's no authoritative per-country mapping in the source data — so a full-coverage choropleth necessarily means inventing *some* grouping. Doing it once, explicitly, and labeling it as illustrative is more honest than leaving large parts of the map uncolored (which reads as "no data" when really it's "no specific sub-region tag") or silently treating a guess as real business data.

### RCA/CLCA as a persistent full-height sidebar, not a new section
**Decision:** `RcaClcaPanel.jsx` sits in a `position: sticky` right-hand column alongside the KPI cards and all three analysis layers, not inside or after any single layer.
**Why:** "On the right side of the dashboard" reads as the whole page, not one section — a sidebar that only sat next to the Geo Map would orphan it from the cards and the other two layers above. Sticky positioning means it stays visible as the (much taller) left column scrolls, which matters for a panel meant to be read alongside whatever chart is currently in view.
**Adjusted (2026-07-02):** Moved to start at the "Analysis Layers" divider instead of "Key Metrics" — the 5 KPI cards now span the full page width on their own row, and the sidebar only runs alongside Layers 1–3. Full-width cards read better than 5 cards squeezed to make room for a sidebar that, at that point, has nothing yet to say about any specific chart the user is looking at.

### Chart titles renamed to match their section's own naming
**Decision:** Layer 1 Visual 1 ("Fiscal Year Plan Variance") → **PoP Variation**; Layer 2 Visual 1 ("Fiscal Year Adherence") → **Actual vs Plan Variation**.
**Why:** Requested directly. Both new names echo their parent layer's own title (Layer 1 = "Plan over Plan" → PoP; Layer 2 = "Actual vs Plan" → Actual vs Plan Variation), which reads as more intentional than a generic "Fiscal Year X" pattern repeated across both layers.

---

## TSA Forecasting: New Page via Header Toggle (2026-07-02)

### Page toggle, not a route
**Decision:** `App.jsx` holds a single `page` state ('forecasting'|'tsa') and renders `ForecastingPage` or `TsaForecastingPage` — no router, no URL change.
**Why:** The app has always been a single internal tool with no need for shareable/bookmarkable URLs per page, and adding React Router for two pages would be new infrastructure for no real benefit. The existing `.drill-toggle`/`.drill-btn` pill pattern already reads as "switch between two views" everywhere else in the app, so reusing it for page-level navigation is more consistent than introducing a new nav pattern.

### ForecastingPage extracted verbatim, not rewritten
**Decision:** The entire pre-existing `App.jsx` body (filters through footer-adjacent content) moved into `ForecastingPage.jsx` unchanged; `App.jsx` became a shell with just the header, toggle, and footer.
**Why:** The Forecasting page was just declared "done" — extracting it verbatim guarantees zero visual or behavioral regression while making room for a second page. Splitting `SectionDivider` out separately (rather than duplicating it into `tsa/`) means both pages share one implementation of the "KEY METRICS" / "ANALYSIS LAYERS" label.

### Built directly from confirmed slides, no further data requests mid-build
**Decision:** Once the user said "just build the page over these two slides" (slides 5–6, ASU/SR/UCR), the page was built with reasonable illustrative choices for anything not explicitly supplied (LOB→region-plan mapping, UCR targets, ASU/SR base volumes), rather than pausing again to ask for every missing number.
**Why:** The user explicitly asked to proceed rather than wait — matching the same "real names + illustrative structure" principle already established for the MSG Forecasting page (see below), just applied to a new dataset. Real data supplied mid-build (the 33 LOB names, the TSA queue lists) was integrated immediately rather than deferred.

### No RCA/CLCA sidebar on TSA Forecasting
**Decision:** `RcaClcaPanel` only renders on the MSG Forecasting page; TSA Forecasting's 4 layers run full-width with no sidebar.
**Why:** The sidebar's actual content (RCA/CLCA findings) is MSG-Forecasting-specific illustrative copy tied to that page's metrics — copying it verbatim onto a page about ASU/SR/UCR would be visibly wrong content, and the ASU/SR/UCR slides never showed an equivalent panel. If the user wants an TSA-specific RCA/CLCA sidebar later, it should get its own content, not a reused copy.
**Update (2026-07-02):** Requested directly — see "TSA-specific RCA/CLCA sidebar content" below. `TsaRcaClcaPanel.jsx` now provides that page-specific content, following exactly the plan already laid out in this entry.

### Renamed "MSG Capacity Planning" → "TSA Forecasting" (2026-07-02, same day)
**Decision:** Renamed the page label, every component/file/folder (`capacity/` → `tsa/`, `CapacityPlanningPage.jsx` → `TsaForecastingPage.jsx`, `CapacityFilterPanel.jsx` → `TsaFilterPanel.jsx`, `CapacityChartKit.jsx` → `TsaChartKit.jsx`, `CapacityMetricCards.jsx` → `TsaMetricCards.jsx`, `CapacityGeoMap.jsx` → `TsaGeoMap.jsx`, `capacityData.js` → `tsaData.js`), and every internal identifier that carried "capacity" in its name (`capacityCardData` → `tsaCardData`, `capacityEffectiveFiscalYears` → `tsaEffectiveFiscalYears`), via `git mv` to preserve file history.
**Why:** Requested directly. The page is fundamentally about TSA (High End Storage) service-unit tracking, not a general capacity-planning concept — "TSA Forecasting" names what the page actually is. Renamed identifiers and files along with the label, not just the visible string, so the codebase doesn't end up with a page called "TSA Forecasting" built out of files and functions still named "Capacity" — that mismatch would confuse the next person (or agent) who opens the folder. The pre-existing "Capacity Code" filter field on the *MSG Forecasting* page (a real queue attribute, unrelated to this page) was deliberately left untouched — it's a different concept that happens to share a word.

### LOB filter reuses the Queue Name filter's real-data-swap pattern
**Decision:** `ucrNonAdherentQueues(filters)` checks whether the selected LOB has a `LOB_QUEUES` entry (currently only "High End Storage") and swaps to its real active-queue list when so, exactly like `cqnPlanVariance`/`cqnActualVariance` on the Forecasting page swap to genuinely filtered real queues rather than fabricating a new number per filter state.
**Why:** Consistent with the standing principle: when real data exists for a slice of the view, use it exactly; when it doesn't (every other LOB), fall back to a clearly-mock but structurally-consistent substitute rather than inventing fake per-LOB queue names.

### Region/LOB delta formula: coprime multiplier instead of a small modulus
**Decision:** `buildLobImpact()`'s per-LOB delta uses `(i*17 + ri*41) % 131` instead of the original `(i*7 + ri*13) % 21`.
**Why:** Caught during Playwright verification — the original formula's modulus (21) was small enough relative to its multiplier (7, sharing a factor of 7 with 21) that only 3 distinct residues existed, so 6+ different LOBs displayed an identical delta in the "Plan Impact Analysis" drill-down list, which looked obviously fake once several rows in a row read `-2400`. A modulus that's prime (131) paired with a coprime multiplier (17) guarantees every one of the 33 LOBs maps to a distinct residue for a fixed region — still fully deterministic mock data, just varied enough to not visually expose itself as a repeating pattern.

---

## TSA Forecasting: Total Queues Card + RCA/CLCA Sidebar (2026-07-02)

### Total Queues card replaces UCR Impacted SR, front of the row
**Decision:** Removed the "UCR Impacted SR" card (previously last) and added a "Total Queues" card at the front of the Key Metrics row, styled and worded identically to the Forecasting page's Total Queues card (`⬡` icon, "Active / Inactive" sublabel, `active / total` value, "N inactive queues" sub-line).
**Why:** Requested directly ("remove the UCR card from the last and the front add the total queues card similarly we did for MSG Forecasting"). Matching the Forecasting page's exact wording/format makes the two pages read as the same product rather than two dashboards with similar-but-different conventions for the same concept.

### `LOB_QUEUES['High End Storage']` reused as the page-level queue roster, not one LOB's sample
**Decision:** `TSA_ACTIVE_QUEUE_NAMES`/`TSA_INACTIVE_QUEUE_NAMES` (new in `tsaData.js`) point at the same real 71 active / ~150 inactive names already in `LOB_QUEUES['High End Storage']`, but the Total Queues card treats them as the whole page's queue count, not filtered to that one LOB.
**Why:** The user said "I have already given you a list of active and inactive queues for TSA" — referring to the only real per-queue name lists this page has. Treating them as LOB-scoped (the original framing when they were first added, for the UCR non-adherent-queue drill-down) would leave the Total Queues card with no real numbers to show for the other 32 LOBs; treating them as the page's queue roster uses real, business-supplied data honestly instead of inventing placeholder counts for LOBs with no real queue data. Flagged in `handoff.md`/`tech_spec.md` as a decision to revisit if real per-LOB queue lists arrive later.

### Region tagging via `inferRegion()`, reused rather than re-implemented
**Decision:** Exported `inferRegion()` from `mockData.js` (was file-local) and reused it in `tsaData.js` to tag each TSA active queue name with a region for the Total Queues donut.
**Why:** The TSA queue names follow the exact same prefix convention (`APJ …`, `EMEA …`, `NAMER …`, `LATAM …`, else `Global`) as the Forecasting page's queue names — writing a second, near-identical region-inference function would just be the same regex copy-pasted under a new name.

### Total Queues drill-down: same donut-then-table mechanic, minus the Accuracy column
**Decision:** Mirrored the Forecasting page's `QueuesByRegionChart` + `QueueTable` almost verbatim (click a slice or legend entry to filter the table to that region, "Clear" to reset) but dropped the Accuracy column from the table.
**Why:** Requested directly ("drilldown should be similar pie chart we did for MSG Forecasting"). Accuracy is a forecast-quality concept tied to MSG Forecasting's plan/actual data; TSA queues in this list have no equivalent real metric, so showing a column here would mean fabricating a number just to look consistent — Queue + Region is the honest subset of that pattern.

### TSA-specific RCA/CLCA sidebar content, not a copy of the Forecasting page's
**Decision:** New `TsaRcaClcaPanel.jsx`, wired into `TsaForecastingPage.jsx` with the identical sticky-sidebar-next-to-Analysis-Layers layout as `RcaClcaPanel`/`ForecastingPage.jsx`, but with its own illustrative findings written in this page's own vocabulary (ASU/SR/CPASU/UCR/LOB) instead of reusing the Forecasting page's queue/call-volume-themed copy.
**Why:** Requested directly ("add RCA and CLCA section similarly we did for MSG Forecasting") — "similarly" was read as *same mechanism and layout*, not *same words*, consistent with the standing decision already on record in this file ("No RCA/CLCA sidebar on TSA Forecasting... If the user wants an TSA-specific RCA/CLCA sidebar later, it should get its own content, not a reused copy").

---

## TSA Forecasting: Card Modals, Renames, Layer 3 Redesign (2026-07-02)

### Card drill-downs: modal popups, not inline panels (TSA Forecasting only)
**Decision:** `TsaMetricCards.jsx`'s 5 card drill-downs moved from an inline panel below the cards row to a centered modal (new `Modal` in `TsaChartKit.jsx`), closable via backdrop click or ✕.
**Why:** Requested directly — "display the detailed view as a popup modal instead of navigating to a new page... allow users to close it and return to the dashboard without losing their current filter selections." This deliberately diverges from the Forecasting page's "no modals except the CQN Variance year-click" rule (see "Drill-down as inline panel" above) — that rule described an established pattern for *that* page; this request is explicit and scoped to TSA Forecasting's cards, so it doesn't retroactively apply elsewhere. Filters live one level up in `TsaForecastingPage`, so opening/closing the modal never touches them — closing always returns to the dashboard exactly as filtered.

### YTD message replaces "Plan X · Y% adherence" on ASU/SR/CPASU cards
**Decision:** `tsaCardData()` now computes a year-over-year % delta (`yoyPct`) for ASU, SR, and CPASU — latest in-scope FY vs the one before it. The card sub-line reads `YTD <FY>: <value> · ▲/▼ X% vs <prior FY>`, with a colored status pip.
**Why:** Requested directly ("add a YTD message... show increase/decrease as per your wish"). CPASU inverts the color logic (`lowerIsBetter`) since a falling CPASU is the desirable direction, consistent with the card's existing "lower is more efficient" framing — ASU/SR keep growth-is-good coloring. When filters narrow to a single FY there's no prior year to compare, so the message falls back to "no prior year in scope" rather than a misleading 0%.

### SR Actuals popup: grouped columns instead of stacked bar
**Decision:** Removed `stackId` from the DB/OSP bars in the SR Actuals drill-down chart.
**Why:** Requested directly.

### CPASU popup: line-only instead of Composed (bars + line)
**Decision:** Dropped the SR/ASU bars from the CPASU card's popup, leaving a single `LineChart` of CPASU across fiscal years.
**Why:** Requested directly ("show a line chart... showing only the CPASU over years").

### Plan Impact: 4-region set (AMER/APJ/EMEA/Global) replaces the deck's 3-region set
**Decision:** `IMPACT_REGIONS` changed from `['NAMER','EMEA','APJ']` to `['AMER','APJ','EMEA','Global']`.
**Why:** Requested directly for both ASU Layer's and SR Layer's Plan Impact visuals. Reused the same constant for CPASU Trend's region breakdown (below) instead of introducing a second region list — one 4-region set for every region-scoped TSA visual is more coherent than two overlapping ones.

### CPASU Trend: regions-by-default, click-to-drill into time granularity
**Decision:** Replaced the Region/Country toggle on "ASU Impact on SR Trend with CPASU" (renamed **CPASU Trend**) with a region-default view — grouped ASU/SR bars + CPASU line, one group per `IMPACT_REGIONS` entry. Clicking a region's bar drills into that region's own trend, rendered at whichever of Week/Quarter/Year is most specific in the top filter bar (`regionTrendGranularity()`), with a "← All Regions" pill to back out.
**Why:** Requested directly — "show the regions as default and when we click any particular region it should show up the year or quarter or week when selected from the filters at the top." No real per-region/per-quarter/per-week dataset exists, so `cpasuTrendByRegion()` synthesizes it deterministically from the same FY baselines used everywhere else on this page (documented as illustrative in `tech_spec.md`) — dividing each FY's baseline across the periods within it, rather than inventing an unrelated dataset or silently ignoring the requested drill.

### UCR Impact on SR: renamed series, added a (cosmetic) Plan selector in the corner
**Decision:** "SR (Human)" → **SR's**, "SR (Bots)" → **UCR Handled SR's**. Added a `PlanSelect` in the visual's top-right corner via a new `cornerControls` slot on `Visual` (`TsaChartKit.jsx`), positioned absolutely instead of the usual centered-below-title `controls` row.
**Why:** Both requested directly, including the specific "top right corner" placement — a deliberate one-off exception to the page's usual centered-controls convention (see "Centered chart titles" above) because the request was explicit about the corner rather than a stylistic default. The selector doesn't yet feed into `srBotsByFY()`'s output, matching the existing precedent of AsuLayer/SrLayer Visual1's Plan dropdown, which is also not yet wired to the underlying numbers.

### UCR Runrate with Target: fixed at fiscal-year granularity, top-5-LOB modal replaces the queue list
**Decision:** The chart now always plots `UCR_BY_FY` directly (all 3 fiscal years), ignoring Quarter/Week filter narrowing. The previously always-visible "queues not adhering to target" list is gone; clicking a year's bar opens a modal listing that year's top 5 non-adherent **LOBs** (not queues), via new selector `topNonAdherentLobsByYear()`.
**Why:** Requested directly ("keep it at fiscal year default", "top 5 LOB's not adhering... give a pop-up (design on your convenience)"). Modal-on-bar-click for a "top N" list directly mirrors the CQN Variance year-click modal already established on the Forecasting page — reusing a proven pattern rather than inventing a new one from scratch. Switching from queues to LOBs left `LOB_QUEUES`'s real per-queue data (High End Storage) without a UI consumer for now — see `handoff.md` and `tech_spec.md`'s Known Limitations.

---

## Card Drill-Downs: Modal Popups on the Forecasting Page Too (2026-07-02)

### Shared `Modal` component, extracted to `src/components/Modal.jsx`
**Decision:** The `Modal` popup originally built for TSA Forecasting's cards (`src/components/tsa/TsaChartKit.jsx`) moved to a top-level `src/components/Modal.jsx`; `TsaChartKit.jsx` now re-exports it (`export { Modal } from '../Modal'`) so every existing TSA import keeps working unchanged. `MetricCards.jsx` imports it directly.
**Why:** The request was to give the Forecasting page's cards the exact same modal behavior TSA Forecasting already has — reusing the one implementation both pages now need is more honest than copy-pasting the same ~30 lines of overlay markup into a second file, and guarantees the two pages' modals stay visually identical as either evolves.

### Forecasting page's card drill-downs: inline panel → modal
**Decision:** `MetricCards.jsx`'s `DrillDownPanel` (rendered inline below the cards row) became `DrillDownModal`, wrapped in the shared `Modal`. The nested `YearQueueModal` (CQN Variance's year-click drill) is unchanged — it's now a modal nested inside a modal instead of a modal nested inside an inline panel, but its own implementation and behavior didn't need to change.
**Why:** Requested directly, explicitly extended to "do this for MSG Forecasting as well" after TSA Forecasting got the same treatment. This supersedes the page's original "Drill-down as inline panel (not modal)" decision (see above) — closing the modal only clears `MetricCards`' local `active` state, so `filters` (owned by `ForecastingPage`) is never touched, meaning the dashboard is exactly as filtered when the modal closes, matching the "without losing current filter selections" requirement.

---

## MSG Forecasting: Corrected Queue Roster (2026-07-02)

### Replace the arrays wholesale, not merge/append
**Decision:** `ACTIVE_QUEUE_NAMES` and `INACTIVE_QUEUE_NAMES` in `mockData.js` were fully replaced with the newly business-supplied lists (47 active, 146 inactive), rather than merged with the prior 199/406 names.
**Why:** The new lists were explicitly labeled "for MSG Forecasting... update accordingly," and cross-checking showed every name in both new lists already existed somewhere in the old lists (the new active list is a subset of the old active list; the new inactive list is a subset of the old inactive list, plus `'CCC MidRange Mandarin'` moved over from active) — this reads as a corrected, pruned roster the business wants reflected exactly, not an addition to what was already there. Merging would have kept ~350+ names the correction was meant to drop.
**Verified before applying:** scripted checks (not manual eyeballing) confirmed no duplicate names within either new list and no overlap between the two new lists, since a name appearing in both would silently break `filterQueues`'s assumption that a queue is either active or inactive, never both.

### No code changes needed — the pipeline was already count-agnostic
**Decision:** Only the two array literals changed; `filterQueues`, `callVolumeByFY`, `dbOspVolumeByFY`, `cardData`, and the CQN-variance selectors were left untouched.
**Why:** Every one of those functions already reads `ACTIVE_QUEUE_NAMES.length` or `ACTIVE_QUEUES.length` dynamically rather than a hardcoded `199` — a queue-count change is exactly the kind of update this data model was built to absorb without a code change. This is also why the Call Volume/DB-OSP baseline totals (285.4K/268.7K) didn't need touching: they scale by a ratio (`filtered / total active`) that's still 1.0 with no filters applied, regardless of how many rows are on each side of that ratio.

---

## Filter Bar Gap Fix + Light/Dark Theme Toggle (2026-07-02)

### TSA filter bar gap: match the Forecasting page's already-correct flex pattern
**Decision:** Added `flex-1 min-w-0` to `TsaFilterPanel.jsx`'s `Cluster` grid div, mirroring `FilterPanel.jsx`'s `Cluster` (`className="grid grid-cols-3 gap-x-3 flex-1 min-w-0"`).
**Why:** The Time cluster's outer wrapper correctly received extra width via `flex: 4 4 0`, but the grid div inside it — a plain flex child with no `flex-grow` of its own — doesn't inherit that width automatically; it sizes to its own content and leaves the parent's allocated-but-unclaimed space as a visible gap before the next cluster. The Forecasting page's filter bar never had this bug because its `Cluster` already included the class; TSA's was written slightly differently when the page was first built and missed it.

### CSS custom properties, not a second stylesheet or a CSS-in-JS library
**Decision:** Theme values live as CSS custom properties in `:root` (dark) and `[data-theme='light']` (`src/index.css`), toggled by setting a `data-theme` attribute on `<html>`. No new dependency, no duplicated stylesheet, no per-component theme prop drilling.
**Why:** Every shared visual "chrome" class (`.card-panel`, `.chart-panel`, `.select-dark`, etc.) already lived in one CSS file — swapping their hardcoded hex for `var(--token)` and adding one override block gets both pages reskinned from a single source of truth. Persisting the choice to `localStorage` and applying the attribute inside `App.jsx`'s `useState` initializer (not a `useEffect`) avoids a flash of the wrong theme on load, since it runs before first paint.

### Chart/data colors stay constant across themes; only "chrome" switches
**Decision:** Backgrounds, borders, and primary/secondary/muted/faint text all reroute through theme variables. Chart series colors (the blue/orange/violet role assignments), the ahead/red-behind convention, region color palettes, the geo accuracy color scale (green/blue/orange/red), status badges, and the "01/02/03/04" layer-number badges keep their exact literal hex in both themes.
**Why:** These are meaningful data-encoding colors, not decoration — the same convention most ops dashboards (Grafana, Datadog) use: light/dark mode changes the canvas, not what a color *means*. Re-deriving the whole data palette per theme would risk breaking the "if it's red, something is behind plan" vocabulary established across both pages' design history, for a benefit (perfect light-mode chart hues) that doesn't materially help readability — every one of these colors already has enough contrast against both a near-white and a navy background.

### Geo maps keep an always-dark canvas regardless of theme
**Decision:** `Layer3GeoMap.jsx` and `TsaGeoMap.jsx`'s map container (background, `DEFAULT_FILL`, country stroke/fill, the bottom accuracy-scale gradient, and the "no data" empty-state text) stay hardcoded dark in both themes. Only the chrome *around* the map (layer header, legend, summary table, the floating hover tooltip) follows the theme.
**Why:** A choropleth's fill colors are calibrated against a specific backdrop — flipping the canvas to white would wash out `DEFAULT_FILL` (the "no data" gray) and change how the accuracy colors read, without a proportional benefit. Keeping the map itself a dark "instrument panel" is a common pattern for embedded map/geo visuals regardless of host UI theme (weather widgets, ops dashboards). The floating hover tooltip is a separate element using the shared `.chart-tooltip` class, so it still re-themes correctly even though it sits visually on top of the fixed-dark map.

### `--accent` itself changes value between themes, with a paired `--accent-contrast`
**Decision:** `--accent` is `#38bdf8` (bright sky blue) in dark mode but `#0284c7` (a deeper, more saturated blue) in light mode; a separate `--accent-contrast` token (`#070f1a` dark / `#ffffff` light) is used wherever text sits *on top of* a solid accent fill (e.g. the active pill-toggle state).
**Why:** `#38bdf8` directly on a near-white page background has poor text contrast (it's barely darker than white) — the sun/moon toggle's own label color, `SectionDivider`'s "ANALYSIS LAYERS" label, and similar accent-as-text usages needed a deeper blue in light mode to stay legible. But that same deeper blue needs light text on top of it (not the dark navy text that works against the *bright* dark-mode accent) — hence the separate contrast token instead of a single hardcoded value.

---

## Global Time-Granularity Toggle: Quarter/Month/Week for Both Pages (2026-07-02)

### Placement: inside the filter bar, top-right, not a separate control or the header
**Decision:** The View By pill sits in the filter bar itself — same row as the value-filter clusters, after a divider, right-aligned (it ends up there naturally: the clusters' `flex-grow` consumes whatever width the fixed-size pill doesn't need, so no extra positioning trick was required).
**Why:** Researched before building (per the request) — dashboard UX guidance on filter placement says page-wide filters belong in a horizontal filter bar or toolbar rather than scattered per-widget, and time-granularity/date-range controls specifically are conventionally placed prominently and persistently near the other filters, often paired with a date-range picker. That argued against two alternatives considered: the app header (reserved for page-level chrome like the MSG/TSA toggle and the light/dark switch — a different category of setting, not a data view control) and a brand-new toolbar row of its own (adds UI surface for one control when the existing filter bar already is the page's "toolbar"). Sources: [Pencil & Paper — Filter UX Design Patterns](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-filtering), [Pencil & Paper — Dashboard Design UX Patterns](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards), [Evolving Web — Date Filter UI Patterns](https://evolvingweb.com/blog/most-popular-date-filter-ui-patterns-and-how-decide-each-one).

### A view setting, not a value filter — visually distinct despite sharing the bar
**Decision:** The toggle uses the existing `.drill-toggle`/`.drill-btn` pill styling (already established for DB/OSP, the MSG/TSA page switch, and the light/dark toggle) rather than a `MultiSelectField`, and is labeled "View By" rather than "Granularity" or a plain filter name.
**Why:** It changes *how* every time-axis chart renders (what granularity its x-axis uses), not *which rows are in scope* — a fundamentally different kind of control than the other 7-12 filters in the bar, even though it lives in the same row. Reusing the pill pattern (rather than a new widget) keeps it visually consistent with the app's other pill toggles instead of introducing a fourth control style.

### No option selected by default (corrected same day)
**Decision:** Unlike the DB/OSP pill (always exactly one of DB/OSP/All active, no "off" state), the View By pill starts with none of Quarter/Month/Week highlighted, and clicking the currently-active option deselects it back to that default. `granularity` state defaults to `null`, not `'Quarter'`.
**Why:** Shipped defaulting to `'Quarter'` first, which changed every chart's out-of-the-box look (12 quarterly bars instead of the original 3 fiscal-year bars) — caught immediately when the user compared against the dashboard's established default. The correct default is "no selection," matching how every value filter in the bar already defaults to "All" rather than a pre-picked value; "no selection = Fiscal Year" keeps that same convention instead of inventing a fourth granularity concept. This also exposed a latent bug: `regionTrendGranularity()`'s `= 'Quarter'` default *parameter* only fires when the argument is omitted, not when it's explicitly `null` — since the real caller always passes the toggle's actual value now (including `null`), that default silently never engaged, and `null` fell through to the Quarter branch anyway. Fixed by checking for falsy/`'Year'` explicitly and returning plain fiscal years, the same pattern every other granularity-aware selector already used.

### One shared expansion helper for additive fields, a separate one for rates
**Decision:** `expandToGranularity()` divides an FY value across its sub-periods (with a small wobble) for additive/volume fields — ASU/SR counts, call volume, plan dollars. `expandRateToGranularity()` instead keeps percentage/rate fields (UCR target/current) at the same magnitude across every sub-period, only wobbling them slightly.
**Why:** An FY plan of 24,000 ASUs genuinely represents ~6,000 per quarter (additive — the whole year's total is the sum of its quarters), but a UCR target of 88% doesn't represent "22% per quarter" (a rate is the same kind of number regardless of the window you measure it over). Applying the additive divide to a rate field was an actual bug caught during verification — the first pass divided UCR target/current by 4/12/52 the same way as volumes, which would have shown target percentages in the low single digits at Week granularity. Caught by writing a throwaway Node script that exercised every changed selector at all three granularities before calling this done, not by inspection.

### Stacked percentage distribution doesn't reuse either helper
**Decision:** MSG's "Forecast Variance Distribution" (a 4-bucket stacked % chart) gets its own expansion: each sub-period keeps the parent FY's bucket *mix* with a wobble, renormalized so the 4 buckets still sum to ~100%.
**Why:** Neither generic helper fit — dividing the buckets (like a volume) would make them stop summing to 100%; leaving them completely untouched (like a rate) would make every sub-period within a year look identical, which is less useful for a granularity toggle whose entire point is to show variation across the finer time window.

### The global toggle supersedes two decisions made earlier the same day
**Decision:** TSA's "UCR Runrate with Target" chart, fixed to always render at Fiscal Year in the previous change ("keep it at fiscal year default"), now responds to the global granularity toggle like every other time-axis chart. The CPASU Trend region-drill's granularity, previously inferred from which of the top filter bar's Quarter/Week filters happened to be selected, is now driven directly by the global toggle instead.
**Why:** The request was explicit that "all the graphs should interact with" the new control — a page-wide granularity setting that silently exempts two charts (one of which had *just* been hardcoded to ignore time filters, for unrelated reasons at the time) would be a confusing inconsistency. Superseding an same-day decision this quickly is unusual, but the new instruction is more specific and directly contradicts the old one for these two charts specifically.

### Region/queue/LOB-axis charts are exempt by nature, not by omission
**Decision:** Plan Impact (region x-axis), Top Queues by Variance (queue x-axis), both Geo Maps (region/sub-region), and the LOB donut breakdowns don't take a `granularity` argument at all.
**Why:** These charts don't have a time axis to begin with — there's no "week" of a region or a queue. Making "all the graphs interact with the filter" literal would mean inventing a meaningless per-week region breakdown; the honest reading is "every chart whose axis is time," which is exactly what changed.

---

## Landing Page + MSG/TSA Capacity Plan Pages (2026-07-03)

### Landing tiles + per-business sub-toggle, not a 4-way top-level toggle
**Decision:** Instead of extending the existing header pill to 4 options (MSG Forecasting/MSG Capacity/TSA Forecasting/TSA Capacity), the app now opens on a dedicated "TSG SPoG" landing screen with two tiles (MSG/TSA); picking one opens that business section, which has its own 2-way Forecasting/Capacity Plan toggle scoped to it.
**Why:** Requested directly and explicitly explained by the user before any screenshots were sent — "front page where there will be two business... clicking on MSG tile it should open the MSG page with toggle between MSG Forecasting and MSG Capacity Plan." A flat 4-way pill would bury the business-level distinction (MSG vs TSA) inside a single row of similarly-styled buttons; a landing page makes "pick your business first" a real, separate decision, and the header toggle only ever needs to express one binary choice (which sub-page) once a business is chosen.

### Home button next to the logo, not a tab or breadcrumb
**Decision:** A single icon button (house glyph) sits immediately left of the logo, only rendered when a business section is open; clicking it returns to `view: 'landing'`.
**Why:** Asked directly ("A home button would be fine") after being offered as an option for "how do I get back to the tiles." Placing it at the logo (the conventional "go home" spot in web apps) needed no new UI real estate and reads as an obvious affordance without a label.

### Each business remembers its own last-viewed sub-page independently
**Decision:** `msgSubPage` and `tsaSubPage` are two separate `useState` values in `App.jsx`, not one shared `subPage` reset whenever `view` changes.
**Why:** Not explicitly requested, but the alternative (a single shared sub-page that resets to Forecasting every time you go home and pick a business again) would silently discard the user's position if they're bouncing between MSG and TSA Capacity Plan mid-session — a small persistence a user would expect from an app framed around "hopping between businesses," and cheap to provide since it's just a second `useState`.

### Two data-only clarifying-question round trips before building
**Decision:** Asked the same clarifying question about MSG Capacity Layer 3's two near-identical visual descriptions ("Actual vs Target Utilization" vs "Queues with Aux culprit") via `AskUserQuestion` twice, at the user's explicit request ("wait" → "ask again" → "ask the same question again you asked me earlier"), rather than assuming the first answer stood or silently re-asking with different wording.
**Why:** The user explicitly asked to see the exact same question repeated, not a rephrased one — re-issuing it verbatim (same options, same framing) respected that literally rather than guessing they wanted something reworded. Confirmed answer both times: Visual 1 is a time-axis trend chart with an Aux-code tooltip; Visual 2 is a per-queue ranking chart, mirroring the existing "Top Queues by Variance" convention already established on MSG Forecasting.

### `ChartKit.jsx` promoted out of `TsaChartKit.jsx`, not duplicated a third time
**Decision:** Moved `Visual`/`Tip`/`PlanDropdowns`/`PlanSelect`/`CategoryTick`/`truncate`/`PillButton` from `tsa/TsaChartKit.jsx` into a new top-level `src/components/ChartKit.jsx`; `TsaChartKit.jsx` became a two-line re-export shim (`export { Modal } from '../Modal'; export * from '../ChartKit'`) so no existing TSA import had to change. Added `BinaryToggle` (generic two-state pill switch) to the same new file.
**Why:** Both Capacity pages need the exact same chart-panel/tooltip/plan-picker primitives TSA Forecasting already had — copying them a third time (MSG Forecasting already has its own near-duplicate) would mean three implementations of the same `Visual` wrapper to keep in sync forever. Promoting once, with a compatibility shim for the existing import path, cost nothing existing and let every subsequent Region/Country toggle (there are six across the two new pages) share one `BinaryToggle` instead of a bespoke switch per file.

### Shared `PlanOverPlanLayer`, parameterized by a `dataFn` prop
**Decision:** Built MSG Capacity's "Plan over Plan Comparison" layer once as `src/components/capacity/PlanOverPlanLayer.jsx`, taking `dataFn(filters, granularity)` as a prop; TSA Capacity Plan reuses the identical component, just passing its own `planOverPlanFteByFY` selector.
**Why:** Both mockups specify the literal same layer — one full-width chart, Plan A/B dropdowns, a variance % line — differing only in which numbers back it. Building an MSG-specific copy first and then noticing TSA needed the identical thing (caught before TSA Capacity was started) made the "parameterize by data source" refactor an easy call rather than a late one.

### TSA Capacity reuses `tsa/TsaFilterPanel.jsx` directly, unmodified
**Decision:** `TsaCapacityPage.jsx` imports `TsaFilterPanel` from `../tsa/TsaFilterPanel` as-is, rather than building a new `TsaCapacityFilterPanel.jsx`.
**Why:** The mockup's filter list for TSA Capacity Plan (LOB, Fiscal Year/Quarter/Month/Week, Business Partner, Global Grouping) is field-for-field identical to TSA Forecasting's, and `TsaFilterPanel` is already a stateless controlled component with no page-specific hardcoding (filters/onChange/granularity/onGranularityChange props only) — building a byte-identical second copy would be pure duplication for zero behavioral difference. MSG Capacity Plan, by contrast, has a genuinely different filter set (Combined Queue Name/Capacity Code/Plan Name/Business Org/Country, no LOB) from MSG Forecasting, so it got its own `MsgCapacityFilterPanel.jsx`.

### MSG Capacity Utilization Layer: two visuals with near-identical descriptions, disambiguated by axis
**Decision:** "Actual vs Target Utilization" (Visual 1) is a time-axis (Fiscal Year/Quarter/Week) trend with a custom tooltip surfacing which Aux code drove any shortfall; "Queues with Aux Culprit" (Visual 2) is a queue-axis horizontal-bar ranking of which specific queues have the worst Aux-driven utilization gap, worst-first.
**Why:** The mockup's text for both visuals read almost identically, which is why this was the one thing asked about before building (see the clarifying-question entry above). Resolving it by axis — one chart answers "how are we trending over time," the other answers "which queues are the problem" — reuses the exact "diverging/ranking queue chart" pattern already established for Top Queues by Variance on MSG Forecasting, rather than inventing a third chart shape for a page that's supposed to feel like the same product.

### Aux-culprit fields attached after granularity expansion, not passed through it
**Decision:** `utilizationByFY()` computes `auxCulprit`/`auxImpactPct` per output row by array index, after calling `expandRateToGranularity()` on the numeric `actual`/`target` fields, rather than trying to pass the categorical Aux-code field through the expansion helper itself.
**Why:** `expandRateToGranularity`/`expandToGranularity` are built for numeric fields (percentages or volumes) — a categorical string field like an Aux-code name has no meaningful "expansion" operation. Attaching it post-hoc, keyed by the resulting array's index (which is correct regardless of whether the array has 3/12/36/156 rows for Year/Quarter/Month/Week), avoided modifying the shared expansion helpers to special-case a non-numeric field that only this one chart needs.

### Two sort-direction bugs caught by Node smoke tests, not code review
**Decision:** `utilizationByQueue()` was fixed from sorting ascending by `|utilGap|` (which surfaced the *best*-adhering queues) to descending (worst first); `leavesByQueue()` was fixed from sorting ascending by raw delta only (which missed large positive-delta outliers, biasing toward queues with fewer-than-planned leaves) to selecting the top-N by `|delta|` descending first, then re-sorting that shortlist ascending for display.
**Why:** Both bugs were invisible from reading the code — the sort call looked reasonable in isolation. Writing a Node smoke-test script that actually printed the resulting rows for a representative filter set (before any UI was built on top of the data module) surfaced both immediately: the "worst queues" list was showing near-perfect adherence, and the "outage" list was all negative deltas. This is the same "verify with real output, not just a clean build" discipline used for every granularity-toggle change earlier in this project.

### `TSA_GEO_SLO_BY_REGION` values tuned to hit the mockup's literal "2 regions at risk" text
**Decision:** The 4 illustrative region SLO values were chosen (97/88/96/79) so that exactly 2 sit below the FY27 SLO target (95), rather than picking arbitrary-looking numbers that happened to produce 1 or 3.
**Why:** The mockup's card sub-message is a specific, literal number ("2 regions at risk") — since this is illustrative mock data anyway (no real per-region SLO dataset exists), there was no reason not to tune it to match the one concrete detail the mockup specified, rather than let an arbitrary formula produce a number that visibly contradicts the mockup's own text.

### TSA Capacity's Sankey: illustrative CQN tiers as sources, real LOB names as targets
**Decision:** `workloadSankey()` uses 3 fixed illustrative source-node labels (`CQN-Standard`/`CQN-Critical`/`CQN-Enterprise`) flowing into 4 real LOB names (`Networking`/`Storage`/`Server`/`ScaleVault`, all genuine entries from `LOB_LIST`).
**Why:** TSA Capacity Plan's filter set has no per-queue (CQN) dimension of its own — LOB is the only real categorical axis this page's filters expose. Rather than fabricate fake per-queue names to match the mockup's "CQN to LOB" framing literally, the source tiers are clearly-illustrative priority-band labels while the target nodes use real business names, following the same "real names + illustrative structure" principle as every other mock dataset in this app.

### TSA Capacity Geo Map renumbered from the mockup's "Layer 5" to badge 04
**Decision:** The mockup's screenshots show Layer 1 → Layer 2 → Layer 3 → Layer 5 for this page's geo map, with no Layer 4 shown anywhere. The shipped UI labels it **04**.
**Why:** A visible gap in sequential badge numbering (01, 02, 03, 05) would read as a bug or a missing section to anyone looking at the page, not as a faithful reproduction of the source deck's own typo/gap. Every other layer-badged section in this app (both Forecasting pages, MSG Capacity) uses strictly sequential 01-04 numbering; matching that convention here is more consistent than preserving an apparent numbering mistake from the mockup.

---

## MSG Capacity Plan: Revision Pass — Filters, Cards, Drills, Aux Detail (2026-07-03)

### Filters: reuse MSG Forecasting's own lists instead of page-specific ones
**Decision:** Plan Name now uses `mockData.js`'s `PLAN_NAMES` (was a page-specific `CAPACITY_PLAN_NAMES`), Sub-region uses the same `SUB_REGIONS` list as MSG Forecasting; Business Org and Country were removed entirely rather than kept as unused/decorative fields.
**Why:** Requested directly ("Use same plan name for MSG Capacity used for MSG Forecasting," "remove this filter completely" for Business Org, "remove this completely and add sub-region instead"). Neither `businessOrg` nor `country` was ever consumed by a data selector on this page beyond narrowing the queue fact table — removing them outright (rather than leaving inert filter chips) is honest about what actually drives the page's numbers, and reusing Forecasting's own lists keeps a queue's Plan Name/Sub-region options identical whichever MSG page you're on.

### Sub-region tag reused from ACTIVE_QUEUES, not re-derived
**Decision:** `CAPACITY_QUEUES`'s `subRegion` field reads `ACTIVE_QUEUES[i]?.subRegion` (same index, same source array) instead of building an independent round-robin assignment.
**Why:** Both fact tables are built from the identical `ACTIVE_QUEUE_NAMES` array in the same order — reusing the existing tag guarantees a queue shows the same sub-region on MSG Forecasting and MSG Capacity, whereas two independently-computed round-robins (even both deterministic) would drift apart the moment their modulo arithmetic differed even slightly. One source of truth for a fact that's supposed to be the same fact everywhere.

### Cards: YTD/YoY sub-message, reusing TSA Forecasting's own pattern verbatim
**Decision:** All 5 MSG Capacity cards now show `YTD <period>: <value> · ▲/▼ X% vs <prevPeriod>` via a `ytdSub` helper copied structurally from `TsaMetricCards.jsx`, replacing each card's static "Target ..."/"Plan ..." sub-line. The headline value drills with the page-wide granularity toggle (`capacityCardData(filters, granularity)`); the YoY comparison itself stays FY-over-FY regardless of granularity.
**Why:** Requested directly for all 5 cards, plus "cards should change according to the quarter, month and week slicer." Reusing the exact pattern already proven on TSA Forecasting (rather than inventing a new sub-line format) keeps every card across the app speaking the same "YTD vs prior year" language. FY-over-FY YoY regardless of granularity mirrors `tsaCardData`'s own reasoning: the sub-year numbers are synthesized from the FY total via a deterministic wobble, so a "quarter vs same quarter last year" comparison would be comparing two synthetic numbers with no real independent basis — the FY comparison is the only one with an actual signal behind it.

### Total FTE / Attrition: inverted color logic now compares YoY, not vs plan/target
**Decision:** Both cards' green/red status now reflects the YoY direction (`yoyPct`) rather than actual-vs-plan/target — an increase is red (bad) for both, a decrease is green (good).
**Why:** Requested directly ("if total FTE is increased over past year then it is not a good sign for business... show it as red and vice versa," repeated for Attrition). This is a different axis than the card's own headline number staying an absolute value (still "actual" for FTE, "actual %" for Attrition) — only the color judgment moved from a static-target comparison to a YoY one, consistent with every other card on this page now being framed around YTD/YoY.

### Attrition and Plan over Plan Variation: region/sub-region drill, not a flat lens toggle
**Decision:** Both visuals moved from a cosmetic "Region/Country lens" (a small multiplier that barely changed the numbers) to a real click-to-drill mechanic: a default view with one bar per region or sub-region key (sized by `shareByKey` — each key's share of currently in-scope queues), and clicking a bar drills into that key's own FY/granularity trend via `attritionTrendByDimension`/`planOverPlanTrendByDimension`.
**Why:** Requested directly and specifically ("the region and sub-region toggle should work like keep the graph at region level and when user clicks on particular region the Fiscal year graph should open and should be able to change according to the filters above"). This is the exact same "region-level default, click to drill into time trend" mechanic already proven on TSA Forecasting's CPASU Trend (`AsuSrTrendLayer.jsx` Visual1) — reusing a pattern the codebase already has, rather than inventing a new interaction, for a request that describes that pattern almost verbatim.

### `shareByKey` extracted as a shared helper, not duplicated per visual
**Decision:** A single `shareByKey(rows, key)` function computes a `{key: share}` distribution for either `'region'` or `'subRegion'`, used by both `attritionByDimension` and `planOverPlanByDimension` (and their trend-drill counterparts).
**Why:** Both visuals needed the identical "how should a Region/Sub-region default view distribute a single aggregate baseline across N keys" logic — deriving shares from actual queue counts (rather than hand-maintaining a hardcoded share table with an entry per region AND per sub-region, 4 + 24 = 28 magic numbers) scales automatically if `SUB_REGIONS` or `REGIONS` ever change, and guarantees the shares are internally consistent with whatever queues the current filters actually left in scope.

### Attrition tooltip: raw attritted-employee count added alongside the percentage
**Decision:** A new `attritionCount` field (`Math.round(headcount * attrition / 100)`) is computed per row and shown in a custom tooltip below the existing Headcount/Attrition-% lines, rather than added as a third plotted series.
**Why:** "Attrition % along with original number should be shown" — read as "the underlying count, not just the ratio," since a bare percentage without its denominator's scale is genuinely harder to reason about. Surfacing it in the tooltip (rather than a third bar/line) keeps the chart itself uncluttered while still making the number available on hover, consistent with how Utilization's Aux breakdown and Plan-over-Plan's queue-variance tooltip also carry supporting numbers that don't need their own axis.

### "Headcount Impact on SL" defaulter list: AND, not OR
**Decision:** `slDefaulterQueues` requires **both** `actualHC > planHC` **and** `slActual < 90` — a queue that's merely over headcount plan (with healthy SL) or merely below 90% SL (while adequately staffed) no longer appears.
**Why:** Requested directly and explicitly: "if the actuals are more than plan and still SL% dropped below 90 then those queues should be shown." The old logic (over-plan headcount alone) answered a different, less actionable question — "who's overstaffed" — the new rule specifically surfaces "who's overstaffed AND still failing," which is the genuinely alarming case worth a manager's attention (extra heads didn't fix the problem).

### Plan over Plan Variation: split into its own component instead of extending the shared layer
**Decision:** Built a new MSG-only `PlanOverPlanVariationLayer.jsx` rather than adding Region/Sub-region toggle + queue-variance-ranking branches to the shared `capacity/PlanOverPlanLayer.jsx` that TSA Capacity also uses.
**Why:** None of these new capabilities were requested for TSA Capacity's Plan-over-Plan layer, and TSA doesn't have an equivalent per-queue variance concept (it has LOBs, not queues) to rank in the first place. Branching the shared component on a page-specific feature set (`if (page === 'msg') {...}`) would make it neither simple nor truly shared — splitting cleanly here, while leaving TSA's usage of the original shared component completely untouched, keeps both call sites simple. The now-unused `planOverPlanHCByFY` selector and its `CAPACITY_PLAN_VS_PLAN_BY_FY`-consuming function were removed from `msgCapacityData.js` as dead code once nothing called them anymore.

### "Queues with Highest Variation" reuses the polished diverging-bar convention, not a plain list
**Decision:** The new queue-variance ranking is a diverging horizontal bar chart with a zero `ReferenceLine`, rounded axis ticks, and `+X%`/`-X%` value labels printed at each bar's end via two sign-split `LabelList`s — the exact same construction as Forecasting's "Top Queues by Variance" charts (`Layer1PlanOverPlan.jsx` Visual3), not the simple text-list format used by HeadcountLayer's SL-defaulter list or Utilization's leaves list.
**Why:** Explicitly called out as "the most important graph in MSG Capacity planning... make it worth" — the diverging-bar-with-labels treatment is this codebase's most visually resolved pattern for "which of these things is furthest off," reserved until now for the Forecasting page's own headline variance charts. Giving this visual the same treatment (rather than a plain sorted list, which several other defaulter/outage lists on this page already use) signals it's meant to carry the same weight.

### Utilization: 3-Aux breakdown instead of a single culprit, everywhere a culprit was shown
**Decision:** `utilizationByFY` now returns a sorted `auxBreakdown` array (top 3 by impact) instead of a single `auxCulprit`/`auxImpactPct` pair (kept as `auxBreakdown[0]` for anything still expecting the old shape); `utilizationByQueue` similarly returns 3 distinct `auxes` per queue. Visual1 also gained an Adherence % trend line.
**Why:** Requested directly for both visuals ("it can be driven by many auxes show at least 3," "Add 2-3 auxes in the list as well") plus "Show a line for adherence as well." A single culprit code was always a simplification — real utilization shortfalls are rarely attributable to exactly one Aux code — so surfacing the top 3 (still deterministic mock data, same "real-code-names + illustrative structure" convention) is a more honest shape for what the tooltip claims to explain.

### Renaming "Outage — Actual vs Target Leaves" to "Leave Impact — Actual vs Target"
**Decision:** The user asked for a better name but didn't supply one ("I am not getting any name rn"); picked "Leave Impact — Actual vs Target."
**Why:** The visual shows which queues are burning more leave-days than planned and by how much — "impact" better captures "this is a contributing factor to a problem" than "outage" (which implies the leaves themselves are the failure, when really they're a driver of understaffing/SL risk elsewhere on the page). Matches the "Actual vs Target" phrasing pattern already used by Visual1's title on the same layer, for naming consistency within the layer.

### Geo Map: Sub-region replaces Country, mirroring MSG Forecasting's own fallback mechanic exactly
**Decision:** The Region/Country `BinaryToggle` became Region/Sub-region, using `subRegionForCountry`/`SUB_REGIONS` and the identical "unmapped countries fall back to their parent region's shade at 35% opacity, suppressed once Region/Sub-region filters already narrow the view" logic as `Layer3GeoMap.jsx`.
**Why:** Directly requested, and once Country was removed as a filter dimension entirely (see above), keeping a Country-based map view would have been the one place on the page still referencing a retired concept. Sub-region is also the correct replacement dimension precisely because it's now a real filter on this page's own filter bar (unlike the old curated 14-country list, which had no matching filter) — map view and filter dimension now agree, matching how the region/sub-region relationship already works on MSG Forecasting's own Geo Map.

---

## MSG Capacity Plan: Cases per FTE Card + RCA/CLCA Sidebar (2026-07-03)

### Total FTE → Cases per FTE, not an additional 6th card
**Decision:** The "Total FTE" card was replaced outright by "Cases per FTE" rather than adding Cases per FTE as a new sixth card.
**Why:** Requested directly ("Change the Total FTE card to Cases per FTE"), read as a swap, not an addition — the 5-card row layout stays intact and Total FTE's underlying headcount data is still fully visible elsewhere on the page (HeadcountLayer's "Actual vs Plan Variation" visual), so nothing was actually lost by dropping its own dedicated card.

### Cases per FTE: YTD-only, the one card without a YoY comparison
**Decision:** `ytdSub` is bypassed for this one card — its sub-line is a plain `YTD ${period}: ${actual}` string with no `▲/▼ X% vs prevPeriod` suffix and no trend pip, unlike all 4 other cards on this page.
**Why:** Requested directly ("show the card as YTD only"). Rather than compute a `yoyPct` the UI would just discard, `capacityCardData`'s `casesPerFte` field only carries `{actual, plan, period}` — no `prevPeriod`/`yoyPct` at all, so the data shape itself documents that no comparison is expected here, instead of leaving unused fields that a future reader might assume are wired up somewhere.

### Cases per FTE popup: Actual vs Plan lines, not a single trend
**Decision:** The drill-down chart plots two lines (Actual, Plan — dashed) instead of one, matching the request literally ("cases per FTE actual and Plan").
**Why:** Every other single-metric popup on this page's cards (SL%, Attrition) plots one line because there's genuinely one number to show; Cases per FTE explicitly has two (an actual and a plan), so the chart follows the same "one line per real distinct series" rule rather than picking one arbitrarily.

### RCA/CLCA sidebar: same mechanism, page-specific content
**Decision:** New `MsgCapacityRcaClcaPanel.jsx`, wired into `MsgCapacityPage.jsx` with the identical sticky-sidebar-next-to-Analysis-Layers layout as `RcaClcaPanel`/`TsaRcaClcaPanel`, with its own illustrative findings written in this page's vocabulary (staffing, utilization, SL%, attrition, Cases per FTE) instead of reusing either Forecasting page's copy.
**Why:** Requested directly ("add a RCA and RLCA section as we did for MSG Forecasting") — "as we did" was read as *same mechanism and layout*, not *same words*, consistent with the identical precedent already established when TSA Forecasting got its own RCA/CLCA sidebar (see "TSA-specific RCA/CLCA sidebar content" above). MSG Capacity Plan didn't have this sidebar originally because the mockups it was built from never showed one; adding it now is a direct, explicit request rather than a gap being filled in retroactively.

---

## TSA Capacity Plan: Full Revision Pass (2026-07-03)

### Global Grouping: correcting a shared, previously-inferred constant
**Decision:** `GLOBAL_GROUPING_LIST` in `tsaData.js` was replaced wholesale with the 5 real values from a screenshot (`COMPUTE/NETWORKING`, `DPU/UDX`, `HCX`, `OTHER`, `PRIMARY/MIDRANGE`), affecting both TSA Forecasting and TSA Capacity Plan since they share this one constant.
**Why:** `tech_spec.md` had flagged this list as "inferred, not yet user-confirmed" since it was first added — the screenshot is the business confirming the real list, so replacing the placeholder is a correction, not scope creep. Both TSA pages picking it up automatically (rather than needing two separate edits) is exactly why the constant was shared in the first place.

### Applying MSG Capacity's exact patterns, adapted from queues to LOBs
**Decision:** Card YTD/YoY messaging (`ytdSub`), the Attrition/Plan-over-Plan region+sub-region click-to-drill mechanic, and the diverging-bar-with-labels "highest variation" ranking were all reused structurally from MSG Capacity Plan's just-completed revision, substituting TSA's LOB fact table (`TSA_CAPACITY_LOBS`) wherever MSG used its queue fact table (`CAPACITY_QUEUES`).
**Why:** The request explicitly asked to "make it similar we made it for MSG Capacity Planning" for several visuals — reusing the same mechanism (not just the same visual style) means both Capacity pages behave identically for a user switching between them, which is the whole point of "similar." A `tsaShareByKey`/`shareByKey` pair (one helper per page, same logic) was kept as two small functions rather than one cross-page shared helper, since each operates on a different page's own fact table shape — sharing it would mean passing awkward field-name parameters for marginal benefit.

### TSA has no Sub-region filter, so a `subRegion` tag was added purely to back the new drills
**Decision:** `TSA_CAPACITY_LOBS` gained a `subRegion` field (round-robin over the real 24 `SUB_REGIONS`, same convention as `ACTIVE_QUEUES`/`CAPACITY_QUEUES`), even though TSA Capacity's filter bar has no Sub-region filter field of its own (unlike MSG Capacity, which added one this same session).
**Why:** The Geo Map request ("worldwide SLO... region and sub-region wise") and the Attrition/"make it similar to MSG" request both need a real sub-region dimension to drill into, and TSA's filter set (reused unmodified from TSA Forecasting) wasn't in scope to change. Adding the data-layer dimension without a matching filter field is consistent with how `tsaUtilByFY`'s pre-existing Region/Country lens already worked (a real interactive toggle backed by illustrative data, with no corresponding top-bar filter) — the toggle narrows what a *chart* shows, not what rows are in scope.

### Plan over Plan Variation: LOBs, not a fabricated per-queue concept
**Decision:** The new TSA-specific Plan over Plan Variation layer ranks LOBs in its "highest variation" chart, mirroring MSG's queue-ranking chart exactly except for the entity being ranked.
**Why:** Requested directly ("Build similar to MSG Capacity planning - but show LOB's instead of CQN"). TSA Capacity has no per-queue dimension anywhere else on the page (Workload Distribution's "CQN" mode queue names are the one exception, and those are explicitly illustrative-flow labels, not a fact table) — ranking real LOBs, which this page already has as its natural unit of measurement, is more honest than inventing per-queue mock data just to match MSG's chart literally.

### Workload Distribution's LOB/CQN toggle: real names on both sides
**Decision:** The Sankey's toggle swaps which illustrative tier labels feed into which real name list — LOB mode keeps the existing CQN-tier→real-LOB flow; CQN mode introduces LOB-tier→real-TSA-queue flow, with the queue names filtered against `LOB_QUEUES['High End Storage'].active` to guarantee they're genuine.
**Why:** Requested directly ("give a toggle to switch from LOB to CQN... utilize some TSA LOB's and some TSA Queues"). Filtering the hardcoded queue-name list against the real source array (rather than trusting the literal strings match) means a future rename or typo in either list fails loudly (fewer Sankey targets than expected, caught by the Node smoke test) instead of silently drifting from the source data.

### Workload Distribution Visual2/Visual3: reinterpreting "Workload Act vs Plan" as Average Case Time
**Decision:** "Workload Act vs Plan" (previously backed by a `workloadByFY`/`WORKLOAD_BY_FY` hours-volume dataset) was renamed "Average Case Time Variance" and repointed at the same `actHrsByFY` (Average Case Time) data that "ACT Trend — Actual vs Plan" already used — both visuals now plot the identical metric, one as bars with an Adherence % line, the other as a trend line with the same Adherence % line, and both gained a "top LOBs above target" list.
**Why:** The request explicitly named the target metric "Average Case Time" for visual #2, then said visual #3 ("ACT Trend") should be "similar to Average Case Time Variance" — "ACT" already stands for Average Case Time (used verbatim as visual #3's own abbreviation), which strongly suggests the original "Workload Act vs Plan" name was itself a garbled reference to this same metric, not a genuine "workload volume" concept, and the request is correcting that naming confusion rather than asking for two literally-different metrics to be merged. The now-unreferenced `workloadByFY`/`WORKLOAD_BY_FY` were removed as dead code once nothing called them.

### Utilization Variance's lens toggle: relabeled, not rebuilt
**Decision:** `tsaUtilByFY`'s `lens` parameter stays internally `'Region'|'Country'` with its original small cosmetic scale factor — only the UI-facing `BinaryToggle` label changed from "Country" to "Sub-region."
**Why:** "Actual vs Plan Utilization... make it similar to MSG Capacity Planning" was read as applying to the visual's *name* (renamed "Utilization Variance") given the request's next line explicitly separately asks for Sankey/Geo Map to gain real region+sub-region treatment — a full share-weighted sub-region calculation for a rate/percentage metric (utilization %) doesn't carry the same meaning it does for headcount/attrition volumes (a percentage isn't "a share of the total" the way a headcount is), so keeping the existing nudge-factor mechanism and just fixing its stray "Country" label (which was never backed by real per-country data either) was the proportionate fix.

### Geo Map: same fallback mechanic as MSG, ported directly
**Decision:** `TsaCapacityGeoMap.jsx`'s new Region/Sub-region toggle uses the identical "unmapped country falls back to parent region at 35% opacity" logic as `MsgCapacityGeoMap.jsx`/`Layer3GeoMap.jsx`, backed by a new `geoSloBySubRegion()`/`TSA_GEO_SLO_BY_SUBREGION` (24 real sub-regions, rotating through the existing 4-region SLO baseline).
**Why:** Requested directly ("It should [show] worldwide SLO likewise - region and sub-region wise"), and this exact mechanic already exists twice in the codebase (MSG Forecasting, MSG Capacity) — porting it a third time for TSA Capacity is more consistent than any alternative sub-region-fallback design, and the "worldwide" framing fits naturally since the fallback ensures full map coverage regardless of view mode.

### Shared `capacity/PlanOverPlanLayer.jsx` deleted once orphaned
**Decision:** Once TSA Capacity's Plan over Plan layer switched to its own `PlanOverPlanVariationLayer.jsx` (matching MSG Capacity's earlier switch), the original shared `src/components/capacity/PlanOverPlanLayer.jsx` had no remaining importers anywhere in the app — it and its now-empty `capacity/` folder were deleted rather than left as dead code.
**Why:** The component was built specifically to be shared between the two Capacity pages' identical-at-the-time Plan-over-Plan layers; once both pages independently outgrew it in different directions, keeping the file around would just be a maintenance trap for a future reader wondering whether it's still used. Confirmed orphaned via a full-repo grep before deleting.

### RCA/CLCA sidebar: same mechanism, own vocabulary, third time
**Decision:** `TsaCapacityRcaClcaPanel.jsx` follows the identical sticky-sidebar-next-to-Analysis-Layers pattern as the other three pages' RCA/CLCA panels, with illustrative content written in this page's own terms (staffing, attrition, Cases per FTE, Average Case Time, SLO).
**Why:** Requested directly ("add RCA and RLCA section like we did for MSG Capacity") — by this point the pattern is fully established (MSG Forecasting → TSA Forecasting → MSG Capacity → TSA Capacity), so there was no ambiguity left to resolve: same mechanism, own words, per the standing precedent recorded earlier in this file.

---

## MSG Forecasting: Total Queues Drill-Down — Active + Inactive + Business Partner Breakdown (2026-07-08)

### Tag the inactive roster instead of leaving it structureless
**Decision:** `INACTIVE_QUEUES` gives each of the 146 inactive names a `region` (via the same `inferRegion()` regex `ACTIVE_QUEUES` already uses) and a `businessPartner` (round-robin over the real `BUSINESS_PARTNERS` list) — attributes it never had before.
**Why:** The request needed the donut and the new Business Partner table to place inactive queues somewhere real — without at least region and business-partner tags, "show both active and inactive" would have nothing to group inactive queues by. Reusing the exact same tagging mechanism `ACTIVE_QUEUES` already uses (rather than inventing a new one) keeps the "real names + illustrative structure" convention consistent across both rosters.

### A status toggle that doesn't hide the other status
**Decision:** The All/Active/Inactive pill controls which rows the donut *plots*, but the center label and every slice's tooltip always show the region's Active/Inactive split regardless of which view is selected.
**Why:** "We need to figure out a way to show both active and inactive queues" reads as a requirement that both numbers stay visible, not that a toggle merely lets you flip between them one at a time (a plain toggle alone would still hide one status at any given moment). Keeping the breakdown always-visible in the center label and tooltip satisfies "show both" directly, while the toggle still gives a way to isolate one status in the donut's own shape for someone who wants that.

### Business Partner Breakdown as a separate table, not folded into the region table
**Decision:** A new `BusinessPartnerTable` sits below the existing region-filtered queue table, rather than adding a Business Partner column to that table or replacing it.
**Why:** "A table for BP queues list and a split of active and inactive queues for them" describes a BP-indexed summary (one row per partner, with counts), which is a different shape from the existing queue-indexed table (one row per queue). Keeping both gives two complementary views — "which queues are in this region" and "how is this business partner's portfolio split" — without cramming two different grains of data into one table.

### Hover tooltip for queue names, not a click-to-expand or a native `title` attribute
**Decision:** `HoverCount` shows a styled `.chart-tooltip` popup listing queue names on `onMouseEnter`, matching every other hover tooltip already in the app, rather than a native HTML `title` attribute or a click-to-expand row.
**Why:** Requested directly ("when we hover on that number we would be able to see the queue name"). A native `title` tooltip can't scroll or wrap a long name list and looks visually inconsistent with the rest of the dashboard's custom tooltips; reusing the existing `.chart-tooltip` styling (scrollable, monospace queue names, same as the region donut's own tooltip) keeps this new element visually native to the app instead of introducing a new interaction pattern.

### Total Queues drill-down only honors the Region/Business Partner filters for the combined view
**Decision:** `allQueuesByStatus`/`queuesByBusinessPartner` narrow both rosters by `filters.region`/`filters.businessPartner` only — the other 6 Queue filters (Capacity Code, Channel, Sub-region, L5 Manager, Queue Name, DB/OSP) are silently not applied to this specific view.
**Why:** The inactive roster only has region and business-partner attributes — applying a Capacity Code filter, for instance, has no inactive-side data to check it against. Rather than either (a) making the whole combined view ignore the ambient filters entirely, or (b) hiding all inactive queues the moment any other filter is touched, honoring the two dimensions both rosters share is the same reasoning already established for this card ("Total Queues... ignores the DB/OSP toggle" — a queue's existence doesn't depend on a filter dimension it doesn't have data for).

---

## Per-Graph RCA/CLCA Popup (2026-07-10)

### Small "i" button + one-sentence popup, not a repeat of the sidebar
**Decision:** `GraphInsightButton` shows exactly one RCA sentence and one CLCA sentence per graph, in a small popup — not a multi-bullet panel like the page-level RCA/CLCA sidebars.
**Why:** Requested directly and explicitly ("dont exhaugarete it just a small pop up is fine"). The page-level sidebar already covers page-wide findings; a per-graph popup answering "what does *this specific chart* suggest" is a different, narrower question, and keeping it to one sentence each stops 35 new popups from turning into 35 more sidebars' worth of content to author and maintain.

### One shared `Visual`-level prop pair (`rca`/`clca`), not a wrapper component per chart
**Decision:** The button is wired into the existing shared `Visual` component itself (two new optional string props), rather than asking every chart file to import and manually place a separate `<GraphInsightButton>` element.
**Why:** With ~35 charts across 4 pages, doing this at the `Visual` level means each individual chart only needed a 2-line prop addition, not a structural change to its JSX. Making the props optional (button renders nothing if both are omitted) meant every existing `Visual` call site elsewhere in the app kept working unchanged during the rollout — the change was purely additive.

### Positioned top-left, opposite `cornerControls`
**Decision:** The button always sits in the visual's top-left corner; `cornerControls` (Region/Sub-region toggles, Plan selectors, etc.) keeps its existing top-right slot.
**Why:** Several visuals already place a toggle in the top-right via `cornerControls` — reusing that same slot for the insight button would force a choice between the two on crowded charts. A fixed, dedicated corner for each concern (data-scope controls on the right, this new "why" popup on the left) avoids collisions across all 35 charts without needing to special-case any of them.

### MSG Forecasting's Layer1/Layer2 kept their own local `Visual`, not migrated to the shared one
**Decision:** `Layer1PlanOverPlan.jsx`/`Layer2ActualVsPlan.jsx` (which predate `ChartKit.jsx`'s promotion and still define their own local `Visual`/`Tip`/color-role constants) got the `rca`/`clca` prop handling added to their *own* local `Visual`, importing only the shared `GraphInsightButton` — they were not migrated to import the shared `Visual` wholesale.
**Why:** Migrating them would mean reconciling two independently-evolved local `C` color-role objects and `Tip` tooltip formatters against the shared ones — a bigger, riskier change than what was asked for. Extending their local `Visual` with the same two props achieves the same visible feature with much less blast radius; the two files' near-duplicate `Visual` definitions were an accepted, pre-existing state of the codebase (see the ChartKit.jsx promotion entry above), not something this request needed to resolve.

### Geo Maps: button placed directly in each map's own toggle row
**Decision:** The 4 Geo Maps (which use a custom `layer-header` + content layout, not `Visual`) each got `GraphInsightButton` inserted directly into their existing toggle row, using `justify-content: space-between` so it sits opposite whatever Region/Sub-region (or dual metric+view, for MSG Capacity) toggle already lives there.
**Why:** These 4 components never adopted `Visual`'s layout, so the prop-based approach didn't apply — but the same "small button, opposite the existing toggle" placement rule was still followed for visual consistency with the other 31 charts, rather than inventing a different treatment for maps.

---

## Per-Card RCA/CLCA Popup (2026-07-10)

### Card container changed from `<button>` to `<div role="button">`
**Decision:** Each page's local `Card` component (the whole KPI card is one big clickable element opening its drill-down) switched from `<button onClick={...}>` to `<div role="button" tabIndex={0} onClick={...} onKeyDown={...}>`.
**Why:** The new insight button is a real `<button>` element, and nesting a `<button>` inside another `<button>` is invalid HTML (the outer element's content model doesn't permit interactive descendants) — browsers handle it inconsistently and screen readers announce it confusingly. Swapping the outer element for a `div` with `role="button"` and an explicit `onKeyDown` (Enter/Space) preserves the exact same click and keyboard behavior the card already had, while making the nested real `<button>` valid.

### Same one-sentence RCA/CLCA content shape as the graphs
**Decision:** Every card's popup follows the identical shape established for graphs earlier the same day — one RCA sentence, one CLCA sentence, via the same `GraphInsightButton`.
**Why:** The request extended the existing ask ("also add i button for each and every card and graph") rather than describing a new interaction — reusing the exact same component and content conventions means cards and graphs read consistently, and no new UI pattern had to be invented for cards specifically.

### Positioned top-right (not top-left, unlike graphs)
**Decision:** On cards, the button sits top-right of the card header; on graphs, it sits top-left (opposite `cornerControls`).
**Why:** Cards have no existing top-right control to collide with (unlike many graphs, which use `cornerControls` for Region/Sub-region toggles) — top-right reads naturally as "a small badge in the corner of this card" without needing to reserve the graph convention's specific corner. Consistency of *meaning* (small "i" badge = insight popup) mattered more here than consistency of *position*, since cards and graphs are visually distinct enough that a reader won't expect the exact same pixel corner.

---

## What Was Deliberately NOT Done

| Thing skipped | Reason |
|---|---|
| Redux / Zustand for state | Overkill for current scope; local useState is sufficient |
| TypeScript | Not requested; JS keeps iteration fast |
| Unit tests | Not requested at this stage |
| Backend API | Out of scope — placeholder for real data integration |
| Mobile responsive layout | Dashboard is designed for ops-center / desktop screens (1280px+) |
| Code splitting | Bundle size (~711KB) is acceptable for internal tool; can be optimised later |
| Custom font | Avoided extra network request; Segoe UI is already on Windows machines |
