/* ================= PLAYER SKINS (realistic Lounge avatars) =================
   12 realistic, rigged people from Microsoft Rocketbox (MIT license) with motion-capture
   animation (idle, walk, sit, drink, cheer, clap, wave, drunk walk…). Pick one with
   👕 SKIN; everyone in the Lounge sees it (the look rides the existing 'look' message).
   The netcode's makeAvatar() hands any look with a `skin` to MGSKIN.avatar(). */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { poseBrain, fadeFor, blender, beat, beatScale, DANCES } from './animkit.js?v=1';

const UPS = 2.25;                                   // game units per metre (matches the netcode)
const HEIGHT = 1.75 * UPS;
const BASE = new URL('.', import.meta.url).href;     // works at / and at /mining-game/
const V = '?v=4';
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
export const EMOTES = [...DANCES, 'drink'];
// the newer procedural dances (built for the Milady rig) borrow the closest mocap clip here
const CLIP_OF = { sway: 'groove', bop: 'shake', twist: 'strut' };


// ── Milady heads (Milady Maker, Viral Public License) ─────────────────────────
// A Milady is worn as a big chibi "head card" (the holder's portrait) on a realistic
// body whose own head + hair are hidden. Art loads through wsrv.nl (adds CORS + resizes).
const MILADY = '0x5Af0D9827E0c53E4799BB226655A1de152A425a5';
const ETH_RPC = 'https://ethereum-rpc.publicnode.com';
const miladyImg = (id, w = 512) => `https://wsrv.nl/?url=www.miladymaker.net/milady/${id}.png&w=${w}&output=webp`;
const cardCache = new Map();
function miladyCard(id) {
  if (!cardCache.has(id)) {
    cardCache.set(id, new Promise((res, rej) => {
      const img = new Image(); img.crossOrigin = 'anonymous';
      img.onload = () => {
        const S = 512, cv = document.createElement('canvas'); cv.width = S; cv.height = S; const c = cv.getContext('2d');
        const r = 70, b = 10;
        const rr = (x, y, w, h, rad) => { c.beginPath(); c.roundRect(x, y, w, h, rad); };
        c.fillStyle = '#ffffff'; rr(0, 0, S, S, r); c.fill();               // white frame
        c.save(); rr(b, b, S - 2 * b, S - 2 * b, r - b); c.clip();
        const ih = img.width * 0.82;                                           // head + hair: top ~82% of the width as a square
        c.drawImage(img, 0, 0, img.width, ih, b, b, S - 2 * b, S - 2 * b);
        c.restore();
        const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
        res(t);
      };
      img.onerror = () => { cardCache.delete(id); rej(new Error('milady image')); };
      img.src = miladyImg(id);
    }));
  }
  return cardCache.get(id);
}
function wearMilady(group, model, id) {
  // hide this avatar's own head + hair (materials are cloned so other avatars keep theirs)
  model.traverse((o) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const cl = mats.map((m) => { const k = m.clone(); if (/head|opacity|hair|eye|lash|teeth/i.test(m.name)) k.visible = false; return k; });
    o.material = Array.isArray(o.material) ? cl : cl[0];
  });
  let head = null; model.traverse((o) => { if (o.isBone && /(^|_)Head$/.test(o.name)) head = o; });
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: true, alphaTest: 0.05 }));
  const W = 0.62 * UPS; sprite.scale.set(W, W, 1); sprite.visible = false;
  group.add(sprite);
  miladyCard(id).then((t) => { sprite.material.map = t; sprite.material.needsUpdate = true; sprite.visible = true; }).catch(() => {});
  const v = new THREE.Vector3();
  return () => { if (!head) return; head.getWorldPosition(v); group.worldToLocal(v); sprite.position.set(v.x, v.y + 0.2 * UPS, v.z); };
}
async function ethCall(data) {
  const r = await fetch(ETH_RPC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to: MILADY, data }, 'latest'] }) });
  const j = await r.json(); if (j.error) throw new Error(j.error.message); return j.result;
}
const pad = (h) => h.replace(/^0x/, '').toLowerCase().padStart(64, '0');
async function miladysOf(addr) {
  const n = Math.min(40, parseInt(await ethCall('0x70a08231' + pad(addr)), 16) || 0);
  const ids = [];
  for (let i = 0; i < n; i++) ids.push(parseInt(await ethCall('0x2f745c59' + pad(addr) + pad(i.toString(16))), 16));
  return ids;
}
async function walletAddr() {
  try { const a = window.MG?.W3?.addr; if (a) return a; } catch (e) { /* */ }
  try { const eth = window.ethereum; if (eth) { const acc = await eth.request({ method: 'eth_requestAccounts' }); return acc && acc[0]; } } catch (e) { /* */ }
  return null;
}

// ── a skinned avatar group for the netcode ─────────────────────────────────────
function avatar(look) {
  // Miladys are full 3D chibis (chibi.js); the realistic-body + portrait card is only a fallback
  if (look && look.milady && window.MGCHIBI) return window.MGCHIBI.avatar(look);
  const group = new THREE.Group();
  group.userData.skinned = true;
  const id = look.skin, sex = sexOf(id);
  let baseLift = 0, milFollow = null;
  let mixer = null, blend = null, current = null, model = null, lastT = performance.now(), wantLook = look;
  const actions = new Map(), brain = poseBrain();
  let wanted = null, bob = 0;                        // newest pose asked for (play runs every frame)
  async function play(name, fade) {
    if (!mixer || current?.name === name || wanted === name) return;
    wanted = name;
    const from = current?.name, clip = await loadClip(sex, CLIP_OF[name] || name);
    if (!mixer || wanted !== name) return;            // a newer pose won while this clip loaded
    if (!clip) { wanted = null; current = { name, action: current?.action }; return; }   // missing clip: keep the old one
    const key = CLIP_OF[name] || name; let a = actions.get(key);
    if (!a) { a = mixer.clipAction(clip); actions.set(key, a); }
    blend.to(a, fade ?? fadeFor(from, name));         // eased weight blend, no snap on re-switch
    current = { name, action: a }; wanted = null;
  }
  loadSkin(id).then(({ scene, scale, lift }) => {
    model = SkeletonUtils.clone(scene);
    model.scale.setScalar(scale); model.position.y = lift; baseLift = lift;
    group.add(model);
    if (look.milady) milFollow = wearMilady(group, model, look.milady);
    mixer = new THREE.AnimationMixer(model); blend = blender(mixer);
    play('idle', 0);
  }).catch(() => { /* leave the group empty; the name tag still shows */ });

  let prev = null, speed = 0;
  group.userData.update = (peer) => {
    const t = performance.now(), dt = Math.min(0.1, (t - lastT) / 1000); lastT = t;
    // keep the name tag above a real-height head
    const tagY = HEIGHT + (look.milady ? 1.45 : 0.45);
    for (const c of group.children) if (c.isSprite && c.material?.map?.image?.width === 256 && Math.abs(c.position.y - tagY) > 0.01) c.position.y = tagY;
    if (!mixer) return;
    const p = group.position;
    if (prev) speed = speed * 0.8 + (Math.hypot(p.x - prev.x, p.z - prev.z) / Math.max(dt, 1e-3)) * 0.2;
    prev = { x: p.x, z: p.z };
    const lk = (peer && peer.look) || wantLook;
    const drunk = !!lk.drunk;
    const p0 = brain(dt, { speed, sit: !!(peer && peer.sit), emote: lk.emote, emotes: EMOTES });
    const pose = p0 === 'sit' ? POSES.sit : p0 === 'walk' ? (drunk ? POSES.drunkWalk : POSES.walk) : p0 === 'idle' ? (drunk ? POSES.drunkIdle : POSES.idle) : p0;
    play(pose);
    beat.tick(t);
    if (current?.action) current.action.timeScale = pose === POSES.walk ? Math.min(1.6, Math.max(0.7, speed / 2.6))
      : DANCES.includes(pose) ? beatScale(current.action.getClip().duration) : 1;
    blend.update(dt);
    if (milFollow) milFollow();
    // dancers bounce on the DJ's beat
    const want = lk.emote && window.MGDJ ? window.MGDJ.bounce() * 0.14 : 0;
    bob += (want - bob) * (1 - Math.exp(-dt * 14));     // eased: no one-frame jumps
    if (model) model.position.y = baseLift + bob;
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
      ${tile('', 'Classic', null)}${LIST.map((s) => tile(s.id, s.name, `${BASE}skins/${s.id}.jpg${V}`)).join('')}</div>
    <div style="margin-top:16px;border-top:1px solid #2c3352;padding-top:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><b style="font-size:15px">✨ Milady</b>
        <span style="color:#8b94ab;font-size:12px">${myLook().milady ? `wearing Milady #${myLook().milady}${myLook().miladyOwned ? ' ✓' : ''}` : 'become a 3D Milady chibi (built from its traits)'}</span></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0">
        <button id="ml-mine" style="background:#2a2050;border:1px solid #5b4aa0;color:#e8ecf6;border-radius:8px;padding:7px 12px;cursor:pointer;font-weight:700">🦊 Load my Miladys</button>
        <input id="ml-id" inputmode="numeric" placeholder="Milady # (1–9999)" style="background:#0b0e18;border:1px solid #2c3352;color:#e8ecf6;border-radius:8px;padding:7px;width:150px">
        <button id="ml-wear" style="background:#ffd23f;border:0;color:#111;border-radius:8px;padding:7px 12px;cursor:pointer;font-weight:800">Wear</button>
        ${myLook().milady ? '<button id="ml-off" style="background:#1a1d2e;border:1px solid #2c3352;color:#e8ecf6;border-radius:8px;padding:7px 12px;cursor:pointer">Take it off</button>' : ''}</div>
      <div id="ml-list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:8px"></div>
      <div style="color:#8b94ab;font-size:11px;margin-top:8px">Holders get a ✓ next to their name. Milady Maker art by Remilia, used under the Viral Public License.</div></div></div>`;
  document.body.appendChild(ov);
  ov.querySelector('#mg-skins-x').onclick = () => ov.remove();
  ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
  const wear = (id, owned) => {
    const n = parseInt(id, 10); if (!(n >= 1 && n <= 9999)) { try { window.MG?.toast?.('Pick a Milady number 1–9999'); } catch (e) { /* */ } return; }
    const cur = myLook();
    setMyLook({ milady: n, miladyOwned: owned || null, skin: cur.skin || 'Female_Party_01' });
    miladyCard(n).catch(() => {}); ov.remove();
  };
  ov.querySelector('#ml-wear').onclick = () => wear(ov.querySelector('#ml-id').value, false);
  ov.querySelector('#ml-id').addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') wear(e.target.value, false); });
  ov.querySelector('#ml-off')?.addEventListener('click', () => { setMyLook({ milady: null, miladyOwned: null }); ov.remove(); });
  ov.querySelector('#ml-mine').onclick = async () => {
    const box = ov.querySelector('#ml-list'); box.innerHTML = '<span style="color:#8b94ab">Checking your wallet on Ethereum…</span>';
    try {
      const a = await walletAddr(); if (!a) { box.innerHTML = '<span style="color:#f87171">Connect a wallet first (🦊 WALLET or LIVE).</span>'; return; }
      const ids = await miladysOf(a);
      if (!ids.length) { box.innerHTML = `<span style="color:#8b94ab">No Miladys in ${a.slice(0, 6)}…${a.slice(-4)} — you can still wear any Milady by number.</span>`; return; }
      box.innerHTML = ids.map((id) => `<button data-ml="${id}" style="background:#141828;border:1px solid #2c3352;border-radius:10px;padding:4px;cursor:pointer;color:#e8ecf6"><img src="${miladyImg(id, 160)}" alt="" style="width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:7px"><span style="font-size:11px">#${id} ✓</span></button>`).join('');
      box.querySelectorAll('[data-ml]').forEach((b) => b.onclick = () => wear(b.dataset.ml, true));
    } catch (e) { box.innerHTML = '<span style="color:#f87171">Couldn’t read the Milady contract — try again.</span>'; }
  };
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
