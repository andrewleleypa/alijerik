/**
 * medir-escalera-pase.mjs — Tipo A de la fórmula anti-slop, aplicado a un pase de wallet.
 *
 * POR QUÉ EXISTE, Y POR QUÉ NO SIRVE `medir-contraste-real.mjs`.
 * El medidor grande lee PÍXELES de una página renderizada en Chrome. Un pase de wallet
 * no es una página: es un JSON con tres colores que renderiza el sistema operativo, en
 * un lienzo que no controlamos y no podemos capturar. Así que aquí sí hay que calcular
 * a partir de los tokens — y por eso el script los LEE DE `tarjetas.json`, la misma
 * fuente que consumen los generadores. Nadie transcribe un color a mano.
 *
 * QUÉ MIDE. Apple Wallet te da exactamente tres colores y ninguno más:
 *     backgroundColor  → el lienzo
 *     foregroundColor  → los VALORES de los campos      (nivel 1 de texto)
 *     labelColor       → las ETIQUETAS de los campos    (nivel 2 de texto)
 * Son una escalera de dos escalones sobre un fondo. Medir cada escalón contra el piso
 * es necesario y NO es suficiente: si los dos escalones se acercan, la jerarquía se
 * borra aunque los dos "pasen". Eso es el método de references/feo-no-es-slop.md.
 *
 * UMBRALES. Las etiquetas de un pase son texto chico en mayúsculas. NO son "texto
 * grande": el umbral es 4.5:1 (WCAG 2.1 SC 1.4.3), no 3:1. La excepción de texto
 * grande pide >=24px, o >=18.66px con peso >=700, y ninguna etiqueta de wallet llega.
 *
 * AUTOPRUEBA. Antes de medir nada corre `--autoprueba` contra valores WCAG conocidos.
 * Si el instrumento miente, sale con error y no reporta. Esta es la meta-regla del
 * skill: cada criterio necesita un medidor, y el medidor necesita su propia prueba.
 *
 * Uso:
 *   node scripts/wallet/medir-escalera-pase.mjs            # mide todas las tarjetas
 *   node scripts/wallet/medir-escalera-pase.mjs jc         # mide una
 *   node scripts/wallet/medir-escalera-pase.mjs --autoprueba
 *   node scripts/wallet/medir-escalera-pase.mjs --probar '#05060a,#f0f0f0,#ff3d00'
 *
 * `--probar fondo,tinta,etiqueta` evalúa una paleta candidata SIN tocar tarjetas.json.
 * Existe para no descartar un color "porque sí": si se va a decir que un color quedó
 * fuera, o el medidor lo dice con un número, o se declara como decisión estética. Las
 * dos cosas valen; mezclarlas y vestir el gusto de cumplimiento, no (trampa 3 del skill).
 *
 * Códigos de salida: 0 = sin hallazgos · 1 = hay fallos · 2 = no pudo medir · 3 = error
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));

// ── WCAG 2.1: relación de contraste ──────────────────────────────────────────
const canal = (v) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const lum = ([r, g, b]) => 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
// Composición alpha-over. Un color con alfa no tiene UN contraste: tiene uno por fondo.
const sobre = (frente, alfa, fondo) => frente.map((c, i) => alfa * c + (1 - alfa) * fondo[i]);

const aRgb = (s) => {
  const t = String(s).trim();
  let m = t.match(/^#([0-9a-f]{6})$/i);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  m = t.match(/^#([0-9a-f]{3})$/i);
  if (m) return [0, 1, 2].map((i) => parseInt(m[1][i] + m[1][i], 16));
  m = t.match(/^rgba?\(([^)]+)\)$/i);
  if (m) {
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (p.length >= 3 && p.slice(0, 3).every((n) => Number.isFinite(n))) return p.slice(0, 3);
  }
  return null;
};
// Apple exige los colores del pase en `rgb(r, g, b)`. No acepta hex.
const aRgbCss = ([r, g, b]) => `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
const r2 = (n) => Math.round(n * 100) / 100;

// ── AUTOPRUEBA del instrumento ───────────────────────────────────────────────
// Valores de referencia verificables contra cualquier calculadora WCAG.
function autoprueba() {
  const casos = [
    { que: "negro sobre blanco", a: [0, 0, 0], b: [255, 255, 255], esperado: 21, tol: 0.01 },
    { que: "blanco sobre blanco", a: [255, 255, 255], b: [255, 255, 255], esperado: 1, tol: 0.001 },
    { que: "#777 sobre blanco", a: [119, 119, 119], b: [255, 255, 255], esperado: 4.48, tol: 0.01 },
    { que: "#767676 sobre blanco (el mínimo canónico AA)", a: [118, 118, 118], b: [255, 255, 255], esperado: 4.54, tol: 0.01 },
    { que: "simetría: invertir los argumentos no cambia nada", a: [255, 255, 255], b: [0, 0, 0], esperado: 21, tol: 0.01 },
  ];

  // La composición de alfa es el paso que ya produjo números falsos publicados como dato.
  const compuesto = sobre([255, 255, 255], 0.5, [0, 0, 0]);
  casos.push({
    que: "alfa: blanco al 50% sobre negro == gris 127.5",
    a: compuesto,
    b: [0, 0, 0],
    esperado: ratio([127.5, 127.5, 127.5], [0, 0, 0]),
    tol: 0.0001,
  });

  const parseos = [
    ["#05060a", [5, 6, 10]],
    ["#FFF", [255, 255, 255]],
    ["rgb(0, 229, 255)", [0, 229, 255]],
  ];

  let malos = 0;
  console.log("AUTOPRUEBA DEL MEDIDOR");
  console.log("─".repeat(72));
  for (const c of casos) {
    const dio = ratio(c.a, c.b);
    const ok = Math.abs(dio - c.esperado) <= c.tol;
    if (!ok) malos++;
    console.log(`  ${ok ? "✓" : "✗"}  ${c.que}: ${r2(dio)} (esperado ${r2(c.esperado)})`);
  }
  for (const [txt, esp] of parseos) {
    const dio = aRgb(txt);
    const ok = dio && dio.every((v, i) => v === esp[i]);
    if (!ok) malos++;
    console.log(`  ${ok ? "✓" : "✗"}  parseo ${txt} → ${JSON.stringify(dio)}`);
  }
  const basura = aRgb("azul marino");
  if (basura !== null) { malos++; console.log("  ✗  un color inválido debería dar null, dio " + JSON.stringify(basura)); }
  else console.log("  ✓  un color inválido da null (no se inventa un valor)");

  console.log("─".repeat(72));
  if (malos) {
    console.error(`⛔ EL MEDIDOR MIENTE: ${malos} comprobaciones fallaron. No mido nada.`);
    process.exit(3);
  }
  console.log("✅ instrumento verificado\n");
}

// ── Umbrales ─────────────────────────────────────────────────────────────────
const AA = 4.5;        // texto normal. Una etiqueta chica en mayúsculas NO es texto grande.
const ESCALON = 1.25;  // separación mínima entre niveles consecutivos para que sean DOS niveles.

function medirTarjeta(slug, t) {
  const p = t.paleta || {};
  const crudos = { fondo: p.fondo, tinta: p.tinta, etiqueta: p.etiqueta };
  const rgb = {};
  for (const [k, v] of Object.entries(crudos)) {
    if (v === undefined) return { slug, error: `falta el color '${k}' en la paleta` };
    const c = aRgb(v);
    if (!c) return { slug, error: `color '${k}' no reconocido: ${JSON.stringify(v)}` };
    rgb[k] = c;
  }

  const cTinta = ratio(rgb.tinta, rgb.fondo);
  const cEtiqueta = ratio(rgb.etiqueta, rgb.fondo);
  // La escalera: cuánto separa el nivel 1 del nivel 2. Da igual cuál sea mayor.
  const separacion = Math.max(cTinta, cEtiqueta) / Math.min(cTinta, cEtiqueta);

  const fallos = [];
  if (cTinta < AA) fallos.push(`tinta ${r2(cTinta)}:1 sobre el fondo (mínimo ${AA})`);
  if (cEtiqueta < AA) fallos.push(`etiqueta ${r2(cEtiqueta)}:1 sobre el fondo (mínimo ${AA})`);
  if (separacion < ESCALON)
    fallos.push(
      `la escalera se borra: ${r2(separacion)}× entre tinta y etiqueta (mínimo ${ESCALON}×) — ` +
        `los dos niveles se ven como uno`,
    );
  // Si la etiqueta contrasta MÁS que la tinta, la jerarquía está invertida: lo secundario
  // pesa más que lo principal. Pasa el umbral y aun así está mal.
  const invertida = cEtiqueta > cTinta;

  return {
    slug, crudos, rgb, cTinta, cEtiqueta, separacion, fallos, invertida,
    css: {
      backgroundColor: aRgbCss(rgb.fondo),
      foregroundColor: aRgbCss(rgb.tinta),
      labelColor: aRgbCss(rgb.etiqueta),
    },
  };
}

// ── Orquestación ─────────────────────────────────────────────────────────────
autoprueba();

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (process.argv.includes("--autoprueba")) process.exit(0);

// ── Modo paleta suelta: --probar fondo,tinta,etiqueta ────────────────────────
const iProbar = process.argv.indexOf("--probar");
if (iProbar !== -1) {
  const crudo = process.argv[iProbar + 1];
  const partes = String(crudo || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (partes.length !== 3) {
    console.error("⛔ --probar necesita exactamente 3 colores: fondo,tinta,etiqueta");
    process.exit(3);
  }
  const m = medirTarjeta("(candidata)", {
    paleta: { fondo: partes[0], tinta: partes[1], etiqueta: partes[2] },
  });
  if (m.error) {
    console.error(`⛔ NO PUDO MEDIR: ${m.error}`);
    process.exit(2);
  }
  console.log(`PALETA CANDIDATA  fondo ${m.crudos.fondo} · tinta ${m.crudos.tinta} · etiqueta ${m.crudos.etiqueta}`);
  console.log("─".repeat(72));
  console.log(`  tinta     ${String(r2(m.cTinta)).padStart(6)}:1`);
  console.log(`  etiqueta  ${String(r2(m.cEtiqueta)).padStart(6)}:1`);
  console.log(`  escalera  ${String(r2(m.separacion)).padStart(6)}×  (mínimo ${ESCALON}×)`);
  if (m.invertida) console.log("  ⚠  jerarquía invertida: la etiqueta pesa más que el valor");
  if (m.fallos.length) { m.fallos.forEach((f) => console.log(`   ✗ ${f}`)); process.exit(1); }
  console.log("  ✅ pasa");
  process.exit(0);
}

let datos;
try {
  datos = JSON.parse(readFileSync(path.join(AQUI, "tarjetas.json"), "utf8"));
} catch (e) {
  console.error(`⛔ No pude leer tarjetas.json: ${e.message}`);
  process.exit(2);
}

const slugs = args.length ? args : Object.keys(datos).filter((k) => !k.startsWith("_"));
if (!slugs.length) {
  console.error("⛔ No hay ninguna tarjeta que medir en tarjetas.json. Esto NO es 'aprobado'.");
  process.exit(2);
}

let totalFallos = 0;
let sinMedir = 0;

for (const slug of slugs) {
  const t = datos[slug];
  console.log("═".repeat(72));
  console.log(`TARJETA: ${slug}`);
  console.log("═".repeat(72));
  if (!t) {
    console.log(`  ⛔ NO EXISTE en tarjetas.json`);
    sinMedir++;
    continue;
  }

  const m = medirTarjeta(slug, t);
  if (m.error) {
    console.log(`  ⛔ NO PUDO MEDIR: ${m.error}`);
    console.log("     Esto NO es 'sin hallazgos'.");
    sinMedir++;
    continue;
  }

  console.log(`  fondo      ${m.crudos.fondo.padEnd(9)} ${aRgbCss(m.rgb.fondo)}`);
  console.log(`  tinta      ${m.crudos.tinta.padEnd(9)} ${String(r2(m.cTinta)).padStart(6)}:1  (valores de campo)`);
  console.log(`  etiqueta   ${m.crudos.etiqueta.padEnd(9)} ${String(r2(m.cEtiqueta)).padStart(6)}:1  (etiquetas de campo)`);
  console.log(`  escalera   ${String(r2(m.separacion)).padStart(20)}×  entre los dos niveles (mínimo ${ESCALON}×)`);

  if (m.invertida)
    console.log(
      `\n  ⚠  JERARQUÍA INVERTIDA: la etiqueta contrasta más que el valor.\n` +
        `     Lo secundario pesa más que lo principal. Pasa el umbral y aun así está mal.`,
    );

  if (m.fallos.length) {
    totalFallos += m.fallos.length;
    console.log("\n  FALLAN:");
    for (const f of m.fallos) console.log(`   ✗ ${f}`);
  } else {
    console.log("\n  ✅ los dos niveles pasan AA y la escalera se sostiene");
  }

  console.log("\n  Para pass.json de Apple (Apple NO acepta hex, exige rgb()):");
  for (const [k, v] of Object.entries(m.css)) console.log(`    "${k}": "${v}",`);
  console.log("");
}

console.log("═".repeat(72));
console.log(`RESUMEN: ${slugs.length} tarjetas · ${totalFallos} fallos · ${sinMedir} sin medir`);
console.log(
  "\nLÍMITE CONOCIDO DE ESTE INSTRUMENTO: mide LUMINANCIA, que es lo que define WCAG.\n" +
    "No mide saturación. Un color muy saturado (un cian, un naranja) atrae la vista más\n" +
    "de lo que su relación de contraste sugiere. Si la etiqueta es un color de marca\n" +
    "saturado, la escalera puede cumplir en el número y verse plana en el teléfono.\n" +
    "Eso se comprueba MIRANDO el pase en el aparato, no acá.",
);
console.log("═".repeat(72));

if (sinMedir) process.exit(2);
process.exit(totalFallos > 0 ? 1 : 0);
