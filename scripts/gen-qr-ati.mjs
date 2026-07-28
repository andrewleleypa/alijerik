/**
 * Generador del QR del Dr. Angel Inostroza — listo para imprenta.
 *
 * Mismo principio que gen-qr.mjs: QR ESTÁTICO apuntando directo a
 * alijerik.com, sin depender de ningún acortador de terceros.
 *
 * El centro lleva el monograma del doctor: "AI" en Fraunces bajo un arco,
 * la geometría de sus dos clínicas. Las letras van CONVERTIDAS A TRAZADOS
 * (opentype.js + el TTF de scripts/assets/) porque un SVG suelto no carga
 * Google Fonts: con <text> el archivo se vería en Times en la imprenta.
 *
 * Uso:  node scripts/gen-qr-ati.mjs
 * Sale: public/ati-qr.svg            ← el de imprimir (tinta sobre blanco)
 *       public/ati-qr-crema.svg      ← para papelería crema (#F8F4EC)
 *       public/ati-qr-sin-logo.svg   ← respaldo si el monograma da problemas
 *
 * OJO: la ruta /ati es renombrable SOLO hasta que este QR se imprima.
 * Después, igual que /jc, es intocable.
 */
import QRCode from "qrcode";
import opentype from "opentype.js";
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/* URL corta a propósito: menos caracteres = QR menos denso = imprime bien
   a 2 cm. Igual que "alijerik.com/jc". */
const URL_DESTINO = "https://alijerik.com/ati";

const NIVEL = "H"; // 30% de recuperación: permite tapar el centro con el logo
const QUIET = 4;   // zona silenciosa del estándar, en módulos

const TINTA = "#181410"; // la tinta de la tarjeta, no negro puro
const CREMA = "#F8F4EC";

/* Fraunces SemiBold, el mismo peso del sello de la tarjeta. */
const ttf = readFileSync(resolve(raiz, "scripts/assets/fraunces-600.ttf"));
const fuente = opentype.parse(ttf.buffer.slice(ttf.byteOffset, ttf.byteOffset + ttf.byteLength));

function rutaModulos(datos, n) {
  let d = "";
  for (let f = 0; f < n; f++) {
    for (let c = 0; c < n; c++) {
      if (datos[f * n + c]) d += `M${c + QUIET} ${f + QUIET}h1v1h-1z`;
    }
  }
  return d;
}

/** El monograma: arco de línea + "AI" en trazados, centrado en (cx, cy). */
function marca(cx, cy, rLogo, colorFondo) {
  /* TODO el monograma (esquinas del arco + trazo incluidos) debe caber DENTRO
     del hueco circular, igual que la marca de /jc. La primera versión tenía el
     arco más grande que el hueco y mataba módulos de más: el QR no decodificaba
     a ningún tamaño aunque "la teoría" dijera que sí. */
  const w = rLogo * 1.34;           // ancho del arco
  const h = rLogo * 1.7;            // alto del arco
  const r = w / 2;                  // radio del medio punto
  const top = cy - h / 2;
  const bot = cy + h / 2;
  const trazo = rLogo * 0.08;

  const talla = rLogo * 0.76;       // tamaño de las letras
  const avance = fuente.getAdvanceWidth("AI", talla);
  /* Baseline: centra la altura de mayúsculas (~0.72 em en Fraunces) dentro
     del cuerpo del arco, un pelo por debajo del centro, como en el sello. */
  const yBase = cy + h * 0.1 + talla * 0.36;
  const letras = fuente.getPath("AI", cx - avance / 2, yBase, talla).toPathData(3);

  return `
  <path d="M${(cx - r).toFixed(3)} ${bot.toFixed(3)} V${(top + r).toFixed(3)} A${r.toFixed(3)} ${r.toFixed(3)} 0 0 1 ${(cx + r).toFixed(3)} ${(top + r).toFixed(3)} V${bot.toFixed(3)} Z"
        fill="${colorFondo}" stroke="${TINTA}" stroke-width="${trazo.toFixed(3)}"/>
  <path d="${letras}" fill="${TINTA}"/>`;
}

function construir({ modulos, conLogo, colorFondo }) {
  const n = modulos.size;
  const total = n + QUIET * 2;
  const centro = total / 2;

  /* Diámetro del hueco = ~30% del ancho → ~7% del área. Nivel H tolera 30%
     EN TEORÍA; medido de verdad (rasterizando y decodificando con jsQR),
     este QR v3 decodifica con hueco de radio 6.33 módulos y MUERE en 6.66.
     1.14 × rLogo = 6.33 — el mismo factor de /jc, y no es casualidad: está
     exactamente en el borde bueno. NO subirlo. */
  const rLogo = total * 0.15;
  const rHueco = rLogo * 1.14; // aro de respiro alrededor del monograma

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="1024" height="1024" shape-rendering="crispEdges" role="img" aria-label="Código QR del Dr. Angel Inostroza — alijerik.com/ati">
  <defs>${conLogo ? `
    <mask id="hueco">
      <rect width="${total}" height="${total}" fill="#fff"/>
      <circle cx="${centro}" cy="${centro}" r="${rHueco}" fill="#000"/>
    </mask>` : ""}
  </defs>
  <rect width="${total}" height="${total}" fill="${colorFondo}"/>
  <path d="${rutaModulos(modulos.data, n)}" fill="${TINTA}"${conLogo ? ' mask="url(#hueco)"' : ""}/>${conLogo ? marca(centro, centro, rLogo, colorFondo) : ""}
</svg>
`;
}

const qr = QRCode.create(URL_DESTINO, { errorCorrectionLevel: NIVEL });

mkdirSync(resolve(raiz, "public"), { recursive: true });

const salidas = [
  ["public/ati-qr.svg", { conLogo: true, colorFondo: "#ffffff" }],
  ["public/ati-qr-crema.svg", { conLogo: true, colorFondo: CREMA }],
  ["public/ati-qr-sin-logo.svg", { conLogo: false, colorFondo: "#ffffff" }],
];

for (const [ruta, opciones] of salidas) {
  writeFileSync(resolve(raiz, ruta), construir({ modulos: qr.modules, ...opciones }), "utf8");
  console.log("escrito:", ruta);
}

console.log(`
URL      ${URL_DESTINO}
versión  ${qr.version}  (${qr.modules.size}x${qr.modules.size} módulos)
nivel    ${NIVEL} — 30% de recuperación

IMPRENTA
  Usar ati-qr.svg (tinta sobre blanco). ati-qr-crema.svg solo si la
  papelería es crema y la imprenta confirma el contraste.
  Tamaño mínimo 2 cm. NO recortar el borde claro: es la zona silenciosa.

ANTES DE IMPRIMIR: node scripts/verificar-qr.mjs (decodifica de verdad),
y además imprimir UNA y escanearla con tres teléfonos distintos.
`);
