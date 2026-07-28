/**
 * Verifica el sitio construido: todas las rutas, no solo la nueva.
 *
 * Comprueba por ruta y por ancho:
 *   - responde 200
 *   - NO desborda horizontalmente (el error que ya costo tiempo dos veces)
 *   - el contenido es visible sin scroll (ningun elemento en opacity:0,
 *     que es lo que rompe la indexacion y las capturas)
 *   - hay <h1> unico y meta description
 *
 * Requiere el preview corriendo:  npx vite preview --port 4318 --strictPort
 * Uso: node scripts/verificar-rutas.mjs
 */
import puppeteer from "puppeteer-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.BASE || "http://localhost:4318";

const RUTAS = [
  "/", "/tarjetas/", "/jc/", "/eficore/", "/eficore/alternativa-panamena/",
  "/eficore/ley-81/", "/privacidad/", "/condiciones/", "/eliminacion-de-datos/",
];
const ANCHOS = [1440, 390];

const navegador = await puppeteer.launch({
  executablePath: CHROME, headless: "new", args: ["--no-sandbox"],
});

let problemas = 0;
const filas = [];

for (const ruta of RUTAS) {
  for (const ancho of ANCHOS) {
    const pagina = await navegador.newPage();
    // Sin cache: si no, la segunda visita a la misma ruta responde 304 y
    // parece un fallo cuando no lo es.
    await pagina.setCacheEnabled(false);
    await pagina.setViewport({ width: ancho, height: 900, deviceScaleFactor: 1 });
    const resp = await pagina.goto(BASE + ruta, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 700));

    const d = await pagina.evaluate(() => {
      const de = document.documentElement;
      // Elementos de contenido invisibles: matan indexacion y capturas.
      const ocultos = [...document.querySelectorAll("main *,section *,h1,h2,p")]
        .filter((el) => {
          const s = getComputedStyle(el);
          return parseFloat(s.opacity) === 0 && el.textContent.trim().length > 12;
        });
      return {
        desborde: de.scrollWidth - de.clientWidth,
        h1: document.querySelectorAll("h1").length,
        desc: (document.querySelector('meta[name="description"]')?.content || "").length,
        invisibles: ocultos.length,
        queOcultos: ocultos.slice(0, 4).map((e) => e.tagName + ": " + e.textContent.trim().slice(0, 46)),
      };
    });

    const estado = resp.status();
    const malo = estado >= 400 || d.desborde > 0 || d.invisibles > 0 || d.h1 !== 1;
    if (malo) problemas++;

    filas.push({ ruta, ancho, estado, ...d, ok: !malo });
    await pagina.close();
  }
}

await navegador.close();

const w = Math.max(...filas.map((f) => f.ruta.length));
console.log("\n  RUTA".padEnd(w + 4) + " ANCHO  HTTP  DESBORDE  H1  DESC  OCULTOS");
console.log("  " + "-".repeat(w + 44));
for (const f of filas) {
  console.log(
    "  " + f.ruta.padEnd(w + 2) +
    String(f.ancho).padStart(5) + "  " + String(f.estado).padStart(4) + "  " +
    String(f.desborde + "px").padStart(8) + "  " + String(f.h1).padStart(2) + "  " +
    String(f.desc).padStart(4) + "  " + String(f.invisibles).padStart(7) +
    (f.ok ? "" : "   <-- REVISAR")
  );
  if (f.queOcultos?.length) for (const q of f.queOcultos) console.log("        oculto -> " + q);
}
console.log(
  problemas === 0
    ? "\n  Todas las rutas OK: sin desborde, sin contenido oculto, un solo h1.\n"
    : `\n  ${problemas} caso(s) con problema.\n`
);
process.exit(problemas === 0 ? 0 : 1);
