# 第 3 讲 · 收参数与分拣

这一讲讲脚本里第一段"真正的逻辑"（原文件第 11–21 行）：把 `--no-env` 从一堆参数里挑出来。

```bash
NO_ENV=false
ARGS=()
for arg in "$@"; do
  if [[ "$arg" == "--no-env" ]]; then
    NO_ENV=true
  else
    ARGS+=("$arg")
  fi
done
```

## 它在干什么（人话）

你敲的命令后面可以跟一堆参数，比如：

```bash
./pi-test.sh --no-env --version
```

`--no-env` 是**这个脚本自己发明的开关**，Pi 本体不认识。所以脚本要：

1. 一个一个检查参数
2. 看到 `--no-env` → 记下「用户不想带 API key」，**不给 Pi 传**
3. 其他参数 → 原样转交给 Pi

这是一个"过滤+转发"的小闸门。

## 逐个符号拆

### `"$@"` —— 用户敲的所有参数

`$@` 是"全部参数"。加双引号 `"$@"` 是把每个参数**当成独立的一个词**，参数里带空格也不拆散。

```bash
# 实验：写一个小脚本看 $@
cat > /tmp/show-args.sh << 'EOF'
#!/usr/bin/env bash
echo "一共 $# 个参数"
for arg in "$@"; do
  echo "参数: [$arg]"
done
EOF
chmod +x /tmp/show-args.sh
/tmp/show-args.sh hello "hello world" --no-env
# 输出：
# 一共 3 个参数
# 参数: [hello]
# 参数: [hello world]     ← 引号保住了空格
# 参数: [--no-env]
```

### `for arg in ...; do ... done` —— 排队一个个处理

和"把购物车里的东西一件件拿出来看"一个意思。

### `if [[ "$arg" == "--no-env" ]]; then` —— 是不是那个特殊开关？

`[[ ]]` 是 bash 的判断框，`==` 是"等于"。

### `NO_ENV=false` / `NO_ENV=true` —— 立个牌子

先默认"没开"，看到 `--no-env` 就把牌子翻过来。**等号两边不能有空格**，这是 shell 的规矩。

```bash
NAME=小明
echo "你好 $NAME"

# 错误示范（有空格会被当成执行命令）
# NAME = 小明   ← 报错 command not found
```

### `ARGS=()` 和 `ARGS+=("$arg")` —— 一个能装很多东西的筐

`ARGS=()` 是空数组；`+=` 是往里再放一个。

```bash
FRUITS=()
FRUITS+=("苹果")
FRUITS+=("香蕉")
echo "筐里有 ${FRUITS[@]}，共 ${#FRUITS[@]} 个"
# 输出：筐里有 苹果 香蕉，共 2 个
```

## 用 Pi 亲自验证

```bash
~/Zcode/pi-study/pi/pi-test.sh --no-env --version
# 先打印 Running without API keys...，然后输出 1.5.2
# --version 照常收到 —— 它被放进了 ARGS 筐转交给了 Pi
# 而 --no-env 没有出现在 Pi 的世界里
```

## 最后一行里的 `${ARGS[@]+"${ARGS[@]}"}` 是什么鬼

先不深究（第 6 讲再讲），只说人话：

> 筐里有东西就把筐里的都递给 Pi；筐是空的就当什么都没传。**专门防"空数组在老旧 bash 里变成一个空字符串参数"的坑。**

## 本讲自检

- [ ] 我知道 `--no-env` 是脚本吃的，不会传给 Pi
- [ ] 我敲过 show-args.sh，看到 "hello world" 没被拆开
- [ ] 我知道 `ARGS+=()` 是往数组里加东西

← [第 2 讲](./02-find-home) · [第 4 讲 · --no-env 与环境变量](./04-noenv-env) →
