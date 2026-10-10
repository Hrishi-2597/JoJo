import React from 'react'

// Excel export for every graph (2026-10-11, per direct request "give excel export
// for each and every graph - not tiles").
//
// The data is derived from the chart's own React children rather than threaded in
// as a prop at all ~26 `<Visual>` call sites. That's a deliberate trade: the props
// approach means 26 hand-edits where passing the wrong in-scope variable name fails
// SILENTLY at runtime (JS has no compile-time check for it), and every future chart
// has to remember to opt in. Deriving instead means every graph — including ones
// added later — gets an export button for free, and the only inputs it reads
// (`data`, `dataKey`, `name`) are public Recharts props, not internals.
//
// It fails CLOSED: anything this can't confidently interpret returns null, and
// `Visual` then renders no button at all, rather than handing someone a plausible-
// looking spreadsheet with the wrong numbers in it.

const MAX_DEPTH = 10

// 'humanSR' -> 'Human SR', 'planA_0' -> 'PlanA 0', 'period' -> 'Period'
function prettify(key) {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, c => c.toUpperCase())
}

// Recharts keys every series and axis off a `dataKey`, and labels series with
// `name` (the same string the legend shows). Collecting those in JSX order gives
// the category axis first and the series after it — which is exactly the column
// order a reader expects in the sheet, with no component-type sniffing needed.
function collect(node, depth, out) {
  if (node == null || typeof node !== 'object' || depth > MAX_DEPTH) return
  if (Array.isArray(node)) {
    node.forEach(n => collect(n, depth, out))
    return
  }
  if (!React.isValidElement(node)) return
  const p = node.props || {}

  if (!out.dataset && p.data) {
    if (Array.isArray(p.data) && p.data.length) out.dataset = p.data
    else if (Array.isArray(p.data.links) && Array.isArray(p.data.nodes)) out.sankey = p.data
  }
  if (typeof p.dataKey === 'string' && !out.seen.has(p.dataKey)) {
    out.seen.add(p.dataKey)
    out.columns.push({ key: p.dataKey, label: typeof p.name === 'string' && p.name ? p.name : prettify(p.dataKey) })
  }
  if (p.children) collect(p.children, depth + 1, out)
}

export function deriveChartData(children) {
  const out = { dataset: null, sankey: null, columns: [], seen: new Set() }
  collect(children, 0, out)

  // Sankey carries {nodes, links} rather than a row array, and declares no
  // dataKeys — flatten it to the flow list it actually represents.
  if (!out.dataset && out.sankey) {
    const { nodes, links } = out.sankey
    const rows = links.map(l => ({
      source: nodes[l.source]?.name ?? l.source,
      target: nodes[l.target]?.name ?? l.target,
      value: l.value,
    }))
    if (!rows.length) return null
    return {
      rows,
      columns: [{ key: 'source', label: 'From' }, { key: 'target', label: 'To' }, { key: 'value', label: 'Value' }],
    }
  }

  if (!out.dataset || !out.columns.length) return null
  // Only keep columns the dataset actually carries — a dataKey can point at a
  // field that isn't present on these particular rows (e.g. an adherence line
  // that only renders when exactly one plan is selected).
  const columns = out.columns.filter(c => out.dataset.some(r => r && r[c.key] !== undefined))
  if (!columns.length) return null
  return { rows: out.dataset, columns }
}

function safeFileName(title) {
  const base = String(title || 'chart').replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim()
  return `${base || 'chart'}.xlsx`
}

export async function exportChartToExcel({ rows, columns, title }) {
  // Dynamically imported so the xlsx writer is code-split into its own chunk and
  // only fetched when someone actually clicks export — the initial bundle is
  // already over Vite's size warning, and most sessions never export anything.
  //
  // The '/browser' subpath is required, not cosmetic: this package publishes no
  // root ("." ) export, only ./browser, ./node, ./universal and ./utility, so a
  // bare 'write-excel-file' import fails the Vite build outright. The browser
  // build is also the one that triggers the download itself rather than returning
  // a Node stream.
  const { default: writeXlsxFile } = await import('write-excel-file/browser')

  const sheetColumns = columns.map(c => {
    // A column is only written as numeric if EVERY present value in it is a
    // number; otherwise the whole column goes out as text. Mixing the two within
    // one column is what makes Excel show "number stored as text" warnings.
    const numeric = rows.every(r => r?.[c.key] == null || typeof r[c.key] === 'number')
    return {
      header: c.label,
      cell: r => {
        const v = r?.[c.key]
        if (v == null) return null
        return numeric ? { type: Number, value: v } : { type: String, value: String(v) }
      },
    }
  })

  // v4 API, and both halves of this matter:
  //   - `columns` (v3's `schema` was removed outright and now throws)
  //   - the call returns { toBlob, toFile } rather than downloading by itself,
  //     so without .toFile() this silently produces nothing at all.
  await writeXlsxFile(rows, { columns: sheetColumns, sheet: 'Data' }).toFile(safeFileName(title))
}
