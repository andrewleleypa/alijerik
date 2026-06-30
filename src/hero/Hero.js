import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

import {
  diskVertex,
  diskFragment,
  particleVertex,
  particleFragment,
  starVertex,
  starFragment,
  meteorVertex,
  meteorFragment,
  nebulaVertex,
  nebulaFragment,
} from "./shaders.js";

const PALETTE = {
  lava: new THREE.Color("#ff3d00"),
  forge: new THREE.Color("#ff8c00"),
  plasma: new THREE.Color("#00e5ff"),
  nebula: new THREE.Color("#7b2fff"),
};

export class Hero {
  constructor(canvas, { particleCount = 18000 } = {}) {
    this.canvas = canvas;
    this.particleCount = particleCount;
    this.clock = new THREE.Clock();
    this.mouse = new THREE.Vector2(0, 0);
    this.mouseTarget = new THREE.Vector2(0, 0);
    this.burst = 0;
    this.burstTarget = 0;
    this._raf = null;

    this._initRenderer();
    this._initScene();
    this._initDisk();
    this._initParticles();
    this._initGalaxies();
    this._initStars();
    this._initMeteors();
    this._initComposer();
    this._bindEvents();

    this._animate = this._animate.bind(this);
    this._raf = requestAnimationFrame(this._animate);
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.pixelRatio = Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 1);
    // Tone-mapping: comprime los highlights HDR y evita el quemado a blanco
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.7;
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      38,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    // Encuadre de diseño: el FOV vertical 38 está pensado para apaisado.
    // En vertical (móvil) bloqueamos el FOV horizontal para que los meteoros
    // y nebulosas laterales no se salgan de cuadro.
    this.baseFov = 38;
    this.baseAspect = 16 / 9;
    this._applyFov();
    this.camera.position.set(0, 2.5, 6.4);
    this.camera.lookAt(0, 0, 0);

    // Grupo que recibe el parallax
    this.world = new THREE.Group();
    this.world.rotation.x = -0.22; // inclinación del disco para ver el anillo
    this.scene.add(this.world);

    // Fondo profundo (estrellas, galaxias, fugaces) con parallax propio, más sutil
    this.cosmos = new THREE.Group();
    this.scene.add(this.cosmos);
  }

  _initDisk() {
    const geo = new THREE.PlaneGeometry(11, 11, 1, 1);
    geo.rotateX(-Math.PI / 2); // acostar el disco en el plano XZ

    this.diskMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPulse: { value: 0 },
        uLava: { value: PALETTE.lava },
        uForge: { value: PALETTE.forge },
        uPlasma: { value: PALETTE.plasma },
      },
      vertexShader: diskVertex,
      fragmentShader: diskFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    this.disk = new THREE.Mesh(geo, this.diskMat);
    this.world.add(this.disk);

    // Núcleo negro (esfera) que ocluye y da volumen al horizonte
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    this.world.add(core);
    this.core = core;
  }

  _initParticles() {
    const n = this.particleCount;
    const positions = new Float32Array(n * 3); // placeholder (todo se calcula en GPU)
    const aSeed = new Float32Array(n);
    const aAngle0 = new Float32Array(n);
    const aSpeed = new Float32Array(n);
    const aInward = new Float32Array(n);
    const aDir = new Float32Array(n);
    const aSize = new Float32Array(n);
    const aTint = new Float32Array(n);
    const aThick = new Float32Array(n);

    for (let i = 0; i < n; i++) {
      aSeed[i] = Math.random();
      aAngle0[i] = Math.random() * Math.PI * 2;
      aSpeed[i] = 0.6 + Math.random() * 1.4;
      aInward[i] = 0.012 + Math.random() * 0.05; // 1/lifetime
      aDir[i] = 1.0; // mismo sentido = disco coherente
      aSize[i] = 1.0 + Math.random() * 2.4;
      aTint[i] = Math.pow(Math.random(), 1.6); // sesgo hacia lava
      aThick[i] = Math.random() - 0.5;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(aSeed, 1));
    geo.setAttribute("aAngle0", new THREE.BufferAttribute(aAngle0, 1));
    geo.setAttribute("aSpeed", new THREE.BufferAttribute(aSpeed, 1));
    geo.setAttribute("aInward", new THREE.BufferAttribute(aInward, 1));
    geo.setAttribute("aDir", new THREE.BufferAttribute(aDir, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(aSize, 1));
    geo.setAttribute("aTint", new THREE.BufferAttribute(aTint, 1));
    geo.setAttribute("aThick", new THREE.BufferAttribute(aThick, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12);

    this.particleMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: this.pixelRatio },
        uBurst: { value: 0 },
        uLava: { value: PALETTE.lava },
        uPlasma: { value: PALETTE.plasma },
      },
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.particles = new THREE.Points(geo, this.particleMat);
    this.world.add(this.particles);
  }

  _initStars() {
    const count = 1700;
    const pos = new Float32Array(count * 3);
    const aSize = new Float32Array(count);
    const aBright = new Float32Array(count);
    const aPhase = new Float32Array(count);
    const aTint = new Float32Array(count);
    const aTwk = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const r = 30 + Math.random() * 38;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      // Ley de potencias agresiva: casi todas diminutas, muy pocas grandes
      aSize[i] = 0.35 + Math.pow(Math.random(), 5.0) * 3.0;
      aBright[i] = 0.22 + Math.pow(Math.random(), 2.2) * 0.5; // tope < 0.72 → fuera del bloom
      aPhase[i] = Math.random();
      aTint[i] = Math.random() < 0.16 ? Math.random() : 0.0; // ~16% con tinte
      // Pocas titilan fuerte, la mayoría casi fijas → cielo real, no shimmer uniforme
      aTwk[i] = Math.pow(Math.random(), 2.5);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(aSize, 1));
    geo.setAttribute("aBright", new THREE.BufferAttribute(aBright, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(aPhase, 1));
    geo.setAttribute("aTint", new THREE.BufferAttribute(aTint, 1));
    geo.setAttribute("aTwk", new THREE.BufferAttribute(aTwk, 1));

    this.starMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: this.pixelRatio },
        uPlasma: { value: PALETTE.plasma },
        uNebula: { value: PALETTE.nebula },
      },
      vertexShader: starVertex,
      fragmentShader: starFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    this.stars = new THREE.Points(geo, this.starMat);
    this.cosmos.add(this.stars);
  }

  _initGalaxies() {
    // Nubes de polvo cósmico: planos con shader fbm (no obleas de luz)
    const tints = [PALETTE.nebula, PALETTE.plasma, PALETTE.lava];
    this.nebulae = [];

    for (let i = 0; i < 3; i++) {
      const tint = tints[i].clone().lerp(new THREE.Color(0xffffff), 0.18);
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uSeed: { value: Math.random() * 40 },
          uColor: { value: tint },
          uOpacity: { value: 0.22 + Math.random() * 0.12 },
        },
        vertexShader: nebulaVertex,
        fragmentShader: nebulaFragment,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      });

      const size = 22 + Math.random() * 18;
      const geo = new THREE.PlaneGeometry(size, size * (0.6 + Math.random() * 0.3));
      const mesh = new THREE.Mesh(geo, mat);

      const ang = Math.random() * Math.PI * 2;
      const rad = 14 + Math.random() * 12;
      mesh.position.set(
        Math.cos(ang) * rad,
        (Math.random() - 0.5) * 16 + 3,
        -24 - Math.random() * 12 // bien al fondo
      );
      mesh.rotation.z = Math.random() * Math.PI;
      this.cosmos.add(mesh);
      this.nebulae.push(mat);
    }
  }

  _initMeteors() {
    const n = 7;
    const verts = n * 2; // cabeza + cola
    const pos = new Float32Array(verts * 3);
    const aStart = new Float32Array(verts * 3);
    const aDir = new Float32Array(verts * 3);
    const aSpeed = new Float32Array(verts);
    const aSeed = new Float32Array(verts);
    const aLen = new Float32Array(verts);
    const aTail = new Float32Array(verts);
    const aTailLen = new Float32Array(verts);

    for (let m = 0; m < n; m++) {
      // Nace cerca del borde superior visible y cruza en diagonal hacia abajo
      const sx = (Math.random() - 0.5) * 22;
      const sy = 6 + Math.random() * 4;
      const sz = -12 - Math.random() * 10;
      const dir = new THREE.Vector3(
        -0.45 - Math.random() * 0.5,
        -0.7 - Math.random() * 0.25,
        0.04 * (Math.random() - 0.5)
      ).normalize();
      const speed = 0.09 + Math.random() * 0.09; // ciclos cortos → frecuentes
      const seed = Math.random();
      const len = 18 + Math.random() * 12;
      const tailLen = 2.5 + Math.random() * 3.0;

      for (let v = 0; v < 2; v++) {
        const idx = m * 2 + v;
        aStart[idx * 3] = sx;
        aStart[idx * 3 + 1] = sy;
        aStart[idx * 3 + 2] = sz;
        aDir[idx * 3] = dir.x;
        aDir[idx * 3 + 1] = dir.y;
        aDir[idx * 3 + 2] = dir.z;
        aSpeed[idx] = speed;
        aSeed[idx] = seed;
        aLen[idx] = len;
        aTail[idx] = v; // 0 cabeza, 1 cola
        aTailLen[idx] = tailLen;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aStart", new THREE.BufferAttribute(aStart, 3));
    geo.setAttribute("aDir", new THREE.BufferAttribute(aDir, 3));
    geo.setAttribute("aSpeed", new THREE.BufferAttribute(aSpeed, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(aSeed, 1));
    geo.setAttribute("aLen", new THREE.BufferAttribute(aLen, 1));
    geo.setAttribute("aTail", new THREE.BufferAttribute(aTail, 1));
    geo.setAttribute("aTailLen", new THREE.BufferAttribute(aTailLen, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);

    this.meteorMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPlasma: { value: PALETTE.plasma },
      },
      vertexShader: meteorVertex,
      fragmentShader: meteorFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.meteors = new THREE.LineSegments(geo, this.meteorMat);
    this.cosmos.add(this.meteors);
  }

  _initComposer() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.35, // strength
      0.4, // radius
      0.72 // threshold — solo florea lo genuinamente brillante
    );
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
  }

  _bindEvents() {
    this._onResize = this._onResize.bind(this);
    this._onPointer = this._onPointer.bind(this);
    window.addEventListener("resize", this._onResize);
    window.addEventListener("pointermove", this._onPointer);
  }

  _onPointer(e) {
    this.mouseTarget.set(
      (e.clientX / window.innerWidth) * 2 - 1,
      (e.clientY / window.innerHeight) * 2 - 1
    );
  }

  // FOV adaptativo: en pantallas verticales (aspect < base) crecemos el FOV
  // vertical para mantener constante el horizontal del encuadre apaisado.
  _applyFov() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera.aspect = aspect;
    if (aspect < this.baseAspect) {
      const baseV = (this.baseFov * Math.PI) / 180;
      const targetH = 2 * Math.atan(Math.tan(baseV / 2) * this.baseAspect);
      this.camera.fov =
        (2 * Math.atan(Math.tan(targetH / 2) / aspect) * 180) / Math.PI;
    } else {
      this.camera.fov = this.baseFov;
    }
    this.camera.updateProjectionMatrix();
  }

  _onResize() {
    this._applyFov();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  // 0..1 — empuja las partículas hacia afuera al hacer scroll
  setBurst(v) {
    this.burstTarget = THREE.MathUtils.clamp(v, 0, 1);
  }

  _animate() {
    this._raf = requestAnimationFrame(this._animate);
    const t = this.clock.getElapsedTime();

    // Respiración del agujero negro
    const pulse = Math.sin(t * 0.8) * 0.5 + 0.5;

    // Easing del mouse y del burst
    this.mouse.lerp(this.mouseTarget, 0.04);
    this.burst += (this.burstTarget - this.burst) * 0.08;

    // Parallax: el mundo se inclina hacia el cursor
    this.world.rotation.y = this.mouse.x * 0.35;
    this.world.rotation.x = -0.22 - this.mouse.y * 0.16;
    this.camera.position.x = this.mouse.x * 0.5;
    this.camera.position.y = 2.5 - this.mouse.y * 0.3;
    this.camera.lookAt(0, 0, 0);

    this.diskMat.uniforms.uTime.value = t;
    this.diskMat.uniforms.uPulse.value = pulse;
    this.particleMat.uniforms.uTime.value = t;
    this.particleMat.uniforms.uBurst.value = this.burst;

    // Respiración sutil del conjunto
    const s = 1 + pulse * 0.015;
    this.world.scale.setScalar(s);

    this.starMat.uniforms.uTime.value = t;
    this.meteorMat.uniforms.uTime.value = t;
    for (let i = 0; i < this.nebulae.length; i++) {
      this.nebulae[i].uniforms.uTime.value = t;
    }
    this.stars.rotation.y = t * 0.004; // deriva casi imperceptible

    // Parallax del fondo: más sutil que el del disco → sensación de profundidad
    this.cosmos.rotation.y = this.mouse.x * 0.08;
    this.cosmos.rotation.x = this.mouse.y * 0.05;

    this.composer.render();
  }

  dispose() {
    cancelAnimationFrame(this._raf);
    window.removeEventListener("resize", this._onResize);
    window.removeEventListener("pointermove", this._onPointer);
    this.renderer.dispose();
  }
}
