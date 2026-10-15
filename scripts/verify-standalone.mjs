// Smoke-test the standalone file by actually EXECUTING it in a DOM and asserting the
// app mounted (2026-10-15). Added after two separate bugs shipped in a file that
// looked correct by every static check — right size, valid syntax, no external refs —
// but rendered a blank page. Static checks cannot catch "React threw on boot";
// only running it can.
import fs from 'node:fs'
import { JSDOM } from 'jsdom'

const file = process.argv[2] || 'dist-standalone/ISG Single Pane of Glass (standalone).html'
const html = fs.readFileSync(file, 'utf8')

const errors = []
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  virtualConsole: new (await import('jsdom')).VirtualConsole()
    .on('jsdomError', e => errors.push(`jsdomError: ${e.message}`))
    .on('error', (...a) => errors.push(`console.error: ${a.join(' ')}`)),
})

// React renders synchronously on mount, but give microtasks/effects a tick to settle.
await new Promise(r => setTimeout(r, 300))

const root = dom.window.document.getElementById('root')
const mounted = root && root.children.length > 0
const text = root ? root.textContent : ''

console.log(`file            : ${file}`)
console.log(`#root exists    : ${!!root}`)
console.log(`#root children  : ${root ? root.children.length : 0}`)
console.log(`rendered text   : ${text.slice(0, 70).replace(/\s+/g, ' ').trim() || '(empty)'}`)
if (errors.length) {
  console.log('\nerrors during boot:')
  errors.slice(0, 5).forEach(e => console.log('  ' + e.slice(0, 300)))
}

if (!mounted) {
  console.error('\nFAIL — the app did not mount. The file would open blank.')
  process.exit(1)
}
console.log('\nPASS — app mounted and rendered content.')
