import React from 'react'

// Shared KPI-card icon set (2026-10-11) — replaces the emoji that used to sit in
// every card's `icon` prop (📞 👥 📊 🎯 📋 🗂 📶 🎫 🧑‍💼 ⏱ and the geometric
// stand-ins ⬡ ⚖ ◎ ± ➗ ↩), per direct request to stop the dashboard reading as
// "funky". Emoji are rendered by the OS, so the same card looked different on
// Windows/macOS/Android, sat at inconsistent optical weights next to each other,
// and brought their own colors into a palette the rest of the page controls
// deliberately. These are flat 24x24 stroked glyphs instead: one weight, one
// geometry, and `currentColor` so a card can tint them with a theme token.
//
// Deliberately hand-written rather than pulling in an icon package — 15 glyphs at
// a handful of path commands each isn't worth a dependency, a bundle-size hit, or
// a tree-shaking config to use ~1% of.
const PATHS = {
  // Total Queues — a roster/list
  queues: <path d="M4 6h16M4 12h16M4 18h10" />,
  // Call Volume — volume over time, a pulse
  callVolume: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  // DB / OSP Split — one whole divided in two
  split: <><circle cx="12" cy="12" r="9" /><path d="M12 3v18" /></>,
  // Forecast Accuracy — a crosshair sighting on the mark
  accuracy: <><circle cx="12" cy="12" r="8" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></>,
  // Forecast Variance — spread in both directions
  variance: <path d="M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3" />,
  // Staffing Summary — people
  staffing: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9" /></>,
  // Utilization % — proportional bars
  utilization: <path d="M4 20V10M10 20V4M16 20v-7M2 20h20" />,
  // SL % / Current UCR — hitting a target
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" /></>,
  // Cases per FTE — a case record
  cases: <><path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" /><rect x="9" y="2" width="6" height="4" rx="1" /><path d="M8.5 12h7M8.5 16h4.5" /></>,
  // Attrition % — outflow, people leaving
  attrition: <path d="M17 7 7 17m0 0h7m-7 0v-7" />,
  // Total LOB — a grid of lines of business
  lob: <><rect x="3" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" /></>,
  // Active Service Units — a rising trend
  asu: <><path d="m3 17 6-6 4 4 7-7" /><path d="M16 8h5v5" /></>,
  // Service Requests — a ticket
  sr: <><path d="M4 9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1.5a2 2 0 0 0 0 3.5V15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4V9Z" /><path d="M13 8.5v7" /></>,
  // CPASU — a ratio, one over the other
  ratio: <><path d="M5 12h14" /><circle cx="12" cy="7" r="1.4" fill="currentColor" stroke="none" /><circle cx="12" cy="17" r="1.4" fill="currentColor" stroke="none" /></>,
  // Avg Case Time — elapsed time
  time: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5.2l3.2 1.9" /></>,
}

export default function MetricIcon({ name, size = 15 }) {
  const path = PATHS[name]
  if (!path) return null
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      // verticalAlign keeps these drop-in compatible with the inline <span> the card
      // headers already wrap `icon` in — no Card component needed a layout change.
      style={{ color: 'var(--text-dim)', verticalAlign: 'middle', flexShrink: 0 }}
      aria-hidden="true"
    >
      {path}
    </svg>
  )
}
