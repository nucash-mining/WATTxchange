/* ================= PARTY BOT (3D) =================
   The WATTxchange DEX mascot, modelled in Blender (partybot/partybot.glb: leopard-print
   robot, rainbow suspenders, mohawk) with a dance set: pump, robot, disco, runningman,
   floss, shuffle, dab, cheer, wave. He hosts the dance floor: grooves to whatever the DJ
   (or a live stage set) is playing, matched to the track's BPM, and waves people over when
   the room is quiet. Click him for a move + a line. window.MGPARTYBOT exposes him so other
   lounge features (tips, interactions) can make him react. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const MG = () => window.MG;
const UPS = 2.25, LX = 0, LZ = -120, LD = 24;
const BOOTH_Z = LZ - LD / 2 + 3.4;
const HOME = { x: LX + 2.4, z: BOOTH_Z + 3.6 };           // front-right of the dance floor
const SPOTS = [[2.4, 3.6], [-2.2, 4.4], [0.4, 5.6], [2.8, 6.2]];
const DANCES = ['pump', 'robot', 'disco', 'runningman', 'floss', 'shuffle', 'dab'];
const LINES = ['Liquidity is flowing, baby!', 'Tip your DJ! 💸', 'WATT up, lounge!', 'Bite my shiny leopard print.', 'Swap it, stake it, dance it.', 'Who brought the bass?', 'Party Bot never sleeps. Blocks don\'t either.'];
const BASE = new URL('.', import.meta.url).href, V = '?v=1';

const root = new THREE.Group(); root.visible = false;
let bot = null, mixer = null, acts = {}, cur = null, curName = '', bubble = null, bubbleUntil = 0, hit = null;
let target = { x: HOME.x, z: HOME.z }, spotT = 0, danceT = 0, oneShot = null;

function tag(text, color = '#ffd23f') {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 96; const c = cv.getContext('2d');
  c.font = 'bold 40px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
  const w = Math.min(500, c.measureText(text).width + 40);
  c.fillStyle = 'rgba(10,10,18,0.85)'; c.beginPath(); c.roundRect((512 - w) / 2, 14, w, 66, 20); c.fill();
  c.fillStyle = color; c.fillText(text, 256, 48);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false }));
  s.scale.set(2.6, 0.49, 1); s.renderOrder = 998; return s;
}
function say(text, ms = 3500) {
  if (!bot) return;
  if (bubble) { bot.remove(bubble); bubble.material.map.dispose(); }
  bubble = tag(text, '#ffffff'); bubble.position.y = 2.55; bubble.scale.multiplyScalar(1 / UPS); bot.add(bubble);
  bubbleUntil = performance.now() + ms;
}
function play(name, fade = 0.35) {
  const a = acts[name]; if (!a || name === curName) return;
  a.reset().play();
  if (cur) a.crossFadeFrom(cur, fade, false);
  cur = a; curName = name;
}
/** one-shot move (cheer / wave / dab…) then back to whatever fits the music */
function emote(name, secs = 3, line) {
  if (!acts[name]) return;
  oneShot = { name, until: performance.now() + secs * 1000 }; play(name, 0.2);
  if (line) say(line);
}

async function build() {
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const g = await loader.loadAsync(`${BASE}partybot/partybot.glb${V}`);
  bot = g.scene; bot.scale.setScalar(UPS);
  bot.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
  bot.position.set(HOME.x, 0, HOME.z);
  mixer = new THREE.AnimationMixer(bot);
  for (const c of g.animations) { const a = mixer.clipAction(c); acts[c.name] = a; }
  const nt = tag('PARTY BOT · DEX'); nt.position.y = 2.25; nt.scale.multiplyScalar(1 / UPS); bot.add(nt);
  hit = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 2, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = 1; bot.add(hit);
  root.add(bot);
  play('idle', 0);
}

// ── music sensing ─────────────────────────────────────────────────────────────
function music() {
  const dj = window.MGDJ;
  let on = false, bpm = 0;
  try {
    on = !!(dj && dj.bounce && (dj.decks().some((d) => d.playing) || dj._mc?.state?.().playing));
    const lead = dj?.decks?.().filter((d) => d.playing && d.bpm).sort((a, b) => b.state.vol - a.state.vol)[0];
    if (lead) bpm = lead.bpm * (lead.rate || 1);
  } catch (e) { /* */ }
  try { if (window.MGSTAGE?.live?.()) on = true; } catch (e) { /* */ }
  return { on, bpm };
}

// ── interaction ───────────────────────────────────────────────────────────────
const ray = new THREE.Raycaster();
function onDown(ev) {
  if (!hit || !root.visible || document.querySelector('#mg-dj,#mg-bar,#mg-casino,#mg-arcade,#mg-skins,#mg-studio')) return;
  const canvas = MG().controls.domElement, r = canvas.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1), MG().cam);
  if (ray.intersectObject(hit, false).length) {
    ev.stopImmediatePropagation();
    emote(['cheer', 'dab', 'robot', 'pump'][(Math.random() * 4) | 0], 3, LINES[(Math.random() * LINES.length) | 0]);
    try { window.dispatchEvent(new CustomEvent('mg-partybot-click')); } catch (e) { /* */ }
  }
}

// ── per frame ─────────────────────────────────────────────────────────────────
const inLoungeNow = () => { const c = MG()?.cam; return c && c.position.z < LZ + 40; };
let lastT = performance.now(), waved = 0;
function tick(now) {
  requestAnimationFrame(tick);
  const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
  const vis = !!inLoungeNow(); root.visible = vis;
  if (!vis || !bot) return;
  const m = music();
  // walk to the next spot on the floor every so often while the music plays
  const dx = target.x - bot.position.x, dz = target.z - bot.position.z, dist = Math.hypot(dx, dz);
  const walking = dist > 0.15 && !oneShot;
  if (walking) {
    const sp = Math.min(dist, dt * 2.4);
    bot.position.x += (dx / dist) * sp; bot.position.z += (dz / dist) * sp;
    turnTo(Math.atan2(dx, dz), dt);
  } else {
    // face the crowd / nearest player
    const c = MG().cam.position; turnTo(Math.atan2(c.x - bot.position.x, c.z - bot.position.z) * 0.6, dt * 0.5);
  }
  if (oneShot && now > oneShot.until) oneShot = null;
  if (!oneShot) {
    if (walking) play('walk', 0.25);
    else if (m.on) {
      danceT -= dt;
      if (danceT <= 0 || !DANCES.includes(curName)) { danceT = 7 + Math.random() * 5; play(DANCES[(Math.random() * DANCES.length) | 0], 0.4); }
      spotT -= dt; if (spotT <= 0) { spotT = 20 + Math.random() * 15; const s = SPOTS[(Math.random() * SPOTS.length) | 0]; target = { x: LX + s[0], z: BOOTH_Z + s[1] }; }
    } else {
      target = { x: HOME.x, z: HOME.z };
      const c = MG().cam.position, near = Math.hypot(c.x - bot.position.x, c.z - bot.position.z) < 9;
      if (near && now - waved > 30000) { waved = now; emote('wave', 2.5, 'Hey! Spin something — I need to dance 🕺'); }
      else play('idle', 0.4);
    }
  }
  // dance in time: clips are authored at 120 BPM
  const rate = m.on && m.bpm ? THREE.MathUtils.clamp(m.bpm / 120, 0.7, 1.45) : 1;
  mixer.timeScale = walking ? 1 : rate;
  mixer.update(dt);
  if (bubble && now > bubbleUntil) { bot.remove(bubble); bubble.material.map.dispose(); bubble = null; }
}
function turnTo(want, k) {
  let d = want - bot.rotation.y; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  bot.rotation.y += d * Math.min(1, k * 5);
}

(function boot(t = 0) {
  if (MG() && MG().scene && MG().cam && MG().controls) {
    MG().scene.add(root);
    build().then(() => {
      MG().controls.domElement.addEventListener('pointerdown', onDown, true);
      window.MGPARTYBOT = { emote, say, get pos() { return bot.position; }, root, play };
      requestAnimationFrame(tick);
    }).catch((e) => console.warn('[partybot] load failed', e));
  } else if (t < 600) setTimeout(() => boot(t + 1), 250);
})();
