/**
 * Alarma de renovaciones.
 *
 * Por qué existe: un documento que hay que acordarse de abrir no es un
 * recordatorio, es una nota. Esto se ejecuta y responde una sola pregunta:
 * ¿a quién hay que cobrarle pronto?
 *
 * Uso:  node scripts/renovaciones.mjs
 *       node scripts/renovaciones.mjs --dias 90
 *
 * Sale con código 1 si hay algo vencido o sin fecha, para que sirva de
 * verificación en un gancho o en una tarea programada.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const VENTANA = +(argv[argv.indexOf("--dias") + 1] || 60);
const AVISO_PREVIO = 30; // lo que la página promete al cliente

const { servicios } = JSON.parse(readFileSync(resolve(raiz, "docs/renovaciones.json"), "utf8"));
const hoy = new Date();
hoy.setHours(0, 0, 0, 0);

const dias = (a, b) => Math.round((a - b) / 86400000);

/** Próximo aniversario a partir de la fecha de inicio, saltando ciclos vencidos. */
function proximaRenovacion(inicioISO, cicloMeses) {
  const f = new Date(inicioISO + "T00:00:00");
  while (f <= hoy) f.setMonth(f.getMonth() + cicloMeses);
  return f;
}

const sinFecha = [];
const filas = [];

for (const s of servicios) {
  if (!s.inicio) { sinFecha.push(s); continue; }
  const vence = proximaRenovacion(s.inicio, s.cicloMeses);
  const faltan = dias(vence, hoy);
  filas.push({ ...s, vence, faltan, avisar: faltan <= AVISO_PREVIO });
}

filas.sort((a, b) => a.faltan - b.faltan);

console.log(`\n  RENOVACIONES — hoy ${hoy.toISOString().slice(0, 10)}  ·  ventana ${VENTANA} días\n`);

if (sinFecha.length) {
  console.log("  ── DATO FALTANTE (no se puede avisar sin esto) ──");
  for (const s of sinFecha) {
    console.log(`  !  ${s.cliente} — ${s.servicio}`);
    console.log(`     falta la fecha de inicio en docs/renovaciones.json`);
  }
  console.log("");
}

const enVentana = filas.filter((f) => f.faltan <= VENTANA);
if (enVentana.length) {
  for (const f of enVentana) {
    const marca = f.faltan < 0 ? "VENCIDO" : f.avisar ? "AVISAR YA" : "próximo";
    console.log(`  ${marca.padEnd(10)} ${f.cliente}`);
    console.log(`             ${f.servicio}`);
    console.log(`             vence ${f.vence.toISOString().slice(0, 10)} · faltan ${f.faltan} días · ${f.moneda} ${f.monto}`);
    if (f.notas) console.log(`             nota: ${f.notas}`);
    console.log("");
  }
} else if (!sinFecha.length) {
  console.log("  Nada por renovar en la ventana.\n");
}

const problemas = sinFecha.length + filas.filter((f) => f.faltan < 0).length;
if (problemas) console.log(`  ${problemas} punto(s) requieren acción.\n`);
process.exit(problemas ? 1 : 0);
