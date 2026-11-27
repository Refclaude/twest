import { APP_CONFIG } from "./config.js";

const STORAGE_KEY = "portal_sekolah_theme";

export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const initial = APP_CONFIG.themes.includes(saved) ? saved : APP_CONFIG.themes[0];
  applyTheme(initial);
  return initial;
}

export function applyTheme(themeName) {
  const valid = APP_CONFIG.themes.includes(themeName) ? themeName : APP_CONFIG.themes[0];
  document.documentElement.setAttribute("data-theme", valid);
  localStorage.setItem(STORAGE_KEY, valid);
  return valid;
}

export function cycleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || APP_CONFIG.themes[0];
  const nextIndex = (APP_CONFIG.themes.indexOf(current) + 1) % APP_CONFIG.themes.length;
  return applyTheme(APP_CONFIG.themes[nextIndex]);
}

export function getTokenColor(varName) {
  if (!varName) return "transparent";
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}
