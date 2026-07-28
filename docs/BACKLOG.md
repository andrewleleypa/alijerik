# Backlog — sitio Alijerik

> Cosas decididas pero no construidas. Si algo entra aquí es porque ya se pensó
> y se difirió a propósito, no porque se olvidó.

---

## 1. Dashboard de renovaciones + avisos a WhatsApp y correo

**Estado:** diferido el 2026-07-27 por JC, reconfirmado al cierre de la sesión
(*"tenemos que tener un dashboard con todas las renovaciones... no lo perdamos de
vista"*). Son la misma iniciativa en dos entregas: primero VER todo, después que
avise solo.

**Lo que YA existe (no reconstruir):** `docs/renovaciones.json` +
`scripts/renovaciones.mjs` — alarma CLI que calcula vencimientos y dice a quién
cobrarle. Cubre SOLO clientes de tarjetas. Es pasiva: hay que acordarse de correrla.

**Lo que NO existe:** un dashboard que muestre en una sola vista TODAS las
renovaciones — clientes de tarjetas, dominios propios (alijerik.com y los que
vengan), certificados, tokens y llaves con vencimiento. Y que el aviso llegue solo.

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

## 2. ✅ RESUELTO (mismo día) — El contenido de la portada nacía invisible

**Detectado y arreglado el 2026-07-27.** Los tres paneles bajo el hero — 38 elementos
con texto — nacían en `opacity:0` por el `immediateRender` de `gsap.from`+ScrollTrigger.
JC aprobó tocarlo el mismo día ("hacemos el hero hoy mismo"): ahora es `fromTo` con piso
`.3`, y `[data-reveal]` en CSS también arranca en `.3`. Medido después: 0 elementos
ocultos. La trampa quedó documentada en `LENGUAJE-VISUAL.md` y en `STATUS.md`.

---

## 3. Susurro "Tarjeta por Alijerik" en la tarjeta de Arias Design

**Diferido por JC el 2026-07-27 — NO ejecutar sin su decisión explícita.**

La idea: un pie discreto *"Tarjeta por Alijerik"* enlazando a `/tarjetas/`, para que
cada escaneo de la tarjeta de Trini descubra que el servicio se vende (mismo circuito
que el pie de `/jc`). La condición que no cambia: **fue un regalo — el branding
retroactivo se le pregunta a ella primero, no se retrofitea.** Para clientes nuevos que
pagan, la regla es la inversa: la marca va declarada desde la cotización y quitarla se
cobra (+$60).

---

## 4. Menor — enlazar `/tarjetas/` desde el pie de `/eficore/`

Hoy `/tarjetas/` se enlaza desde la portada y desde `/jc/`. Un enlace más desde el pie
de `/eficore/` no sobra, pero tampoco es urgente: la portada ya la hace descubrible.
