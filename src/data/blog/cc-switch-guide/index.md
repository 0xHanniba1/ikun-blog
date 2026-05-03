---
title: "用 CC Switch，把 Claude Code 的模型变成可替换零件"
pubDatetime: 2026-05-02T20:47:00+08:00
description: "Claude Code 入口不变，借 CC Switch 把后端模型切成可替换零件。"
tags:
  - ai-agent
  - tooling
featured: false
---

Claude Code 的入口可以不变。

变的是后面的模型。

只要供应商提供 Anthropic 兼容接口，Claude Code 仍按原来的协议发请求，后端就可以从 Claude 切到 DeepSeek，也可以再切到 MiniMax。过去这件事要改环境变量、改 `settings.json`、重启终端。CC Switch 把这层路由收进了图形界面：选供应商，点启用，新开一个 Claude Code。

这篇只解决一个问题：怎么用 CC Switch 让 Claude Code 在不同模型之间切换，并且让协作规则不因为换模型而失控。

![三层架构总览：Claude Code 终端工具 · CC Switch 路由 · 模型供应商](./01-framework-three-layer-architecture.png)

## 先装 Claude Code

新机器优先用 native installer。

它是官方安装脚本，路径、权限、自动更新都自己处理。npm 方式也能用，但要先有 Node.js，还可能遇到全局包冲突、Node 版本不对、权限不够这些问题。除非你已经习惯用 npm 管命令行工具，否则没必要走这条路。

Mac / Linux / WSL：

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Windows PowerShell：

```powershell
irm https://claude.ai/install.ps1 | iex
```

已经在用包管理器，也可以这样装。

Mac：

```bash
brew install --cask claude-code
```

Windows：

```powershell
winget install Anthropic.ClaudeCode
```

npm 方式仍然可用：

```bash
npm install -g @anthropic-ai/claude-code
```

装完先查两件事：

```bash
claude --version
claude doctor
```

`claude --version` 看版本号。`claude doctor` 看安装方式、安装路径和环境状态。

Windows 上还要先装 Git for Windows。Claude Code 依赖 Bash，一些工具命令没有 Bash 会调不动。

![三种安装方式对比：native installer / brew·winget / npm](./02-infographic-install-methods.png)

## 再装 CC Switch

[CC Switch](https://github.com/farion1231/cc-switch) 是 farion1231 做的开源桌面应用，用来集中管理 AI 命令行工具背后的模型供应商。它不是替代 Claude Code，而是站在 Claude Code 和模型供应商之间，负责切路由。

这里只讲 Claude Code 这一种用法。

Mac 用 Homebrew tap：

```bash
brew tap farion1231/ccswitch
brew install --cask cc-switch
```

Windows 去仓库 Releases 下载。`CC-Switch-v{version}-Windows.msi` 是安装版，`CC-Switch-v{version}-Windows-Portable.zip` 是免安装版，解压就能跑。

Linux 直接下载对应包：Debian / Ubuntu 选 `.deb`，Fedora / RHEL / openSUSE 选 `.rpm`，其他发行版优先试 `.AppImage`。

Mac 版目前已经做过 Apple 签名和公证，正常情况下双击就能打开。如果系统仍然拦截，按 Releases 或 README 里的最新说明处理。

## 先跑通 DeepSeek

打开 CC Switch，点右上角橙色 `+`。预设列表里选 DeepSeek。名称、官网、请求地址会自动填好。

你唯一必须手动填的是 API Key。去 DeepSeek 官网控制台申请一个，粘进来。

认证方式、API 格式、请求地址这些字段先别动。第一次配置，按预设跑通最稳。

DeepSeek 的 Anthropic 协议入口默认是：

```text
https://api.deepseek.com/anthropic
```

注意结尾没有斜杠。

Claude Code 会把请求按 Anthropic 的格式发到这个地址。DeepSeek 接住请求，处理后再按兼容格式返回。对 Claude Code 来说，请求协议没有变；变的是后端模型。

接着看模型映射。

CC Switch 里有四个槽位：主模型 / Sonnet 默认 / Haiku 默认 / Opus 默认。如果你的目标是 DeepSeek V4 Pro，把四个槽位都填成：

```text
deepseek-v4-pro
```

为什么四个都填？

因为 Claude Code 在不同场景下可能请求不同的 Anthropic 模型名。平时可能走 Sonnet，重任务可能走 Opus。四个槽位都填同一个 model id，可以避免某次请求没有打到主模型，结果又落回旧版本或默认版本。

如果 DeepSeek 以后改了模型名，以 DeepSeek API 文档里的 model id 为准。不要按网页展示名或营销名填。

填完点右下角 `+ 添加`。

![CC Switch 添加 DeepSeek 的配置面板示意：API Key、请求地址、四个模型槽位都填 deepseek-v4-pro](./03-infographic-ccswitch-config-panel.png)

## 启用后，用新终端验证

回到 CC Switch 主界面。

鼠标悬停在目标供应商那一行，右侧会出现操作按钮。蓝色 `启用` 就是切换键。

切完后，新开一个终端窗口，启动 Claude Code：

```bash
claude --dangerously-skip-permissions
```

这个参数会跳过权限确认，只建议在你明确接受风险的本地环境使用。如果只是验证模型切换，也可以用你平时启动 Claude Code 的方式。

判断有没有切成功，最稳的方式不是问模型“你是谁”。

模型自我介绍会受系统提示词、路由配置、模型对齐策略影响，不一定准。直接看启动栏里的模型名，再对照 CC Switch 当前启用的供应商。

DeepSeek 配通后，启动栏会从默认模型变成类似：

```text
deepseek-v4-pro · API Usage Billing
```

![启用 → 新开终端 → 看 banner → 切 MiniMax 的循环流程](./04-flowchart-enable-verify-switch.png)

## 再加一个 MiniMax

MiniMax 的流程一样。

添加 MiniMax 供应商，填 API Key，启用，然后新开 Claude Code 窗口。

MiniMax 的 Anthropic 协议入口是：

```text
https://api.minimax.io/anthropic
```

模型名可以填：

```text
MiniMax-M2.7
```

这里有一个容易误判的点：切换只对新启动的 Claude Code 生效。

已经跑起来的窗口，还是用原来的模型，不会中途变。想切干净，就退出当前 Claude Code，再重新启动。

## 真正稳定体验的，是 CLAUDE.md

换模型，只是换了推理引擎。

但同一段任务交给 DeepSeek 和 MiniMax，回答风格、操作节奏、引用文件路径的方式、权限边界都可能不一样。要把这些差异压平，靠的不是继续换模型，而是把协作规则写死。

这个文件就是 `CLAUDE.md`。

Claude Code 启动时会自动读取它。我自己的全局规则放在：

```text
~/.claude/CLAUDE.md
```

里面只放不会变的硬规则：

```markdown
## 总原则

- 结论先行。不要客套，不要说"这是个好问题"
- 方案有明显问题直接指出，不要顺着我说
- 能合理推断就执行；只有不可逆、高成本，或涉及权限、数据、账号安全时才先问
- 不确定就说不确定，不要编 API、文件路径、行号或不存在的能力

## 动手前

- 先读项目规则文件：CLAUDE.md、README、package.json
- 先看 git status，不要覆盖我未提交的改动
- 大改动先给方案和影响范围，我确认后再实施

## 必须先确认的操作

- 删除已有文件、目录，或改写 git 历史
- 修改 .env、密钥、token、CI/CD、支付、账号相关配置
- git push，尤其是 --force
- 创建 commit，除非我明确要求
```

这几条比模型选择更重要。

不准编路径。动手前看 `git status`。不可逆操作必须先问。规则写死之后，模型可以换，工作流不用跟着重学。

`~/.claude/CLAUDE.md` 是全局文件，对这台机器上的所有项目生效。具体项目根目录里还可以再放一份 `CLAUDE.md`，写项目特有规则，比如架构怎么组织、变量怎么命名、测试怎么跑。

全局规则管底线。项目规则管上下文。两层叠加，模型才会像同一个助手。

![CLAUDE.md 双层叠加：全局硬规则 + 项目特有规则 = 模型可换、规则不变](./05-framework-claudemd-layered-rules.png)

## 几个容易踩坑的地方

第一，切换后一定要新开 Claude Code。旧窗口不会自动换模型。

第二，模型名填 API 文档里的 model id，不要填网页展示名。

第三，不要用“你是什么模型”当唯一验证方式。看启动栏和 CC Switch 当前启用项更可靠。

第四，先跑通预设，再改高级字段。认证方式、API 格式、请求地址这些配置，一开始越少动越好。

第五，换模型不等于换工作流。没有 `CLAUDE.md`，每个模型都会带着自己的习惯做事。

## 收尾

这套方案的关键不是“把 Claude Code 换成某个模型”。

关键是把模型从固定后端变成可替换零件。

Claude Code 负责终端入口，CC Switch 负责供应商路由，`CLAUDE.md` 负责协作规则。以后新模型出来，要改的通常只是供应商配置和 model id。工具入口不变，规则不变，后端按任务换。
