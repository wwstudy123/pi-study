# 第 5 讲 · 把地址翻译成网址

这一讲讲倒数第二行，也是最容易懵的一行：

```bash
RESOLVER_URL="$(node -p 'require("node:url").pathToFileURL(process.argv[1]).href' "$SCRIPT_DIR/packages/coding-agent/src/experimental/source-resolver.ts")"
```

## 它在干什么（人话）

把一个**文件路径**变成 **file:// 开头的网址**。

```
输入: /Users/xiaenping/Zcode/pi-study/pi/packages/coding-agent/src/experimental/source-resolver.ts
输出: file:///Users/xiaenping/Zcode/pi-study/pi/packages/coding-agent/src/experimental/source-resolver.ts
```

为什么多此一举？下一行 `node --import` 只吃 URL，不吃普通路径——尤其路径里带 `#`、`?`、`%` 或空格时会出乱子。脚本注释也写了这件事。

## 先看 node -p 是什么

`node -p '表达式'` = 让 Node 算一个表达式，把结果打印出来。像一个小计算器。

```bash
node -p '1 + 1'
# 输出：2

node -p 'process.argv'
# 输出：[ '/usr/local/bin/node' ]   ← argv 是"命令行参数列表"
```

`process.argv[1]` 在 `-p` 模式下是**紧跟在脚本后面的那个参数**：

```bash
node -p 'process.argv[1]' hello
# 输出：hello

node -p 'process.argv[1]' "/Users/xiaenping/Zcode/pi-study/pi/pi-test.sh"
# 输出：/Users/xiaenping/Zcode/pi-study/pi/pi-test.sh
```

## 再看 pathToFileURL

```bash
node -p 'require("node:url").pathToFileURL(process.argv[1]).href' "/Users/xiaenping/Zcode/pi-study/pi/pi-test.sh"
# 输出：file:///Users/xiaenping/Zcode/pi-study/pi/pi-test.sh
```

`require("node:url")` 是借用 Node 自带的"网址工具箱"；`.href` 是取出完整网址字符串。

### 为什么必须转？做个带 # 的实验

`#` 在网址里叫"锚点"，Node 看到 `--import /path/有#的文件.ts` 会把 `#` 后面当成锚点，文件就找不到了。

```bash
# 实验：建一个带 # 的目录
mkdir -p "/tmp/有#号 目录"
echo 'console.log("ok")' > "/tmp/有#号 目录/a.mjs"

# 直接用路径（可能出问题）
node --import "/tmp/有#号 目录/a.mjs" -p '1' 2>&1 | head -2

# 转 URL 再用
node --import "$(node -p 'require("node:url").pathToFileURL(process.argv[1]).href' "/tmp/有#号 目录/a.mjs")" -p '1'
# 输出：1    ← 稳了
```

## 那 source-resolver.ts 是干嘛的

被转 URL 的这个文件是 Pi 写的一个"翻译官"：

> Node 原生能剥 TypeScript 类型，但**看不懂 tsconfig.json 里的别名**（比如 `@earendil-works/pi-ai` 应该去哪个源码文件）。这个翻译官在启动时把这些别名挂上，保证代码引用的是**新鲜的源码**，而不是之前编译出来的旧 `dist` 产物。

现在不用读懂它全部 87 行，只要记住：**它是让"源码直跑"不出错的助手**。第 6 讲会用到它。

## 整行读法（由内向外）

```
1. "$SCRIPT_DIR/packages/.../source-resolver.ts"   → 这个助手的文件路径
2. node -p '...pathToFileURL(process.argv[1]).href' 那个路径
   → 让 Node 把路径转成 file:// 网址并打印
3. $( ) 把打印结果存进 RESOLVER_URL
```

## 你现在就能验证 RESOLVER_URL 的值

```bash
SCRIPT_DIR="/Users/xiaenping/Zcode/pi-study/pi"
RESOLVER_URL="$(node -p 'require("node:url").pathToFileURL(process.argv[1]).href' "$SCRIPT_DIR/packages/coding-agent/src/experimental/source-resolver.ts")"
echo "$RESOLVER_URL"
# 输出：file:///...source-resolver.ts
```

## 本讲自检

- [ ] 我知道这行是把路径变成 file:// 网址
- [ ] 我知道为什么要转（# ? % 空格 会把路径搞坏）
- [ ] 我知道 source-resolver.ts 是"源码别名翻译官"

← [第 4 讲](./04-noenv-env) · [第 6 讲 · 点火发射](./06-launch) →
