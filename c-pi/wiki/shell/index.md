# pi-test.sh 陪读教程 · 课程首页

> 只围绕一个文件：`~/Zcode/pi-study/pi/pi-test.sh`，85 行。
> 这门课把它拆成 7 讲，每一讲只啃一小块，每一块都有**现在就能在终端敲**的例子。
> 零基础、非程序员友好：不懂的符号逐个拆，敲完看输出再往下滑。

## 这个文件到底是干什么的

一句话：**它是一个"一键启动按钮"**。你敲 `./pi-test.sh`，它负责把 Pi 的 TypeScript 源码直接跑起来，不需要先编译。

Pi 是用 TypeScript 写的，平时 TypeScript 要先"翻译"成 JavaScript 才能跑（叫构建，很慢）。但新版 Node（你的机器是 24.20）有个新本事：遇到 TS 文件，把类型标注剥掉直接跑。

`pi-test.sh` 就是利用这个本事，让你改完源码立刻能跑。**学习阶段你启动 Pi 用的就是它。**

> 类比：构建 = 先把菜全部做完装盒再吃；pi-test.sh = 边做边吃。

### 先会用（原理后面讲）

```bash
~/Zcode/pi-study/pi/pi-test.sh --version    # 输出 1.5.2
~/Zcode/pi-study/pi/pi-test.sh --help       # 看帮助
~/Zcode/pi-study/pi/pi-test.sh --no-env     # 假装没有 API key 启动
```

### 它不是什么

- 名字里的 `test` 不是"跑测试"，是"试试跑源码"（跑测试的是 `./test.sh`）
- 不是安装器，不装任何东西

## 课程目录（7 讲）

| 讲 | 标题 | 啃哪一块 |
|---|---|---|
| [第 1 讲](./01-opening-lines) | 开头两行 | shebang 与三根保险丝 |
| [第 2 讲](./02-find-home) | 找到自己的家 | SCRIPT_DIR 天书 |
| [第 3 讲](./03-collect-args) | 收参数与分拣 | for 循环、`"$@"`、数组 |
| [第 4 讲](./04-noenv-env) | --no-env 与环境变量 | unset 几十个 key |
| [第 5 讲](./05-path-to-url) | 把地址翻译成网址 | RESOLVER_URL |
| [第 6 讲](./06-launch) | 点火发射 | 最后一行 node --import |
| [第 7 讲](./07-graduation) | 毕业总结 | 动手实验 + 自检 + 报错排查 |

## 怎么学

1. 两个窗口：一个看文档，一个开终端敲。
2. 例子很小，**一行一行敲**，猜 → 验证。
3. 原文件不要改（只读学习仓库）。想改着玩，第 7 讲教你复制到 `examples/shell-lab/`。

→ 准备好了？[第 1 讲 · 开头两行](./01-opening-lines)
