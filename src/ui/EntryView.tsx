import { Bookmark, BookmarkCheck, Lightbulb, Share2 } from "lucide-react";
import type { Entry, WordRef } from "../atlas/types";
import { useAtlas } from "../atlas/context";
import { splitHighlight } from "../lib/text";
import { formatInterval, isMastered } from "../store/srs";
import { toggleBookmark, useStore } from "../store/store";
import { Illustration } from "./Illustration";
import { Speak } from "./Speak";
import { shareWord } from "./share";

export function Highlight({ text, word }: { text: string; word: string }) {
  const parts = splitHighlight(text, word);
  if (!parts) return <>{text}</>;
  return (
    <>
      {parts[0]}
      <mark>{parts[1]}</mark>
      {parts[2]}
    </>
  );
}

export function Pronounce({
  entry,
  refw,
}: {
  entry: Entry;
  refw: WordRef | Entry;
}) {
  const atlas = useAtlas();
  return (
    <div className="pron">
      <Speak
        url={atlas.audio(refw, "us")}
        text={entry.w}
        accent="us"
        size="sm"
        label={<span className="ipa">{entry.us || entry.uk}</span>}
      />
    </div>
  );
}

export function EntryView({
  entry,
  mode = "detail",
  eager = true,
}: {
  entry: Entry;
  mode?: "detail" | "intro" | "reveal";
  eager?: boolean;
}) {
  const atlas = useAtlas();
  const ref = atlas.byId.get(entry.id);
  const card = useStore((s) => s.progress.cards[entry.id]);
  const saved = useStore((s) => s.progress.bookmarks.includes(entry.id));
  const topicIdx = atlas.topics.findIndex((t) => t[0] === entry.topic);
  const topic = atlas.topics[topicIdx];
  const status = card ? (isMastered(card) ? "记住了" : "学习中") : null;
  const hanzi = entry.hanzi ?? entry.senses[0].zh;

  return (
    <article className={`entry entry-${mode}`}>
      <div className="entry-art">
        <Illustration
          src={atlas.img(entry)}
          word={entry.w}
          topic={topicIdx}
          eager={eager}
          alt={`${hanzi} ${entry.w} 插画`}
        />
      </div>
      <div className="entry-body">
        <header className="entry-head">
          <div className="entry-tags">
            <span className={`chip chip-level lv-${entry.cefr}`}>
              {entry.cefr}
            </span>
            {topic && <span className="chip">{topic[1]}</span>}
            {status && (
              <span
                className={`chip chip-status ${status === "记住了" ? "is-done" : ""}`}
              >
                {status}
              </span>
            )}
          </div>
          {mode === "detail" && (
            <div className="entry-actions">
              <button
                className={`icon-btn ${saved ? "is-on" : ""}`}
                onClick={() => toggleBookmark(entry.id)}
                aria-pressed={saved}
                aria-label={saved ? "取消收藏" : "收藏"}
              >
                {saved ? <BookmarkCheck size={19} /> : <Bookmark size={19} />}
              </button>
              <button
                className="icon-btn"
                onClick={() => shareWord(atlas, entry)}
                aria-label="生成分享卡片"
              >
                <Share2 size={19} />
              </button>
            </div>
          )}
        </header>
        {ref && (
          <p className="specimen">
            第 {ref.order + 1} 张词卡
            <i />
            Little Word Atlas
          </p>
        )}
        <div className="bilingual-head">
          <div className="hanzi-block">
            <h2 className="hanzi" lang="zh-CN">
              {hanzi}
            </h2>
            <p className="pinyin" lang="zh-Latn">
              {entry.pinyin}
            </p>
            <Speak
              url={atlas.audio(entry, "zh")}
              text={hanzi}
              accent="zh"
              size="lg"
              label="读汉字"
            />
          </div>
          <div className="english-block">
            <h3 className="headword" lang="en">
              {entry.w}
            </h3>
            <p className="kid-meaning">{entry.senses[0].zh}</p>
            <Pronounce entry={entry} refw={ref ?? entry} />
          </div>
        </div>

        <section className="block kid-sentences">
          <h3 className="eyebrow">读一读</h3>
          {entry.zhEx && (
            <div className="kid-sentence zh-sentence">
              <span className="sentence-badge">中</span>
              <p lang="zh-CN">
                <Highlight text={entry.zhEx} word={hanzi} />
                <Speak
                  url={atlas.audio(entry, "zhEx")}
                  text={entry.zhEx}
                  accent="zh"
                  size="sm"
                />
              </p>
            </div>
          )}
          {entry.ex[0] && (
            <div className="kid-sentence">
              <span className="sentence-badge en">EN</span>
              <div>
                <p className="ex-en" lang="en">
                  <Highlight text={entry.ex[0].en} word={entry.w} />
                  <Speak
                    url={atlas.audio(entry, "enUs")}
                    text={entry.ex[0].en}
                    accent="us"
                    size="sm"
                  />
                </p>
                <p className="ex-zh">{entry.ex[0].zh}</p>
              </div>
            </div>
          )}
        </section>

        {entry.words && entry.words.length > 0 && (
          <section className="block">
            <h3 className="eyebrow">词语好朋友</h3>
            <ul className="word-friends">
              {entry.words.map((word, index) => (
                <li key={word}>
                  <span lang="zh-CN">{word}</span>
                  <Speak
                    url={entry.media?.words?.[index] ?? null}
                    text={word}
                    accent="zh"
                    size="sm"
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        {entry.tip && (
          <aside className="tip">
            <Lightbulb size={19} strokeWidth={1.8} />
            <p>{entry.tip}</p>
          </aside>
        )}
        {mode === "detail" && card && (
          <p className="memory-note">
            {card.due <= Date.now()
              ? "现在可以复习"
              : `下次复习 ${formatInterval(card.due - Date.now())}后`}{" "}
            · 已练习 {card.reps} 次
          </p>
        )}
      </div>
    </article>
  );
}
