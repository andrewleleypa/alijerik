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

## Mapa de archivos
- `index.html` — markup del hero
- `src/main.js` — bootstrap, lite, GSAP reveals, Lenis, scroll→burst
- `src/hero/Hero.js` — escena Three.js (disco, partículas, nebulosas, estrellas, fugaces, bloom, parallax)
- `src/hero/shaders.js` — GLSL (disco, partículas, estrellas, fugaces, nebulosa)
- `src/styles/main.css` — paleta, layout, tipografía, velos, modo lite
- `fonts.html` / `tormenta.html` — páginas de comparación usadas para decidir (referencia)
- `*.mjs` — herramientas de verificación (puppeteer)
