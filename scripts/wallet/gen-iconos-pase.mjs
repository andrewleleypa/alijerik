/**
 * gen-iconos-pase.mjs — rasteriza la marca a los PNG que exige cada wallet.
 *
 * DE DÓNDE SALE LA MARCA. Del propio `jc/index.html`, extrayendo el <svg> por su
 * `aria-label`. No hay una copia del SVG en esta carpeta a propósito: una copia diverge
 * en silencio el día que alguien retoque la marca en la página. Mismo principio que los
 * colores en tarjetas.json — el script lee la fuente, nadie transcribe.
 *
 * QUÉ GENERA, Y POR QUÉ CADA UNO:
 *   Apple  icon.png / @2x / @3x  (29/58/87)  → OBLIGATORIO. Sin icon.png el pase NO se
 *                                              agrega, falla en silencio. Fondo
 *                                              transparente: aparece en la pantalla de
 *                                              bloqueo, sobre superficies del sistema.
 *   Apple  logo.png / @2x / @3x  (50/100/150 de alto) → arriba a la izquierda del pase.
 *                                              Solo la marca; el texto "ALIJERIK" lo pone
 *                                              `logoText` en pass.json, no la imagen.
 *   Google logo-google.png       (660×660)   → Google descarga la imagen desde una URL
 *                                              PÚBLICA; no se sube. Por eso va a public/.
 *                                              Con fondo void, porque Google la compone
 *                                              sobre el lienzo del pase.
 *
 * Uso:  node scripts/wallet/gen-iconos-pase.mjs
 * Códigos de salida: 0 = ok · 2 = no pudo generar · 3 = error de entorno
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "..", "..");
const SALIDA_APPLE = path.join(AQUI, "assets");           // se empaquetan dentro del .pkpass
const SALIDA_PUBLICA = path.join(RAIZ, "public", "wallet"); // Google las descarga por URL

const VOID = "#05060a";

// ── Chrome / puppeteer-core, igual que el resto de los medidores del repo ────
const CHROMES = [
  process.env.CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

function cargarPuppeteer() {
  const req = createRequire(path.join(RAIZ, "package.json"));
  try {
    return req("puppeteer-core");
  } catch {
    console.error("✖ Falta `puppeteer-core`. Instalalo con:  npm i -D puppeteer-core");
    process.exit(3);
  }
}

// ── Extraer la marca de la página, no de una copia ───────────────────────────
function marcaDesdeLaPagina() {
  const html = readFileSync(path.join(RAIZ, "jc", "index.html"), "utf8");
  // El <svg> de la marca es el único con aria-label="Alijerik".
  const m = html.match(/<svg\b[^>]*aria-label="Alijerik"[\s\S]*?<\/svg>/i);
  if (!m) {
    console.error(
      '⛔ No encontré el <svg aria-label="Alijerik"> en jc/index.html.\n' +
        "   Si la marca cambió de nombre o de archivo, este script hay que ajustarlo —\n" +
        "   NO generar íconos con una marca vieja escondida en otro lado.",
    );
    process.exit(2);
  }
  return m[0];
}

const piezas = [
  // Apple: icon (obligatorio) y logo. Cuadrados, fondo transparente.
  { archivo: "icon.png",     w: 29,  h: 29,  fondo: null, destino: "apple" },
  { archivo: "icon@2x.png",  w: 58,  h: 58,  fondo: null, destino: "apple" },
  { archivo: "icon@3x.png",  w: 87,  h: 87,  fondo: null, destino: "apple" },
  { archivo: "logo.png",     w: 50,  h: 50,  fondo: null, destino: "apple" },
  { archivo: "logo@2x.png",  w: 100, h: 100, fondo: null, destino: "apple" },
  { archivo: "logo@3x.png",  w: 150, h: 150, fondo: null, destino: "apple" },
  // Google: una sola, grande y pública. Con fondo, porque se compone sobre el pase.
  { archivo: "alijerik-wallet-logo.png", w: 660, h: 660, fondo: VOID, destino: "publico" },
];

const svg = marcaDesdeLaPagina();
const puppeteer = cargarPuppeteer();
const chrome = CHROMES.find((p) => existsSync(p));
if (!chrome) {
  console.error("✖ No encuentro Chrome. Pasá la ruta con CHROME=/ruta/al/chrome");
  process.exit(3);
}

mkdirSync(SALIDA_APPLE, { recursive: true });
mkdirSync(SALIDA_PUBLICA, { recursive: true });

const navegador = await puppeteer.launch({ executablePath: chrome, headless: "new" });
const pagina = await navegador.newPage();
let generados = 0;

for (const p of piezas) {
  // Margen del 8% para que el trazo exterior no quede pegado al borde del PNG.
  const html = `<!doctype html><meta charset="utf-8">
<style>
  html,body{margin:0;padding:0;width:${p.w}px;height:${p.h}px;
    background:${p.fondo || "transparent"};display:grid;place-items:center}
  svg{width:${Math.round(p.w * 0.84)}px;height:${Math.round(p.h * 0.84)}px;display:block}
</style>${svg}`;

  await pagina.setViewport({ width: p.w, height: p.h, deviceScaleFactor: 1 });
  await pagina.setContent(html, { waitUntil: "load" });

  const destino =
    p.destino === "apple"
      ? path.join(SALIDA_APPLE, p.archivo)
      : path.join(SALIDA_PUBLICA, p.archivo);

  const png = await pagina.screenshot({
    omitBackground: !p.fondo,
    type: "png",
    clip: { x: 0, y: 0, width: p.w, height: p.h },
  });
  writeFileSync(destino, png);

  // Verificar que se escribió algo real. Un PNG de 0 bytes es un fallo silencioso.
  const bytes = statSync(destino).size;
  if (bytes < 100) {
    console.error(`⛔ ${p.archivo} salió de ${bytes} bytes — eso no es una imagen.`);
    await navegador.close();
    process.exit(2);
  }
  console.log(`  ✓ ${p.archivo.padEnd(28)} ${p.w}×${p.h}  ${String(bytes).padStart(6)} B  ${p.fondo ? "fondo " + p.fondo : "transparente"}`);
  generados++;
}

await navegador.close();

if (generados !== piezas.length) {
  console.error("⛔ Faltaron piezas. Esto NO es 'listo'.");
  process.exit(2);
}

console.log(`\n✅ ${generados} imágenes generadas`);
console.log(`   Apple  → ${path.relative(RAIZ, SALIDA_APPLE)}  (se empaquetan dentro del .pkpass)`);
console.log(`   Google → ${path.relative(RAIZ, SALIDA_PUBLICA)}  (Google las DESCARGA por URL; tienen que estar publicadas)`);
