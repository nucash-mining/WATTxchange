/* ================= SIGN IN WITH X =================
   Players can sign in with their X (Twitter) account: a popup goes to the lounge
   server's /auth/x/start, X asks them to approve, and the server hands back a signed
   session (handle + avatar only — no X token ever reaches the browser). The game sends
   that session with its lounge hello, so everyone sees a verified "@handle".
   UI: a chip above the lounge bar, plus a row in the wallet sign-in picker. */
const AUTH = 'https://lounge.wattxchange.app';
const KEY = 'mgX';
const get = () => { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } };
const set = (v) => { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch (e) { /* */ } };
function profile() {
  const t = get(); if (!t) return null;
  try { const o = JSON.parse(atob(t.split('.')[0].replace(/-/g, '+').replace(/_/g, '/'))); return o.exp > Date.now() ? o : (set(''), null); } catch (e) { return null; }
}
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// session arriving by redirect (#mgx=…) when a popup wasn't possible
(function fromHash() {
  const m = location.hash.match(/[#&]mgx=([^&]+)/); if (!m) return;
  set(decodeURIComponent(m[1]));
  history.replaceState(null, '', location.pathname + location.search + location.hash.replace(/[#&]?mgx=[^&]+/, '').replace(/^#$/, ''));
})();
// …or by postMessage from the popup
window.addEventListener('message', (e) => {
  if (e.origin !== AUTH || !e.data || typeof e.data.mgx !== 'string') return;
  set(e.data.mgx); render(); toast(`Signed in as @${profile()?.u || ''} — reconnecting…`);
  setTimeout(() => location.reload(), 900);          // re-join the lounge with the verified name
});

function signIn() {
  const ret = location.href.split('#')[0];
  const url = `${AUTH}/auth/x/start?return=${encodeURIComponent(ret)}`;
  const w = window.open(url, 'mg-x-signin', 'width=520,height=720');
  if (!w) { try { (window.top || window).location.href = url; } catch (e) { location.href = url; } }
}
function signOut() { set(''); render(); toast('Signed out of X'); setTimeout(() => location.reload(), 700); }

let chip = null;
function render() {
  if (!chip) {
    chip = document.createElement('div'); chip.id = 'mg-xchip';
    chip.style.cssText = 'position:fixed;left:12px;bottom:62px;z-index:60;display:flex;align-items:center;gap:6px;background:rgba(8,10,18,.85);border:1px solid #2a3350;color:#e6ebf5;border-radius:999px;padding:4px 10px 4px 4px;font:600 12px system-ui;cursor:pointer;max-width:60vw';
    chip.onclick = () => (profile() ? (confirmOut()) : signIn());
    document.body.appendChild(chip);
  }
  const p = profile();
  chip.innerHTML = p
    ? `${p.img ? `<img src="${esc(p.img)}" alt="" style="width:22px;height:22px;border-radius:50%">` : '<span style="width:22px;text-align:center">𝕏</span>'}<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">@${esc(p.u)}</span>`
    : '<span style="width:22px;height:22px;border-radius:50%;background:#000;display:grid;place-items:center;font-weight:900">𝕏</span><span>Sign in with X</span>';
}
function confirmOut() {
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;left:12px;bottom:96px;z-index:61;background:#11141f;border:1px solid #2a3350;border-radius:12px;padding:10px;color:#e6ebf5;font:13px system-ui;display:flex;gap:8px;align-items:center';
  box.innerHTML = `Signed in as <b>@${esc(profile()?.u)}</b><button style="background:#3a1220;border:1px solid #a33a4a;color:#fff;border-radius:8px;padding:5px 9px;cursor:pointer">Sign out</button><button style="background:#161b2b;border:1px solid #2a3350;color:#fff;border-radius:8px;padding:5px 9px;cursor:pointer">✕</button>`;
  const [o, x] = box.querySelectorAll('button'); o.onclick = () => { box.remove(); signOut(); }; x.onclick = () => box.remove();
  document.body.appendChild(box); setTimeout(() => box.remove(), 6000);
}
function toast(t) { const el = document.createElement('div'); el.textContent = t; el.style.cssText = 'position:fixed;left:50%;top:90px;transform:translateX(-50%);z-index:2147483001;background:rgba(8,10,18,.92);border:1px solid #2a3350;color:#e6ebf5;padding:8px 14px;border-radius:12px;font:14px system-ui'; document.body.appendChild(el); setTimeout(() => el.remove(), 2600); }

// add an X row to the wallet sign-in picker
(function hookPicker(t = 0) {
  if (typeof window.openWalletPicker !== 'function') { if (t < 120) setTimeout(() => hookPicker(t + 1), 500); return; }
  const orig = window.openWalletPicker;
  window.openWalletPicker = function (...a) {
    const r = orig.apply(this, a);
    const body = document.getElementById('wpick-body');
    if (body && !body.querySelector('#wpick-x')) {
      const p = profile(), row = document.createElement('div'); row.id = 'wpick-x';
      row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px;border:1px solid #2a3350;border-radius:12px;margin:8px 0 2px;cursor:pointer;background:#0b0d16';
      row.innerHTML = `<span style="width:26px;height:26px;border-radius:6px;background:#000;color:#fff;display:grid;place-items:center;font-weight:900">𝕏</span><div><div style="font-weight:700">${p ? '@' + esc(p.u) : 'Sign in with X'}</div><div style="color:var(--dim,#8b94ab);font-size:11px">${p ? 'signed in — your @handle shows in the lounge · tap to sign out' : 'show your verified @handle in the lounge (can be used with a wallet too)'}</div></div>`;
      row.onclick = () => (p ? signOut() : signIn());
      body.prepend(row);
    }
    return r;
  };
})();

(function boot(t = 0) { if (document.body) { render(); window.MGX = { profile, signIn, signOut, token: get }; } else if (t < 100) setTimeout(() => boot(t + 1), 100); })();
