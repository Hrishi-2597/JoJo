import React, { useState } from 'react'
import { BinaryToggle } from './ChartKit'
import {
  OVERALL_DB_CYCLES, OVERALL_OSP_CYCLES, CURRENT_CYCLE, CURRENT_CYCLE_LABEL, formatWeekRange,
} from '../data/planningCalendarData'

const DAY_META = [['Mon', 'mon'], ['Tue', 'tue'], ['Wed', 'wed'], ['Thu', 'thu'], ['Fri', 'fri']]

function WeekRow({ week }) {
  const entries = DAY_META.filter(([, key]) => week[key])
  return (
    <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="num" style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', marginBottom: 5 }}>
        {formatWeekRange(week.start)}
      </div>
      {entries.length === 0 && <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>No activity recorded this week.</p>}
      {entries.map(([label, key]) => (
        <div key={key} style={{ display: 'flex', gap: 7, marginBottom: 3 }}>
          <span style={{ width: 26, flexShrink: 0, fontSize: 9.5, fontWeight: 700, color: 'var(--text-faint)' }}>{label}</span>
          <span style={{ fontSize: 10.5, color: 'var(--text-secondary)', whiteSpace: 'pre-line', lineHeight: 1.35 }}>{week[key]}</span>
        </div>
      ))}
    </div>
  )
}

function CycleAccordion({ cycle, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
      <div
        className="layer-header"
        style={{ padding: '7px 10px', borderRadius: open ? '8px 8px 0 0' : 8 }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{cycle.plan}</span>
        <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && <div>{cycle.weeks.map((w, i) => <WeekRow key={i} week={w} />)}</div>}
    </div>
  )
}

function TrackList({ dbCycles, ospCycles }) {
  const [track, setTrack] = useState('DB')
  const cycles = track === 'DB' ? dbCycles : ospCycles
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
        <BinaryToggle leftLabel="DB" rightLabel="OSP" value={track} onChange={setTrack} />
      </div>
      {cycles.map((c, i) => <CycleAccordion key={c.plan} cycle={c} defaultOpen={i === 0} />)}
    </div>
  )
}

function ModelSection({ title, model }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 8 }}>
        {title}
      </p>
      {model.osp ? (
        <TrackList dbCycles={[model.db]} ospCycles={[model.osp]} />
      ) : (
        <CycleAccordion cycle={model.db} defaultOpen />
      )}
    </div>
  )
}

const TABS = [
  { key: 'fullYear', label: 'Full Year' },
  { key: 'current', label: 'Current Cycle' },
]

export default function PlanningCycleView() {
  const [tab, setTab] = useState('fullYear')

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
        <div className="drill-toggle">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`drill-btn${tab === t.key ? ' active' : ''}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'fullYear' && (
        <div>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 10 }}>
            Monthly forecast &amp; capacity planning workflow across FY27
          </p>
          <TrackList dbCycles={OVERALL_DB_CYCLES} ospCycles={OVERALL_OSP_CYCLES} />
        </div>
      )}

      {tab === 'current' && (
        <div>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 12 }}>
            {CURRENT_CYCLE_LABEL} — by call-volume model
          </p>
          <ModelSection title="SR Model" model={CURRENT_CYCLE.srModel} />
          <ModelSection title="Contacts Model" model={CURRENT_CYCLE.contactsModel} />
        </div>
      )}
    </div>
  )
}
