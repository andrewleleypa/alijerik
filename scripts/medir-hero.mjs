/**
 * medir-hero.mjs — mide el contraste del texto del HERO de /eficore/.
 *
 * POR QUE EXISTE UNO APARTE. El medidor general (formula-antislop) tiene un punto
 * ciego documentado: no puede muestrear el fondo de un `position:fixed` en captura
 * `fullPage`. Chrome pinta los fixed una sola vez y no en la coordenada de documento
 * donde el texto parece estar. Todo el texto del hero de /eficore/ vive en
 * `.stage-text{position:fixed}` sobre un canvas que anima GSAP por scroll, asi que
 * ahi el medidor general reporta numeros que no corresponden a lo que se ve.
 *
 * COMO LO RESUELVE ESTE:
 *   1. SCROLLEA hasta el punto donde la timeline de GSAP pone visible el bloque que
 *      se quiere medir. Forzar la opacidad a mano no sirve: la timeline lo pisa en el
 *      siguiente frame.
 *   2. Captura de VIEWPORT, no fullPage. Ahi los fixed se pintan donde de verdad estan.
 *   3. Esconde la tinta y vuelve a capturar para leer el fondo real detras de cada
 *      frase — velo incluido, que es justo lo que el medidor general no veia.
 *
 * Uso:  npx vite preview --port 4318 &
 *       node scripts/medir-hero.mjs [id-del-bloque]      (default: t4)
 *
 * Salidas: 0 = sin hallazgos · 1 = hay fallos · 2 = no pudo medir · 3 = error
 */

import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import path from "node:path";

const BASE = process.env.BASE || "http://localhost:4318";
const RUTA = process.env.RUTA || "/eficore/";
const BLOQUE = process.argv[2] || "t4";

const CHROMES = [
  process.env.CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
].filter(Boolean);

const req = createRequire(path.join(process.cwd(), "package.json"));
const puppeteer = req("puppeteer-core");
const chrome = CHROMES.find((p) => existsSync(p));
if (!chrome) {
  console.error("⛔ No encuentro Chrome.");
  process.exit(3);
}

const canal = (v) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const lum = ([r, g, b]) => 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const parseRgb = (s) => {
  const m = String(s).match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(",").map((x) => parseFloat(x.trim()));
  return { rgb: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 };
};
const sobre = (f, fa, b) => f.map((c, i) => fa * c + (1 - fa) * b[i]);
const hex = (c) => "#" + c.map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");
const esGrande = (px, peso) => px >= 24 || (px >= 18.66 && Number(peso) >= 700);

// ── Autoprueba: el medidor necesita su propia prueba ─────────────────────────
{
  const casos = [
    [[0, 0, 0], [255, 255, 255], 21],
    [[119, 119, 119], [255, 255, 255], 4.48],
    [[255, 255, 255], [255, 255, 255], 1],
  ];
  let malos = 0;
  for (const [a, b, esp] of casos) {
    if (Math.abs(ratio(a, b) - esp) > 0.01) malos++;
  }
  if (malos) {
    console.error("⛔ EL MEDIDOR MIENTE: la autoprueba de contraste fallo. No mido nada.");
    process.exit(3);
  }
}

const nav = await puppeteer.launch({ executablePath: chrome, headless: "new" });
const p = await nav.newPage();
await p.setViewport({ width: 1280, height: 860, deviceScaleFactor: 1 });
await p.goto(new URL(RUTA, BASE).href, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 1500));

// ── 1. Buscar el punto de scroll donde la timeline hace visible el bloque ────
const alto = await p.evaluate(() => document.documentElement.scrollHeight);
let mejor = { y: 0, op: 0 };
for (let i = 0; i <= 40; i++) {
  const y = Math.round((alto * 0.55 * i) / 40);
  await p.evaluate((y) => window.scrollTo(0, y), y);
  await new Promise((r) => setTimeout(r, 110));
  const op = await p.evaluate((id) => {
    const t = document.getElementById(id);
    return t ? parseFloat(getComputedStyle(t).opacity) : 0;
  }, BLOQUE);
  if (op > mejor.op) mejor = { y, op };
}

if (mejor.op < 0.9) {
  console.error(
    `⛔ NO PUDO MEDIR: #${BLOQUE} nunca llego a opacidad 0.9 (maximo ${mejor.op.toFixed(2)}).\n` +
      "   Esto NO es 'sin hallazgos'.",
  );
  await nav.close();
  process.exit(2);
}

await p.evaluate((y) => window.scrollTo(0, y), mejor.y);
await new Promise((r) => setTimeout(r, 700));

// ── 2. Censar las frases del bloque con su caja REAL ─────────────────────────
const items = await p.evaluate((id) => {
  const raiz = document.getElementById(id);
  if (!raiz) return [];
  const out = [];
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const txt = n.nodeValue.replace(/\s+/g, " ").trim();
    if (!txt) continue;
    const el = n.parentElement;
    const r = document.createRange();
    r.selectNodeContents(n);
    const c = r.getBoundingClientRect();
    if (c.width < 2 || c.height < 2) continue;
    const cs = getComputedStyle(el);
    out.push({
      sel: el.tagName.toLowerCase() + (el.className ? "." + String(el.className).split(/\s+/)[0] : ""),
      muestra: txt.slice(0, 42),
      tinta: cs.color,
      px: parseFloat(cs.fontSize),
      peso: cs.fontWeight,
      x: c.left, y: c.top, w: c.width, h: c.height,
    });
  }
  return out;
}, BLOQUE);

if (!items.length) {
  console.error(`⛔ NO PUDO MEDIR: cero frases visibles en #${BLOQUE}.`);
  await nav.close();
  process.exit(2);
}

// ── 3. Esconder SOLO la tinta y leer el pixel de atras (velo incluido) ───────
await p.evaluate(() => {
  const s = document.createElement("style");
  s.textContent =
    "*,*::before,*::after{color:transparent!important;text-shadow:none!important;" +
    "-webkit-text-fill-color:transparent!important}text,tspan{fill:transparent!important}";
  document.head.appendChild(s);
});
await new Promise((r) => setTimeout(r, 220));

const png = await p.screenshot({ encoding: "base64", fullPage: false });
const conFondo = await p.evaluate(async (datos, items) => {
  const img = new Image();
  await new Promise((ok) => { img.onload = ok; img.src = "data:image/png;base64," + datos; });
  const cv = document.createElement("canvas");
  cv.width = img.naturalWidth; cv.height = img.naturalHeight;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  return items.map((it) => {
    const x0 = Math.max(0, Math.round(it.x + 1));
    const y0 = Math.max(0, Math.round(it.y + 1));
    const w = Math.max(1, Math.min(Math.round(it.w - 2), cv.width - x0));
    const h = Math.max(1, Math.min(Math.round(it.h - 2), cv.height - y0));
    const d = ctx.getImageData(x0, y0, w, h).data;
    const pts = [];
    const px = Math.max(1, Math.floor(w / 16));
    const py = Math.max(1, Math.floor(h / 6));
    for (let yy = 0; yy < h; yy += py)
      for (let xx = 0; xx < w; xx += px) {
        const i = (yy * w + xx) * 4;
        pts.push([d[i], d[i + 1], d[i + 2]]);
      }
    return { ...it, pts };
  });
}, png, items);

await nav.close();

// ── Informe ──────────────────────────────────────────────────────────────────
console.log("═".repeat(74));
console.log(`HERO ${RUTA}  ·  bloque #${BLOQUE}  ·  scrollY=${mejor.y}  opacidad=${mejor.op.toFixed(2)}`);
console.log("═".repeat(74));

let fallos = 0;
for (const it of conFondo) {
  const t = parseRgb(it.tinta);
  if (!t) { console.log(`  ? ${it.sel}: tinta no reconocida (${it.tinta})`); continue; }
  // Sobre un fondo que varia, MANDA EL PEOR PUNTO.
  let peor = null;
  for (const f of it.pts) {
    const tin = t.a < 1 ? sobre(t.rgb, t.a, f) : t.rgb;
    const r = ratio(tin, f);
    if (!peor || r < peor.r) peor = { r, f, tin };
  }
  const umbral = esGrande(it.px, it.peso) ? 3.0 : 4.5;
  const ok = peor.r >= umbral;
  if (!ok) fallos++;
  console.log(
    `  ${ok ? "✓" : "✗"} ${String(Math.round(peor.r * 100) / 100).padStart(6)}:1 (min ${umbral})  ` +
      `${hex(peor.tin)} sobre ${hex(peor.f)}  ${Math.round(it.px)}px/${it.peso}`,
  );
  console.log(`      ${it.sel}  «${it.muestra}»`);
}

console.log("═".repeat(74));
console.log(`${conFondo.length} frases medidas · ${fallos} fallan`);
console.log(
  "\nEl fondo se lee del PIXEL RENDERIZADO con el velo puesto, en captura de viewport.\n" +
    "Por eso este medidor si ve el velo y el general no.",
);
process.exit(fallos > 0 ? 1 : 0);
