/* ================= LOUNGE STAGE: live audio + MUSIC DESK =================
   • Go live from the DJ booth with Serato / Traktor / rekordbox, or from the MUSIC DESK
     with your own MIDI keyboard / controller, and the whole lounge hears it.
   • MUSIC DESK: plug in any MIDI device (Web MIDI). Play the built-in synth, and/or
     forward your MIDI to FL Studio / Ableton / any DAW through a virtual MIDI port
     (loopMIDI on Windows, IAC Driver on Mac). Send the DAW's sound back by picking a
     virtual audio cable (VB-Cable / BlackHole) or your interface as the audio input.
   • Transport: one performer → every listener, high-quality stereo Opus over WebRTC.
     Signalling rides the lounge's existing 'voice' relay with 'stage-*' kinds, so no
     server change; listeners only receive (no mic needed). */
import * as THREE from 'three';

const MG = () => window.MG;
const UPS = 2.25, LX = 0, LZ = -120, LW = 30, LD = 24;
const BOOTH = { x: LX, z: LZ - LD / 2 + 3.4 };
const DESK = { x: LX + LW / 2 - 2.8, z: LZ + 7.2 };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const net = () => window.MGNET;
const myId = () => { try { return net()?.debug?.().id; } catch (e) { return null; } };

// ───────────────────────────────────────────────────────────── audio graph ──
let ctx = null, out = null, dest = null, monitor = null, meter = null, inputNode = null, inputStream = null;
function audio() {
  if (ctx) return ctx;
  ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive', sampleRate: 48000 });
  out = ctx.createGain(); out.gain.value = 1;
  dest = ctx.createMediaStreamDestination(); dest.channelCount = 2;
  monitor = ctx.createGain(); monitor.gain.value = 1;
  meter = ctx.createAnalyser(); meter.fftSize = 512;
  out.connect(dest); out.connect(meter); out.connect(monitor); monitor.connect(ctx.destination);
  synth.init();
  return ctx;
}
async function useInput(deviceId) {
  audio();
  if (inputNode) { inputNode.disconnect(); inputNode = null; }
  if (inputStream) { inputStream.getTracks().forEach((t) => t.stop()); inputStream = null; }
  if (!deviceId) return;
  inputStream = await navigator.mediaDevices.getUserMedia({ audio: {
    deviceId: { exact: deviceId }, echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 2, sampleRate: 48000 } });
  inputNode = ctx.createMediaStreamSource(inputStream);
  inputNode.connect(out);
}

// ───────────────────────────────────────────────────────────── synth ──
const synth = {
  p: { wave: 'sawtooth', a: 0.01, d: 0.25, s: 0.6, r: 0.35, cut: 2400, res: 4, vol: 0.5, oct: 0, detune: 10, voices: 2 },
  bus: null, filt: null, voices: new Map(), on: true,
  init() {
    this.filt = ctx.createBiquadFilter(); this.filt.type = 'lowpass';
    this.bus = ctx.createGain();
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4;
    const dly = ctx.createDelay(1); dly.delayTime.value = 0.28; const fb = ctx.createGain(); fb.gain.value = 0.25; const wet = ctx.createGain(); wet.gain.value = 0.18;
    this.filt.connect(this.bus); this.bus.connect(comp); comp.connect(out);
    this.bus.connect(dly); dly.connect(fb); fb.connect(dly); dly.connect(wet); wet.connect(comp);
    this.apply();
  },
  apply() { if (!this.filt) return; this.filt.frequency.value = this.p.cut; this.filt.Q.value = this.p.res; this.bus.gain.value = this.p.vol; },
  noteOn(n, vel = 100) {
    if (!this.on) return; audio(); if (ctx.state === 'suspended') ctx.resume();
    this.noteOff(n, true);
    const t = ctx.currentTime, f = 440 * Math.pow(2, (n + this.p.oct * 12 - 69) / 12), g = ctx.createGain();
    const oscs = [];
    const count = this.p.wave === 'supersaw' ? 5 : this.p.voices;
    for (let i = 0; i < count; i++) {
      const o = ctx.createOscillator(); o.type = this.p.wave === 'supersaw' ? 'sawtooth' : this.p.wave;
      o.frequency.value = f; o.detune.value = (i - (count - 1) / 2) * (this.p.wave === 'supersaw' ? 14 : this.p.detune);
      const pan = ctx.createStereoPanner(); pan.pan.value = count > 1 ? (i / (count - 1)) * 1.2 - 0.6 : 0;
      o.connect(pan); pan.connect(g); o.start(t); oscs.push(o);
    }
    const peak = (vel / 127) * 0.9 / Math.sqrt(count);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + this.p.a);
    g.gain.linearRampToValueAtTime(peak * this.p.s, t + this.p.a + this.p.d);
    g.connect(this.filt);
    this.voices.set(n, { g, oscs });
    keyLight(n, true);
  },
  noteOff(n, hard) {
    const v = this.voices.get(n); if (!v) return; this.voices.delete(n);
    const t = ctx.currentTime, r = hard ? 0.01 : this.p.r;
    v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(v.g.gain.value, t); v.g.gain.linearRampToValueAtTime(0, t + r);
    v.oscs.forEach((o) => o.stop(t + r + 0.02));
    keyLight(n, false);
  },
  allOff() { [...this.voices.keys()].forEach((n) => this.noteOff(n, true)); },
};

// ───────────────────────────────────────────────────────────── MIDI ──
const midi = { access: null, inputs: [], outputs: [], enabledIn: new Set(), outId: '', lastMsg: 0, err: '' };
async function midiConnect() {
  if (!navigator.requestMIDIAccess) { midi.err = 'This browser has no Web MIDI. Use Chrome or Edge (desktop or Android).'; render(); return; }
  try {
    midi.access = await navigator.requestMIDIAccess({ sysex: false });
    midi.access.onstatechange = () => { midiScan(); render(); };
    midiScan(); midi.err = '';
  } catch (e) { midi.err = 'MIDI permission was refused.'; }
  render();
}
function midiScan() {
  midi.inputs = [...midi.access.inputs.values()]; midi.outputs = [...midi.access.outputs.values()];
  for (const i of midi.inputs) { if (!midi.enabledIn.has(i.id) && midi.enabledIn.size === 0) midi.enabledIn.add(i.id); i.onmidimessage = (e) => onMidi(i, e); }
}
function onMidi(input, e) {
  if (!midi.enabledIn.has(input.id)) return;
  const [st, d1 = 0, d2 = 0] = e.data, cmd = st & 0xf0;
  midi.lastMsg = performance.now();
  // MIDI thru to the chosen output (e.g. loopMIDI → FL Studio)
  if (midi.outId) { const o = midi.access.outputs.get(midi.outId); try { o?.send(e.data); } catch (err) { /* port busy */ } }
  if (cmd === 0x90 && d2 > 0) synth.noteOn(d1, d2);
  else if (cmd === 0x80 || (cmd === 0x90 && d2 === 0)) synth.noteOff(d1);
  else if (cmd === 0xb0) {                                  // mod wheel → cutoff, CC74 → cutoff, CC71 → resonance
    if (d1 === 1 || d1 === 74) { synth.p.cut = 200 * Math.pow(2, d2 / 127 * 6.6); synth.apply(); }
    if (d1 === 71) { synth.p.res = 0.5 + d2 / 127 * 18; synth.apply(); }
    if (d1 === 123) synth.allOff();
  }
}

// ───────────────────────────────────────────────── broadcast (one → many) ──
let ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }, iceAt = 0;
async function ice() {
  if (Date.now() - iceAt < 300000) return ICE;
  try { const j = await (await fetch('https://lounge.wattxchange.app/turn', { cache: 'no-store' })).json(); if (j?.iceServers?.length) { ICE = { iceServers: j.iceServers }; iceAt = Date.now(); } } catch (e) { /* STUN fallback */ }
  return ICE;
}
function stereo(sdp) {
  const m = sdp.match(/a=rtpmap:(\d+) opus\/48000\/2/i); if (!m) return sdp;
  const pt = m[1];
  return sdp.replace(new RegExp(`a=fmtp:${pt} ([^\\r\\n]*)`), (all, params) => `a=fmtp:${pt} ${params.split(';').filter((x) => !/^(stereo|sprop-stereo|maxaveragebitrate|usedtx)=/.test(x)).concat(['stereo=1', 'sprop-stereo=1', 'maxaveragebitrate=192000', 'usedtx=0']).join(';')}`);
}
const send = (to, kind, data) => { try { net()?.sendObj?.({ t: 'voice', to, kind, data }); } catch (e) { /* offline */ } };
const live = { on: false, where: null, label: '', pcs: new Map() };            // as performer
const listen = { from: null, pc: null, el: null, gain: null, src: null, where: null, label: '', reqAt: 0 };   // as listener
async function goLive(where, label) {
  audio(); if (ctx.state === 'suspended') await ctx.resume();
  Object.assign(live, { on: true, where, label });
  announce();
  render();
}
function endLive() {
  live.on = false; for (const pc of live.pcs.values()) { try { pc.close(); } catch (e) { /* */ } } live.pcs.clear();
  try { window.MGSKIN?.setMyLook?.({ stage: null }); } catch (e) { /* */ }
  render();
}
function announce() { if (live.on) { try { window.MGSKIN?.setMyLook?.({ stage: { w: live.where, l: live.label.slice(0, 40), at: Date.now() } }); } catch (e) { /* */ } } }
async function serve(listenerId) {
  if (!live.on || live.pcs.has(listenerId)) return;
  const pc = new RTCPeerConnection(await ice()); live.pcs.set(listenerId, pc);
  dest.stream.getAudioTracks().forEach((t) => { const s = pc.addTrack(t, dest.stream); try { const p = s.getParameters(); p.encodings = [{ maxBitrate: 192000 }]; s.setParameters(p); } catch (e) { /* */ } });
  pc.onicecandidate = (e) => { if (e.candidate) send(listenerId, 'stage-ice-l', e.candidate); };
  pc.onconnectionstatechange = () => { if (['failed', 'closed'].includes(pc.connectionState)) { live.pcs.delete(listenerId); try { pc.close(); } catch (e) { /* */ } } };
  const offer = await pc.createOffer(); offer.sdp = stereo(offer.sdp); await pc.setLocalDescription(offer);
  send(listenerId, 'stage-offer', pc.localDescription);
}
// ICE candidates can beat the offer/answer (we may still be fetching TURN): hold them until the
// remote description is set, then apply.
const early = new Map();      // key -> [candidates]
const hold = (k, c) => { if (!early.has(k)) early.set(k, []); early.get(k).push(c); };
async function flush(k, pc) { const q = early.get(k) || []; early.delete(k); for (const c of q) { try { await pc.addIceCandidate(c); } catch (e) { /* */ } } }
async function onSignal(from, kind, data) {
  try {
    if (kind === 'stage-req') return serve(from);
    if (kind === 'stage-answer') { const pc = live.pcs.get(from); if (pc) { await pc.setRemoteDescription(data); await flush('p' + from, pc); } return; }
    if (kind === 'stage-ice-p') { const pc = live.pcs.get(from); if (pc && pc.remoteDescription) await pc.addIceCandidate(data); else hold('p' + from, data); return; }   // from a listener to the performer
    if (kind === 'stage-offer') {
      if (listen.from !== from) return;
      closeListen(true);
      const cfg = await ice(); if (listen.from !== from) return;
      const pc = new RTCPeerConnection(cfg); listen.pc = pc;
      pc.onicecandidate = (e) => { if (e.candidate) send(from, 'stage-ice-p', e.candidate); };
      pc.ontrack = (e) => attach(e.streams[0]);
      await pc.setRemoteDescription(data); await flush('l' + from, pc);
      const ans = await pc.createAnswer(); ans.sdp = stereo(ans.sdp); await pc.setLocalDescription(ans);
      send(from, 'stage-answer', pc.localDescription);
      return;
    }
    if (kind === 'stage-ice-l' && listen.from === from) { if (listen.pc && listen.pc.remoteDescription) await listen.pc.addIceCandidate(data); else hold('l' + from, data); }
  } catch (e) { /* renegotiation race — next request retries */ }
}
function attach(stream) {
  audio(); if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  listen.el = new Audio(); listen.el.srcObject = stream; listen.el.muted = true; listen.el.play().catch(() => {});   // Chrome needs an element for remote audio to flow
  listen.src = ctx.createMediaStreamSource(stream); listen.gain = ctx.createGain(); listen.gain.gain.value = 0;
  listen.src.connect(listen.gain); listen.gain.connect(ctx.destination);
}
function closeListen(keepFrom) {
  try { listen.pc?.close(); } catch (e) { /* */ }
  try { listen.src?.disconnect(); listen.gain?.disconnect(); if (listen.el) { listen.el.pause(); listen.el.srcObject = null; } } catch (e) { /* */ }
  Object.assign(listen, { pc: null, el: null, gain: null, src: null });
  if (!keepFrom) Object.assign(listen, { from: null, where: null, label: '' });
}
const inLoungeNow = () => { const c = MG()?.cam; return c && c.position.z < LZ + 40; };
// every second: find a live performer, connect / drop, set distance volume, refresh our announce
setInterval(() => {
  if (!MG()?.cam) return;
  if (live.on) announce();
  const me = myId();
  let perf = null;
  for (const p of (net()?.peerLooks?.() || [])) { const st = p.look?.stage; if (st && p.id !== me && Date.now() - st.at < 10000 && (!perf || st.at > perf.st.at)) perf = { id: p.id, name: p.name, st }; }
  const vis = !!inLoungeNow();
  const muted = (() => { try { return localStorage.getItem('mgLiveMute') === '1'; } catch (e) { return false; } })();
  if (perf && !live.on && !muted) {      // everyone in the game hears it, not just the lounge
    listen.where = perf.st.w; listen.label = `${perf.st.l || 'live'} · ${perf.name}`;
    const healthy = listen.pc && ['connected', 'connecting', 'new'].includes(listen.pc.connectionState);
    if (listen.from !== perf.id || (!healthy && Date.now() - listen.reqAt > 6000)) {
      closeListen(); listen.from = perf.id; listen.where = perf.st.w; listen.label = `${perf.st.l || 'live'} · ${perf.name}`; listen.reqAt = Date.now();
      send(perf.id, 'stage-req', { w: perf.st.w });
    }
  } else if (listen.from) closeListen();
}, 1000);

// ───────────────────────────────────────────────────────────── UI ──
let ov = null, mode = 'desk', devices = [], inputId = '', monitorOn = true, srcSynth = true;
const keyEls = new Map();
function keyLight(n, on) { const el = keyEls.get(n); if (el) el.style.background = on ? '#ff4fd8' : el.dataset.black ? '#111' : '#f5f5f5'; }
const KB = 'awsedftgyhujkolp;';               // two-row piano mapping, C at 'a'
const KB_BASE = 60;
async function listDevices() {
  try {
    if (!devices.length) { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); s.getTracks().forEach((t) => t.stop()); }   // unlocks device names
    devices = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audioinput');
  } catch (e) { devices = []; }
  render();
}
function render() {
  if (!ov) return;
  const body = ov.querySelector('#st-body');
  const isDesk = mode === 'desk';
  const other = listen.from && !live.on ? `<div class="st-note" style="color:#f59e0b">Now live: ${esc(listen.label)} — going live will take over.</div>` : '';
  const devOpts = `<option value="">${isDesk ? 'none (synth only)' : 'choose an input…'}</option>` + devices.map((d) => `<option value="${esc(d.deviceId)}" ${d.deviceId === inputId ? 'selected' : ''}>${esc(d.label || 'Input')}</option>`).join('');
  body.innerHTML = `
    ${other}
    <section><h3>${isDesk ? '🔴 Live to the lounge' : '🎚 Serato / Traktor / rekordbox → the lounge'}</h3>
      <div class="st-row"><label>Audio input</label><select id="st-in">${devOpts}</select><button id="st-scan">↻ Find inputs</button></div>
      ${isDesk ? `<div class="st-row"><label><input type="checkbox" id="st-syn" ${srcSynth ? 'checked' : ''}> Built-in synth</label><label><input type="checkbox" id="st-mon" ${monitorOn ? 'checked' : ''}> Hear myself here</label></div>` : `<div class="st-row"><label><input type="checkbox" id="st-mon" ${monitorOn ? 'checked' : ''}> Monitor here (off if your DJ software already plays to your speakers)</label></div>`}
      ${isDesk ? '' : '<div class="st-row"><label>Lights</label><button data-lt="house">💡 House</button><button data-lt="club">🌈 Club</button><button data-lt="strobe">⚡ Strobe</button></div>'}
      <div class="st-row"><div class="st-vu"><i id="st-vu"></i></div>
        ${live.on ? '<button id="st-end" class="red">■ End live</button><span style="color:#22c55e">● LIVE — the lounge hears you</span>' : '<button id="st-live" class="gold">🔴 Go live</button>'}</div>
      <div class="st-note">${isDesk
        ? 'To send FL Studio / Ableton / any DAW: set its audio output to a virtual cable (VB-Audio Cable on Windows, BlackHole on Mac) or your interface’s loopback, then pick that cable above.'
        : 'Set Serato’s master output to a virtual cable (VB-Audio Cable on Windows, BlackHole on Mac) — or use your controller/interface’s record/loopback input — then pick it above. Mix on your controller as usual; the lounge hears your master in stereo.'}</div></section>
    ${isDesk ? `
    <section><h3>🎛 MIDI devices</h3>
      ${midi.access ? `<div class="st-row">${midi.inputs.length ? midi.inputs.map((i) => `<label><input type="checkbox" data-min="${esc(i.id)}" ${midi.enabledIn.has(i.id) ? 'checked' : ''}> ${esc(i.name)}</label>`).join('') : '<span class="st-note">No MIDI inputs — plug one in (USB / OTG on Android).</span>'} <span id="st-led" class="st-led"></span></div>
        <div class="st-row"><label>Send MIDI to</label><select id="st-out"><option value="">nothing</option>${midi.outputs.map((o) => `<option value="${esc(o.id)}" ${o.id === midi.outId ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}</select></div>
        <div class="st-note">To play FL Studio with your keys: create a virtual MIDI port (loopMIDI on Windows, “IAC Driver” in Audio MIDI Setup on Mac), choose it here, and enable it as a MIDI input in FL Studio (Options → MIDI settings).</div>`
      : `<button id="st-midi" class="gold">🔌 Connect MIDI</button> <span class="st-note">${esc(midi.err)}</span>`}
    </section>
    <section><h3>🎹 Synth</h3>
      <div class="st-row">${['sawtooth', 'square', 'triangle', 'sine', 'supersaw'].map((w) => `<button data-wave="${w}" class="${synth.p.wave === w ? 'on' : ''}">${w}</button>`).join('')}
        <button data-oct="-1">Oct −</button><span>${synth.p.oct >= 0 ? '+' : ''}${synth.p.oct}</span><button data-oct="1">Oct +</button></div>
      <div class="st-grid">${[['a', 'Attack', 0.001, 2, 0.001], ['d', 'Decay', 0.01, 2, 0.01], ['s', 'Sustain', 0, 1, 0.01], ['r', 'Release', 0.01, 4, 0.01], ['cut', 'Cutoff', 80, 16000, 10], ['res', 'Resonance', 0.1, 20, 0.1], ['detune', 'Detune', 0, 40, 1], ['vol', 'Volume', 0, 1, 0.01]]
        .map(([k, l, a, b, st]) => `<label>${l}<input type="range" data-p="${k}" min="${a}" max="${b}" step="${st}" value="${synth.p[k]}"></label>`).join('')}</div>
      <div class="st-kb" id="st-kb"></div>
      <div class="st-note">No MIDI device? Play with your keyboard: A W S E D F T G Y H U J K O L P — or tap the keys.</div></section>` : ''}`;
  wire(body);
}
function wire(body) {
  body.querySelector('#st-scan')?.addEventListener('click', listDevices);
  body.querySelector('#st-in')?.addEventListener('change', async (e) => { inputId = e.target.value; try { await useInput(inputId); } catch (err) { toast('Couldn’t open that input'); } render(); });
  body.querySelector('#st-syn')?.addEventListener('change', (e) => { srcSynth = synth.on = e.target.checked; if (!srcSynth) synth.allOff(); });
  body.querySelector('#st-mon')?.addEventListener('change', (e) => { monitorOn = e.target.checked; audio(); monitor.gain.value = monitorOn ? 1 : 0; });
  body.querySelector('#st-live')?.addEventListener('click', () => {
    if (mode === 'booth' && !inputId) { toast('Pick your Serato / line-in input first'); return; }
    goLive(mode, mode === 'booth' ? 'Serato set' : (inputId ? 'Live studio' : 'Synth jam'));
  });
  body.querySelector('#st-end')?.addEventListener('click', endLive);
  body.querySelectorAll('[data-lt]').forEach((x) => x.addEventListener('click', () => { const d = window.MGDJ; if (!d) return; if (x.dataset.lt === 'strobe') d.lights('club', !(d._L.strobe)); else d.lights(x.dataset.lt); }));
  body.querySelector('#st-midi')?.addEventListener('click', midiConnect);
  body.querySelectorAll('[data-min]').forEach((c) => c.addEventListener('change', () => { if (c.checked) midi.enabledIn.add(c.dataset.min); else midi.enabledIn.delete(c.dataset.min); }));
  body.querySelector('#st-out')?.addEventListener('change', (e) => { midi.outId = e.target.value; });
  body.querySelectorAll('[data-wave]').forEach((b) => b.addEventListener('click', () => { synth.p.wave = b.dataset.wave; render(); }));
  body.querySelectorAll('[data-oct]').forEach((b) => b.addEventListener('click', () => { synth.p.oct = clamp(synth.p.oct + +b.dataset.oct, -3, 3); render(); }));
  body.querySelectorAll('[data-p]').forEach((r) => r.addEventListener('input', () => { synth.p[r.dataset.p] = +r.value; synth.apply(); }));
  const kb = body.querySelector('#st-kb');
  if (kb) {
    keyEls.clear();
    const whites = [], blacks = [];
    for (let n = 48; n < 84; n++) (([1, 3, 6, 8, 10].includes(n % 12)) ? blacks : whites).push(n);
    const W = 100 / whites.length;
    whites.forEach((n, i) => { const k = document.createElement('div'); k.className = 'w'; k.style.left = `${i * W}%`; k.style.width = `${W}%`; kb.appendChild(k); keyEls.set(n, k); });
    blacks.forEach((n) => { const wi = whites.indexOf(n - 1); const k = document.createElement('div'); k.className = 'b'; k.dataset.black = 1; k.style.left = `${(wi + 0.68) * W}%`; k.style.width = `${W * 0.64}%`; kb.appendChild(k); keyEls.set(n, k); });
    for (const [n, k] of keyEls) {
      k.addEventListener('pointerdown', (e) => { e.preventDefault(); k.setPointerCapture?.(e.pointerId); synth.noteOn(n, 100); if (midi.outId) try { midi.access.outputs.get(midi.outId)?.send([0x90, n, 100]); } catch (er) { /* */ } });
      const up = () => { synth.noteOff(n); if (midi.outId) try { midi.access.outputs.get(midi.outId)?.send([0x80, n, 0]); } catch (er) { /* */ } };
      k.addEventListener('pointerup', up); k.addEventListener('pointercancel', up); k.addEventListener('pointerleave', (e) => { if (e.buttons) up(); });
    }
  }
}
const CSS = `
#mg-studio{position:fixed;inset:0;z-index:2147483000;background:#07080e;color:#e6ebf5;font:13px system-ui,sans-serif;overflow:auto;-webkit-user-select:none;user-select:none}
#mg-studio .bar{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid #1d2436;position:sticky;top:0;background:#07080ef2;z-index:2}
#mg-studio section{margin:12px;background:#0e1220;border:1px solid #1d2436;border-radius:12px;padding:12px}
#mg-studio h3{margin:0 0 8px;font-size:14px}
#mg-studio button{background:#161b2b;border:1px solid #2a3350;color:#e6ebf5;border-radius:8px;padding:7px 11px;font-weight:700;cursor:pointer}
#mg-studio button.on,#mg-studio button.gold{background:#ffd23f;color:#111;border-color:#ffd23f}
#mg-studio button.red{background:#7f1d1d;border-color:#ef4444}
#mg-studio select{background:#0b0f1a;border:1px solid #2a3350;color:#e6ebf5;border-radius:8px;padding:6px;max-width:100%}
#mg-studio .st-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:6px 0}
#mg-studio .st-note{color:#8792ab;font-size:12px;margin-top:6px;line-height:1.45}
#mg-studio .st-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px 14px;margin:8px 0}
#mg-studio .st-grid label{display:flex;flex-direction:column;font-size:11px;color:#8792ab}
#mg-studio input[type=range]{accent-color:#ff4fd8}
#mg-studio .st-kb{position:relative;height:120px;margin-top:8px;touch-action:none}
#mg-studio .st-kb .w{position:absolute;top:0;bottom:0;background:#f5f5f5;border:1px solid #333;border-radius:0 0 6px 6px;box-sizing:border-box}
#mg-studio .st-kb .b{position:absolute;top:0;height:62%;background:#111;border-radius:0 0 5px 5px;z-index:2}
#mg-studio .st-vu{width:180px;height:10px;background:#111827;border-radius:5px;overflow:hidden}
#mg-studio .st-vu i{display:block;height:100%;width:0;background:linear-gradient(90deg,#22c55e,#f59e0b 70%,#ef4444)}
#mg-studio .st-led{display:inline-block;width:10px;height:10px;border-radius:50%;background:#1f2937}
`;
function open(where = 'desk') {
  mode = where; audio(); ctx.resume();
  if (!document.getElementById('mg-studio-css')) { const s = document.createElement('style'); s.id = 'mg-studio-css'; s.textContent = CSS; document.head.appendChild(s); }
  ov?.remove();
  ov = document.createElement('div'); ov.id = 'mg-studio';
  ov.innerHTML = `<div class="bar"><b style="font-size:15px;letter-spacing:.06em">${where === 'desk' ? '🎹 MUSIC DESK' : '🎚 DJ BOOTH · SERATO / LINE-IN'}</b><span style="flex:1"></span><button id="st-x">✕ Close</button></div><div id="st-body"></div>`;
  document.body.appendChild(ov);
  ov.querySelector('#st-x').onclick = close;
  monitorOn = where === 'desk'; monitor.gain.value = monitorOn ? 1 : 0;
  render(); listDevices();
  try { document.exitPointerLock?.(); } catch (e) { /* */ }
}
function close() { ov?.remove(); ov = null; }          // staying live is fine with the panel closed
const held = new Set();
window.addEventListener('keydown', (e) => {
  if (!ov) return;
  if (e.key === 'Escape') { close(); e.stopImmediatePropagation(); return; }
  if (e.target?.tagName === 'SELECT' || e.target?.tagName === 'INPUT' && e.target.type !== 'range' && e.target.type !== 'checkbox') return;
  const i = KB.indexOf(e.key.toLowerCase());
  if (mode === 'desk' && i >= 0 && !held.has(i)) { held.add(i); synth.noteOn(KB_BASE + i, 100); }
  e.stopImmediatePropagation();
}, true);
window.addEventListener('keyup', (e) => { if (!ov) return; const i = KB.indexOf(e.key.toLowerCase()); if (i >= 0) { held.delete(i); synth.noteOff(KB_BASE + i); } e.stopImmediatePropagation(); }, true);
function toast(t) { const el = document.createElement('div'); el.textContent = t; el.style.cssText = 'position:fixed;left:50%;top:90px;transform:translateX(-50%);z-index:2147483001;background:rgba(8,10,18,.92);border:1px solid #2a3350;color:#e6ebf5;padding:8px 14px;border-radius:12px;font:14px system-ui'; document.body.appendChild(el); setTimeout(() => el.remove(), 2600); }

// ───────────────────────────────────────────────────────────── 3D desk ──
const root = new THREE.Group(); root.visible = false;
let deskHit = null, pads = [], screenCv = null, screenTex = null;
function build() {
  const g = new THREE.Group(); g.position.set(DESK.x, 0, DESK.z); g.rotation.y = -Math.PI / 2;   // faces into the room (−x)
  const wood = new THREE.MeshStandardMaterial({ color: 0x3b2618, roughness: 0.45, metalness: 0.1 });
  const black = new THREE.MeshStandardMaterial({ color: 0x0d0e14, roughness: 0.5, metalness: 0.4 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 1.3), wood); top.position.y = 0.78 * UPS; g.add(top); deskHit = top;
  [[-1.5, -0.55], [1.5, -0.55], [-1.5, 0.55], [1.5, 0.55]].forEach(([x, z]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.78 * UPS, 0.08), black); l.position.set(x, 0.39 * UPS, z); g.add(l); });
  // MIDI keyboard: body + white/black keys
  const kb = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.08, 0.5), black); kb.position.set(0, 0.78 * UPS + 0.09, 0.28); g.add(kb);
  for (let i = 0; i < 29; i++) { const k = new THREE.Mesh(new THREE.BoxGeometry(0.066, 0.03, 0.36), new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: 0.4 })); k.position.set(-0.96 + i * 0.0686, 0.78 * UPS + 0.14, 0.33); g.add(k); }
  for (let i = 0; i < 28; i++) { if ([2, 6].includes(i % 7)) continue; const k = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.2), black); k.position.set(-0.926 + i * 0.0686, 0.78 * UPS + 0.165, 0.25); g.add(k); }
  // pad controller (glows when live)
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const m = new THREE.MeshBasicMaterial({ color: 0x1d2436 }); const p = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.025, 0.11), m); p.position.set(1.2 + c * 0.13, 0.78 * UPS + 0.08, -0.25 + r * 0.13); g.add(p); pads.push(p); }
  // studio monitors + screen
  [-1.35, 1.35].forEach((x) => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.62, 0.42), black); s.position.set(x, 0.78 * UPS + 0.36, -0.35); g.add(s); const cone = new THREE.Mesh(new THREE.CircleGeometry(0.14, 24), new THREE.MeshStandardMaterial({ color: 0x222833, roughness: 0.3, metalness: 0.6 })); cone.position.set(x, 0.78 * UPS + 0.3, -0.139); g.add(cone); });
  screenCv = document.createElement('canvas'); screenCv.width = 512; screenCv.height = 256; screenTex = new THREE.CanvasTexture(screenCv); screenTex.colorSpace = THREE.SRGBColorSpace;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), new THREE.MeshBasicMaterial({ map: screenTex })); scr.position.set(0, 0.78 * UPS + 0.75, -0.4); g.add(scr);
  const bez = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.78, 0.05), black); bez.position.set(0, 0.78 * UPS + 0.75, -0.43); g.add(bez);
  root.add(g);
  const sc = document.createElement('canvas'); sc.width = 512; sc.height = 96; const c2 = sc.getContext('2d');
  c2.fillStyle = 'rgba(6,8,14,.85)'; c2.beginPath(); c2.roundRect(10, 12, 492, 72, 16); c2.fill(); c2.fillStyle = '#ff4fd8'; c2.font = 'bold 36px system-ui'; c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.fillText('🎹 MUSIC DESK · plug in MIDI', 256, 50);
  const t = new THREE.CanvasTexture(sc); t.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true })); sign.scale.set(3.2, 0.6, 1); sign.position.set(DESK.x, 3.9, DESK.z); root.add(sign);
  MG().scene.add(root);
  drawScreen();
}
function drawScreen(level = 0) {
  const c = screenCv.getContext('2d'); c.fillStyle = '#05060b'; c.fillRect(0, 0, 512, 256);
  c.fillStyle = live.on ? '#22c55e' : listen.from ? '#f59e0b' : '#8792ab'; c.font = 'bold 34px system-ui'; c.textAlign = 'center';
  c.fillText(live.on ? '● LIVE' : listen.from ? '♪ ' + listen.label.slice(0, 22) : 'MUSIC DESK', 256, 70);
  for (let i = 0; i < 32; i++) { const h = (Math.sin(i * 0.7 + performance.now() / 300) * 0.5 + 0.5) * level * 120; c.fillStyle = `hsl(${300 - i * 5},90%,60%)`; c.fillRect(16 + i * 15, 230 - h, 11, h); }
  screenTex.needsUpdate = true;
}
const ray = new THREE.Raycaster();
let prompt = null, lastScreen = 0;
const vu = new Uint8Array(256);
function onDown(ev) {
  if (!deskHit || !inLoungeNow() || document.querySelector('#mg-studio,#mg-dj,#mg-bar,#mg-casino,#mg-arcade,#mg-skins')) return;
  const canvas = MG().controls.domElement, r = canvas.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1), MG().cam);
  if (ray.intersectObject(deskHit, false).length) { ev.stopImmediatePropagation(); ev.preventDefault(); open('desk'); }
}
function tick(now) {
  requestAnimationFrame(tick);
  if (!MG()?.cam) return;
  const vis = !!inLoungeNow(); root.visible = vis;
  let level = 0;
  if (meter && (live.on || ov)) { meter.getByteTimeDomainData(vu); for (const v of vu) level = Math.max(level, Math.abs(v - 128) / 128); }
  if (listen.gain) {        // distance falloff from the performer's spot
    const c = MG().cam.position, at = listen.where === 'desk' ? DESK : BOOTH;
    const g = vis ? clamp(1.2 - Math.hypot(c.x - at.x, c.z - at.z) / 26, 0.18, 1) : 0.7;
    listen.gain.gain.setTargetAtTime(g, ctx.currentTime, 0.25);
  }
  if (ov) {
    const el = ov.querySelector('#st-vu'); if (el) el.style.width = `${Math.min(100, level * 130)}%`;
    const led = ov.querySelector('#st-led'); if (led) led.style.background = now - midi.lastMsg < 120 ? '#22c55e' : '#1f2937';
  }
  if (!vis) { if (prompt) prompt.style.display = 'none'; return; }
  pads.forEach((p, i) => p.material.color.setHSL((i / 16 + now / 4000) % 1, 0.9, live.on || listen.from ? 0.25 + 0.3 * Math.abs(Math.sin(now / 200 + i)) * (0.4 + level) : 0.08));
  if (now - lastScreen > 150) { lastScreen = now; drawScreen(live.on ? level : listen.from ? 0.5 : 0); }
  if (prompt) { const c = MG().cam.position; prompt.style.display = !ov && Math.hypot(c.x - DESK.x, c.z - DESK.z) < 5 ? 'block' : 'none'; }
}
(function boot(t = 0) {
  if (MG() && MG().scene && MG().controls && MG().cam) {
    build();
    MG().controls.domElement.addEventListener('pointerdown', onDown, true);
    prompt = document.createElement('div'); prompt.textContent = '🎹 tap the music desk to play';
    prompt.style.cssText = 'position:fixed;left:50%;bottom:190px;transform:translateX(-50%);z-index:30;background:rgba(8,10,18,.88);border:1px solid #2a3350;border-radius:12px;padding:8px 14px;color:#e6ebf5;font:13px system-ui;display:none;pointer-events:none';
    document.body.appendChild(prompt);
    ice().catch(() => {});   // warm the TURN list so the first connection is quick
    window.MGSTAGE = { open, close, onSignal, _resume: () => { try { if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {}); if (listen.el && listen.el.paused) listen.el.play().catch(() => {}); } catch (e) { /* */ } }, _blocked: () => !!(listen.from && ctx && ctx.state !== 'running'), live: () => (live.on ? live.label : listen.from ? listen.label : null), goLive, endLive, _synth: synth, _pc: () => listen.pc, _state: () => ({ live: { ...live, pcs: live.pcs.size }, listen: { from: listen.from, state: listen.pc?.connectionState, label: listen.label } }) };
    requestAnimationFrame(tick);
  } else if (t < 600) setTimeout(() => boot(t + 1), 250);
})();
