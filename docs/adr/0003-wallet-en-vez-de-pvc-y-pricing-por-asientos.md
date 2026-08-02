# ADR 0003 — La tarjeta va al wallet del teléfono (muere el PVC) y el pricing se rehace por asientos

**Estado:** Aceptada · 2026-08-01
**Decide:** JC
**Reemplaza:** ADR 0002 en dos de sus tres decisiones (el plástico incluido y la
estructura de planes). La tercera — dominio propio en todos los planes — **sobrevive**
con ajustes de quién paga.
**Liga con:** `tarjetas-clientes/docs/WALLET.md` (operativa del pase) ·
`tarjetas-clientes/CLAUDE.md` §3 (el QR solo con dominio final) ·
[`docs/RENOVACIONES.md`](../RENOVACIONES.md) (cobro anual).

> ⚠️ **NADA de esto está publicado.** `/tarjetas/` sigue mostrando el esquema del ADR
> 0002 (PVC + $179/$349/$599). Este ADR registra la decisión; la reescritura de la
> página es un pendiente vivo del BACKLOG y tiene un prerequisito duro (§Salida).

---

## Contexto

El ADR 0002 dejó un riesgo escrito en su propia cola: **"no hay proveedor de impresión
de PVC elegido y la promesa ya está publicada"**. Cuatro días después seguía sin
proveedor, y JC decidió no resolverlo sino disolverlo: matar el plástico y entregar la
tarjeta **en el wallet del teléfono** (Google Wallet hoy, Apple Wallet decidido sin
fecha).

El mismo día se probó el pipeline completo con la tarjeta de JC: pase guardado en un
Android real y el QR escaneado **desde la pantalla del pase** por otro teléfono, cayendo
en `alijerik.com/jc`. La promesa nueva se probó ANTES de publicarse — la lección del
PVC, aplicada al derecho.

## Decisión 1 — Wallet en vez de plástico

El reencuadre del 0002 ("no es una tanda: se muestra, no se entrega") **sobrevive
intacto** — solo cambia dónde vive la tarjeta. Y el wallet gana tres argumentos que el
plástico no tenía:

1. **Nunca se olvida en la oficina** — es el teléfono.
2. **Abre en modo avión** — el pase vive en el aparato, no en la red.
3. **Costo marginal ~cero por tarjeta** — sin imprenta, sin mínimos de pedido, sin
   tiempos de entrega que prometer.

Lo que se pierde y se acepta: el objeto físico como ancla de precio percibido. Por eso
el pricing se movió junto con esto, no por separado.

## Decisión 2 — Escalera por asientos con tramos ACUMULATIVOS

El 0002 escalaba por features (Esencial/Profesional/Equipo). Eso muere: **un solo
diseño por cliente** es lo que van a usar de verdad (nadie pide cinco diseños para
cinco vendedores), así que lo que escala es la gente, no las funciones.

| Concepto | Precio |
|---|---|
| Base — diseño + 1ª persona | **$179** |
| Personas 2–5 | **+$49** c/u |
| Personas 6–10 | **+$35** c/u |
| Personas 11–20 | **+$19** c/u |
| Diseño adicional (filial, segunda línea) | +$99 |
| 21+ o multi-filial | Se cotiza (bloque propio con CTA, regla de copys) |

Ejemplos: **5 → $375 · 10 → $550 · 20 → $740.**

**Por qué acumulativos y no tarifa plana por tier:** con tarifa plana, 6 personas
costaban MENOS que 5 (6×$19=$114 contra 5×$49=$245). Todo per-seat con tarifas
distintas por tramo necesita acumulación o tiene un acantilado en la frontera.

**El tier Profesional ($349) muere.** Sus features (dominio pagado por Alijerik,
métricas, portafolio) pasan a add-ons de cualquier plan — la escalera queda pura por
asientos.

## Decisión 3 — Anual $60 hasta 10 personas, $120 de 11 a 20

El 0002 fijó $60 plano con el argumento "un solo dominio y un solo servidor por plan".
El argumento sigue siendo cierto para el hosting, pero de 11 a 20 personas lo que crece
es el **soporte** (cambios de contenido ilimitados el mismo día hábil). Un solo salto,
copy simple.

**Rediseño: $99 plano, SOLO en ventana de renovación.** Misma estructura con piel
nueva; secciones nuevas o rebranding = cotización, la frontera datos/diseño del 0002
no se mueve.

Descartado en el camino (para que nadie lo reproponga sin info nueva):

- **30% de descuento sobre cotización al renovar** — partía de "hay que reconfigurar
  todo si cambia el diseño", y ese costo no existe: **el URL nunca cambia con un
  rediseño** (es la arquitectura entera del producto). Además 30%-de-qué no es
  publicable en la página; $99 sí.
- **Acumular cambios no usados hacia la renovación** — obliga a llevar contador de algo
  que hoy es ilimitado, y entrena al cliente a que el rediseño es gratis.

## Decisión 4 — Dominio: incluido hasta $20/año, salvo Personal

- **Equipo y PYME:** dominio incluido hasta **$20/año**. Si el que quieren cuesta más,
  **lo pagan completo** (a su nombre y su tarjeta) y se conecta igual — Alijerik no
  frontea renovaciones de dominios premium.
- **Personal:** el cliente lo paga al registrador (como en el 0002); la búsqueda,
  conexión y gestión van incluidas.
- Cliente con dominio existente: conectarlo va incluido en todos los planes.

## Salida — qué falta para que esto sea real

1. 🔴 **Prerequisito duro antes de publicar wallet en la página: sacar el issuer del
   modo demo** ("Solicitar acceso de publicación" en la consola). En demo un cliente
   real NO PUEDE guardar el pase — publicar antes de eso sería el error del PVC con
   otro disfraz.
2. Reescritura completa de `/tarjetas/` — el plástico es la columna narrativa de la
   página (~15 puntos: hero, meta/OG, tabla comparativa, paso "Imprimimos tu plástico",
   bullets de planes, nota de precio, 2 FAQ y el JSON-LD entero). Está en el BACKLOG.
3. Apple Wallet ($99/año Developer Program) — decidido, sin fecha; hasta entonces el
   iPhone abre la tarjeta web pero no guarda pase.
