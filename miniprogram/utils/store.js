const DATASET_ID = "little-word-atlas-v1";
const SETTINGS_KEY = "little-word-atlas:miniprogram:settings";
const PROGRESS_KEY = "little-word-atlas:miniprogram:progress";

const defaultSettings = () => ({
  autoplay: true,
  dailyNew: 5,
  retention: 0.9,
  sfx: true,
  spell: true,
  startLevel: 0,
  onboarded: false,
});
const emptyProgress = () => ({
  version: 2,
  datasetId: DATASET_ID,
  cards: {},
  bookmarks: [],
  days: {},
  typing: [],
  session: null,
  mistakes: [],
});
const isObject = (value) => !!value && typeof value === "object" && !Array.isArray(value);
const read = (key, fallback) => {
  try {
    const value = wx.getStorageSync(key);
    return value || fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    wx.setStorageSync(key, value);
    return true;
  } catch {
    return false;
  }
};
const sanitizeSettings = (value) => {
  const settings = defaultSettings();
  if (!isObject(value)) return settings;
  for (const key of ["autoplay", "sfx", "spell", "onboarded"]) {
    if (typeof value[key] === "boolean") settings[key] = value[key];
  }
  if (Number.isFinite(value.dailyNew)) settings.dailyNew = Math.max(0, Math.min(30, Math.round(value.dailyNew)));
  if (Number.isFinite(value.retention)) settings.retention = Math.max(0.7, Math.min(0.97, value.retention));
  if (Number.isInteger(value.startLevel)) settings.startLevel = Math.max(0, Math.min(2, value.startLevel));
  return settings;
};
const sanitizeProgress = (value) => {
  const progress = emptyProgress();
  if (!isObject(value) || value.version !== 2 || value.datasetId !== DATASET_ID) return progress;
  if (isObject(value.cards)) {
    for (const [id, card] of Object.entries(value.cards)) {
      if (isObject(card) && Number.isFinite(card.due) && Number.isFinite(card.s) && Number.isFinite(card.st) && Number.isFinite(card.seen)) {
        progress.cards[id] = card;
      }
    }
  }
  if (Array.isArray(value.bookmarks)) progress.bookmarks = value.bookmarks.filter((id) => typeof id === "string").slice(0, 100);
  if (Array.isArray(value.mistakes)) progress.mistakes = value.mistakes.filter((id) => typeof id === "string").slice(0, 100);
  if (isObject(value.days)) progress.days = value.days;
  if (Array.isArray(value.typing)) progress.typing = value.typing.slice(-200);
  if (isObject(value.session) && Array.isArray(value.session.steps)) progress.session = value.session;
  return progress;
};
const getSettings = () => sanitizeSettings(read(SETTINGS_KEY, null));
const getProgress = () => sanitizeProgress(read(PROGRESS_KEY, null));
const saveSettings = (patch) => {
  const settings = sanitizeSettings({ ...getSettings(), ...patch });
  write(SETTINGS_KEY, settings);
  return settings;
};
const saveProgress = (progress) => {
  const clean = sanitizeProgress(progress);
  write(PROGRESS_KEY, clean);
  return clean;
};
const updateProgress = (update) => saveProgress(update(getProgress()));
const toggleBookmark = (id) => updateProgress((progress) => ({
  ...progress,
  bookmarks: progress.bookmarks.includes(id)
    ? progress.bookmarks.filter((item) => item !== id)
    : [id, ...progress.bookmarks.filter((item) => item !== id)],
}));
const dayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const bumpDay = (progress, patch) => {
  const key = dayKey();
  const day = progress.days[key] || { n: 0, r: 0, c: 0, t: 0 };
  return {
    ...progress,
    days: {
      ...progress.days,
      [key]: {
        n: day.n + (patch.n || 0),
        r: day.r + (patch.r || 0),
        c: day.c + (patch.c || 0),
        t: day.t + (patch.t || 0),
      },
    },
  };
};
const exportBackup = () => JSON.stringify({ app: "little-word-atlas-miniprogram", version: 2, progress: getProgress(), settings: getSettings() });
const importBackup = (text) => {
  try {
    const data = JSON.parse(text);
    if (!isObject(data) || data.app !== "little-word-atlas-miniprogram" || data.version !== 2) return { ok: false, error: "这不是芽芽词光的小程序备份" };
    const progress = saveProgress(data.progress);
    saveSettings({ ...data.settings, onboarded: true });
    return { ok: true, cards: Object.keys(progress.cards).length };
  } catch {
    return { ok: false, error: "备份文字不是有效的 JSON" };
  }
};
const resetProgress = () => saveProgress(emptyProgress());

module.exports = {
  DATASET_ID,
  SETTINGS_KEY,
  PROGRESS_KEY,
  defaultSettings,
  emptyProgress,
  sanitizeSettings,
  sanitizeProgress,
  getSettings,
  getProgress,
  saveSettings,
  saveProgress,
  updateProgress,
  toggleBookmark,
  dayKey,
  bumpDay,
  exportBackup,
  importBackup,
  resetProgress,
};
