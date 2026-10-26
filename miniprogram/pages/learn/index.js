const { byId } = require("../../utils/data");
const store = require("../../utils/store");
const session = require("../../utils/session");
const audio = require("../../utils/audio");
const media = require("../../utils/media");
const { normalize } = require("../../utils/text");

Page({
  data: {
    ready: false, session: null, step: null, entry: null, options: [], pending: null,
    summary: null, image: "", spellValue: "", hints: 0, progressPercent: 0,
  },
  onLoad() {
    let progress = store.getProgress();
    if (!progress.session || progress.session.finished) {
      const current = session.buildSession(progress, store.getSettings());
      if (!current.steps.length) {
        wx.switchTab({ url: "/pages/today/index" });
        return;
      }
      progress = store.saveProgress({ ...progress, session: current });
    }
    this.loadStep();
  },
  onUnload() { audio.stop(); },
  loadStep() {
    const current = store.getProgress().session;
    if (!current) { wx.switchTab({ url: "/pages/today/index" }); return; }
    audio.stop();
    if (current.finished || current.index >= current.steps.length) { this.showSummary(current); return; }
    const step = current.steps[current.index];
    const entry = byId[step.id];
    const pending = current.pending || null;
    this.stepStarted = Date.now();
    this.setData({
      ready: true, session: current, step, entry, pending,
      options: this.optionStates(step, entry, pending),
      image: media.full(entry.id), spellValue: "", hints: 0,
      progressPercent: Math.round(current.index / current.steps.length * 100),
      summary: null,
    });
    if (step.kind === "intro" && store.getSettings().autoplay) audio.playIntro(entry);
    if (step.kind === "listen" && !pending) audio.play(media.us(entry.id));
  },
  optionStates(step, entry, pending) {
    return (step.options || []).map((id) => {
      const option = byId[id];
      let state = "";
      if (pending) state = id === entry.id ? "answer" : id === pending.value ? "chosen" : "dim";
      return { ...option, state };
    });
  },
  elapsed() { return Date.now() - this.stepStarted; },
  choose(event) {
    if (this.data.pending) return;
    const id = event.currentTarget.dataset.id;
    this.answer(id, id === this.data.entry.id);
  },
  answer(value, correct) {
    const { step, entry } = this.data;
    session.answer(step, correct, session.gradeFor(step.kind, correct, this.elapsed(), this.data.hints > 0), value);
    const current = store.getProgress().session;
    const pending = current.pending;
    audio.playSfx(correct ? "correct" : "wrong");
    this.setData({ session: current, pending, options: this.optionStates(step, entry, pending) });
  },
  next() {
    audio.stop();
    session.advance(this.elapsed() / 1000);
    this.loadStep();
  },
  replay() {
    const { step, entry } = this.data;
    audio.play(step.kind === "picture" ? media.zh(entry.id) : media.us(entry.id));
  },
  spellInput(event) { this.setData({ spellValue: event.detail.value }); },
  hint() {
    const hints = Math.min(this.data.entry.w.length - 1, this.data.hints + 1);
    this.setData({ hints, spellValue: this.data.entry.w.slice(0, hints) });
  },
  submitSpell() {
    if (!this.data.spellValue.trim() || this.data.pending) return;
    this.answer(this.data.spellValue, normalize(this.data.spellValue) === normalize(this.data.entry.w));
  },
  showSummary(current) {
    const stats = session.sessionStats(current);
    const ids = [...new Set(current.steps.map((step) => step.id))];
    this.setData({
      ready: true, session: current, step: null, pending: null,
      summary: {
        ...stats,
        words: ids.map((id) => byId[id]),
        newCount: current.newIds.length,
        reviewCount: current.reviewIds.length,
        wrong: ids.filter((id) => current.graded[id] === 1),
        todayIds: ids,
        cards: store.getProgress().cards,
        minutes: Math.max(1, Math.round(((current.finished || Date.now()) - current.started) / 60000)),
      },
    });
    audio.playSfx("complete");
  },
  againWrong() {
    const current = store.getProgress();
    const next = session.buildSession(current, store.getSettings(), { ids: this.data.summary.wrong });
    store.saveProgress({ ...current, session: next });
    this.loadStep();
  },
  exit() {
    audio.stop();
    wx.switchTab({ url: "/pages/today/index" });
  },
  finish() {
    store.saveProgress({ ...store.getProgress(), session: null });
    wx.switchTab({ url: "/pages/today/index" });
  },
  onShareAppMessage() {
    return { title: "我在芽芽词光点亮了新的双语星星", path: "/pages/today/index" };
  },
});
