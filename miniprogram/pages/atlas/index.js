const { entries, topics, levels } = require("../../utils/data");
const media = require("../../utils/media");
const store = require("../../utils/store");
const { searchEntries } = require("../../utils/text");
const { isMastered } = require("../../utils/srs");

Page({
  data: {
    entries, topics, levels, view: "grid", q: "", topic: "", level: -1, status: "all",
    list: [], cards: {}, bookmarks: [],
    statuses: [{ key: "all", name: "全部" }, { key: "new", name: "未学" }, { key: "learning", name: "学习中" }, { key: "mastered", name: "记住了" }, { key: "saved", name: "收藏" }],
  },
  onShow() {
    const incoming = wx.getStorageSync("little-word-atlas:atlas-filter") || {};
    if (Object.keys(incoming).length) wx.removeStorageSync("little-word-atlas:atlas-filter");
    this.setData({
      view: incoming.view || this.data.view,
      topic: incoming.topic || "",
      level: incoming.level === undefined ? this.data.level : incoming.level,
    }, () => this.apply());
  },
  apply() {
    const { q, topic, level, status } = this.data;
    const progress = store.getProgress();
    const filtered = searchEntries(entries, q).filter((entry) => {
      if (topic && entry.topic !== topic) return false;
      if (level >= 0 && entry.level !== level) return false;
      const card = progress.cards[entry.id];
      if (status === "new") return !card;
      if (status === "learning") return !!card && !isMastered(card);
      if (status === "mastered") return isMastered(card);
      if (status === "saved") return progress.bookmarks.includes(entry.id);
      return true;
    });
    this.setData({
      list: filtered.map((entry) => ({ ...entry, image: media.thumb(entry.id) })),
      cards: progress.cards,
      bookmarks: progress.bookmarks,
    });
  },
  search(event) { this.setData({ q: event.detail.value }, () => this.apply()); },
  clearSearch() { this.setData({ q: "" }, () => this.apply()); },
  setView(event) { this.setData({ view: event.currentTarget.dataset.view }); },
  setTopic(event) { this.setData({ topic: event.currentTarget.dataset.topic }, () => this.apply()); },
  setLevel(event) { this.setData({ level: Number(event.currentTarget.dataset.level) }, () => this.apply()); },
  setStatus(event) { this.setData({ status: event.currentTarget.dataset.status }, () => this.apply()); },
  open(event) { wx.navigateTo({ url: `/pages/word/index?id=${event.currentTarget.dataset.id || event.detail.id}` }); },
});
