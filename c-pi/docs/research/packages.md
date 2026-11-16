# pi/packages 12 个库包调研笔记

> 调研日期：2026-11-16
> 仓库：github.com/earendil-works/pi（本地路径 `pi/packages/`）
> 范围：逐包通读 `README.md` 与 `package.json`，核对 `src/` 目录结构
> 统一事实：12 个包全部为 **version 1.5.2**、ESM（`"type": "module"`）、MIT、`engines.node >= 22.19.0`，作者 Earendil Works / Mario Zechner。除 evals（`"private": true`）外均发布到 npm，scope 为 `@earendil-works`。

## 0. 总览与依赖图

依据各包 `package.json` 的 `dependencies` 字段（一手证据），包间依赖关系如下：

```
schema（零依赖）        telemetry（零依赖）      mcp（仅 cross-spawn）
  codemode（仅 quickjs-wasi）                    tui（仅外部 UI 依赖）

ai ──────► schema, telemetry
agent ───► ai, schema
chord ───► schema, telemetry   （peer 可选: esbuild / react / ws）
durable ─► chord, ai, codemode, schema, telemetry
env ─────► chord, durable
coding-agent ─► agent, ai, codemode, mcp, tui
evals（私有）devDeps ──► ai, coding-agent
```

分层视角：

| 层 | 包 |
|---|---|
| 基础层（无内部依赖） | schema、telemetry、mcp、codemode、tui |
| 中间层 | ai（LLM 统一 API）、chord（跨进程对象运行时） |
| 应用层 | agent（agent 循环）、durable（持久化 harness）、env（远程执行） |
| 终端产品 | coding-agent（`pi` CLI）、evals（评测，私有） |

值得注意的结构事实：
- **coding-agent 不依赖 durable / env / chord**：`pi` CLI 与 Pi Durable 是两条并行的产品线，前者基于 `pi-agent-core`（内存态 agent 循环），后者基于 chord 文档模型做持久化执行（durable README: "Built on @earendil-works/pi-ai for model access and @earendil-works/chord for document state"）。
- schema 和 telemetry 是被引用最多的两个底座（各被 4 个包直接依赖）。
- env 包是 12 包中唯一"无下游"的可发布包（面向外部使用者）；evals 是私有的开发工具包。
- mcp README 提到与 pi-env 的 `openProcess()` 互操作（PipeTransport），但那是使用方接线，不构成包依赖。

---

## 1. schema — `@earendil-works/pi-schema`

- **一句话定位**：无 `eval`、零依赖的 JSON Schema 构建器与校验器，schema 编译为普通闭包，严格 CSP 下也能跑出接近代码生成校验器的速度。
- **核心能力**（README）：
  - 支持 JSON Schema draft 2020-12 与 draft 7，官方测试套件 2,223 个核心用例通过 2,222 个。
  - Builder API（`obj/str/int/oneOf/opt/arr/tuple/map/union/recursive` 等）返回纯 JSON Schema 且带 TypeScript 类型推导（`Static<typeof T>`），编译后 `check()` 收窄类型。
  - `check/errors/validate` 三档 API；错误路径为 JSON Pointer。
  - 可选 `coerce: true` 提供 `coerce()/parse()` 宽松转换（面向 LLM tool-call 参数），转换规则移植自 TypeBox `Value.Convert` + Ajv `coerceTypes`。
  - 可选 `formats` 子入口（`/formats`）做格式校验；`unresolvedRefs: "reject"` 容忍悬空 `$ref`（面向 MCP server schema）。
  - 8.5 KB min+gzip；`Static` 还能读 TypeBox 1.x schema 的类型形状（不导入 TypeBox）。
  - README 附完整 benchmark（vs Ajv/Zod/TypeBox/ata-validator/cfworker/omptype，Node 24.4.1）。
- **关键入口**：`main/exports "."` → `dist/index.js`（源码 `src/index.ts`）；子入口 `./formats`。源码目录 `src/`：`builders.ts`、`compiler.ts`、`coerce.ts`、`explain.ts`、`formats/` 等。
- **scripts**：`build`（tsc）、`test`（vitest）、`bench`（`node --expose-gc test/bench/all.ts`，约 12 分钟）。
- **依赖了哪些其他包**：无（devDeps 仅各竞品库用于基准测试）。
- **被谁依赖**：ai、agent、chord、durable（coding-agent 间接依赖）。

## 2. telemetry — `@earendil-works/pi-telemetry`

- **一句话定位**：厂商中立的遥测契约（TelemetryContext / TelemetrySpan）与带类型的 schema 工具，不含 exporter、无全局 current-span、无后端依赖。
- **核心能力**（README）：
  - 显式回调式 `startSpan(options, fn)`，无公开 `end()`，由回调 settlement 管理；属性/事件/status（ok|error）/span links。
  - 可选能力：`metrics`（counter、up-down counter、histogram，带类型 metric schema）与 `propagation`（跨进程不透明 carrier 注入/提取，兼容 W3C traceparent 但不强制）。
  - `NOOP_TELEMETRY_CONTEXT` 共享空实现；`InMemoryTelemetryContext` 参考实现。
  - "Stored telemetry"（SQLite 存储/查询，被 chord 的 `telemetry-sqlite` 复用，schema 表：`telemetry_spans` 等）与 adapter 一致性测试套件。
  - 可序列化、带 TS 类型推导的 schema 定义。
- **关键入口**：`"."`、`./render`（`renderTrace` 渲染）、`./testing`。源码 `src/`：`index.ts`、`memory.ts`、`metrics.ts`、`noop.ts`、`render.ts`、`testing/`。
- **scripts**：`build`/`test`（vitest）。（无 `exports` 里 source 条件，只有 dist。）
- **依赖了哪些其他包**：无。
- **被谁依赖**：ai、chord、durable。

## 3. mcp — `@earendil-works/pi-mcp`

- **一句话定位**：独立、轻量的 MCP（Model Context Protocol）客户端，不依赖官方 MCP SDK 也不依赖其他 pi 包。
- **核心能力**（README）：
  - 传输中立内核：`McpClient` 负责请求关联、初始化、超时、取消、server 请求；transport 负责帧与 I/O。
  - 三个内置传输：`StdioTransport`（spawn 子进程）、`StreamableHttpTransport`（可注入 fetch）、`PipeTransport`（程序由别处启动，如 pi-env `openProcess()`）；`/testing` 提供 `createInMemoryTransportPair()`。
  - 协议版本 `2025-11-25`，向下协商 `2025-06-18 / 2025-03-26 / 2024-11-05`；分页 `tools/list`、`tools/call`（含 structured content）、进度通知与超时续期、请求取消、HTTP 会话 GET 流重连（`Last-Event-ID`）、stdio 三段关闭（stdin→SIGTERM→SIGKILL，杀整个进程组）。批量 JSON-RPC、旧版 HTTP+SSE、server/sampling/tasks 不在内核范围。
  - `toLlmContent()` 把 `CallToolResult` 转为 pi-ai 形状的 Text/Image content；`createMcpToolName / mcpNamespace / normalizeMcpInputSchema / limitMcpContent`（输出限 20KB）等工具名/输出治理工具。
  - `./oauth`：MCP OAuth 客户端子集（PKCE、动态注册、token 刷新、step-up authorization、两段式 `startMcpSignIn/completeMcpSignIn`）；改写自 MCP TS SDK v1.29.0（MIT，见 `THIRD_PARTY_NOTICES/`）。
  - `validateMcpServerConfig()` 校验 `mcpServers` 配置形态。
- **关键入口**：`"."`、`./oauth`、`./testing`。源码 `src/`：`client.ts`、`transports/`、`protocol/`、`oauth/`、`config.ts`、`naming.ts` 等。
- **scripts**：`build`/`test`（vitest）。
- **依赖了哪些其他包**：无（仅外部 `cross-spawn`）。
- **被谁依赖**：coding-agent。

## 4. codemode — `@earendil-works/pi-codemode`

- **一句话定位**：在 QuickJS（编译为 WASM）沙箱里跑"模型写的 JavaScript"，脚本唯一的能力是调用注入的工具，嵌套工具调用不进入 LLM 上下文。
- **核心能力**（README）：
  - 三种沙箱同一 API/脚本环境/结果格式：`CodemodeSandbox`（Node/Bun，每次执行一个 worker 线程，`.` 主入口）、`RemoteCodemodeSandbox`（Cloudflare，VM 跑在独立部署 Worker 的 Durable Object，`/portable` 入口）、`InlineCodemodeSandbox`（调用线程，`/portable` 或 `/cloudflare`）。
  - 脚本环境：`tools.<name>()`、`ALL_TOOLS`、`text()/image()/exit()`、`store()/load()`（跨执行 KV，限额单值 256Ki/总量 1Mi）、`// @options:` 首行（`max_output_tokens`、`timeout_ms`）；无 timers/fetch/process/require/WebAssembly。
  - 限额与结果：`timeoutMs`、`memoryLimitBytes`、interrupt budget（Cloudflare 默认 100k polls ≈ 10s）；输出上限 16Mi 字符 / 100k items；`result.error.kind ∈ {script, timeout, aborted, sandbox}`；`result.calls` 记录每次工具调用。
  - `renderDeclarations()` 把工具 schema 渲染成给模型看的 TypeScript 声明；`/source` 入口提供 `parseCodemodeSource()` 与 Lark 文法 `CODEMODE_SOURCE_GRAMMAR`（语法约束生成）。
  - 确定性运行：`sandbox.start()` 固定时间/随机种子/时区/结果顺序，可用 durable log 重放。
- **关键入口**：`"."`、`/declarations`、`/source`、`/portable`、`/cloudflare`、`/worker`。源码 `src/`：`index.ts`、`runtime/`（worker）、`portable.ts`、`cloudflare.ts`、`declarations.ts`、`wasm.ts`。
- **scripts**：`build`/`test`（vitest）。
- **依赖了哪些其他包**：无（仅外部 `quickjs-wasi` 3.6.2；README 明言 "It has no pi dependencies"）。
- **被谁依赖**：durable、coding-agent。

## 5. tui — `@earendil-works/pi-tui`

- **一句话定位**：带差分渲染与同步输出的极简终端 UI 框架，为无闪烁交互式 CLI 服务（`pi` 交互模式的 UI 底座）。
- **核心能力**（README）：
  - 共享 `TUI` 接口 + 两个渲染器：`TuiMainScreen`（主屏缓冲、保留回滚）与 `TuiAltScreen`（备用屏固定视口、应用自管滚动，退出时把完整文档打回主屏）。
  - 差分渲染只更新变化行；CSI 2026 同步输出避免闪烁；bracketed paste（>10 行加标记）。
  - 组件：Text、TruncatedText、Input、Editor（编辑器组件在 `src/editor-component.ts`，含 kill-ring/undo/word-navigation）、Markdown、Loader、SelectList、SettingsList、MouseRegion、Image、Box、Container、VStack/HStack/ScrollView（flexbox 风格 basis/grow/shrink）；overlay 系统（锚点/百分比/绝对定位、焦点管理）。
  - Alt-screen 视口：主滚动区键盘导航、OSC 133 提示符跳转、Ctrl+Shift+F 搜索面板、滚动到底指示器。
  - 颜色系统：ANSI 索引/sRGB/OKLCH/OKHSL 解析、混色、按终端模式输出 truecolor/256。
  - 内联图片：Kitty / iTerm2 图形协议；平台原生模块（剪贴板等）在 `native/`，按 darwin/linux/win32 构建。
- **关键入口**：`main` → `dist/index.js`（无 exports 映射，最朴素的包）；源码 `src/`：`tui.ts`、`tui-main-screen.ts`、`tui-alt-screen.ts`、`components/`、`layout.ts`、`colors.ts`、`oklab.ts`、`native/`（workspace 下）。
- **scripts**：`build`（tsc）、`build:native:darwin/linux/win32`、`test`（`node --test`，非 vitest——12 包中唯一）。
- **依赖了哪些其他包**：无（仅外部 `get-east-asian-width`、`marked`、`marked-cjk-friendly`）。
- **被谁依赖**：coding-agent。

## 6. ai — `@earendil-works/pi-ai`

- **一句话定位**：统一 LLM API：多 provider 集合、自动模型发现与鉴权解析、token/成本统计、上下文序列化与会话中途换模型。
- **核心能力**（README，2011 行，功能最厚的基础包）：
  - 30+ 内置 provider（OpenAI/Anthropic/Google/Vertex/Bedrock/Groq/OpenRouter/xAI/Mistral/DeepSeek/Qwen/ZAI/MiniMax/Moonshot/GitHub Copilot/Radius/Cloudflare AI Gateway 等以及任意 OpenAI 兼容 API）；provider 是运行时单元（目录 + 鉴权 + 流行为），共享底层 wire protocol（`anthropic-messages`、`openai-responses`、`openai-completions`…）。
  - `Models` 集合 API：`stream/complete/streamSimple/completeSimple`；同步读模型列表 + 异步 `refresh()` 动态 provider（llama.cpp、OpenRouter 实时目录）。
  - 统一事件流（start/text_delta/thinking_delta/toolcall_delta/done/error…），流式部分 JSON 工具调用（`partial-json`）。
  - 鉴权：按 provider 解析（环境变量、存储凭据、OAuth、AWS profile/gcloud ADC），显式 key 优先；`./oauth`、`./bedrock-provider`、`./bun-oauth` 等子入口。
  - 模型目录生成管线：`catalog/generate.ts`（`generate-models`/`hydrate-model-data`/`generate-model-catalog` scripts），`models.generated.ts` 为产物。
  - 工具参数即 JSON Schema（推荐 pi-schema builder）；token/成本跟踪（`usage.cost.totalFromProvider` 区分 provider 上报 vs 目录估算）。
  - 跨 provider handoff、system message 补丁机制（`getCurrentSystemMessage`）、上下文序列化、浏览器可用、tree-shaking 友好（`providers/all` 重入口 vs 单 provider 工厂）、faux provider 测试替身、CLI（`bin: pi-ai`，`src/cli.ts`）。
- **关键入口**：`"."`、`./models`、`./session-resources`、`./compat`、`./providers/*`、`./api/*`、`./utils/*`、`./oauth`、`./bedrock-provider`、`./bun-oauth`、`./lazy-bedrock-provider`、`./lazy-oauth`；bin `pi-ai` → `dist/cli.js`。源码 `src/`：`models.ts`、`providers/`、`api/`、`auth/`、`catalog`（workspace 下）。
- **scripts**：`build` = `generate-models` + `build:offline`（模型目录生成嵌入构建，12 包中唯一）；`check:model-data`。
- **依赖了哪些其他包**：pi-schema、pi-telemetry（外部：anthropic/openai/google-genai/aws-bedrock SDK、http(s)-proxy-agent 等）。
- **被谁依赖**：agent、durable、coding-agent、evals(dev)。

## 7. agent — `@earendil-works/pi-agent-core`

- **一句话定位**：带状态、工具执行与事件流的通用 agent 循环（`pi` CLI 的 agent 内核），构建在 pi-ai 之上。
- **核心能力**（README，571 行）：
  - `Agent` 类：`AgentState`（model/thinkingLevel/tools/messages/streaming 状态）、`prompt()/continue()/abort()/waitForIdle()/reset()`。
  - 消息模型：`AgentMessage` 支持声明合并的自定义角色；`transformContext`（裁剪/压缩）→ `convertToLlm`（过滤 UI-only 消息）两段式送往 LLM。
  - 完整事件流：agent/turn/message/tool_execution 各级 start/update/end；订阅者按注册顺序 await（`agent_end` 是结算屏障）。
  - 工具执行：`parallel`（默认，按 assistant 源顺序持久化结果）/`sequential` 两种模式，可按工具覆盖；`beforeToolCall`（可 block）/`afterToolCall`（可改写结果）钩子；`terminate: true` 终止提示。
  - 回环控制：`prepareRequest`（每次请求前重建规范上下文）、`finishTurn`（`{action: "end"|"continue"}`，取代旧的 `shouldStopAfterTurn`）。
  - steering（运行中插话）/follow-up（结束后排队）队列，one-at-a-time/all 两种模式。
  - 低层 API：`agentLoop()/agentLoopContinue()` 观察型异步流；`streamProxy` 浏览器代理后端。
  - 与 mcp/codemode 的官方组合方式见 `examples/mcp-codemode`（`runToolCall()` 让嵌套调用也过钩子）。
- **关键入口**：`"."`（`dist/index.js`）。源码 `src/`：`agent.ts`、`agent-loop.ts`、`proxy.ts`、`stream-fn.ts`、`types.ts`。
- **scripts**：`build`/`test`（vitest）。
- **依赖了哪些其他包**：pi-ai、pi-schema。
- **被谁依赖**：coding-agent。

## 8. chord — `@earendil-works/chord`

- **一句话定位**：跨进程"对象运行时"：对象活在 server、worker、浏览器标签等多个宿主中，契约/文档/存储/链接/插件热重载/HTTP/workers/web 与终端客户端一套打尽（Pi Durable 的状态底座）。
- **核心能力**（README + 入口表）：
  - 核心概念：对象类型即契约（JSON Schema 描述）、facet（插件对宿主的声明）、引用（活的、跨 link 可用、保活）、document（事务写入 store 的命名 JSON）、derive/job、principal 鉴权、插件热重载（host 逐个滚动，数据与运行中工作尽量存活）。
  - 24 个 exports 子入口按运行环境分层（README 入口表）：浏览器/Node 通用的核心（契约、host、store、watch、delta、output、i18n）、Node 专属（`/http`、`/workers`、`/plugins`、`/app`、`/surfaces`、`/tui/launcher`、`/compression`）、浏览器侧（`/web`、`/react`）、SQLite 可移植层（`/sqlite`、`/sqlite/node`、`/sqlite/cloudflare`）、telemetry 存储（`/telemetry-sqlite`、`/telemetry-ingest`）、实验性 sync（`/sync`）。
  - `delta` 子模块：事务化 JSON tracker、结构 diff、不可变 apply、wire 编码（有独立 README `src/delta/README.md`）。
  - 显式 Context（取消 + TelemetrySpan + 类型化值）贯穿所有调用；`Watch/WatchHandle` 是统一订阅原语（durable 的文档/会话视图/任务图都用它）。
  - 大量设计文档：`docs/design.md`（规则书）、`docs/decisions.md`、`docs/slices.md`、插件教程等。
- **关键入口**：见上面 24 个 exports（含 `"source"` 条件指向 `src/`，供 monorepo 内直引源码）。源码 `src/`：`contracts/`、`host/`、`documents/`、`store/`、`delta/`、`watch.ts`、`node/`（http/workers/plugins/app/surfaces/tui）、`web/`、`react/`、`tui/`、`sync/`、`sqlite/` 等。
- **scripts**：`build`/`test`（vitest）。
- **依赖了哪些其他包**：pi-schema、pi-telemetry（peer 可选：esbuild、react、ws，全部 optional 且只在对应子入口 import）。
- **被谁依赖**：durable、env。

## 9. durable — `@earendil-works/pi-durable`

- **一句话定位**：实验性的持久化 agent harness——对话、模型轮次、工具调用与用户状态先提交存储再展示，进程崩溃后重开存储即从断点续跑。
- **核心能力**（README，1154 行，标注 "Experimental. The API changes without notice"）：
  - 核心概念：Harness（存储 + 运行机器）、Conversation（不可变 entry 转录）、Commit（原子写）、Document（转录旁的类型化 JSON 状态：`pi.agent/pi.provider/pi.live/pi.inbox/pi.usage`）、Task（每步存 checkpoint 的持久状态机，内置 `pi.generation`/`pi.tool`）、Submission（可等待的幂等输入，`requestId` 去重）、Extension/Registry（工具+提示+钩子的可热换包）。
  - Persist & Resume：`harness.resume()` 续跑未完成 run；`readOnly` 模式；持久 UUIDv7 作为 provider `sessionId`（提示缓存亲和）。
  - 睡眠与信号：任务以存储的 sleep 结束 phase（`sleepUntil` + checkpoint），可被 typed signal（webhook/人工回答）或超时唤醒；`onWake` 适配 Cloudflare Durable Object 的 alarm 模型。
  - 存储 backend：memory（默认）、SQLite（Node / Cloudflare DO）、JSONL（Node）、IndexedDB（浏览器）——均为 `./storage/*` 子入口；fake clock（`setTimer`/`now` 可注入）。
  - 子代理/子任务/任务图、fork、compaction（压缩）、usage 与成本统计、hooks、per-conversation agent 配置。
  - 遥测：`DURABLE_TELEMETRY_SCHEMA` 类型化 span/metric（`pi.durable.submit/phase/report/...`），trace carrier 随提交持久化。
  - 子入口另有 `./env`（ExecutionEnv 执行环境抽象）、`./codemode`、`./tool-search`、`./tools`、`./images`（含 fit/node/cloudflare）、`./testing`。
- **关键入口**：`"."` 加上述子入口（全部带 `source` 条件）。源码 `src/`：`harness/`、`session/`、`storage/`、`tasks.ts`、`signals.ts`、`entries.ts`、`env/`、`tools/`、`codemode/`、`images/`、`testing/` 等。
- **scripts**：`test` 是 12 包中最重的（默认 vitest + `PI_DURABLE_DOCUMENT_RETENTION_MS=0` 重跑 + store 配置 + workers 配置）；另有 10 个 `bench:*`（storage/scheduler/document cache 等）。
- **依赖了哪些其他包**：chord、pi-ai、pi-codemode、pi-schema、pi-telemetry（外部：`@silvia-odwyer/photon` 图片处理、`diff`）。
- **被谁依赖**：env。

## 10. env — `@earendil-works/pi-env`

- **一句话定位**：Pi Durable 的远程执行环境：一个经 SSH 部署到远端机器的小型 Rust daemon，加上客户端 `RemoteExecutionEnv`，让 agent 的工具跑在别的机器上而存储与凭据留在本地。
- **核心能力**（README）：
  - `daemon/`（Rust，Cargo 构建）：stdin/stdout 帧协议（`docs/protocol.md`），在远端做文件操作与命令执行；按 SHA-256 命名、每次启动前校验；支持 Linux/macOS/Android(Termux)/Windows，x86-64 与 arm64；预编译产物随包发布在 `bin/`。
  - `RemoteExecutionEnv`：实现 durable 的 `ExecutionEnv`，语义与远端本机的 `NodeExecutionEnv` 一致（`docs/semantics.md`）。
  - SSH 治理：host key 扫描/接受（`scanHostKey/acceptHostKey`）、BatchMode、严格 host-key、无任何转发；`connectSsh`（立即部署连接）与 `sshConnection`（懒连接，失败下次重试）。
  - `LocalExecutionEnv`：本机 daemon 版（补齐 `listFiles`）；`listFiles` 语义仿 `fd --hidden --exclude .git`，带 maxEntries/maxBytes/timeout/truncated。
  - `openTerminal()`（PTY 交互终端，暂不支持 Windows）、`openProcess()`（管道协议进程，可跑 MCP server，杀整个进程组）、`nodePlatform()` 平台名归一化。
- **关键入口**：`"."`（`dist/index.js`）。源码 `src/`：`ssh.ts`、`remote-env.ts`、`connection.ts`、`terminal.ts`、`process.ts`、`list-files.ts`；daemon 在 `daemon/`（Rust）。
- **scripts**：`build`、`build:daemon`（cargo）、`test`（vitest；可通过 `PI_ENV_DAEMON`/`PI_ENV_SSH_HOST` 跑真实 daemon/SSH 套件）。
- **依赖了哪些其他包**：chord、pi-durable。
- **被谁依赖**：12 包中无下游（面向外部使用；mcp 的 PipeTransport 文档展示了与其 `openProcess()` 的互操作）。

## 11. coding-agent — `@earendil-works/pi-coding-agent`

- **一句话定位**：`pi` 命令本身——极简、可扩展的 coding agent CLI（read/bash/edit/write 工具 + 会话管理），通过 extensions/skills/模板/主题定制。
- **核心能力**（README + package.json）：
  - 产品形态：`bin.pi` → `dist/bundle/cli.js`；安装走 `pi.dev/install.sh`（锁依赖）或 npm；也可 `build:binary` 用 Bun 编译出独立二进制 `dist/pi`。
  - 使用方式：交互 TUI、print/JSON 模式（自动化）、RPC（`/rpc-entry` 导出）、TypeScript SDK（`main` → `dist/index.js`）；配置目录 `.pi`（`piConfig.configDir`）。
  - 扩展体系：extensions、skills、prompt templates、themes，可打包成 Pi packages 经 npm/git 分发；刻意不内置 sub-agents 与 plan mode（"Ask Pi to build what you want"）。
  - 内部结构（`src/`）：`core/`、`modes/`（interactive 等）、`extensions/`（含 `codemode/worker.ts`）、`cli/`、`experimental/`、`schemas/`（`generate:schemas`/`generate:references` 生成 JSON schema 与参考文档）、`utils/`（含 `image-resize-worker.ts`）。
  - 会话分享：`badlogic/pi-share-hf` 发布 OSS 会话数据到 Hugging Face。
  - 文档体量大：`docs/`（usage、cli、rpc、sdk、extensions、skills…）随包发布。
- **关键入口**：`"."`、`./rpc-entry`；bin `pi`。构建链最复杂：`build` = tsc 产物 + `scripts/build-coding-agent-bundle.mjs` 打 bundle；`build:binary` 先按序构建 tui/telemetry/ai/agent 再 Bun compile。
- **scripts**：`build`、`build:unbundled`、`build:binary`、`copy-assets`/`copy-binary-assets`（主题 JSON、PNG、export-html 模板、photon wasm）、`test`（vitest）、`generate:schemas`、`generate:references`。
- **依赖了哪些其他包**：pi-agent-core、pi-ai、pi-codemode、pi-mcp、pi-tui（外部：photon-node 图片、diff、chalk、jiti、quickjs-wasi、undici、yaml 等 18 项）。
- **被谁依赖**：evals（devDependency）。

## 12. evals — `@earendil-works/pi-evals`

- **一句话定位**：Pi coding agent 的行为评测工作区（私有包，不发布），基于 `vitest-evals`，核心是"文档提升度"（documentation lift）A/B 对比。
- **核心能力**（README）：
  - 三类 eval：`eval:host`（冒烟套件）、`eval:audit`（文档审计，扫描全部文档页）、`eval:docs`（文档提升度：同一 case 在 `without_docs` / `with_docs` 两个 Docker 镜像里各跑一遍，配对算 lift）。
  - 运行器（`src/`）：`cli.ts` 编排、`docker.ts` 构建两镜像/隔离单臂运行、`plan.ts` 展开为 (case, variant, repetition) 任务、`report.ts` 读 Vitest JSON 配对算 lift、`harness.ts` vitest-evals 适配器。
  - 方法论细节：变体对称安装本地 workspace tarball、内部依赖包的文档对称移除（防止当替代指令）、eval 定义 root-only 不可读、repetition 交替排序去顺序偏差、配对臂不齐则扣发 headline pass rate。
  - 文档 eval 默认只允许 read/write/edit/grep/find/ls 工具（无 shell/web）；需要 `PI_PROVIDER`/`PI_MODEL`。
- **关键入口**：无 `main/exports`（私有工具包）；脚本即入口（`eval`、`eval:host`、`eval:audit`、`eval:docs`、`test`）。
- **scripts**：见上；`clean` 清 `.eval/` 产物目录。
- **依赖了哪些其他包**：pi-ai、pi-coding-agent（均为 devDependencies，私有包无 runtime deps）。
- **被谁依赖**：无。

---

## 附：横向观察

1. **构建一致性**：除 tui（`node --test`）、evals（多 vitest 配置）外全部用 vitest；`clean` 都走仓库统一脚本 `scripts/package-files.mjs`；多数包 exports 带 `"source"` 条件指向 `src/`，配合 monorepo 内 `--conditions=source` 直跑 TS 源码（durable 的 bench 脚本即如此使用）。
2. **版本联动**：所有内部依赖钉在同一版本 1.5.2（精确版本而非 range），是同步发版的 monorepo。
3. **两条产品线**：coding-agent（pi CLI，内存态 agent-core）与 durable+chord+env（持久化 agent 平台，README 标注实验性）共享 schema/telemetry/ai/codemode 底座。
4. **数据点**：schema 包 README 声称 8.5 KB min+gzip、draft 2020-12 core 1298 测试通过 1297；codemode README 给出 Cloudflare 上 10 秒计算脚本阻塞 session DO 全部请求 vs 独立 Worker 约 50ms 的实测（2026-10）；mcp 支持协议版本 `2025-11-25`。均为 README 自述，未独立复核。
