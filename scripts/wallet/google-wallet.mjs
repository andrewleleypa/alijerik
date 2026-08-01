/**
 * google-wallet.mjs — genera el enlace "Añadir a Google Wallet" de una tarjeta.
 *
 * CÓMO FUNCIONA GOOGLE WALLET, EN CUATRO LÍNEAS.
 * No se "sube" un archivo como en Apple. Se firma un JWT con la llave privada de una
 * cuenta de servicio, y ese JWT viaja DENTRO de la URL:
 *     https://pay.google.com/gp/v/save/<JWT>
 * Cuando alguien la abre en Android, Google valida la firma y guarda el pase.
 *
 * POR QUÉ ESTO NO NECESITA SERVIDOR. El JWT se firma una vez, en tu máquina, y el
 * enlace resultante es estático: se puede pegar en el HTML de un sitio en Cloudflare
 * Pages y funciona. Alijerik no tiene backend y no le hace falta uno para esto.
 *
 * ¿Y NO ES UN PROBLEMA QUE EL ENLACE SEA PÚBLICO? No. Cualquiera que lo abra guarda
 * LA TARJETA DE PRESENTACIÓN DE JC en su wallet. Eso es exactamente lo que queremos:
 * es una tarjeta de presentación, no una credencial. Lo que jamás puede ser público es
 * la LLAVE que firma (ver .gitignore).
 *
 * JWT "GORDO". Metemos la clase Y el objeto dentro del JWT, así no hay que llamar a la
 * API de Google para crear nada. A cambio el JWT crece, y una URL muy larga rompe en
 * algunos clientes: el script AVISA si se pasa del umbral.
 *
 * Uso:
 *   GOOGLE_WALLET_ISSUER=3388000000022xxxxxx \
 *   GOOGLE_WALLET_KEY=scripts/wallet/secretos/cuenta-servicio.json \
 *   node scripts/wallet/google-wallet.mjs jc
 *
 * Sin las variables construye el pase igual y lo IMPRIME sin firmar, para que se pueda
 * revisar el contenido antes de tener cuentas. No dice "listo" cuando no lo está.
 *
 * Códigos de salida: 0 = enlace firmado · 1 = construido pero SIN firmar · 2 = no pudo · 3 = error
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createSign } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "..", "..");
const SALIDA = path.join(AQUI, "salida");

const SITIO = "https://alijerik.com";
const LOGO_PUBLICO = `${SITIO}/wallet/alijerik-wallet-logo.png`;

// Umbral práctico para una URL con el JWT dentro. Por encima de esto hay clientes
// (algunos lectores de QR, algunos clientes de correo) que la parten.
const LIMITE_URL = 1800;

const b64url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const texto = (valor, idioma = "es") => ({
  defaultValue: { language: idioma, value: valor },
});

// ── Construcción del pase ────────────────────────────────────────────────────
function construir(slug, t, issuer) {
  const claseId = `${issuer}.tarjeta_presentacion`;
  const objetoId = `${issuer}.${slug}`;

  // La clase va DESNUDA a propósito. Un `classTemplateInfo` para reordenar campos
  // cuesta ~270 caracteres de JWT y el JWT viaja dentro de la URL. Se cambió por
  // dejar que Google use su disposición por defecto, que para un pase genérico con
  // código de barras ya es la correcta.
  const clase = { id: claseId };

  const objeto = {
    id: objetoId,
    classId: claseId,
    state: "ACTIVE",
    genericType: "GENERIC_TYPE_UNSPECIFIED",
    hexBackgroundColor: t.paleta.fondo,

    logo: {
      sourceUri: { uri: LOGO_PUBLICO },
      contentDescription: texto(`Marca de ${t.organizacion}`),
    },

    cardTitle: texto(t.organizacion.toUpperCase()),
    header: texto(t.nombre),
    subheader: texto(t.cargo),

    barcode: {
      type: "QR_CODE",
      value: t.qr,
      // Se muestra debajo del QR. Sirve cuando la cámara del otro no coopera.
      alternateText: t.qr.replace(/^https?:\/\//, ""),
    },

    textModulesData: [
      { id: "whatsapp", header: "WHATSAPP", body: t.telefono },
      { id: "correo", header: "CORREO", body: t.correo },
      { id: "ciudad", header: "DÓNDE", body: t.ciudad },
    ],

    linksModuleData: {
      uris: [
        { id: "whatsapp", uri: `https://wa.me/${t.telefonoE164.replace(/\D/g, "")}`, description: "Escribir por WhatsApp" },
        { id: "correo", uri: `mailto:${t.correo}`, description: "Enviar un correo" },
        { id: "tarjeta", uri: t.qr, description: "Ver la tarjeta completa" },
        { id: "eficore", uri: `${SITIO}/eficore/`, description: "Eficore — WhatsApp para equipos" },
      ],
    },
  };

  return { clase, objeto };
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

const issuer = process.env.GOOGLE_WALLET_ISSUER;
const rutaLlave = process.env.GOOGLE_WALLET_KEY;

// Sin issuer real usamos un marcador VISIBLE. Nunca un número que parezca válido:
// un id inventado con cara de real es justo lo que se cuela a producción.
const issuerEfectivo = issuer || "FALTA_ISSUER_ID";
const { clase, objeto } = construir(slug, t, issuerEfectivo);

mkdirSync(SALIDA, { recursive: true });

const payload = { genericClasses: [clase], genericObjects: [objeto] };
writeFileSync(
  path.join(SALIDA, `google-${slug}.json`),
  JSON.stringify(payload, null, 2),
  "utf8",
);

console.log("═".repeat(74));
console.log(`GOOGLE WALLET · tarjeta '${slug}'`);
console.log("═".repeat(74));
console.log(`  emisor      ${issuerEfectivo}`);
console.log(`  objeto      ${objeto.id}`);
console.log(`  QR apunta a ${t.qr}`);
console.log(`  fondo       ${t.paleta.fondo}`);
console.log(`  logo        ${LOGO_PUBLICO}`);
console.log(`\n  payload escrito en  scripts/wallet/salida/google-${slug}.json`);

if (!issuer || !rutaLlave) {
  console.log("\n" + "─".repeat(74));
  console.log("⚠  CONSTRUIDO PERO SIN FIRMAR. Esto NO es un pase utilizable todavía.");
  console.log("─".repeat(74));
  if (!issuer) console.log("   Falta GOOGLE_WALLET_ISSUER — el id de emisor de la Google Pay & Wallet Console.");
  if (!rutaLlave) console.log("   Falta GOOGLE_WALLET_KEY — ruta al JSON de la cuenta de servicio.");
  console.log("\n   Los pasos exactos para conseguir los dos están en scripts/wallet/README.md");
  process.exit(1);
}

// ── Firma ────────────────────────────────────────────────────────────────────
let cuenta;
try {
  cuenta = JSON.parse(readFileSync(path.resolve(RAIZ, rutaLlave), "utf8"));
} catch (e) {
  console.error(`\n⛔ No pude leer la cuenta de servicio en '${rutaLlave}': ${e.message}`);
  process.exit(2);
}
if (!cuenta.client_email || !cuenta.private_key) {
  console.error("\n⛔ Ese JSON no parece una cuenta de servicio: le faltan client_email o private_key.");
  process.exit(2);
}

const encabezado = { alg: "RS256", typ: "JWT" };
const cuerpo = {
  iss: cuenta.client_email,
  aud: "google",
  typ: "savetowallet",
  iat: Math.floor(Date.now() / 1000),
  origins: [SITIO],
  payload,
};

const porFirmar = `${b64url(JSON.stringify(encabezado))}.${b64url(JSON.stringify(cuerpo))}`;
const firmador = createSign("RSA-SHA256");
firmador.update(porFirmar);
const firma = b64url(firmador.sign(cuenta.private_key));
const jwt = `${porFirmar}.${firma}`;
const url = `https://pay.google.com/gp/v/save/${jwt}`;

writeFileSync(path.join(SALIDA, `google-${slug}.url.txt`), url + "\n", "utf8");

console.log("\n" + "─".repeat(74));
console.log("✅ FIRMADO");
console.log("─".repeat(74));
console.log(`   firmado por  ${cuenta.client_email}`);
console.log(`   largo de URL ${url.length} caracteres`);
if (url.length > LIMITE_URL) {
  console.log(
    `   ⚠  Pasa el umbral cómodo de ${LIMITE_URL}. DÓNDE IMPORTA Y DÓNDE NO:\n` +
      `      · como <a href> en una página  → sin problema, los navegadores la comen entera\n` +
      `      · dentro de un QR              → NO. Un QR de ~2400 caracteres queda tan denso\n` +
      `                                        que no lo lee una cámara de teléfono normal\n` +
      `      · por SMS o WhatsApp           → riesgo de que el cliente la parta; usar acortador\n` +
      `      Si algún día hace falta bajarla: crear la clase UNA vez por la API de Google y\n` +
      `      emitir un JWT flaco (solo el objeto). No hace falta todavía.`,
  );
}
console.log(`\n   Enlace escrito en  scripts/wallet/salida/google-${slug}.url.txt`);
console.log("\n   Ábrelo EN EL ANDROID (no en el escritorio) para guardarlo en Google Wallet.");
console.log("   Recordá: en modo demo solo lo pueden guardar las cuentas de prueba autorizadas.");
process.exit(0);
