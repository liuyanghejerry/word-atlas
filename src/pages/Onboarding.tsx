import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useAtlas } from "../atlas/context";
import { store } from "../store/store";

const LEVELS = [
  ["萌芽", "从最常见的字词开始"],
  ["起步", "已经认识一些简单字词"],
  ["成长", "想挑战更多生活词汇"],
];

export function Onboarding() {
  const atlas = useAtlas();
  const [level, setLevel] = useState(0);
  const [goal, setGoal] = useState(5);
  const finish = () =>
    store.settings({ onboarded: true, startLevel: level, dailyNew: goal });
  return (
    <div
      className="onboard"
      role="dialog"
      aria-modal="true"
      aria-label="欢迎来到芽芽词光"
    >
      <div className="onboard-card">
        <img
          className="onboard-art"
          src={`${import.meta.env.BASE_URL}brand/hero.webp`}
          alt=""
        />
        <div className="onboard-body">
          <p className="eyebrow">欢迎来到芽芽词光</p>
          <h1 className="display">
            一字一画，
            <br />
            中英一起学。
          </h1>
          <p className="lede">
            {atlas.count} 张双语词卡，{atlas.count}{" "}
            颗小星星，陪你每天进步一点点。
          </p>
          <fieldset>
            <legend>小朋友从哪里出发？</legend>
            <div className="choice-grid">
              {LEVELS.map(([name, desc], i) => (
                <button
                  key={name}
                  className={`choice ${level === i ? "is-on" : ""}`}
                  onClick={() => setLevel(i)}
                  aria-pressed={level === i}
                >
                  <span className="chip chip-level">{i + 1}</span>
                  <b>{name}</b>
                  <small>{desc}</small>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>每天认识几张新词卡？</legend>
            <div className="segmented segmented-wide">
              {[3, 5, 8].map((n) => (
                <button
                  key={n}
                  className={goal === n ? "is-on" : ""}
                  onClick={() => setGoal(n)}
                  aria-pressed={goal === n}
                >
                  {n} 张{n === 5 ? " · 推荐" : ""}
                </button>
              ))}
            </div>
          </fieldset>
          <button className="btn btn-primary btn-xl" onClick={finish}>
            开始小旅程 <ArrowRight size={20} />
          </button>
          <p className="muted">
            不用注册，学习进度只留在这台设备上。家长可以随时修改。
          </p>
        </div>
      </div>
    </div>
  );
}
