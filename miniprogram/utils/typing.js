const clean = (text) => String(text).normalize("NFKC").replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[‐‑–—]/g, "-").replace(/\s/g, " ");
const same = (a, b) => clean(a).toLowerCase() === clean(b).toLowerCase();
const correctCharacterCount = (value, target) => {
  const expected = Array.from(clean(target));
  return Array.from(clean(value)).filter((char, index) => same(char, expected[index] || "")).length;
};
const typingDelta = (previous, next, target) => {
  const before = Array.from(clean(previous));
  const after = Array.from(clean(next));
  const expected = Array.from(clean(target));
  let prefix = 0;
  while (prefix < before.length && prefix < after.length && before[prefix] === after[prefix]) prefix++;
  let suffix = 0;
  while (suffix < before.length - prefix && suffix < after.length - prefix && before[before.length - 1 - suffix] === after[after.length - 1 - suffix]) suffix++;
  const added = after.slice(prefix, after.length - suffix);
  let correct = 0;
  for (let index = 0; index < added.length; index++) if (same(added[index], expected[prefix + index] || "")) correct++;
  return { total: added.length, correct };
};
const typingMetrics = (correctCharacters, attemptedCharacters, acceptedCharacters, elapsedMs) => {
  const attempted = Math.max(0, attemptedCharacters);
  const correct = Math.min(Math.max(0, correctCharacters), attempted);
  const accepted = Math.max(0, acceptedCharacters);
  return {
    accuracy: attempted ? Math.round((correct / attempted) * 100) : 100,
    wpm: elapsedMs >= 1000 ? Math.round(accepted / 5 / (elapsedMs / 60000)) : 0,
  };
};
module.exports = { clean, same, correctCharacterCount, typingDelta, typingMetrics };
