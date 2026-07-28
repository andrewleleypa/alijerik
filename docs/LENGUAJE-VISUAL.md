# Lenguaje visual — cómo se hace una página que no parece IA

> Formulada el 2026-07-26 tras construir `/eficore/alternativa-panamena/`.
> Esta es la receta a aplicar en toda página nueva del sitio.
> Para las reglas de identidad del producto (Phosphor duotone, paleta cappuccino)
> ver `eficore/docs/design/REFERENCIAS.md`. Este documento es sobre **composición**.

---

## La idea central

**"Se ve hecho con IA" es un problema de ritmo, no de componentes.**

Lo que delata al contenido generado es que **todas las secciones tienen la misma
forma**: título, párrafo, rejilla de cartas. Título, párrafo, rejilla. Esa
uniformidad métrica es la firma.

Corolario importante: **cambiar de librería de íconos no arregla nada.** El
diagnóstico intuitivo ("los íconos se ven de librería") apunta al síntoma. Un
diseñador humano rompe el compás; una plantilla no.

---

## Los seis movimientos

### 1. Romper la métrica

No decorar las secciones — **variar su forma**. En una página de ~9 secciones,
al menos tres deben tener una silueta distinta:

| Movimiento | Implementación |
|---|---|
| Una sección a sangre completa entre secciones contenidas | Sección hija directa de `<main>`, sin `.wrap`. **Nunca `100vw`** (ver Trampas). |
| Un bloque asimétrico de dos columnas | `grid-template-columns: 1.15fr .85fr`, y una variante invertida |
| Una sección sin rejilla | Solo texto y un aviso destacado |
| Una tarjeta desplazada del flujo | El precio con `max-width` menor al del cuerpo |

### 2. Prueba real por encima de ilustración

**Capturas reales del producto, con datos sintéticos.** Es el mayor golpe
anti-IA disponible y es gratis: ninguna IA puede fabricar tu interfaz real.

- Datos sintéticos siempre. Tenant de demo, números marcados "(ficticio)",
  contactos simulados. **Verificar cada captura antes de publicar.**
- Pie de foto que lo declare: *"Captura real de la plataforma. Datos de
  demostración."* La transparencia suma credibilidad.
- Elegir capturas que **prueben un argumento del texto**, no que decoren.
  Ejemplo: la captura de campañas se usa en la sección de Ley 81 porque
  muestra en pantalla que se excluyen los contactos con opt-out.

### 3. Un lenguaje propietario, no una librería

**Las librerías de ilustración te catalogan, no te diferencian.** unDraw,
Storyset, Humaaans y los packs de íconos 3D son la firma visual de "plantilla
de startup"; un comprador que vio cien landings las reconoce al instante.

Lo que sí funciona: **derivar todo de una sola idea**. Aquí, el latte art.

Reglas de los motivos:
- Line art, trazo de 0.7–1.3px, nunca relleno
- Opacidad **.05 a .07**. Si se nota, está mal
- `z-index: -1`, siempre detrás del contenido
- Posicionados para **sangrar fuera del contenedor** y recortarse
- Colores de la paleta: `--terracota-luz` para vapor, `--leche` para el corazón
- Set actual: vapor, corazón, grano de café, vertido

Todo rima porque todo sale de la taza.

### 4. Honestidad específica en el copy

El texto generado es vago y uniformemente positivo. El antídoto textual es el
mismo que el visual — romper el patrón:

- **Declarar los límites.** "Hasta dónde llega Eficore" con lo que no hace.
- **Números concretos y verificables.** "$200 a $1,000", "multa de B/.8,000".
  Lo específico no se puede inventar.
- **Pero nunca apuñalarse.** Decir lo que no haces es credibilidad; mandar al
  comprador con la competencia es un autogol. La frase *"conviene más una
  plataforma internacional"* se eliminó por esto.
- Un límite se declara como **alcance deliberado**, no como carencia:
  "Convive con tu sistema clínico" en vez de "no se integra con sistemas HIS".

### 5. Movimiento que nunca esconde

Reveals al scroll en **CSS puro**, con `animation-timeline: view()`. Cero
JavaScript, cero librerías de animación.

```css
@media (prefers-reduced-motion: no-preference){
  @supports (animation-timeline: view()){
    .reveal{
      animation:reveal-in linear both;
      animation-timeline:view();
      animation-range:entry 4% cover 26%;
    }
    @keyframes reveal-in{
      from{opacity:.3;transform:translateY(26px)}  /* .3, NUNCA 0 */
      to{opacity:1;transform:none}
    }
  }
}
```

Soporte: Chrome, Edge, Safari 26+. **Firefox no por defecto** — ahí la página se
ve completa y estática. Es mejora progresiva, no falla, pero el efecto no le
llega a todos.

### 6. Restricciones técnicas que protegen el propósito

Estas páginas existen para ser citadas por asistentes de IA. El diseño no puede
costar eso:

- **Cero JavaScript.** La página pesa ~44 KB de HTML.
- **Todo el contenido en el DOM**, visible sin JS.
- **Cero recursos externos** salvo la tipografía.
- Imágenes con `width`/`height` explícitos, `loading="lazy"`, `alt` descriptivo.
- Tablas dentro de `overflow-x:auto` propio; el cuerpo nunca scrollea de lado.

---

## Trampas (las tres costaron tiempo)

### El shorthand `padding` que borra el margen lateral — SILENCIOSO

La peor de las tres, porque **no rompe nada visible en escritorio** y estuvo en
producción sin que nadie la notara.

```css
.wrap{max-width:1080px;margin:0 auto;padding:0 28px}
.sec{padding:64px 0}          /* ← MAL: anula el 28px lateral de .wrap */
```

Las secciones llevan **las dos clases en el mismo elemento** (`class="wrap sec"`).
Misma especificidad, así que gana la que se declara después. El shorthand
`padding:64px 0` reescribe los cuatro lados: el lateral pasa a `0`.

En escritorio no se ve, porque `max-width:1080px` deja aire de sobra a los lados.
**En móvil el texto queda pegado al borde de la pantalla.**

```css
.sec{padding-top:64px;padding-bottom:64px}   /* ← BIEN: longhand */
```

Se detectó el 2026-07-27 midiendo el borde real del texto, no la caja. Estaba en
`/eficore/alternativa-panamena/` y `/eficore/ley-81/` desde que se publicaron.
Aplica igual a `.cta-fin`, `.sec--aire` y a cualquier modificador que comparta
elemento con `.wrap`.

> **Cómo medirlo bien:** `getBoundingClientRect()` de un elemento devuelve la
> **caja**, que incluye su propio padding. Un pie de foto con `padding-left:20px`
> reporta `left: 0` aunque su texto empiece en 20. Para el borde real del texto hay
> que medir un `Range` sobre el contenido:
> `const r=document.createRange(); r.selectNodeContents(el); r.getBoundingClientRect()`.
> Sin esto salen falsos positivos y se persiguen bugs que no existen.

### Las otras dos

### `overflow-x` en `body` NO recorta nada

Se **propaga al viewport**. Los motivos que sangran fuera del contenedor
ensancharon la página a 1460px en escritorio y 540px en móvil.

```css
main{overflow-x:clip}   /* en <main>, no en body */
```

`clip` y no `hidden`: `hidden` fuerza `overflow-y:auto` y mete una barra de
scroll interna. `clip` tampoco rompe `position:sticky` del encabezado.

### Sangrado completo sin `100vw`

`width:100vw` incluye el ancho de la barra de scroll → desborda siempre. Si la
sección es **hija directa de `<main>`**, ya ocupa el ancho completo sola. No
hace falta ningún truco.

### El reveal que arrancaba en `opacity: 0`

Un navegador headless que renderice sin scrollear resuelve `animation-timeline`
y ve la página **vacía** — sin títulos, sin tabla, sin cartas. Se detectó porque
las capturas de verificación salieron en blanco.

Los rastreadores leen el DOM y no se ven afectados para indexación, pero
cualquier herramienta que renderice y capture sí. **Piso de opacidad en `.3`.**

---

## Checklist para una página nueva

- [ ] ¿Al menos 3 secciones con silueta distinta de las demás?
- [ ] ¿Al menos una captura real con datos sintéticos, verificada?
- [ ] ¿La captura prueba un argumento del texto, o solo decora?
- [ ] ¿Motivos del set de latte art, a opacidad .05–.07, detrás del contenido?
- [ ] ¿`main{overflow-x:clip}` presente?
- [ ] ¿Ningún shorthand `padding` en clases que compartan elemento con `.wrap`?
- [ ] ¿Medido el borde IZQUIERDO REAL del texto a 390px? (≥ 20px, con `Range`, no con la caja)
- [ ] ¿El reveal arranca en `.3` y no en `0`?
- [ ] ¿Sección de límites redactada como alcance y sin recomendar competencia?
- [ ] ¿Al menos un dato numérico verificable por sección argumentativa?
- [ ] ¿Cero JavaScript?
- [ ] ¿Verificado a 1440px **y** 390px sin desbordamiento horizontal?
- [ ] ¿`prefers-reduced-motion` renderiza la página completa?

---

## Alcance de aplicación

**Sí aplica** a páginas de contenido: `alternativa-panamena`, `ley-81`,
`fuga-de-ventas`, `supervision`, y las que sigan.

**Cuidado con las páginas con secuencia de hero** (`/` y `/eficore/`). Esas ya
tienen algo más distintivo que esta fórmula: la secuencia en canvas y la taza.
Ahí la receta se aplica **a las secciones de contenido que van debajo del hero**,
no al hero. Reemplazar una animación propia por esta fórmula sería cambiar algo
único por algo repetible.
