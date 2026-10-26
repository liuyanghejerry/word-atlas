const assert = require("node:assert/strict");
const { test } = require("node:test");
const { entries } = require("../utils/data");
const { searchEntries, plainPinyin } = require("../utils/text");
const { typingDelta, typingMetrics, same } = require("../utils/typing");

test("search understands Chinese, English and tone-free pinyin", () => {
  assert.equal(searchEntries(entries, "sun")[0].id, "sun");
  assert.equal(searchEntries(entries, "日")[0].id, "sun");
  assert.deepEqual(searchEntries(entries, "ri").map((entry) => entry.id), ["sun", "rice"]);
  assert.equal(searchEntries(entries, "rì")[0].id, "sun");
  assert.equal(plainPinyin("shuǐ"), "shui");
});

test("typing scoring handles corrections and bounded metrics", () => {
  assert.deepEqual(typingDelta("snu", "sun", "sun"), { total: 2, correct: 2 });
  assert.equal(same("Sun", "sun"), true);
  const metrics = typingMetrics(8, 10, 10, 60000);
  assert.deepEqual(metrics, { wpm: 2, accuracy: 80 });
  assert.equal(typingMetrics(0, 0, 0, 0).wpm, 0);
});
