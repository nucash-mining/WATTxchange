/* ================= LOUNGE PHYSICS (pure math, no three.js) =================
   Shared by loungeplus.js (browser) and the node tests. Everything is in world
   units on the floor plane (x, z) except the camera ray clamp, which is 3D.
   Colliders are axis-aligned boxes { x0, x1, z0, z1 } (floor footprint); the
   player is a circle of radius r. */

/** How deep a circle (cx, cz, r) sits inside one box; 0 = no contact. */
export function boxPen(b, cx, cz, r) {
  const qx = Math.max(b.x0, Math.min(b.x1, cx)), qz = Math.max(b.z0, Math.min(b.z1, cz));
  const dx = cx - qx, dz = cz - qz, d2 = dx * dx + dz * dz;
  if (d2 > 0) { const d = Math.sqrt(d2); return d < r ? r - d : 0; }
  // centre is inside the box: depth = distance to the nearest edge + r
  return r + Math.min(cx - b.x0, b.x1 - cx, cz - b.z0, b.z1 - cz);
}
/** Total penetration of a circle against every box (cheap broad phase on the bbox). */
export function penAt(boxes, cx, cz, r) {
  let p = 0;
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i];
    if (cx + r <= b.x0 || cx - r >= b.x1 || cz + r <= b.z0 || cz - r >= b.z1) continue;
    p += boxPen(b, cx, cz, r);
  }
  return p;
}
const EPS = 1e-6;
/** Try one axis move; returns the largest fraction of `d` that is allowed.
    A move is allowed when it ends with no contact, or (already stuck inside
    something — a stand-up from a chair, a prop dragged onto you) when it does
    not make the overlap worse, so you can always walk OUT of a collider. */
function axisMove(boxes, x, z, d, axisX, r) {
  if (!d) return 0;
  const p0 = penAt(boxes, x, z, r);
  const ok = (f) => { const p = penAt(boxes, axisX ? x + d * f : x, axisX ? z : z + d * f, r); return p <= EPS || (p0 > EPS && p <= p0 + 1e-9); };
  if (ok(1)) return d;
  // binary search the contact point so you slide right up to the surface
  let lo = 0, hi = 1;
  for (let i = 0; i < 8; i++) { const m = (lo + hi) / 2; if (ok(m)) lo = m; else hi = m; }
  return d * lo;
}
/** Axis-separated sliding move of a circle through the boxes.
    (x, z) = current centre, (dx, dz) = wanted step. Sub-steps long moves so a
    big frame (dt clamp 0.5 s) can't tunnel through a thin bar or table. */
export function resolveMove(boxes, x, z, dx, dz, r = 0.6) {
  const len = Math.hypot(dx, dz), n = Math.max(1, Math.ceil(len / (r * 0.5)));
  let cx = x, cz = z;
  const sx = dx / n, sz = dz / n;
  for (let i = 0; i < n; i++) {
    cx += axisMove(boxes, cx, cz, sx, true, r);
    cz += axisMove(boxes, cx, cz, sz, false, r);
  }
  return { x: cx, z: cz, dx: cx - x, dz: cz - z };
}

/** Keep a camera inside an axis-aligned room box.
    t = orbit target / eye anchor (inside the room), c = wanted camera position.
    Pulls the camera back along the t→c ray to the first wall/ceiling/floor it
    would cross (minus a margin), so the view never pokes through. Mutates and
    returns c. room = { x0, x1, y0, y1, z0, z1 }. */
export function clampCamRay(t, c, room) {
  // the anchor itself must be inside, or the ray test is meaningless
  const tx = Math.max(room.x0, Math.min(room.x1, t.x)), ty = Math.max(room.y0, Math.min(room.y1, t.y)), tz = Math.max(room.z0, Math.min(room.z1, t.z));
  const dx = c.x - tx, dy = c.y - ty, dz = c.z - tz;
  let s = 1;
  const lim = (d, p, lo, hi) => { if (d > EPS && p + d > hi) s = Math.min(s, (hi - p) / d); else if (d < -EPS && p + d < lo) s = Math.min(s, (lo - p) / d); };
  lim(dx, tx, room.x0, room.x1); lim(dy, ty, room.y0, room.y1); lim(dz, tz, room.z0, room.z1);
  s = Math.max(0, s);
  c.x = tx + dx * s; c.y = ty + dy * s; c.z = tz + dz * s;
  return c;
}
/** Shorten a third-person boom (body → camera) so it stops short of any box
    whose top is above the camera ray. boxes carry y1 (top). Returns 0..1. */
export function boomFraction(boxes, bx, bz, by, cx, cz, cy, r = 0.25) {
  let s = 1;
  for (const b of boxes) {
    if (b.y1 !== undefined && b.y1 < Math.min(by, cy)) continue;     // the whole ray passes over it
    // slab test of the segment against the box grown by r
    const x0 = b.x0 - r, x1 = b.x1 + r, z0 = b.z0 - r, z1 = b.z1 + r;
    const dx = cx - bx, dz = cz - bz; let t0 = 0, t1 = 1;
    const slab = (p, d, lo, hi) => { if (Math.abs(d) < EPS) return p >= lo && p <= hi; let a = (lo - p) / d, c = (hi - p) / d; if (a > c) [a, c] = [c, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, c); return t0 <= t1; };
    if (!slab(bx, dx, x0, x1) || !slab(bz, dz, z0, z1)) continue;
    if (t0 <= 0) continue;                          // the body is inside/at it already — ignore
    // height of the ray where it enters the box: blocked only if below the top
    const yAt = by + (cy - by) * t0;
    if (b.y1 !== undefined && yAt > b.y1) continue;
    s = Math.min(s, Math.max(0, t0 - 0.02));
  }
  return s;
}
