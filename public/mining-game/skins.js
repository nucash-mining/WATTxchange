/* ================= PLAYER SKINS (realistic Lounge avatars) =================
   12 realistic, rigged people from Microsoft Rocketbox (MIT license) with motion-capture
   animation (idle, walk, sit, drink, cheer, clap, wave, drunk walk…). Pick one with
   👕 SKIN; everyone in the Lounge sees it (the look rides the existing 'look' message).
   The netcode's makeAvatar() hands any look with a `skin` to MGSKIN.avatar(). */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const UPS = 2.25;                                   // game units per metre (matches the netcode)
const HEIGHT = 1.75 * UPS;
const BASE = new URL('.', import.meta.url).href;     // works at / and at /mining-game/
const V = '?v=1';
const loader = new GLTFLoader();

let LIST = [];
const listReady = fetch(BASE + 'skins/skins.json' + V).then((r) => r.json()).then((j) => { LIST = j; return j; }).catch(() => []);

// ── caches ────────────────────────────────────────────────────────────────────
const skinCache = new Map();                        // id -> Promise<{scene, scale, lift}>
function loadSkin(id) {
  if (!skinCache.has(id)) {
    skinCache.set(id, loader.loadAsync(`${BASE}skins/${id}.glb${V}`).then((g) => {
      const s = g.scene;
      s.traverse((o) => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = false; o.receiveShadow = false; } });
      // measure the skinned pose (plain Box3 ignores bones and is badly off)
      s.updateMatrixWorld(true);
      const box = new THREE.Box3();
      s.traverse((o) => { if (o.isSkinnedMesh) { o.computeBoundingBox(); box.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld)); } });
      const scale = HEIGHT / Math.max(0.01, box.max.y - box.min.y);
      return { scene: s, scale, lift: -box.min.y * scale };
    }));
  }
  return skinCache.get(id);
}
const clipCache = new Map();                        // 'm/walk' -> Promise<AnimationClip|null>
function loadClip(sex, name) {
  const k = `${sex}/${name}`;
  if (!clipCache.has(k)) {
    clipCache.set(k, loader.loadAsync(`${BASE}anims/${sex}/${name}.glb${V}`)
      .then((g) => { const c = g.animations[0]; if (c) c.name = name; return c || null; })
      .catch(() => (sex === 'm' && name !== 'idle' ? loadClip('f', name) : null)));   // a few clips exist for one sex only
  }
  return clipCache.get(k);
}
const sexOf = (id) => (/Female/.test(id) ? 'f' : 'm');

// What each pose plays. Emotes come from look.emote (set via the emote menu / dance floor).
const POSES = {
  idle: 'idle', walk: 'walk', sit: 'sit', drunkIdle: 'drunk_idle', drunkWalk: 'drunk_walk',
};
export const EMOTES = ['cheer', 'cheer2', 'cheer3', 'clap', 'wave', 'shake', 'groove', 'drink', 'strut'];

// ── a skinned avatar group for the netcode ─────────────────────────────────────
function avatar(look) {
  const group = new THREE.Group();
  group.userData.skinned = true;
  const id = look.skin, sex = sexOf(id);
  let baseLift = 0;
  let mixer = null, current = null, model = null, lastT = performance.now(), wantLook = look;
  const actions = new Map();
  let wanted = null;                                 // newest pose asked for (play runs every frame)
  async function play(name, fade = 0.25) {
    if (!mixer || current?.name === name || wanted === name) return;
    wanted = name;
    const clip = await loadClip(sex, name);
    if (!clip || !mixer || wanted !== name) return;  // a newer pose won while this clip loaded
    let a = actions.get(name);
    if (!a) { a = mixer.clipAction(clip); actions.set(name, a); }
    a.reset(); a.enabled = true; a.setEffectiveWeight(1); a.play();
    if (current && current.action !== a) current.action.crossFadeTo(a, fade, false);
    current = { name, action: a }; wanted = null;
  }
  loadSkin(id).then(({ scene, scale, lift }) => {
    model = SkeletonUtils.clone(scene);
    model.scale.setScalar(scale); model.position.y = lift; baseLift = lift;
    group.add(model);
    mixer = new THREE.AnimationMixer(model);
    play('idle', 0);
  }).catch(() => { /* leave the group empty; the name tag still shows */ });

  let prev = null, speed = 0;
  group.userData.update = (peer) => {
    const t = performance.now(), dt = Math.min(0.1, (t - lastT) / 1000); lastT = t;
    // keep the name tag above a real-height head
    for (const c of group.children) if (c.isSprite && c.position.y < HEIGHT + 0.3) c.position.y = HEIGHT + 0.45;
    if (!mixer) return;
    const p = group.position;
    if (prev) speed = speed * 0.8 + (Math.hypot(p.x - prev.x, p.z - prev.z) / Math.max(dt, 1e-3)) * 0.2;
    prev = { x: p.x, z: p.z };
    const lk = (peer && peer.look) || wantLook;
    const drunk = !!lk.drunk;
    let pose;
    if (peer && peer.sit) pose = POSES.sit;
    else if (speed > 0.6) pose = drunk ? POSES.drunkWalk : POSES.walk;
    else if (lk.emote && EMOTES.includes(lk.emote)) pose = lk.emote;
    else pose = drunk ? POSES.drunkIdle : POSES.idle;
    play(pose);
    if (current) current.action.timeScale = pose === POSES.walk ? Math.min(1.6, Math.max(0.7, speed / 2.6)) : 1;
    mixer.update(dt);
    // dancers bounce on the DJ's beat
    if (model) model.position.y = baseLift + (lk.emote && window.MGDJ ? window.MGDJ.bounce() * 0.18 : 0);
  };
  return group;
}

// ── local look (stored per device, sent to the Lounge) ─────────────────────────
function myLook() { try { return JSON.parse(localStorage.getItem('mgLook') || 'null') || {}; } catch (e) { return {}; } }
function setMyLook(patch) {
  const look = { ...myLook(), ...patch };
  Object.keys(look).forEach((k) => look[k] == null && delete look[k]);
  try { localStorage.setItem('mgLook', JSON.stringify(look)); } catch (e) { /* private mode */ }
  try { window.MGNET?.sendObj?.({ t: 'look', look }); } catch (e) { /* offline */ }
  return look;
}

// ── skin picker ────────────────────────────────────────────────────────────────
async function openPicker() {
  await listReady;
  if (!LIST.length) { try { LIST = await (await fetch(BASE + 'skins/skins.json' + V)).json(); } catch (e) { /* offline */ } }
  document.getElementById('mg-skins')?.remove();
  const cur = myLook().skin || '';
  const ov = document.createElement('div');
  ov.id = 'mg-skins';
  ov.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(4,6,12,.9);display:flex;align-items:center;justify-content:center;padding:12px;font:14px system-ui,sans-serif;color:#e8ecf6';
  const tile = (id, label, img) => `<button data-skin="${id}" style="background:${id === cur ? '#2a2050' : '#141828'};border:2px solid ${id === cur ? '#ffd23f' : '#2c3352'};border-radius:12px;padding:6px;cursor:pointer;color:#e8ecf6;display:flex;flex-direction:column;align-items:center;gap:4px">
      ${img ? `<img src="${img}" alt="" style="width:100%;aspect-ratio:3/4;object-fit:cover;object-position:top;border-radius:8px;background:#0b0e18">` : '<div style="width:100%;aspect-ratio:3/4;border-radius:8px;background:#0b0e18;display:grid;place-items:center;font-size:34px">🧍</div>'}
      <span style="font-size:11px;text-align:center">${label}</span></button>`;
  ov.innerHTML = `<div style="background:#0f1220;border:1px solid #2c3352;border-radius:16px;max-width:760px;width:100%;max-height:90vh;overflow:auto;padding:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><b style="font-size:16px">👕 Choose your look</b><button id="mg-skins-x" style="background:#1a1d2e;border:1px solid #2c3352;color:#e8ecf6;border-radius:8px;padding:4px 10px;font-size:15px;cursor:pointer">✕</button></div>
    <div style="color:#8b94ab;font-size:12px;margin-bottom:12px">Everyone in The Lounge sees you this way. Realistic characters by Microsoft Rocketbox (MIT).</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:10px">
      ${tile('', 'Classic', null)}${LIST.map((s) => tile(s.id, s.name, `${BASE}skins/${s.id}.jpg${V}`)).join('')}</div></div>`;
  document.body.appendChild(ov);
  ov.querySelector('#mg-skins-x').onclick = () => ov.remove();
  ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
  ov.querySelectorAll('[data-skin]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.skin;
    setMyLook({ skin: id || null });
    if (id) loadSkin(id);                              // warm the cache
    ov.remove();
    try { window.MG?.toast?.(id ? '👕 Look updated' : '👕 Back to classic'); } catch (e) { /* optional */ }
  }));
}

window.MGSKIN = { avatar, list: () => LIST, myLook, setMyLook, openPicker, EMOTES, preload: (id) => loadSkin(id) };
document.getElementById('b-skin')?.addEventListener('click', openPicker);
