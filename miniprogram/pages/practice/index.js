const { entries, byId } = require("../../utils/data");
const store = require("../../utils/store");
const media = require("../../utils/media");
const audio = require("../../utils/audio");
const { shuffle, hashSeed } = require("../../utils/text");
const { clean, same, correctCharacterCount, typingDelta, typingMetrics } = require("../../utils/typing");

Page({
  data: {
    mode: "word", source: "path", round: null, current: null, index: 0, value: "", done: false,
    metrics: { wpm: 0, accuracy: 100 }, best: 0, rounds: 0,
    modes: [{ key: "word", name: "拼单词", desc: "看图写英文" }, { key: "sentence", name: "写短句", desc: "照样子写" }, { key: "dictation", name: "听一听", desc: "听音写句" }],
    sources: [{ key: "recent", name: "最近学过" }, { key: "mistakes", name: "错词本" }, { key: "saved", name: "收藏" }, { key: "path", name: "学习路线" }],
  },
  onShow() {
    const progress = store.getProgress();
    this.setData({
      rounds: progress.typing.length,
      best: progress.typing.filter((round) => round.mode === this.data.mode).reduce((best, round) => Math.max(best, round.wpm), 0),
    });
  },
  onUnload() { audio.stop(); },
  setMode(event) { this.setData({ mode: event.currentTarget.dataset.mode }); this.onShow(); },
  setSource(event) { this.setData({ source: event.currentTarget.dataset.source }); },
  start() {
    const progress = store.getProgress();
    const learned = Object.entries(progress.cards).sort((a, b) => (b[1].last || 0) - (a[1].last || 0)).map(([id]) => id);
    const settings = store.getSettings();
    const ids = this.data.source === "recent" ? learned : this.data.source === "mistakes" ? progress.mistakes : this.data.source === "saved" ? progress.bookmarks : entries.filter((entry) => entry.level >= settings.startLevel).map((entry) => entry.id);
    const pool = ids.filter((id) => byId[id]);
    if (!pool.length) return wx.showToast({ title: "先去学几张词卡吧", icon: "none" });
    const selected = shuffle(pool, hashSeed(String(Date.now()))).slice(0, 5).map((id) => byId[id]);
    this.totals = { typed: 0, correct: 0, accepted: 0, ms: 0 };
    this.setData({ round: selected, index: 0, done: false }, () => this.loadTarget());
  },
  loadTarget() {
    const index = this.data.index;
    const entry = this.data.round[index];
    this.startedAt = null;
    this.setData({
      current: { ...entry, image: media.full(entry.id), target: this.data.mode === "word" ? entry.w : entry.enEx },
      value: "",
    });
    if (this.data.mode === "dictation") audio.play(media.enUs(entry.id));
    if (this.data.mode === "word" && store.getSettings().autoplay) audio.play(media.us(entry.id));
  },
  input(event) {
    if (this.data.done) return;
    const next = event.detail.value;
    const target = this.data.current.target;
    if (this.startedAt === null && next) this.startedAt = Date.now();
    const delta = typingDelta(this.data.value, next, target);
    this.totals = { ...this.totals, typed: this.totals.typed + delta.total, correct: this.totals.correct + delta.correct };
    const metrics = typingMetrics(this.totals.correct, this.totals.typed, this.totals.accepted, this.totals.ms);
    this.setData({ value: next, metrics });
    if (clean(next).length >= clean(target).length && same(next.trimEnd(), target)) this.finishItem(next);
  },
  finishItem(value) {
    const ms = this.startedAt ? Date.now() - this.startedAt : 0;
    const accepted = correctCharacterCount(value, this.data.current.target);
    this.totals = { ...this.totals, accepted: this.totals.accepted + accepted, ms: this.totals.ms + ms };
    audio.playSfx("correct");
    if (this.data.index + 1 >= this.data.round.length) {
      const metrics = typingMetrics(this.totals.correct, this.totals.typed, this.totals.accepted, this.totals.ms);
      const round = { at: Date.now(), mode: this.data.mode, items: this.data.round.length, ...metrics };
      store.updateProgress((progress) => ({ ...progress, typing: [...progress.typing, round].slice(-200) }));
      this.setData({ done: true, metrics });
    } else {
      this.setData({ index: this.data.index + 1 }, () => this.loadTarget());
    }
  },
  replay() { if (this.data.current) audio.play(media.enUs(this.data.current.id)); },
  exit() { audio.stop(); this.setData({ round: null, current: null, done: false }); this.onShow(); },
});
