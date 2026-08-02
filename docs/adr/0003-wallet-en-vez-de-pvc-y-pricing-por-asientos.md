# ADR 0003 — La tarjeta va al wallet del teléfono (muere el PVC) y el pricing se rehace por asientos

**Estado:** Aceptada · 2026-08-01
**Decide:** JC
**Reemplaza:** ADR 0002 en dos de sus tres decisiones (el plástico incluido y la
estructura de planes). La tercera — dominio propio en todos los planes — **sobrevive**
con ajustes de quién paga.
**Liga con:** `tarjetas-clientes/docs/WALLET.md` (operativa del pase) ·
`tarjetas-clientes/CLAUDE.md` §3 (el QR solo con dominio final) ·
[`docs/RENOVACIONES.md`](../RENOVACIONES.md) (cobro anual).

> ✅ **PUBLICADO el 2026-08-02** (merge `ed18a7f`): `/tarjetas/` ya vende wallet y el
> pricing v3. **Con un override consciente de JC:** la §Salida ponía como prerequisito
> sacar el issuer del modo demo y tener Apple pagado; JC decidió publicar antes de las
> dos cosas como decisión de mercado, reafirmada con el riesgo enfrente. Mitigación:
> el ciclo de venta es más largo que los dos relojes (correo de Google ~2-3 días,
> inscripción de Apple esta semana). La narrativa: `STATUS.md §2026-08-02`.

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

*(Actualizada el 2-ago tras la publicación; el estado vivo se sigue en BACKLOG §0d.)*

1. ⏰ **Sacar el issuer del modo demo** — solicitud ENVIADA el 2-ago, correo de Google
   en 2–3 días (si el 5-ago no llegó, asistencia). Hasta que apruebe, un cliente real
   NO puede guardar el pase: **vender se puede, entregar pases todavía no.**
   *(El plan original era publicar DESPUÉS de esto; JC lo invirtió como decisión de
   mercado — ver el banner de arriba.)*
2. ✅ Reescritura completa de `/tarjetas/` — hecha y en producción (2-ago, `ed18a7f`),
   con la cuenta de los tramos desglosada y el dato de mercado en la FAQ de renovación.
3. 🔴 **Apple Wallet ($99/año Developer Program) — ESTA SEMANA.** Dejó de ser "sin
   fecha" en el momento en que la página lo prometió. La rama `feat/tarjetas-wallet`
   ya trae el generador de `.pkpass` esperando el certificado.
