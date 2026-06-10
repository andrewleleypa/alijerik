import "./styles/main.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
gsap.ticker.lagSmoothing(0); // tweens estables aunque el tab pierda foco / saltos de tiempo

// ── Detección de modo lite ───────────────────────────────────────────
const conn = navigator.connection;
const slowNet =
  conn && (conn.effectiveType === "2g" || conn.effectiveType === "slow-2g");
const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;
const isLite = slowNet || reducedMotion;

const canvas = document.getElementById("hero-canvas");

// Cuenta de partículas según el dispositivo
function particleBudget() {
  const mem = navigator.deviceMemory || 4;
  const mobile = window.matchMedia("(max-width: 768px)").matches;
  if (mobile) return 7000;
  if (mem <= 4) return 12000;
  return 18000;
}

async function boot() {
  if (isLite) {
    enterLiteMode();
    revealHero();
    return;
  }

  // Carga diferida del hero WebGL con guardia de tiempo
  const watchdog = setTimeout(() => {
    console.warn("[alijerik] Three.js tardó demasiado → modo lite");
    enterLiteMode();
  }, 3000);

  try {
    const { Hero } = await import("./hero/Hero.js");
    // Si el watchdog ya activó lite (carga > 3s), no levantamos WebGL encima
    if (liteActivated) {
      revealHero();
      return;
    }
    clearTimeout(watchdog);
    const hero = new Hero(canvas, { particleCount: particleBudget() });

    // Scroll del hero → burst de partículas
    ScrollTrigger.create({
      trigger: "#hero",
      start: "top top",
      end: "bottom top",
      onUpdate: (self) => hero.setBurst(self.progress),
    });

    window.__alijerikHero = hero;
  } catch (err) {
    console.error("[alijerik] fallo WebGL → modo lite", err);
    clearTimeout(watchdog);
    enterLiteMode();
  }

  revealHero();
}

// ── Fallback lite: gradientes CSS en vez de WebGL ────────────────────
let liteActivated = false;
function enterLiteMode() {
  if (liteActivated) return;
  liteActivated = true;
  document.body.classList.add("lite");
  if (canvas) {
    canvas.classList.add("lite-bg");
  }
}

// ── Reveals del hero (forja de izquierda a derecha) ──────────────────
function revealHero() {
  if (reducedMotion) {
    document.body.classList.add("no-anim");
    return;
  }
  const items = gsap.utils.toArray("[data-reveal]");
  gsap.to(items, {
    opacity: 1,
    y: 0,
    duration: 1.1,
    ease: "power3.out",
    stagger: 0.14,
    delay: 0.3,
  });
}

// ── Lenis smooth scroll (solo si hay más secciones / no reduced) ─────
async function initSmoothScroll() {
  if (reducedMotion) return;
  const { default: Lenis } = await import("lenis");
  const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  function raf(time) {
    lenis.raf(time);
    ScrollTrigger.update();
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
  window.__lenis = lenis;
}

boot();
initSmoothScroll();
