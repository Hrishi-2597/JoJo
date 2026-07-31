import React, { useMemo, useState } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { geoAdherenceByRegion, geoLobPerformanceByRegion, regionForCountry } from '../../data/tsaData'
import { PLAN_NAMES } from '../../data/mockData'
import { BinaryToggle, GraphInsightButton, InfoButton, PlanSelect } from '../ChartKit'

const PLANS = PLAN_NAMES.filter(p => p !== 'Actual')

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
const DEFAULT_FILL = '#0e1f35'

function acColor(v) {
  if (v >= 90) return '#059669'
  if (v >= 80) return '#2563eb'
  if (v >= 70) return '#d97706'
  return '#dc2626'
}

const LEGEND = [
  { label: '≥ 90% Excellent', color: '#059669' },
  { label: '80–90% Good',     color: '#2563eb' },
  { label: '70–80% Fair',     color: '#d97706' },
  { label: '< 70% Critical',  color: '#dc2626' },
]

// LOB adherence across regions — same choropleth mechanism as the Forecasting page's
// Geo Map, colored by geoAdherenceByRegion() instead of forecast accuracy. No
// Region/Country toggle here — the deck only specifies a region-level view.
export default function TsaGeoMap({ filters }) {
  const [open, setOpen] = useState(true)
  const [hovered, setHovered] = useState(null)
  // Clicking a region spotlights just that one (dims the rest) instead of showing
  // every region at equal visual weight. Re-click the same region, or the Clear pill,
  // to go back to showing all of them.
  const [selectedKey, setSelectedKey] = useState(null)
  // Metric + Plan Name (2026-07-29) — drive BOTH the hover popup's per-LOB breakdown
  // AND the map's own choropleth coloring (geoAdherenceByRegion now takes metric/
  // planName too, so switching either genuinely repaints the map, not just the
  // hover text). Plan Name is multi-select (2026-07-30) but a map region can only
  // show one color, so this uses the FIRST selected plan (documented simplification,
  // same policy as every other single-value-driven consumer in this rollout).
  const [metric, setMetric] = useState('ASU')
  const [selectedPlans, setSelectedPlans] = useState([])
  const plan = selectedPlans[0]
  const rows = useMemo(() => geoAdherenceByRegion(filters, metric, plan), [filters, metric, plan])
  const accuracyByRegion = useMemo(() => Object.fromEntries(rows.map(r => [r.region, r.adherence])), [rows])
  const hoveredLobs = useMemo(
    () => (hovered ? geoLobPerformanceByRegion(hovered.name, filters, metric, plan) : []),
    [hovered, filters, metric, plan]
  )

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
      <div className="layer-header" onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#070f1a', background: '#a78bfa', borderRadius: 4, padding: '2px 7px', letterSpacing: '0.04em' }}>04</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Geo Map</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>— LOB adherence by region</span>
        </div>
        <span style={{ fontSize: 11, color: '#a78bfa', transform: open ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▲</span>
      </div>

      {open && (
        <div style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
            <GraphInsightButton
              rca="Adherence is weakest in regions with the newest onboarded queues."
              clca="Prioritize ramp-up support for recently onboarded queues in low-adherence regions." />
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
              <BinaryToggle leftLabel="ASU" rightLabel="SR" value={metric} onChange={setMetric} />
              <PlanSelect label="Plan Name" value={selectedPlans} onChange={setSelectedPlans} options={PLANS} />
            </div>
          </div>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            Global LOB Adherence Heatmap
            <InfoButton info="Choropleth of LOB adherence percentage by region, colored from critical (red) to excellent (green). Hover a region to see its LOBs' ASU/SR actual vs plan and adherence." />
          </p>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 2, marginBottom: 10 }}>
            {metric} Adherence % · {plan || 'Baseline plan'} · {filters.lob?.length ? `${filters.lob.length} LOB${filters.lob.length === 1 ? '' : 's'} selected` : 'All LOBs (avg)'}
            {selectedKey && (
              <> · Showing <strong style={{ color: 'var(--accent)' }}>{selectedKey}</strong>{' '}
                <span onClick={() => setSelectedKey(null)} style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}>Clear</span>
              </>
            )}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 8, flexWrap: 'wrap' }}>
            {LEGEND.map(({ label, color }) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-dim)' }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: color, display: 'inline-block', boxShadow: `0 0 6px ${color}80` }} />
                {label}
              </span>
            ))}
          </div>

          <div style={{ position: 'relative', background: '#070f1a', borderRadius: 8, overflow: 'hidden',
            height: 380, border: '1px solid rgba(255,255,255,0.06)', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.4)' }}>

            {hovered && (
              <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, width: 240 }} className="chart-tooltip">
                <p style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 11 }}>{hovered.name}</p>
                <p style={{ marginTop: 3, marginBottom: 6, fontSize: 13, fontWeight: 700, color: acColor(hovered.accuracy) }}>
                  {hovered.accuracy}%
                  <span style={{ fontSize: 9, color: 'var(--text-dim)', fontWeight: 400, marginLeft: 5 }}>adherence</span>
                </p>
                <p style={{ fontSize: 8.5, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.03em', marginBottom: 3 }}>
                  {metric} ACTUAL / PLAN — BY LOB
                </p>
                <div style={{ maxHeight: 180, overflowY: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: 5, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {hoveredLobs.length === 0 && (
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: '6px 0' }}>No LOBs in scope.</p>
                  )}
                  {hoveredLobs.map(l => (
                    <div key={l.lob} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 10 }}>
                      <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.lob}</span>
                      <span style={{ flexShrink: 0 }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{l.actual.toLocaleString()}</span>
                        <span style={{ color: 'var(--text-faint)' }}> / {l.plan.toLocaleString()}</span>
                        <span style={{ fontWeight: 700, color: l.adherence >= 100 ? '#34d399' : l.adherence >= 90 ? 'var(--text-secondary)' : '#f87171', marginLeft: 5 }}>{l.adherence}%</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <ComposableMap projection="geoMercator" projectionConfig={{ scale: 100, center: [10, 0] }} style={{ width: '100%', height: '100%' }}>
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const name = geo.properties.name
                    const region = regionForCountry(name)
                    const accuracy = region != null ? accuracyByRegion[region] : undefined
                    const fill = accuracy != null ? acColor(accuracy) : DEFAULT_FILL
                    const isSelected = selectedKey != null && region === selectedKey
                    const isDimmed = selectedKey != null && !isSelected
                    return (
                      <Geography key={geo.rsmKey} geography={geo}
                        onMouseEnter={() => accuracy != null && setHovered({ name: region, accuracy })}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => accuracy != null && setSelectedKey(prev => prev === region ? null : region)}
                        style={{
                          default: { fill, fillOpacity: isDimmed ? 0.1 : 1, stroke: isSelected ? 'var(--accent)' : '#070f1a', strokeWidth: isSelected ? 1.5 : 0.4, outline: 'none', transition: 'fill-opacity 0.2s, stroke 0.2s', cursor: accuracy != null ? 'pointer' : 'default' },
                          hover:   { fill, fillOpacity: isDimmed ? 0.25 : 0.8, stroke: isSelected ? 'var(--accent)' : '#070f1a', strokeWidth: isSelected ? 1.5 : 0.4, outline: 'none' },
                          pressed: { fill, outline: 'none' },
                        }}
                      />
                    )
                  })
                }
              </Geographies>
            </ComposableMap>

            <div style={{ position: 'absolute', bottom: 8, left: 10, display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, color: '#3d607a' }}>
              <span>100%</span>
              <div style={{ width: 72, height: 5, borderRadius: 3, background: 'linear-gradient(to left, #dc2626, #d97706, #2563eb, #059669)' }} />
              <span>0%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
