import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--ignore-gpu-blocklist", "--use-angle=d3d11", "--window-size=1440,900"],
});
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await p.goto("http://localhost:5173/", { waitUntil: "load" });
await new Promise((r) => setTimeout(r, 5000));
const box = await p.evaluate(() => {
  const el = document.querySelector(".hero__headline");
  const r = el.getBoundingClientRect();
  return { x: r.x - 20, y: r.y - 20, width: r.width + 40, height: r.height + 40 };
});
await p.screenshot({ path: "closeup.png", clip: box });
console.log("clip:", JSON.stringify(box));
await b.close();
