/**
 * Verifica que los QR generados DECODIFICAN de verdad, con el logo encima.
 *
 * Por qué: el logo tapa módulos. La teoría dice que el nivel H aguanta, pero
 * "la teoría dice" no es una respuesta aceptable cuando se van a imprimir
 * cientos de tarjetas. Esto lo decodifica de verdad, a los tamaños en píxeles
 * que una cámara de teléfono realmente captura de un QR de 2 cm.
 *
 * Uso: node scripts/verificar-qr.mjs
 */
import puppeteer from "puppeteer-core";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const JSQR = resolve(raiz, "node_modules/jsqr/dist/jsQR.js");

/* Cada QR del sitio con la URL que DEBE decodificar. Al agregar una tarjeta
   nueva, agregar aquí sus archivos: una sola corrida verifica todo. */
const OBJETIVOS = [
  { archivo: "alijerik-qr.svg", esperado: "https://alijerik.com/jc" },
  { archivo: "alijerik-qr-sin-logo.svg", esperado: "https://alijerik.com/jc" },
  { archivo: "alijerik-qr-claro.svg", esperado: "https://alijerik.com/jc" },
  { archivo: "ati-qr.svg", esperado: "https://alijerik.com/ati" },
  { archivo: "ati-qr-crema.svg", esperado: "https://alijerik.com/ati" },
  { archivo: "ati-qr-sin-logo.svg", esperado: "https://alijerik.com/ati" },
];

/* Un QR de 2 cm fotografiado por un teléfono a distancia normal cae en este
   rango de píxeles. 120px es el caso feo: cámara vieja, lejos, poca luz. */
const TAMANOS = [120, 160, 200, 260, 360];

const navegador = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox"],
});
const pagina = await navegador.newPage();
await pagina.goto("about:blank");
await pagina.addScriptTag({ path: JSQR });

let fallos = 0;
const filas = [];

for (const { archivo, esperado } of OBJETIVOS) {
  const svg = readFileSync(resolve(raiz, "public", archivo), "utf8");

  for (const tam of TAMANOS) {
    const resultado = await pagina.evaluate(
      async (svgTexto, lado) =>
        new Promise((listo) => {
          const img = new Image();
          img.onload = () => {
            const c = document.createElement("canvas");
            c.width = c.height = lado;
            const ctx = c.getContext("2d", { willReadFrequently: true });
            // Fondo blanco: simula el papel. Un SVG con fondo propio lo tapa.
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, lado, lado);
            ctx.drawImage(img, 0, 0, lado, lado);
            const d = ctx.getImageData(0, 0, lado, lado);
            const r = window.jsQR(d.data, d.width, d.height);
            listo(r ? r.data : null);
          };
          img.onerror = () => listo("__ERROR_DE_CARGA__");
          img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgTexto)));
        }),
      svg,
      tam
    );

    const ok = resultado === esperado;
    if (!ok) fallos++;
    filas.push({ archivo, px: tam, ok, leido: resultado ?? "(no decodificó)" });
  }
}

await navegador.close();

const ancho = Math.max(...filas.map((f) => f.archivo.length));
console.log("\n  ARCHIVO".padEnd(ancho + 4) + "  PX     RESULTADO");
console.log("  " + "-".repeat(ancho + 34));
for (const f of filas) {
  console.log(
    "  " + f.archivo.padEnd(ancho + 2) + String(f.px).padStart(4) + "px   " +
    (f.ok ? "OK  " + f.leido : "FALLA  " + f.leido)
  );
}

console.log(
  fallos === 0
    ? "\n  Todos los archivos decodifican en todos los tamanos probados.\n"
    : `\n  ${fallos} combinacion(es) fallaron. Revisar antes de mandar a imprenta.\n`
);
process.exit(fallos === 0 ? 0 : 1);
