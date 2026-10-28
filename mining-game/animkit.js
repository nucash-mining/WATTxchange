/* ================= ANIMKIT: smoother avatar animation =================
   Shared by chibi.js (3D Miladys) and skins.js (realistic bodies).
   - poseBrain(): walk/idle hysteresis + a minimum hold, so networked avatars whose
     speed estimate jitters around one threshold stop flickering walk↔idle.
   - blender(): our own weight blending instead of crossFadeTo(). crossFadeTo snaps a
     half-faded action back to weight 1 (fadeOut starts at 1, fadeIn at 0), which pops
     on quick re-switches; here every action eases toward its target at one shared
     rate, so the weights always sum to 1 and a re-switch continues from where it was.
   - beat: a beat clock derived from MGDJ.beat() pulses (period + phase), so dance clips
     can be time-scaled to land on the music and procedural layers can hit the beat.
   - dance layers: per-dance procedural bone motion in MODEL space (hips sway, shoulder
     shimmy, head nods, arm pumps) layered on the clips — and three new dances
     (sway, bop, twist) built from a base clip plus a layer. */
import * as THREE from 'three';

export const DANCES = ['groove', 'shake', 'cheer', 'cheer2', 'cheer3', 'clap', 'wave', 'strut', 'sway', 'bop', 'twist'];
// new dances ride on an existing clip; the layer makes them read as their own move
export const BASE_CLIP = { sway: 'idle', bop: 'groove', twist: 'shake' };

// ── pose choice with hysteresis ───────────────────────────────────────────────
export function poseBrain(walkOn = 0.9, walkOff = 0.35, hold = 0.25) {
  let walking = false, pose = 'idle', since = 1;
  return (dt, { speed = 0, sit = false, emote = null, emotes = DANCES }) => {
    since += dt;
    walking = walking ? speed > walkOff : speed > walkOn;
    const want = sit ? 'sit' : walking ? 'walk' : (emote && emotes.includes(emote) ? emote : 'idle');
    if (want !== pose && (since >= hold || want === 'sit' || pose === 'sit')) { pose = want; since = 0; }
    return pose;
  };
}
export function fadeFor(from, to) {
  if (!from) return 0;
  if (from === 'sit' || to === 'sit') return 0.45;
  if ((from === 'walk' && to === 'idle') || (from === 'idle' && to === 'walk')) return 0.28;
  if (from === 'walk' || to === 'walk') return 0.3;
  return 0.42;                                         // emote ↔ emote / idle: slower, eased
}

// ── weight blender ────────────────────────────────────────────────────────────
export function blender(mixer) {
  const W = new Map();                                 // action → weight
  let cur = null, rate = 10;
  return {
    get current() { return cur; },
    to(action, fade, { restart = false, phase = 0 } = {}) {
      if (!action || action === cur) return;
      const w = W.get(action) || 0;
      if (w < 0.02 || restart) { action.reset(); if (phase) action.time = phase * action.getClip().duration; }
      action.enabled = true; action.play();
      W.set(action, w);
      cur = action;
      rate = fade > 0 ? 3.2 / fade : 1e3;              // ≈96 % there after `fade` seconds
    },
    update(dt) {
      const k = 1 - Math.exp(-rate * dt);
      for (const [a, w] of W) {
        const t = a === cur ? 1 : 0, nw = w + (t - w) * k;
        if (t === 0 && nw < 0.002) { a.stop(); W.delete(a); continue; }
        W.set(a, nw); a.setEffectiveWeight(nw);
      }
      mixer.update(dt);
    },
  };
}

// ── beat clock (shared) ───────────────────────────────────────────────────────
export const beat = (() => {
  let lastNow = -1, prev = 0, lastOn = 0, period = 60 / 122, live = false, quietT = 9, acc = 0;
  return {
    tick(now) {                                        // now = performance.now(); idempotent per frame
      if (now === lastNow) return; const dt = lastNow < 0 ? 0 : Math.min(0.1, (now - lastNow) / 1000); lastNow = now;
      let v = 0; try { v = window.MGDJ ? +window.MGDJ.bounce() || 0 : 0; } catch (e) { v = 0; }
      acc += dt / period;
      if (v > 0.8 && v > prev + 0.15) {                 // onset: the pulse jumps back to ~1
        const iv = (now - lastOn) / 1000;
        if (iv > 0.28 && iv < 1.1) period += (iv - period) * 0.25;
        lastOn = now;
        const f = acc % 1; acc += (f > 0.5 ? 1 - f : -f) * 0.5;   // soft phase-lock onto the onset
      }
      quietT = v > 0.02 ? 0 : quietT + dt; live = quietT < 1.5;
      prev = v;
    },
    get live() { return live; },
    get period() { return period; },
    /** continuous beat count (integer part = beats, fraction = phase in the beat) */
    get count() { return acc; },
  };
})();
/** timeScale that makes a looping clip last a whole number of beats */
export function beatScale(clipDur) {
  if (!beat.live || !clipDur) return 1;
  const n = Math.max(1, Math.round(clipDur / beat.period));
  return THREE.MathUtils.clamp(clipDur / (n * beat.period), 0.7, 1.4);
}

// ── easing ────────────────────────────────────────────────────────────────────
export const ease = {
  // fast (8 % of a beat) smooth attack, soft release — continuous, so a hit never pops a bone
  pulse: (p) => (p < 0.08 ? (p / 0.08) * (p / 0.08) * (3 - 2 * (p / 0.08)) : Math.pow(1 - (p - 0.08) / 0.92, 2.2)),
  inOut: (p) => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2,
  bounce: (p) => Math.sin(Math.PI * Math.min(1, p * 1.6)) * (p < 0.625 ? 1 : 0),
};
const S = Math.sin, TAU = Math.PI * 2;

/** Procedural layer for one dance: returns { bone: [x, y, z] } small rotations in
    MODEL space (x = nod forward, y = turn left, z = roll toward +x), plus lift. */
export function danceLayer(name, b, t) {
  // b = continuous beat count (b % 1 = beat phase), t = seconds
  const ph = ((b % 1) + 1) % 1, half = S(Math.PI * b), hit = ease.pulse(ph), sw = S(TAU * b / 2);
  const o = { lift: 0 };
  switch (name) {
    case 'groove': o.hips = [0, 0, sw * 0.10]; o.spine = [hit * 0.05, 0, -sw * 0.06]; o.head = [hit * 0.14, 0, sw * 0.05]; o.lift = hit * 0.05; break;
    case 'shake': o.spine = [0, S(TAU * b * 2) * 0.14, 0]; o.head = [hit * 0.1, -S(TAU * b * 2) * 0.08, 0]; o.lift = hit * 0.04; break;
    case 'sway': o.hips = [0, half * 0.08, half * 0.16]; o.spine = [0.03, 0, -half * 0.09]; o.head = [0.05, -half * 0.06, -half * 0.1];
      o.armL = [S(Math.PI * b + 0.6) * 0.25, 0, 0.35 + half * 0.25]; o.armR = [-S(Math.PI * b + 0.6) * 0.25, 0, -0.35 + half * 0.25]; o.lift = Math.abs(half) * 0.03; break;
    case 'bop': o.spine = [hit * 0.16, 0, 0]; o.head = [hit * 0.3 - 0.05, S(TAU * b / 4) * 0.12, 0]; o.armL = [-hit * 0.5, 0, 0]; o.armR = [-ease.pulse((ph + 0.5) % 1) * 0.5, 0, 0]; o.lift = hit * 0.08; break;
    case 'twist': { const tw = S(TAU * b); o.hips = [0, tw * 0.32, 0]; o.spine = [0, -tw * 0.42, 0]; o.head = [0.04, tw * 0.22, 0];
      o.armL = [0, 0, 0.55]; o.armR = [0, 0, -0.55]; o.foreL = [0, -tw * 0.3, 0]; o.foreR = [0, -tw * 0.3, 0]; o.lift = (1 - Math.abs(tw)) * 0.05; break; }
    case 'cheer': case 'cheer2': case 'cheer3': o.head = [hit * 0.1, 0, 0]; o.spine = [-hit * 0.04, 0, 0]; break;
    case 'clap': case 'wave': o.head = [hit * 0.08, 0, sw * 0.05]; o.hips = [0, 0, sw * 0.05]; break;
    case 'strut': o.spine = [0, sw * 0.08, 0]; o.head = [hit * 0.06, -sw * 0.08, 0]; break;
    default: break;
  }
  // legs counter-roll the hips so the feet stay planted under a hip sway
  if (o.hips) { o.legL = [0, -o.hips[1], -o.hips[2]]; o.legR = [0, -o.hips[1], -o.hips[2]]; }
  return o;
}
/** Always-on "alive" layer: breathing, a slow weight shift, small idle head motion. */
export function lifeLayer(t, seed, idle) {
  const n = (f, p) => S(t * f + seed * 7.3 + p) * 0.6 + S(t * f * 2.3 + seed * 3.1 + p * 2) * 0.4;   // cheap smooth noise
  const o = { spine: [S(t * 1.6 + seed) * 0.022, 0, 0], head: [n(0.31, 1) * 0.06, n(0.23, 2) * 0.16, n(0.19, 3) * 0.04] };
  if (idle) { o.hips = [0, 0, n(0.12, 4) * 0.035]; o.legL = [0, 0, -o.hips[2]]; o.legR = [0, 0, -o.hips[2]];
    o.armL = [n(0.27, 5) * 0.04, 0, 0.12]; o.armR = [n(0.27, 6) * 0.04, 0, -0.12]; o.foreL = [-0.22, 0, 0]; o.foreR = [-0.22, 0, 0]; }
  return o;
}

// ── apply rotations given in MODEL space onto bones ──────────────────────────
const _p = new THREE.Quaternion(), _pi = new THREE.Quaternion(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
export function rotModel(bone, model, x, y, z) {
  if (!bone || (!x && !y && !z)) return;
  _p.identity(); const chain = []; for (let o = bone.parent; o && o !== model; o = o.parent) chain.push(o);
  for (let i = chain.length - 1; i >= 0; i--) _p.multiply(chain[i].quaternion);
  _q.setFromEuler(_e.set(x, y, z, 'YXZ'));
  _pi.copy(_p).invert().multiply(_q).multiply(_p);     // P⁻¹ · Q · P
  bone.quaternion.premultiply(_pi);
}
export const BONE_ORDER = ['hips', 'spine', 'head', 'armL', 'foreL', 'armR', 'foreR', 'legL', 'shinL', 'legR', 'shinR'];
/** Sum weighted layers and apply them parent-first. layers = [[layerObj, weight], …] */
export function applyLayers(bones, model, layers) {
  for (const k of BONE_ORDER) {
    let x = 0, y = 0, z = 0;
    for (const [L, w] of layers) { const r = L[k]; if (r) { x += r[0] * w; y += r[1] * w; z += r[2] * w; } }
    rotModel(bones[k], model, x, y, z);
  }
}
