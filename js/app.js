/* QUIZEEY · app.js — lapisan data cloud (JSONBin), login/daftar, beranda siswa */
const App = (() => {
  'use strict';
  const cfg = Object.assign({ binId: '', apiKey: '', schoolName: '', seedAdmins: [] }, window.QUIZEEY_CONFIG);
  const SESSION_KEY = 'portal_ujian_session'; // sama dengan versi lama agar sesi tetap kompatibel
  const $ = (s) => document.querySelector(s);
  const cloudReady = () => Boolean(cfg.binId && cfg.apiKey);
  const endpoint = () => 'https://api.jsonbin.io/v3/b/' + cfg.binId;

  let data = { users: {}, rooms: {}, globalAnnouncement: null, admins: cfg.seedAdmins.slice() };
  let me = null;
  let authMode = 'login';

  /* ---------- util ---------- */
  function toast(message, type) {
    const el = document.createElement('div');
    el.className = 'toast'; el.dataset.type = type || 'info'; el.textContent = message;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.classList.add('is-leaving'); setTimeout(() => el.remove(), 260); }, 3200);
  }
  function setSync(text, state) { const el = $('#sync-status'); el.textContent = text; el.dataset.state = state; }
  async function hashPassword(text) {
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (e) { return text; }
  }

  /* ---------- data cloud (logika sama dengan versi lama) ---------- */
  async function fetchCloud() {
    if (!cloudReady()) { setSync('Mode lokal', 'offline'); return; }
    try {
      const res = await fetch(endpoint() + '/latest', { headers: { 'X-Master-Key': cfg.apiKey } });
      if (!res.ok) throw new Error(res.status);
      const json = await res.json();
      if (json.record) data = Object.assign({}, data, json.record, { users: json.record.users || {}, rooms: json.record.rooms || {}, admins: json.record.admins || data.admins });
      setSync('Cloud terhubung', 'online');
    } catch (e) { setSync('Cloud tidak terjangkau', 'error'); }
  }
  async function saveCloud() {
    if (!cloudReady()) return true;
    try {
      const res = await fetch(endpoint(), { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Master-Key': cfg.apiKey }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(res.status);
      return true;
    } catch (e) { toast('Data belum tersimpan. Periksa koneksi lalu coba lagi.', 'error'); return false; }
  }

  /* ---------- tampilan ---------- */
  function renderRank() {
    const list = $('#rank-list'); list.replaceChildren();
    const rows = Object.keys(data.users).map((n) => ({ n, p: Number(data.users[n].points) || 0 })).sort((a, b) => b.p - a.p).slice(0, 10);
    if (!rows.length) { const li = document.createElement('li'); li.className = 'muted'; li.textContent = 'Belum ada peringkat. Selesaikan kuis pertama untuk muncul di sini.'; list.appendChild(li); return; }
    rows.forEach((r, i) => {
      const li = document.createElement('li');
      const pos = document.createElement('span'); pos.className = 'rank__pos'; pos.textContent = '#' + (i + 1);
      const name = document.createElement('span'); name.textContent = r.n;
      const pts = document.createElement('span'); pts.className = 'rank__pts'; pts.textContent = r.p + ' poin';
      li.append(pos, name, pts); list.appendChild(li);
    });
  }
  function renderSession() {
    const isUser = me && me.role === 'user', rec = isUser ? data.users[me.username] : null;
    $('#coin-pill').hidden = !isUser;
    $('#drawer-foot').hidden = !me;
    if (rec) {
      $('#coin-value').textContent = rec.coins || 0; $('#user-name').textContent = me.username;
      $('#stat-points').textContent = rec.points || 0; $('#stat-coins').textContent = rec.coins || 0;
    }
    if (me && !isUser) $('#admin-role').textContent = me.role;
  }

  /* ---------- login / daftar ---------- */
  function setAuthMode(mode) {
    authMode = mode;
    document.querySelectorAll('#auth-tabs .tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.mode === mode)));
    $('#auth-submit').textContent = mode === 'login' ? 'Masuk' : 'Buat akun siswa';
    $('#auth-password').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
    formError('', null);
  }
  function formError(msg, field) {
    $('#auth-error').textContent = msg;
    ['#auth-username', '#auth-password'].forEach((s) => $(s).removeAttribute('aria-invalid'));
    if (field) { $(field).setAttribute('aria-invalid', 'true'); $(field).focus(); }
  }
  function startSession(username, role) {
    me = { username, role };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(me));
    if (role === 'user') {
      const u = data.users[username];
      if (typeof u.coins !== 'number') u.coins = 0;
      if (typeof u.points !== 'number') u.points = 0;
      if (!Array.isArray(u.unlockedItems)) u.unlockedItems = [];
    }
    renderSession(); Router.go(role === 'user' ? '/beranda' : '/admin');
  }
  async function submitAuth(e) {
    e.preventDefault();
    const username = $('#auth-username').value.trim(), password = $('#auth-password').value.trim();
    if (username.length < 3) return formError('Username minimal 3 karakter.', '#auth-username');
    if (password.length < 4) return formError('Password minimal 4 karakter.', '#auth-password');
    formError('', null);
    const btn = $('#auth-submit'), label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Memeriksa…';
    try {
      await fetchCloud();
      const staff = data.admins.find((a) => a.username.toLowerCase() === username.toLowerCase() && a.password === password);
      if (staff) { startSession(staff.username, staff.role); toast('Selamat datang, ' + staff.username + '.', 'success'); return; }

      const key = Object.keys(data.users).find((k) => k.toLowerCase() === username.toLowerCase());
      const hash = await hashPassword(password);
      if (authMode === 'register') {
        if (key) return formError('Username sudah dipakai. Pilih username lain.', '#auth-username');
        data.users[username] = {
          passwordHash: hash, points: 0, coins: 0,
          unlockedItems: ['badan_1', 'badan_2', 'kulit_1', 'kulit_2', 'kulit_3', 'kulit_4', 'celana_1', 'celana_5', 'baju_1', 'baju_2', 'sepatu_1', 'wajah_1', 'rambut_1', 'rambut_2'],
          equipped: { struktur_badan: 'struktur_blocky.png', kulit: 'kulit_cerah.png', baju: 'baju_osis.png', celana: 'celana_biru.png', sepatu: 'sepatu_sekolah.png', wajah: 'wajah_senyum.png', rambut: 'rambut_rapi.png' }
        };
        if (await saveCloud()) { toast('Akun dibuat. Silakan masuk.', 'success'); $('#auth-password').value = ''; setAuthMode('login'); }
        return;
      }
      if (!key) return formError('Username belum terdaftar. Cek ejaan atau buka tab Daftar.', '#auth-username');
      const rec = data.users[key];
      if (rec.passwordHash !== hash && rec.password !== password) return formError('Password salah, coba lagi.', '#auth-password');
      if (!rec.passwordHash) { rec.passwordHash = hash; delete rec.password; await saveCloud(); }
      startSession(key, 'user'); toast('Berhasil masuk sebagai ' + key + '.', 'success');
    } finally { btn.disabled = false; btn.textContent = authMode === 'login' ? 'Masuk' : 'Buat akun siswa'; }
  }
  function logout() {
    me = null; sessionStorage.removeItem(SESSION_KEY);
    closeDrawer(); renderSession(); $('#auth-password').value = '';
    Router.go('/masuk'); toast('Kamu sudah keluar.');
  }

  /* ---------- drawer ---------- */
  let lastFocus = null;
  function openDrawer() { lastFocus = document.activeElement; $('#drawer').classList.add('is-open'); $('#drawer-close').focus(); }
  function closeDrawer() { $('#drawer').classList.remove('is-open'); if (lastFocus) lastFocus.focus(); }

  /* ---------- router hook ---------- */
  async function onRoute(p) {
    if (p === '/beranda') { await fetchCloud(); renderRank(); renderSession(); }
  }

  /* ---------- boot ---------- */
  async function boot() {
    Theme.mount($('#theme-panel'));
    if (cfg.schoolName) { $('#school-name').textContent = cfg.schoolName; $('#school-name').hidden = false; }
    $('#auth-form').addEventListener('submit', submitAuth);
    $('#auth-tabs').addEventListener('click', (e) => { const t = e.target.closest('.tab'); if (t) setAuthMode(t.dataset.mode); });
    $('#toggle-pass').addEventListener('click', (e) => {
      const input = $('#auth-password'), show = input.type === 'password';
      input.type = show ? 'text' : 'password'; e.currentTarget.textContent = show ? 'Sembunyi' : 'Lihat'; e.currentTarget.setAttribute('aria-pressed', String(show));
    });
    $('#btn-menu').addEventListener('click', openDrawer);
    $('#drawer-close').addEventListener('click', closeDrawer);
    $('#drawer-scrim').addEventListener('click', closeDrawer);
    $('#btn-logout').addEventListener('click', logout);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

    await fetchCloud();
    renderRank();
    try {
      const s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      if (s && s.role === 'user' && data.users[s.username]) me = s;
      else if (s && (s.role === 'owner' || s.role === 'admin') && data.admins.some((a) => a.username === s.username)) me = s;
    } catch (e) { me = null; }
    renderSession();
    Router.render();
  }

  document.addEventListener('DOMContentLoaded', boot);
  return { session: () => me, onRoute, toast };
})();
