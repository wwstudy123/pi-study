# 08 · 动手实验（改脚本）

> 规矩：**不改原文件** `~/Zcode/pi-study/pi/pi-test.sh`。我们复制一份到 `examples/` 里玩。
>
> 原仓库是只读学习对象，改了会污染 git 状态。

## 准备实验目录

```bash
mkdir -p ~/Zcode/pi-study/examples/shell-lab
cp ~/Zcode/pi-study/pi/pi-test.sh ~/Zcode/pi-study/examples/shell-lab/my-pi-test.sh
chmod +x ~/Zcode/pi-study/examples/shell-lab/my-pi-test.sh
```

> `chmod +x` = 给文件加"可执行"权限，不然敲 `./my-pi-test.sh` 会报 permission denied。

## 实验 1：在开头打一句"我要开工了"

用任何编辑器打开 `my-pi-test.sh`，在 `set -euo pipefail` 下面加一行：

```bash
echo "【实验】脚本开始执行，当前目录是 $(pwd)"
```

运行：

```bash
cd ~/Zcode/pi-playground     # 故意换个目录
~/Zcode/pi-study/examples/shell-lab/my-pi-test.sh --version
# 应该先看到【实验】那行，而且当前目录是 pi-playground 不是 pi/
# 这就验证了第 03 篇：为什么需要 SCRIPT_DIR
```

## 实验 2：把 SCRIPT_DIR 和参数都打印出来

在 `SCRIPT_DIR=...` 那行后面加：

```bash
echo "【实验】SCRIPT_DIR = $SCRIPT_DIR"
echo "【实验】用户敲了 $# 个参数: $*"
```

运行：

```bash
~/Zcode/pi-study/examples/shell-lab/my-pi-test.sh --no-env --version
# 观察：--no-env 也算一个参数（$# 会包含它）
# 但后面 Pi 收到的只有 --version
```

## 实验 3：看 NO_ENV 开关怎么翻转

在 `for` 循环结束后加：

```bash
echo "【实验】NO_ENV = $NO_ENV，ARGS 筐里 = ${ARGS[*]-空}"
```

分别跑：

```bash
~/Zcode/pi-study/examples/shell-lab/my-pi-test.sh --version
# NO_ENV = false

~/Zcode/pi-study/examples/shell-lab/my-pi-test.sh --no-env --version
# NO_ENV = true，且 ARGS 里没有 --no-env
```

## 实验 4：亲手体验 set -e

在脚本最上面临时加一句会失败的命令：

```bash
ls /这个目录不存在
```

再运行脚本——你会发现**根本走不到后面的启动**，直接退出了。这就是第 02 篇的 `-e`。看完记得删掉这行。

## 实验 5：不加引号会怎样

把 `echo "【实验】SCRIPT_DIR = $SCRIPT_DIR"` 改成不加引号的 `echo $SCRIPT_DIR`，一般看不出区别。但如果路径有空格就会裂开。

造一个带空格的路径感受一下：

```bash
mkdir -p "/tmp/有 空格 的目录"
SCRIPT_DIR="/tmp/有 空格 的目录"
echo $SCRIPT_DIR       # 看起来还行
echo "[$SCRIPT_DIR]"   # 加方括号就看出有没有被拆
```

## 实验 6：确认你改的是副本，原文件没脏

```bash
cd ~/Zcode/pi-study/pi
git status --short
# 应该什么都不输出（干净）

cd ~/Zcode/pi-study
git status --short
# 会看到 examples/ 下有新文件（还没提交，正常）
```

## 恢复实验环境

玩坏了就重新复制一份：

```bash
cp ~/Zcode/pi-study/pi/pi-test.sh ~/Zcode/pi-study/examples/shell-lab/my-pi-test.sh
chmod +x ~/Zcode/pi-study/examples/shell-lab/my-pi-test.sh
```

## 本篇自检

- [ ] 我复制了脚本到 examples 并改过 echo
- [ ] 我亲眼看到 SCRIPT_DIR 和当前目录不是一回事
- [ ] 我亲眼看到 --no-env 被吃掉、--version 被转交
- [ ] 我知道怎么用 git status 确认没改坏原仓库

上一篇：[07 最后一行](./07-last-line-node) · 下一篇：[09 自检](./09-faq) →
