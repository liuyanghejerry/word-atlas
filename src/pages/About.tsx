import { ArrowUpRight, Database, Github, Heart } from "lucide-react";
import { useAtlas } from "../atlas/context";
import { REPO_URL } from "../config";

const BASE = import.meta.env.BASE_URL;

export function About() {
  const atlas = useAtlas();
  return (
    <div className="page about">
      <header className="about-hero">
        <img src={`${BASE}brand/og.webp`} alt="" />
        <div>
          <p className="eyebrow">关于芽芽词光</p>
          <h1 className="display">一字一画，中英一起学。</h1>
          <p className="lede">
            为幼小衔接和小学低年级孩子制作的 {atlas.count}{" "}
            张双语启蒙词卡。一个汉字、一个英文词、一幅画，配拼音、双语短句和朗读。
          </p>
          <p className="lede">
            不用注册，没有广告和追踪。每天几张卡，在轻松的小旅程里慢慢积累。
          </p>
          <div className="about-actions">
            <a
              className="btn btn-primary"
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
            >
              <Github size={18} /> 查看开源项目
            </a>
            <a
              className="btn btn-ghost"
              href={`${BASE}atlas/kids.json`}
              download
            >
              <Database size={18} /> 下载儿童词库 JSON
            </a>
          </div>
        </div>
      </header>

      <div className="about-grid">
        <section className="panel">
          <h3 className="eyebrow">孩子怎么学</h3>
          <ul className="feature-list">
            <li>
              <b>先看和听。</b>插画建立图义联想，汉字、拼音和英文同时出现。
            </li>
            <li>
              <b>再选一选。</b>
              汉字选英文、看图选汉字、听音选词，不需要输入中文。
            </li>
            <li>
              <b>逐步拼英文。</b>
              熟悉以后才加入英文拼写，练习页也可以自由书写短句。
            </li>
            <li>
              <b>快忘记时再见。</b>FSRS
              间隔复习安排下次见面，答错只鼓励再试，不重复刷高正确率。
            </li>
            <li>
              <b>每词一颗星。</b>六大主题组成双语星图，学习进度看得见。
            </li>
          </ul>
        </section>

        <section className="panel">
          <h3 className="eyebrow">给家长的小建议</h3>
          <ul className="feature-list">
            <li>每天 3–5 张新卡即可，优先保持轻松和规律。</li>
            <li>先让孩子自己听、看、选，不急着纠正每一次发音。</li>
            <li>把词卡和生活连起来，例如看到门时说“门，door”。</li>
            <li>中文使用内置普通话合成音频，也可以由家长陪同示范。</li>
            <li>进度只保存在当前浏览器，可在“家长”页导出备份。</li>
          </ul>
        </section>

        <section className="panel">
          <h3 className="eyebrow">内容与声音</h3>
          <p className="muted">
            儿童双语文字为本分支编写的启蒙内容，复用原 Word Atlas
            的插画和美音单词录音。汉字、中文短句和组词使用内置普通话合成音频，英文单词和短句统一使用美音。
          </p>
          <p className="muted">
            首版不包含中文笔顺动画或中文真人录音。词卡内容经过结构与素材引用校验，仍建议家长在使用时陪同检查。
          </p>
        </section>

        <section className="panel">
          <h3 className="eyebrow">开放数据</h3>
          <p className="muted">
            <code>public/atlas/kids.json</code>{" "}
            是完整儿童词库。原始插画和英文录音来自 Word Atlas，内容授权遵循 CC
            BY 4.0；代码采用 MIT。
          </p>
          <a
            className="link"
            href={`${REPO_URL}#readme`}
            target="_blank"
            rel="noreferrer"
          >
            阅读原项目文档 <ArrowUpRight size={14} />
          </a>
        </section>
      </div>
      <p className="colophon">
        <Heart size={14} /> 做给每一个正在认识世界的小朋友。
      </p>
    </div>
  );
}
