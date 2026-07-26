# Reglas del repo — Alijerik (sitio público)

> **LEER ESTO PRIMERO, ANTES DE CONSTRUIR NADA.** Antes de escribir una página, de
> proponer un diseño, o de "mejorar" algo que ya funciona. No al final: **primero.**
>
> Esto lo lee cualquier agente o desarrollador que entre a este repositorio.
> Son reglas del proyecto, no preferencias de estilo.

Este repo publica `alijerik.com` en Cloudflare Pages. Contiene el sitio de la marca,
la página del producto Eficore, las páginas AEO de contenido y las páginas legales
que Meta exige.

---

## 1. La fórmula del lenguaje visual — REGLA DURA

**Toda página nueva se construye con la fórmula de [`docs/LENGUAJE-VISUAL.md`](docs/LENGUAJE-VISUAL.md).
Sin excepciones. Leerla completa antes de escribir la primera línea de HTML.**

La idea central, para que nadie la pierda:

> **"Se ve hecho con IA" es un problema de RITMO, no de componentes.**
> Lo que delata al contenido generado es que todas las secciones tienen la misma forma:
> etiqueta, título, párrafo, rejilla. Repetir. Cambiar de librería de íconos no arregla
> nada — los íconos son el síntoma, la métrica uniforme es la causa.

Los seis movimientos: romper la métrica · prueba real por encima de ilustración ·
lenguaje propietario derivado de una sola idea (latte art) en vez de librería ·
honestidad específica sin autogoles · movimiento que nunca esconde contenido ·
restricciones técnicas que protegen el AEO.

**No usar librerías de ilustración** (unDraw, Storyset, Humaaans, packs de íconos 3D).
Te catalogan como plantilla, no te diferencian. Phosphor duotone se queda **solo** para
listas funcionales, que es la convención del producto.

**Antes de dar una página por terminada**, correr el checklist de 11 puntos del final de
`docs/LENGUAJE-VISUAL.md`. Incluye las dos trampas que ya costaron tiempo:
`overflow-x` en `body` no recorta (va en `main`, con `clip`), y el reveal al scroll
nunca arranca en `opacity: 0`.

### Excepción de alcance

Las páginas con **secuencia de hero** (`/` y `/eficore/`) ya tienen algo más distintivo
que esta fórmula: la animación en canvas y la taza. Ahí la receta se aplica **solo a las
secciones de contenido debajo del hero**. Cambiar una animación propia por una receta
repetible sería un retroceso.

---

## 2. Un push a `main` DESPLIEGA A PRODUCCIÓN

Cloudflare Pages construye desde `main` automáticamente. No hay ambiente intermedio.

- **Trabajar siempre en rama.** `feat/<tema>`.
- **Construir y verificar antes de mergear**: `npm run build` y `npx vite preview`, y
  probar **todas** las rutas, no solo la nueva.
- **JC revisa y aprueba antes del merge.** Mostrarle la página corriendo, no describirla.
- Registrar cada página nueva en `vite.config.js` → `rollupOptions.input`, o no se
  construye y la ruta cae en el fallback de la raíz.

> **Hay un App Review de Meta abierto.** Las URLs legales (`/privacidad/`,
> `/condiciones/`, `/eliminacion-de-datos/`) son las que Meta revisa. No cambiarlas de
> ruta ni meterles ruido tonal.

---

## 3. Las páginas existen para ser citadas por asistentes de IA

El propósito de las páginas de contenido es AEO: aparecer cuando alguien le pregunta a
ChatGPT, Gemini o Perplexity por la categoría. El diseño no puede costar eso.

- **Cero JavaScript** en páginas de contenido.
- **Todo el contenido en el DOM y legible sin JS.** Si un rastreador encuentra
  `opacity: 0`, se pierde justo lo que se vino a ganar.
- `<h1>` único, `<meta name="description">` de 150–160 caracteres, FAQ en formato
  pregunta-respuesta literal, y JSON-LD (`SoftwareApplication`, `FAQPage`,
  `BreadcrumbList`).
- **Datos numéricos verificables** en cada sección argumentativa. Los modelos citan
  tablas, checklists y precios concretos; no citan prosa de marca.
- Enlazar toda página nueva desde el pie de `/eficore/` — una página huérfana no se indexa.
- **Después de desplegar, enviar la URL a Google Search Console.** Sin eso la página
  existe pero nadie la descubre. Ese paso lo hace JC.

El estado de visibilidad y la inteligencia de competidores viven en el repo de Eficore:
`docs/aeo/BASELINE-2026-07.md`.

---

## 4. Capturas del producto

Son el activo anti-IA más fuerte que hay, y por eso mismo el más delicado.

- **Solo datos sintéticos.** Tenant de demostración, números marcados "(ficticio)",
  contactos simulados.
- **Verificar cada captura mirándola antes de publicarla.** Nunca publicar una imagen
  que no se abrió.
- **Jamás datos de pacientes ni de clientes reales.** Ni nombres, ni teléfonos, ni
  contenido de conversaciones. Aplica la misma regla que el repo de Eficore.
- Pie de foto que declare que los datos son de demostración.

---

## 5. Identidad

La paleta cappuccino, Bricolage Grotesque para títulos, los íconos Phosphor duotone y
los motivos de latte art son la identidad del producto — no se rediseñan sin decisión
explícita de JC.

Especificaciones del producto: `eficore/docs/design/REFERENCIAS.md` en el repo de Eficore.
Composición y ritmo: `docs/LENGUAJE-VISUAL.md` aquí.
