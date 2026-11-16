# 07 · 最后一行：真正启动 Pi

前面所有准备，都是为了这最后一行（原文件第 84 行）：

```bash
node --import "$RESOLVER_URL" "$SCRIPT_DIR/packages/coding-agent/src/cli.ts" ${ARGS[@]+"${ARGS[@]}"}
```

## 人话翻译

> 用 Node 启动 `cli.ts` 这个文件；启动前先装上"翻译官"（RESOLVER_URL）；把你敲的其他参数（--version、--help 等）转交给 cli.ts。

## 逐段拆

### `node` —— 启动 Node.js

Pi 是用 TypeScript/JavaScript 写的，运行它需要 Node。

### `--import "$RESOLVER_URL"` —— 开跑前先装翻译官

`--import` 的意思：**在跑主程序之前，先加载这个模块**。

这里加载的是 `source-resolver.ts`，它负责把 `@earendil-works/xxx` 这种包名指到**源码**而不是旧的编译产物。

```bash
# 你可以感受一下 --import 是什么
# 先不装翻译官，直接跑一个简单的
node --import "$(node -p 'require("node:url").pathToFileURL(process.argv[1]).href' "/tmp/随便.ts")" -p '1+1' 2>/dev/null || echo "需要真的 TS 文件"
```

不用纠结这个实验，记住：**`--import A B` = 先执行 A，再执行 B**。

### `"$SCRIPT_DIR/packages/coding-agent/src/cli.ts"` —— 主程序

这是 Pi 的入口文件，全文只有 5 行：

```ts
#!/usr/bin/env node
import { setupCli } from "./cli/setup.ts";
import { main } from "./main.ts";

setupCli();
main(process.argv.slice(2));
```

人话：

1. `setupCli()` —— 装好命令行界面（--help、--version 这些选项是谁解析的）
2. `main(...)` —— 真正开始干活
3. `process.argv.slice(2)` —— 取出传给 Pi 的参数

### `process.argv.slice(2)` 是什么

Node 里 `process.argv` 是参数列表：

```
argv[0] = node 程序自己
argv[1] = 正在跑的脚本
argv[2] 开始 = 用户敲的参数
```

`slice(2)` 就是"从第 3 个开始都要"。你敲的 `--version` 就是从这里进到 Pi 内部的。

```bash
# 实验
node -p 'process.argv.slice(2)' a b c
# 输出：[ 'a', 'b', 'c' ]
```

### `${ARGS[@]+"${ARGS[@]}"}` —— 安全地转交参数筐

第 04 篇留下的坑，现在填。

- `ARGS[@]` = 数组里的所有参数
- 外面那层 `${ARGS[@]+...}` 的意思是：**只有当数组存在且非空时，才展开它**

为什么要这么绕？因为老版本 bash 遇到空数组 + `set -u`（第 02 篇的保险丝！）会报错 "unbound variable"。

```bash
# 实验：空数组 + set -u 的坑
bash -u -c 'ARGS=(); echo "${ARGS[@]}"' 2>&1 | head -1
# 某些 bash 版本报错

bash -u -c 'ARGS=(); echo "${ARGS[@]+${ARGS[@]}}"; echo 活着'
# 输出：活着    ← 空数组也不炸
```

这就是"保险丝 -u"和"空数组"打架时，`${var+...}` 是标准的劝架姿势。

## 完整串起来：一次 `./pi-test.sh --version` 的旅程

```
你敲: ~/Zcode/pi-study/pi/pi-test.sh --version
  ↓ shebang: 用 bash 执行
  ↓ set -euo pipefail: 插上三根保险丝
  ↓ SCRIPT_DIR = /Users/xiaenping/Zcode/pi-study/pi
  ↓ 循环参数: "--version" 不是 --no-env → 放进 ARGS
  ↓ NO_ENV=false → 跳过 unset 那 50 行
  ↓ RESOLVER_URL = file:///...source-resolver.ts
  ↓ node --import 翻译官 cli.ts --version
       ↓ setupCli() 认识 --version
       ↓ main() 打印 1.5.2 退出
你看到: 1.5.2
```

## 本篇自检

- [ ] 我知道最后一行是"启动 cli.ts 并转交参数"
- [ ] 我知道 --import 是"先装翻译官再跑主程序"
- [ ] 我知道 cli.ts 只有 5 行，真正的逻辑在 setupCli 和 main
- [ ] 我能从头到尾复述 --version 的旅程

上一篇：[06 RESOLVER_URL](./06-resolver-url) · 下一篇：[08 动手实验](./08-hands-on) →
