const { entries, byId } = require("../../utils/data");
const media = require("../../utils/media");
const store = require("../../utils/store");
const audio = require("../../utils/audio");

Page({
  data: { entry: null, saved: false },
  onLoad(options) {
    this.wordId = options.id || entries[0].id;
    this.loadWord();
  },
  onShow() { if (this.data.entry) this.loadWord(); },
  onUnload() { audio.stop(); },
  loadWord() {
    const entry = byId[this.wordId] || entries[0];
    this.wordId = entry.id;
    this.setData({ entry, saved: store.getProgress().bookmarks.includes(entry.id) });
  },
  bookmark() {
    store.toggleBookmark(this.wordId);
    this.loadWord();
  },
  previous() { this.move(-1); },
  next() { this.move(1); },
  move(direction) {
    const next = entries[this.data.entry.order + direction];
    if (!next) return wx.showToast({ title: "已经到这一头啦", icon: "none" });
    audio.stop();
    wx.redirectTo({ url: `/pages/word/index?id=${next.id}` });
  },
  share() {
    const entry = this.data.entry;
    wx.showLoading({ title: "正在生成" });
    wx.createSelectorQuery().in(this).select("#poster").fields({ node: true, size: true }).exec((result) => {
      if (!result[0]) return wx.hideLoading();
      const canvas = result[0].node;
      const dpr = 2;
      canvas.width = 750 * dpr;
      canvas.height = 1100 * dpr;
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#F6F1E7";
      ctx.fillRect(0, 0, 750, 1100);
      const image = canvas.createImage();
      image.onload = () => {
        ctx.drawImage(image, 40, 40, 670, 500);
        ctx.fillStyle = "#1A2035";
        ctx.font = "700 116px sans-serif";
        ctx.fillText(entry.hanzi, 48, 690);
        ctx.fillStyle = "#A8432A";
        ctx.font = "600 30px sans-serif";
        ctx.fillText(entry.pinyin, 220, 675);
        ctx.fillStyle = "#1A2035";
        ctx.font = "700 64px serif";
        ctx.fillText(entry.w, 48, 780);
        ctx.fillStyle = "#535B70";
        ctx.font = "28px sans-serif";
        ctx.fillText(`${entry.us} · ${entry.zh}`, 48, 830);
        ctx.fillStyle = "#1A2035";
        ctx.font = "30px sans-serif";
        ctx.fillText(entry.zhEx, 48, 900);
        ctx.fillStyle = "#7A7D8A";
        ctx.font = "26px serif";
        ctx.fillText(entry.enEx, 48, 955);
        ctx.fillStyle = "#1A2035";
        ctx.font = "600 26px sans-serif";
        ctx.fillText("芽芽词光 · 一字一画，中英一起学", 48, 1040);
        wx.canvasToTempFilePath({
          canvas,
          success: (file) => {
            wx.hideLoading();
            wx.saveImageToPhotosAlbum({
              filePath: file.tempFilePath,
              success: () => wx.showToast({ title: "分享卡已保存", icon: "success" }),
              fail: () => wx.showToast({ title: "未保存，请检查相册权限", icon: "none" }),
            });
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({ title: "生成失败，请再试一次", icon: "none" });
          },
        });
      };
      image.onerror = () => {
        wx.hideLoading();
        wx.showToast({ title: "插画加载失败", icon: "none" });
      };
      image.src = media.full(entry.id);
    });
  },
  onShareAppMessage() {
    return { title: `${this.data.entry.hanzi} ${this.data.entry.w} · 芽芽词光`, path: `/pages/word/index?id=${this.wordId}` };
  },
});
