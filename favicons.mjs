// Genera los favicons rasterizados a partir de los SVG de public/.
//
// Por qué existe: Google Imágenes/Search pide el favicon aparte del HTML y
// prefiere un cuadrado múltiplo de 48px; además cae a /favicon.ico si no
// encuentra nada. Nuestro sitio solo tenía SVG y /favicon.ico devolvía el
// index.html con 200 (soft-404 de Cloudflare Pages), así que el rastreador
// se quedaba sin icono y salía el globito genérico.
//
// Uso: node favicons.mjs   (deja los archivos en public/, luego npm run build)

import { writeFileSync, readFileSync } from "node:fs";
import puppeteer from "puppeteer-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

// [svg de origen, prefijo de salida]
const MARCAS = [
  ["public/favicon.svg", "public/favicon"],
  ["public/eficore-favicon.svg", "public/eficore-favicon"],
];

// 96 = múltiplo de 48 (lo que pide Google). 180 = apple-touch-icon de iOS.
// 32 y 48 solo viven dentro del .ico para las pestañas del escritorio.
const TAMANOS = [32, 48, 96, 180];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--force-device-scale-factor=1"],
});
const page = await browser.newPage();

async function rasterizar(svgPath, size) {
  const svg = readFileSync(svgPath, "utf8");
  const b64 = Buffer.from(svg, "utf8").toString("base64");
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  await page.setContent(
    `<style>html,body{margin:0;padding:0;background:transparent}
     img{display:block;width:${size}px;height:${size}px}</style>
     <img src="data:image/svg+xml;base64,${b64}">`,
    { waitUntil: "load" }
  );
  return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}

// .ico = cabecera + directorio + los PNG pegados al final (PNG-in-ICO, que
// entienden todos los navegadores modernos y Windows desde Vista).
function empaquetarIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reservado
  header.writeUInt16LE(1, 2); // tipo 1 = icono
  header.writeUInt16LE(pngs.length, 4);

  let offset = 6 + pngs.length * 16;
  const entradas = [];
  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // ancho
    e.writeUInt8(size >= 256 ? 0 : size, 1); // alto
    e.writeUInt8(0, 2); // paleta
    e.writeUInt8(0, 3); // reservado
    e.writeUInt16LE(1, 4); // planos
    e.writeUInt16LE(32, 6); // bits por pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    entradas.push(e);
  }
  return Buffer.concat([header, ...entradas, ...pngs.map((p) => p.data)]);
}

for (const [svgPath, prefijo] of MARCAS) {
  const renders = [];
  for (const size of TAMANOS) {
    const data = Buffer.from(await rasterizar(svgPath, size));
    renders.push({ size, data });
  }

  const png96 = renders.find((r) => r.size === 96).data;
  const png180 = renders.find((r) => r.size === 180).data;
  writeFileSync(`${prefijo}-96.png`, png96);
  writeFileSync(`${prefijo}-180.png`, png180);
  writeFileSync(
    `${prefijo}.ico`,
    empaquetarIco(renders.filter((r) => r.size !== 180))
  );
  console.log(`${prefijo}: .ico (32/48/96) + -96.png + -180.png`);
}

await browser.close();
