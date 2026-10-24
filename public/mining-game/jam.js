/* ================= BEAT STATION: MPC + KEYS, jam together =================
   A station beside the Music Desk with an MPC-style 16-pad drum machine and a keyboard,
   all sounds synthesized in the browser (no samples to license or download):
     • 6 drum kits — 808, 909, Boom Bap, Trap, House, Lo-Fi
     • 7 instruments — Grand, E.Piano, Synth Bass, 808 Bass, Saw Lead, Pad, Organ
     • 16-step loop recorder (REC / PLAY / CLEAR), follows the DJ's BPM when a set plays
   Play with the on-screen pads/keys, your computer keyboard, or any MIDI controller
   (Web MIDI: channel 10 or notes 36–51 → pads, everything else → keys).
   JAM TOGETHER: every hit and note is sent to everyone in the game and played in their
   browser, so any number of people can jam at once — each player's sound is rebuilt
   locally from tiny note messages (no audio streaming, no extra latency stacking). */
import * as THREE from 'three';

const MG = () => window.MG;
const net = () => window.MGNET;
const LX = 0, LZ = -120, LW = 30;
const ST = { x: LX + LW / 2 - 2.8, z: LZ + 10.4 };              // in front of the Music Desk
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const liveMuted = () => { try { return localStorage.getItem('mgLiveMute') === '1'; } catch (e) { return false; } };

// ─────────────────────────────────────────────────────────────── audio ──
let ctx = null, out = null, mine = null, room = null, noiseBuf = null, verb = null;
function audio() {
  if (ctx) return ctx;
  ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
  out = ctx.createDynamicsCompressor(); out.threshold.value = -10; out.ratio.value = 4; out.connect(ctx.destination);
  mine = ctx.createGain(); mine.gain.value = 0.9; mine.connect(out);            // what I play
  room = ctx.createGain(); room.gain.value = 0.8; room.connect(out);            // what others play
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  // small room reverb for pads/keys
  verb = ctx.createConvolver(); const ir = ctx.createBuffer(2, ctx.sampleRate * 1.6, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const x = ir.getChannelData(c); for (let i = 0; i < x.length; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / x.length, 3); }
  verb.buffer = ir; const vg = ctx.createGain(); vg.gain.value = 0.18; verb.connect(vg); vg.connect(out);
  return ctx;
}
['pointerdown', 'keydown', 'touchend'].forEach((ev) => window.addEventListener(ev, () => { if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {}); }, { capture: true, passive: true }));
const env = (g, t, a, peak, d, sus = 0) => { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sus || 0.0001), t + a + d); };
function noise(t, dur, dest, { hp = 0, lp = 0, bp = 0, q = 1, gain = 0.5, a = 0.001 } = {}) {
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; let n = s;
  const add = (type, f) => { const f2 = ctx.createBiquadFilter(); f2.type = type; f2.frequency.value = f; f2.Q.value = q; n.connect(f2); n = f2; };
  if (hp) add('highpass', hp); if (lp) add('lowpass', lp); if (bp) add('bandpass', bp);
  const g = ctx.createGain(); env(g, t, a, gain, dur); n.connect(g); g.connect(dest);
  s.start(t, Math.random()); s.stop(t + dur + 0.05);
}
function tone(t, dest, { f0, f1 = f0, dur = 0.3, type = 'sine', gain = 0.6, glide = 0.05, a = 0.001, drive = 0 }) {
  const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + glide);
  const g = ctx.createGain(); env(g, t, a, gain, dur); let n = o;
  if (drive) { const ws = ctx.createWaveShaper(); const k = drive, c = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; c[i] = ((1 + k) * x) / (1 + k * Math.abs(x)); } ws.curve = c; n.connect(ws); n = ws; }
  n.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.1);
}
function metal(t, dur, dest, gain, hp = 7000) {           // 808-style hats: six square partials → highpass
  const g = ctx.createGain(); env(g, t, 0.001, gain, dur);
  const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; f.connect(g); g.connect(dest);
  [205.3, 304.4, 369.6, 522.7, 540, 800].forEach((fr) => { const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = fr * 1.7; o.connect(f); o.start(t); o.stop(t + dur + 0.05); });
}

// ─────────────────────────────────────────────────────────────── kits ──
const PADS = ['Kick', 'Kick 2', 'Snare', 'Clap', 'Hat', 'Open Hat', 'Tom Lo', 'Tom Hi', 'Rim', 'Cowbell', 'Crash', 'Shaker', 'Conga', 'Sub', 'Snap', 'Horn'];
const KITS = {
  '808': { kick: [150, 45, 0.9, 0], k2: [120, 40, 1.6, 0], sn: [190, 0.18, 0.5, 1800], clap: 1, hat: [0.05, 0.25], oh: 0.45, tom: [110, 170], sub: 0.9, lofi: 0, swing: 0 },
  '909': { kick: [190, 50, 0.45, 2], k2: [220, 55, 0.35, 4], sn: [220, 0.22, 0.75, 4000], clap: 1.2, hat: [0.04, 0.3], oh: 0.35, tom: [140, 210], sub: 0.5, lofi: 0, swing: 0 },
  'Boom Bap': { kick: [140, 48, 0.38, 6], k2: [110, 45, 0.5, 3], sn: [200, 0.24, 0.8, 2500], clap: 0.8, hat: [0.035, 0.2], oh: 0.3, tom: [100, 160], sub: 0.6, lofi: 1, swing: 0.12 },
  'Trap': { kick: [160, 38, 1.4, 1], k2: [170, 40, 2.2, 0], sn: [240, 0.16, 0.65, 3500], clap: 1.4, hat: [0.03, 0.32], oh: 0.5, tom: [120, 190], sub: 1.6, lofi: 0, swing: 0 },
  'House': { kick: [170, 52, 0.5, 2], k2: [150, 50, 0.6, 1], sn: [210, 0.2, 0.6, 3000], clap: 1.3, hat: [0.045, 0.28], oh: 0.42, tom: [130, 200], sub: 0.7, lofi: 0, swing: 0.06 },
  'Lo-Fi': { kick: [120, 46, 0.42, 4], k2: [100, 42, 0.5, 2], sn: [180, 0.2, 0.6, 1500], clap: 0.7, hat: [0.03, 0.14], oh: 0.25, tom: [90, 140], sub: 0.6, lofi: 2, swing: 0.16 },
};
const KIT_NAMES = Object.keys(KITS);
function hitPad(i, vel, kitName, dest, when = 0) {
  audio(); const K = KITS[kitName] || KITS['808'], t = (when || ctx.currentTime) + 0.005, v = clamp(vel, 0.05, 1);
  let d = dest;
  if (K.lofi) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = K.lofi > 1 ? 3200 : 5500; f.connect(dest); d = f; }
  switch (i) {
    case 0: case 1: { const k = i ? K.k2 : K.kick; tone(t, d, { f0: k[0], f1: k[1], dur: k[2], glide: 0.06, gain: 0.95 * v, drive: k[3] }); noise(t, 0.012, d, { hp: 2000, gain: 0.25 * v }); break; }
    case 2: tone(t, d, { f0: K.sn[0], f1: K.sn[0] * 0.75, dur: 0.12, gain: 0.45 * v, type: 'triangle' }); noise(t, K.sn[1], d, { hp: K.sn[3] * 0.5, lp: 9000, gain: K.sn[2] * v }); break;
    case 3: for (let k = 0; k < 3; k++) noise(t + k * 0.011, 0.02, d, { bp: 1300, q: 1.2, gain: 0.5 * v * K.clap }); noise(t + 0.033, 0.22, d, { bp: 1200, q: 1, gain: 0.45 * v * K.clap }); break;
    case 4: metal(t, K.hat[0], d, K.hat[1] * v); break;
    case 5: metal(t, K.oh, d, K.hat[1] * 0.9 * v, 6500); break;
    case 6: tone(t, d, { f0: K.tom[0] * 1.6, f1: K.tom[0], dur: 0.45, glide: 0.08, gain: 0.7 * v }); break;
    case 7: tone(t, d, { f0: K.tom[1] * 1.6, f1: K.tom[1], dur: 0.35, glide: 0.08, gain: 0.65 * v }); break;
    case 8: tone(t, d, { f0: 1700, dur: 0.03, type: 'square', gain: 0.25 * v }); noise(t, 0.03, d, { bp: 3000, gain: 0.3 * v }); break;
    case 9: { const g = ctx.createGain(); env(g, t, 0.001, 0.35 * v, 0.35); const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = 1.5; f.connect(g); g.connect(d); [540, 800].forEach((fr) => { const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = fr; o.connect(f); o.start(t); o.stop(t + 0.4); }); break; }
    case 10: metal(t, 1.4, d, 0.22 * v, 5000); noise(t, 1.6, d, { hp: 6000, gain: 0.22 * v }); break;
    case 11: noise(t, 0.07, d, { hp: 5000, gain: 0.28 * v, a: 0.012 }); break;
    case 12: tone(t, d, { f0: 330, f1: 290, dur: 0.22, gain: 0.5 * v, glide: 0.02 }); break;
    case 13: tone(t, d, { f0: 55 * 1.5, f1: 55, dur: K.sub * 1.4, glide: 0.09, gain: 0.85 * v, drive: 1.5 }); break;
    case 14: noise(t, 0.05, d, { bp: 2200, q: 2, gain: 0.6 * v }); tone(t, d, { f0: 2400, dur: 0.012, gain: 0.2 * v }); break;
    case 15: [0, 7, 3].forEach((dt, k) => { const f = 440 * Math.pow(2, (dt - 5) / 12); tone(t + k * 0.004, d, { f0: f * 0.94, f1: f, dur: 0.75, glide: 0.12, gain: 0.16 * v, type: 'sawtooth', a: 0.02 }); }); break;
    default: break;
  }
}

const voices = new Map();   // key `${who}:${note}` → {stop}
const mtof = (n) => 440 * Math.pow(2, (n - 69) / 12);
// ─────────────────────────────────────────────────── sound packs (keys) ──
// Real sampled instruments from the free General MIDI soundfont libraries (gleitz/midi-js-
// soundfonts: FluidR3 GM — CC BY 3.0, MusyngKite, FatBoy), loaded on demand, plus the built-in
// synths. Every pack is tweakable (envelope, filter, drive, reverb, delay, transpose, layer)
// and can be saved as your own named pack. A pack is a tiny settings object that rides along
// with each note, so everyone hears your exact sound (samples load by name on their side).
const SYNTHS = ['Grand', 'E.Piano', 'Synth Bass', '808 Bass', 'Saw Lead', 'Pad', 'Organ'];
const INSTR = SYNTHS;
const LIBS = { Fluid: 'FluidR3_GM', Musyng: 'MusyngKite', FatBoy: 'FatBoy' };
const CATS = {
  'Pianos': ['acoustic_grand_piano', 'bright_acoustic_piano', 'electric_grand_piano', 'honkytonk_piano', 'harpsichord'],
  'Keys & Organs': ['electric_piano_1', 'electric_piano_2', 'clavinet', 'vibraphone', 'marimba', 'music_box', 'celesta', 'drawbar_organ', 'percussive_organ', 'rock_organ', 'church_organ', 'accordion'],
  'Guitars & Bass': ['acoustic_guitar_nylon', 'acoustic_guitar_steel', 'electric_guitar_clean', 'electric_guitar_muted', 'overdriven_guitar', 'distortion_guitar', 'acoustic_bass', 'electric_bass_finger', 'fretless_bass', 'slap_bass_1', 'synth_bass_1', 'synth_bass_2'],
  'Strings & Voices': ['string_ensemble_1', 'string_ensemble_2', 'violin', 'cello', 'pizzicato_strings', 'orchestral_harp', 'choir_aahs', 'voice_oohs', 'synth_choir'],
  'Brass & Winds': ['trumpet', 'muted_trumpet', 'trombone', 'brass_section', 'synth_brass_1', 'alto_sax', 'tenor_sax', 'flute', 'pan_flute', 'ocarina', 'harmonica'],
  'Synth Leads': ['lead_1_square', 'lead_2_sawtooth', 'lead_3_calliope', 'lead_5_charang', 'lead_6_voice', 'lead_8_bass__lead'],
  'Synth Pads & FX': ['pad_1_new_age', 'pad_2_warm', 'pad_3_polysynth', 'pad_4_choir', 'pad_7_halo', 'pad_8_sweep', 'fx_3_crystal', 'fx_4_atmosphere', 'fx_7_echoes', 'synthstrings_1'],
  'World & Perc': ['steel_drums', 'kalimba', 'sitar', 'koto', 'shamisen', 'tubular_bells', 'xylophone', 'orchestra_hit', 'timpani'],
  'Built-in Synths': SYNTHS,
};
const pretty = (s) => String(s).replace(/__/g, ' ').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const DEF = { src: 'sf', lib: 'Fluid', name: 'acoustic_grand_piano', a: 0.002, r: 0.35, cut: 18000, q: 0.7, dr: 0, rv: 0.25, dl: 0, tr: 0, vol: 0.85, ly: '', lm: 0.5 };
const FACTORY = {
  'Concert Grand': { ...DEF, lib: 'Musyng' },
  'Lo-fi Rhodes': { ...DEF, name: 'electric_piano_1', cut: 3200, dr: 0.15, rv: 0.4, dl: 0.18 },
  'Neo-soul Keys': { ...DEF, name: 'electric_piano_2', ly: 'pad_2_warm', lm: 0.3, rv: 0.35 },
  'Trap Bell': { ...DEF, name: 'music_box', ly: 'celesta', lm: 0.6, rv: 0.45, dl: 0.25 },
  'Gospel Organ': { ...DEF, name: 'rock_organ', dr: 0.2, rv: 0.3 },
  'Slap Bass': { ...DEF, name: 'slap_bass_1', tr: -12, rv: 0.08 },
  'Dark Strings': { ...DEF, name: 'string_ensemble_1', a: 0.25, r: 1.2, cut: 5000, rv: 0.55 },
  'Supersaw Lead': { ...DEF, name: 'lead_2_sawtooth', ly: 'synthstrings_1', lm: 0.35, dl: 0.3, rv: 0.3 },
  'Ambient Halo': { ...DEF, name: 'pad_7_halo', a: 0.4, r: 2, rv: 0.7, dl: 0.35 },
  'Sax Solo': { ...DEF, name: 'alto_sax', lib: 'Musyng', rv: 0.35 },
  'Steel Pan Party': { ...DEF, name: 'steel_drums', dl: 0.2, rv: 0.3 },
  '808 Glide (synth)': { ...DEF, src: 'syn', name: '808 Bass', rv: 0.05 },
};
const sfText = new Map(), sfBuf = new Map();     // `${lib}/${name}` → {note: b64}, `${key}:${note}` → AudioBuffer
const NN = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const nname = (n) => NN[n % 12] + (Math.floor(n / 12) - 1);
function loadSF(lib, name) {
  const k = `${lib}/${name}`;
  if (!sfText.has(k)) sfText.set(k, fetch(`https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/${LIBS[lib] || LIBS.Fluid}/${name}-mp3.js`)
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.status))))
    .then((t) => { const m = {}; t.replace(/"([A-G]b?-?\d)":\s*"data:audio\/mp3;base64,([^"]+)"/g, (_, nn, b) => { m[nn] = b; }); return m; })
    .catch((e) => { sfText.delete(k); throw e; }));
  return sfText.get(k);
}
async function sample(lib, name, n) {
  const k = `${lib}/${name}`, bk = `${k}:${n}`;
  if (sfBuf.has(bk)) return sfBuf.get(bk);
  const p = (async () => {
    const m = await loadSF(lib, name);
    let nn = n; while (!m[nname(nn)] && nn > 21) nn--;       // nearest lower sample if one is missing
    const b64 = m[nname(nn)]; if (!b64) return null;
    const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const buf = await ctx.decodeAudioData(u.buffer); return { buf, rate: Math.pow(2, (n - nn) / 12) };
  })();
  sfBuf.set(bk, p); p.catch(() => sfBuf.delete(bk)); return p;
}
function cleanPack(p) {                        // validate a pack received from the network / storage
  const o = { ...DEF }, q = p && typeof p === 'object' ? p : {};
  o.src = q.src === 'syn' ? 'syn' : q.src === 'own' ? 'own' : 'sf';
  o.lib = LIBS[q.lib] ? q.lib : 'Fluid';
  const all = Object.values(CATS).flat();
  o.name = all.includes(q.name) ? q.name : (o.src === 'syn' ? 'Grand' : DEF.name);
  if (o.src === 'syn' && !SYNTHS.includes(o.name)) o.name = 'Grand';
  o.ly = all.includes(q.ly) && !SYNTHS.includes(q.ly) ? q.ly : '';
  for (const [k, lo, hi] of [['a', 0.001, 2], ['r', 0.02, 4], ['cut', 200, 18000], ['q', 0.1, 18], ['dr', 0, 1], ['rv', 0, 1], ['dl', 0, 0.8], ['tr', -24, 24], ['vol', 0, 1.2], ['lm', 0, 1]]) o[k] = Number.isFinite(+q[k]) ? clamp(+q[k], lo, hi) : DEF[k];
  return o;
}
let delays = new Map();                         // dest → shared tempo delay
function delayFor(dest) {
  if (delays.has(dest)) return delays.get(dest);
  const d = ctx.createDelay(2), fb = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3500; fb.gain.value = 0.38;
  d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(dest);
  delays.set(dest, d); return d;
}
const ownSample = { buf: null, name: '' };       // your own uploaded sample (local only)
function noteOn(who, n, vel, packIn, dest) {
  audio(); noteOff(who, n);
  const P = typeof packIn === 'string' ? cleanPack({ src: 'syn', name: packIn }) : packIn;
  const t = ctx.currentTime + 0.004, v = clamp(vel, 0.05, 1), nn = clamp(n + P.tr, 12, 120);
  // shared voice chain: env gain → filter → drive → out (+ reverb / delay sends)
  const g = ctx.createGain(); g.gain.value = 0;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = P.cut; lp.Q.value = P.q;
  let tail = lp; g.connect(lp);
  if (P.dr > 0.01) { const ws = ctx.createWaveShaper(), k = P.dr * 8, c = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; c[i] = Math.tanh((1 + k) * x) / Math.tanh(1 + k); } ws.curve = c; lp.connect(ws); tail = ws; }
  const vg = ctx.createGain(); vg.gain.value = P.vol; tail.connect(vg); vg.connect(dest);
  if (P.rv > 0.01) { const s = ctx.createGain(); s.gain.value = P.rv * 1.4; vg.connect(s); s.connect(verb); }
  if (P.dl > 0.01) { const d = delayFor(dest); d.delayTime.value = clamp(60 / bpmNow() * 0.75, 0.05, 1.5); const s = ctx.createGain(); s.gain.value = P.dl; vg.connect(s); s.connect(d); }
  const srcs = [];
  let stopAll = () => {};
  const peak = 0.9 * v;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + P.a);
  const startSample = (lib, name, mix) => sample(lib, name, nn).then((sm) => {
    if (!sm || !voices.has(`${who}:${n}`) || voices.get(`${who}:${n}`).g !== g) return;
    const s = ctx.createBufferSource(); s.buffer = sm.buf; s.playbackRate.value = sm.rate;
    const mg = ctx.createGain(); mg.gain.value = mix; s.connect(mg); mg.connect(g); s.start(Math.max(t, ctx.currentTime)); srcs.push(s);
  }).catch(() => { if (srcs.length === 0 && mix === 1) synthInto('Grand', nn, v, g, t, srcs); });
  if (P.src === 'syn') synthInto(P.name, nn, v, g, t, srcs);
  else if (P.src === 'own' && who === 'me' && ownSample.buf) { const s = ctx.createBufferSource(); s.buffer = ownSample.buf; s.playbackRate.value = Math.pow(2, (nn - 60) / 12); s.connect(g); s.start(t); srcs.push(s); }
  else {
    const lib = P.lib; const key = `${lib}/${P.name}`;
    if (sfBuf.has(`${key}:${nn}`) || sfText.has(key)) startSample(lib, P.name, P.ly ? 1 - P.lm * 0.5 : 1);
    else { synthInto('Grand', nn, v, g, t, srcs); loadSF(lib, P.name).catch(() => {}); }   // first touch: synth while it downloads
    if (P.ly) startSample(lib, P.ly, P.lm);
  }
  stopAll = () => { const t2 = ctx.currentTime; g.gain.cancelScheduledValues(t2); g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t2); g.gain.exponentialRampToValueAtTime(0.0001, t2 + P.r); srcs.forEach((o) => { try { o.stop(t2 + P.r + 0.05); } catch (e) { /* */ } }); };
  voices.set(`${who}:${n}`, { g, stop: stopAll });
  setTimeout(() => { const vv = voices.get(`${who}:${n}`); if (vv && vv.g === g) noteOff(who, n); }, 12000);
}
/** the built-in synth engines, feeding a voice's gain node */
function synthInto(inst, n, v, g, t, srcs) {
  const f = mtof(n);
  const O = (type, fr, gain = 1, det = 0, to = g) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = fr; o.detune.value = det; const og = ctx.createGain(); og.gain.value = gain; o.connect(og); og.connect(to); o.start(t); srcs.push(o); return o; };
  const sub = ctx.createGain(); sub.connect(g);
  if (inst === 'Grand') { O('triangle', f, 0.6, 0, sub); O('sine', f * 2, 0.25, 0, sub); O('sine', f * 3, 0.08, 4, sub); sub.gain.setValueAtTime(1, t); sub.gain.exponentialRampToValueAtTime(0.05, t + 2.6); }
  else if (inst === 'E.Piano') { const car = ctx.createOscillator(); car.frequency.value = f; const mod = ctx.createOscillator(); mod.frequency.value = f * 14; const mg = ctx.createGain(); mg.gain.setValueAtTime(f * 1.4 * v, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + 0.6); mod.connect(mg); mg.connect(car.frequency); car.connect(sub); car.start(t); mod.start(t); srcs.push(car, mod); O('sine', f, 0.4, 0, sub); sub.gain.setValueAtTime(1, t); sub.gain.exponentialRampToValueAtTime(0.06, t + 2.2); }
  else if (inst === 'Synth Bass') { const l = ctx.createBiquadFilter(); l.type = 'lowpass'; l.Q.value = 8; l.frequency.setValueAtTime(2400 * v + 300, t); l.frequency.exponentialRampToValueAtTime(220, t + 0.35); l.connect(sub); O('sawtooth', f, 0.7, 0, l); O('square', f / 2, 0.5, 0, l); }
  else if (inst === '808 Bass') { const o = O('sine', f * 1.5, 1.1, 0, sub); o.frequency.setValueAtTime(f * 1.5, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.08); sub.gain.setValueAtTime(1, t); sub.gain.exponentialRampToValueAtTime(0.3, t + 1.6); }
  else if (inst === 'Saw Lead') { O('sawtooth', f, 0.4, -9, sub); O('sawtooth', f, 0.4, 9, sub); O('square', f * 2, 0.1, 0, sub); }
  else if (inst === 'Pad') { O('sawtooth', f, 0.25, -12, sub); O('sawtooth', f, 0.25, 12, sub); O('triangle', f / 2, 0.35, 0, sub); }
  else { [[1, 0.45], [2, 0.3], [3, 0.18], [4, 0.12], [0.5, 0.28]].forEach(([m, a]) => O('sine', f * m, a, 0, sub)); }
}
function noteOff(who, n) { const v = voices.get(`${who}:${n}`); if (v) { v.stop(); voices.delete(`${who}:${n}`); } }

// ──────────────────────────────────────────────────────── network ──
// Each event is a few bytes; we send it to every peer through the lounge relay.
const myId = () => { try { return net()?.debug?.().id; } catch (e) { return null; } };
const jammers = new Map();       // id → {name, at}
let sentWin = 0, sentN = 0;
function broadcast(data) {
  const N = net(); if (!N) return;
  const now = performance.now(); if (now - sentWin > 1000) { sentWin = now; sentN = 0; }
  if (++sentN > 60) return;                                  // ~60 events/s cap
  const me = myId();
  for (const p of N.peerLooks?.() || []) if (p.id !== me) { try { N.sendObj({ t: 'voice', to: p.id, kind: 'jam', data }); } catch (e) { /* */ } }
}
const packCache = new Map();
function packOf(str) {
  if (typeof str !== 'string' || str.length > 600) return cleanPack(null);
  if (!packCache.has(str)) { let o = null; try { o = JSON.parse(str); } catch (e) { /* */ } const P = cleanPack(o); if (P.src === 'own') { P.src = 'sf'; P.name = DEF.name; } packCache.set(str, P); if (packCache.size > 200) packCache.delete(packCache.keys().next().value); }
  return packCache.get(str);
}
function onSignal(from, kind, data) {
  if (kind !== 'jam' || !data || liveMuted()) return;
  audio(); if (ctx.state !== 'running') return;              // can't play until this browser has had a tap
  const peer = (net()?.peerLooks?.() || []).find((p) => p.id === from);
  jammers.set(from, { name: peer?.name || 'guest' + from, at: Date.now() });
  if (typeof data.p === 'number' && data.p >= 0 && data.p < 16) { hitPad(data.p, +data.v || 0.8, KITS[data.k] ? data.k : '808', room); flash(data.p); }
  else if (typeof data.n === 'number' && data.n >= 12 && data.n <= 120) {
    if (data.on) noteOn('r' + from, data.n, +data.v || 0.8, packOf(data.s), room); else noteOff('r' + from, data.n);
    keyFlash(data.n, !!data.on);
  }
}

// ──────────────────────────────────────────────────────── local play ──
const st = { kit: '808', pack: { ...FACTORY['Concert Grand'] }, packName: 'Concert Grand', mine: {}, oct: 0, typing: 'pads', rec: false, play: false, steps: Array.from({ length: 16 }, () => new Set()), step: 0, bpm: 92 };
try { Object.assign(st, JSON.parse(localStorage.getItem('mgJam') || '{}'), { rec: false, play: false, steps: Array.from({ length: 16 }, () => new Set()), step: 0 }); } catch (e) { /* */ }
st.pack = cleanPack(st.pack); if (!st.mine || typeof st.mine !== 'object') st.mine = {};
const save = () => { try { localStorage.setItem('mgJam', JSON.stringify({ kit: st.kit, pack: st.pack, packName: st.packName, mine: st.mine, oct: st.oct, typing: st.typing, bpm: st.bpm })); } catch (e) { /* */ } };
let packStr = '';
const wirePack = () => { const P = { ...st.pack }; if (P.src === 'own') { P.src = 'sf'; P.name = DEF.name; } const o = {}; for (const k of Object.keys(P)) if (P[k] !== DEF[k]) o[k] = typeof P[k] === 'number' ? +P[k].toFixed(3) : P[k]; packStr = JSON.stringify(o); };
wirePack();
function setPack(P, name) { st.pack = cleanPack(P); if (P && P.src === 'own') st.pack.src = 'own'; st.packName = name || 'Custom'; wirePack(); save(); preload(); }
function preload() { if (st.pack.src !== 'sf') return; audio(); const b = BASE_NOTE() + st.pack.tr; for (const n of [b, b + 4, b + 7, b + 12]) sample(st.pack.lib, st.pack.name, clamp(n, 21, 108)).catch(() => {}); if (st.pack.ly) loadSF(st.pack.lib, st.pack.ly).catch(() => {}); }
function pad(i, vel = 0.9) {
  audio(); hitPad(i, vel, st.kit, mine); flash(i);
  broadcast({ p: i, v: +vel.toFixed(2), k: st.kit });
  if (st.rec) st.steps[st.play ? st.step : quantStep()].add(i);
  jammers.set('me', { name: 'you', at: Date.now() });
}
function key(n, on, vel = 0.85) {
  audio();
  if (on) noteOn('me', n, vel, st.pack, mine); else noteOff('me', n);
  keyFlash(n, on); broadcast(on ? { n, on: 1, v: +vel.toFixed(2), s: packStr } : { n, on: 0 });
  if (on) jammers.set('me', { name: 'you', at: Date.now() });
}
function djBpm() { try { const l = window.MGDJ?.decks?.().filter((d) => d.playing && d.bpm).sort((a, b) => b.state.vol - a.state.vol)[0]; return l ? l.bpm * (l.rate || 1) : 0; } catch (e) { return 0; } }
const bpmNow = () => djBpm() || st.bpm;
let lastStepAt = 0;
const quantStep = () => Math.round(((performance.now() - lastStepAt) / (60000 / bpmNow() / 4)) + st.step) % 16;
function seqTick() {                       // 16th-note clock
  const ms = 60000 / bpmNow() / 4, sw = (KITS[st.kit]?.swing || 0) * ms;
  setTimeout(seqTick, st.step % 2 ? ms - sw : ms + sw);
  lastStepAt = performance.now();
  st.step = (st.step + 1) % 16;
  if (st.play) for (const i of st.steps[st.step]) { hitPad(i, 0.85, st.kit, mine); flash(i); broadcast({ p: i, v: 0.85, k: st.kit }); }
  if (ov) { ov.querySelectorAll('.jm-step').forEach((el, k) => el.classList.toggle('now', k === st.step && st.play)); }
}
setTimeout(seqTick, 200);

// ──────────────────────────────────────────────────────────── MIDI ──
const midi = { access: null, err: '', inputs: [] };
async function connectMidi() {
  if (!navigator.requestMIDIAccess) { midi.err = 'This browser has no Web MIDI (try Chrome / Edge / Android Chrome).'; render(); return; }
  try {
    midi.access = await navigator.requestMIDIAccess();
    const bind = () => { midi.inputs = [...midi.access.inputs.values()]; midi.inputs.forEach((i) => { i.onmidimessage = onMidi; }); render(); };
    midi.access.onstatechange = bind; bind();
  } catch (e) { midi.err = 'MIDI permission denied.'; render(); }
}
function onMidi(e) {
  const [s, d1, d2] = e.data, cmd = s & 0xf0, ch = s & 0x0f;
  if (window.MGDJ?.midiLearn?.(e.data)) return;           // the DJ panel's MIDI-learn claims mapped controls
  // drum controllers (MPC / MPD / Maschine / Launchpad…) or channel 10 → pads; everything else → keys
  const isPad = ch === 9 || /mpc|mpd|pad|drum|beat|maschine|launch|akai fire/i.test(e.target?.name || '');
  if (cmd === 0x90 && d2 > 0) { if (isPad) pad(((d1 - 36) % 16 + 16) % 16, d2 / 127); else key(d1 + st.oct * 12, true, d2 / 127); }
  else if (cmd === 0x80 || (cmd === 0x90 && d2 === 0)) { if (!isPad) key(d1 + st.oct * 12, false); }
}

// ──────────────────────────────────────────────────────────── UI ──
let ov = null;
const PADKEYS = ['z', 'x', 'c', 'v', 'a', 's', 'd', 'f', 'q', 'w', 'e', 'r', '1', '2', '3', '4'];   // MPC layout: bottom-left = pad 1
const KB = 'awsedftgyhujkolp;';
const CSS = `
#mg-jam{position:fixed;inset:0;z-index:2147483000;background:#07080e;color:#e6ebf5;font:13px system-ui,sans-serif;overflow:auto;-webkit-user-select:none;user-select:none;touch-action:manipulation}
#mg-jam .bar{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid #1d2436;position:sticky;top:0;background:#07080ef5;flex-wrap:wrap;z-index:2}
#mg-jam button,#mg-jam select{background:#161b2b;border:1px solid #2a3350;color:#e6ebf5;border-radius:8px;padding:6px 10px;font-weight:700;cursor:pointer;font-size:12px}
#mg-jam button.on{background:#ff4fd8;border-color:#ff4fd8;color:#fff}
#mg-jam .wrap{display:flex;gap:16px;flex-wrap:wrap;padding:12px;justify-content:center}
#mg-jam .mpc{background:linear-gradient(#3a3d44,#24262b);border-radius:14px;padding:12px;box-shadow:0 10px 30px #0008;width:min(92vw,380px)}
#mg-jam .mpc h4,#mg-jam .keys h4{margin:0 0 8px;font:800 12px system-ui;letter-spacing:.18em;color:#ffd23f}
#mg-jam .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
#mg-jam .pad{aspect-ratio:1;border-radius:10px;background:#15171c;border:2px solid #4b4f59;color:#aab;display:flex;flex-direction:column;justify-content:flex-end;padding:6px;font:700 10px system-ui;position:relative;cursor:pointer}
#mg-jam .pad b{position:absolute;top:5px;right:7px;color:#667;font-size:10px}
#mg-jam .pad.hit{background:#ff4fd8;border-color:#ffd23f;color:#fff;box-shadow:0 0 18px #ff4fd8}
#mg-jam .steps{display:grid;grid-template-columns:repeat(16,1fr);gap:3px;margin-top:10px}
#mg-jam .jm-step{height:12px;border-radius:3px;background:#1d2030}
#mg-jam .jm-step.full{background:#ffd23f88}#mg-jam .jm-step.now{background:#22c55e}
#mg-jam .keys{background:linear-gradient(#2a2c33,#17181c);border-radius:14px;padding:12px;width:min(92vw,620px)}
#mg-jam .kb{position:relative;height:150px;display:flex}
#mg-jam .wk{flex:1;background:#f5f5f2;border:1px solid #888;border-radius:0 0 6px 6px;margin:0 1px;position:relative;color:#888;font:700 10px system-ui;display:flex;align-items:flex-end;justify-content:center;padding-bottom:4px;cursor:pointer}
#mg-jam .bk{position:absolute;top:0;width:5.2%;height:60%;background:#111;border-radius:0 0 4px 4px;z-index:2;cursor:pointer}
#mg-jam .wk.down{background:#ffd23f}#mg-jam .bk.down{background:#ff4fd8}
#mg-jam .who{padding:0 12px 8px;color:#9aa3b8;text-align:center}
#mg-jam .pk{margin-top:12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px 12px;align-items:center}
#mg-jam .pk label{display:flex;flex-direction:column;gap:3px;color:#9aa3b8;font-size:11px}
#mg-jam .pk input[type=range]{width:100%;accent-color:#ff4fd8}
#mg-jam .pkrow{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:10px}
#mg-jam .note{color:#8b94ab;font-size:12px;padding:0 12px 12px;text-align:center}`;
function open() {
  audio(); if (ctx.state === 'suspended') ctx.resume();
  if (ov) return;
  if (!document.getElementById('mg-jam-css')) { const s = document.createElement('style'); s.id = 'mg-jam-css'; s.textContent = CSS; document.head.appendChild(s); }
  ov = document.createElement('div'); ov.id = 'mg-jam'; document.body.appendChild(ov);
  render();
  window.addEventListener('keydown', onKey, true); window.addEventListener('keyup', onKeyUp, true);
}
function close() {
  if (!ov) return; ov.remove(); ov = null;
  window.removeEventListener('keydown', onKey, true); window.removeEventListener('keyup', onKeyUp, true);
  for (const k of [...voices.keys()]) if (k.startsWith('me:')) noteOff('me', +k.slice(3));
}
const BASE_NOTE = () => 60 + st.oct * 12;
function render() {
  if (!ov) return;
  const white = [], black = [];
  for (let n = BASE_NOTE(), w = 0; n < BASE_NOTE() + 24; n++) {
    const isB = [1, 3, 6, 8, 10].includes(n % 12);
    const kbChar = KB[n - BASE_NOTE()] || '';
    if (isB) black.push(`<div class="bk" data-n="${n}" style="left:calc(${(w / 14) * 100}% - 2.6%)"></div>`);
    else { white.push(`<div class="wk" data-n="${n}">${st.typing === 'keys' && kbChar ? kbChar.toUpperCase() : (n % 12 === 0 ? 'C' + (n / 12 - 1) : '')}</div>`); w++; }
  }
  const order = [12, 13, 14, 15, 8, 9, 10, 11, 4, 5, 6, 7, 0, 1, 2, 3];          // pad 1 bottom-left like an MPC
  ov.innerHTML = `<div class="bar"><b style="font-size:15px;letter-spacing:.08em">🥁 BEAT STATION</b>
    <select id="jm-kit">${KIT_NAMES.map((k) => `<option ${k === st.kit ? 'selected' : ''}>${k}</option>`).join('')}</select>
    <button id="jm-type" title="What your computer keyboard plays">⌨ ${st.typing === 'pads' ? 'Pads' : 'Keys'}</button>
    ${midi.access ? `<span style="color:#22c55e">● MIDI: ${esc(midi.inputs.map((i) => i.name).join(', ') || 'no devices yet')}</span>` : `<button id="jm-midi">🔌 Connect MIDI</button>`}
    <span style="flex:1"></span><button id="jm-x">✕ Close</button></div>
    <div class="who" id="jm-who"></div>
    <div class="wrap">
      <div class="mpc"><h4>MPC · ${esc(st.kit)}</h4><div class="grid">${order.map((i) => `<div class="pad" data-p="${i}"><b>${st.typing === 'pads' ? PADKEYS[i].toUpperCase() : i + 1}</b>${PADS[i]}</div>`).join('')}</div>
        <div style="display:flex;gap:6px;margin-top:10px;align-items:center;flex-wrap:wrap"><button id="jm-rec" class="${st.rec ? 'on' : ''}">● REC</button><button id="jm-play" class="${st.play ? 'on' : ''}">▶ LOOP</button><button id="jm-clr">CLEAR</button>
          <span style="color:#9aa3b8">${djBpm() ? `synced to DJ · ${Math.round(djBpm())} BPM` : `<label>BPM <input id="jm-bpm" type="number" min="60" max="180" value="${st.bpm}" style="width:54px;background:#161b2b;color:#fff;border:1px solid #2a3350;border-radius:6px;padding:4px"></label>`}</span></div>
        <div class="steps">${st.steps.map((s, k) => `<div class="jm-step ${s.size ? 'full' : ''}" data-s="${k}"></div>`).join('')}</div></div>
      <div class="keys"><h4>KEYS · ${esc(st.packName)} <button id="jm-dn" style="padding:2px 8px">−</button> oct ${st.oct >= 0 ? '+' : ''}${st.oct} <button id="jm-up" style="padding:2px 8px">+</button></h4><div class="kb">${white.join('')}${black.join('')}</div>${packPanel()}</div>
    </div>
    <div class="note">Everyone in the game hears what you play — and you hear them. Plug in a MIDI keyboard or pad controller (channel 10 / notes 36–51 → pads). Pads: Z X C V · A S D F · Q W E R · 1 2 3 4. Keys: A W S E D F T G Y H U J K.</div>`;
  ov.querySelector('#jm-x').onclick = close;
  ov.querySelector('#jm-kit').onchange = (e) => { st.kit = e.target.value; save(); render(); };
  bindPack();
  ov.querySelector('#jm-type').onclick = () => { st.typing = st.typing === 'pads' ? 'keys' : 'pads'; save(); render(); };
  ov.querySelector('#jm-midi')?.addEventListener('click', connectMidi);
  ov.querySelector('#jm-rec').onclick = () => { st.rec = !st.rec; if (st.rec) st.play = true; render(); };
  ov.querySelector('#jm-play').onclick = () => { st.play = !st.play; if (!st.play) st.rec = false; render(); };
  ov.querySelector('#jm-clr').onclick = () => { st.steps.forEach((s) => s.clear()); render(); };
  ov.querySelector('#jm-bpm')?.addEventListener('change', (e) => { st.bpm = clamp(+e.target.value || 92, 60, 180); save(); });
  ov.querySelector('#jm-up').onclick = () => { st.oct = clamp(st.oct + 1, -3, 3); save(); render(); };
  ov.querySelector('#jm-dn').onclick = () => { st.oct = clamp(st.oct - 1, -3, 3); save(); render(); };
  ov.querySelectorAll('.pad').forEach((el) => el.addEventListener('pointerdown', (e) => { e.preventDefault(); pad(+el.dataset.p, 0.95); }));
  ov.querySelectorAll('.jm-step').forEach((el) => el.addEventListener('click', () => { const s = st.steps[+el.dataset.s]; if (s.size) s.clear(); else s.add(0); el.classList.toggle('full', s.size > 0); }));
  ov.querySelectorAll('.wk,.bk').forEach((el) => {
    const n = +el.dataset.n;
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); el.setPointerCapture?.(e.pointerId); key(n, true); });
    const up = () => key(n, false); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  });
  whoLine();
}
function packPanel() {
  const P = st.pack, cat = Object.keys(CATS).find((c) => CATS[c].includes(P.name)) || 'Pianos';
  const mineNames = Object.keys(st.mine);
  const opt = (v, cur, label) => `<option value="${esc(v)}" ${v === cur ? 'selected' : ''}>${esc(label ?? v)}</option>`;
  const R = (k, label, lo, hi, step, fmt) => `<label>${label} <span id="pkv-${k}" style="color:#e6ebf5">${fmt(P[k])}</span><input type="range" data-pk="${k}" min="${lo}" max="${hi}" step="${step}" value="${P[k]}"></label>`;
  const ms = (x) => (x < 1 ? Math.round(x * 1000) + ' ms' : x.toFixed(2) + ' s'), pct = (x) => Math.round(x * 100) + '%';
  return `<div class="pkrow"><b style="color:#ffd23f;letter-spacing:.12em;font-size:11px">SOUND PACK</b>
      <select id="pk-preset"><optgroup label="Factory">${Object.keys(FACTORY).map((k) => opt('f:' + k, 'f:' + st.packName, k)).join('')}</optgroup>${mineNames.length ? `<optgroup label="My packs">${mineNames.map((k) => opt('m:' + k, 'm:' + st.packName, k)).join('')}</optgroup>` : ''}<option value="" ${FACTORY[st.packName] || st.mine[st.packName] ? '' : 'selected'}>— custom —</option></select>
      <select id="pk-cat">${Object.keys(CATS).map((c) => opt(c, cat)).join('')}${ownSample.buf ? opt('Your sample', P.src === 'own' ? 'Your sample' : cat) : ''}</select>
      <select id="pk-name">${P.src === 'own' ? opt('own', 'own', '📁 ' + ownSample.name) : CATS[cat].map((n) => opt(n, P.name, pretty(n))).join('')}</select>
      ${P.src === 'sf' ? `<select id="pk-lib" title="Sample library">${Object.keys(LIBS).map((l) => opt(l, P.lib, l + ' samples')).join('')}</select>` : ''}
      <span id="pk-load" style="color:#9aa3b8"></span></div>
    <div class="pk">
      ${R('a', 'Attack', 0.001, 1.5, 0.001, ms)}${R('r', 'Release', 0.02, 4, 0.01, ms)}
      ${R('cut', 'Filter', 200, 18000, 10, (x) => (x >= 17990 ? 'open' : Math.round(x) + ' Hz'))}${R('q', 'Resonance', 0.1, 18, 0.1, (x) => (+x).toFixed(1))}
      ${R('dr', 'Drive', 0, 1, 0.01, pct)}${R('rv', 'Reverb', 0, 1, 0.01, pct)}
      ${R('dl', 'Delay (dotted 8th)', 0, 0.8, 0.01, pct)}${R('vol', 'Volume', 0, 1.2, 0.01, pct)}
      ${R('tr', 'Transpose', -24, 24, 1, (x) => (x > 0 ? '+' : '') + x + ' st')}
      <label>Layer <select id="pk-ly"><option value="">none</option>${Object.entries(CATS).filter(([c]) => c !== 'Built-in Synths').map(([c, l]) => `<optgroup label="${c}">${l.map((n) => opt(n, P.ly, pretty(n))).join('')}</optgroup>`).join('')}</select></label>
      ${P.ly ? R('lm', 'Layer mix', 0, 1, 0.01, pct) : ''}
    </div>
    <div class="pkrow"><button id="pk-save">💾 Save as my pack</button>${st.mine[st.packName] ? '<button id="pk-del">🗑 Delete pack</button>' : ''}
      <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer"><span style="background:#161b2b;border:1px solid #2a3350;border-radius:8px;padding:6px 10px;font-weight:700">📁 Use your own sample</span><input id="pk-file" type="file" accept="audio/*" style="display:none"></label>
      <span class="note" style="padding:0;text-align:left">Samples: FluidR3 GM (CC BY 3.0), MusyngKite & FatBoy via midi-js-soundfonts. Your own file plays only for you.</span></div>`;
}
function bindPack() {
  const q = (s) => ov.querySelector(s), P = () => st.pack;
  q('#pk-preset').onchange = (e) => { const v = e.target.value; if (!v) return; const [t, name] = [v[0], v.slice(2)]; setPack(t === 'f' ? FACTORY[name] : st.mine[name], name); render(); };
  q('#pk-cat').onchange = (e) => { const c = e.target.value; if (c === 'Your sample') setPack({ ...P(), src: 'own' }); else { const n = CATS[c][0]; setPack({ ...P(), src: c === 'Built-in Synths' ? 'syn' : 'sf', name: n }); } render(); };
  q('#pk-name').onchange = (e) => { if (e.target.value !== 'own') setPack({ ...P(), name: e.target.value, src: SYNTHS.includes(e.target.value) ? 'syn' : 'sf' }); render(); };
  q('#pk-lib')?.addEventListener('change', (e) => { setPack({ ...P(), lib: e.target.value }); render(); });
  q('#pk-ly').onchange = (e) => { setPack({ ...P(), ly: e.target.value }, st.packName); render(); };
  ov.querySelectorAll('[data-pk]').forEach((el) => el.addEventListener('input', () => {
    const k = el.dataset.pk; const np = { ...P(), [k]: +el.value }; const own = P().src === 'own';
    st.pack = cleanPack(np); if (own) st.pack.src = 'own'; if (FACTORY[st.packName]) st.packName = st.packName + ' (edit)'; wirePack(); save();
    const lab = ov.querySelector('#pkv-' + k); if (lab) lab.textContent = String(+(+el.value).toFixed(3));
  }));
  ov.querySelectorAll('[data-pk]').forEach((el) => el.addEventListener('change', () => render()));
  q('#pk-save').onclick = () => {
    const name = (prompt_('Name your sound pack', st.packName.replace(/ \(edit\)$/, '') + (FACTORY[st.packName] ? ' (mine)' : '')) || '').trim().slice(0, 40);
    if (!name) return; st.mine[name] = { ...st.pack }; st.packName = name; save(); render();
  };
  q('#pk-del')?.addEventListener('click', () => { delete st.mine[st.packName]; setPack(FACTORY['Concert Grand'], 'Concert Grand'); render(); });
  q('#pk-file').onchange = async (e) => {
    const f = e.target.files?.[0]; if (!f) return; audio();
    try { ownSample.buf = await ctx.decodeAudioData(await f.arrayBuffer()); ownSample.name = f.name.slice(0, 30); setPack({ ...P(), src: 'own' }, 'My sample'); }
    catch (err) { ownSample.buf = null; }
    render();
  };
  // loading indicator for sampled packs
  if (P().src === 'sf') {
    const el = q('#pk-load'); el.textContent = sfText.has(`${P().lib}/${P().name}`) ? '' : '⏳ loading samples…';
    loadSF(P().lib, P().name).then(() => { if (el.isConnected) el.textContent = '✓ ready'; }).catch(() => { if (el.isConnected) el.textContent = '⚠ couldn’t load — using synth'; });
    preload();
  }
}
// inline name prompt (no browser dialogs)
function prompt_(label, def) {
  const v = window.__mgJamName; if (typeof v === 'string') { window.__mgJamName = undefined; return v; }
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;inset:0;z-index:2147483002;background:#0009;display:flex;align-items:center;justify-content:center';
  box.innerHTML = `<div style="background:#11141f;border:1px solid #2a3350;border-radius:12px;padding:16px;min-width:280px;color:#e6ebf5;font:13px system-ui"><div style="margin-bottom:8px">${esc(label)}</div><input id="pkn" value="${esc(def)}" maxlength="40" style="width:100%;box-sizing:border-box;background:#161b2b;color:#fff;border:1px solid #2a3350;border-radius:8px;padding:8px"><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px"><button id="pkc">Cancel</button><button id="pko" style="background:#ff4fd8;border-color:#ff4fd8">Save</button></div></div>`;
  document.body.appendChild(box); const inp = box.querySelector('#pkn'); inp.focus(); inp.select();
  const done = (ok) => { const val = inp.value; box.remove(); if (ok && val.trim()) { window.__mgJamName = val; ov?.querySelector('#pk-save')?.click(); } };
  box.querySelector('#pko').onclick = () => done(true); box.querySelector('#pkc').onclick = () => done(false);
  inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') done(true); if (e.key === 'Escape') done(false); });
  return '';
}
function whoLine() {
  const el = ov?.querySelector('#jm-who'); if (!el) return;
  const now = Date.now(), names = [...jammers.values()].filter((j) => now - j.at < 8000).map((j) => j.name);
  el.innerHTML = names.length ? `🎶 jamming now: <b style="color:#ffd23f">${esc(names.join(', '))}</b>` : 'Nobody jamming yet — start a beat and others will hear it.';
}
setInterval(whoLine, 1000);
const held = new Set();
function onKey(e) {
  if (!ov || e.repeat || e.target.closest?.('input,select,textarea')) return;
  const k = e.key.toLowerCase();
  if (k === 'escape') { close(); return; }
  if (st.typing === 'pads') { const i = PADKEYS.indexOf(k); if (i >= 0) { e.preventDefault(); e.stopPropagation(); pad(i, 0.9); } return; }
  const j = KB.indexOf(k); if (j >= 0) { e.preventDefault(); e.stopPropagation(); const n = BASE_NOTE() + j; held.add(n); key(n, true); }
  if (k === 'z') st.oct = clamp(st.oct - 1, -3, 3), render(); if (k === 'x') st.oct = clamp(st.oct + 1, -3, 3), render();
}
function onKeyUp(e) {
  if (!ov || st.typing !== 'keys') return;
  const j = KB.indexOf(e.key.toLowerCase()); if (j >= 0) { const n = BASE_NOTE() + j; if (held.delete(n)) key(n, false); }
}
function flash(i) {
  padLights[i] = 1;
  const el = ov?.querySelector(`.pad[data-p="${i}"]`); if (el) { el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 110); }
}
function keyFlash(n, on) { const el = ov?.querySelector(`[data-n="${n}"]`); if (el) el.classList.toggle('down', on); if (on) keyLight = 1; }

// ──────────────────────────────────────────────────────── 3D station ──
const root = new THREE.Group(); root.visible = false;
const padLights = new Array(16).fill(0); let keyLight = 0, padMeshes = [], keysMesh = null, hit = null;
function build() {
  const g = new THREE.Group(); g.position.set(ST.x, 0, ST.z); g.rotation.y = -Math.PI / 2;      // faces into the room (−x)
  const std = (c, r = 0.5, m = 0.1) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const table = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 1.1), std(0x1b1d24, 0.4, 0.3)); table.position.y = 1.9; g.add(table);
  [[-1.2, -0.45], [1.2, -0.45], [-1.2, 0.45], [1.2, 0.45]].forEach(([x, z]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.9, 8), std(0x111111, 0.3, 0.8)); l.position.set(x, 0.95, z); g.add(l); });
  // MPC
  const mpc = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.1, 0.8), std(0x55585f, 0.45, 0.2)); mpc.position.set(-0.75, 1.99, 0.05); g.add(mpc);
  const pg = new THREE.BoxGeometry(0.15, 0.03, 0.15);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const m = new THREE.MeshBasicMaterial({ color: 0x1a1a22, toneMapped: false }); const p = new THREE.Mesh(pg, m);
    p.position.set(-0.75 - 0.3 + c * 0.19, 2.055, 0.33 - r * 0.19); g.add(p); padMeshes[r * 4 + c] = p;
  }
  const scr = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.12), new THREE.MeshBasicMaterial({ color: 0x35e0ff, toneMapped: false })); scr.position.set(-0.6, 2.05, -0.27); g.add(scr);
  // keyboard
  const kb = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.09, 0.45), std(0x111216, 0.35, 0.4)); kb.position.set(0.6, 1.985, 0.1); g.add(kb);
  const keyM = new THREE.MeshBasicMaterial({ color: 0xf5f5f0 }); keysMesh = keyM;
  for (let k = 0; k < 15; k++) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.03, 0.28), keyM); w.position.set(0.6 - 0.56 + k * 0.08, 2.04, 0.18); g.add(w); }
  for (let k = 0; k < 14; k++) { if ([2, 6, 9, 13].includes(k)) continue; const b = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.04, 0.16), std(0x050505, 0.3)); b.position.set(0.6 - 0.52 + k * 0.08, 2.06, 0.11); g.add(b); }
  // sign
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 96; const c2 = cv.getContext('2d');
  c2.fillStyle = 'rgba(6,8,14,.85)'; c2.beginPath(); c2.roundRect(10, 12, 492, 72, 16); c2.fill(); c2.fillStyle = '#ffd23f'; c2.font = 'bold 34px system-ui'; c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.fillText('🥁 BEAT STATION · MPC + KEYS', 256, 50);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true })); sign.scale.set(3.4, 0.64, 1); sign.position.set(0, 3.5, 0); g.add(sign);
  hit = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.4, 1.4), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 1.2; g.add(hit);
  root.add(g);
}
const COLORS = [0xff4fd8, 0xffd23f, 0x35e0ff, 0x3dff8a];
const ray = new THREE.Raycaster();
function onDown(ev) {
  if (!hit || !root.visible || document.querySelector('#mg-jam,#mg-dj,#mg-studio,#mg-bar,#mg-casino,#mg-arcade,#mg-skins')) return;
  const canvas = MG().controls.domElement, r = canvas.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1), MG().cam);
  if (ray.intersectObject(hit, false).length) { ev.stopImmediatePropagation(); ev.preventDefault(); open(); }
}
const inLoungeNow = () => { const c = MG()?.cam; return c && c.position.z < LZ + 40; };
let prompt = null, lastT = performance.now();
function tick(now) {
  requestAnimationFrame(tick);
  const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
  const vis = !!inLoungeNow(); root.visible = vis;
  // others' jams: full in the lounge, a bit lower elsewhere, silent if muted
  if (room) room.gain.setTargetAtTime(liveMuted() ? 0 : vis ? 0.85 : 0.6, ctx.currentTime, 0.2);
  if (!vis) { if (prompt) prompt.style.display = 'none'; return; }
  for (let i = 0; i < 16; i++) {
    padLights[i] = Math.max(0, padLights[i] - dt * 4);
    const m = padMeshes[i]?.material; if (m) m.color.setHex(padLights[i] > 0.05 ? COLORS[i % 4] : 0x1a1a22).multiplyScalar(0.25 + padLights[i] * 0.75);
  }
  keyLight = Math.max(0, keyLight - dt * 3); if (keysMesh) keysMesh.color.setRGB(0.96, 0.96 - keyLight * 0.2, 0.94 - keyLight * 0.7);
  if (!prompt) {
    prompt = document.createElement('div'); prompt.textContent = '🥁 Tap the Beat Station to jam (MPC + keys)';
    prompt.style.cssText = 'position:fixed;left:50%;bottom:110px;transform:translateX(-50%);z-index:50;background:rgba(8,10,18,.85);border:1px solid #ffd23f;color:#ffd23f;padding:6px 12px;border-radius:999px;font:600 13px system-ui;display:none;cursor:pointer';
    prompt.onclick = open; document.body.appendChild(prompt);
  }
  const c = MG().cam.position; prompt.style.display = !ov && Math.hypot(c.x - ST.x, c.z - ST.z) < 5 ? 'block' : 'none';
}

(function boot(t = 0) {
  if (MG() && MG().scene && MG().cam && MG().controls) {
    MG().scene.add(root); build();
    MG().controls.domElement.addEventListener('pointerdown', onDown, true);
    window.MGJAM = { open, close, onSignal, pad, key, connectMidi, _st: st, _kits: KIT_NAMES, _packs: () => ({ pack: st.pack, name: st.packName, str: packStr }), setPack, FACTORY, _sf: sfText, _jammers: jammers, _ctx: () => ctx };
    requestAnimationFrame(tick);
  } else if (t < 600) setTimeout(() => boot(t + 1), 250);
})();
