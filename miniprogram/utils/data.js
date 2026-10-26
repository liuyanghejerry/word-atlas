const dataset = require("../data/kids.js");

const entries = dataset.entries.map((entry, order) => ({
  ...entry,
  order,
  levelName: dataset.levels[entry.level],
  topicIndex: Math.max(0, dataset.topics.findIndex(([key]) => key === entry.topic)),
  topicName: (dataset.topics.find(([key]) => key === entry.topic) || [null, "全部"])[1],
}));
const byId = Object.fromEntries(entries.map((entry) => [entry.id, entry]));

module.exports = {
  dataset,
  entries,
  byId,
  topics: dataset.topics.map(([key, name], index) => ({ key, name, index })),
  levels: dataset.levels,
  get: (id) => byId[id],
};
