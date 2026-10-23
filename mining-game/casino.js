/* ================= LOUNGE CASINO (free play chips) =================
   In front of the CASINO doorway in The Lounge:
     • HOLD'EM — no-limit Texas Hold'em vs three house bots (blinds 25/50, side pots).
     • WATT SLOTS — two 3-reel machines.
   Chips are FREE PLAY ONLY: no cash value, can't be bought, sold or withdrawn. Everyone
   starts with 1,000 and can top back up to 1,000 for free. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const MG = () => window.MG;
const LX = 0, LZ = -120, LW = 30, LD = 24;
const START = 1000;

// ───────────────────────────────────────────────────────────── chips ──
const Chips = {
  get() { try { const v = localStorage.getItem('mgCasino.chips'); return v === null ? START : Math.max(0, +v || 0); } catch (e) { return START; } },
  set(v) { try { localStorage.setItem('mgCasino.chips', String(Math.max(0, Math.floor(v)))); } catch (e) { /* private mode */ } },
  add(d) { this.set(this.get() + d); },
  refill() { if (this.get() < START) this.set(START); },
};
const muted = () => (document.getElementById('b-mute')?.textContent || '').includes('🔇');
let actx = null;
function beep(f0, f1, dur, type = 'triangle', vol = 0.06, when = 0) {
  if (muted()) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t = actx.currentTime + when, o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
  } catch (e) { /* no audio */ }
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ───────────────────────────────────────────────────────────── cards & hand ranking ──
const RANKS = '23456789TJQKA', SUITS = '♠♥♦♣';
const newDeck = () => { const d = []; for (let s = 0; s < 4; s++) for (let r = 2; r <= 14; r++) d.push({ r, s }); return d; };
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const CAT = ['High card', 'Pair', 'Two pair', 'Three of a kind', 'Straight', 'Flush', 'Full house', 'Four of a kind', 'Straight flush'];

/** Score 5 cards: bigger is better. [category, tiebreak ranks…] packed into one number. */
function rank5(c) {
  const rs = c.map((x) => x.r).sort((a, b) => b - a);
  const flush = c.every((x) => x.s === c[0].s);
  const uniq = [...new Set(rs)];
  let straightHi = 0;
  if (uniq.length === 5) {
    if (rs[0] - rs[4] === 4) straightHi = rs[0];
    else if (rs[0] === 14 && rs[1] === 5) straightHi = 5;            // wheel A-2-3-4-5
  }
  const cnt = {}; rs.forEach((r) => { cnt[r] = (cnt[r] || 0) + 1; });
  const groups = Object.entries(cnt).map(([r, n]) => [n, +r]).sort((a, b) => b[0] - a[0] || b[1] - a[1]);
  let cat, tb;
  if (straightHi && flush) { cat = 8; tb = [straightHi]; }
  else if (groups[0][0] === 4) { cat = 7; tb = [groups[0][1], groups[1][1]]; }
  else if (groups[0][0] === 3 && groups[1][0] === 2) { cat = 6; tb = [groups[0][1], groups[1][1]]; }
  else if (flush) { cat = 5; tb = rs; }
  else if (straightHi) { cat = 4; tb = [straightHi]; }
  else if (groups[0][0] === 3) { cat = 3; tb = groups.map((g) => g[1]); }
  else if (groups[0][0] === 2 && groups[1][0] === 2) { cat = 2; tb = groups.map((g) => g[1]); }
  else if (groups[0][0] === 2) { cat = 1; tb = groups.map((g) => g[1]); }
  else { cat = 0; tb = rs; }
  let v = cat; for (let i = 0; i < 5; i++) v = v * 15 + (tb[i] || 0);
  return v;
}
const COMBOS7 = []; (function gen(start, pick) { if (pick.length === 5) { COMBOS7.push(pick.slice()); return; } for (let i = start; i < 7; i++) { pick.push(i); gen(i + 1, pick); pick.pop(); } })(0, []);
function best7(cards) {
  let best = -1;
  if (cards.length < 7) { // fewer cards (used by tests): brute force all 5-subsets
    const n = cards.length, idx = [];
    (function g(s, p) { if (p.length === 5) { best = Math.max(best, rank5(p.map((i) => cards[i]))); return; } for (let i = s; i < n; i++) { p.push(i); g(i + 1, p); p.pop(); } })(0, idx);
    return best;
  }
  for (const k of COMBOS7) { const v = rank5([cards[k[0]], cards[k[1]], cards[k[2]], cards[k[3]], cards[k[4]]]); if (v > best) best = v; }
  return best;
}
const catOf = (v) => CAT[Math.floor(v / 15 ** 5)];

/** Monte-Carlo win probability of `hole` vs `opp` random hands given `board`. */
function equity(hole, board, opp, iters = 300) {
  const used = new Set([...hole, ...board].map((c) => c.r * 4 + c.s));
  const rest = newDeck().filter((c) => !used.has(c.r * 4 + c.s));
  let win = 0;
  for (let it = 0; it < iters; it++) {
    shuffle(rest);
    let k = 0; const b = board.slice(); while (b.length < 5) b.push(rest[k++]);
    const me = best7([...hole, ...b]);
    let beat = true, tie = 0;
    for (let o = 0; o < opp; o++) { const v = best7([rest[k++], rest[k++], ...b]); if (v > me) { beat = false; break; } if (v === me) tie++; }
    if (beat) win += tie ? 1 / (tie + 1) : 1;
  }
  return win / iters;
}

// ───────────────────────────────────────────────────────────── Hold'em engine ──
const SB = 25, BB = 50;
const BOTS = [
  { name: 'Satoshi', style: 'tight', avatar: '🧑‍💻' },
  { name: 'Ada', style: 'loose', avatar: '👩‍🚀' },
  { name: 'Hal', style: 'tricky', avatar: '🤖' },
];
function makePoker(ui) {
  const P = [{ name: 'You', you: true, avatar: '🧑', chips: 0 }, ...BOTS.map((b) => ({ ...b, chips: START }))];
  let g = null, busy = false;
  const S = () => g;
  const active = () => P.filter((p) => !p.out);
  const live = () => g.players.filter((p) => !p.folded);
  const canAct = () => g.players.filter((p) => !p.folded && !p.allIn);
  const nextIdx = (i, pred) => { for (let k = 1; k <= P.length; k++) { const j = (i + k) % P.length; if (pred(P[j])) return j; } return -1; };
  const inHand = (p) => g.players.includes(p);
  function log(s) { g.log.unshift(s); g.log = g.log.slice(0, 6); }

  function newHand() {
    P[0].chips = Chips.get();
    for (const p of P) if (!p.you && p.chips < BB) p.chips = START;      // house bots rebuy
    P.forEach((p) => { p.out = p.chips <= 0; p.hole = []; p.bet = 0; p.total = 0; p.folded = p.out; p.allIn = false; p.acted = false; p.show = false; p.last = ''; });
    if (P[0].out) { g = { ...(g || {}), phase: 'broke', log: g?.log || [] }; ui(); return; }
    const dealer = g ? nextIdx(g.dealer, (p) => !p.out) : 0;
    g = { deck: shuffle(newDeck()), board: [], dealer, street: 'preflop', cur: 0, minRaise: BB, phase: 'play', log: g?.log || [], players: P.filter((p) => !p.out), winners: [] };
    for (let r = 0; r < 2; r++) for (const p of g.players) p.hole.push(g.deck.pop());
    const heads = g.players.length === 2;
    const sbI = heads ? dealer : nextIdx(dealer, (p) => !p.out);
    const bbI = nextIdx(sbI, (p) => !p.out);
    post(P[sbI], SB); post(P[bbI], BB);
    g.cur = BB; g.toAct = nextIdx(bbI, (p) => inHand(p) && !p.folded && !p.allIn);
    log(`New hand · ${P[dealer].name} deals`);
    beep(500, 700, 0.08);
    ui(); step();
  }
  function post(p, amt) { const a = Math.min(amt, p.chips); p.chips -= a; p.bet += a; p.total += a; if (!p.chips) p.allIn = true; }
  const pot = () => g.players.reduce((s, p) => s + p.total, 0);
  const toCall = (p) => Math.max(0, g.cur - p.bet);

  function act(p, kind, raiseTo = 0) {
    if (kind === 'fold') { p.folded = true; p.last = 'Fold'; }
    else if (kind === 'check') { p.last = 'Check'; }
    else if (kind === 'call') { const a = Math.min(toCall(p), p.chips); post(p, a); p.last = p.allIn ? 'All-in' : `Call ${a}`; }
    else if (kind === 'raise') {
      const target = Math.min(raiseTo, p.bet + p.chips);
      const raiseBy = target - g.cur;
      post(p, target - p.bet);
      if (raiseBy >= g.minRaise) { g.minRaise = raiseBy; g.players.forEach((q) => { if (q !== p) q.acted = false; }); }
      else if (target > g.cur) g.players.forEach((q) => { if (q !== p && q.bet < target) q.acted = false; });   // short all-in
      g.cur = Math.max(g.cur, target);
      p.last = p.allIn ? 'All-in' : (g.street === 'preflop' || g.cur > target ? `Raise ${target}` : `Bet ${target}`);
    }
    p.acted = true;
    log(`${p.name}: ${p.last}`);
    beep(kind === 'fold' ? 220 : 660, kind === 'fold' ? 160 : 880, 0.06);
    advance();
  }
  function roundDone() { return canAct().every((p) => p.acted && p.bet === g.cur) || (canAct().length <= 1 && canAct().every((p) => p.bet >= g.cur)); }
  function advance() {
    if (live().length === 1) return finish();
    if (!roundDone()) { g.toAct = nextIdx(g.toAct, (p) => inHand(p) && !p.folded && !p.allIn && (!p.acted || p.bet < g.cur)); ui(); return step(); }
    // next street
    g.players.forEach((p) => { p.bet = 0; p.acted = false; });
    g.cur = 0; g.minRaise = BB;
    if (g.street === 'river') return finish();
    g.street = { preflop: 'flop', flop: 'turn', turn: 'river' }[g.street];
    g.deck.pop();                                             // burn
    const n = g.street === 'flop' ? 3 : 1; for (let i = 0; i < n; i++) g.board.push(g.deck.pop());
    beep(400, 600, 0.1);
    if (canAct().length <= 1) { ui(); return setTimeout(advance, 700); }   // everyone else all-in: run it out
    g.toAct = nextIdx(g.dealer, (p) => inHand(p) && !p.folded && !p.allIn);
    ui(); step();
  }
  function finish() {
    const contenders = live();
    // side pots by contribution level
    const levels = [...new Set(g.players.map((p) => p.total))].filter((v) => v > 0).sort((a, b) => a - b);
    let prev = 0; const pots = [];
    for (const lv of levels) {
      const amt = g.players.reduce((s, p) => s + Math.max(0, Math.min(p.total, lv) - prev), 0);
      const elig = contenders.filter((p) => p.total >= lv);
      if (amt > 0) { if (elig.length) pots.push({ amt, elig }); else if (pots.length) pots[pots.length - 1].amt += amt; }
      prev = lv;
    }
    const showdown = contenders.length > 1;
    while (showdown && g.board.length < 5) g.board.push(g.deck.pop());
    const scores = new Map(contenders.map((p) => [p, showdown ? best7([...p.hole, ...g.board]) : 0]));
    g.winners = [];
    for (const pt of pots) {
      const top = Math.max(...pt.elig.map((p) => scores.get(p)));
      const ws = pt.elig.filter((p) => scores.get(p) === top);
      const share = Math.floor(pt.amt / ws.length); let odd = pt.amt - share * ws.length;
      ws.forEach((w) => { w.chips += share + (odd-- > 0 ? 1 : 0); if (!g.winners.includes(w)) g.winners.push(w); });
    }
    if (showdown) contenders.forEach((p) => { p.show = true; });
    const w = g.winners[0];
    log(showdown ? `${g.winners.map((x) => x.name).join(' & ')} win${g.winners.length > 1 || w.you ? '' : 's'} with ${catOf(scores.get(w))}` : `${w.name} win${w.you ? '' : 's'} ${pot()}`);
    g.phase = 'done';
    Chips.set(P[0].chips);
    if (g.winners.includes(P[0])) { [523, 659, 784, 1046].forEach((f, i) => beep(f, f, 0.15, 'triangle', 0.07, i * 0.08)); } else beep(300, 150, 0.3);
    ui();
  }

  // ── bots ──
  function step() {
    if (g.phase !== 'play') return;
    const p = P[g.toAct];
    if (!p || p.you) { ui(); return; }
    if (busy) return; busy = true;
    setTimeout(() => { busy = false; if (g.phase === 'play' && P[g.toAct] === p) botAct(p); }, 650 + Math.random() * 500);
  }
  function botAct(p) {
    const opp = live().length - 1;
    const e = equity(p.hole, g.board, Math.max(1, opp), g.street === 'preflop' ? 200 : 300);
    const call = toCall(p), potNow = pot(), odds = call / (potNow + call || 1);
    const loose = p.style === 'loose' ? 0.06 : p.style === 'tight' ? -0.05 : 0;
    const bluff = p.style === 'tricky' ? 0.14 : p.style === 'loose' ? 0.08 : 0.03;
    const strong = 1 / (opp + 1) + 0.22 - loose;            // "clearly ahead of the table"
    const r = Math.random();
    const raiseTo = (mult) => Math.min(p.bet + p.chips, Math.max(g.cur + g.minRaise, Math.round((g.cur + potNow * mult) / 5) * 5));
    if (call === 0) {
      if (e > strong || r < bluff) return act(p, 'raise', raiseTo(e > strong + 0.15 ? 0.9 : 0.55));
      return act(p, 'check');
    }
    if (e + loose < odds - 0.04 && r > bluff * 0.5) return act(p, 'fold');
    if ((e > strong + 0.1 && r < 0.65) || (r < bluff * 0.5 && g.street !== 'river')) return act(p, 'raise', raiseTo(1));
    return act(p, 'call');
  }

  return {
    P, S, newHand,
    you: () => P[0],
    toCall: () => toCall(P[0]), pot: () => (g?.players ? pot() : 0),
    minRaiseTo: () => g.cur + g.minRaise, maxTo: () => P[0].bet + P[0].chips,
    act: (k, to) => { if (g?.phase === 'play' && P[g.toAct]?.you) act(P[0], k, to); },
    rebuy: () => { Chips.refill(); P[0].chips = Chips.get(); g.phase = 'idle'; ui(); },
  };
}

// ───────────────────────────────────────────────────────────── slots ──
// 21-stop reels: fewer stops = rarer. Pays (× bet): 777 100, 💎💎💎 50, ⚡⚡⚡ 25, ⛏⛏⛏ 15,
// 🧱🧱🧱 10, 🪙🪙🪙 8, two ⚡ 2, one ⚡ 1  → about 97% return (play chips only).
const SYM = [['7', 1], ['💎', 2], ['⚡', 3], ['⛏', 4], ['🧱', 5], ['🪙', 6]];
const STRIP = SYM.flatMap(([s, n]) => Array(n).fill(s));
const TRIPLE = { '7': 100, '💎': 50, '⚡': 25, '⛏': 15, '🧱': 10, '🪙': 8 };
function slotPay(r) {
  if (r[0] === r[1] && r[1] === r[2]) return TRIPLE[r[0]];
  const bolts = r.filter((s) => s === '⚡').length;
  return bolts === 2 ? 2 : bolts === 1 ? 1 : 0;
}
const spinReel = () => STRIP[(Math.random() * STRIP.length) | 0];

// ───────────────────────────────────────────────────────────── overlay UI ──
let ov = null, open = null;
const CSS = `
#mg-casino{position:fixed;inset:0;z-index:2147483000;background:radial-gradient(ellipse at center,#0c1a14 0%,#04060a 75%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;font:14px system-ui,sans-serif;color:#e8ecf6;user-select:none;-webkit-user-select:none;padding:10px;box-sizing:border-box;overflow:auto}
#mg-casino .top{display:flex;align-items:center;justify-content:space-between;gap:10px;width:min(96vw,760px)}
#mg-casino .x{background:#1a1d2e;border:1px solid #2c3352;color:#e8ecf6;border-radius:8px;padding:4px 10px;font-size:15px;cursor:pointer}
#mg-casino .chips{color:#ffd23f;font-weight:700}
#mg-casino .fine{color:#7d879c;font-size:11px;text-align:center;max-width:560px}
#mg-casino button.b{background:#1b2236;border:1px solid #33405f;color:#e8ecf6;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;font-size:14px}
#mg-casino button.b:disabled{opacity:.4;cursor:default}
#mg-casino button.gold{background:#ffd23f;color:#111;border-color:#ffd23f}
#mg-casino button.red{background:#5a1a24;border-color:#a33a4a}
#mg-casino .felt{position:relative;width:min(96vw,760px);height:min(62vh,420px);border-radius:200px/140px;background:radial-gradient(ellipse at center,#137a4a 0%,#0b4f30 70%);border:10px solid #3a2414;box-shadow:0 0 0 2px #b38b3a inset,0 20px 60px rgba(0,0,0,.6)}
#mg-casino .seat{position:absolute;transform:translate(-50%,-50%);text-align:center;min-width:110px}
#mg-casino .seat .nm{font-weight:700;font-size:13px;background:rgba(0,0,0,.45);border-radius:10px;padding:3px 8px;display:inline-block}
#mg-casino .seat.turn .nm{box-shadow:0 0 0 2px #ffd23f}
#mg-casino .seat.win .nm{background:#ffd23f;color:#111}
#mg-casino .seat .st{font-size:11px;color:#c8f0d8;min-height:15px}
#mg-casino .cards{display:flex;gap:4px;justify-content:center;margin:3px 0}
#mg-casino .card{width:38px;height:54px;border-radius:6px;background:#fbfbf7;color:#111;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:800;font-size:16px;line-height:1;box-shadow:0 2px 6px rgba(0,0,0,.4)}
#mg-casino .card.red{color:#d11a2a}
#mg-casino .card.back{background:repeating-linear-gradient(45deg,#2a3cff,#2a3cff 4px,#1d2bbf 4px,#1d2bbf 8px);border:2px solid #fbfbf7}
#mg-casino .card.sm{width:30px;height:42px;font-size:13px}
#mg-casino .board{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);text-align:center}
#mg-casino .pot{color:#ffd23f;font-weight:700;margin-bottom:6px}
#mg-casino .bet{font-size:11px;color:#ffd23f}
#mg-casino .log{font-size:12px;color:#9fb0c8;min-height:16px;text-align:center}
#mg-casino .acts{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-items:center}
#mg-casino input[type=range]{width:160px}
#mg-casino .reels{display:flex;gap:10px;padding:18px;background:linear-gradient(#1a1030,#0b0618);border:3px solid #b14bff;border-radius:18px;box-shadow:0 0 40px #b14bff55}
#mg-casino .reel{width:min(24vw,110px);height:min(24vw,110px);border-radius:12px;background:#fbfbf7;display:flex;align-items:center;justify-content:center;font-size:min(14vw,64px);font-weight:900;color:#d11a2a;overflow:hidden}
#mg-casino .reel.spin{animation:mgspin .09s linear infinite}
@keyframes mgspin{0%{transform:translateY(-6px)}50%{transform:translateY(6px)}100%{transform:translateY(-6px)}}
@media (max-width:600px){#mg-casino .seat{min-width:76px}#mg-casino .seat .nm{font-size:11px;padding:2px 6px}#mg-casino .card.sm{width:24px;height:34px;font-size:11px}#mg-casino .top b{font-size:12px}}
#mg-casino .paytable{display:grid;grid-template-columns:auto auto;gap:2px 16px;font-size:12px;color:#c8d0e0}
`;
function shell(title, color) {
  close();
  if (!document.getElementById('mg-casino-css')) { const st = document.createElement('style'); st.id = 'mg-casino-css'; st.textContent = CSS; document.head.appendChild(st); }
  ov = document.createElement('div'); ov.id = 'mg-casino';
  ov.innerHTML = `<div class="top"><b style="color:${color};letter-spacing:.1em">${title}</b><span class="chips" id="cz-chips"></span><button class="x" id="cz-x">✕</button></div><div id="cz-body" style="display:flex;flex-direction:column;align-items:center;gap:10px;width:100%"></div><div class="fine">Free play chips — no cash value. They can't be bought, sold, withdrawn or exchanged for WATT, ALT or anything else.</div>`;
  document.body.appendChild(ov);
  ov.querySelector('#cz-x').onclick = close;
  try { document.exitPointerLock?.(); } catch (e) { /* ignore */ }
  return ov.querySelector('#cz-body');
}
function close() { if (ov) ov.remove(); ov = null; open = null; }
const setChips = (n) => { const el = document.getElementById('cz-chips'); if (el) el.textContent = `🪙 ${n.toLocaleString()} chips`; };
window.addEventListener('keydown', (e) => { if (!ov) return; if (e.key === 'Escape') close(); e.stopImmediatePropagation(); }, true);

const cardHTML = (c, sm) => (c ? `<div class="card${sm ? ' sm' : ''}${c.s === 1 || c.s === 2 ? ' red' : ''}">${RANKS[c.r - 2].replace('T', '10')}<span>${SUITS[c.s]}</span></div>` : `<div class="card back${sm ? ' sm' : ''}"></div>`);

function openPoker() {
  const body = shell("🃏 HOLD'EM · blinds 25/50", '#3dff8a');
  open = 'poker';
  let poker;
  let raiseTo = 0;
  const narrow = innerWidth < 600;
  const SEATS = narrow ? [[50, 88], [16, 42], [50, 6], [84, 42]] : [[50, 88], [8, 45], [50, 6], [92, 45]];   // you bottom, bots left/top/right (percent)
  const render = () => {
    if (!ov || open !== 'poker') return;
    const g = poker.S(), you = poker.you();
    setChips(you.chips);
    if (!g || g.phase === 'idle' || g.phase === 'broke') {
      const broke = g?.phase === 'broke' || you.chips <= 0;
      body.innerHTML = `<div class="felt"><div class="board"><div class="pot">${broke ? 'You’re out of chips' : 'Texas Hold’em'}</div>
        <div class="log">${broke ? 'Top up to 1,000 free chips and deal again.' : 'You vs Satoshi (tight), Ada (loose) and Hal (tricky). No-limit, blinds 25/50.'}</div>
        <div style="margin-top:12px">${broke ? '<button class="b gold" id="cz-rebuy">Get 1,000 free chips</button>' : '<button class="b gold" id="cz-deal">Deal</button>'}</div></div></div>`;
      body.querySelector('#cz-deal')?.addEventListener('click', () => poker.newHand());
      body.querySelector('#cz-rebuy')?.addEventListener('click', () => poker.rebuy());
      return;
    }
    const myTurn = g.phase === 'play' && poker.P[g.toAct]?.you;
    const seats = poker.P.map((p, i) => {
      const [x, y] = SEATS[i];
      const inH = g.players.includes(p);
      const cards = !inH ? '' : (p.you || p.show) ? p.hole.map((c) => cardHTML(c, !p.you)).join('') : (p.folded ? '' : cardHTML(null, true) + cardHTML(null, true));
      const turn = g.phase === 'play' && poker.P[g.toAct] === p;
      const win = g.phase === 'done' && g.winners.includes(p);
      return `<div class="seat${turn ? ' turn' : ''}${win ? ' win' : ''}" style="left:${x}%;top:${y}%">
        ${i === 0 ? '' : `<div class="cards">${cards}</div>`}
        <div class="nm">${p.avatar} ${esc(p.name)} · ${p.chips.toLocaleString()}${g.dealer === i ? ' Ⓓ' : ''}</div>
        <div class="st">${p.out ? 'sitting out' : p.folded ? 'folded' : esc(p.last || '')}${p.bet ? ` <span class="bet">· ${p.bet} in</span>` : ''}</div>
        ${i === 0 ? `<div class="cards">${cards}</div>` : ''}</div>`;
    }).join('');
    const call = poker.toCall(), minTo = Math.min(poker.minRaiseTo(), poker.maxTo()), maxTo = poker.maxTo();
    if (raiseTo < minTo || raiseTo > maxTo) raiseTo = minTo;
    body.innerHTML = `<div class="felt">${seats}
      <div class="board"><div class="pot">Pot ${poker.pot().toLocaleString()}</div><div class="cards">${[0, 1, 2, 3, 4].map((i) => g.board[i] ? cardHTML(g.board[i]) : '<div class="card" style="opacity:.12"></div>').join('')}</div></div></div>
      <div class="log">${g.log.slice(0, 2).map(esc).join(' · ')}</div>
      <div class="acts">${g.phase === 'done' ? '<button class="b gold" id="cz-deal">Next hand</button>' : myTurn ? `
        <button class="b red" data-a="fold">Fold</button>
        ${call ? `<button class="b" data-a="call">Call ${Math.min(call, you.chips)}</button>` : '<button class="b" data-a="check">Check</button>'}
        ${maxTo > g.cur ? `<input type="range" id="cz-r" min="${minTo}" max="${maxTo}" step="5" value="${raiseTo}"><button class="b gold" data-a="raise" id="cz-rb">${raiseTo >= maxTo ? 'All-in' : (call ? 'Raise to ' : 'Bet ') + raiseTo}</button>
        <button class="b" data-p="0.5">½ pot</button><button class="b" data-p="1">Pot</button><button class="b" data-p="all">All-in</button>` : ''}` : `<span class="log">${esc(poker.P[g.toAct]?.name || '')} is thinking…</span>`}</div>`;
    body.querySelector('#cz-deal')?.addEventListener('click', () => poker.newHand());
    body.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => poker.act(b.dataset.a, raiseTo)));
    const rng = body.querySelector('#cz-r'), rb = body.querySelector('#cz-rb');
    const setR = (v) => { raiseTo = Math.max(minTo, Math.min(maxTo, Math.round(v / 5) * 5)); if (rng) rng.value = raiseTo; if (rb) rb.textContent = raiseTo >= maxTo ? 'All-in' : (call ? 'Raise to ' : 'Bet ') + raiseTo; };
    rng?.addEventListener('input', () => setR(+rng.value));
    body.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => setR(b.dataset.p === 'all' ? maxTo : g.cur + (poker.pot() + call) * +b.dataset.p)));
  };
  poker = makePoker(render);
  poker.P[0].chips = Chips.get();
  render();
}

function openSlots() {
  const body = shell('🎰 WATT SLOTS', '#b14bff');
  open = 'slots';
  let bet = 25, spinning = false, msg = 'Line up three to win.';
  const reels = ['⚡', '7', '💎'];
  const render = () => {
    if (!ov || open !== 'slots') return;
    const chips = Chips.get(); setChips(chips);
    body.innerHTML = `<div class="reels">${reels.map((s, i) => `<div class="reel${spinning ? ' spin' : ''}" id="cz-r${i}">${s}</div>`).join('')}</div>
      <div class="log" style="font-size:15px;color:#ffd23f;min-height:20px" id="cz-msg">${esc(msg)}</div>
      <div class="acts">${[10, 25, 50].map((b) => `<button class="b${bet === b ? ' gold' : ''}" data-bet="${b}" ${spinning ? 'disabled' : ''}>Bet ${b}</button>`).join('')}
        <button class="b gold" id="cz-spin" style="padding:12px 26px;font-size:16px" ${spinning || chips < bet ? 'disabled' : ''}>SPIN</button>
        ${chips < 10 ? '<button class="b" id="cz-rebuy">Get 1,000 free chips</button>' : ''}</div>
      <div class="paytable"><span>7 7 7</span><span>×100</span><span>💎 💎 💎</span><span>×50</span><span>⚡ ⚡ ⚡</span><span>×25</span><span>⛏ ⛏ ⛏</span><span>×15</span><span>🧱 🧱 🧱</span><span>×10</span><span>🪙 🪙 🪙</span><span>×8</span><span>any two ⚡</span><span>×2</span><span>any one ⚡</span><span>×1</span></div>`;
    body.querySelectorAll('[data-bet]').forEach((b) => b.addEventListener('click', () => { bet = +b.dataset.bet; render(); }));
    body.querySelector('#cz-rebuy')?.addEventListener('click', () => { Chips.refill(); msg = 'Topped up to 1,000 free chips.'; render(); });
    body.querySelector('#cz-spin')?.addEventListener('click', spin);
  };
  function spin() {
    if (spinning || Chips.get() < bet) return;
    Chips.add(-bet); spinning = true; msg = ''; render();
    const result = [spinReel(), spinReel(), spinReel()];
    const tick = setInterval(() => { for (let i = 0; i < 3; i++) { const el = document.getElementById('cz-r' + i); if (el && el.classList.contains('spin')) el.textContent = spinReel(); } beep(300 + Math.random() * 200, 200, 0.03, 'square', 0.02); }, 70);
    [700, 1100, 1500].forEach((ms, i) => setTimeout(() => {
      reels[i] = result[i]; const el = document.getElementById('cz-r' + i); if (el) { el.classList.remove('spin'); el.textContent = result[i]; }
      beep(180, 120, 0.12, 'square', 0.05);
      if (i === 2) {
        clearInterval(tick); spinning = false;
        const mult = slotPay(result), won = mult * bet;
        if (won) { Chips.add(won); msg = mult >= 8 ? `JACKPOT ×${mult} — you win ${won}!` : `You win ${won}`; [523, 659, 784, 1046].slice(0, mult >= 8 ? 4 : 2).forEach((f, k) => beep(f, f, 0.15, 'triangle', 0.07, k * 0.09)); }
        else msg = 'No win — spin again';
        render();
      }
    }, ms));
  }
  render();
}

// ───────────────────────────────────────────────────────────── 3D props ──
const props = [];
function std(c, r = 0.6, e = 0, ei = 1) { const m = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0.2 }); if (e) { m.emissive = new THREE.Color(e); m.emissiveIntensity = ei; } return m; }
function pokerTable(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.1, 40), std(0x0f6b3e, 0.9)); top.scale.z = 0.62; top.position.y = 0.92; g.add(top);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.08, 10, 48), std(0x3a2414, 0.5, 0xb38b3a, 0.25)); rim.rotation.x = Math.PI / 2; rim.scale.y = 0.62; rim.position.y = 0.97; g.add(rim);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 0.9, 16), std(0x1a1330)); leg.position.y = 0.45; g.add(leg);
  // a few chip stacks + face-down cards on the felt
  [[-0.5, 0.2, 0xffd23f], [0.6, -0.1, 0xff3b3b], [0.1, 0.35, 0x35e0ff]].forEach(([cx, cz, col]) => { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 14), std(col, 0.4)); s.position.set(cx, 1.03, cz); g.add(s); });
  for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.01, 0.2), std(0xfbfbf7, 0.5)); c.position.set(-0.36 + i * 0.18, 0.98, 0); g.add(c); }
  // stools
  // padded casino chairs (seat + back on a chrome post), each turned to face the felt
  const pad = std(0x2a2050, 0.55, 0xb14bff, 0.12), chrome = std(0xc0c4d0, 0.2);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4, ch = new THREE.Group();
    ch.position.set(Math.cos(a) * 1.95, 0, Math.sin(a) * 1.3);
    ch.lookAt(g.position.x, 0, g.position.z); ch.rotation.set(0, Math.atan2(-ch.position.x, -ch.position.z), 0);
    const seat = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.12, 0.48, 4, 0.05), pad); seat.position.y = 0.6; ch.add(seat);
    const back = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.5, 0.1, 4, 0.05), pad); back.position.set(0, 0.92, -0.22); back.rotation.x = -0.12; ch.add(back);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.55, 12), chrome); post.position.y = 0.3; ch.add(post);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.04, 24), chrome); base.position.y = 0.02; ch.add(base);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.012, 8, 24), chrome); ring.rotation.x = Math.PI / 2; ring.position.y = 0.3; ch.add(ring);
    g.add(ch);
  }
  const sign = label('🃏 HOLD’EM · free play', '#3dff8a'); sign.position.set(0, 2.2, 0); g.add(sign);
  const lt = new THREE.PointLight(0x3dff8a, 0.5, 5); lt.position.set(0, 2, 0); g.add(lt);
  MG().scene.add(g); props.push({ g, open: openPoker, name: "HOLD'EM" });
}
function slotMachine(x, z, rotY) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY;
  const body = std(0x150c28, 0.5);
  const add = (geo, m, px, py, pz) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); g.add(o); return o; };
  // cabinet: rounded body, glowing arched topper, chrome trim
  add(new RoundedBoxGeometry(0.9, 1.62, 0.7, 4, 0.07), body, 0, 0.81, 0);
  add(new RoundedBoxGeometry(0.96, 0.08, 0.76, 3, 0.03), std(0x8a8fa8, 0.25), 0, 0.04, 0);            // plinth
  const top = add(new THREE.CylinderGeometry(0.45, 0.45, 0.66, 32, 1, false, -Math.PI / 2, Math.PI), std(0x150c28, 0.35, 0xb14bff, 1.1), 0, 1.62, 0);
  top.rotation.x = Math.PI / 2;
  [-1, 1].forEach((sx) => add(new THREE.BoxGeometry(0.02, 1.5, 0.02), std(0x111111, 0.3, 0xffd23f, 1.4), sx * 0.455, 0.85, 0.34));   // gold edge lights
  add(new RoundedBoxGeometry(0.8, 0.42, 0.06, 3, 0.025), std(0x05060c, 0.3), 0, 1.25, 0.33);          // reel window bezel
  add(new RoundedBoxGeometry(0.78, 0.16, 0.22, 3, 0.04), std(0x2a2050, 0.4, 0xb14bff, 0.25), 0, 0.92, 0.42);   // button deck
  [-0.22, 0, 0.22].forEach((bx, i) => add(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 16), std(0x111111, 0.3, [0x3dff8a, 0xffd23f, 0xff3b3b][i], 1), bx, 1.01, 0.44));
  add(new RoundedBoxGeometry(0.5, 0.1, 0.18, 3, 0.04), std(0x8a8fa8, 0.25), 0, 0.32, 0.4);             // coin tray
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 96; const cx = cv.getContext('2d');
  cx.fillStyle = '#fbfbf7'; cx.fillRect(0, 0, 256, 96); cx.font = 'bold 56px system-ui'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
  ['7', '⚡', '💎'].forEach((s, i) => { cx.fillStyle = '#d11a2a'; cx.fillText(s, 43 + i * 85, 50); });
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  add(new THREE.PlaneGeometry(0.7, 0.3), new THREE.MeshBasicMaterial({ map: tex }), 0, 1.25, 0.364);
  add(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 12), std(0xc0c4d0, 0.2), 0.5, 1.25, 0.05);
  add(new THREE.SphereGeometry(0.07, 16, 12), std(0xff3b3b, 0.3, 0xff3b3b, 0.4), 0.5, 1.52, 0.05);
  const sign = label('🎰 WATT SLOTS', '#b14bff'); sign.position.set(0, 2.35, 0); sign.scale.set(1.4, 0.35, 1); g.add(sign);
  MG().scene.add(g); props.push({ g, open: openSlots, name: 'WATT SLOTS' });
}
function label(textStr, color) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 96; const cx = cv.getContext('2d');
  cx.fillStyle = 'rgba(6,8,14,.85)'; cx.beginPath(); cx.roundRect(10, 12, 492, 72, 16); cx.fill();
  cx.fillStyle = color; cx.font = 'bold 40px system-ui'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(textStr, 256, 50);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true })); s.scale.set(2.4, 0.45, 1); return s;
}

const ray = new THREE.Raycaster();
let prompt = null;
const inLoungeNow = () => { const c = MG()?.cam; return c && c.position.z < LZ + 40; };
function onDown(ev) {
  if (!props.length || !inLoungeNow() || ov || document.getElementById('mg-arcade')) return;
  const canvas = MG().controls.domElement, r = canvas.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1), MG().cam);
  for (const p of props) if (ray.intersectObject(p.g, true).length) { ev.stopImmediatePropagation(); ev.preventDefault(); p.open(); return; }
}
function tick() {
  requestAnimationFrame(tick);
  const vis = inLoungeNow();
  for (const p of props) p.g.visible = !!vis;
  if (!prompt) return;
  if (!vis || ov) { prompt.style.display = 'none'; return; }
  const cam = MG().cam; let near = null;
  for (const p of props) if (cam.position.distanceTo(p.g.getWorldPosition(new THREE.Vector3())) < 3.4) near = p;
  prompt.style.display = near ? 'block' : 'none';
  if (near) prompt.textContent = `🪙 tap to play ${near.name} (free play chips)`;
}

(function boot(t = 0) {
  if (MG() && MG().scene && MG().controls && MG().cam) {
    // in front of the CASINO doorway (right wall, z = LZ - 6) and the back-right corner
    pokerTable(LX + LW / 2 - 4.2, LZ - 6.4);
    slotMachine(LX + LW / 2 - 1.2, LZ - LD / 2 + 0.8, 0);
    slotMachine(LX + LW / 2 - 2.4, LZ - LD / 2 + 0.8, 0);
    MG().controls.domElement.addEventListener('pointerdown', onDown, true);
    prompt = document.createElement('div');
    prompt.style.cssText = 'position:fixed;left:50%;bottom:150px;transform:translateX(-50%);z-index:30;background:rgba(6,8,14,.85);border:1px solid #2c3352;border-radius:12px;padding:8px 14px;color:#e8ecf6;font:13px system-ui;display:none;pointer-events:none';
    document.body.appendChild(prompt);
    window.MGCASINO = { poker: openPoker, slots: openSlots, close, chips: Chips, _test: { rank5, best7, equity, slotPay, STRIP, TRIPLE, makePoker } };
    requestAnimationFrame(tick);
  } else if (t < 600) setTimeout(() => boot(t + 1), 250);
})();
