# ADR 0002 — Precio de tarjetas QR: renovación plana de $60, un plástico incluido, dominio en los tres planes

**Estado:** Aceptada · 2026-07-28
**Decide:** JC
**Reemplaza:** el esquema de precios publicado el 27-jul-2026 en `fff1d55` (ver ADR *Contexto*).
**Liga con:** [`docs/KEYWORDS-TARJETAS.md`](../KEYWORDS-TARJETAS.md) (competencia y ancla de
precio) · [`docs/RENOVACIONES.md`](../RENOVACIONES.md) (cobro anual) ·
`tarjetas-clientes/CLAUDE.md` §1 (dónde vive la tarjeta de un cliente).

---

## Contexto

`/tarjetas/` se publicó el 27-jul-2026 con este esquema:

| Plan | Pago único | Anual | Dominio | Impresión |
|---|---|---|---|---|
| Esencial | $180 | $60 | Dirección en `alijerik.com` | **Del cliente** |
| Profesional | $350 | **$90** | Propio | **Del cliente** |
| Equipo (≤5) | $600 | **$180** | Propio | **Del cliente** |

Al día siguiente JC lo revisó y encontró tres cosas mal. No eran errores de redacción:
eran tres suposiciones equivocadas mías sobre cómo funciona el negocio.

### Error 1 — La escalera de renovación no tenía nada abajo

Yo escalé la renovación con el plan ($60 → $90 → $180) porque es lo que hacen los SaaS.
Pero aquí **no hay nada que escale**: todas las tarjetas de clientes se sirven desde
**un solo servicio** (`tarjetas-clientes` en Railway, regla dura de
`tarjetas-clientes/CLAUDE.md` §2), y cada plan tiene **un solo dominio** — incluso el de
Equipo, donde cinco personas cuelgan del mismo dominio con rutas distintas.

Cobrar $180/año por hospedar cinco páginas en el mismo dominio que las de $60 no es
un tier: es una diferencia inventada. Y el propio `<h2>` de la sección de precios dice
**"Se cobra el diseño, no el alojamiento"** — la escalera contradecía el titular que
estaba tres centímetros más arriba.

**Decisión: $60 al año en los tres planes.**

### Error 2 — Vendíamos el archivo, no la tarjeta

La página decía, textual, en dos lugares:

> *"La impresión física corre por tu cuenta con la imprenta que prefieras."*
>
> *"La imprenta la eliges tú — en Panamá hay varias buenas y vas a pagar menos yendo
> directo que a través nuestro."*

Eso convierte la entrega en **un SVG y una tarea pendiente**. El cliente paga $180, recibe
un archivo, y todavía le falta encontrar imprenta, aprobar una prueba y esperar. La mitad
de los que compran no llegan al final de ese trámite, y la tarjeta nunca existe
físicamente — que es justo donde el QR genera el escaneo que justifica la renovación del
año siguiente.

**Decisión: el pago único incluye el diseño del plástico y su impresión.**

### Error 3 — El modelo de "una tanda" era el modelo del papel, no el nuestro

Al preguntarle a JC **cuántas** tarjetas incluir, la respuesta reencuadró el producto
entero:

> *"No incluye múltiples tarjetas. Es **una sola de plástico por persona**, porque de esa
> los clientes escanean el QR y así no tienes que tener tarjetitas entregables sino que ya
> vives en el celular de la persona y solo tienes un plástico."*

Esa frase es mejor argumento de venta que todo lo que la página tenía escrito. El pitch
viejo era *"el papel se quedó a medias"*. El nuevo es **no repartes nada**: cargas un solo
plástico, lo muestran, lo escanean, y quedas guardado en el teléfono del otro mientras la
tarjeta se queda contigo para el siguiente.

Efecto secundario que importa: el costo de impresión deja de ser una tanda de $20–$350 y
pasa a ser **una unidad**. La objeción de margen que yo había levantado contra incluir la
impresión se cae sola.

### Error 4 — El plan barato prometía una ruta que una regla dura prohíbe

El bullet *"Dirección en alijerik.com"* del plan Esencial contradice directamente la regla
del 27-jul (`tarjetas-clientes/CLAUDE.md` §1): **la tarjeta de un cliente nunca vive bajo
el dominio de Alijerik**, porque el cliente entrega SU tarjeta y sale la marca de otra
empresa. La página vendía lo que la operación no iba a entregar.

---

## Decisión

| Plan | Pago único | Anual | Dominio | Plástico |
|---|---|---|---|---|
| Esencial | **$179** | **$60** | Propio, **lo paga el cliente** al registrador | 1, PVC, diseñado e impreso |
| Profesional | **$349** | **$60** | Propio, **lo consigue y lo paga Alijerik** | 1, PVC, diseñado e impreso |
| Equipo (≤5) | **$599** | **$60** | **Uno solo** para todo el equipo, pagado por Alijerik | 1 por persona, hasta 5 |

Cuatro reglas que se derivan de ahí y aplican a toda cotización futura:

1. **La renovación es $60. Siempre.** No importa el plan ni cuánta gente. La razón que se
   dice en voz alta es la verdadera: *es un solo dominio y un solo servidor, y eso cuesta
   lo mismo para una persona que para cinco.*
2. **Todo plan incluye el plástico**, diseñado por nosotros e impreso. **Uno por persona.**
   No es una tanda para repartir — es la que se carga.
3. **Todo plan lleva dominio propio.** Lo único que cambia entre tiers es **quién lo paga**:
   el cliente en Esencial, Alijerik en Profesional y Equipo. Esto cierra el escenario 3
   (⚠️ *SIN RESOLVER*) de `tarjetas-clientes/CLAUDE.md` §1: se subió el piso, no se compró
   un dominio neutro.
4. **Precios terminados en 9** ($179 / $349 / $599). Decisión de marketing de JC, no de
   costo.

---

## Consecuencias

**A favor**

- El titular *"Se cobra el diseño, no el alojamiento"* ahora es literal y demostrable, y
  la rejilla de precios lo prueba sola: las tres tarjetas muestran `+ $60 al año`.
- Se elimina el trámite entre pagar y tener la tarjeta en la mano. El QR se imprime, se
  escanea, y el escaneo es lo que hace que el cliente renueve.
- El argumento de "un solo plástico" diferencia contra Kolor Media (cotización, QR+NFC
  corporativo) y contra las plantillas de $25/año, que entregan un enlace y nada físico.

**En contra — asumido a conciencia**

- **Se revierte una postura publicada.** La página decía que el cliente pagaría menos
  yendo directo a la imprenta. Eso sigue siendo cierto para una tanda; ya no aplica porque
  ya no vendemos una tanda. Si alguien lo saca a relucir, la respuesta es esa, no un
  rodeo.
- **La renovación plana renuncia a ingreso recurrente escalonado.** Un Equipo de 5 deja
  los mismos $60/año que un independiente. La compensación va en el pago único ($599 vs
  $179), es decir: el negocio es de proyecto, no de suscripción. Si algún día hay 50
  clientes, esto se revisa — no antes.
- **El dominio de Profesional y Equipo sale de los $60.** Un `.com` renueva por ~$15 y un
  `.com.pa` por más. El margen real del anual queda en ~$40–45, no en $60.

---

## Riesgo abierto — leer antes de cerrar la primera venta

🔴 **No hay proveedor de impresión de PVC elegido.** La página ya promete
*"diseñada e impresa por nosotros"* en producción. Falta:

1. Cotizar impresión de PVC por unidad en Panamá (a una sola tarjeta, no a tanda — el
   precio unitario es muy distinto y puede tener mínimo de pedido).
2. Definir el tiempo de entrega que se le promete al cliente.
3. **Imprimir una y escanearla con tres teléfonos antes de entregar cualquiera**, según la
   regla de `tarjetas-clientes/CLAUDE.md` §3.

Mientras eso no exista, el compromiso está publicado pero no está probado.

---

## Cómo verificar que el cambio quedó completo

```bash
cd ~/alijerik
grep -n '\$180\|\$350\|\$600\|\$90 al\|\$180 al\|Dirección en alijerik' tarjetas/index.html
# Solo debe aparecer el rango "$20 y $350" de la sección "contra el papel" (imprentas).

npm run build && npx vite preview --port 4318
# JSON-LD: las 3 Offer deben decir 179/349/599 y el FAQPage debe tener 8 preguntas,
# las mismas 8 que hay en <summary> del DOM.
```

## Lo que NO se hizo

- No se tocó el rango *"$20 a $350 por una tanda"* de la sección contra el papel: es un
  dato de mercado verificado en `docs/KEYWORDS-TARJETAS.md`, y sigue siendo el ancla.
- No se cambió el precio heredado de Arias Design. Paga $60/año, que coincide con el
  esquema nuevo. Ver `docs/RENOVACIONES.md`.
- No se agregó opción de NFC ni de tanda de papel. La tanda se menciona como cotización
  aparte, sin precio.
