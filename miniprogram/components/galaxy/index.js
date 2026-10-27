const { hashSeed } = require("../../utils/text");
const { isMastered } = require("../../utils/srs");

const COLORS = ["#f2c46d", "#ef8f6b", "#8fd0c8", "#9fb8ff", "#9be38f", "#ff9fa8"];
Component({
  options: { styleIsolation: "shared" },
  properties: {
    words: { type: Array, value: [] },
    cards: { type: Object, value: {} },
    highlight: { type: Array, value: [] },
    mini: { type: Boolean, value: false },
  },
  data: { stars: [], labels: [], yaw: 0, moved: false },
  observers: {
    "words,cards,highlight"() { this.layout(); },
  },
  lifetimes: {
    attached() { this.layout(); },
  },
  methods: {
    layout() {
      if (!this.data.words) return;
      const yaw = this.data.yaw || 0;
      const highlights = new Set(this.data.highlight || []);
      const stars = this.data.words.map((word) => {
        const seed = hashSeed(word.id) % 1000 / 1000;
        const radius = 0.2 + word.level * 0.2 + seed * 0.16;
        const angle = word.topicIndex / 6 * Math.PI * 2 + radius * 4 + seed * 0.5 + yaw;
        const card = this.data.cards[word.id];
        const today = highlights.has(word.id);
        return {
          id: word.id,
          x: 50 + Math.cos(angle) * radius * 48,
          y: 47 + Math.sin(angle) * radius * 39,
          color: COLORS[word.topicIndex % COLORS.length],
          state: today ? "star-today" : card ? (isMastered(card) ? "star-mastered" : "star-learning") : "",
        };
      });
      const labels = (this.data.words.length ? require("../../utils/data").topics : []).map((topic, index) => {
        const angle = index / 6 * Math.PI * 2 + 1.9 + yaw;
        return { name: topic.name, x: 50 + Math.cos(angle) * 35, y: 47 + Math.sin(angle) * 30 };
      });
      this.setData({ stars, labels });
    },
    touchStart(event) {
      const touch = event.touches[0];
      this.startX = touch.clientX;
      this.startY = touch.clientY;
      this.setData({ moved: false });
    },
    touchMove(event) {
      if (this.startX === undefined) return;
      const touch = event.touches[0];
      const dx = touch.clientX - this.startX;
      if (Math.abs(dx) + Math.abs(touch.clientY - this.startY) > 8) this.setData({ moved: true });
      this.startX = touch.clientX;
      this.startY = touch.clientY;
      this.setData({ yaw: this.data.yaw + dx * 0.008 });
      this.layout();
    },
    open(event) {
      if (!this.data.moved) this.triggerEvent("open", { id: event.currentTarget.dataset.id });
    },
  },
});
