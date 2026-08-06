/**
 * Captura UNA sección de una ruta, a un ancho dado, para MIRARLA.
 *
 * Los otros scripts de esta carpeta miden (contraste, borde del texto,
 * desborde, rutas). Este no mide nada: existe porque medir no es ver. Una
 * sección puede pasar las cuatro mediciones y aun así tener el pie de foto
 * encima de una imagen, un recorte partido o un ícono que se lee al revés.
 *
 * Requiere el preview corriendo.
 * Uso: BASE=http://localhost:4318 node scripts/ver-seccion.mjs /eficore/ ".shots" 390 salida.png
 */
import puppeteer from "puppeteer-core";

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.BASE || "http://localhost:4318";
const [ruta, selector, ancho, salida] = process.argv.slice(2);
if (!salida) {
  console.error('uso: node scripts/ver-seccion.mjs /ruta/ ".selector" <ancho> salida.png');
  process.exit(2);
}

const nav = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
const pag = await nav.newPage();
await pag.setViewport({ width: Number(ancho), height: 1000, deviceScaleFactor: 1.4 });
await pag.goto(BASE + ruta, { waitUntil: "networkidle2" });

/* Los reveals de estas páginas arrancan en opacity .3 y suben con el scroll.
   Sin bajar hasta el elemento, la captura sale a media opacidad y parece un
   defecto de diseño que no existe. */
await pag.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: "center" }), selector);
await new Promise((r) => setTimeout(r, 900));

const el = await pag.$(selector);
if (!el) { console.error(`no existe ${selector} en ${ruta}`); await nav.close(); process.exit(1); }
await el.screenshot({ path: salida });
await nav.close();
console.log(`[OK] ${salida}  (${ruta} · ${selector} · ${ancho}px)`);
