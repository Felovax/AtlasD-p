/**
 * Automatisk mobiltest: åpner invitasjonen i Microsoft Edge (eller Chrome) uten vindu,
 * i flere vanlige telefonbredder, og
 *   - sjekker at siden aldri kan scrolles sidelengs,
 *   - sjekker at alle bilder laster,
 *   - fanger opp feil i konsollen,
 *   - lagrer skjermbilder i test-results/mobile/ så du kan se resultatet.
 *
 *   1. Start siden:  npm run dev   (eller npm run build && npm run preview)
 *   2. Kjør:         npm run check:mobile  [-- --url http://localhost:5173/]
 */
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'test-results', 'mobile');
const urlArg = process.argv.indexOf('--url');
const url = urlArg > -1 ? process.argv[urlArg + 1] : 'http://localhost:5173/';
const fullPage = process.argv.includes('--full');

const VIEWPORTS = [
  { name: 'liten-320', width: 320, height: 640 },
  { name: 'iphone-se-375', width: 375, height: 667 },
  { name: 'iphone-14-390', width: 390, height: 844 },
  { name: 'android-412', width: 412, height: 915 },
  { name: 'iphone-pro-max-430', width: 430, height: 932 },
  { name: 'nettbrett-768', width: 768, height: 1024 },
  { name: 'pc-1366', width: 1366, height: 800 },
];

function findBrowser() {
  const candidates = [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ];
  return candidates.find((p) => existsSync(p));
}

const executablePath = findBrowser();
if (!executablePath) {
  console.error('Fant verken Edge eller Chrome. Installer en av dem for å kjøre mobiltesten.');
  process.exit(1);
}

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true });
let failures = 0;

for (const vp of VIEWPORTS) {
  const mobile = vp.width < 700;
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    isMobile: mobile,
    hasTouch: mobile,
    locale: 'nb-NO',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
  page.on('requestfailed', (req) => errors.push(`Lastet ikke: ${req.url()}`));

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.querySelector('.dev-banner')?.remove());
  await page.waitForTimeout(2600);
  await page.screenshot({ path: path.join(outDir, `${vp.name}-1-forside.png`) });

  // Rull gjennom hele siden så alle «dukk opp»-animasjoner og bilder trigges.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += Math.round(vp.height * 0.6)) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
    await page.waitForTimeout(350);
  }
  await page.waitForTimeout(1500);

  const result = await page.evaluate(() => {
    const doc = document.documentElement;
    const broken = [...document.images].filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.currentSrc || img.src);
    return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, broken };
  });

  if (fullPage) {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, `${vp.name}-hele-siden.png`), fullPage: true });
  }

  for (const [label, selector] of [
    ['2-atlas', '#atlas'],
    ['3-bildebok', '.story'],
    ['4-info', '.details'],
    ['5-svar', '#svar'],
    ['6-slutt', '.closing'],
  ]) {
    await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ block: 'start', behavior: 'instant' }), selector);
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(outDir, `${vp.name}-${label}.png`) });
  }

  const overflow = result.scrollWidth > result.clientWidth;
  const ok = !overflow && result.broken.length === 0 && errors.length === 0;
  if (!ok) failures++;
  console.log(
    `${ok ? '✓' : '✗'} ${vp.name.padEnd(20)} bredde ${result.clientWidth}px` +
      (overflow ? `  SIDELENGS SCROLL (${result.scrollWidth}px)` : '') +
      (result.broken.length ? `  ØDELAGTE BILDER: ${result.broken.join(', ')}` : '') +
      (errors.length ? `  FEIL: ${[...new Set(errors)].join(' | ')}` : ''),
  );
  await context.close();
}

await browser.close();
console.log(`\nSkjermbilder: ${path.relative(root, outDir)}`);
process.exit(failures ? 1 : 0);
