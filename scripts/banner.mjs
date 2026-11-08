// Generates the animated NXDPRO profile banners (light/dark, desktop/phone).
// Usage: node scripts/banner.mjs assets/nxdpro-logo.jpg assets
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const [logoPath, outDir] = process.argv.slice(2);
if (!logoPath || !outDir) { console.error('usage: node banner.mjs <logo.jpg> <out dir>'); process.exit(2); }
mkdirSync(outDir, { recursive: true });
const logo = 'data:image/jpeg;base64,' + readFileSync(logoPath).toString('base64');

const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const THEMES = {
  dark: {
    bg0: '#0b1220', bg1: '#13234a', grid: '#ffffff', gridOp: 0.045, border: '#22314f',
    title: '#ffffff', sub: '#93a4c3', head: '#e6ecf7', muted: '#93a4c3',
    chipBg: '#16233f', chipStroke: '#2a3b5f', chipText: '#dbe4f3', ok: '#34d399',
    blob1: '#3b82f6', blob1Op: 0.10, blob2: '#22d3ee', blob2Op: 0.07, halo: '#22d3ee', haloOp: 0.28,
    ring: '#3b82f6', beatBase: '#93a4c3', beatBaseOp: 0.16,
  },
  light: {
    bg0: '#ffffff', bg1: '#eef3ff', grid: '#1f3a6e', gridOp: 0.05, border: '#dde3ef',
    title: '#0b1220', sub: '#51607a', head: '#1b2a44', muted: '#51607a',
    chipBg: '#ffffff', chipStroke: '#d5ddec', chipText: '#1b2a44', ok: '#16a34a',
    blob1: '#1f5eff', blob1Op: 0.07, blob2: '#22d3ee', blob2Op: 0.08, halo: '#1f5eff', haloOp: 0.20,
    ring: '#1f5eff', beatBase: '#1f3a6e', beatBaseOp: 0.12,
  },
};

const CHIPS = ['Websites', 'E-shops', 'Business systems', 'Care & security'];
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
// Generous width estimate for 17px semibold system fonts, so no font overflows the chip.
const chipWidth = (label, fs = 17) => Math.round(label.length * fs * 0.6 + fs * 3.06);

function style(t) {
  return `<style>
    .in { animation: rise .7s cubic-bezier(.2,.7,.2,1) both; }
    .d1 { animation-delay: .05s } .d2 { animation-delay: .2s } .d3 { animation-delay: .35s }
    .d4 { animation-delay: .5s } .d5 { animation-delay: .65s } .d6 { animation-delay: .8s }
    .d7 { animation-delay: .95s } .d8 { animation-delay: 1.1s } .d9 { animation-delay: 1.25s }
    @keyframes rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
    .bar { transform-box: fill-box; transform-origin: left center; animation: grow 1s cubic-bezier(.2,.7,.2,1) .35s both; }
    @keyframes grow { from { transform: scaleX(0) } to { transform: scaleX(1) } }
    .dot { animation: blink 3.2s ease-in-out infinite; }
    .s1 { animation-delay: 1.6s } .s2 { animation-delay: 2.4s } .s3 { animation-delay: 3.2s } .s4 { animation-delay: 4s }
    @keyframes blink { 0%, 70%, 100% { opacity: 1 } 80% { opacity: .25 } }
    .halo { transform-box: fill-box; transform-origin: center; animation: breathe 4.5s ease-in-out infinite; }
    @keyframes breathe { 0%, 100% { opacity: .75; transform: scale(.97) } 50% { opacity: 1; transform: scale(1.04) } }
    .orbit { transform-box: view-box; animation: spin 48s linear infinite; }
    .sat { transform-box: view-box; animation: spin 9s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg) } }
    .beat { stroke-dasharray: 220 2600; animation: run 7s linear infinite; }
    @keyframes run { from { stroke-dashoffset: 2820 } to { stroke-dashoffset: 0 } }
    @media (prefers-reduced-motion: reduce) {
      .in, .bar, .dot, .halo, .orbit, .sat { animation: none !important; }
      .beat { display: none; }
    }
  </style>`;
}

function defs(t, w, h, logoCx, logoCy, r) {
  return `<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.bg0}"/><stop offset="1" stop-color="${t.bg1}"/></linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1f5eff"/><stop offset="1" stop-color="#22d3ee"/></linearGradient>
    <linearGradient id="beatGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#22d3ee" stop-opacity="0"/><stop offset=".5" stop-color="#3b82f6"/><stop offset="1" stop-color="#22d3ee"/></linearGradient>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="${t.grid}" stroke-opacity="${t.gridOp}"/></pattern>
    <radialGradient id="halo" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="${t.halo}" stop-opacity="${t.haloOp}"/><stop offset="1" stop-color="${t.halo}" stop-opacity="0"/></radialGradient>
    <clipPath id="card"><rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="18"/></clipPath>
    <clipPath id="logo"><circle cx="${logoCx}" cy="${logoCy}" r="${r}"/></clipPath>
  </defs>`;
}

function logoBlock(t, cx, cy, r) {
  const ring = r + 26;
  return `<g class="in d2">
      <circle class="halo" cx="${cx}" cy="${cy}" r="${r + 48}" fill="url(#halo)"/>
      <g class="orbit" style="transform-origin:${cx}px ${cy}px"><circle cx="${cx}" cy="${cy}" r="${ring}" fill="none" stroke="${t.ring}" stroke-opacity=".35" stroke-width="1.5" stroke-dasharray="2 9"/></g>
      <g class="sat" style="transform-origin:${cx}px ${cy}px"><circle cx="${cx}" cy="${cy - ring}" r="4" fill="#22d3ee"/></g>
      <image x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" clip-path="url(#logo)" preserveAspectRatio="xMidYMid slice" href="${logo}"/>
    </g>`;
}

// ECG-like line along the bottom: flat, with spikes only at the given x positions.
function beatPath(w, y, spikes) {
  let d = `M0 ${y}`;
  for (const x of spikes) d += ` H${x - 18} l6 -6 l6 12 l6 -26 l6 30 l6 -10 l6 0`;
  return d + ` H${w}`;
}

function chips(t, x0, y, labels, gap, cls, fs = 17) {
  let x = x0, out = '';
  const h = Math.round(fs * 2), k = fs / 17;
  labels.forEach((label, i) => {
    const w = chipWidth(label, fs);
    out += `<g class="in ${cls[i]}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${t.chipBg}" stroke="${t.chipStroke}"/>`
      + `<circle class="dot s${i + 1}" cx="${x + Math.round(19 * k)}" cy="${y + h / 2}" r="${Math.round(5 * k)}" fill="${t.ok}"/>`
      + `<text x="${x + Math.round(32 * k)}" y="${y + h / 2 + fs * 0.35}" font-size="${fs}" font-weight="600" fill="${t.chipText}">${esc(label)}</text></g>`;
    x += w + gap;
  });
  return { svg: out, end: x - gap };
}

const ARIA = 'NXDPRO Solutions: websites, e-shops and custom business systems that keep working. Limassol, Cyprus, serving Cyprus and Greece since 2003.';

function desktop(t) {
  const W = 1280, H = 340, cx = 1085, cy = 160, r = 100;
  const c = chips(t, 72, 236, CHIPS, 12, ['d5', 'd6', 'd7', 'd8']);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${ARIA}">
  <title>${ARIA}</title>
  ${style(t)}
  ${defs(t, W, H, cx, cy, r)}
  <g clip-path="url(#card)">
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#grid)"/>
    <circle cx="1120" cy="60" r="190" fill="${t.blob1}" fill-opacity="${t.blob1Op}"/>
    <circle cx="1200" cy="290" r="130" fill="${t.blob2}" fill-opacity="${t.blob2Op}"/>
    ${logoBlock(t, cx, cy, r)}
    <path d="${beatPath(W, 322, [760, 1010, 1210])}" fill="none" stroke="${t.beatBase}" stroke-opacity="${t.beatBaseOp}" stroke-width="2" stroke-linejoin="round"/>
    <path class="beat" d="${beatPath(W, 322, [760, 1010, 1210])}" fill="none" stroke="url(#beatGrad)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
  </g>
  <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="18" fill="none" stroke="${t.border}"/>
  <g font-family="${FONT}">
    <text class="in d1" x="72" y="104" fill="${t.title}" font-size="62" font-weight="800" letter-spacing="2">NXDPRO<tspan dx="18" fill="${t.sub}" font-size="30" font-weight="500" letter-spacing="0">Solutions</tspan></text>
    <rect class="bar" x="72" y="124" width="120" height="5" rx="2.5" fill="url(#accent)"/>
    <text class="in d3" x="72" y="178" fill="${t.head}" font-size="30" font-weight="650">Websites, e-shops &amp; custom business systems</text>
    <text class="in d4" x="72" y="216" fill="${t.head}" font-size="30" font-weight="650">that keep working.</text>
    ${c.svg}
    <text class="in d9" x="72" y="302" fill="${t.muted}" font-size="19">Limassol, Cyprus · serving Cyprus &amp; Greece since 2003</text>
  </g>
</svg>
`;
}

function mobile(t) {
  const W = 720, H = 720, cx = 360, cy = 140, r = 88;
  // Two rows of two chips, each row centred.
  const row = (labels, y, cls) => {
    const total = labels.reduce((s, l) => s + chipWidth(l, 22), 0) + 14 * (labels.length - 1);
    return chips(t, Math.round((W - total) / 2), y, labels, 14, cls, 22).svg;
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${ARIA}">
  <title>${ARIA}</title>
  ${style(t)}
  ${defs(t, W, H, cx, cy, r)}
  <g clip-path="url(#card)">
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#grid)"/>
    <circle cx="600" cy="40" r="170" fill="${t.blob1}" fill-opacity="${t.blob1Op}"/>
    <circle cx="80" cy="620" r="150" fill="${t.blob2}" fill-opacity="${t.blob2Op}"/>
    ${logoBlock(t, cx, cy, r)}
    <path d="${beatPath(W, 690, [150, 420, 600])}" fill="none" stroke="${t.beatBase}" stroke-opacity="${t.beatBaseOp}" stroke-width="2" stroke-linejoin="round"/>
    <path class="beat" d="${beatPath(W, 690, [150, 420, 600])}" fill="none" stroke="url(#beatGrad)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
  </g>
  <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="18" fill="none" stroke="${t.border}"/>
  <g font-family="${FONT}" text-anchor="middle">
    <text class="in d1" x="${W / 2}" y="318" fill="${t.title}" font-size="58" font-weight="800" letter-spacing="2">NXDPRO<tspan dx="14" fill="${t.sub}" font-size="28" font-weight="500" letter-spacing="0">Solutions</tspan></text>
    <rect class="bar" x="${W / 2 - 60}" y="336" width="120" height="5" rx="2.5" fill="url(#accent)"/>
    <text class="in d3" x="${W / 2}" y="392" fill="${t.head}" font-size="32" font-weight="650">Websites, e-shops &amp;</text>
    <text class="in d3" x="${W / 2}" y="432" fill="${t.head}" font-size="32" font-weight="650">custom business systems</text>
    <text class="in d4" x="${W / 2}" y="472" fill="${t.head}" font-size="32" font-weight="650">that keep working.</text>
  </g>
  <g font-family="${FONT}">
    ${row(CHIPS.slice(0, 2), 504, ['d5', 'd6'])}
    ${row(CHIPS.slice(2), 562, ['d7', 'd8'])}
  </g>
  <text class="in d9" x="${W / 2}" y="642" text-anchor="middle" font-family="${FONT}" fill="${t.muted}" font-size="24">Limassol, Cyprus · since 2003</text>
</svg>
`;
}

for (const [name, t] of Object.entries(THEMES)) {
  writeFileSync(path.join(outDir, `banner-${name}.svg`), desktop(t));
  writeFileSync(path.join(outDir, `banner-mobile-${name}.svg`), mobile(t));
}
console.log('written to', outDir);
