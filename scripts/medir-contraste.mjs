/**
 * Mide el contraste REAL de los colores de texto de una página del sitio.
 *
 * Nació el 2026-07-30, importando la lección del repo de Eficore: "está feo" no
 * se arregla adivinando, se mide — pero **medir mal es peor que no medir**,
 * porque produce números con cara de dato. Allá la primera medición se hizo con
 * hexes transcritos A MANO y publicó cifras de colores que no existían en el CSS.
 *
 * Por eso este script LEE el archivo en vez de que alguien le dicte los valores:
 *
 *  1. Extrae los tokens de `:root{...}`.
 *  2. Recoge todo hex que aparezca en una declaración `color:` — resolviendo
 *     `var(--x)` contra los tokens. Esto incluye los **colores escritos a mano**
 *     fuera de la paleta, que son los que nadie vigila.
 *  3. Recoge los fondos (`background`, `background-color`, gradientes) y se queda
 *     con los DOS MÁS CLAROS: en un tema oscuro, el fondo más claro es el peor
 *     caso para el texto. Medir sólo contra el fondo de la página deja el defecto
 *     vivo en los paneles.
 *
 * Umbrales de WCAG 2.1 que sí aplican acá: texto normal 4.5:1 (SC 1.4.3), texto
 * grande 3:1. NO se le pone veredicto a bordes ni separadores decorativos: SC
 * 1.4.11 no los cubre si el elemento ya se distingue por contenido y espaciado,
 * así que subirlos es una decisión estética y vestirla de cumplimiento sería
 * colar un cambio de cara del producto por la puerta de atrás.
 *
 * ⚠️ LO QUE ESTE SCRIPT NO SABE, y hay que tenerlo presente para no perseguir
 *    fantasmas: mide el PRODUCTO CRUZADO de cada color de texto contra las
 *    superficies más claras, no los emparejamientos reales del CSS. Si un color
 *    sólo se usa sobre un fondo más oscuro que el peor caso, su fila puede salir
 *    peor de lo que es en la pantalla. Ejemplo real: el comentario dentro de los
 *    bloques `<pre>` vive sobre `#120E0A` (más oscuro que la página) y ahí mide
 *    4.63:1, pero el informe lo reporta contra `#2A2019` y da 3.84:1.
 *
 *    Regla de lectura: un `BAJO` **siempre** hay que atenderlo. Un "solo texto
 *    GRANDE" hay que **confirmarlo contra el fondo donde ese color se usa de
 *    verdad** antes de cambiar nada.
 *
 * Uso:  node scripts/medir-contraste.mjs formula-antislop/index.html
 *       node scripts/medir-contraste.mjs eficore/ley-81/index.html
 *
 * En Git Bash hay que pasar `MSYS_NO_PATHCONV=1` si algún argumento empieza con
 * `/`, porque si no lo convierte a una ruta de Windows.
 */
import { readFileSync } from "node:fs";

const UMBRAL_NORMAL = 4.5;
const UMBRAL_GRANDE = 3.0;

const archivos = process.argv.slice(2);
if (!archivos.length) {
  console.error("Falta la ruta del HTML. Ej: node scripts/medir-contraste.mjs formula-antislop/index.html");
  process.exit(2);
}

const aRgb = (hex) => {
  let h = hex.replace("#", "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

const lum = ([r, g, b]) => {
  const f = (v) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : (((v / 255) + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

const contraste = (frente, fondo) => {
  const [a, b] = [lum(aRgb(frente)), lum(aRgb(fondo))];
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
};

let fallos = 0;

for (const archivo of archivos) {
  const css = readFileSync(archivo, "utf8");

  // 1. Tokens de :root
  const bloqueRoot = css.match(/:root\s*\{([^}]*)\}/s)?.[1] ?? "";
  const tokens = Object.fromEntries(
    [...bloqueRoot.matchAll(/--([\w-]+)\s*:\s*(#[0-9A-Fa-f]{3,6})\s*;/g)].map((m) => [m[1], m[2]])
  );

  const resolver = (valor) => {
    const v = valor.trim();
    if (v.startsWith("#")) return v;
    const nombre = v.match(/var\(\s*--([\w-]+)/)?.[1];
    return nombre && tokens[nombre] ? tokens[nombre] : null;
  };

  // 2. Colores de TEXTO: cada declaración `color:`. Incluye los hardcodeados.
  const textos = new Map(); // hex -> Set(origen)
  for (const m of css.matchAll(/(^|[;{\s])color\s*:\s*([^;}]+)[;}]/g)) {
    const hex = resolver(m[2]);
    if (!hex) continue;
    const etiqueta = m[2].includes("var(") ? m[2].trim() : `${hex} (a mano)`;
    if (!textos.has(hex)) textos.set(hex, new Set());
    textos.get(hex).add(etiqueta);
  }

  // 3. Fondos. Ojo, acá está la parte delicada y la primera versión de este
  //    script la hizo MAL: recogía todo hex de un `background`, así que tomaba
  //    como "fondo" los gradientes DECORATIVOS (la franja de color del checklist,
  //    los divisores). Contra esos, todo texto sale "BAJO" y el informe entero
  //    se vuelve ruido con cara de dato.
  //
  //    El filtro que los separa es de principio, no de lista: en un tema
  //    coherente, una SUPERFICIE donde se pinta texto es vecina del fondo de la
  //    página. Un acento decorativo contrasta fuerte contra ella. Así que sólo
  //    califica como superficie lo que está a menos de 2:1 del fondo base.
  const base = tokens.espresso;
  const LIMITE_SUPERFICIE = 2.0;
  const fondos = new Set();
  for (const m of css.matchAll(/background(?:-color)?\s*:\s*([^;}]+)[;}]/g)) {
    for (const h of m[1].matchAll(/#[0-9A-Fa-f]{6}\b/g)) fondos.add(h[0]);
    const tok = resolver(m[1]);
    if (tok) fondos.add(tok);
  }
  const superficies = [...fondos].filter((f) => base && contraste(f, base) < LIMITE_SUPERFICIE);
  // El más CLARO es el peor caso para texto claro.
  const peores = superficies.sort((a, b) => lum(aRgb(b)) - lum(aRgb(a))).slice(0, 2);
  const contra = [...new Set([base, ...peores].filter(Boolean))];

  console.log(`\n${"=".repeat(84)}\n${archivo}\n${"=".repeat(84)}`);
  console.log(`Fondos medidos (el más claro primero — peor caso para texto claro): ${contra.join("  ")}\n`);
  console.log("  COLOR DE TEXTO           " + contra.map((f) => f.padEnd(11)).join("") + " VEREDICTO");
  console.log("  " + "-".repeat(80));

  for (const [hex, origenes] of [...textos].sort((a, b) => lum(aRgb(a[0])) - lum(aRgb(b[0])))) {
    const ratios = contra.map((f) => contraste(hex, f));
    const peor = Math.min(...ratios);
    const marca = peor >= UMBRAL_NORMAL ? "OK" : peor >= UMBRAL_GRANDE ? "solo texto GRANDE" : "BAJO";
    if (peor < UMBRAL_GRANDE) fallos++;
    const etq = [...origenes][0];
    console.log(
      `  ${etq.padEnd(24)} ` +
      ratios.map((r) => `${r.toFixed(2)}:1`.padEnd(11)).join("") +
      ` ${marca}`
    );
  }
}

console.log(
  `\nNota: pasar el umbral no alcanza. Hay que mirar la ESCALERA — un color puede` +
  `\ncumplir y arruinar la jerarquía igual si se acerca al nivel de arriba.\n`
);
process.exit(fallos ? 1 : 0);
