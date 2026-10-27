const { createEmptyCard, fsrs, Rating, State } = require("../vendor/ts-fsrs.js");

const schedulers = new Map();
const scheduler = (retention) => {
  if (!schedulers.has(retention)) {
    schedulers.set(retention, fsrs({
      request_retention: retention,
      enable_fuzz: true,
      enable_short_term: true,
      learning_steps: ["1m", "10m"],
      relearning_steps: ["10m"],
    }));
  }
  return schedulers.get(retention);
};
const toCard = (card) => ({
  due: new Date(card.due),
  stability: card.s,
  difficulty: card.d,
  elapsed_days: card.el,
  scheduled_days: card.sd,
  learning_steps: card.ls,
  reps: card.reps,
  lapses: card.lapses,
  state: card.st,
  last_review: card.last ? new Date(card.last) : undefined,
});
const review = (previous, grade, now, retention = 0.9) => {
  const card = previous ? toCard(previous) : createEmptyCard(new Date(now));
  const next = scheduler(retention).next(card, new Date(now), grade).card;
  return {
    due: next.due.getTime(),
    s: next.stability,
    d: next.difficulty,
    el: next.elapsed_days,
    sd: next.scheduled_days,
    ls: next.learning_steps,
    reps: next.reps,
    lapses: next.lapses,
    st: next.state,
    last: next.last_review ? next.last_review.getTime() : undefined,
    seen: previous ? previous.seen : now,
  };
};
const isMastered = (card) => !!card && card.st === State.Review && card.s >= 21;

module.exports = { Rating, State, review, isMastered };
