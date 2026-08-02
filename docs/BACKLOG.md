# Backlog — sitio Alijerik

> Cosas decididas pero no construidas. Si algo entra aquí es porque ya se pensó
> y se difirió a propósito, no porque se olvidó.

---

## 0. 🔴 VIVO — las 4 capturas del producto están desactualizadas DESDE EL 2026-07-30

**No es un pendiente del futuro: la página está mostrando ahora mismo un producto que ya
no se ve así.** El 30-jul-2026 entró a producción de Eficore un cambio de paleta (commit
`31a3bcc`, ADR 0024 de ese repo): tres valores de texto que arreglan la jerarquía de
contraste. Las capturas se tomaron antes.

**Los cuatro archivos** (`public/` y `dist/`), los dos primeros referenciados desde
[`eficore/index.html`](../eficore/index.html):

| Archivo | Dónde se usa |
|---|---|
| `eficore-shot-desktop.jpg` | `/eficore/` |
| `eficore-shot-cel.jpg` | `/eficore/` |
| `eficore-shot-bandeja.jpg` | verificar en las páginas AEO |
| `eficore-shot-campana.jpg` | verificar en las páginas AEO |

**Por qué importa más que un detalle estético:** las capturas son el **movimiento 2** de
la fórmula (§1 del CLAUDE.md de este repo) — *prueba real por encima de ilustración*, y el
activo anti-IA más fuerte que hay. Una captura que no coincide con el producto deja de ser
prueba y pasa a ser un pasivo: el primer prospecto que abra la app y vea otra cosa pierde
exactamente la confianza que la captura venía a construir.

### Reparto del trabajo — acordado con JC el 2026-07-30

| Insumo | Quién | Nota |
|---|---|---|
| Las **4 capturas** | **El agente**, con una condición | El login de Eficore es OTP al correo de JC: **JC hace UN login** en el navegador que maneje el agente, y de ahí en adelante la sesión persiste y el agente navega y captura solo. |
| El **video** `public/eficore-demo.mp4` | **JC** | Es metraje de grabación de pantalla. El agente no puede grabarlo. |
| Los **177 frames** de `dist/eficore-seq/` | **El agente** | Se re-ensamblan del video con `ffmpeg` según [`video-cards/ENSAMBLE.md`](../video-cards/ENSAMBLE.md). Depende de que JC grabe primero. |
| Tarjetas y rótulos (`video-cards/render.mjs`) | **El agente** | Son HTML renderizado con Chrome headless. No necesita login. |

### 🔴 De dónde se captura — regla dura, no negociable

**De TEST, nunca de producción.** Producción tiene pacientes reales de Nessalud, y §4 del
CLAUDE.md de este repo prohíbe datos de clientes reales sin excepción. TEST tiene el tenant
`acme` con 22 usuarios `@acme.test` y números marcados "(ficticio)" — datos sintéticos, que
es justo lo que la regla pide. **Y TEST ya sirve la paleta nueva**, así que no hay que
elegir entre seguro y actualizado.

Verificar la paleta que está sirviendo cada ambiente antes de capturar, para no repetir el
trabajo:

```bash
curl -s https://web-production-548e9e.up.railway.app/login | grep -o -- "--muted:#[0-9A-Fa-f]*"
# TEST debe dar #5A5348 (papel) y #A89C86 (espresso)
```

⚠️ **Ojo con la trampa del ambiente:** la PWA de TEST y la de producción son
indistinguibles en pantalla (documentado en el backlog de Eficore, §Ambientes — costó 40
minutos de falso incidente). Capturar desde el **navegador con la URL a la vista**, no
desde un ícono instalado.

### ⏰ Disparador

**Este ítem se cierra ANTES de la próxima publicación de `/eficore/`, cualquiera sea el
motivo** — no queda esperando a "cuando haya tiempo". Y si el pase de tratamiento visual
del ADR 0024 de Eficore avanza más (ritmo, tratamiento del mockup), **las capturas se
rehacen otra vez al final**: se toman una sola vez, al cierre, no en cada iteración.

---

## 0d. 🔴 VIVO — `/tarjetas/` vende PVC y un pricing que murieron el 2026-08-01

**La página está prometiendo ahora mismo una tarjeta de plástico que ya no existe como
producto.** El [ADR 0003](adr/0003-wallet-en-vez-de-pvc-y-pricing-por-asientos.md) lo
decidió el 1-ago: la tarjeta va **al wallet del teléfono** (pipeline probado end-to-end
ese mismo día con la tarjeta de JC), y el pricing pasa de $179/$349/$599 a **base $179 +
tramos acumulativos por persona** (49/35/19 · anual $60/$120 · rediseño $99 al renovar).

**La reescritura NO es un find-replace.** El plástico es la columna narrativa de la
página — ~15 puntos la tocan: `<meta>` y OG, hero, la tabla comparativa contra la
imprenta, el paso "Imprimimos tu plástico", los bullets de los tres planes, la nota de
precio, dos FAQ y el **JSON-LD entero** (3 ofertas + 2 respuestas). La metáfora cambia
de *"un plástico que no se reparte"* a *"tu tarjeta vive en el teléfono que ya llevas"*
— con dos argumentos nuevos que el PVC no tenía: nunca se olvida, y abre en modo avión.
El gesto de venta no cambia: se muestra, te escanean (documentado en la bitácora de
`tarjetas-clientes` — hasta JC esperó NFC la primera vez; la página tiene que enseñar
el gesto).

### 🔴 Prerequisito duro antes de publicar

**Sacar el issuer de Google Wallet del modo demo.** En demo, un cliente real NO puede
guardar el pase — publicar la promesa antes de eso sería repetir el error del PVC con
otro disfraz.

- **Estado: solicitud ENVIADA el 2026-08-02** (checklist 3/3 en la consola). Correo de
  Google en 2–3 días; si al día 3 no llegó, JC contacta asistencia desde esa pantalla.
- **Segundo prerequisito, decidido sin fecha de pago: Apple Wallet** ($99/año del
  Developer Program, inscripción individual ~48 h). La página no debería prometer
  "tu tarjeta en el wallet" con los iPhone afuera; **se paga al arrancar esta
  reescritura**, no antes — acordado con JC el 2-ago.

### Mientras tanto

- **No cerrar ventas prometiendo plástico** (el CLAUDE.md de `tarjetas-clientes` §3 ya
  lo dice).
- La fórmula del §1 del CLAUDE.md aplica completa a la reescritura, y las capturas que
  pida la página nueva (el pase en un teléfono real, p. ej.) siguen la regla §4:
  mirarlas antes de publicar.

---

## 0c. ✅ CERRADO por §0a — Correr la medición en TODAS las páginas (pedido de JC, 30-jul)

Hasta ahora se midió **una** página (`/formula-antislop/`) y eso ya destapó dos fallos vivos
en producción (§0b). Falta el barrido completo, y JC lo pidió explícitamente.

```bash
# Alijerik — las 10 páginas. El script lee los hexes ESCRITOS A MANO, que son
# los que nadie vigila (así salieron los dos de §0b).
for p in index.html eficore/index.html eficore/alternativa-panamena/index.html \
         eficore/ley-81/index.html formula-antislop/index.html tarjetas/index.html \
         jc/index.html privacidad/index.html condiciones/index.html \
         eliminacion-de-datos/index.html; do
  node scripts/medir-contraste.mjs "$p"
done
```

**En el repo de Eficore el equivalente tiene un hueco de instrumento que hay que cerrar
primero:** `scripts/medir_contraste.py` mide los **tokens** de `base.html`, no los colores
escritos a mano en cada plantilla. El censo de sus 12 plantillas ya está hecho y está
limpio (`color:#fff` ×5 y `#ffe2b0` ×1). **Pero ese `#fff` ya dio un fallo real:** en tema
Espresso, blanco sobre `--primary` da **3.00:1** — la tinta correcta ahí es oscura
(`#1E1A14`, 5.77:1). Detalle en `eficore/docs/BACKLOG.md` §Accesibilidad.

⚠️ **Al leer la salida:** un `BAJO` se atiende siempre. Un *"solo texto GRANDE"* hay que
**confirmarlo contra el fondo donde ese color se usa de verdad** — el script mide el
producto cruzado, no los emparejamientos reales, y ya produjo un falso positivo así (el
comentario dentro de los `<pre>`, que mide 4.63:1 sobre su fondo real).

**Disparador: junto al próximo cambio visual de cada repo, no como tarea suelta.**

---

## 0a. ✅ HECHO 2026-07-30 — barrido de contraste completo: 38 → 8, y lo que queda NO es un color

**Desplegado a producción** (`96cd303`). Cierra §0b y §0c, que quedan abajo como historia.

**Medido con la herramienta nueva:** `jean-config/skills/formula-antislop/scripts/medir-contraste-real.mjs`.
Mide **píxeles renderizados** en Chrome en vez de parsear CSS. El medidor anterior
(`scripts/medir-contraste.mjs`) **no podía ver este problema**: imprimía `OK` contra **cero
fondos** en 6 de las 10 páginas, incluida la portada, cuyo CSS vive en `src/` y nunca se
había leído. **Un `OK` de aquel script no era un aprobado.**

| página | antes | ahora |
|---|---|---|
| `/tarjetas/` | 13 | **0** |
| `/eficore/ley-81/` | 3 | **0** |
| `/eficore/alternativa-panamena/` | 3 | **0** |
| `/` portada | 6 | 1 |
| `/jc/` | 4 | 1 |
| `/eficore/` | 8 | 5 |
| `/formula-antislop/` | 1 | 1 |
| las 3 legales | 0 | 0 |

**LA CAUSA RAÍZ, que vale más que el arreglo: el sistema neón expresaba jerarquía con ALFA,
no con colores distintos.** Había **diez** niveles de blanco desvanecido elegidos a ojo
—`.82 .72 .55 .50 .46 .44 .42 .40 .32 .30`— y **seis estaban bajo el umbral**. Eso no es una
jerarquía, es un degradé de suposiciones. Nadie midió el compuesto contra el fondo.

**El criterio del arreglo fue el más conservador que funciona:** subir a `.55` (5.54:1 en el
peor de los siete fondos) **sólo lo que fallaba**, sin tocar `.55`, `.72` ni `.82`.
- Subir a `.62` habría dejado un `.42` **más brillante que un `.55` que hoy es más
  importante** → habría invertido una jerarquía que estaba bien.
- **`jc .cargo` se dejó en `.5` a propósito:** da 4.76 y **pasa**. Sólo se tocó lo que falla.
- Páginas de Eficore: `#6F5F4E` (2.59) y `#83705A` (3.36) → `var(--arena)` (5.51), el valor
  que §0b ya tenía calculado. ⚠️ **Los `#6F5F4E` que son `stroke` de SVG no se tocaron:** son
  el trazo decorativo de la taza, no texto.

🟡 **LOS 8 QUE QUEDAN SON TODOS SOBRE GRADIENTE — y no se arreglan con un color.** Son texto
sobre el hero animado y sobre ilustraciones. El arreglo es un velo, un overlay más oscuro o
mover el texto: **eso es diseño, no un token.** Detalle: `div.sub` 1.74 · `text «LA MISMA
FORMA CUATRO VECES»` 2.66 · `small «· un producto de Alijerik»` 2.95 · `p «Mensajes que
llegan…»` 3.04 · `p.duo__pie` 3.41 · `a.cta--precios` 4.01 · `p.cargo` 4.38 · `time «10:31»`
4.43.

> ### ⚠️ CORRECCIÓN 2026-08-01 — de esos 8, uno era MENTIRA DEL MEDIDOR
>
> **`text «LA MISMA FORMA CUATRO VECES»` 2.66 nunca fue un defecto.** Da **6.44:1** contra el
> fondo real y pasa AA holgado. `/formula-antislop/` tiene **cero** fallos: 49 tratamientos
> medidos, 0 fallan.
>
> **La causa:** un `<text>` de SVG no se pinta con `color`, se pinta con `fill`. El medidor
> le leía `color` (que devolvía `--espuma`, el color heredado de la página) y al esconder la
> tinta tampoco tocaba `fill`, así que **el texto seguía visible y se muestreaba a sí mismo
> como fondo**. El 2.66 que reportó es exactamente la razón entre `--espuma` y `--arena`:
> **midió dos colores de TEXTO entre sí.** Que el número coincidiera con la escalera real
> entre los dos niveles es lo que lo hacía tan creíble.
>
> **Arreglado** en `jean-config/skills/formula-antislop/scripts/medir-contraste-real.mjs`
> (fuente única; copiado a `~/.claude/skills/`). ✅ **El espejo público quedó al día el
> 1-ago** — `github.com/andrewleleypa/formula-antislop`, verificado por contenido desde el
> raw de GitHub. Antes de pushear ahí hay que revisar que no se filtren nombres de clientes:
> es público y los references se escriben con casos reales.
>
> ### ✅ SEGUNDO PUNTO CIEGO — CERRADO el 2026-08-01 con `scripts/medir-hero.mjs`
>
> Se escribió un medidor aparte para el hero. Hace tres cosas que el general no puede:
> **scrollea** hasta el punto donde la timeline de GSAP pone visible el bloque (forzar la
> opacidad a mano no sirve, la timeline lo pisa al frame siguiente), captura de
> **viewport** en vez de `fullPage`, y recién ahí esconde la tinta para leer el píxel real
> **con el velo puesto**. Trae autoprueba.
>
> **Lo que reveló: el problema era PEOR de lo documentado.** En producción fallan **tres de
> cuatro**, incluido el propio wordmark de 96 px:
>
> | texto | producción | con el arreglo |
> |---|---|---|
> | `EFICORE` 96px/800 | **2.35:1** ✗ (min 3) | **4.08:1** ✓ |
> | `div.sub` | **1.80:1** ✗ | **8.29:1** ✓ |
> | `a.cta` | 4.77:1 ✓ | 4.77:1 ✓ |
> | `a.cta--precios` | **3.32:1** ✗ | **6.04:1** ✓ |
>
> Los otros tres números que este archivo listaba para `/eficore/` (`small`, `p`, `time`)
> vienen de bloques distintos del hero: **medirlos pide correr `medir-hero.mjs` con su id**
> (`node scripts/medir-hero.mjs t1`, etc.). Siguen sin verificar.
>
> **Dos trampas del `radial-gradient` que costaron tres iteraciones, y valen para cualquier
> velo sobre foto:**
> 1. `closest-side` en una caja **ancha y baja** calcula el radio contra el lado **corto**.
> 2. Si la elipse se pasa del borde, el `border-radius` la **recorta con alfa alta** y
>    aparece un rectángulo visible flotando sobre la foto.
>
> **Tensión que quedó sin resolver, documentada a propósito:** el wordmark va alto en la
> caja, así que el velo tiene que estirarse hacia arriba para taparlo — y eso es lo que lo
> hace tocar el borde. La versión simétrica que no toca ningún borde deja `EFICORE` en
> 2.55:1. Se eligió la legibilidad; queda una línea horizontal tenue arriba. **Si molesta,
> la salida no es bajar el velo: es mover el wordmark al centro del bloque.**
>
> ### 🔴 El punto ciego del medidor GENERAL sigue existiendo — `position:fixed` + `fullPage`
>
> **Los 5 que quedan en `/eficore/` NO están verificados, y sus números no son confiables.**
> Todo el texto del hero vive en `.stage-text{position:fixed}` sobre un canvas que anima GSAP
> por scroll. En una captura `fullPage`, Chrome pinta los `fixed` una sola vez y no
> necesariamente en la coordenada de documento donde el medidor cree que está el texto.
>
> **La prueba de que el instrumento está ciego ahí:** se reforzó el velo de `#t4` dos veces y
> **el fondo muestreado no se movió ni un dígito** (`#856b54` las tres corridas), mientras que
> el cambio de tinta sí se reflejó al instante (1.72 → 3.40). El medidor está leyendo el
> canvas, no el velo. **Afinar CSS contra ese número es afinar contra ruido.**
>
> Lo que SÍ se cambió en esta pasada (y **está sin verificar**, necesita ojo de JC):
> - `#t4` usaba `radial-gradient(closest-side, …)`. En una caja ancha y baja, `closest-side`
>   calcula el radio contra el lado **corto**: el velo era un círculo vertical diminuto que se
>   apagaba antes de llegar al subtítulo. **Eso sí era un defecto real, visible leyendo el
>   CSS.** Ahora es una elipse `78% 88%`.
> - `#t4 .sub` pasó de `--arena` a `--leche`.
>
> **Cómo cerrarlo de verdad:** medir el hero con captura de **viewport** (no `fullPage`) y
> parando la línea de tiempo de GSAP en el frame de cada `stage-text`. Es una modalidad nueva
> del medidor, no un ajuste de CSS.
>
> **La lección, otra vez:** cada criterio necesita un medidor y **el medidor necesita su
> propia prueba**. Van dos instrumentos cazados en este mismo archivo, y el segundo se cazó
> porque un cambio de CSS **no movió** un número que tenía que moverse.

> ⚠️ **Cómo leer esos números sin exagerarlos:** el medidor reporta **el peor punto
> muestreado**. Un 4.43 sobre gradiente significa que casi todo el texto se lee bien y falla
> un borde — **no es comparable al 2.37 plano** que tenía el pie de `/jc/`. Los dos primeros
> (1.74 y 2.66) sí son severos y son los que hay que atender primero.

🔵 **PENDIENTE SISTÉMICO — consolidar los diez niveles de alfa en tres medidos.** Hoy quedan
`.82 .72 .55 .50` (todos pasan) más los que se subieron a `.55`. Que `.5` y `.55` convivan es
1.16× — **a la vista son el mismo color**, que es la trampa de la escalera. No se hizo ahora
porque tocar valores que PASAN es un cambio de apariencia y lo aprueba JC.

### 🪤 Trampa del entorno que costó un commit

**`sed -i` come los CRLF.** Dos de las páginas de Eficore están guardadas con CRLF; `sed -i`
las dejó en LF y convirtió un cambio de 20 líneas en **un diff de 1123**, irrevisable. Se
rehizo restaurando desde `origin/main` y aplicando **en binario** con Python. Y `grep -c
$'\r'` **no** sirve para detectarlo a través de `git show` (git normaliza la salida): usar
`xxd`.

---

## 0b. ✅ CERRADO por §0a — Dos colores de texto del PIE fallan contraste en las 3 páginas publicadas

Encontrado el 2026-07-30 al construir `/formula-antislop/`, con la herramienta nueva
[`scripts/medir-contraste.mjs`](../scripts/medir-contraste.mjs). **Son colores escritos a
mano, fuera de la paleta de tokens — que es exactamente la clase de valor que nadie
vigila.** Están en el pie que comparten `/eficore/`, `/eficore/alternativa-panamena/` y
`/eficore/ley-81/`:

| Color | Peor superficie | Dónde | Umbral |
|---|---|---|---|
| `#6F5F4E` | **2.59:1** | `.f-col h5` (rótulos, 11px) y `.f-legal` (línea legal, 11.5px) | 4.5:1 · **falla** |
| `#83705A` | **3.36:1** | `.f-legal .firma` (12.5px) | 4.5:1 · falla para texto normal |

**El arreglo ya está probado en `/formula-antislop/`: reemplazarlos por `var(--arena)`**
(#A8957E, 5.51:1 en el peor caso). Se probó primero un gris intermedio `#9B8A72` que
cumple (4.75:1), pero queda a **1.16× de `--arena`** y en el pie aparecen uno al lado del
otro: serían el mismo color a la vista. Es la trampa de la escalera. La salida correcta es
la misma lección que en Eficore — **si la paleta no da otro nivel que cumpla, la distinción
la carga la FORMA**: los rótulos ya se diferencian por tamaño, mayúsculas y
`letter-spacing:.2em`, no necesitan además ser más apagados.

⚠️ **No se aplicó a las páginas publicadas en este cambio, a propósito.** Un push a `main`
despliega, y tocar tres páginas vivas es un cambio aparte que merece su propia revisión.
**Disparador: se hace junto al próximo cambio que ya vaya a tocar esas páginas** — muy
probablemente el de las capturas del §0.

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
