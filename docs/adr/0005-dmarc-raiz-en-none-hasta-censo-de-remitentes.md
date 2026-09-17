# ADR 0005 — El raíz se queda en `p=none` hasta tener censo de remitentes; `mfa.alijerik.com` ya está cerrado

**Estado:** Aceptada · 2026-09-17
**Revisión programada:** **8 de octubre de 2026** (3 semanas) — criterios en "Cómo se verifica".
**Liga con:** [`docs/DMARC.md`](../DMARC.md) (estado verificado, comandos y caminos falsos) ·
[`docs/BACKLOG.md` §6](../BACKLOG.md) (el trabajo pendiente y su disparador) ·
[`docs/DEPLOY-CLOUDFLARE.md`](../DEPLOY-CLOUDFLARE.md) (el DNS vive en Cloudflare).

## Contexto

El 17-sep-2026 llegaron a `contacto@alijerik.com` dos reportes agregados de DMARC —uno de
Microsoft, uno de Google— sobre `mfa.alijerik.com`. La pregunta original de JC fue la buena:
*"¿eso es bueno o es malo?"*

Los correos en sí son inofensivos: llegan porque el propio registro DMARC los pide con
`rua=mailto:contacto@alijerik.com`. Lo que abrió la decisión fue lo que se encontró al
revisar el DNS detrás de la pregunta: **`alijerik.com` y `mfa.alijerik.com` tienen dos
posturas DMARC distintas, y la estricta está puesta en el subdominio que menos tráfico
mueve.**

| Dominio | Qué manda | DMARC hoy |
|---|---|---|
| `mfa.alijerik.com` | MFA y notificaciones de CompaCorp y Eficore, vía **Resend** | `p=quarantine` |
| `alijerik.com` (raíz) | correo humano y comercial, vía **PrivateEmail** | **`p=none`** |

`p=none` no protege: observa y reporta. **Hoy cualquiera puede mandar correo diciendo ser
`@alijerik.com` y entra al buzón del destinatario.** El raíz es, además, el dominio de la
cara comercial: `contacto@`, cotizaciones, formularios, avisos de Eficore.

La parte que hace la decisión interesante es que **no falta infraestructura**. El raíz ya
tiene SPF (`include:spf.privateemail.com ~all`) y DKIM (`default._domainkey`) publicados y
funcionando. Subirlo a `quarantine` es editar **un** registro TXT en Cloudflare: cinco
minutos de trabajo. La pregunta no es *cómo*, es *cuándo*.

### Lo que dijeron los reportes, porque cambia el diagnóstico

Se abrieron los dos adjuntos antes de decidir nada. `mfa.alijerik.com` pasa **100 %**: 10
mensajes entre los dos receptores, `dkim=pass`, `spf=pass`, `disposition=none`, todos desde
IPs de Amazon SES us-east-1, todos con destino `segurosfortis.com`. Es el tráfico propio
del go-live de CompaCorp del 15-sep. **Ni un registro de un tercero.**

Resend lo montó bien, con un mecanismo que no es obvio: el sobre sale como
`send.mfa.alijerik.com` (sub-subdominio de rebote) y alinea con el `header_from` en modo
relajado, además de la firma DKIM exacta. El detalle completo está en
[`DMARC.md` §3](../DMARC.md).

> 🔴 **Se registran también los caminos falsos**, porque tres diagnósticos intermedios de
> esta sesión fueron errados con toda la confianza del mundo —incluido un barrido de 28
> selectores DKIM que devolvió "no hay DKIM" porque la consulta preguntaba por direcciones
> IP en vez de por registros de texto. Están en [`DMARC.md` §6](../DMARC.md), con el
> mecanismo de cada trampa.

## Decisión

**Dos decisiones, una por dominio.**

1. **`mfa.alijerik.com` se deja exactamente como está.** Verificado contra dos receptores
   independientes: pasa. No se toca el registro, no se le agrega SPF propio, no se sube a
   `p=reject`. Cerrado.

2. **El raíz se queda en `p=none` hasta tener censo de remitentes.** No se sube a
   `quarantine` hoy, aunque el cambio sea de un registro y de cinco minutos.

**La razón es la asimetría del riesgo, y es lo único que importa acá:**

| Si no hago nada hoy | Si lo subo hoy sin censo |
|---|---|
| Sigue abierto un hueco de suplantación que **lleva años abierto** y del que no hay ni un incidente conocido | Un remitente legítimo que no esté cubierto **se va a spam sin error visible** |
| El daño es hipotético y estable | El daño es real, inmediato y **silencioso**: no se ve un fallo, se ven correos que nunca llegaron |
| `p=none` sigue juntando los datos que hacen falta | Se descubre semanas después, por un cliente que dice "yo nunca recibí eso" |

🔴 **El prerrequisito va primero:** el censo de remitentes no es una tarea previa
opcional, es la condición que gobierna la secuencia. Y ya está corriendo solo — `p=none`
con `rua=` puesto **es** el mecanismo del censo. No hay que construir nada: hay que esperar
y leer.

## Alternativas consideradas

- **Subir el raíz a `quarantine` de una vez.** Rechazada por lo de arriba. El argumento
  "son cinco minutos" es cierto y es irrelevante: lo barato es el cambio, no la reversa.
  Un correo comercial en spam no se detecta hasta que alguien reclama.
- **`p=quarantine; pct=25`** (cuarentenar solo una cuarta parte, para ver el golpe sin
  romper todo). Descartada: convierte una rotura silenciosa en una rotura silenciosa
  *intermitente*, que es peor de diagnosticar. Y no aporta nada que los reportes de
  `p=none` no digan ya, sin riesgo.
- **Poner `sp=quarantine` en el raíz** para cubrir subdominios sin registro propio.
  Innecesario hoy: el único subdominio que envía (`mfa`) tiene registro propio, que manda
  sobre cualquier `sp`. Se reevalúa cuando exista un segundo subdominio emisor.
- **Subir el SPF del raíz de `~all` a `-all`.** Diferida al *después* del censo, no al
  antes: el hardfail rompe reenvíos (listas, alias) sin avisar, y con DMARC activo el
  softfail alcanza.
- **Quitar el `rua=` para dejar de recibir los reportes** (la salida que el propio correo
  de Microsoft ofrece). Rechazada de plano: los reportes son el único instrumento de
  medición que hay. Apagarlos es apagar el velocímetro por no ver el número.

## Consecuencias

**A favor**

- El hueco del raíz queda **documentado y con fecha**, no olvidado. Antes de esta sesión no
  estaba escrito en ninguna parte.
- `mfa.alijerik.com` queda verificado con evidencia de dos receptores, así que deja de ser
  una fuente de dudas cada vez que llegue un reporte.
- El censo se paga solo: `p=none` ya trabaja.

**En contra, y hay que decirlo**

- 🟡 **El raíz sigue suplantable durante al menos tres semanas más.** Es una decisión
  consciente, no un descuido. Si en ese plazo aparece un caso real de suplantación de
  `@alijerik.com`, esta decisión se revierte de inmediato y se acepta el riesgo de romper
  algún remitente.
- ⏰ **Hay que leer los reportes para que esto sirva.** Un `rua=` cuyo buzón nadie abre
  convierte tres semanas de espera en tres semanas perdidas. Ese es el riesgo real de este
  ADR, y por eso el §7 de `DMARC.md` pone el agregador **antes** de endurecer.

## Cómo se verifica

**El 8-oct-2026, en este orden:**

1. **¿Se juntaron reportes?** Buscar en `contacto@alijerik.com` los mensajes con asunto
   `Report domain: alijerik.com` (el raíz, no `mfa.`). Si no hay ninguno del raíz, el censo
   no arrancó y hay que averiguar por qué antes de seguir.
2. **Armar el censo.** Abrir los reportes ([comandos en `DMARC.md` §5](../DMARC.md)) y
   listar toda IP / dominio de sobre que aparezca con `header_from = alijerik.com`. Para
   cada uno: ¿es nuestro, y pasa SPF o DKIM?
3. **El criterio para endurecer, explícito:** se sube a `quarantine` cuando **todo**
   remitente del censo esté identificado y pasando. Un solo remitente propio en `fail`
   bloquea el cambio hasta arreglarlo — el arreglo es agregarlo al SPF o firmarlo con DKIM,
   no ignorarlo.
4. **Antes de tocar el registro**, poner el agregador en el `rua=` (`DMARC.md` §7). El
   volumen del raíz no se lee a mano.
5. **Reversa:** volver el TXT a `v=DMARC1; p=none; rua=...`. Es un registro DNS en
   Cloudflare, efecto en minutos según el TTL. **Pero la reversa no recupera los correos
   que ya se cuarentenaron** — de ahí que el orden de los pasos 2 y 3 no sea negociable.

**Control de que la medición sirve:** si los reportes del raíz muestran `spf=pass` y
`dkim=pass` en el 100 % del tráfico desde la primera semana, sospechar de la muestra antes
de celebrar. Significaría que el censo solo está viendo a PrivateEmail y que los remitentes
secundarios (Railway, formularios) no están mandando nada en esa ventana — no que no
existan.
