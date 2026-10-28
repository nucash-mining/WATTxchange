/* ================= ROOM SKIN: procedural Lounge surfaces =================
   Floor, upper walls and ceiling drawn on canvases at load time (no downloads):
     floor   — chevron parquet: per-plank tone/grain, bevelled seams, normal + roughness
     walls   — upholstered acoustic panels (fabric weave, tufted seams, brass reveals)
     ceiling — coffered grid with warm cove light in every coffer (emissive map)
   Normal maps come from a height field via a Sobel filter. Textures are 512 px on
   phones / small screens and 1024 px on desktop; generation is a one-off when the
   Lounge is first built. Replaces the grey_plaster_02_* (≈770 KB) and
   herringbone_parquet_* (≈200 KB) downloads. Opt out: localStorage.mgSkin = 'pbr'.     */
import * as THREE from 'three';

export const SKIN_ON = (() => { try { return localStorage.getItem('mgSkin') !== 'pbr'; } catch (_) { return true; } })();
export const MOBILE = (() => { try { return matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) < 820; } catch (_) { return false; } })();
const N = MOBILE ? 512 : 1024;

// ── helpers ────────────────────────────────────────────────────────────────────
const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
function vnoise(x, y) {                         // smooth value noise
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function tex(c, srgb) {
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = MOBILE ? 2 : 8; return t;
}
/** fill a canvas per pixel: f(x, y) → [r, g, b] (0..255) */
function paint(w, h, f) {
  const c = canvas(w, h), g = c.getContext('2d'), im = g.createImageData(w, h), d = im.data;
  for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i += 4) { const p = f(x, y); d[i] = p[0]; d[i + 1] = p[1]; d[i + 2] = p[2]; d[i + 3] = 255; }
  g.putImageData(im, 0, 0); return c;
}
/** Sobel normal map (OpenGL convention, wraps at the edges) from a height array 0..1 */
export function normalFromHeight(H, w, h, strength = 2) {
  const at = (x, y) => H[((y + h) % h) * w + ((x + w) % w)];
  return paint(w, h, (x, y) => {
    const dx = (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1)) - (at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1));
    const dy = (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1)) - (at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1));
    let nx = -dx * strength, ny = dy * strength, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    return [(nx * 0.5 + 0.5) * 255, (ny * 0.5 + 0.5) * 255, (nz * 0.5 + 0.5) * 255];
  });
}
/** scale a geometry's UVs so one texture tile covers tileW × tileH world units */
export function tileUV(geo, w, h, tileW, tileH) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / tileW, uv.getY(i) * h / tileH); uv.needsUpdate = true; return geo; }

// ── floor: chevron parquet ─────────────────────────────────────────────────────
// one tile = 4 columns × 10 planks, FLOOR_TILE world units square (≈ 2.7 m) ⇒ planks ≈ 19 cm × 94 cm
export const FLOOR_TILE = 6;
function chevron() {
  const cols = 4, ROWS = 10, C = N / cols, P = N / ROWS;
  const col = new Uint8ClampedArray(N * N * 3), H = new Float32Array(N * N), R = new Uint8ClampedArray(N * N);
  const tones = [[148, 102, 64], [128, 86, 52], [160, 114, 72], [118, 80, 50], [140, 96, 58]];
  const bw = N / 512 * 1.6;                                // bevel width in px
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const c = Math.floor(x / C), lx = x - c * C, s = c % 2 ? 1 : -1;
    const along = y + (s > 0 ? lx : C - lx);              // slant; neighbouring columns mirror so the seams meet in a V
    const k = Math.floor(along / P), fr = along / P - k;  // plank index, position across the plank 0..1
    const id = ((k % ROWS) + ROWS) % ROWS;                // wraps with the tile: no colour jump at the tile edge
    const hk = hash(c, id), tone = tones[Math.floor(hk * tones.length) % tones.length];
    const lenPos = lx / C;                                // along the plank
    const grain = 0.5 + 0.5 * Math.sin((fr * 14 + vnoise(lenPos * 3 + hk * 50, fr * 6) * 4) * Math.PI);
    const fine = vnoise(lenPos * 40 + hk * 9, fr * 90) * 0.5 + vnoise(lenPos * 9, fr * 22 + hk * 7) * 0.5;
    const knot = hk > 0.8 ? Math.max(0, 1 - Math.hypot((lenPos - hk) * 6, (fr - 0.5) * 3)) : 0;
    const shade = 0.82 + grain * 0.12 + fine * 0.12 - knot * 0.35 + (hk - 0.5) * 0.12;
    const bevel = Math.min(1, Math.min(Math.min(fr, 1 - fr) * P, Math.min(lx, C - lx)) / bw);
    const m = shade * (0.55 + 0.45 * bevel), i = y * N + x;
    col[i * 3] = tone[0] * m; col[i * 3 + 1] = tone[1] * m; col[i * 3 + 2] = tone[2] * m;
    H[i] = bevel * 0.6 + fine * 0.04 + grain * 0.02;
    R[i] = 120 + fine * 60 + (1 - bevel) * 70;            // lacquer: glossier on the plank faces
  }
  const map = paint(N, N, (x, y) => { const i = (y * N + x) * 3; return [col[i], col[i + 1], col[i + 2]]; });
  const rough = paint(N, N, (x, y) => { const r = R[y * N + x]; return [r, r, r]; });
  return { map, nrm: normalFromHeight(H, N, N, 3), rough };
}

// ── walls: upholstered acoustic panels ─────────────────────────────────────────
// one tile = one panel WALL_TILE wide; v spans the whole upper wall
export const WALL_TILE = 2.2;
function fabricPanels() {
  const W = N / 2, Hh = N, H = new Float32Array(W * Hh), C = new Uint8ClampedArray(W * Hh * 3);
  const base = [62, 44, 74];                               // deep plum
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
    const weave = ((x >> 1) + (y >> 1)) % 2 ? 0.04 : -0.04, fib = vnoise(x * 0.6, y * 0.08) * 0.08 + vnoise(x * 0.05, y * 0.5) * 0.06;
    const ex = Math.min(x, W - 1 - x) / W, ey = Math.min(y, Hh - 1 - y) / Hh;
    const pillow = Math.min(1, ex * 14) * Math.min(1, ey * 22);                         // padded panel, rounded edges
    const tuft = Math.max(0, 1 - Math.hypot(Math.abs(x / W - 0.5) * 22, Math.abs(((y / Hh) * 4) % 1 - 0.5) * 22)); // buttons
    const reveal = ex < 0.03, i = y * W + x;                                          // brass reveal between panels
    H[i] = reveal ? 0 : pillow * 0.8 - tuft * 0.35 + weave * 0.15 + fib * 0.2;
    const k = 0.78 + pillow * 0.18 + weave + fib - tuft * 0.25;
    if (reveal) { C[i * 3] = 176; C[i * 3 + 1] = 138; C[i * 3 + 2] = 80; }
    else { C[i * 3] = base[0] * k; C[i * 3 + 1] = base[1] * k; C[i * 3 + 2] = base[2] * k; }
  }
  const map = paint(W, Hh, (x, y) => { const i = (y * W + x) * 3; return [C[i], C[i + 1], C[i + 2]]; });
  const rough = paint(W, Hh, (x) => { const r = Math.min(x, W - 1 - x) / W < 0.03 ? 70 : 235; return [r, r, r]; });
  return { map, nrm: normalFromHeight(H, W, Hh, 2.5), rough };
}

// ── ceiling: coffered grid with cove light ─────────────────────────────────────
function coffers() {
  const S = N / 2, H = new Float32Array(S * S), C = new Uint8ClampedArray(S * S * 3), E = new Uint8ClampedArray(S * S * 3);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const e = Math.min(x, y, S - 1 - x, S - 1 - y) / S;      // 0 at the beam centre line
    const beam = e < 0.07, step = e < 0.12, cove = e >= 0.12 && e < 0.15;
    const i = y * S + x, n = vnoise(x * 0.2, y * 0.2) * 0.05;
    H[i] = beam ? 1 : step ? 0.6 : cove ? 0.35 : 0.2 + n;
    const k = beam ? 0.55 : step ? 0.42 : 0.3 + n;
    C[i * 3] = 92 * k; C[i * 3 + 1] = 80 * k; C[i * 3 + 2] = 104 * k;
    if (beam && Math.abs(e - 0.035) < 0.004) { C[i * 3] = 150; C[i * 3 + 1] = 118; C[i * 3 + 2] = 70; }  // brass inlay
    const glow = cove ? 1 : e >= 0.15 ? Math.max(0, 1 - (e - 0.15) * 9) * 0.45 : 0;   // LED cove + falloff
    E[i * 3] = 255 * glow; E[i * 3 + 1] = 168 * glow; E[i * 3 + 2] = 92 * glow;
  }
  const map = paint(S, S, (x, y) => { const i = (y * S + x) * 3; return [C[i], C[i + 1], C[i + 2]]; });
  const emi = paint(S, S, (x, y) => { const i = (y * S + x) * 3; return [E[i], E[i + 1], E[i + 2]]; });
  return { map, nrm: normalFromHeight(H, S, S, 4), emi };
}

let cache = null;
/** build (once) and return the shared materials */
export function skin() {
  if (cache) return cache;
  const t0 = performance.now();
  const f = chevron(), w = fabricPanels(), c = coffers();
  cache = {
    floor: new THREE.MeshStandardMaterial({ map: tex(f.map, true), normalMap: tex(f.nrm), roughnessMap: tex(f.rough), roughness: 1, metalness: 0, envMapIntensity: 0.45, normalScale: new THREE.Vector2(0.8, 0.8) }),
    wall: new THREE.MeshStandardMaterial({ map: tex(w.map, true), normalMap: tex(w.nrm), roughnessMap: tex(w.rough), roughness: 1, metalness: 0.05, envMapIntensity: 0.35 }),
    ceiling: new THREE.MeshStandardMaterial({ map: tex(c.map, true), normalMap: tex(c.nrm), emissiveMap: tex(c.emi, true), emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.8, metalness: 0.1 }),
    size: N, ms: 0,
  };
  cache.ms = Math.round(performance.now() - t0);
  window.MGSKININFO = { size: N, ms: cache.ms };
  return cache;
}
