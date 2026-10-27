const assert = require("node:assert/strict");
const { test, beforeEach } = require("node:test");
const { reset } = require("./helpers.cjs");
const store = require("../utils/store");
const session = require("../utils/session");
const { Rating } = require("../utils/srs");

beforeEach(reset);

test("new sessions contain five cards in groups of at most three", () => {
  const current = session.buildSession(store.getProgress(), store.getSettings());
  assert.equal(current.newIds.length, 5);
  assert.equal(current.steps.filter((step) => step.kind === "intro").length, 5);
  assert.equal(current.steps.filter((step) => step.kind !== "intro").length, 5);
  assert.equal(current.steps.length, 10);
  for (const step of current.steps.filter((step) => step.options)) {
    assert.equal(step.options.length, 4);
    assert.equal(new Set(step.options).size, 4);
    assert.ok(step.options.includes(step.id));
  }
});

test("only the first answer updates memory and daily statistics", () => {
  const current = { id: "test", started: Date.now(), steps: [{ id: "sun", kind: "meaning", options: ["sun", "moon", "water", "fire"] }], index: 0, graded: {}, newIds: ["sun"], reviewIds: [] };
  store.saveProgress({ ...store.getProgress(), session: current });
  session.answer(current.steps[0], true, Rating.Good, "sun");
  let progress = store.getProgress();
  assert.equal(Object.keys(progress.cards).length, 1);
  assert.equal(progress.days[store.dayKey()].r, 1);
  assert.equal(progress.days[store.dayKey()].c, 1);
  assert.ok(progress.cards.sun.due > Date.now());
  session.answer(current.steps[0], true, Rating.Good, "sun");
  progress = store.getProgress();
  assert.equal(progress.days[store.dayKey()].r, 1);
});

test("a wrong answer schedules a different-format retry without raising accuracy", () => {
  const current = { id: "test", started: Date.now(), steps: [{ id: "sun", kind: "meaning", options: ["sun", "moon", "water", "fire"] }], index: 0, graded: {}, newIds: ["sun"], reviewIds: [] };
  store.saveProgress({ ...store.getProgress(), session: current });
  session.answer(current.steps[0], false, Rating.Again, "moon");
  const progress = store.getProgress();
  assert.equal(progress.days[store.dayKey()].c, 0);
  assert.equal(progress.session.steps.length, 2);
  assert.equal(progress.session.steps[1].kind, "picture");
  assert.equal(progress.session.steps[1].retry, true);
  assert.deepEqual(progress.mistakes, ["sun"]);
});
