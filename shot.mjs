import puppeteer from "puppeteer-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const URL = process.env.URL || "http://127.0.0.1:4318/";
const OUT = process.env.OUT || "shot.png";
const WAIT = +(process.env.WAIT || 4500);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: [
    "--no-sandbox",
    "--ignore-gpu-blocklist",
    "--enable-gpu",
    "--use-angle=d3d11",
    "--window-size=1440,900",
  ],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(URL, { waitUntil: "load" });
await new Promise((r) => setTimeout(r, WAIT)); // tiempo real para ver la animación
const lite = await page.evaluate(() => document.body.classList.contains("lite"));
await page.screenshot({ path: OUT });
console.log(JSON.stringify({ lite, out: OUT }));
await browser.close();
