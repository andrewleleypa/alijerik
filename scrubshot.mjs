// Captura la página de scrub en varios puntos del scroll (verificación visual).
import puppeteer from "puppeteer-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const URL = process.env.URL || "http://localhost:5199/eficore/";
const STOPS = [0, 0.15, 0.42, 0.7, 0.95];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--ignore-gpu-blocklist", "--enable-gpu", "--use-angle=d3d11", "--window-size=1440,900"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(URL, { waitUntil: "load" });
await new Promise((r) => setTimeout(r, 9000)); // dejar cargar la secuencia

for (const s of STOPS) {
  await page.evaluate((f) => {
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollTo(0, max * f);
  }, s);
  await new Promise((r) => setTimeout(r, 1200)); // dejar asentar el lerp
  await page.screenshot({ path: `scrub-${String(Math.round(s * 100)).padStart(2, "0")}.png` });
  console.log(`scrub-${Math.round(s * 100)}.png`);
}
await browser.close();
