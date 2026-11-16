# 第 2 讲 · 找到自己的家

这一讲讲第三行，也是第一个「天书」：

```bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
```

## 它在干什么

**把「这个脚本文件所在的文件夹的绝对路径」存进变量 `SCRIPT_DIR`**。

后面所有找源码的动作都基于它，比如：

```
$SCRIPT_DIR/packages/coding-agent/src/cli.ts
```

## 为什么要这么麻烦

因为你可能在**任何目录**下运行它：

```bash
cd ~/Zcode/pi-playground
~/Zcode/pi-study/pi/pi-test.sh
```

此时脚本内部的"当前目录"是 `pi-playground`，不是 `pi/`。如果脚本写死 `packages/coding-agent/...`，就找不到了。所以要先算出自己住在哪。

## 把天书拆成 4 层（由内向外）

### 第 1 层：`${BASH_SOURCE[0]}` —— 脚本自己的文件路径

就是 `pi-test.sh` 这个文件，可能是相对路径也可能是绝对路径，取决于你怎么敲的。

> 为什么不用 `$0`？`$0` 在被 `source` 引入时会是别的文件。`BASH_SOURCE[0]` 更可靠，这是踩过坑的标准写法。

### 第 2 层：`dirname` —— 去掉文件名，留目录

```bash
dirname /Users/xiaenping/Zcode/pi-study/pi/pi-test.sh
# 输出：/Users/xiaenping/Zcode/pi-study/pi

dirname pi-test.sh
# 输出：.     ← 相对路径时只给一个点（当前目录），不够用！
```

看到没？用户用相对路径运行时，`dirname` 只给 `.`，后面就找不到文件了。所以要继续包一层。

### 第 3 层：`cd ... && pwd` —— 进去再问绝对路径

```bash
cd /Users/xiaenping/Zcode/pi-study/pi && pwd
# 输出：/Users/xiaenping/Zcode/pi-study/pi   ← 绝对路径，稳了
```

`&&` 的意思：前面 cd 成功了才执行 pwd。

### 第 4 层：`$( )` —— 把命令的输出当值用

`$(命令)` 叫**命令替换**：先跑里面的命令，把打印出来的文字填进当前位置。

```bash
echo "今天是 $(date)"
NOW=$(date)
echo "存下来的时间: $NOW"
```

所以整行读法（由内向外）：

```
1. BASH_SOURCE[0]          → "pi-test.sh" 或者你敲的路径
2. dirname 那个路径        → 脚本所在的目录（可能是 . ）
3. cd 进去 && pwd          → 拿到绝对路径
4. $( ) 存进 SCRIPT_DIR    → 以后都用这个变量
```

### 最外面的双引号

路径里有**空格**（比如 `/Applications/My Files/`）时，没有引号会被拆成两个词。**路径永远加引号**，保命习惯。

## 你现在就能做的实验

```bash
# 原样照抄脚本里那行，直接在终端跑
SCRIPT_DIR="$(cd "$(dirname "/Users/xiaenping/Zcode/pi-study/pi/pi-test.sh")" && pwd)"
echo "$SCRIPT_DIR"
# 输出：/Users/xiaenping/Zcode/pi-study/pi

# 验证后面真的能基于它找到源码
ls "$SCRIPT_DIR/packages/coding-agent/src/cli.ts"
```

## 本讲自检

- [ ] 我能说出为什么要 SCRIPT_DIR（因为可能在别的目录启动）
- [ ] 我知道 `$( )` 是"先跑命令，拿输出当值"
- [ ] 我知道 `dirname` 遇到相对路径会返回 `.`，所以要 cd + pwd

← [第 1 讲](./01-opening-lines) · [第 3 讲 · 收参数与分拣](./03-collect-args) →
