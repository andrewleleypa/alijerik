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
- **`/jc` es el destino de un QR IMPRESO EN FÍSICO** (tarjetas duras de JC, 2026-07-27+).
  Romper o renombrar esa ruta rompe tarjetas que ya están en manos de gente. Misma regla
  que las URLs de Meta: no se mueve. El QR es estático y apunta directo — no hay redirector
  de por medio que salve un rename.
  Si se rediseña el sitio, preservarlas (o poner redirects y actualizar Meta DESPUÉS del
  review — nunca durante). Detalle: `eficore/docs/INFRAESTRUCTURA.md §7`.
- **`/ati` = tarjeta del Dr. Angel Inostroza, PRIMER CLIENTE de tarjetas** (2026-07-27,
  rama `feat/tarjeta-inostroza`, PROPUESTA — aún no aprobada ni impresa). La ruta es
  renombrable SOLO hasta que su QR se imprima; después aplica la misma regla que `/jc`.
  Look & feel derivado de las webs del cliente (Fraunces/Manrope, crema, carmesí/verde),
  NO de los logos que mandó (clipart IA, no reducen a tamaño QR). QR con monograma
  "AI" en trazados: `node scripts/gen-qr-ati.mjs` + `node scripts/verificar-qr.mjs`.
  Pendiente del cliente ANTES de entregar: correo, número personal para la vCard, cómo
  firma, foto en alta autorizada; y quitar el conmutador de acento (marcado en el HTML).

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

## ⭐ 2026-07-27 — Tarjetas digitales con QR: línea de negocio nueva (sesión completa)

> Rama `feat/tarjetas-qr`, 8 commits, mergeada a `main` al cierre. Escrito para alguien
> que no estuvo aquí. Los caminos falsos están porque ahí es donde se pierde el tiempo
> la segunda vez.

### Qué se construyó y por qué

Producto nuevo para vender desde el sitio: **tarjetas de presentación digitales con QR,
como servicio a medida** (no plataforma self-service). Nace de la tarjeta que se le hizo
a Arias Design; esta vez con estructura de precio corregida — se cobra el **diseño**
(lo escaso), no el hosting (que cuesta $0 en Pages). Precios públicos: $180 único +
$60/año · $350 + $90 · $600 + $180 (equipo ≤5). El competidor real es Kolor Media
(cotización, no publica precio), NO Tu Contacto Panamá ($25/año, plantilla) — contra
plantillas de $25 esa pelea se pierde. Análisis completo: `docs/KEYWORDS-TARJETAS.md`.

- **`/tarjetas/`** — página de venta. Fórmula de `docs/LENGUAJE-VISUAL.md` con look
  cósmico de Alijerik (NO cappuccino: eso es Eficore). Motivos = el patrón localizador
  del propio QR. Cero JS, JSON-LD `Service`+`FAQPage`+`BreadcrumbList`.
- **`/jc`** — la tarjeta real de JC. Es el destino del QR impreso Y el demo vivo que
  `/tarjetas/` usa como prueba ("esto no es una maqueta"). Su pie vende: "Esta tarjeta
  es el producto → Quiero una así". Cargo: **Fundador** (decidido por JC — y es literal:
  Ali de Alicia su madrina, Je de Jean, rik de Erika su esposa).
- **QR para imprenta** — `public/alijerik-qr.svg` (+variantes), nivel H, marca al centro
  (~7% del área), URL corta a propósito (`/jc` → versión 3, 29×29 módulos). Generado por
  `scripts/gen-qr.mjs` (estático, sin redirector de terceros que pueda morir).
  **Verificado decodificando de verdad**: `scripts/verificar-qr.mjs`, 15/15 a los px que
  una cámara captura de un QR de 2 cm.
- **Portada reestructurada** — el hero NO se tocó (la secuencia canvas es la excepción
  documentada). Los 3 paneles de abajo tenían la misma silueta (la firma de IA); ahora:
  01 franja a sangre con captura real · 02 bloque asimétrico QR+tarjeta · 03 banda de
  contacto con ícono arriba.
- **`/eficore/` ganó su `<h1>`** (no tenía NINGUNO, siendo prioridad 1.0 del sitemap).
  Sin cambiar un píxel: se promovió el heading de la primera sección de producto y los
  demás h3→h2. El look cappuccino intacto.
- **Renovaciones** — `docs/RENOVACIONES.md` + `renovaciones.json` + alarma ejecutable
  `scripts/renovaciones.mjs`. Arias Design: inicio 2026-07-17, vence 2027-07-17.
  ⚠️ JC: falta el evento de calendario (~17-jun-2027) que dispare correr el script.
- **Firma de correo** — `docs/firma-correo.html`. Sin QR (nadie escanea su propia
  pantalla) y sin imágenes (Outlook/Gmail las bloquean por defecto).

### Caminos falsos de esta sesión (no repetirlos)

1. **El h1 de `/eficore/` casi va al hero** — donde "suena" el título. Pero `.stage-text`
   lleva `opacity:0` revelado por GSAP: habría sido un h1 invisible, peor que ninguno.
   Va en `<main>`. Los 6 "ocultos" que el verificador reporta en `/eficore/` son eso
   mismo y son ESTRUCTURALES: textos `position:fixed` superpuestos que se revelan por
   scrub; mostrarlos a .3 apilaría 4 bloques encima del canvas. No "arreglarlos".
2. **`gsap.from` + ScrollTrigger deja el contenido invisible AL CARGAR** (immediateRender).
   El comentario viejo de `main.js` juraba lo contrario. La portada tenía 38 elementos
   con texto en opacidad efectiva 0. Arreglo: `fromTo` con piso `.3`. Y en CSS,
   `[data-reveal]` también arranca en `.3` — el rescate `.no-anim` solo cubría
   reduced-motion, no un JS caído.
3. **Medir bordes con `getBoundingClientRect()` del elemento da falsos positivos**: la
   caja incluye su propio padding (un pie de foto con padding-left:20 reporta left:0).
   Lo correcto: `Range.selectNodeContents` + su rect. Documentado en LENGUAJE-VISUAL.
4. **El shorthand `padding` que anula `.wrap`** — estaba EN PRODUCCIÓN en las 2 páginas
   AEO (texto pegado al borde en móvil, invisible en desktop por el max-width).
   Trampa #3 de LENGUAJE-VISUAL con su regla longhand.
5. **El primer arreglo del correo desbordado fue el equivocado**: `min-width:0` +
   `overflow-wrap` partía `contacto@alijer/ik.com`. La causa real: el ícono en fila
   robaba ~60px. Arreglo de fondo: ícono ARRIBA en la banda.
6. **Doble marco blanco del QR**: el SVG ya trae zona silenciosa de 4 módulos; el CSS
   le sumaba padding blanco. Se quita el del CSS, JAMÁS el del SVG (se escanea desde
   pantallas y es lo que se imprime).
7. **Dirección**: fuera de `/jc` y del `.vcf` (es un apartamento; la tarjeta se guarda
   en agendas de desconocidos). SE QUEDA en portada, JSON-LD de `/tarjetas/` y las 3
   legales — contra eso verifica Meta. Ojo: al quitarla hubo que RE-CAPTURAR
   `tarjeta-jc-movil.jpg` y corregir width/height declarados (780×1794→780×1688).
8. **PowerShell bloquea `npx`** (ExecutionPolicy). Usar Git Bash, o
   `node node_modules\vite\bin\vite.js`, o `Set-ExecutionPolicy -Scope CurrentUser
   RemoteSigned` (decisión de JC, afloja un control).

### Cómo verificar (todo reproducible)

```bash
npm run build && npx vite preview --port 4318 --strictPort
node scripts/verificar-rutas.mjs   # 9 rutas × 2 anchos: desborde, h1, opacidad EFECTIVA
node scripts/verificar-qr.mjs      # decodifica los 3 SVG a 5 tamaños (15/15)
node scripts/renovaciones.mjs      # a quién hay que cobrarle
node scripts/capturar-tarjeta.mjs  # re-captura /jc para /tarjetas/ (dev server 4319)
```

### Lo que NO se hizo (deliberado)

- **Plataforma SaaS self-service**: diferida CON número — a $60/año se necesitan 400
  clientes para el MRR que 51 de Eficore dan. Disparador para reconsiderar: **10
  tarjetas vendidas en un trimestre**.
- **Avisos de renovación a WhatsApp/correo**: `docs/BACKLOG.md §1` — es el MISMO
  problema que el inventario de dependencias; resolverlos juntos.
- **Susurro "Tarjeta por Alijerik" en la tarjeta de Arias**: diferido por JC (27-jul).
  No ejecutar sin su decisión — fue un regalo, el branding retroactivo se pregunta.
- **Impresión física de prueba**: pendiente de JC — imprimir UNA y escanearla con 3
  teléfonos antes de mandar el lote.
- **Search Console/Bing**: JC envía `/tarjetas/` y `/jc` tras el deploy.
- Enlace a `/tarjetas/` desde el pie de `/eficore/` (menor, BACKLOG §3).

## ✅ EN VIVO — Página de producto Eficore (`alijerik.com/eficore/`)
- Hero: scroll-scrub de metraje real de latte art (176 cuadros, public/eficore-seq/,
  licencia libre ver FUENTE.md) + autoplay en reposo. Hero 01 3D descartado (historial git).
- Secciones: capturas reales (paper+espresso, desktop+cel), 4 features Phosphor duotone,
  video demo 47.7s editado con ffmpeg (pipeline reproducible en video-cards/), CTA WhatsApp.
- APROBADO POR JC y mergeado a main 2026-07-19.
- Ruta nueva `/eficore/` (aditiva — las rutas legales de Meta intactas).
- Preview: push a la rama → Cloudflare Pages genera URL de preview del branch.
- Plan completo acordado en sesión 2026-07-19: 3 actos (elaboración → revelación →
  inmersión estilo Mercury), tiempo real Three.js, pre-render de plan B.
