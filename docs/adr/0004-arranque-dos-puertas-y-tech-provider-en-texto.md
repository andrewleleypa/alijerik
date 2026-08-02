# 0004 — El arranque con dos puertas ($159 / $0 / $99) y Tech Provider como claim en texto, sin badge

- **Estado:** aceptado y en producción (2026-08-02, `main` desde `7d4d43a`)
- **Decide:** JC · **Documenta:** agente de la sesión

## Contexto

`/eficore/` publicaba las mensualidades ($39 plan, $56 campañas) pero **no cobraba el
arranque** — el trámite de dejar un número andando en la API de WhatsApp, que en el
mercado se cobra entre $200 y $300. Con el App Review de Meta aprobado, Alijerik puede
onboardear números directamente (es Tech Provider), y eso ni se contaba en la página.

Dos tensiones definieron la sesión:

1. **La vía gratis (self-onboarding) todavía no existe como interfaz.** Publicarla tal
   cual era ofrecer algo que nadie podía tomar.
2. Había un PNG "Meta Tech Provider" **bajado de internet** listo para publicarse como
   badge.

## Decisión

**El arranque, pago único, con dos puertas** (bloque propio en `#precios`, deliberadamente
NO una tercera tarjeta — es una decisión de quién hace el trámite, no otro plan mensual):

- **$159 llave en mano**: configuración completa + primer set de plantillas sometido a
  Meta + sesión de arranque con el equipo. **La verificación del negocio ante Meta quedó
  FUERA del alcance a propósito** (la hace el cliente). Cubre todos los números del
  primer mes; número agregado después = **$99, una sola vez**.
- **$0 si el cliente hace el trámite él mismo** — redactado para ser **verdad HOY**:
  "te pasamos la guía y conectamos tu número sin cargo". Sin "próximamente".
  **Publicar ambas vías fue decisión de JC con el riesgo sobre la mesa**; la redacción
  verdadera-hoy disolvió la parte falsa del riesgo.
- **$159 y no $150**: encaja con el patrón numérico que la página ya tiene ($39, $56).
- **Discovery (onboarding gratis + 1 mes) NO se publica** — la página no explica qué es
  discovery; queda como herramienta de cierre verbal.

**Tech Provider como claim EN TEXTO, banda `#techprovider` a sangre completa:**

- **Sin badge.** La investigación del 2-ago en fuentes oficiales (detalle y URLs en
  `BACKLOG.md §0e`) confirmó que **Meta no emite badge para Tech Providers**; el único
  badge es Meta Business Partner nivel Badged, con umbrales que hoy quedan lejos
  (≥10 clientes activos, ≥2,500 mensajes/día). El PNG de marras era apócrifo.
- **Lenguaje corporativo deliberadamente ambiguo** (pedido de JC): sin fecha de
  aprobación ni conteo de permisos. Trade-off consciente: la banda queda sin dato
  numérico verificable (regla de la fórmula); los números duros los carga `#precios`.
- **Canales Instagram/Messenger con íconos Phosphor**, la misma decisión que
  `_canal.html` en el repo de Eficore (los logos oficiales no se pueden recolorear).
  El reclamo público está desbloqueado según el BACKLOG §Social de Eficore (30-jul).

## Alternativas descartadas

- **Publicar solo el $159 hasta que exista el self-serve** — perdía el ancla que hace ver
  el cargo como opcional ("pagas por no hacer el trámite tú").
- **"Ambos con próximamente"** — recomendación inicial del agente; JC la descartó y la
  redacción verdadera-hoy la volvió innecesaria.
- **Publicar el PNG del badge** — riesgo de marca con el socio del que depende todo el
  negocio, y además el badge no existe: era doblemente indefendible.
- **El arranque como tercera tarjeta de precios** — habría leído como otro plan mensual.

## Consecuencias

- El primer cliente que pida la vía gratis la recibe: guía + conexión manual sin cargo.
- Un cliente que arranque con 4 números paga $159 por 4× el trabajo — **riesgo aceptado**
  (la clientela real trae 1–2 números).
- Cuando la interfaz self-serve exista, el copy no cambia: solo se vuelve más barato de
  cumplir.
- El badge pasa de pendiente a **disparador de crecimiento** (BACKLOG §0e). La mención de
  Tech Provider en la raíz `alijerik.com` quedó diferida por JC (BACKLOG §5).

## Verificación

Contraste: 6 colores OK contra los 3 fondos más claros (`scripts/medir-contraste.mjs`).
Rutas completas a 1440 y 390 sin desborde ni contenido oculto (`scripts/verificar-rutas.mjs`).
Borde real del texto a 390px = 20px (`scripts/medir-borde-texto.mjs`). Capturas de ambas
piezas revisadas a ojo en ambos anchos. Producción verificada por contenido el 2026-08-02.
