import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

interface KidsEntry {
  id: string;
  hanzi: string;
  pinyin: string;
  w: string;
  uk: string;
  us: string;
  pos: string;
  zh: string;
  level: number;
  topic: string;
  zhEx: string;
  enEx: string;
  enExZh: string;
  words: string[];
  tip: string;
}

type IndexRow = [string, string, string, string, number, number, number];

const kids = JSON.parse(
  readFileSync(
    new URL("../../public/atlas/kids.json", import.meta.url),
    "utf8",
  ),
) as {
  count: number;
  examples: number;
  illustrated: number;
  topics: [string, string][];
  levels: string[];
  entries: KidsEntry[];
};
const source = JSON.parse(
  readFileSync(
    new URL("../../public/atlas/index.json", import.meta.url),
    "utf8",
  ),
) as { words: IndexRow[] };
const sourceById = new Map(source.words.map((row) => [row[0], row]));

test("kids atlas has 48 complete, unique bilingual cards", () => {
  assert.equal(kids.entries.length, 48);
  assert.equal(kids.count, 48);
  assert.equal(kids.examples, 96);
  assert.equal(kids.illustrated, 48);
  assert.equal(new Set(kids.entries.map((entry) => entry.id)).size, 48);
  assert.equal(new Set(kids.entries.map((entry) => entry.hanzi)).size, 48);
  const topics = new Set(kids.topics.map(([key]) => key));
  for (const entry of kids.entries) {
    assert.match(entry.id, /^[a-z0-9-]+$/);
    for (const value of [
      entry.hanzi,
      entry.pinyin,
      entry.w,
      entry.uk,
      entry.us,
      entry.pos,
      entry.zh,
      entry.zhEx,
      entry.enEx,
      entry.enExZh,
      entry.tip,
    ]) {
      assert.equal(typeof value, "string");
      assert.ok(value.trim(), `${entry.id} has an empty required field`);
    }
    assert.ok(topics.has(entry.topic), `${entry.id} has an unknown topic`);
    assert.ok(
      Number.isInteger(entry.level) &&
        entry.level >= 0 &&
        entry.level < kids.levels.length,
    );
    assert.equal(entry.words.length, 3);
    assert.ok(
      entry.words.every((word) => word.includes(entry.hanzi)),
      `${entry.id} has an unrelated Chinese word`,
    );
  }
});

test("kids atlas is evenly organised into six themes and three stages", () => {
  for (let topic = 0; topic < kids.topics.length; topic++) {
    assert.equal(
      kids.entries.filter((entry) => entry.topic === kids.topics[topic][0])
        .length,
      8,
    );
  }
  for (let level = 0; level < kids.levels.length; level++) {
    assert.equal(
      kids.entries.filter((entry) => entry.level === level).length,
      16,
    );
  }
});

test("every illustration and bilingual recording exists", () => {
  assert.ok(
    existsSync(
      new URL("../../public/sfx/voice-welcome-zh.mp3", import.meta.url),
    ),
  );
  for (const entry of kids.entries) {
    const row = sourceById.get(entry.id);
    assert.ok(row, `${entry.id} is absent from the source atlas`);
    assert.equal(row[1], entry.w);
    assert.equal(row[6] & 7, 7, `${entry.id} lacks source media flags`);
    for (const path of [
      `img/${entry.id}.webp`,
      `thumb/${entry.id}.webp`,
      `audio/uk/${entry.id}.mp3`,
      `audio/us/${entry.id}.mp3`,
      `audio/zh/${entry.id}.mp3`,
      `audio/zh-ex/${entry.id}.mp3`,
      `audio/en-us/${entry.id}.mp3`,
      ...entry.words.map(
        (_, index) => `audio/zh-word/${entry.id}-${index}.mp3`,
      ),
    ]) {
      assert.ok(
        existsSync(new URL(`../../public/atlas/${path}`, import.meta.url)),
        `missing ${path}`,
      );
    }
  }
});
