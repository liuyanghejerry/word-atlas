# 微信小程序版

`miniprogram/` 是可直接导入微信开发者工具的原生小程序，使用 WXML、WXSS 和 CommonJS JavaScript，不需要 Taro、uni-app 或 Web 构建。

## 导入与预览

1. 打开微信开发者工具，选择“导入项目”。
2. 项目目录选择本仓库的 `miniprogram/`。
3. 测试可使用目录中已有的 `touristappid`；正式发布前，在 `project.config.json` 中替换为你自己的 AppID。
4. 编译后可浏览四个主页面：今日、图鉴、练习、家长。学习和词卡详情由页面跳转进入。
5. 使用“预览”生成二维码，在微信中做真机检查。

当前源码和包体已通过 Node 自动化校验，但开发者仍需在微信开发者工具及真机确认界面、音频播放、Canvas 分享图、相册权限和转发行为。

## 已实现

- 48 张中英词卡，六大主题、三个学习阶段。
- 汉字、中文短句、144 个组词、美音单词和美音短句，全部离线播放。
- 首次引导、今日计划、四类学习题、错题重练、FSRS 复习和学习总结。
- 汉字/拼音/英文搜索，主题/阶段/学习状态筛选，网格、列表和触摸星图。
- 英文单词、短句和听写练习，WPM 与准确率独立统计。
- 收藏、词卡 Canvas 分享图、微信转发、家长设置、剪贴板备份恢复。
- 没有账号、广告、追踪或资源服务器依赖。

首版不移植 Web 版的开屏粒子动画、环境音混音、WebGL 着色器和浏览器快捷键；星图使用 2D 布局，支持拖动旋转和点击词卡。

## 离线分包

| 分包 | 内容 |
| --- | --- |
| `media-full/` | 48 张完整插画 |
| `media-thumb/` | 48 张缩略图 |
| `media-zh/` | 汉字及中文短句音频 |
| `media-zh-word/` | 144 段组词音频 |
| `media-en/` | 美音单词、短句和界面音效 |

每个分包低于 2 MiB，总体约 5 MiB。`utils/media.js` 统一生成路径。

## 修改词卡后重新打包

先按原流程更新 `public/atlas/kids.json` 及 Web 媒体，再运行：

```bash
npm ci
npm run pack:miniprogram
npm run check:miniprogram
```

`pack:miniprogram` 会同步 `data/kids.js`、所需媒体、界面音效和 `ts-fsrs` 的 CommonJS 构建。生成结果随仓库提交，日常使用不需要重新生成。

## 校验

```bash
npm run test:miniprogram   # 小程序数据、存储、FSRS、会话、搜索和打字测试
npm run check:miniprogram  # 页面/组件引用、JS 语法、媒体和分包体积
npm test                   # Web 与小程序全部单元测试
```

`vendor/ts-fsrs.cjs` 来自项目已使用的 `ts-fsrs`，许可证保存在 `vendor/ts-fsrs.LICENSE`。

## 发布前检查

- 替换正式 AppID，并核对小程序名称、图标和隐私说明。
- 在开发者工具中检查所有页面和不同尺寸机型。
- 在真机检查首次播放、后台返回、离线启动和音频中断。
- 检查 Canvas 分享图、相册权限、剪贴板备份恢复和微信转发。
- 按微信平台要求提交审核；本项目不提供微信账号或审核资质。
