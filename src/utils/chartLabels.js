import React from 'react'

// Per-point data labels for every graph (2026-10-11, per direct request "give data
// labels as well for all the graphs" + "wherever applicable").
//
// Applied centrally by cloning each series element and handing it a `label` prop,
// rather than hand-adding <LabelList> to ~100 series across 26 charts. Same
// reasoning as chartExport.js: one consistent implementation, automatic for charts
// added later, and no chance of 100 hand-edits drifting apart in font, position or
// number format.
//
// "Wherever applicable" is the load-bearing part. Labelling every series on every
// chart unconditionally would directly undo the enterprise-grade pass that came
// just before this — a 36-row ranked queue chart, or a Week-granularity trend with
// 156 points, collides into unreadable soup. Two rules keep it legible:
//   1. shouldLabel() gates on density (point count x labelled-series count).
//   2. In combo charts only the BARS are labelled, never the secondary-axis
//      percentage line riding on top of them.
// Anything that doesn't clear those keeps its axis and tooltip untouched, which is
// what an axis is for. Concretely: ASU/SR Trend get labels at both their Year and
// default Quarter views; Month/Week views and the long ranked charts don't.

const MAX_DEPTH = 10

// Compact, so a label actually fits above a bar: 11500 -> '11.5K'. Percentages and
// ratios (which arrive as plain numbers like 93.3 or 0.54) pass through with their
// precision intact, since there's no reliable way to read a chart's unit from here.
function formatValue(v) {
  if (v == null || v === '') return ''
  if (typeof v !== 'number') return String(v)
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return `${+(v / 1_000_000).toFixed(1)}M`
  if (abs >= 10_000) return `${+(v / 1000).toFixed(0)}K`
  if (abs >= 1000) return `${+(v / 1000).toFixed(1)}K`
  if (Number.isInteger(v)) return String(v)
  return String(+v.toFixed(2))
}

const SERIES_TYPES = new Set(['Bar', 'Line', 'Area', 'Scatter'])
const nameOf = el => el?.type?.displayName || el?.type?.name || ''

// Collect what we need to judge density: the dataset, the chart's orientation, and
// how many series are actually being drawn.
function inspect(node, depth, out) {
  if (node == null || typeof node !== 'object' || depth > MAX_DEPTH) return
  if (Array.isArray(node)) { node.forEach(n => inspect(n, depth, out)); return }
  if (!React.isValidElement(node)) return
  const p = node.props || {}
  if (!out.data && Array.isArray(p.data) && p.data.length) {
    out.data = p.data
    out.horizontal = p.layout === 'vertical' // Recharts: layout="vertical" = bars run horizontally
  }
  if (SERIES_TYPES.has(nameOf(node)) && typeof p.dataKey === 'string') {
    if (nameOf(node) === 'Bar') out.bars += 1
    else out.lines += 1
  }
  if (p.children) inspect(p.children, depth + 1, out)
}

// In a combo chart (bars + a trend line), only the bars get labelled. The lines
// here are always a secondary-axis percentage — Adherence %, Variance %, CPASU —
// and their labels would float among the bar labels with nothing to tie them to
// the right axis, doubling the density to say something the line's shape already
// says. Pure line charts have no such competition, so they do get labels.
function labelledSeriesCount({ bars, lines }) {
  return bars > 0 ? bars : lines
}

function shouldLabel(out) {
  const { data, horizontal } = out
  const n = labelledSeriesCount(out)
  if (!data || !n) return false
  const points = data.length
  // Charts sit two-or-three-up in a flex row, so a single plot is roughly 450-650px.
  // At 12 points that's ~45px per category — enough for two compact labels ("4.2K"
  // is ~20px at 9px type), not enough for three, and nothing beyond 12 points fits
  // at all. Horizontal bars are judged on point count alone: each one owns its own
  // row and the label sits in empty space to the right.
  if (horizontal) return points <= 12
  return points <= 12 && points * n <= 24
}

function labelConfig(el, horizontal) {
  const p = el.props || {}
  const kind = nameOf(el)
  if (kind === 'Bar' && horizontal) {
    return { position: 'right', fill: 'var(--text-dim)', fontSize: 9, formatter: formatValue }
  }
  if (kind === 'Bar' && p.stackId) {
    // Inside a stacked segment. White reads against every stack fill we use (all
    // mid-to-dark); a 'top' label here would land on the segment above it instead.
    return { position: 'center', fill: '#fff', fontSize: 9, formatter: formatValue }
  }
  return { position: 'top', fill: 'var(--text-dim)', fontSize: 9, formatter: formatValue }
}

// Clone every series element to add a `label` prop. Only ever ADDS a prop — never
// restructures the tree — so Recharts' own child-type expectations are untouched,
// and an element that already sets `label` explicitly keeps its own.
function decorate(node, horizontal, barsPresent, depth) {
  if (node == null || typeof node !== 'object' || depth > MAX_DEPTH) return node
  if (Array.isArray(node)) return node.map((n, i) => {
    const d = decorate(n, horizontal, barsPresent, depth)
    return React.isValidElement(d) && d.key == null ? React.cloneElement(d, { key: i }) : d
  })
  if (!React.isValidElement(node)) return node

  const p = node.props || {}
  // `label == null || label === false` rather than `=== undefined`: Recharts' Line
  // declares `defaultProps.label = false`, which React merges into props before we
  // ever see the element — so an undefined-only check silently skipped every line
  // series while bars worked fine.
  const unlabelled = p.label == null || p.label === false
  const kind = nameOf(node)
  // Skip non-bar series in combo charts — see labelledSeriesCount() above.
  const skip = barsPresent && kind !== 'Bar'
  if (SERIES_TYPES.has(kind) && typeof p.dataKey === 'string' && unlabelled && !skip) {
    return React.cloneElement(node, { label: labelConfig(node, horizontal) })
  }
  if (p.children) {
    return React.cloneElement(node, { children: decorate(p.children, horizontal, barsPresent, depth + 1) })
  }
  return node
}

export function withDataLabels(children) {
  const out = { data: null, bars: 0, lines: 0, horizontal: false }
  inspect(children, 0, out)
  if (!shouldLabel(out)) return children
  return decorate(children, out.horizontal, out.bars > 0, 0)
}
