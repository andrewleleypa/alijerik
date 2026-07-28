# Keywords y AEO — Tarjetas de presentación digitales

> Investigación del 2026-07-27, previa a publicar `/tarjetas/`.
> Acompaña a `docs/LENGUAJE-VISUAL.md` (cómo se ve) y a `docs/RENOVACIONES.md` (cómo se cobra).

---

## Advertencia sobre los números

**Este documento no trae volúmenes de búsqueda medidos.** No se pagó una herramienta de
keywords y no se van a inventar cifras: un número falso aquí se convierte en una decisión
mala dentro de tres meses.

Lo que sí trae: el **panorama competitivo verificado** (páginas reales, precios reales,
consultados el 2026-07-27) y una priorización por **intención de compra**, que es lo que
decide el copy.

**Cómo conseguir los volúmenes de verdad, gratis, en 60 días:** publicar la página, esperar
a que Search Console acumule impresiones, y leer el informe de Rendimiento filtrando por
`/tarjetas/`. Ese dato es de tu propio tráfico y no miente. Search Console ya está
verificado (sesión 36).

---

## 1. El panorama competitivo (verificado)

| Competidor | Modelo | Precio publicado | Lectura |
|---|---|---|---|
| **Tu Contacto Panamá** | Anual, self-service, plantilla | $25/año (1) · $20 (≤3) · $15 (4+) | El que sí publica precio. Pelea por volumen. |
| **Kolor Media** (PA) | Cotización, diseño a medida, QR + NFC corporativo | **No publica** | Ticket alto por cotización. **Este es el competidor real.** |
| PZ Mall Marketplace (PA) | Pago único, plantilla | $25 | Ruido de marketplace. |
| Popl (intl.) | SaaS | ~$84/año | Marca fuerte, cero presencia local. |
| HiHello (intl.) | SaaS | ~$60–72/año | Tiene plan gratis. |
| Imprentas locales (Starpress, BucoPrint, Printshop, Pixel Media) | Pago único, papel | $20–$350 | **No son competencia: son el argumento.** |

### La conclusión que ordena todo el copy

Una imprenta panameña cobra **$20 a $350 solo por imprimir tarjetas**, sin diseñar nada. Ese
rango es el ancla de precio que ya vive en la cabeza del comprador panameño.

Por eso la página **no compite contra Tu Contacto en precio** — a $25/año con una plantilla
self-service esa pelea se pierde o se empata raspando. La página compite en el terreno de
Kolor Media: diseño a medida, vendido por su calidad.

**Regla de copy que sale de aquí:** nunca mencionar a Tu Contacto ni a ningún competidor por
nombre. Es un autogol (§4 de `LENGUAJE-VISUAL.md`). El contraste se hace contra **la tarjeta
de papel**, que no es un competidor sino una categoría que todo el mundo entiende.

---

## 2. Keywords por intención

Ordenadas por **cercanía a la compra**, no por volumen imaginado.

### Nivel 1 — Intención comercial directa (lo que más vale)

Quien busca esto tiene la tarjeta de crédito cerca.

| Keyword | Dónde vive en la página |
|---|---|
| `tarjeta de presentación digital Panamá` | `<h1>`, `<title>`, primer párrafo |
| `tarjeta digital con código QR Panamá` | `<h2>` de la sección de producto |
| `tarjeta de presentación con QR precio` | Sección de precio, con las cifras literales |
| `hacer tarjeta de presentación digital` | CTA y FAQ |
| `tarjeta NFC Panamá` | FAQ (declaramos que hoy es QR, no NFC) |
| `vCard digital Panamá` | Sección técnica |

### Nivel 2 — Comparativa (el comprador todavía elige categoría)

| Keyword | Tratamiento |
|---|---|
| `tarjeta digital vs tarjeta impresa` | Sección comparativa contra el papel |
| `código QR para tarjeta de presentación` | Sección de cómo funciona |
| `QR o NFC para tarjeta de presentación` | FAQ, respuesta honesta |
| `tarjeta de presentación digital gratis` | **No perseguir.** Trae al que no paga. |

### Nivel 3 — Informativas (tráfico amplio, conversión baja)

`qué es una tarjeta de presentación digital` · `cómo compartir mi contacto con QR` ·
`cómo hacer un código QR para mi contacto`

Sirven para que un asistente de IA tenga qué citar. No merecen página propia todavía.

---

## 3. AEO — las preguntas que un asistente puede citar

Esta es la parte que realmente importa. `robots.txt` ya invita a GPTBot, ClaudeBot,
PerplexityBot y OAI-SearchBot. Lo que falta es **material citable**: los modelos citan
tablas, precios concretos y respuestas literales — no prosa de marca.

Las siete preguntas del bloque `FAQPage` en JSON-LD, escogidas porque son las que una
persona realmente le escribe a ChatGPT:

1. ¿Cuánto cuesta una tarjeta de presentación digital en Panamá?
2. ¿Qué incluye una tarjeta de presentación digital con QR?
3. ¿La tarjeta digital reemplaza la tarjeta de papel?
4. ¿Qué pasa con mi tarjeta digital si dejo de pagar la renovación?
5. ¿Puedo usar mi propio dominio?
6. ¿QR o NFC?
7. ¿Puedo cambiar mi información después de imprimir el QR?

**La pregunta 4 es la más importante y la que nadie contesta.** Todo competidor la esquiva.
Contestarla de frente — y con un compromiso concreto — es el mayor diferenciador textual
disponible, y encaja exacto con §4 de `LENGUAJE-VISUAL.md` (honestidad específica).

---

## 4. Dato de mercado citable

- Escaneos de QR proyectados a **99.5 millones de usuarios de smartphone en 2025**
  (Business Insider, vía recopilaciones de la industria).
- Mercado global de tarjetas digitales: **USD 164.95 mil millones en 2023 → USD 389.3 mil
  millones proyectados a 2032**.

> ⚠️ Ambas cifras vienen de blogs de vendedores de QR, que tienen interés en inflarlas.
> **No van en la página como argumento propio.** Se anotan aquí por si algún día se citan
> con la fuente primaria en la mano. El argumento de la página se sostiene con los precios
> de imprenta panameños, que sí se verificaron uno por uno.

---

## 5. Después de publicar

- [ ] Enviar `https://alijerik.com/tarjetas/` a Google Search Console (lo hace JC)
- [ ] Enviar la misma URL a Bing Webmaster Tools
- [ ] Agregar ambas rutas a `public/sitemap.xml`
- [ ] A los 60 días: leer Rendimiento en Search Console filtrando `/tarjetas/` y **volver a
      escribir la sección 2 de este documento con volúmenes reales**
- [ ] Repetir el sondeo AEO de `eficore/docs/aeo/BASELINE-2026-07.md` con preguntas de
      tarjetas digitales, para tener una línea base de cero menciones igual que con Eficore
