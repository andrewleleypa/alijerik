// Captura las secciones de producto (debajo de la pista de scrub) en desktop y móvil.
import puppeteer from "puppeteer-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const URL = process.env.URL || "http://localhost:5199/eficore/";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--ignore-gpu-blocklist", "--enable-gpu", "--use-angle=d3d11"],
});

for (const [name, w, h] of [["desk", 1440, 900], ["cel", 390, 844]]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  await page.goto(URL, { waitUntil: "load" });
  await new Promise((r) => setTimeout(r, 6000));
  const stops = await page.evaluate(() => {
    const secs = [...document.querySelectorAll(".product .sec, footer")];
    return secs.map((s) => s.getBoundingClientRect().top + scrollY - 60);
  });
  for (let i = 0; i < stops.length; i++) {
    await page.evaluate((y) => scrollTo(0, y), stops[i]);
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: `sec-${name}-${i}.png` });
  }
  await page.close();
}
await browser.close();
console.log("ok");
