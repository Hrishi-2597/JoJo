import React, { useMemo, useState } from 'react'
import MultiSelectField from './MultiSelectField'
import { HOLIDAYS, HOLIDAY_REGIONS, HOLIDAY_COUNTRIES } from '../data/holidayCalendarData'

const REGION_TABS = ['All', ...HOLIDAY_REGIONS]
const MONTH_ORDER = [
  'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December', 'January',
]

function formatDate(iso) {
  const d = new Date(`${iso}T00:00:00Z`)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function MonthGroup({ month, rows, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
      <div
        className="layer-header"
        style={{ padding: '7px 10px', borderRadius: open ? '8px 8px 0 0' : 8 }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{month}</span>
        <span style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>{rows.length} · {open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div>
          {rows.map((r, i) => (
            <div key={i} style={{
              display: 'flex', gap: 8, alignItems: 'baseline', padding: '6px 10px',
              borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--border-subtle)',
            }}>
              <span className="num" style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--accent)', width: 42, flexShrink: 0 }}>
                {formatDate(r.date)}
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 10.5, color: 'var(--text-secondary)', lineHeight: 1.3 }}>{r.name}</p>
                <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>{r.country} · {r.dow}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function HolidayCalendarView() {
  const [region, setRegion] = useState('All')
  const [countries, setCountries] = useState([])

  const filtered = useMemo(() => {
    return HOLIDAYS.filter(h => (region === 'All' || h.region === region) && (countries.length === 0 || countries.includes(h.country)))
  }, [region, countries])

  const byMonth = useMemo(() => {
    const groups = {}
    filtered.forEach(h => { (groups[h.month] ||= []).push(h) })
    return MONTH_ORDER
      .map(m => ({ month: m, rows: groups[m] || [] }))
      .filter(g => g.rows.length > 0)
  }, [filtered])

  return (
    <div>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 4 }}>
        {filtered.length} holidays · FY27 · {HOLIDAY_COUNTRIES.length} countries
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
        <div className="drill-toggle">
          {REGION_TABS.map(r => (
            <button key={r} onClick={() => setRegion(r)} className={`drill-btn${region === r ? ' active' : ''}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <MultiSelectField label="Country" options={HOLIDAY_COUNTRIES} value={countries} onChange={setCountries} />
      </div>

      {byMonth.length === 0 && (
        <p style={{ fontSize: 10.5, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
          No holidays match the current filters.
        </p>
      )}
      {byMonth.map((g, i) => <MonthGroup key={g.month} month={g.month} rows={g.rows} defaultOpen={i === 0} />)}
    </div>
  )
}
