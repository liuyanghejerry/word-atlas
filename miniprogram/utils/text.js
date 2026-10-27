const normalize = (value) => String(value).normalize("NFKC").replace(/[’‘]/g, "'").replace(/[‐‑–—]/g, "-").replace(/\s+/g, " ").trim().toLowerCase();
const plainPinyin = (value) => String(value).toLowerCase().normalize("NFD").replace(/[̄́̌̀̈]/g, "").replace(/ü/g, "v");
const hashSeed = (value) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return hash >>> 0;
};
const shuffle = (items, seed = Math.random() * 2 ** 31) => {
  const output = [...items];
  let value = Math.floor(seed) || 1;
  for (let index = output.length - 1; index > 0; index--) {
    value = (Math.imul(1664525, value) + 1013904223) >>> 0;
    const other = value % (index + 1);
    [output[index], output[other]] = [output[other], output[index]];
  }
  return output;
};
const searchEntries = (entries, raw) => {
  const query = plainPinyin(String(raw).trim());
  if (!query) return entries;
  const compact = query.replace(/\s/g, "");
  return entries.map((entry) => {
    const word = entry.w.toLowerCase();
    const pinyin = plainPinyin(entry.pinyin);
    const chinese = `${entry.hanzi} ${entry.zh}`;
    let score = 0;
    if (entry.hanzi === raw.trim() || word === query || pinyin === compact) score = 1000;
    else if (word.startsWith(query) || pinyin.startsWith(compact)) score = 500 - word.length;
    else if (chinese.includes(raw.trim())) score = 300 - chinese.indexOf(raw.trim());
    else if (word.includes(query)) score = 200 - word.indexOf(query) - word.length;
    return [score, entry];
  }).filter(([score]) => score > 0).sort((a, b) => b[0] - a[0] || a[1].order - b[1].order).map(([, entry]) => entry);
};
module.exports = { normalize, plainPinyin, hashSeed, shuffle, searchEntries };
