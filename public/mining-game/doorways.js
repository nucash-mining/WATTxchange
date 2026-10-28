/* ================= DOORWAYS: real walk-through openings =================
   A doorway is an opening cut into a wall line, with a framed casing on the room
   side, lined reveals through the wall, a short lit vestibule behind it and a pair
   of sliding leaves that part when you walk up. It replaces the painted "hole"
   plane in the Lounge and the floating torus portals.

   doorway(opts) → { group, lane, alcove, boxes, gap, front, frontLook, tick(px, pz, dt), setOpen(bool) }
     opts.axis  'x' — wall plane is x = at (side walls) · 'z' — wall plane is z = at
     opts.at    wall plane coordinate (world)      opts.c   centre along the wall (world)
     opts.dir   +1 / -1: the side of the wall the vestibule extends to (away from the room)
     opts.w, h  opening size (2.25 units = 1 m)    opts.depth vestibule depth
     opts.color neon trim colour                   opts.label sign text (optional)
     opts.closed   leaves stay shut ("coming soon")
   lane   — walk rect for the eye point (union with the room's WALKBOX)
   alcove — 3D box for the camera clamp     boxes — jamb/vestibule wall colliders (y1 = top)
   trigger— rect deep in the vestibule: walking into it means "go through"          */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const T = 0.3;                                  // wall thickness
const cv = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
let shared = null;
function mats() {
  if (shared) return shared;
  const panel = cv(128, 256, (g, w, h) => {      // vestibule wall: dark acoustic panels with fine grooves
    g.fillStyle = '#171a26'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 8) { g.fillStyle = x % 16 ? '#1c2030' : '#12141e'; g.fillRect(x, 0, 6, h); }
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, h * 0.42, w, 3);
  });
  panel.wrapS = panel.wrapT = THREE.RepeatWrapping;
  const runner = cv(64, 256, (g, w, h) => {      // floor runner
    g.fillStyle = '#20131f'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${90 + Math.random() * 60 | 0},${40 + Math.random() * 30 | 0},${70 + Math.random() * 40 | 0},.18)`; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
    g.fillStyle = '#b08a50'; g.fillRect(4, 0, 2, h); g.fillRect(w - 6, 0, 2, h);
  });
  runner.wrapS = runner.wrapT = THREE.RepeatWrapping;
  shared = {
    casing: new THREE.MeshStandardMaterial({ color: 0x23202c, roughness: 0.42, metalness: 0.55 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xb08a50, roughness: 0.32, metalness: 0.85 }),
    reveal: new THREE.MeshStandardMaterial({ color: 0x14161f, roughness: 0.7, metalness: 0.2 }),
    wall: new THREE.MeshStandardMaterial({ map: panel, roughness: 0.85, metalness: 0 }),
    floor: new THREE.MeshStandardMaterial({ map: runner, roughness: 0.95, metalness: 0 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x1a1d29, roughness: 0.35, metalness: 0.7 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x0b1020, roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.55 }),
  };
  return shared;
}

export function doorway(o) {
  const { axis, at, c, dir = 1, w = 2.4, h = 4.6, depth = 3.2, color = 0x35e0ff, label = '', closed = false } = o;
  const M = mats();
  const neon = new THREE.MeshBasicMaterial({ color });
  const g = new THREE.Group(); g.name = 'doorway' + (label ? ':' + label : '');
  // local frame: x = along the wall, z = into the vestibule (away from the room), y up
  g.position.set(axis === 'x' ? at : c, 0, axis === 'x' ? c : at);
  g.rotation.y = axis === 'x' ? dir * Math.PI / 2 : (dir > 0 ? 0 : Math.PI);
  const add = (geo, m, x, y, z, ud) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); if (ud) Object.assign(o.userData, ud); g.add(o); return o; };
  const rb = (W, H, D, r = 0.03) => new RoundedBoxGeometry(W, H, D, 2, Math.min(r, W / 2.2, H / 2.2, D / 2.2));
  // casing (room side, z < 0): two jambs + head + plinth blocks, brass inner bead + neon reveal
  const CW = 0.26, CD = 0.1;
  for (const s of [-1, 1]) {
    add(rb(CW, h + CW, CD), M.casing, s * (w / 2 + CW / 2), (h + CW) / 2, -T / 2 - CD / 2);
    add(rb(CW + 0.06, 0.5, CD + 0.04), M.casing, s * (w / 2 + CW / 2), 0.25, -T / 2 - CD / 2 - 0.01);    // plinth block
    add(new THREE.BoxGeometry(0.025, h, 0.025), M.brass, s * (w / 2 + 0.012), h / 2, -T / 2 - CD - 0.005);
    add(new THREE.BoxGeometry(0.03, h - 0.1, 0.03), neon, s * (w / 2 - 0.02), h / 2, -T / 2 + 0.03);    // light line in the reveal
    // reveal liner through the wall thickness + vestibule side wall
    add(new THREE.BoxGeometry(0.04, h, T), M.reveal, s * (w / 2 + 0.02), h / 2, 0);
    const side = add(new THREE.PlaneGeometry(depth, h), M.wall.clone(), s * (w / 2), h / 2, T / 2 + depth / 2);
    side.rotation.y = -s * Math.PI / 2; side.material.map = M.wall.map.clone(); side.material.map.repeat.set(depth / 1.2, 1); side.material.map.needsUpdate = true;
  }
  add(rb(w + 2 * CW, CW * 1.2, CD), M.casing, 0, h + CW * 0.6, -T / 2 - CD / 2);
  add(new THREE.BoxGeometry(w + 2 * CW + 0.12, 0.06, CD + 0.08), M.brass, 0, h + CW * 1.2 + 0.03, -T / 2 - CD / 2);   // cornice
  add(new THREE.BoxGeometry(w, 0.04, T), M.reveal, 0, h + 0.02, 0);                                                  // soffit
  add(new THREE.BoxGeometry(w - 0.1, 0.03, 0.03), neon, 0, h - 0.02, -T / 2 + 0.03);
  add(new THREE.BoxGeometry(w + 0.1, 0.03, T + 0.08), M.brass, 0, 0.015, 0);                                         // threshold
  // vestibule: floor runner, ceiling with a light slot, end wall
  const fl = add(new THREE.PlaneGeometry(w, depth), M.floor.clone(), 0, 0.02, T / 2 + depth / 2); fl.rotation.x = -Math.PI / 2;
  fl.material.map = M.floor.map.clone(); fl.material.map.repeat.set(1, depth / 2); fl.material.map.needsUpdate = true;
  const ce = add(new THREE.PlaneGeometry(w, depth), M.reveal, 0, h, T / 2 + depth / 2); ce.rotation.x = Math.PI / 2;
  add(new THREE.BoxGeometry(0.12, 0.02, depth - 0.4), neon, 0, h - 0.01, T / 2 + depth / 2);
  const endZ = T / 2 + depth;
  const end = add(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: corridor(color, closed) }), 0, h / 2, endZ - 0.01); end.rotation.y = Math.PI;
  // sliding leaves just in front of the end wall
  const LZ0 = endZ - 0.32, leaves = [];
  for (const s of [-1, 1]) {
    const L = new THREE.Group(); L.position.set(s * w / 4, 0, LZ0); g.add(L);
    const slab = new THREE.Mesh(rb(w / 2 - 0.02, h - 0.04, 0.08, 0.02), M.leaf); slab.position.y = h / 2; L.add(slab);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(w / 2 - 0.4, h * 0.45), M.glass); win.position.set(0, h * 0.6, -0.045); win.rotation.y = Math.PI; L.add(win);
    const pull = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.9, 0.05), M.brass); pull.position.set(-s * (w / 4 - 0.16), h * 0.45, -0.07); L.add(pull);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.02, h - 0.3, 0.02), neon); strip.position.set(-s * (w / 4 - 0.02), h / 2, -0.05); L.add(strip);
    leaves.push({ L, s });
  }
  // light spill: no PointLight (each extra light costs every lit fragment in the scene on
  // phones) — the vestibule glows with its neon colour through an emissive lift instead
  for (const m of [fl, ...g.children.filter((o) => o.material && o.material.map && o.material.map.image && o.material !== M.floor && o !== fl && o.geometry.type === 'PlaneGeometry' && o.material.isMeshStandardMaterial)]) {
    m.material.emissive = new THREE.Color(color); m.material.emissiveMap = m.material.map; m.material.emissiveIntensity = 0.55;
  }
  if (label) {
    const t = cv(512, 96, (x, W, H) => { x.fillStyle = 'rgba(8,9,14,0.92)'; x.beginPath(); x.roundRect(8, 8, W - 16, H - 16, 14); x.fill(); x.strokeStyle = '#' + new THREE.Color(color).getHexString(); x.lineWidth = 3; x.stroke(); x.fillStyle = '#ffd23f'; x.font = 'bold 46px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(label, W / 2, H / 2 + 2); });
    const sgn = add(new THREE.PlaneGeometry(Math.min(w + 0.6, 3), 0.56), new THREE.MeshBasicMaterial({ map: t, transparent: true }), 0, h + CW * 1.2 + 0.4, -T / 2 - CD - 0.03);
    sgn.rotation.y = Math.PI;
  }
  g.updateMatrixWorld(true);
  // ── world-space rects (local → world for the x/z footprint) ──
  const P = (lx, lz) => new THREE.Vector3(lx, 0, lz).applyMatrix4(g.matrixWorld);
  const rect = (ax, az, bx, bz) => { const a = P(ax, az), b = P(bx, bz); return { x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x), z0: Math.min(a.z, b.z), z1: Math.max(a.z, b.z) }; };
  const BODY = 0.5;                              // = loungeplus player radius
  const stop = closed ? LZ0 - 0.6 : LZ0 - 0.15;  // shut leaves: stop in front of them
  const lane = rect(-(w / 2 - BODY), -1.2, w / 2 - BODY, stop);
  const alcove = { ...rect(-w / 2 + 0.15, -T / 2 - 0.5, w / 2 - 0.15, endZ - 0.4), y0: 0.35, y1: h - 0.25 };
  const trigger = closed ? null : rect(-w / 2, LZ0 - 1.1, w / 2, endZ);
  const boxes = [];
  for (const s of [-1, 1]) {                      // jambs + vestibule side walls, for the body collider / camera boom
    boxes.push({ ...rect(s * (w / 2), -T / 2 - CD, s * (w / 2 + 0.6), endZ), y1: h + 0.4, name: 'doorjamb' });
  }
  boxes.push({ ...rect(-w / 2, LZ0 - 0.05, w / 2, endZ), y1: h, name: 'doorleaves' });
  const gap = axis === 'x' ? [c - w / 2 - CW, c + w / 2 + CW] : [c - w / 2 - CW, c + w / 2 + CW];
  const front = P(0, -3), frontLook = P(0, -9);
  // ── leaves animation ──
  let open = 0, force = null;
  function tick(px, pz, dt) {
    const d = Math.hypot(px - g.position.x, pz - g.position.z);
    const want = force !== null ? force : (!closed && d < 5.5 ? 1 : 0);
    open += (want - open) * (1 - Math.exp(-dt * 6));
    for (const { L, s } of leaves) L.position.x = s * (w / 4 + open * (w / 2 - 0.1));
  }
  g.traverse((m) => { m.userData.noCollide = true; });      // colliders come from `boxes`, not the mesh scan
  return { group: g, lane, alcove, boxes, trigger, gap, front, frontLook, tick, setOpen(v) { force = v === null ? null : (v ? 1 : 0); } };
}

/** the view through the leaves: a lit corridor receding (or a "soon" panel) */
function corridor(color, closed) {
  const hex = '#' + new THREE.Color(color).getHexString();
  return cv(256, 512, (g, W, H) => {
    g.fillStyle = '#05060b'; g.fillRect(0, 0, W, H);
    const vx = W / 2, vy = H * 0.46;
    g.strokeStyle = hex + '44'; g.lineWidth = 2;
    for (let i = 1; i <= 6; i++) { const k = 1 - i / 7; g.strokeRect(vx - W / 2 * k, vy - vy * k, W * k, (H - vy) * k + vy * k); }
    const far = g.createRadialGradient(vx, vy, 4, vx, vy, 110); far.addColorStop(0, hex + (closed ? '55' : 'ee')); far.addColorStop(1, hex + '00');
    g.fillStyle = far; g.fillRect(0, 0, W, H);
    if (closed) { g.fillStyle = '#ffd23f'; g.font = 'bold 34px system-ui'; g.textAlign = 'center'; g.fillText('SOON', vx, vy + 12); }
  });
}
