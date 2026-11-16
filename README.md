# pi-study

从零学习并复刻 [Pi](https://github.com/earendil-works/pi)（earendil-works 出品的极简可扩展终端 AI 编码代理）的工作区。

## 这个仓库是干什么的

- **`pi/`（本地存在、已被 gitignore）**：Fork 的 Pi 源码仓库（[wwstudy123/pi](https://github.com/wwstudy123/pi)），作为**只读对照**的学习对象，不入库。
- **`c-pi/`**：学习产出仓库。代码全部由 AI 生成、按最小粒度逐步迭代复刻 Pi 的功能；`c-pi/docs/` 是 VitePress 学习文档站，沉淀所有学习文档。
- **`AGENTS.md`**：给 AI 助手的背景上下文——任何新对话先读它即可进入工作状态（仓库结构、分支规范、学习方法论、进度清单）。

## 目录结构

```
pi-study/
├── AGENTS.md            # AI 协作背景与工作流（先读这个）
├── .gitignore           # pi/ 与运行时目录不入库
├── examples/            # 文章里的动手实验代码
└── c-pi/
    ├── docs/            # 主线 VitePress 文档站（npm run dev，端口 5173）
    │   ├── run-pi.md        # 第一课：亲手把 Pi 跑起来
    │   ├── roadmap.md       # 复刻路线课表
    │   └── feature-map.md   # Pi 功能地图
    ├── wiki/            # 支线 VitePress 知识库（npm run dev，端口 5174）
    │   └── shell/           # 第一条支线：逐块精读 pi-test.sh（9 篇 + 首页）
    └── packages/        # 预留：将来重写 pi 代码
```

主线读到哪、支线补到哪：以后读到 Node 模块解析、TUI 渲染时，各开一个 `wiki/node-cli/`、`wiki/tui/`，每条支线独立侧栏，互不干扰。

## 学习工作流

1. **对照原型**：`pi/` 里从 main 检出当日学习分支，命名 `pi-MMDD-YYYY`（如 `pi-1116-2026`）。
2. **同步上游**：上游更新后同步到 Fork 的 main，再检出新的当日学习分支，与旧学习分支 diff 即可看到更新内容。
3. **复刻产出**：功能拆成最小可运行单元，在 `c-pi/` 里从零重写，每步沉淀文档到 `c-pi/docs/`。

复刻路线与功能清单见 [c-pi/docs/feature-map.md](c-pi/docs/feature-map.md)。

## 相关链接

- Pi 上游仓库：https://github.com/earendil-works/pi
- Pi Fork：https://github.com/wwstudy123/pi
- Pi 官网：https://pi.dev
