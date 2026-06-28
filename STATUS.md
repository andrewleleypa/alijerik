# ALIJERIK — Estado del proyecto

> Handoff para retomar. Sesión 1 cerrada por límite de tokens. Continuamos mañana.

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
2. **JC: crear el alias `contacto@alijerik.com`** ANTES de que el sitio esté público (si rebota, peor
   que no ponerlo). Igual para `privacidad@alijerik.com` (pendiente de antes).
3. **DEPLOY a Railway:** servir el build estático (`dist/`) + DNS de `alijerik.com`
   (+ verificación de dominio de Meta vía meta-tag en el head o TXT en DNS).
4. Opcional: swap del logo placeholder `public/logo.png` por el real
   (`OneDrive/Desktop/logo_alijerik.png`).

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
