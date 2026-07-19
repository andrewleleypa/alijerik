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
  ["label.html?n=01&t=" + encodeURIComponent("ENTRA SIN CONTRASEÑA"), "l1.png", true],
  ["label.html?n=02&t=" + encodeURIComponent("TODO LLEGA A UNA SOLA BANDEJA"), "l2.png", true],
  ["label.html?n=03&t=" + encodeURIComponent("INICIA CONVERSACIONES CON PLANTILLAS"), "l3.png", true],
  ["label.html?n=04&t=" + encodeURIComponent("ATIENDE CON EL CLIENTE COMPLETO AL LADO"), "l4.png", true],
];
for (const [src, out, transparent] of shots) {
  const [file, query] = src.split("?");
  await page.goto(pathToFileURL(`${here}/${file}`).href + (query ? "?" + query : ""));
  await page.screenshot({ path: `${here}/${out}`, omitBackground: transparent });
  console.log(out);
}
await browser.close();
