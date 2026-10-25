import { ArrowRight, Flame, Sparkles } from "lucide-react";
import { useEffect, useMemo } from "react";
import { prefetch, useAtlas, useEntry } from "../atlas/context";
import { go, openWord } from "../lib/router";
import { cue } from "../lib/sound";
import { hashSeed } from "../lib/text";
import { buildSession, masteredCount, todayPlan } from "../store/session";
import { isMastered } from "../store/srs";
import { dayKey, store, useStore } from "../store/store";
import { Galaxy } from "../galaxy/Galaxy";
import { Pronounce } from "../ui/EntryView";
import { Illustration } from "../ui/Illustration";
import { Ring } from "../ui/Ring";
import { Speak } from "../ui/Speak";

const BRAND = `${import.meta.env.BASE_URL}brand`;

function greeting(h: number) {
  if (h < 5) return "夜深了";
  if (h < 11) return "早上好";
  if (h < 14) return "中午好";
  if (h < 18) return "下午好";
  return "晚上好";
}

export function streakOf(days: Record<string, { r: number }>) {
  let n = 0;
  const d = new Date();
  if (!(days[dayKey(d)]?.r > 0)) d.setDate(d.getDate() - 1);
  while (days[dayKey(d)]?.r > 0) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function Today() {
  const atlas = useAtlas();
  const progress = useStore((s) => s.progress);
  const settings = useStore((s) => s.settings);
  const plan = useMemo(
    () => todayPlan(atlas, progress, settings),
    [atlas, progress, settings],
  );
  const firstIds = [...plan.due.slice(0, 4), ...plan.fresh.slice(0, 6)].join(
    ",",
  );
  useEffect(() => {
    const ids = firstIds.split(",").filter(Boolean);
    const t = window.setTimeout(() => void prefetch(atlas, ids), 800);
    return () => window.clearTimeout(t);
  }, [atlas, firstIds]);
  const now = new Date();
  const today = progress.days[dayKey()];
  const streak = streakOf(progress.days);
  const active =
    progress.session && !progress.session.finished ? progress.session : null;
  const total = plan.due.length + plan.fresh.length;
  const goal = settings.dailyNew + Math.min(plan.due.length, 30);
  const doneToday = today?.r ?? 0;

  const start = (opts?: { reviewOnly?: boolean; extra?: number }) => {
    if (!active) {
      const s = buildSession(
        atlas,
        progress,
        opts?.extra
          ? { ...settings, dailyNew: (today?.n ?? 0) + opts.extra }
          : settings,
        { reviewOnly: opts?.reviewOnly },
      );
      if (!s.steps.length) return;
      store.progress((p) => ({ ...p, session: s }));
    }
    if (settings.sfx) void cue("start");
    go({ page: "learn" });
  };

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const k = dayKey(d);
    return {
      k,
      label: "日一二三四五六"[d.getDay()],
      v: progress.days[k]?.r ?? 0,
      today: i === 6,
    };
  });

  const learned = Object.keys(progress.cards).length;
  const mastered = masteredCount(progress);
  const teaser = (active ? active.newIds : plan.fresh)
    .slice(0, 5)
    .map((id) => atlas.byId.get(id)!)
    .filter(Boolean);

  return (
    <div className="page today">
      <header className="greet">
        <p className="eyebrow">
          {now.getMonth() + 1}月{now.getDate()}日 · 星期
          {"日一二三四五六"[now.getDay()]}
        </p>
        <h1 className="display">{greeting(now.getHours())}，小小探索家。</h1>
      </header>

      <section
        className={`journey ${total === 0 && !active ? "is-clear" : ""}`}
      >
        <img
          className="journey-art"
          src={`${BRAND}/hero.webp`}
          alt=""
          fetchPriority="high"
        />
        <div className="journey-body">
          {active ? (
            <>
              <p className="eyebrow eyebrow-light">小旅程进行中</p>
              <h2>
                还剩 <b>{active.steps.length - active.index}</b> 小步
              </h2>
              <p className="journey-lede">已经帮你保存好了，接着出发吧。</p>
            </>
          ) : total > 0 ? (
            <>
              <p className="eyebrow eyebrow-light">今日小旅程</p>
              <h2>
                {plan.due.length > 0 && (
                  <>
                    复习 <b>{plan.due.length}</b>
                  </>
                )}
                {plan.due.length > 0 && plan.fresh.length > 0 && <i> · </i>}
                {plan.fresh.length > 0 && (
                  <>
                    新词卡 <b>{plan.fresh.length}</b>
                  </>
                )}
              </h2>
              <p className="journey-lede">
                大约 {plan.minutes} 分钟。看一看，听一听，再选一选。
              </p>
            </>
          ) : (
            <>
              <p className="eyebrow eyebrow-light">今日已完成</p>
              <h2>今天的小星星都亮了。</h2>
              <p className="journey-lede">好好休息，明天再来发现新字词。</p>
            </>
          )}
          {teaser.length > 0 && (
            <div className="teaser" aria-label="今天会遇见的词卡">
              {teaser.map((w, i) => (
                <Illustration
                  key={w.id}
                  src={atlas.img(w, "thumb")}
                  word={w.word}
                  topic={w.topic}
                  className={`teaser-${i}`}
                />
              ))}
              <span>今天会遇见它们</span>
            </div>
          )}
          <div className="journey-actions">
            {active || total > 0 ? (
              <button
                className="btn btn-primary btn-xl"
                onClick={() => start()}
              >
                {active ? "继续小旅程" : "开始今天的小旅程"}{" "}
                <ArrowRight size={20} />
              </button>
            ) : (
              <button
                className="btn btn-primary btn-xl"
                onClick={() => start({ extra: 3 })}
              >
                再认识 3 张词卡 <Sparkles size={18} />
              </button>
            )}
            {!active && plan.due.length > 0 && plan.fresh.length > 0 && (
              <button
                className="btn btn-glass"
                onClick={() => start({ reviewOnly: true })}
              >
                只复习
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="today-grid">
        <WordOfDay />
        <section className="panel streak-panel">
          <div className="panel-head">
            <h3 className="eyebrow">我的这一周</h3>
            <span className={`streak ${streak ? "is-on" : ""}`}>
              <Flame size={16} /> 连续 {streak} 天
            </span>
          </div>
          <div className="streak-body">
            <Ring
              value={goal ? doneToday / goal : 0}
              size={112}
              stroke={8}
              tone="terra"
            >
              <b>{doneToday}</b>
              <small>今日练习</small>
            </Ring>
            <ol className="week">
              {week.map((d) => (
                <li
                  key={d.k}
                  className={`${d.v ? "is-on" : ""} ${d.today ? "is-today" : ""}`}
                  title={`${d.k}：${d.v} 题`}
                >
                  <span
                    style={
                      { "--h": Math.min(1, d.v / 20) } as React.CSSProperties
                    }
                  />
                  <small>{d.label}</small>
                </li>
              ))}
            </ol>
          </div>
          <dl className="mini-stats">
            <div>
              <dt>已点亮</dt>
              <dd>{learned}</dd>
            </div>
            <div>
              <dt>记住了</dt>
              <dd>{mastered}</dd>
            </div>
            <div>
              <dt>全部词卡</dt>
              <dd>{atlas.count}</dd>
            </div>
          </dl>
        </section>
        <LevelPath />
        <GalaxyPanel learned={learned} total={atlas.count} />
        <Topics />
      </div>
    </div>
  );
}

function GalaxyPanel({ learned, total }: { learned: number; total: number }) {
  const ids = useStore((s) => s.progress.cards);
  const todayIds = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return Object.entries(ids)
      .filter(([, c]) => c.seen >= start.getTime())
      .map(([id]) => id);
  }, [ids]);
  return (
    <section
      className="galaxy-panel"
      onClick={() => go({ page: "atlas", view: "galaxy" })}
      role="link"
      tabIndex={0}
      onKeyDown={(e) =>
        e.key === "Enter" && go({ page: "atlas", view: "galaxy" })
      }
    >
      <Galaxy mode="mini" highlight={todayIds} />
      <div className="galaxy-panel-copy">
        <p className="eyebrow eyebrow-light">我的双语星图</p>
        <h3>
          已点亮 <b>{learned}</b> 颗星
        </h3>
        <p>
          {learned
            ? `还有 ${total - learned} 颗在等你。金色是今天新点亮的。`
            : `${total} 张词卡就是 ${total} 颗星。学会一个，就点亮一颗。`}
        </p>
        <span className="btn btn-glass">
          去看看星图 <ArrowRight size={18} />
        </span>
      </div>
    </section>
  );
}

function WordOfDay() {
  const atlas = useAtlas();
  const pick = useMemo(
    () => atlas.words[hashSeed(dayKey()) % atlas.words.length],
    [atlas],
  );
  const { entry } = useEntry(pick?.id);
  if (!pick) return null;
  return (
    <section
      className="panel wotd"
      onClick={() => openWord(pick.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && openWord(pick.id)}
      aria-label={`今日词卡：${pick.hanzi} ${pick.word}`}
    >
      <Illustration
        src={atlas.img(pick)}
        word={pick.word}
        topic={pick.topic}
        className="wotd-art"
      />
      <div className="wotd-body">
        <h3 className="eyebrow">今日一词</h3>
        <div className="wotd-bilingual">
          <p className="wotd-hanzi" lang="zh-CN">
            {pick.hanzi}
          </p>
          <div>
            <p className="pinyin">{pick.pinyin}</p>
            <p className="wotd-word" lang="en">
              {pick.word}
            </p>
          </div>
        </div>
        {entry && (
          <div onClick={(e) => e.stopPropagation()} className="wotd-pron">
            <Speak
              url={atlas.audio(entry, "zh")}
              text={pick.hanzi ?? pick.zh}
              accent="zh"
              size="sm"
              label="中文"
            />
            <Pronounce entry={entry} refw={pick} />
          </div>
        )}
        <p className="wotd-zh">{pick.zh}</p>
      </div>
    </section>
  );
}

function LevelPath() {
  const atlas = useAtlas();
  const cards = useStore((s) => s.progress.cards);
  const start = useStore((s) => s.settings.startLevel);
  const levels = useMemo(() => {
    const out = atlas.cefr.map((name) => ({
      name,
      total: 0,
      seen: 0,
      mastered: 0,
    }));
    for (const w of atlas.words) {
      const l = out[w.cefr];
      l.total++;
      const c = cards[w.id];
      if (c) {
        l.seen++;
        if (isMastered(c)) l.mastered++;
      }
    }
    return out;
  }, [atlas, cards]);
  return (
    <section className="panel path-panel">
      <div className="panel-head">
        <h3 className="eyebrow">我的成长路线</h3>
        <span className="legend">
          <i className="lg-seen" /> 学过 <i className="lg-done" /> 记住了
        </span>
      </div>
      <ol className="route">
        {levels.map((l, i) => {
          const seen = l.seen / Math.max(1, l.total);
          const done = l.mastered / Math.max(1, l.total);
          return (
            <li
              key={l.name}
              className={`${i === start ? "is-start" : ""} ${l.seen ? "is-on" : ""}`}
            >
              <button
                onClick={() => go({ page: "atlas", level: l.name })}
                aria-label={`${l.name}，已学 ${l.seen} / ${l.total}`}
              >
                <span
                  className="station"
                  style={
                    { "--seen": seen, "--done": done } as React.CSSProperties
                  }
                >
                  <b>{i + 1}</b>
                </span>
                <span className="station-name">{l.name}</span>
                <span className="station-count">
                  {l.seen}
                  <small>/{l.total}</small>
                </span>
                {i === start && <span className="station-flag">起点</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Topics() {
  const atlas = useAtlas();
  const counts = useMemo(() => {
    const c = new Array(atlas.topics.length).fill(0);
    atlas.words.forEach((w) => c[w.topic]++);
    return c;
  }, [atlas]);
  return (
    <section className="topics-panel">
      <div className="panel-head">
        <h3 className="eyebrow">按主题去发现</h3>
        <button className="link" onClick={() => go({ page: "atlas" })}>
          打开双语图鉴
        </button>
      </div>
      <ul className="topic-tiles">
        {atlas.topics.map(([key, name], i) => (
          <li key={key}>
            <button onClick={() => go({ page: "atlas", topic: key })}>
              <span className={`topic-symbol topic-${key}`} aria-hidden="true">
                {name.slice(0, 1)}
              </span>
              <span>
                <b>{name}</b>
                <small>{counts[i]} 张词卡</small>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
