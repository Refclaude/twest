import { APP_CONFIG } from "./config.js";

export function normalizeHash(rawHash) {
  if (!rawHash || rawHash === "#" || rawHash === "#/") {
    return "#/masuk";
  }
  const clean = rawHash.startsWith("#") ? rawHash : "#" + rawHash;
  return APP_CONFIG.routes.includes(clean) ? clean : "#/masuk";
}

export function focusActiveHeading(mainEl) {
  requestAnimationFrame(() => {
    const h1 = mainEl.querySelector("h1");
    if (h1) {
      if (!h1.hasAttribute("tabindex")) {
        h1.setAttribute("tabindex", "-1");
      }
      h1.focus({ preventScroll: true });
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  });
}

export function createRouter({ getUser, setReturnTo, getReturnTo, onRender, mainEl }) {
  function resolveAndRender(isRouteChange = false) {
    const route = normalizeHash(window.location.hash);
    const user = getUser();

    if (APP_CONFIG.protectedRoutes.has(route) && !user) {
      setReturnTo(route);
      if (window.location.hash !== "#/masuk") {
        window.location.replace("#/masuk");
        return;
      }
    }

    if (route === "#/masuk" && user) {
      const fallbackDest = user.role === "admin" ? "#/admin" : "#/beranda";
      const target = getReturnTo() || fallbackDest;
      window.location.replace(target);
      return;
    }

    const effectiveRoute = APP_CONFIG.protectedRoutes.has(route) && !user ? "#/masuk" : route;
    onRender(effectiveRoute, isRouteChange);
    focusActiveHeading(mainEl);
  }

  function navigateTo(hashRoute) {
    if (window.location.hash === hashRoute) {
      resolveAndRender(true);
    } else {
      window.location.hash = hashRoute;
    }
  }

  function start() {
    window.addEventListener("hashchange", () => resolveAndRender(true));
    if (!window.location.hash) {
      window.location.replace("#/masuk");
    }
    resolveAndRender(false);
  }

  return { start, navigateTo, resolveAndRender };
}
