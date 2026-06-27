// scripts/validate.mjs
// Headless validation gate for cohistory. Run AFTER `vite build` + a running preview server.
// Usage: node scripts/validate.mjs [baseURL]
//   baseURL defaults to http://localhost:5173
//
// Exits non-zero on any console error, page error, failed assertion, or load failure.
// Writes screenshots to ./review/ for self-review (the agent can read these PNGs back).

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:5173';
const OUT = 'review';
mkdirSync(OUT, { recursive: true });

const failures = [];
const fail = (msg) => { failures.push(msg); console.error('  ✗', msg); };
const ok = (msg) => console.log('  ✓', msg);

const browser = await chromium.launch(); // headless by default
const ctx = await browser.newContext();
const page = await ctx.newPage();

// Capture anything the app logs that indicates breakage.
const consoleErrors = [];
const pageErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => pageErrors.push(e.message));
page.on('requestfailed', (r) => {
  // Ignore favicon noise; flag everything else.
  if (!r.url().includes('favicon')) pageErrors.push(`request failed: ${r.url()} (${r.failure()?.errorText})`);
});

console.log(`\nValidating ${BASE}\n`);

try {
  const resp = await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 });
  if (!resp || !resp.ok()) fail(`page did not load cleanly (status ${resp ? resp.status() : 'none'})`);
  else ok('page loaded');
} catch (e) {
  fail(`navigation threw: ${e.message}`);
}

// --- Phone-first screenshot (primary target ~390px) ---
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(400); // let layout/animation settle
await page.screenshot({ path: `${OUT}/phone-390.png`, fullPage: false });
ok(`screenshot ${OUT}/phone-390.png`);

// --- Desktop screenshot ---
await page.setViewportSize({ width: 1280, height: 800 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/desktop-1280.png`, fullPage: false });
ok(`screenshot ${OUT}/desktop-1280.png`);

// --- Structural assertions (edit selectors to match the real DOM) ---
// These are intentionally light; tighten them as the app's data-testids stabilize.

// 1. A canvas actually rendered and has non-zero size.
const canvas = await page.$('canvas');
if (!canvas) {
  fail('no <canvas> element found');
} else {
  const box = await canvas.boundingBox();
  if (!box || box.width < 50 || box.height < 50) fail(`canvas too small: ${JSON.stringify(box)}`);
  else ok(`canvas rendered at ${Math.round(box.width)}x${Math.round(box.height)}`);

  // 2. Canvas is not blank — sample pixels and confirm more than one distinct color.
  const distinct = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    if (!c) return 0;
    const g = c.getContext('2d');
    if (!g) return -1; // WebGL or context unavailable from here; skip this check
    try {
      const { width, height } = c;
      const data = g.getImageData(0, 0, Math.min(width, 400), Math.min(height, 400)).data;
      const seen = new Set();
      for (let i = 0; i < data.length; i += 4 * 97) { // sparse sample
        seen.add(`${data[i]},${data[i+1]},${data[i+2]}`);
        if (seen.size > 1) break;
      }
      return seen.size;
    } catch { return -1; } // tainted/Cross-origin or unreadable; don't fail on this
  });
  if (distinct === 0) fail('canvas getImageData found no canvas');
  else if (distinct === 1) fail('canvas appears blank (single color sampled)');
  else if (distinct === -1) ok('canvas pixel check skipped (context not readable)');
  else ok('canvas has rendered content');
}

// 3. Lane headers exist. Expects elements tagged data-testid="lane-header".
//    If you haven't added testids yet, add them — it makes this gate meaningful.
const laneCount = await page.locator('[data-testid="lane-header"]').count();
if (laneCount === 0) fail('no lane headers found (add data-testid="lane-header" to lane header elements)');
else ok(`${laneCount} lane header(s) present`);

// --- Console / page error gate ---
if (consoleErrors.length) fail(`console errors:\n      - ${consoleErrors.join('\n      - ')}`);
else ok('no console errors');
if (pageErrors.length) fail(`page errors:\n      - ${pageErrors.join('\n      - ')}`);
else ok('no page errors');

await browser.close();

console.log('');
if (failures.length) {
  console.error(`VALIDATION FAILED — ${failures.length} issue(s). Screenshots in ./${OUT}/ for inspection.\n`);
  process.exit(1);
}
console.log(`VALIDATION PASSED. Screenshots in ./${OUT}/ for visual review.\n`);
process.exit(0);
