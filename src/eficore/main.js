// EFICORE · Hero 01 — prototipo de la escena cappuccino.
// Acto 1: la jarra trabaja sobre la taza y el corazón (marca) se forma en la espuma.
// Paleta oficial: café #C2410C · leche #E8D3B0 · espuma #FBF5EA · espresso #17120D.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
camera.position.set(0, 3.4, 5.4);
camera.lookAt(0, 0.45, 0);

// ───── Luces: key cálida + rim terracota ─────
const key = new THREE.DirectionalLight(0xffd9b0, 1.6);
key.position.set(3, 5, 2.5);
scene.add(key);
const rim = new THREE.PointLight(0xe8743c, 6, 12);
rim.position.set(-3.2, 1.6, -2.4);
scene.add(rim);

// ───── Mesa (ancla la composición) ─────
const table = new THREE.Mesh(
  new THREE.CircleGeometry(9, 64).rotateX(-Math.PI / 2),
  new THREE.MeshStandardMaterial({ color: 0x1d150f, roughness: 0.92, metalness: 0 })
);
table.position.y = -0.09;
scene.add(table);

// Sombra de contacto fake (radial en canvas 2D)
function contactShadow(size, alpha) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(128, 128, 20, 128, 128, 128);
  grad.addColorStop(0, `rgba(0,0,0,${alpha})`);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })
  );
  return m;
}
const cupShadow = contactShadow(4.6, 0.55);
cupShadow.position.y = -0.075;
scene.add(cupShadow);

// ───── Cerámica: taza cappuccino + plato ─────
const ceramic = new THREE.MeshPhysicalMaterial({
  color: 0xf4ede1,
  roughness: 0.3,
  clearcoat: 0.55,
  clearcoatRoughness: 0.3,
  side: THREE.DoubleSide,
});

// Perfil con grosor de pared: sube por fuera, baja por dentro.
const cupPts = [
  new THREE.Vector2(0.0, 0.03),
  new THREE.Vector2(0.34, 0.03),
  new THREE.Vector2(0.52, 0.06),
  new THREE.Vector2(0.78, 0.22),
  new THREE.Vector2(1.02, 0.52),
  new THREE.Vector2(1.16, 0.86),
  new THREE.Vector2(1.2, 1.02),   // borde exterior
  new THREE.Vector2(1.12, 1.0),   // borde interior
  new THREE.Vector2(1.0, 0.72),
  new THREE.Vector2(0.9, 0.6),    // pared interna hasta el nivel del café
];
const cup = new THREE.Mesh(new THREE.LatheGeometry(cupPts, 96), ceramic);
scene.add(cup);

const saucer = new THREE.Mesh(
  new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.55, 0.0),
      new THREE.Vector2(0.2, 0.02),
      new THREE.Vector2(0.2, 0.05),
      new THREE.Vector2(0.62, 0.07),   // pocillo donde asienta la taza
      new THREE.Vector2(0.68, 0.05),
      new THREE.Vector2(1.35, 0.1),
      new THREE.Vector2(1.72, 0.22),   // borde que sube
      new THREE.Vector2(1.75, 0.26),
      new THREE.Vector2(1.68, 0.25),
    ],
    96
  ),
  ceramic
);
saucer.position.y = -0.06;
scene.add(saucer);

const handle = new THREE.Mesh(
  new THREE.TorusGeometry(0.28, 0.07, 20, 48, Math.PI * 1.35),
  ceramic
);
handle.position.set(1.2, 0.55, 0);
handle.rotation.z = -2.1; // hueco del arco mirando a la taza
scene.add(handle);

// ───── Superficie del café: shader — crema viva + corazón que se forma ─────
const coffeeUniforms = {
  uTime: { value: 0 },
  uProgress: { value: 0 }, // 0 → 1: el corazón aparece
};
const coffee = new THREE.Mesh(
  new THREE.CircleGeometry(1.02, 96).rotateX(-Math.PI / 2),
  new THREE.ShaderMaterial({
    uniforms: coffeeUniforms,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime, uProgress;

      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        f = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), f.x),
                   mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
      }
      float fbm(vec2 p){
        float v = 0.0, a = 0.5;
        for(int i=0;i<5;i++){ v += a*noise(p); p = p*2.03 + 11.7; a *= 0.5; }
        return v;
      }
      float dot2(vec2 v){ return dot(v,v); }
      // IQ heart SDF — punta en (0,0), lóbulos hacia y=1
      float sdHeart(vec2 p){
        p.x = abs(p.x);
        if(p.y + p.x > 1.0) return sqrt(dot2(p - vec2(0.25,0.75))) - sqrt(2.0)/4.0;
        return sqrt(min(dot2(p - vec2(0.0,1.0)), dot2(p - 0.5*max(p.x+p.y,0.0)))) * sign(p.x - p.y);
      }

      void main(){
        vec2 p = (vUv - 0.5) * 2.0;           // -1..1
        float r = length(p);

        // Remolino lento de la crema
        float ang = atan(p.y, p.x) + 0.05*uTime + 0.35*fbm(p*2.0 + uTime*0.03);
        vec2 sw = vec2(cos(ang), sin(ang)) * r;

        // Crema: caramelo profundo, borde tostado oscuro, vetas finas
        vec3 crema      = vec3(0.596,0.220,0.055);  // caramelo quemado
        vec3 tostado    = vec3(0.322,0.110,0.038);  // borde oscuro
        vec3 veta       = vec3(0.792,0.373,0.150);  // veta cálida
        float grain = fbm(sw*9.0 + uTime*0.05);
        vec3 col = mix(crema, tostado, smoothstep(0.45, 1.0, r));
        col = mix(col, veta, 0.18 * smoothstep(0.6, 0.92, grain));

        // Corazón (marca Eficore) — punta hacia el espectador (abajo en la taza)
        vec2 hp = vec2(p.x, -p.y) * 1.8 + vec2(0.0, 0.72);
        // Borde orgánico sutil: la leche difunde apenas en la crema
        float wob = (fbm(p*6.0 + uTime*0.06) - 0.5) * 0.055;
        float d = sdHeart(hp) + wob;
        // Aparición: crece desde el centro con el progreso
        float reveal = mix(0.55, -0.015, smoothstep(0.0, 1.0, uProgress));
        float milkMask = smoothstep(reveal + 0.025, reveal - 0.025, d);
        // Anillo de crema empujada en el borde del corazón (como en el latte real)
        float push = smoothstep(reveal + 0.09, reveal + 0.02, d) * (1.0 - milkMask);
        col = mix(col, tostado, 0.5 * push * uProgress);

        vec3 leche  = vec3(0.910,0.827,0.690);      // #E8D3B0
        vec3 espuma = vec3(0.984,0.961,0.918);      // #FBF5EA
        // La espuma del corazón con textura de microespuma sutil
        vec3 milk = mix(leche, espuma, smoothstep(0.12, -0.28, d));
        milk -= 0.04 * fbm(p*14.0 + 3.7);
        col = mix(col, milk, milkMask);

        // Brillo húmedo sutil que respira
        col += 0.04 * fbm(sw*3.0 - uTime*0.06);
        // Viñeta hacia la pared de la taza
        col *= 1.0 - 0.25*smoothstep(0.86, 1.0, r);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  })
);
coffee.position.y = 0.62;
scene.add(coffee);

// ───── Jarra de acero (Alijerik) — trabajando sobre la taza ─────
const steel = new THREE.MeshPhysicalMaterial({
  color: 0xcfcac2,
  metalness: 1.0,
  roughness: 0.32, // acero cepillado, no cromo espejo
});
const pitcherPts = [
  new THREE.Vector2(0.0, 0.0),
  new THREE.Vector2(0.42, 0.0),
  new THREE.Vector2(0.5, 0.04),
  new THREE.Vector2(0.55, 0.3),
  new THREE.Vector2(0.47, 0.75),
  new THREE.Vector2(0.45, 0.98),
  new THREE.Vector2(0.5, 1.14),  // labio que se abre
  new THREE.Vector2(0.47, 1.15),
  new THREE.Vector2(0.4, 1.0),
];
const pitcherBody = new THREE.Mesh(new THREE.LatheGeometry(pitcherPts, 80), steel);
// Pico: estira el labio hacia adelante con transición suave (sin pliegues)
{
  const pos = pitcherBody.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i), z = pos.getZ(i);
    const tY = THREE.MathUtils.smoothstep(y, 0.85, 1.15);
    const tZ = THREE.MathUtils.smoothstep(z, 0.0, 0.5);
    if (tY > 0 && tZ > 0) {
      pos.setZ(i, z + 0.32 * tY * tZ);
      pos.setY(i, y - 0.06 * tY * tZ);
    }
  }
  pos.needsUpdate = true;
  pitcherBody.geometry.computeVertexNormals();
}
const pitcherHandle = new THREE.Mesh(
  new THREE.TorusGeometry(0.3, 0.05, 16, 40, Math.PI * 1.1),
  steel
);
pitcherHandle.position.set(0, 0.62, -0.52);
pitcherHandle.rotation.set(0, Math.PI / 2, Math.PI * 0.55);

const pitcher = new THREE.Group();
pitcher.add(pitcherBody, pitcherHandle);
pitcher.scale.setScalar(0.72);
// Colocación determinista: el pico (local +z) apunta a la taza, inclinada 52°
const pitcherPos = new THREE.Vector3(-1.25, 1.5, 0.35);
const cupTarget = new THREE.Vector3(0, 0.75, 0);
const dirH = new THREE.Vector3(cupTarget.x - pitcherPos.x, 0, cupTarget.z - pitcherPos.z).normalize();
const qYaw = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(0, 1, 0),
  Math.atan2(dirH.x, dirH.z)
);
const tiltAxis = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dirH).normalize();
const qTilt = new THREE.Quaternion().setFromAxisAngle(tiltAxis, 0.9);
const qBase = qTilt.multiply(qYaw);
pitcher.position.copy(pitcherPos);
pitcher.quaternion.copy(qBase);
scene.add(pitcher);
// Luz de relleno para que el acero recoja brillo cálido
const pitcherFill = new THREE.PointLight(0xffe4c4, 3.5, 6);
pitcherFill.position.set(-2.6, 3.0, 1.6);
scene.add(pitcherFill);

// ───── Humito vivo (marca: "humito vivo") ─────
const steamUniforms = { uTime: { value: 0 } };
const steam = new THREE.Mesh(
  new THREE.PlaneGeometry(1.5, 2.4, 1, 24),
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: steamUniforms,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      uniform float uTime;
      void main(){
        vUv = uv;
        vec3 p = position;
        p.x += sin(uv.y*6.0 + uTime*0.7) * 0.12 * uv.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        f = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), f.x),
                   mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
      }
      float fbm(vec2 p){
        float v=0.0,a=0.5;
        for(int i=0;i<4;i++){ v+=a*noise(p); p=p*2.1+7.3; a*=0.5; }
        return v;
      }
      void main(){
        vec2 q = vec2(vUv.x, vUv.y*1.6 - uTime*0.12);
        float n = fbm(q*3.0);
        float body = smoothstep(0.42, 0.75, n);
        float edgeX = smoothstep(0.0, 0.28, vUv.x) * smoothstep(1.0, 0.72, vUv.x);
        float fadeY = smoothstep(0.0, 0.22, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
        float a = body * edgeX * fadeY * 0.16;
        gl_FragColor = vec4(vec3(0.98,0.95,0.90), a);
      }
    `,
  })
);
steam.position.set(0.15, 1.9, 0);
scene.add(steam);

// ───── Parallax de mouse + loop ─────
const mouse = new THREE.Vector2();
addEventListener("pointermove", (e) => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = (e.clientY / innerHeight) * 2 - 1;
});

function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime();
  coffeeUniforms.uTime.value = t;
  steamUniforms.uTime.value = t;
  // El corazón se forma entre el segundo 1 y el 4
  coffeeUniforms.uProgress.value = THREE.MathUtils.smoothstep(t, 1.0, 4.0);

  // La jarra "trabaja": vaivén sutil mientras el corazón se forma, luego se retira
  const work = 1.0 - THREE.MathUtils.smoothstep(t, 4.2, 6.0);
  pitcher.position.y = pitcherPos.y + Math.sin(t * 2.1) * 0.04 * work;
  pitcher.position.x = pitcherPos.x + Math.sin(t * 1.3) * 0.05 * work + (1 - work) * -2.4;
  pitcher.position.z = pitcherPos.z + (1 - work) * 0.6;

  // Parallax suave
  camera.position.x += (mouse.x * 0.45 - camera.position.x) * 0.04;
  camera.position.y += (3.4 - mouse.y * 0.3 - camera.position.y) * 0.04;
  camera.lookAt(0, 0.45, 0);

  // El humito siempre mira a cámara
  steam.quaternion.copy(camera.quaternion);

  renderer.render(scene, camera);
});
