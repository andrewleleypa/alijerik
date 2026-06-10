// ── Ruido value-noise + fbm compartido ──────────────────────────────
const NOISE = /* glsl */ `
  vec2 hash22(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453) * 2.0 - 1.0;
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = dot(hash22(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0));
    float b = dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
    float c = dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
    float d = dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      v += amp * vnoise(p);
      p *= 2.03;
      amp *= 0.5;
    }
    return v;
  }
`;

// ── DISCO DE ACRECIÓN ────────────────────────────────────────────────
export const diskVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const diskFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform float uTime;
  uniform float uPulse;       // respiración 0..1
  uniform vec3  uLava;
  uniform vec3  uForge;
  uniform vec3  uPlasma;

  ${NOISE}

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float a = atan(p.y, p.x);

    // Horizonte de eventos: negro absoluto en el centro
    float horizon = 0.30 + uPulse * 0.012;
    if (r < horizon) {
      // halo fotónico justo en el borde del horizonte
      float ring = smoothstep(horizon, horizon - 0.05, r);
      gl_FragColor = vec4(mix(uForge, vec3(1.0), 0.35) * ring, ring * 0.9);
      return;
    }

    // Coordenada de remolino: el disco gira, más rápido hacia dentro
    float spin = uTime * (0.18 + 0.25 / (r + 0.2));
    vec2 swirl = vec2(a * 2.2 + spin, r * 3.4 - uTime * 0.15);
    float n = fbm(swirl * 1.6);
    float n2 = fbm(swirl * 4.0 + 11.0);

    // Anillo de acreción: brillante en el borde del horizonte, cae hacia afuera
    float ringEdge = smoothstep(horizon, horizon + 0.05, r);
    float falloff = exp(-(r - horizon) * 3.2);
    float band = ringEdge * falloff;

    // Filamentos de plasma
    float fil = pow(max(0.0, 0.55 + n * 0.7), 2.0) * (0.6 + 0.5 * n2);

    // Borde interno incandescente
    float hot = smoothstep(horizon + 0.16, horizon + 0.01, r);

    float intensity = band * fil * 0.55;
    intensity += hot * band * 0.5;
    intensity *= 0.5 + uPulse * 0.2;

    // Rampa de color: lava (dentro) → forge → plasma (fuera)
    vec3 col = mix(uLava, uForge, smoothstep(horizon, 0.55, r));
    col = mix(col, uPlasma, smoothstep(0.6, 1.0, r) * 0.7);
    col = mix(col, vec3(1.0, 0.9, 0.75), hot * 0.35); // incandescente, no blanco puro

    col *= intensity;

    float alpha = clamp(intensity, 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
  }
`;

// ── PARTÍCULAS (física de espiral en el vertex shader) ───────────────
export const particleVertex = /* glsl */ `
  precision highp float;

  attribute float aSeed;     // fase de vida 0..1
  attribute float aAngle0;   // ángulo inicial
  attribute float aSpeed;    // velocidad angular base
  attribute float aInward;   // velocidad de caída (1/lifetime)
  attribute float aDir;      // sentido de giro (+1/-1)
  attribute float aSize;     // tamaño base
  attribute float aTint;     // 0 lava .. 1 plasma
  attribute float aThick;    // grosor vertical -0.5..0.5

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uBurst;      // 0 normal .. 1 explosión por scroll

  varying float vHeat;
  varying float vAlpha;
  varying float vTint;

  const float R_MAX = 4.2;
  const float R_MIN = 0.74; // se desvanecen antes del centro → hueco limpio

  void main() {
    // Vida cíclica: 0 = nace en el borde, 1 = se desvanece en el centro
    float life = fract(uTime * aInward + aSeed);

    // Radio: cae del borde hacia el horizonte
    float radius = mix(R_MAX, R_MIN, life);

    // Burst de scroll: empuja hacia afuera
    radius += uBurst * (3.0 + aSeed * 5.0) * life;

    // Giro que se acelera al acercarse al centro
    float angle = aAngle0 + aDir * aSpeed * ((R_MAX / radius) - 1.0) * 0.5;

    float x = cos(angle) * radius;
    float z = sin(angle) * radius;
    float y = aThick * radius * 0.10;          // disco más fino hacia el centro
    y += sin(uTime * 0.6 + aSeed * 30.0) * 0.02;

    vec3 pos = vec3(x, y, z);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Calor: aumenta al caer hacia el centro
    vHeat = 1.0 - smoothstep(R_MIN, R_MAX * 0.55, radius);
    vTint = aTint;

    // Fade en aparición y desvanecimiento
    float fadeIn = smoothstep(0.0, 0.06, life);
    float fadeOut = 1.0 - smoothstep(0.78, 0.97, life);
    vAlpha = fadeIn * fadeOut * (1.0 - uBurst * 0.4);

    float size = aSize * (0.5 + vHeat * 0.9);
    gl_PointSize = size * uPixelRatio * (130.0 / max(0.1, -mvPosition.z));
  }
`;

// ── ESTRELLAS (variadas, con parpadeo, fuera del bloom) ──────────────
export const starVertex = /* glsl */ `
  precision highp float;
  attribute float aSize;
  attribute float aBright;
  attribute float aPhase;
  attribute float aTint;
  attribute float aTwk;   // cuánto titila (0 = casi fija, 1 = pulsa fuerte)

  uniform float uTime;
  uniform float uPixelRatio;

  varying float vBright;
  varying float vTint;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;

    // Parpadeo orgánico: dos frecuencias, amplitud distinta por estrella
    float ph = aPhase * 6.2831;
    float s = 0.6 * sin(uTime * (0.25 + aPhase * 1.3) + ph)
            + 0.4 * sin(uTime * (0.7 + aPhase * 0.9) + ph * 1.7);
    float tw = 1.0 - aTwk + aTwk * (0.5 + 0.5 * s);
    vBright = aBright * tw;
    vTint = aTint;

    gl_PointSize = aSize * uPixelRatio * (160.0 / max(0.1, -mv.z));
  }
`;

export const starFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uPlasma;
  uniform vec3 uNebula;
  varying float vBright;
  varying float vTint;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float core = pow(smoothstep(0.5, 0.0, d), 1.6);

    // Mayoría blancas; unas pocas con tinte plasma/nebula
    vec3 tint = mix(uPlasma, uNebula, fract(vTint * 1.7));
    vec3 col = mix(vec3(1.0), tint, vTint * 0.7);

    gl_FragColor = vec4(col, core * vBright);
  }
`;

// ── NEBULOSA (polvo cósmico con fbm + domain warping) ────────────────
export const nebulaVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const nebulaFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uSeed;
  uniform vec3 uColor;
  uniform float uOpacity;

  ${NOISE}

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float r = length(uv);

    // Máscara radial suave e irregular (borde de nube, no de oblea)
    float mask = pow(smoothstep(1.0, 0.05, r), 1.5);

    // Domain warping: deforma el espacio antes de muestrear → wisps de polvo
    vec2 q = uv * 1.7 + uSeed;
    float warp = fbm(q * 1.4 + uTime * 0.015);
    vec2 w = q + warp * 0.9;

    float dust = fbm(w * 2.1) * 0.5 + 0.5;        // cuerpo de la nube
    float fil = fbm(w * 5.5 + 7.0) * 0.5 + 0.5;   // filamentos finos

    float density = mask * (dust * 0.75 + fil * 0.45);
    density = pow(density, 1.5);

    // Núcleo apenas más denso + filamentos brillantes
    vec3 col = uColor * density;
    col += uColor * pow(mask, 3.0) * 0.25;
    col += vec3(1.0) * pow(fil * mask, 4.0) * 0.12; // chispas de luz en el polvo

    gl_FragColor = vec4(col, density * uOpacity);
  }
`;

// ── ESTRELLAS FUGACES (líneas con cabeza brillante y estela) ─────────
export const meteorVertex = /* glsl */ `
  precision highp float;
  attribute vec3 aStart;   // punto de partida
  attribute vec3 aDir;     // dirección normalizada
  attribute float aSpeed;  // 1 / periodo
  attribute float aSeed;   // desfase
  attribute float aLen;    // largo del recorrido
  attribute float aTail;   // 0 = cabeza, 1 = cola
  attribute float aTailLen;

  uniform float uTime;
  varying float vAlpha;
  varying float vTail;

  void main() {
    // Ventana de visibilidad: solo aparece un ratito de cada ciclo
    float life = fract(uTime * aSpeed + aSeed);
    float vis = smoothstep(0.0, 0.03, life) * (1.0 - smoothstep(0.20, 0.34, life));

    float travel = life * aLen;
    vec3 head = aStart + aDir * travel;
    vec3 pos = head - aDir * (aTail * aTailLen);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

    // Cabeza brillante, cola desvanecida
    vAlpha = vis * (1.0 - aTail);
    vTail = aTail;
  }
`;

export const meteorFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uPlasma;
  varying float vAlpha;
  varying float vTail;
  void main() {
    vec3 col = mix(vec3(1.0), uPlasma, 0.4);
    gl_FragColor = vec4(col, vAlpha);
  }
`;

export const particleFragment = /* glsl */ `
  precision highp float;

  uniform vec3 uLava;
  uniform vec3 uPlasma;

  varying float vHeat;
  varying float vAlpha;
  varying float vTint;

  void main() {
    // Punto circular suave
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.0, d);

    vec3 col = mix(uLava, uPlasma, vTint);
    col = mix(col, vec3(1.0, 0.95, 0.85), vHeat * 0.45); // caliente pero conserva color
    col *= 0.4 + vHeat * 0.55;

    float alpha = soft * vAlpha * (0.18 + vHeat * 0.4);
    gl_FragColor = vec4(col, alpha);
  }
`;
