import React, { useMemo, useState } from 'react'
import {
  ComposedChart, Sankey, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Rectangle,
} from 'recharts'
import { workloadSankey, actHrsByFY, actHrsDefaulterLobs } from '../../data/tsaCapacityData'
import { varianceTier, varianceReason, VARIANCE_TABLE_COLUMNS } from '../../data/insightFactors'
import { C, Visual, Tip, BinaryToggle } from '../ChartKit'

// Local override of the shared VARIANCE_TABLE_COLUMNS' 'Queue' header/'Variance' unit
// — this table ranks LOBs by Average Case Time overage (hours), not queues by % plan
// variance, so both the row label and the variance column need this page's own units.
const ACT_VARIANCE_COLUMNS = VARIANCE_TABLE_COLUMNS.map(c => (c.key === 'name' ? { ...c, label: 'LOB' } : c))

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

// Shared "top LOBs above target" list — both ACT visuals show it, per direct request.
function DefaulterLobList({ filters }) {
  const defaulters = useMemo(() => actHrsDefaulterLobs(filters, 6), [filters])
  return (
    <>
      <p style={{ fontSize: 9.5, color: 'var(--text-faint)', margin: '6px 0 4px', textAlign: 'center' }}>
        Top LOBs above target ACT
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {defaulters.map((l, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '2px 4px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{l.lob}</span>
            <span style={{ fontWeight: 600, color: C.behind }}>
              {l.actual}h <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>vs {l.plan}h plan (+{l.delta}h)</span>
            </span>
          </div>
        ))}
        {defaulters.length === 0 && <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>No LOBs currently above target ACT.</p>}
      </div>
    </>
  )
}

// Renamed from "Workload Act vs Plan" — the original name's "Act" referred to
// Average Case Time all along, not workload volume, so this plots actHrsByFY data as
// a bar+adherence chart, plus the defaulter list. (The sibling "ACT Trend — Actual vs
// Plan" line-chart visual that used to sit alongside this one was removed 2026-07-23
// so this layer holds exactly 2 graphs instead of 3.)
function Visual2({ filters, granularity }) {
  const data = useMemo(() => actHrsByFY(filters, granularity), [filters, granularity])
  // Full roster of LOBs currently running above their target Average Case Time (not
  // just the DefaulterLobList's own top-N below) — tiered High/Moderate/Low using the
  // same varianceTier/varianceReason helpers as the ranked-LOB charts elsewhere on this
  // page, treating each LOB's actual-vs-plan hour gap as the tiering magnitude.
  const table = useMemo(() => {
    const all = actHrsDefaulterLobs(filters, 999)
    return {
      title: 'Every LOB above target ACT, by variance tier',
      columns: ACT_VARIANCE_COLUMNS,
      rows: all.map(l => ({ name: l.lob, tier: varianceTier(l.delta).label, variance: `+${l.delta}h`, reason: varianceReason(l.lob) })),
    }
  }, [filters])
  return (
    <Visual title="Average Case Time Variance"
      info="Actual vs plan Average Case Time by period, with adherence % and the LOBs running longest."
      rca="A handful of LOBs are driving most of the above-plan case time."
      clca="Prioritize a case-time review for the LOBs topping this list."
      table={table}>
      <ResponsiveContainer width="100%" height={190}>
        <ComposedChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="l" tick={{ fill: C.tick, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}h`} />
          <YAxis yAxisId="r" orientation="right" tick={{ fill: C.trend, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Bar yAxisId="l" dataKey="actual" name="Actual (hrs)" fill={C.metric1} opacity={0.85} radius={[3,3,0,0]} maxBarSize={40} />
          <Bar yAxisId="l" dataKey="plan" name="Plan (hrs)" fill={C.metric2} opacity={0.85} radius={[3,3,0,0]} maxBarSize={40} />
          <Line yAxisId="r" type="monotone" dataKey="adherence" name="Adherence %" stroke={C.trend} strokeWidth={2} dot={{ r: 3, fill: C.trend, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
      <DefaulterLobList filters={filters} />
    </Visual>
  )
}

export default function WorkloadDistributionLayer({ filters, granularity }) {
  const [open, setOpen] = useState(true)

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
      <div className="layer-header" onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#070f1a', background: '#fb923c', borderRadius: 4, padding: '2px 7px', letterSpacing: '0.04em' }}>03</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Workload Distribution</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>— LOB/queue flow &amp; Average Case Time</span>
        </div>
        <span style={{ fontSize: 11, color: '#fb923c', transform: open ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▲</span>
      </div>
      {open && (
        <div style={{ padding: 12, display: 'flex', gap: 10 }}>
          <Visual1 filters={filters} />
          <Visual2 filters={filters} granularity={granularity} />
        </div>
      )}
    </div>
  )
}
