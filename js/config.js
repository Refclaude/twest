export const APP_CONFIG = {
  schoolName: "Portal Internal Sekolah",
  schoolShortCode: "PS",
  routes: ["#/masuk", "#/beranda", "#/kuis", "#/avatar", "#/admin"],
  protectedRoutes: new Set(["#/beranda", "#/kuis", "#/avatar", "#/admin"]),
  themes: ["sekolah", "liquid-glass", "material-you"],
  avatarBasePath: "./assets/avatar/",
  jsonBin: {
    enabled: false, // Ubah ke true setelah mengisi binId dan apiKey
    baseUrl: "https://api.jsonbin.io/v3/b",
    binId: "ISI_BIN_ID_ANDA",
    apiKey: "ISI_X_MASTER_KEY_ATAU_ACCESS_KEY_ANDA"
  }
};

export const SAMPLE_QUESTION = {
  prompt: "Proses perubahan wujud benda dari gas menjadi cair disebut...",
  options: [
    { id: "A", text: "Menyublim" },
    { id: "B", text: "Mengembun" },
    { id: "C", text: "Menguap" },
    { id: "D", text: "Membeku" }
  ],
  correctId: "B"
};

export const AVATAR_CATALOG = {
  rambut: [
    { id: "none", label: "Polos", colorToken: "" },
    { id: "hair1", label: "Cepak Rapi", colorToken: "--color-avatar-hair-1" },
    { id: "hair2", label: "Poni Samping", colorToken: "--color-avatar-hair-2" }
  ],
  baju: [
    { id: "uni1", label: "Seragam Biru", colorToken: "--color-avatar-shirt-1" },
    { id: "uni2", label: "Kaus Teal", colorToken: "--color-avatar-shirt-2" }
  ],
  aksesori: [
    { id: "none", label: "Tanpa Aksesori", colorToken: "" },
    { id: "acc1", label: "Kacamata", colorToken: "--color-avatar-ink" }
  ]
};
