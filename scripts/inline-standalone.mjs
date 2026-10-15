import fs from 'node:fs'
import path from 'node:path'

// Folds the standalone build into ONE double-clickable .html (2026-10-15).
// Pairs with vite.config.standalone.js — see that file for why the bundle has to be
// iife with dynamic imports inlined before this step can work over file://.
const dir = 'dist-standalone'
const out = process.argv[2] || path.join(dir, 'ISG Single Pane of Glass (standalone).html')

let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8')
let js = fs.readFileSync(path.join(dir, 'app.js'), 'utf8')
const css = fs.readFileSync(path.join(dir, 'app.css'), 'utf8')

// A literal "</script" anywhere in the bundle would close the inline tag early and
// silently truncate the app. The escaped form is identical to JS, it just no longer
// looks like a closing tag to the HTML parser.
js = js.replaceAll('</script', '<\/script')

// The replacements MUST pass a function, not a string. String.replace treats `$$`
// in a replacement as an escape for a literal `$` — and the React bundle is full of
// `$$typeof`, React's own element tag. With a string replacement every one of them
// silently becomes `$typeof`, producing a file that is the right size and parses
// cleanly but in which React cannot recognise a single element: a blank page. A
// function replacer returns the string verbatim with no `$` substitution.
html = html
  .replace('<script type="module" crossorigin src="./app.js"></script>', () => `<script>\n${js}\n</script>`)
  .replace('<link rel="stylesheet" crossorigin href="./app.css">', () => `<style>\n${css}\n</style>`)
  // the committed index.html title still says "ESG Forecasting", stale since ESG was
  // hidden behind SHOW_ESG — don't ship that on a file someone gets sent
  .replace('<title>ISG SPoG – ESG Forecasting</title>', '<title>ISG Single Pane of Glass</title>')

fs.writeFileSync(out, html)
console.log(`standalone written: ${out} (${(fs.statSync(out).size / 1048576).toFixed(2)} MB)`)
