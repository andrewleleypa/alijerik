// Renderiza las tarjetas y rótulos del video demo como PNG 1920x1200.
import puppeteer from "puppeteer-core";
import { pathToFileURL } from "url";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1200 });

const here = import.meta.dirname;
const shots = [
  ["intro.html", "intro.png", false],
  ["outro.html", "outro.png", false],
  ["pwa.html", "pwa.png", false],
  ["label.html?n=01&t=" + encodeURIComponent("SEGURIDAD PRIMERO — SIN CONTRASEÑAS QUE ROBAR"), "l1.png", true],
  ["label.html?n=02&t=" + encodeURIComponent("TODOS TUS NÚMEROS, UNA SOLA BANDEJA"), "l2.png", true],
  ["label.html?n=03&t=" + encodeURIComponent("ESCRIBE TÚ PRIMERO — PLANTILLAS APROBADAS"), "l3.png", true],
  ["label.html?n=04&t=" + encodeURIComponent("ATIENDE EN EQUIPO — NOTAS INTERNAS EN EL HILO"), "l4.png", true],
  ["label.html?n=05&t=" + encodeURIComponent("NOTIFICACIONES QUE SÍ LLEGAN"), "l5.png", true],
];
for (const [src, out, transparent] of shots) {
  const [file, query] = src.split("?");
  await page.goto(pathToFileURL(`${here}/${file}`).href + (query ? "?" + query : ""));
  await page.screenshot({ path: `${here}/${out}`, omitBackground: transparent });
  console.log(out);
}
await browser.close();
