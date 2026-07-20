// Renderiza las tarjetas sociales Open Graph (1200x630) a public/.
import puppeteer from "puppeteer-core";
import { pathToFileURL } from "url";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630 });

const here = import.meta.dirname;
for (const [src, out] of [
  ["og-eficore.html", "../public/eficore-og.png"],
  ["og-alijerik.html", "../public/alijerik-og.png"],
]) {
  await page.goto(pathToFileURL(`${here}/${src}`).href, { waitUntil: "networkidle0" });
  await page.screenshot({ path: `${here}/${out}` });
  console.log(out);
}
await browser.close();
