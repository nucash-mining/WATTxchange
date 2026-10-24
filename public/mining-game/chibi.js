/* ================= 3D MILADY CHIBIS =================
   Milady-style neochibis modelled in Blender (chibi/chibi.glb: rigged body, 5 hair
   styles, 27 hats, 5 glasses, jewellery, 13 animations). Each Milady is assembled from
   its own Milady Maker traits (chibi/traits.json, all 9,999): skin, hair style + colour,
   eye style + colour painted on a curved face, hat, glasses, shirt, earrings, necklace.
   Milady Maker by Remilia Corporation; traits/art used under the Viral Public License. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const UPS = 2.25;
const BASE = new URL('.', import.meta.url).href, V = '?v=2';
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
let gltfP = null, traitsP = null;
const getGltf = () => (gltfP ||= loader.loadAsync(`${BASE}chibi/chibi.glb${V}`));
const getTraits = () => (traitsP ||= fetch(`${BASE}chibi/traits.json${V}`).then((r) => r.json()));
async function traitsOf(id) {
  const T = await getTraits(), row = T.rows[(+id || 1) - 1] || T.rows[0], out = {};
  T.keys.forEach((k, i) => { out[k] = T.tables[k][row[i]] || ''; });
  return out;
}

// ── trait → look tables ───────────────────────────────────────────────────────
const SKIN = { pale: '#f8e7db', clay: '#dba886', pink: '#f7cfd2', tan: '#c88d5f', black: '#5e3d2d', alien: '#a8dcb0' };
const HAIRC = { brown: '#6b4426', green: '#4f9a52', slate: '#6f7d8d', orange: '#e2792c', black: '#1d1a20', dark: '#2d2531', blue: '#3e6fd4', purple: '#8b5ccb', blonde: '#f0d27b', 'frosted purple': '#cdb8f1', 'frosted blonde': '#f6ebd2', pink: '#f39ac0', 'harajuku dye': '#ff6fb5' };
const EYEC = { green: '#3fa35a', blue: '#3c79d6', brown: '#7a4a28', aqua: '#36c6c9', lilac: '#a98be0', grey: '#8a94a0', leaf: '#7cbd3e', gold: '#d6a632' };
const COLW = [['pink', '#f59ac2'], ['black', '#1f1f24'], ['white', '#f2f2f2'], ['blue', '#4d74c9'], ['red', '#d9413b'], ['green', '#4f9a52'], ['orange', '#ee8a32'], ['yellow', '#f2cf45'], ['purple', '#8b5ccb'], ['gold', '#d9b04a'], ['brown', '#7a5236'], ['denim', '#4a6fa5'], ['camo', '#e58ab0'], ['grey', '#8a8f99'], ['navy', '#2a3a66'], ['plaid', '#b44a4a'], ['leopard', '#c9964f'], ['goth', '#25222b'], ['silk', '#e9e2f5'], ['tie dye', '#7fd0e8'], ['bear', '#8c5e3c'], ['sheep', '#f3efe6'], ['fur', '#d8c7b0'], ['puffer', '#d9413b'], ['maid', '#222'], ['lolita', '#f5b6cf'], ['sailor', '#2a3a66'], ['jesus', '#f2f2f2'], ['remilia', '#f2f2f2'], ['tennis', '#f2f2f2'], ['strawberry', '#e0344f'], ['cake', '#f7e3c6'], ['alien', '#9de07f'], ['halo', '#f6d36b']];
const colorFrom = (s, dflt) => { s = (s || '').toLowerCase(); for (const [w, c] of COLW) if (s.includes(w)) return c; return dflt; };
const hashCol = (s) => { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return `hsl(${h % 360},55%,62%)`; };
function hatShape(h) {
  h = (h || '').toLowerCase(); if (!h) return null;
  const m = [['backwards', 'cap_back'], ['trucker', 'cap'], ['cross cap', 'cap'], ['varsity', 'cap'], ['saints cap', 'cap'], ['denim', 'cap'], ['workin', 'cap'], ['skull cap', 'beanie'], ['earflap', 'beanie_pom'],
    ['ivy', 'flatcap'], ['bucket', 'bucket'], ['cowboy', 'cowboy'], ['beret', 'beret'], ['bonnet', 'bonnet'], ['maid', 'maid'], ['bow', 'bow'], ['visor', 'visor'], ['bear ears', 'bear_ears'], ['cat ears', 'cat_ears'],
    ['earmuffs', 'earmuffs'], ['headband', 'headband'], ['kossphones', 'headphones'], ['bandana', 'bandana'], ['bear hat', 'beanie'], ['bean hat', 'beanie_pom'], ['beanie', 'beanie'], ['fur hat', 'fur'],
    ['strawberry', 'strawberry'], ['fez', 'fez'], ['halo', 'halo'], ['sailor', 'sailor'], ['cake', 'cake'], ['alien', 'alien'], ['flower', 'flower'], ['dubai', 'tall'], ['heihei', 'bucket'], ['migoko', 'tall']];
  for (const [w, s] of m) if (h.includes(w)) return s;
  return 'cap';
}
function glassShape(g) {
  g = (g || '').toLowerCase(); if (!g) return null;
  if (g.includes('moakley')) return { s: 'wrap', lens: '#1c2a44' };
  if (g.includes('mottega')) return { s: 'sun', lens: g.includes('yellow') ? '#f1c21b' : '#2f7ae5' };
  if (g.includes('sunglasses')) return { s: 'sun', lens: '#141414' };
  if (g.includes('cobain')) return { s: 'oval', frame: '#f4f4f4' };
  if (g.includes('round') || g.includes('harajuku')) return { s: 'round', frame: g.includes('harajuku') ? '#ff5fa2' : '#2b2b2b' };
  return { s: 'rect', frame: '#2b2b2b' };
}

// ── face painting (curved decal; transparent canvas — no square, no background) ─
const R = 0.215;
function uvToPx(x, z) {          // x, z in metres relative to the head centre → canvas px (512)
  const u = x / (2 * R) + 0.5, v = (z + 0.12) / 0.29;
  return [u * 512, (1 - v) * 512];
}
function paintFace(t, skinCol) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512; const c = cv.getContext('2d');
  const iris = EYEC[t.ec] || '#3c79d6', E = (t.e || 'classic').toLowerCase();
  const eye = (sx) => {
    const [x, y] = uvToPx(sx * 0.072, -0.02), w = 46, h = 58;
    c.save(); c.translate(x, y); c.scale(2.05, 2.05);   // big neochibi eyes
    if (E === 'closed') { c.strokeStyle = '#2a1d22'; c.lineWidth = 7; c.beginPath(); c.arc(0, -6, 28, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); c.restore(); return; }
    if (E === 'heart eyes') { c.fillStyle = '#ff3d7f'; c.beginPath(); c.moveTo(0, 26); c.bezierCurveTo(-48, -6, -22, -44, 0, -18); c.bezierCurveTo(22, -44, 48, -6, 0, 26); c.fill(); c.restore(); return; }
    // white + lash line
    c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(0, 0, w * 0.5, h * 0.5, 0, 0, Math.PI * 2); c.fill();
    if (E === 'spiral') { c.strokeStyle = '#2a1d22'; c.lineWidth = 4; c.beginPath(); for (let a = 0; a < Math.PI * 7; a += 0.2) { const r = a * 2.6; c.lineTo(Math.cos(a) * r * 0.8, Math.sin(a) * r); } c.stroke(); c.restore(); return; }
    const big = E === 'dilated' ? 0.62 : 0.48;
    const g = c.createLinearGradient(0, -h * 0.4, 0, h * 0.4); g.addColorStop(0, '#1b1320'); g.addColorStop(0.45, iris); g.addColorStop(1, iris);
    c.fillStyle = g; c.beginPath(); c.ellipse(0, 4, w * 0.42, h * 0.44, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#120c12'; c.beginPath(); c.ellipse(0, 6, w * 0.42 * big, h * 0.44 * big, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffffff';
    if (E === 'sparkle') { const star = (sx2, sy2, r) => { c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.38 : r; c.lineTo(sx2 + Math.cos(a) * rr, sy2 + Math.sin(a) * rr); } c.fill(); }; star(-8, -10, 13); star(10, 12, 6); }
    else { c.beginPath(); c.ellipse(-8, -10, 9, 11, -0.4, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(9, 12, 4.5, 0, Math.PI * 2); c.fill(); }
    // upper lash + lid styles
    c.strokeStyle = '#1f1418'; c.lineWidth = 4.5; c.lineCap = 'round';
    c.beginPath(); c.ellipse(0, 0, w * 0.52, h * 0.52, 0, Math.PI * 1.08, Math.PI * 1.92); c.stroke();
    c.beginPath(); c.moveTo(sx * w * 0.5, -h * 0.18); c.lineTo(sx * w * 0.66, -h * 0.34); c.stroke();
    if (E === 'sleepy' || E === 'smug') { c.fillStyle = SKIN.pale; c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(0,0,0,0)'; c.globalCompositeOperation = 'source-over'; c.fillStyle = skinCol; c.beginPath(); c.rect(-w * 0.55, -h * 0.55, w * 1.1, h * (E === 'smug' ? 0.5 : 0.42)); c.fill(); c.beginPath(); c.moveTo(-w * 0.5, -h * (E === 'smug' ? 0.05 : 0.13)); c.lineTo(w * 0.5, -h * (E === 'smug' ? 0.05 : 0.13)); c.stroke(); }
    if (E === 'teary' || E === 'crying') { c.fillStyle = 'rgba(150,210,255,0.9)'; c.beginPath(); c.ellipse(sx * 4, h * 0.48, 7, 10, 0, 0, Math.PI * 2); c.fill(); if (E === 'crying') { c.fillRect(sx * 4 - 5, h * 0.48, 10, 70); } }
    c.restore();
  };
  eye(1); eye(-1);
  // brows
  c.strokeStyle = '#3a2a2a'; c.lineWidth = 5; c.lineCap = 'round';
  for (const s of [1, -1]) { const [x, y] = uvToPx(s * 0.074, 0.085); c.beginPath(); c.moveTo(x - 30, y + (s > 0 ? 3 : -3)); c.quadraticCurveTo(x, y - 12, x + 30, y + (s > 0 ? -3 : 3)); c.stroke(); }
  // blush, nose, mouth
  c.fillStyle = 'rgba(255,120,150,0.35)'; for (const s of [1, -1]) { const [x, y] = uvToPx(s * 0.118, -0.075); c.beginPath(); c.ellipse(x, y, 34, 15, 0, 0, Math.PI * 2); c.fill(); }
  { const [x, y] = uvToPx(0, -0.068); c.fillStyle = 'rgba(160,90,90,0.45)'; c.beginPath(); c.arc(x, y, 3, 0, Math.PI * 2); c.fill(); }
  { const [x, y] = uvToPx(0, -0.098); c.strokeStyle = '#7a3a44'; c.lineWidth = 4; c.beginPath();
    if (E === 'smug') { c.moveTo(x - 14, y); c.quadraticCurveTo(x + 4, y + 6, x + 16, y - 6); } else { c.moveTo(x - 10, y - 2); c.quadraticCurveTo(x - 5, y + 5, x, y); c.quadraticCurveTo(x + 5, y + 5, x + 10, y - 2); }
    c.stroke(); }
  // face decorations (tattoos / piercings)
  const fd = (t.fd || '').toLowerCase();
  const at = (x, z) => uvToPx(x, z);
  if (fd.includes('nose ring')) { const [x, y] = at(0.012, -0.05); c.strokeStyle = fd.includes('gold') ? '#d6a632' : '#c9ccd2'; c.lineWidth = 3; c.beginPath(); c.arc(x, y + 4, 6, 0, Math.PI * 1.6); c.stroke(); }
  if (fd.includes('teardrop')) { const [x, y] = at(-0.06, -0.05); c.fillStyle = '#1a1a1a'; c.beginPath(); c.ellipse(x, y, 4, 7, 0, 0, Math.PI * 2); c.fill(); }
  if (fd.includes('star')) { const [x, y] = at(0.11, -0.04); c.fillStyle = '#1a1a1a'; c.font = '22px sans-serif'; c.fillText('★', x - 8, y + 8); }
  if (fd.includes('hearts')) { const [x, y] = at(-0.11, -0.035); c.fillStyle = '#1a1a1a'; c.font = '18px sans-serif'; c.fillText('♥ ♥', x - 18, y + 6); }
  if (fd.includes('cross')) { const [x, y] = at(0.155, 0.03); c.fillStyle = '#1a1a1a'; c.fillRect(x - 2, y - 10, 4, 20); c.fillRect(x - 7, y - 4, 14, 4); }
  if (fd.includes('crescent')) { const [x, y] = at(-0.13, 0.0); c.fillStyle = '#1a1a1a'; c.beginPath(); c.arc(x, y, 9, 0.5, 5.8); c.arc(x + 4, y, 7, 5.8, 0.5, true); c.fill(); }
  if (fd.includes('snakebite') || fd.includes('piercing')) { c.fillStyle = '#c9ccd2'; for (const s of [-1, 1]) { const [x, y] = at(s * 0.02, -0.1); c.beginPath(); c.arc(x, y, 3.5, 0, Math.PI * 2); c.fill(); } }
  if (fd.includes('milady pilled') || fd.includes('gucci') || fd.includes('tribal')) { const [x, y] = at(0.1, -0.075); c.fillStyle = '#1a1a1a'; c.font = 'bold 12px sans-serif'; c.fillText(fd.includes('milady') ? 'milady' : fd.includes('gucci') ? 'GG' : '≋', x - 14, y); }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tex.flipY = false;   // glTF UV convention
  return tex;
}

// ── build one Milady ──────────────────────────────────────────────────────────
const HEIGHT = 1.33 * UPS;
async function build(id) {
  const [g, t] = await Promise.all([getGltf(), traitsOf(id)]);
  const model = SkeletonUtils.clone(g.scene);
  model.scale.setScalar(UPS);
  const skin = SKIN[t.r] || SKIN.pale;
  const [hs, ...hc] = (t.h || 'og black').split(' ');
  const hairStyle = { braids: 'braid' }[hs] || hs, hairCol = HAIRC[hc.join(' ')] || '#2d2531';
  const hatS = hatShape(t.hat), hatC = colorFrom(t.hat, '#f2f2f2'), hatC2 = t.hat && t.hat.includes('pink') ? '#f59ac2' : colorFrom(t.hat.replace(/^\S+\s?/, ''), '#ff5fa2');
  const gl = glassShape(t.g);
  const shirtC = colorFrom(t.s, hashCol(t.s || 'x')), bottomC = (t.s || '').match(/lolita|maid|sailor|kogal|ribbon/) ? '#2a2633' : '#3b3f52';
  const face = paintFace(t, skin);
  const pants = !/lolita|maid|sailor|kogal|dress|skirt|ribbon/.test(t.s || '') && ((+id || 1) % 3 === 0 || /hoodie|jacket|tracksuit|cargo|overall|work/.test(t.s || ''));
  model.traverse((o) => {
    const n = o.name || '';
    if (/^hair_/.test(n)) o.visible = n === `hair_${hairStyle}`;
    if (/^hat_/.test(n)) o.visible = !!hatS && n === `hat_${hatS}`;
    if (/^glasses_/.test(n)) o.visible = !!gl && n === `glasses_${gl.s}`;
    if (n === 'earrings') o.visible = !!t.er;
    if (n === 'necklace') o.visible = !!t.n;
    if (n === 'bottom_skirt' || n === 'bottom_pants') o.visible = (n === 'bottom_pants') === pants;
    if (!o.isMesh) return;
    o.castShadow = false; o.receiveShadow = false; o.frustumCulled = false;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const cl = mats.map((m) => {
      const k = m.clone(), nm = m.name;
      if (nm === 'skin') k.color.set(skin);
      else if (nm === 'hair') k.color.set(hairCol);
      else if (nm === 'shirt') k.color.set(shirtC);
      else if (nm === 'bottom') k.color.set(bottomC);
      else if (nm === 'hat') k.color.set(hatC);
      else if (nm === 'hat2') k.color.set(hatC2);
      else if (nm === 'frame' && gl?.frame) k.color.set(gl.frame);
      else if (nm === 'lens' && gl?.lens) { k.color.set(gl.lens); k.opacity = 0.85; }
      else if (nm === 'metal' && /gold|cherry|strawberry|burger/.test((t.er || '') + (t.n || ''))) k.color.set('#d6a632');
      else if (nm === 'face') { k.map = face; k.transparent = true; k.alphaTest = 0.02; k.depthWrite = false; k.color.set('#ffffff'); k.polygonOffset = true; k.polygonOffsetFactor = -2; }
      return k;
    });
    o.material = Array.isArray(o.material) ? cl : cl[0];
  });
  return { model, clips: g.animations, traits: t };
}

const EMOTES = ['cheer', 'cheer2', 'cheer3', 'clap', 'wave', 'shake', 'groove', 'drink', 'strut'];
function avatar(look) {
  const group = new THREE.Group(); group.userData.skinned = true; group.userData.chibi = true;
  let mixer = null, current = null, model = null, prev = null, speed = 0, lastT = performance.now();
  const actions = new Map();
  build(look.milady).then(({ model: m, clips }) => {
    model = m; group.add(m); mixer = new THREE.AnimationMixer(m);
    for (const c of clips) actions.set(c.name, mixer.clipAction(c));
    play('idle', 0);
  }).catch(() => { /* leave empty */ });
  function play(name, fade = 0.2) {
    if (!mixer || current?.name === name) return;
    const a = actions.get(name) || actions.get('idle'); if (!a) return;
    a.reset(); a.enabled = true; a.setEffectiveWeight(1); a.play();
    if (current && current.action !== a) current.action.crossFadeTo(a, fade, false);
    current = { name, action: a };
  }
  group.userData.update = (peer) => {
    const t = performance.now(), dt = Math.min(0.1, (t - lastT) / 1000); lastT = t;
    for (const c of group.children) if (c.isSprite && c.material?.map?.image?.width === 256) c.position.y = HEIGHT + 0.35;
    if (!mixer) return;
    const p = group.position;
    if (prev) speed = speed * 0.8 + (Math.hypot(p.x - prev.x, p.z - prev.z) / Math.max(dt, 1e-3)) * 0.2;
    prev = { x: p.x, z: p.z };
    const lk = (peer && peer.look) || look;
    let pose = 'idle';
    if (peer && peer.sit) pose = 'sit';
    else if (speed > 0.6) pose = 'walk';
    else if (lk.emote && EMOTES.includes(lk.emote)) pose = lk.emote;
    play(pose);
    if (current) current.action.timeScale = pose === 'walk' ? Math.min(1.8, Math.max(0.8, speed / 2.2)) : lk.drunk ? 0.7 : 1;
    mixer.update(dt);
    if (model) model.position.y = (lk.emote && window.MGDJ ? window.MGDJ.bounce() * 0.12 : 0);
  };
  return group;
}

window.MGCHIBI = { avatar, traitsOf, preload: () => Promise.all([getGltf(), getTraits()]) };
