import React from 'react'
import { FISCAL_CALENDAR, FISCAL_YEAR_LABEL, FISCAL_YEAR_RANGE, DOW_LABELS } from '../data/planningCalendarData'

const TYPE_STYLE = {
  sco: { background: 'rgba(251,191,36,0.22)', color: '#92620a', fontWeight: 700 },
  holiday: { background: 'rgba(52,211,153,0.22)', color: '#0d5a3f', fontWeight: 600 },
  payDate: { border: '1.5px solid var(--accent)', color: 'var(--accent)', fontWeight: 700, borderRadius: 4 },
}

const LEGEND = [
  { key: 'sco', label: 'SCO', swatch: { background: 'rgba(251,191,36,0.5)' } },
  { key: 'holiday', label: 'Holiday', swatch: { background: 'rgba(52,211,153,0.5)' } },
  { key: 'payDate', label: 'Pay Date', swatch: { border: '1.5px solid var(--accent)' } },
]

function DayCell({ day }) {
  const style = day.type ? TYPE_STYLE[day.type] : {}
  return (
    <td
      className="num"
      title={day.date}
      style={{
        textAlign: 'center', padding: '2px 1px', fontSize: 9.5, color: 'var(--text-secondary)',
        borderRadius: 3, ...style,
      }}
    >
      {day.day}
    </td>
  )
}

function MonthTable({ month }) {
  return (
    <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)', borderRadius: 7, overflow: 'hidden', marginBottom: 10 }}>
      <div style={{ padding: '5px 8px', fontSize: 11, fontWeight: 700, textAlign: 'center', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' }}>
        {month.name}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ color: 'var(--text-muted)' }}>
            <th style={{ fontSize: 8, fontWeight: 700, width: '11%' }}>Q</th>
            <th style={{ fontSize: 8, fontWeight: 700, width: '11%' }}>W</th>
            {DOW_LABELS.map((l, i) => (
              <th key={i} style={{ fontSize: 8.5, fontWeight: 700, width: `${78 / 7}%` }}>{l}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {month.weeks.map((w, wi) => (
            <tr key={wi}>
              <td className="num" style={{ fontSize: 9, color: 'var(--accent)', textAlign: 'center', fontWeight: 600 }}>{w.qwks}</td>
              <td className="num" style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center' }}>{w.wks}</td>
              {w.days.map((d, di) => <DayCell key={di} day={d} />)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function FiscalCalendarView() {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{FISCAL_YEAR_LABEL}</p>
        <p style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 2 }}>{FISCAL_YEAR_RANGE}</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        {LEGEND.map(({ key, label, swatch }) => (
          <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9.5, color: 'var(--text-dim)' }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, display: 'inline-block', ...swatch }} />
            {label}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {FISCAL_CALENDAR.map(q => (
          <div key={q.label} style={{ marginBottom: 6 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-faint)',
              textTransform: 'uppercase', padding: '4px 2px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 8,
            }}>
              {q.label}
            </div>
            {q.months.map(m => <MonthTable key={m.name} month={m} />)}
          </div>
        ))}
      </div>
    </div>
  )
}
