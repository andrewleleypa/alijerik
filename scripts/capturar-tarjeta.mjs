/**
 * Captura la tarjeta viva de /jc/ para usarla como prueba en /tarjetas/.
 *
 * Por qué en móvil: una tarjeta de presentación se escanea con el teléfono.
 * Una captura de escritorio sería una mentira sobre cómo se usa el producto.
 *
 * Requiere el servidor de desarrollo corriendo:
 *   npx vite --port 4319 --strictPort
 * Luego:
 *   node scripts/capturar-tarjeta.mjs
 */
import puppeteer from "puppeteer-core";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.BASE || "http://localhost:4319";

const navegador = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--force-color-profile=srgb"],
});

const pagina = await navegador.newPage();
await pagina.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
await pagina.goto(`${BASE}/jc/`, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 900)); // que asienten las fuentes

const salida = resolve(raiz, "public/tarjeta-jc-movil.jpg");
await pagina.screenshot({ path: salida, type: "jpeg", quality: 88, fullPage: true });

const alto = await pagina.evaluate(() => document.documentElement.scrollHeight);
console.log(`escrito: public/tarjeta-jc-movil.jpg  (390x${alto} css, @2x)`);

await navegador.close();
