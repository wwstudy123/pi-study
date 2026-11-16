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
└── c-pi/
    └── docs/            # 学习文档（VitePress 文档站根目录）
        ├── feature-map.md   # Pi 功能地图：功能清单/运行方式/复刻路线总纲
        └── research/        # 调研底稿（12 包详注 / 43 篇官方文档详注 / 仓库工程结构）
```

## 学习工作流

1. **对照原型**：`pi/` 里从 main 检出当日学习分支，命名 `pi-MMDD-YYYY`（如 `pi-1116-2026`）。
2. **同步上游**：上游更新后同步到 Fork 的 main，再检出新的当日学习分支，与旧学习分支 diff 即可看到更新内容。
3. **复刻产出**：功能拆成最小可运行单元，在 `c-pi/` 里从零重写，每步沉淀文档到 `c-pi/docs/`。

复刻路线与功能清单见 [c-pi/docs/feature-map.md](c-pi/docs/feature-map.md)。

## 相关链接

- Pi 上游仓库：https://github.com/earendil-works/pi
- Pi Fork：https://github.com/wwstudy123/pi
- Pi 官网：https://pi.dev
