const media = require("../../utils/media");
const audio = require("../../utils/audio");

Component({
  properties: {
    entry: { type: Object, value: null },
    saved: { type: Boolean, value: false },
    showActions: { type: Boolean, value: false },
  },
  observers: {
    entry(entry) {
      if (entry) this.setData({ image: media.full(entry.id) });
    },
  },
  methods: {
    play(event) {
      const { kind, index } = event.currentTarget.dataset;
      const entry = this.data.entry;
      if (!entry) return;
      const sources = {
        zh: media.zh(entry.id),
        zhEx: media.zhEx(entry.id),
        us: media.us(entry.id),
        enUs: media.enUs(entry.id),
        word: media.zhWord(entry.id, Number(index)),
      };
      audio.play(sources[kind]);
    },
    bookmark() { this.triggerEvent("bookmark", { id: this.data.entry.id }); },
    share() { this.triggerEvent("share", { entry: this.data.entry }); },
    previous() { this.triggerEvent("previous", { order: this.data.entry.order }); },
    next() { this.triggerEvent("next", { order: this.data.entry.order }); },
    stopAudio() { audio.stop(); },
  },
});
