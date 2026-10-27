#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mini = path.join(root, "miniprogram");
const errors = [];
const app = JSON.parse(fs.readFileSync(path.join(mini, "app.json"), "utf8"));
const entries = JSON.parse(fs.readFileSync(path.join(root, "public/atlas/kids.json"), "utf8")).entries;

for (const page of app.pages) {
  for (const extension of ["js", "json", "wxml", "wxss"]) {
    const file = path.join(mini, `${page}.${extension}`);
    if (!fs.existsSync(file)) errors.push(`missing page file ${page}.${extension}`);
  }
  const config = path.join(mini, `${page}.json`);
  if (fs.existsSync(config)) {
    const components = JSON.parse(fs.readFileSync(config, "utf8")).usingComponents || {};
    for (const target of Object.values(components)) {
      for (const extension of ["js", "json", "wxml", "wxss"]) {
        if (!fs.existsSync(path.join(mini, `${target}.${extension}`))) errors.push(`missing component ${target}.${extension}`);
      }
      const source = path.join(mini, `${target}.js`);
      if (fs.existsSync(source) && !/\bstyleIsolation\s*:\s*["']shared["']/.test(fs.readFileSync(source, "utf8"))) {
        errors.push(`component does not share app styles ${target}`);
      }
    }
  }
}

const walk = (directory, extension, output = []) => {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) walk(file, extension, output);
    else if (item.name.endsWith(extension)) output.push(file);
  }
  return output;
};
for (const file of [...walk(mini, ".js"), ...walk(mini, ".cjs")]) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) errors.push(`${path.relative(root, file)}: ${result.stderr.trim()}`);
  if (!file.startsWith(path.join(mini, "tests") + path.sep) && /\brequire\(\s*["'][^"']+\.cjs["']\s*\)/.test(fs.readFileSync(file, "utf8"))) {
    errors.push(`unsupported Mini Program module extension ${path.relative(root, file)}`);
  }
}
for (const file of walk(mini, ".wxml")) {
  const text = fs.readFileSync(file, "utf8");
  if ((text.match(/\{\{/g) || []).length !== (text.match(/\}\}/g) || []).length) errors.push(`unbalanced WXML bindings ${file}`);
  if (/\{\{[^}]*\.(slice|map|filter|toLowerCase)\(/.test(text)) errors.push(`unsupported WXML function call ${file}`);
}

const size = (directory) => walk(directory, "", []).reduce((sum, file) => sum + fs.statSync(file).size, 0);
for (const pack of app.subpackages || []) {
  const directory = path.join(mini, pack.root);
  if (!fs.existsSync(directory)) errors.push(`missing subpackage ${pack.root}`);
  else if (size(directory) >= 2 * 1024 * 1024) errors.push(`subpackage ${pack.root} exceeds 2 MiB`);
}
for (const entry of entries) {
  const files = [
    `media-full/img/${entry.id}.webp`, `media-thumb/thumb/${entry.id}.webp`,
    `media-zh/audio/zh/${entry.id}.mp3`, `media-zh/audio/zh-ex/${entry.id}.mp3`,
    `media-en/audio/us/${entry.id}.mp3`, `media-en/audio/en-us/${entry.id}.mp3`,
    ...entry.words.map((_, index) => `media-zh-word/audio/zh-word/${entry.id}-${index}.mp3`),
  ];
  for (const file of files) if (!fs.existsSync(path.join(mini, file))) errors.push(`missing ${file}`);
}
const report = {
  pages: app.pages.length,
  cards: entries.length,
  packages: Object.fromEntries((app.subpackages || []).map((pack) => [pack.root, `${(size(path.join(mini, pack.root)) / 1024 / 1024).toFixed(2)} MiB`])),
  errors: errors.length,
};
console.log(JSON.stringify(report, null, 2));
if (errors.length) {
  console.error(errors.slice(0, 50).join("\n"));
  process.exit(1);
}
