/* ================= MILADYS IN THE LOUNGE =================
   Resident Milady characters (3D bodies wearing Milady Maker portraits) who hang out in
   The Lounge — dancing on the floor, drinking at the bar, chatting by the sofas, waving
   at the arcade, and one strolling between the bar and the dance floor — plus a
   Milady Maker homage on the big screen: a living mosaic of portraits.
   Milady Maker art by Remilia Corporation, used under the Viral Public License. */
import * as THREE from 'three';

const MG = () => window.MG;
const UPS = 2.25, LX = 0, LZ = -120, LW = 30, LD = 24;
const img = (id, w) => `https://wsrv.nl/?url=www.miladymaker.net/milady/${id}.png&w=${w}&output=webp`;
const pick = (a) => a[(Math.random() * a.length) | 0];
const RESIDENTS = [
  // id, body, emote, lounge-local x, z, facing (radians, 0 = +z toward the open front)
  { id: 7, skin: 'Female_Party_01', emote: 'groove', x: -1.6, z: -3.6, ry: 0.4 },
  { id: 2021, skin: 'Female_Adult_08', emote: 'shake', x: 1.8, z: -2.6, ry: -0.5 },
  { id: 4427, skin: 'Male_Adult_05', emote: 'drink', x: -10.3, z: -0.4, ry: -Math.PI / 2 },
  { id: 666, skin: 'Female_Adult_01', emote: null, x: -8.2, z: 4.6, ry: 0.9 },
  { id: 1337, skin: 'Male_Adult_08', emote: 'clap', x: -4.2, z: 4.8, ry: -0.9 },
  { id: 9001, skin: 'Sports_Female_01', emote: 'wave', x: 11.4, z: 0.2, ry: -Math.PI / 2 },
];
const STROLLER = { id: 333, skin: 'Female_Adult_12', path: [[-9.6, 1.8], [-3.5, 0.5], [0, -1.2], [3.6, 0.8], [-1, 2.6], [-6.5, 2.6]] };

const root = new THREE.Group(); root.visible = false;
const npcs = [];
function tag(text) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const c = cv.getContext('2d');
  c.font = 'bold 28px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
  const w = Math.min(250, c.measureText(text).width + 26);
  c.fillStyle = 'rgba(255,240,250,0.88)'; c.beginPath(); c.roundRect((256 - w) / 2, 12, w, 40, 12); c.fill();
  c.fillStyle = '#c0267a'; c.fillText(text, 128, 33);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false }));
  s.scale.set(1.6, 0.4, 1); s.position.y = 1.75 * UPS + 1.45; s.renderOrder = 998; return s;
}
function spawn(r) {
  const look = { skin: r.skin, milady: r.id, emote: r.emote || null };
  const g = window.MGSKIN.avatar(look);
  g.position.set(LX + r.x, 0, LZ + r.z); g.rotation.y = r.ry || 0;
  g.add(tag(`Milady #${r.id}`));
  root.add(g);
  const n = { g, look, r }; npcs.push(n); return n;
}

// ── big-screen homage: a mosaic of portraits that keeps swapping ──────────────
let screenCv = null, screenTex = null, tiles = [], cache = new Map(), lastSwap = 0;
const COLS = 8, ROWS = 4, SW = 1600, SH = 864;
function loadImg(id) {
  if (!cache.has(id)) cache.set(id, new Promise((res) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => res(im); im.onerror = () => res(null); im.src = img(id, 220); }));
  return cache.get(id);
}
const randId = () => 1 + ((Math.random() * 9999) | 0);
function buildScreen() {
  screenCv = document.createElement('canvas'); screenCv.width = SW; screenCv.height = SH;
  screenTex = new THREE.CanvasTexture(screenCv); screenTex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 5.4), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
  mesh.position.set(LX, 3.2, LZ - LD / 2 + 0.47);               // just in front of the bezel
  root.add(mesh);
  for (let i = 0; i < COLS * ROWS; i++) tiles.push({ id: randId(), im: null, fade: 1 });
  tiles.forEach((t) => loadImg(t.id).then((im) => { t.im = im; drawScreen(); }));
  drawScreen();
}
function drawScreen() {
  const c = screenCv.getContext('2d');
  c.fillStyle = '#fbe9f2'; c.fillRect(0, 0, SW, SH);
  const tw = SW / COLS, th = SH / ROWS;
  tiles.forEach((t, i) => {
    const x = (i % COLS) * tw, y = Math.floor(i / COLS) * th;
    if (t.im) { const ih = t.im.width * (th / tw); c.globalAlpha = Math.min(1, t.fade); c.drawImage(t.im, 0, 0, t.im.width, Math.min(t.im.height, ih), x + 3, y + 3, tw - 6, th - 6); c.globalAlpha = 1; }
    else { c.fillStyle = '#f3cfe0'; c.fillRect(x + 3, y + 3, tw - 6, th - 6); }
  });
  // centre title card
  const bw = 900, bh = 250, bx = (SW - bw) / 2, by = 36;           // top band: the DJ booth sign sits low in front
  c.fillStyle = 'rgba(255,255,255,0.92)'; c.beginPath(); c.roundRect(bx, by, bw, bh, 28); c.fill();
  c.strokeStyle = '#ff5fa2'; c.lineWidth = 6; c.stroke();
  c.textAlign = 'center'; c.fillStyle = '#1b1020'; c.font = '900 92px Georgia, "Times New Roman", serif';
  c.fillText('REMILIA', SW / 2, by + 112);
  c.fillStyle = '#c0267a'; c.font = 'italic 600 46px Georgia, serif'; c.fillText('Milady Maker · network spirituality', SW / 2, by + 175);
  c.fillStyle = '#7b6b78'; c.font = '28px system-ui'; c.fillText('a homage — art under the Viral Public License', SW / 2, by + 220);
  screenTex.needsUpdate = true;
}
function swapTile() {
  const t = pick(tiles), id = randId();
  loadImg(id).then((im) => { if (!im) return; t.id = id; t.im = im; t.fade = 0; });
}

// ── per frame ─────────────────────────────────────────────────────────────────
const inLoungeNow = () => { const c = MG()?.cam; return c && c.position.z < LZ + 40; };
let stroll = null, seg = 0, segT = 0, lastT = performance.now(), lastDraw = 0;
function tick(now) {
  requestAnimationFrame(tick);
  const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
  const vis = !!inLoungeNow(); root.visible = vis;
  if (!vis) return;
  for (const n of npcs) n.g.userData.update?.({ look: n.look, sit: false });
  if (stroll) {                                  // walk the loop, pausing at each stop
    const P = STROLLER.path, a = P[seg % P.length], b = P[(seg + 1) % P.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), speed = 1.6;
    segT += dt * speed / Math.max(0.01, len);
    const pause = segT > 1 && segT < 1 + 2.2 / Math.max(0.01, len) * speed;
    if (segT >= 1 + 2.2 / Math.max(0.01, len) * speed) { seg++; segT = 0; }
    const k = Math.min(1, segT);
    stroll.g.position.set(LX + a[0] + (b[0] - a[0]) * k, 0, LZ + a[1] + (b[1] - a[1]) * k);
    if (!pause) { const want = Math.atan2(b[0] - a[0], b[1] - a[1]); let d = want - stroll.g.rotation.y; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; stroll.g.rotation.y += d * Math.min(1, dt * 6); }
    stroll.look.emote = pause ? 'wave' : null;
    stroll.g.userData.update?.({ look: stroll.look, sit: false });
  }
  if (screenCv) {
    let fading = false;
    for (const t of tiles) if (t.fade < 1) { t.fade = Math.min(1, t.fade + dt * 1.5); fading = true; }
    if (now - lastSwap > 1400) { lastSwap = now; swapTile(); }
    if (fading && now - lastDraw > 66) { lastDraw = now; drawScreen(); }
  }
}

(function boot(t = 0) {
  if (MG() && MG().scene && MG().cam && window.MGSKIN) {
    MG().scene.add(root);
    buildScreen();
    // phones get a lighter crowd
    RESIDENTS.slice(0, matchMedia('(pointer:coarse)').matches ? 3 : RESIDENTS.length).forEach(spawn);
    stroll = spawn({ ...STROLLER, emote: null, x: STROLLER.path[0][0], z: STROLLER.path[0][1], ry: 0 });
    window.MGMILADYS = { npcs, root };
    requestAnimationFrame(tick);
  } else if (t < 600) setTimeout(() => boot(t + 1), 250);
})();
