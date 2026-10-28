/* ================= LOUNGE INTERIOR + BAR =================
   Realistic furnishing for The Lounge (Poly Haven, CC0): parquet floor, plaster walls,
   a real bar (wood + marble counter, back-bar shelves of bottles, round stools, hanging
   lamps), two seating areas, plants, sconces, and image-based lighting for reflections.
   The bar serves drinks; alcoholic ones are 21+ (asked once) and give a drunk effect
   (sway, blur, wobbly walk) that wears off. Others see you drunk-walk (look.drunk). */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const MG = () => window.MG;
const UPS = 2.25;                               // game units per metre
const LX = 0, LZ = -120, LW = 30, LD = 24, LH = 6;
const BASE = new URL('.', import.meta.url).href;
const V = '?v=1';
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const texLoader = new THREE.TextureLoader();

const root = new THREE.Group(); root.position.set(LX, 0, LZ); root.visible = false;
const models = new Map();
function model(name) {
  if (!models.has(name)) models.set(name, loader.loadAsync(`${BASE}lounge/${name}.glb${V}`).then((g) => g.scene));
  return models.get(name);
}
/** place a Poly Haven model (metres) at lounge-local x,z (game units), rotation y */
async function place(name, x, z, ry = 0, { y = 0, s = 1, hang = false } = {}) {
  const src = await model(name);
  const o = src.clone(true);
  o.scale.setScalar(UPS * s); o.position.set(x, y, z); o.rotation.y = ry;
  if (hang) {                                   // top of the model touches the ceiling
    o.position.y = 0; o.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(o);
    o.position.y = LH - 0.12 - b.max.y;
  }
  o.traverse((c) => { if (c.isMesh) { c.castShadow = false; c.receiveShadow = false; } });
  root.add(o); return o;
}
function pbr(name, repeat, extra = {}) {
  const t = (m, srgb) => { const tx = texLoader.load(`${BASE}lounge/${name}_${m}.webp${V}`); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(repeat[0], repeat[1]); if (srgb) tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4; return tx; };
  return new THREE.MeshStandardMaterial({ map: t('diffuse', true), normalMap: t('nor_gl'), roughnessMap: t('rough'), roughness: 1, metalness: 0, ...extra });
}

// ── room shell: floor + walls over the old neon box ────────────────────────────
function shell() {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(LW - 0.4, LD), pbr('herringbone_parquet', [LW / 4, LD / 4], { color: 0x9a8a7a, envMapIntensity: 0.25 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = 0.035; root.add(floor);
  const plaster = pbr('grey_plaster_02', [LW / 3, 2], { color: 0x4a4458, normalScale: new THREE.Vector2(0.25, 0.25), envMapIntensity: 0.3 });
  const panel = pbr('dark_wood', [LW / 2.2, 1], { color: 0x8a6a55, envMapIntensity: 0.5 });
  const WAIN = 1.15 * UPS, TOP = LH - 0.6;
  const wall = (w, x, z, ry) => {
    const lo = new THREE.Mesh(new THREE.PlaneGeometry(w, WAIN), panel); lo.position.set(x, WAIN / 2, z); lo.rotation.y = ry; root.add(lo);
    const hi = new THREE.Mesh(new THREE.PlaneGeometry(w, TOP - WAIN), plaster); hi.position.set(x, WAIN + (TOP - WAIN) / 2, z); hi.rotation.y = ry; root.add(hi);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, 0.08), new THREE.MeshStandardMaterial({ color: 0xb08a50, metalness: 0.6, roughness: 0.35 }));
    rail.position.set(x, WAIN, z); rail.rotation.y = ry; root.add(rail);
  };
  wall(LW - 0.4, 0, -LD / 2 + 0.2, 0);                        // back (behind the big screen)
  wall(LD - 0.4, -LW / 2 + 0.2, 0, Math.PI / 2);              // left (bar side)
  // right wall has the CASINO / ARCADE / STAGE doorways and the front wall the MINING ROOM
  // door (index.html + doorways.js): panel the pieces between the openings, and plaster
  // the strip above each door head
  const DH = 4.6, HALF = 2.4 / 2 + 0.26;
  const spans = (from, to, cs) => { const o = []; let at = from; for (const c of cs) { o.push([at, c - HALF]); at = c + HALF; } o.push([at, to]); return o; };
  const over = (x, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(2 * HALF, TOP - DH), plaster); m.position.set(x, DH + (TOP - DH) / 2, z); m.rotation.y = ry; root.add(m); };
  spans(-LD / 2 + 0.2, LD / 2 - 0.2, [-6, 0, 6]).forEach(([a, b]) => wall(b - a, LW / 2 - 0.2, (a + b) / 2, -Math.PI / 2));
  [-6, 0, 6].forEach((z) => over(LW / 2 - 0.2, z, -Math.PI / 2));
  spans(-LW / 2 + 0.2, LW / 2 - 0.2, [0]).forEach(([a, b]) => wall(b - a, (a + b) / 2, LD / 2 - 0.2, Math.PI));
  over(0, LD / 2 - 0.2, Math.PI);
  // skirting light strip along the floor (warm)
  const strip = new THREE.Mesh(new THREE.BoxGeometry(LW - 0.6, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: 0xffb36b }));
  strip.position.set(0, 0.06, -LD / 2 + 0.3); root.add(strip);
}

// ── the bar ────────────────────────────────────────────────────────────────────
const BAR_X = -LW / 2 + 2.3, BAR_Z0 = -7, BAR_LEN = 9;
let barHit = null;
function bar() {
  const wood = pbr('dark_wood', [3, 1]);
  const marble = pbr('marble_01', [3, 0.6], { color: 0xffffff, roughness: 0.35 });
  const h = 1.08 * UPS;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.62 * UPS, h, BAR_LEN), wood);
  body.position.set(BAR_X, h / 2, BAR_Z0 + BAR_LEN / 2); root.add(body);
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.8 * UPS, 0.06 * UPS, BAR_LEN + 0.3), marble);
  top.position.set(BAR_X, h + 0.06, BAR_Z0 + BAR_LEN / 2); root.add(top);
  const glow = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, BAR_LEN), new THREE.MeshBasicMaterial({ color: 0xffb36b }));
  glow.position.set(BAR_X + 0.32 * UPS, 0.12, BAR_Z0 + BAR_LEN / 2); root.add(glow);
  barHit = body;
  // back bar: shelves of bottles against the wall, warm backlight
  for (let i = 0; i < 3; i++) {
    const z = BAR_Z0 + 1.2 + i * 3.1;
    place('wooden_display_shelves_01', -LW / 2 + 0.55, z, Math.PI / 2);
    place('wine_bottles_01', -LW / 2 + 0.75, z - 0.4, Math.PI / 2, { y: 1.2 * UPS });
    place('wine_bottles_01', -LW / 2 + 0.75, z + 0.5, Math.PI / 2, { y: 0.62 * UPS });
  }
  const back = new THREE.PointLight(0xffa860, 1.2, 9); back.position.set(-LW / 2 + 1.2, 3.2, BAR_Z0 + BAR_LEN / 2); root.add(back);
  // stools along the customer side, lamps above
  for (let i = 0; i < 4; i++) place('bar_chair_round_01', BAR_X + 1.6, BAR_Z0 + 1.2 + i * 2.2, -Math.PI / 2);
  for (let i = 0; i < 3; i++) {
    const z = BAR_Z0 + 1.6 + i * 2.9;
    place('hanging_industrial_lamp', BAR_X + 0.2, z, 0, { hang: true });
  }
  place('boombox', BAR_X, BAR_Z0 + 0.9, Math.PI / 2, { y: h + 0.1 });
  place('wine_barrel_01', BAR_X + 0.4, BAR_Z0 - 1.2, 0);
  label('🍸 THE BAR · tap to order', BAR_X + 0.6, h + 2.3, BAR_Z0 + BAR_LEN / 2);
}

// ── seating areas, plants, lights ──────────────────────────────────────────────
function furnish() {
  // area A: big sofa + two armchairs around a coffee table (front left)
  place('sofa_03', -6.5, 9.3, Math.PI);
  place('modern_arm_chair_01', -9.6, 6.2, Math.PI / 2);
  place('modern_arm_chair_01', -3.4, 6.2, -Math.PI / 2);
  place('modern_coffee_table_01', -6.5, 6.4, 0);
  place('Ottoman_01', -6.5, 3.6, 0);
  // area B: sofa + mid-century chairs + round table (front right of centre)
  place('sofa_02', 4.5, 9.4, Math.PI);
  place('mid_century_lounge_chair', 1.7, 6.4, Math.PI * 0.62);
  place('mid_century_lounge_chair', 7.3, 6.4, -Math.PI * 0.62);
  place('coffee_table_round_01', 4.5, 6.6, 0);
  // cocktail table near the bar
  place('round_wooden_table_01', -8.6, -2.6, 0);
  // plants
  place('pachira_aquatica_01', -LW / 2 + 1.2, LD / 2 - 1.4, 0);
  place('potted_plant_02', 9.2, -LD / 2 + 1.0, 0);
  place('potted_plant_04', -1.2, 10.4, 0);
  place('potted_plant_04', 10.4, 10.4, 0.8);
  // ceiling lamps over the seating, sconces on the back wall
  const seatLight = new THREE.PointLight(0xffe2b8, 1.1, 16); seatLight.position.set(-1, LH - 1.4, 6.5); root.add(seatLight);
  [[-6.5, 6.4], [4.5, 6.6]].forEach(([x, z]) => {
    place('modern_ceiling_lamp_01', x, z, 0, { hang: true, s: 0.6 });
  });
  [-10, -6.8, 6.8, 10].forEach((x) => place('industrial_wall_sconce', x, -LD / 2 + 0.3, 0, { y: 2.6 * UPS * 0.75 }));
  // soft fill so PBR reads well; image-based light comes from the room environment
  root.add(new THREE.HemisphereLight(0xffe9d0, 0x1a1420, 0.55));
}

function label(text, x, y, z) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 96; const cx = cv.getContext('2d');
  cx.fillStyle = 'rgba(6,8,14,.85)'; cx.beginPath(); cx.roundRect(10, 12, 492, 72, 16); cx.fill();
  cx.fillStyle = '#ffb36b'; cx.font = 'bold 38px system-ui'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(text, 256, 50);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true })); s.scale.set(3.2, 0.6, 1); s.position.set(x, y, z); root.add(s);
}

// ── environment lighting only while in the lounge ─────────────────────────────
let envTex = null, savedEnv = null, savedExposure = null, envOn = false;
function setEnv(on) {
  const scene = MG().scene, r = MG().renderer || null;
  if (on === envOn) return; envOn = on;
  if (on) {
    if (!envTex && r) { const pm = new THREE.PMREMGenerator(r); envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture; }
    savedEnv = scene.environment; if (envTex) scene.environment = envTex;
  } else { scene.environment = savedEnv; }
  void savedExposure;
}

// ── drinks + drunk effect ──────────────────────────────────────────────────────
const DRINKS = [
  { id: 'beer', name: 'Lager', icon: '🍺', abv: 1 },
  { id: 'wine', name: 'Red wine', icon: '🍷', abv: 1.2 },
  { id: 'cocktail', name: 'WATT Margarita', icon: '🍸', abv: 1.5 },
  { id: 'shot', name: 'Whiskey shot', icon: '🥃', abv: 1.4 },
  { id: 'soda', name: 'Cola', icon: '🥤', abv: 0 },
  { id: 'water', name: 'Water', icon: '💧', abv: -1.2 },
];
const AGE_KEY = 'mgAge21';
let level = 0;                                   // "drinks in system"; decays ~1 per 90 s
try { level = Math.max(0, +localStorage.getItem('mgDrunk') || 0); } catch (e) { /* */ }
function ageOK() { try { return localStorage.getItem(AGE_KEY) === 'yes'; } catch (e) { return false; } }
function openBar() {
  document.getElementById('mg-bar')?.remove();
  const ov = document.createElement('div'); ov.id = 'mg-bar';
  ov.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(6,4,10,.88);display:flex;align-items:center;justify-content:center;padding:12px;font:14px system-ui,sans-serif;color:#f3eadf';
  const card = (inner) => `<div style="background:linear-gradient(#20160f,#120c08);border:1px solid #6b4a2e;border-radius:16px;max-width:440px;width:100%;padding:18px;box-shadow:0 20px 60px rgba(0,0,0,.6)">${inner}</div>`;
  const close = () => ov.remove();
  const renderAge = () => {
    ov.innerHTML = card(`<b style="font-size:17px">🍸 The Bar</b><p style="color:#cdb9a3;margin:10px 0 16px">Alcoholic drinks are for adults. Are you 21 or older?</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><button id="y" style="flex:1;padding:12px;border-radius:10px;border:0;background:#ffb36b;color:#1a1008;font-weight:800;cursor:pointer">Yes, I'm 21+</button>
      <button id="n" style="flex:1;padding:12px;border-radius:10px;border:1px solid #6b4a2e;background:transparent;color:#f3eadf;font-weight:700;cursor:pointer">No</button></div>`);
    ov.querySelector('#y').onclick = () => { try { localStorage.setItem(AGE_KEY, 'yes'); } catch (e) { /* */ } renderMenu(); };
    ov.querySelector('#n').onclick = () => { try { localStorage.setItem(AGE_KEY, 'no'); } catch (e) { /* */ } renderMenu(); };
  };
  const renderMenu = () => {
    const adult = ageOK();
    const list = DRINKS.filter((d) => adult || d.abv <= 0);
    ov.innerHTML = card(`<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:17px">🍸 The Bar</b><button id="x" style="background:transparent;border:1px solid #6b4a2e;color:#f3eadf;border-radius:8px;padding:3px 9px;cursor:pointer">✕</button></div>
      <p style="color:#cdb9a3;margin:8px 0 12px;font-size:12px">${adult ? 'On the house. Drinks wear off over a few minutes — water sobers you up faster.' : 'Soft drinks only.'}</p>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">${list.map((d) => `<button data-d="${d.id}" style="padding:12px;border-radius:12px;border:1px solid #6b4a2e;background:#2a1c12;color:#f3eadf;font-weight:700;cursor:pointer;text-align:left"><span style="font-size:22px">${d.icon}</span><br>${d.name}</button>`).join('')}</div>
      ${level > 0.3 ? `<p style="margin:12px 0 0;color:#ffb36b;font-size:12px">You've had about ${level.toFixed(1)} drink${level >= 1.5 ? 's' : ''}.</p>` : ''}`);
    ov.querySelector('#x').onclick = close;
    ov.querySelectorAll('[data-d]').forEach((b) => b.onclick = () => { drink(DRINKS.find((d) => d.id === b.dataset.d)); close(); });
  };
  document.body.appendChild(ov);
  ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
  if (localStorage.getItem(AGE_KEY) == null) renderAge(); else renderMenu();
}
function drink(d) {
  if (d.abv > 0 && !ageOK()) return;
  level = Math.max(0, Math.min(8, level + d.abv));
  try { localStorage.setItem('mgDrunk', String(level)); } catch (e) { /* */ }
  try { window.MGSKIN?.setMyLook?.({ emote: 'drink' }); setTimeout(() => window.MGSKIN?.setMyLook?.({ emote: null }), 6000); } catch (e) { /* */ }
  syncLook();
  toast(`${d.icon} ${d.name}${d.abv > 0 ? ' — cheers!' : ''}`);
}
let lookDrunk = null;
function syncLook() {
  const drunk = level >= 2.5;
  if (drunk !== lookDrunk) { lookDrunk = drunk; try { window.MGSKIN?.setMyLook?.({ drunk: drunk || null }); } catch (e) { /* */ } }
}
function toast(t) {
  const el = document.createElement('div');
  el.textContent = t; el.style.cssText = 'position:fixed;left:50%;top:90px;transform:translateX(-50%);z-index:2147483001;background:rgba(20,14,10,.92);border:1px solid #6b4a2e;color:#f3eadf;padding:8px 14px;border-radius:12px;font:14px system-ui';
  document.body.appendChild(el); setTimeout(() => el.remove(), 2600);
}
// GTA-style: the world sways and smears; walking drifts. Scales with level.
// Only CSS transforms touch the 3D canvas (cheap, composited). The blur/tint lives on a
// separate overlay that is updated a few times a second: a CSS filter re-applied to a
// live WebGL canvas every frame can take down the browser's GPU process.
let haze = null, hazeAt = 0;
function drunkFx(t, dt) {
  level = Math.max(0, level - dt / 90);
  const canvas = MG()?.controls?.domElement; if (!canvas) return;
  const k = Math.min(1, Math.max(0, (level - 0.6) / 4));       // 0 sober … 1 hammered
  if (canvas.style.filter) canvas.style.filter = '';            // clear any old-style filter
  if (k <= 0.001) {
    if (canvas.style.transform) canvas.style.transform = '';
    if (haze) { haze.remove(); haze = null; }
    return;
  }
  const roll = Math.sin(t * 0.7) * 2.2 * k + Math.sin(t * 1.9) * 0.8 * k;
  const sx = Math.sin(t * 0.5) * 8 * k, sy = Math.cos(t * 0.63) * 5 * k;
  canvas.style.transform = `translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px) rotate(${roll.toFixed(2)}deg) scale(${(1 + 0.04 * k).toFixed(3)})`;
  if (!haze) {
    haze = document.createElement('div');
    haze.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:5;transition:opacity .4s,background .4s';
    document.body.appendChild(haze);
  }
  if (t - hazeAt > 0.25) {                                    // ~4 updates a second is plenty
    hazeAt = t;
    const hue = Math.round(320 + Math.sin(t * 0.3) * 30);
    haze.style.background = `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, hsla(${hue},70%,20%,${(0.55 * k).toFixed(2)}) 100%)`;
    haze.style.opacity = '1';
  }
  // wobble: drift where you're looking/walking a little
  const c = MG().controls; if (c && c.target) { c.target.x += Math.sin(t * 1.3) * 0.004 * k * UPS; c.target.y += Math.cos(t * 1.1) * 0.003 * k * UPS; }
  if (Math.random() < dt) { try { localStorage.setItem('mgDrunk', String(level)); } catch (e) { /* */ } syncLook(); }
}

// ── interaction + per-frame ────────────────────────────────────────────────────
const ray = new THREE.Raycaster();
let prompt = null;
const inLoungeNow = () => { const c = MG()?.cam; return c && c.position.z < LZ + 40; };
function onDown(ev) {
  if (!barHit || !inLoungeNow() || document.querySelector('#mg-bar,#mg-casino,#mg-arcade,#mg-skins')) return;
  const canvas = MG().controls.domElement, r = canvas.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1), MG().cam);
  if (ray.intersectObject(barHit, false).length) { ev.stopImmediatePropagation(); ev.preventDefault(); openBar(); }
}
const COARSE = matchMedia('(pointer:coarse)').matches; let lowRes = false;
let last = performance.now();
function tick(now) {
  requestAnimationFrame(tick);
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  const vis = !!inLoungeNow();
  root.visible = vis; if (MG()?.scene) setEnv(vis);
  // phones: render the (heavy) lounge at 1x so frames — and audio — keep up
  if (COARSE && vis !== lowRes && MG()?.renderer) { lowRes = vis; MG().renderer.setPixelRatio(vis ? 1 : Math.min(devicePixelRatio, 1.6)); }
  drunkFx(now / 1000, dt);
  if (prompt) {
    let near = false;
    if (vis && barHit) { const p = barHit.getWorldPosition(new THREE.Vector3()); near = Math.hypot(MG().cam.position.x - p.x, MG().cam.position.z - p.z) < 4.5; }
    prompt.style.display = near && !document.getElementById('mg-bar') ? 'block' : 'none';
  }
}

(function boot(t = 0) {
  if (MG() && MG().scene && MG().controls && MG().cam) {
    MG().scene.add(root);
    shell(); bar(); furnish();
    MG().controls.domElement.addEventListener('pointerdown', onDown, true);
    prompt = document.createElement('div');
    prompt.textContent = '🍸 tap the bar to order a drink';
    prompt.style.cssText = 'position:fixed;left:50%;bottom:190px;transform:translateX(-50%);z-index:30;background:rgba(20,14,10,.88);border:1px solid #6b4a2e;border-radius:12px;padding:8px 14px;color:#f3eadf;font:13px system-ui;display:none;pointer-events:none';
    document.body.appendChild(prompt);
    window.MGLOUNGEFX = { openBar, drink: (id) => drink(DRINKS.find((d) => d.id === id)), level: () => level, sober: () => { level = 0; syncLook(); } };
    requestAnimationFrame(tick);
  } else if (t < 600) setTimeout(() => boot(t + 1), 250);
})();
