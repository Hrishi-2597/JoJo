import React from 'react'
import {
  GLOBAL_GROUPING_LIST, FISCAL_MONTH_LIST, lobOptionsForFilters, queueOptionsForFilters,
} from '../../data/tsaData'
import { FISCAL_YEARS, FISCAL_QUARTERS, FISCAL_WEEK_LIST, BUSINESS_PARTNERS } from '../../data/mockData'
import MultiSelectField from '../MultiSelectField'
import GranularityToggle from '../GranularityToggle'

const ICONS = {
  scope: <path d="M2 3.5h10M2 7h10M2 10.5h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />,
  time: <><circle cx="7" cy="7" r="5.3" stroke="currentColor" strokeWidth="1.3" /><path d="M7 4.2V7l2.1 1.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></>,
  people: <><circle cx="7" cy="4.8" r="2.3" stroke="currentColor" strokeWidth="1.3" /><path d="M2.3 11.5c0-2.4 2.1-4 4.7-4s4.7 1.6 4.7 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></>,
}

function ClusterIcon({ name }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
      {ICONS[name]}
    </svg>
  )
}

function Cluster({ icon, cols, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flex: cols === 1 ? '0 0 auto' : `${cols} ${cols} 0` }}>
      <div style={{ paddingBottom: 6 }}><ClusterIcon name={icon} /></div>
      <div className="grid gap-x-3 flex-1 min-w-0" style={{ gridTemplateColumns: `repeat(${cols}, minmax(${cols === 1 ? 160 : 110}px, 1fr))` }}>
        {children}
      </div>
    </div>
  )
}

function ClusterDivider() {
  return <div style={{ width: 1, alignSelf: 'stretch', background: 'linear-gradient(180deg, transparent, rgba(56,189,248,0.18) 30%, rgba(56,189,248,0.18) 70%, transparent)', margin: '0 14px' }} />
}

// `includeQueue` (2026-08-04, default false) — this panel is shared, unmodified,
// by tsaCapacity/TsaCapacityPage.jsx (see that file's own comment). The new Queue
// filter was requested for HES Forecasting specifically, and its options come from
// TSA Forecasting's own Total Queues card roster (tsaData.js's TSA_ACTIVE_QUEUE_NAMES)
// — not something TSA Capacity's own filters/cards have any relationship to — so it's
// opt-in rather than added to the shared `defs` unconditionally, same "opt-in prop,
// not a new default for every consumer" precedent as ChartKit.jsx's `comingSoon`.
export default function TsaFilterPanel({ filters, onChange, granularity, onGranularityChange, includeQueue = false }) {
  // Cascading dropdowns (2026-08-16, per direct request) — LOB's own OPTIONS narrow
  // to whichever LOBs match the currently-selected Business Partner/Global Grouping;
  // Queue's options narrow further to whichever queues belong to the (possibly
  // BP/Group-narrowed) LOB scope. One-directional, matching the panel's own
  // Business Partner & Group -> LOB & Queue left-to-right order — picking a LOB/
  // Queue never narrows Business Partner/Global Grouping's own options.
  const lobOptions = lobOptionsForFilters(filters)
  const queueOptions = includeQueue ? queueOptionsForFilters(filters) : []

  // Changing an "upstream" filter also prunes any already-selected downstream value
  // that's no longer valid under the new scope (e.g. a selected LOB that the newly-
  // picked Business Partner doesn't include) — otherwise a dropdown could show a
  // narrowed option list while still holding a now-invisible selected value.
  const set = key => val => {
    const next = { ...filters, [key]: val }
    if (key === 'businessPartner' || key === 'globalGrouping') {
      const validLobs = lobOptionsForFilters(next)
      next.lob = (filters.lob || []).filter(l => validLobs.includes(l))
      if (includeQueue) {
        const validQueues = queueOptionsForFilters(next)
        next.queue = (filters.queue || []).filter(q => validQueues.includes(q))
      }
    } else if (key === 'lob' && includeQueue) {
      const validQueues = queueOptionsForFilters(next)
      next.queue = (filters.queue || []).filter(q => validQueues.includes(q))
    }
    onChange(next)
  }

  const defs = {
    ...(includeQueue ? { queue: { label: 'Queue Name', options: queueOptions, mono: true } } : {}),
    lob:             { label: 'LOB',             options: lobOptions, mono: true },
    fiscalYear:      { label: 'Fiscal Year',     options: FISCAL_YEARS },
    fiscalQuarter:   { label: 'Fiscal Quarter',  options: FISCAL_QUARTERS },
    fiscalMonth:     { label: 'Fiscal Month',    options: FISCAL_MONTH_LIST },
    fiscalWeek:      { label: 'Fiscal Week',     options: FISCAL_WEEK_LIST },
    businessPartner: { label: 'Business Partner',options: BUSINESS_PARTNERS },
    globalGrouping:  { label: 'Global Grouping', options: GLOBAL_GROUPING_LIST },
  }

  const field = key => (
    <MultiSelectField key={key} label={defs[key].label} options={defs[key].options}
      value={filters[key]} mono={defs[key].mono} onChange={set(key)} />
  )

  const activeFilters = Object.keys(defs).filter(k => filters[k]?.length > 0)
  const clearAll = () => onChange(Object.fromEntries(Object.keys(defs).map(k => [k, []])))

  return (
    <div style={{
      background: 'linear-gradient(180deg, var(--bg-panel) 0%, var(--bg-inset) 100%)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '11px 18px 12px',
      // Pinned to the top of the viewport while scrolling (2026-08-16, per direct
      // request) — position: sticky rather than fixed, so it still scrolls normally
      // until it reaches the top, matching PlanningSidebar's own sticky treatment
      // (App.jsx) rather than inventing a second pinning convention. zIndex 10 keeps
      // it above every scrolled-past chart/table (the highest existing zIndex on this
      // page, PerformanceMatrixTable's sticky header, tops out at 4) and above the
      // "Coming Soon" overlay (zIndex 6).
      position: 'sticky', top: 0, zIndex: 10,
      boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
    }}>
      {/* Ordered Business Partner & Group -> LOB & Queue -> Calendars (2026-08-16,
          per direct request, "the flow would be better") — was Scope/Time/People. */}
      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
        <Cluster icon="people" cols={2}>{field('businessPartner')}{field('globalGrouping')}</Cluster>
        <ClusterDivider />
        <Cluster icon="scope" cols={includeQueue ? 2 : 1}>{includeQueue && field('queue')}{field('lob')}</Cluster>
        <ClusterDivider />
        <Cluster icon="time" cols={4}>
          {field('fiscalYear')}{field('fiscalQuarter')}{field('fiscalMonth')}{field('fiscalWeek')}
        </Cluster>
        <ClusterDivider />
        <GranularityToggle value={granularity} onChange={onGranularityChange} />
      </div>

      {activeFilters.length > 0 && (
        <div className="animate-fade-in" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 11, paddingTop: 9, borderTop: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 8.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 2 }}>
            Scoped by
          </span>
          {activeFilters.map(k => (
            <span key={k} className="filter-chip">
              <span style={{ color: 'var(--text-faint)' }}>{defs[k].label}:</span>{' '}
              {filters[k].length === 1 ? filters[k][0] : `${filters[k].length} selected`}
              <button onClick={() => set(k)([])} aria-label={`Clear ${defs[k].label}`}>×</button>
            </span>
          ))}
          <button onClick={clearAll} style={{
            fontSize: 10, color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer',
            marginLeft: 4, textDecoration: 'underline', textDecorationColor: 'rgba(127,168,204,0.3)',
          }}>
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
