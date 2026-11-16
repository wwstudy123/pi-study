# 第 1 讲 · 开头两行

这一讲只讲脚本最上面的两行。别小看它们，几乎所有 bash 脚本都长这样。

```bash
#!/usr/bin/env bash
set -euo pipefail
```

## 第一行：#!/usr/bin/env bash

这行叫 **shebang**（读 "sha-bang"），作用是告诉 macOS：「**用 bash 来执行我这个文件**」。

### 为什么不直接写 /bin/bash？

`/usr/bin/env bash` 的意思是「在我 PATH 里找 bash」。这样脚本在 bash 装在不同位置的系统（比如某些 Linux）也能跑。

### 你现在就能验证

```bash
which bash
# 通常输出 /bin/bash 或 /opt/homebrew/bin/bash

# 模拟 shebang：让系统用 bash 执行一条命令
/usr/bin/env bash -c 'echo hello from bash'
```

### 小实验：没有 shebang 会怎样？

```bash
printf 'echo hi\n' > /tmp/no-shebang.sh
chmod +x /tmp/no-shebang.sh
/tmp/no-shebang.sh
# 也能输出 hi —— 因为 macOS 会用当前 shell 兜底
# 但换个环境可能就挂了，所以好脚本一定写 shebang
```

## 第二行：set -euo pipefail

这是**三根保险丝**，一次性全插上。逐个拆：

### 保险丝 1：-e（出错就停）

默认情况下，bash 里一条命令失败了，**后面照跑**。加上 `-e`，任何一条命令失败，整个脚本立刻退出。

```bash
# 实验：不加 -e
bash -c 'mkdir /需要管理员才能建的目录 2>/dev/null; echo "我还活着"'
# 输出：我还活着   ← 前面失败了也继续

# 实验：加 -e
bash -e -c 'mkdir /需要管理员才能建的目录 2>/dev/null; echo "你还看得到我吗"'
# 不会输出第二句 —— 已经退出了
```

**Pi 为什么要在意**：如果"找到源码"这步失败了，就别再往下启动 Node 了，免得跑了一个错误的旧版本。

### 保险丝 2：-u（用了没定义的变量就报错）

```bash
# 实验：不加 -u
bash -c 'echo "你好 $whoami2"'
# 输出：你好    ← 变量不存在，悄悄变成空字符串，很难查

# 实验：加 -u
bash -u -c 'echo "你好 $whoami2"'
# 报错：whoami2: unbound variable
```

**Pi 为什么要在意**：后面用到 `NO_ENV`、`ARGS` 这些变量，哪步忘了赋值，宁可当场报错，也不要悄悄用空值继续。

### 保险丝 3：-o pipefail（管道里任何一环失败都算失败）

管道 `|` 就是把前一个命令的输出接到后一个命令。

```bash
# 实验：中间一环失败
bash -c 'ls /不存在的目录 2>/dev/null | wc -l; echo 退出码:$?'
# 输出：退出码:0   ← wc 成功了，bash 就当整条管道成功，骗你了

bash -o pipefail -c 'ls /不存在的目录 2>/dev/null | wc -l; echo 退出码:$?'
# 输出：退出码:非0   ← ls 失败，整条管道算失败
```

### 合起来

```bash
set -euo pipefail
# 读作：出错就停 + 用错变量就炸 + 管道谁挂谁负责
```

这是写"正经脚本"的标配开头，很多开源项目里都能看到。

## 本讲自检

- [ ] 我知道 shebang 是给系统看的「用什么解释器」
- [ ] 我能说出 -e / -u / pipefail 分别防什么
- [ ] 我敲过上面三个小实验

← [课程首页](./index) · [第 2 讲 · 找到自己的家](./02-find-home) →
