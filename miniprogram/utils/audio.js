const media = require("./media");
const store = require("./store");

let current = null;
let token = 0;
const stop = () => {
  token++;
  if (current) {
    try {
      current.stop();
      current.destroy();
    } catch {}
    current = null;
  }
};
const play = (src) => {
  stop();
  if (!src || typeof wx === "undefined") return Promise.resolve(false);
  const mine = ++token;
  return new Promise((resolve) => {
    const audio = wx.createInnerAudioContext();
    current = audio;
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      if (mine === token) current = null;
      try { audio.destroy(); } catch {}
      resolve(ok);
    };
    audio.onEnded(() => finish(true));
    audio.onError(() => finish(false));
    audio.onStop(() => finish(false));
    audio.src = src;
    audio.play();
  });
};
const playSfx = (name) => {
  if (store.getSettings().sfx) return play(media.sfx(name));
  return Promise.resolve(false);
};
const playIntro = (entry) => play(require("./media").zh(entry.id)).then(() => play(require("./media").us(entry.id)));

module.exports = { play, playSfx, playIntro, stop };
