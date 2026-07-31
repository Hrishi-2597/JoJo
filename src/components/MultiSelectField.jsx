import React, { useEffect, useMemo, useRef, useState } from 'react'

export default function MultiSelectField({ label, options, value, onChange, mono, emptyLabel = 'All' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef(null)
  const searchRef = useRef(null)
  const selected = value || []

  useEffect(() => {
    if (!open) return
    const onMouseDown = e => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false) }
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    searchRef.current?.focus()
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const filtered = useMemo(() => {
    if (!query.trim()) return options
    const q = query.trim().toLowerCase()
    return options.filter(o => o.toLowerCase().includes(q))
  }, [options, query])

  const toggle = opt => {
    onChange(selected.includes(opt) ? selected.filter(o => o !== opt) : [...selected, opt])
  }

  const display = selected.length === 0 ? emptyLabel
    : selected.length === 1 ? selected[0]
    : `${selected.length} selected`

  return (
    <div ref={rootRef} className="flex flex-col gap-1 min-w-0" style={{ position: 'relative' }}>
      <label style={{ fontSize: 8.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.09em', paddingLeft: 1 }}>
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="ms-field"
        style={mono && selected.length <= 1 ? { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: 10.5 } : undefined}
      >
        <span className="ms-field-label" title={selected.length > 1 ? selected.join(', ') : undefined}>{display}</span>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: open ? 1 : 0.7, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <polyline points="6 9 12 15 18 9" stroke="var(--text-faint)" strokeWidth="2.5" />
        </svg>
      </button>

      {open && (
        <div className="ms-panel animate-fade-in" onMouseDown={e => e.stopPropagation()}>
          <input
            ref={searchRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search…"
            className="ms-search"
          />
          <div className="ms-actions">
            <button type="button" onClick={() => onChange(options.slice())}>Select all</button>
            <button type="button" onClick={() => onChange([])}>Clear</button>
          </div>
          <div className="ms-list">
            {filtered.length === 0 && <p className="ms-empty">No matches</p>}
            {filtered.map(opt => (
              <label key={opt} className="ms-option" style={mono ? { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' } : undefined}>
                <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} style={{ accentColor: 'var(--accent)' }} />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
