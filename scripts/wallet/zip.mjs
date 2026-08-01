/**
 * zip.mjs — escritor ZIP mínimo, sin dependencias.
 *
 * POR QUÉ EXISTE. Un `.pkpass` es un ZIP con siete archivos chicos. Meter una
 * dependencia de terceros al repo (y su árbol, y su mantenimiento, y su renovación
 * de seguridad) para escribir 300 bytes de cabeceras no vale la pena. Solo se usa el
 * método STORE (sin comprimir): un pase pesa ~40 KB y comprimirlo ahorraría kilobytes
 * a cambio de meter zlib y sus casos borde.
 *
 * AUTOPRUEBA: `node scripts/wallet/zip.mjs --autoprueba`
 * Comprueba el CRC32 contra el valor canónico del estándar ("123456789" → 0xCBF43926)
 * y que el ZIP resultante lo abra el propio sistema operativo. Un escritor de archivos
 * binarios que nadie probó es una forma cara de perder una tarde.
 */

import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

// ── CRC32 (IEEE 802.3, el que exige ZIP) ─────────────────────────────────────
const TABLA = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = TABLA[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ── Fecha/hora en formato MS-DOS, que es lo que guarda un ZIP ────────────────
function fechaDos(d = new Date()) {
  const hora = (d.getHours() << 11) | (d.getMinutes() << 5) | (Math.floor(d.getSeconds() / 2));
  // El año base del formato es 1980. Antes de eso no hay ZIP posible.
  const fecha = ((Math.max(1980, d.getFullYear()) - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { hora, fecha };
}

/**
 * Arma un ZIP en memoria.
 * @param {Array<{nombre: string, datos: Buffer}>} archivos
 * @returns {Buffer}
 */
export function crearZip(archivos, cuando = new Date()) {
  const { hora, fecha } = fechaDos(cuando);
  const locales = [];
  const centrales = [];
  let desplazamiento = 0;

  for (const a of archivos) {
    const nombre = Buffer.from(a.nombre, "utf8");
    const datos = Buffer.isBuffer(a.datos) ? a.datos : Buffer.from(a.datos);
    const crc = crc32(datos);

    // Bit 11 = nombres en UTF-8. Los nombres del pkpass son ASCII, pero declararlo
    // es correcto y no cuesta nada.
    const banderas = 0x0800;

    const cabecera = Buffer.alloc(30);
    cabecera.writeUInt32LE(0x04034b50, 0);   // firma de cabecera local
    cabecera.writeUInt16LE(20, 4);           // versión necesaria
    cabecera.writeUInt16LE(banderas, 6);
    cabecera.writeUInt16LE(0, 8);            // método 0 = STORE
    cabecera.writeUInt16LE(hora, 10);
    cabecera.writeUInt16LE(fecha, 12);
    cabecera.writeUInt32LE(crc, 14);
    cabecera.writeUInt32LE(datos.length, 18); // comprimido == sin comprimir en STORE
    cabecera.writeUInt32LE(datos.length, 22);
    cabecera.writeUInt16LE(nombre.length, 26);
    cabecera.writeUInt16LE(0, 28);           // sin campo extra

    locales.push(cabecera, nombre, datos);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);            // versión que lo creó
    central.writeUInt16LE(20, 6);            // versión necesaria
    central.writeUInt16LE(banderas, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(hora, 12);
    central.writeUInt16LE(fecha, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(datos.length, 20);
    central.writeUInt32LE(datos.length, 24);
    central.writeUInt16LE(nombre.length, 28);
    central.writeUInt16LE(0, 30);            // extra
    central.writeUInt16LE(0, 32);            // comentario
    central.writeUInt16LE(0, 34);            // disco inicial
    central.writeUInt16LE(0, 36);            // atributos internos
    central.writeUInt32LE(0, 38);            // atributos externos
    central.writeUInt32LE(desplazamiento, 42);

    centrales.push(central, nombre);
    desplazamiento += cabecera.length + nombre.length + datos.length;
  }

  const cuerpo = Buffer.concat(locales);
  const directorio = Buffer.concat(centrales);

  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  fin.writeUInt16LE(0, 4);                   // número de disco
  fin.writeUInt16LE(0, 6);                   // disco del directorio central
  fin.writeUInt16LE(archivos.length, 8);
  fin.writeUInt16LE(archivos.length, 10);
  fin.writeUInt32LE(directorio.length, 12);
  fin.writeUInt32LE(cuerpo.length, 16);
  fin.writeUInt16LE(0, 20);                  // sin comentario

  return Buffer.concat([cuerpo, directorio, fin]);
}

// ── Autoprueba ───────────────────────────────────────────────────────────────
if (process.argv.includes("--autoprueba")) {
  let malos = 0;
  const ok = (cond, que) => {
    console.log(`  ${cond ? "✓" : "✗"}  ${que}`);
    if (!cond) malos++;
  };

  console.log("AUTOPRUEBA DEL ESCRITOR ZIP");
  console.log("─".repeat(66));

  // Valor de comprobación canónico del estándar CRC-32.
  const canonico = crc32(Buffer.from("123456789", "ascii"));
  ok(canonico === 0xcbf43926, `CRC32("123456789") = 0x${canonico.toString(16)} (canónico 0xcbf43926)`);
  ok(crc32(Buffer.alloc(0)) === 0, "CRC32 de vacío = 0");

  // La prueba que de verdad importa: que el sistema operativo lo pueda abrir.
  const dir = mkdtempSync(path.join(tmpdir(), "zip-prueba-"));
  const destino = path.join(dir, "prueba.zip");
  const contenido = "hola mundo, con acentos: ñáéíóú";
  writeFileSync(
    destino,
    crearZip([
      { nombre: "pass.json", datos: Buffer.from(contenido, "utf8") },
      { nombre: "manifest.json", datos: Buffer.from("{}", "utf8") },
    ]),
  );

  try {
    // OJO: no se compara TEXTO contra la salida de PowerShell. Ya mordió una vez —
    // la consola entrega el codepage ANSI del sistema, node lo lee como UTF-8, y los
    // acentos vuelven rotos. La prueba fallaba señalando al escritor de ZIP, que
    // estaba perfecto. Se comparan HASHES, que son ASCII y no dependen de nada.
    const salida = execFileSync(
      "powershell.exe",
      [
        "-NoProfile", "-NonInteractive", "-Command",
        `Add-Type -A System.IO.Compression.FileSystem; ` +
          `$z=[IO.Compression.ZipFile]::OpenRead('${destino.replace(/'/g, "''")}'); ` +
          `$n=($z.Entries | ForEach-Object { $_.Name }) -join ','; ` +
          `$e=$z.GetEntry('pass.json'); $ms=New-Object IO.MemoryStream; ` +
          `$e.Open().CopyTo($ms); $b=$ms.ToArray(); $z.Dispose(); ` +
          `$h=[BitConverter]::ToString(` +
          `[Security.Cryptography.SHA256]::Create().ComputeHash($b)).Replace('-','').ToLower(); ` +
          `Write-Output "$n|$($b.Length)|$h"`,
      ],
      { encoding: "utf8" },
    ).trim();

    const [nombres, largo, hash] = salida.split("|");
    const esperado = createHash("sha256").update(Buffer.from(contenido, "utf8")).digest("hex");

    ok(nombres === "pass.json,manifest.json", `el SO lista las entradas: ${nombres}`);
    ok(
      Number(largo) === Buffer.byteLength(contenido, "utf8"),
      `el SO extrae ${largo} bytes (esperados ${Buffer.byteLength(contenido, "utf8")})`,
    );
    ok(hash === esperado, "el SHA256 del contenido extraído coincide byte a byte");
  } catch (e) {
    ok(false, `el sistema operativo NO pudo abrir el ZIP: ${e.message}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }

  console.log("─".repeat(66));
  if (malos) {
    console.error(`⛔ EL ESCRITOR ZIP FALLA: ${malos} comprobaciones. No generes pases con esto.`);
    process.exit(1);
  }
  console.log("✅ escritor ZIP verificado");
}
