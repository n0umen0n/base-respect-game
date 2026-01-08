import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer, EffectPass, RenderPass, Effect } from 'postprocessing';
import './PixelBlast.css';

const createTouchTexture = () => {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context not available');
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.Texture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  const trail = [];
  let last = null;
  const maxAge = 64;
  let radius = 0.1 * size;
  const speed = 1 / maxAge;
  const clear = () => {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };
  const drawPoint = p => {
    const pos = { x: p.x * size, y: (1 - p.y) * size };
    let intensity = 1;
    const easeOutSine = t => Math.sin((t * Math.PI) / 2);
    const easeOutQuad = t => -t * (t - 2);
    if (p.age < maxAge * 0.3) intensity = easeOutSine(p.age / (maxAge * 0.3));
    else intensity = easeOutQuad(1 - (p.age - maxAge * 0.3) / (maxAge * 0.7)) || 0;
    intensity *= p.force;
    const color = `${((p.vx + 1) / 2) * 255}, ${((p.vy + 1) / 2) * 255}, ${intensity * 255}`;
    const offset = size * 5;
    ctx.shadowOffsetX = offset;
    ctx.shadowOffsetY = offset;
    ctx.shadowBlur = radius;
    ctx.shadowColor = `rgba(${color},${0.22 * intensity})`;
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,0,0,1)';
    ctx.arc(pos.x - offset, pos.y - offset, radius, 0, Math.PI * 2);
    ctx.fill();
  };
  const addTouch = norm => {
    let force = 0;
    let vx = 0;
    let vy = 0;
    if (last) {
      const dx = norm.x - last.x;
      const dy = norm.y - last.y;
      if (dx === 0 && dy === 0) return;
      const dd = dx * dx + dy * dy;
      const d = Math.sqrt(dd);
      vx = dx / (d || 1);
      vy = dy / (d || 1);
      force = Math.min(dd * 10000, 1);
    }
    last = { x: norm.x, y: norm.y };
    trail.push({ x: norm.x, y: norm.y, age: 0, force, vx, vy });
  };
  const update = () => {
    clear();
    for (let i = trail.length - 1; i >= 0; i--) {
      const point = trail[i];
      const f = point.force * speed * (1 - point.age / maxAge);
      point.x += point.vx * f;
      point.y += point.vy * f;
      point.age++;
      if (point.age > maxAge) trail.splice(i, 1);
    }
    for (let i = 0; i < trail.length; i++) drawPoint(trail[i]);
    texture.needsUpdate = true;
  };
  return {
    canvas,
    texture,
    addTouch,
    update,
    set radiusScale(v) {
      radius = 0.1 * size * v;
    },
    get radiusScale() {
      return radius / (0.1 * size);
    },
    size
  };
};

const createLiquidEffect = (texture, opts) => {
  const fragment = `
    uniform sampler2D uTexture;
    uniform float uStrength;
    uniform float uTime;
    uniform float uFreq;

    void mainUv(inout vec2 uv) {
      vec4 tex = texture2D(uTexture, uv);
      float vx = tex.r * 2.0 - 1.0;
      float vy = tex.g * 2.0 - 1.0;
      float intensity = tex.b;

      float wave = 0.5 + 0.5 * sin(uTime * uFreq + intensity * 6.2831853);

      float amt = uStrength * intensity * wave;

      uv += vec2(vx, vy) * amt;
    }
    `;
  return new Effect('LiquidEffect', fragment, {
    uniforms: new Map([
      ['uTexture', new THREE.Uniform(texture)],
      ['uStrength', new THREE.Uniform(opts?.strength ?? 0.025)],
      ['uTime', new THREE.Uniform(0)],
      ['uFreq', new THREE.Uniform(opts?.freq ?? 4.5)]
    ])
  });
};

const SHAPE_MAP = {
  square: 0,
  circle: 1,
  triangle: 2,
  diamond: 3
};

const VERTEX_SRC = `
void main() {
  gl_Position = vec4(position, 1.0);
}
`;

const FRAGMENT_SRC = `
precision highp float;

uniform vec3  uColor;
uniform vec2  uResolution;
uniform float uTime;
uniform float uPixelSize;
uniform float uScale;
uniform float uDensity;
uniform float uPixelJitter;
uniform int   uEnableRipples;
uniform float uRippleSpeed;
uniform float uRippleThickness;
uniform float uRippleIntensity;
uniform float uEdgeFade;

uniform int   uShapeType;
const int SHAPE_SQUARE   = 0;
const int SHAPE_CIRCLE   = 1;
const int SHAPE_TRIANGLE = 2;
const int SHAPE_DIAMOND  = 3;

const int   MAX_CLICKS = 10;

uniform vec2  uClickPos  [MAX_CLICKS];
uniform float uClickTimes[MAX_CLICKS];

out vec4 fragColor;

float Bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2. + a.y * a.y * .75);
}
#define Bayer4(a) (Bayer2(.5*(a))*0.25 + Bayer2(a))
#define Bayer8(a) (Bayer4(.5*(a))*0.25 + Bayer2(a))

float hash11(float n){ return fract(sin(n)*43758.5453); }
float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

// Draw a chunky palm frond with hanging leaf segments (pixel art style)
float drawFrond(vec2 p, float angle, float len, float stemW, float droop, float wind) {
  float c = cos(angle);
  float s = sin(angle);
  vec2 rp = vec2(p.x * c + p.y * s, -p.x * s + p.y * c);
  
  if (rp.x < 0.0 || rp.x > len) return 0.0;
  
  float t = rp.x / len;
  
  // Main stem curves downward
  float curve = droop * t * t * 2.0 + wind * t;
  rp.y -= curve;
  
  // Draw main stem (spine of the frond)
  if (abs(rp.y) < stemW * (1.0 - t * 0.6)) return 1.0;
  
  // Draw chunky leaf segments hanging off the stem
  float segmentSpacing = len * 0.18;
  float segmentIdx = floor(rp.x / segmentSpacing);
  float segmentStart = segmentIdx * segmentSpacing;
  float segmentT = segmentStart / len;
  
  // Each segment droops from the stem
  if (segmentIdx >= 1.0 && segmentIdx < 5.0) {
    float localX = rp.x - segmentStart;
    float segmentLen = segmentSpacing * (1.2 - segmentT * 0.3);
    float segmentDroop = 0.4 + segmentT * 0.6; // More droop toward tip
    
    // Leaf segment curves down
    float leafY = rp.y + curve; // Relative to stem
    float leafCurve = segmentDroop * (localX / segmentLen);
    
    // Upper leaves (above stem)
    float upperLeafW = stemW * 2.5 * (1.0 - segmentT * 0.4);
    if (leafY > 0.0 && leafY < upperLeafW) {
      float leafTaper = 1.0 - localX / segmentLen;
      if (localX > 0.0 && localX < segmentLen * 0.8 && leafY < upperLeafW * leafTaper) return 1.0;
    }
    
    // Lower leaves (below stem) - these hang down more
    float lowerLeafLen = segmentLen * (1.0 + segmentDroop * 0.5);
    float lowerY = -leafY - leafCurve * localX * 2.0;
    float lowerLeafW = stemW * 3.0 * (1.0 - segmentT * 0.3);
    if (lowerY > 0.0 && lowerY < lowerLeafW) {
      float leafTaper = 1.0 - localX / lowerLeafLen;
      if (localX > 0.0 && localX < lowerLeafLen && lowerY < lowerLeafW * leafTaper) return 1.0;
    }
  }
  
  return 0.0;
}

// Pixel art style palm tree with curved trunk
float palmTree(vec2 uv, vec2 base, float scale, float seed, float time, float opacity) {
  if (opacity < 0.01) return 0.0;
  
  float result = 0.0;
  vec2 p = uv - base;
  
  // Tree leans based on seed (some left, some right)
  float leanDir = (hash11(seed + 5.0) > 0.5) ? 1.0 : -1.0;
  float baseLean = 0.04 * scale * leanDir;
  
  // Animated sway
  float swayPhase = seed * 6.28;
  float sway = sin(time * 1.2 + swayPhase) * 0.025 * scale;
  
  // === CURVED TRUNK ===
  float trunkH = 0.16 * scale;
  float trunkBaseW = 0.018 * scale;
  
  if (p.y > -0.005 * scale && p.y < trunkH) {
    float t = p.y / trunkH;
    // S-curve lean like in the reference
    float curve = baseLean * t + sway * t * t;
    curve += sin(t * 2.5) * 0.015 * scale * leanDir;
    // Tapered - thick at bottom
    float w = trunkBaseW * (1.0 - t * 0.45);
    if (abs(p.x - curve) < w) result = 1.0;
  }
  
  // === CROWN ===
  vec2 crown = vec2(baseLean + sway, trunkH);
  vec2 cp = p - crown;
  
  float frondLen = 0.11 * scale;
  float stemW = 0.006 * scale;
  float baseDroop = 0.08 * scale;
  
  // Wind
  float wind = sin(time * 1.8 + seed * 3.14) * 0.025 * scale;
  
  // Main fronds - spread out like in the reference image
  // Top-left frond (goes up-left, droops)
  result = max(result, drawFrond(cp, -0.6, frondLen * 1.1, stemW * 1.2, baseDroop * 0.9, wind * 0.8));
  // Left frond (more horizontal, heavy droop)
  result = max(result, drawFrond(cp, -1.2, frondLen * 0.95, stemW, baseDroop * 1.5, wind * 0.5));
  // Top-right frond
  result = max(result, drawFrond(cp, 0.5, frondLen * 1.15, stemW * 1.3, baseDroop * 0.85, wind));
  // Right frond (horizontal, droops down)
  result = max(result, drawFrond(cp, 1.1, frondLen, stemW * 1.1, baseDroop * 1.4, wind * 0.6));
  // Back center frond (points up)
  result = max(result, drawFrond(cp, -0.1, frondLen * 1.0, stemW * 1.1, baseDroop * 1.0, wind * 0.9));
  // Drooping front fronds
  result = max(result, drawFrond(cp, -1.6, frondLen * 0.8, stemW * 0.9, baseDroop * 2.0, wind * 0.3));
  result = max(result, drawFrond(cp, 1.5, frondLen * 0.75, stemW * 0.9, baseDroop * 2.2, wind * 0.3));
  
  return result * opacity;
}

// Pattern with fade in/out
float palmTreePattern(vec2 uv, float time) {
  float result = 0.0;
  float gridSize = 0.38;
  
  vec2 baseCell = floor(uv / gridSize);
  
  for (int i = -1; i <= 1; i++) {
    for (int j = -1; j <= 1; j++) {
      vec2 cellId = baseCell + vec2(float(i), float(j));
      float cellHash = hash21(cellId);
      
      // ~40% of cells have trees
      if (cellHash > 0.4) continue;
      
      // Position with jitter
      vec2 treePos = (cellId + 0.5) * gridSize;
      treePos.x += (hash21(cellId + 0.1) - 0.5) * gridSize * 0.6;
      treePos.y += (hash21(cellId + 0.2) - 0.5) * gridSize * 0.5;
      
      // Fade cycle - trees appear and disappear
      float cycleOffset = hash21(cellId + 0.5) * 30.0;
      float cycleDuration = 12.0 + hash21(cellId + 0.6) * 8.0; // 12-20 sec cycles
      float cycleTime = mod(time + cycleOffset, cycleDuration);
      
      // Smooth fade in/out
      float fadeIn = smoothstep(0.0, cycleDuration * 0.15, cycleTime);
      float fadeOut = 1.0 - smoothstep(cycleDuration * 0.85, cycleDuration, cycleTime);
      float opacity = fadeIn * fadeOut;
      
      float treeScale = 0.8 + hash21(cellId + 0.3) * 0.4;
      
      result = max(result, palmTree(uv, treePos, treeScale, cellHash * 100.0, time, opacity));
    }
  }
  
  return result;
}

float maskCircle(vec2 p, float cov){
  float r = sqrt(cov) * .25;
  float d = length(p - 0.5) - r;
  float aa = 0.5 * fwidth(d);
  return cov * (1.0 - smoothstep(-aa, aa, d * 2.0));
}

float maskTriangle(vec2 p, vec2 id, float cov){
  bool flip = mod(id.x + id.y, 2.0) > 0.5;
  if (flip) p.x = 1.0 - p.x;
  float r = sqrt(cov);
  float d  = p.y - r*(1.0 - p.x);
  float aa = fwidth(d);
  return cov * clamp(0.5 - d/aa, 0.0, 1.0);
}

float maskDiamond(vec2 p, float cov){
  float r = sqrt(cov) * 0.564;
  return step(abs(p.x - 0.49) + abs(p.y - 0.49), r);
}

void main(){
  float pixelSize = uPixelSize;
  vec2 fragCoord = gl_FragCoord.xy;
  float aspectRatio = uResolution.x / uResolution.y;

  vec2 pixelId = floor(fragCoord / pixelSize);
  vec2 pixelUV = fract(fragCoord / pixelSize);

  // Normalized UV coordinates for palm tree pattern
  vec2 uv = fragCoord / uResolution;
  uv.x *= aspectRatio;
  
  // Scale the pattern
  uv *= uScale;

  // Get palm tree pattern value
  float palm = palmTreePattern(uv, uTime);
  
  // Apply density control
  float feed = palm * (0.5 + uDensity * 0.5);

  float speed     = uRippleSpeed;
  float thickness = uRippleThickness;
  const float dampT     = 1.0;
  const float dampR     = 10.0;

  if (uEnableRipples == 1) {
    for (int i = 0; i < MAX_CLICKS; ++i){
      vec2 pos = uClickPos[i];
      if (pos.x < 0.0) continue;
      vec2 clickUV = pos / uResolution;
      clickUV.x *= aspectRatio;
      clickUV *= uScale;
      float t = max(uTime - uClickTimes[i], 0.0);
      float r = distance(uv, clickUV);
      float waveR = speed * t;
      float ring  = exp(-pow((r - waveR) / thickness, 2.0));
      float atten = exp(-dampT * t) * exp(-dampR * r);
      feed = max(feed, ring * atten * uRippleIntensity);
    }
  }

  float bayer = Bayer8(fragCoord / uPixelSize) - 0.5;
  float bw = step(0.5, feed + bayer * 0.3);

  float h = fract(sin(dot(floor(fragCoord / uPixelSize), vec2(127.1, 311.7))) * 43758.5453);
  float jitterScale = 1.0 + (h - 0.5) * uPixelJitter;
  float coverage = bw * jitterScale;
  float M;
  if      (uShapeType == SHAPE_CIRCLE)   M = maskCircle (pixelUV, coverage);
  else if (uShapeType == SHAPE_TRIANGLE) M = maskTriangle(pixelUV, pixelId, coverage);
  else if (uShapeType == SHAPE_DIAMOND)  M = maskDiamond(pixelUV, coverage);
  else                                   M = coverage;

  if (uEdgeFade > 0.0) {
    vec2 norm = gl_FragCoord.xy / uResolution;
    float edge = min(min(norm.x, norm.y), min(1.0 - norm.x, 1.0 - norm.y));
    float fade = smoothstep(0.0, uEdgeFade, edge);
    M *= fade;
  }

  vec3 color = uColor;
  fragColor = vec4(color, M);
}
`;

const MAX_CLICKS = 10;

const PixelBlast = ({
  variant = 'square',
  pixelSize = 3,
  color = '#B19EEF',
  className,
  style,
  antialias = true,
  patternScale = 2,
  patternDensity = 1,
  liquid = false,
  liquidStrength = 0.1,
  liquidRadius = 1,
  pixelSizeJitter = 0,
  enableRipples = true,
  rippleIntensityScale = 1,
  rippleThickness = 0.1,
  rippleSpeed = 0.3,
  liquidWobbleSpeed = 4.5,
  autoPauseOffscreen = true,
  speed = 0.5,
  transparent = true,
  edgeFade = 0.5,
  noiseAmount = 0
}) => {
  const containerRef = useRef(null);
  const visibilityRef = useRef({ visible: true });
  const speedRef = useRef(speed);

  const threeRef = useRef(null);
  const prevConfigRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (autoPauseOffscreen) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          visibilityRef.current.visible = entry.isIntersecting;
        },
        { threshold: 0 }
      );
      observer.observe(container);
      return () => observer.disconnect();
    }
  }, [autoPauseOffscreen]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    speedRef.current = speed;
    const needsReinitKeys = ['antialias', 'liquid', 'noiseAmount'];
    const cfg = { antialias, liquid, noiseAmount };
    let mustReinit = false;
    if (!threeRef.current) mustReinit = true;
    else if (prevConfigRef.current) {
      for (const k of needsReinitKeys)
        if (prevConfigRef.current[k] !== cfg[k]) {
          mustReinit = true;
          break;
        }
    }
    if (mustReinit) {
      if (threeRef.current) {
        const t = threeRef.current;
        t.resizeObserver?.disconnect();
        cancelAnimationFrame(t.raf);
        t.quad?.geometry.dispose();
        t.material.dispose();
        t.composer?.dispose();
        t.renderer.dispose();
        if (t.renderer.domElement.parentElement === container) container.removeChild(t.renderer.domElement);
        threeRef.current = null;
      }
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2', { antialias, alpha: true });
      if (!gl) return;
      const renderer = new THREE.WebGLRenderer({
        canvas,
        context: gl,
        antialias,
        alpha: true
      });
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.appendChild(renderer.domElement);
      const uniforms = {
        uResolution: { value: new THREE.Vector2(0, 0) },
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uClickPos: {
          value: Array.from({ length: MAX_CLICKS }, () => new THREE.Vector2(-1, -1))
        },
        uClickTimes: { value: new Float32Array(MAX_CLICKS) },
        uShapeType: { value: SHAPE_MAP[variant] ?? 0 },
        uPixelSize: { value: pixelSize * renderer.getPixelRatio() },
        uScale: { value: patternScale },
        uDensity: { value: patternDensity },
        uPixelJitter: { value: pixelSizeJitter },
        uEnableRipples: { value: enableRipples ? 1 : 0 },
        uRippleSpeed: { value: rippleSpeed },
        uRippleThickness: { value: rippleThickness },
        uRippleIntensity: { value: rippleIntensityScale },
        uEdgeFade: { value: edgeFade }
      };
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const material = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SRC,
        fragmentShader: FRAGMENT_SRC,
        uniforms,
        transparent: true,
        glslVersion: THREE.GLSL3,
        depthTest: false,
        depthWrite: false
      });
      const quadGeom = new THREE.PlaneGeometry(2, 2);
      const quad = new THREE.Mesh(quadGeom, material);
      scene.add(quad);
      const clock = new THREE.Clock();
      const setSize = () => {
        const w = container.clientWidth || 1;
        const h = container.clientHeight || 1;
        renderer.setSize(w, h, false);
        uniforms.uResolution.value.set(renderer.domElement.width, renderer.domElement.height);
        if (threeRef.current?.composer)
          threeRef.current.composer.setSize(renderer.domElement.width, renderer.domElement.height);
        uniforms.uPixelSize.value = pixelSize * renderer.getPixelRatio();
      };
      setSize();
      const ro = new ResizeObserver(setSize);
      ro.observe(container);
      const randomFloat = () => {
        if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
          const u32 = new Uint32Array(1);
          window.crypto.getRandomValues(u32);
          return u32[0] / 0xffffffff;
        }
        return Math.random();
      };
      const timeOffset = randomFloat() * 1000;
      let composer;
      let touch;
      let liquidEffect;
      if (liquid) {
        touch = createTouchTexture();
        touch.radiusScale = liquidRadius;
        composer = new EffectComposer(renderer);
        const renderPass = new RenderPass(scene, camera);
        liquidEffect = createLiquidEffect(touch.texture, {
          strength: liquidStrength,
          freq: liquidWobbleSpeed
        });
        const effectPass = new EffectPass(camera, liquidEffect);
        effectPass.renderToScreen = true;
        composer.addPass(renderPass);
        composer.addPass(effectPass);
      }
      if (noiseAmount > 0) {
        if (!composer) {
          composer = new EffectComposer(renderer);
          composer.addPass(new RenderPass(scene, camera));
        }
        const noiseEffect = new Effect(
          'NoiseEffect',
          `uniform float uTime; uniform float uAmount; float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453);} void mainUv(inout vec2 uv){} void mainImage(const in vec4 inputColor,const in vec2 uv,out vec4 outputColor){ float n=hash(floor(uv*vec2(1920.0,1080.0))+floor(uTime*60.0)); float g=(n-0.5)*uAmount; outputColor=inputColor+vec4(vec3(g),0.0);} `,
          {
            uniforms: new Map([
              ['uTime', new THREE.Uniform(0)],
              ['uAmount', new THREE.Uniform(noiseAmount)]
            ])
          }
        );
        const noisePass = new EffectPass(camera, noiseEffect);
        noisePass.renderToScreen = true;
        if (composer && composer.passes.length > 0) composer.passes.forEach(p => (p.renderToScreen = false));
        composer.addPass(noisePass);
      }
      if (composer) composer.setSize(renderer.domElement.width, renderer.domElement.height);
      const mapToPixels = e => {
        const rect = renderer.domElement.getBoundingClientRect();
        const scaleX = renderer.domElement.width / rect.width;
        const scaleY = renderer.domElement.height / rect.height;
        const fx = (e.clientX - rect.left) * scaleX;
        const fy = (rect.height - (e.clientY - rect.top)) * scaleY;
        return {
          fx,
          fy,
          w: renderer.domElement.width,
          h: renderer.domElement.height
        };
      };
      const onPointerDown = e => {
        const { fx, fy } = mapToPixels(e);
        const ix = threeRef.current?.clickIx ?? 0;
        uniforms.uClickPos.value[ix].set(fx, fy);
        uniforms.uClickTimes.value[ix] = uniforms.uTime.value;
        if (threeRef.current) threeRef.current.clickIx = (ix + 1) % MAX_CLICKS;
      };
      const onPointerMove = e => {
        if (!touch) return;
        const { fx, fy, w, h } = mapToPixels(e);
        touch.addTouch({ x: fx / w, y: fy / h });
      };
      renderer.domElement.addEventListener('pointerdown', onPointerDown, {
        passive: true
      });
      renderer.domElement.addEventListener('pointermove', onPointerMove, {
        passive: true
      });
      let raf = 0;
      const animate = () => {
        if (autoPauseOffscreen && !visibilityRef.current.visible) {
          raf = requestAnimationFrame(animate);
          return;
        }
        uniforms.uTime.value = timeOffset + clock.getElapsedTime() * speedRef.current;
        if (liquidEffect) liquidEffect.uniforms.get('uTime').value = uniforms.uTime.value;
        if (composer) {
          if (touch) touch.update();
          composer.passes.forEach(p => {
            const effs = p.effects;
            if (effs)
              effs.forEach(eff => {
                const u = eff.uniforms?.get('uTime');
                if (u) u.value = uniforms.uTime.value;
              });
          });
          composer.render();
        } else renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      };
      raf = requestAnimationFrame(animate);
      threeRef.current = {
        renderer,
        scene,
        camera,
        material,
        clock,
        clickIx: 0,
        uniforms,
        resizeObserver: ro,
        raf,
        quad,
        timeOffset,
        composer,
        touch,
        liquidEffect
      };
    } else {
      const t = threeRef.current;
      t.uniforms.uShapeType.value = SHAPE_MAP[variant] ?? 0;
      t.uniforms.uPixelSize.value = pixelSize * t.renderer.getPixelRatio();
      t.uniforms.uColor.value.set(color);
      t.uniforms.uScale.value = patternScale;
      t.uniforms.uDensity.value = patternDensity;
      t.uniforms.uPixelJitter.value = pixelSizeJitter;
      t.uniforms.uEnableRipples.value = enableRipples ? 1 : 0;
      t.uniforms.uRippleIntensity.value = rippleIntensityScale;
      t.uniforms.uRippleThickness.value = rippleThickness;
      t.uniforms.uRippleSpeed.value = rippleSpeed;
      t.uniforms.uEdgeFade.value = edgeFade;
      if (transparent) t.renderer.setClearAlpha(0);
      else t.renderer.setClearColor(0x000000, 1);
      if (t.liquidEffect) {
        const uStrength = t.liquidEffect;
        if (uStrength) uStrength.value = liquidStrength;
        const uFreq = t.liquidEffect.uniforms.get('uFreq');
        if (uFreq) uFreq.value = liquidWobbleSpeed;
      }
      if (t.touch) t.touch.radiusScale = liquidRadius;
    }
    prevConfigRef.current = cfg;
    return () => {
      if (threeRef.current && mustReinit) return;
      if (!threeRef.current) return;
      const t = threeRef.current;
      t.resizeObserver?.disconnect();
      cancelAnimationFrame(t.raf);
      t.quad?.geometry.dispose();
      t.material.dispose();
      t.composer?.dispose();
      t.renderer.dispose();
      if (t.renderer.domElement.parentElement === container) container.removeChild(t.renderer.domElement);
      threeRef.current = null;
    };
  }, [
    antialias,
    liquid,
    noiseAmount,
    pixelSize,
    patternScale,
    patternDensity,
    enableRipples,
    rippleIntensityScale,
    rippleThickness,
    rippleSpeed,
    pixelSizeJitter,
    edgeFade,
    transparent,
    liquidStrength,
    liquidRadius,
    liquidWobbleSpeed,
    autoPauseOffscreen,
    variant,
    color,
    speed
  ]);

  return (
    <div
      ref={containerRef}
      className={`pixel-blast-container ${className ?? ''}`}
      style={style}
      aria-label="PixelBlast interactive background"
    />
  );
};

export default PixelBlast;
