import React, { useEffect, useState } from 'react'
import LandingPage from './components/LandingPage'
import ForecastingPage from './components/ForecastingPage'
import MsgCapacityPage from './components/msgCapacity/MsgCapacityPage'
import TsaForecastingPage from './components/tsa/TsaForecastingPage'
import TsaCapacityPage from './components/tsaCapacity/TsaCapacityPage'
import PlanningSidebar from './components/PlanningSidebar'

const THEME_KEY = 'tsg-spog-theme'

// Each business section (ESG/HES) has its own internal Forecasting/Capacity Plan
// toggle — this is the sub-page shown inside that section, not a top-level route.
// Internal keys/state (msg/tsa) are unchanged — only user-facing labels were
// renamed (TSG->ISG, MSG->ESG, TSA->HES, 2026-07-27); see design_choice.md.
const SUB_PAGES = {
  msg: [
    { key: 'forecasting', label: 'ESG Forecasting' },
    { key: 'capacity', label: 'ESG Capacity Plan' },
  ],
  tsa: [
    { key: 'forecasting', label: 'HES Forecasting' },
    { key: 'capacity', label: 'HES Capacity Plan' },
  ],
}

function PageToggle({ options, page, setPage }) {
  return (
    <div className="drill-toggle">
      {options.map(p => (
        <button key={p.key} onClick={() => setPage(p.key)} className={`drill-btn${page === p.key ? ' active' : ''}`}>
          {p.label}
        </button>
      ))}
    </div>
  )
}

// Home button placed next to the header logo, next to a business section, to get
// back to the ISG SPoG landing tiles — the only way back up once a business is
// selected, since the header no longer carries a top-level page toggle.
function HomeButton({ onClick }) {
  return (
    <button onClick={onClick} aria-label="Back to ISG SPoG home" title="Back to ISG SPoG home" style={{
      width: 30, height: 30, borderRadius: 7, border: '1px solid var(--border-default)',
      background: 'var(--bg-inset)', color: 'var(--text-dim)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
    }}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M2 7.5 8 2l6 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3.5 6.5V13a1 1 0 0 0 1 1H6.5v-3.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1V14h2a1 1 0 0 0 1-1V6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

// Sun/moon pill switch, mirroring the same knob-slide pattern as TsaGeoMap's
// Region/Sub-region toggle rather than inventing a new interaction for "flip a
// binary setting."
function ThemeToggle({ theme, onToggle }) {
  const isLight = theme === 'light'
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
    >
      <span className="theme-toggle-knob">
        {isLight ? (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="4.5" fill="var(--accent-contrast)" />
            <g stroke="var(--accent-contrast)" strokeWidth="2.4" strokeLinecap="round">
              <path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12h2.5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
            </g>
          </svg>
        ) : (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
            <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79Z" fill="var(--accent-contrast)" />
          </svg>
        )}
      </span>
    </button>
  )
}

// Full descriptive names (Enterprise Service Group / High End Storage) were
// dropped entirely 2026-07-27, per direct request — just the acronym now.
const BUSINESS_META = {
  msg: { label: 'ESG', badge: 'ISG ESG' },
  tsa: { label: 'HES', badge: 'ISG HES' },
}

export default function App() {
  // Top-level: 'landing' or a business key ('msg'/'tsa'). Each business remembers
  // its own last-viewed sub-page (Forecasting/Capacity Plan) independently, so
  // hopping back to the landing tiles and returning doesn't reset it.
  const [view, setView] = useState('landing')
  const [msgSubPage, setMsgSubPage] = useState('forecasting')
  const [tsaSubPage, setTsaSubPage] = useState('forecasting')

  // Reading + applying the saved theme inside the initializer (not a useEffect)
  // sets the data-theme attribute before first paint, avoiding a dark->light flash.
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', saved)
    return saved
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const isBusiness = view === 'msg' || view === 'tsa'
  const subPage = view === 'msg' ? msgSubPage : tsaSubPage
  const setSubPage = view === 'msg' ? setMsgSubPage : setTsaSubPage
  const meta = isBusiness ? BUSINESS_META[view] : null
  const subPageLabel = isBusiness ? SUB_PAGES[view].find(p => p.key === subPage)?.label : null

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)', color: 'var(--text-primary)', transition: 'background-color 0.2s ease, color 0.2s ease' }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <header style={{
        background: 'linear-gradient(180deg, var(--bg-raised) 0%, var(--bg-panel) 100%)',
        borderBottom: '1px solid var(--border-default)',
      }} className="px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isBusiness && <HomeButton onClick={() => setView('landing')} />}
          {/* Logo mark */}
          <div style={{
            width: 32, height: 32, borderRadius: 7,
            background: 'linear-gradient(135deg, #1e3f6e 0%, #38bdf8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 12px rgba(56,189,248,0.3)',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="9" width="3" height="5" rx="1" fill="white" opacity="0.7"/>
              <rect x="6.5" y="5" width="3" height="9" rx="1" fill="white" opacity="0.85"/>
              <rect x="11" y="2" width="3" height="12" rx="1" fill="white"/>
              <path d="M3.5 7 L8 4 L12.5 1.5" stroke="rgba(56,189,248,0.8)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
              ISG SPoG
            </h1>
            <p style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 1 }}>
              {isBusiness ? `${meta.label} · ${subPageLabel}` : 'ESG · HES'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isBusiness && <PageToggle options={SUB_PAGES[view]} page={subPage} setPage={setSubPage} />}
          <ThemeToggle theme={theme} onToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} />
          <div style={{ fontSize: 10, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: '#34d399',
              display: 'inline-block', boxShadow: '0 0 6px #34d399',
            }} className="animate-pulse-soft" />
            Live · FY27
          </div>
          {isBusiness && (
            <div style={{
              fontSize: 10, fontWeight: 600, color: 'var(--accent)',
              background: 'var(--accent-dim)', border: '1px solid rgba(56,189,248,0.2)',
              borderRadius: 5, padding: '3px 9px',
            }}>
              {meta.badge}
            </div>
          )}
        </div>
      </header>

      {/* Accent line under header */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, var(--accent) 0%, rgba(56,189,248,0.1) 40%, transparent 70%)' }} />

      {/* PlanningSidebar is mounted once here, outside the page conditionals below,
          so its expand/collapse state persists across every page/tab switch —
          this is what makes the Fiscal Calendar + Planning Cycle available on
          every business page via one shared instance instead of a copy per page.
          Hidden on the landing page itself (2026-07-29, per direct request) — it
          only makes sense once a business's Forecasting/Capacity Plan view is open. */}
      <div style={{ display: 'flex' }}>
        {view !== 'landing' && <PlanningSidebar />}
        <div style={{ flex: 1, minWidth: 0 }}>
          {view === 'landing' && <LandingPage onSelect={setView} />}
          {view === 'msg' && (msgSubPage === 'forecasting' ? <ForecastingPage /> : <MsgCapacityPage />)}
          {view === 'tsa' && (tsaSubPage === 'forecasting' ? <TsaForecastingPage /> : <TsaCapacityPage />)}

          <footer style={{
            textAlign: 'center', fontSize: 10, color: 'var(--text-muted)',
            padding: '12px 0', borderTop: '1px solid var(--border-subtle)',
          }}>
            ISG SPoG · ESG · HES · © 2026 Aligned Automation Services
          </footer>
        </div>
      </div>
    </div>
  )
}
