import React, { useMemo, useState } from 'react'
import { Sankey, Tooltip, ResponsiveContainer, Rectangle } from 'recharts'
import { workloadSankey } from '../../data/tsaCapacityData'
import { C, Visual, BinaryToggle } from '../ChartKit'

// Recharts' default Sankey node renders as a plain unlabeled rect — this custom
// node paints the real LOB/queue name next to it so the diagram is legible without
// hovering every node, same "read without hovering" bar towards labeled data
// established for the horizontal queue-bar charts elsewhere in this app.
//
// 2026-07-20 correction: an earlier pass tried wiring hover via custom onHover/onLeave
// props on THIS component, which did nothing — Recharts doesn't forward arbitrary
// custom props through to a hover mechanism here. Recharts' own <Sankey> wraps every
// node in its OWN interactive <Layer> and only exposes hover via onMouseEnter/
// onMouseLeave PROPS ON THE <Sankey> ELEMENT ITSELF (called as (nodeOrLinkProps, type,
// event)), confirmed by reading node_modules/recharts's Sankey.js source directly.
// This component is back to purely presentational — no hover logic belongs here.
function SankeyNode({ x, y, width, height, index, payload }) {
  const isSource = payload.sourceLinks.length > 0
  return (
    <g>
      <Rectangle x={x} y={y} width={width} height={height} fill={isSource ? C.metric1 : C.metric2} fillOpacity={0.85} />
      <text
        textAnchor={isSource ? 'end' : 'start'}
        x={isSource ? x - 6 : x + width + 6}
        y={y + height / 2}
        dy={4}
        fontSize={10}
        fill="var(--text-secondary)"
      >
        {payload.name}
      </text>
    </g>
  )
}

// Hovering a node shows every flow touching it as a list with each connected node's
// share of THIS node's total volume — e.g. hover a LOB (source) to see every CQN it
// supports and what % of that LOB's volume each one represents; hover a CQN (target)
// to see every LOB supporting it the same way. Separate from the link-hover Tooltip
// below, which only shows one single source→target flow at a time.
//
// 2026-07-20 crash fix: this previously read the hovered node's own `sourceLinks`/
// `targetLinks` and treated each entry as a resolved {source,target,value} link
// object. Reading node_modules/recharts's Sankey.js showed those arrays actually hold
// plain LINK INDICES (numbers), not objects — `l.target.name` on a number threw
// immediately on the first hover ("Cannot read properties of undefined"), an uncaught
// render error that blanked the whole page. Rebuilt to filter the same flat
// {nodes, links} object this component already builds and passes to <Sankey data=...>,
// using the hovered node's plain `index` instead of Recharts' internal arrays.
function nodeHoverSummary(data, nodeIndex) {
  const isSource = data.links.some(l => l.source === nodeIndex)
  const relevant = data.links.filter(l => (isSource ? l.source : l.target) === nodeIndex)
  const total = relevant.reduce((s, l) => s + l.value, 0)
  const items = relevant
    .map(l => {
      const otherIndex = isSource ? l.target : l.source
      return { name: data.nodes[otherIndex]?.name ?? '', value: l.value, pct: total ? +(l.value / total * 100).toFixed(1) : 0 }
    })
    .sort((a, b) => b.value - a.value)
  return { name: data.nodes[nodeIndex]?.name ?? '', isSource, items, total }
}

function SankeyTip({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload
  if (!p || p.source === undefined) return null
  return (
    <div className="chart-tooltip">
      <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
        {p.source.name} → {p.target.name}: <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{p.value}</span>
      </p>
    </div>
  )
}

// Toggle switches which real-name set the Sankey flows into: 'LOB' mode routes
// illustrative CQN priority tiers into real TSA LOB names; 'CQN' mode routes
// illustrative LOB-priority tiers into real TSA queue names (from LOB_QUEUES) — per
// direct request to "utilize some TSA LOB's and some TSA Queues."
function Visual1({ filters }) {
  const [mode, setMode] = useState('LOB')
  const [hoveredNode, setHoveredNode] = useState(null)
  const data = useMemo(() => workloadSankey(filters, mode), [filters, mode])
  // Recharts calls this with (elementProps, type, event) for BOTH nodes and links —
  // elementProps is the same {x, y, width, height, index, payload} shape SankeyNode
  // receives for a node hover. Ignore link hovers (type === 'link'); those are handled
  // by the existing SankeyTip via the Tooltip component instead. Pass the plain node
  // `index` (a number) rather than `el.payload` (Recharts' raw node object) — see
  // nodeHoverSummary's comment for why the payload's own sourceLinks/targetLinks
  // can't be used directly.
  const handleMouseEnter = (el, type) => { if (type === 'node') setHoveredNode(nodeHoverSummary(data, el.index)) }
  const handleMouseLeave = (el, type) => { if (type === 'node') setHoveredNode(null) }
  return (
    <Visual title="Workload Distribution"
      subtitle={mode === 'LOB' ? 'Illustrative CQN priority tiers routed to real LOBs' : 'Illustrative LOB priority tiers routed to real queues'}
      cornerControls={<BinaryToggle leftLabel="LOB" rightLabel="CQN" value={mode} onChange={setMode} />}
      info="Sankey flow of priority tiers into real LOBs or queues, showing where workload concentrates."
      rca="Flow concentrates into a small number of LOBs/queues rather than spreading evenly."
      clca="Balance routing rules to reduce concentration in the top-loaded nodes.">
      <div style={{ position: 'relative' }}>
        {hoveredNode && (
          <div className="chart-tooltip animate-fade-in" style={{ position: 'absolute', top: 4, right: 4, zIndex: 10, width: 200, textAlign: 'left' }}>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>
              {hoveredNode.name}
              <span style={{ fontWeight: 400, color: 'var(--text-faint)', fontSize: 9 }}>
                {' '}{hoveredNode.isSource ? '— supports' : '— supported by'}
              </span>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 170, overflowY: 'auto' }}>
              {hoveredNode.items.map((it, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 10 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{it.name}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', flexShrink: 0 }}>{it.value} ({it.pct}%)</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <ResponsiveContainer width="100%" height={260}>
          <Sankey
            data={data}
            node={<SankeyNode />}
            nodePadding={22}
            margin={{ top: 8, right: 90, bottom: 8, left: 90 }}
            link={{ stroke: C.trend, strokeOpacity: 0.35 }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Tooltip content={<SankeyTip />} />
          </Sankey>
        </ResponsiveContainer>
      </div>
    </Visual>
  )
}

export default function WorkloadDistributionLayer({ filters }) {
  const [open, setOpen] = useState(true)

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
      <div className="layer-header" onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#070f1a', background: '#fb923c', borderRadius: 4, padding: '2px 7px', letterSpacing: '0.04em' }}>03</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Workload Distribution</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>— LOB/queue flow</span>
        </div>
        <span style={{ fontSize: 11, color: '#fb923c', transform: open ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▲</span>
      </div>
      {open && (
        <div style={{ padding: 12, display: 'flex', gap: 10 }}>
          <Visual1 filters={filters} />
        </div>
      )}
    </div>
  )
}
