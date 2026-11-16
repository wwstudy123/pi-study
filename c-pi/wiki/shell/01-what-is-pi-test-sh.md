# 01 · pi-test.sh 是干什么的

一句话：**它是一个"一键启动按钮"**。你敲 `./pi-test.sh`，它负责把 Pi 的 TypeScript 源码直接跑起来，不需要先编译。

## 先看全文（别怕，后面逐块拆）

打开终端：

```bash
cat ~/Zcode/pi-study/pi/pi-test.sh
```

或者用编辑器打开这个文件。总共 85 行，其中 50 多行是在"扔掉 API key"，**真正干活的逻辑不到 20 行**。

## 它解决了什么问题

Pi 这个项目是用 TypeScript 写的。浏览器和 Node 平时只认 JavaScript，TypeScript 需要先用编译器"翻译"成 JS 才能跑——这一步叫**构建**，很慢。

但新版 Node（22.19+，你的机器是 24.20）有个新本事：**遇到 TypeScript 文件，把类型标注剥掉，直接当 JavaScript 跑**。

`pi-test.sh` 就是利用这个本事，让你改完源码立刻能跑，不用等编译。这对学习太重要了——你随时可以打开源码加一行 `console.log`，马上看到效果。

> 类比：构建 = 先把菜全部做完装盒再吃；pi-test.sh = 边做边吃。

## 三种用法（先会用，再懂原理）

```bash
# 用法 1：看版本号
~/Zcode/pi-study/pi/pi-test.sh --version
# 输出：1.5.2

# 用法 2：看帮助
~/Zcode/pi-study/pi/pi-test.sh --help

# 用法 3：正常启动 Pi（进入聊天界面）
cd ~/Zcode/pi-playground
~/Zcode/pi-study/pi/pi-test.sh

# 用法 4：假装自己没有 API key（排查用）
~/Zcode/pi-study/pi/pi-test.sh --no-env
```

`--no-env` 是这个脚本自己认的特殊参数，Pi 本体不认识它——脚本会把它**吃掉**，不传给 Pi。这是第 04 篇的内容。

## 它不是什么

- 不是测试脚本。名字里的 `test` 是"试试跑源码"的意思，不是跑单元测试（单元测试是 `./test.sh`）。
- 不是安装器。它不装任何东西。
- 不是只有开发者才能用。你学习阶段就用它启动 Pi。

## 本篇自检

- [ ] 我知道 pi-test.sh 在哪个路径
- [ ] 我跑通了 `--version`，输出 1.5.2
- [ ] 我能用一句话告诉别人这个文件干嘛的

下一篇：[第一行与三根保险丝](./02-shebang-and-set) →
