import { APP_CONFIG, DEMO_USERS, SAMPLE_QUESTION, AVATAR_CATALOG } from "./config.js";
import { initTheme, cycleTheme, getTokenColor } from "./theme.js";
import { createRouter } from "./router.js";

const ICONS = {
  check: `<svg class="ds-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  cross: `<svg class="ds-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  coin: `<svg class="ds-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M14.5 9.5a2.5 2.5 0 0 0-5 0c0 2.5 5 2 5 5a2.5 2.5 0 0 1-5 0"></path><line x1="12" y1="6.5" x2="12" y2="17.5"></line></svg>`,
  alert: `<svg class="ds-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
};

const state = {
  user: null,
  returnTo: "#/beranda",
  authMode: "login",
  loginError: "",
  showPassword: false,
  loginEntrancePlayed: false,
  coinGlintPending: false,
  previousCoins: 340,
  quiz: {
    mode: "idle",
    selectedOptionId: null,
    justSelectedId: null
  },
  adminTab: "koreksi",
  leaderboard: [
    { name: "Nadia Ayu", points: 1800, isMe: false },
    { name: "Bima Sakti", points: 1520, isMe: false },
    { name: "Raka Pratama", points: 1250, isMe: true },
    { name: "Dewi Lestari", points: 1100, isMe: false }
  ],
  selectedAvatar: { rambut: "hair1", baju: "uni1", aksesori: "none" },
  activeAvatarCategory: "rambut",
  correctionQueue: [
    { id: "#104", student: "Raka Pratama", room: "Sumatif IPA", status: "Menunggu koreksi uraian" },
    { id: "#105", student: "Nadia Ayu", room: "Latihan Matematika", status: "Menunggu koreksi uraian" }
  ],
  adminQuestions: [
    { id: "Q-01", text: "Perubahan wujud gas menjadi cair disebut?", key: "B" },
    { id: "Q-02", text: "Hasil dari 3x + 5 = 20 adalah x = ?", key: "5" }
  ],
  rooms: [
    { code: "IPA-8G", title: "Sumatif IPA Bab 3", status: "Aktif" },
    { code: "MTK-8G", title: "Latihan Aljabar", status: "Aktif" }
  ]
};

const mainEl = document.getElementById("appMain");
const navEl = document.getElementById("mainNav");
const logoutBtn = document.getElementById("logoutBtn");
const themeCycleBtn = document.getElementById("themeCycleBtn");
const overlayRoot = document.getElementById("overlayRoot");
const toastRegion = document.getElementById("toastRegion");
const brandNameText = document.getElementById("brandNameText");

let activeAvatarResizeObserver = null;
let lastFocusedTrigger = null;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function triggerPageTransition() {
  mainEl.classList.remove("anim-page-transition");
  void mainEl.offsetWidth;
  mainEl.classList.add("anim-page-transition");
}

function showToast(message, isError = false) {
  const toast = document.createElement("div");
  toast.className = `ds-toast ${isError ? "is-error" : ""}`;
  toast.setAttribute("role", "status");
  toast.innerHTML = `${isError ? ICONS.alert : ICONS.check}<span>${escapeHtml(message)}</span>`;
  toastRegion.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

function animateCoinCounter(el, startVal, endVal) {
  if (!el) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || startVal === endVal) {
    el.textContent = Number(endVal).toLocaleString("id-ID");
    return;
  }
  const duration = 400;
  const startTime = performance.now();
  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(startVal + (endVal - startVal) * eased);
    el.textContent = current.toLocaleString("id-ID");
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function setupOverlayFocusTrap(dialogEl, closeFn) {
  if (!dialogEl) return () => {};
  lastFocusedTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  dialogEl.focus();

  const getFocusable = () =>
    Array.from(
      dialogEl.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
    );

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeFn();
      return;
    }
    if (e.key === "Tab") {
      const items = getFocusable();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  document.addEventListener("keydown", onKeyDown);
  return () => {
    document.removeEventListener("keydown", onKeyDown);
    if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === "function") {
      lastFocusedTrigger.focus();
    }
  };
}

function bindTablistKeyboard(containerEl) {
  containerEl.querySelectorAll('[role="tablist"]').forEach((tablist) => {
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    tabs.forEach((tab, idx) => {
      tab.addEventListener("keydown", (e) => {
        let targetIdx = null;
        if (e.key === "ArrowRight") targetIdx = (idx + 1) % tabs.length;
        if (e.key === "ArrowLeft") targetIdx = (idx - 1 + tabs.length) % tabs.length;
        if (targetIdx !== null) {
          e.preventDefault();
          tabs[targetIdx].focus();
          tabs[targetIdx].click();
        }
      });
    });
  });
}

function drawAvatarCanvas(canvas) {
  if (!canvas || !canvas.parentElement) return;
  const rect = canvas.parentElement.getBoundingClientRect();
  const cssWidth = Math.max(120, rect.width);
  const cssHeight = cssWidth * (4 / 3);
  const dpr = Math.min(window.devicePixelRatio || 1, 3);

  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const cx = cssWidth / 2;
  const shirt = AVATAR_CATALOG.baju.find((b) => b.id === state.selectedAvatar.baju) || AVATAR_CATALOG.baju[0];
  const hair = AVATAR_CATALOG.rambut.find((r) => r.id === state.selectedAvatar.rambut) || AVATAR_CATALOG.rambut[0];
  const acc = AVATAR_CATALOG.aksesori.find((a) => a.id === state.selectedAvatar.aksesori) || AVATAR_CATALOG.aksesori[0];

  const skinColor = getTokenColor("--color-avatar-skin");
  const inkColor = getTokenColor("--color-avatar-ink");

  ctx.fillStyle = getTokenColor(shirt.colorToken);
  ctx.beginPath();
  ctx.roundRect(cx - cssWidth * 0.28, cssHeight * 0.56, cssWidth * 0.56, cssHeight * 0.38, 16);
  ctx.fill();

  const headR = cssWidth * 0.19;
  const headY = cssHeight * 0.36;
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(cx, headY, headR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = inkColor;
  ctx.beginPath();
  ctx.arc(cx - headR * 0.36, headY - headR * 0.05, headR * 0.1, 0, Math.PI * 2);
  ctx.arc(cx + headR * 0.36, headY - headR * 0.05, headR * 0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = inkColor;
  ctx.lineWidth = Math.max(2, cssWidth * 0.012);
  ctx.beginPath();
  ctx.arc(cx, headY + headR * 0.15, headR * 0.32, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  if (hair.id !== "none") {
    ctx.fillStyle = getTokenColor(hair.colorToken);
    ctx.beginPath();
    ctx.arc(cx, headY - headR * 0.15, headR * 1.03, Math.PI, 0);
    ctx.fill();
  }

  if (acc.id === "acc1") {
    ctx.strokeStyle = getTokenColor(acc.colorToken);
    ctx.lineWidth = Math.max(2, cssWidth * 0.012);
    const lensR = headR * 0.28;
    ctx.strokeRect(cx - headR * 0.65, headY - lensR * 0.7, lensR * 1.8, lensR * 1.3);
    ctx.strokeRect(cx + headR * 0.15, headY - lensR * 0.7, lensR * 1.8, lensR * 1.3);
    ctx.beginPath();
    ctx.moveTo(cx - headR * 0.15, headY - headR * 0.05);
    ctx.lineTo(cx + headR * 0.15, headY - headR * 0.05);
    ctx.stroke();
  }
}

function bindResponsiveAvatarCanvas(canvasId) {
  if (activeAvatarResizeObserver) {
    activeAvatarResizeObserver.disconnect();
    activeAvatarResizeObserver = null;
  }
  const canvas = document.getElementById(canvasId);
  if (!canvas || !canvas.parentElement) return;
  drawAvatarCanvas(canvas);
  if (typeof ResizeObserver !== "undefined") {
    activeAvatarResizeObserver = new ResizeObserver(() => drawAvatarCanvas(canvas));
    activeAvatarResizeObserver.observe(canvas.parentElement);
  }
}

function updateNavState(activeRoute) {
  const isLoggedIn = Boolean(state.user);
  navEl.classList.toggle("is-hidden", activeRoute === "#/masuk");
  logoutBtn.classList.toggle("is-hidden", !isLoggedIn);

  navEl.querySelectorAll(".nav-link").forEach((link) => {
    const target = link.getAttribute("data-route");
    const hideAdmin = target === "#/admin" && state.user?.role !== "admin";
    link.classList.toggle("is-hidden", hideAdmin);

    if (target === activeRoute) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function renderLogin(router) {
  const isLogin = state.authMode === "login";
  const shouldPlayEntrance = !state.loginEntrancePlayed;
  state.loginEntrancePlayed = true;

  mainEl.removeAttribute("data-quiz-active");
  mainEl.innerHTML = `
    <div class="login-wrap">
      <section class="ds-card login-card ${shouldPlayEntrance ? "anim-login-card" : ""}" aria-labelledby="loginH1">
        <div class="login-school">
          <span class="brand-logo ${shouldPlayEntrance ? "anim-login-logo" : ""}" aria-hidden="true">${escapeHtml(APP_CONFIG.schoolShortCode)}</span>
          <div>
            <div class="login-school-sub">${escapeHtml(APP_CONFIG.schoolName)}</div>
            <h1 id="loginH1" class="u-m-0">${isLogin ? "Masuk Portal" : "Daftar Baru"}</h1>
          </div>
        </div>

        <div class="ds-segmented auth-tabs-grid" role="tablist" aria-label="Mode Autentikasi">
          <button type="button" role="tab" class="ds-tab" aria-selected="${isLogin}" data-auth-tab="login">Masuk</button>
          <button type="button" role="tab" class="ds-tab" aria-selected="${!isLogin}" data-auth-tab="register">Daftar Baru</button>
        </div>

        <form id="authForm" novalidate>
          <h2 class="sr-only">${isLogin ? "Form Masuk" : "Form Daftar Baru"}</h2>

          ${!isLogin ? `
            <div class="field">
              <label for="fullNameInput">Nama Lengkap</label>
              <input id="fullNameInput" name="name" type="text" class="ds-input" autocomplete="name" placeholder="Contoh: Raka Pratama" required />
            </div>
          ` : ""}

          <div class="field">
            <label for="usernameInput">Username</label>
            <input id="usernameInput" name="username" type="text" class="ds-input" autocomplete="username" placeholder="Masukkan username" required />
          </div>

          <div class="field">
            <label for="passwordInput">Password</label>
            <div class="password-row">
              <input
                id="passwordInput"
                name="password"
                type="${state.showPassword ? "text" : "password"}"
                class="ds-input ${state.loginError ? "is-error" : ""}"
                autocomplete="${isLogin ? "current-password" : "new-password"}"
                placeholder="Masukkan password"
                required
              />
              <button
                type="button"
                class="ds-btn ds-btn--outline"
                id="togglePassBtn"
                aria-pressed="${state.showPassword}"
              >${state.showPassword ? "Sembunyi" : "Lihat"}</button>
            </div>
            ${state.loginError ? `
              <p class="error-msg" role="alert" aria-live="polite">${ICONS.alert}<span>${escapeHtml(state.loginError)}</span></p>
            ` : ""}
          </div>

          <button type="submit" class="ds-btn ds-btn--solid u-w-full">
            ${isLogin ? "Masuk" : "Daftar Baru"}
          </button>
        </form>

        <p class="u-m-0 u-mt-3 u-text-xs u-muted">
          Akun uji coba: <strong>siswa1</strong> / <strong>123</strong> atau <strong>admin1</strong> / <strong>123</strong>.
        </p>
      </section>
    </div>
  `;

  bindTablistKeyboard(mainEl);

  mainEl.querySelectorAll("[data-auth-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.authMode = btn.getAttribute("data-auth-tab");
      state.loginError = "";
      renderLogin(router);
    });
  });

  document.getElementById("togglePassBtn")?.addEventListener("click", () => {
    state.showPassword = !state.showPassword;
    const val = document.getElementById("passwordInput")?.value || "";
    renderLogin(router);
    const nextInput = document.getElementById("passwordInput");
    if (nextInput) {
      nextInput.value = val;
      nextInput.focus();
    }
  });

  document.getElementById("authForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = (document.getElementById("usernameInput")?.value || "").trim();
    const password = document.getElementById("passwordInput")?.value || "";

    if (!username) {
      state.loginError = "Username wajib diisi.";
      renderLogin(router);
      document.getElementById("usernameInput")?.focus();
      return;
    }
    if (!password) {
      state.loginError = "Password wajib diisi.";
      renderLogin(router);
      document.getElementById("passwordInput")?.focus();
      return;
    }

    if (state.authMode === "register") {
      const fullName = (document.getElementById("fullNameInput")?.value || "").trim() || username;
      DEMO_USERS[username] = { username, name: fullName, role: "student", password, points: 100, coins: 50 };
      state.user = DEMO_USERS[username];
      state.previousCoins = 50;
      state.loginError = "";
      router.navigateTo("#/beranda");
      return;
    }

    const found = DEMO_USERS[username];
    if (!found) {
      state.loginError = "Username tidak ditemukan, coba lagi";
      renderLogin(router);
      document.getElementById("usernameInput")?.focus();
      return;
    }
    if (found.password !== password) {
      state.loginError = "Password salah, coba lagi";
      renderLogin(router);
      document.getElementById("passwordInput")?.focus();
      return;
    }

    state.user = found;
    state.previousCoins = found.coins;
    state.loginError = "";
    const dest = found.role === "admin" && state.returnTo === "#/beranda" ? "#/admin" : state.returnTo;
    state.returnTo = "#/beranda";
    router.navigateTo(dest);
  });
}

function renderStudentHome(router) {
  const u = state.user;
  const glintCoin = state.coinGlintPending;
  state.coinGlintPending = false;
  mainEl.removeAttribute("data-quiz-active");

  mainEl.innerHTML = `
    <div class="stack">
      <section class="ds-card" aria-labelledby="homeH1">
        <div class="greeting-grid">
          <div>
            <h1 id="homeH1" class="u-m-0">Halo, ${escapeHtml(u.name)}!</h1>
            <p class="u-m-0 u-mt-1 u-muted">Siap melanjutkan latihan atau sesi ujian hari ini.</p>
          </div>
          <div class="wallet-badges" aria-label="Saldo Poin dan Koin">
            <span class="badge-stat">Poin: ${Number(u.points).toLocaleString("id-ID")}</span>
            <span class="badge-stat badge-coin">
              <span class="u-inline-flex ${glintCoin ? "anim-coin-glint" : ""}">${ICONS.coin}</span>
              <span>Koin: <strong id="coinCounterVal">${Number(u.coins).toLocaleString("id-ID")}</strong></span>
            </span>
          </div>
        </div>
      </section>

      <section class="ds-card" aria-labelledby="aksiH2">
        <h2 id="aksiH2">Aksi Utama</h2>
        <div class="actions-grid">
          <div class="ds-card">
            <h3>Latihan Mandiri</h3>
            <p class="u-m-0 u-mb-3 u-muted">Kerjakan soal latihan dan raih koin tambahan.</p>
            <a href="#/kuis" class="ds-btn ds-btn--solid">Mulai Latihan Mandiri</a>
          </div>
          <div class="ds-card">
            <h3>Gabung Room</h3>
            <p class="u-m-0 u-mb-3 u-muted">Masuk ke ruang ujian menggunakan kode dari guru.</p>
            <button type="button" class="ds-btn ds-btn--soft" id="openJoinModalBtn">Gabung Room</button>
          </div>
        </div>
      </section>

      <div class="home-lower-grid">
        <section class="ds-card" aria-labelledby="lbH2">
          <h2 id="lbH2">Papan Peringkat</h2>
          <ol class="leaderboard-list">
            ${state.leaderboard.map((row, idx) => `
              <li class="lb-item ${row.isMe ? "is-me" : ""}">
                <span>#${idx + 1} ${escapeHtml(row.name)}</span>
                <span>${Number(row.points).toLocaleString("id-ID")} poin</span>
              </li>
            `).join("")}
          </ol>
        </section>

        <section class="ds-card" aria-labelledby="avatarH2">
          <h2 id="avatarH2">Avatar Studio</h2>
          <div class="avatar-canvas-box">
            <canvas id="homeAvatarCanvas" aria-label="Pratinjau Avatar Siswa"></canvas>
          </div>
          <div class="btn-cluster">
            <a href="#/avatar" class="ds-btn ds-btn--outline">Buka Studio Penuh</a>
            <button type="button" class="ds-btn ds-btn--ghost" id="openHelpDrawerBtn">Panduan Poin</button>
          </div>
        </section>
      </div>
    </div>
  `;

  bindResponsiveAvatarCanvas("homeAvatarCanvas");

  if (glintCoin) {
    animateCoinCounter(document.getElementById("coinCounterVal"), state.previousCoins, u.coins);
    state.previousCoins = u.coins;
  }

  document.getElementById("openJoinModalBtn")?.addEventListener("click", () => openJoinRoomModal(router));
  document.getElementById("openHelpDrawerBtn")?.addEventListener("click", openGuideDrawer);
}

function renderQuiz() {
  const q = state.quiz;
  const isAnswering = q.mode === "answering";
  const isGraded = q.mode === "graded";

  if (isAnswering) {
    mainEl.setAttribute("data-quiz-active", "true");
  } else {
    mainEl.removeAttribute("data-quiz-active");
  }

  mainEl.innerHTML = `
    <div class="stack">
      <section class="ds-card" aria-labelledby="quizH1">
        <div class="greeting-grid">
          <div>
            <h1 id="quizH1" class="u-m-0">Kuis &amp; Latihan Mandiri</h1>
            <p class="u-m-0 u-mt-1 u-muted">
              ${isAnswering ? "Mode fokus soal aktif — animasi dinonaktifkan agar konsentrasi terjaga." : "Pilih mode untuk mulai mengerjakan soal."}
            </p>
          </div>
          ${q.mode === "idle" ? `
            <button type="button" class="ds-btn ds-btn--solid" id="startQuizBtn">Mulai Kerjakan Soal</button>
          ` : ""}
        </div>
      </section>

      ${q.mode !== "idle" ? `
        <section class="ds-card" aria-labelledby="soalH2">
          <h2 id="soalH2">Soal 1 dari 1</h2>
          <p>${escapeHtml(SAMPLE_QUESTION.prompt)}</p>

          <div class="quiz-options-list" role="radiogroup" aria-label="Pilihan Jawaban">
            ${SAMPLE_QUESTION.options.map((opt) => {
              const isSelected = q.selectedOptionId === opt.id;
              const isCorrect = isGraded && opt.id === SAMPLE_QUESTION.correctId;
              const isIncorrect = isGraded && isSelected && opt.id !== SAMPLE_QUESTION.correctId;
              const shouldBounce = !isAnswering && q.justSelectedId === opt.id;

              let stateClass = "";
              if (isCorrect) stateClass = "is-correct";
              else if (isIncorrect) stateClass = "is-incorrect";
              else if (isSelected) stateClass = "is-selected";

              return `
                <button
                  type="button"
                  role="radio"
                  class="ds-quiz-option ${stateClass} ${shouldBounce ? "is-just-selected" : ""}"
                  aria-checked="${isSelected}"
                  ${isGraded ? "disabled" : ""}
                  data-opt-id="${opt.id}"
                >
                  <span class="quiz-option-main">
                    <strong>${opt.id}.</strong>
                    <span>${escapeHtml(opt.text)}</span>
                  </span>
                  ${isCorrect ? `<span class="quiz-option-badge">${ICONS.check}<span>Benar</span></span>` : ""}
                  ${isIncorrect ? `<span class="quiz-option-badge">${ICONS.cross}<span>Salah</span></span>` : ""}
                </button>
              `;
            }).join("")}
          </div>

          ${!isGraded ? `
            <div class="btn-cluster">
              <button type="button" class="ds-btn ds-btn--solid" id="submitAnswerBtn" ${!q.selectedOptionId ? "disabled" : ""}>
                Periksa Jawaban
              </button>
            </div>
          ` : `
            <div class="btn-cluster">
              <a href="#/beranda" class="ds-btn ds-btn--solid">Kembali ke Beranda &amp; Lihat Koin</a>
              <button type="button" class="ds-btn ds-btn--outline" id="retryQuizBtn">Ulangi Latihan</button>
            </div>
          `}
        </section>
      ` : ""}
    </div>
  `;

  q.justSelectedId = null;

  document.getElementById("startQuizBtn")?.addEventListener("click", () => {
    state.quiz = { mode: "answering", selectedOptionId: null, justSelectedId: null };
    renderQuiz();
  });

  mainEl.querySelectorAll("[data-opt-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (state.quiz.mode === "graded") return;
      const picked = btn.getAttribute("data-opt-id");
      state.quiz.selectedOptionId = picked;
      state.quiz.justSelectedId = picked;
      renderQuiz();
    });
  });

  document.getElementById("submitAnswerBtn")?.addEventListener("click", () => {
    if (!state.quiz.selectedOptionId) return;
    state.quiz.mode = "graded";
    const won = state.quiz.selectedOptionId === SAMPLE_QUESTION.correctId;
    if (won && state.user) {
      state.previousCoins = state.user.coins;
      state.user.coins += 25;
      state.user.points += 50;
      state.coinGlintPending = true;
      showToast("Jawaban benar! +25 koin ditambahkan.");
    } else {
      showToast("Jawaban belum tepat, pelajari pembahasan.", true);
    }
    renderQuiz();
  });

  document.getElementById("retryQuizBtn")?.addEventListener("click", () => {
    state.quiz = { mode: "answering", selectedOptionId: null, justSelectedId: null };
    renderQuiz();
  });
}

function renderAvatarPage() {
  mainEl.removeAttribute("data-quiz-active");
  const categories = [
    { key: "rambut", label: "Rambut" },
    { key: "baju", label: "Baju" },
    { key: "aksesori", label: "Aksesori" }
  ];
  const activeCat = state.activeAvatarCategory;
  const items = AVATAR_CATALOG[activeCat] || [];

  mainEl.innerHTML = `
    <div class="stack">
      <section class="ds-card" aria-labelledby="avatarPageH1">
        <h1 id="avatarPageH1">Avatar Studio</h1>
        <div class="avatar-studio-layout">
          <div class="avatar-canvas-box">
            <canvas id="studioAvatarCanvas" aria-label="Kanvas Avatar Studio"></canvas>
          </div>

          <div>
            <h2>Kategori</h2>
            <div class="chip-row u-mb-4">
              ${categories.map((c) => `
                <button type="button" class="ds-chip" aria-pressed="${c.key === activeCat}" data-cat="${c.key}">${c.label}</button>
              `).join("")}
            </div>

            <h2>Pilihan Item</h2>
            <div class="avatar-items-grid">
              ${items.map((item) => `
                <button type="button" class="ds-avatar-item" aria-pressed="${state.selectedAvatar[activeCat] === item.id}" data-pick="${item.id}">
                  <span>${escapeHtml(item.label)}</span>
                </button>
              `).join("")}
            </div>
          </div>
        </div>
      </section>
    </div>
  `;

  bindResponsiveAvatarCanvas("studioAvatarCanvas");

  mainEl.querySelectorAll("[data-cat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeAvatarCategory = btn.getAttribute("data-cat");
      renderAvatarPage();
    });
  });

  mainEl.querySelectorAll("[data-pick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedAvatar[activeCat] = btn.getAttribute("data-pick");
      showToast("Tampilan avatar diperbarui.");
      renderAvatarPage();
    });
  });
}

function renderAdmin() {
  mainEl.removeAttribute("data-quiz-active");
  const tab = state.adminTab;
  mainEl.innerHTML = `
    <div class="stack">
      <section class="ds-card" aria-labelledby="adminH1">
        <h1 id="adminH1">Beranda Admin</h1>

        <div class="ds-segmented" role="tablist" aria-label="Tab Admin">
          <button type="button" role="tab" class="ds-tab" aria-selected="${tab === "room"}" data-admin-tab="room">Room</button>
          <button type="button" role="tab" class="ds-tab" aria-selected="${tab === "koreksi"}" data-admin-tab="koreksi">Koreksi (${state.correctionQueue.length})</button>
          <button type="button" role="tab" class="ds-tab" aria-selected="${tab === "sistem"}" data-admin-tab="sistem">Sistem</button>
        </div>

        <div class="admin-grid">
          <section aria-labelledby="adminMainH2">
            ${tab === "koreksi" ? `
              <h2 id="adminMainH2">Antrean Koreksi Jawaban</h2>
              ${state.correctionQueue.length === 0 ? `<p>Semua antrean koreksi telah selesai.</p>` : state.correctionQueue.map((item) => `
                <div class="queue-item">
                  <div><strong>${escapeHtml(item.id)} · ${escapeHtml(item.student)}</strong></div>
                  <div class="u-muted u-text-sm">${escapeHtml(item.room)} — ${escapeHtml(item.status)}</div>
                  <div>
                    <button type="button" class="ds-btn ds-btn--solid" data-grade-id="${escapeHtml(item.id)}">Selesaikan Koreksi</button>
                  </div>
                </div>
              `).join("")}
            ` : tab === "room" ? `
              <h2 id="adminMainH2">Editor Soal &amp; Daftar Room</h2>
              <form id="addQuestionForm" class="editor-form-grid">
                <div>
                  <label for="newQText" class="field-label-sm">Pertanyaan Baru</label>
                  <input id="newQText" type="text" class="ds-input" placeholder="Tulis butir soal..." required />
                </div>
                <div>
                  <label for="newQKey" class="field-label-sm">Kunci Jawaban</label>
                  <input id="newQKey" type="text" class="ds-input" placeholder="Contoh: B" required />
                </div>
                <button type="submit" class="ds-btn ds-btn--solid">Tambah Soal</button>
              </form>

              <div class="ds-table-wrap">
                <table class="ds-table ds-table--stack">
                  <thead><tr><th>ID</th><th>Pertanyaan</th><th>Kunci</th></tr></thead>
                  <tbody>
                    ${state.adminQuestions.map((q) => `
                      <tr>
                        <td data-label="ID">${escapeHtml(q.id)}</td>
                        <td data-label="Pertanyaan">${escapeHtml(q.text)}</td>
                        <td data-label="Kunci">${escapeHtml(q.key)}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            ` : `
              <h2 id="adminMainH2">Status Sistem</h2>
              <p>Routing hash aktif, proteksi rute berfungsi, dan tema sinkron dengan token semantic.</p>
            `}
          </section>

          <section aria-labelledby="adminSideH2">
            <h2 id="adminSideH2">Ringkasan</h2>
            <div class="lb-item u-mb-2"><span>Antrean Koreksi</span><strong>${state.correctionQueue.length}</strong></div>
            <div class="lb-item"><span>Room Aktif</span><strong>${state.rooms.length}</strong></div>
          </section>
        </div>
      </section>
    </div>
  `;

  bindTablistKeyboard(mainEl);

  mainEl.querySelectorAll("[data-admin-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.adminTab = btn.getAttribute("data-admin-tab");
      renderAdmin();
    });
  });

  mainEl.querySelectorAll("[data-grade-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-grade-id");
      state.correctionQueue = state.correctionQueue.filter((q) => q.id !== id);
      showToast(`Koreksi ${id} selesai disimpan.`);
      renderAdmin();
    });
  });

  document.getElementById("addQuestionForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = (document.getElementById("newQText")?.value || "").trim();
    const key = (document.getElementById("newQKey")?.value || "").trim();
    if (!text || !key) return;
    const nextNum = String(state.adminQuestions.length + 1).padStart(2, "0");
    state.adminQuestions.push({ id: `Q-${nextNum}`, text, key });
    showToast(`Soal Q-${nextNum} ditambahkan.`);
    renderAdmin();
  });
}

function openJoinRoomModal(router) {
  overlayRoot.innerHTML = `
    <div class="ds-modal-backdrop" id="modalBackdrop">
      <div class="ds-modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle" tabindex="-1">
        <h2 id="modalTitle">Gabung Room Ujian</h2>
        <p>Masukkan kode room yang dibagikan guru pengawas.</p>
        <form id="modalRoomForm">
          <div class="field">
            <label for="modalCodeInput">Kode Room</label>
            <input id="modalCodeInput" type="text" class="ds-input" placeholder="Contoh: IPA-8G" required />
          </div>
          <div class="btn-cluster u-justify-end">
            <button type="button" class="ds-btn ds-btn--outline" id="closeModalBtn">Batal</button>
            <button type="submit" class="ds-btn ds-btn--solid">Masuk Room</button>
          </div>
        </form>
      </div>
    </div>
  `;

  let cleanupTrap = null;
  const close = () => {
    overlayRoot.innerHTML = "";
    if (cleanupTrap) cleanupTrap();
  };
  cleanupTrap = setupOverlayFocusTrap(overlayRoot.querySelector(".ds-modal"), close);

  document.getElementById("closeModalBtn")?.addEventListener("click", close);
  document.getElementById("modalBackdrop")?.addEventListener("click", (e) => {
    if (e.target.id === "modalBackdrop") close();
  });
  document.getElementById("modalRoomForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const code = (document.getElementById("modalCodeInput")?.value || "").trim().toUpperCase();
    close();
    showToast(`Berhasil bergabung ke room ${code}.`);
    router.navigateTo("#/kuis");
  });
}

function openGuideDrawer() {
  overlayRoot.innerHTML = `
    <div class="ds-drawer-backdrop" id="drawerBackdrop">
      <aside class="ds-drawer" role="dialog" aria-modal="true" aria-labelledby="drawerTitle" tabindex="-1">
        <div class="drawer-header-row">
          <h2 id="drawerTitle" class="u-m-0">Panduan Poin &amp; Koin</h2>
          <button type="button" class="ds-btn ds-btn--ghost" id="closeDrawerBtn">Tutup</button>
        </div>
        <p>Setiap jawaban benar pada latihan mandiri memberikan tambahan poin peringkat dan koin untuk membuka item baru di Avatar Studio.</p>
      </aside>
    </div>
  `;

  let cleanupTrap = null;
  const close = () => {
    overlayRoot.innerHTML = "";
    if (cleanupTrap) cleanupTrap();
  };
  cleanupTrap = setupOverlayFocusTrap(overlayRoot.querySelector(".ds-drawer"), close);

  document.getElementById("closeDrawerBtn")?.addEventListener("click", close);
  document.getElementById("drawerBackdrop")?.addEventListener("click", (e) => {
    if (e.target.id === "drawerBackdrop") close();
  });
}

// Inisialisasi aplikasi
initTheme();
if (brandNameText) {
  brandNameText.textContent = APP_CONFIG.schoolName;
}

const router = createRouter({
  getUser: () => state.user,
  setReturnTo: (route) => { state.returnTo = route; },
  getReturnTo: () => state.returnTo,
  mainEl,
  onRender: (effectiveRoute, isRouteChange) => {
    updateNavState(effectiveRoute);
    if (isRouteChange) {
      triggerPageTransition();
    }

    switch (effectiveRoute) {
      case "#/masuk":
        renderLogin(router);
        break;
      case "#/beranda":
        renderStudentHome(router);
        break;
      case "#/kuis":
        renderQuiz();
        break;
      case "#/avatar":
        renderAvatarPage();
        break;
      case "#/admin":
        renderAdmin();
        break;
      default:
        renderLogin(router);
    }
  }
});

themeCycleBtn?.addEventListener("click", () => {
  const nextTheme = cycleTheme();
  if (document.getElementById("homeAvatarCanvas")) drawAvatarCanvas(document.getElementById("homeAvatarCanvas"));
  if (document.getElementById("studioAvatarCanvas")) drawAvatarCanvas(document.getElementById("studioAvatarCanvas"));
  showToast(`Tema aktif: ${nextTheme}`);
});

logoutBtn?.addEventListener("click", () => {
  state.user = null;
  state.returnTo = "#/beranda";
  state.loginError = "";
  state.loginEntrancePlayed = false;
  router.navigateTo("#/masuk");
});

router.start();
