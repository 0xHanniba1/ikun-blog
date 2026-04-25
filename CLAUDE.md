# CLAUDE.md

这个文件给 Claude Code（和未来的我）看，记录这个博客的写作约定与仓库约束，避免每次都从头讨论。

## 仓库速览

- **框架**：Astro 5 + Tailwind v4（`@import "tailwindcss"`）
- **域名**：https://ikun126.com
- **部署**：Cloudflare Pages 监听 `main` 分支，push 后自动构建
- **视觉**：终端 / 代码风（米白 `#f5f2ea` + 终端绿 `#25c47b` + JetBrains Mono + Noto Sans SC），深色为「console」黑 `#15140f`
- **设计原则**：克制、单色 accent、不做花哨动画

## 命令

```bash
npm run dev        # 本地预览 http://127.0.0.1:4321
npm run build      # 构建（含 astro check 类型检查 + 图片优化）
npm run lint       # ESLint
npm run format     # Prettier 全仓格式化
```

## 文章约定

### 文件结构

每篇文章一个独立文件夹，`index.md` 是正文，图片就近放：

```
src/data/blog/<slug>/
  index.md
  image-20260425230034809.png
  其他图片.png
```

- `<slug>` 只允许 `[a-z0-9-]`，会直接成为 URL：`/posts/<slug>`
- 图片在 md 里用相对路径引用：`![](./image-xxx.png)`
- Astro 构建时会自动转 webp、做 srcset、压缩
- **绝对路径不行**（`/Users/...` / `~/...`），**绝对 URL 不参与优化**（除非确实是外链）

### Frontmatter（schema 定义在 `src/content.config.ts`）

```yaml
---
title: "文章标题"                           # 必填
pubDatetime: 2026-04-25T16:50:00+08:00     # 必填，ISO8601 + 时区
description: "一句话摘要，列表与首页 timeline 都用它。"  # 必填
tags:                                       # 可选，默认 ["others"]
  - 站务
modDatetime: 2026-04-26T10:00:00+08:00     # 可选，更新时间
featured: false                             # 可选，置顶到首页 featured 区
draft: false                                # 可选，true 则线上隐藏（dev 仍可见）
ogImage: ./cover.png                        # 可选，覆盖默认 og 图
hideEditPost: false                         # 可选，单篇隐藏 edit 链接
timezone: Asia/Shanghai                     # 可选，单篇覆盖时区
canonicalURL: https://...                   # 可选，跨站搬运用
---
```

约束：
- `title` 不要带 `|`（管道符会破坏页面 title）
- `pubDatetime` 必须含时区（`+08:00`），否则会按 UTC 解析
- `description` 控制在 60 字以内最佳，会进 OG / 时间线摘要
- `tags` 用中文短词或英文 kebab-case，二选一别混（例如 `站务`、`engineering`、`ai-agent`）
- `featured` 一般同时开 1-3 篇，超过会显得没重点

### 正文规则

- 不要写 `# 一级标题`，那是 frontmatter `title` 自动生成的
- 章节用 `## `（h2），子章节用 `### `（h3）
- 列表项里别再嵌大段段落
- 代码块用三反引号围栏 + 语言标识：`` ```bash ``、`` ```ts ``、`` ```js `` 之类
- 引用 `> `；强调用 `**粗体**`，行内代码用 `` `code` ``
- 图片优先用就近相对路径；横向截图建议先压一遍（构建会再压一次）

### 标签规范

当前在用的（看 `/tags` 页面）：
- 中文：`站务`（关于博客本身的事）、`思考`、`阅读`、`生活`
- 英文 kebab：`engineering`、`ai-agent`、`rag`、`tooling`、`frontend`、`career`、`observability`、`architecture`

新标签前先想想：
- 是不是已有一个意思相近的？合并优于新增
- 这个标签预期能写到 ≥ 3 篇吗？写不到就别开

### 置顶规则

`featured: true` 会让文章出现在首页 timeline 顶部（POST 标记）。一般规则：
- 同时置顶不超过 3 篇
- 一篇文章的「热度期」过了就摘掉 `featured`
- 不要把所有想推的都置顶，那等于没置顶

## 写一篇新文章 · 标准流程

1. 在 `src/data/blog/` 下新建 `<slug>/` 文件夹
2. 里面新建 `index.md`，贴 frontmatter 模板
3. 写正文，截图直接 `⌘V`（Typora 已配置 `复制图片到当前文件夹 (./)` + `优先使用相对路径`）
4. 本地预览：`npm run dev` → `/posts/<slug>`
5. 提交：

```bash
git add -A
git commit -m "post: <slug> · <一句话标题>"
git push
```

CF Pages 1-2 分钟内自动部署。

## 提交信息约定

- `post: ...` 新文章
- `post(<slug>): ...` 改既有文章
- `feat: ...` 功能（含设计、组件）
- `fix: ...` bug 修复
- `chore: ...` 杂项（依赖、文档）
- `refactor: ...` 不改行为的内部重构

## 设计系统（修改样式时）

- 全局色板：`src/styles/global.css` 顶部的 `:root` / `[data-theme="dark"]`
- 不要硬编码颜色，用 `var(--accent)` / `var(--foreground)` / `var(--muted)` / `var(--border)` / `var(--surface)` / `var(--surface-2)`
- 字体：mono 用 `var(--font-mono)`（JetBrains Mono），中文用 `var(--font-cn)`（Noto Sans SC）。在 .astro 里类：`font-mono` / `term-cn`
- 终端常用 utility：`.term-prompt`（绿色提示符）、`.term-mono`、`.term-cn`、`.term-tag`、`.term-card`（带 hover 高亮的卡片）、`.term-link`、`.term-cursor`（闪烁块）
- 加新组件时优先复用 `term-card` / 虚线分隔（`border: 1px dashed var(--border)`）

## 仓库小细节

- `src/pages/index.astro` 首页 timeline 取最近 10 条，不要把所有都列出来
- stats 卡片是 4 行：`posts / words / commits / uptime`，全部 build-time 算的，不用维护
- ⌘K 浮层在 `src/components/SearchModal.astro`，搜索索引来自 `getCollection("blog")` 注入的 JSON
- Tweaks 面板在 `src/components/TweaksPanel.astro`（字号 / accent 色 / 主题），写到 localStorage
- 文章页 TOC 自动从 markdown 标题生成（见 `src/layouts/PostDetails.astro`），sidebar 在 ≥ 1024px 显示

## 反例 / 常见踩坑

- ❌ 在 md 顶部写 `# 标题`：会有两个标题
- ❌ `pubDatetime: 2026-04-25`：缺时间和时区，按 UTC 解析会差 8 小时
- ❌ 把图片放进 `public/`：能用，但跳过了图片优化
- ❌ 用 `mx-auto` 让某个元素居中：本站 main 已经在窗口内布局，需要的是 padding 或 grid
- ❌ 把样式硬编码 `#f5f2ea`：换主题就不一致，用 `var(--background)`
