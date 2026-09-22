// Halloween hero: 2.5D parallax from a depth map, drifting fog and embers.
// The plain <img> stays underneath as the LCP image and the fallback; this
// canvas fades in on top only once its first frame matches that image.

const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.186.0/+esm";
const DEPTH_URL = "hero_halloween_depth.webp?v=1";

const photo = document.querySelector(".hero-photo");
const img = photo?.querySelector(".hero-image");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const saveData = navigator.connection?.saveData;

if (photo && img && !reduceMotion.matches && !saveData && hasWebGL()) {
  const start = () => {
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
    idle(() => init().catch(() => {}), { timeout: 1500 });
  };
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

const photoVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const photoFrag = /* glsl */ `
  uniform sampler2D uColor;
  uniform sampler2D uDepth;
  uniform vec2 uScale;
  uniform vec2 uOffset;
  uniform vec2 uPointer;
  uniform float uStrength;
  uniform float uFocus;
  uniform float uTime;
  uniform float uIntro;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 base = vUv * uScale + uOffset;
    vec2 shift = uPointer * uStrength * uIntro * uScale;

    // Sample depth, then refine once at the displaced spot to keep edges tidy.
    float d = texture2D(uDepth, base).r;
    vec2 uv = base + shift * (d - uFocus);
    d = texture2D(uDepth, uv).r;
    uv = base + shift * (d - uFocus);

    vec3 col = texture2D(uColor, uv).rgb;

    // Violet-pink mist that only lives in the far background.
    vec2 fp = uv * vec2(2.6, 4.2) + vec2(uTime * 0.018, -uTime * 0.006);
    float mist = fbm(fp + fbm(fp * 0.7 + uTime * 0.01));
    float far = pow(1.0 - d, 1.6);
    vec3 mistCol = mix(vec3(0.55, 0.28, 0.95), vec3(1.0, 0.25, 0.62), smoothstep(0.35, 0.8, mist));
    col += mistCol * smoothstep(0.38, 0.85, mist) * far * 0.26 * uIntro;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const emberVert = /* glsl */ `
  attribute vec4 aSeed;   // x: start x, y: start y, z: depth, w: phase
  attribute vec3 aLook;   // x: speed, y: size, z: shape (0 dot, 1 sparkle)
  attribute vec3 aColor;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uStrength;
  uniform float uFocus;
  uniform float uIntro;
  uniform float uPixel;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vShape;
  varying float vSpin;

  void main() {
    float t = uTime * aLook.x + aSeed.w * 7.0;
    float y = mod(aSeed.y + t + 1.2, 2.4) - 1.2;
    float x = aSeed.x + sin(t * 2.3 + aSeed.w * 6.283) * 0.04;
    vec2 p = vec2(x, y) - 2.0 * uPointer * uStrength * uIntro * (aSeed.z - uFocus);
    gl_Position = vec4(p, 0.0, 1.0);

    float edge = smoothstep(-1.2, -0.85, y) * (1.0 - smoothstep(0.75, 1.15, y));
    float twinkle = 0.55 + 0.45 * sin(uTime * 3.0 + aSeed.w * 40.0);
    vAlpha = edge * twinkle * uIntro * mix(0.45, 1.0, aSeed.z);
    vColor = aColor;
    vShape = aLook.z;
    vSpin = uTime * 0.6 + aSeed.w * 6.283;
    gl_PointSize = aLook.y * mix(0.55, 1.35, aSeed.z) * uPixel;
  }
`;

const emberFrag = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vShape;
  varying float vSpin;

  void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float r = length(p);
    float glow = exp(-r * r * 5.0);
    float core = exp(-r * r * 28.0);
    float a;
    if (vShape > 0.5) {
      float c = cos(vSpin);
      float s = sin(vSpin);
      vec2 q = abs(mat2(c, -s, s, c) * p);
      float rays = max(0.0, 1.0 - q.x * q.y * 60.0) * (1.0 - smoothstep(0.2, 1.0, r));
      a = max(rays, glow * 0.4) + core;
    } else {
      a = glow * 0.9 + core * 1.2;
    }
    vec3 col = mix(vColor, vec3(1.0), core * 0.7);
    gl_FragColor = vec4(col * a * vAlpha, 1.0);
  }
`;

async function init() {
  const THREE = await import(THREE_URL);

  if (!img.complete) await img.decode().catch(() => {});
  const loader = new THREE.TextureLoader();
  const [colorTex, depthTex] = await Promise.all([
    loader.loadAsync(img.currentSrc || img.src),
    loader.loadAsync(DEPTH_URL)
  ]);
  // Pass pixels straight through so the canvas matches the <img> exactly.
  colorTex.colorSpace = THREE.NoColorSpace;
  depthTex.colorSpace = THREE.NoColorSpace;
  depthTex.generateMipmaps = false;
  depthTex.minFilter = THREE.LinearFilter;

  const canvas = document.createElement("canvas");
  canvas.className = "hero-depth";
  canvas.setAttribute("aria-hidden", "true");

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "low-power" });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const shared = {
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector2() },
    uStrength: { value: 0.028 },
    uFocus: { value: 0.62 },
    uIntro: { value: 0 }
  };

  const photoMat = new THREE.ShaderMaterial({
    vertexShader: photoVert,
    fragmentShader: photoFrag,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      ...shared,
      uColor: { value: colorTex },
      uDepth: { value: depthTex },
      uScale: { value: new THREE.Vector2(1, 1) },
      uOffset: { value: new THREE.Vector2() }
    }
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), photoMat));

  const embers = makeEmbers(THREE, window.innerWidth < 760 ? 34 : 64, shared);
  scene.add(embers);

  // object-fit: cover + object-position, plus a little overscan that the
  // intro eases into so the parallax never shows the image edge.
  const imgAspect = (img.naturalWidth || 1672) / (img.naturalHeight || 941);
  let cover = { sx: 1, sy: 1, px: 0.5, py: 0.5 };

  const layout = () => {
    const { width, height } = photo.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    const boxAspect = width / height;
    const [px, py] = parsePosition(getComputedStyle(img).objectPosition);
    cover = boxAspect > imgAspect
      ? { sx: 1, sy: imgAspect / boxAspect, px, py }
      : { sx: boxAspect / imgAspect, sy: 1, px, py };
    embers.material.uniforms.uPixel.value = height * renderer.getPixelRatio() / 520;
  };

  const applyCover = (zoom) => {
    const sx = cover.sx / zoom;
    const sy = cover.sy / zoom;
    photoMat.uniforms.uScale.value.set(sx, sy);
    // Texture v runs bottom-up, object-position y runs top-down.
    photoMat.uniforms.uOffset.value.set((1 - sx) * cover.px, (1 - sy) * (1 - cover.py));
  };

  layout();
  new ResizeObserver(layout).observe(photo);

  // Pointer: mouse steers the camera; touch screens get a slow idle sway.
  const target = new THREE.Vector2();
  const pointer = shared.uPointer.value;
  let lastMove = -1e9;

  window.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    const r = photo.getBoundingClientRect();
    target.set(
      clamp(((event.clientX - r.left) / r.width) * 2 - 1, -1, 1),
      clamp(-(((event.clientY - r.top) / r.height) * 2 - 1), -1, 1)
    );
    lastMove = performance.now();
  }, { passive: true });

  let visible = true;
  let running = false;
  let introStart = 0;
  let last = 0;

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    kick();
  }).observe(photo);
  document.addEventListener("visibilitychange", kick);
  reduceMotion.addEventListener?.("change", () => {
    if (reduceMotion.matches) teardown();
  });

  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    teardown();
  });

  function kick() {
    if (running || !visible || document.hidden || !canvas.isConnected) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }

  function frame(now) {
    if (!visible || document.hidden || !canvas.isConnected) {
      running = false;
      return;
    }
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    shared.uTime.value += dt;

    const intro = easeInOut(clamp((now - introStart) / 1800, 0, 1));
    shared.uIntro.value = intro;
    applyCover(1 + 0.045 * intro);

    if (now - lastMove > 2500) {
      const t = shared.uTime.value;
      target.set(Math.sin(t * 0.33) * 0.7, Math.sin(t * 0.21 + 1.3) * 0.35);
    }
    // Tilt the view a touch as the hero scrolls away.
    const scrolled = clamp(window.scrollY / Math.max(photo.offsetHeight, 1), 0, 1);
    const ty = clamp(target.y - scrolled * 0.8, -1, 1);
    const k = 1 - Math.exp(-dt * 3.2);
    pointer.x += (target.x - pointer.x) * k;
    pointer.y += (ty - pointer.y) * k;

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  function teardown() {
    canvas.remove();
    renderer.dispose();
  }

  // First frame is identical to the <img>; fade in, then ease the depth in.
  applyCover(1);
  renderer.render(scene, camera);
  photo.querySelector("picture").after(canvas);
  requestAnimationFrame(() => {
    canvas.classList.add("is-ready");
    introStart = performance.now() + 500;
    kick();
  });
}

function makeEmbers(THREE, count, shared) {
  const palette = [
    [1.0, 0.18, 0.6],   // pink
    [1.0, 0.78, 0.18],  // gold
    [1.0, 0.48, 0.1],   // pumpkin
    [0.72, 0.45, 1.0]   // grape
  ];
  const seed = new Float32Array(count * 4);
  const look = new Float32Array(count * 3);
  const color = new Float32Array(count * 3);
  const pos = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const sparkle = Math.random() < 0.22;
    seed.set([Math.random() * 2 - 1, Math.random() * 2.4 - 1.2, Math.random(), Math.random()], i * 4);
    look.set([0.035 + Math.random() * 0.06, sparkle ? 28 + Math.random() * 20 : 10 + Math.random() * 12, sparkle ? 1 : 0], i * 3);
    color.set(palette[sparkle ? (Math.random() < 0.5 ? 0 : 1) : Math.floor(Math.random() * palette.length)], i * 3);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
  geo.setAttribute("aLook", new THREE.BufferAttribute(look, 3));
  geo.setAttribute("aColor", new THREE.BufferAttribute(color, 3));

  const mat = new THREE.ShaderMaterial({
    vertexShader: emberVert,
    fragmentShader: emberFrag,
    uniforms: { ...shared, uPixel: { value: 1 } },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return points;
}

function parsePosition(value) {
  const parts = (value || "50% 50%").split(/\s+/).map((v) => (v.endsWith("%") ? parseFloat(v) / 100 : 0.5));
  return [parts[0] ?? 0.5, parts[1] ?? 0.5];
}

function clamp(v, lo, hi) {
  return Math.min(Math.max(v, lo), hi);
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
