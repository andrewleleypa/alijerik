/**
 * apple-pkpass.mjs — genera el .pkpass de una tarjeta para Apple Wallet.
 *
 * QUÉ ES UN .pkpass. Un ZIP con:
 *     pass.json      el contenido y los tres colores
 *     icon*.png      OBLIGATORIO. Sin esto el pase no se agrega y falla en silencio
 *     logo*.png      la marca, arriba a la izquierda
 *     manifest.json  el SHA1 de CADA archivo anterior
 *     signature      firma PKCS#7 separada del manifest, con el certificado de Apple
 *
 * EL MURO. La firma exige un certificado Pass Type ID, y ese certificado solo se
 * obtiene con el Apple Developer Program: 99 USD al año. No hay camino gratis, no hay
 * truco, y sin firma iOS rechaza el archivo sin explicar por qué.
 *
 * POR ESO ESTE SCRIPT TIENE DOS MODOS:
 *   · CON certificados  → escribe salida/<slug>.pkpass, listo para servir
 *   · SIN certificados  → escribe salida/<slug>.sin-firmar/ con TODO menos la firma,
 *                         y sale con código 1. Nunca dice "listo" cuando no lo está.
 * El trabajo caro (estructura, imágenes, manifest, colores medidos) queda hecho hoy;
 * el día que exista el certificado son dos minutos.
 *
 * Uso:
 *   node scripts/wallet/apple-pkpass.mjs jc
 *
 *   APPLE_PASS_TYPE_ID=pass.com.alijerik.tarjeta \
 *   APPLE_TEAM_ID=XXXXXXXXXX \
 *   APPLE_PASS_CERT=scripts/wallet/secretos/pase-cert.pem \
 *   APPLE_PASS_KEY=scripts/wallet/secretos/pase-key.pem \
 *   APPLE_WWDR=scripts/wallet/secretos/wwdr.pem \
 *   APPLE_PASS_PASSWORD=... \
 *   node scripts/wallet/apple-pkpass.mjs jc
 *
 * Códigos de salida: 0 = firmado · 1 = armado SIN firmar · 2 = no pudo · 3 = error
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { crearZip } from "./zip.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "..", "..");
const ASSETS = path.join(AQUI, "assets");
const SALIDA = path.join(AQUI, "salida");

const SITIO = "https://alijerik.com";

// Apple exige los colores en rgb(); no acepta hex. Se convierte aquí y no se transcribe.
const aRgbCss = (hex) => {
  const m = String(hex).trim().match(/^#([0-9a-f]{6})$/i);
  if (!m) return null;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
};

// ── pass.json ────────────────────────────────────────────────────────────────
function construirPass(slug, t, passTypeId, teamId) {
  const colores = {
    backgroundColor: aRgbCss(t.paleta.fondo),
    foregroundColor: aRgbCss(t.paleta.tinta),
    labelColor: aRgbCss(t.paleta.etiqueta),
  };
  for (const [k, v] of Object.entries(colores)) {
    if (!v) throw new Error(`el color de '${k}' no es un hex de 6 dígitos en tarjetas.json`);
  }

  return {
    formatVersion: 1,
    passTypeIdentifier: passTypeId,
    teamIdentifier: teamId,
    serialNumber: slug,
    organizationName: t.organizacion,
    description: t.descripcion,

    logoText: t.organizacion.toUpperCase(),
    ...colores,

    // El QR lo dibuja Wallet a partir de este mensaje — NO es una imagen nuestra.
    // Consecuencia de diseño que hay que aceptar: el QR de marca (con el hueco del
    // logo) NO aparece en el pase, Apple lo pinta plano. A cambio, iOS le sube el
    // brillo a la pantalla solo y deja tocarlo para agrandarlo, que es justo lo que
    // hace falta cuando otra persona lo va a escanear.
    barcodes: [
      {
        format: "PKBarcodeFormatQR",
        message: t.qr,
        messageEncoding: "iso-8859-1",
        altText: t.qr.replace(/^https?:\/\//, ""),
      },
    ],

    generic: {
      primaryFields: [{ key: "nombre", label: "", value: t.nombre }],
      secondaryFields: [
        { key: "cargo", label: "CARGO", value: t.cargo },
        { key: "donde", label: "DÓNDE", value: t.ciudad },
      ],
      auxiliaryFields: [{ key: "whatsapp", label: "WHATSAPP", value: t.telefono }],
      backFields: (t.atras || []).map((f) => ({
        key: f.clave,
        label: f.etiqueta,
        value: f.valor,
      })),
    },
  };
}

// ── Orquestación ─────────────────────────────────────────────────────────────
const slug = process.argv.slice(2).find((a) => !a.startsWith("--")) || "jc";

let datos;
try {
  datos = JSON.parse(readFileSync(path.join(AQUI, "tarjetas.json"), "utf8"));
} catch (e) {
  console.error(`⛔ No pude leer tarjetas.json: ${e.message}`);
  process.exit(2);
}
const t = datos[slug];
if (!t) {
  console.error(`⛔ No existe la tarjeta '${slug}' en tarjetas.json`);
  process.exit(2);
}

// Las imágenes tienen que existir ANTES. Un pkpass sin icon.png se agrega mal o no se
// agrega, y iOS no dice por qué: hay que atraparlo acá, no en el teléfono.
const OBLIGATORIAS = ["icon.png", "icon@2x.png", "logo.png", "logo@2x.png"];
const faltantes = OBLIGATORIAS.filter((f) => !existsSync(path.join(ASSETS, f)));
if (faltantes.length) {
  console.error(
    `⛔ Faltan imágenes obligatorias: ${faltantes.join(", ")}\n` +
      `   Generalas con:  node scripts/wallet/gen-iconos-pase.mjs`,
  );
  process.exit(2);
}

// Marcadores que FALLAN a la vista. Nunca un id que parezca real: un identificador
// inventado con cara de válido es justo lo que se cuela a producción sin que nadie mire.
const passTypeId = process.env.APPLE_PASS_TYPE_ID || "FALTA.PASS.TYPE.ID";
const teamId = process.env.APPLE_TEAM_ID || "FALTA_TEAM";

let pass;
try {
  pass = construirPass(slug, t, passTypeId, teamId);
} catch (e) {
  console.error(`⛔ NO PUDO CONSTRUIR: ${e.message}`);
  process.exit(2);
}

// ── Armar los archivos del bundle ────────────────────────────────────────────
const archivos = [
  { nombre: "pass.json", datos: Buffer.from(JSON.stringify(pass, null, 2), "utf8") },
];
for (const f of readdirSync(ASSETS).filter((n) => n.endsWith(".png")).sort()) {
  archivos.push({ nombre: f, datos: readFileSync(path.join(ASSETS, f)) });
}

// El manifest es el SHA1 de cada archivo. Apple lo exige en SHA1 — no es una elección
// nuestra ni se puede "mejorar" a SHA256: la firma valida contra esto.
const manifest = {};
for (const a of archivos) manifest[a.nombre] = createHash("sha1").update(a.datos).digest("hex");
const manifestBuf = Buffer.from(JSON.stringify(manifest, null, 2), "utf8");

mkdirSync(SALIDA, { recursive: true });

console.log("═".repeat(74));
console.log(`APPLE WALLET · tarjeta '${slug}'`);
console.log("═".repeat(74));
console.log(`  passTypeIdentifier  ${passTypeId}`);
console.log(`  teamIdentifier      ${teamId}`);
console.log(`  serialNumber        ${slug}`);
console.log(`  QR apunta a         ${t.qr}`);
console.log(`  colores             fondo ${pass.backgroundColor} · tinta ${pass.foregroundColor} · etiqueta ${pass.labelColor}`);
console.log(`  archivos            ${archivos.length} + manifest.json`);

// ── Firma ────────────────────────────────────────────────────────────────────
const cert = process.env.APPLE_PASS_CERT;
const llave = process.env.APPLE_PASS_KEY;
const wwdr = process.env.APPLE_WWDR;
const tieneTodo = passTypeId !== "FALTA.PASS.TYPE.ID" && teamId !== "FALTA_TEAM" && cert && llave && wwdr;

if (!tieneTodo) {
  const dirSinFirmar = path.join(SALIDA, `${slug}.sin-firmar`);
  rmSync(dirSinFirmar, { recursive: true, force: true });
  mkdirSync(dirSinFirmar, { recursive: true });
  for (const a of archivos) writeFileSync(path.join(dirSinFirmar, a.nombre), a.datos);
  writeFileSync(path.join(dirSinFirmar, "manifest.json"), manifestBuf);

  console.log("\n" + "─".repeat(74));
  console.log("⚠  ARMADO PERO SIN FIRMAR. iOS RECHAZA esto — todavía no es un pase.");
  console.log("─".repeat(74));
  if (passTypeId === "FALTA.PASS.TYPE.ID") console.log("   Falta APPLE_PASS_TYPE_ID   (ej: pass.com.alijerik.tarjeta)");
  if (teamId === "FALTA_TEAM") console.log("   Falta APPLE_TEAM_ID        (10 caracteres, del portal de Apple)");
  if (!cert) console.log("   Falta APPLE_PASS_CERT      (certificado del Pass Type ID, en PEM)");
  if (!llave) console.log("   Falta APPLE_PASS_KEY       (llave privada, en PEM)");
  if (!wwdr) console.log("   Falta APPLE_WWDR           (intermedio Apple WWDR, en PEM)");
  console.log(`\n   Bundle completo menos la firma en:\n     scripts/wallet/salida/${slug}.sin-firmar/`);
  console.log("\n   Los pasos para conseguir los certificados están en scripts/wallet/README.md");
  console.log("   Recordá el costo: Apple Developer Program, 99 USD/año. No hay alternativa gratis.");
  process.exit(1);
}

const tmp = path.join(SALIDA, `.tmp-${slug}`);
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
const rutaManifest = path.join(tmp, "manifest.json");
const rutaFirma = path.join(tmp, "signature");
writeFileSync(rutaManifest, manifestBuf);

try {
  const args = [
    "smime", "-binary", "-sign",
    "-certfile", path.resolve(RAIZ, wwdr),
    "-signer", path.resolve(RAIZ, cert),
    "-inkey", path.resolve(RAIZ, llave),
    "-in", rutaManifest,
    "-out", rutaFirma,
    "-outform", "DER",
  ];
  if (process.env.APPLE_PASS_PASSWORD) args.push("-passin", `pass:${process.env.APPLE_PASS_PASSWORD}`);
  execFileSync("openssl", args, { stdio: ["ignore", "pipe", "pipe"] });
} catch (e) {
  console.error(`\n⛔ openssl no pudo firmar: ${e.stderr?.toString() || e.message}`);
  rmSync(tmp, { recursive: true, force: true });
  process.exit(2);
}

const firma = readFileSync(rutaFirma);
if (firma.length < 100) {
  console.error(`\n⛔ La firma salió de ${firma.length} bytes. Eso no es una firma PKCS#7.`);
  rmSync(tmp, { recursive: true, force: true });
  process.exit(2);
}

const pkpass = crearZip([
  ...archivos,
  { nombre: "manifest.json", datos: manifestBuf },
  { nombre: "signature", datos: firma },
]);
const destino = path.join(SALIDA, `${slug}.pkpass`);
writeFileSync(destino, pkpass);
rmSync(tmp, { recursive: true, force: true });

console.log("\n" + "─".repeat(74));
console.log("✅ FIRMADO");
console.log("─".repeat(74));
console.log(`   firma       ${firma.length} bytes (PKCS#7 DER)`);
console.log(`   .pkpass     ${pkpass.length} bytes`);
console.log(`   escrito en  scripts/wallet/salida/${slug}.pkpass`);
console.log(
  `\n   Para servirlo desde ${SITIO} hace falta la cabecera correcta:\n` +
    `     Content-Type: application/vnd.apple.pkpass\n` +
    `   Sin eso Safari lo descarga como archivo suelto en vez de abrir "Añadir a Wallet".\n` +
    `   En Cloudflare Pages eso va en el archivo _headers.`,
);
process.exit(0);
