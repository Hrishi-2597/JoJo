export const PLAN_NAMES = ['AOP_FY26Q4_AA', 'FY27 Q1 APR Plan', 'FY27 Q2 JUN Plan', 'FY27Q1_AA']

// Capacity Plan pages re-plan on a monthly cadence rather than the Forecasting
// pages' quarterly AOP naming, so they get their own Plan Name list. 'Actual' is a
// real selectable value here (both Capacity filter bars default to it) — Plan A/B
// pickers filter it out the same way Forecasting's plan dropdowns already do.
export const CAPACITY_PLAN_NAMES = ['Actual', 'Dec Plan', 'Jan Plan', 'April Plan']

// Business Org filter (ESG Capacity only) — illustrative sibling org units alongside
// the one this page is scoped to by default. Unused/dead code (this filter was
// removed from the page itself, see design_choice.md) — kept in sync with the
// TSG->ISG/MSG->ESG/TSA->HES rename anyway in case it's ever revived.
export const BUSINESS_ORGS = ['ISG ESG', 'ISG HES', 'ISG Core']

// Country filter (MSG Capacity only) — a curated, real-country list distinct from the
// exhaustive world-atlas country groupings the geo choropleths use; COUNTRY_REGION is
// a simple lookup for whichever capacity selectors need to narrow by region via a
// selected country, decoupled from the choropleth's own regionForCountry() (that one's
// tuned to world-atlas's exact naming, this one doesn't need to be).
export const COUNTRIES = [
  'United States', 'Canada', 'Brazil', 'Mexico', 'Argentina',
  'United Kingdom', 'Germany', 'France', 'South Africa',
  'India', 'China', 'Japan', 'Australia', 'Singapore',
]
export const COUNTRY_REGION = {
  'United States': 'NAMER', 'Canada': 'NAMER',
  'Brazil': 'LATAM', 'Mexico': 'LATAM', 'Argentina': 'LATAM',
  'United Kingdom': 'EMEA', 'Germany': 'EMEA', 'France': 'EMEA', 'South Africa': 'EMEA',
  'India': 'APJ', 'China': 'APJ', 'Japan': 'APJ', 'Australia': 'APJ', 'Singapore': 'APJ',
}

export const FISCAL_YEARS = ['FY25', 'FY26', 'FY27']

// Fiscal Quarter filter options: FY25Q1 ... FY27Q4
export const FISCAL_QUARTERS = FISCAL_YEARS.flatMap(fy => ['Q1', 'Q2', 'Q3', 'Q4'].map(q => `${fy}${q}`))

// Fiscal Week filter options: FY25W01 ... FY27W52
export const FISCAL_WEEK_LIST = FISCAL_YEARS.flatMap(fy =>
  Array.from({ length: 52 }, (_, i) => `${fy}W${String(i + 1).padStart(2, '0')}`)
)

// Fiscal Month options: FY25M01 ... FY27M12 — canonical here; tsaData.js imports this
// instead of keeping its own duplicate (TSA Forecasting was the first page with a
// Month filter, but this is now shared by the granularity toggle on both pages).
export const FISCAL_MONTH_LIST = FISCAL_YEARS.flatMap(fy =>
  Array.from({ length: 12 }, (_, i) => `${fy}M${String(i + 1).padStart(2, '0')}`)
)

// ── Global time-granularity toggle (Quarter / Month / Week) ───────────────────
// A page-wide view control (not a value filter): both pages let the user pick what
// axis granularity every period-keyed chart renders at, instead of everything being
// fixed at Fiscal Year. Charts whose x-axis is something other than time (region,
// queue, LOB) aren't affected — there's no "week" of a region.
export function periodsForGranularity(granularity, years) {
  const list = granularity === 'Month' ? FISCAL_MONTH_LIST
    : granularity === 'Week' ? FISCAL_WEEK_LIST
    : FISCAL_QUARTERS
  return list.filter(p => years.includes(p.slice(0, 4)))
}

function periodsPerYear(granularity) {
  return granularity === 'Month' ? 12 : granularity === 'Week' ? 52 : 4
}

// Expands an FY-level {period, ...rawFields} series into quarter/month/week-level
// synthetic points, dividing each FY's raw values across the periods within it with
// a small deterministic wobble — same technique TSA's cpasuTrendByRegion already
// used for its own region-drill trend. Callers recompute any derived/getter field
// (adherence, variance, etc.) from the divided raw fields afterward; ratios stay
// approximately consistent since both sides of a ratio scale down together.
export function expandToGranularity(fySeries, granularity, rawFields) {
  if (!granularity || granularity === 'Year') return fySeries
  const divisor = periodsPerYear(granularity)
  return fySeries.flatMap((row, ri) => {
    const periods = periodsForGranularity(granularity, [row.period])
    return periods.map((period, i) => {
      const wobble = 0.9 + ((i * 13 + ri * 7) % 21) / 100
      const out = { period }
      rawFields.forEach(k => { out[k] = Math.round(row[k] / divisor * wobble) })
      return out
    })
  })
}

// For rate/percentage fields (targets, adherence-style values) rather than additive
// volumes — dividing a percentage by the sub-period count would be meaningless (a
// UCR target of 88% isn't "22% per quarter"). These stay in the same magnitude
// across every sub-period, with only a small wobble for variety.
export function expandRateToGranularity(fySeries, granularity, rateFields) {
  if (!granularity || granularity === 'Year') return fySeries
  return fySeries.flatMap((row, ri) => {
    const periods = periodsForGranularity(granularity, [row.period])
    return periods.map((period, i) => {
      const wobble = 0.96 + ((i * 13 + ri * 7) % 9) / 100
      const out = { period }
      rateFields.forEach(k => { out[k] = +(row[k] * wobble).toFixed(1) })
      return out
    })
  })
}

export const CHANNELS = ['Voice', 'Chat', 'Email', 'Social']
export const REGIONS = ['APJ', 'EMEA', 'Global', 'LATAM', 'NAMER']

export const SUB_REGIONS = [
  'Australia', 'Brazil', 'CER', 'China', 'Costa Rica', 'EC', 'Egypt', 'EMEA', 'France',
  'Germany', 'Global', 'India', 'Israel', 'Japan', 'Korea', 'Multiple SubRegions',
  'Nordics', 'Panama', 'ROLA', 'SER', 'South Asia', 'UKI', 'United Kingdom', 'United States',
]

export const L5_MANAGERS = [
  'Ashford, Priya', 'Bellweather, Owen', 'Carrow, Marguerite', 'Winslow, Damian',
  'Fairbanks, Renata', 'Castellan, Mateo', "O'Halloran, Liam", 'Corin Vasquez', 'Owen Bellweather',
  'Delacroix, Simone', 'Marlowe, Trent', 'No Assigned L6', 'Ashcombe, Peregrine', 'Thorne, Cassius',
  'Okafor, Adaeze',
]

export const BUSINESS_PARTNERS = [
  'Helena Marsh', 'Diego Ferreira Costa', 'Mei Ling Tan', 'Rafael Andrade', 'Wendy Callahan',
  'Andres Molina', 'Sanjay  Nair',
]

export const CAPACITY_CODES = [
  'AM02','AM04','AM05','AM08','AN02','AN03','AO06','AO11','AO14','AP10','AP11','AP12',
  'AP13','AP14','AP15','AP16','AP17','AP18','AP19','AP20','AP21','AP22','AP23','AP24',
  'AP25','AP26','AX01','AZ09','AZ10','AZ11','AZ13','AZ16','BAH1','BL17','BPS1','BR02',
  'BT01','BT02','BT03','BT04','BT05','BT06','BT07','BT08','BT09','BT10','BT11','BT12',
  'BT13','BT14','BW01','BW02','BW03','BX02','BZ10','BZ11','BZ13','BZ14','BZ15','BZ19',
  'BZ20','BZ21','BZ22','BZ24','CC03','CC04','CC05','CC07','CC09','CC10','CC11','CC12',
  'CC13','CC14','CC22','CC23','CC27','CC28','CC29','CCB1','CCB2','CE01','CE02','CE03',
  'CG Comp','CG01','CGEQ','CGGC','CGVE','CGVX','CHEQ','CM01','CM03','CM04','CM05',
  'CSS1','CSX4','CSX5','CT11','CT12','CT13','CT14','CT15','CT16','CT17','CT18','CT19',
  'CT20','CT23','CT24','CT25','CT26','CT27','CT29','CT30','CT32','CT34','CT35','CT36',
  'CT37','CT38','CT67','CT68','CT69','CT70','CT76','CT91','CT95','CT96','CTA3','CTA4',
  'CTA5','CTA6','CTA7','CTE2','CTE3','CTE4','CTE6','CV01','CV02','CV03','CV04','CV05',
  'CX01','CX02','CX03','CX04','CX05','CZ03','DE07','DE08','DE09','DE10','DE12','DE13',
  'DE17','DE18','DP01','EC03','EC04','EC06','EC07','EC14','EC21','EC30','EC32','EC33',
  'EC34','EC39','EG13','EMC1','EN01','ER02','ES01','ES03','ES06','ES07','FD01','FED4',
  'FED6','FR05','FR06','FR07','FR08','FR09','FR11','FR12','FR13','FR23','FR27','GB01',
  'GB08','GB09','GB10','GB11','GB13','GB14','GB16','GB18','GB19','GB21','GB23','GB29',
  'GB31','GC02','GC04','GC06','GC11','GC12','GC13','GC14','GC16','GC17','GC18','GC19',
  'GC20','GC21','GC22','GC23','GC24','GC25','GCF1','GCTE','GG01','GH01','GH02','GH03',
  'GH04','GH05','GH06','GH07','GH08','GH09','GH10','GH11','GH12','GH13','GH14','GH15',
  'GH16','GH17','GH18','GH19','GH20','GH21','GH22','GH23','GH24','GH25','GM01','GP01',
  'GS01','GS02','GS03','GS04','GS05','GT06','HC06','HC07','HE01','HE02','HE03','HE04',
  'HE06','HE09','HE12','HE16','HE17','HE20','HE22','HE23','HE24','HE25','HE26','HE28',
  'HE29','HE30','HE32','HE36','HE37','HE38','HE39','HE40','HE41','HE42','HE43','HE44',
  'HE47','HE48','HE52','HE53','HE58','HE59','HE61','HE62','HE63','HE64','HE66','HE67',
  'HE68','HE70','HE71','HE72','HE73','HE74','HE78','HE81','HE85','HE93','HE95','HEA2',
  'HEA5','HEA9','HEB0','HEB4','HEB5','HEC5','HEC6','HEC7','HED1','HED2','HED3','HED7',
  'HEE4','HEE5','HEF2','HEF5','HEG3','HEG4','HEG8','HEH4','HEH5','HEH6','HEJ1','HEK8',
  'HEL1','HEL2','HEL3','HEL4','HEL5','HW03','HW06','HWPA','ID06','IM01','IN01','IN14',
  'IN15','IN16','IN19','INCV','INPX','INT1','IS01','IS02','IS03','IS04','IS05','IS11',
  'IS14','IS15','IS19','IS20','IS21','IS23','IS24','IS31','IS32','IS34','IS36','IS37',
  'IS38','IS41','IS42','IS47','IS48','IS50','IS51','IS58','IS59','IS61','IS63','IS64',
  'IS65','IS68','IS69','IS74','IS75','IS77','IS78','IS85','IS86','IS88','IS90','IS91',
  'IS92','IS96','IS98','IT04','IT08','IT10','IU02','IU05','IU06','IU13','IU14','IU16',
  'IU20','IU23','IU23a','IU24','IU29','IU30','IU32','IU33','IU40','IU41','IU43','IU45',
  'IU45a','IU46','IU56','IV01','IV03','JM01','JP11','JP13','JP19','JP22','JP24','JP25',
  'JP26','JP27','JP29','JV01','KR05','KR06','KR11','KR12','KR13','KR14','L2G4','L2G5',
  'LFT1','LOS0','LOS1','LOS2','LOS3','LOS4','LOS5','LS01','MR01','MR02','MR03','MY11',
  'MY13','MY14','MY15','NA01','NALC','NC04','NC14','ND02','ND03','NE02','NE04','NE05',
  'NE06','NE07','NE08','NE09','NE13','NE14','NE20','NE21','NE25','NE27','NE29','NE31',
  'NE33','NE35','NE36','NE38','NE39','NF01','NF02','NF03','NF04','NF05','NF06','NF09',
  'NF10','NF11','NF12','NF13','NF14','NF15','NF16','NF17','NF18','NF19','NF20','NF21',
  'NF22','NF23','NF24','NF25','NF26','NF27','NF28','NF29','NF30','NF31','NF32','NF33',
  'NF34','NF35','NF36','NF37','NF40','NF41','NF42','NF43','NF44','NF45','NF46','NF47',
  'NF48','NF49','NF50','NF53','NF54','NF56','NF57','NF58','PE01','PF01','PG01','PH08',
  'PHSS','PM01','ProtectCore','PP21','PS03','PS10','QCE1','RAH1','RE03','RL02','RL05',
  'RL09','RL10','RL11','RL12','RL14','RL15','RL16','RL18','RL19','RM02','ROEN','RP01',
  'RP02','RP03','RPS1','RR02','RR03','RTC1','SA10','SE02','SM02','SMP1','SMP2','SMP3',
  'SMP4','SMP5','SMP6','SMP7','SMP8','SP04','SP09','SP10','SS03','SW02','SY01','TH04',
  'TH07','THBW','UK03','UK05','UK06','UK07','UNOP','UPP1','VCF1','VCF2','VN02','VN03',
  'VN04','VX01','VX02','VX03','VX04','WM01','WM02','WM03','WM04','WM05','WP01','XE01',
  'XE02',
]

// ── Real queue name lists ─────────────────────────────────────────────────────

// Updated 2026-07-02 with a corrected, business-supplied active roster (47 names,
// down from the prior 199) — replaces the previous list wholesale.
export const ACTIVE_QUEUE_NAMES = [
  'CER Server German', 'CZE Enterprise (BRA)', 'EC Compute CEE RUA', 'EC GRE ProSupp Server (MTP)',
  'EC POL Enterprise (HAL)', 'EC ProSupp Server Turkish (HAL)', 'EC Server Arabic',
  'EMEA Solutions HCI FL', 'EMEA Solutions MS FL', 'ENG ProSupp Dutch Server (CWD)',
  'ENG ProSupp Nordics Server (CWD)', 'Enterprise Pro/Core ID', 'Enterprise Pro/Core TH',
  'Enterprise Pro/Core VN', 'FRA Networking (MTP)', 'France Storage', 'GER Networking (HAL)',
  'German Storage', 'Global Compute English', 'Global Inbound Support Team', 'Global Midrange',
  'Global Networking English', 'Global CoreStore', 'KOR Storage Upsell Korean', 'Korea CNS',
  'LATAM AH Portuguese', 'LATAM AH Spanish', 'LATAM Compute Portuguese', 'LATAM Compute Spanish',
  'LATAM Midrange Portuguese', 'LATAM Midrange Spanish', 'LATAM Networking Portuguese',
  'LATAM Networking Spanish', 'LATAM Top Customers Portuguese', 'LATAM Top Customers Spanish',
  'Networking IND', 'Networking Pro/Core Japan', 'PS One', 'ROE Networking (MULTI)',
  'SER Compute Iberian', 'SER Server French', 'SER Server Italian', 'Server Pro/Core Japan',
  'Server ProSupport IND', 'Server ProSupport Plus Japan', 'Storage IND', 'Storage Pro/Core Japan',
]

// Updated 2026-07-02 with a corrected, business-supplied inactive roster (146
// names, down from the prior 406) — replaces the previous list wholesale. Includes
// 'CCC MidRange Mandarin', moved here from the active list per the same update.
export const INACTIVE_QUEUE_NAMES = [
  'APJ GNCS Hyperconverged NovaTech Partners', 'APJ NR-FLS', 'APJ Upsell-Operations Multi',
  'Backup Solution HC US', 'Brazil MSG CTE', 'Brazil CoreStore',
  'Brazil Senior and Master Engineer', 'BRZ HC Server Voice (EL)', 'BRZ HC Storage Voice (EL)',
  'BRZ LC Server Voice (EL)', 'BRZ LC Storage Voice (EL)', 'CCC CNS Cantonese',
  'CCC CNS Mandarin', 'CCC CNS Mandarin Email', 'CCC CNS Mandarin Voice', 'CCC MidRange Mandarin',
  'CoreVault Copilot US', 'Compute High Complexity', 'Compute ProSupport Alt Channel',
  'CPS Chat ROLA', 'CTE CCC', 'CTE Enterprise KOR', 'CTE JPN', 'CTE KOR', 'CTE NW IND', 'CTE SA',
  'CTE Server/Networking CCC', 'CTE Server/Networking JPN', 'CTE Storage CCC', 'CTE Storage IND',
  'CTE Storage JPN', 'DSP OEM', 'EC Basic Enterprise (CAS)', 'EC ProSupp Server Arabic (CAS)',
  'EC ProSupp Server CEE (HAL)', 'EC ProSupp Storage', 'EC RUS Enterprise (HAL)',
  'EMEA MODULAR CTE', 'EMEA ProSupport CoreVault', 'EMEA ProSupport CoreStore',
  'EMEA ProSupport VaultPro', 'EMEA SERVER CTE', 'EMEA Server Upsell English',
  'EMEA Solutions HCI (ENG)', 'EMEA Solutions HCI (FRA)', 'EMEA Solutions HCI (GER)',
  'EMEA Solutions MS (ENG)', 'EMEA Solutions MS (FRA)', 'EMEA Solutions MS (GER)',
  'ENG Modular (CWD)', 'ENG ProSupp Server', 'ENG ProSupp Server 247 (CWD)',
  'ENG ProSupport Plus Server', 'ENG Solutions (CWD)', 'Enterprise Alt-channel JPN',
  'Enterprise ANZ AOH', 'Enterprise Core CCC', 'Enterprise Core/ProSupport MIY',
  'Enterprise Echannel CCC', 'Enterprise Echannel Core/Pro MIY', 'Enterprise Pro/Core PH',
  'Enterprise ProSupport ANZ/SA', 'Enterprise ProSupport KOR', 'Enterprise SA',
  'Enterprise SA Email', 'Enterprise Support Services US', 'Enterprise Triage Queue US',
  'Enterprise TW', 'Federal Server US', 'Federal Support NA', 'FRA Basic Enterprise (CAS)',
  'FRA Modular (MTP)', 'FRA ProSupp Server Alternate', 'FRA ProSupp Storage (MTP)',
  'FRA ProSupport Plus Server (MTP)', 'FRA ProSupport Server (CAS)', 'FRA Solutions (MTP)',
  'GER Enterprise (HAL)', 'GER Modular (HAL)', 'GER ProSupp Server Email (HAL)',
  'GER ProSupp Storage Co Pilot', 'GER Solutions (HAL)', 'TSA Global Operations',
  'Meridian Global Panama', 'IND RailFlex Storage', 'ITA Basic Enterprise (CAS)',
  'ITA ProSupp Server (MTP)', 'Japan Enterprise SW-NWK', 'Japan Storage ProSupport KAW',
  'KOR Compute Basic Korean', 'KOR Compute Upsell Korean', 'KOR Networking Upsell Korean',
  'MMCLA MSG CTE', 'MMCLA HC Server Voice (PAN)', 'MMCLA LC Server Voice (PAN)',
  'MMCLA CoreStore', 'Modular US', 'NA Compute Pro Support', 'NA CTE Server', 'NA CTE Storage',
  'NA ProSupp Storage eSupport', 'NA Server Basic (BNG)', 'NA Server Basic Chat (BNG)',
  'Networking Basic US', 'Networking CCC', 'Networking Pro Core SA',
  'Networking ProSupport Analysts US', 'Networking ProSupport ANZ', 'Networking ProSupport RTSE US',
  'Networking ProSupport US', 'Networking SPSPE', 'POR ProSupp Server (MTP)',
  'EdgeCore After Hours US', 'EdgeCore Alternate Channel US', 'CoreStore US',
  'Proactive Systems Maintenance ROLA', 'ProSupp EQL (CWD)', 'ProSupp EQL (MTP)',
  'ProSupp Storage 247 (CWD)', 'ProSupp Storage Co Pilot (CWD)', 'ROLA Senior and Master Engineer',
  'RT Linux / Virtualization US', 'RT WinPlatform US', 'Server Combined CCC', 'Server Core IND',
  'Server ProSupport ANZ', 'Server ProSupport CCC', 'Server ProSupport Chat US',
  'Server ProSupport Plus CCC', 'Server ProSupport ROLA', 'Northwind Traders SA',
  'SPA Basic Enterprise (CAS)', 'SPA ProSupp Server (MTP)', 'SSO Quality Lets Fix It',
  'Storage Echannel CCC', 'Storage ProSupport ANZ', 'Storage ProSupport CCC',
  'Storage ProSupport SA', 'Storage PS MD US', 'Storage ROLA', 'Support Ops ROLA',
  'SWE Client ProSupp (TUR)', 'UKI Networking (CWD)', 'UKI Storage', 'UKISA Basic Enterprise (BGL)',
  'US Federal Support Storage',
]

export function inferRegion(name) {
  if (/^APJ|^HCX APJ|^HCX LATAM|^Korea|^KOR|^ANZ|^MMCLA|^CCC|^Japan|^JP |^BRZ|^Brazil|CTE.*JPN|CTE.*KOR|CTE.*CCC/.test(name)) return 'APJ'
  if (/^LATAM|^ROLA|Portuguese$|Spanish$|Panama/.test(name)) return 'LATAM'
  if (/^EMEA|^ENG |^GER |^German|^FRA |^French|^ITA |^Italian|^SPA |^EC |^CER|^CZE|^ROE|^SWE|Nordics|^UKI|^UKI/.test(name)) return 'EMEA'
  if (/^AMER|^NA |^NAMER|^US |Federal|Modular US|Enterprise.*US|CoreStore US/.test(name)) return 'NAMER'
  return 'Global'
}

// ── Queue fact table ─────────────────────────────────────────────────────────
// Single source of truth for everything queue-level. Every categorical filter
// (Capacity Code, Channel, Business Partner, Region, Sub-region, L5 Manager,
// DB/OSP, Queue Name) narrows this list; cards and CQN-variance charts are
// then recomputed from whatever rows remain.
export const ACTIVE_QUEUES = ACTIVE_QUEUE_NAMES.map((name, i) => {
  const offered = 20000 + i * 320
  // Spans a symmetric ±8% of offered (not capped at 100%) so a healthy minority of
  // queues genuinely run ahead of plan — backlog catch-up, cross-trained overflow
  // handling, etc. — with a magnitude matching the "behind" side, so a top-N-by-|variance|
  // ranking isn't structurally guaranteed to be one-sided.
  const handled = Math.round(offered * (0.92 + (i % 17) * 0.01))
  const plan2   = Math.round(offered * (0.93 + (i % 9) * 0.012))
  return {
    name,
    region: inferRegion(name),
    subRegion: SUB_REGIONS[i % SUB_REGIONS.length],
    capacityCode: CAPACITY_CODES[i % CAPACITY_CODES.length],
    businessPartner: BUSINESS_PARTNERS[i % BUSINESS_PARTNERS.length],
    l5Manager: L5_MANAGERS[i % L5_MANAGERS.length],
    channel: CHANNELS[i % CHANNELS.length],
    dbOsp: i % 3 === 0 ? 'OSP' : 'DB',
    offered,
    handled,
    accuracy: 75 + (i * 7) % 25,
    plan1: offered,
    plan2,
    get planVariance() { return +((this.plan2 - this.plan1) / this.plan1 * 100).toFixed(1) },
    get adherence() { return +((this.handled / this.offered) * 100).toFixed(1) },
  }
})

// Every filter except DB/OSP is multi-select: its value is an array of chosen options,
// or [] meaning "no selection = everything". DB/OSP stays a single string ('DB'|'OSP'|'All')
// since it's a 3-way segmented pill, not a searchable dropdown.
const QUEUE_FILTER_KEYS = ['cqn', 'capacityCode', 'channel', 'businessPartner', 'region', 'subRegion', 'l5Manager']
const QUEUE_FIELD_BY_KEY = { cqn: 'name', capacityCode: 'capacityCode', channel: 'channel', businessPartner: 'businessPartner', region: 'region', subRegion: 'subRegion', l5Manager: 'l5Manager' }

export function filterQueues(filters = {}) {
  return ACTIVE_QUEUES.filter(q => {
    const multiOk = QUEUE_FILTER_KEYS.every(key => {
      const v = filters[key]
      return !v || v.length === 0 || v.includes(q[QUEUE_FIELD_BY_KEY[key]])
    })
    const dbOsp = filters.dbOsp
    return multiOk && (!dbOsp || dbOsp === 'All' || q.dbOsp === dbOsp)
  })
}

// ── Inactive queue fact table (2026-07-08) ────────────────────────────────────
// The inactive roster came with no attributes beyond its names, unlike ACTIVE_QUEUES —
// tagged here with region (same inferRegion() regex) and businessPartner (round-robin
// over the real BUSINESS_PARTNERS list), same "real names + illustrative structure"
// convention as everywhere else, so the Total Queues drill-down can show both rosters
// side by side instead of only the active one.
export const INACTIVE_QUEUES = INACTIVE_QUEUE_NAMES.map((name, i) => ({
  name,
  region: inferRegion(name),
  businessPartner: BUSINESS_PARTNERS[i % BUSINESS_PARTNERS.length],
}))

// Combined active+inactive rows tagged with status — narrowed only by region/
// businessPartner, the two dimensions both rosters actually carry (the other 6 Queue
// filters only exist on ACTIVE_QUEUES, so they don't apply here, same reasoning as
// why Total Queues already ignores DB/OSP). Backs the Total Queues drill-down's
// region donut and Business Partner breakdown table.
export function allQueuesByStatus(filters = {}) {
  const inScope = q => matchesMulti(filters.region, q.region) && matchesMulti(filters.businessPartner, q.businessPartner)
  return [
    ...ACTIVE_QUEUES.filter(inScope).map(q => ({ name: q.name, region: q.region, businessPartner: q.businessPartner, status: 'Active', accuracy: q.accuracy })),
    ...INACTIVE_QUEUES.filter(inScope).map(q => ({ name: q.name, region: q.region, businessPartner: q.businessPartner, status: 'Inactive', accuracy: null })),
  ]
}

// Per-Business-Partner active/inactive split, plus the actual queue names behind
// each count so the drill-down can show them on hover — sorted by total descending.
export function queuesByBusinessPartner(filters = {}) {
  const rows = allQueuesByStatus(filters)
  const byBp = {}
  rows.forEach(q => {
    if (!byBp[q.businessPartner]) byBp[q.businessPartner] = { businessPartner: q.businessPartner, activeNames: [], inactiveNames: [] }
    byBp[q.businessPartner][q.status === 'Active' ? 'activeNames' : 'inactiveNames'].push(q.name)
  })
  return Object.values(byBp)
    .map(bp => ({ ...bp, active: bp.activeNames.length, inactive: bp.inactiveNames.length, total: bp.activeNames.length + bp.inactiveNames.length }))
    .sort((a, b) => b.total - a.total)
}

// Fiscal Quarter/Week values carry their fiscal year as a prefix (e.g. 'FY26Q2', 'FY26W14').
// The most specific time filter selected (Week > Quarter > Year) determines which fiscal
// year(s) the FY-level charts show — spanning multiple years if the selection does.
export function effectiveFiscalYears(filters = {}) {
  const picked = (filters.fiscalWeek?.length && filters.fiscalWeek)
    || (filters.fiscalQuarter?.length && filters.fiscalQuarter)
    || (filters.fiscalYear?.length && filters.fiscalYear)
  if (!picked) return FISCAL_YEARS
  return FISCAL_YEARS.filter(fy => picked.some(v => v.slice(0, 4) === fy))
}

// A multi-select filter with no selection ([] or undefined) matches everything.
// Exported since other pages' data modules (e.g. tsaData.js) reuse this same rule.
export function matchesMulti(selected, value) {
  return !selected || selected.length === 0 || selected.includes(value)
}

// ── Cards ────────────────────────────────────────────────────────────────────

// `granularity` (2026-07-20) makes Call Volume, DB/OSP Split, and Forecast Accuracy
// respond to the page's View By (Quarter/Month/Week) toggle — each now reads the
// LATEST in-scope period off its own granular *ByFY selector, the same "latest period
// snapshot" pattern the other 3 pages' cards already use, instead of a flat filters-only
// aggregate that never reflected the granularity toggle at all.
//
// Total Queues and CQN Variance deliberately do NOT vary with granularity: both are
// queue-ROSTER composition metrics (how many queues are active/inactive, what % of the
// CURRENT queue list sits within accuracy tolerance) — a queue's active status and its
// `.accuracy` field are single flat values in this data model, not date-stamped, so
// there's no real per-quarter/month value to show. Faking one would mean inventing
// numbers that don't represent anything, which is exactly what this app's "real names +
// illustrative structure" convention is meant to avoid.
export function cardData(filters = {}, granularity) {
  // Queue portfolio health (count, accuracy, variance) reflects who's in scope —
  // Queue Name, Region, Capacity Code, etc. — but not DB/OSP: a queue's accuracy
  // doesn't change depending on which slice of its call volume you're looking at.
  const structuralRows = filterQueues({ ...filters, dbOsp: 'All' })
  const activeCount = structuralRows.length
  // "Within variance" band is deliberately tight (accuracy >= 89) so the headline
  // sits in the ~40-50% range that reflects how strict the ±10% target actually is.
  const withinRange = structuralRows.filter(q => q.accuracy >= 89).length

  // Call volume — latest in-scope period at the page's current granularity; DB/OSP
  // still scopes it (callVolumeByFY reads filters.dbOsp), same as before.
  const cvRows = callVolumeByFY(filters, granularity)
  const latestCv = cvRows[cvRows.length - 1]
  const offered = latestCv?.offered ?? 0
  const handled = latestCv?.handled ?? 0

  // DB/OSP Split — same latest-period pattern, off the volume-weighted dbOspVolumeByFY
  // (deliberately ignores the dbOsp pill itself — see that function's own comment for
  // why narrowing first and then asking "what % is DB" is circular).
  const dbOspRows = dbOspVolumeByFY(filters, granularity)
  const latestDbOsp = dbOspRows[dbOspRows.length - 1]
  const dbOspTotal = (latestDbOsp?.db ?? 0) + (latestDbOsp?.osp ?? 0)
  const dbPct = dbOspTotal ? Math.round((latestDbOsp.db / dbOspTotal) * 100) : 0
  const ospPct = dbOspTotal ? 100 - dbPct : 0

  // Forecast Accuracy — same latest-period pattern; only cardData() passes granularity
  // here, the card's own drill-down chart (ForecastByFYChart) deliberately keeps
  // calling this without it, preserving its established FY-only bar chart.
  const faRows = forecastAccuracyByFY(filters, granularity)
  const latestFa = faRows[faRows.length - 1]

  return {
    totalQueues: { active: activeCount, inactive: INACTIVE_QUEUE_NAMES.length },
    callVolume: {
      offered, handled,
      handlePct: offered ? +((handled / offered) * 100).toFixed(1) : 0,
      abandonPct: offered ? +(((offered - handled) / offered) * 100).toFixed(1) : 0,
    },
    dbOspSplit: { db: dbPct, osp: ospPct, dbVol: latestDbOsp?.db ?? 0, ospVol: latestDbOsp?.osp ?? 0 },
    forecastAccuracy: { value: latestFa?.accuracy ?? 0, target: 90 },
    cqnVariance: { withinRange, total: activeCount, pct: activeCount ? +((withinRange / activeCount) * 100).toFixed(1) : 0 },
  }
}

// Offered/handled baseline split by fiscal year (285.4K/268.7K total across FY25-27).
const BASE_CALL_VOLUME_BY_FY = {
  FY25: { offered: 82000,  handled: 77500 },
  FY26: { offered: 96000,  handled: 90200 },
  FY27: { offered: 107400, handled: 101000 },
}

// Drives the Call Volume card drill-down: Offered vs Handled, by Fiscal Year.
export function callVolumeByFY(filters = {}, granularity) {
  const rows = filterQueues(filters)
  const ratio = ACTIVE_QUEUES.length ? rows.length / ACTIVE_QUEUES.length : 0
  const years = effectiveFiscalYears(filters)
  const fyRows = years.map(year => ({
    period: year,
    offered: Math.round(BASE_CALL_VOLUME_BY_FY[year].offered * ratio),
    handled: Math.round(BASE_CALL_VOLUME_BY_FY[year].handled * ratio),
  }))
  return expandToGranularity(fyRows, granularity, ['offered', 'handled'])
}

// Drives the DB/OSP Split card drill-down: DB vs OSP offered volume, by Fiscal Year.
// Deliberately ignores the DB/OSP filter itself (unlike callVolumeByFY) — collapsing to
// one bar when the ambient filter is "DB" would defeat the point of a split chart. Every
// other filter (region, queue, etc.) still narrows the candidate queues.
export function dbOspVolumeByFY(filters = {}, granularity) {
  const rows = filterQueues({ ...filters, dbOsp: 'All' })
  const total = ACTIVE_QUEUES.length
  const ratio = total ? rows.length / total : 0
  // Volume-weighted (2026-07-20, matches cardData()'s dbOspSplit fix) — a queue-count
  // ratio would treat every queue as if it carried identical offered volume, which
  // isn't true; this chart and the DB/OSP Split card should tell the same story.
  const totalVol = rows.reduce((s, q) => s + q.offered, 0)
  const dbVol = rows.filter(q => q.dbOsp === 'DB').reduce((s, q) => s + q.offered, 0)
  const dbShare = totalVol ? dbVol / totalVol : 0
  const years = effectiveFiscalYears(filters)
  const fyRows = years.map(year => {
    const totalOffered = Math.round(BASE_CALL_VOLUME_BY_FY[year].offered * ratio)
    return {
      period: year,
      db: Math.round(totalOffered * dbShare),
      osp: Math.round(totalOffered * (1 - dbShare)),
    }
  })
  return expandToGranularity(fyRows, granularity, ['db', 'osp'])
}

// ── Forecast Accuracy by Region ───────────────────────────────────────────────
const REGION_FORECAST_BASE = { APJ: 58000, EMEA: 78000, Global: 50000, LATAM: 33000, NAMER: 95000 }
const REGION_ACCURACY = { APJ: 85, EMEA: 79, Global: 82, LATAM: 68, NAMER: 91 }

export const FORECAST_ACCURACY_BY_REGION = REGIONS.map(region => {
  const forecast = REGION_FORECAST_BASE[region]
  const accuracy = REGION_ACCURACY[region]
  return { region, forecast, actual: Math.round(forecast * accuracy / 100), accuracy }
})

// Forecast Accuracy card's drill-down default view (2026-07-08): a Fiscal Year rollup
// of the region baseline above, nudged per year — illustrative until a real per-FY
// forecast-accuracy dataset exists. forecast (the plan) is held flat across years since
// nothing else in this mock model varies a forecast baseline by year on its own; only
// actual/accuracy move, same "one baseline, small deterministic wobble per period"
// convention used everywhere else in this file.
const FY_ACCURACY_NUDGE = { FY25: 0.97, FY26: 1.0, FY27: 1.02 }

// `granularity` is optional and additive (2026-07-20) — the Forecast Accuracy card's
// own drill-down chart (ForecastByFYChart) deliberately always calls this without it,
// keeping its established "one bar per fiscal year, click a year to drill into region"
// design (see design_choice.md, 2026-07-08). cardData() is the only caller that passes
// granularity, so the KEY METRICS card headline responds to the page's View By toggle
// without touching that chart's own FY-only x-axis.
export function forecastAccuracyByFY(filters = {}, granularity) {
  const years = effectiveFiscalYears(filters)
  const rows = FORECAST_ACCURACY_BY_REGION.filter(d => matchesMulti(filters.region, d.region))
  const forecast = rows.reduce((s, r) => s + r.forecast, 0)
  const actualTotal = rows.reduce((s, r) => s + r.actual, 0)
  const fyRows = years.map(fy => ({
    period: fy, forecast, actual: Math.round(actualTotal * (FY_ACCURACY_NUDGE[fy] ?? 1)),
  }))
  return expandToGranularity(fyRows, granularity, ['forecast', 'actual'])
    .map(d => ({ ...d, accuracy: d.forecast ? +((d.actual / d.forecast) * 100).toFixed(1) : 0 }))
}

// Region breakdown for one clicked fiscal year — applies the same per-year nudge to
// each region's own baseline, so this stays internally consistent with the FY rollup
// above (the two views' totals reconcile). Backs the "click a year to see region
// breakdown" pop-up.
export function forecastAccuracyByRegionForYear(filters = {}, fy) {
  const nudge = FY_ACCURACY_NUDGE[fy] ?? 1
  return FORECAST_ACCURACY_BY_REGION
    .filter(d => matchesMulti(filters.region, d.region))
    .map(d => {
      const actual = Math.round(d.actual * nudge)
      return { region: d.region, forecast: d.forecast, actual, accuracy: d.forecast ? +((actual / d.forecast) * 100).toFixed(1) : 0 }
    })
}

// ── CQN Forecast Variance ─────────────────────────────────────────────────────
// Year-on-year % of queues landing within the ±10% variance band. Curated to sit in the
// 40-50% range (vs. the ~44% the live queue-accuracy threshold produces at "All" filters) —
// illustrative until fiscal-year-tagged variance data exists per queue.
export const CQN_VARIANCE_BY_FY = [
  { fy: 'FY25', pct: 44 },
  { fy: 'FY26', pct: 48 },
  { fy: 'FY27', pct: 41 },
]

// Clicking a year's column surfaces a handful of real queues (from the current filter
// scope) whose plan-vs-plan variance genuinely falls within ±10% — a representative
// sample, not the full list, until per-queue-per-year variance data is available.
export function cqnVarianceQueuesByFY(filters, fy, count = 5) {
  const rows = filterQueues({ ...filters, dbOsp: 'All' }).filter(q => Math.abs(q.planVariance) <= 10)
  if (!rows.length) return []
  const yearIndex = FISCAL_YEARS.indexOf(fy)
  const offset = (yearIndex >= 0 ? yearIndex : 0) * count
  return Array.from({ length: Math.min(count, rows.length) }, (_, i) =>
    rows[(offset + i) % rows.length]
  ).map(q => ({ name: q.name, variance: q.planVariance }))
}

// ── Plan over Plan (Layer 1) ─────────────────────────────────────────────────
const BASE_PLAN = { FY25: 240000, FY26: 268000, FY27: 295000 }

export const PLAN_VS_PLAN_BY_FY = FISCAL_YEARS.map(fy => ({
  period: fy,
  plan1: BASE_PLAN[fy],
  plan2: Math.round(BASE_PLAN[fy] * (0.93 + Math.random() * 0.1)),
  get variance() { return +((this.plan2 - this.plan1) / this.plan1 * 100).toFixed(1) },
}))

// Order matches REGIONS: APJ, EMEA, Global, LATAM, NAMER
export const PLAN_VS_PLAN_BY_REGION = REGIONS.map((r, i) => ({
  region: r,
  plan1: [62000, 78000, 50000, 33000, 95000][i],
  plan2: [58000, 81000, 48000, 31000, 89000][i],
  get variance() { return +((this.plan2 - this.plan1) / this.plan1 * 100).toFixed(1) },
}))

// Deterministic scale factor per named Plan (2026-07-31) — same hash-based approach
// as tsaData.js's planPerformanceScale, reimplemented here since mockData.js (ESG
// Forecasting) had no equivalent helper yet. Closes a KNOWN cosmetic gap:
// Layer1PlanOverPlan's Plan A/Plan B dropdowns used to change state without ever
// feeding into planOverPlanByFY.
function planNameScale(planName) {
  if (!planName) return 1
  let hash = 0
  for (let i = 0; i < planName.length; i++) hash = (hash * 31 + planName.charCodeAt(i)) % 97
  return 0.88 + (hash / 96) * 0.24
}

export function planOverPlanByFY(filters = {}, granularity, planA, planB) {
  const years = effectiveFiscalYears(filters)
  const scaleA = planNameScale(planA)
  const scaleB = planNameScale(planB)
  const rows = PLAN_VS_PLAN_BY_FY.filter(d => years.includes(d.period))
    .map(d => ({ period: d.period, plan1: Math.round(d.plan1 * scaleA), plan2: Math.round(d.plan2 * scaleB) }))
  return expandToGranularity(rows, granularity, ['plan1', 'plan2'])
    .map(d => ({ ...d, variance: d.plan1 ? +((d.plan2 - d.plan1) / d.plan1 * 100).toFixed(1) : 0 }))
}

export function planOverPlanByRegion(filters = {}) {
  return PLAN_VS_PLAN_BY_REGION.filter(d => matchesMulti(filters.region, d.region))
}

// "CQN Highest Variance": with no queues selected, surfaces the 5 queues with the
// biggest |Plan A vs Plan B| swing out of whatever the other filters leave in scope;
// with specific queues selected, shows exactly those. Like the KPI cards, this is
// queue-portfolio scoping — DB/OSP is excluded so it can't silently empty out a queue
// that simply doesn't route that kind of volume.
export function cqnPlanVariance(filters = {}, topN = 5) {
  const rows = filterQueues({ ...filters, dbOsp: 'All' }).map(q => ({ cqn: q.name, plan1: q.plan1, plan2: q.plan2, variance: q.planVariance }))
  const hasQueue = filters.cqn?.length > 0
  return hasQueue ? rows : [...rows].sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance)).slice(0, topN)
}

// ── Actual vs Plan (Layer 2) ─────────────────────────────────────────────────
export const ACTUAL_VS_PLAN_BY_FY = FISCAL_YEARS.map(fy => ({
  period: fy,
  actual: BASE_PLAN[fy] * (0.88 + Math.random() * 0.08),
  plan:   BASE_PLAN[fy],
  get adherence() { return +((this.actual / this.plan) * 100).toFixed(1) },
})).map(d => ({ ...d, actual: Math.round(d.actual) }))

// Stacked bar: % of the queue population by forecast variance magnitude, per FY.
// Bucketed by |variance|, not accuracy tier — under10 is best (tightest to plan).
export const STACKED_ADHERENCE = [
  { fy: 'FY25', under10: 38, between10and20: 34, between20and30: 16, above30: 12 },
  { fy: 'FY26', under10: 30, between10and20: 33, between20and30: 22, above30: 15 },
  { fy: 'FY27', under10: 42, between10and20: 30, between20and30: 18, above30: 10 },
]

export function actualVsPlanByFY(filters = {}, granularity) {
  const years = effectiveFiscalYears(filters)
  const rows = ACTUAL_VS_PLAN_BY_FY.filter(d => years.includes(d.period))
    .map(d => ({ period: d.period, actual: d.actual, plan: d.plan }))
  return expandToGranularity(rows, granularity, ['actual', 'plan'])
    .map(d => ({ ...d, adherence: d.plan ? +((d.actual / d.plan) * 100).toFixed(1) : 0 }))
}

const STACKED_KEYS = ['under10', 'between10and20', 'between20and30', 'above30']

// Percentage buckets aren't additive across sub-periods the way raw counts are, so
// this doesn't reuse expandToGranularity — instead each sub-period gets the parent
// FY's bucket mix with a small wobble, renormalized to still sum to ~100%.
export function stackedAdherenceByFY(filters = {}, granularity) {
  const years = effectiveFiscalYears(filters)
  const rows = STACKED_ADHERENCE.filter(d => years.includes(d.fy))
  if (!granularity || granularity === 'Year') return rows
  return rows.flatMap((row, ri) => {
    const periods = periodsForGranularity(granularity, [row.fy])
    return periods.map((period, i) => {
      const wobbled = STACKED_KEYS.map((k, ki) => row[k] * (0.85 + ((i * 13 + ri * 7 + ki * 5) % 31) / 100))
      const sum = wobbled.reduce((a, b) => a + b, 0)
      const out = { fy: period }
      STACKED_KEYS.forEach((k, ki) => { out[k] = sum ? +(wobbled[ki] / sum * 100).toFixed(1) : 0 })
      return out
    })
  })
}

// Small deterministic nudge per named Plan (2026-07-23) — same "one baseline, small
// deterministic wobble" convention as FY_ACCURACY_NUDGE above. The underlying queue
// records only carry one actual/offered pair (not one per named Plan), so this lets
// the "Top Queues by Variance" Plan dropdown in Layer 2 move real numbers instead of
// sitting there decoratively.
const PLAN_ACTUAL_VARIANCE_NUDGE = {
  'AOP_FY26Q4_AA': 1,
  'FY27 Q1 APR Plan': 1.12,
  'FY27 Q2 JUN Plan': 0.9,
  'FY27Q1_AA': 1.2,
}

// "CQN Highest Variance": biggest |actual vs plan| gap first (same ranking logic as
// cqnPlanVariance) — a mix of ahead-of-plan and behind-plan outliers, not just the worst.
// `planName` is optional and additive (2026-07-23), mirroring forecastAccuracyByFY's
// optional `granularity` param — existing callers that omit it keep the unnudged variance.
export function cqnActualVariance(filters = {}, topN = 5, planName) {
  const nudge = planName ? (PLAN_ACTUAL_VARIANCE_NUDGE[planName] ?? 1) : 1
  const rows = filterQueues({ ...filters, dbOsp: 'All' }).map(q => ({
    cqn: q.name, actual: q.handled, plan: q.offered,
    variance: +((q.handled - q.offered) / q.offered * 100 * nudge).toFixed(1),
  }))
  const hasQueue = filters.cqn?.length > 0
  return hasQueue ? rows : [...rows].sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance)).slice(0, topN)
}

// ── Queue Performance table (2026-07-27) ──────────────────────────────────────
// Backs the new "Queue Performance" table shown just above the Geo Map, and the
// Geo Map's own hover-a-region/sub-region popup — both are just this same
// selector, scoped by whatever's currently in `filters` (the page's normal filter
// bar) plus an optional {region} or {subRegion} override for the map's hover-through.
// `code` is a stable per-queue id (index in ACTIVE_QUEUES, not affected by filtering)
// — no longer displayed in either table (2026-07-27 follow-up) but kept as a stable
// React key.
//
// `granularity` (2026-07-27, optional/additive) makes Forecast/Actual/Accuracy% respond
// to the page's View By toggle, per direct request — each queue's flat offered/handled
// value is treated as a single-FY series and divided across Quarter/Month/Week sub-
// periods with the same small deterministic wobble expandToGranularity already uses
// for every other volume metric in this file, then the LATEST sub-period is shown
// (same "latest period snapshot" convention the KPI cards already use). Omitting
// granularity (or passing 'Year'/null) keeps the original flat per-queue values.
export function queuePerformance(filters = {}, override, granularity) {
  const overrideFilter = override?.subRegion ? { subRegion: [override.subRegion] }
    : override?.region ? { region: [override.region] }
    : {}
  const scoped = filterQueues({ ...filters, dbOsp: 'All', ...overrideFilter })
  return scoped
    .map(q => {
      let forecast = q.offered, actual = q.handled
      if (granularity && granularity !== 'Year') {
        const expanded = expandToGranularity([{ period: 'FY27', offered: q.offered, handled: q.handled }], granularity, ['offered', 'handled'])
        const latest = expanded[expanded.length - 1]
        forecast = latest.offered
        actual = latest.handled
      }
      const accuracy = forecast ? Math.round((actual / forecast) * 100) : 0
      return {
        code: `Q-${String(ACTIVE_QUEUES.indexOf(q) + 1).padStart(3, '0')}`,
        name: q.name,
        region: q.region,
        forecast,
        actual,
        accuracy,
        status: accuracy >= 90 ? 'Good' : accuracy >= 75 ? 'Fair' : 'Poor',
      }
    })
    .sort((a, b) => a.accuracy - b.accuracy)
}

// ── Geo Map (Layer 3) ─────────────────────────────────────────────────────────
// Choropleth, not circle markers: every country on the map gets filled by the
// accuracy of the region or sub-region it belongs to. The country→region and
// country→sub-region groupings below are an illustrative continental/business
// split for a mock dashboard — not authoritative geography or real org data.
export const GEO_REGION_DATA = [
  { region: 'NAMER', accuracy: 91, label: 'NAMER' },
  { region: 'EMEA',  accuracy: 79, label: 'EMEA' },
  { region: 'APJ',   accuracy: 85, label: 'APJ' },
  { region: 'LATAM', accuracy: 68, label: 'LATAM' },
]

export function geoRegionData(filters = {}) {
  return GEO_REGION_DATA.filter(d => matchesMulti(filters.region, d.region))
}

// Country names below match the exact strings used by the world-atlas topojson
// (countries-110m.json) that Layer3GeoMap renders.
const NAMER_COUNTRIES = ['United States of America', 'Canada', 'Mexico', 'Greenland']
const LATAM_COUNTRIES = [
  'Belize', 'Guatemala', 'Honduras', 'El Salvador', 'Nicaragua', 'Costa Rica', 'Panama',
  'Cuba', 'Jamaica', 'Haiti', 'Dominican Rep.', 'Bahamas', 'Trinidad and Tobago', 'Puerto Rico',
  'Colombia', 'Venezuela', 'Guyana', 'Suriname', 'Ecuador', 'Peru', 'Brazil', 'Bolivia',
  'Paraguay', 'Chile', 'Argentina', 'Uruguay', 'Falkland Is.',
]
const APJ_COUNTRIES = [
  'Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Kyrgyzstan', 'Tajikistan', 'Afghanistan',
  'Pakistan', 'India', 'Nepal', 'Bhutan', 'Bangladesh', 'Sri Lanka', 'Myanmar', 'Thailand',
  'Laos', 'Cambodia', 'Vietnam', 'Malaysia', 'Indonesia', 'Brunei', 'Philippines', 'Timor-Leste',
  'Papua New Guinea', 'Solomon Is.', 'Vanuatu', 'New Caledonia', 'Fiji', 'China', 'Mongolia',
  'North Korea', 'South Korea', 'Japan', 'Taiwan', 'Australia', 'New Zealand',
]
const UNMAPPED_GEOGRAPHIES = ['Antarctica', 'Fr. S. Antarctic Lands']

// Everything else on the map (Europe, the Middle East, Africa) is EMEA by elimination.
export function regionForCountry(name) {
  if (UNMAPPED_GEOGRAPHIES.includes(name)) return null
  if (NAMER_COUNTRIES.includes(name)) return 'NAMER'
  if (LATAM_COUNTRIES.includes(name)) return 'LATAM'
  if (APJ_COUNTRIES.includes(name)) return 'APJ'
  return 'EMEA'
}

export const SUB_REGION_ACCURACY = {
  Australia: 88, Brazil: 71, CER: 76, China: 79, 'Costa Rica': 82, EC: 69, Egypt: 74,
  EMEA: 79, France: 80, Germany: 78, Global: 83, India: 75, Israel: 85, Japan: 90,
  Korea: 87, 'Multiple SubRegions': 77, Nordics: 92, Panama: 73, ROLA: 66, SER: 81,
  'South Asia': 70, UKI: 84, 'United Kingdom': 85, 'United States': 93,
}

// Sub-regions that are literally one country each get a direct 1:1 mapping.
const SUB_REGION_LITERAL_COUNTRY = {
  Australia: 'Australia', Brazil: 'Brazil', China: 'China', 'Costa Rica': 'Costa Rica',
  Egypt: 'Egypt', France: 'France', Germany: 'Germany', India: 'India', Israel: 'Israel',
  Japan: 'Japan', Korea: 'South Korea', Panama: 'Panama', 'United Kingdom': 'United Kingdom',
  'United States': 'United States of America',
}

// Everything else is a named grouping of countries — CER/SER/Nordics/ROLA/UKI/EC are all
// real WFM regional shorthand; the country lists here are illustrative, not authoritative.
// "Global" and "Multiple SubRegions" have no map presence (they're not places) — they
// still appear in the summary table below the map.
const SUB_REGION_GROUPS = {
  CER: ['Poland', 'Czechia', 'Slovakia', 'Hungary', 'Austria', 'Slovenia'],
  EC: ['Jamaica', 'Trinidad and Tobago', 'Bahamas', 'Puerto Rico'],
  EMEA: ['Netherlands', 'Belgium', 'Switzerland'],
  Nordics: ['Sweden', 'Norway', 'Denmark', 'Finland', 'Iceland'],
  ROLA: ['Argentina', 'Chile', 'Colombia', 'Peru', 'Ecuador', 'Venezuela', 'Bolivia', 'Paraguay', 'Uruguay', 'Guyana', 'Suriname'],
  SER: ['Italy', 'Spain', 'Portugal', 'Greece'],
  'South Asia': ['Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Bhutan'],
  UKI: ['Ireland'], // 'United Kingdom' itself is its own literal sub-region above
}

const COUNTRY_TO_SUB_REGION = {}
for (const [subRegion, country] of Object.entries(SUB_REGION_LITERAL_COUNTRY)) {
  COUNTRY_TO_SUB_REGION[country] = subRegion
}
for (const [subRegion, countries] of Object.entries(SUB_REGION_GROUPS)) {
  for (const country of countries) {
    if (!COUNTRY_TO_SUB_REGION[country]) COUNTRY_TO_SUB_REGION[country] = subRegion
  }
}

export function subRegionForCountry(name) {
  return COUNTRY_TO_SUB_REGION[name] || null
}

// Which sub-region keys should be highlighted, given the current filters —
// null means "show all mappable sub-regions" (no filter narrowing them down).
export function activeSubRegionKeys(filters = {}) {
  if (filters.subRegion?.length) return filters.subRegion
  if (filters.region?.length) {
    return Object.keys(SUB_REGION_ACCURACY).filter(key => {
      const country = SUB_REGION_LITERAL_COUNTRY[key] || SUB_REGION_GROUPS[key]?.[0]
      return country && filters.region.includes(regionForCountry(country))
    })
  }
  return null
}

// Sub-region rows for the summary table under the map — same shape as geoRegionData's
// rows so the table renderer doesn't need to branch on view mode.
export function geoSubRegionRows(filters = {}) {
  const active = activeSubRegionKeys(filters)
  return Object.keys(SUB_REGION_ACCURACY)
    .filter(key => !active || active.includes(key))
    .map(key => ({ region: key, label: key, accuracy: SUB_REGION_ACCURACY[key] }))
}
