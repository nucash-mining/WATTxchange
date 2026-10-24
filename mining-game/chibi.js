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
const BASE = new URL('.', import.meta.url).href, V = '?v=3';
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
const SKIN = { pale: '#f6f1e7', clay: '#f0dfc2', pink: '#f7e6e1', tan: '#d9a77c', black: '#5a3a2a', alien: '#b6e2b9' };   // Milady skins read very pale / creamy
const HAIRC = { brown: '#6b4426', green: '#4f9a52', slate: '#6f7d8d', orange: '#e2792c', black: '#1d1a20', dark: '#2d2531', blue: '#8fa3d6', purple: '#8b5ccb', blonde: '#f0d27b', 'frosted purple': '#cdb8f1', 'frosted blonde': '#f6ebd2', pink: '#f39ac0', 'harajuku dye': '#ff6fb5' };
const EYEC = { green: '#3fa35a', blue: '#3c79d6', brown: '#7a4a28', aqua: '#36c6c9', lilac: '#a98be0', grey: '#8a94a0', leaf: '#7cbd3e', gold: '#d6a632' };
const COLW = [['pink', '#f59ac2'], ['black', '#1f1f24'], ['white', '#f2f2f2'], ['blue', '#4d74c9'], ['red', '#d9413b'], ['green', '#4f9a52'], ['orange', '#ee8a32'], ['yellow', '#f2cf45'], ['purple', '#8b5ccb'], ['gold', '#d9b04a'], ['brown', '#7a5236'], ['denim', '#4a6fa5'], ['camo', '#e58ab0'], ['grey', '#8a8f99'], ['navy', '#2a3a66'], ['plaid', '#b44a4a'], ['leopard', '#c9964f'], ['goth', '#25222b'], ['silk', '#e9e2f5'], ['tie dye', '#7fd0e8'], ['bear', '#8c5e3c'], ['sheep', '#f3efe6'], ['fur', '#d8c7b0'], ['puffer', '#d9413b'], ['maid', '#222'], ['lolita', '#f5b6cf'], ['sailor', '#2a3a66'], ['jesus', '#f2f2f2'], ['remilia', '#f2f2f2'], ['tennis', '#f2f2f2'], ['strawberry', '#e0344f'], ['cake', '#f7e3c6'], ['alien', '#9de07f'], ['halo', '#f6d36b']];
const colorFrom = (s, dflt) => { s = (s || '').toLowerCase(); for (const [w, c] of COLW) if (s.includes(w)) return c; return dflt; };
const hashCol = (s) => { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return `hsl(${h % 360},55%,62%)`; };
// every Milady Maker shirt → base colour, accent (collar / trim), pattern, collar style
const SHIRTS = {
  'pink knit polo': ['#f2a7c3', '#1d1a20', 'argyle', 'polo'], 'chore coat': ['#3d5a37', '#151515', 'chore', 'polo'], 'cactus shirt': ['#f3ead2', '#4f9a52', 'floral', 'polo'],
  'green blazer': ['#3f7a4a', '#2b4f31', 'blazer', 'polo'], 'blue ribbon tank': ['#9cc3ef', '#ffffff', 'plain', 'round'], 'hikki condition shirt': ['#e9e6f0', '#333333', 'graphic', 'round'],
  'meedles tracksuit': ['#2f6b4f', '#c9b7e8', 'track', 'jacket'], 'silk shirt': ['#c9a2d8', '#efe2f5', 'silk', 'polo'], 'sailor lolita': ['#f8f8f8', '#2a3a7a', 'sailor', 'polo'],
  'red puffer': ['#d23c33', '#9c241e', 'puffer', 'jacket'], 'kogal cardigan': ['#e9dcb8', '#7a1f2b', 'knit', 'round'], 'peter pan collar shirt': ['#ffffff', '#ffffff', 'plain', 'polo'],
  'mape hoodie': ['#2b2b33', '#ffffff', 'graphic', 'hood'], 'im cute im punk shirt': ['#151515', '#ff5fa2', 'graphic', 'round'], 'knit sweater': ['#c58f62', '#a87048', 'knit', 'round'],
  'super lover shirt': ['#ffffff', '#e0245e', 'graphic', 'round'], 'sheep pullover': ['#f3f0e6', '#2a2a2a', 'knit', 'round'], 'bear sweater': ['#8a5a3a', '#f3e6d2', 'knit', 'round'],
  'western jacket': ['#8d6a4a', '#e9dcc0', 'plain', 'polo'], 'mouse tank': ['#ffffff', '#151515', 'graphic', 'round'], 'football shirt': ['#1c3fa8', '#ffffff', 'track', 'polo'],
  'leopard polo': ['#d9a656', '#2a1a10', 'leopard', 'polo'], 'goth poncho': ['#151515', '#3a3a3a', 'plain', 'round'], 'maid': ['#151515', '#ffffff', 'maid', 'polo'],
  'black blazer': ['#1d1d22', '#0f0f12', 'blazer', 'polo'], 'active dissident shirt': ['#ffffff', '#151515', 'graphic', 'round'], 'matagonia pullover': ['#d8623a', '#1f3f6b', 'fleece', 'jacket'],
  'goth harajuku': ['#151515', '#e04a8a', 'plain', 'round'], 'remilia tank': ['#ffffff', '#c0267a', 'graphic', 'round'], 'skull sweater': ['#151515', '#f2f2f2', 'graphic', 'round'],
  'heihei shirt': ['#f2d64b', '#151515', 'graphic', 'round'], 'bowling shirt oriental': ['#f1e8d6', '#2a8a6a', 'floral', 'polo'], 'cardigan tee': ['#c9c1e8', '#ffffff', 'plain', 'round'],
  'sweater and tie': ['#24304f', '#a8202e', 'argyle', 'polo'], 'maf rothko': ['#e86b3a', '#8a1f33', 'rothko', 'round'], 'malenciaga neon': ['#c8f02a', '#151515', 'plain', 'jacket'],
  'mwo shirt': ['#ffffff', '#151515', 'graphic', 'round'], 'blue pink shirt': ['#8fb8e8', '#f59ac2', 'split', 'polo'], 'bowling shirt': ['#2a2a33', '#e7d36a', 'bowling', 'polo'],
  'fuzzy coat': ['#e7d8c4', '#cdbba3', 'fur', 'jacket'], 'blue sweatervest': ['#3e5f9a', '#ffffff', 'argyle', 'polo'], 'ribbon lolita': ['#f6c2d6', '#ffffff', 'plain', 'polo'],
  'jesus tank': ['#ffffff', '#151515', 'graphic', 'round'], 'maf creeper': ['#151515', '#5a5a5a', 'plain', 'round'], 'leopard vest': ['#d9a656', '#2a1a10', 'leopard', 'round'],
  'ulzzang coat': ['#d6c3a6', '#b59c78', 'plain', 'polo'], 'special people shirt': ['#ffffff', '#151515', 'graphic', 'round'], 'gold spray puffer': ['#d6b04a', '#9a7a2a', 'puffer', 'jacket'],
  'bosozuku jacket': ['#f2f2f2', '#c0262d', 'graphic', 'jacket'], 'fleece paisley jacket': ['#7a2f4a', '#e8c070', 'floral', 'jacket'], 'fur coat': ['#6a4a3a', '#4a3428', 'fur', 'jacket'],
  'zip polo': ['#2f3f6a', '#ffffff', 'plain', 'jacket'], 'pink coat': ['#f2a7c3', '#e48aa9', 'plain', 'polo'], 'tie dye shirt': ['#ff6b9a', '#4fc3f7', 'tiedye', 'round'],
  'tennis outfit': ['#ffffff', '#2f6b4f', 'stripes', 'polo'], 'malenciaga jersey': ['#151515', '#ffffff', 'track', 'polo'], 'meline teddy': ['#c49a6c', '#a87d50', 'fur', 'jacket'],
};
const shirtSpec = (name) => { const k = (name || '').toLowerCase(); return SHIRTS[k] || [colorFrom(k, hashCol(k || 'x')), '#ffffff', 'plain', 'round']; };
function rng(seed) { let x = seed >>> 0 || 1; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); }
/** Paint a shirt texture: u wraps the body (front centre at u = 0.75), v runs bottom → top. */
function shirtTex(name) {
  const [base, acc, pat] = shirtSpec(name), W = 512, H = 256;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d'); const R_ = rng([...(name || 'x')].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7));
  c.fillStyle = base; c.fillRect(0, 0, W, H);
  const FX = 0.75 * W;                                         // front centre
  if (pat === 'track') { c.fillStyle = acc; for (const x of [0, 0.5 * W, W]) { c.fillRect(x - 10, 0, 7, H); c.fillRect(x + 3, 0, 7, H); } c.fillStyle = '#e8e8e8'; c.fillRect(FX - 1.5, 0, 3, H); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(FX - 5, 0, 1.5, H); }
  else if (pat === 'argyle') { const dw = 64, dh = 80; for (let y = -1; y < H / dh + 1; y++) for (let x = -1; x < W / dw + 1; x++) { if ((x + y) % 2) continue; c.fillStyle = acc; c.beginPath(); c.moveTo(x * dw + dw / 2, y * dh); c.lineTo(x * dw + dw, y * dh + dh / 2); c.lineTo(x * dw + dw / 2, y * dh + dh); c.lineTo(x * dw, y * dh + dh / 2); c.fill(); }
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.5; for (let k = -10; k < 20; k++) { c.beginPath(); c.moveTo(k * dw, 0); c.lineTo(k * dw + H * dw / dh, H); c.stroke(); c.beginPath(); c.moveTo(k * dw, H); c.lineTo(k * dw + H * dw / dh, 0); c.stroke(); } }
  else if (pat === 'floral') { for (let i = 0; i < 70; i++) { const x = R_() * W, y = R_() * H, r = 7 + R_() * 9, col = [acc, '#e0533d', '#f2b84b', '#d96aa7', '#2f6fae'][i % 5]; c.fillStyle = col; for (let k = 0; k < 5; k++) { const a = k * 1.2566 + i; c.beginPath(); c.ellipse(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.45, r * 0.3, a, 0, Math.PI * 2); c.fill(); } c.fillStyle = '#f7e27a'; c.beginPath(); c.arc(x, y, r * 0.22, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = 'rgba(40,90,60,.5)'; c.lineWidth = 2; for (let i = 0; i < 25; i++) { const x = R_() * W, y = R_() * H; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 12, y - 10, x + 22, y + 4); c.stroke(); } }
  else if (pat === 'leopard') { for (let i = 0; i < 90; i++) { const x = R_() * W, y = R_() * H, r = 6 + R_() * 6; c.fillStyle = '#b06a28'; c.beginPath(); c.ellipse(x, y, r, r * 0.8, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = acc; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r * 1.1, R_() * 3, R_() * 3 + 4); c.stroke(); } }
  else if (pat === 'tiedye') { for (let r = 400; r > 0; r -= 18) { c.fillStyle = `hsl(${(r * 2.2) % 360},80%,65%)`; c.beginPath(); c.arc(FX, H * 0.55, r, 0, Math.PI * 2); c.fill(); } }
  else if (pat === 'stripes') { c.fillStyle = acc; for (let y = 0; y < H; y += 26) c.fillRect(0, y, W, 6); }
  else if (pat === 'sailor') { c.fillStyle = acc; c.fillRect(0, 0, W, 40); c.fillStyle = '#ffffff'; c.fillRect(0, 30, W, 4); c.fillStyle = '#c62a3a'; c.beginPath(); c.moveTo(FX - 18, 40); c.lineTo(FX + 18, 40); c.lineTo(FX, 80); c.fill(); }
  else if (pat === 'maid') { c.fillStyle = acc; c.fillRect(FX - 60, 60, 120, H); c.fillStyle = '#f0f0f0'; for (let x = FX - 60; x < FX + 60; x += 12) { c.beginPath(); c.arc(x + 6, 60, 6, Math.PI, 0); c.fill(); } }
  else if (pat === 'blazer' || pat === 'chore') { c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 3; c.beginPath(); c.moveTo(FX - 40, 0); c.lineTo(FX, H * 0.5); c.lineTo(FX + 40, 0); c.stroke(); c.fillStyle = pat === 'chore' ? '#c9b26a' : '#d9d9d9'; for (const y of [0.55, 0.72, 0.89]) { c.beginPath(); c.arc(FX + 4, H * (1 - y) + 40, 4, 0, Math.PI * 2); c.fill(); }
    if (pat === 'chore') { c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 2; for (const dx of [-55, 30]) c.strokeRect(FX + dx, H * 0.55, 30, 34); } }
  else if (pat === 'puffer') { c.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 18; y < H; y += 36) c.fillRect(0, y, W, 3); c.fillStyle = 'rgba(255,255,255,.18)'; for (let y = 4; y < H; y += 36) c.fillRect(0, y, W, 8); c.fillStyle = '#ddd'; c.fillRect(FX - 1.5, 0, 3, H); }
  else if (pat === 'fur' || pat === 'knit' || pat === 'fleece') { for (let i = 0; i < 2500; i++) { c.fillStyle = R_() < 0.5 ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)'; c.fillRect(R_() * W, R_() * H, 3, pat === 'knit' ? 6 : 3); } if (pat === 'fleece') { c.fillStyle = acc; c.fillRect(0, H * 0.55, W, 30); } }
  else if (pat === 'rothko') { c.fillStyle = acc; c.fillRect(0, H * 0.5, W, H * 0.5); c.fillStyle = '#f2c84b'; c.fillRect(0, H * 0.42, W, 12); }
  else if (pat === 'split') { c.fillStyle = acc; c.fillRect(FX, 0, W - FX, H); c.fillRect(0, 0, FX - 128, H); }
  else if (pat === 'bowling') { c.fillStyle = acc; c.fillRect(FX - 70, 0, 40, H); c.fillRect(FX + 30, 0, 40, H); }
  else if (pat === 'silk') { const g = c.createLinearGradient(0, 0, W, 0); for (let i = 0; i <= 8; i++) g.addColorStop(i / 8, i % 2 ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  else if (pat === 'graphic') { c.fillStyle = acc; c.textAlign = 'center'; c.font = 'bold 22px system-ui, sans-serif'; const words = (name || '').replace(/ (shirt|tank|hoodie|sweater|jacket)$/i, '').toUpperCase(); c.fillText(words.slice(0, 14), FX, H * 0.45); c.beginPath(); c.arc(FX, H * 0.62, 18, 0, Math.PI * 2); c.lineWidth = 4; c.strokeStyle = acc; c.stroke(); }
  // subtle fabric shading: darker at the sides + hem
  const sh = c.createLinearGradient(0, 0, W, 0); sh.addColorStop(0, 'rgba(0,0,0,.10)'); sh.addColorStop(0.25, 'rgba(0,0,0,.18)'); sh.addColorStop(0.5, 'rgba(0,0,0,.10)'); sh.addColorStop(0.75, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.10)'); c.fillStyle = sh; c.fillRect(0, 0, W, H);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}
const HATC = { fez: '#c8272d', 'cat earmuffs': '#151515', cowboy: '#efe7d6', 'bear hat': '#7a5236', 'strawberry': '#e0364a', 'halo': '#fff3b0', 'cake': '#f6d4e1' };
const hatColor = (h, d) => { h = (h || '').toLowerCase(); for (const [k, v] of Object.entries(HATC)) if (h.includes(k)) return v; return colorFrom(h, d); };
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
  if (g.includes('prescription') || g.includes('wire')) return { s: 'round', frame: '#9aa0a8' };
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
  // Milady eyes: big, wide-set, almost all glossy dark iris; heavy upper lash line with an outer
  // flick, a soft lower lid with a few lashes, two big white catch-lights. Thick worried brows.
  const dark = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = (x) => Math.round(x * k); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
  const eye = (sx) => {
    const [x, y] = uvToPx(sx * 0.083, -0.022), w = 54, h = 50;
    c.save(); c.translate(x, y); c.scale(2.6, 2.6);
    if (E === 'closed') { c.strokeStyle = '#1b1216'; c.lineWidth = 6; c.beginPath(); c.arc(0, -8, 26, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); c.restore(); return; }
    if (E === 'heart eyes') { c.fillStyle = '#ff3d7f'; c.beginPath(); c.moveTo(0, 24); c.bezierCurveTo(-46, -6, -22, -42, 0, -16); c.bezierCurveTo(22, -42, 46, -6, 0, 24); c.fill(); c.restore(); return; }
    // eye white: rounded, flatter on top, outer corner slightly lower
    c.fillStyle = '#fbfbfb'; c.beginPath(); c.moveTo(-w * 0.5, 2); c.bezierCurveTo(-w * 0.5, -h * 0.55, w * 0.5, -h * 0.6, w * 0.52, sx > 0 ? 4 : 4);
    c.bezierCurveTo(w * 0.5, h * 0.55, -w * 0.5, h * 0.55, -w * 0.5, 2); c.fill();
    c.save(); c.clip();
    if (E === 'spiral') { c.strokeStyle = '#1b1216'; c.lineWidth = 3.5; c.beginPath(); for (let a = 0; a < Math.PI * 7; a += 0.2) { const r = a * 2.4; c.lineTo(Math.cos(a) * r * 0.8, Math.sin(a) * r); } c.stroke(); }
    else {
      const ir = E === 'dilated' ? 23 : 21;                      // huge iris
      const g = c.createRadialGradient(0, 8, 2, 0, 4, ir + 2); g.addColorStop(0, dark(iris, 0.55)); g.addColorStop(0.55, '#141018'); g.addColorStop(1, '#0b080c');
      c.fillStyle = g; c.beginPath(); c.ellipse(0, 4, ir, ir * 1.08, 0, 0, Math.PI * 2); c.fill();
      const lg = c.createLinearGradient(0, 4, 0, ir + 6); lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(1, iris); c.globalAlpha = 0.55; c.fillStyle = lg; c.beginPath(); c.ellipse(0, 6, ir * 0.9, ir, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
      c.fillStyle = '#ffffff';
      if (E === 'sparkle') { const star = (a, b2, r) => { c.beginPath(); for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4, rr = i % 2 ? r * 0.38 : r; c.lineTo(a + Math.cos(an) * rr, b2 + Math.sin(an) * rr); } c.fill(); }; star(-7, -6, 12); star(9, 13, 6); }
      else { c.beginPath(); c.ellipse(-7, -5, 8.5, 10, -0.5, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(9, 14, 4, 3, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 0.5; c.beginPath(); c.ellipse(4, -9, 3, 2.4, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; }
    }
    if (E === 'sleepy' || E === 'smug') { c.fillStyle = skinCol; c.fillRect(-w, -h, w * 2, h * (E === 'smug' ? 0.82 : 0.95)); }
    c.restore();
    // heavy upper lash line with the outer flick
    c.strokeStyle = '#140d10'; c.lineCap = 'round'; c.lineJoin = 'round';
    const top = E === 'sleepy' || E === 'smug' ? (E === 'smug' ? -h * 0.1 : 0) : -h * 0.45;
    c.lineWidth = 6.5;  
    c.beginPath(); c.moveTo(-sx * w * 0.5, 2); c.bezierCurveTo(-sx * w * 0.35, top - 2, sx * w * 0.3, top - 4, sx * w * 0.55, 2); c.stroke();
    c.lineWidth = 4.5; c.beginPath(); c.moveTo(sx * w * 0.5, 0); c.quadraticCurveTo(sx * w * 0.66, -4, sx * w * 0.74, -12); c.stroke();   // flick
    c.lineWidth = 3; c.beginPath(); c.moveTo(sx * w * 0.44, -8); c.lineTo(sx * w * 0.6, -18); c.stroke();
    // lower lid + lashes
    c.strokeStyle = 'rgba(60,30,35,.55)'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-sx * w * 0.36, h * 0.42); c.quadraticCurveTo(0, h * 0.62, sx * w * 0.42, h * 0.36); c.stroke();
    c.strokeStyle = '#2a1a1e'; c.lineWidth = 1.8; for (const k of [0.15, 0.3, 0.42]) { const lx = sx * w * k, ly = h * (0.56 - k * 0.3); c.beginPath(); c.moveTo(lx, ly); c.lineTo(lx + sx * 2.5, ly + 6); c.stroke(); }
    if (E === 'teary' || E === 'crying') { c.fillStyle = 'rgba(160,215,255,0.95)'; c.beginPath(); c.ellipse(sx * 6, h * 0.62, 6, 9, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(sx * 4, h * 0.58, 2, 0, Math.PI * 2); c.fill(); if (E === 'crying') { c.fillStyle = 'rgba(160,215,255,0.8)'; c.fillRect(sx * 6 - 4, h * 0.62, 8, 60); } }
    c.restore();
  };
  eye(1); eye(-1);
  // thick, slightly worried brows (inner ends lifted), in a darkened hair colour
  const hc = (t.h || '').split(' ').slice(1).join(' '), browC = dark(HAIRC[hc] || '#3a2a2a', 0.55);
  c.strokeStyle = browC; c.lineCap = 'round';
  for (const s2 of [1, -1]) { const [x, y] = uvToPx(s2 * 0.082, 0.03); c.lineWidth = 16; c.beginPath(); c.moveTo(x - s2 * 34, y - 10); c.quadraticCurveTo(x - s2 * 4, y - 14, x + s2 * 34, y + 6); c.stroke(); c.lineWidth = 10; c.beginPath(); c.moveTo(x + s2 * 22, y + 1); c.lineTo(x + s2 * 40, y + 12); c.stroke(); }
  // blush, nose, mouth
  c.fillStyle = 'rgba(255,130,150,0.22)'; for (const s of [1, -1]) { const [x, y] = uvToPx(s * 0.118, -0.075); c.beginPath(); c.ellipse(x, y, 34, 15, 0, 0, Math.PI * 2); c.fill(); }
  { const [x, y] = uvToPx(0.006, -0.064); c.strokeStyle = 'rgba(150,90,90,0.5)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x - 2, y - 8); c.quadraticCurveTo(x + 4, y, x - 1, y + 4); c.stroke(); }
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
  const hatS = hatShape(t.hat), hatC = hatColor(t.hat, '#f2f2f2'), hatC2 = t.hat && t.hat.includes('pink') ? '#f59ac2' : colorFrom(t.hat.replace(/^\S+\s?/, ''), hatColor(t.hat, '#ff5fa2'));
  const gl = glassShape(t.g);
  const spec = shirtSpec(t.s), shirtMap = shirtTex(t.s), shirtC = '#ffffff', collarC = spec[1] === '#ffffff' && spec[3] === 'polo' ? '#ffffff' : spec[3] === 'jacket' ? spec[0] : spec[1], bottomC = (t.s || '').match(/lolita|maid|sailor|kogal|ribbon/) ? '#2a2633' : '#3b3f52';
  const face = paintFace(t, skin);
  const pants = !/lolita|maid|sailor|kogal|dress|skirt|ribbon/.test(t.s || '') && ((+id || 1) % 3 === 0 || /hoodie|jacket|tracksuit|cargo|overall|work/.test(t.s || ''));
  model.traverse((o) => {
    const n = o.name || '';
    if (/^hair_/.test(n)) o.visible = n === `hair_${hairStyle}`;
    if (/^hat_/.test(n)) o.visible = !!hatS && n === `hat_${hatS}`;
    if (/^glasses_/.test(n)) o.visible = !!gl && n === `glasses_${gl.s}`;
    if (n === 'earrings') o.visible = !!t.er;
    if (n === 'necklace') o.visible = !!t.n;
    if (/^collar_/.test(n)) o.visible = n === 'collar_' + spec[3];
    if (n === 'bottom_skirt' || n === 'bottom_pants') o.visible = (n === 'bottom_pants') === pants;
    if (!o.isMesh) return;
    o.castShadow = false; o.receiveShadow = false; o.frustumCulled = false;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const cl = mats.map((m) => {
      const k = m.clone(), nm = m.name;
      if (nm === 'skin') k.color.set(skin);
      else if (nm === 'hair') k.color.set(hairCol);
      else if (nm === 'shirt') { k.color.set(shirtC); k.map = shirtMap; }
      else if (nm === 'shirt2') k.color.set(collarC);
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
