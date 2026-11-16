# AGENTS.md — Pi 源码学习工作区（AI 协作背景）

> 本文件给 AI 助手看：任何新对话开始时，先读本文件即可进入工作状态，无需用户重新解释背景。
> 最后更新：2026-11-16

## 1. 这个工作区是什么

`~/Zcode/pi-study` 是「Pi 源码学习」工作区，用来**从零重学并复刻 Pi 这个项目**，不是产品仓库。

```
pi-study/
├── AGENTS.md   ← 本文件（AI 背景上下文）
├── pi/         ← Fork 的 Pi 源码仓库（只读学习对象，一般不修改其代码）
└── c-pi/       ← 学习复刻仓库：从零重新实现 Pi；docs/ 存放全部学习文档
```

- **pi/**：用户 Fork 的源码仓库。只作为「阅读 + 对照」的原型，学习时的分支操作（检出、同步）在这里做，但**不要修改 pi/ 里的代码**（除非用户明确要求）。
- **c-pi/**：用户的学习产出。代码全部由 AI 生成、用户负责阅读理解，按最小粒度逐步迭代复刻 Pi 的功能。`c-pi/docs` 将用 VitePress 初始化为文档站（**待做**），存放学习中产生的所有文档。

## 2. 相关仓库与上游信息

| 项 | 值 |
| --- | --- |
| 上游原始仓库 | https://github.com/earendil-works/pi |
| 用户 Fork | https://github.com/wwstudy123/pi.git |
| 本地路径 | `/Users/xiaenping/Zcode/pi-study/pi` |

**Pi 是什么**：earendil-works 出品的极简、可扩展的 coding agent harness（编码智能体运行时）。可通过 extensions、skills、prompt templates、themes 定制，打包成 Pi package 通过 npm/git 分发。刻意不带 sub-agents、plan mode 等重功能，鼓励按需自建。

**仓库形态**：npm workspaces monorepo，要求 **Node.js ≥ 22.19**。核心包：

| 包 | 作用 |
| --- | --- |
| @earendil-works/chord | 跨进程对象运行时：contracts、documents、store、links、插件热更新、HTTP、workers、web/终端客户端 |
| @earendil-works/pi-telemetry | 供应商中立的遥测契约、参考适配器、一致性测试 |
| @earendil-works/pi-ai | 统一的多供应商 LLM API（OpenAI/Anthropic/Google 等） |
| @earendil-works/pi-durable | 持久化会话、任务、文档运行时 |
| @earendil-works/pi-agent-core | Agent 运行时：工具调用与状态管理 |
| @earendil-works/pi-coding-agent | 交互式编码智能体 CLI（主产品） |
| @earendil-works/pi-tui | 差分渲染的终端 UI 库 |

**常用开发命令**（在 pi/ 根目录）：

```bash
npm install --ignore-scripts   # 装依赖（不跑生命周期脚本）
npm run build                  # 刷新模型数据 + 构建全部包
npm run build:offline          # 用已有模型数据离线构建
npm run check                  # lint + format + 类型检查
./test.sh                      # 跑测试（无 API key 时跳过依赖 LLM 的用例）
./pi-test.sh                   # 直接从源码运行 pi
```

注意：该项目把 npm 依赖变更当作需评审的代码变更，直接依赖锁精确版本，`.npmrc` 有 `save-exact=true`、`min-release-age=2`，锁文件为依赖事实来源。

## 3. 分支与同步工作流（用户的核心流程）

1. Fork 的主分支是 **main**。
2. 学习分支命名规范：**`pi-MMDD-YYYY`**，如 `pi-1116-2026` = 2026 年 11 月 16 日检出的学习分支。
3. 首次流程：在 main 上装好依赖、把项目跑起来 → 从 main 检出 `pi-1116-2026` → 基于该分支学习。
4. 上游更新后：上游 → 同步到 Fork 的 main → 从 main 检出**新的当日学习分支** → 与旧学习分支做 diff，即可看出这段时间的代码更新，继续学习。

**当前克隆状态**：2026-11-16 用浅克隆完成（`--depth 1 --single-branch --branch main`，.git 仅 ~18M）。
浅克隆注意事项（AI 在做分支/diff 操作时要知道）：
- 本地只有 main 的最新一个提交，没有历史。
- 从 main 检出新学习分支：直接 `git switch -c pi-MMDD-YYYY` 即可，无需额外数据。
- 需要 Fork 上的其他远程分支时：`git fetch --depth 1 origin <分支名>`。
- 比较两个学习分支差异时，建议 `git fetch --depth 1 origin <旧分支> <新分支>` 后 `git diff <旧>..<新>`；如需更完整历史再 `git fetch --unshallow`。
- 本机到 GitHub 的网络不稳定（时通时断），git 操作失败先重试，或改用浅/部分克隆减小传输量。

## 4. 用户的学习方法论（AI 必须遵守）

1. **学得非常细**：从项目启动开始，把 Pi 从零重新搭建一遍，目录结构要**完整复刻**到 c-pi。
2. **最小粒度、逐步迭代**：功能拆成最小可运行单元，从简单到复杂一步步加。每一步都应该：能跑起来、能被理解，再进入下一步。
3. **代码由 AI 生成**：用户全程不手写代码，但会**逐行阅读**。所以 AI 生成代码时要：
   - 先讲清「原始仓库（pi/）这块是怎么实现的、涉及哪些文件」；
   - 再给出本步骤最小实现（代码 + 逐段解释）；
   - 保持每步 diff 尽量小，方便用户对照阅读。
4. **文档驱动**：每个学习阶段在 `c-pi/docs` 沉淀文档（功能分析、复现步骤、原理解读），最终用 VitePress 组织成文档站。
5. **先总后分**：动手复刻前，先完整搞清原始仓库：有哪些功能、怎么运行、功能点清单。这份「功能地图」是复现的依据。

## 5. 当前待办 / 进度

- [x] 浅克隆 Fork 到 `pi/`（main，depth 1，最新提交 22fc026）
- [x] 在 main 上安装依赖（`npm install --ignore-scripts`，335 包）
- [x] 拉取模型数据（`npm run hydrate:model-data`，新克隆仓库必须先做这一步，否则 build:offline 失败）
- [x] 构建全部包（`npm run build:offline`，coding-agent bundle 9.3 MiB）
- [x] 验证 CLI 可运行（`./pi-test.sh --version` → 1.5.2）
- [x] 从 main 检出学习分支 `pi-1116-2026`
- [ ] 梳理 Pi 的功能清单 / 运行方式 / 功能点地图（复刻依据）
- [x] 初始化 c-pi：VitePress 文档站（c-pi/docs，`npm run dev` 启动，http://localhost:5173）
- [ ] 制定从零复刻 Pi 的最小粒度学习路线

> 备注：首次交互使用 pi 需要 `/login` 连接供应商账号或设置 API key（`pi auth` 管理）。
