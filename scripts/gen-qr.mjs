/**
 * Generador del QR de Alijerik — listo para imprenta.
 *
 * Por qué existe este script y no un generador en línea:
 * un QR de un servicio gratuito suele ser DINÁMICO (apunta al dominio del
 * proveedor, que redirige). Si ese proveedor cierra, cambia de plan o te
 * bloquea, TODAS las tarjetas impresas dejan de funcionar. Este QR es
 * ESTÁTICO y apunta directo a alijerik.com. No depende de nadie.
 *
 * Uso:  node scripts/gen-qr.mjs
 * Sale: public/alijerik-qr.svg            ← el de imprimir
 *       public/alijerik-qr-sin-logo.svg   ← respaldo si el logo da problemas
 *       public/alijerik-qr-claro.svg      ← blanco sobre oscuro (ver aviso)
 */
import QRCode from "qrcode";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/* URL corta A PROPÓSITO. Cada carácter de más agrega módulos; más módulos
   significa módulos más chicos al imprimir a 2 cm, y un QR denso falla con
   luz mala. "alijerik.com/jc" cabe en una versión baja del estándar. */
const URL_DESTINO = "https://alijerik.com/jc";

/* Nivel H = 30% de recuperación de errores. Es lo que permite tapar el
   centro con el logo sin romper la lectura. Con el logo ocupando ~7% del
   área, queda un margen enorme. */
const NIVEL = "H";

const QUIET = 4; // zona silenciosa mínima del estándar, en módulos

/** Construye el <path> de los módulos oscuros. */
function rutaModulos(datos, n) {
  let d = "";
  for (let f = 0; f < n; f++) {
    for (let c = 0; c < n; c++) {
      if (datos[f * n + c]) d += `M${c + QUIET} ${f + QUIET}h1v1h-1z`;
    }
  }
  return d;
}

/** La marca de Alijerik: anillo de acreción + horizonte de sucesos. */
function marca(cx, cy, r) {
  const k = r / 31; // el favicon original vive en un círculo de radio 31
  return `
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#05060a"/>
  <circle cx="${cx}" cy="${cy}" r="${19 * k}" fill="none" stroke="url(#ag)" stroke-width="${5 * k}"/>
  <circle cx="${cx}" cy="${cy}" r="${11.5 * k}" fill="#05060a"/>`;
}

function construir({ modulos, conLogo, colorModulo, colorFondo }) {
  const n = modulos.size;
  const total = n + QUIET * 2;
  const centro = total / 2;

  /* Diámetro del logo = 30% del ancho del código → ~7% del área.
     Muy por debajo del 30% que tolera el nivel H. */
  const rLogo = total * 0.15;
  const rHueco = rLogo * 1.14; // aro de respiro para que el ojo separe marca de módulos

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="1024" height="1024" shape-rendering="crispEdges" role="img" aria-label="Código QR de Alijerik — alijerik.com/jc">
  <defs>
    <linearGradient id="ag" x1="${centro - rLogo}" y1="${centro - rLogo}" x2="${centro + rLogo}" y2="${centro + rLogo}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#18e3ff"/>
      <stop offset=".5" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#ff3d00"/>
    </linearGradient>${conLogo ? `
    <mask id="hueco">
      <rect width="${total}" height="${total}" fill="#fff"/>
      <circle cx="${centro}" cy="${centro}" r="${rHueco}" fill="#000"/>
    </mask>` : ""}
  </defs>
  <rect width="${total}" height="${total}" fill="${colorFondo}"/>
  <path d="${rutaModulos(modulos.data, n)}" fill="${colorModulo}"${conLogo ? ' mask="url(#hueco)"' : ""}/>${conLogo ? marca(centro, centro, rLogo) : ""}
</svg>
`;
}

const qr = QRCode.create(URL_DESTINO, { errorCorrectionLevel: NIVEL });

mkdirSync(resolve(raiz, "public"), { recursive: true });

const salidas = [
  ["public/alijerik-qr.svg", { conLogo: true, colorModulo: "#05060a", colorFondo: "#ffffff" }],
  ["public/alijerik-qr-sin-logo.svg", { conLogo: false, colorModulo: "#05060a", colorFondo: "#ffffff" }],
  ["public/alijerik-qr-claro.svg", { conLogo: true, colorModulo: "#ffffff", colorFondo: "#05060a" }],
];

for (const [ruta, opciones] of salidas) {
  writeFileSync(resolve(raiz, ruta), construir({ modulos: qr.modules, ...opciones }), "utf8");
  console.log("escrito:", ruta);
}

console.log(`
URL      ${URL_DESTINO}
versión  ${qr.version}  (${qr.modules.size}x${qr.modules.size} módulos)
nivel    ${NIVEL} — 30% de recuperación
logo     ~7% del área (el nivel H tolera hasta 30%)

IMPRENTA
  Usar alijerik-qr.svg (oscuro sobre blanco). Es el que más tolera
  luz mala, tinta corrida y cámaras viejas.
  Tamaño mínimo 2 cm. Respetar el borde blanco: NO recortarlo,
  es la zona silenciosa y sin ella muchos lectores fallan.

  alijerik-qr-claro.svg es para fondo oscuro. Escanea peor en
  lectores viejos porque invierte el contraste. Probarlo antes.

ANTES DE IMPRIMIR 500: imprimir UNA y escanearla con tres teléfonos
distintos, incluido uno viejo y con poca luz.
`);
