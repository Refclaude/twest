/* QUIZEEY · theme.js — Klasik / Liquid Glass (gradasi) / Material You (warna kustom) */
const Theme = (() => {
  'use strict';
  const KEY = 'quizeey_theme';
  const DEF = { theme: 'klasik', lg: { c1: '#2347d6', c2: '#0ea5e9', angle: 135 }, md: { seed: '#2347d6', mode: 'auto' } };
  const LG = [['Aurora', '#7c3aed', '#06b6d4'], ['Senja', '#be123c', '#f97316'], ['Samudra', '#1e3a8a', '#0ea5e9'], ['Hutan', '#064e3b', '#10b981'],
    ['Sakura', '#9d174d', '#f9a8d4'], ['Malam', '#0f172a', '#6d28d9'], ['Bara', '#450a0a', '#ea580c'], ['Pagi', '#fde68a', '#bae6fd']];
  const MD = ['#2347d6', '#6750a4', '#006a6a', '#2e7d32', '#c2185b', '#b26a00', '#5d4037', '#455a64'];
  const THEMES = [['klasik', 'Klasik'], ['liquid', 'Liquid Glass'], ['material', 'Material You']];

  let S;
  try {
    const sv = JSON.parse(localStorage.getItem(KEY) || '{}');
    S = { theme: sv.theme || DEF.theme, lg: Object.assign({}, DEF.lg, sv.lg), md: Object.assign({}, DEF.md, sv.md) };
  } catch (e) { S = JSON.parse(JSON.stringify(DEF)); }

  const rgb = (h) => { h = h.replace('#', ''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const lum = (c) => { const f = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
  function hsl2rgb(h, s, l) {
    h = ((h % 360) + 360) % 360;
    const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [f(0), f(8), f(4)].map((v) => Math.round(v * 255));
  }
  function rgb2hsl(c) {
    const r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, M = Math.max(r, g, b), m = Math.min(r, g, b), l = (M + m) / 2;
    let h = 0, s = 0;
    if (M !== m) {
      const d = M - m; s = l > .5 ? d / (2 - M - m) : d / (M + m);
      h = M === r ? (g - b) / d + (g < b ? 6 : 0) : M === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60;
    }
    return [h, s, l];
  }

  /* Palet tonal bergaya Material You (pendekatan HSL, bukan HCT resmi) */
  function palette(seed, dark) {
    const hs = rgb2hsl(rgb(seed)), h = hs[0], s = Math.min(Math.max(hs[1], .3), .8);
    const P = (hh, ss, t) => hsl2rgb(hh, ss, t / 100);
    const pr = (t) => P(h, s, t), se = (t) => P(h, s * .3, t), ne = (t) => P(h, .08, t), nv = (t) => P(h, .14, t);
    const T = dark
      ? { p: 80, op: 20, pc: 30, opc: 90, sc: 30, osc: 90, sf: 6, l: 10, c: 12, hi: 17, os: 90, ov: 80, ol: 60, ovr: 30, is: 90, ios: 20 }
      : { p: 40, op: 100, pc: 90, opc: 10, sc: 90, osc: 10, sf: 98, l: 96, c: 94, hi: 92, os: 10, ov: 30, ol: 50, ovr: 80, is: 20, ios: 95 };
    return {
      'primary': pr(T.p), 'on-primary': pr(T.op), 'secondary-container': se(T.sc), 'on-secondary-container': se(T.osc),
      'surface': ne(T.sf), 'surface-container-low': ne(T.l), 'surface-container': ne(T.c), 'surface-container-high': ne(T.hi),
      'on-surface': ne(T.os), 'on-surface-variant': nv(T.ov), 'outline': nv(T.ol), 'outline-variant': nv(T.ovr),
      'inverse-surface': ne(T.is), 'inverse-on-surface': ne(T.ios)
    };
  }

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* abaikan */ } };

  function apply() {
    const r = document.documentElement, st = r.style;
    r.setAttribute('data-theme', S.theme);

    const a = rgb(S.lg.c1), b = rgb(S.lg.c2), darkText = lum(mix(a, b, .5)) > .4;
    st.setProperty('--lg-1', S.lg.c1); st.setProperty('--lg-2', S.lg.c2); st.setProperty('--lg-angle', S.lg.angle + 'deg');
    st.setProperty('--lg-text', darkText ? '16,24,40' : '255,255,255');
    st.setProperty('--lg-shade', darkText ? '255,255,255' : '8,12,28');
    r.setAttribute('data-lg-text', darkText ? 'dark' : 'light');

    const mdDark = S.md.mode === 'dark' || (S.md.mode === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    const pal = palette(S.md.seed, mdDark);
    Object.keys(pal).forEach((k) => st.setProperty('--md-' + k, hex(pal[k])));
    r.setAttribute('data-scheme', mdDark ? 'dark' : 'light');

    let chrome = '#0e1330', scheme = 'dark';
    if (S.theme === 'liquid') { chrome = S.lg.c1; scheme = darkText ? 'light' : 'dark'; }
    if (S.theme === 'material') { chrome = hex(pal.surface); scheme = mdDark ? 'dark' : 'light'; }
    st.colorScheme = scheme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', chrome);
    sync();
  }

  let panel = null;
  const q = (s) => (panel ? panel.querySelector(s) : null);

  function sync() {
    if (!panel) return;
    panel.querySelectorAll('[data-act="theme"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === S.theme)));
    panel.querySelectorAll('[data-for]').forEach((p) => { p.hidden = p.dataset.for !== S.theme; });
    panel.querySelectorAll('[data-act="lg-preset"]').forEach((b) => { const p = LG[b.dataset.i]; b.setAttribute('aria-pressed', String(p[1] === S.lg.c1 && p[2] === S.lg.c2)); });
    panel.querySelectorAll('[data-act="md-preset"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === S.md.seed)));
    panel.querySelectorAll('[data-act="md-mode"]').forEach((b) => b.classList.toggle('is-active', b.dataset.v === S.md.mode));
    q('#lg-c1').value = S.lg.c1; q('#lg-c2').value = S.lg.c2; q('#lg-angle').value = S.lg.angle;
    q('#lg-angle-val').textContent = S.lg.angle; q('#md-seed').value = S.md.seed;
  }

  function mount(el) {
    panel = el;
    el.innerHTML =
      '<span class="field-label">Tampilan</span>' +
      '<div class="theme-tiles" role="group" aria-label="Pilih tampilan">' +
      THEMES.map((t) => '<button type="button" class="theme-tile" data-act="theme" data-v="' + t[0] + '"><span class="tile-prev tile-prev--' + t[0] + '"></span>' + t[1] + '</button>').join('') + '</div>' +
      '<div data-for="klasik" class="stack"><p class="muted">Tema bawaan Quizeey: biru tinta dengan permukaan gelap.</p></div>' +
      '<div data-for="liquid" class="stack">' +
      '<span class="field-label">Pilihan gradasi</span><div class="swatches">' +
      LG.map((p, i) => '<button type="button" class="swatch swatch--wide" data-act="lg-preset" data-i="' + i + '" aria-label="Gradasi ' + p[0] + '" title="' + p[0] + '"></button>').join('') + '</div>' +
      '<span class="field-label">Gradasi kustom</span><div class="grad-preview"></div>' +
      '<div class="pair"><div class="field"><label for="lg-c1">Warna awal</label><input class="input" type="color" id="lg-c1" data-act="lg-custom"></div>' +
      '<div class="field"><label for="lg-c2">Warna akhir</label><input class="input" type="color" id="lg-c2" data-act="lg-custom"></div></div>' +
      '<div class="field"><label for="lg-angle">Arah gradasi: <span id="lg-angle-val">135</span>&deg;</label><input type="range" id="lg-angle" min="0" max="360" data-act="lg-custom"></div></div>' +
      '<div data-for="material" class="stack"><span class="field-label">Warna utama</span><div class="swatches">' +
      MD.map((c) => '<button type="button" class="swatch" data-act="md-preset" data-v="' + c + '" aria-label="Warna ' + c + '"></button>').join('') + '</div>' +
      '<div class="field"><label for="md-seed">Warna kustom</label><input class="input" type="color" id="md-seed" data-act="md-seed"></div>' +
      '<span class="field-label">Mode</span><div class="tabs">' +
      [['light', 'Terang'], ['dark', 'Gelap'], ['auto', 'Otomatis']].map((m) => '<button type="button" class="tab" data-act="md-mode" data-v="' + m[0] + '">' + m[1] + '</button>').join('') + '</div></div>';

    el.querySelectorAll('[data-act="lg-preset"]').forEach((b) => { const p = LG[b.dataset.i]; b.style.setProperty('--sw', p[1]); b.style.setProperty('--sw2', p[2]); });
    el.querySelectorAll('[data-act="md-preset"]').forEach((b) => b.style.setProperty('--sw', b.dataset.v));

    el.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-act]'); if (!b) return;
      const act = b.dataset.act;
      if (act === 'theme') S.theme = b.dataset.v;
      else if (act === 'lg-preset') { S.lg.c1 = LG[b.dataset.i][1]; S.lg.c2 = LG[b.dataset.i][2]; }
      else if (act === 'md-preset') S.md.seed = b.dataset.v;
      else if (act === 'md-mode') S.md.mode = b.dataset.v;
      save(); apply();
    });
    el.addEventListener('input', (e) => {
      const act = e.target.dataset.act;
      if (act === 'lg-custom') { S.lg.c1 = q('#lg-c1').value; S.lg.c2 = q('#lg-c2').value; S.lg.angle = +q('#lg-angle').value; }
      else if (act === 'md-seed') S.md.seed = e.target.value;
      else return;
      save(); apply();
    });
    sync();
  }

  apply();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (S.md.mode === 'auto') apply(); });
  return { mount };
})();
