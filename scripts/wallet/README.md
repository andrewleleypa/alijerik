# Tarjetas en el wallet del teléfono

> La tarjeta digital, guardada en Apple Wallet o Google Wallet como si fuera una de
> crédito. Se muestra desde el bolsillo y el otro la escanea.
>
> Creado el 2026-08-01.

---

## La verdad incómoda, primero

**Apple cobra 99 USD al año y no hay forma de saltárselo.** Un `.pkpass` tiene que ir
firmado con un certificado que solo emite Apple a miembros del Developer Program. Sin
firma, iOS lo rechaza y no dice por qué. No hay API abierta, no hay plan gratuito, no
hay truco.

**Google es gratis** pero pide cuenta de emisor aprobada y arranca en **modo demo**:
solo las cuentas que agregues como prueba pueden guardar el pase hasta que pidas acceso
de producción.

Por eso el orden es Google primero.

### Esto no se construye para una persona

A 99 USD/año, poner la tarjeta de una sola persona en Apple Wallet es un mal negocio.
Como **feature del producto de tarjetas**, a 10 tarjetas vendidas son 10 USD por tarjeta
al año, y es un diferenciador que la competencia self-service de plantilla no ofrece.
Por eso todo acá está parametrizado por persona desde el primer commit: `tarjetas.json`
tiene una entrada por tarjeta y los generadores no saben nada de JC en particular.

---

## Qué hay acá

| Archivo | Qué hace |
|---|---|
| `tarjetas.json` | **Fuente única.** Datos y paleta de cada tarjeta. Todo lo demás lee de acá. |
| `medir-escalera-pase.mjs` | Mide el contraste de los 3 colores del pase. **Trae autoprueba.** |
| `gen-iconos-pase.mjs` | Rasteriza la marca a los PNG de cada wallet. |
| `google-wallet.mjs` | Arma y firma el enlace "Añadir a Google Wallet". |
| `apple-pkpass.mjs` | Arma y firma el `.pkpass`. |
| `zip.mjs` | Escritor ZIP sin dependencias. **Trae autoprueba.** |

Los tres primeros corren sin cuentas de nada. Los generadores corren igual sin
credenciales, pero **salen con código 1 y dicen "SIN FIRMAR"** — nunca reportan éxito
sobre algo que no funciona.

### Orden de trabajo

```bash
node scripts/wallet/zip.mjs --autoprueba          # el escritor ZIP no miente
node scripts/wallet/medir-escalera-pase.mjs       # los colores pasan AA y la escalera se sostiene
node scripts/wallet/gen-iconos-pase.mjs           # las imágenes
node scripts/wallet/google-wallet.mjs jc          # el enlace de Google
node scripts/wallet/apple-pkpass.mjs jc           # el .pkpass
```

---

## Google Wallet — los pasos (gratis)

1. **Google Cloud Console** → crear proyecto (o reusar uno).
2. Habilitar la **Google Wallet API** en ese proyecto.
3. **Cuenta de servicio** → crear → **crear llave JSON** → descargar.
   Guardarla en `scripts/wallet/secretos/` (ya está en `.gitignore`).
   🔴 Esa llave firma tarjetas a nombre de Alijerik. Filtrada, cualquiera emite con
   nuestra marca.
4. **Google Pay & Wallet Console** (`pay.google.com/business/console`) → registrarse
   como emisor → anotar el **Issuer ID** (un número largo).
5. En esa consola, dar acceso al **correo de la cuenta de servicio** del paso 3.
6. **Modo demo:** agregar tu propia cuenta de Google a la lista de cuentas de prueba.
   Sin esto el enlace no guarda nada y no explica por qué.
7. Generar:
   ```bash
   GOOGLE_WALLET_ISSUER=<el número del paso 4> \
   GOOGLE_WALLET_KEY=scripts/wallet/secretos/cuenta-servicio.json \
   node scripts/wallet/google-wallet.mjs jc
   ```
8. Abrir el enlace **en el Android**, no en el escritorio.

⚠️ El logo lo **descarga Google** desde `alijerik.com/wallet/`. Tiene que estar
publicado antes de que el pase funcione — no se sube con el pase.

---

## Apple Wallet — los pasos (99 USD/año)

1. **Inscribirse al Apple Developer Program.** Como *individuo* es más rápido; como
   *organización* piden número D-U-N-S y tarda más. La aprobación **no es instantánea**.
2. **Certificates, IDs & Profiles → Identifiers → Pass Type IDs** → crear
   `pass.com.alijerik.tarjeta`. Anotar también el **Team ID** (10 caracteres).
3. Generar la solicitud de certificado y la llave:
   ```bash
   MSYS_NO_PATHCONV=1 openssl req -new -newkey rsa:2048 -nodes \
     -keyout scripts/wallet/secretos/pase-key.pem \
     -out scripts/wallet/secretos/pase.csr \
     -subj "/CN=Alijerik-Pass-Type-ID/C=PA"
   ```
   ⚠️ En Git Bash, `MSYS_NO_PATHCONV=1` es obligatorio o el `/CN=` se convierte en una
   ruta de Windows y openssl falla sin escribir el certificado. Ya mordió acá.
4. Subir el `.csr` a Apple → descargar el `.cer` → pasarlo a PEM:
   ```bash
   openssl x509 -inform DER -in pass.cer -out scripts/wallet/secretos/pase-cert.pem
   ```
5. Descargar el intermedio **Apple WWDR** de `apple.com/certificateauthority/` y
   pasarlo a PEM igual que arriba, como `secretos/wwdr.pem`.
6. **Anotar la fecha de vencimiento real** y llevarla a `docs/renovaciones.json`:
   ```bash
   openssl x509 -enddate -noout -in scripts/wallet/secretos/pase-cert.pem
   ```
   No suponer 12 meses: leerlo.
7. Generar:
   ```bash
   APPLE_PASS_TYPE_ID=pass.com.alijerik.tarjeta \
   APPLE_TEAM_ID=<tu team id> \
   APPLE_PASS_CERT=scripts/wallet/secretos/pase-cert.pem \
   APPLE_PASS_KEY=scripts/wallet/secretos/pase-key.pem \
   APPLE_WWDR=scripts/wallet/secretos/wwdr.pem \
   node scripts/wallet/apple-pkpass.mjs jc
   ```
8. Copiar el `.pkpass` a `public/wallet/` y desplegar. La cabecera
   `Content-Type: application/vnd.apple.pkpass` ya está puesta en `public/_headers`;
   sin ella Safari descarga un ZIP en vez de abrir "Añadir a Wallet".

---

## Decisiones que ya se tomaron, para no rediscutirlas

**El QR del pase apunta a `alijerik.com/jc`, igual que el plástico.** No lleva un vCard
embebido: un vCard completo sube mucho la cuenta de módulos y el umbral medido para el
hueco del logo (r=6.33 módulos decodifica, 6.66 muere) deja de valer. Además un vCard
impreso no se actualiza nunca; una URL sí.

**El QR de marca NO aparece en el pase.** Los dos wallets dibujan el código ellos
mismos a partir del texto — plano, sin el hueco del logo. A cambio iOS le sube el brillo
a la pantalla solo y deja agrandarlo tocándolo, que es justo lo que hace falta cuando
otra persona lo va a escanear. Se aceptó el intercambio.

**Los colores están medidos, no elegidos a ojo:** tinta 17.77:1, etiqueta 13.17:1,
escalera 1.35× entre los dos niveles. El medidor lo reproduce.

**Que la etiqueta sea plasma y no lava es decisión estética, no de cumplimiento.** Lava
también pasa (5.71:1, escalera 3.11×, medido con `--probar`). Queda fuera porque en
`/jc/` el lava es el color de la única acción de la página, y un pase no tiene acción
que pulsar.

**El enlace de Google es público a propósito.** Cualquiera que lo abra guarda la tarjeta
de presentación de JC. Eso es lo que queremos: es una tarjeta, no una credencial. Lo que
nunca puede ser público es la llave que firma.

**Sin `webServiceURL`.** Los pases actualizables (que se refrescan solos cuando cambia
un dato) exigen un servidor con endpoints de registro. Alijerik no tiene backend y esto
no lo justifica: si cambia un teléfono, se regenera el pase.

---

## Lo que falta para que esto exista de verdad

- [ ] Cuenta de emisor de Google + cuenta de servicio → enlace firmado
- [ ] Publicar `public/wallet/` (Google descarga el logo desde ahí)
- [ ] Probarlo en el Android y **mirarlo**: el medidor mide luminancia, no saturación
- [ ] Botones "Añadir a…" en `/jc/index.html` — **no se tocan hasta tener enlaces reales**,
      es una página en producción y el destino del QR ya impreso
- [ ] Apple: 99 USD/año, cuando se decida
