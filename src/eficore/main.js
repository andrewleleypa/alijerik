// EFICORE · Hero 02 — scroll-scrub de metraje real de latte art.
// Técnica Apple/Mercury: secuencia JPEG frotada por el scroll sobre canvas,
// con lerp para que el movimiento se sienta líquido. El 3D modelado (Hero 01)
// quedó descartado en la compuerta de calidad — vive en el historial de git.

const FRAMES = 176;
const SEQ_END = 0.86; // la secuencia termina al 86% del scroll; el resto sostiene el final
const src = (i) => `/eficore-seq/frame-${String(i + 1).padStart(3, "0")}.jpg`;

const canvas = document.getElementById("seq");
const ctx = canvas.getContext("2d");
const loader = document.getElementById("loader");
const lbar = document.getElementById("lbar");
const hint = document.getElementById("hint");
const texts = [
  { el: document.getElementById("t1"), in: 0.03, out: 0.24 },
  { el: document.getElementById("t2"), in: 0.32, out: 0.52 },
  { el: document.getElementById("t3"), in: 0.60, out: 0.78 },
  { el: document.getElementById("t4"), in: 0.88, out: 9 }, // el cierre nunca se desvanece
];

// ── Carga progresiva: arranca al 25%, el resto sigue en fondo ──
const frames = new Array(FRAMES);
let loaded = 0;
let started = false;

function loadFrame(i) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = img.onerror = () => {
      frames[i] = img;
      loaded++;
      lbar.style.width = `${Math.round((loaded / FRAMES) * 100)}%`;
      res();
    };
    img.src = src(i);
  });
}

async function loadAll() {
  // Primer cuadro ya, para pintar de inmediato
  await loadFrame(0);
  draw(0);
  // Carga secuencial en tandas de 8 (orden = orden de scroll)
  for (let i = 1; i < FRAMES; i += 8) {
    await Promise.all(
      Array.from({ length: Math.min(8, FRAMES - i) }, (_, k) => loadFrame(i + k))
    );
    if (!started && loaded >= FRAMES * 0.25) start();
  }
  if (!started) start();
}

function start() {
  started = true;
  loader.style.opacity = "0";
  setTimeout(() => loader.remove(), 700);
  requestAnimationFrame(tick);
}

// ── Canvas cover-fit con DPR ──
let cw = 0, ch = 0, dpr = 1;
function resize() {
  dpr = Math.min(devicePixelRatio, 2);
  cw = innerWidth; ch = innerHeight;
  canvas.width = cw * dpr;
  canvas.height = ch * dpr;
}
addEventListener("resize", () => { resize(); lastDrawn = -1; });
resize();

let lastDrawn = -1;
function draw(idx) {
  const img = frames[idx] || frames[lastDrawn] || frames[0];
  if (!img || !img.width) return;
  if (idx === lastDrawn) return;
  lastDrawn = idx;
  const scale = Math.max((cw * dpr) / img.width, (ch * dpr) / img.height);
  const w = img.width * scale, h = img.height * scale;
  // Foco ligeramente a la izquierda (ahí vive la taza en el encuadre)
  const fx = 0.46, fy = 0.5;
  ctx.drawImage(img, (cw * dpr - w) * fx, (ch * dpr - h) * fy, w, h);
}

// ── Scroll → progreso → cuadro (con lerp) + coreografía de textos ──
let current = 0;
const track = document.getElementById("track");
function progress() {
  // El progreso del hero se mide contra la pista, no contra el documento:
  // debajo de la pista ahora viven las secciones de producto.
  const max = track.offsetHeight - innerHeight;
  return max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
}

// Autoplay en reposo: si el usuario está en el tope sin scrollear, la secuencia
// se reproduce sola (ida y vuelta). Al primer scroll, el usuario retoma el control.
let lastScroll = performance.now();
addEventListener("scroll", () => { lastScroll = performance.now(); }, { passive: true });
let idleFrame = 0, idleDir = 1, lastTs = 0;
const IDLE_MS = 3500, IDLE_FPS = 9;

function fade(p, tin, tout) {
  const ramp = 0.05;
  const a = Math.min((p - tin) / ramp, 1, (tout - p) / ramp);
  return Math.min(1, Math.max(0, a));
}

function tick(ts) {
  const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.1) : 0;
  lastTs = ts;
  const p = progress();

  // Secuencia: p 0 → SEQ_END recorre los cuadros; después sostiene el último
  let target;
  const idle = started && p < 0.05 && performance.now() - lastScroll > IDLE_MS && loaded >= FRAMES;
  if (idle) {
    idleFrame += IDLE_FPS * dt * idleDir;
    if (idleFrame >= FRAMES - 1) { idleFrame = FRAMES - 1; idleDir = -1; }
    if (idleFrame <= 0) { idleFrame = 0; idleDir = 1; }
    target = idleFrame;
  } else {
    target = Math.min(p / SEQ_END, 1) * (FRAMES - 1);
    idleFrame = current; idleDir = 1; // el autoplay retoma desde donde quedó
  }
  current += (target - current) * 0.18;
  // Si el cuadro destino aún no cargó, retrocede al último disponible
  let idx = Math.round(current);
  while (idx > 0 && !frames[idx]) idx--;
  draw(idx);

  for (const t of texts) {
    const a = fade(p, t.in, t.out);
    t.el.style.opacity = a;
    t.el.style.transform = `translate(-50%, ${(1 - a) * 14}px)`;
  }

  hint.style.opacity = p > 0.02 ? "0" : "0.85";

  requestAnimationFrame(tick);
}

// Accesibilidad: si el usuario prefiere sin movimiento, muestra el final directo
if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
  loadFrame(FRAMES - 1).then(() => {
    resize(); current = FRAMES - 1; draw(FRAMES - 1);
    texts[3].el.style.opacity = 1;
    loader.remove(); hint.remove();
  });
} else {
  loadAll();
}
