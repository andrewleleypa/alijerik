import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--ignore-gpu-blocklist", "--use-angle=d3d11", "--window-size=1440,900"],
});
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:5173/", { waitUntil: "load" });
const out = await p.evaluate(async () => {
  try {
    const mod = await import("/src/hero/Hero.js");
    const canvas = document.getElementById("hero-canvas");
    new mod.Hero(canvas, { particleCount: 2000 });
    return "OK — sin error";
  } catch (e) {
    return "STACK: " + (e && e.stack ? e.stack : String(e));
  }
});
console.log(out);
await b.close();
