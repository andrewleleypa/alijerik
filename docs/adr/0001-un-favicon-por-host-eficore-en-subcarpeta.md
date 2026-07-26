# ADR 0001 — Un favicon por host: en resultados de Google, `/eficore/` muestra el agujero negro

**Estado:** Aceptada · 2026-07-26
**Revisión programada:** **26 de octubre de 2026** (3 meses) — criterios abajo.
**Liga con:** [`docs/DEPLOY-CLOUDFLARE.md`](../DEPLOY-CLOUDFLARE.md) (Pages + DNS) ·
`eficore/docs/aeo/BASELINE-2026-07.md` en el repo de Eficore (visibilidad en asistentes de IA).

## Contexto

Buscando **"eficore panama"** desde el celular, los dos resultados de `alijerik.com` salían con el
**globo genérico** de Google en vez de un icono propio. La pregunta original fue: *¿cómo hago que
salga la taza para Eficore y el agujero negro para Alijerik?*

Hay dos problemas distintos ahí, y solo uno tiene arreglo.

### 1. La regla de Google: un favicon por host, tomado de la portada

De la documentación oficial ([Favicon in Search](https://developers.google.com/search/docs/appearance/favicon-in-search),
actualizada 2026-02-04), textual:

> *Google Search only supports one favicon per site, where a site is defined by the hostname.*
>
> - Supported: `https://example.com` (this is a domain-level home page)
> - Supported: `https://news.example.com` (this is a subdomain-level home page)
> - **Not supported: `https://example.com/news` (this is a subdirectory-level home page)**

Nuestro caso es literalmente el tercer renglón. `alijerik.com/eficore/` es una **subcarpeta**, no un
host. Google toma el favicon de la portada de `alijerik.com/` y lo usa para **todos** los resultados
de ese host. No existe forma de tener taza en unos resultados y agujero negro en otros dentro del
mismo dominio, con ningún truco de etiquetas.

La pestaña del navegador sí es por página — ahí la taza sale bien. Es solo la búsqueda la que
colapsa todo a un icono.

### 2. La cañería estaba rota, y eso sí era arreglable

Verificado contra el sitio en vivo antes de tocar nada:

```
curl -sI https://alijerik.com/favicon.ico
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8     ← devolvía el index.html
```

Dos fallas sumadas:

- **`/favicon.ico` caía en el fallback de Cloudflare Pages**: una ruta inexistente no da 404, da
  **200 con el `index.html`**. El rastreador de iconos de Google pide justo esa ruta como respaldo y
  recibía HTML.
- **Solo había favicons en SVG.** Google lo soporta, pero la doc pide un cuadrado de mínimo 8×8 y
  **preferiblemente mayor a 48×48**; el respaldo rasterizado no existía en ningún tamaño.

Y una tercera, encontrada de paso: el `apple-touch-icon` de las páginas de Eficore apuntaba al
**SVG**, que **iOS no soporta**. Al instalar el sitio en un iPhone salía icono genérico — contradice
directamente el objetivo de "instalable" del producto.

### 3. Hallazgo del mismo día: `eficore.io` ya existe, y es de rubro vecino

Al revisar dominios apareció que **`eficore.com` y `eficore.io` no están disponibles**. `eficore.io`
está vivo (Netlify), se llama **EfiCore**, y se describe como:

> *"EfiCore builds custom AI-powered setters and automation systems that improve operations, connect
> systems and accelerate revenue."*

No es un rubro lejano: *AI-powered setters* es automatización de mensajería comercial. **Esto no lo
decide este ADR**, pero queda registrado porque toca dos cosas de golpe: la opción "dominio propio
para Eficore" pierde a los dos candidatos obvios, y la estrategia AEO —salir citados cuando alguien
le pregunta a un asistente por la categoría— compite ahora con un homónimo de categoría vecina que
publica en inglés. Ver *Riesgos abiertos*.

## Decisión

1. **Se repara la cañería del favicon y se acepta que el agujero negro es el icono de TODO
   `alijerik.com`**, resultados de `/eficore/` incluidos.
2. **Eficore se queda en subcarpeta** (`alijerik.com/eficore/`). No se mueve a
   `eficore.alijerik.com` ni a dominio propio **por ahora**.
3. **La taza sobrevive donde sí se puede**: pestaña del navegador, icono instalado en iOS/Android, y
   lista para el día que Eficore tenga host propio (los `.ico` y PNG ya están generados).
4. **Se revisita el 26 de octubre de 2026** con los criterios de abajo.

### Por qué no se mueve el host ahora

El argumento clásico para quedarse en subcarpeta —*"la subcarpeta hereda la autoridad del
dominio"*— **aquí no aplica**: el baseline AEO de julio 2026 midió **cero menciones en 20 respuestas
de IA** y el dominio no tiene autoridad que heredar. Técnicamente, mover ahora es **barato**: tres
páginas, horas de indexado, nada que perder.

La razón de no hacerlo es de **prioridad, no técnica**: una migración de host es una mañana de
trabajo más semanas de reindexado, y el cuello de botella del negocio esta semana es el outbound,
que todavía no arranca. Un icono en los resultados no es lo que está costando clientes.

**Consecuencia honesta: esta decisión tiene fecha de caducidad.** Mientras más páginas AEO y más
enlaces acumule `/eficore/`, más caro será mover. Se decide postergar sabiendo que el costo sube.

## Alternativas consideradas

| Alternativa | Por qué no (hoy) |
|---|---|
| **`eficore.alijerik.com`** (subdominio) | Es la única forma real de tener la taza en resultados. Descartada por prioridad, no por técnica. Es la candidata #1 de la revisión de octubre. |
| **Dominio propio** (`eficore.com` / `.io`) | **No disponibles.** `eficore.io` es una empresa activa de rubro vecino. Habría que inventar variante (`geteficore`, `eficore.app`, `.pa`), y eso ya no es decisión de favicon sino de marca. |
| **Icono distinto por página** | **No existe.** Google lo dice explícito: un favicon por hostname. Cambiar el SVG, agregar etiquetas o meter un `manifest` no cambia nada. Camino falso — no reintentarlo. |
| **Poner la taza como favicon de la portada de Alijerik** | Saldría la taza en todos los resultados, incluidos los de la empresa. Se cambia un problema por el simétrico, y la portada es de Alijerik. |

## Lo que se hizo (rama `feat/favicons`)

- **[`favicons.mjs`](../../favicons.mjs)** en la raíz del repo: rasteriza los dos SVG a 32/48/96/180
  con Chrome headless (puppeteer-core, mismo patrón que `shot.mjs`) y empaqueta el `.ico` a mano
  (**PNG-in-ICO**: cabecera + directorio + los PNG pegados; lo entienden todos los navegadores
  modernos). Reproducible: `node favicons.mjs`. **No hay dependencia nueva.**
- `public/favicon.ico`, `public/eficore-favicon.ico` (32+48+96 adentro), `-96.png` y `-180.png` de
  cada marca. Vite copia `public/` a la raíz de `dist/`, así que `/favicon.ico` ahora es un archivo
  real y deja de caer en el fallback.
- Las 7 páginas declaran los tres `<link>`: `.ico` → `.svg` → `apple-touch-icon` al **PNG de 180**.
- Los SVG **no se tocaron**. Siguen siendo la fuente de verdad; los raster se regeneran del SVG.

## Cómo verificar

```bash
# 1. Local, antes de mergear
npm run build && npx vite preview --port 4318
curl -so /dev/null -w '%{http_code} %{content_type}\n' http://127.0.0.1:4318/favicon.ico
#   → 200 image/x-icon        (si dice text/html, volvió el fallback)

# 2. En vivo, después del deploy de Pages
curl -sI https://alijerik.com/favicon.ico | grep -i content-type
#   → image/x-icon
```

3. **Search Console:** inspeccionar `https://alijerik.com/` y pedir reindexación. El favicon se
   procesa cuando Google recrawlea **la portada**, no la página que a uno le importa.
4. **En la búsqueda:** el rastreador de iconos va días o semanas detrás del indexado. **No esperar
   verlo el mismo día**, ni tomar el globo como señal de que el arreglo falló antes de ~3 semanas.

### Trampas del entorno (costaron tiempo)

- **Cloudflare Pages responde 200 con HTML en rutas que no existen.** Mirar solo el código de estado
  con `curl -I` te dice "todo bien". Hay que mirar el **`content-type`**.
- **iOS ignora SVG en `apple-touch-icon`.** Silencioso: no hay error, solo sale el icono genérico.
- Los PNG generados **se abren y se miran** antes de commitear. Un rasterizado en blanco pasa
  cualquier verificación automática.

## Lo que NO se hizo (a propósito)

- **No se movió el host** ni se compró dominio. Es la decisión que se revisita en octubre.
- **No se tocó el repo de Eficore.** Este cambio es 100% del sitio público; el producto en Railway no
  se entera.
- **No se agregó `site.webmanifest`** al sitio público. La PWA instalable es del producto, no del
  sitio de marca; mezclarlo confundiría el icono de la app con el del sitio.
- **No se tocaron las rutas legales** (`/privacidad/`, `/condiciones/`, `/eliminacion-de-datos/`).
  Solo se les agregó el `<link>` del icono — el App Review de Meta las revisa por URL y contenido.

## Revisión de octubre 2026 — criterios

Mover Eficore a **`eficore.alijerik.com`** si en la revisión se cumple **cualquiera** de estos:

1. **Eficore tiene 3+ clientes pagando** y el sitio deja de ser "una sección de Alijerik" para ser un
   producto con vida comercial propia.
2. **El AEO empieza a rendir** (menciones > 0 en asistentes, o tráfico orgánico medible en Search
   Console a las páginas de `/eficore/`) — ahí el icono en resultados empieza a valer CTR real.
3. **La colisión con `eficore.io` se vuelve visible** en búsquedas o en respuestas de IA para
   consultas de Panamá.
4. Se decide una **marca/dominio definitivo** para el producto por cualquier otra razón.

Si no se cumple ninguno, se pospone otro trimestre **y se anota** — pero recordando que el costo de
mover sube con cada página nueva bajo `/eficore/`.

## Riesgos abiertos (no resueltos aquí)

- **Colisión de nombre con `eficore.io`.** Homónimo activo en categoría vecina (automatización con
  IA), en inglés, con el `.io`. Impacto sobre AEO y sobre la elección de dominio. **Sin decisión
  tomada** — pertenece a un ADR de marca, no a este.

## Consecuencias

- ✅ `/favicon.ico` deja de ser un soft-404; Google tiene por fin qué mostrar para el host.
- ✅ El icono instalado en iPhone ya funciona (era un bug silencioso).
- ✅ La taza queda lista y rasterizada para el día del host propio: no hay trabajo que rehacer.
- ⚠️ **Los resultados de `/eficore/` van a mostrar el agujero negro.** Es la decisión, no una falla.
- ⚠️ El cambio **no se ve el mismo día**. Semanas, no horas.
- ⚠️ Postergar la mudanza de host **encarece** la mudanza futura.
