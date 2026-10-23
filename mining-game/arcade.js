/* ================= LOUNGE ARCADE =================
   Two playable cabinets beside the ARCADE doorway in The Lounge:
     BLOCK RAIDERS — formation shooter: a swaying alien formation, divers that swoop and
                     shoot, two-hit gold bosses, stage after stage.
     MAZE MINER    — maze chase: mine every hash dot while four security bots hunt you,
                     each with its own tracking; WATT cells turn the tables.
   Original games, art and maze (drawn in code). Tap/click a cabinet to play; keyboard
   or on-screen controls. Best scores are kept per device and announced in Lounge chat. */
import * as THREE from 'three';

const MG = () => window.MG;
const LX = 0, LZ = -120, LW = 30;                       // lounge region (matches p15)
const W = 224, H = 288;                                  // arcade logical resolution

// ───────────────────────────────────────────────────────────── shared helpers ──
const best = (id) => { try { return +localStorage.getItem('mgArcade.' + id) || 0; } catch (e) { return 0; } };
const setBest = (id, v) => { try { localStorage.setItem('mgArcade.' + id, String(v)); } catch (e) { /* private mode */ } };
const muted = () => (document.getElementById('b-mute')?.textContent || '').includes('🔇');
let actx = null;
function beep(f0, f1, dur, type = 'square', vol = 0.08) {
  if (muted()) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
  } catch (e) { /* no audio */ }
}
// pixel sprites: strings of rows, one char per pixel, mapped to colors
function sprite(rows, pal) {
  const c = document.createElement('canvas'); c.width = rows[0].length; c.height = rows.length;
  const x = c.getContext('2d');
  rows.forEach((r, y) => [...r].forEach((ch, i) => { if (pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i, y, 1, 1); } }));
  return c;
}
function text(ctx, s, x, y, color = '#e8ecf6', size = 8, align = 'left') {
  ctx.fillStyle = color; ctx.font = `bold ${size}px "Courier New", monospace`; ctx.textAlign = align; ctx.textBaseline = 'top'; ctx.fillText(s, x, y);
}

// ───────────────────────────────────────────────────────────── BLOCK RAIDERS ──
const SHIP = sprite([
  '......c......',
  '......c......',
  '.....ccc.....',
  '.....cwc.....',
  '..y..cwc..y..',
  '..y.ccccc.y..',
  '.cccccmcccccc',
  'ccc.ccmcc.ccc',
  'cc..ccccc..cc',
  'c....c.c....c',
], { c: '#35e0ff', w: '#ffffff', y: '#ffd23f', m: '#b14bff' });
const DRONE = [sprite([
  '...c...c...', '....c.c....', '...ccccc...', '..cc.c.cc..', '.ccccccccc.', '.c.ccccc.c.', '.c.c...c.c.', '....cc.cc..',
], { c: '#35e0ff' }), sprite([
  '...c...c...', '....c.c....', '...ccccc...', '..cc.c.cc..', '.ccccccccc.', 'c..ccccc..c', '.c.......c.', 'c.........c',
], { c: '#35e0ff' })];
const RAIDER = [sprite([
  '....mmm....', '..mmmmmmm..', '.mm.mmm.mm.', 'mmmmmmmmmmm', '..m..m..m..', '.m.m...m.m.', 'm.........m', '...........',
], { m: '#ff4fd8' }), sprite([
  '....mmm....', '..mmmmmmm..', '.mm.mmm.mm.', 'mmmmmmmmmmm', '.m..m.m..m.', 'm...m.m...m', '.m.......m.', '...........',
], { m: '#ff4fd8' })];
const BOSS = [sprite([
  '..y.....y..', '...y...y...', '..yyyyyyy..', '.yy.yyy.yy.', 'yyyyyyyyyyy', 'y.yyyyyyy.y', 'y.y.....y.y', '...yy.yy...',
], { y: '#ffd23f' }), sprite([
  '..y.....y..', '...y...y...', '..yyyyyyy..', '.yyryyyryy.', 'yyyyyyyyyyy', 'y.yyyyyyy.y', 'y.y.....y.y', '...yy.yy...',
], { y: '#ff9a3c', r: '#ff3b3b' })];

function makeRaiders() {
  let st, inp = { left: 0, right: 0, fire: 0 };
  function reset() {
    st = { score: 0, lives: 3, stage: 0, player: { x: W / 2, alive: true, respawn: 0, inv: 0 }, shots: [], bombs: [],
      foes: [], booms: [], stars: Array.from({ length: 60 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 20 + Math.random() * 60 })),
      t: 0, sway: 0, diveT: 2, phase: 'title', msgT: 0, extra: false, fireCd: 0 };
  }
  function nextStage() {
    st.stage++; st.foes = []; st.phase = 'play'; st.msgT = 2; st.diveT = 2.5;
    const rows = [['boss', 4], ['raider', 8], ['raider', 8], ['drone', 10], ['drone', 10]];
    rows.forEach(([kind, n], r) => {
      for (let i = 0; i < n; i++) {
        const sx = W / 2 + (i - (n - 1) / 2) * 16, sy = 40 + r * 14;
        // fly in from above, staggered, alternating sides
        const side = (i + r) % 2 ? -1 : 1;
        st.foes.push({ kind, sx, sy, x: W / 2 + side * (60 + Math.random() * 40), y: -20 - r * 18 - i * 6,
          hp: kind === 'boss' ? 2 : 1, mode: 'enter', t: 0, path: null });
      }
    });
  }
  const speedK = () => 1 + Math.min(1.2, (st.stage - 1) * 0.12);
  function startDive(f) {
    const p = st.player, dir = f.x < W / 2 ? 1 : -1;
    f.mode = 'dive'; f.t = 0; f.shots = st.stage > 1 ? 2 : 1; f.shotT = 0.5;
    // cubic bezier: loop out, then sweep down across the player's position
    f.path = [[f.x, f.y], [f.x - dir * 50, f.y - 40], [p.x + dir * 30, H * 0.55], [p.x - dir * 40 + (Math.random() - 0.5) * 60, H + 20]];
    beep(900, 300, 0.25, 'sawtooth', 0.04);
  }
  const bez = (P, t) => { const u = 1 - t; return [0, 1].map((k) => u * u * u * P[0][k] + 3 * u * u * t * P[1][k] + 3 * u * t * t * P[2][k] + t * t * t * P[3][k]); };
  function boom(x, y, color) { st.booms.push({ x, y, t: 0, color }); }
  function killPlayer() {
    const p = st.player; if (!p.alive || p.inv > 0) return;
    p.alive = false; boom(p.x, H - 24, '#35e0ff'); beep(400, 40, 0.8, 'sawtooth', 0.12);
    st.lives--; p.respawn = 2;
  }
  function update(dt) {
    st.t += dt; st.sway += dt;
    for (const s of st.stars) { s.y += s.v * dt; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } }
    for (const b of st.booms) b.t += dt; st.booms = st.booms.filter((b) => b.t < 0.5);
    if (st.phase !== 'play') return;
    if (st.msgT > 0) st.msgT -= dt;
    const p = st.player, k = speedK();
    if (p.alive) {
      p.x = Math.max(10, Math.min(W - 10, p.x + (inp.right - inp.left) * 110 * dt));
      if (p.inv > 0) p.inv -= dt;
      st.fireCd -= dt;
      if (inp.fire && st.fireCd <= 0 && st.shots.length < 2) { st.shots.push({ x: p.x, y: H - 34 }); st.fireCd = 0.18; beep(1400, 500, 0.08, 'square', 0.04); }
    } else if ((p.respawn -= dt) <= 0) {
      if (st.lives <= 0) { gameOver(); return; }
      p.alive = true; p.inv = 2; p.x = W / 2;
    }
    for (const s of st.shots) s.y -= 260 * dt; st.shots = st.shots.filter((s) => s.y > -6);
    for (const b of st.bombs) { b.x += b.vx * dt; b.y += b.vy * dt; } st.bombs = st.bombs.filter((b) => b.y < H + 4);
    const swayX = Math.sin(st.sway * 1.2) * 10;
    st.diveT -= dt;
    const inForm = st.foes.filter((f) => f.mode === 'form');
    if (st.diveT <= 0 && inForm.length && p.alive) {
      const n = Math.min(inForm.length, st.stage > 2 && Math.random() < 0.4 ? 2 : 1);
      for (let i = 0; i < n; i++) startDive(inForm[(Math.random() * inForm.length) | 0]);
      st.diveT = Math.max(0.55, 2.2 - st.stage * 0.18) * (0.7 + Math.random() * 0.6);
    }
    for (const f of st.foes) {
      const tx = f.sx + swayX, ty = f.sy;
      if (f.mode === 'enter') {
        f.t += dt; const a = Math.min(1, f.t * 0.9 * k);
        f.x += (tx - f.x) * Math.min(1, dt * 3 * k); f.y += (ty - f.y) * Math.min(1, dt * 2.4 * k) * a + 0;
        if (Math.abs(f.x - tx) < 1.5 && Math.abs(f.y - ty) < 1.5) f.mode = 'form';
      } else if (f.mode === 'form') { f.x = tx; f.y = ty; }
      else if (f.mode === 'dive') {
        f.t += dt * 0.42 * k; const [x, y] = bez(f.path, Math.min(1, f.t)); f.x = x; f.y = y;
        if (f.shots > 0 && (f.shotT -= dt) <= 0 && f.y < H * 0.7) {
          const dx = p.x - f.x, dy = H - 24 - f.y, d = Math.hypot(dx, dy) || 1;
          st.bombs.push({ x: f.x, y: f.y + 4, vx: dx / d * 40, vy: 120 * k }); f.shots--; f.shotT = 0.35;
        }
        if (f.t >= 1) { f.mode = 'enter'; f.t = 0; f.x = tx; f.y = -16; }
      }
      // collisions: player shots
      for (const s of st.shots) {
        if (!s.dead && Math.abs(s.x - f.x) < 6 && Math.abs(s.y - f.y) < 5) {
          s.dead = true; f.hp--;
          if (f.hp <= 0) {
            f.dead = true; const diving = f.mode === 'dive';
            st.score += { drone: 50, raider: 80, boss: 150 }[f.kind] * (diving ? 2 : 1);
            boom(f.x, f.y, f.kind === 'boss' ? '#ffd23f' : f.kind === 'raider' ? '#ff4fd8' : '#35e0ff'); beep(500, 60, 0.25, 'square', 0.06);
          } else beep(300, 200, 0.1, 'triangle', 0.06);
        }
      }
      if (p.alive && f.mode === 'dive' && Math.abs(f.x - p.x) < 9 && Math.abs(f.y - (H - 24)) < 8) { f.dead = true; boom(f.x, f.y, '#fff'); killPlayer(); }
    }
    st.shots = st.shots.filter((s) => !s.dead); st.foes = st.foes.filter((f) => !f.dead);
    if (p.alive) for (const b of st.bombs) if (Math.abs(b.x - p.x) < 5 && Math.abs(b.y - (H - 24)) < 6) { b.y = H + 10; killPlayer(); }
    if (!st.extra && st.score >= 20000) { st.extra = true; st.lives++; beep(600, 1200, 0.4, 'triangle', 0.08); }
    if (!st.foes.length) nextStage();
  }
  function gameOver() { st.phase = 'over'; st.msgT = 0; onScore('raiders', 'BLOCK RAIDERS', st.score); }
  function draw(ctx) {
    ctx.fillStyle = '#04040c'; ctx.fillRect(0, 0, W, H);
    for (const s of st.stars) { ctx.fillStyle = s.v > 55 ? '#8ab' : '#456'; ctx.fillRect(s.x | 0, s.y | 0, 1, 1); }
    const frame = (st.t * 2 | 0) % 2;
    for (const f of st.foes) {
      const img = f.kind === 'boss' ? BOSS[f.hp < 2 ? 1 : frame] : (f.kind === 'raider' ? RAIDER : DRONE)[frame];
      ctx.drawImage(img, (f.x - img.width / 2) | 0, (f.y - img.height / 2) | 0);
    }
    const p = st.player;
    if (p.alive && !(p.inv > 0 && (st.t * 10 | 0) % 2)) ctx.drawImage(SHIP, (p.x - 6) | 0, H - 29);
    ctx.fillStyle = '#fff'; for (const s of st.shots) ctx.fillRect(s.x - 0.5, s.y, 1, 5);
    ctx.fillStyle = '#ff5050'; for (const b of st.bombs) ctx.fillRect(b.x - 1, b.y - 2, 2, 4);
    for (const b of st.booms) { const r = 2 + b.t * 22; ctx.strokeStyle = b.color; ctx.globalAlpha = 1 - b.t * 2; ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
    text(ctx, 'SCORE ' + String(st.score).padStart(6, '0'), 4, 3, '#e8ecf6');
    text(ctx, 'HI ' + String(Math.max(best('raiders'), st.score)).padStart(6, '0'), W - 4, 3, '#ffd23f', 8, 'right');
    for (let i = 0; i < Math.max(0, st.lives - (p.alive ? 1 : 0)); i++) ctx.drawImage(SHIP, 4 + i * 15, H - 12, 9, 7);
    if (st.stage) text(ctx, 'STAGE ' + st.stage, W - 4, H - 11, '#8b94ab', 8, 'right');
    if (st.phase === 'title') { title(ctx, 'BLOCK RAIDERS', '#35e0ff', ['50  DRONE   ×2 DIVING', '80  RAIDER  ×2 DIVING', '150 BOSS    2 HITS']); }
    if (st.phase === 'play' && st.msgT > 0) text(ctx, 'STAGE ' + st.stage, W / 2, H / 2, '#ffd23f', 12, 'center');
    if (st.phase === 'over') over(ctx, st.score);
  }
  reset();
  return { id: 'raiders', name: 'BLOCK RAIDERS', color: '#35e0ff', reset, update, draw, inp,
    start() { if (st.phase !== 'play') { reset(); nextStage(); beep(400, 900, 0.3, 'triangle', 0.08); } },
    help: '◀ ▶ move · FIRE shoot', pads: 'shooter' };
}

// ───────────────────────────────────────────────────────────── MAZE MINER ──
// '#' wall, 'X' void, '.' hash dot, 'o' WATT cell, ' ' open, '-' bot door, 'G' bot bay, 'P' start
const MAZE = [
  '#####################',
  '#.........#.........#',
  '#o###.###.#.###.###o#',
  '#...................#',
  '#.###.#.#####.#.###.#',
  '#.....#...#...#.....#',
  '#####.### # ###.#####',
  'XXXX#.#       #.#XXXX',
  'XXXX#.# ##-## #.#XXXX',
  '     .  #GGG#  .     ',
  'XXXX#.# ##### #.#XXXX',
  'XXXX#.#       #.#XXXX',
  '#####.# ##### #.#####',
  '#.........#.........#',
  '#.###.###.#.###.###.#',
  '#o..#.....P.....#..o#',
  '###.#.#.#####.#.#.###',
  '#.....#...#...#.....#',
  '#.#######.#.#######.#',
  '#...................#',
  '#####################',
];
const MC = MAZE[0].length, MR = MAZE.length, T = 10, OX = (W - MC * T) / 2, OY = 30;
const DIRS = [[0, -1], [-1, 0], [0, 1], [1, 0]];          // up, left, down, right (tie-break order)

function makeMiner() {
  let st, inp = { want: null };
  const wall = (c, r, bot) => {
    if (r === 9 && (c < 0 || c >= MC)) return false;          // tunnel
    if (c < 0 || c >= MC || r < 0 || r >= MR) return true;
    const ch = MAZE[r][c];
    return ch === '#' || ch === 'X' || (ch === '-' && !bot);
  };
  function reset() {
    st = { score: 0, lives: 3, level: 0, phase: 'title', t: 0, extra: false };
  }
  function newLevel() {
    st.level++; st.dots = new Set();
    MAZE.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === '.' || ch === 'o') st.dots.add(c + ',' + r); }));
    st.power = new Set([...st.dots].filter((k) => { const [c, r] = k.split(',').map(Number); return MAZE[r][c] === 'o'; }));
    st.bonus = null; st.eaten = 0; placeActors();
  }
  function placeActors() {
    st.p = { c: 10, r: 15, x: 10, y: 15, d: 1, nd: 1, mouth: 0 };
    const cols = ['#ff3b3b', '#ff8ad8', '#35e0ff', '#ffb347'];
    st.bots = cols.map((color, i) => ({ id: i, color, c: i === 0 ? 10 : 8 + i, r: i === 0 ? 7 : 9, x: 0, y: 0, d: 1, home: i === 0 ? 0 : 1.5 + i * 2.5, mode: 'normal' }));
    st.bots.forEach((b) => { b.x = b.c; b.y = b.r; });
    st.modeT = 0; st.fright = 0; st.ready = 2; st.phase = 'play'; st.combo = 0;
  }
  const speed = (base) => base * (1 + Math.min(0.35, (st.level - 1) * 0.05));
  const scatter = () => { const t = st.modeT % 27; return t < 7; };
  function target(b) {
    const p = st.p, [dx, dy] = DIRS[p.d];
    if (b.mode === 'eyes') return [10, 7];
    if (scatter()) return [[MC - 2, -2], [1, -2], [MC - 1, MR + 1], [0, MR + 1]][b.id];
    if (b.id === 0) return [p.c, p.r];                                 // hunter: straight at you
    if (b.id === 1) return [p.c + dx * 4, p.r + dy * 4];                // ambusher: cuts you off
    if (b.id === 2) { const a = st.bots[0]; return [2 * (p.c + dx * 2) - a.c, 2 * (p.r + dy * 2) - a.r]; }   // flanker
    return Math.hypot(b.c - p.c, b.r - p.r) > 7 ? [p.c, p.r] : [0, MR + 1];   // wanderer: keeps its distance
  }
  function stepBot(b, dt) {
    if (b.home > 0) { b.home -= dt; b.y = 9 + Math.sin(st.t * 6 + b.id) * 0.25; return; }
    const fr = b.mode === 'fright', eyes = b.mode === 'eyes';
    const inTunnel = b.r === 9 && (b.c < 4 || b.c > MC - 5);
    let v = eyes ? 14 : fr ? speed(3.6) : inTunnel ? speed(3.5) : speed(6.4);
    let left = v * dt;
    while (left > 0) {
      const [dx, dy] = DIRS[b.d], tx = b.c + dx, ty = b.r + dy;
      const dist = Math.hypot(tx - b.x, ty - b.y);
      if (dist > left) { b.x += dx * left; b.y += dy * left; break; }
      left -= dist; b.c = tx; b.r = ty; b.x = tx; b.y = ty;
      if (b.r === 9 && b.c < -1) { b.c = MC; b.x = MC; } else if (b.r === 9 && b.c > MC) { b.c = -1; b.x = -1; }
      if (eyes && b.c === 10 && b.r === 7) { b.mode = 'normal'; b.home = 1.2; b.c = 10; b.r = 9; b.x = 10; b.y = 9; break; }
      // at a tile center: choose next direction (never reverse)
      const opts = DIRS.map((d, i) => i).filter((i) => i !== (b.d + 2) % 4 && !wall(b.c + DIRS[i][0], b.r + DIRS[i][1]));
      if (!opts.length) { b.d = (b.d + 2) % 4; continue; }
      if (fr) b.d = opts[(Math.random() * opts.length) | 0];
      else { const [gx, gy] = target(b); b.d = opts.sort((i, j) => Math.hypot(b.c + DIRS[i][0] - gx, b.r + DIRS[i][1] - gy) - Math.hypot(b.c + DIRS[j][0] - gx, b.r + DIRS[j][1] - gy))[0]; }
    }
    // leave the bay through the door
    if (b.r === 9 && b.c >= 9 && b.c <= 11 && b.home <= 0 && !eyes) { b.c = 10; b.x = 10; b.r = 8; b.y = 8.5; b.d = 0; }
  }
  function stepPlayer(dt) {
    // (c,r) is the tile the miner is heading to; (x,y) its exact position.
    const p = st.p; if (inp.want != null) p.nd = inp.want;
    let left = speed(7.2) * dt, guard = 0;
    while (left > 1e-6 && guard++ < 8) {
      if (p.nd === (p.d + 2) % 4 && (p.x !== p.c || p.y !== p.r)) { p.c -= DIRS[p.d][0]; p.r -= DIRS[p.d][1]; p.d = p.nd; }   // turn back mid-corridor
      const dist = Math.abs(p.c - p.x) + Math.abs(p.r - p.y);
      if (dist > left) { p.x += Math.sign(p.c - p.x) * left; p.y += Math.sign(p.r - p.y) * left; p.mouth += dt * 14; break; }
      left -= dist; p.x = p.c; p.y = p.r;
      if (p.r === 9 && p.c < 0) { p.c = p.x = MC - 1; } else if (p.r === 9 && p.c > MC - 1) { p.c = p.x = 0; }   // tunnel
      eat(p.c, p.r); if (st.phase !== 'play') return;
      if (!wall(p.c + DIRS[p.nd][0], p.r + DIRS[p.nd][1])) p.d = p.nd;
      if (wall(p.c + DIRS[p.d][0], p.r + DIRS[p.d][1])) break;          // stopped at a wall
      p.c += DIRS[p.d][0]; p.r += DIRS[p.d][1];
    }
  }
  function eat(c, r) {
    const k = c + ',' + r; if (!st.dots.has(k)) return;
    st.dots.delete(k); st.eaten++;
    if (st.power.has(k)) {
      st.score += 50; st.fright = Math.max(2.5, 7 - st.level * 0.6); st.combo = 0;
      st.bots.forEach((b) => { if (b.mode !== 'eyes') { b.mode = 'fright'; b.d = (b.d + 2) % 4; } }); beep(200, 800, 0.3, 'triangle', 0.07);
    } else { st.score += 10; beep(st.eaten % 2 ? 880 : 660, 600, 0.04, 'square', 0.025); }
    if (st.eaten === 60 || st.eaten === 140) st.bonus = { t: 9, pts: 100 * st.level + 200 };
    if (!st.dots.size) { st.phase = 'clear'; st.clearT = 2; beep(500, 1500, 0.6, 'triangle', 0.08); }
  }
  function update(dt) {
    st.t += dt;
    if (st.phase === 'clear') { if ((st.clearT -= dt) <= 0) newLevel(); return; }
    if (st.phase === 'dead') { if ((st.deadT -= dt) <= 0) { if (st.lives <= 0) { st.phase = 'over'; onScore('miner', 'MAZE MINER', st.score); } else placeActors(); } return; }
    if (st.phase !== 'play') return;
    if (st.ready > 0) { st.ready -= dt; return; }
    if (st.fright > 0) { st.fright -= dt; if (st.fright <= 0) st.bots.forEach((b) => { if (b.mode === 'fright') b.mode = 'normal'; }); } else st.modeT += dt;
    stepPlayer(dt);
    st.bots.forEach((b) => stepBot(b, dt));
    if (st.bonus && (st.bonus.t -= dt) <= 0) st.bonus = null;
    const p = st.p;
    if (st.bonus && Math.hypot(p.x - 10, p.y - 11) < 0.6) { st.score += st.bonus.pts; st.bonus = null; beep(700, 1400, 0.3, 'triangle', 0.08); }
    for (const b of st.bots) {
      if (b.home > 0 || b.mode === 'eyes' || Math.hypot(b.x - p.x, b.y - p.y) > 0.7) continue;
      if (b.mode === 'fright') { b.mode = 'eyes'; st.combo++; st.score += 100 * 2 ** st.combo; beep(1200, 200, 0.25, 'square', 0.06); }
      else { st.phase = 'dead'; st.deadT = 2; st.lives--; beep(800, 40, 1.2, 'sawtooth', 0.1); break; }
    }
    if (!st.extra && st.score >= 10000) { st.extra = true; st.lives++; beep(600, 1200, 0.4, 'triangle', 0.08); }
  }
  function draw(ctx) {
    ctx.fillStyle = '#04040c'; ctx.fillRect(0, 0, W, H);
    // walls: neon outlines of each wall tile edge that borders open space
    ctx.strokeStyle = '#b14bff'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let r = 0; r < MR; r++) for (let c = 0; c < MC; c++) {
      const ch = MAZE[r][c]; if (ch !== '#') continue;
      const x = OX + c * T, y = OY + r * T, open = (cc, rr) => { const q = MAZE[rr]?.[cc]; return q !== undefined && q !== '#' && q !== 'X'; };
      if (open(c, r - 1)) { ctx.moveTo(x, y + 1); ctx.lineTo(x + T, y + 1); }
      if (open(c, r + 1)) { ctx.moveTo(x, y + T - 1); ctx.lineTo(x + T, y + T - 1); }
      if (open(c - 1, r)) { ctx.moveTo(x + 1, y); ctx.lineTo(x + 1, y + T); }
      if (open(c + 1, r)) { ctx.moveTo(x + T - 1, y); ctx.lineTo(x + T - 1, y + T); }
    }
    ctx.stroke();
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(OX + 10 * T + 1, OY + 8 * T + 4, T - 2, 2);   // bay door
    if (st.dots) for (const k of st.dots) {
      const [c, r] = k.split(',').map(Number), x = OX + c * T + T / 2, y = OY + r * T + T / 2;
      if (st.power.has(k)) { if ((st.t * 4 | 0) % 2) { ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(x - 1, y - 4); ctx.lineTo(x + 3, y - 4); ctx.lineTo(x, y); ctx.lineTo(x + 2, y); ctx.lineTo(x - 2, y + 4); ctx.lineTo(x, y + 0.5); ctx.lineTo(x - 2, y + 0.5); ctx.fill(); } }
      else { ctx.fillStyle = '#35e0ff'; ctx.fillRect(x - 1, y - 1, 2, 2); }
    }
    if (st.bonus) { const x = OX + 10 * T + T / 2, y = OY + 11 * T + T / 2; ctx.fillStyle = '#3dff8a'; ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 4); ctx.lineTo(x - 4, y); ctx.fill(); }
    if (st.p && st.phase !== 'title') {
      const p = st.p, x = OX + p.x * T + T / 2, y = OY + p.y * T + T / 2;
      // miner: hard-hat helmet with a headlamp, facing its direction
      ctx.save(); ctx.translate(x, y); ctx.rotate([-Math.PI / 2, Math.PI, Math.PI / 2, 0][p.d]);
      const open = st.phase === 'dead' ? Math.min(1, (2 - st.deadT)) * Math.PI : Math.abs(Math.sin(p.mouth)) * 0.7;
      ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 4.6, open, Math.PI * 2 - open); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(-1.5, -4.6, 2, 2); ctx.restore();
      for (const b of st.bots) {
        const bx = OX + b.x * T + T / 2, by = OY + b.y * T + T / 2;
        const blink = st.fright > 0 && st.fright < 1.5 && (st.t * 6 | 0) % 2;
        if (b.mode !== 'eyes') {
          // security bot: domed body, antenna, skirt of treads
          ctx.fillStyle = b.mode === 'fright' ? (blink ? '#fff' : '#2a3cff') : b.color;
          ctx.beginPath(); ctx.arc(bx, by - 0.5, 4.5, Math.PI, 0); ctx.lineTo(bx + 4.5, by + 4.5); ctx.lineTo(bx - 4.5, by + 4.5); ctx.fill();
          ctx.fillRect(bx - 0.5, by - 7, 1, 2);
          ctx.fillStyle = '#04040c'; for (let i = 0; i < 3; i++) ctx.fillRect(bx - 4 + i * 3 + ((st.t * 8 | 0) % 2), by + 3.5, 1.5, 1);
        }
        if (b.mode !== 'fright') { const [ex, ey] = DIRS[b.d]; ctx.fillStyle = '#fff'; ctx.fillRect(bx - 3, by - 2, 2.4, 2.4); ctx.fillRect(bx + 0.6, by - 2, 2.4, 2.4); ctx.fillStyle = '#04040c'; ctx.fillRect(bx - 2.4 + ex, by - 1.4 + ey, 1.2, 1.2); ctx.fillRect(bx + 1.2 + ex, by - 1.4 + ey, 1.2, 1.2); }
        else { ctx.fillStyle = '#ffd23f'; ctx.fillRect(bx - 2.5, by - 2, 1.5, 1.5); ctx.fillRect(bx + 1, by - 2, 1.5, 1.5); }
      }
    }
    text(ctx, 'SCORE ' + String(st.score).padStart(6, '0'), 4, 4, '#e8ecf6');
    text(ctx, 'HI ' + String(Math.max(best('miner'), st.score)).padStart(6, '0'), W - 4, 4, '#ffd23f', 8, 'right');
    for (let i = 0; i < Math.max(0, st.lives - 1); i++) { ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(10 + i * 12, H - 10); ctx.arc(10 + i * 12, H - 10, 4, 0.6, Math.PI * 2 - 0.6); ctx.fill(); }
    if (st.level) text(ctx, 'LEVEL ' + st.level, W - 4, H - 14, '#8b94ab', 8, 'right');
    if (st.phase === 'play' && st.ready > 0) text(ctx, 'READY!', W / 2, OY + 11 * T, '#ffd23f', 10, 'center');
    if (st.phase === 'title') title(ctx, 'MAZE MINER', '#ffd23f', ['10   HASH DOT', '50   WATT CELL', '200+ ZAPPED BOT']);
    if (st.phase === 'over') over(ctx, st.score);
  }
  reset();
  return { id: 'miner', name: 'MAZE MINER', color: '#ffd23f', reset, update, draw, inp,
    start() { if (st.phase === 'title' || st.phase === 'over') { reset(); newLevel(); beep(400, 900, 0.3, 'triangle', 0.08); } },
    help: 'arrows / swipe to steer', pads: 'maze', get st() { return st; } };
}

function title(ctx, name, color, lines) {
  ctx.fillStyle = 'rgba(4,4,12,0.85)'; ctx.fillRect(0, 60, W, 170);
  text(ctx, name, W / 2, 80, color, 18, 'center');
  lines.forEach((l, i) => text(ctx, l, W / 2, 125 + i * 14, '#c8d0e0', 8, 'center'));
  if ((performance.now() / 500 | 0) % 2) text(ctx, 'PRESS FIRE / TAP TO START', W / 2, 200, '#e8ecf6', 8, 'center');
}
function over(ctx, score) {
  ctx.fillStyle = 'rgba(4,4,12,0.85)'; ctx.fillRect(0, 100, W, 90);
  text(ctx, 'GAME OVER', W / 2, 112, '#ff3b3b', 16, 'center');
  text(ctx, 'SCORE ' + score, W / 2, 140, '#e8ecf6', 9, 'center');
  if ((performance.now() / 500 | 0) % 2) text(ctx, 'TAP TO PLAY AGAIN', W / 2, 165, '#8b94ab', 8, 'center');
}

function onScore(id, name, score) {
  if (score > best(id)) {
    setBest(id, score);
    try { window.MGNET?.sendObj?.({ t: 'chat', text: `🕹 new ${name} high score: ${score.toLocaleString()}` }); } catch (e) { /* offline */ }
  }
}

// ───────────────────────────────────────────────────────────── overlay UI ──
let ov = null, cur = null, raf = 0, last = 0;
function openGame(game) {
  closeGame();
  cur = game; game.reset();
  ov = document.createElement('div');
  ov.id = 'mg-arcade';
  ov.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(2,2,8,0.94);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;touch-action:none;user-select:none;-webkit-user-select:none;font:13px system-ui,sans-serif;color:#e8ecf6';
  const top = document.createElement('div');
  top.style.cssText = 'display:flex;align-items:center;gap:12px;width:min(94vw,520px);justify-content:space-between';
  top.innerHTML = `<b style="color:${game.color};letter-spacing:.12em">🕹 ${game.name}</b><span style="color:#8b94ab;font-size:11px">${game.help} · Esc to exit</span>`;
  const x = document.createElement('button'); x.textContent = '✕'; x.style.cssText = 'background:#1a1d2e;border:1px solid #2c3352;color:#e8ecf6;border-radius:8px;padding:4px 10px;font-size:15px';
  x.onclick = closeGame; top.appendChild(x);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const touch = matchMedia('(pointer:coarse)').matches;
  const scale = Math.max(1, Math.min((innerWidth * 0.96) / W, (innerHeight * (touch ? 0.66 : 0.86)) / H));
  cv.style.cssText = `width:${W * scale}px;height:${H * scale}px;image-rendering:pixelated;border:2px solid ${game.color}55;border-radius:6px;box-shadow:0 0 30px ${game.color}33`;
  ov.append(top, cv);
  if (touch) ov.appendChild(pads(game));
  document.body.appendChild(ov);
  const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  // tap the screen to start; swipe on it to steer the maze game
  let sx = 0, sy = 0;
  cv.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; game.start(); e.preventDefault(); });
  cv.addEventListener('pointermove', (e) => {
    if (game.pads !== 'maze' || !(e.buttons || e.pointerType === 'touch')) return;
    const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.hypot(dx, dy) < 18) return;
    game.inp.want = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 3 : 1) : (dy > 0 ? 2 : 0); sx = e.clientX; sy = e.clientY;
  });
  last = performance.now();
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    game.update(dt); game.draw(ctx);
  };
  raf = requestAnimationFrame(loop);
  try { document.exitPointerLock?.(); } catch (e) { /* ignore */ }
}
function closeGame() {
  if (raf) cancelAnimationFrame(raf); raf = 0;
  if (ov) ov.remove(); ov = null;
  if (cur) { cur.inp.left = cur.inp.right = cur.inp.fire = 0; cur.inp.want = null; cur.reset(); } cur = null;
}
function pads(game) {
  const box = document.createElement('div');
  box.style.cssText = 'display:flex;gap:14px;align-items:center;justify-content:center;margin-top:6px';
  const btn = (label, w = 64) => { const b = document.createElement('button'); b.textContent = label; b.style.cssText = `width:${w}px;height:58px;border-radius:14px;background:#141828;border:1px solid #2c3352;color:#e8ecf6;font-size:22px;font-weight:700;touch-action:none`; return b; };
  const hold = (b, on, off) => { b.addEventListener('pointerdown', (e) => { e.preventDefault(); on(); }); ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => b.addEventListener(t, off)); };
  if (game.pads === 'shooter') {
    const l = btn('◀'), r = btn('▶'), f = btn('FIRE', 110); f.style.background = '#35e0ff22'; f.style.color = '#35e0ff';
    hold(l, () => { game.inp.left = 1; }, () => { game.inp.left = 0; });
    hold(r, () => { game.inp.right = 1; }, () => { game.inp.right = 0; });
    hold(f, () => { game.inp.fire = 1; game.start(); }, () => { game.inp.fire = 0; });
    box.append(l, r, f);
  } else {
    const grid = document.createElement('div'); grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,58px);gap:6px';
    [['', null], ['▲', 0], ['', null], ['◀', 1], ['▼', 2], ['▶', 3]].forEach(([l, d]) => {
      if (d === null) { grid.appendChild(document.createElement('span')); return; }
      const b = btn(l, 58); b.addEventListener('pointerdown', (e) => { e.preventDefault(); game.inp.want = d; game.start(); }); grid.appendChild(b);
    });
    box.appendChild(grid);
  }
  return box;
}
// keyboard while a game is open: swallow keys so the lab doesn't walk/switch rooms
window.addEventListener('keydown', (e) => {
  if (!cur) return;
  const k = e.key, g = cur;
  if (k === 'Escape') closeGame();
  else if (k === 'ArrowLeft' || k === 'a' || k === 'A') { g.inp.left = 1; g.inp.want = 1; }
  else if (k === 'ArrowRight' || k === 'd' || k === 'D') { g.inp.right = 1; g.inp.want = 3; }
  else if (k === 'ArrowUp' || k === 'w' || k === 'W') g.inp.want = 0;
  else if (k === 'ArrowDown' || k === 's' || k === 'S') g.inp.want = 2;
  else if (k === ' ' || k === 'Enter' || k === 'z' || k === 'Z') { g.inp.fire = 1; g.start(); }
  e.stopImmediatePropagation(); e.preventDefault();
}, true);
window.addEventListener('keyup', (e) => {
  if (!cur) return; const k = e.key, g = cur;
  if (k === 'ArrowLeft' || k === 'a' || k === 'A') g.inp.left = 0;
  if (k === 'ArrowRight' || k === 'd' || k === 'D') g.inp.right = 0;
  if (k === ' ' || k === 'Enter' || k === 'z' || k === 'Z') g.inp.fire = 0;
  e.stopImmediatePropagation();
}, true);

// ───────────────────────────────────────────────────────────── 3D cabinets ──
const GAMES = [makeRaiders(), makeMiner()];
const cabinets = [];
function cabinet(game, x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = -Math.PI / 2;   // face into the room
  const body = new THREE.MeshStandardMaterial({ color: 0x14172a, roughness: 0.45, metalness: 0.25 });
  const side = new THREE.MeshStandardMaterial({ color: 0x0b0d18, roughness: 0.5, metalness: 0.3 });
  const glow = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: new THREE.Color(game.color), emissiveIntensity: 1.6 });
  const add = (geo, m, px, py, pz, rx = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.rotation.x = rx; g.add(o); return o; };
  // classic upright side profile (z = toward the player, y = up), extruded across the width
  const P = [[-0.42, 0], [0.42, 0], [0.42, 0.92], [0.5, 1.02], [0.46, 1.1], [0.16, 1.16], [0.12, 1.2],
    [-0.05, 2.05], [0.26, 2.12], [0.26, 2.46], [-0.42, 2.46]];
  const shape = new THREE.Shape(); P.forEach(([pz, py], i) => (i ? shape.lineTo(pz, py) : shape.moveTo(pz, py))); shape.closePath();
  const WID = 1.04;
  const shell = new THREE.ExtrudeGeometry(shape, { depth: WID, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 3 });
  shell.translate(0, 0, -WID / 2); shell.rotateY(-Math.PI / 2);              // shape-x -> +z (front), extrusion -> x
  g.add(new THREE.Mesh(shell, [side, body]));
  // neon T-molding: a glowing tube tracing the side profile on both sides
  const path = new THREE.CurvePath();
  P.concat([P[0]]).forEach((q, i, arr) => { if (i) path.add(new THREE.LineCurve3(new THREE.Vector3(0, arr[i - 1][1], arr[i - 1][0]), new THREE.Vector3(0, q[1], q[0]))); });
  [-1, 1].forEach((sx) => { const t = new THREE.Mesh(new THREE.TubeGeometry(path, 160, 0.018, 6, false), glow); t.position.x = sx * (WID / 2 + 0.03); g.add(t); });
  // screen on the slanted face, set in a black bezel
  const tilt = -Math.atan2(0.17, 0.85), sy = 1.625, sz = 0.12 - 0.17 * ((sy - 1.2) / 0.85);
  const nrm = new THREE.Vector3(0, Math.sin(-tilt), Math.cos(tilt));
  const bez = add(new THREE.PlaneGeometry(0.9, 0.84), new THREE.MeshStandardMaterial({ color: 0x020205, roughness: 0.2, metalness: 0.4 }), 0, sy + nrm.y * 0.03, sz + nrm.z * 0.03, tilt);
  const sc = document.createElement('canvas'); sc.width = W; sc.height = H;
  const tex = new THREE.CanvasTexture(sc); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter;
  add(new THREE.PlaneGeometry(0.62, 0.8), new THREE.MeshBasicMaterial({ map: tex }), 0, sy + nrm.y * 0.034, sz + nrm.z * 0.034, tilt);
  // control panel: joystick + two buttons on the sloped deck
  const deck = -Math.atan2(0.06, 0.3);
  add(new THREE.CylinderGeometry(0.06, 0.07, 0.02, 16), side, -0.2, 1.11, 0.33, deck);
  add(new THREE.CylinderGeometry(0.012, 0.012, 0.13), new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.8, roughness: 0.3 }), -0.2, 1.18, 0.33);
  add(new THREE.SphereGeometry(0.045, 14, 10), new THREE.MeshStandardMaterial({ color: 0xff3b3b, roughness: 0.3 }), -0.2, 1.255, 0.33);
  [0.08, 0.24].forEach((bx, i) => add(new THREE.CylinderGeometry(0.042, 0.042, 0.035, 18), new THREE.MeshStandardMaterial({ color: 0x111111, emissive: new THREE.Color(i ? 0x35e0ff : game.color), emissiveIntensity: 0.9 }), bx, 1.13, 0.31, deck));
  // coin door
  add(new THREE.PlaneGeometry(0.34, 0.3), new THREE.MeshStandardMaterial({ color: 0x24283c, metalness: 0.7, roughness: 0.35 }), 0, 0.6, 0.451);
  [-0.07, 0.07].forEach((cx2) => add(new THREE.PlaneGeometry(0.05, 0.09), new THREE.MeshBasicMaterial({ color: 0xff5a3c }), cx2, 0.64, 0.453));
  // lit marquee
  const mc = document.createElement('canvas'); mc.width = 512; mc.height = 160; const mx = mc.getContext('2d');
  const grd = mx.createLinearGradient(0, 0, 0, 160); grd.addColorStop(0, '#0b0e1c'); grd.addColorStop(1, '#05060c');
  mx.fillStyle = grd; mx.fillRect(0, 0, 512, 160); mx.shadowColor = game.color; mx.shadowBlur = 24;
  mx.fillStyle = game.color; mx.font = 'bold 70px "Courier New", monospace'; mx.textAlign = 'center'; mx.textBaseline = 'middle'; mx.fillText(game.name, 256, 84);
  const mt = new THREE.CanvasTexture(mc); mt.colorSpace = THREE.SRGBColorSpace;
  add(new THREE.PlaneGeometry(1.02, 0.32), new THREE.MeshBasicMaterial({ map: mt }), 0, 2.29, 0.29);
  const light = new THREE.PointLight(new THREE.Color(game.color), 0.6, 4); light.position.set(0, 1.7, 0.8); g.add(light);
  g.userData.arcade = game;
  MG().scene.add(g);
  cabinets.push({ g, game, sc, tex });
}
function attract(c) {
  const x = c.sc.getContext('2d'); c.game.draw(x);
}

const ray = new THREE.Raycaster();
let prompt = null, near = null;
function inLoungeNow() { const cam = MG()?.cam; return cam && cam.position.z < LZ + 40; }
function onDown(ev) {
  if (!cabinets.length || !inLoungeNow() || ov) return;
  const canvas = MG().controls.domElement, r = canvas.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1), MG().cam);
  for (const c of cabinets) if (ray.intersectObject(c.g, true).length) { ev.stopImmediatePropagation(); ev.preventDefault(); openGame(c.game); return; }
}
let lastAttract = 0;
function tick(now) {
  requestAnimationFrame(tick);
  if (!cabinets.length) return;
  const vis = inLoungeNow();
  for (const c of cabinets) c.g.visible = vis;
  if (!vis) { if (prompt) prompt.style.display = 'none'; return; }
  if (now - lastAttract > 120 && !ov) {           // animate attract screens ~8 fps
    lastAttract = now;
    for (const c of cabinets) { if (c.game !== cur) { c.game.update(0.12); attract(c); c.tex.needsUpdate = true; } }
  }
  const cam = MG().cam; near = null;
  for (const c of cabinets) if (cam.position.distanceTo(c.g.getWorldPosition(new THREE.Vector3())) < 3.6) near = c;
  if (prompt) { prompt.style.display = near && !ov ? 'block' : 'none'; if (near) prompt.textContent = `🕹 tap the cabinet to play ${near.game.name}`; }
}

(function boot(t = 0) {
  if (MG() && MG().scene && MG().controls && MG().cam) {
    // flank the ARCADE doorway on the lounge's right wall
    cabinet(GAMES[0], LX + LW / 2 - 1.0, LZ - 2.3);
    cabinet(GAMES[1], LX + LW / 2 - 1.0, LZ + 2.3);
    MG().controls.domElement.addEventListener('pointerdown', onDown, true);
    prompt = document.createElement('div');
    prompt.style.cssText = 'position:fixed;left:50%;bottom:110px;transform:translateX(-50%);z-index:30;background:rgba(6,8,14,.85);border:1px solid #2c3352;border-radius:12px;padding:8px 14px;color:#e8ecf6;font:13px system-ui;display:none;pointer-events:none';
    document.body.appendChild(prompt);
    window.MGARCADE = { open: (id) => openGame(GAMES.find((g) => g.id === id) || GAMES[0]), close: closeGame, games: GAMES };
    requestAnimationFrame(tick);
  } else if (t < 600) setTimeout(() => boot(t + 1), 250);
})();
