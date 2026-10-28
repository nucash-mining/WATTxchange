// furniture.js — procedural gaming desk + chairs for the mining room (feature 8).
// Replaces the on-chain desk.glb / chair_*.glb meshes visually (those files are untouched and
// still used when localStorage mgFurn === 'glb'). Built from shared, cached geometries and
// materials so 9 desks cost one set of GPU buffers; textures are tiny canvases (≤256px).
// Units: the game's 2.25 u/m. Desk front (player side) is +z. Chairs are built facing +z
// (seat front edge at +z, backrest at -z); index.html rotates them by π+0.15 so they face the desk.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const FURN_ON = (() => { try { return localStorage.getItem('mgFurn') !== 'glb'; } catch (_) { return true; } })();
const MOBILE = (() => { try { return matchMedia('(pointer:coarse)').matches || Math.min(screen.width, screen.height) < 700; } catch (_) { return false; } })();
const TS = MOBILE ? 128 : 256;

// ── cached geometry ───────────────────────────────────────────────────────────
const G = new Map();
const box = (w, h, d) => { const k = `b${w},${h},${d}`; if (!G.has(k)) G.set(k, new THREE.BoxGeometry(w, h, d)); return G.get(k); };
const rbox = (w, h, d, r = 0.03, s = 2) => { const k = `r${w},${h},${d},${r},${s}`; if (!G.has(k)) G.set(k, new RoundedBoxGeometry(w, h, d, s, Math.min(r, w / 2, h / 2, d / 2) * 0.999)); return G.get(k); };
const cyl = (rt, rb, h, n = 12) => { const k = `c${rt},${rb},${h},${n}`; if (!G.has(k)) G.set(k, new THREE.CylinderGeometry(rt, rb, h, n)); return G.get(k); };

// ── tiny procedural textures ──────────────────────────────────────────────────
function canvasTex(draw, rep = [1, 1], srgb = true) {
  const c = document.createElement('canvas'); c.width = c.height = TS; draw(c.getContext('2d'), TS);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
// 2×2 twill carbon weave
const carbon = (base) => canvasTex((x, n) => {
  x.fillStyle = base; x.fillRect(0, 0, n, n); const s = n / 8;
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
    const hor = ((i + j) >> 1) % 2 === 0, g = x.createLinearGradient(i * s, j * s, hor ? i * s : (i + 1) * s, hor ? (j + 1) * s : j * s);
    g.addColorStop(0, 'rgba(255,255,255,0.01)'); g.addColorStop(0.5, 'rgba(255,255,255,0.08)'); g.addColorStop(1, 'rgba(0,0,0,0.14)');
    x.fillStyle = g; x.fillRect(i * s + 1, j * s + 1, s - 2, s - 2);
  }
}, [18, 9]);
// diamond quilting with stitch dots (seat / back inserts)
const quilt = (base, stitch) => canvasTex((x, n) => {
  x.fillStyle = base; x.fillRect(0, 0, n, n); const s = n / 4;
  for (let i = -1; i <= 4; i++) for (let j = -1; j <= 4; j++) {
    const cx = i * s + (j % 2 ? s / 2 : 0), cy = j * s / 2 + s / 4;
    const g = x.createRadialGradient(cx, cy, 1, cx, cy, s * 0.55); g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(1, 'rgba(0,0,0,0.35)');
    x.fillStyle = g; x.beginPath(); x.moveTo(cx, cy - s / 4); x.lineTo(cx + s / 2, cy); x.lineTo(cx, cy + s / 4); x.lineTo(cx - s / 2, cy); x.closePath(); x.fill();
  }
  x.strokeStyle = stitch; x.lineWidth = Math.max(1, n / 128); x.setLineDash([n / 64, n / 96]);
  // seams follow the diamond edges (slope ±1/2)
  for (let k = -10; k <= 14; k++) { x.beginPath(); x.moveTo(k * s, 0); x.lineTo(k * s + 2 * n, n); x.stroke(); x.beginPath(); x.moveTo(k * s, 0); x.lineTo(k * s - 2 * n, n); x.stroke(); }
}, [1, 1]);
// office mesh back: dark weave with holes (alphaTest)
const meshTex = () => canvasTex((x, n) => {
  x.clearRect(0, 0, n, n); x.strokeStyle = '#2a2838'; x.lineWidth = n / 40; const s = n / 12;
  for (let i = 0; i <= 12; i++) { x.beginPath(); x.moveTo(i * s, 0); x.lineTo(i * s, n); x.stroke(); x.beginPath(); x.moveTo(0, i * s); x.lineTo(n, i * s); x.stroke(); }
}, [3, 4]);

// ── shared materials (lazy, built once) ──────────────────────────────────────
let M = null;
function mats() {
  if (M) return M;
  const std = (o) => new THREE.MeshStandardMaterial(o);
  M = {
    alu: std({ color: 0xb9bdc9, roughness: 0.32, metalness: 0.9 }),
    chrome: std({ color: 0xe6e8f0, roughness: 0.15, metalness: 1.0 }),
    steel: std({ color: 0x1c1a28, roughness: 0.45, metalness: 0.75 }),
    plastic: std({ color: 0x111018, roughness: 0.5, metalness: 0.1 }),
    rubber: std({ color: 0x0b0b10, roughness: 0.9, metalness: 0.0 }),
    top: std({ map: carbon('#1d1b2e'), color: 0xc8c4ff, roughness: 0.42, metalness: 0.35 }),
    mat: std({ color: 0x17152a, roughness: 0.95, metalness: 0.0 }),
    // leatherette for the gaming chair, fabric for the office chair
    pu: std({ color: 0x15121f, roughness: 0.55, metalness: 0.05 }),
    puQuilt: std({ map: quilt('#1d1830', 'rgba(212,42,78,0.9)'), roughness: 0.6, metalness: 0.0 }),
    accent: std({ color: 0xd42a4e, roughness: 0.5, metalness: 0.1, emissive: 0x3a0610 }),
    fabric: std({ color: 0x2a2738, roughness: 0.9, metalness: 0.0 }),
    meshBack: std({ map: meshTex(), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.8, metalness: 0.0, color: 0x9a96b0 }),
    rgbC: new THREE.MeshBasicMaterial({ color: 0x2ee6d6 }),
    rgbR: new THREE.MeshBasicMaterial({ color: 0xff2e5e }),
  };
  return M;
}
const add = (g, geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); g.add(m); return m; };

// ── desk ──────────────────────────────────────────────────────────────────────
// D = {W, D, TOP, SURF, SHELF}; the PC, monitors, keyboard and GPU shelf rack are placed by
// index.html at the same spots as before (surface SURF, shelf SHELF at z -0.62).
export function furnDesk(D) {
  const m = mats(), g = new THREE.Group(); g.name = 'furnDesk';
  const W = D.W, DD = D.D, T = 0.1;
  add(g, rbox(W, T, DD, 0.045, 3), m.top, 0, D.SURF - T / 2, 0);                       // carbon top, rounded edges
  add(g, box(W - 0.06, 0.015, 0.02), m.rgbC, 0, D.SURF - T - 0.02, DD / 2 - 0.08);    // under-lip RGB glow line
  // desk mat (keyboard + mouse zone) with a stitched cyan rim
  const mw = 2.1, md = 0.85, mx = 0.9, mz = 0.52;
  add(g, rbox(mw, 0.014, md, 0.006, 1), m.mat, mx, D.SURF + 0.006, mz);
  add(g, box(mw - 0.04, 0.004, 0.012), m.rgbC, mx, D.SURF + 0.014, mz + md / 2 - 0.02);
  add(g, box(mw - 0.04, 0.004, 0.012), m.rgbC, mx, D.SURF + 0.014, mz - md / 2 + 0.02);
  // T/K-frame legs: a foot bar along the depth, a raked upright, a top bracket
  for (const s of [-1, 1]) {
    const x = s * (W / 2 - 0.3);
    add(g, rbox(0.16, 0.09, DD - 0.15, 0.03, 1), m.steel, x, 0.045, -0.02);              // foot
    add(g, box(0.17, 0.05, 0.09), m.accent, x, 0.04, DD / 2 - 0.12);                    // front foot cap
    add(g, box(0.17, 0.05, 0.09), m.rubber, x, 0.03, -DD / 2 + 0.1);
    add(g, rbox(0.15, D.SURF - T - 0.08, 0.2, 0.03, 1), m.steel, x, (D.SURF - T) / 2 + 0.04, -0.25, -0.06); // upright (slight rake)
    add(g, box(0.14, 0.06, DD - 0.25), m.steel, x, D.SURF - T - 0.03, -0.02);           // top bracket
  }
  add(g, box(W - 0.7, 0.12, 0.06), m.steel, 0, D.SURF - T - 0.2, -0.55);                // stiffening crossbar
  // cable tray under the back edge, plus a cable spine down the left leg
  add(g, box(W * 0.55, 0.02, 0.3), m.steel, 0.2, D.SURF - T - 0.32, -0.72);
  add(g, box(W * 0.55, 0.12, 0.02), m.steel, 0.2, D.SURF - T - 0.27, -0.58);
  for (let i = 0; i < 7; i++) add(g, cyl(0.05, 0.05, 0.16, 8), m.plastic, -W / 2 + 0.3, 0.2 + i * 0.19, -0.45, 0, 0, i % 2 ? 0.08 : -0.08);
  // headphone hook (right side)
  add(g, box(0.05, 0.05, 0.16), m.alu, W / 2 + 0.02, D.SURF - T - 0.08, 0.5);
  add(g, box(0.05, 0.14, 0.05), m.alu, W / 2 + 0.02, D.SURF - T - 0.18, 0.6);
  // GPU shelf (hutch) on two aluminium uprights, RGB under the front lip
  const shelfD = 0.95, sz = -0.62;
  add(g, rbox(W, 0.09, shelfD, 0.03, 2), m.top, 0, D.SHELF, sz);
  add(g, box(W - 0.2, 0.015, 0.02), m.rgbR, 0, D.SHELF - 0.055, sz + shelfD / 2 - 0.05);
  for (const s of [-1, 1]) {
    add(g, rbox(0.1, D.SHELF - D.SURF, 0.16, 0.02, 1), m.alu, s * (W / 2 - 0.1), (D.SHELF + D.SURF) / 2, sz - 0.25);
    add(g, box(0.16, 0.02, 0.3), m.steel, s * (W / 2 - 0.1), D.SURF + 0.01, sz - 0.25);  // foot plate on the top
  }
  return g;
}

// ── chairs ────────────────────────────────────────────────────────────────────
const SEAT_TOP = 1.06; // ≈ 47cm, same as the old procedural seat / GLB seat
function base(g, m) {
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2 + Math.PI / 10, c = Math.cos(a), s = Math.sin(a);
    add(g, rbox(0.5, 0.07, 0.1, 0.03, 1), m.alu, c * 0.26, 0.13, s * 0.26, 0, -a, 0); // spoke
    // dual-wheel caster
    add(g, box(0.05, 0.08, 0.05), m.plastic, c * 0.5, 0.1, s * 0.5);
    add(g, cyl(0.055, 0.055, 0.08, 12), m.rubber, c * 0.5, 0.056, s * 0.5, 0, -a, Math.PI / 2);
  }
  add(g, cyl(0.1, 0.12, 0.13, 16), m.alu, 0, 0.15, 0);                // hub
  add(g, cyl(0.075, 0.075, 0.34, 14), m.plastic, 0, 0.36, 0);         // telescoping shroud
  add(g, cyl(0.045, 0.045, 0.32, 12), m.chrome, 0, 0.66, 0);          // gas lift
  add(g, box(0.42, 0.06, 0.42), m.steel, 0, 0.84, 0);                  // tilt mechanism
  add(g, box(0.26, 0.025, 0.025), m.chrome, 0.24, 0.82, 0.1, 0, 0, -0.2); // height lever
}
function arms(g, m, pad, adj) {
  for (const s of [-1, 1]) {
    add(g, box(0.13, 0.05, 0.08), m.steel, s * 0.27, 0.86, -0.02);
    add(g, rbox(0.075, 0.36, 0.1, 0.02, 1), m.plastic, s * 0.36, 1.06, -0.02);
    add(g, rbox(0.12, 0.05, 0.38, 0.022, 2), pad, s * 0.37, 1.26, 0.03);
    if (adj) add(g, cyl(0.02, 0.02, 0.03, 8), m.accent, s * 0.405, 1.13, 0.02, 0, 0, Math.PI / 2); // 4D release button
  }
}
export function furnChair(gaming) {
  const m = mats(), g = new THREE.Group(); g.name = 'chairG';
  base(g, m);
  const back = new THREE.Group(); back.position.set(0, SEAT_TOP - 0.04, -0.3); back.rotation.x = -0.12; g.add(back);
  if (gaming) {
    // racing bucket seat: quilted insert between raised side bolsters, piping in the accent colour
    add(g, rbox(0.62, 0.12, 0.6, 0.04, 2), m.pu, 0, SEAT_TOP - 0.1, 0);
    add(g, rbox(0.36, 0.05, 0.54, 0.02, 2), m.puQuilt, 0, SEAT_TOP - 0.025, 0.01);
    for (const s of [-1, 1]) {
      add(g, rbox(0.14, 0.13, 0.6, 0.05, 2), m.accent, s * 0.25, SEAT_TOP - 0.02, 0, 0, 0, s * -0.18);
      add(g, box(0.012, 0.012, 0.54), m.rgbR, s * 0.18, SEAT_TOP + 0.005, 0.01);   // stitch line
    }
    add(g, rbox(0.44, 0.1, 0.12, 0.04, 2), m.pu, 0, SEAT_TOP - 0.02, 0.27);         // front thigh roll
    // backrest shell + wings + head section
    add(back, rbox(0.56, 1.18, 0.12, 0.05, 2), m.pu, 0, 0.62, 0);
    add(back, rbox(0.6, 1.2, 0.04, 0.02, 1), m.plastic, 0, 0.62, -0.075);           // rear shell
    add(back, box(0.012, 1.0, 0.012), m.rgbR, -0.28, 0.6, -0.1);                     // RGB piping on the shell
    add(back, box(0.012, 1.0, 0.012), m.rgbR, 0.28, 0.6, -0.1);
    add(back, rbox(0.3, 0.86, 0.03, 0.012, 1), m.puQuilt, 0, 0.5, 0.065);            // quilted insert
    for (const s of [-1, 1]) {
      add(back, rbox(0.13, 0.78, 0.18, 0.05, 2), m.accent, s * 0.27, 0.42, 0.05, 0, s * 0.28, 0);   // side wings
      add(back, rbox(0.11, 0.3, 0.14, 0.045, 2), m.accent, s * 0.25, 0.98, 0.03, 0, s * 0.22, s * -0.1); // shoulder wings
      add(back, rbox(0.1, 0.05, 0.02, 0.015, 1), m.rubber, s * 0.12, 1.12, 0.065);   // harness slot
      add(back, box(0.06, 0.12, 0.07), m.steel, s * 0.3, -0.02, 0.0);                  // recline hinge
    }
    add(back, rbox(0.46, 0.22, 0.1, 0.04, 2), m.pu, 0, 1.31, 0);                      // head section
    add(back, rbox(0.3, 0.13, 0.11, 0.05, 2), m.accent, 0, 1.06, 0.12);              // neck pillow
    add(back, rbox(0.38, 0.17, 0.12, 0.06, 2), m.accent, 0, 0.27, 0.12);             // lumbar pillow
    arms(g, m, m.pu, true);
  } else {
    // ergonomic office chair: waterfall fabric seat, mesh back on a frame, lumbar bar
    add(g, rbox(0.6, 0.12, 0.58, 0.05, 2), m.fabric, 0, SEAT_TOP - 0.06, 0);
    add(g, rbox(0.56, 0.08, 0.12, 0.04, 2), m.fabric, 0, SEAT_TOP - 0.09, 0.27);     // waterfall edge
    const fw = 0.52, fh = 0.86;
    for (const s of [-1, 1]) add(back, rbox(0.05, fh, 0.05, 0.02, 1), m.plastic, s * fw / 2, 0.55, 0);
    add(back, rbox(fw + 0.05, 0.05, 0.05, 0.02, 1), m.plastic, 0, 0.55 + fh / 2, 0);
    add(back, rbox(fw + 0.05, 0.05, 0.05, 0.02, 1), m.plastic, 0, 0.55 - fh / 2, 0);
    const mp = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), m.meshBack); mp.position.set(0, 0.55, 0); back.add(mp);
    add(back, rbox(0.42, 0.08, 0.04, 0.02, 1), m.steel, 0, 0.32, 0.03);              // lumbar bar
    add(back, box(0.06, 0.24, 0.06), m.steel, 0, 0.0, -0.03);                           // spine to the mechanism
    arms(g, m, m.rubber, false);
  }
  return g;
}

export function furnInfo(objs) {
  let tris = 0, meshes = 0; for (const o of objs) o.traverse(n => { if (n.isMesh) { meshes++; const gg = n.geometry; tris += (gg.index ? gg.index.count : gg.attributes.position.count) / 3; } });
  return { meshes, tris: Math.round(tris), geos: G.size, tex: TS };
}
