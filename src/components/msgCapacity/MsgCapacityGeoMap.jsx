import React, { useMemo, useState } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { geoCapacityByRegion, geoCapacityBySubRegion, regionForCountry, subRegionForCountry } from '../../data/msgCapacityData'
import { BinaryToggle, GraphInsightButton, InfoButton } from '../ChartKit'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
const DEFAULT_FILL = '#0e1f35'

function vColor(v) {
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

// Same choropleth mechanism as Layer3GeoMap/TsaGeoMap, with two independent toggles:
// which metric colors the map (Headcount fulfillment vs SL%), and whether the
// highlighted areas are whole regions or the real 24 SUB_REGIONS values — replacing
// the earlier curated 14-country view entirely, per direct request. Sub-region view
// falls back to the parent region's shade at 35% opacity for countries with no
// specific sub-region tag, same "full coverage, named areas pop" convention
// Layer3GeoMap established, and is suppressed once Region/Sub-region filters
// already narrow the view (see subRegionIsNarrowed below).
export default function MsgCapacityGeoMap({ filters }) {
  const [open, setOpen] = useState(true)
  const [metric, setMetric] = useState('Headcount')
  const [viewMode, setViewMode] = useState('Region')
  const [hovered, setHovered] = useState(null)
  // Clicking a region/sub-region spotlights just that one (dims the rest). Cleared by
  // re-clicking it, the Clear pill, or switching Region/Sub-region view (different key
  // domains). Persists across the Headcount/SL% metric toggle — same area, different metric.
  const [selectedKey, setSelectedKey] = useState(null)

  const metricKey = metric === 'Headcount' ? 'fulfillmentPct' : 'slPct'
  const regionRows = useMemo(() => geoCapacityByRegion(filters), [filters])
  const subRegionRows = useMemo(() => geoCapacityBySubRegion(filters, metricKey), [filters, metricKey])
  const regionValue = useMemo(() => Object.fromEntries(regionRows.map(r => [r.region, r[metricKey]])), [regionRows, metricKey])
  const subRegionValue = useMemo(() => Object.fromEntries(subRegionRows.map(r => [r.subRegion, r.value])), [subRegionRows])
  const subRegionIsNarrowed = filters.region?.length > 0 || filters.subRegion?.length > 0

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
      <div className="layer-header" onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#070f1a', background: '#a78bfa', borderRadius: 4, padding: '2px 7px', letterSpacing: '0.04em' }}>04</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Geo Map</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>— global region performance overview</span>
        </div>
        <span style={{ fontSize: 11, color: '#a78bfa', transform: open ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▲</span>
      </div>

      {open && (
        <div style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <GraphInsightButton
                rca="Headcount fulfillment and SL% both lag in the same sub-regions."
                clca="Prioritize hiring in the sub-regions where both metrics are weak together." />
              <BinaryToggle leftLabel="Headcount" rightLabel="SL%" value={metric} onChange={setMetric} />
            </div>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              Global Region Performance Overview
              <InfoButton info="Headcount fulfillment % or SL %, mapped by region or sub-region — hover a region/sub-region for its exact value." />
            </p>
            <BinaryToggle leftLabel="Region" rightLabel="Sub-region" value={viewMode} onChange={v => { setViewMode(v); setSelectedKey(null) }} />
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 10 }}>
            {metric === 'Headcount' ? 'Headcount fulfillment %' : 'Service Level %'} · {viewMode} view
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
              <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }} className="chart-tooltip">
                <p style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 11 }}>{hovered.name}</p>
                <p style={{ marginTop: 3, fontSize: 13, fontWeight: 700, color: vColor(hovered.value) }}>
                  {hovered.value}%
                  <span style={{ fontSize: 9, color: 'var(--text-dim)', fontWeight: 400, marginLeft: 5 }}>{metric === 'Headcount' ? 'fulfillment' : 'SL'}</span>
                </p>
              </div>
            )}

            <ComposableMap projection="geoMercator" projectionConfig={{ scale: 100, center: [10, 0] }} style={{ width: '100%', height: '100%' }}>
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const name = geo.properties.name
                    let value, displayName, isFallback = false
                    if (viewMode === 'Region') {
                      const region = regionForCountry(name)
                      value = region != null ? regionValue[region] : undefined
                      displayName = region
                    } else {
                      const subRegion = subRegionForCountry(name)
                      if (subRegion != null) {
                        value = subRegionValue[subRegion]
                        displayName = subRegion
                      } else if (!subRegionIsNarrowed) {
                        const parentRegion = regionForCountry(name)
                        if (parentRegion != null) {
                          value = regionValue[parentRegion]
                          displayName = parentRegion
                          isFallback = true
                        }
                      }
                    }
                    const fill = value != null ? vColor(value) : DEFAULT_FILL
                    const isSelected = selectedKey != null && displayName === selectedKey
                    const isDimmed = selectedKey != null && !isSelected
                    const baseOpacity = isFallback ? 0.35 : 1
                    return (
                      <Geography key={geo.rsmKey} geography={geo}
                        onMouseEnter={() => value != null && setHovered({ name: displayName, value })}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => value != null && setSelectedKey(prev => prev === displayName ? null : displayName)}
                        style={{
                          default: { fill, fillOpacity: isDimmed ? 0.1 : baseOpacity, stroke: isSelected ? 'var(--accent)' : '#070f1a', strokeWidth: isSelected ? 1.5 : 0.4, outline: 'none', transition: 'fill-opacity 0.2s, stroke 0.2s', cursor: value != null ? 'pointer' : 'default' },
                          hover:   { fill, fillOpacity: isDimmed ? 0.25 : (isFallback ? 0.55 : 0.8), stroke: isSelected ? 'var(--accent)' : '#070f1a', strokeWidth: isSelected ? 1.5 : 0.4, outline: 'none' },
                          pressed: { fill, outline: 'none' },
                        }}
                      />
                    )
                  })
                }
              </Geographies>
            </ComposableMap>

            <div style={{ position: 'absolute', bottom: 8, left: 10, display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, color: 'var(--text-muted)' }}>
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
