const assert = require("node:assert/strict");
const { test } = require("node:test");
const { existsSync, statSync } = require("node:fs");
const path = require("node:path");
const { entries } = require("../utils/data");
const media = require("../utils/media");

const root = path.resolve(__dirname, "..");
const local = (url) => path.join(root, url.replace(/^\//, ""));

test("mini program contains all 48 cards and their offline media", () => {
  assert.equal(entries.length, 48);
  assert.equal(new Set(entries.map((entry) => entry.id)).size, 48);
  for (const entry of entries) {
    const files = [media.full(entry.id), media.thumb(entry.id), media.zh(entry.id), media.zhEx(entry.id), media.us(entry.id), media.enUs(entry.id), ...entry.words.map((_, index) => media.zhWord(entry.id, index))];
    for (const file of files) assert.ok(existsSync(local(file)), `missing ${file}`);
  }
});

test("every media subpackage stays below the 2 MiB limit", () => {
  for (const name of ["media-full", "media-thumb", "media-zh", "media-zh-word", "media-en"]) {
    const files = [];
    const walk = (directory) => {
      for (const item of require("node:fs").readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, item.name);
        if (item.isDirectory()) walk(file);
        else files.push(file);
      }
    };
    walk(path.join(root, name));
    const bytes = files.reduce((sum, file) => sum + statSync(file).size, 0);
    assert.ok(bytes < 2 * 1024 * 1024, `${name} is ${bytes} bytes`);
  }
});
