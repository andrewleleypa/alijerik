import puppeteer from "puppeteer-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const URL = process.env.URL || "http://127.0.0.1:4317/";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: [
    "--no-sandbox",
    "--ignore-gpu-blocklist",   // forzar GPU real aunque esté en blocklist
    "--enable-gpu",
    "--use-angle=d3d11",        // backend GPU real de Windows, NO swiftshader
    "--window-size=1440,900",
  ],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(URL, { waitUntil: "load" });

// Qué GPU/renderer está usando de verdad
const renderer = await page.evaluate(() => {
  const gl = document.createElement("canvas").getContext("webgl");
  const ext = gl && gl.getExtension("WEBGL_debug_renderer_info");
  return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "desconocido";
});

// Medir FPS real durante 6 segundos
const result = await page.evaluate(() => new Promise((resolve) => {
  let frames = 0;
  let worst = Infinity;
  let last = performance.now();
  const start = last;
  function tick(now) {
    const dt = now - last;
    if (dt > 0) worst = Math.min(worst, 1000 / dt);
    last = now;
    frames++;
    if (now - start < 6000) requestAnimationFrame(tick);
    else {
      const secs = (now - start) / 1000;
      resolve({
        avg: +(frames / secs).toFixed(1),
        worstInstant: +worst.toFixed(1),
        lite: document.body.classList.contains("lite"),
      });
    }
  }
  requestAnimationFrame(tick);
}));

console.log(JSON.stringify({ renderer, ...result }, null, 2));
await browser.close();
