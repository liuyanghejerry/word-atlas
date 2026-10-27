const { entries, byId } = require("./data");
const { hashSeed, normalize, shuffle } = require("./text");
const { review, Rating } = require("./srs");
const store = require("./store");

const dueIds = (progress, now = Date.now()) => Object.entries(progress.cards).filter(([, card]) => card.due <= now).sort((a, b) => a[1].due - b[1].due).map(([id]) => id).filter((id) => byId[id]);
const nextNew = (progress, settings, count) => {
  const output = [];
  const pass = (from) => {
    for (const entry of entries) {
      if (output.length >= count) return;
      if (entry.level < from || progress.cards[entry.id] || output.includes(entry.id)) continue;
      output.push(entry.id);
    }
  };
  pass(settings.startLevel);
  if (output.length < count) pass(0);
  return output;
};
const todayPlan = (progress, settings) => {
  const due = dueIds(progress);
  const learnedToday = progress.days[store.dayKey()]?.n || 0;
  const fresh = nextNew(progress, settings, Math.max(0, settings.dailyNew - learnedToday));
  return { due, fresh, minutes: Math.max(1, Math.round(due.length * 0.25 + fresh.length * 0.9)) };
};
const quizKind = (entry, progress, settings, salt) => {
  const card = progress.cards[entry.id];
  const roll = hashSeed(entry.id + salt) % 100;
  if (!card || card.s < 2) {
    if (roll < 45) return "picture";
    return roll < 80 ? "meaning" : "listen";
  }
  if (settings.spell && (card.s >= 4 || roll < 35)) return roll < 75 ? "spell" : "picture";
  return roll < 50 ? "listen" : roll < 80 ? "picture" : "meaning";
};
const distractors = (entry, kind, seed) => {
  const scored = entries.filter((item) => item.id !== entry.id).map((item) => {
    let score = hashSeed(item.id + seed) % 100;
    if (item.topic === entry.topic) score += 140;
    if (item.level === entry.level) score += 40;
    if (kind !== "picture") score += Math.max(0, 40 - Math.abs(item.w.length - entry.w.length) * 10);
    return [score, item];
  }).sort((a, b) => b[0] - a[0]);
  const seen = new Set();
  const picks = [];
  for (const [, item] of scored) {
    const key = kind === "picture" ? item.hanzi : normalize(item.w);
    if (seen.has(key)) continue;
    seen.add(key);
    picks.push(item.id);
    if (picks.length === 3) break;
  }
  return shuffle([entry.id, ...picks], seed);
};
const buildSession = (progress, settings, options = {}) => {
  const seed = Date.now();
  const plan = todayPlan(progress, settings);
  const reviewIds = options.ids ? options.ids.filter((id) => progress.cards[id]) : plan.due.slice(0, 60);
  const newIds = options.ids ? options.ids.filter((id) => !progress.cards[id]) : options.reviewOnly ? [] : plan.fresh;
  const steps = [];
  const quiz = (id, salt) => {
    const entry = byId[id];
    const kind = quizKind(entry, progress, settings, seed + salt);
    return { id, kind, options: kind === "spell" ? undefined : distractors(entry, kind, seed + salt) };
  };
  reviewIds.forEach((id, index) => steps.push(quiz(id, index)));
  for (let groupIndex = 0; groupIndex < newIds.length; groupIndex += 3) {
    const group = newIds.slice(groupIndex, groupIndex + 3);
    group.forEach((id) => steps.push({ id, kind: "intro" }));
    shuffle(group, seed + groupIndex).forEach((id, index) => steps.push(quiz(id, 1000 + groupIndex + index)));
  }
  return { id: `s${seed}`, started: seed, steps, index: 0, graded: {}, newIds, reviewIds };
};
const gradeFor = (kind, correct, elapsedMs, hinted) => {
  if (!correct) return Rating.Again;
  if (hinted) return Rating.Hard;
  if (elapsedMs > (kind === "spell" ? 20000 : 9000)) return Rating.Hard;
  if (elapsedMs < 6000 && kind === "spell") return Rating.Easy;
  return Rating.Good;
};
const answer = (step, correct, grade, value) => store.updateProgress((progress) => {
  const session = progress.session;
  if (!session) return progress;
  let next = { ...progress, session: { ...session, pending: { correct, value } } };
  const first = !(step.id in session.graded) && !step.retry;
  if (first) {
    next = {
      ...next,
      cards: { ...next.cards, [step.id]: review(progress.cards[step.id], grade, Date.now(), store.getSettings().retention) },
      session: { ...next.session, graded: { ...session.graded, [step.id]: grade } },
      mistakes: correct ? next.mistakes : [step.id, ...next.mistakes.filter((id) => id !== step.id)].slice(0, 100),
    };
    next = store.bumpDay(next, { r: 1, c: correct ? 1 : 0, n: session.newIds.includes(step.id) ? 1 : 0 });
  }
  if (!correct) {
    const steps = [...next.session.steps];
    const retries = steps.filter((item) => item.id === step.id && item.retry).length;
    if (retries < 2) {
      const kind = step.kind === "meaning" ? "picture" : "meaning";
      const at = Math.min(steps.length, session.index + 4);
      steps.splice(at, 0, { id: step.id, kind, retry: true, options: distractors(byId[step.id], kind, Date.now()) });
      next = { ...next, session: { ...next.session, steps } };
    }
  }
  return next;
});
const advance = (seconds) => store.updateProgress((progress) => {
  if (!progress.session) return progress;
  const index = progress.session.index + 1;
  const next = store.bumpDay(progress, { t: Math.max(0, Math.min(90, Math.round(seconds))) });
  return { ...next, session: { ...next.session, index, pending: undefined, finished: index >= next.session.steps.length ? Date.now() : undefined } };
});
const sessionStats = (session) => {
  const grades = Object.values(session.graded);
  const correct = grades.filter((grade) => grade !== Rating.Again).length;
  return { total: grades.length, correct, accuracy: grades.length ? Math.round((correct / grades.length) * 100) : 0 };
};
module.exports = { dueIds, nextNew, todayPlan, distractors, buildSession, gradeFor, answer, advance, sessionStats };
