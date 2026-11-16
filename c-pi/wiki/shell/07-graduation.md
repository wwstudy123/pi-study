# 第 7 讲 · 毕业总结

> 恭喜走到这。这一讲三件事：**动手实验**（改一份副本）、**自检 7 问**、**常见报错排查**。做完这些，这个文件就是你的了。

## 一、毕业实验：改一份副本

规矩：**不改原文件** `~/Zcode/pi-study/pi/pi-test.sh`（只读学习仓库）。复制一份到实验场：

```bash
mkdir -p ~/Zcode/pi-study/examples/shell-lab
cp ~/Zcode/pi-study/pi/pi-test.sh ~/Zcode/pi-study/examples/shell-lab/my-pi-test.sh
chmod +x ~/Zcode/pi-study/examples/shell-lab/my-pi-test.sh
```

> `chmod +x` = 加"可执行"权限，不然报 permission denied。

### 实验 1：开头打一句"我要开工了"

在 `set -euo pipefail` 下面加：

```bash
echo "【实验】脚本开始执行，当前目录是 $(pwd)"
```

```bash
cd ~/Zcode/pi-playground     # 故意换个目录
~/Zcode/pi-study/examples/shell-lab/my-pi-test.sh --version
# 当前目录是 pi-playground 不是 pi/
# → 亲眼验证第 2 讲：为什么需要 SCRIPT_DIR
```

### 实验 2：把 SCRIPT_DIR 和参数都打印出来

在 `SCRIPT_DIR=...` 后面加：

```bash
echo "【实验】SCRIPT_DIR = $SCRIPT_DIR"
echo "【实验】用户敲了 $# 个参数: $*"
```

跑 `--no-env --version` 观察：`--no-env` 也算一个参数，但 Pi 收到的只有 `--version`。

### 实验 3：看 NO_ENV 开关怎么翻转

在 `for` 循环结束后加：

```bash
echo "【实验】NO_ENV = $NO_ENV，ARGS 筐里 = ${ARGS[*]-空}"
```

分别带 / 不带 `--no-env` 跑，对比输出。

### 实验 4：亲手体验 set -e

临时在脚本最上面加一句会失败的命令：

```bash
ls /这个目录不存在
```

再运行——**根本走不到后面的启动**，直接退出。这就是第 1 讲的 `-e`。看完删掉。

### 实验 5：不加引号会怎样

把 `echo "$SCRIPT_DIR"` 改成 `echo $SCRIPT_DIR`，造一个带空格的路径感受区别：

```bash
mkdir -p "/tmp/有 空格 的目录"
SCRIPT_DIR="/tmp/有 空格 的目录"
echo $SCRIPT_DIR       # 看不出问题
echo "[$SCRIPT_DIR]"   # 加方括号就看出有没有被拆
```

### 实验 6：用调试模式看每一步

不改一行代码，看脚本内部每一步展开成什么：

```bash
bash -x ~/Zcode/pi-study/pi/pi-test.sh --version 2>&1 | head -40
# -x 是 bash 自带的"逐行展开"调试器，学习神器
```

### 收尾：确认没弄脏原仓库

```bash
cd ~/Zcode/pi-study/pi && git status --short   # 应该什么都不输出
cd ~/Zcode/pi-study && git status --short      # examples/ 有新文件，正常
```

玩坏了就重新复制一份。

## 二、自检 7 问（不看原文回答）

| 问题 | 对应讲 |
|---|---|
| 这个文件的一句话作用？ | [课程首页](./index) |
| `#!/usr/bin/env bash` 给谁看？ | [第 1 讲](./01-opening-lines) |
| `set -euo pipefail` 三根保险丝分别防什么？ | [第 1 讲](./01-opening-lines) |
| 为什么需要 SCRIPT_DIR？天书怎么由内向外读？ | [第 2 讲](./02-find-home) |
| `--no-env` 谁吃掉了？会传给 Pi 吗？ | [第 3 讲](./03-collect-args) |
| unset 那 50 行什么时候才执行？会影响你终端吗？ | [第 4 讲](./04-noenv-env) |
| 为什么要 pathToFileURL？最后一行启动哪个文件？ | [第 5 讲](./05-path-to-url) / [第 6 讲](./06-launch) |

**终极测试**：合上文档，把这 85 行分成 5 块讲给另一个人听——

1. 开工仪式（shebang + 保险丝）
2. 找到自己住哪（SCRIPT_DIR）
3. 收发室（挑出 --no-env，其余装筐）
4. 大扫除（按需 unset 几十个 key）
5. 发车（路径变 URL → node --import 跑 cli.ts）

讲得通就是真懂了。

## 三、常见报错排查

| 现象 | 原因 | 解决 |
|---|---|---|
| `Permission denied` | 文件没有执行权限 | `chmod +x 脚本路径`，或 `bash 脚本路径` |
| `command not found: node` | Node 没装或不在 PATH | `node -v` 检查，Pi 要求 ≥ 22.19 |
| 改了 pi/ 里的原文件，git 变脏 | 忘了用副本 | `cd pi && git checkout -- pi-test.sh` 丢弃修改 |
| `--no-env` 没生效 | 写成了 `--no-env=1` 或 `-no-env` | 只认完整的 `--no-env` |
| 想看每一步变量值 | 别猜 | 加 echo（实验 2）或 `bash -x`（实验 6） |

## 毕业去向

这个文件你已经吃透了。它最后一行启动的 `cli.ts`，就是主线复刻路线（`docs/roadmap.md`）的终点站。接下来：

- 回**主线文档**（`npm run dev:docs`，端口 5173）继续复刻课表
- 以后读到 Node 模块解析 → 开 `wiki/node-cli/` 支线
- 读到 TUI 渲染 → 开 `wiki/tui/` 支线

← [第 6 讲 · 点火发射](./06-launch) · [支线首页](/)
