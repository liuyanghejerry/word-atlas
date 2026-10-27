# 儿童词库格式 / Kids dataset format

当前应用加载 `public/atlas/kids.json`，共 48 张中英双语词卡。

## 数据集元信息

| 字段          | 类型            | 说明                                 |
| ------------- | --------------- | ------------------------------------ |
| `id`          | string          | 当前数据集标识，学习进度按此 ID 隔离 |
| `name`        | string          | 数据集名称                           |
| `count`       | number          | 词卡数，当前为 48                    |
| `examples`    | number          | 中英文短句总数，当前为 96            |
| `illustrated` | number          | 有插画的词卡数                       |
| `topics`      | `[key, 名称][]` | 6 个主题                             |
| `levels`      | string[]        | 萌芽、起步、成长 3 个阶段            |
| `entries`     | object[]        | 按学习路线排列的词卡                 |

## 每张词卡

| 字段        | 类型     | 说明                                      |
| ----------- | -------- | ----------------------------------------- |
| `id`        | string   | 唯一英文 ID，同时对应原素材库的媒体文件名 |
| `hanzi`     | string   | 基础汉字或简单词语                        |
| `pinyin`    | string   | 带声调拼音                                |
| `w`         | string   | 对应的入门英文词                          |
| `uk` / `us` | string   | 原始英式 / 美式 IPA；界面只展示 `us`      |
| `pos`       | string   | 英文词性                                  |
| `zh`        | string   | 简短中文释义                              |
| `level`     | number   | `levels` 的从 0 开始索引                  |
| `topic`     | string   | `topics` 中的 key                         |
| `zhEx`      | string   | 适合儿童的中文短句                        |
| `enEx`      | string   | 适合儿童的英文短句                        |
| `enExZh`    | string   | 英文短句的中文翻译                        |
| `words`     | string[] | 三个包含目标汉字的中文组词                |
| `tip`       | string   | 字形、用法或多音字提示                    |

## 媒体与语音

词卡通过 `id` 复用原始公开素材：

- `public/atlas/img/<id>.webp`：512px 插画
- `public/atlas/thumb/<id>.webp`：256px 缩略图
- `public/atlas/audio/us/<id>.mp3`：美音单词录音

原始素材库中的英音文件保留用于其他用途，儿童应用不加载。儿童版中文使用随应用提供的普通话合成音频：`audio/zh/<id>.mp3` 为汉字，`audio/zh-ex/<id>.mp3` 为中文短句，`audio/zh-word/<id>-<index>.mp3` 为三个组词。英文短句只使用 `audio/en-us/<id>.mp3`，不读取原 `audio/ex/`，以免录音与新短句不一致。

新增中英文音频可用 `scripts/atlas/generate_kids_audio.py` 重新生成；该内容制作脚本需要可选的 Python `edge-tts` 包，应用运行不依赖 Python 或在线语音服务。

`data/word-atlas.json`、`data/word-atlas.csv`、`public/atlas/index.json` 和 `entries/` 是原雅思项目保留的素材数据，不由儿童版主流程加载。

## 校验

`npm test` 会检查词卡数量、必填字段、ID 和汉字唯一性、主题/阶段分布，以及所有插画、美音录音和中文音频是否存在。

## 授权

原素材及新增儿童内容采用 CC BY 4.0，署名 “Word Atlas contributors”。见 [CONTENT_LICENSE.md](../CONTENT_LICENSE.md)。
