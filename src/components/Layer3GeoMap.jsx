import React, { useMemo, useState } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { geoRegionData, geoSubRegionRows, regionForCountry, subRegionForCountry, GEO_REGION_DATA, queuePerformance } from '../data/mockData'
import { GraphInsightButton, InfoButton } from './ChartKit'

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

// Same 3-tier status used by the Queue Performance table above this layer, reused
// here so a queue's status reads the same way in both places.
const STATUS_COLOR = { Good: '#34d399', Fair: '#fbbf24', Poor: '#f87171' }

export default function Layer3GeoMap({ filters, granularity }) {
  const [open, setOpen]         = useState(true)
  const [viewMode, setViewMode] = useState('Region')
  const [hovered, setHovered]   = useState(null)
  // Clicking a region/sub-region on the map spotlights just that one (dims the rest)
  // instead of showing every region at equal visual weight. Cleared by re-clicking the
  // same one, the Clear pill, or switching Region/Sub-region (the two view modes key
  // off different name domains, so a selection from one wouldn't map onto the other).
  const [selectedKey, setSelectedKey] = useState(null)
  const rows = useMemo(
    () => viewMode === 'Region' ? geoRegionData(filters) : geoSubRegionRows(filters),
    [viewMode, filters]
  )
  const accuracyByKey = useMemo(() => Object.fromEntries(rows.map(r => [r.region, r.accuracy])), [rows])
  const regionAccuracy = useMemo(() => Object.fromEntries(GEO_REGION_DATA.map(r => [r.region, r.accuracy])), [])
  // Sub-region view is narrowed once a Region or Sub-region filter is active, at which
  // point the "fill in the rest of the map from its parent region" fallback below would
  // misleadingly widen an intentionally-scoped view — so it only applies when nothing
  // is narrowing the view (showing everything).
  const subRegionIsNarrowed = filters.region?.length > 0 || filters.subRegion?.length > 0

  // Hovering a region/sub-region shows its queues in the same floating box as the
  // accuracy% (2026-07-27, replacing the old below-map table entirely — a popup on
  // hover instead of a table that pushes the page down). `hovered.isRegionKey` tracks
  // whether the hovered key is a real region (Region view, or Sub-region view's
  // fallback-to-parent-region countries) vs a real sub-region, so the right filter
  // override is used regardless of which view is active.
  const hoveredQueues = useMemo(
    () => (hovered ? queuePerformance(filters, hovered.isRegionKey ? { region: hovered.name } : { subRegion: hovered.name }, granularity) : []),
    [filters, hovered, granularity]
  )

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
      <div className="layer-header" onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, color: '#070f1a', background: '#fb923c',
            borderRadius: 4, padding: '2px 7px', letterSpacing: '0.04em',
          }}>03</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Geo Map
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>— global forecast adherence</span>
        </div>
        <span style={{ fontSize: 11, color: '#fb923c', transform: open ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▲</span>
      </div>

      {open && (
        <div style={{ padding: 14 }}>
          {/* Insight button on the left, Region/Sub-region toggle floated right so the title below can be centered on the panel */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <GraphInsightButton
              rca="Adherence is weakest in the EMEA and LATAM sub-regions."
              clca="Target forecasting model updates at the lowest-adherence sub-regions first." />
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10 }}>
              <span style={{ color: viewMode === 'Sub-region' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 500 }}>Sub-region</span>
              <button onClick={() => { setViewMode(v => v === 'Region' ? 'Sub-region' : 'Region'); setSelectedKey(null) }}
                style={{ position: 'relative', display: 'inline-flex', alignItems: 'center',
                  width: 36, height: 19, borderRadius: 10,
                  background: viewMode === 'Region' ? 'var(--accent)' : 'var(--bg-inset)',
                  border: 'none', cursor: 'pointer', transition: 'background 0.2s', padding: 0 }}>
                <span style={{ position: 'absolute', top: 3, left: viewMode === 'Region' ? 19 : 3,
                  width: 13, height: 13, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
              </button>
              <span style={{ color: viewMode === 'Region' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 500 }}>Region</span>
            </div>
          </div>

          {/* Centered title */}
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            Global Forecast Accuracy
            <InfoButton info="Forecast adherence % by region or sub-region, shaded on the map — hover a region/sub-region to see its queues." />
          </p>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 2, marginBottom: 10 }}>
            Forecast adherence % · {viewMode} view
            {selectedKey && (
              <> · Showing <strong style={{ color: 'var(--accent)' }}>{selectedKey}</strong>{' '}
                <span onClick={() => setSelectedKey(null)} style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}>Clear</span>
              </>
            )}
          </p>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 8, flexWrap: 'wrap' }}>
            {LEGEND.map(({ label, color }) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-dim)' }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: color, display: 'inline-block',
                  boxShadow: `0 0 6px ${color}80` }} />
                {label}
              </span>
            ))}
          </div>

          {/* Map container */}
          <div style={{ position: 'relative', background: '#070f1a', borderRadius: 8, overflow: 'hidden',
            height: 380, border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.4)' }}>

            {/* Empty state: selected region/sub-region has no matching rows (e.g. "Global") */}
            {rows.length === 0 && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
                <p style={{ fontSize: 11, color: '#3d607a', textAlign: 'center', maxWidth: 220 }}>
                  No {viewMode.toLowerCase()} data for the current filter scope — try clearing Region/Sub-region or picking a specific one.
                </p>
              </div>
            )}

            {/* Hovered popup — region/sub-region accuracy% plus its queues, replacing the
                old below-map table entirely (2026-07-27): a popup on hover, not a table
                that pushes the page down. */}
            {hovered && (
              <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, width: 300 }}
                className="chart-tooltip">
                <p style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 11 }}>{hovered.name}</p>
                <p style={{ marginTop: 3, marginBottom: 6, fontSize: 13, fontWeight: 700, color: acColor(hovered.accuracy) }}>
                  {hovered.accuracy}%
                  <span style={{ fontSize: 9, color: 'var(--text-dim)', fontWeight: 400, marginLeft: 5 }}>accuracy</span>
                </p>
                <div style={{ maxHeight: 180, overflowY: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: 5 }}>
                  {hoveredQueues.length === 0 && (
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: '6px 0' }}>No queues in scope.</p>
                  )}
                  {hoveredQueues.map(q => (
                    <div key={q.code} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 10, padding: '2px 0' }}>
                      <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.name}</span>
                      <span style={{ fontWeight: 700, color: STATUS_COLOR[q.status], flexShrink: 0 }}>{q.accuracy}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ scale: 100, center: [10, 0] }}
              style={{ width: '100%', height: '100%' }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const name = geo.properties.name
                    let displayName, accuracy, isFallback = false

                    if (viewMode === 'Region') {
                      const key = regionForCountry(name)
                      displayName = key
                      accuracy = key != null ? accuracyByKey[key] : undefined
                    } else {
                      const key = subRegionForCountry(name)
                      if (key != null) {
                        displayName = key
                        accuracy = accuracyByKey[key]
                      } else if (!subRegionIsNarrowed) {
                        // No specific sub-region tag for this country — shade it by its
                        // parent region's accuracy instead of leaving it blank, dimmed so
                        // named sub-regions still visually stand out from the background.
                        const parentRegion = regionForCountry(name)
                        if (parentRegion != null) {
                          displayName = parentRegion
                          accuracy = regionAccuracy[parentRegion]
                          isFallback = true
                        }
                      }
                    }

                    const fill = accuracy != null ? acColor(accuracy) : DEFAULT_FILL
                    const hoverFill = accuracy != null ? acColor(accuracy) : '#1a3050'
                    const isSelected = selectedKey != null && displayName === selectedKey
                    const isDimmed = selectedKey != null && !isSelected
                    const baseOpacity = isFallback ? 0.35 : 1
                    return (
                      <Geography key={geo.rsmKey} geography={geo}
                        onMouseEnter={() => accuracy != null && setHovered({ name: displayName, accuracy, isRegionKey: viewMode === 'Region' || isFallback })}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => accuracy != null && setSelectedKey(prev => prev === displayName ? null : displayName)}
                        style={{
                          default: { fill, fillOpacity: isDimmed ? 0.1 : baseOpacity, stroke: isSelected ? 'var(--accent)' : '#070f1a', strokeWidth: isSelected ? 1.5 : 0.4, outline: 'none', transition: 'fill-opacity 0.2s, stroke 0.2s', cursor: accuracy != null ? 'pointer' : 'default' },
                          hover:   { fill: hoverFill, fillOpacity: isDimmed ? 0.25 : (isFallback ? 0.55 : 0.8), stroke: isSelected ? 'var(--accent)' : '#070f1a', strokeWidth: isSelected ? 1.5 : 0.4, outline: 'none' },
                          pressed: { fill: hoverFill, outline: 'none' },
                        }}
                      />
                    )
                  })
                }
              </Geographies>
            </ComposableMap>

            {/* Scale */}
            <div style={{ position: 'absolute', bottom: 8, left: 10, display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, color: '#3d607a' }}>
              <span>100%</span>
              <div style={{ width: 72, height: 5, borderRadius: 3,
                background: 'linear-gradient(to left, #dc2626, #d97706, #2563eb, #059669)' }} />
              <span>0%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
