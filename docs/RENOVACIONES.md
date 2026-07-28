# Renovaciones — servicios con cobro anual

> Creado el 2026-07-27, al publicar `/tarjetas/`.
> Datos en [`renovaciones.json`](renovaciones.json) · alarma en `scripts/renovaciones.mjs`

---

## Para qué es esto

El servicio de tarjetas digitales cobra **un pago único de diseño y una renovación
anual**. La renovación es la parte que se pierde: nadie olvida cobrar los $180 del
principio, todo el mundo olvida los $60 de doce meses después.

Un documento que hay que acordarse de abrir no es un recordatorio. Por eso esto son
tres piezas, no una:

| Pieza | Qué hace |
|---|---|
| `docs/renovaciones.json` | Los datos. Una entrada por servicio activo. |
| `scripts/renovaciones.mjs` | La alarma. Se ejecuta y dice a quién hay que cobrarle. |
| Un evento en tu calendario | El único que te va a interrumpir sin que hagas nada. |

**Las tres.** El script no sirve si no lo corres; el calendario no sirve si no sabes
qué prometiste. El calendario es el que despierta, el script es el que responde.

```bash
node scripts/renovaciones.mjs            # ventana de 60 días
node scripts/renovaciones.mjs --dias 90  # ventana más amplia
```

Sale con código 1 si hay algo vencido o sin fecha, así que sirve como verificación
automática si algún día se engancha a una tarea programada.

---

## Lo que se le promete al cliente

Está publicado en `/tarjetas/` y en el `FAQPage` de esa página. Es un compromiso
público, no una intención:

1. **Aviso 30 días antes** del vencimiento.
2. Si no renueva, **se le entregan sus archivos**: la vCard y el arte vectorial del QR.
   Son suyos.
3. **La página sigue en línea 30 días más** después del vencimiento, para que quien ya
   tenga la tarjeta impresa no se tope con un error.

> El punto 3 es el diferenciador que ningún competidor ofrece, y el que más va a costar
> sostener cuando un cliente no pague. **Sostenerlo igual.** Una tarjeta apagada de golpe
> deja al cliente en ridículo frente a alguien que acaba de escanear su tarjeta — y esa
> historia se cuenta.

---

## Cómo agregar un cliente

Una entrada en `docs/renovaciones.json`:

```json
{
  "cliente": "Nombre",
  "contacto": "+507 0000-0000",
  "servicio": "Tarjeta digital con QR — plan Esencial",
  "inicio": "2026-08-15",
  "cicloMeses": 12,
  "monto": 60,
  "moneda": "USD",
  "plan": "esencial",
  "notas": "Lo que el próximo yo necesita saber y no está en el número."
}
```

`inicio` es **la fecha en que empezó el servicio pagado**, no la fecha en que se firmó
ni en que se entregó el diseño. El script calcula los aniversarios a partir de ahí y
salta los ciclos ya cumplidos, así que la entrada no hay que tocarla cada año.

Y en el calendario: **un evento anual, con 30 días de anticipación**, que diga
*"Renovación <cliente> — correr `node scripts/renovaciones.mjs`"*.

---

## Estado actual

### Arias Design — ⚠️ falta la fecha

Único servicio activo de este tipo. Lo que se sabe:

- Se cobró **$60 por un año** de alojamiento.
- **El diseño se regaló.** Es amiga del tío que fondea a JC, y él también la está
  ayudando. Fue una decisión deliberada, no un error de cotización.
- **No se sabe en qué fecha empezó.** Sin ese dato no hay alarma posible y la
  renovación se va a pasar.

**Acción pendiente de JC:** buscar la fecha del cobro (transferencia, Yappy, correo,
lo que haya) y ponerla en `inicio` dentro de `renovaciones.json`. Es un campo.

### Sobre el precio de Arias en la renovación

La lista nueva dice $60/año para el plan Esencial, que es exactamente lo que ella paga.
**No hay que subirle nada.** Lo que se regaló fue el diseño ($179 de la lista vigente), y
eso ya pasó — no se cobra retroactivo.

> **Nota 28-jul-2026 ([ADR 0002](adr/0002-precio-tarjetas-renovacion-plana-y-plastico-incluido.md)):**
> ahora la renovación es **$60 en los tres planes**, no solo en Esencial. Para las
> renovaciones eso simplifica todo: **el monto anual de cualquier tarjeta es $60**, sin
> mirar qué plan compró. Lo que ya no calza con la lista nueva es que Arias **no recibió
> plástico impreso** — desde el 28-jul el pago único lo incluye. No se le debe nada
> retroactivo, pero si se le ofrece uno, es cortesía, no obligación.

Si algún día se le agrega algo (dominio propio, más cambios), ahí sí se conversa el
salto a Profesional. Mientras tanto queda como está: **precio heredado, sin ruido.**

---

## Lo que este registro NO es

No es un CRM ni una contabilidad. No lleva facturas, no lleva pagos parciales, no lleva
impuestos. Solo responde *"¿a quién le toca renovar y cuándo?"*.

Si algún día hay tantos clientes que esto se queda corto, el problema es bueno y ese
día se resuelve. Hoy hay uno.
