# Shell 脚本支线 · 首页

> 目标：读完这 9 篇，你能**逐块讲清楚** `pi/pi-test.sh` 这个 85 行文件每一部分在干什么，并且顺手学会读大多数 shell 脚本的基本功。
>
> 不需要编程基础。每篇都给你**现在就能在终端敲**的例子。

## 为什么从这一个文件开始

你运行 Pi 用的命令就是它：

```bash
~/Zcode/pi-study/pi/pi-test.sh
```

它是你和 Pi 源码之间的**第一扇门**。读懂它，你就明白了：

- 为什么不用 `npm run build` 也能跑 TypeScript 源码
- `--no-env` 是怎么工作的
- 脚本怎么在「任何目录」都能找到自己的文件
- `$()`、`"$@"`、`unset` 这些天书符号到底是什么

## 怎么学

1. 打开两个窗口：一个看文档，一个开终端敲例子。
2. 例子都很小，敲完看输出，猜 → 验证。
3. 别复制粘贴一大段就跑，**一行一行敲**，看每一步输出什么。

## 目录

| 篇 | 内容 | 你将学会 |
|---|---|---|
| [01](./01-what-is-pi-test-sh) | pi-test.sh 是干什么的 | 文件全貌、怎么运行 |
| [02](./02-shebang-and-set) | 第一行与三根保险丝 | shebang、`set -euo pipefail` |
| [03](./03-script-dir) | 脚本怎么知道自己在哪 | `SCRIPT_DIR` 那一行天书 |
| [04](./04-args-and-no-env) | 认参数 | `for`、`"$@"`、数组 |
| [05](./05-unset-api-keys) | unset API key | 环境变量、`unset` |
| [06](./06-resolver-url) | 路径变 URL | `node -p`、`pathToFileURL` |
| [07](./07-last-line-node) | 最后一行启动 Pi | `node --import`、cli.ts |
| [08](./08-hands-on) | 动手实验 | 往脚本里加自己的 `echo` |
| [09](./09-faq) | 自检与常见问题 | 报错自查 |

## 原文件位置

```
~/Zcode/pi-study/pi/pi-test.sh
```

改实验时**不要改这个原文件**（它是只读学习仓库）。第 08 篇会教你怎么复制一份到 examples/ 里改。
