const assert = require("node:assert/strict");
const { test, beforeEach } = require("node:test");
const { reset } = require("./helpers.cjs");
const store = require("../utils/store");
const { review, Rating, isMastered } = require("../utils/srs");

beforeEach(reset);

test("settings and progress survive storage round trips", () => {
  store.saveSettings({ dailyNew: 8, startLevel: 2, autoplay: false });
  assert.equal(store.getSettings().dailyNew, 8);
  assert.equal(store.getSettings().startLevel, 2);
  assert.equal(store.getSettings().autoplay, false);
  store.toggleBookmark("sun");
  store.toggleBookmark("moon");
  store.toggleBookmark("sun");
  assert.deepEqual(store.getProgress().bookmarks, ["moon"]);
});

test("backup import validates the app and restores progress", () => {
  store.toggleBookmark("sun");
  const backup = store.exportBackup();
  reset();
  assert.deepEqual(store.importBackup(backup), { ok: true, cards: 0 });
  assert.deepEqual(store.getProgress().bookmarks, ["sun"]);
  assert.equal(store.importBackup("{}").ok, false);
});

test("FSRS schedules new reviews and identifies long-term cards", () => {
  const now = Date.now();
  const good = review(undefined, Rating.Good, now);
  const again = review(undefined, Rating.Again, now);
  assert.ok(good.due > now);
  assert.ok(again.due > now);
  assert.notEqual(good.due, again.due);
  assert.equal(isMastered({ st: 2, s: 22 }), true);
  assert.equal(isMastered({ st: 1, s: 22 }), false);
});
