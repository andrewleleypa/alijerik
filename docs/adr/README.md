# ADRs — Registro de decisiones (sitio público Alijerik)

Cada ADR captura **una** decisión: contexto, la decisión, alternativas, consecuencias y cómo
verificar. Formato ligero (estilo Nygard), mismo que el repo de Eficore (`docs/adr/`). Numeración
correlativa e independiente de la de Eficore. **No se reescribe el pasado**: si una decisión se
revierte, se crea un ADR nuevo que la supersede.

Qué merece un ADR aquí: lo que un desarrollador nuevo —o tú en tres meses— preguntaría *"¿por qué
está así?"*. Las correcciones tácticas pequeñas no lo necesitan; basta el commit.

## Aceptados

- [0001 — Un favicon por host: en resultados de Google, `/eficore/` muestra el agujero negro](0001-un-favicon-por-host-eficore-en-subcarpeta.md)
  · *ejecutado 2026-07-26 (rama `feat/favicons`)* · restricción documentada de Google (un favicon por
  hostname, subcarpetas no soportadas) · **revisión programada 26-oct-2026**: mover Eficore a
  `eficore.alijerik.com` · riesgo abierto anotado: `eficore.io` es una empresa activa de rubro vecino.

- [0002 — Precio de tarjetas QR: renovación plana de $60, un plástico incluido, dominio en los tres planes](0002-precio-tarjetas-renovacion-plana-y-plastico-incluido.md)
  · *decidido por JC 2026-07-28, un día después de publicar* · reemplaza el esquema `$180+$60 / $350+$90 /
  $600+$180` por **$179 / $349 / $599, todos + $60 al año** · el pago único ahora incluye **un plástico PVC
  por persona, diseñado e impreso** · cierra el escenario 3 (⚠️ sin resolver) de `tarjetas-clientes/CLAUDE.md` §1
  · 🔴 **riesgo abierto: no hay proveedor de impresión de PVC elegido** y la promesa ya está publicada.

- [0003 — La tarjeta va al wallet del teléfono (muere el PVC) y el pricing se rehace por asientos](0003-wallet-en-vez-de-pvc-y-pricing-por-asientos.md)
  · *decidido por JC 2026-08-01, publicado 2026-08-02 (merge `ed18a7f`)* · reemplaza a 0002 en plástico y
  estructura de planes (el dominio propio sobrevive) · base $179 + tramos por asiento, anual $60/$120,
  rediseño $99 al renovar · **publicado ANTES de Google y Apple por override consciente de JC**, registrado
  en el propio ADR. *(Esta entrada del índice se agregó el 2-ago: el archivo existía sin indexar.)*

- [0004 — El arranque con dos puertas ($159/$0/$99) y Tech Provider como claim en texto, sin badge](0004-arranque-dos-puertas-y-tech-provider-en-texto.md)
  · *decidido por JC y publicado 2026-08-02 (`main` desde `7d4d43a`)* · `/eficore/` cobra el arranque:
  $159 llave en mano (todos los números del 1er mes; $99 c/u después) o $0 si el cliente tramita — la vía
  gratis redactada para ser **verdad hoy**, sin "próximamente" · banda `#techprovider` con claim EN TEXTO y
  lenguaje deliberadamente ambiguo (sin fecha ni conteo de permisos) · **sin badge: no existe para Tech
  Providers** (investigado en fuentes oficiales — `BACKLOG.md §0e`; el camino real es Meta Business Partner,
  disparador ≥10 clientes activos) · canales IG/Messenger con Phosphor · discovery queda verbal, fuera de página.
