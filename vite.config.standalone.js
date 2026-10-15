import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build for the single-file, double-clickable distribution of the dashboard
// (2026-10-15) — a copy someone can be emailed and open with no server, no install
// and no deploy. Deliberately a SEPARATE config so the normal `npm run build` that
// feeds GitHub Pages is untouched; this one is driven by `npm run build:standalone`
// and writes to its own folder.
//
// Four differences from vite.config.js, each load-bearing for file:// :
//   base './'              — the default '/JoJo/' is an absolute path that resolves
//                            against the filesystem root when opened from a file,
//                            so nothing would load.
//   format 'iife'          — Chrome refuses to load `<script type="module">` over
//                            file:// (it is treated as a cross-origin request), so
//                            the bundle has to be a plain classic script.
//   inlineDynamicImports   — the Excel writer is loaded through a dynamic import().
//                            Code-splitting would emit a second chunk the page then
//                            tries to fetch at runtime, which file:// blocks; this
//                            folds it into the single bundle instead. It costs the
//                            lazy-loading benefit, which is the right trade here —
//                            an offline file has nothing to lazily load from.
//   cssCodeSplit false     — emit one stylesheet rather than several, so the inline
//                            step downstream has a single file to fold in.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist-standalone',
    cssCodeSplit: false,
    assetsInlineLimit: 100000000, // inline every asset as a data URI — nothing left to fetch
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'app.js',
        assetFileNames: 'app.[ext]',
      },
    },
  },
})
