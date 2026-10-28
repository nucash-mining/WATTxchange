/* ================= LOUNGE PLUS: collision, camera clamp, FPS viewmodel =================
   window.MGCOLL — the player is a circle on the floor; furniture/bar/booth/cabinets are
                   floor boxes collected from the scene (refreshed while in the Lounge, so
                   furniture placed or moved by players is picked up too).
   window.MGCAM  — keeps the camera inside the room shell (walls, ceiling, floor) and pulls
                   a third-person / orbit boom in front of tall props, every frame before render.
   window.MGVM   — first-person arms + hands drawn in their own scene over the world
                   (idle sway, walk bob, look lag, sip animation when drinking, reach on use).
   Disable pieces for debugging: localStorage mgColl='0' / mgVM='0'. */
import * as THREE from 'three';
import { resolveMove, clampCamRay, boomFraction, roomFor } from './lounge-physics.js?v=2';

const MG = () => window.MG;
const LX = 0, LZ = -120, LW = 30, LD = 24, LH = 6;
const R = 0.5;                                   // player radius (world units; 2.25 = 1 m) — fits between bar stools
const EYE = 1.62 * 2.25;
const ROOM = { x0: LX - LW / 2 + 0.35, x1: LX + LW / 2 - 0.35, y0: 0.35, y1: LH - 0.5, z0: LZ - LD / 2 + 0.35, z1: LZ + LD / 2 - 0.3 };
const off = (k) => { try { return localStorage.getItem(k) === '0'; } catch (e) { return false; } };
const inLounge = () => !!window.MGLOUNGE?.on;

// ── colliders ──────────────────────────────────────────────────────────────────
const _b = new THREE.Box3(), _mb = new THREE.Box3();
let boxes = [], lastScan = 0, vmRoot = null;
function skip(o) {
  if (!o.visible) return true;
  if (o.isLight || o.isSprite || o.isPoints || o.isLine || o.isCamera) return true;
  const u = o.userData || {};
  return !!(u.skinned || u.chibi || u.portal || u.noCollide) || o === vmRoot;
}
/** see-through FX (light cones, glows, beams): additive / no depth write / nearly clear */
function ghost(m) { const a = Array.isArray(m) ? m : [m]; return a.every((x) => x && x.transparent && (x.opacity < 0.5 || x.depthWrite === false || x.blending === THREE.AdditiveBlending)); }
function hasSkin(o) { let s = false; o.traverse((c) => { if (c.isSkinnedMesh) s = true; }); return s; }
/** union of the mesh boxes below head height — so a lamp shade, shelf top or sign
    above a cabinet doesn't turn its whole column into a wall */
function propBox(o) {
  let any = false; _b.makeEmpty();
  o.traverse((c) => {
    if (!c.isMesh || !c.visible || c.isSkinnedMesh || c.userData?.noCollide || ghost(c.material)) return;
    _mb.setFromObject(c); if (_mb.isEmpty() || _mb.min.y > 1.9) return;
    _b.union(_mb); any = true;
  });
  return any ? _b : null;
}
function overlapsRoom(b) { return b.max.x > LX - LW / 2 && b.min.x < LX + LW / 2 && b.max.z > LZ - LD / 2 && b.min.z < LZ + LD / 2; }
function scan() {
  const out = [], scene = MG()?.scene; if (!scene) return out;
  scene.updateMatrixWorld();
  const visit = (o, depth) => {
    for (const c of o.children) {
      if (skip(c)) continue;
      if (hasSkin(c)) continue;                  // NPCs, PartyBot, remote players: not walls
      _b.setFromObject(c); if (_b.isEmpty() || !overlapsRoom(_b)) continue;
      const fx = _b.max.x - _b.min.x, fz = _b.max.z - _b.min.z, big = Math.max(fx, fz);
      // rooms / groups of many things: look inside. Leaves bigger than 10 (floor, walls,
      // ceiling, rugs) are the room shell — the WALKBOX already handles those.
      if (depth < 8 && c.children.length && (big > 10 || (fx * fz > 8 && c.children.length > 1))) { visit(c, depth + 1); continue; }
      if (big > 10) continue;
      const pb = propBox(c); if (!pb) continue;
      if (pb.min.y > 0.8 || pb.max.y < 0.3) continue;      // hanging / flat on the floor (rugs, decals)
      if (!overlapsRoom(pb) || Math.min(pb.max.x - pb.min.x, pb.max.z - pb.min.z) < 0.03) continue;   // planes / decals
      out.push({ x0: pb.min.x, x1: pb.max.x, z0: pb.min.z, z1: pb.max.z, y1: pb.max.y, name: c.name || c.type });
    }
  };
  visit(scene, 0);
  return out;
}
// doorway jambs / shut leaves (doorways.js) are static colliders, not scanned meshes
const doorBoxes = () => window.MGDOORS?.lounge?.boxes || [];
const rooms = () => [ROOM, ...(window.MGDOORS?.lounge?.alcoves || [])];
function refresh() { boxes = scan().concat(doorBoxes()); lastScan = performance.now(); return boxes; }
window.MGCOLL = {
  get on() { return inLounge() && !off('mgColl'); },
  get boxes() { return boxes; },
  refresh,
  /** body at (x, z) wants to move by (dx, dz): returns the allowed { x, z, dx, dz } */
  move(x, z, dx, dz) {
    if (!this.on) return { x: x + dx, z: z + dz, dx, dz };
    if (performance.now() - lastScan > 1500) refresh();
    return resolveMove(boxes, x, z, dx, dz, R);
  },
  /** draw the collider footprints (debug) */
  debug(on = true) {
    const sc = MG().scene; let g = sc.getObjectByName('mgCollDebug'); if (g) sc.remove(g);
    if (!on) return;
    g = new THREE.Group(); g.name = 'mgCollDebug'; g.userData.noCollide = true;
    for (const b of boxes) { const m = new THREE.Mesh(new THREE.BoxGeometry(b.x1 - b.x0, 0.05, b.z1 - b.z0), new THREE.MeshBasicMaterial({ color: 0xff2266, wireframe: true })); m.position.set((b.x0 + b.x1) / 2, 0.05, (b.z0 + b.z1) / 2); g.add(m); }
    sc.add(g);
  },
};

// ── camera clamp ───────────────────────────────────────────────────────────────
const _f = new THREE.Vector3(), _t = new THREE.Vector3();
let savedMax = null;
window.MGCAM = {
  ROOM,
  /** run once per frame after the camera moved and before render */
  clamp() {
    const m = MG(); if (!m) return;
    const cam = m.cam, ctl = m.controls, lounge = inLounge();
    // orbit zoom-out in a 30×24 room: 24 units of boom is through the wall by design
    if (lounge && savedMax === null) { savedMax = ctl.maxDistance; ctl.maxDistance = Math.min(ctl.maxDistance, 10); }
    else if (!lounge && savedMax !== null) { ctl.maxDistance = savedMax; savedMax = null; }
    if (!lounge || m.SIT?.on || off('mgCam')) return;
    const view = window.MGFP?.view || 'orbit';
    const before = cam.position.clone();
    if (view === 'first') {
      clampCamRay(cam.position, cam.position, roomFor(rooms(), cam.position));   // the room shell, or the door vestibule you're standing in
    } else {
      let anchor;
      if (view === 'third') { const b = window.MGFP.bodyPos(); anchor = _t.set(b.x, EYE, b.z); }
      else anchor = _t.copy(ctl.target);
      // pull in in front of tall props (cabinets, booth) between the anchor and the lens
      const fr = boomFraction(boxes, anchor.x, anchor.z, anchor.y, cam.position.x, cam.position.z, cam.position.y);
      if (fr < 1) {
        const len = anchor.distanceTo(cam.position), keep = Math.max(Math.min(1.2, len), len * fr);
        cam.position.sub(anchor).setLength(keep).add(anchor);
      }
      clampCamRay(anchor, cam.position, roomFor(rooms(), anchor));
      if (view === 'third') {                    // keep fpBody() (= cam + f·dist) where it was
        _f.subVectors(anchor, cam.position); _f.y = 0; window.MGFP.dist = Math.max(0.5, _f.length());
      }
    }
    if (view !== 'orbit' && !before.equals(cam.position)) ctl.target.add(_t.subVectors(cam.position, before));
    cam.lookAt(ctl.target);
  },
};

// ── first-person viewmodel ─────────────────────────────────────────────────────
const vmScene = new THREE.Scene();
const vmCam = new THREE.PerspectiveCamera(55, 1, 0.01, 10);
vmRoot = new THREE.Group(); vmRoot.userData.noCollide = true; vmScene.add(vmRoot);
vmScene.add(new THREE.HemisphereLight(0xfff1f6, 0x40304a, 1.6));
{ const d = new THREE.DirectionalLight(0xffffff, 1.6); d.position.set(0.6, 1, 0.8); vmScene.add(d); }
const skinMat = new THREE.MeshStandardMaterial({ color: '#f2c9b0', roughness: 0.85, emissive: new THREE.Color('#f2c9b0').multiplyScalar(0.12) });
const sleeveMat = new THREE.MeshStandardMaterial({ color: '#ff8ac2', roughness: 0.92 });
const cuffMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 });
function capsule(r, len, mat) { const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 12), mat); return m; }
function makeHand(side) {
  const h = new THREE.Group();
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.03, 0.09), skinMat); palm.geometry.translate(0, 0, -0.045); h.add(palm);
  const fingers = [];
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Group(); f.position.set((i - 1.5) * 0.021, 0, -0.088);
    const len = [0.045, 0.052, 0.05, 0.04][i];
    const c = capsule(0.0095, len, skinMat); c.rotation.x = Math.PI / 2; c.position.z = -len / 2 - 0.006; f.add(c);
    f.rotation.x = -0.25; h.add(f); fingers.push(f);
  }
  const th = new THREE.Group(); th.position.set(-side * 0.044, -0.004, -0.03);
  const tc = capsule(0.011, 0.04, skinMat); tc.rotation.x = Math.PI / 2; tc.position.z = -0.026; th.add(tc);
  th.rotation.y = side * 0.75; h.add(th);
  return { h, fingers, th };
}
function makeArm(side) {
  const root = new THREE.Group();                  // "shoulder" offscreen, bottom corner
  const fore = new THREE.Group(); root.add(fore);
  const sleeve = capsule(0.05, 0.42, sleeveMat); sleeve.rotation.x = Math.PI / 2; sleeve.position.z = -0.21; fore.add(sleeve);
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.054, 0.035, 14), cuffMat); cuff.rotation.x = Math.PI / 2; cuff.position.z = -0.43; fore.add(cuff);
  const wrist = capsule(0.034, 0.05, skinMat); wrist.rotation.x = Math.PI / 2; wrist.position.z = -0.47; fore.add(wrist);
  const hand = makeHand(side); hand.h.position.z = -0.5; fore.add(hand.h);
  vmRoot.add(root);
  return { root, fore, hand, side };
}
const arms = { L: makeArm(-1), R: makeArm(1) };
const cup = new THREE.Group();
{ const g = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.027, 0.1, 18, 1, true), new THREE.MeshStandardMaterial({ color: '#dff5ff', roughness: 0.1, transparent: true, opacity: 0.45, side: THREE.DoubleSide }));
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.026, 0.07, 18), new THREE.MeshStandardMaterial({ color: '#ff4f9a', roughness: 0.3, emissive: '#5a0a2a' }));
  liq.position.y = -0.012; cup.add(g, liq); cup.position.set(0.0, 0.035, -0.07); cup.visible = false; arms.R.hand.h.add(cup); }
const REST = { L: new THREE.Vector3(-0.21, -0.27, -0.12), R: new THREE.Vector3(0.21, -0.27, -0.12) };
const sm = (a, b, k) => a + (b - a) * k;
const eio = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
let st = { t: 0, bob: 0, walk: 0, lagX: 0, lagY: 0, lastYaw: null, lastPitch: 0, lastPos: null, reach: 0, reachT: -9, drink: 0, sipT: 0, vis: 0, key: '' };
async function recolor() {
  let lk = {}; try { lk = window.MGSKIN?.myLook?.() || {}; } catch (e) { /* */ }
  const key = `${lk.milady || ''}|${lk.skin || ''}`; if (key === st.key) return; st.key = key;
  let c = { skin: '#f2c9b0', shirt: lk.skin ? '#3d4b6e' : '#ff8ac2' };
  if (lk.milady && window.MGCHIBI?.colorsOf) { try { c = await window.MGCHIBI.colorsOf(lk.milady); } catch (e) { /* defaults */ } }
  skinMat.color.set(c.skin); skinMat.emissive.set(c.skin).multiplyScalar(0.12); sleeveMat.color.set(c.shirt);
}
function use() { st.reachT = st.t; }
addEventListener('keydown', (e) => { if (e.target?.matches?.('input,textarea,select')) return; if (e.key === 'e' || e.key === 'E') use(); });
addEventListener('pointerdown', (e) => { if (e.target === MG()?.renderer?.domElement && e.button === 0) use(); });
let lastNow = performance.now();
function pose(dt, cam) {
  st.t += dt;
  // speed from the camera itself (walk, joystick, anything that moves you)
  const p = cam.position;
  const sp = st.lastPos ? Math.hypot(p.x - st.lastPos.x, p.z - st.lastPos.z) / Math.max(dt, 1e-3) : 0;
  st.lastPos = { x: p.x, z: p.z };
  st.walk = sm(st.walk, Math.min(1, sp / 7.2), 1 - Math.exp(-dt * 6));
  st.bob += dt * sp * 1.15;                         // same phase rate as the camera head-bob
  // look lag: hands trail the turn a touch, then catch up
  const d = new THREE.Vector3(); cam.getWorldDirection(d);
  const yaw = Math.atan2(d.x, d.z), pitch = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1));
  if (st.lastYaw !== null) {
    let dy = yaw - st.lastYaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI;
    st.lagX = sm(st.lagX, THREE.MathUtils.clamp(dy / Math.max(dt, 1e-3) * 0.012, -0.05, 0.05), 1 - Math.exp(-dt * 10));
    st.lagY = sm(st.lagY, THREE.MathUtils.clamp((pitch - st.lastPitch) / Math.max(dt, 1e-3) * -0.01, -0.04, 0.04), 1 - Math.exp(-dt * 10));
  }
  st.lastYaw = yaw; st.lastPitch = pitch;
  st.lagX *= Math.exp(-dt * 4); st.lagY *= Math.exp(-dt * 4);
  // drinking (the 🍸 bar order sets emote 'drink' for a few seconds)
  let lk = {}; try { lk = window.MGSKIN?.myLook?.() || {}; } catch (e) { /* */ }
  const drinking = lk.emote === 'drink';
  st.drink = sm(st.drink, drinking ? 1 : 0, 1 - Math.exp(-dt * 5)); cup.visible = st.drink > 0.05;
  st.sipT = drinking ? st.sipT + dt : 0;
  const sip = drinking ? eio(Math.min(1, Math.max(0, (Math.sin(st.sipT * 1.6 - 1.2) + 0.3) / 1.0))) : 0;   // raise → tip → lower, ~4 s cycle
  const reach = (() => { const k = (st.t - st.reachT) / 0.42; return k < 0 || k > 1 ? 0 : Math.sin(Math.PI * k) ** 2; })();
  const breathe = Math.sin(st.t * 1.7) * 0.004, sway = Math.sin(st.t * 0.9) * 0.003;
  for (const k of ['L', 'R']) {
    const a = arms[k], s = a.side, ph = st.bob + (s > 0 ? 0 : Math.PI);
    const bobY = -Math.abs(Math.sin(ph)) * 0.022 * st.walk, bobX = Math.sin(ph) * 0.012 * st.walk;
    const base = REST[k];
    let x = base.x + bobX + sway * s - st.lagX, y = base.y + bobY + breathe + st.lagY, z = base.z;
    let rx = 0.12 + st.walk * Math.sin(ph) * 0.06, ry = -s * 0.2, rz = -s * 0.25;
    let curl = 0.55;                                     // relaxed fingers
    if (k === 'R') {
      // drink: hold the cup out, then lift it to the mouth and tip it
      const D = st.drink;
      x = sm(x, 0.17, D); y = sm(y, -0.2, D); rx = sm(rx, 0.3, D); curl = sm(curl, 1.25, D);
      x = sm(x, 0.08, sip); y = sm(y, -0.1, sip); z = sm(z, -0.14, sip); rx = sm(rx, 0.5, sip); rz = sm(rz, -0.55, sip);
      // use / interact: push forward with an open hand
      z -= reach * 0.16 * (1 - D); y += reach * 0.05 * (1 - D); curl = sm(curl, 0.05, reach * (1 - D));
    }
    a.root.position.set(x, y, z); a.root.rotation.set(rx, ry, rz);
    a.hand.fingers.forEach((f, i) => { f.rotation.x = -curl * (1 + i * 0.08); });
    a.hand.th.rotation.x = -curl * 0.6;
  }
}
window.MGVM = {
  scene: vmScene, cam: vmCam, arms, use,
  get visible() { return st.vis > 0.01; },
  /** call right after renderer.render(scene, cam) */
  render(renderer, cam) {
    const now = performance.now(), dt = Math.min(0.1, (now - lastNow) / 1000); lastNow = now;
    const m = MG(); if (!m || off('mgVM')) return;
    const want = window.MGFP?.view === 'first' && !m.walkBlocked?.();
    st.vis = want ? 1 : 0;
    if (!want) { st.lastYaw = null; st.lastPos = null; return; }
    recolor();
    pose(dt, cam);
    vmCam.aspect = cam.aspect; vmCam.updateProjectionMatrix();
    const ac = renderer.autoClear; renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(vmScene, vmCam);
    renderer.autoClear = ac;
  },
};
