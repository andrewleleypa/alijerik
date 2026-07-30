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
