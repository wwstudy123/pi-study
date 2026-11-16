# Pi Coding Agent 功能调研笔记

> 调研范围：`pi/packages/coding-agent/docs/` 下全部 43 个文件（42 篇文档 + docs.json 站点导航配置，images/ 为图片目录）。所有结论均出自这些文档原文；引用格式为「文档名 + 小节」。调研日期：2026-11-16。
> 说明：原定输出路径 `.zwork/research/features.md` 为运行时保留目录不可写入，改存于 `research/features.md`。

---

## ① 用户可见功能清单

### 安装与运行

| 功能 | 一句话说明 | 出处 |
|---|---|---|
| 多渠道安装 | 支持 pi.dev 安装脚本（macOS/Linux/Windows）、npm（需 Node.js 22.19+，`--ignore-scripts`）、Nix flake 三种安装方式，`pi update` 自更新（Nix 安装除外） | quickstart.md（Install Pi）、cli.md（Update Pi or packages） |
| 跨平台 | 原生 Windows（Git Bash / PowerShell）、WSL、Android Termux 均有专门支持文档 | windows.md、termux.md |
| 终端兼容 | 详细覆盖 Kitty/iTerm2/Ghostty/WezTerm/Alacritty/VS Code/Zed/Windows Terminal/tmux 的按键、图片、真彩色配置；OSC 7501 程序状态协议向终端上报 working/blocked/done/error/idle | terminal-setup.md、tmux.md |
| 全屏/常规双 TUI 模式 | 默认 fullscreen（Pi 自管视口与滚动条），可切 regular（用终端原生回滚）；`--tui-mode` 选择 | usage.md（Adjust the terminal）、settings.md（Terminal and display） |

### 对话与任务执行

| 功能 | 一句话说明 | 出处 |
|---|---|---|
| 内置工具集 | 默认启用 `read`/`bash`/`edit`/`write`，另有 `powershell`（Windows）、`grep`/`find`/`ls` 可选；`--tools`/`defaultTools` 支持名单、`+name`/`-name` 增减与 `*` 通配 | cli.md（Tools）、settings.md（Tools） |
| 中途转向（steering/follow-up） | 运行中可继续输入：Enter 发 steering（本回合后注入）、Alt+Enter 发 follow-up（整个任务结束后注入）、Escape 中止并把排队消息退回编辑器 | usage.md（Change direction）、extensions.md（Input Events） |
| `@` 文件引用 | 编辑器中输入 `@` 搜索文件并附到提示词，支持 Tab 补全；`@path` 也可作为 CLI 参数；图片可粘贴或拖入 | usage.md（Enter a prompt）、cli.md（Invocation and output） |
| `!`/`!!` 终端命令 | `!cmd` 执行命令并把输出纳入对话上下文，`!!cmd` 执行但不发给模型；可被扩展 `user_bash` 事件拦截 | usage.md（Run a terminal command）、extensions.md（user_bash） |
| 思考等级（thinking level） | 7 档 `off/minimal/low/medium/high/xhigh/max`，`/thinking` 或 Shift+Tab 切换，按模型能力钳制，可保存默认值 | cli.md（Models）、slash-commands.md |
| 模型循环 | Ctrl+P 在可用模型间循环，`/scoped-models` 配置循环集合（`--models` 模式，支持 `provider/id:thinking` 语法） | models.md（Select a model）、settings.md（Model cycling） |
| 分类器/图像模型 | 通过 codemode 脚本调用非对话模型：分类器（Jev、Clef、GPT-6 Luna、Microsoft-Decision-1 等）做 choice/bool/score 判断；图像模型（OpenRouter 的 Gemini Flash Image、FLUX.2 等）文生图/图生图，用量计入会话成本 | models.md（Use classifier/image models）、codemode.md（Models） |
| 虚拟模型路由 | 扩展可注册「虚拟模型」，按任务/成本/状态为每个请求选择物理模型；选择与分发在会话中分开记录，路由状态随会话分支存续 | virtual-models.md |
| 缓存保温（cache warming） | 空闲期自动刷新符合条件的供应商提示缓存（idle 模式最长 30 分钟），仅当模型声明缓存寿命且估算节省 ≥ $0.05 时执行；扩展可用 `cache_warming_decision` 事件覆盖决策 | settings.md（Model and thinking）、models.md（Prompt Cache Lifetimes） |
| 自动重试 | 瞬时故障（过载/限流/5xx）指数退避自动重试，默认 3 次；另有 provider 层重试（默认关闭） | settings.md（Network and retries）、json.md（Retry events） |
| 上下文压缩（compaction） | 上下文逼近窗口时自动把旧消息总结为 CompactionEntry（阈值 = 窗口 − reserveTokens 16384，保留最近 20000 tokens），`/compact [instructions]` 手动触发，可按模型覆盖参数 | compaction.md、sessions.md（Manage conversation context） |
| 溢出恢复 | 供应商上下文溢出或提前 `stopReason:"length"` 时，可触发一次 compact-and-retry：先落 context_edit 省略编辑、再压缩、再重试 | compaction.md（Overflow and Length Recovery Ordering） |

### 会话管理

| 功能 | 一句话说明 | 出处 |
|---|---|---|
| 自动会话保存 | 默认按工作目录分组持久化为 JSONL（`~/.pi/agent/sessions/`），`pi --continue` 恢复最近、`/resume` 选择器恢复 | sessions.md、session-format.md |
| 树形分支 | 会话条目构成树：`/tree` 在文件内跳转（可选生成被弃分支摘要）、`/fork` 从早前用户消息分叉出新会话、`/clone` 复制当前分支 | sessions.md（Choose how to branch）、session-format.md |
| 会话命名/统计/导入 | `/name` 命名、`/session` 查看文件/ID/消息数/token 与成本、`/import` 导入 JSONL（保留 ID 与工作目录）、选择器支持搜索/改名/删除 | slash-commands.md、sessions.md |
| 导出与分享 | `/export` 导出 HTML/JSONL；`/share` 上传获得查看链接（Radius artifact 或 GitHub 私有 gist，`sessionShareDestination` 可强制） | sessions.md（Export or share）、usage.md |
| Bug 报告 | `/bug [description]` 生成含环境与错误诊断的私有报告（不含凭据值），可经 radius.pi.dev 上传或导出 zip | sessions.md（Report a bug） |

### 模型与供应商

| 功能 | 一句话说明 | 出处 |
|---|---|---|
| 大量内置供应商 | OAuth 登录或 API key 环境变量：Anthropic、OpenAI、DeepSeek、Google Gemini、GitHub Copilot、Mistral、Groq、Cerebras、xAI、OpenRouter、Vercel AI Gateway、ZAI、Kimi、MiniMax、Moonshot、Qwen、Xiaomi MiMo、Together、Fireworks、Hugging Face、Radius 等 30+ | providers.md |
| 特殊供应商配置 | Azure OpenAI（部署名映射）、Amazon Bedrock（ambient AWS 凭据/IRSA）、Google Vertex AI（ADC）、Cloudflare AI Gateway/Workers AI、OpenRouter（按 key 过滤模型列表/区域端点）各有专门小节 | providers.md（Provider Specific Config） |
| 兼容端点 | `models.json` 声明 OpenAI/Anthropic/Google 兼容端点（Ollama、LM Studio、vLLM、SGLang、代理），支持 env 插值与 `!command` 取密钥、逐思考等级采样参数、输入限额与缓存寿命声明 | models.md（Configure a compatible endpoint）、models-configuration.md |
| 本地模型 | 深度集成 llama.cpp 路由器：`/llama` 管理模型加载/卸载/HuggingFace 下载；聊天模型可兼作分类器（读 next-token 概率）；NVIDIA RTX recipe 转换为路由器 preset 的指南 | llama-cpp.md、nvidia-rtx-llama-cpp.md |
| 认证管理 | `/login`/`/logout` 管理凭据；`pi auth login/logout/check/print-api-key/print-bearer-token` 在会话外操作；`auth.json` 的 key 可用 `!command` 从密钥管理器动态读取 | providers.md、cli.md（Credential commands） |
| 自定义供应商扩展 | 需要自定义流式/发现/认证时用 `pi.registerProvider()` 写扩展，可复用内置 API 实现或实现 `streamSimple`，支持 OAuth 登录流与 `refreshModels` 动态目录 | custom-provider.md |

### MCP 集成

| 功能 | 一句话说明 | 出处 |
|---|---|---|
| MCP 服务器接入 | stdio 与 streamable HTTP（不支持 SSE），`pi mcp add/remove/list/login/logout` 命令行管理，`/mcp` 会话内管理连接/登录/启停/曝光 | mcp.md、cli.md（MCP commands） |
| 工具曝光分级 | 每个服务器可设 `codemode`（默认，仅脚本可调）/`deferred`（经 tool_search 发现后直调）/`direct`（直声明）/`hidden`；`toolExposure` 按工具名单独覆盖 | mcp.md（Control tool exposure） |
| MCP OAuth | RFC 8252 回环重定向 + 动态注册或 Client ID Metadata Document，token 存 `mcp-auth.json`，支持 `authServerMetadataUrl` 手动指定授权服务器 | mcp.md（Authenticate with OAuth） |
| MCP 资源 | 服务器提供 resources 时自动加 `list_mcp_resources` 等 3 个资源工具；MCP 调用全部经过 Pi 工具管线，权限扩展对 MCP 工具同样生效 | mcp.md（Use resources/Permissions） |
| 配置迁移 | 提供 Claude Desktop/Code/Cursor、VS Code、Codex、OpenCode 四类客户端的 mcp.json 转换对照表 | mcp.md（Migrate configuration） |

### 交互辅助

| 功能 | 一句话说明 | 出处 |
|---|---|---|
| 斜杠命令 | `/` 搜索全部命令；内置命令 + 扩展命令 + 提示模板 + `/skill:name` 全部出现在同一菜单 | slash-commands.md |
| 快捷键体系 | `keybindings.json` 可重绑全部命名动作（编辑器、全屏滚动、会话、模型、树导航等），`/hotkeys` 查看当前生效绑定 | keybindings.md |
| 主题系统 | 内置 system/dark/light；`system` 从终端查询前景/背景与 16 ANSI 色动态构建并保证 4.5:1 对比度，随终端明暗切换；自定义主题为 JSON（OKHSL/OKLCH/RGB/256 色），支持 light/dark 双主题 `light/dark` 格式 | themes.md |
| Mermaid/Markdown 渲染 | 转写区渲染 Markdown 与 Mermaid 图（`markdown.mermaid` 可设 off/final/streaming） | settings.md（Terminal and display） |
| 调试 | `/debug` 把渲染行与会话消息写入 `pi-debug.log`；`PI_TUI_WRITE_LOG` 捕获原始 ANSI 流 | usage.md（Collect diagnostic information）、tui.md |
| 外部编辑器 | Ctrl+G 用 `$VISUAL`/`$EDITOR`（Windows 记事本）编辑长提示词 | usage.md、keybindings.md |

---

## ② 运行方式（四种模式 + 选择规则）

> 依据：cli-integration.md（Choose a mode）、cli.md（Invocation and output）、index.md。所有模式共享同一套 agent、会话、资源与工具机制；模式只决定输入如何进入、输出如何暴露、进程是否长期存活。

### 模式选择规则

- 终端 stdin+stdout 且未显式选模式 → 打开交互式 TUI。
- 任一流被重定向（管道/文件）且未选 JSON/RPC → 自动用 print 模式（`git diff | pi "Review this change"` 即可，无需 `--print`）。
- `--print` / `-p`：一次性运行后退出。`--mode text` 只选文本输出，不强制单次执行。
- RPC 模式拒绝 `@file` 参数；JSON/RPC 模式 stdout 专用于协议记录，诊断走 stderr。

### 1. 交互模式（Interactive / TUI）

- 直接 `pi` 启动；界面 = 转写区（提示、响应、工具调用与结果）+ 编辑器 + 页脚（目录、会话、模型、上下文用量、累计成本）。
- 核心操作：`@` 附文件、Enter/Shift+Enter/Ctrl+G 提交、steering/follow-up（见①）、Ctrl+O 展开工具输出、Ctrl+T 折叠思考块、`/` 命令菜单。
- 全屏/常规模式经 `/settings` 或 `--tui-mode` 切换；项目资源首次加载前会询问项目信任（见④）。

### 2. Print 模式（一次性脚本）

```bash
pi --print "Summarize this repository"
git diff | pi --print "Review this change"
```

- 运行完给定的提示词，把最终 assistant 文本写 stdout 后退出；中间事件不暴露，错误写 stderr。
- 退出码：最终响应 `error`/`aborted` → 非零；`length` 截断 → 打印部分文本 + stderr 警告 + 非零。

### 3. JSON 事件流模式（结构化进度）

```bash
pi --mode json "Inspect this repository" > events.jsonl
```

- 首条记录为 session header（v3），随后流式输出会话事件，提示词跑完即退出；不接受后续命令。
- 严格 JSONL 帧（仅按 LF 分行；Node.js `readline` 会误切 U+2028/U+2029，不可用）；需持续读取 stdout 否则会堵塞管道。
- 事件族（json.md 为 JSON+RPC 共同权威参考）：
  - 运行生命周期：`agent_start` / `agent_end`（一个低层 run 结束，后可仍有重试/压缩/排队消息）/ `agent_settled`（不再自动继续，判完成的权威信号）/ `turn_start` / `turn_end`。
  - 消息流：`message_start` / `message_update`（wire 上仅 delta：text_delta、thinking_delta、toolcall_delta 等，用 contentIndex 对齐，`text_end`/`toolcall_end` 为权威内容）/ `message_end`（权威完整消息）。
  - 工具执行：`tool_execution_start/update/end`（toolCallId 关联，end 带 durationMs）。
  - 队列与状态：`queue_update`、`entry_appended`、`session_info_changed`、`thinking_level_changed`。
  - 压缩：`compaction_start/end`（reason: manual/threshold/overflow）、`summarization_retry_*`。
  - 重试：`auto_retry_start/end`。
- 流式重建模式：缓冲 delta 做实时展示，`*_end` 到达后用权威内容替换，`message_end.message` 到达后整条替换。

### 4. RPC 模式（长生命周期双向控制）

```bash
pi --mode rpc --no-session
```

- 作为子进程常驻：stdin 收 JSONL 命令，stdout 回响应+事件，用于跨语言集成、进程隔离、IDE 与自定义客户端。
- 四类记录：Command（stdin）/ `response`（stdout，带可选 `id` 关联，异步需按 ID 而非顺序对应）/ 会话事件（与 JSON 模式同构）/ Extension UI 记录（子协议）。
- 命令集（rpc-commands.md）：`prompt`（流式中必须带 `streamingBehavior: "steer"|"followUp"`，否则报错；disposition ∈ handled/queued/started）、`steer`、`follow_up`、`abort`、`clear_queue`、`new_session`、`get_state`、`get_messages`、`set_model`、`cycle_model`、`get_available_models`、`set/cycle/get thinking_level`、`set_steering_mode`、`set_follow_up_mode`、`compact`、`set_auto_compaction`、`set_auto_retry`、`abort_retry`、`bash`（输出以 `bash_execution_update` 流式回传，含 `excludeFromContext` 选项）、`abort_bash`、`get_session_stats`、`export_html`、`switch_session`、`fork`、`clone`、`get_fork_messages`、`get_entries`（支持 `since` 增量游标）、`get_tree`、`get_last_assistant_text`、`set_session_name`、`get_commands`。
- Extension UI 子协议（rpc-extension-ui.md）：对话型方法（select/confirm/input/editor）发 `extension_ui_request` 并阻塞等待客户端回 `extension_ui_response`；通知型（notify/setStatus/setWidget/setTitle/set_editor_text）不期待响应；TUI 专属方法在 RPC 下为 no-op 或降级。
- 生命周期：`prompt` 的 success 只表示已接受；等待 `agent_settled` 判完成。关闭 stdin 或发 SIGTERM/SIGHUP 优雅关停（第二次信号立即退出）；扩展可 `ctx.shutdown()` 请求关停。
- TypeScript 集成优先用导出的 `RpcClient`（启动子进程、按 ID 关联、类型化命令方法、事件监听；`promptAndWait()` 内部先订阅再发避免竞态）。

### 5. SDK（进程内嵌入，非 CLI 模式）

```typescript
import { createAgentSession } from "@earendil-works/pi-coding-agent";
const { session } = await createAgentSession();
await session.prompt("...");
console.log(session.getLastAssistantText());
session.dispose();
```

- 在 Node.js/Bun 进程内直接访问 agent、会话、工具、模型与资源（sdk.md）。
- 关键点：
  - `prompt()` 在 run 结束（含自动重试）后 resolve；流式需先 `session.subscribe()` 再 prompt；流式中必须显式 `steer()`/`followUp()`，否则拒绝（不猜）。
  - `SessionManager` 是持久化上下文的权威：分支只移动 leaf 不删旧枝；可 `SessionManager.inMemory()` 免落盘；外部历史通过构造含条目的 manager 注入。
  - 各边界均可替换：`modelRuntime`/`model`/`thinkingLevel`/`scopedModels`、`settingsManager`、`sessionManager`、`resourceLoader`、`tools`/`customTools` 等。
  - **CLI 把 codemode、tool_search、MCP 作为内置扩展加载，SDK 会话默认不加载**：需在 `DefaultResourceLoader` 的 `extensionFactories` 中加 `createCodemodeExtension()` 等，且 `session.bindExtensions()` 让 MCP 服务器连接。
  - `AgentSessionRuntime` 提供 `newSession()/switchSession()/fork()/importFromJsonl()`，替换后旧订阅需重绑。
  - 14 个官方示例覆盖模型、工具、扩展、技能、凭据、设置、会话、完全控制等场景。

---

## ③ 配置与扩展体系

### 配置文件布局（configuration.md）

- **用户级 agent 目录**（默认 `~/.pi/agent`，`PI_CODING_AGENT_DIR` 可改）：`settings.json`（设置+包声明）、`keybindings.json`、`mcp.json`（全局 MCP）、`models.json`（兼容端点/模型/覆盖）、`auth.json`（凭据）、`AGENTS.override.md`/`AGENTS.md`/`CLAUDE.md`（跨目录用户指令）、`SYSTEM.md`（替换默认系统提示）、`APPEND_SYSTEM.md`（追加系统提示）、`extensions/`、`skills/`、`prompts/`、`themes/`。
- **项目级 `.pi/`**：同名结构（settings/mcp/SYSTEM/APPEND_SYSTEM/extensions/skills/prompts/themes），**在项目信任授予后才加载**（唯一例外：`sessionDir` 在信任判定前读取）。SYSTEM/APPEND_SYSTEM 项目文件优先于用户级同名文件，不合并。
- **上下文文件（Context files）独立于 `.pi`**：`AGENTS.md`/`CLAUDE.md`/`AGENTS.override.md` 从 agent 目录、工作目录及其父目录发现，**不需要项目信任**；override 只替换同目录的 AGENTS/CLAUDE。
- 项目设置覆盖用户设置；资源列表（extensions/skills/prompts/themes 路径）合并叠加，支持 `!pattern` 排除、`+path`/`-path` 精确增删（settings.md Resources）。

### 四类可扩展资源及其关系

官方「由小到大」的选择阶梯（quickstart.md Choose how to customize Pi）：

| 机制 | 形态 | 加载方式 | 能力边界 |
|---|---|---|---|
| **AGENTS.md / 上下文文件** | Markdown 指令 | 目录发现，无需信任 | 只给持久指令，无可执行行为 |
| **Prompt template** | `prompts/*.md`（frontmatter：description、argument-hint） | 文件名即 `/命令`；支持 `$1`/`$@`/`${1:-default}` 参数替换与 shell 式引号 | 复用提示文本，不执行代码 |
| **Skill** | 目录含 `SKILL.md`（frontmatter：name、description 等，实现 Agent Skills 规范 agentskills.io）+ scripts/references/assets | 启动时只把 name+description 注入系统提示，任务匹配时按需读全文；`/skill:name [args]` 强制调用；兼容 `~/.agents/skills/` 与 `.agents/skills/` | 任务型指令+配套文件；`disable-model-invocation: true` 可只留手动命令 |
| **Extension** | TypeScript 模块（jiti 加载，免编译） | `~/.pi/agent/extensions/`（全局）或 `.pi/extensions/`（项目，需信任）或 `-e` 显式路径或包分发 | 可执行代码：注册工具/命令/快捷键/CLI 旗标、事件拦截（含权限门）、自定义 UI、注册 provider/虚拟模型/MCP 服务器、会话持久化 |

- 输入处理管线（extensions.md Input Events）：扩展命令（`/cmd`）→ `input` 事件（可 transform/handled）→ 技能命令展开 → 提示模板展开 → agent 开始。
- **Theme**：JSON 调色板，控制 TUI 与 HTML 导出颜色；独立于上述逻辑资源，属表现层。主题名唯一、不能含 `/`（保留给 `light/dark` 双主题格式）、`system` 为保留名。
- **TUI 组件**（tui.md）：`@earendil-works/pi-tui` 组件系统，扩展在 `ctx.ui` 内置对话框/通知不够用时构建自定义组件（含键盘/鼠标、焦点、overlay、blocked 状态上报）。

### Pi Package（分发单元）

- 一个包 = 普通目录或 npm 包，可同时携带 extensions/skills/prompts/themes（packages.md）。约定目录即自动发现；`package.json` 的 `pi` 键可显式声明路径与 glob 过滤。
- 安装：`pi install npm:@scope/pkg@1.0.0` / `git:github.com/user/repo@v1` / `./local`；`pi list`、`pi remove`、`pi update --extensions`、`pi config`（交互启停资源与内置扩展）；`--local/-l` 写入项目 `.pi/settings.json`（信任后才生效）。
- 身份去重：npm 按包名、git 按仓库 URL（去 ref）、本地按绝对路径；项目条目默认替换个人条目，`autoload: false` 时作为过滤增量。
- 依赖声明：宿主提供的 5 个包（pi-ai、pi-agent-core、pi-coding-agent、pi-tui、typebox）必须放 `peerDependencies` 且不打包，物理拷贝会破坏扩展模块映射；各包模块根独立，不共享依赖实例。
- 更新日志：含扩展的包可在下次启动时按 `CHANGELOG.md`（版本标题匹配 package.json version）显示更新条目。
- `pi-package` keyword 使 npm 包可被 pi.dev 包画廊发现。
- **内置扩展**：`builtin:mcp`、`builtin:llama.cpp`、`builtin:codemode`、`builtin:tool-search`，默认加载，settings 的 `extensions` 数组用 `-builtin:<name>` 禁用、`--no-mcp` 单次禁用 MCP、`--no-extensions` 全禁（显式 `-e` 仍加载）。

### Codemode 与 tool_search（CLI 的两个内置扩展工具，默认关闭）

- **codemode**（codemode.md）：模型写 JS 脚本在 QuickJS 沙箱（无 Node API/文件系统/网络/定时器）执行，经 `tools.<name>()` 并行调用其他工具、过滤大输出，经 `models.classify()/generateImages()` 调非 LLM 模型；`store()/load()` 跨调用存小状态（随会话分支持久化）；限额：VM 256MB、输出默认 10000 tokens、每进程最多 2 个 worker（`PI_CODEMODE_MAX_WORKERS`）。MCP 服务器以 `codemode` 曝光连接时会自动激活 codemode。
- **tool_search**：对未声明工具（deferred 曝光）做 BM25 检索并为下一次调用声明；加载记录进会话，在该分支保持声明。deferred 曝光的 MCP 服务器会自动激活它。

### 扩展事件模型摘要（extensions.md）

- 事件族：project_trust、resources_discover、mcp_servers_change；session_start/shutdown/info_changed/before_switch/before_fork/before_compact/compact/compact_failed/before_tree/tree；before_agent_start、agent_start/end/before_settle/settled、turn_start/end、message_start/update/end、tool_execution_start/update/end、tool_call（可 block/mutate）、tool_result（链式改写）、user_bash（可拦截）、input；model_select、thinking_level_select、ui_prompt_start/end、cache_warming_decision；provider 层 context / context_with_system / before_provider_headers / before_provider_request / after_provider_response / provider_stream_event。
- 组合语义：通知型忽略返回值；就地变异型（headers、tool_call.input）；链式转换型（input、context、message_end、tool_result…）；门控型（handled input、blocked tool call）；`turn_end`/`agent_before_settle` 为可追加条目并请求续跑的边界。
- 命令上下文独有：`ctx.newSession()/fork()/navigateTree()/switchSession()/reload()/waitForIdle()`；会话替换后旧 `pi`/`ctx` 失效，只能用 `withSession` 传入的新 ctx。
- 模式感知：`ctx.mode ∈ tui|rpc|json|print`；`ctx.hasUI` 在 TUI/RPC 为 true（对话框可用），print/json 为 false。

---

## ④ 会话与安全机制

### 会话机制

**存储格式（session-format.md）**

- JSONL，首行 `SessionHeader`（`{type:"session", version:3, id, timestamp, cwd}`，fork/clone 时带 `parentSession`）；路径 `~/.pi/agent/sessions/--<path>--/<timestamp>_<session-id>.jsonl`，按工作目录分组。
- 其余条目经 `id`/`parentId` 构成**树**；「leaf」为当前位置；v1 线性 → v2 树 → v3（hookMessage 改名 custom）自动迁移。
- 条目类型：`message`（含 system 消息：首条带全部 prompt sections + 工具声明，后续以 patch 形式记录增删——重放即得当前 prompt/工具状态，无独立状态条目）、`model_change`、`thinking_level_change`、`usage`（非上下文用量如 cache_warm，计入会话统计）、`compaction`、`context_edit`（追加式编辑历史条目对未来上下文生效，原始条目不动）、`branch_summary`、`custom`（扩展状态，**不进** LLM 上下文）、`custom_message`（扩展注入，**进**上下文）、`label`（书签）、`session_info`（显示名）。
- 上下文重建：`buildContextEntries()` 从 leaf 回溯收集路径、应用最新 compaction（摘要 + firstKeptEntryId 起的保留段）；`buildSessionProjection()` 应用最新 context_edit；`buildSessionContext()` 转为模型消息（compaction → 完整系统检查点 + compactionSummary；branch_summary/custom_message → 对应上下文消息；usage/custom/label 不产生消息）。
- 消息类型（message-types.md）：`AgentMessage` = System/User/Assistant/ToolResult + coding-agent 扩展的 BashExecution/Custom/BranchSummary/CompactionSummary；AssistantMessage 带 api/provider/model/thinkingLevel/usage/stopReason（含 `deferred` 延迟响应句柄）；ToolResultMessage 可带嵌套模型 usage 与 nestedCalls 元数据。

**工作目录绑定（sessions.md）**

- 会话记录创建时的工作目录且不变：`--continue` 在当前目录运行；`/resume`/`--session` 回会话原目录；`--fork` fork 到当前目录；原目录不存在时交互模式询问 Continue/Fork/Cancel，其他模式报错退出。
- 会话存储位置三级覆盖：`--session-dir` > `PI_CODING_AGENT_SESSION_DIR` > `sessionDir` 设置 > 默认。`--no-session` 用内存会话（不可恢复）。

**压缩与分支摘要（compaction.md）**

- 触发：`contextTokens > contextWindow − reserveTokens(16384)`，在工具批次结束后、下个 assistant 响应前检查；也支持手动 `/compact [instructions]` 与溢出恢复。
- 流程：从后往前累计 token 至 keepRecentTokens(20000) 定切点（有效切点：user/assistant/bashExecution/custom 消息；**绝不在 tool result 切**）→ 提取被总结消息 → LLM 生成结构化摘要（Goal/Constraints/Progress/Key Decisions/Next Steps/Critical Context + read-files/modified-files 清单；工具结果序列化时截断 2000 字符，思考块省略）→ 追加 CompactionEntry（带完整 system checkpoint）→ 重建上下文。原始条目保留不删。
- 单个用户消息 span 超预算时产生「split span」：历史摘要 + span 前缀摘要两段合并。
- 分支摘要：`/tree` 切换时对被弃路径（到公共祖先）生成 BranchSummaryEntry 注入新分支；文件追踪跨压缩与嵌套摘要**累积**（扩展自带的摘要不自动继承）。
- 扩展钩子：`session_before_compact`（可取消或自定义摘要）、`session_compact/compact_failed`、`session_before_tree`（可取消/自定义/改指令）。
- 每模型覆盖：`compaction.modelOverrides` 按 `provider/modelId` 独立解析 reserve/keepRecent；用户与项目设置递归合并后再查表。

**会话内统计**

- `usage` 条目 + assistant 消息 + 工具上报的嵌套用量 + 压缩/摘要生成用量全部计入会话 token 与成本（`/session`、`get_session_stats` 可见）。
- Shell 工具注入 `PI_SESSION_ID`/`PI_SESSION_FILE`/`PI_PROVIDER`/`PI_MODEL`/`PI_REASONING_LEVEL` 环境变量（每条命令启动时解析；`!`/`!!` 用户命令不注入）；进程标记 `AI_AGENT=pi`、`PI_CODING_AGENT=true` 让子进程识别 Pi（environment-variables.md）。

### 安全机制

**核心立场（security.md）**

- 模型生成的命令与代码一律视为不可信；Pi 以启动账户的 OS 权限读写执行文件，**不逐工具调用请求批准**；扩展/包安装器/子进程同权限运行。
- 安全来自**限制可触达的文件、凭据、进程与网络**，而非观察转写或项目信任——这些不构成安全边界。提示注入可来自文件、注释、命令输出与模型响应。

**运行隔离方式（containerization.md）**

| 方式 | Pi 位置 | 说明 |
|---|---|---|
| 普通 Docker | 容器内 | 最简单的整体容器边界；勿挂载宿主 `~/.pi/agent`（暴露凭据） |
| Docker Sandboxes | 托管沙箱 | 代理在宿主持有真实凭据、按 host 替换占位符（如 Claude Pro/Max token） |
| NVIDIA OpenShell | 本地/远程沙箱 | 文件/进程/网络/凭据/推理路由策略 |
| Gondolin 扩展 | 宿主 | 本地 micro-VM 只接管内置工具与 `!` 命令；Pi 本体与其他扩展工具仍在宿主（更窄的隔离）；VM 内命令继承宿主环境变量 |

**项目信任（Project trust，security.md）**

- 控制是否加载工作目录提供的设置与资源，防止目录在批准前静默加载可执行扩展。
- **受信任门控的资源**：`.pi/settings.json`、`.pi/mcp.json`、`.pi/{extensions,skills,prompts,themes}`、`.pi/SYSTEM.md`/`APPEND_SYSTEM.md`、项目 `.agents/skills`（含祖先目录）；裸 `.pi` 目录本身不触发。
- **不受信任门控**：上下文文件（AGENTS.md 等）照常加载——应视目录内指令为不可信输入。已知边界缺口：`sessionDir` 在信任判定前读取。
- 决策顺序：CLI `--approve`/`--no-approve` 覆盖 → 扩展 `project_trust` 事件（首个 yes/no 拥有决策）→ `~/.pi/agent/trust.json` 已存决策（最近祖先目录生效，`/trust` 保存）→ `defaultProjectTrust` 设置（默认 `"ask"`）。
- 非交互模式无法弹信任框：`ask`/`never` 跳过受保护资源，`always` 加载；自动化运行用 `--approve`/`--no-approve` 显式决定。

**凭据与敏感数据**

- 凭据解析优先级（models.md）：运行时 `--api-key` > `auth.json` > `models.json` apiKey > 环境变量/ambient 云凭据。
- `auth.json` 的 key 支持 `!command` 从密钥管理器读取（stdout 进程内缓存，不落盘）；`models.json`/provider headers 同语法（`$NAME`、`${NAME}`、`!command`、`$$`、`$!`）。
- 导出/分享/bug 报告可能包含提示词、工具参数、命令输出、文件内容与对话中暴露的凭据——分享前必须自查（usage.md、sessions.md 多处强调）。
- 安全报告走仓库 SECURITY.md，不开公开 issue；本地产物、提示注入、无内置沙箱等默认不在安全边界内，除非证明越过权限边界。

---

## 附：文档目录速查（docs.json 导航分组）

- Get Started：index、quickstart、how-pi-works
- Run Pi：usage、models、sessions、security、containerization、llama-cpp、nvidia-rtx-llama-cpp、terminal-setup、shell-aliases、tmux、windows、termux
- Customize Pi：configuration、prompt-templates、skills、themes、packages、mcp
- Build on Pi：extensions、custom-provider、virtual-models、tui、cli-integration、sdk
- Reference：cli、codemode、slash-commands、settings、models-configuration、environment-variables、keybindings、providers、session-format、compaction、json、rpc、rpc-commands、rpc-extension-ui、message-types

### 待证项 / 未覆盖

- extensions.md 中段（State Management、Custom Tools 的 exposure 细节、MCP servers in extensions、Error Handling、Mode Behavior 等小节）在本次读取中超出工具单次返回上限，仅覆盖了目录与前后主体；如需逐条核对扩展 API 细节，建议直接阅读 `pi/packages/coding-agent/docs/extensions.md` 对应锚点。
- 本笔记只基于文档，未与 `pi/packages/coding-agent/src/` 源码逐条核对（文档自述 `pi --help` 为安装版本的权威接口）。
