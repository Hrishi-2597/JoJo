import React, { useState } from 'react'
import FiscalCalendarView from './FiscalCalendarView'
import PlanningCycleView from './PlanningCycleView'
import HolidayCalendarView from './HolidayCalendarView'

// Mounted once in App.jsx, outside the per-page conditional rendering, so its
// expand/collapse state survives switching between pages/tabs — this is what
// makes "add the calendar and planning cycle to all the pages" a single shared
// instance rather than something duplicated into every page component.
const SECTIONS = [
  { key: 'calendar', label: 'Fiscal Calendar', icon: '📅' },
  { key: 'cycle', label: 'Planning Cycle', icon: '🗓' },
  { key: 'holidays', label: 'Holiday Calendar', icon: '🌍' },
]

export default function PlanningSidebar() {
  const [active, setActive] = useState(null)
  const activeSection = SECTIONS.find(s => s.key === active)

  return (
    <div style={{ display: 'flex', flexShrink: 0, alignSelf: 'flex-start', position: 'sticky', top: 0 }}>
      <div style={{
        width: 46, flexShrink: 0, background: 'var(--bg-panel)', borderRight: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 0',
        maxHeight: '100vh', overflowY: 'auto',
      }}>
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setActive(a => (a === s.key ? null : s.key))}
            title={s.label}
            aria-label={s.label}
            aria-pressed={active === s.key}
            style={{
              width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border-default)',
              background: active === s.key ? 'var(--accent)' : 'var(--bg-inset)',
              color: active === s.key ? 'var(--accent-contrast)' : 'var(--text-dim)',
              fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background-color 0.15s ease, color 0.15s ease', padding: 0,
            }}
          >
            {s.icon}
          </button>
        ))}
      </div>

      {activeSection && (
        <div style={{
          width: 360, flexShrink: 0, background: 'var(--bg-page)', borderRight: '1px solid var(--border-subtle)',
          maxHeight: '100vh', overflowY: 'auto', animation: 'fade-in 0.15s ease-out',
        }}>
          <div className="layer-header" style={{ position: 'sticky', top: 0, zIndex: 3 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {activeSection.icon} {activeSection.label}
            </span>
            <button
              onClick={() => setActive(null)}
              aria-label={`Close ${activeSection.label}`}
              style={{
                width: 20, height: 20, borderRadius: 5, border: 'none', background: 'transparent',
                color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ padding: 14 }}>
            {active === 'calendar' && <FiscalCalendarView />}
            {active === 'cycle' && <PlanningCycleView />}
            {active === 'holidays' && <HolidayCalendarView />}
          </div>
        </div>
      )}
    </div>
  )
}
