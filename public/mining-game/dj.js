/* ================= LOUNGE DJ BOOTH + DANCE FLOOR =================
   A 4-deck DJ booth in front of the big screen and an LED dance floor.
   • Decks A–D: waveform, play/cue, 4 hot cues, beat loops, tempo ±8/16 %, key lock, sync,
     nudge. Mixer: trim, 3-band EQ with kills, filter, channel faders, crossfader with
     A/THRU/B assign, headphone cue (to a chosen output device), master + VU.
   • Library: Audius (trending by genre + search), your own files, and a queue.
   • The whole room hears the set: the DJ's deck state rides on their lounge 'look'
     (≈2×/s) and every client plays the same Audius streams with the same mix.
     Your own files play only for you (they never leave your device).
   • Dance floor: tiles pulse to the beat; step on it, pick a move, and the camera swings
     round so you can watch your character dance. Everyone sees your moves. */
import * as THREE from 'three';

const MG = () => window.MG;
const UPS = 2.25, LX = 0, LZ = -120, LD = 24;
const AUDIUS = 'https://api.audius.co/v1';
const APP = 'app_name=WATTX_LOUNGE';
const BOOTH_Z = LZ - LD / 2 + 3.4;                       // world z of the booth front
const FLOOR = { x0: LX - 4.2, x1: LX + 4.2, z0: BOOTH_Z + 1.2, z1: BOOTH_Z + 8.2 };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtT = (s) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '–:––');

// ───────────────────────────────────────────────────────────── audio engine ──
let ctx = null, master = null, analyser = null, cueBus = null, cueEl = null, cueMix = null;
const decks = [];
function audio() {
  if (ctx) return ctx;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = 0.9;
  analyser = ctx.createAnalyser(); analyser.fftSize = 1024; analyser.smoothingTimeConstant = 0.6;
  master.connect(analyser); analyser.connect(ctx.destination);
  cueBus = ctx.createGain(); cueBus.gain.value = 1;
  cueMix = ctx.createGain(); cueMix.gain.value = 0;           // blend some master into the cue
  master.connect(cueMix); cueMix.connect(cueBus);
  const dst = ctx.createMediaStreamDestination(); cueBus.connect(dst);
  cueEl = new Audio(); cueEl.srcObject = dst.stream; cueEl.muted = true;   // unmuted once an output is chosen
  for (let i = 0; i < 4; i++) decks.push(new Deck(i));
  return ctx;
}
const EQF = [250, 1000, 4000];
class Deck {
  constructor(i) {
    this.i = i; this.name = 'ABCD'[i];
    this.el = new Audio(); this.el.crossOrigin = 'anonymous'; this.el.preload = 'auto';
    this.src = ctx.createMediaElementSource(this.el);
    this.trim = ctx.createGain();
    this.eq = EQF.map((f, k) => { const b = ctx.createBiquadFilter(); b.type = ['lowshelf', 'peaking', 'highshelf'][k]; b.frequency.value = f; if (k === 1) b.Q.value = 0.7; return b; });
    this.filt = ctx.createBiquadFilter(); this.filt.type = 'lowpass'; this.filt.frequency.value = 22050;
    this.fader = ctx.createGain(); this.xf = ctx.createGain(); this.cue = ctx.createGain(); this.cue.gain.value = 0;
    this.meter = ctx.createAnalyser(); this.meter.fftSize = 256;
    this.src.connect(this.trim); this.trim.connect(this.eq[0]); this.eq[0].connect(this.eq[1]); this.eq[1].connect(this.eq[2]); this.eq[2].connect(this.filt);
    this.filt.connect(this.fader); this.fader.connect(this.xf); this.xf.connect(master); this.fader.connect(this.meter);
    this.filt.connect(this.cue); this.cue.connect(cueBus);                    // pre-fader cue
    this.state = { trim: 0, eq: [0, 0, 0], filter: 0, vol: i < 2 ? 0.85 : 0, assign: ['A', 'B', 'A', 'B'][i], cue: false, tempo: 0, range: 8, keyLock: true };
    this.track = null; this.peaks = null; this.bpm = 0; this.grid = 0; this.cuePoint = 0; this.hot = [null, null, null, null]; this.loop = null;
    this.el.addEventListener('ended', () => ui.render());
    this.apply();
  }
  get pos() { return this.el.currentTime || 0; }
  get dur() { return this.el.duration || this.track?.duration || 0; }
  get playing() { return !this.el.paused && !this.el.ended && !!this.track; }
  get rate() { return 1 + this.state.tempo / 100; }
  get effBpm() { return this.bpm ? this.bpm * this.rate : 0; }
  apply() {
    const s = this.state, t = ctx.currentTime;
    this.trim.gain.setTargetAtTime(Math.pow(10, s.trim / 20), t, 0.02);
    s.eq.forEach((db, k) => this.eq[k].gain.setTargetAtTime(db, t, 0.02));
    const f = s.filter;
    if (f < -0.03) { this.filt.type = 'lowpass'; this.filt.frequency.setTargetAtTime(20000 * Math.pow(2, f * 8), t, 0.03); this.filt.Q.value = 1.2; }
    else if (f > 0.03) { this.filt.type = 'highpass'; this.filt.frequency.setTargetAtTime(20 * Math.pow(2, f * 8.6), t, 0.03); this.filt.Q.value = 1.2; }
    else { this.filt.type = 'lowpass'; this.filt.frequency.setTargetAtTime(22050, t, 0.03); this.filt.Q.value = 0.7; }
    this.fader.gain.setTargetAtTime(s.vol * s.vol, t, 0.02);                 // audio-taper fader
    this.cue.gain.setTargetAtTime(s.cue ? 1 : 0, t, 0.02);
    this.el.playbackRate = this.rate;
    if ('preservesPitch' in this.el) this.el.preservesPitch = s.keyLock; else this.el.mozPreservesPitch = s.keyLock;
    this.applyXf();
  }
  applyXf() {
    const x = mix.xf, a = this.state.assign;
    const g = a === 'THRU' ? 1 : a === 'A' ? Math.cos(x * Math.PI / 2) : Math.sin(x * Math.PI / 2);
    this.xf.gain.setTargetAtTime(g, ctx.currentTime, 0.015);
  }
  async load(track, { analyseIt = true } = {}) {
    this.el.pause();
    this.track = track; this.peaks = null; this.bpm = track.bpm || 0; this.grid = 0; this.cuePoint = 0; this.hot = [null, null, null, null]; this.loop = null;
    this.el.src = track.url; this.el.load();
    ui.render();
    if (analyseIt) analyse(this, track);
  }
  toggle() { if (!this.track) return; if (this.playing) this.el.pause(); else this.el.play().catch(() => {}); ui.render(); broadcastSoon(); }
  cueBtn() {
    if (!this.track) return;
    if (this.playing) { this.el.pause(); this.el.currentTime = this.cuePoint; }
    else if (Math.abs(this.pos - this.cuePoint) < 0.05) { /* already at cue */ }
    else this.cuePoint = this.pos;
    ui.render(); broadcastSoon();
  }
  seek(t) { if (!this.track) return; this.el.currentTime = clamp(t, 0, Math.max(0, this.dur - 0.05)); broadcastSoon(); }
  hotCue(k, clear) {
    if (!this.track) return;
    if (clear) this.hot[k] = null;
    else if (this.hot[k] == null) this.hot[k] = this.pos;
    else { this.seek(this.hot[k]); if (!this.playing) this.el.play().catch(() => {}); }
    ui.render();
  }
  setLoop(beats) {
    if (this.loop && this.loop.beats === beats) { this.loop = null; ui.render(); return; }
    const bl = this.bpm ? 60 / this.bpm : 0.5;
    const start = this.bpm ? this.grid + Math.floor((this.pos - this.grid) / bl) * bl : this.pos;
    this.loop = { start, end: start + beats * bl, beats }; ui.render();
  }
  sync() {
    const m = decks.filter((d) => d !== this && d.playing && d.bpm).sort((a, b) => b.state.vol - a.state.vol)[0];
    if (!m || !this.bpm) return false;
    const target = m.effBpm, tempo = (target / this.bpm - 1) * 100;
    if (Math.abs(tempo) > this.state.range) this.state.range = 16;
    this.state.tempo = clamp(tempo, -this.state.range, this.state.range); this.apply();
    // phase: line up this deck's beat with the master's
    const blM = 60 / m.bpm, blD = 60 / this.bpm;
    const phM = (((m.pos - m.grid) / blM) % 1 + 1) % 1, phD = (((this.pos - this.grid) / blD) % 1 + 1) % 1;
    let d = phM - phD; if (d > 0.5) d -= 1; if (d < -0.5) d += 1;
    this.el.currentTime = Math.max(0, this.pos + d * blD);
    ui.render(); broadcastSoon(); return true;
  }
  eject() { this.el.pause(); this.el.removeAttribute('src'); this.el.load(); this.track = null; this.peaks = null; ui.render(); broadcastSoon(); }
  level() { const a = new Uint8Array(this.meter.fftSize); this.meter.getByteTimeDomainData(a); let m = 0; for (const v of a) m = Math.max(m, Math.abs(v - 128)); return m / 128; }
}
const mix = { xf: 0.5, master: 0.9, cueMix: 0 };
function setXf(x) { mix.xf = x; decks.forEach((d) => d.applyXf()); broadcastSoon(); }

/** Waveform peaks + BPM/first-beat estimate. Decodes once, keeps only the peaks. */
async function analyse(deck, track) {
  try {
    const buf = await (await fetch(track.url)).arrayBuffer();
    if (deck.track !== track) return;
    const ab = await ctx.decodeAudioData(buf);
    if (deck.track !== track) return;
    const ch = ab.getChannelData(0), N = 900, step = Math.floor(ch.length / N), peaks = new Float32Array(N);
    for (let i = 0; i < N; i++) { let m = 0; for (let j = i * step, e = j + step; j < e; j += 4) { const v = Math.abs(ch[j]); if (v > m) m = v; } peaks[i] = m; }
    deck.peaks = peaks;
    // onset envelope (low-passed energy flux) → autocorrelation over 70–180 BPM
    const sr = ab.sampleRate, hop = 512, frames = Math.floor(ch.length / hop), env = new Float32Array(frames);
    let lp = 0, prev = 0;
    for (let f = 0; f < frames; f++) { let e = 0; for (let j = f * hop, end = j + hop; j < end; j += 2) { lp += 0.08 * (ch[j] - lp); e += lp * lp; } env[f] = Math.max(0, e - prev); prev = e; }
    if (!track.bpm) {
      const fps = sr / hop; let best = 0, bestBpm = 120;
      for (let bpm = 70; bpm <= 180; bpm += 0.5) {
        const lag = fps * 60 / bpm, L = Math.floor(lag); let s = 0;
        for (let f = 0; f + lag * 4 < frames && f < 6000; f++) s += env[f] * (env[f + L] + env[f + 2 * L] + env[f + 4 * L]) / 3;
        if (s > best) { best = s; bestBpm = bpm; }
      }
      while (bestBpm < 85) bestBpm *= 2; while (bestBpm > 175) bestBpm /= 2;
      deck.bpm = Math.round(bestBpm * 2) / 2;
    }
    // first beat ≈ strongest onset in the first two bars
    const bl = 60 / deck.bpm, fps = sr / hop; let bf = 0, bv = -1;
    for (let f = 0; f < Math.min(frames, fps * bl * 8); f++) if (env[f] > bv) { bv = env[f]; bf = f; }
    deck.grid = ((bf / fps) % bl);
    ui.render();
  } catch (e) { /* streaming still works without a waveform */ }
}

// ───────────────────────────────────────────────────────────── library ──
const lib = { tab: 'trending', genre: 'Electronic', time: 'week', q: '', results: [], offset: 0, more: false, playlists: [], openList: null,
  mcTag: 'house', mcResults: [], mcNext: null, files: [], queue: [], loading: false, err: '' };
const GENRES = ['All', 'Electronic', 'House', 'Techno', 'Deep House', 'Tech House', 'Trance', 'Dubstep', 'Drum & Bass', 'Trap', 'Hip-Hop/Rap', 'Hyperpop', 'Lo-Fi', 'Pop', 'R&B/Soul', 'Dance', 'Ambient', 'Experimental', 'Alternative', 'Jungle', 'Moombahton', 'Reggae', 'Latin', 'Afrobeats'];
const MC_TAGS = ['house', 'deep house', 'tech house', 'techno', 'drum and bass', 'dubstep', 'trance', 'disco', 'hip hop', 'afro house', 'garage', 'ambient', 'jungle', 'funk', 'soul'];
const audiusTrack = (t) => ({
  kind: 'audius', id: t.id, title: t.title, artist: t.user?.name || '', bpm: t.bpm ? Math.round(t.bpm * 2) / 2 : 0, duration: t.duration,
  art: t.artwork?.['150x150'] || '', url: `${AUDIUS}/tracks/${t.id}/stream?${APP}`,
});
const mixcloudItem = (c) => ({ kind: 'mixcloud', id: c.key, title: c.name, artist: c.user?.name || '', duration: c.audio_length || 0, art: c.pictures?.medium || c.pictures?.thumbnail || '', bpm: 0 });
async function fetchLib(append = false) {
  lib.loading = true; lib.err = ''; if (!append) { lib.offset = 0; } ui.render();
  try {
    if (lib.tab === 'mixcloud') {
      const url = append && lib.mcNext ? lib.mcNext
        : lib.q.trim() ? `https://api.mixcloud.com/search/?q=${encodeURIComponent(lib.q.trim())}&type=cloudcast&limit=50`
          : `https://api.mixcloud.com/discover/${encodeURIComponent(lib.mcTag.replace(/ /g, '-'))}/popular/?limit=50`;
      const j = await (await fetch(url)).json();
      const items = (j.data || []).map(mixcloudItem);
      lib.mcResults = append ? lib.mcResults.concat(items) : items; lib.mcNext = j.paging?.next || null;
    } else if (lib.tab === 'playlists') {
      if (lib.openList) {
        const j = await (await fetch(`${AUDIUS}/playlists/${lib.openList.id}/tracks?${APP}`)).json();
        lib.results = (j.data || []).filter((t) => t.is_streamable !== false).map(audiusTrack); lib.more = false;
      } else {
        const q = lib.q.trim() || lib.genre.replace('All', 'dj mix');
        const j = await (await fetch(`${AUDIUS}/playlists/search?query=${encodeURIComponent(q)}&limit=40&${APP}`)).json();
        lib.playlists = (j.data || []).map((x) => ({ id: x.id, name: x.playlist_name, by: x.user?.name || '', n: x.track_count || 0, art: x.artwork?.['150x150'] || '' }));
      }
    } else {
      const off = append ? lib.offset + 100 : 0;
      let url;
      if (lib.tab === 'search' && lib.q.trim()) url = `${AUDIUS}/tracks/search?query=${encodeURIComponent(lib.q.trim())}&limit=100&offset=${off}&${APP}`;
      else if (lib.tab === 'underground') url = `${AUDIUS}/tracks/trending/underground?limit=100&offset=${off}&${APP}`;
      else url = `${AUDIUS}/tracks/trending?time=${lib.time}&limit=100&offset=${off}&${lib.genre !== 'All' ? `genre=${encodeURIComponent(lib.genre)}&` : ''}${APP}`;
      const j = await (await fetch(url)).json();
      const items = (j.data || []).filter((t) => t.is_streamable !== false).map(audiusTrack);
      lib.results = append ? lib.results.concat(items) : items; lib.offset = off; lib.more = items.length >= 50;
    }
  } catch (e) { lib.err = 'Couldn’t reach the music service — try again.'; }
  lib.loading = false; ui.render();
}
function addFiles(list) {
  for (const f of list) lib.files.push({ kind: 'file', id: 'f' + Math.random().toString(36).slice(2, 8), title: f.name.replace(/\.[^.]+$/, ''), artist: 'your file', bpm: 0, duration: 0, art: '', url: URL.createObjectURL(f) });
  lib.tab = 'files'; ui.render();
}

// ───────────────────────────────────────────────────────────── Mixcloud ──
// Mixcloud only allows playback through its own widget, so a mix plays beside the
// decks (no EQ/crossfader). The DJ shares key + position; listeners load the same
// widget and seek to match (some mixes forbid seeking — then they start from the top).
const mc = { key: null, title: '', playing: false, pos: 0, iframe: null, widget: null, loading: false };
function mcScript() {
  if (window.Mixcloud) return Promise.resolve();
  return new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = 'https://widget.mixcloud.com/media/js/widgetApi.js'; sc.onload = res; sc.onerror = rej; document.head.appendChild(sc); });
}
async function mcLoad(key, title, startPos = 0) {
  if (mc.loading) return; mc.loading = true;
  try {
    await mcScript();
    mcRemove();
    const f = document.createElement('iframe');
    f.allow = 'autoplay; encrypted-media'; f.title = 'Mixcloud';
    f.style.cssText = 'position:fixed;right:12px;bottom:64px;width:320px;height:60px;border:0;border-radius:10px;z-index:35;box-shadow:0 6px 24px rgba(0,0,0,.5)';
    f.src = `https://player-widget.mixcloud.com/widget/iframe/?feed=${encodeURIComponent(key)}&mini=1&hide_cover=1&light=0&autoplay=1`;
    document.body.appendChild(f);
    Object.assign(mc, { key, title, iframe: f, widget: null, pos: startPos });
    const w = window.Mixcloud.PlayerWidget(f); await w.ready; mc.widget = w;
    w.events.play.on(() => { mc.playing = true; broadcastSoon(); ui.render(); });
    w.events.pause.on(() => { mc.playing = false; broadcastSoon(); ui.render(); });
    w.events.ended.on(() => { mc.playing = false; broadcastSoon(); ui.render(); });
    w.events.progress.on((p) => { mc.pos = p; });
    if (startPos > 3) { try { await w.seek(startPos); } catch (e) { /* seeking not allowed for this mix */ } }
    try { await w.play(); } catch (e) { /* autoplay blocked until a tap */ }
  } catch (e) { toast('Mixcloud player couldn’t load'); }
  mc.loading = false; ui.render();
}
function mcRemove() { try { mc.widget?.pause(); } catch (e) { /* */ } mc.iframe?.remove(); Object.assign(mc, { key: null, title: '', playing: false, iframe: null, widget: null, pos: 0 }); }
function mcPlay(t) { mcLoad(t.id, t.title, 0).then(broadcastSoon); }
function mcStop() { mcRemove(); broadcastSoon(); ui.render(); }

// ───────────────────────────────────────────────────────── room sync (look.dj) ──
// The DJ publishes a compact snapshot; listeners mirror it with their own engine.
let role = 'idle';                      // 'dj' | 'listen' | 'idle'
let lastSent = 0, sendTimer = null;
function snapshot() {
  const now = Date.now();
  return {
    at: now, co: allowCo ? 1 : 0, xf: +mix.xf.toFixed(3), m: +mix.master.toFixed(2),
    mc: mc.key ? { k: mc.key, t: mc.title.slice(0, 32), p: +(mc.pos || 0).toFixed(1), pl: mc.playing ? 1 : 0 } : 0,
    d: decks.map((d) => (d.track && d.track.kind === 'audius' ? {
      i: d.track.id, t: d.track.title.slice(0, 32), p: +d.pos.toFixed(2), r: +d.rate.toFixed(4), pl: d.playing ? 1 : 0,
      v: +d.state.vol.toFixed(2), tr: d.state.trim, eq: d.state.eq, f: +d.state.filter.toFixed(2), a: d.state.assign, b: d.bpm, g: +d.grid.toFixed(3),
    } : 0)),
  };
}
function broadcast() {
  if (role !== 'dj') return;
  lastSent = Date.now();
  try { window.MGSKIN?.setMyLook?.({ dj: snapshot() }); } catch (e) { /* offline */ }
}
function broadcastSoon() { if (role !== 'dj') return; clearTimeout(sendTimer); sendTimer = setTimeout(broadcast, 120); }
function stopDJ() {
  if (role !== 'dj') return;
  role = 'idle';
  try { window.MGSKIN?.setMyLook?.({ dj: null }); } catch (e) { /* */ }
  decks.forEach((d) => d.el.pause());
  mcStop();
}
const peers = () => { try { return window.MGNET?.peerLooks?.() || []; } catch (e) { return []; } };
function remoteDJ() {
  // MGNET.peerLooks() gives {id,name,look}; pick the freshest DJ snapshot
  let best = null;
  for (const p of peers()) { const dj = p.look?.dj; if (dj && Date.now() - dj.at < 12000 && (!best || dj.at > best.dj.at)) best = { id: p.id, name: p.name, dj }; }
  return best;
}
function follow(rdj) {
  audio(); if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  const s = rdj.dj, age = (Date.now() - s.at) / 1000;
  mix.xf = s.xf;
  if (s.mc) {
    const target = s.mc.p + (s.mc.pl ? age : 0);
    if (mc.key !== s.mc.k) { if (!mc.loading) mcLoad(s.mc.k, s.mc.t, target); }
    else if (mc.widget) {
      if (s.mc.pl && !mc.playing) mc.widget.play().catch(() => {});
      if (!s.mc.pl && mc.playing) mc.widget.pause().catch(() => {});
      if (s.mc.pl && Math.abs((mc.pos || 0) - target) > 5) mc.widget.seek(target).catch(() => {});
    }
  } else if (mc.key) mcRemove();
  s.d.forEach((r, k) => {
    const d = decks[k];
    if (!r) { if (d.track) d.eject(); return; }
    if (!d.track || d.track.id !== r.i) { d.load({ kind: 'audius', id: r.i, title: r.t, artist: '', bpm: r.b, duration: 0, art: '', url: `${AUDIUS}/tracks/${r.i}/stream?${APP}` }, { analyseIt: false }); }
    Object.assign(d.state, { vol: r.v, trim: r.tr, eq: r.eq, filter: r.f, assign: r.a, tempo: (r.r - 1) * 100, cue: role === 'codj' ? d.state.cue : false });
    d.bpm = r.b || d.bpm; d.grid = r.g || 0;
    d.apply();
    const target = r.p + (r.pl ? age * r.r : 0);
    if (Math.abs(d.pos - target) > 0.35 && d.el.readyState >= 1) d.el.currentTime = target;
    if (r.pl && d.el.paused) d.el.play().catch(() => {});
    if (!r.pl && !d.el.paused) d.el.pause();
  });
}


// ───────────────────────────────────────── co-DJ (B2B): one shared mix, many hands ──
// The host (whoever went live) owns the engine. Co-DJs follow the host's state like
// listeners, and every control they touch is sent to the host as a 'dj-cmd' over the
// lounge relay; the host applies it and the next snapshot shows everyone the result.
let hostId = null, allowCo = true;
const sendSig = (to, kind, data) => { try { window.MGNET?.sendObj?.({ t: 'voice', to, kind, data }); } catch (e) { /* offline */ } };
function act(op, a = {}) {
  if (role === 'codj' && hostId) { sendSig(hostId, 'dj-cmd', { op, ...a }); return; }
  applyCmd({ op, ...a });
}
function applyCmd(c) {
  const d = c.d != null ? decks[c.d] : null;
  if (c.d != null && !d) return;
  switch (c.op) {
    case 'play': d.toggle(); break;
    case 'cue': d.cueBtn(); break;
    case 'sync': d.sync(); break;
    case 'key': d.state.keyLock = !d.state.keyLock; d.apply(); break;
    case 'range': d.state.range = d.state.range === 8 ? 16 : 8; d.state.tempo = clamp(d.state.tempo, -d.state.range, d.state.range); d.apply(); break;
    case 'zero': d.state.tempo = 0; d.apply(); break;
    case 'eject': d.eject(); break;
    case 'nudge': d.el.playbackRate = c.v ? d.rate * c.v : d.rate; break;
    case 'hot': d.hotCue(c.k, c.clear); break;
    case 'loop': d.setLoop(c.b); break;
    case 'tempo': d.state.tempo = clamp(+c.v, -16, 16); d.apply(); break;
    case 'seek': d.seek(+c.t); break;
    case 'ch': if (String(c.k).startsWith('eq')) d.state.eq[+c.k[2]] = +c.v; else if (['trim', 'filter', 'vol'].includes(c.k)) d.state[c.k] = +c.v; d.apply(); break;
    case 'assign': d.state.assign = c.v; d.apply(); break;
    case 'xf': setXf(+c.v); break;
    case 'master': mix.master = +c.v; master.gain.setTargetAtTime(mix.master, ctx.currentTime, 0.02); break;
    case 'load': if (c.track && c.track.kind === 'audius') d.load({ ...c.track, url: `${AUDIUS}/tracks/${c.track.id}/stream?${APP}` }); break;
    case 'mc': if (c.track) mcPlay(c.track); else mcStop(); break;
    default: return;
  }
  broadcastSoon(); ui.render();
}
function onSignal(from, kind, data) {
  if (kind === 'dj-cmd' && role === 'dj' && allowCo && data && typeof data.op === 'string') applyCmd(data);
}
function joinDecks(r) { audio(); role = 'codj'; hostId = r.id; try { window.MGSKIN?.setMyLook?.({ djco: { h: r.id, at: Date.now() }, emote: 'groove' }); } catch (e) { /* */ } ui.render(); }
function leaveDecks() { if (role !== 'codj') return; role = 'idle'; hostId = null; try { window.MGSKIN?.setMyLook?.({ djco: null, emote: null }); } catch (e) { /* */ } ui.render(); }
const myIdNum = () => { try { return +(window.MGNET?.debug?.().id || 0); } catch (e) { return 0; } };
/** Where your avatar stands for everyone while you're on the decks (behind the booth). */
function standAt() {
  const slot = role === 'dj' ? 0 : role === 'codj' ? (myIdNum() % 2 ? 1.25 : -1.25) : null;
  let serato = false; try { const st = window.MGSTAGE?._state?.(); serato = !!(st && st.live && st.live.on && st.live.where === 'booth'); } catch (e) { /* */ }
  if (slot == null && !serato) return null;
  return { x: LX + (slot || 0), z: BOOTH_Z - 2.05, ry: 0 };
}

// ─────────────────────────────── MIDI controller → on-screen mixer (learn mode) ──
// Works for the host and for co-DJs: a mapped control just drives the on-screen control,
// which already routes through act() → the shared mix.
let midiMap = {}; try { midiMap = JSON.parse(localStorage.getItem('mgDjMidi') || '{}') || {}; } catch (e) { /* */ }
let learn = false, learnSel = null;
const qv = (v) => String(v).replace(/["\\]/g, '\\$&');
function selOf(el) {
  const own = [...el.attributes].filter((a) => a.name.startsWith('data-')).map((a) => `[${a.name}="${qv(a.value)}"]`).join('');
  if (!own) return el.id ? '#' + el.id : null;
  const par = el.parentElement?.closest('[data-deck],[data-ch]');
  const pre = par ? [...par.attributes].filter((a) => a.name === 'data-deck' || a.name === 'data-ch').map((a) => `[${a.name}="${qv(a.value)}"]`).join('') + ' ' : '';
  return pre + el.tagName.toLowerCase() + own;
}
function midiBtn() {
  const b = ov?.querySelector('#dj-midi'); if (!b) return;
  b.classList.toggle('on', learn);
  b.textContent = !learn ? `🎛 MIDI${Object.keys(midiMap).length ? ' · ' + Object.keys(midiMap).length : ''}` : learnSel ? '🎛 now move a knob / hit a pad…' : '🎛 LEARN: touch a control (tap again to finish)';
}
/** Called by the MIDI input (jam.js). Returns true when the message was used by the DJ mixer. */
function midiLearn(d) {
  if (!ov) return false;
  const [s, n, v] = d, cmd = s & 0xf0;
  if (cmd !== 0xb0 && cmd !== 0x90 && cmd !== 0x80) return false;
  const k = (cmd === 0xb0 ? 'cc' : 'nt') + ':' + (s & 15) + ':' + n;
  if (learn && learnSel && (cmd === 0xb0 || (cmd === 0x90 && v > 0))) {
    midiMap[k] = learnSel; learnSel = null; try { localStorage.setItem('mgDjMidi', JSON.stringify(midiMap)); } catch (e) { /* */ }
    midiBtn(); toast('Mapped ✓ — touch another control or tap 🎛 to finish'); return true;
  }
  const sel = midiMap[k]; if (!sel) return false;
  if (cmd === 0x80 || (cmd === 0x90 && v === 0)) return true;
  let el = null; try { el = ov.querySelector(sel); } catch (e) { /* stale selector */ }
  if (!el) return true;
  if (el.type === 'range') {
    const lo = +el.min || 0, hi = el.max === '' ? 100 : +el.max;
    el.value = String(lo + (v / 127) * (hi - lo)); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
  } else el.click();
  return true;
}

// ───────────────────────────────────────────────────────────── UI ──
let ov = null;
const CSS = `
#mg-dj{position:fixed;inset:0;z-index:2147483000;background:#07080e;color:#e6ebf5;font:13px system-ui,sans-serif;overflow:auto;-webkit-user-select:none;user-select:none}
#mg-dj .bar{display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid #1d2436;position:sticky;top:0;background:#07080ef0;z-index:2;flex-wrap:wrap}
#mg-dj button{background:#161b2b;border:1px solid #2a3350;color:#e6ebf5;border-radius:8px;padding:6px 10px;font-weight:700;cursor:pointer;font-size:12px}
#mg-dj button.on{background:#ffd23f;color:#111;border-color:#ffd23f}
#mg-dj button.play{background:#16a34a;border-color:#16a34a;color:#fff;min-width:54px}
#mg-dj button.play.on{background:#ef4444;border-color:#ef4444;color:#fff}
#mg-dj button.cue{background:#2a1d00;border-color:#f59e0b;color:#fbbf24}
#mg-dj .grid{display:grid;grid-template-columns:1fr minmax(260px,320px) 1fr;gap:10px;padding:10px}
#mg-dj .deck{background:#0e1220;border:1px solid #1d2436;border-radius:12px;padding:8px;display:flex;flex-direction:column;gap:6px;min-width:0}
#mg-dj .deck .hd{display:flex;gap:8px;align-items:center;min-width:0}
#mg-dj .deck .ttl{flex:1;min-width:0}
#mg-dj .deck .ttl b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#mg-dj .deck .ttl small{color:#8792ab}
#mg-dj .letter{font:900 22px system-ui;width:30px;text-align:center}
#mg-dj canvas.wf{width:100%;height:56px;background:#05060b;border-radius:6px;cursor:pointer;display:block}
#mg-dj .row{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
#mg-dj .mixer{background:#0b0f1a;border:1px solid #1d2436;border-radius:12px;padding:8px;grid-row:span 2}
#mg-dj .chs{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
#mg-dj .ch{display:flex;flex-direction:column;align-items:center;gap:3px;background:#0e1322;border-radius:8px;padding:6px 2px}
#mg-dj .ch label{font-size:10px;color:#8792ab}
#mg-dj input[type=range]{width:100%;accent-color:#ffd23f}
#mg-dj input.vert{writing-mode:vertical-lr;direction:rtl;width:26px;height:120px}
#mg-dj .vu{width:8px;height:120px;background:#111827;border-radius:4px;position:relative;overflow:hidden}
#mg-dj .vu i{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(#ef4444,#f59e0b 30%,#22c55e 60%)}
#mg-dj .lib{margin:0 10px 12px;background:#0b0f1a;border:1px solid #1d2436;border-radius:12px;padding:8px}
#mg-dj .trk{display:flex;align-items:center;gap:8px;padding:5px;border-bottom:1px solid #141a2a}
#mg-dj .trk img,#mg-dj .trk .ph{width:34px;height:34px;border-radius:5px;object-fit:cover;background:#1a2033;flex:0 0 auto}
#mg-dj .trk .t{flex:1;min-width:0}
#mg-dj .trk .t b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px}
#mg-dj .trk .t small{color:#8792ab}
#mg-dj .note{color:#8792ab;font-size:11px}
#mg-dj select,#mg-dj input[type=search]{background:#0e1322;border:1px solid #2a3350;color:#e6ebf5;border-radius:8px;padding:6px}
@media (max-width:900px){#mg-dj .grid{grid-template-columns:1fr}#mg-dj .mixer{grid-row:auto;order:-1}}
`;
const ui = {
  render() {
    if (!ov) return;
    const body = ov.querySelector('#dj-body');
    const rdj = remoteDJ();
    const taken = rdj && role !== 'dj' && role !== 'codj';
    const coNames = peers().filter((p) => p.look?.djco && p.look.djco.h === (role === 'dj' ? myIdNum() : hostId) && Date.now() - p.look.djco.at < 8000).map((p) => p.name);
    ov.querySelector('#dj-status').innerHTML = role === 'dj' ? `<span style="color:#22c55e">● LIVE to the lounge${coNames.length ? ` · B2B with ${esc(coNames.join(', '))}` : ''}</span> <label class="note"><input type="checkbox" id="dj-allowco" ${allowCo ? 'checked' : ''}> let others join the decks</label>`
      : role === 'codj' ? `<span style="color:#22c55e">● On the decks with ${esc(rdj ? rdj.name : 'the host')} — your moves go to the shared mix</span>`
      : taken ? `<span style="color:#f59e0b">${esc(rdj.name)} is on the decks${rdj.dj.co ? ' — join them back-to-back' : ''}</span>` : '<span class="note">Not live</span>';
    ov.querySelector('#dj-live').textContent = role === 'dj' ? 'End set' : role === 'codj' ? 'Leave decks' : (taken && rdj.dj.co) ? '🤝 Join the decks' : 'Go live';
    ov.querySelector('#dj-allowco')?.addEventListener('change', (e) => { allowCo = e.target.checked; broadcastSoon(); });
    const lb = ov.querySelector('#dj-lights'), sh = sharedLights(), m = sh ? sh.m : 'auto';
    lb.innerHTML = `<button data-lt="house" class="${m === 'house' ? 'on' : ''}">💡 House</button><button data-lt="club" class="${m === 'club' ? 'on' : ''}">🌈 Club</button><button data-sb class="${(sh ? sh.sb : L.strobe) ? 'on' : ''}">⚡ Strobe</button>`;
    lb.querySelectorAll('[data-lt]').forEach((b) => b.onclick = () => setLights(b.dataset.lt));
    lb.querySelector('[data-sb]').onclick = () => setLights(sh ? sh.m : 'club', !(sh ? sh.sb : L.strobe));
    ov.querySelector('#dj-live').disabled = !!taken && !rdj.dj.co;
    body.innerHTML = `<div class="grid">${deckHTML(0)}${mixerHTML()}${deckHTML(1)}${deckHTML(2)}${deckHTML(3)}</div>${libHTML()}`;
    wire(body);
  },
};
function deckHTML(i) {
  const d = decks[i], t = d.track, col = ['#35e0ff', '#ff4fd8', '#ffd23f', '#3dff8a'][i];
  return `<div class="deck" data-deck="${i}" style="${i > 1 ? '' : ''}">
    <div class="hd"><div class="letter" style="color:${col}">${d.name}</div>
      ${t?.art ? `<img src="${esc(t.art)}" style="width:40px;height:40px;border-radius:6px" alt="">` : ''}
      <div class="ttl"><b>${t ? esc(t.title) : 'Empty — load a track below'}</b><small>${t ? esc(t.artist) : ''}</small></div>
      <div style="text-align:right"><b data-bpm style="font-size:15px;color:${col}">${d.bpm ? d.effBpm.toFixed(1) : '—'}</b><br><small class="note" data-time>${fmtT(d.pos)} / -${fmtT(d.dur - d.pos)}</small></div></div>
    <canvas class="wf" width="600" height="56" data-wf></canvas>
    <div class="row"><button class="cue" data-a="cue">CUE</button><button class="play ${d.playing ? 'on' : ''}" data-a="play">${d.playing ? '❚❚' : '▶'}</button>
      <button data-a="sync">SYNC</button><button class="${d.state.keyLock ? 'on' : ''}" data-a="key" title="Key lock">KEY</button>
      <button data-a="nudge-" title="Nudge back">◀◀</button><button data-a="nudge+" title="Nudge forward">▶▶</button>
      <button data-a="next" title="Load next from queue">⏭</button><button data-a="eject" title="Eject">⏏</button></div>
    <div class="row">${[0, 1, 2, 3].map((k) => `<button data-hot="${k}" class="${d.hot[k] != null ? 'on' : ''}" style="flex:1">${k + 1}</button>`).join('')}
      ${[4, 8, 16].map((b) => `<button data-loop="${b}" class="${d.loop?.beats === b ? 'on' : ''}">⟳${b}</button>`).join('')}</div>
    <div class="row"><span class="note" style="width:52px">Tempo ${d.state.tempo >= 0 ? '+' : ''}${d.state.tempo.toFixed(1)}%</span>
      <input type="range" data-k="tempo" min="${-d.state.range}" max="${d.state.range}" step="0.05" value="${d.state.tempo}" style="flex:1">
      <button data-a="range">±${d.state.range}</button><button data-a="zero" title="Reset tempo">0</button></div>
  </div>`;
}
const knob = (i, k, label, min, max, step, v) => `<label>${label}</label><input type="range" data-ch="${i}" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${v}" style="width:58px">`;
function mixerHTML() {
  return `<div class="mixer"><div class="chs">${decks.map((d, i) => `<div class="ch">
      <b style="color:${['#35e0ff', '#ff4fd8', '#ffd23f', '#3dff8a'][i]}">${d.name}</b>
      ${knob(i, 'trim', 'TRIM', -12, 12, 0.5, d.state.trim)}${knob(i, 'eq2', 'HI', -26, 6, 0.5, d.state.eq[2])}${knob(i, 'eq1', 'MID', -26, 6, 0.5, d.state.eq[1])}${knob(i, 'eq0', 'LOW', -26, 6, 0.5, d.state.eq[0])}
      ${knob(i, 'filter', 'FILTER', -1, 1, 0.01, d.state.filter)}
      <button data-ch="${i}" data-a="cue" class="${d.state.cue ? 'on' : ''}" title="Headphone cue">🎧</button>
      <div style="display:flex;gap:4px;align-items:flex-end"><div class="vu"><i data-vu="${i}" style="height:0%"></i></div><input class="vert" type="range" data-ch="${i}" data-k="vol" min="0" max="1" step="0.01" value="${d.state.vol}"></div>
      <div class="row" style="gap:2px">${['A', 'THRU', 'B'].map((a) => `<button data-ch="${i}" data-assign="${a}" class="${d.state.assign === a ? 'on' : ''}" style="padding:2px 4px;font-size:9px">${a === 'THRU' ? 'T' : a}</button>`).join('')}</div></div>`).join('')}</div>
    <div style="margin-top:8px"><label class="note">CROSSFADER</label><input type="range" data-g="xf" min="0" max="1" step="0.005" value="${mix.xf}"></div>
    <div class="row"><label class="note" style="width:60px">MASTER</label><input type="range" data-g="master" min="0" max="1" step="0.01" value="${mix.master}" style="flex:1"></div>
    <div class="row"><label class="note" style="width:60px">CUE MIX</label><input type="range" data-g="cuemix" min="0" max="1" step="0.01" value="${mix.cueMix}" style="flex:1"></div>
    <div class="row"><label class="note">🎧 Headphones</label><select data-g="out" style="flex:1"><option value="">off</option></select></div>
    <div class="note">Cue 🎧 sends a channel to your headphones (pick an output). Speakers carry the master.</div></div>`;
}
function libHTML() {
  const list = lib.tab === 'files' ? lib.files : lib.tab === 'queue' ? lib.queue : lib.tab === 'mixcloud' ? lib.mcResults : (lib.tab === 'playlists' && !lib.openList) ? [] : lib.results;
  const tabs = { trending: '🔥 Trending', underground: '🌀 Underground', search: '🔎 Search', playlists: '📚 Playlists', mixcloud: '☁ Mixcloud', files: '📁 My files', queue: `🗒 Queue (${lib.queue.length})` };
  const row = (t, n) => `<div class="trk">${t.art ? `<img src="${esc(t.art)}" alt="">` : '<div class="ph"></div>'}
      <div class="t"><b>${esc(t.title)}</b><small>${esc(t.artist)}${t.bpm ? ` · ${t.bpm} BPM` : ''}${t.duration ? ` · ${fmtT(t.duration)}` : ''}${t.kind === 'mixcloud' ? ' · Mixcloud mix' : ''}</small></div>
      ${t.kind === 'mixcloud' ? `<button data-mc="${n}" style="padding:4px 8px">${mc.key === t.id && mc.playing ? '■ Stop' : '▶ Play'}</button>`
        : ['A', 'B', 'C', 'D'].map((L, k) => `<button data-load="${k}" data-n="${n}" style="padding:4px 7px">${L}</button>`).join('')}
      ${lib.tab === 'queue' ? `<button data-qup="${n}" style="padding:4px 6px">↑</button><button data-qrm="${n}" style="padding:4px 6px">✕</button>` : t.kind === 'mixcloud' ? '' : `<button data-qadd="${n}" style="padding:4px 6px" title="Add to queue">＋</button>`}</div>`;
  return `<div class="lib"><div class="row" style="margin-bottom:6px">
      ${Object.keys(tabs).map((t) => `<button data-tab="${t}" class="${lib.tab === t ? 'on' : ''}">${tabs[t]}</button>`).join('')}</div>
    <div class="row" style="margin-bottom:6px">
      ${lib.tab === 'trending' ? `<select data-genre>${GENRES.map((g) => `<option ${g === lib.genre ? 'selected' : ''}>${g}</option>`).join('')}</select>
        <select data-time>${[['week', 'This week'], ['month', 'This month'], ['allTime', 'All time']].map(([v, l]) => `<option value="${v}" ${v === lib.time ? 'selected' : ''}>${l}</option>`).join('')}</select>` : ''}
      ${['search', 'playlists', 'mixcloud'].includes(lib.tab) ? `<input type="search" data-q placeholder="${lib.tab === 'mixcloud' ? 'Search Mixcloud mixes…' : lib.tab === 'playlists' ? 'Search playlists…' : 'Search Audius…'}" value="${esc(lib.q)}" style="flex:1;min-width:140px"><button data-a="search">Go</button>` : ''}
      ${lib.tab === 'mixcloud' ? MC_TAGS.map((g) => `<button data-mctag="${g}" class="${!lib.q && lib.mcTag === g ? 'on' : ''}" style="padding:3px 7px;font-size:11px">${g}</button>`).join('') : ''}
      ${lib.tab === 'playlists' && lib.openList ? `<button data-a="back">← Playlists</button><b>${esc(lib.openList.name)}</b>` : ''}
      ${lib.tab === 'files' ? '<label style="cursor:pointer"><input type="file" accept="audio/*" multiple data-files style="display:none"><span style="border:1px dashed #2a3350;border-radius:8px;padding:6px 10px">＋ Add music files</span></label><span class="note">Only you hear your own files.</span>' : ''}
    </div>
    ${lib.tab === 'mixcloud' ? '<div class="note" style="margin-bottom:6px">Mixcloud mixes play through Mixcloud’s own player (their rules), so they skip the decks/EQ — the room hears them as-is, in sync. Some mixes don’t allow skipping ahead.</div>' : ''}
    ${lib.loading ? '<div class="note">Loading…</div>' : ''}${lib.err ? `<div class="note" style="color:#f87171">${esc(lib.err)}</div>` : ''}
    ${lib.tab === 'playlists' && !lib.openList ? (lib.playlists.length ? lib.playlists.map((pl, n) => `<div class="trk">${pl.art ? `<img src="${esc(pl.art)}" alt="">` : '<div class="ph"></div>'}<div class="t"><b>${esc(pl.name)}</b><small>${esc(pl.by)} · ${pl.n} tracks</small></div><button data-pl="${n}">Open</button></div>`).join('') : (lib.loading ? '' : '<div class="note" style="padding:10px">Search for a playlist (or press Go for DJ mixes).</div>'))
      : list.length ? list.map(row).join('') : `<div class="note" style="padding:10px">${lib.tab === 'queue' ? 'Queue is empty — tap ＋ on any track.' : lib.tab === 'files' ? 'Add MP3/WAV/M4A files from your device.' : lib.loading ? '' : 'No tracks.'}</div>`}
    ${(['trending', 'underground', 'search'].includes(lib.tab) && lib.more) || (lib.tab === 'mixcloud' && lib.mcNext) ? '<button data-a="more" style="width:100%;margin-top:6px">Load more</button>' : ''}
    <div class="note" style="margin-top:6px">Tracks stream from Audius and Mixcloud. Mixes stay in the lounge — nothing is recorded or rebroadcast elsewhere.</div></div>`;
}
function wire(body) {
  const listNow = () => (lib.tab === 'files' ? lib.files : lib.tab === 'queue' ? lib.queue : lib.tab === 'mixcloud' ? lib.mcResults : lib.results);
  body.querySelectorAll('[data-deck]').forEach((el) => {
    const d = decks[+el.dataset.deck];
    el.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('pointerdown', (e) => {
      const a = b.dataset.a; e.preventDefault();
      const di = +el.dataset.deck;
      if (['play', 'cue', 'sync', 'key', 'range', 'zero', 'eject'].includes(a)) act(a, { d: di });
      else if (a === 'next') { const t = lib.queue.shift(); if (t) loadTo(di, t); }
      else if (a === 'nudge-' || a === 'nudge+') {
        act('nudge', { d: di, v: a === 'nudge+' ? 1.04 : 0.96 });
        const up = () => { act('nudge', { d: di, v: 0 }); b.removeEventListener('pointerup', up); b.removeEventListener('pointerleave', up); };
        b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up);
      }
    }));
    const di = +el.dataset.deck;
    el.querySelectorAll('[data-hot]').forEach((b) => b.addEventListener('click', (e) => act('hot', { d: di, k: +b.dataset.hot, clear: e.shiftKey || e.ctrlKey })));
    el.querySelectorAll('[data-hot]').forEach((b) => b.addEventListener('contextmenu', (e) => { e.preventDefault(); act('hot', { d: di, k: +b.dataset.hot, clear: true }); }));
    el.querySelectorAll('[data-loop]').forEach((b) => b.addEventListener('click', () => act('loop', { d: di, b: +b.dataset.loop })));
    el.querySelector('[data-k=tempo]').addEventListener('input', (e) => { act('tempo', { d: di, v: +e.target.value }); updateLive(); });
    const wf = el.querySelector('[data-wf]');
    wf.addEventListener('click', (e) => { const r = wf.getBoundingClientRect(); act('seek', { d: di, t: (e.clientX - r.left) / r.width * d.dur }); });
  });
  body.querySelectorAll('[data-ch][data-k]').forEach((inp) => inp.addEventListener('input', () => {
    act('ch', { d: +inp.dataset.ch, k: inp.dataset.k, v: +inp.value });
  }));
  body.querySelectorAll('[data-ch][data-a=cue]').forEach((b) => b.addEventListener('click', () => { const d = decks[+b.dataset.ch]; d.state.cue = !d.state.cue; d.apply(); ui.render(); }));
  body.querySelectorAll('[data-assign]').forEach((b) => b.addEventListener('click', () => act('assign', { d: +b.dataset.ch, v: b.dataset.assign })));
  body.querySelector('[data-g=xf]')?.addEventListener('input', (e) => act('xf', { v: +e.target.value }));
  body.querySelector('[data-g=master]')?.addEventListener('input', (e) => act('master', { v: +e.target.value }));
  body.querySelector('[data-g=cuemix]')?.addEventListener('input', (e) => { mix.cueMix = +e.target.value; cueMix.gain.setTargetAtTime(mix.cueMix, ctx.currentTime, 0.02); });
  const outSel = body.querySelector('[data-g=out]');
  if (outSel) {
    navigator.mediaDevices?.enumerateDevices?.().then((devs) => {
      devs.filter((d) => d.kind === 'audiooutput').forEach((d, k) => { const o = document.createElement('option'); o.value = d.deviceId; o.textContent = d.label || `Output ${k + 1}`; if (d.deviceId === cueEl.sinkId) o.selected = true; outSel.appendChild(o); });
    }).catch(() => {});
    outSel.addEventListener('change', async () => {
      if (!outSel.value) { cueEl.muted = true; return; }
      try { if (cueEl.setSinkId) await cueEl.setSinkId(outSel.value); cueEl.muted = false; cueEl.play().catch(() => {}); } catch (e) { /* unsupported */ }
    });
  }
  body.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { lib.tab = b.dataset.tab; lib.openList = null; if (['trending', 'underground', 'mixcloud', 'playlists'].includes(lib.tab) || (lib.tab === 'search' && lib.q)) fetchLib(); else ui.render(); }));
  body.querySelector('[data-time]')?.addEventListener('change', (e) => { lib.time = e.target.value; fetchLib(); });
  body.querySelectorAll('[data-mctag]').forEach((b) => b.addEventListener('click', () => { lib.mcTag = b.dataset.mctag; lib.q = ''; fetchLib(); }));
  body.querySelectorAll('[data-pl]').forEach((b) => b.addEventListener('click', () => { lib.openList = lib.playlists[+b.dataset.pl]; fetchLib(); }));
  body.querySelector('[data-a=back]')?.addEventListener('click', () => { lib.openList = null; ui.render(); });
  body.querySelector('[data-a=more]')?.addEventListener('click', () => fetchLib(true));
  body.querySelectorAll('[data-mc]').forEach((b) => b.addEventListener('click', () => { const t = lib.mcResults[+b.dataset.mc]; if (!t) return; if (mc.key === t.id && mc.playing) act('mc', {}); else act('mc', { track: { kind: 'mixcloud', id: t.id, title: t.title } }); }));
  body.querySelector('[data-genre]')?.addEventListener('change', (e) => { lib.genre = e.target.value; fetchLib(); });
  const q = body.querySelector('[data-q]');
  if (q) { q.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { lib.q = q.value; fetchLib(); } }); }
  body.querySelector('[data-a=search]')?.addEventListener('click', () => { lib.q = q.value; fetchLib(); });
  body.querySelector('[data-files]')?.addEventListener('change', (e) => addFiles(e.target.files));
  body.querySelectorAll('[data-load]').forEach((b) => b.addEventListener('click', () => { const t = listNow()[+b.dataset.n]; if (t) loadTo(+b.dataset.load, t); }));
  body.querySelectorAll('[data-qadd]').forEach((b) => b.addEventListener('click', () => { const t = listNow()[+b.dataset.qadd]; if (t) lib.queue.push(t); ui.render(); }));
  body.querySelectorAll('[data-qrm]').forEach((b) => b.addEventListener('click', () => { lib.queue.splice(+b.dataset.qrm, 1); ui.render(); }));
  body.querySelectorAll('[data-qup]').forEach((b) => b.addEventListener('click', () => { const n = +b.dataset.qup; if (n > 0) { const [t] = lib.queue.splice(n, 1); lib.queue.splice(n - 1, 0, t); } ui.render(); }));
}
function loadTo(di, t) {
  if (role === 'codj') {
    if (t.kind !== 'audius') { toast('Only Audius tracks can be shared on the decks — your own files stay on your device'); return; }
    act('load', { d: di, track: { kind: 'audius', id: t.id, title: t.title, artist: t.artist, bpm: t.bpm, duration: t.duration, art: t.art } });
  } else { decks[di].load(t); broadcastSoon(); }
}
// light per-frame refresh: waveforms, times, VU (no full re-render)
function updateLive() {
  if (!ov) return;
  decks.forEach((d, i) => {
    const el = ov.querySelector(`[data-deck="${i}"]`); if (!el) return;
    const tm = el.querySelector('[data-time]'); if (tm) tm.textContent = `${fmtT(d.pos)} / -${fmtT(Math.max(0, d.dur - d.pos))}`;
    const bp = el.querySelector('[data-bpm]'); if (bp) bp.textContent = d.bpm ? d.effBpm.toFixed(1) : '—';
    const wf = el.querySelector('[data-wf]'); if (wf) drawWave(wf, d, ['#35e0ff', '#ff4fd8', '#ffd23f', '#3dff8a'][i]);
    const vu = ov.querySelector(`[data-vu="${i}"]`); if (vu) vu.style.height = `${Math.min(100, d.level() * 140)}%`;
  });
}
function drawWave(cv, d, col) {
  const c = cv.getContext('2d'), W = cv.width, H = cv.height;
  c.fillStyle = '#05060b'; c.fillRect(0, 0, W, H);
  if (d.peaks) {
    const p = d.peaks, n = p.length, at = d.dur ? d.pos / d.dur : 0;
    for (let x = 0; x < W; x++) { const v = p[Math.floor(x / W * n)] * H * 0.48; c.fillStyle = x / W < at ? col + '66' : col; c.fillRect(x, H / 2 - v, 1, v * 2); }
  } else if (d.track) { c.fillStyle = '#8792ab'; c.font = '11px system-ui'; c.fillText('analysing waveform…', 8, H / 2 + 4); }
  if (d.dur) {
    const X = (t) => t / d.dur * W;
    if (d.bpm && d.dur) { c.fillStyle = 'rgba(255,255,255,.08)'; const bl = 60 / d.bpm * 16; for (let t = d.grid; t < d.dur; t += bl) c.fillRect(X(t), 0, 1, H); }
    if (d.loop) { c.fillStyle = 'rgba(61,255,138,.18)'; c.fillRect(X(d.loop.start), 0, Math.max(2, X(d.loop.end) - X(d.loop.start)), H); }
    c.fillStyle = '#f59e0b'; c.fillRect(X(d.cuePoint), 0, 2, H);
    d.hot.forEach((h, k) => { if (h != null) { c.fillStyle = '#ffffff'; c.fillRect(X(h), 0, 2, 8); c.font = 'bold 9px system-ui'; c.fillText(k + 1, X(h) + 3, 8); } });
    c.fillStyle = '#ffffff'; c.fillRect(X(d.pos), 0, 2, H);
  }
}
function openDJ() {
  audio(); ctx.resume();
  if (!document.getElementById('mg-dj-css')) { const st = document.createElement('style'); st.id = 'mg-dj-css'; st.textContent = CSS; document.head.appendChild(st); }
  ov?.remove();
  ov = document.createElement('div'); ov.id = 'mg-dj';
  ov.innerHTML = `<div class="bar"><b style="font-size:15px;letter-spacing:.08em">🎛 DJ BOOTH</b><span id="dj-status"></span><span style="flex:1"></span>
    <span id="dj-lights"></span><button id="dj-midi" title="MIDI-learn: tap this, touch a control, then move a knob / hit a pad on your controller">🎛 MIDI</button><button id="dj-ext" title="Play Serato / Traktor / rekordbox (or any audio input) to the room">🎚 Serato / line-in</button><button id="dj-live" class="on">Go live</button><button id="dj-x">✕ Close</button></div><div id="dj-body"></div>`;
  document.body.appendChild(ov);
  ov.querySelector('#dj-x').onclick = closeDJ;
  ov.querySelector('#dj-ext').onclick = () => { if (window.MGSTAGE) window.MGSTAGE.open('booth'); else toast('Stage module still loading — try again'); };
  ov.querySelector('#dj-midi').onclick = () => {
    if (!window.MGJAM?.connectMidi) return toast('MIDI not ready yet');
    window.MGJAM.connectMidi(); learn = !learn; learnSel = null; midiBtn();
  };
  ov.addEventListener('pointerdown', (e) => {          // MIDI-learn: pick the control to map
    if (!learn) return;
    const el = e.target.closest?.('#dj-body input[type=range], #dj-body button'); if (!el) return;
    e.preventDefault(); e.stopPropagation(); learnSel = selOf(el); midiBtn();
  }, true);
  midiBtn();
  ov.querySelector('#dj-live').onclick = () => {
    if (role === 'codj') { leaveDecks(); return; }
    const rr = remoteDJ();
    if (role !== 'dj' && rr && rr.dj.co) { joinDecks(rr); return; }
    if (role === 'dj') { stopDJ(); try { window.MGSKIN?.setMyLook?.({ emote: null }); } catch (e) { /* */ } }
    else { role = 'dj'; broadcast(); try { window.MGSKIN?.setMyLook?.({ emote: 'groove' }); } catch (e) { /* */ } }
    ui.render();
  };
  if (!lib.results.length) fetchLib(); else ui.render();
  try { document.exitPointerLock?.(); } catch (e) { /* */ }
}
function closeDJ() { ov?.remove(); ov = null; }   // the set keeps playing when the booth UI is closed
window.addEventListener('keydown', (e) => {
  if (!ov) return;
  if (e.key === 'Escape') { closeDJ(); e.stopImmediatePropagation(); return; }
  if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'search') return;
  e.stopImmediatePropagation();          // keep the lab from walking while you mix
}, true);

// ───────────────────────────────────────────────────────────── 3D: booth + floor ──
const root = new THREE.Group(); root.visible = false;
let platters = [], tiles = null, tileColor = new THREE.Color(), beams = [], screenTex = null, screenCv = null, boothHit = null;
function std(c, r = 0.5, e = 0, ei = 1, m = 0.2) { const mm = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m }); if (e) { mm.emissive = new THREE.Color(e); mm.emissiveIntensity = ei; } return mm; }
function build() {
  const scene = MG().scene;
  const deskH = 1.0 * UPS, deskW = 4.6, deskD = 0.9 * UPS * 0.7;
  const desk = new THREE.Mesh(new THREE.BoxGeometry(deskW, deskH, deskD), std(0x0c0d14, 0.4, 0, 1, 0.6));
  desk.position.set(LX, deskH / 2, BOOTH_Z - deskD / 2); root.add(desk); boothHit = desk;
  const front = new THREE.Mesh(new THREE.PlaneGeometry(deskW - 0.2, deskH - 0.3), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  front.position.set(LX, deskH / 2, BOOTH_Z + 0.005); root.add(front); front.userData.front = true;
  root.userData.front = front;
  // four decks (platters spin while playing) + mixer in the middle
  const xs = [-1.75, -0.95, 0.95, 1.75];
  xs.forEach((x, k) => {
    const unit = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.8), std(0x1b1d29, 0.4, 0, 1, 0.5)); unit.position.set(LX + x, deskH + 0.04, BOOTH_Z - deskD / 2); root.add(unit);
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.03, 40), std(0x111111, 0.3, ['#35e0ff', '#ff4fd8', '#ffd23f', '#3dff8a'][k], 0.25, 0.7));
    pl.position.set(LX + x, deskH + 0.1, BOOTH_Z - deskD / 2 + 0.05); root.add(pl);
    const mark = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.035, 0.24), new THREE.MeshBasicMaterial({ color: 0xffffff })); mark.position.set(0, 0.005, 0.12); pl.add(mark);
    platters.push(pl);
  });
  const mixer = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.8), std(0x14151f, 0.4, 0, 1, 0.5)); mixer.position.set(LX, deskH + 0.05, BOOTH_Z - deskD / 2); root.add(mixer);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { const k = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 10), std(0x222222, 0.3, ['#35e0ff', '#ff4fd8', '#ffd23f', '#3dff8a'][c], 0.6)); k.position.set(LX - 0.3 + c * 0.2, deskH + 0.12, BOOTH_Z - deskD / 2 - 0.25 + r * 0.14); root.add(k); }
  // speaker stacks
  [-3.2, 3.2].forEach((x) => {
    for (let s = 0; s < 2; s++) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.3, 1.0), std(0x0a0a0f, 0.7)); box.position.set(LX + x, 0.65 + s * 1.32, BOOTH_Z - 0.6); root.add(box);
      const cone = new THREE.Mesh(new THREE.CircleGeometry(0.38, 28), std(0x15151c, 0.3, 0x35e0ff, 0.15)); cone.position.set(LX + x, 0.65 + s * 1.32, BOOTH_Z - 0.09); root.add(cone); cone.userData.cone = true;
    }
  });
  // truss + light beams
  const truss = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.18, 0.18), std(0x6b7280, 0.3, 0, 1, 0.9)); truss.position.set(LX, 5.3, BOOTH_Z + 0.5); root.add(truss);
  for (let k = 0; k < 6; k++) {
    const geo = new THREE.ConeGeometry(0.9, 5.2, 24, 1, true); geo.translate(0, -2.6, 0);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const b = new THREE.Mesh(geo, mat); b.position.set(LX - 3.6 + k * 1.44, 5.25, BOOTH_Z + 0.5); root.add(b); beams.push(b);
  }
  // "now playing" marquee above the booth
  screenCv = document.createElement('canvas'); screenCv.width = 1024; screenCv.height = 128;
  screenTex = new THREE.CanvasTexture(screenCv); screenTex.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 0.8), new THREE.MeshBasicMaterial({ map: screenTex, transparent: true }));
  sign.position.set(LX, 4.55, BOOTH_Z + 0.52); root.add(sign);
  // dance floor: instanced LED tiles
  const nx = 6, nz = 5, tw = (FLOOR.x1 - FLOOR.x0) / nx, td = (FLOOR.z1 - FLOOR.z0) / nz;
  tiles = new THREE.InstancedMesh(new THREE.BoxGeometry(tw * 0.94, 0.05, td * 0.94), new THREE.MeshBasicMaterial({ color: 0xffffff }), nx * nz);
  const m4 = new THREE.Matrix4(); let n = 0;
  for (let ix = 0; ix < nx; ix++) for (let iz = 0; iz < nz; iz++) { m4.makeTranslation(FLOOR.x0 + tw * (ix + 0.5), 0.06, FLOOR.z0 + td * (iz + 0.5)); tiles.setMatrixAt(n, m4); tiles.setColorAt(n, new THREE.Color(0x111122)); tiles.userData[n] = [ix, iz]; n++; }
  tiles.userData.nx = nx; tiles.userData.nz = nz;
  root.add(tiles);
  const ring = new THREE.Mesh(new THREE.BoxGeometry(FLOOR.x1 - FLOOR.x0 + 0.2, 0.04, FLOOR.z1 - FLOOR.z0 + 0.2), new THREE.MeshBasicMaterial({ color: 0x0a0a12 }));
  ring.position.set((FLOOR.x0 + FLOOR.x1) / 2, 0.04, (FLOOR.z0 + FLOOR.z1) / 2); root.add(ring);
  scene.add(root);
  buildClub();
  root.traverse((o) => { if (o.isMesh && o.material && o.material.isMeshBasicMaterial) o.material.toneMapped = false; });
}
function drawMarquee(text, beat) {
  const c = screenCv.getContext('2d');
  c.clearRect(0, 0, 1024, 128); c.fillStyle = 'rgba(5,6,12,.88)'; c.beginPath(); c.roundRect(4, 8, 1016, 112, 20); c.fill();
  c.strokeStyle = `rgba(255,79,216,${0.4 + beat * 0.6})`; c.lineWidth = 4; c.stroke();
  c.fillStyle = '#e6ebf5'; c.font = 'bold 46px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 512, 66);
  screenTex.needsUpdate = true;
}


// ───────────────────────────────────────────────────────────── club lighting ──
// 💡 HOUSE or 🌈 CLUB (+ ⚡ strobe). Club dims every lounge light and the reflection
// lighting, then sweeps coloured floor lights, beams and lasers on the beat. It comes
// on by itself when someone is live; whoever sets it shares it with the room (look.lights).
const L = { mode: null, strobe: true, level: 1, club: 0, list: null, flash: 0, exp: null };
let clubLights = [], strobeLight = null, lasers = [];
function buildClub() {
  const cx = (FLOOR.x0 + FLOOR.x1) / 2, cz = (FLOOR.z0 + FLOOR.z1) / 2;
  for (let k = 0; k < 2; k++) { const l = new THREE.PointLight(0xff00aa, 0, 18, 1.4); l.position.set(cx + (k ? 3 : -3), 4.6, cz); root.add(l); clubLights.push(l); }
  strobeLight = new THREE.PointLight(0xffffff, 0, 26, 1.2); strobeLight.position.set(cx, 5.4, cz - 1); root.add(strobeLight);
  for (let k = 0; k < 8; k++) {
    const geo = new THREE.CylinderGeometry(0.012, 0.012, 22, 4, 1, true); geo.translate(0, -11, 0);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.position.set(LX - 2.8 + k * 0.8, 5.2, BOOTH_Z + 0.5); root.add(m); lasers.push(m);
  }
}
function lightsOf() {
  // every light in the lounge region except our own club rig; remember base intensities
  if (L.list && L.list.length) return L.list;
  const own = new Set([...clubLights, strobeLight]);
  const v = new THREE.Vector3(); L.list = [];
  MG().scene.traverse((o) => { if (o.isLight && !own.has(o)) { o.getWorldPosition(v); if (v.z < LZ + 40) { o.userData.baseI = o.userData.baseI ?? o.intensity; L.list.push(o); } } });
  return L.list;
}
function sharedLights() {
  let best = null;
  for (const p of peers()) { const lt = p.look?.lights; if (lt && (!best || lt.at > best.at)) best = lt; }
  const mine = window.MGSKIN?.myLook?.().lights; if (mine && (!best || mine.at > best.at)) best = mine;
  return best;
}
function setLights(mode, strobe) {
  L.mode = mode; if (strobe != null) L.strobe = strobe;
  try { window.MGSKIN?.setMyLook?.({ lights: { m: mode, sb: L.strobe ? 1 : 0, at: Date.now() } }); } catch (e) { /* offline */ }
  ui.render();
}
function lightsTick(dt, t, beat) {
  const sh = sharedLights();
  const live = anyPlaying();
  const mode = sh ? sh.m : (live ? 'club' : 'house');
  const strobe = sh ? !!sh.sb : L.strobe;
  L.club += ((mode === 'club' ? 1 : 0) - L.club) * Math.min(1, dt * 1.8);
  const level = 1 - L.club * 0.85;
  if (Math.abs(level - L.level) > 0.002 || L.club > 0.01) {
    L.level = level;
    for (const l of lightsOf()) l.intensity = l.userData.baseI * level;
    const sc = MG().scene; if ('environmentIntensity' in sc) sc.environmentIntensity = 0.12 + 0.88 * level;
    const r = MG().renderer; if (r) { if (L.exp == null) L.exp = r.toneMappingExposure; r.toneMappingExposure = L.exp * (1 - L.club * 0.55); }
  }
  const c = L.club;
  clubLights.forEach((l, k) => { l.color.setHSL((t * 0.07 + k * 0.5) % 1, 1, 0.5); l.intensity = c * (live ? 2.2 + beat * 5 : 1.4); l.position.x = LX + Math.sin(t * 0.7 + k * Math.PI) * 3.2; });
  if (strobe && live && c > 0.5 && beat > 0.92 && L.flash <= 0) L.flash = 0.05;
  L.flash -= dt; strobeLight.intensity = L.flash > 0 ? 9 * c : 0;
  lasers.forEach((m, k) => { m.material.opacity = c * (live ? 0.35 + beat * 0.4 : 0.12); m.material.color.setHSL((t * 0.1 + k / 8) % 1, 1, 0.55); m.rotation.z = Math.sin(t * 1.3 + k * 0.6) * 1.1; m.rotation.x = 1.05 + Math.cos(t * 0.9 + k) * 0.25; });
  return c;
}

// ── beat clock: from the loudest playing deck's grid, else from the analyser ──
let beatPhase = 0, energy = 0, bassAvg = 0, lastBeatAt = 0, beatOn = 0;
const fbuf = new Uint8Array(512);
function updateBeat(now) {
  const lead = decks.filter((d) => d.playing && d.bpm).sort((a, b) => b.state.vol - a.state.vol)[0];
  if (analyser) { analyser.getByteFrequencyData(fbuf); let b = 0; for (let i = 1; i < 10; i++) b += fbuf[i]; b /= 9 * 255; let all = 0; for (let i = 0; i < 200; i++) all += fbuf[i]; energy = all / (200 * 255); bassAvg = bassAvg * 0.95 + b * 0.05; if (!lead && b > bassAvg * 1.35 && b > 0.25 && now - lastBeatAt > 280) { lastBeatAt = now; beatOn = 1; } }
  if (!lead && (mc.playing || window.MGSTAGE?.live?.())) { const ph = ((Date.now() / 1000) * (122 / 60)) % 1; beatPhase = ph; beatOn = Math.pow(1 - ph, 3); return; }
  if (lead) { const bl = 60 / lead.effBpm; const ph = (((lead.pos - lead.grid) / (60 / lead.bpm)) % 1 + 1) % 1; void bl; beatPhase = ph; beatOn = Math.pow(1 - ph, 3); }
  else beatOn *= 0.86;
}
const anyPlaying = () => decks.some((d) => d.playing) || mc.playing || !!window.MGSTAGE?.live?.();

// ── dance mode (third person) ──────────────────────────────────────────────────
const MOVES = [['groove', '🕺 Groove'], ['shake', '🙌 Shake'], ['cheer', '🎉 Cheer'], ['cheer2', '🔥 Hype'], ['cheer3', '⚡ Jump'], ['clap', '👏 Clap'], ['wave', '👋 Wave'], ['strut', '😎 Strut']];
let danceBar = null, dancing = null, me = null, saved = null;
function onFloor() { const c = MG().cam.position; return c.x > FLOOR.x0 - 0.5 && c.x < FLOOR.x1 + 0.5 && c.z > FLOOR.z0 - 0.5 && c.z < FLOOR.z1 + 1.5; }
function startDance(move) {
  const look = window.MGSKIN?.myLook?.() || {};
  if (!look.skin) { window.MGSKIN?.setMyLook?.({ skin: 'Male_Adult_01' }); toast('Pick your look any time with 👕 SKIN'); }
  const lk = window.MGSKIN.myLook();
  window.MGSKIN.setMyLook({ emote: move });
  const cam = MG().cam, ctl = MG().controls;
  if (!dancing) {
    try { window.MGFP?.exit?.(false); if (window.MGFP) window.MGFP.auto = false; } catch (e) { /* */ }
    saved = { pos: cam.position.clone(), tgt: ctl.target.clone() };
    const d = new THREE.Vector3(); cam.getWorldDirection(d); d.y = 0; d.normalize();
    const at = new THREE.Vector3(cam.position.x, 0, cam.position.z);
    me = window.MGSKIN.avatar({ ...lk, emote: move });
    me.position.copy(at); me.rotation.y = Math.atan2(-d.x, -d.z) + Math.PI;   // face the way you were looking
    MG().scene.add(me);
    // swing the camera round in front so you watch yourself (orbit freely)
    cam.position.set(at.x + d.x * 5.2, 3.4, at.z + d.z * 5.2);
    ctl.target.set(at.x, 1.9, at.z); ctl.update?.();
  }
  dancing = move; renderDanceBar();
}
function stopDance() {
  if (!dancing) return;
  dancing = null; window.MGSKIN?.setMyLook?.({ emote: null });
  if (me) { MG().scene.remove(me); me = null; }
  if (saved) { MG().cam.position.copy(saved.pos); MG().controls.target.copy(saved.tgt); MG().controls.update?.(); saved = null; }
  try { if (window.MGFP) window.MGFP.auto = true; } catch (e) { /* */ }
  renderDanceBar();
}
function renderDanceBar() {
  if (!danceBar) return;
  danceBar.innerHTML = `<span style="font-weight:800;margin-right:4px">💃 DANCE</span>${MOVES.map(([id, label]) => `<button data-mv="${id}" style="background:${dancing === id ? '#ff4fd8' : '#161b2b'};border:1px solid #2a3350;color:#fff;border-radius:10px;padding:7px 10px;font-weight:700;cursor:pointer">${label}</button>`).join('')}${dancing ? '<button data-mv="stop" style="background:#3a1220;border:1px solid #a33a4a;color:#fff;border-radius:10px;padding:7px 10px;font-weight:700;cursor:pointer">■ Stop</button>' : ''}`;
  danceBar.querySelectorAll('[data-mv]').forEach((b) => b.addEventListener('click', () => (b.dataset.mv === 'stop' ? stopDance() : startDance(b.dataset.mv))));
}
function toast(t) { const el = document.createElement('div'); el.textContent = t; el.style.cssText = 'position:fixed;left:50%;top:90px;transform:translateX(-50%);z-index:2147483001;background:rgba(8,10,18,.92);border:1px solid #2a3350;color:#e6ebf5;padding:8px 14px;border-radius:12px;font:14px system-ui'; document.body.appendChild(el); setTimeout(() => el.remove(), 2600); }


// ───────────────────────────────────────── live everywhere: pill + mute + unlock ──
// Whoever is in the game hears the live set (DJ decks, Mixcloud, Serato/line-in, music desk).
// The pill shows what's on, lets anyone mute it, and unlocks audio on browsers that need a tap.
const OUTSIDE = 0.7;
const liveMuted = () => { try { return localStorage.getItem('mgLiveMute') === '1'; } catch (e) { return false; } };
function setLiveMuted(v) {
  try { localStorage.setItem('mgLiveMute', v ? '1' : '0'); } catch (e) { /* */ }
  if (mc.widget) (v ? mc.widget.pause() : mc.widget.play()).catch?.(() => {});
}
function unlockAudio() {
  try { if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {}); } catch (e) { /* */ }
  try { window.MGSTAGE?._resume?.(); } catch (e) { /* */ }
}
['pointerdown', 'keydown', 'touchend'].forEach((ev) => window.addEventListener(ev, unlockAudio, { capture: true, passive: true }));
let pill = null, pillKey = '';
function livePill() {
  const st = window.MGSTAGE?._state?.(), stageOn = !!(st && st.listen && st.listen.from);
  const rdj = role === 'dj' ? null : remoteDJ();
  const on = role !== 'dj' && !(st && st.live && st.live.on) && (stageOn || !!rdj);
  if (!on) { if (pill) pill.style.display = 'none'; pillKey = ''; return; }
  if (!pill) {
    pill = document.createElement('div'); pill.id = 'mg-livepill';
    pill.style.cssText = 'position:fixed;left:50%;bottom:62px;transform:translateX(-50%);z-index:2147482990;display:flex;gap:8px;align-items:center;background:rgba(8,10,18,.88);border:1px solid #ff4fd8;color:#fff;padding:6px 8px 6px 12px;border-radius:999px;font:600 13px system-ui;max-width:min(92vw,520px);box-shadow:0 0 18px #ff4fd855';
    pill.addEventListener('click', (e) => {
      const b = e.target.closest('[data-lp]'); if (!b) return; e.stopPropagation();
      if (b.dataset.lp === 'mute') setLiveMuted(!liveMuted()); else unlockAudio();
      pillKey = '';
    });
    document.body.appendChild(pill);
  }
  const blocked = (ctx && ctx.state !== 'running') || (window.MGSTAGE?._blocked?.() || false);
  const name = stageOn ? st.listen.label : (rdj.name + (decks.find((d) => d.playing)?.track?.title ? ' · ' + decks.find((d) => d.playing).track.title : mc.key ? ' · Mixcloud' : ''));
  const muted = liveMuted();
  const key = [name, muted, blocked].join('|'); if (key === pillKey) { pill.style.display = 'flex'; return; }
  pillKey = key;
  pill.innerHTML = `<span style="color:#ff4fd8">● LIVE</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(name)}</span>`
    + (blocked && !muted ? '<button data-lp="unlock" style="background:#ffd23f;color:#111;border:0;border-radius:999px;padding:5px 10px;font-weight:800;cursor:pointer">🔊 Tap to listen</button>' : '')
    + `<button data-lp="mute" style="background:#161b2b;color:#fff;border:1px solid #2a3350;border-radius:999px;padding:5px 10px;font-weight:700;cursor:pointer">${muted ? '🔇 Unmute' : '🔊 Mute'}</button>`;
  pill.style.display = 'flex';
}

// ───────────────────────────────────────────────────────────── per frame ──
const ray = new THREE.Raycaster();
let prompt = null, lastMarquee = 0, ducked = false;
// Room sync runs on a timer, not rAF: background tabs keep broadcasting / following.
setInterval(() => {
  if (!MG()?.cam) return;
  const vis = !!inLoungeNow();
  const r = role === 'dj' ? null : remoteDJ();
  if (role === 'codj') {
    if (r && r.id === hostId && r.dj.co) { follow(r); try { window.MGSKIN?.setMyLook?.({ djco: { h: hostId, at: Date.now() } }); } catch (e) { /* */ } }
    else { leaveDecks(); decks.forEach((d) => d.el.pause()); if (mc.key) mcRemove(); }
  } else if (r && !liveMuted()) { role = 'listen'; follow(r); }   // the set plays for everyone in the game, not just the lounge
  else if (role === 'listen') { role = 'idle'; decks.forEach((d) => d.el.pause()); if (mc.key) mcRemove(); }
  if (role === 'dj' && Date.now() - lastSent > 450) broadcast();
}, 500);
const inLoungeNow = () => { const c = MG()?.cam; return c && c.position.z < LZ + 40; };
function onDown(ev) {
  if (!boothHit || !inLoungeNow() || document.querySelector('#mg-dj,#mg-bar,#mg-casino,#mg-arcade,#mg-skins')) return;
  const canvas = MG().controls.domElement, r = canvas.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1), MG().cam);
  if (ray.intersectObject(boothHit, false).length) { ev.stopImmediatePropagation(); ev.preventDefault(); openDJ(); }
}
let lastT = performance.now();
function tick(now) {
  requestAnimationFrame(tick);
  const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
  const vis = !!inLoungeNow();
  root.visible = vis;
  // room volume falls off away from the booth; the rest of the game hears it a bit lower
  if (master && role !== 'dj') {
    const c = MG().cam.position, dist = Math.hypot(c.x - LX, c.z - BOOTH_Z);
    master.gain.setTargetAtTime(liveMuted() ? 0 : (vis ? clamp(1.15 - dist / 26, 0.2, 1) : OUTSIDE) * (mix.master || 0.9), ctx.currentTime, 0.2);
  }
  // duck the game's own soundtrack while a set is playing
  const AU = MG()?.AU;
  const wantDuck = anyPlaying() && !liveMuted();
  if (AU?.musG && wantDuck !== ducked) { ducked = wantDuck; AU.musG.gain.setTargetAtTime(ducked ? 0 : 0.17, AU.ctx.currentTime, 0.6); }
  if (mc.iframe) mc.iframe.style.display = vis || ov ? 'block' : 'none';
  livePill();
  if (!vis && L.level < 0.999) { L.level = 1; L.club = 0; for (const l of lightsOf()) l.intensity = l.userData.baseI; if ('environmentIntensity' in MG().scene) MG().scene.environmentIntensity = 1; if (L.exp != null && MG().renderer) MG().renderer.toneMappingExposure = L.exp; }
  if (!vis) { if (prompt) prompt.style.display = 'none'; if (danceBar) danceBar.style.display = 'none'; if (dancing) stopDance(); return; }
  updateBeat(now);
  if (ov) updateLive();
  // booth + floor visuals
  decks.forEach((d, k) => { if (platters[k] && d.playing) platters[k].rotation.y -= dt * 3.49 * d.rate; });
  const beat = beatOn, t = now / 1000;
  if (tiles) {
    const nx = tiles.userData.nx, nz = tiles.userData.nz, live = anyPlaying();
    for (let n = 0; n < nx * nz; n++) {
      const [ix, iz] = tiles.userData[n];
      if (!live) { tileColor.setHSL((t * 0.03 + (ix + iz) * 0.05) % 1, 0.6, 0.06 + 0.03 * Math.sin(t + ix)); }
      else {
        const wave = 0.5 + 0.5 * Math.sin(t * 2 + ix * 0.9 - iz * 0.7);
        const hue = (t * 0.08 + ix * 0.07 + iz * 0.05) % 1;
        tileColor.setHSL(hue, 0.95, clamp(0.08 + beat * 0.45 * wave + energy * 0.25, 0.04, 0.62));
      }
      tiles.setColorAt(n, tileColor);
    }
    tiles.instanceColor.needsUpdate = true;
  }
  const clubAmt = lightsTick(dt, t, beat);
  beams.forEach((b, k) => {
    b.rotation.z = Math.sin(t * 0.6 + k) * 0.55; b.rotation.x = 0.25 + Math.cos(t * 0.45 + k * 1.3) * 0.35;
    b.material.color.setHSL((t * 0.05 + k / 6) % 1, 1, 0.55); b.material.opacity = (anyPlaying() ? 0.06 + beat * 0.16 : 0.03) * (1 + clubAmt * 2.2);
  });
  const front = root.userData.front; if (front) front.material.color.setHSL((t * 0.04) % 1, 0.9, anyPlaying() ? 0.18 + beat * 0.3 : 0.08);
  if (screenCv && now - lastMarquee > 120) {
    lastMarquee = now;
    const lead = decks.filter((d) => d.playing).sort((a, b) => b.state.vol - a.state.vol)[0];
    const rdj = role === 'listen' ? remoteDJ() : null;
    const stg = window.MGSTAGE?.live?.();
    drawMarquee(lead ? `♪ ${lead.track.title}${rdj ? '  ·  DJ ' + rdj.name : ''}` : mc.playing ? `☁ ${mc.title}${rdj ? '  ·  DJ ' + rdj.name : ''}` : stg ? `🔴 LIVE · ${stg}` : role === 'dj' ? 'DJ booth · live' : '🎛 DJ BOOTH · tap to spin', beat);
  }
  if (me) { me.userData.update?.({ look: { ...(window.MGSKIN?.myLook?.() || {}), emote: dancing }, sit: false }); }
  // prompts
  const c = MG().cam.position;
  const nearBooth = Math.hypot(c.x - LX, c.z - BOOTH_Z) < 6 && !onFloor();
  if (prompt) { prompt.style.display = nearBooth && !ov ? 'block' : 'none'; }
  if (danceBar) { const show = (onFloor() || dancing) && !ov; danceBar.style.display = show ? 'flex' : 'none'; }
}

(function boot(t = 0) {
  if (MG() && MG().scene && MG().controls && MG().cam) {
    build();
    MG().controls.domElement.addEventListener('pointerdown', onDown, true);
    prompt = document.createElement('div');
    prompt.textContent = '🎛 tap the DJ booth to spin';
    prompt.style.cssText = 'position:fixed;left:50%;bottom:190px;transform:translateX(-50%);z-index:30;background:rgba(8,10,18,.88);border:1px solid #2a3350;border-radius:12px;padding:8px 14px;color:#e6ebf5;font:13px system-ui;display:none;pointer-events:none';
    document.body.appendChild(prompt);
    danceBar = document.createElement('div');
    danceBar.style.cssText = 'position:fixed;left:50%;bottom:150px;transform:translateX(-50%);z-index:31;display:none;gap:6px;flex-wrap:wrap;justify-content:center;align-items:center;max-width:96vw;background:rgba(8,10,18,.85);border:1px solid #2a3350;border-radius:14px;padding:8px;color:#e6ebf5;font:13px system-ui';
    document.body.appendChild(danceBar); renderDanceBar();
    drawMarquee('🎛 DJ BOOTH · tap to spin', 0);
    window.MGDJ = { midiLearn, onSignal, standAt, join: joinDecks, leave: leaveDecks, lights: setLights, _L: L, _mc: { play: mcPlay, stop: mcStop, state: () => ({ key: mc.key, playing: mc.playing, pos: mc.pos, widget: !!mc.widget }) }, open: openDJ, close: closeDJ, decks: () => decks, beat: () => beatOn, bounce: () => (anyPlaying() ? beatOn : 0), role: () => role, dance: startDance, stopDance, _lib: lib, _fetch: fetchLib };
    requestAnimationFrame(tick);
  } else if (t < 600) setTimeout(() => boot(t + 1), 250);
})();
