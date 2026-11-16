# 从零复刻 Pi：最小粒度学习路线

> 配套 [功能地图](./feature-map.md) 与 [运行教程](./run-pi.md) 使用。
> 本文档是**课表**：每一课都遵循「读原仓库 → 在 c-pi 写最小实现 → 跑通验收 → 记录文档」的循环。
> 原则：**每一步都必须能运行**。跑不起来不进入下一课。代码全部由 AI 生成，但你必须读懂每一行再放行。

---

## 0. 学习约定（先定规矩）

### 0.1 三个一律

- 一律**先读后写**：动手前先读指定的 pi/ 源文件，能复述「它做了什么」才开写。
- 一律**最小可运行**：一次只加一个能力，加完就能跑、能验证。
- 一律**留痕**：每课在 `c-pi/docs/lessons/` 写一篇短文（做了什么 / 关键代码在哪 / 踩了什么坑）。

### 0.2 c-pi 目录约定

复刻品与原仓库**同名同构**，包名用 `@c-pi/*` 避免混淆：

```
c-pi/
├── package.json          # npm workspaces: packages/*
├── packages/
│   ├── schema/           # 对标 @earendil-works/pi-schema
│   ├── ai/               # 对标 pi-ai
│   ├── agent/            # 对标 pi-agent-core
│   ├── tui/              # 对标 pi-tui
│   ├── mcp/              # 对标 pi-mcp
│   ├── codemode/         # 对标 pi-codemode
│   └── coding-agent/     # 对标 pi-coding-agent（最终 CLI）
└── docs/                 # 本文档站
```

> Durable / chord / env 属于另一条产品线，**第一阶段不复刻**（见功能地图 §2）。学完 CLI 线后作为选修。

### 0.3 技术基线

- Node ≥ 22.19，ESM，TypeScript（学习期可用 `node --experimental-strip-types` 直跑，与 pi-test.sh 同思路）
- 测试：vitest（与原仓库一致）
- 不抄原仓库代码，**理解后重写**——复刻的是能力，不是字节。

---

## 总课表

| 阶段 | 课 | 目标 | 对标 |
|---|---|---|---|
| 0 | L00 | monorepo 骨架 | 根 package.json |
| 1 | L01–L02 | schema：定义+校验工具参数 | packages/schema |
| 2 | L03–L06 | ai：单供应商 → 流式 → 工具调用 → 多供应商 | packages/ai |
| 3 | L07–L09 | agent：循环 / 事件流 / steering | packages/agent |
| 4 | L10–L11 | 内置工具 read/bash/edit/write | coding-agent tools |
| 5 | L12–L13 | 会话 JSONL 树 + 恢复 | session-format |
| 6 | L14 | print 模式 CLI | coding-agent modes |
| 7 | L15–L16 | tui 基础组件 | packages/tui |
| 8 | L17–L18 | 交互模式 | interactive |
| 9 | L19 | 配置体系 + AGENTS.md | configuration |
| 10 | L20 | 上下文压缩 | compaction |
| 11 | L21–L22 | 扩展体系 | extensions / skills |
| 12 | L23 | JSON / RPC 模式 | json / rpc |
| 13 | L24 | MCP 接入 | packages/mcp |
| 14 | L25 | codemode 沙箱 | packages/codemode |
| 15 | L26 | 完整供应商目录 + 鉴权 | ai catalog |
| + | 选修 | durable/chord 线 | 另一条产品线 |

---

## 阶段 0 — L00 monorepo 骨架

**目标**：c-pi 能 `npm install`、有一个空包、能跑一个 hello 测试。

**读**：`pi/package.json`（workspaces、scripts.build 的拓扑序）、`pi/tsconfig.base.json`。

**写**：
- `c-pi/package.json`（workspaces、build 脚本）
- `c-pi/packages/coding-agent/package.json`（bin 入口占位）
- `c-pi/packages/coding-agent/src/cli.ts`（先只打印 `c-pi v0.0.1`）

**验收**：`node packages/coding-agent/src/cli.ts` 打出版本号；`npm run build` 不报错。

---

## 阶段 1 — schema（L01–L02）

**为什么先学它**：所有工具的参数定义都靠 JSON Schema，它是后面一切的地基，且零依赖。

**L01 类型构建器**
- 读：`pi/packages/schema/README.md`、`src/builders.ts`（`obj/str/int/arr/oneOf/opt` 怎么链式出 JSON Schema）
- 写：`c-pi/packages/schema`，实现 `obj/str/int/bool/arr/opt/oneOf` + `toJsonSchema()`
- 验收：`obj({ name: str(), age: opt(int()) }).toJsonSchema()` 输出合法 JSON Schema；TS 类型能推导 `{ name: string; age?: number }`

**L02 校验器**
- 读：`src/compiler.ts`、`src/coerce.ts`（check 与 coerce 两档 API）
- 写：`check(value)` 返回 `{ ok, errors }`，错误带 JSON Pointer 路径；`coerce()` 宽松转换（"1" → 1，供 LLM 参数用）
- 验收：对 `{ name: 123 }` check 报错路径 `/name`；coerce 后通过

---

## 阶段 2 — ai（L03–L06）

**读总纲**：`pi/packages/ai/README.md`、`src/models.ts`。

**L03 单供应商非流式**
- 读：`src/providers/` 下任选一个最简单的 OpenAI 兼容实现
- 写：`c-pi/packages/ai`，`complete(model, messages, tools?)` 调一个 OpenAI 兼容端点（用 DeepSeek/智谱任一），返回文本
- 验收：node 脚本发 "hi" 收到回复文本

**L04 流式**
- 读：事件流设计（`start/text_delta/toolcall_delta/done/error`，见功能地图 §5）
- 写：`stream()` 返回异步迭代器，终端逐字打印
- 验收：肉眼可见流式输出；中断 Ctrl+C 不崩

**L05 工具调用**
- 读：pi-ai 如何把 JSON Schema 工具发给模型、如何收 toolcall、流式 partial JSON
- 写：注册一个 `get_weather` 假工具，模型返回 toolcall → 执行 → 把结果喂回去拿到最终回答
- 验收：完整一轮 tool-use 对话跑通

**L06 usage 统计**
- 读：`usage.cost` 相关 README 章节
- 写：每次响应累计 `inputTokens/outputTokens/cost`
- 验收：对话 3 轮后打印累计用量，与供应商后台量级一致

---

## 阶段 3 — agent（L07–L09）

**读总纲**：`pi/packages/agent/README.md`、`src/agent.ts`、`src/agent-loop.ts`，配合 `pi/packages/coding-agent/docs/how-pi-works.md`。

**L07 最小 agent loop**
- 读：`prompt()` → 构造请求 → 执行工具 → 有结果再进下一轮 → 结束
- 写：`Agent` 类：`prompt(text)`、内部循环调 L03–L05 的 ai 包、工具表可注入
- 验收：给它 get_weather 工具，问"北京天气"，它自己调工具并总结

**L08 事件流**
- 读：agent/turn/message/tool_execution 四级 start/update/end
- 写：`subscribe(event, fn)`，cli 里打印每类事件名
- 验收：能看到 `agent_start → turn_start → message_delta → tool_execution_start → ... → agent_end`

**L09 steering / follow-up / abort**
- 读：agent README 的队列章节、usage.md Change direction
- 写：运行中 `steer(text)`、`followUp(text)`、`abort()`
- 验收：长任务中插话，观察两条消息进入的时机不同；abort 后排队消息退回

---

## 阶段 4 — 内置工具（L10–L11）

**读**：`pi/packages/coding-agent/src/core/`（工具实现目录）、`docs/cli.md` Tools 节。

**L10 read + ls**
- 写：read（带行号、offset/limit）、ls；用 schema 定义参数
- 验收：agent 能回答"这个目录下有什么"并读出指定文件内容

**L11 bash + edit + write**
- 读：edit 的字符串替换语义（old_string 唯一性）
- 写：bash（超时、输出截断）、write、edit
- 验收：让 agent "创建 a.txt 写入 hello，再把 hello 改成 world"，全程工具调用可见

> 安全学习点：这一课起工具就是任意代码执行了。理解 pi 为什么不逐调用审批、靠 OS 权限+容器化的立场（security.md）。

---

## 阶段 5 — 会话（L12–L13）

**读**：`docs/session-format.md`（逐节）、`docs/sessions.md`。

**L12 JSONL 落盘**
- 写：`SessionManager`：append 条目（id/parentId）、`~/.c-pi/sessions/` 按目录分组
- 验收：对话 3 轮，打开 JSONL 能看到 header + message 树

**L13 恢复与分支**
- 写：`--continue` 读最近会话重建上下文；`/tree` 概念先做线性版（切换 leaf）
- 验收：退出重进 `--continue` 能接着聊；手动改 parentId 能"回到过去"

---

## 阶段 6 — L14 print 模式

**读**：`docs/cli.md` Invocation and output。

**写**：`c-pi -p "..."` 输出最终文本退出；stdin 管道自动进 print 模式
**验收**：`echo "1+1=?" | node cli.ts -p` 输出答案；退出码语义正确

---

## 阶段 7 — tui（L15–L16）

**读**：`pi/packages/tui/README.md`、`src/tui.ts`、`src/components/`。

**L15 渲染循环**
- 写：差分渲染最小版：帧缓冲 + 只重绘变化行；Text、Input 两个组件
- 验收：终端里输入回显、上方有静态文本区，无闪烁

**L16 Editor 组件**
- 读：`src/editor-component.ts`（光标、历史、换行）
- 写：多行编辑器：Enter 发送、上下键历史、光标移动
- 验收：能输入多行、上下键翻历史

---

## 阶段 8 — 交互模式（L17–L18）

**读**：`pi/packages/coding-agent/src/modes/interactive/`、`docs/usage.md`。

**L17 布局**
- 写：转写区（渲染 assistant 文本与工具调用卡片）+ 编辑器 + 页脚（模型名/成本）
- 验收：像样地跑完一轮带工具的对话

**L18 快捷键与命令菜单**
- 写：Ctrl+P 切模型、/ 唤起命令菜单（先只列内置几个）、Esc 中止
- 验收：不查文档也能在界面里完成发送/中止/切模型

---

## 阶段 9 — L19 配置体系

**读**：`docs/configuration.md`、`docs/settings.md`。

**写**：`~/.c-pi/agent/settings.json` 读写；启动时发现 AGENTS.md 并注入系统提示；项目级 `.c-pi/` 信任问询（yes/no 记忆）
**验收**：在项目里放一句 AGENTS.md 指令，agent 回答风格改变；首次进目录弹信任确认

---

## 阶段 10 — L20 上下文压缩

**读**：`docs/compaction.md`（重点：切点规则——绝不在 tool result 切）。

**写**：token 估算 + 阈值触发（窗口−预留）→ 摘要请求 → CompactionEntry → 后续请求用摘要替换旧消息
**验收**：把窗口调小到 2k，连续对话观察压缩发生、原始 JSONL 仍完整、压缩后 agent 仍记得早期目标

---

## 阶段 11 — 扩展体系（L21–L22）

**读**：`docs/extensions.md`（事件四类语义）、`docs/skills.md`、`docs/prompt-templates.md`。

**L21 prompt template + skill**
- 写：`prompts/*.md` → `/命令` 参数替换；`SKILL.md` name/description 注入系统提示、按需读全文
- 验收：自定义 `/translate` 模板；写一个 skill 让 agent 掌握新"知识"

**L22 extension 最小版**
- 写：加载 `extensions/*.ts`，`pi.registerTool()`、`pi.registerCommand()`、监听 `input` 事件
- 验收：外部写一个扩展加一个 `/hello` 命令和一个 `time` 工具，重启后生效

---

## 阶段 12 — L23 JSON / RPC 模式

**读**：`docs/json.md`、`docs/rpc.md`、`docs/rpc-commands.md`。

**写**：`--mode json` 输出 JSONL 事件（对齐 L08 事件流）；`--mode rpc` stdin 命令 / stdout 响应（先实现 prompt/abort/get_state 三个命令）
**验收**：`--mode json` 管道给另一个脚本消费；RPC 模式下用 echo 发 prompt 拿到流式回复

---

## 阶段 13 — L24 MCP

**读**：`pi/packages/mcp/README.md`、`src/client.ts`、`docs/mcp.md`。

**写**：stdio transport 连一个示例 MCP server；工具注入 agent；曝光分级先只做 direct
**验收**：接一个 filesystem MCP server，agent 能用它列目录

---

## 阶段 14 — L25 codemode

**读**：`pi/packages/codemode/README.md`、`docs/codemode.md`。

**写**：先不真上 QuickJS——用受控 JS 执行（或 quickjs-wasi）跑 `tools.xxx()` 并行调用；无网络/无 require
**验收**：给 3 个工具，模型写一段脚本一次并行调 3 个，结果合并返回

---

## 阶段 15 — L26 供应商目录与鉴权

**读**：`pi/packages/ai/src/catalog/generate.ts`、`src/auth/`、`docs/providers.md`。

**写**：`models.json` 兼容端点声明；`auth.json` 凭据存储；`/login` 走一遍 OAuth（选一家）
**验收**：不设环境变量，纯靠 `/login` 后能对话

---

## 选修支线 — Durable 产品线

学完主线后：读 `packages/chord/README.md` → `packages/durable/README.md` → 跑 `apps/p2`（`npm start`，127.0.0.1:8788）。这条线是"持久化 agent 平台"，与 CLI 是两套架构，值得单独开学习分支。

---

## 每课文档模板

存 `c-pi/docs/lessons/LXX-标题.md`：

```markdown
# LXX 标题
日期：
## 读了的源码
- pi/packages/.../xxx.ts：它做了……
## 写了什么
- c-pi/packages/...：最小实现思路……
## 验收记录
- 命令与输出（贴终端）
## 没搞懂的
- 留给 AI 的提问
```

---

## 进度追踪

每完成一课，把下表勾上并在 AGENTS.md 同步：

- [ ] L00 骨架
- [ ] L01–L02 schema
- [ ] L03–L06 ai
- [ ] L07–L09 agent
- [ ] L10–L11 内置工具
- [ ] L12–L13 会话
- [ ] L14 print
- [ ] L15–L16 tui
- [ ] L17–L18 交互模式
- [ ] L19 配置
- [ ] L20 压缩
- [ ] L21–L22 扩展
- [ ] L23 JSON/RPC
- [ ] L24 MCP
- [ ] L25 codemode
- [ ] L26 供应商/鉴权
