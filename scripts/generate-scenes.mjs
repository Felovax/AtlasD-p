/**
 * Genererer SVG-kildene for de store scenene (trær, eng, åser, skyer, solnedgangsbakken)
 * med en fast «tilfeldig» frøverdi, slik at resultatet blir likt hver gang.
 *
 *   node scripts/generate-scenes.mjs && npm run illustrations
 *
 * Figurene (bjørn, gris, tiger, esel) og småtingene er håndskrevne SVG-filer i art/.
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const art = (f) => path.join(root, 'art', f);

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r1 = (n) => Math.round(n * 10) / 10;
const INK = '#4a3426';

const svg = (w, h, body, note) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <!-- ${note} Generert av scripts/generate-scenes.mjs -->
  <defs>
    <!--FILTERS-->
  </defs>
${body}
</svg>
`;

/** En organisk «sky» av sirkler, brukt til løvverk og skyer. */
function blob(rand, cx, cy, size, count = 6) {
  const circles = [];
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2;
    const d = rand() * size * 0.55;
    const r = size * (0.42 + rand() * 0.32);
    circles.push(`<circle cx="${r1(cx + Math.cos(a) * d)}" cy="${r1(cy + Math.sin(a) * d * 0.8)}" r="${r1(r)}"/>`);
  }
  return circles.join('');
}

function daisy(x, y, s) {
  const petals = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    petals.push(
      `<ellipse cx="${r1(x + Math.cos(a) * 5 * s)}" cy="${r1(y + Math.sin(a) * 5 * s)}" rx="${r1(4.2 * s)}" ry="${r1(2 * s)}" transform="rotate(${r1((a * 180) / Math.PI)} ${r1(x + Math.cos(a) * 5 * s)} ${r1(y + Math.sin(a) * 5 * s)})"/>`,
    );
  }
  return `<g fill="#fffdf6" filter="url(#wash)">${petals.join('')}</g><circle cx="${x}" cy="${y}" r="${r1(2.8 * s)}" fill="#e9b23a" filter="url(#wash)"/>`;
}

function buttercup(x, y, s) {
  return `<g fill="#f0c43c" filter="url(#wash)"><circle cx="${x}" cy="${y}" r="${r1(4.5 * s)}"/><circle cx="${r1(x + 4 * s)}" cy="${r1(y - 2 * s)}" r="${r1(3.5 * s)}"/><circle cx="${r1(x - 4 * s)}" cy="${r1(y - 2 * s)}" r="${r1(3.5 * s)}"/></g>`;
}

function clover(x, y, s) {
  return `<ellipse cx="${x}" cy="${y}" rx="${r1(4 * s)}" ry="${r1(5 * s)}" fill="#e7a3b4" filter="url(#wash)"/>`;
}

function stem(x, y, h) {
  return `<path d="M${x} ${y} C ${r1(x - 2)} ${r1(y + h * 0.4)} ${r1(x + 2)} ${r1(y + h * 0.7)} ${x} ${r1(y + h)}" stroke="#6f8c52" stroke-width="2" fill="none" filter="url(#ink)"/>`;
}

function grassTufts(rand, edge, x0, x1, count, color = '#5e7a48') {
  const out = [];
  for (let i = 0; i < count; i++) {
    const x = x0 + rand() * (x1 - x0);
    const y = edge(x) + 4 + rand() * 6;
    const h = 10 + rand() * 18;
    const lean = (rand() - 0.5) * 12;
    out.push(`M${r1(x)} ${r1(y)} q ${r1(lean * 0.4)} ${r1(-h * 0.5)} ${r1(lean)} ${r1(-h)}`);
  }
  return `<path d="${out.join(' ')}" stroke="${color}" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.8" filter="url(#ink)"/>`;
}

function wavyEdge(base, parts) {
  return (x) => base + parts.reduce((sum, [amp, period, phase]) => sum + amp * Math.sin(x / period + phase), 0);
}

function areaBelow(edge, w, h, step = 40) {
  let d = `M0 ${r1(edge(0))}`;
  for (let x = step; x <= w; x += step) d += ` L${x} ${r1(edge(x))}`;
  return `${d} L${w} ${h} L0 ${h} Z`;
}

// ── Eng i forgrunnen ────────────────────────────────────────────────────────────
function meadow() {
  const W = 1600;
  const H = 360;
  const rand = rng(42);
  const back = wavyEdge(78, [[22, 190, 0.4], [12, 70, 1.3]]);
  const front = wavyEdge(140, [[18, 240, 2.1], [9, 55, 0.2]]);
  let body = '';
  body += `  <path d="${areaBelow(back, W, H)}" fill="#a5bf7c" filter="url(#wash-soft)"/>\n`;
  body += `  <path d="${areaBelow(front, W, H)}" fill="#88a564" filter="url(#wash)"/>\n`;
  body += `  <path d="${areaBelow((x) => front(x) + 90 + 10 * Math.sin(x / 130), W, H)}" fill="#6f8f53" opacity="0.55" filter="url(#wash-soft)"/>\n`;
  body += '  ' + grassTufts(rand, back, 0, W, 140, '#7d9a5c') + '\n';
  body += '  ' + grassTufts(rand, front, 0, W, 190) + '\n';
  const flowers = [];
  for (let i = 0; i < 70; i++) {
    const x = r1(20 + rand() * (W - 40));
    // Litt roligere midt på, der bjørnen står.
    if (x > 690 && x < 910 && rand() < 0.7) continue;
    const top = rand() < 0.5 ? back(x) : front(x);
    const y = r1(top + 12 + rand() * 70);
    const s = 0.8 + rand() * 0.7;
    const kind = rand();
    flowers.push(stem(x, y, 14 + rand() * 10));
    flowers.push(kind < 0.45 ? daisy(x, y, s) : kind < 0.8 ? buttercup(x, y, s) : clover(x, y, s));
  }
  body += '  ' + flowers.join('\n  ') + '\n';
  return svg(W, H, body, 'Eng med gress og blomster.');
}

// ── Åser i det fjerne ───────────────────────────────────────────────────────────
function hills() {
  const W = 1600;
  const H = 420;
  const rand = rng(7);
  const far = wavyEdge(150, [[40, 260, 0.2], [16, 90, 2.0]]);
  const mid = wavyEdge(250, [[34, 210, 1.6], [12, 80, 0.7]]);
  let body = '';
  body += `  <path d="${areaBelow(far, W, H)}" fill="#c2d3c0" filter="url(#wash-soft)"/>\n`;
  const trees = [];
  for (let i = 0; i < 26; i++) {
    const x = rand() * W;
    const onMid = rand() < 0.5;
    const top = (onMid ? mid : far)(x);
    const s = (onMid ? 1.1 : 0.7) * (0.8 + rand() * 0.6);
    const y = top + 6;
    trees.push(`<path d="M${r1(x)} ${r1(y)} L${r1(x)} ${r1(y - 20 * s)}" stroke="#7d6a52" stroke-width="${r1(2.5 * s)}" opacity="0.6" filter="url(#ink)"/>`);
    trees.push(`<g fill="${onMid ? '#8fab79' : '#a9c09c'}" filter="url(#wash-soft)">${blob(rand, x, y - 30 * s, 20 * s, 4)}</g>`);
  }
  body += '  ' + trees.filter((_, i) => i % 4 < 2).join('\n  ') + '\n';
  body += `  <path d="${areaBelow(mid, W, H)}" fill="#adc596" filter="url(#wash-soft)"/>\n`;
  body += '  ' + trees.filter((_, i) => i % 4 >= 2).join('\n  ') + '\n';
  return svg(W, H, body, 'Bølgende åser langt borte.');
}

// ── Skyer ───────────────────────────────────────────────────────────────────────
function clouds() {
  const W = 1400;
  const H = 420;
  const rand = rng(99);
  const spots = [
    [230, 150, 70],
    [760, 100, 90],
    [1190, 190, 64],
  ];
  let body = '';
  for (const [x, y, s] of spots) {
    body += `  <ellipse cx="${x}" cy="${y + s * 0.55}" rx="${r1(s * 1.7)}" ry="${r1(s * 0.38)}" fill="#cddde0" opacity="0.8" filter="url(#wash-soft)"/>\n`;
    body += `  <g fill="#ffffff" opacity="0.92" filter="url(#wash-soft)">${blob(rand, x, y, s, 7)}${blob(rand, x - s, y + 18, s * 0.7, 4)}${blob(rand, x + s, y + 16, s * 0.75, 4)}</g>\n`;
  }
  return svg(W, H, body, 'Myke akvarellskyer.');
}

// ── Trær ────────────────────────────────────────────────────────────────────────
function tree({ seed, mirror, beehive }) {
  const W = 520;
  const H = 1300;
  const rand = rng(seed);
  let inner = '';
  // Stamme og greiner
  const trunk =
    'M10 1300 C 58 1250 92 1180 100 1080 C 110 960 112 820 122 700 C 128 620 132 560 140 520 L 198 520 C 198 580 190 660 192 740 C 196 880 206 1000 232 1120 C 244 1190 270 1250 300 1300 Z';
  const branches = [
    'M150 566 C 182 484 232 424 304 382 L 316 398 C 256 438 208 502 186 576 Z',
    'M172 650 C 224 616 294 604 372 614 L 370 632 C 300 626 236 638 188 674 Z',
    'M142 548 C 120 474 108 404 118 330 L 138 332 C 130 402 142 470 166 540 Z',
  ];
  inner += `  <path d="${trunk}" fill="#fbf6ea" filter="url(#solid)"/>\n`;
  inner += `  <path d="${trunk}" fill="#8f6d4c" filter="url(#wash)"/>\n`;
  inner += `  <path d="M168 560 C 168 700 170 900 196 1080 C 206 1160 232 1240 270 1300 L 300 1300 C 262 1240 236 1170 226 1100 C 204 960 196 760 198 560 Z" fill="#5f4532" opacity="0.5" filter="url(#wash)"/>\n`;
  for (const b of branches) inner += `  <path d="${b}" fill="#8a6948" filter="url(#wash)"/>\n`;
  inner += `  <path d="${trunk}" fill="none" stroke="${INK}" stroke-width="2.2" filter="url(#ink)"/>\n`;
  const bark = [];
  for (let i = 0; i < 9; i++) {
    const x = 120 + rand() * 70;
    const y = 640 + rand() * 560;
    const h = 40 + rand() * 90;
    bark.push(`M${r1(x)} ${r1(y)} c ${r1((rand() - 0.5) * 8)} ${r1(h * 0.3)} ${r1((rand() - 0.5) * 8)} ${r1(h * 0.7)} ${r1((rand() - 0.5) * 6)} ${r1(h)}`);
  }
  inner += `  <path d="${bark.join(' ')}" stroke="${INK}" stroke-width="1.6" fill="none" opacity="0.55" filter="url(#ink)"/>\n`;
  inner += `  <ellipse cx="160" cy="900" rx="12" ry="18" fill="#4b3526" opacity="0.75" filter="url(#wash)"/>\n`;

  // Løvverk: én samlet krone (kant-mørkning kun ytterst), så myk skyggelegging inni
  const crown = [
    [-10, 370, 175], [200, 290, 190], [330, 420, 140], [120, 520, 150], [-60, 520, 130],
    [260, 560, 120], [130, 150, 140], [325, 210, 110], [-40, 230, 130], [70, 340, 140],
  ];
  const crownShape = crown.map(([x, y, s]) => blob(rand, x, y, s, 6)).join('');
  inner += `  <g fill="#fbf6ea" filter="url(#solid)">${crownShape}</g>
`;
  inner += `  <g fill="#7d995f" filter="url(#wash)">${crownShape}</g>
`;
  inner += `  <g fill="#4f6b41" opacity="0.45" filter="url(#wash-soft)">${crown.map(([x, y, s]) => blob(rand, x + 10, y + s * 0.35, s * 0.55, 3)).join('')}</g>
`;
  inner += `  <g fill="#a9bf84" opacity="0.55" filter="url(#wash-soft)">${crown.map(([x, y, s]) => blob(rand, x - s * 0.2, y - s * 0.3, s * 0.42, 3)).join('')}</g>
`;
  // Lyse «solflekker» og små blader i kanten
  const dabs = [];
  for (let i = 0; i < 40; i++) {
    const [x, y, s] = crown[Math.floor(rand() * crown.length)];
    const a = rand() * Math.PI * 2;
    const d = s * (0.7 + rand() * 0.45);
    const lx = x + Math.cos(a) * d;
    const ly = y + Math.sin(a) * d * 0.85;
    dabs.push(`<ellipse cx="${r1(lx)}" cy="${r1(ly)}" rx="${r1(9 + rand() * 7)}" ry="${r1(5 + rand() * 3)}" transform="rotate(${Math.round(rand() * 180)} ${r1(lx)} ${r1(ly)})"/>`);
  }
  inner += `  <g fill="#86a066" opacity="0.9" filter="url(#wash)">${dabs.join('')}</g>\n`;
  const lights = [];
  for (let i = 0; i < 12; i++) {
    const [x, y, s] = crown[Math.floor(rand() * crown.length)];
    lights.push(`<circle cx="${r1(x - s * 0.3 + rand() * 30)}" cy="${r1(y - s * 0.4 + rand() * 30)}" r="${r1(12 + rand() * 18)}"/>`);
  }
  inner += `  <g fill="#c9d69c" opacity="0.6" filter="url(#wash-soft)">${lights.join('')}</g>\n`;
  // Løse tusjbuer for blader
  const arcs = [];
  for (let i = 0; i < 26; i++) {
    const [x, y, s] = crown[Math.floor(rand() * crown.length)];
    const a = rand() * Math.PI * 2;
    const px = x + Math.cos(a) * s * 0.8;
    const py = y + Math.sin(a) * s * 0.7;
    arcs.push(`M${r1(px)} ${r1(py)} q 8 -10 16 0`);
  }
  inner += `  <path d="${arcs.join(' ')}" stroke="#3f5a35" stroke-width="1.6" fill="none" opacity="0.5" filter="url(#ink)"/>\n`;

  let hive = '';
  if (beehive) {
    // Bikube (halmkube) som henger i en grein – tegnes uspeilet.
    const hx = 150;
    const hy = 690;
    hive += `  <path d="M${hx + 210} 640 C ${hx + 140} 630 ${hx + 60} 628 ${hx - 10} 640 L ${hx - 8} 652 C ${hx + 60} 642 ${hx + 140} 644 ${hx + 212} 656 Z" fill="#8a6948" filter="url(#wash)"/>\n`;
    hive += `  <path d="M${hx} 646 L${hx} 666" stroke="${INK}" stroke-width="2" filter="url(#ink)"/>\n`;
    const dome = `M${hx} ${hy - 26} C ${hx + 30} ${hy - 26} ${hx + 52} ${hy + 6} ${hx + 54} ${hy + 40} C ${hx + 56} ${hy + 62} ${hx + 40} ${hy + 72} ${hx} ${hy + 72} C ${hx - 40} ${hy + 72} ${hx - 56} ${hy + 62} ${hx - 54} ${hy + 40} C ${hx - 52} ${hy + 6} ${hx - 30} ${hy - 26} ${hx} ${hy - 26} Z`;
    hive += `  <path d="${dome}" fill="#fbf6ea" filter="url(#solid)"/>\n`;
    hive += `  <path d="${dome}" fill="#d9a441" filter="url(#wash)"/>\n`;
    hive += `  <path d="M${hx + 20} ${hy - 20} C ${hx + 44} ${hy} ${hx + 54} ${hy + 30} ${hx + 50} ${hy + 60} C ${hx + 40} ${hy + 70} ${hx + 24} ${hy + 72} ${hx + 10} ${hy + 72} C ${hx + 36} ${hy + 50} ${hx + 40} ${hy + 10} ${hx + 20} ${hy - 20} Z" fill="#a8732a" opacity="0.5" filter="url(#wash)"/>\n`;
    hive += `  <path d="${dome}" fill="none" stroke="${INK}" stroke-width="2.2" filter="url(#ink)"/>\n`;
    hive += `  <path d="M${hx - 34} ${hy - 4} C ${hx - 10} ${hy + 2} ${hx + 10} ${hy + 2} ${hx + 34} ${hy - 4} M${hx - 48} ${hy + 18} C ${hx - 16} ${hy + 26} ${hx + 16} ${hy + 26} ${hx + 48} ${hy + 18} M${hx - 54} ${hy + 42} C ${hx - 18} ${hy + 50} ${hx + 18} ${hy + 50} ${hx + 54} ${hy + 42}" stroke="${INK}" stroke-width="1.7" fill="none" opacity="0.7" filter="url(#ink)"/>\n`;
    hive += `  <ellipse cx="${hx}" cy="${hy + 58}" rx="11" ry="7" fill="#3a281c" filter="url(#ink)"/>\n`;
  }

  const group = mirror ? `<g transform="translate(${W} 0) scale(-1 1)">\n${inner}</g>\n` : inner;
  return svg(W, H, group + hive, mirror ? 'Tre til høyre, med bikube.' : 'Tre til venstre.');
}

// ── Solnedgangsbakken med vennene sett bakfra ───────────────────────────────────
function closingHill() {
  const W = 1600;
  const H = 760;
  const rand = rng(2024);
  const crest = wavyEdge(360, [[-40, 380, 0.9], [10, 120, 0.3]]);
  let body = '';
  // Bakken
  body += `  <path d="${areaBelow(crest, W, H)}" fill="#9aac68" filter="url(#wash)"/>
`;
  body += `  <path d="${areaBelow((x) => crest(x) + 4, W, H)}" fill="none" stroke="#e6c779" stroke-width="10" opacity="0.6" filter="url(#wash-soft)"/>
`;
  body += `  <path d="${areaBelow((x) => crest(x) + 160 + 20 * Math.sin(x / 200), W, H)}" fill="#7a8f55" opacity="0.6" filter="url(#wash-soft)"/>
`;
  // Tre til høyre, plantet på bakken
  const tb = crest(1320) + 26;
  const trunkD = `M1282 ${r1(tb)} C 1290 ${r1(tb - 90)} 1294 ${r1(tb - 170)} 1304 230 L 1342 230 C 1338 ${r1(tb - 170)} 1346 ${r1(tb - 90)} 1366 ${r1(tb)} Z`;
  body += `  <path d="${trunkD}" fill="#fbf6ea" filter="url(#solid)"/><path d="${trunkD}" fill="#7b5c40" filter="url(#wash)"/><path d="${trunkD}" fill="none" stroke="${INK}" stroke-width="2" filter="url(#ink)"/>
`;
  body += `  <path d="M1306 300 C 1256 260 1206 244 1150 240 L 1150 254 C 1204 260 1252 278 1298 316 Z" fill="#7b5c40" filter="url(#wash)"/>
`;
  const crownC = [[1330, 170, 160], [1170, 210, 120], [1480, 210, 130], [1310, 60, 120], [1450, 90, 110], [1200, 110, 100]];
  const crownCShape = crownC.map(([x, y, s]) => blob(rand, x, y, s, 6)).join('');
  body += `  <g fill="#fbf6ea" filter="url(#solid)">${crownCShape}</g>
`;
  body += `  <g fill="#808d52" filter="url(#wash)">${crownCShape}</g>
`;
  body += `  <g fill="#56653c" opacity="0.45" filter="url(#wash-soft)">${crownC.map(([x, y, s]) => blob(rand, x + 20, y + s * 0.35, s * 0.5, 3)).join('')}</g>
`;
  body += `  <g fill="#e2c477" opacity="0.55" filter="url(#wash-soft)">${crownC.map(([x, y, s]) => blob(rand, x - s * 0.3, y - s * 0.25, s * 0.38, 3)).join('')}</g>
`;

  // Vennene, sett bakfra (fra venstre: esel, bjørn, gris, tiger)
  const sitY = (x) => crest(x) + 10;
  const F = [];
  const part = (d, fill, extra = '') =>
    `<path d="${d}" fill="#fbf6ea" filter="url(#solid)"/><path d="${d}" fill="${fill}" filter="url(#wash)" ${extra}/><path d="${d}" fill="none" stroke="${INK}" stroke-width="2" filter="url(#ink)"/>`;
  const ellipse = (cx, cy, rx, ry) =>
    `M${cx} ${cy - ry} C ${r1(cx + rx * 0.55)} ${cy - ry} ${cx + rx} ${r1(cy - ry * 0.55)} ${cx + rx} ${cy} C ${cx + rx} ${r1(cy + ry * 0.55)} ${r1(cx + rx * 0.55)} ${cy + ry} ${cx} ${cy + ry} C ${r1(cx - rx * 0.55)} ${cy + ry} ${cx - rx} ${r1(cy + ry * 0.55)} ${cx - rx} ${cy} C ${cx - rx} ${r1(cy - ry * 0.55)} ${r1(cx - rx * 0.55)} ${cy - ry} ${cx} ${cy - ry} Z`;

  // Esel
  {
    const x = 660;
    const b = sitY(x);
    F.push(`<path d="M${x + 34} ${b - 20} C ${x + 58} ${b - 18} ${x + 64} ${b - 34} ${x + 70} ${b - 48}" stroke="${INK}" stroke-width="2.5" fill="none" filter="url(#ink)"/><ellipse cx="${x + 70}" cy="${b - 52}" rx="6" ry="9" fill="#5d5560" filter="url(#wash)"/>`);
    F.push(part(ellipse(x, b - 46, 40, 48), '#a3a6b4'));
    F.push(part(`M${x - 16} ${b - 120} C ${x - 30} ${b - 150} ${x - 40} ${b - 176} ${x - 34} ${b - 186} C ${x - 22} ${b - 182} ${x - 10} ${b - 150} ${x - 4} ${b - 124} Z`, '#a3a6b4'));
    F.push(part(`M${x + 16} ${b - 120} C ${x + 30} ${b - 150} ${x + 40} ${b - 176} ${x + 34} ${b - 186} C ${x + 22} ${b - 182} ${x + 10} ${b - 150} ${x + 4} ${b - 124} Z`, '#a3a6b4'));
    F.push(part(ellipse(x, b - 110, 26, 28), '#a9acba'));
    F.push(`<path d="M${x - 5} ${b - 136} C ${x + 6} ${b - 120} ${x - 4} ${b - 100} ${x + 3} ${b - 80} L ${x + 9} ${b - 82} C ${x + 3} ${b - 100} ${x + 13} ${b - 120} ${x + 5} ${b - 138} Z" fill="#5d5560" filter="url(#wash)"/>`);
  }
  // Bjørn
  {
    const x = 760;
    const b = sitY(x);
    F.push(part(ellipse(x, b - 44, 42, 46), '#d9a441'));
    F.push(part(ellipse(x - 24, b - 132, 11, 11), '#d29a3c'));
    F.push(part(ellipse(x + 24, b - 132, 11, 11), '#d29a3c'));
    F.push(part(ellipse(x, b - 108, 30, 29), '#dcaa48'));
  }
  // Gris
  {
    const x = 836;
    const b = sitY(x);
    F.push(part(ellipse(x, b - 28, 24, 30), '#f4bdb4'));
    F.push(part(`M${x - 14} ${b - 78} C ${x - 22} ${b - 92} ${x - 22} ${b - 104} ${x - 18} ${b - 110} C ${x - 10} ${b - 104} ${x - 4} ${b - 94} ${x - 4} ${b - 84} Z`, '#f1b2aa'));
    F.push(part(`M${x + 14} ${b - 78} C ${x + 22} ${b - 92} ${x + 22} ${b - 104} ${x + 18} ${b - 110} C ${x + 10} ${b - 104} ${x + 4} ${b - 94} ${x + 4} ${b - 84} Z`, '#f1b2aa'));
    F.push(part(ellipse(x, b - 70, 19, 19), '#f4bdb4'));
  }
  // Bjørnens arm rundt grisen
  {
    const b = sitY(790);
    F.push(part(`M786 ${b - 66} C 806 ${b - 76} 826 ${b - 70} 836 ${b - 58} C 840 ${b - 50} 832 ${b - 44} 824 ${b - 50} C 814 ${b - 58} 800 ${b - 58} 790 ${b - 52} Z`, '#d29a3c'));
  }
  // Tiger
  {
    const x = 912;
    const b = sitY(x);
    F.push(`<path d="M${x + 30} ${b - 12} C ${x + 60} ${b - 14} ${x + 66} ${b - 40} ${x + 58} ${b - 64} C ${x + 52} ${b - 80} ${x + 66} ${b - 92} ${x + 76} ${b - 84}" stroke="${INK}" stroke-width="13" stroke-linecap="round" fill="none" filter="url(#ink)"/><path d="M${x + 30} ${b - 12} C ${x + 60} ${b - 14} ${x + 66} ${b - 40} ${x + 58} ${b - 64} C ${x + 52} ${b - 80} ${x + 66} ${b - 92} ${x + 76} ${b - 84}" stroke="#e9963f" stroke-width="9" stroke-linecap="round" fill="none" filter="url(#wash)"/><path d="M${x + 30} ${b - 12} C ${x + 60} ${b - 14} ${x + 66} ${b - 40} ${x + 58} ${b - 64} C ${x + 52} ${b - 80} ${x + 66} ${b - 92} ${x + 76} ${b - 84}" stroke="#5b3520" stroke-width="9" stroke-dasharray="4 11" fill="none" filter="url(#ink)"/>`);
    F.push(part(ellipse(x, b - 42, 34, 44), '#e9963f'));
    F.push(`<path d="M${x - 30} ${b - 60} q 12 4 18 12 M${x - 33} ${b - 36} q 12 2 18 10 M${x + 30} ${b - 60} q -12 4 -18 12 M${x + 33} ${b - 36} q -12 2 -18 10 M${x - 8} ${b - 82} q 8 6 16 0" stroke="#5b3520" stroke-width="4" stroke-linecap="round" fill="none" filter="url(#ink)"/>`);
    F.push(part(ellipse(x - 19, b - 124, 9, 9), '#e48b38'));
    F.push(part(ellipse(x + 19, b - 124, 9, 9), '#e48b38'));
    F.push(part(ellipse(x, b - 104, 26, 25), '#ec9c44'));
    F.push(`<path d="M${x - 8} ${b - 126} l 2 10 M${x} ${b - 129} l 0 11 M${x + 8} ${b - 126} l -2 10" stroke="#5b3520" stroke-width="3.5" stroke-linecap="round" fill="none" filter="url(#ink)"/>`);
  }
  body += '  ' + F.join('\n  ') + '\n';
  body += '  ' + grassTufts(rand, (x) => crest(x) + 6, 560, 1060, 70, '#6b8248') + '\n';
  const flowers = [];
  for (let i = 0; i < 40; i++) {
    const x = r1(rand() * W);
    if (x > 600 && x < 1000) continue;
    const y = r1(crest(x) + 30 + rand() * 300);
    const s = 0.9 + rand() * 0.8;
    flowers.push(rand() < 0.5 ? daisy(x, y, s) : buttercup(x, y, s));
  }
  body += '  ' + flowers.join('\n  ') + '\n';
  return svg(W, H, body, 'Venner som ser solnedgangen fra en bakketopp.');
}

// ── Akvarellflekker bak bildene ─────────────────────────────────────────────────
function wash(color, seed, note) {
  const rand = rng(seed);
  let body = `  <g fill="${color}" opacity="0.55" filter="url(#wash-soft)">${blob(rand, 300, 300, 210, 9)}</g>\n`;
  body += `  <g fill="${color}" opacity="0.35" filter="url(#wash-soft)">${blob(rand, 330, 280, 140, 5)}</g>\n`;
  const dots = [];
  for (let i = 0; i < 14; i++) {
    const a = rand() * Math.PI * 2;
    const d = 230 + rand() * 50;
    dots.push(`<circle cx="${r1(300 + Math.cos(a) * d)}" cy="${r1(300 + Math.sin(a) * d)}" r="${r1(2 + rand() * 6)}"/>`);
  }
  body += `  <g fill="${color}" opacity="0.6" filter="url(#wash)">${dots.join('')}</g>\n`;
  return svg(600, 600, body, note);
}

const outputs = {
  'meadow-front.svg': meadow(),
  'hills-far.svg': hills(),
  'clouds.svg': clouds(),
  'tree-left.svg': tree({ seed: 11, mirror: false, beehive: false }),
  'tree-right.svg': tree({ seed: 23, mirror: true, beehive: true }),
  'closing-hill.svg': closingHill(),
  'wash-honey.svg': wash('#efbf55', 5, 'Honningfarget akvarellflekk.'),
  'wash-green.svg': wash('#9fba7e', 8, 'Grønn akvarellflekk.'),
};

for (const [file, content] of Object.entries(outputs)) {
  await writeFile(art(file), content);
  console.log(`✓ art/${file}`);
}
