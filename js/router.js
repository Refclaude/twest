/* QUIZEEY · router.js — routing berbasis hash + penjaga login */
const Router = (() => {
  'use strict';
  const routes = {
    '/masuk': { auth: null, title: 'Masuk' },
    '/beranda': { auth: 'user', title: 'Beranda' },
    '/kuis': { auth: 'user', title: 'Kuis' },
    '/avatar': { auth: 'user', title: 'Avatar' },
    '/admin': { auth: 'staff', title: 'Pengawas' }
  };
  const current = () => location.hash.replace(/^#/, '') || '/masuk';
  const go = (p) => { if (current() === p) render(); else location.hash = p; };

  function render() {
    let p = current();
    if (!routes[p]) p = '/masuk';
    const me = window.App && App.session();
    const need = routes[p].auth;
    if (need && !me) return go('/masuk');
    if (!need && me) return go(me.role === 'user' ? '/beranda' : '/admin');
    if (need === 'user' && me.role !== 'user') return go('/admin');
    if (need === 'staff' && me.role === 'user') return go('/beranda');

    document.querySelectorAll('[data-view]').forEach((v) => { v.hidden = v.dataset.view !== p; });
    document.title = routes[p].title + ' · Quizeey';
    const h1 = document.querySelector('[data-view="' + p + '"] h1');
    if (h1) { h1.tabIndex = -1; h1.focus({ preventScroll: true }); }
    window.scrollTo(0, 0);
    if (window.App && App.onRoute) App.onRoute(p);
  }

  window.addEventListener('hashchange', render);
  return { go, render, current };
})();
