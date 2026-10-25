# Little Word Atlas · 芽芽词光

**One character, one picture. Learn Chinese and English together.**

A child-friendly adaptation of Word Atlas for early Chinese literacy and beginner English. Each card pairs a basic Chinese character or simple word with an English word, an illustration, pinyin, short bilingual sentences and audio.

## Included

- 48 curated bilingual cards in six everyday themes
- Three learning stages: Sprout, Start and Grow
- Large Chinese characters, pinyin, English IPA and US recordings
- Picture matching, Chinese-to-English recall, listening and optional English spelling
- FSRS spaced repetition with honest first-attempt scoring
- An interactive WebGL word galaxy, share cards and optional typing practice
- No account, ads or tracking; progress stays in the browser

Chinese characters, example sentences and related words use bundled Mandarin synthetic audio. English headwords and sentences use US recordings only. This version does not include stroke-order animation.

## Dataset

The app loads [`public/atlas/kids.json`](public/atlas/kids.json). Each entry contains `hanzi`, `pinyin`, `w`, IPA, Chinese meaning, stage, topic, Chinese and English example sentences, three related Chinese words and a learning tip. See [`docs/dataset.md`](docs/dataset.md).

Illustrations and English recordings are reused from the original Word Atlas media library. The legacy IELTS files under `data/` are retained as source material but are not loaded by this app.

## Run

Requires Node.js 20+.

```bash
npm ci
npm run dev        # http://localhost:5188
npm test
npm run check:atlas
npm run build
```

The production site is written to `dist/`. For sub-path hosting, run `ATLAS_BASE=/words/ npm run build`.

## License

Built on [Word Atlas](https://github.com/designfuchen/word-atlas). Code is [MIT](LICENSE). Original text, illustrations and recordings are [CC BY 4.0](CONTENT_LICENSE.md), credited to “Word Atlas contributors”. New bilingual learning content uses the same content license.
