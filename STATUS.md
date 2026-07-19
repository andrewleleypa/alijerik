# ALIJERIK — Estado del proyecto

> Handoff para retomar. Sesión 1 cerrada por límite de tokens. Continuamos mañana.

## ⚠️ LEER PRIMERO (actualizado 2026-07-14)

- **Hosting REAL: Cloudflare Pages conectado a este repo — push a `main` = deploy automático
  a `alijerik.com`.** Toda mención a "deploy a Railway" más abajo en este archivo quedó
  OBSOLETA (era el plan viejo; se decidió Pages y se desplegó 2026-06-28+).
- **Las páginas legales de este sitio son un requisito VIVO del App Review de Meta** para la
  app "Eficore" (App ID 1478069710303881). URLs registradas en Meta → Configuración Básica:
  - `/privacidad/` — política de privacidad
  - `/condiciones/` — condiciones del servicio (agregada 2026-07-14, commit `89551d5`)
  - `/eliminacion-de-datos/` — instrucciones de eliminación de datos
  **Mover, renombrar o romper esas rutas rompe la config de Meta sin que nada truene aquí.**
  Si se rediseña el sitio, preservarlas (o poner redirects y actualizar Meta DESPUÉS del
  review — nunca durante). Detalle: `eficore/docs/INFRAESTRUCTURA.md §7`.

## Qué es
Landing one-page para Alijerik (IT, M365, desarrollo, seguridad — Panamá).
Concepto: tecnología como fuerza natural que **impulsa** la dirección del cliente.
Hero = agujero negro cósmico. El resto de secciones aparecen al scrollear.

## Stack
Three.js + GSAP + Lenis + Vite (vanilla JS). Toda la física de partículas corre en GPU (shaders).

## Cómo correr
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/
```
Verificación visual/perf (GPU real, requiere dev server arriba):
```bash
node shot.mjs       # captura  (URL=, OUT=, WAIT= por env)
node measure.mjs    # FPS real + renderer
node closeup.mjs    # zoom del headline
```

## ✅ HECHO — Hero (sección 1) completo
- Agujero negro: disco de acreción (shader fbm), núcleo oscuro, ~18k partículas espiralando (física en vertex shader), bloom, respiración, parallax de mouse, burst al scrollear.
- Fondo profundo: nebulosas de polvo cósmico (shader fbm, 3, color/posición aleatorios por carga), estrellas con parpadeo orgánico, estrellas fugaces.
- Fallback **lite** automático (red 2g / prefers-reduced-motion / watchdog 3s → gradientes CSS).
- Detección de presupuesto de partículas por `deviceMemory`.

## 🔒 Decisiones cerradas (no re-litigar)
- **Wordmark ALIJERIK**: fuente **Orbitron 900**. Tratamiento **gradiente cósmico** (blanco→cian) — idea de Erika, se ve cohesivo con las nebulosas. *(Pendiente confirmación final de JC/Erika mañana, pero aplicado.)*
- **Headline**: `TU VISIÓN NOS IMPULSA / A NUEVAS FRONTERAS` en **blanco sólido**. Wording elegido por JC: la visión del cliente es el impulso a nuevas fronteras (NO "somos una tormenta contra ti" — eso sonaba adversarial).
- **Nebulosas**: les encantan. **NO tocar** por ahora (ni para optimizar) sin avisar.
- Logo PNG coral (`public/logo.png`) es placeholder, intercambiable. La marca/logo definitivo se trabaja aparte (no se cierra con IA raster).

## ⏳ PENDIENTE — próxima sesión
1. **Manifiesto (sección 2)** — siguiente a construir. Copy en `alijerik-blueprint.md`.
2. Luego: Servicios → WhiteShield → Contacto → Footer (todas en el mismo one-page).
3. **Perf**: FPS midió 60 en frío y bajó a ~43 en mediciones sucesivas → **throttling térmico** de la Intel Iris Xe por testeo repetido, no el código. Pendiente **medir en frío**. Si hace falta, optimizar el shader de nebulosa (fbm caro) — pero JC dijo no tocar nebulosas aún.
4. **Deuda menor**: `dispose()` no libera geometrías/materiales (leak si se desmonta el hero; hoy irrelevante). Mover `puppeteer-core` a `devDependencies`.

## ⭐ 2026-06-28 — Publicar para verificación de Meta (NUEVA prioridad)
El sitio ahora tiene un propósito de negocio urgente: **soporta la verificación de Meta de Alijerik
como Tech Provider** (para Eficore). Meta puede revisar el dominio + que el negocio exista → hay que
**publicar** con info real.

### 🚀 DESPLEGADO Y VIVO (2026-06-28) — `alijerik.com` PÚBLICO en Cloudflare Pages
- **DNS migrado a Cloudflare** (registrar sigue en Namecheap; solo se cambiaron nameservers a
  `denver`/`marge.ns.cloudflare.com`). Se copiaron TODOS los records (eficore CNAME en GRIS, MX
  privateemail, SPF/DKIM `default` y `resend`, DMARC, `_railway-verify`, send.mfa SES). **App de
  Eficore y correo VERIFICADOS intactos** (OTP llega, `eficore.alijerik.com` → 303 login).
- **Web en Cloudflare Pages** (proyecto `alijerik`, repo `andrewleleypa/alijerik`, build
  `npm run build`, output `dist`). Vive en `alijerik.pages.dev` Y en **`alijerik.com`** (apex 200,
  título correcto, `/privacidad/` y `/eliminacion-de-datos/` 200). `www` tardó un poco (522 transitorio).
- Doc completo: `docs/DEPLOY-CLOUDFLARE.md`.
- **PENDIENTE en Meta (JC):** verificación de dominio (meta-tag en `<head>`, placeholder listo) +
  actualizar las URLs legales de la app a `alijerik.com/privacidad` y `/eliminacion-de-datos`.
- Menor: `/noexiste` da 200 (soft-404 de Pages) — afinar con not_found_handling/404 si se quiere.
- Fase 4 (capa 1 de la app): proxiar `eficore` tras CF (naranja) + WAF, antes de la clínica. El origen
  `*.up.railway.app` HOY NO está oculto (eficore en gris) — eso se logra recién en Fase 4.

### ✅ HECHO (sesión 2026-06-28, build verificado `npm run build` OK)
Se construyeron las secciones de contenido bajo el hero, fieles al concepto cósmico/terminal
(NO look de IA genérico): **índices de misión 01/02 + rail de plasma + paneles flotantes con
profundidad estilo Eficore + íconos Phosphor duotone inline**.
- **Hero CTAs arreglados:** `[ CONOCER EFICORE ]`→`#eficore`, `[ CONTACTO ]`→`#contacto`
  (ya NO apuntan a las secciones inexistentes `#servicios`/`#whiteshield`). [index.html]
- **Sección 01 · EFICORE** (`#eficore`): eyebrow "// PRODUCTO · OPERADO POR ALIJERIK", título,
  lead, y **card flotante** (ícono chats-circle + "Eficore" + `eficore.alijerik.com`) que abre
  `https://eficore.alijerik.com` en pestaña nueva.
- **Sección 02 · CONTACTO** (`#contacto`): 3 canales con Phosphor duotone —
  WhatsApp **+507 6926-4937** (`wa.me/50769264937`, CONFIRMADO por JC = el número real de Eficore,
  `phone_number_id=1169340419595588`), correo **contacto@alijerik.com** (`mailto:`),
  y ubicación **PH Torres de Monserrat, Apto 2B, Pueblo Nuevo, Ciudad de Panamá**.
- **Footer:** wordmark ALIJERIK + línea **"Eficore es un producto de Alijerik"** (con glyph) +
  links a **Privacidad** y **Eliminación de datos** (a `eficore.alijerik.com/privacidad` y
  `/eliminacion-de-datos`) + © 2026.
- **Reveals al scrollear** en `main.js` (`initSectionReveals`, `gsap.from` + ScrollTrigger):
  patrón SEGURO — el contenido es visible por defecto en CSS, el JS solo lo anima; si el JS falla
  el contenido NO desaparece (importante: la página la va a revisar Meta).
- Placeholder en `<head>` de index.html: comentario `META DOMAIN VERIFICATION` donde JC pega el
  `<meta name="facebook-domain-verification" ...>` que da Business Manager.
- Íconos Phosphor inline en index.html (whatsapp-logo, envelope-simple, map-pin, arrow-up-right,
  chats-circle), todos duotone, `class="ic"`, `currentColor`. Carpeta `src/icons/` quedó vacía
  (se inlinearon directo en el HTML, no se usó archivo).

### ⏳ SIGUE — al retomar (incl. después de cambiar de cuenta de Claude)
1. ✅ **VERIFICADO EN BROWSER (2026-06-28, headless Chrome, desktop 1440 + móvil 390):** las 2
   secciones + footer se ven bien en ambos, WebGL renderiza (no cae a lite), **0 errores de JS**
   (solo un 404 cosmético, probablemente favicon — agregar uno al desplegar). La card de Eficore
   envuelve bien en móvil. NO se probó manualmente el scroll suave de los anchors con Lenis al hacer
   clic (riesgo abierto): si al clic en los CTAs no baja suave, interceptar y usar `lenis.scrollTo()`.
2. ✅ **Alias `contacto@alijerik.com` y `privacidad@alijerik.com` YA existen** (JC, 2026-06-28).
3. ✅ **PÁGINAS LEGALES PORTADAS AL SITIO (opción B, decidida 2026-06-28):** `/privacidad/` y
   `/eliminacion-de-datos/` ahora son canónicas en alijerik.com (contenido Ley 81 verbatim de
   Eficore `app/main.py`, re-estilizado al tema cósmico). Vite multipágina (`vite.config.js`),
   footer apunta a las locales. **Verificado en local** (`npx serve dist`): todas 200 (con y sin
   slash), /noexiste 404, favicon 200. **JC va a cambiar las URLs en Meta a `alijerik.com/privacidad`
   y `/eliminacion-de-datos`** (decidió actualizarlas en vez de redirect; el redirect desde el
   subdominio queda como cortesía OPCIONAL, no se hizo). Hacerlo ANTES de mandar el App Review.
4. **DEPLOY a Railway (pendiente, NECESITA MANOS DE JC):** el repo ya está deploy-ready —
   `npm run build` → `npm start` (`serve dist -l $PORT`, `serve` ya en deps). Pasos: (a) `railway
   login` (browser, interactivo — Claude no puede) o conectar el repo `andrewleleypa/alijerik` en
   el dashboard de Railway; (b) **DNS del APEX `alijerik.com`** — ⚠️ SNAG REAL: Namecheap NO soporta
   ALIAS/ANAME en el apex; opciones = usar `www.alijerik.com` (CNAME→Railway) + redirect apex→www,
   o mover el DNS a Cloudflare (CNAME flattening; JC ya usa CF para R2). Decidir esto fija la URL
   que va en Meta. (c) verificación de dominio de Meta (meta-tag, placeholder ya en `<head>`).
   NOTA ASESOR: para un sitio estático, Railway corre un contenedor 24/7 (algo desperdiciado);
   Vercel o Cloudflare Pages serían gratis + apex + URLs limpias automáticas. JC eligió Railway por
   consistencia con Eficore — respetado, pero queda anotado.
5. **Plan de JC para cuando vuelva (con correcciones):** probar números para el multitenant (Eficore,
   independiente) + hacer la **verificación del NEGOCIO**. ⚠️ CORRECCIÓN: la verificación de negocio
   NO depende de que la web "propague un par de horas" — eso destraba la **verificación de DOMINIO**
   (meta-tag) y los checks de URL del App Review. La **verificación de negocio** la gatea el
   **registro legal (~15 días)** + documentos que coincidan (Aviso de Operación/RUC). Si el registro
   no está listo, la verificación de negocio se traba aunque la web esté viva.
6. Opcional: swap del logo placeholder `public/logo.png` por el real
   (`OneDrive/Desktop/logo_alijerik.png`). Favicon cósmico propio YA hecho (`public/favicon.svg`).

### Datos LOCKED
- **Dirección oficial (del recibo):** PH Torres de Monserrat, Apto 2B, Pueblo Nuevo, Ciudad de
  Panamá, Panamá.
- **Email:** contacto@alijerik.com (JC lo creará).
- **Teléfono:** **+507 6926-4937** — CONFIRMADO, es el número real/principal que Eficore ya usa
  (cambió el plan viejo del "chip nuevo": se reusa este para sitio + verificación = coincide con
  la WABA registrada en Meta). El de prueba sandbox (+1 555-667-5094) NO se usa.
- **Hosting:** Railway (como Eficore).
- **Logos reales:** `OneDrive/Desktop/logo_alijerik.png` y `logo_alijerik_noslogan.png`.
- Contexto completo del Tech Provider: `eficore/docs/PLAN-tech-provider-onboarding.md` + memoria
  `project-alijerik-meta-techprovider`. Recordatorio: la página es necesaria pero NO suficiente —
  la verificación de negocio la gatea el registro legal (~15 días) + docs que coincidan.

## Mapa de archivos
- `index.html` — markup del hero
- `src/main.js` — bootstrap, lite, GSAP reveals, Lenis, scroll→burst
- `src/hero/Hero.js` — escena Three.js (disco, partículas, nebulosas, estrellas, fugaces, bloom, parallax)
- `src/hero/shaders.js` — GLSL (disco, partículas, estrellas, fugaces, nebulosa)
- `src/styles/main.css` — paleta, layout, tipografía, velos, modo lite
- `fonts.html` / `tormenta.html` — páginas de comparación usadas para decidir (referencia)
- `*.mjs` — herramientas de verificación (puppeteer)

## 🚧 EN CURSO — Página de producto Eficore (rama `eficore-page`)
- Hero 3D cappuccino: jarra de acero (Alijerik) + taza + corazón de la marca formándose
  en la espuma. Prototipo 01 aprobación pendiente de JC. NO tocar main hasta cerrar.
- Ruta nueva `/eficore/` (aditiva — las rutas legales de Meta intactas).
- Preview: push a la rama → Cloudflare Pages genera URL de preview del branch.
- Plan completo acordado en sesión 2026-07-19: 3 actos (elaboración → revelación →
  inmersión estilo Mercury), tiempo real Three.js, pre-render de plan B.
