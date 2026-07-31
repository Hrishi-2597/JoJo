import React, { useMemo, useState } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import {
  geoHeadcountByRegion, geoHeadcountBySubRegion, geoLobHeadcountByRegion, geoLobHeadcountBySubRegion,
} from '../../data/tsaCapacityData'
import { regionForCountry, subRegionForCountry, CAPACITY_PLAN_NAMES } from '../../data/mockData'
import { BinaryToggle, GraphInsightButton, InfoButton, PlanSelect } from '../ChartKit'

// 'Actual' is the implicit baseline every other Plan-scaled selector on this page
// already treats it as (see PLAN_SCALE_BY_NAME) — same PLANS-filtering idiom
// HeadcountAttritionLayer/PlanOverPlanVariationLayer/WorkloadActPerformanceTable use.
const PLANS = CAPACITY_PLAN_NAMES.filter(p => p !== 'Actual')

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
const DEFAULT_FILL = '#0e1f35'

// 2026-07-29: colors by Headcount ADHERENCE (actual vs the selected Plan Name)
// instead of raw headcount relative to the current view's peak — a genuine 0-100%
// rate now (see geoHeadcountByRegion/BySubRegion in tsaCapacityData.js), so it uses
// the SAME fixed thresholds as every other Geo Map's acColor, not a relative scale.
function acColor(pct) {
  if (pct >= 90) return '#059669'
  if (pct >= 80) return '#2563eb'
  if (pct >= 70) return '#d97706'
  return '#dc2626'
}

const LEGEND = [
  { label: '≥ 90% Excellent', color: '#059669' },
  { label: '80–90% Good',     color: '#2563eb' },
  { label: '70–80% Fair',     color: '#d97706' },
  { label: '< 70% Critical',  color: '#dc2626' },
]

// Worldwide Headcount, now with a Region/Sub-region toggle (2026-07-03) mirroring
// MsgCapacityGeoMap's exact fallback mechanic: unmapped countries in Sub-region view
// shade at their parent region's color, 35% opacity. The mockup labels this "Layer 5"
// but skips a "Layer 4" entirely; renumbered to 04 here to keep this page's badges
// sequential (see design_choice.md). Switched from SLO% to Headcount 2026-07-23
// (see design_choice.md), then from a relative-to-peak headcount-level color to a
// Plan-reactive Headcount Adherence % color 2026-07-29 (see design_choice.md) — a
// Plan Name dropdown now genuinely repaints the map, not just the hover popup.
export default function TsaCapacityGeoMap({ filters }) {
  const [open, setOpen] = useState(true)
  const [viewMode, setViewMode] = useState('Region')
  const [hovered, setHovered] = useState(null)
  // Clicking a region/sub-region spotlights just that one (dims the rest). Cleared by
  // re-clicking it, the Clear pill, or switching Region/Sub-region view (different key
  // domains).
  const [selectedKey, setSelectedKey] = useState(null)
  // Plan Name (2026-07-29) — drives BOTH the hover popup's per-LOB Actual vs Planned
  // headcount + variance AND the map's own choropleth coloring (geoHeadcountByRegion/
  // BySubRegion now take planName too, so switching plans genuinely repaints the map).
  // Multi-select (2026-07-30) — a map region can only show one color, so this uses
  // the FIRST selected plan (documented simplification, same policy as every other
  // single-value-driven consumer in this rollout).
  const [selectedPlans, setSelectedPlans] = useState([])
  const plan = selectedPlans[0]
  const regionRows = useMemo(() => geoHeadcountByRegion(filters, plan), [filters, plan])
  const subRegionRows = useMemo(() => geoHeadcountBySubRegion(filters, plan), [filters, plan])
  const regionValue = useMemo(() => Object.fromEntries(regionRows.map(r => [r.region, r])), [regionRows])
  const subRegionValue = useMemo(() => Object.fromEntries(subRegionRows.map(r => [r.subRegion, r])), [subRegionRows])
  const hoveredLobs = useMemo(
    () => (hovered
      ? (hovered.isRegionKey ? geoLobHeadcountByRegion(hovered.name, filters, plan) : geoLobHeadcountBySubRegion(hovered.name, filters, plan))
      : []),
    [hovered, filters, plan]
  )

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
      <div className="layer-header" onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#070f1a', background: '#a78bfa', borderRadius: 4, padding: '2px 7px', letterSpacing: '0.04em' }}>04</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Geo Map</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>— worldwide headcount by region &amp; sub-region</span>
        </div>
        <span style={{ fontSize: 11, color: '#a78bfa', transform: open ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▲</span>
      </div>

      {open && (
        <div style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
            <GraphInsightButton
              rca="Headcount concentration mirrors where the largest LOBs are staffed, not necessarily where attrition risk is highest."
              clca="Cross-check thinly-staffed regions/sub-regions against the Attrition visual before rebalancing headcount." />
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
              <PlanSelect label="Plan Name" value={selectedPlans} onChange={setSelectedPlans} options={PLANS} />
              <BinaryToggle leftLabel="Region" rightLabel="Sub-region" value={viewMode} onChange={v => { setViewMode(v); setSelectedKey(null) }} />
            </div>
          </div>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            Worldwide Headcount Heatmap
            <InfoButton info="Headcount adherence (actual vs the selected Plan Name) by region or sub-region, colored from critical (red) to excellent (green). Hover a region/sub-region to see its LOBs' Actual vs Planned headcount and variance." />
          </p>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 2, marginBottom: 10 }}>
            Headcount Adherence % · {plan || 'Baseline plan'} · {viewMode} view
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
              <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, width: 250 }} className="chart-tooltip">
                <p style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 11 }}>{hovered.name}</p>
                <p style={{ marginTop: 3, marginBottom: 6, fontSize: 13, fontWeight: 700, color: acColor(hovered.adherence) }}>
                  {hovered.adherence}%
                  <span style={{ fontSize: 9, color: 'var(--text-dim)', fontWeight: 400, marginLeft: 5 }}>headcount adherence</span>
                  <span style={{ fontSize: 9, color: 'var(--text-faint)', fontWeight: 400, marginLeft: 8 }}>{hovered.headcount.toLocaleString()} total headcount</span>
                </p>
                <p style={{ fontSize: 8.5, color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.03em', marginBottom: 3 }}>
                  ACTUAL / PLANNED HEADCOUNT — BY LOB
                </p>
                <div style={{ maxHeight: 180, overflowY: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: 5, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {hoveredLobs.length === 0 && (
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: '6px 0' }}>No LOBs in scope.</p>
                  )}
                  {hoveredLobs.map(l => (
                    <div key={l.lob} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 10 }}>
                      <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.lob}</span>
                      <span style={{ flexShrink: 0 }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{l.actual}</span>
                        <span style={{ color: 'var(--text-faint)' }}> / {l.plan}</span>
                        <span style={{ fontWeight: 700, color: l.variance >= 0 ? '#34d399' : '#f87171', marginLeft: 5 }}>{l.variance > 0 ? '+' : ''}{l.variance}%</span>
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
                    let entry, displayName, isFallback = false
                    if (viewMode === 'Region') {
                      const region = regionForCountry(name)
                      entry = region != null ? regionValue[region] : undefined
                      displayName = region
                    } else {
                      const subRegion = subRegionForCountry(name)
                      if (subRegion != null) {
                        entry = subRegionValue[subRegion]
                        displayName = subRegion
                      } else {
                        const parentRegion = regionForCountry(name)
                        if (parentRegion != null) {
                          entry = regionValue[parentRegion]
                          displayName = parentRegion
                          isFallback = true
                        }
                      }
                    }
                    const fill = entry != null ? acColor(entry.adherence) : DEFAULT_FILL
                    const isSelected = selectedKey != null && displayName === selectedKey
                    const isDimmed = selectedKey != null && !isSelected
                    const baseOpacity = isFallback ? 0.35 : 1
                    return (
                      <Geography key={geo.rsmKey} geography={geo}
                        onMouseEnter={() => entry != null && setHovered({ name: displayName, headcount: entry.headcount, adherence: entry.adherence, isRegionKey: viewMode === 'Region' || isFallback })}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => entry != null && setSelectedKey(prev => prev === displayName ? null : displayName)}
                        style={{
                          default: { fill, fillOpacity: isDimmed ? 0.1 : baseOpacity, stroke: isSelected ? 'var(--accent)' : '#070f1a', strokeWidth: isSelected ? 1.5 : 0.4, outline: 'none', transition: 'fill-opacity 0.2s, stroke 0.2s', cursor: entry != null ? 'pointer' : 'default' },
                          hover:   { fill, fillOpacity: isDimmed ? 0.25 : (isFallback ? 0.55 : 0.8), stroke: isSelected ? 'var(--accent)' : '#070f1a', strokeWidth: isSelected ? 1.5 : 0.4, outline: 'none' },
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
