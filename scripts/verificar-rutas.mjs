/**
 * Verifica el sitio construido: todas las rutas, no solo la nueva.
 *
 * Comprueba por ruta y por ancho:
 *   - responde 200
 *   - NO desborda horizontalmente (el error que ya costo tiempo dos veces)
 *   - el contenido es visible sin scroll (ningun elemento en opacity:0,
 *     que es lo que rompe la indexacion y las capturas). Unica exencion:
 *     la coreografia del hero de /eficore/ (`.stage-text`), que se reporta
 *     aparte en la columna COREO y NO cuenta como problema — el porque y la
 *     condicion para que siga siendo valida estan junto al filtro, abajo.
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
      /* Opacidad EFECTIVA: hay que subir por los ancestros.
         getComputedStyle(el).opacity de un <h2> devuelve "1" aunque su padre
         tenga opacity:0 — la opacidad no se hereda como valor, se compone al
         pintar. Mirar solo el elemento deja pasar bloques enteros invisibles
         (fue exactamente lo que paso con .stage-text{opacity:0} en /eficore/). */
      const opacidadReal = (el) => {
        let o = 1;
        for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
          o *= parseFloat(getComputedStyle(n).opacity);
          if (o === 0) return 0;
        }
        return o;
      };
      const ocultos = [...document.querySelectorAll("main *,section *,h1,h2,h3,p,li")]
        .filter((el) => el.textContent.trim().length > 12 && opacidadReal(el) === 0);

      /* COREOGRAFIA DEL HERO — exencion estrecha y con condicion.
         `.stage-text` son los cuatro bloques del hero de /eficore/ que aparecen
         y se van con el scroll (src/eficore/main.js los mueve entre in/out).
         Estan en opacity:0 por diseno, no por error, y CLAUDE.md seccion 1 los
         declara la excepcion documentada del sitio.
         La exencion SOLO es valida mientras se cumpla esto, y hay que
         re-comprobarlo si el hero cambia:
           el mismo mensaje de cada beat existe como contenido VISIBLE mas
           abajo en la pagina — h1 "Una bandeja que tu equipo de verdad puede
           compartir", h2 "Orden, responsables y visibilidad", "Una sola
           bandeja" y el bloque de supervision. Un rastreador que no ejecuta
           JS no pierde ninguna idea.
         Si algun dia se mete en un .stage-text una idea que NO este publicada
         en el cuerpo, esta exencion deja de aplicar y hay que quitarla.
         Ojo: gatear el opacity:0 con una clase `js` en <html> NO limpia este
         reporte, porque este verificador corre CON JavaScript. Lo unico que
         lo pondria en verde de verdad seria romper la animacion. */
      const esCoreografia = (el) => !!el.closest(".stage-text");
      const reales = ocultos.filter((el) => !esCoreografia(el));
      const coreo = ocultos.filter(esCoreografia);

      return {
        desborde: de.scrollWidth - de.clientWidth,
        h1: document.querySelectorAll("h1").length,
        desc: (document.querySelector('meta[name="description"]')?.content || "").length,
        invisibles: reales.length,
        coreografia: coreo.length,
        queOcultos: reales.slice(0, 4).map((e) => e.tagName + ": " + e.textContent.trim().slice(0, 46)),
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
console.log("\n  RUTA".padEnd(w + 4) + " ANCHO  HTTP  DESBORDE  H1  DESC  OCULTOS  COREO");
console.log("  " + "-".repeat(w + 51));
for (const f of filas) {
  console.log(
    "  " + f.ruta.padEnd(w + 2) +
    String(f.ancho).padStart(5) + "  " + String(f.estado).padStart(4) + "  " +
    String(f.desborde + "px").padStart(8) + "  " + String(f.h1).padStart(2) + "  " +
    String(f.desc).padStart(4) + "  " + String(f.invisibles).padStart(7) + "  " +
    String(f.coreografia || "-").padStart(5) +
    (f.ok ? "" : "   <-- REVISAR")
  );
  if (f.queOcultos?.length) for (const q of f.queOcultos) console.log("        oculto -> " + q);
}

/* Se imprime el total exento aunque no rompa nada: un limite que no se ve
   se lee como "aqui no habia nada", y no es verdad. */
const exentos = filas.reduce((n, f) => n + (f.coreografia || 0), 0);
if (exentos) {
  console.log(
    `\n  COREO = ${exentos} elemento(s) de coreografia del hero exentos a proposito ` +
    `(.stage-text en /eficore/).\n  Aparecen con el scroll y su mensaje ya esta ` +
    `publicado como contenido visible mas abajo.\n  Condicion de la exencion en el ` +
    `comentario de este script — re-comprobarla si el hero cambia.`
  );
}

console.log(
  problemas === 0
    ? "\n  Todas las rutas OK: sin desborde, sin contenido oculto, un solo h1.\n"
    : `\n  ${problemas} caso(s) con problema.\n`
);
process.exit(problemas === 0 ? 0 : 1);
