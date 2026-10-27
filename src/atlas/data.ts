import type { Atlas, Entry, WordRef } from "./types";
import { MEDIA } from "./types";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const url = (p: string) => `${BASE}/atlas/${p}`;

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

interface KidsFile {
  id: string;
  name: string;
  count: number;
  examples: number;
  illustrated: number;
  topics: [string, string][];
  levels: string[];
  entries: KidsEntry[];
}

export async function loadOpenAtlas(): Promise<Atlas> {
  const res = await fetch(url("kids.json"));
  if (!res.ok) throw new Error(`启蒙词库加载失败（${res.status}）`);
  const data = (await res.json()) as KidsFile;
  const entries = new Map<string, Entry>();
  const words: WordRef[] = data.entries.map((item, order) => {
    const topic = Math.max(
      0,
      data.topics.findIndex(([key]) => key === item.topic),
    );
    const media = MEDIA.img | MEDIA.uk | MEDIA.us;
    entries.set(item.id, {
      id: item.id,
      hanzi: item.hanzi,
      pinyin: item.pinyin,
      w: item.w,
      uk: item.uk,
      us: item.us,
      senses: [{ pos: item.pos, zh: item.zh, en: "" }],
      ex: [{ en: item.enEx, zh: item.enExZh }],
      zhEx: item.zhEx,
      words: item.words,
      col: [],
      fam: [],
      syn: [],
      ant: [],
      tip: item.tip,
      cefr: data.levels[item.level],
      topic: item.topic,
      m: media,
      media: {
        zh: url(`audio/zh/${item.id}.mp3`),
        zhEx: url(`audio/zh-ex/${item.id}.mp3`),
        words: item.words.map((_, index) =>
          url(`audio/zh-word/${item.id}-${index}.mp3`),
        ),
      },
    });
    return {
      id: item.id,
      word: item.w,
      hanzi: item.hanzi,
      pinyin: item.pinyin,
      zh: item.zh,
      ipa: item.us,
      cefr: item.level,
      topic,
      media,
      order,
    };
  });
  const byId = new Map(words.map((word) => [word.id, word]));

  return {
    id: data.id,
    name: data.name,
    kind: "open",
    count: data.count,
    examples: data.examples,
    illustrated: data.illustrated,
    topics: data.topics,
    cefr: data.levels,
    words,
    byId,
    peek: (id) => entries.get(id),
    entry: async (id) => {
      const entry = entries.get(id);
      if (!entry) throw new Error(`没有找到词条 ${id}`);
      return entry;
    },
    img: (ref, size = "full") =>
      url(`${size === "thumb" ? "thumb" : "img"}/${ref.id}.webp`),
    audio: (_ref, kind) => {
      if (kind === "zhEx") return url(`audio/zh-ex/${_ref.id}.mp3`);
      if (kind === "enUs") return url(`audio/en-us/${_ref.id}.mp3`);
      return kind === "us" || kind === "zh"
        ? url(`audio/${kind}/${_ref.id}.mp3`)
        : null;
    },
  };
}
