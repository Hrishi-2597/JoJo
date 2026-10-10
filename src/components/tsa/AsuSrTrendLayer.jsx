import React, { useMemo, useState } from 'react'
import {
  ComposedChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  cpasuByFY, srBotsByFY,
  ucrByFY, topNonAdherentLobsByYear,
} from '../../data/tsaData'
import { contributingFactors, FACTOR_TABLE_COLUMNS, varianceTier, varianceReason } from '../../data/insightFactors'
import { C, Visual, Tip, Modal, TSA_TREND_COLORS, ComingSoonOverlay } from './TsaChartKit'

// (Removed 2026-10-11: the PLAN_NAMES import and the PLANS list derived from it —
// "UCR Impact on SR"'s Plan Name dropdown was this layer's only plan picker, so
// nothing here needs the plan roster any more.)

// "UCR Runrate with Target" ranks LOBs, not queues, so its variance-tier table gets
// its own column labels (copy of insightFactors' VARIANCE_TABLE_COLUMNS shape with
// 'Queue' swapped for 'LOB') rather than reusing that export's literal 'Queue' label.
const LOB_VARIANCE_TABLE_COLUMNS = [
  { key: 'name', label: 'LOB', wrap: true },
  { key: 'tier', label: 'Tier' },
  { key: 'variance', label: 'Gap vs Target', align: 'right' },
  { key: 'reason', label: 'Likely reason', wrap: true },
]

// Region breakdown + click-to-drill removed entirely (2026-09-10, per direct
// request, "make it like how i attached the pic") — X-axis is now plain fiscal
// period (FY25/FY26/FY27, or whatever the page's own View By toggle resolves to),
// matching every other simple ASU/SR/CPASU-style trend chart in this app. Backing
// selectors cpasuByRegion/cpasuTrendByRegion/regionTrendGranularity were removed
// from tsaData.js too — this was their only consumer.
function Visual1({ filters, granularity }) {
  const data = useMemo(() => cpasuByFY(filters, granularity), [filters, granularity])
  const table = useMemo(() => ({
    title: 'What contributed, by period',
    columns: FACTOR_TABLE_COLUMNS,
    rows: data.flatMap(d => contributingFactors(d.period, null, 1).map(f => ({ ...f, factor: `${d.period} — ${f.factor}` }))),
  }), [data])

  return (
    <Visual title="CPASU Trend"
      info="ASU, SR, and the resulting CPASU ratio by fiscal period."
      rca="CPASU is rising fastest in periods with the lowest bot deflection."
      clca="Expand bot-deflection coverage in the periods driving the CPASU increase."
      table={table} comingSoon>
      <ResponsiveContainer width="100%" height={222}>
        <ComposedChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="l" tick={{ fill: C.tick, fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
          <YAxis yAxisId="r" orientation="right" tick={{ fill: TSA_TREND_COLORS.magenta, fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Bar yAxisId="l" dataKey="asu" name="ASU" fill={TSA_TREND_COLORS.gold} radius={[2,2,0,0]} maxBarSize={40} />
          <Bar yAxisId="l" dataKey="sr" name="SR" fill={TSA_TREND_COLORS.orange} radius={[2,2,0,0]} maxBarSize={40} />
          <Line yAxisId="r" type="monotone" dataKey="cpasu" name="CPASU" stroke={TSA_TREND_COLORS.magenta}
            strokeWidth={2} dot={{ r: 3, fill: TSA_TREND_COLORS.magenta, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </Visual>
  )
}

// The "Plan Name" multi-select was removed 2026-10-11, per direct request — this
// chart now always plots the baseline SR plan. Dropping it cost nothing structurally:
// the humanSR/botsSR stack was never plan-dependent (it's the actual total no matter
// which plan is picked), so only the single "SR Plan" comparison bar ever reacted to
// the picker. With one fixed plan there's no longer a series to multiply, so the bar
// reads srBotsByFY's own `plan` field directly instead of mapping over selections.
function Visual2({ filters, granularity }) {
  const data = useMemo(() => srBotsByFY(filters, granularity), [filters, granularity])
  const table = useMemo(() => ({
    title: 'What contributed, by period',
    columns: FACTOR_TABLE_COLUMNS,
    rows: data.flatMap(d => contributingFactors(d.period, null, 1).map(f => ({ ...f, factor: `${d.period} — ${f.factor}` }))),
  }), [data])
  return (
    <Visual title="UCR Impact on SR"
      info="Human-handled vs bot (UCR) handled SR volume against the SR plan, by period."
      rca="Bot-handled SR's are growing faster than the plan assumed."
      clca="Fold observed bot deflection into next quarter's SR plan."
      table={table} comingSoon>
      <ResponsiveContainer width="100%" height={222}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: C.tick, fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          {/* Blue / Orange / Grey, pinned by direct request with a reference image
              (2026-10-11) — the stack's two actual components carry the color and
              the plan sits behind them in neutral grey. */}
          <Bar dataKey="humanSR" name="SR's" stackId="sr" fill={TSA_TREND_COLORS.blue} maxBarSize={44} />
          <Bar dataKey="botsSR"  name="UCR Handled SR's" stackId="sr" fill={TSA_TREND_COLORS.orange} radius={[2,2,0,0]} maxBarSize={44} />
          <Bar dataKey="plan" name="SR Plan" fill={TSA_TREND_COLORS.grey} radius={[2,2,0,0]} maxBarSize={44} />
        </BarChart>
      </ResponsiveContainer>
    </Visual>
  )
}

// Now responds to the page-wide View By granularity toggle like every other chart
// on this page (superseding the earlier "always Fiscal Year" decision — see
// design_choice.md) — clicking a bar opens a modal with that period's top 5 LOBs
// furthest from the UCR target, replacing the old always-visible queue list.
function Visual3({ filters, granularity }) {
  const [modalPeriod, setModalPeriod] = useState(null)
  const data = useMemo(() => ucrByFY(filters, granularity), [filters, granularity])
  const topLobs = useMemo(
    () => (modalPeriod ? topNonAdherentLobsByYear(filters, modalPeriod) : []),
    [filters, modalPeriod]
  )
  // The chart itself is a period trend, but the real diagnostic depth here is per-LOB
  // (topNonAdherentLobsByYear already ranks LOBs by how far they sit from the UCR
  // target) — so the "i" popup uses the same variance-tier + reason treatment as the
  // ranked-queue charts elsewhere, scoped to the latest in-view period's full LOB
  // roster (not just its top 5), rather than a period-based contributing-factors table.
  const latestPeriod = data[data.length - 1]?.period
  const table = useMemo(() => {
    if (!latestPeriod) return { title: 'Every LOB in scope, by adherence gap', columns: LOB_VARIANCE_TABLE_COLUMNS, rows: [] }
    const all = topNonAdherentLobsByYear(filters, latestPeriod, 999)
    return {
      title: `Every LOB in scope, by adherence gap — ${latestPeriod}`,
      columns: LOB_VARIANCE_TABLE_COLUMNS,
      rows: all
        .map(l => {
          const gap = +(l.target - l.runrate).toFixed(1)
          return {
            name: l.lob,
            tier: varianceTier(Math.abs(gap)).label,
            variance: `${gap > 0 ? '-' : gap < 0 ? '+' : ''}${Math.abs(gap)}%`,
            reason: varianceReason(l.lob),
            _abs: Math.abs(gap),
          }
        })
        .sort((a, b) => b._abs - a._abs),
    }
  }, [filters, latestPeriod])

  return (
    <Visual title="UCR Runrate with Target" subtitle="Click a bar to see that period's top 5 non-adherent LOBs"
      info="UCR runrate against target by period; click a bar to see that period's top non-adherent LOBs."
      rca="Non-adherent LOBs share a common low bot-deflection profile."
      clca="Prioritize automation coverage for the LOBs on the non-adherent list."
      table={table} comingSoon>
      <ResponsiveContainer width="100%" height={210}>
        <ComposedChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={C.grid} />
          <XAxis dataKey="period" tick={{ fill: C.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: C.tick, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: C.tick, paddingTop: 4 }} />
          <Bar dataKey="current" name="Runrate" fill={TSA_TREND_COLORS.gold} radius={[2,2,0,0]} maxBarSize={40}
            onClick={d => setModalPeriod(d.period)} style={{ cursor: 'pointer' }} />
          <Line type="monotone" dataKey="target" name="Target" stroke={C.behind} strokeWidth={2} strokeDasharray="4 3"
            dot={{ r: 3, fill: C.behind, strokeWidth: 0 }} />
        </ComposedChart>
      </ResponsiveContainer>

      {modalPeriod && (
        <Modal title={`${modalPeriod} — Top 5 Non-Adherent LOBs`} onClose={() => setModalPeriod(null)} width={420}>
          <ComingSoonOverlay>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {topLobs.map((l, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', fontSize: 11.5, padding: '5px 8px',
                  background: i % 2 ? 'transparent' : 'rgba(255,255,255,0.03)', borderRadius: 5,
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{l.lob}</span>
                  <span style={{ fontWeight: 600, color: C.behind }}>
                    {l.runrate}% <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>vs {l.target}%</span>
                  </span>
                </div>
              ))}
            </div>
          </ComingSoonOverlay>
        </Modal>
      )}
    </Visual>
  )
}

export default function AsuSrTrendLayer({ filters, granularity }) {
  const [open, setOpen] = useState(true)

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
      <div className="layer-header" onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#070f1a', background: '#fb923c', borderRadius: 4, padding: '2px 7px', letterSpacing: '0.04em' }}>03</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>CPASU/UCR Trend</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>— CPASU &amp; UCR runrate</span>
        </div>
        <span style={{ fontSize: 11, color: '#fb923c', transform: open ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▲</span>
      </div>
      {open && (
        <div style={{ padding: 12, display: 'flex', gap: 10 }}>
          <Visual1 filters={filters} granularity={granularity} />
          <Visual2 filters={filters} granularity={granularity} />
          <Visual3 filters={filters} granularity={granularity} />
        </div>
      )}
    </div>
  )
}
