# 芽芽词光 · Little Word Atlas

**一字一画，中英一起学。**

从「词光 Word Atlas」改造的儿童中英启蒙应用，适合幼小衔接和小学低年级。一个汉字、一个英文词、一幅插画，再配合拼音、双语短句、朗读和轻量复习。

- 48 张手工编排的双语词卡
- 神奇自然、可爱动物、美味食物、我的生活、认识身体、发现不同 6 个主题
- 萌芽、起步、成长 3 个学习阶段
- 无账号、无广告、无追踪，进度只保存在本机

## 孩子可以做什么

- **看词卡**：大汉字、拼音、英文、中文释义和插画同时呈现。
- **听发音**：汉字、中文短句和组词使用内置普通话音频，英文单词和短句统一使用美音。
- **玩练习**：汉字选英文、看图选汉字、听英文选词，熟悉后再练英文拼写。
- **读句子**：每张卡都有中文短句、英文短句及翻译，还有三个中文组词和一条记忆提示。
- **点亮星图**：每张词卡对应一颗星，六大主题组成可旋转、缩放的双语星图。
- **轻松复习**：FSRS 间隔重复算法在快要忘记时安排复习；答错会再练，但不会重复刷高正确率。

家长可以选择学习起点和每天 3 / 5 / 8 / 10 张新卡，查看进度、调整声音和外观，并导出或恢复学习备份。另有可选的英文单词、短句和听写练习。

## 词库

当前应用读取 [`public/atlas/kids.json`](public/atlas/kids.json)。词卡包含：

```json
{
  "id": "sun",
  "hanzi": "日",
  "pinyin": "rì",
  "w": "sun",
  "uk": "/sʌn/",
  "us": "/sʌn/",
  "pos": "n.",
  "zh": "太阳",
  "level": 0,
  "topic": "nature",
  "zhEx": "红红的日照耀大地。",
  "enEx": "The sun is warm.",
  "enExZh": "太阳暖暖的。",
  "words": ["日光", "生日", "日出"],
  "tip": "“日”像一轮太阳。它也表示日子，例如“生日”。"
}
```

插画和美音单词录音复用原项目的 `public/atlas/img/`、`thumb/` 和 `audio/us/`。汉字、中文短句和组词使用 `audio/{zh,zh-ex,zh-word}/` 中预先合成的普通话音频；英文短句使用 `audio/en-us/` 中的美音合成音频。全部可随应用缓存离线播放。首版没有中文真人录音或笔顺动画。

完整字段说明见 [`docs/dataset.md`](docs/dataset.md)。`data/word-atlas.*` 是原项目保留的雅思素材数据，不是当前儿童应用加载的词库。

## 技术

React 19、TypeScript、Vite、ts-fsrs、WebGL2 自定义星图。应用是纯前端静态站点。

本地运行需要 Node.js 20+：

```bash
npm ci
npm run dev
```

打开 `http://localhost:5188`。

```bash
npm test            # 单元测试与儿童词库/素材校验
npm run check:atlas # 校验原始素材库
npm run build       # 生产构建，输出 dist/
```

子路径部署：`ATLAS_BASE=/words/ npm run build`。

## 开源与说明

本项目基于 [Word Atlas](https://github.com/designfuchen/word-atlas)。代码采用 [MIT](LICENSE)；原词库文本、插画和录音采用 [CC BY 4.0](CONTENT_LICENSE.md)，署名 “Word Atlas contributors（词光）”。新增儿童双语内容沿用相同内容授权。

这是启蒙学习工具，不替代家长陪读和系统语言教育。词卡经过结构与素材引用自动校验，仍建议家长陪同使用。
