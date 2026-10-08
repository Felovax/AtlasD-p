/**
 * Gjør om de håndtegnede SVG-illustrasjonene i art/ til optimaliserte WebP-filer.
 *
 *   npm run illustrations
 *
 * Akvarelleffekten (ujevne kanter, pigment som samler seg i kantene, papirkorn)
 * lages med SVG-filtre. Slike filtre er tunge å regne ut på mobiltelefoner, så
 * vi «maler» dem ferdig her én gang i stedet for i nettleseren til gjestene.
 *
 * Resultatet havner i src/assets/illustrations/ og importeres av komponentene.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artDir = path.join(root, 'art');
const outDir = path.join(root, 'src', 'assets', 'illustrations');
const publicDir = path.join(root, 'public');

/** Navn på SVG-fil (uten .svg) → ønsket pikselbredde på ferdig bilde. */
const ILLUSTRATIONS = {
  'bear-honey': 640,
  'piglet-peek': 360,
  'tiger-bounce': 420,
  'donkey-sit': 460,
  'signpost': 380,
  'honeypot': 420,
  'tree-left': 500,
  'tree-right': 500,
  'clouds': 1400,
  'hills-far': 1400,
  'meadow-front': 1400,
  'closing-hill': 1400,
  'wash-honey': 700,
  'wash-green': 700,
  'photo-mask': 600,
  'page-mask': 600,
  'paper-texture': 300,
};

/**
 * Felles akvarellfiltre som settes inn der SVG-filene har <!--FILTERS-->.
 *  - #wash   : hovedfilter for fargeflater (ujevn kant, mørkere kant, flekkete pigment, korn)
 *  - #wash-soft : mykere og mer utflytende variant til himmel, åser og skygger
 *  - #ink    : litt skjelvende tusjstrek
 */
const FILTERS = /* xml */ `
<filter id="wash" x="-12%" y="-12%" width="124%" height="124%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="4" result="warp"/>
  <feDisplacementMap in="SourceGraphic" in2="warp" scale="8" xChannelSelector="R" yChannelSelector="G" result="shape"/>
  <feColorMatrix in="shape" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="shapeA"/>
  <feGaussianBlur in="shapeA" stdDeviation="3.2" result="blurA"/>
  <feComposite in="shapeA" in2="blurA" operator="arithmetic" k1="0" k2="3.2" k3="-3.2" k4="0" result="edge"/>
  <feComponentTransfer in="shape" result="dark">
    <feFuncR type="linear" slope="0.74"/><feFuncG type="linear" slope="0.72"/><feFuncB type="linear" slope="0.76"/>
  </feComponentTransfer>
  <feComposite in="dark" in2="edge" operator="in" result="rim"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.011 0.016" numOctaves="2" seed="11" result="blot"/>
  <feColorMatrix in="blot" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.35 0 0 0 0.12" result="blotA"/>
  <feComposite in="shape" in2="blotA" operator="in" result="mottled"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="2" result="grain"/>
  <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.9 0 0 0 0.5" result="grainA"/>
  <feComposite in="mottled" in2="grainA" operator="in" result="grained"/>
  <feMerge><feMergeNode in="grained"/><feMergeNode in="rim"/></feMerge>
</filter>
<filter id="wash-soft" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="8" result="warp"/>
  <feDisplacementMap in="SourceGraphic" in2="warp" scale="22" xChannelSelector="R" yChannelSelector="G" result="shape"/>
  <feGaussianBlur in="shape" stdDeviation="2.2" result="soft"/>
  <feColorMatrix in="soft" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="softA"/>
  <feGaussianBlur in="softA" stdDeviation="6" result="blurA"/>
  <feComposite in="softA" in2="blurA" operator="arithmetic" k1="0" k2="1.6" k3="-1.6" k4="0" result="edge"/>
  <feComponentTransfer in="soft" result="dark">
    <feFuncR type="linear" slope="0.82"/><feFuncG type="linear" slope="0.8"/><feFuncB type="linear" slope="0.84"/>
  </feComponentTransfer>
  <feComposite in="dark" in2="edge" operator="in" result="rim"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="21" result="blot"/>
  <feColorMatrix in="blot" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.2 0 0 0 0.22" result="blotA"/>
  <feComposite in="soft" in2="blotA" operator="in" result="mottled"/>
  <feMerge><feMergeNode in="mottled"/><feMergeNode in="rim"/></feMerge>
</filter>
<filter id="solid" x="-12%" y="-12%" width="124%" height="124%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="4" result="warp"/>
  <feDisplacementMap in="SourceGraphic" in2="warp" scale="8" xChannelSelector="R" yChannelSelector="G" result="d"/>
  <feMorphology in="d" operator="erode" radius="1.6"/>
</filter>
<filter id="ink" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="7" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G" result="d"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="2" seed="13" result="m"/>
  <feColorMatrix in="m" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.5 0 0 0 0.12" result="mA"/>
  <feComposite in="d" in2="mA" operator="in" result="faded"/>
  <feGaussianBlur in="faded" stdDeviation="0.32"/>
</filter>
`;

/** Store bakgrunnsscener får ikke fint korn i filteret – det sparer mye filstørrelse. */
const LARGE = new Set(['tree-left', 'tree-right', 'clouds', 'hills-far', 'meadow-front', 'closing-hill']);
const GRAIN = 'values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.9 0 0 0 0.5" result="grainA"';
const NO_GRAIN = 'values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0 1" result="grainA"';

async function renderOne(name, width) {
  const svgPath = path.join(artDir, `${name}.svg`);
  let svg = await readFile(svgPath, 'utf8');
  svg = svg.replace('<!--FILTERS-->', LARGE.has(name) ? FILTERS.replace(GRAIN, NO_GRAIN) : FILTERS);

  const viewBox = svg.match(/viewBox="([\d.\s-]+)"/);
  if (!viewBox) throw new Error(`${name}.svg mangler viewBox`);
  const [, , vbWidth] = viewBox[1].trim().split(/\s+/).map(Number);
  const density = Math.min(2400, Math.ceil((72 * width) / vbWidth) + 1);

  const isMask = name.endsWith('-mask');
  const isTexture = name === 'paper-texture';
  let img = sharp(Buffer.from(svg), { density }).resize({ width });

  const outName = isMask ? `${name}.png` : `${name}.webp`;
  const target = path.join(outDir, outName);
  if (isMask) {
    await img.png({ compressionLevel: 9, palette: false }).toFile(target);
  } else if (isTexture) {
    await img.webp({ quality: 50, alphaQuality: 40, effort: 6 }).toFile(target);
  } else {
    await img.webp({ quality: LARGE.has(name) ? 72 : 80, alphaQuality: LARGE.has(name) ? 70 : 85, effort: 6 }).toFile(target);
  }
  const { size } = await sharp(target).metadata().then(async () => ({ size: (await readFile(target)).length }));
  console.log(`✓ ${outName.padEnd(22)} ${String(Math.round(size / 1024)).padStart(4)} kB`);
  return target;
}

/** Lager forhåndsvisningsbildet som vises når lenken deles i SMS/Messenger (1200×630). */
async function renderSocialImage() {
  const W = 1200;
  const H = 630;
  const sky = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <defs>
        <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#d9e8e4"/><stop offset="0.6" stop-color="#f4ecd6"/><stop offset="1" stop-color="#f7efdc"/>
        </linearGradient>
        <radialGradient id="sun" cx="0.5" cy="0.25" r="0.5">
          <stop offset="0" stop-color="#fff3c9" stop-opacity="0.9"/><stop offset="1" stop-color="#fff3c9" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#s)"/>
      <rect width="100%" height="100%" fill="url(#sun)"/>
    </svg>`);
  const layer = (file, width) => sharp(path.join(outDir, file)).resize({ width }).toBuffer();
  const [clouds, hills, meadow, treeL, treeR, bear] = await Promise.all([
    layer('clouds.webp', 1200),
    layer('hills-far.webp', 1200),
    layer('meadow-front.webp', 1200),
    sharp(path.join(outDir, 'tree-left.webp')).resize({ width: 300 }).extract({ left: 0, top: 0, width: 300, height: 630 }).toBuffer(),
    sharp(path.join(outDir, 'tree-right.webp')).resize({ width: 300 }).extract({ left: 0, top: 0, width: 300, height: 630 }).toBuffer(),
    layer('bear-honey.webp', 250),
  ]);
  const meta = async (buf) => sharp(buf).metadata();
  const [hm, mm, tl, tr, bm] = await Promise.all([meta(hills), meta(meadow), meta(treeL), meta(treeR), meta(bear)]);
  await sharp(sky)
    .composite([
      { input: clouds, top: 20, left: 0 },
      { input: hills, top: H - hm.height - 40, left: 0 },
      { input: treeL, top: 0, left: 0 },
      { input: treeR, top: 0, left: W - 300 },
      { input: meadow, top: H - mm.height, left: 0 },
      { input: bear, top: H - bm.height - 30, left: Math.round(W / 2 - 125) },
    ])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(path.join(publicDir, 'og-image.jpg'));
  console.log('✓ public/og-image.jpg (forhåndsvisning for deling)');

  // Ikon når noen legger siden på hjemskjermen (iPhone)
  const pot = await sharp(path.join(outDir, 'honeypot.webp')).resize({ width: 140, height: 140, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  await sharp({ create: { width: 180, height: 180, channels: 4, background: '#f7efdc' } })
    .composite([{ input: pot, left: 20, top: 22 }])
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ public/apple-touch-icon.png');
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const only = process.argv.slice(2);
  const names = only.length ? only : Object.keys(ILLUSTRATIONS);
  for (const name of names) {
    if (name === 'og') continue;
    if (!(name in ILLUSTRATIONS)) {
      console.warn(`Ukjent illustrasjon: ${name}`);
      continue;
    }
    await renderOne(name, ILLUSTRATIONS[name]);
  }
  if (!only.length || only.includes('og')) await renderSocialImage();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
