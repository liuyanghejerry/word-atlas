const assert = require("node:assert/strict");
const { test, beforeEach } = require("node:test");
const { reset } = require("./helpers.cjs");
const store = require("../utils/store");

const navigation = [];
const installWx = () => {
  global.wx.createInnerAudioContext = () => {
    const audio = {
      src: "", play() {}, stop() { if (this.stopped) this.stopped(); }, destroy() {},
      onEnded(callback) { this.ended = callback; },
      onError(callback) { this.failed = callback; },
      onStop(callback) { this.stopped = callback; },
    };
    return audio;
  };
  global.wx.navigateTo = (options) => navigation.push(options.url);
  global.wx.switchTab = (options) => navigation.push(options.url);
  global.wx.redirectTo = (options) => navigation.push(options.url);
  global.wx.showToast = () => {};
  global.wx.showModal = () => {};
  global.wx.setStorageSync("little-word-atlas:miniprogram:settings", { ...store.defaultSettings(), onboarded: true, autoplay: false, sfx: false });
};
const loadPage = (path) => {
  let definition;
  global.Page = (config) => { definition = config; };
  const file = require.resolve(`../pages/${path}/index.js`);
  delete require.cache[file];
  require(file);
  const page = {
    ...definition,
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(patch, callback) {
      Object.assign(this.data, patch);
      if (callback) callback();
    },
  };
  return page;
};

beforeEach(() => {
  reset();
  navigation.length = 0;
  installWx();
});

test("today page builds a five-card plan and topic shortcuts", () => {
  const page = loadPage("today");
  page.onShow();
  assert.equal(page.data.plan.fresh.length, 5);
  assert.equal(page.data.topics.length, 6);
  assert.equal(page.data.topics[0].symbol, "神");
  assert.equal(page.data.onboard, false);
  page.openTopic({ currentTarget: { dataset: { topic: "nature" } } });
  assert.ok(navigation.includes("/pages/atlas/index"));
});

test("learn page completes a full session and persists five reviewed cards", () => {
  const page = loadPage("learn");
  page.onLoad();
  for (let index = 0; index < 60 && !page.data.summary; index++) {
    if (page.data.pending) page.next();
    else if (page.data.step.kind === "intro") page.next();
    else if (page.data.step.kind === "spell") {
      page.setData({ spellValue: page.data.entry.w });
      page.submitSpell();
    } else page.choose({ currentTarget: { dataset: { id: page.data.entry.id } } });
  }
  assert.ok(page.data.summary, "session did not reach summary");
  assert.equal(Object.keys(store.getProgress().cards).length, 5);
  assert.equal(page.data.summary.accuracy, 100);
  page.finish();
  assert.equal(store.getProgress().session, null);
});

test("atlas filters and opens words from pinyin search", () => {
  const page = loadPage("atlas");
  page.onShow();
  page.search({ detail: { value: "ri" } });
  assert.deepEqual(page.data.list.map((entry) => entry.id), ["sun", "rice"]);
  page.open({ currentTarget: { dataset: { id: "sun" } } });
  assert.ok(navigation.some((url) => url.includes("id=sun")));
});

test("practice page finishes a five-item typing round", () => {
  const page = loadPage("practice");
  page.onShow();
  page.start();
  for (let index = 0; index < 5; index++) page.input({ detail: { value: page.data.current.target } });
  assert.equal(page.data.done, true);
  assert.equal(store.getProgress().typing.length, 1);
  assert.equal(store.getProgress().typing[0].items, 5);
});

test("word bookmark and parent settings survive page actions", () => {
  const word = loadPage("word");
  word.onLoad({ id: "sun" });
  word.bookmark();
  assert.equal(word.data.saved, true);
  const me = loadPage("me");
  me.onShow();
  me.setDaily({ currentTarget: { dataset: { value: 8 } } });
  assert.equal(store.getSettings().dailyNew, 8);
  assert.ok(store.exportBackup().includes("little-word-atlas-miniprogram"));
});
