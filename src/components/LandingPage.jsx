import React from 'react'

// Full descriptive names (Enterprise Service Group / High End Storage) were
// dropped entirely 2026-07-27, per direct request — just the acronym now.
const TILES = [
  {
    key: 'msg',
    label: 'ESG',
    desc: 'Forecasting and Capacity Plan for ESG queues, staffing and utilization.',
    accent: '#38bdf8',
  },
  {
    key: 'tsa',
    label: 'HES',
    desc: 'Forecasting and Capacity Plan for HES lines of business and workload.',
    accent: '#a78bfa',
  },
]

function Tile({ tile, onSelect }) {
  return (
    <button
      onClick={() => onSelect(tile.key)}
      className="card-panel"
      style={{
        width: 280, textAlign: 'left', cursor: 'pointer', padding: '28px 24px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      <div style={{
        width: 46, height: 46, borderRadius: 10,
        background: `linear-gradient(135deg, ${tile.accent}33 0%, ${tile.accent}11 100%)`,
        border: `1px solid ${tile.accent}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, fontWeight: 800, color: tile.accent,
      }}>
        {tile.label.slice(0, 2)}
      </div>
      <div>
        <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{tile.label}</p>
      </div>
      <p style={{ fontSize: 11.5, color: 'var(--text-dim)', lineHeight: 1.5 }}>{tile.desc}</p>
      <p style={{ fontSize: 10.5, fontWeight: 600, color: tile.accent, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
        Open {tile.label} <span aria-hidden>→</span>
      </p>
    </button>
  )
}

export default function LandingPage({ onSelect }) {
  return (
    <div style={{
      minHeight: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 36, padding: '40px 20px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>ISG SPoG</h1>
        <p style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 6 }}>Select a business to open its Forecasting and Capacity Plan views</p>
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        {TILES.map(tile => <Tile key={tile.key} tile={tile} onSelect={onSelect} />)}
      </div>
    </div>
  )
}
