const { levels } = require("../../utils/data");
const store = require("../../utils/store");
const { isMastered } = require("../../utils/srs");

Page({
  data: {
    settings: {}, stats: { learned: 0, mastered: 0, reviews: 0, accuracy: 0, minutes: 0 },
    levels, dailyOptions: [3, 5, 8, 10], retentionOptions: [0.85, 0.9, 0.95], forecast: [],
  },
  onShow() { this.refresh(); },
  refresh() {
    const settings = store.getSettings();
    const progress = store.getProgress();
    const days = Object.values(progress.days);
    const reviews = days.reduce((sum, day) => sum + day.r, 0);
    const correct = days.reduce((sum, day) => sum + day.c, 0);
    const seconds = days.reduce((sum, day) => sum + day.t, 0);
    const cards = Object.values(progress.cards);
    const forecast = Array.from({ length: 7 }, (_, index) => {
      const end = new Date(); end.setHours(23, 59, 59, 999); end.setDate(end.getDate() + index);
      const start = new Date(end); start.setHours(0, 0, 0, 0);
      const count = cards.filter((card) => index === 0 ? card.due <= end.getTime() : card.due >= start.getTime() && card.due <= end.getTime()).length;
      return { label: index === 0 ? "今天" : index === 1 ? "明天" : `+${index}`, count };
    });
    const max = Math.max(1, ...forecast.map((day) => day.count));
    this.setData({
      settings,
      stats: {
        learned: cards.length,
        mastered: cards.filter(isMastered).length,
        reviews,
        accuracy: reviews ? Math.round(correct / reviews * 100) : 0,
        minutes: Math.round(seconds / 60),
      },
      forecast: forecast.map((day) => ({ ...day, height: day.count / max * 100 })),
    });
  },
  save(patch) { store.saveSettings(patch); this.refresh(); },
  setDaily(event) { this.save({ dailyNew: Number(event.currentTarget.dataset.value) }); },
  setLevel(event) { this.save({ startLevel: Number(event.currentTarget.dataset.value) }); },
  setRetention(event) { this.save({ retention: Number(event.currentTarget.dataset.value) }); },
  toggle(event) {
    const key = event.currentTarget.dataset.key;
    this.save({ [key]: !this.data.settings[key] });
  },
  exportData() {
    wx.setClipboardData({
      data: store.exportBackup(),
      success: () => wx.showToast({ title: "备份已复制", icon: "success" }),
    });
  },
  importData() {
    wx.getClipboardData({
      success: ({ data }) => {
        const result = store.importBackup(data);
        wx.showToast({ title: result.ok ? `已恢复 ${result.cards} 张词卡` : result.error, icon: "none" });
        this.refresh();
      },
      fail: () => wx.showToast({ title: "请先复制备份文字", icon: "none" }),
    });
  },
  reset() {
    wx.showModal({
      title: "清空学习记录？",
      content: "此操作无法撤销，建议先复制备份。",
      confirmText: "清空",
      confirmColor: "#C4573A",
      success: ({ confirm }) => {
        if (confirm) {
          store.resetProgress();
          this.refresh();
          wx.showToast({ title: "已清空", icon: "none" });
        }
      },
    });
  },
  onShareAppMessage() { return { title: "芽芽词光 · 一字一画，中英一起学", path: "/pages/today/index" }; },
});
