# 09 · 自检与常见问题

## 一分钟自检：你真的读懂 pi-test.sh 了吗

不看原文，回答下面 7 个问题。答不上来就回对应的篇目。

| 问题 | 对应篇 |
|---|---|
| 这个文件的一句话作用？ | [01](./01-what-is-pi-test-sh) |
| `#!/usr/bin/env bash` 给谁看？ | [02](./02-shebang-and-set) |
| `set -euo pipefail` 三根保险丝分别防什么？ | [02](./02-shebang-and-set) |
| 为什么需要 SCRIPT_DIR？天书怎么由内向外读？ | [03](./03-script-dir) |
| `--no-env` 谁吃掉了？会传给 Pi 吗？ | [04](./04-args-and-no-env) |
| unset 那 50 行什么时候才执行？会影响你终端吗？ | [05](./05-unset-api-keys) |
| 为什么要 pathToFileURL？最后一行在启动哪个文件？ | [06](./06-resolver-url) / [07](./07-last-line-node) |

终极测试：**合上文档，用自己的话把这 85 行分成 5 块讲给另一个人类（或 AI）听**。讲得通就是真懂了。

5 块分别是：

1. 开工仪式（shebang + 保险丝）
2. 找到自己住哪（SCRIPT_DIR）
3. 收发室（挑出 --no-env，其余装筐）
4. 大扫除（按需 unset 几十个 key）
5. 发车（路径变 URL → node --import 跑 cli.ts）

## 常见报错

### permission denied

```
bash: ./pi-test.sh: Permission denied
```

文件没有执行权限。

```bash
chmod +x ~/Zcode/pi-study/pi/pi-test.sh
# 或者不改权限，直接：
bash ~/Zcode/pi-study/pi/pi-test.sh --version
```

### command not found: node

Node 没装或没进 PATH。Pi 要求 Node ≥ 22.19：

```bash
node -v
```

### 我改了 pi/ 里的 pi-test.sh，git 变脏了

```bash
cd ~/Zcode/pi-study/pi
git checkout -- pi-test.sh    # 丢弃对这个文件的修改
git status --short            # 确认干净
```

以后实验一律复制到 `examples/`。

### --no-env 没生效，还是能用到 API key

检查是不是写成了 `--no-env=1` 或 `-no-env`。只认**完整的** `--no-env`。

### 我想看每一步变量值

别猜，加 echo（第 08 篇实验 2）。或者用 bash 的调试模式：

```bash
bash -x ~/Zcode/pi-study/pi/pi-test.sh --version 2>&1 | head -40
# -x 会把每一行展开后的样子打出来，学习神器
```

## 这个文件和主线的关系

| 主线课 | 会用到本支线的什么 |
|---|---|
| 运行 Pi（run-pi.md） | 你一直在用这个脚本启动 |
| L00 monorepo 骨架 | 类似的启动脚本思路 |
| 读 cli.ts / agent loop | 最后一行启动的就是它们 |
| 以后读到 tsconfig paths / 模块解析 | 开新支线 `wiki/node-cli/` |

## 下一条支线（未开）

- `wiki/node-cli/` —— Node 模块解析、import 怎么找到文件
- `wiki/tui/` —— 终端 UI 怎么画出来的

主线读到哪、支线补到哪。不提前开，不赶进度。

← 返回 [Shell 支线首页](./index) · [支线知识库首页](/)
