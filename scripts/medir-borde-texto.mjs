/**
 * Mide el borde IZQUIERDO REAL del texto a 390px, con `Range` y no con la caja.
 * `getBoundingClientRect()` de un elemento incluye su propio padding: un pie de
 * foto con padding-left:20px reporta left:0 aunque su texto empiece en 20.
  * Uso: MSYS_NO_PATHCONV=1 node scripts/medir-borde-texto.mjs /ruta/ [/ruta/...]
 * (el MSYS_NO_PATHCONV es obligatorio en Git Bash: sin el, convierte /ruta/ en
 * una ruta de Windows y puppeteer falla con "Cannot navigate to invalid URL")
 */
import puppeteer from "puppeteer-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.BASE || "http://localhost:4318";
const rutas = process.argv.slice(2);
const MIN = 20;

const nav = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
let fallos = 0;

for (const ruta of rutas) {
  const pag = await nav.newPage();
  await pag.setViewport({ width: 390, height: 900 });
  await pag.goto(BASE + ruta, { waitUntil: "networkidle2" });

  const r = await pag.evaluate(() => {
    const sel = "p,h1,h2,h3,li,td,th,summary,code,.eyebrow,.frase,.pie,.veredicto";
    let peor = { x: Infinity, txt: "", tag: "" };
    for (const el of document.querySelectorAll(sel)) {
      if (!el.textContent.trim()) continue;
      if (el.closest("svg")) continue;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      const rg = document.createRange();
      rg.selectNodeContents(el);
      const caja = rg.getBoundingClientRect();
      if (caja.width === 0 || caja.height === 0) continue;
      if (caja.left < peor.x) {
        peor = { x: Math.round(caja.left * 10) / 10, txt: el.textContent.trim().slice(0, 46), tag: el.tagName.toLowerCase() };
      }
    }
    return peor;
  });

  const ok = r.x >= MIN;
  if (!ok) fallos++;
  console.log(`${ok ? "OK  " : "MAL "} ${ruta.padEnd(32)} borde izq real: ${String(r.x).padStart(6)}px  <${r.tag}> "${r.txt}"`);
  await pag.close();
}

await nav.close();
console.log(fallos ? `\n${fallos} ruta(s) por debajo de ${MIN}px.` : `\nTodas por encima de ${MIN}px.`);
process.exit(fallos ? 1 : 0);
