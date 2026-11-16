# Pi 功能地图（复刻依据）

> 调研日期：2026-11-16 · 对应 pi/ 快照：`22fc026`（main，v1.5.2）
> 详细底稿见三份调研笔记：[12 个库包详注](research/packages.md) · [官方文档功能详注](research/features.md) · [apps 与仓库结构](research/apps-and-repo.md)。
> 本文是「从零复刻 Pi」的总纲：先知道它有什么，才知道要复刻什么、按什么顺序复刻。

## 1. Pi 是什么

**Pi 是一个极简、可扩展的终端 AI 编码代理（coding agent harness）**：你给它一个任务，它通过 LLM + 内置工具（读文件、跑命令、改文件、写文件）完成；用 extensions / skills / prompt templates / themes 定制，打包成 Pi package 经 npm/git 分发。它刻意**不内置** sub-agents、plan mode 等重功能——"Ask Pi to build what you want"。

一句话架构：**agent loop（pi-agent-core）+ 多供应商 LLM 统一 API（pi-ai）+ 终端 UI（pi-tui）+ 会话持久化，组装成 CLI（pi-coding-agent）**。

## 2. 仓库全景

```
pi/（npm workspaces monorepo，Node ≥22.19，全包同步版本 1.5.2）
├── packages/          ← 12 个发布库（本次学习的主体）
│   ├── schema         JSON Schema 构建器/校验器（零依赖底座）
│   ├── telemetry      厂商中立遥测契约（零依赖底座）
│   ├── mcp            独立 MCP 客户端（协议 2025-11-25）
│   ├── codemode       QuickJS/WASM 沙箱跑「模型写的 JS」
│   ├── tui            差分渲染终端 UI 库
│   ├── ai             30+ 供应商统一 LLM API ★核心
│   ├── chord          跨进程对象运行时（Pi Durable 底座，与 CLI 线并行）
│   ├── agent          agent 循环（状态/工具执行/事件流）★核心
│   ├── durable        持久化 agent harness（实验性，chord 线）
│   ├── env            SSH 远程执行 daemon（Rust，chord 线）
│   ├── coding-agent   ★最终产品：pi CLI
│   └── evals          私有评测包（文档提升度 A/B）
├── apps/              ← 3 个不发布的实验应用
│   ├── p2             Pi Durable Web/TUI（48 插件原型，将被 p3 取代）
│   ├── p2-mac         p2 的 macOS 原生壳（Swift spike）
│   └── p3             p2 继任者（Chord v2，仅 9 个 ts 文件，切片推进中）
├── scripts/           ← 68 个构建/门禁/发布/模型目录脚本
└── nix/ + flake.nix   ← 只打包 coding-agent 的 Nix 构建
```

**两条产品线（关键结构事实）**：
- **pi CLI 线**（本次学习对象）：coding-agent ← agent + ai + codemode + mcp + tui
- **Pi Durable 线**（实验性，暂不学）：durable ← chord + ai + codemode；env ← chord + durable；apps p2/p3 都在这条线上

## 3. 包依赖分层（= 复刻顺序的依据）

```
基础层（零内部依赖）   schema    telemetry    mcp    codemode    tui
                          │         │                  │        │
中间层                    ai ◄──────┘                  │        │    chord ◄─ schema+telemetry
                          │                           │        │      │
应用层                    agent ◄─ ai+schema           │        │    durable ◄─ chord+ai+codemode
                          │                           │        │      │
产品层                    coding-agent ◄─ agent+ai+codemode+mcp+tui      env ◄─ chord+durable
```

| 层 | 包 | 一句话定位 |
|---|---|---|
| 基础 | schema | 无 eval 的 JSON Schema 构建器+校验器，8.5KB，工具参数就用它定义 |
| 基础 | telemetry | TelemetryContext/Span 契约，无全局状态无后端 |
| 基础 | mcp | 传输中立 MCP 客户端：stdio / streamable HTTP / pipe 三种传输 |
| 基础 | codemode | QuickJS WASM 沙箱：模型写 JS 脚本并行调工具，嵌套调用不进 LLM 上下文 |
| 基础 | tui | 差分渲染 + CSI 2026 同步输出；Text/Editor/Markdown/SelectList/layout/overlay 组件体系 |
| 中间 | ai | 统一 LLM API：30+ provider、模型目录生成管线、鉴权解析、事件流、token/成本统计 |
| 中间 | chord | 对象运行时：契约/文档/存储/插件热重载（Durable 线专用，CLI 不依赖） |
| 应用 | agent | Agent 类：AgentState、prompt/continue/abort、工具执行（并行/顺序+钩子）、steering/follow-up 队列 |
| 应用 | durable/env | 持久化 harness / SSH 远程执行（Durable 线） |
| 产品 | coding-agent | pi CLI：交互 TUI/print/JSON/RPC 四模式 + SDK + 全部扩展体系 |

## 4. 用户可见功能清单（按域）

### 4.1 对话与任务执行
- **内置工具**：默认 `read`/`bash`/`edit`/`write`，可选 `powershell`/`grep`/`find`/`ls`；`--tools` 支持 `+name`/`-name`/`*`
- **中途转向**：steering（Enter，本回合后注入）/ follow-up（Alt+Enter，任务结束后注入）/ Escape 中止退回编辑器
- **`@` 文件引用**、图片粘贴/拖入；`!cmd` 执行命令进上下文、`!!cmd` 不发给模型
- **思考等级**：7 档 off→max，`/thinking` 或 Shift+Tab 切换，按模型能力钳制
- **模型循环**：Ctrl+P 循环，`/scoped-models` 配集合
- **自动压缩**：上下文逼近窗口自动总结旧消息（阈值=窗口−16384，保留最近 20000 tokens），`/compact` 手动触发，溢出时 compact-and-retry
- **自动重试**：过载/限流/5xx 指数退避，默认 3 次
- **分类器/图像模型**：经 codemode 调非对话模型做判断/生图；**虚拟模型**由扩展按任务/成本动态路由
- **缓存保温**：空闲期自动刷新供应商提示缓存（估算节省 ≥$0.05 才做）

### 4.2 会话管理
- JSONL 持久化（`~/.pi/agent/sessions/`按工作目录分组），`--continue`/`/resume` 恢复
- **树形分支**：条目 id/parentId 构成树；`/tree` 跳转、`/fork` 分叉、`/clone` 复制
- `/name` `/session`（统计）/`/import` `/export`（HTML/JSONL）/`/share`（上传查看链接）/`/bug`
- 会话绑定创建时的工作目录

### 4.3 模型与供应商
- 30+ 内置供应商（OAuth 或 API key）：Anthropic/OpenAI/DeepSeek/Gemini/GitHub Copilot/Groq/Cerebras/xAI/OpenRouter/Qwen/ZAI/Kimi/MiniMax/Moonshot 等
- 特殊配置：Azure OpenAI、Bedrock、Vertex、Cloudflare、llama.cpp 本地路由器（`/llama` 管理加载）
- `models.json` 声明任意 OpenAI/Anthropic/Google 兼容端点（Ollama/vLLM/代理）
- `pi auth` / `/login` `/logout` 凭据管理；`!command` 从密钥管理器动态取 key

### 4.4 MCP 集成
- stdio + streamable HTTP 服务器接入，`pi mcp add/remove/list`、`/mcp` 会话内管理
- **四级工具曝光**：codemode（默认，仅脚本可调）/ deferred（tool_search 发现后直调）/ direct / hidden
- MCP OAuth（PKCE + 动态注册）；提供 resources 的服务器自动加资源工具

### 4.5 交互辅助
- `/` 命令菜单（内置命令+扩展命令+模板+skill 全在一个菜单）；快捷键全可重绑（keybindings.json）
- 主题：system（从终端查询动态构建、保证对比度）/dark/light + 自定义 JSON（OKLCH 等）
- Markdown/Mermaid 渲染；Ctrl+G 外部编辑器；`/debug` 诊断日志
- 全屏/常规双 TUI 模式；OSC 7501 向终端上报状态

## 5. 运行方式（四模式 + SDK，共享同一 agent 内核）

| 模式 | 启动 | 输入 | 输出 | 用途 |
|---|---|---|---|---|
| 交互 TUI | `pi` | 键盘 | 终端 UI | 人用 |
| print | `pi -p "..."`（管道自动触发） | 提示词/stdin | 最终文本→stdout，错误→stderr | 脚本 |
| JSON | `pi --mode json` | 提示词 | JSONL 事件流（`agent_settled`=完成信号） | 结构化消费 |
| RPC | `pi --mode rpc --no-session` | stdin JSONL 命令 | stdout 响应+事件（按 id 关联） | 长驻子进程/IDE |
| SDK | `createAgentSession()` | 进程内 | 进程内 | 嵌入应用 |

事件流核心：`agent_start/turn_start/message_*`（delta 流式）/`tool_execution_*`/`turn_end/agent_end/agent_settled`，加 compaction/retry/queue 事件族。RPC 有 30+ 命令（prompt/steer/abort/set_model/compact/fork/get_entries…）。

**Agent loop 本体**（how-pi-works.md）：消息进入活动分支 → 用系统提示+分支历史+工具定义构造请求 → provider 流式返回文本+工具调用 → 执行工具并记录 → 若有工具结果或排队消息则再来一轮，否则结束。

## 6. 配置与扩展体系（由小到大的阶梯）

| 机制 | 形态 | 需要项目信任？ | 能力 |
|---|---|---|---|
| AGENTS.md 上下文文件 | Markdown 指令 | 否 | 只给持久指令 |
| Prompt template | `prompts/*.md` | 是 | `/命令` + 参数替换 |
| Skill | 目录含 SKILL.md（agentskills.io 规范） | 是 | 任务型指令+配套文件，按需加载 |
| Extension | TS 模块（jiti 免编译加载） | 是 | 可执行代码：注册工具/命令/事件/provider/虚拟模型/MCP/自定义 UI |
| Theme | JSON 调色板 | 是 | 表现层颜色 |
| Pi package | npm/git 包 | 是 | 同时携带上述全部资源分发 |

- 配置三级：用户级 `~/.pi/agent/` > 项目级 `.pi/`（信任后才加载）；项目覆盖用户，资源列表合并
- **内置扩展**：`builtin:mcp`、`builtin:llama.cpp`、`builtin:codemode`、`builtin:tool-search`
- 事件模型：通知型 / 就地变异型 / 链式转换型 / 门控型（可 block 工具调用）四类语义

## 7. 会话机制（复刻重点）

- **JSONL 树**：首行 SessionHeader（v3），其余条目 id/parentId 成树；leaf=当前位置；从 leaf 回溯重建上下文
- 条目类型：message（含 system patch 机制——重放即得当前提示/工具状态）/ model_change / compaction / context_edit / branch_summary / custom / custom_message / label / session_info / usage
- **压缩流程**：从后往前累计 20000 tokens 定切点（绝不在 tool result 切）→ LLM 生成结构化摘要（Goal/Constraints/Progress/Key Decisions/Next Steps/Critical Context）→ 追加 CompactionEntry → 原始条目保留不删
- Shell 工具注入 `PI_SESSION_ID`/`PI_PROVIDER` 等环境变量；子进程见 `AI_AGENT=pi`

## 8. 安全模型

- 立场：模型输出一律不可信；**不逐工具调用审批**，以启动账户的 OS 权限运行；安全来自限制可触达面 + 容器化（Docker/OpenShell/Gondolin 三种模式）
- **项目信任**门控 `.pi/` 下的可执行资源；决策顺序：`--approve` 旗标 → 扩展事件 → trust.json → 默认 ask
- 凭据优先级：`--api-key` > auth.json > models.json > 环境变量；导出/分享可能泄露提示词中的敏感内容

## 9. 建议的复刻路线（最小粒度迭代）

按依赖分层自底向上，每步都是可运行、可验证的最小单元：

| 阶段 | 目标 | 对应原仓库 |
|---|---|---|
| 0 | npm workspaces monorepo 骨架 + 构建脚本 | 根 package.json / scripts |
| 1 | schema 最小版：工具参数的 JSON Schema 定义+校验 | packages/schema |
| 2 | ai 最小版：单 provider（OpenAI 兼容）+ stream + 工具调用 + usage 统计 | packages/ai |
| 3 | agent 最小版：agent loop（消息进→LLM→工具执行→循环）+ 事件流 | packages/agent |
| 4 | 内置工具：read/bash/edit/write | coding-agent 的 tools |
| 5 | 会话：JSONL 树持久化 + --continue 恢复 | session-format.md |
| 6 | print 模式 CLI | coding-agent src/modes |
| 7 | tui 最小版：Text/Input/Editor + 差分渲染 | packages/tui |
| 8 | 交互模式：转写区+编辑器+页脚、steering/follow-up | coding-agent interactive |
| 9 | 斜杠命令 + 配置体系（settings/AGENTS.md） | configuration.md |
| 10 | 压缩 compaction | compaction 机制 |
| 11 | 扩展体系：extension/skill/prompt-template/theme | extensions.md |
| 12 | JSON/RPC 模式 + SDK | json/rpc/sdk |
| 13 | MCP 接入 + 曝光分级 | packages/mcp |
| 14 | codemode 沙箱 | packages/codemode |
| 15 | 多供应商 + 模型目录 + 鉴权 | ai 完整版 |
| + | （可选支线）chord/durable/p2-p3 Durable 线 | 另一条产品线 |

## 10. 参考材料

- 底稿：[research/packages.md](research/packages.md)（12 包逐包详注）、[research/features.md](research/features.md)（43 篇官方文档功能详注）、[research/apps-and-repo.md](research/apps-and-repo.md)（apps 与仓库工程结构）
- 原仓库权威文档：`pi/packages/coding-agent/docs/`（quickstart / how-pi-works / cli / json / rpc / sdk / extensions / sessions / session-format / compaction / security…）
- 架构总纲：`pi/packages/coding-agent/docs/how-pi-works.md`（最短路径理解全局）
