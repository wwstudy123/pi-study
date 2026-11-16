# pi 仓库调研笔记：apps 目录与仓库顶层结构

- 调查对象：`/Users/xiaenping/Zcode/pi-study/pi`（GitHub earendil-works/pi）
- 本地快照：HEAD `22fc026`（2026-11-15，`docs(p3): practices match the redone slice 1`）
- 整体置信：高置信（以下结论均来自仓库一手文件，引用给出路径与行号/章节）
- 调查日期：2026-11-16
- 说明：原定写入 `.zwork/research/`，该目录为运行时保留不可写，改存 `research/apps-and-repo.md`

---

## 一、结论摘要

pi 是一个 npm workspaces 单仓（monorepo），发布件是 `packages/*` 下 12 个 `@earendil-works/*` 库（全部锁 1.5.2），`apps/*` 是三个**不发布**的实验性应用：p2（自托管的 Pi Durable Web/TUI 界面，标明"prototype, will be gone soon"）、p2-mac（p2 的原生 macOS 壳，Swift spike）、p3（p2 在 Chord v2 上的继任者，**尚无可运行产物**，正按 25 个切片推进）。仓库顶层由 `AGENTS.md`（agent/人的开发规则）+ `CONTRIBUTING.md`（贡献门禁：默认自动关闭、`lgtm`/`lgtmi` 审批）治理，构建/发布工具集中在 `scripts/`（68 个文件），Nix 打包只覆盖 coding-agent（`pi` CLI），长期规划不放在仓库内，而在外部 RFC 站点 rfc.earendil.com。

---

## 二、apps 目录

### 2.1 apps/p2 —— 自托管 Pi Durable UI（成熟的实验品，将被 p3 取代）

**定位**：README 首部即警告（apps/p2/README.md:1-8）：

> "# EXPERIMENTAL — **p2 is a prototype. It will be gone soon.** It is not supported, its data formats and APIs change without notice, and it will be replaced."

是一个 self-hosted 的 Pi Durable UI，"built from independent Chord plugins"（apps/p2/README.md:10），即由独立 Chord 插件组装的服务端应用。

**形态与规模**（一手目录统计）：
- `src/`（hosts / web / tui / runtime / api）+ `plugins/` 共约 595 个 ts/tsx 文件
- `plugins/` 下 48 个插件目录：agent、chat、sessions、conversations、discord、radius、voice、terminals、file-index、subagents、sync、views、workspace、sharing 等——功能面已相当宽
- 另有 `voice-server/`、`docs/`（30+ 篇设计/交接文档，含 `p3-handoff.md`、`p3-walkthrough.md`、`p3-reviews/`）、`third-party/`
- 运行方式：Node ≥22.19，`npm start` 起 `src/hosts/server.ts`，默认监听 `127.0.0.1:8788`，数据目录 `~/.pi/p2`；`src/hosts/tui.ts` 提供 TUI 宿主（apps/p2/package.json scripts）

**与 packages 的关系**（apps/p2/package.json dependencies）：工作区依赖 `@earendil-works` 的 chord、pi-ai、pi-codemode、pi-durable、pi-env、pi-mcp、pi-schema、pi-telemetry、pi-tui（全部精确锁 1.5.2），即消费了除 agent/coding-agent/evals 之外的 9 个库；另有同组织外部包 design-tokens、elanor-fonts、elanor-icons-react、elanor-react（React 19 Web UI）。**不依赖** pi-agent / coding-agent。

**与根仓的边界**：AGENTS.md 明确（"Commands" 节）——"apps/p2 is outside the root check and the root tests"，须在 `apps/p2` 内单独跑 `npm run check` 和 `npm test`（node:test，TUI 测试需 Node 26，浏览器测试需 `CHROMIUM_BIN`）。p2 自带 biome.json、tsconfig.json，`private: true` 不发布。

**成熟度**：功能广、有完整测试/文档/鉴权设计（owner-key、一次性 token、Radius 集成，README 有大段安全模型论述），但官方自我定位是"将被替换的原型"。结论：**工程上最完整，生命周期上已被判死刑**（接棒者为 p3）。

### 2.2 apps/p2-mac —— p2 的原生 macOS 壳（spike）

**定位**："p2-mac (spike)"（apps/p2-mac/README.md:1），原生 macOS 应用，两个部分：
1. 菜单栏项：发现或启动本地 p2 服务器（按 loopback 监听 + `/health` + `P2_DATA_DIR` 探测，可 adopt 已在跑的服务器）
2. 窗口：用 WKWebView 显示 p2 的 Web UI，以本地 owner 身份免 token 登录

**技术栈**：AppKit + WKWebView，macOS 14+，零依赖（README:9-10）。目录只有 `Package.swift`、`Sources/`、`Resources/`、`Makefile`、`scripts/build-app.sh`——**不是 npm workspace，无 package.json**，是三个 apps 中唯一的非 Node 项目。计划文档是 session artifact `pi-desktop-plan`（README:11）。

**构建**：`./scripts/build-app.sh` 产出 `build/Pi.app`（debug、ad-hoc 签名）；Makefile 提供 `make run / run-radius / attach` 三种运行方式（端口 8798/8799/8788）。

**亮点**：Radius 账号集成（原生 brain 标签栏、OAuth PKCE 经系统浏览器）、`P2MAC_*` 环境变量全套配置、诊断模式（页面截图/桥接事件记录）。

**成熟度**：**spike（技术验证）**——自述即如此；产出 ad-hoc 签名的 debug 包，非可分发产品。README 尾部提到 Radius 的 `/v1/pi/servers` "not deployed yet"，依赖面尚在演进。

### 2.3 apps/p3 —— p2 的继任者（Chord v2，切片推进中，尚无可运行产物）

**定位**："The successor of p2 (Pi Mobile) on Chord v2. **Nothing runs yet**: p3 is built in slices (`docs/slices/`)"（apps/p3/README.md:3）。

**当前进度**（一手统计）：
- 代码仅 9 个 ts 文件：`src/app.ts`、`src/principals.ts`、`src/api/`（v1 API）、`plugins/sessions/`
- 切片规格已写到 25 个：`docs/slices/01-base-and-sessions` … `25-radius-sign-in.md`；最近一次提交（HEAD）正是 "docs(p3): practices match the redone slice 1"——说明切片 1 刚重做完
- `docs/` 下有 overview、names、workflow、decisions、chord-practices、archive 等工作文档

**与 packages 的关系**（apps/p3/package.json）：只依赖 `@earendil-works/chord`、`pi-schema`、`pi-telemetry`（均 1.5.2），依赖面刻意最小，核心构建在 Chord v2 上。包名 `@p3/app`，`private: true`，Node ≥24.4。

**成熟度**：**最早的阶段——文档先行、代码刚起步**。p2 的 docs 里已有 `p3-handoff.md`、`p3-reviews/`、`p3-functions/`，交接与评审材料在 p2 侧积累。

### 2.4 三者关系一句话

p2 是"现在"（将被弃用的功能完整原型）→ p2-mac 是 p2 的原生壳实验 → p3 是"未来"（p2 的正式继任者，Chord v2 架构重写）。三者的共同底座是 `packages/*` 库；对 packages 的消费面从 p2 的 9 个库收敛到 p3 的 3 个。

---

## 三、仓库顶层结构

### 3.1 根 package.json 与 workspaces

`package.json`（根，`pi-monorepo`，private）：
- **workspaces**：`packages/*`、`apps/*`，外加 4 个示例目录也纳入 workspace（chord 教程示例、coding-agent 的三个扩展示例 with-deps / custom-provider-anthropic / gondolin）
- **build 顺序硬编码**（root scripts）：telemetry → schema → chord → tui → codemode → mcp → ai → durable → env → agent → coding-agent，即 packages 间依赖的拓扑序；`build:offline` 变体只影响 ai
- **check** 是总门禁：biome + pinned-deps + runtime-deps + ts-imports + entry-graphs + install-lock + tsc + browser-smoke（AGENTS.md：代码改动后必须 `npm run check` 全绿）
- **版本/发布**：`version:patch/minor/major` 统一 bump 12 个包 + `sync-versions.js`；发布走 `scripts/release.mjs` / `publish.mjs` / `local-release.mjs`
- engines: Node ≥22.19；devDeps 含 biome 2.3.5、TypeScript 7.0.2、esbuild、husky、pnpm（用于发布流程）
- 注意：**apps 不参与 root build/check/test**（p2 独立跑，p3 独立跑，p2-mac 无 npm），root 的 `build` 只构建 packages

### 3.2 packages/*（对照参考）

12 个包，全部 1.5.2，即发布件：`agent`、`ai`、`chord`、`codemode`、`coding-agent`（= `pi` CLI 主体）、`durable`、`env`、`evals`、`mcp`、`schema`、`telemetry`、`tui`。

### 3.3 scripts/ 目录（68 个文件）

按作用分五类（依据文件名与 root scripts 的引用关系，属一手代码）：

| 类别 | 代表脚本 | 作用 |
|---|---|---|
| 构建打包 | `build-coding-agent-bundle.mjs`、`build-binaries.sh`、`create-source-archive.sh`、`pack-packages.mjs`、`package-*.mjs`、`preview-packages.mjs` | 打 `pi` 的 bundle、独立二进制、源码归档、npm pack 预演 |
| 质量门禁 | `biome-check.mjs`、`check-pinned-deps.mjs`、`check-runtime-deps.mjs`、`check-ts-relative-imports.mjs`、`check-entry-graphs.mjs`、`check-browser-smoke.mjs`、`check-package-install.mjs`、`check-released-changelogs.mjs`、`generate-coding-agent-install-lock.mjs` | 依赖精确锁定、运行时依赖、入口图、浏览器冒烟等，全被 root `check`/CI 串联 |
| 发布流程 | `release.mjs`、`publish.mjs`、`release-packages.mjs`、`release-notes.mjs`、`publish-release-announcement.mjs`、`local-release.mjs`、`sync-versions.js`、`use-local-packages.mjs` | 版本同步、changelog 校验、npm 发布、公告 |
| 模型目录 | `publish-model-catalog.mjs`、`diff-model-catalog.mjs`、`update-model-catalog-pin.mjs`、`check-model-catalog-compat.mjs`、`generate-thinking-capabilities.mjs` | pi-ai 的模型目录生成/发布/兼容检查（AGENTS.md 规定 models.generated.ts 不得手改，走 catalog 再生成） |
| 冒烟/性能/杂项 | `coding-agent-smoke.mjs`、`smoke-test-codemode-binary.mjs`、`agent-treeshake-smoke-entry.ts`、`browser-smoke-entry.ts`、`profile-coding-agent-node.mjs`、`cost.ts`、`session-transcripts.ts`、`repro-5893-wsl-bash.mjs` | 各类 smoke 入口、性能剖析、统计工具、单个 issue 复现 |

配套测试同目录（`*.test.mjs/.ts`），root `test:scripts` 用 `node --test` 跑。仓库根还有跨平台测试入口 `test.sh` / `pi-test.sh` / `pi-test.bat` / `pi-test.ps1`（只跑 packages，见 AGENTS.md）。

### 3.4 nix/ 与 flake.nix

- `flake.nix`：描述 "Pi coding agent"，为 4 个平台（aarch64/x86_64 × darwin/linux）产出 `packages.pi` 与 `apps.pi`（`bin/pi`）及 overlay。特别处理：Intel macOS 用 `nixpkgs-26.05-darwin` 分支（unstable 已不支持 x86_64-darwin）
- `nix/package.nix`：以 `packages/coding-agent` 为主体构建。用 `importNpmLock` 从 package-lock 锁依赖、`--ignore-scripts`；模型目录按 `nix/model-catalog.json` 的 revision 从 `https://pi.dev/api/models/revisions/...` 以 sha256 固定拉取；运行时包 ripgrep、fd、wl-clipboard/xclip/libxcb（剪贴板与 Linux GUI 依赖）
- **范围**：Nix 打包只针对 coding-agent（`pi` CLI），不覆盖 apps/p2、p3

### 3.5 AGENTS.md

给人类与 agent 共用的开发规则（README.md:100 点名）。要点：
- 文风：简短直接、无客套、提交/issue 不用 emoji
- 代码质量：读全文件再大改、禁 `any`、禁内联 import、只用可擦除 TS 语法（Node strip-only）、禁手改 `models.generated.ts`
- **Chord v2 代码风格**专节（文件组织、tagged union、测试一文件一源文件、垂直切片流程）——与 p3 的构建方式直接呼应
- 命令纪律：改代码后 `npm run check`；`apps/p2` 独立检查；未经要求不跑 `npm test`、不 commit
- 依赖安全：npm 依赖与 lockfile 当作受审代码，精确锁版，生命周期脚本须显式白名单
- Git 纪律：多 session 并发工作的防踩踏规则（只 stage 自己改的文件、禁 `git add -A`/`reset --hard` 等）
- Changelog 位置：`packages/*/CHANGELOG.md`（每包一份，`## [Unreleased]` 节）
- 提到 `.pi/skills/`（p2-ui、interactive-testing、release 等技能文档），`.pi/` 目录含 extensions/git/npm/prompts/skills

### 3.6 CONTRIBUTING.md

贡献门禁，风格强硬：
- 哲学：**pi 核心保持最小**，功能应做成 extension，膨胀核心的 PR 会被拒
- "The One Rule"：**你必须理解你的代码**；AI 写码可以，提交不理解的东西不行；agent 须从 pi 根目录运行以加载 AGENTS.md
- **门禁机制**：新贡献者的 issue 和 PR 默认被自动关闭；维护者用 `lgtmi`（解锁 issue）/`lgtm`（解锁 issue+PR）回复审批；周五至周日的 issue 不保证被看；违反两次或用 agent 刷 issue 会被永久 block
- PR 前须 `npm run check` + `./test.sh` 全过；不许改 CHANGELOG（维护者加）
- 问题走 Discord

### 3.7 RFC 的位置

**仓库内没有 RFC 目录**（`find -iname '*rfc*'` 在排除 node_modules 后零命中，2026-11-16 查证）。RFC 是外部站点：
- README.md:100："Longer term plans for Pi can also be found in [RFCs](https://rfc.earendil.com/keyword/pi)"
- CONTRIBUTING.md:101-102："Earendil uses RFCs to discuss larger changes. Not all of them are public, but quite a few are. They can be found at [rfc.earendil.com](https://rfc.earendil.com/keyword/pi)"

（注：本次未抓取该站内容，仅引用仓库内链接原文。）

### 3.8 其余顶层文件

`LICENSE`、`SECURITY.md`、`README.md`、`biome.json`（根 lint 配置）、`tsconfig.base.json` / `tsconfig.json`、`vitest.base.ts`、`node_modules`、`package-lock.json`、`.github/`（workflows、ISSUE_TEMPLATE、APPROVED_CONTRIBUTORS——后者与贡献门禁配套）。

---

## 四、待证项

1. `apps/p2/docs/p3-handoff.md`、`p3-reviews/` 的具体内容（p2→p3 的交接验收标准与评审结论），本次只确认存在未细读——跟进方式：细读这两个目录。
2. `@earendil-works/design-tokens` / `elanor-*` 外部包与 pi 团队的关系（推测为同组织的独立设计系统仓库，未核实）。
3. rfc.earendil.com 上与 pi 相关的 RFC 清单与内容（仓库只给链接）。
4. `.github/workflows` 的 CI 具体跑哪些 job（只看了目录，未读 YAML）。

## 五、建议的下一步

- 若关注 p3 演进：读 `apps/p3/docs/slices/01-base-and-sessions.md` 与 `docs/decisions.md`，对照 p2 的 `docs/p3-handoff.md`。
- 若关注发布工程：读 `scripts/release.mjs` 与 `scripts/publish.mjs`，配合 `.github/workflows`。
- 若关注 Chord v2 架构：读 `packages/chord/docs/design.md` 与 `slices.md`（AGENTS.md 指定的权威文档）。
