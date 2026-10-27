const { entries, byId, topics } = require("../../utils/data");
const media = require("../../utils/media");
const store = require("../../utils/store");
const session = require("../../utils/session");
const audio = require("../../utils/audio");
const { isMastered } = require("../../utils/srs");
const { hashSeed } = require("../../utils/text");

Page({
  data: {
    entries,
    settings: {}, plan: { due: [], fresh: [] }, progress: {}, learned: 0, mastered: 0,
    active: null, teaser: [], heroImage: "", daily: null, dailyImage: "", topics: [],
    week: [], todayIds: [], onboard: false, levelIndex: 0, goal: 5,
    levels: [
      { name: "萌芽", desc: "从最常见的字词开始" },
      { name: "起步", desc: "已经认识一些简单字词" },
      { name: "成长", desc: "想挑战更多生活词汇" },
    ],
  },
  onShow() { this.refresh(); },
  refresh() {
    const settings = store.getSettings();
    const progress = store.getProgress();
    const plan = session.todayPlan(progress, settings);
    const active = progress.session && !progress.session.finished ? progress.session : null;
    const teaserIds = (active ? active.newIds : plan.fresh).slice(0, 5);
    const day = store.dayKey();
    const daily = entries[hashSeed(day) % entries.length];
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const todayIds = Object.entries(progress.cards).filter(([, card]) => card.seen >= start.getTime()).map(([id]) => id);
    const week = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(); date.setDate(date.getDate() - (6 - index));
      const value = progress.days[store.dayKey(date)]?.r || 0;
      return { label: "日一二三四五六"[date.getDay()], value, height: Math.min(100, value * 8) };
    });
    this.setData({
      settings, plan, progress, active,
      learned: Object.keys(progress.cards).length,
      mastered: Object.values(progress.cards).filter(isMastered).length,
      teaser: teaserIds.map((id) => ({ id, image: media.thumb(id) })),
      heroImage: media.full((teaserIds[0] || daily.id)),
      daily, dailyImage: media.thumb(daily.id),
      topics: topics.map((topic) => ({ ...topic, symbol: topic.name.slice(0, 1), count: entries.filter((entry) => entry.topic === topic.key).length })),
      week, todayIds, onboard: !settings.onboarded,
      levelIndex: settings.startLevel, goal: settings.dailyNew,
    });
  },
  chooseLevel(event) { this.setData({ levelIndex: Number(event.currentTarget.dataset.index) }); },
  chooseGoal(event) { this.setData({ goal: Number(event.currentTarget.dataset.value) }); },
  finishOnboard() {
    store.saveSettings({ onboarded: true, startLevel: this.data.levelIndex, dailyNew: this.data.goal });
    this.refresh();
  },
  start(event) {
    const reviewOnly = event.currentTarget.dataset.review === "1";
    let current = store.getProgress().session;
    if (!current || current.finished) {
      current = session.buildSession(store.getProgress(), store.getSettings(), { reviewOnly });
      if (!current.steps.length) return wx.showToast({ title: "今天已经完成啦", icon: "none" });
      store.saveProgress({ ...store.getProgress(), session: current });
    }
    audio.playSfx("start");
    wx.navigateTo({ url: "/pages/learn/index" });
  },
  openDaily() { wx.navigateTo({ url: `/pages/word/index?id=${this.data.daily.id}` }); },
  openGalaxyWord(event) { wx.navigateTo({ url: `/pages/word/index?id=${event.detail.id}` }); },
  openTopic(event) {
    wx.setStorageSync("little-word-atlas:atlas-filter", { topic: event.currentTarget.dataset.topic, view: "grid" });
    wx.switchTab({ url: "/pages/atlas/index" });
  },
  openGalaxy() {
    wx.setStorageSync("little-word-atlas:atlas-filter", { view: "galaxy" });
    wx.switchTab({ url: "/pages/atlas/index" });
  },
});
