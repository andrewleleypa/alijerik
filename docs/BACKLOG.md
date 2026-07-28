# Backlog — sitio Alijerik

> Cosas decididas pero no construidas. Si algo entra aquí es porque ya se pensó
> y se difirió a propósito, no porque se olvidó.

---

## 1. Avisos de renovación a WhatsApp y correo

**Estado:** diferido el 2026-07-27 por JC. *"Después lo pones en backlog porque son
varias cosas, eso y renovaciones mías de dominio etc."*

Hoy `scripts/renovaciones.mjs` funciona pero es **pasivo**: hay que acordarse de
correrlo. Lo que falta es que el aviso llegue solo.

**Alcance cuando se retome — es más grande que las tarjetas:**

| Qué vigilar | Dónde vive hoy |
|---|---|
| Renovaciones de clientes (tarjetas digitales) | `docs/renovaciones.json` ✅ ya existe |
| Dominio `alijerik.com` | en ningún lado — **falta la fecha de renovación** |
| Otros dominios y servicios propios de JC | en ningún lado |
| Certificados, tokens y llaves con vencimiento | ver [[project-inventario-dependencias]] |

**Nota importante:** esto se solapa con la idea vieja del *inventario de dependencias*
(servicios y deps con alarmas de deprecación y expiración), que ya estaba diferida.
**Son el mismo problema.** Cuando se retome, resolver los dos de una vez en vez de
construir dos alarmas distintas.

**Camino técnico probable:** el canal de WhatsApp ya existe y es de la casa — Eficore
manda plantillas por la WhatsApp Business Platform. Un cron que corra
`renovaciones.mjs`, y cuando algo entre en la ventana de 30 días, dispare una plantilla
al número de JC más un correo. No hace falta servicio de terceros.

**Por qué no se hizo ahora:** el registro tiene **un** cliente. Construir la cañería de
avisos para un solo registro es adelantar infraestructura a la demanda. Con 5 o 6
entradas ya duele lo suficiente para justificarlo.

---

## 2. El contenido de la portada nace invisible

**Detectado el 2026-07-27** al verificar `/tarjetas/` con la opacidad efectiva.

En `/` los tres paneles bajo el hero (Eficore, Tarjetas, Contacto) — **38 elementos con
texto** — arrancan en `opacity: 0` y solo aparecen cuando GSAP dispara el reveal al
hacer scroll.

- **Para indexación no es fatal:** los rastreadores leen el DOM y los enlaces existen.
- **Para AEO sí importa:** cualquier herramienta que renderice sin scrollear ve una
  portada vacía debajo del hero. Es la misma trampa que documenta
  `LENGUAJE-VISUAL.md`, pero en la página con secuencia de hero, que usa GSAP y no CSS.

**Arreglo probable:** que el `from` de GSAP sea `opacity: .3` en vez de `0`, igual que
hace la fórmula en las páginas de contenido. Es un valor.

**Por qué no se tocó:** cambia el carácter de la animación de la portada, que es la
pieza de marca más visible del sitio. Es decisión de JC, no un arreglo de paso.

---

## 3. Menor — enlazar `/tarjetas/` desde el pie de `/eficore/`

Hoy `/tarjetas/` se enlaza desde la portada y desde `/jc/`. Un enlace más desde el pie
de `/eficore/` no sobra, pero tampoco es urgente: la portada ya la hace descubrible.
