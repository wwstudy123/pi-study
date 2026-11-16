# 05 · unset：把 API key 全部扔掉

这一篇讲脚本里最长的一段（第 23–80 行左右）。看着吓人，其实**就一句话**：

> 如果用户加了 `--no-env`，就把几十个 API key 环境变量全部清空。

## 先搞懂什么是环境变量

环境变量就是**操作系统给每个程序带的小纸条**。你 `export` 一下，当前终端里之后启动的程序都能看到。

```bash
# 实验：造一个环境变量
export MY_SNACK="薯片"
echo "我带了 $MY_SNACK"
# 输出：我带了 薯片

# 再开一个程序（bash -c 相当于新起一个程序），它也能看到
bash -c 'echo "子程序也拿到了 $MY_SNACK"'

# unset 就是把纸条撕掉
unset MY_SNACK
echo "现在看看: [$MY_SNACK]"
# 输出：现在看看: []    ← 空了
```

## 为什么要扔 API key

Pi 支持几十家 AI 供应商。如果你的终端里 export 过 `OPENAI_API_KEY`、`DEEPSEEK_API_KEY` 之类的，Pi 启动时会自动捡起来用。

`--no-env` 的意思是：**假装这些 key 都不存在**，用来测试「一个全新用户第一次打开 Pi」是什么体验。

这就是为什么脚本里有一大排：

```bash
if [[ "$NO_ENV" == "true" ]]; then
  unset ANTHROPIC_API_KEY
  unset ANTHROPIC_OAUTH_TOKEN
  unset OPENAI_API_KEY
  unset GEMINI_API_KEY
  # …… 几十行，把 Pi 认识的 key 全列了一遍
  echo "Running without API keys..."
fi
```

只有 `NO_ENV=true` 时才执行这一坨。平时启动，这块直接跳过。

## 你现在就能验证

```bash
# 1. 造一个假 key
export DEEPSEEK_API_KEY=fake-key-for-test

# 2. 确认 Pi 能看到它（用 print 模式问一下，或者先跳过）
# 3. 用 --no-env 启动，看它打印什么
~/Zcode/pi-study/pi/pi-test.sh --no-env --version
# 应该先输出：Running without API keys...
# 然后输出：1.5.2

# 4. 关键验证：--no-env 只在 Pi 进程里 unset，不影响你终端
echo "终端里还有吗: [$DEEPSEEK_API_KEY]"
# 输出：终端里还有吗: [fake-key-for-test]   ← 你的终端没被破坏！
```

> 学习点：`unset` 只影响**脚本自己和它启动的子进程**（也就是 Pi），不会动你当前终端的变量。这是进程隔离，后面学 Node 时还会遇到同样的概念。

## 这一大排名单是从哪抄来的

脚本注释写着：

```
# Unset API keys (see packages/ai/src/env-api-keys.ts)
```

也就是说名单和 `packages/ai/src/env-api-keys.ts` 保持同步。以后学 ai 包时你会看到同一份名单在 TypeScript 里也有一份。

## 本篇自检

- [ ] 我会 export、echo、unset 三连
- [ ] 我知道 --no-env 是"假装没 key"，不是"删掉我的 key"
- [ ] 我知道 unset 只影响 Pi 进程，不影响我的终端

上一篇：[04 认参数](./04-args-and-no-env) · 下一篇：[06 路径变 URL](./06-resolver-url) →
