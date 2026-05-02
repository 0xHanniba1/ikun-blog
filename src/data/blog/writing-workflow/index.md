---
title: "新博客的写作工作流"
pubDatetime: 2026-04-25T23:30:00+08:00
description: "新博客上线后的第一件事：把怎么写、怎么发的流程定下来。每篇一个文件夹，图片就近放，git push 就部署。"
tags:
  - 站务
  - tooling
featured: false
---

新博客 [上线后](/posts/hello-world/hello-world) 第一件事，是把「怎么写、怎么发」的流程定下来。不复杂，但每一步都需要可复现，否则下次想写就要重新想。

记录下来，以后照着做。

## 仓库结构

每篇文章一个独立文件夹，图片就近放：

```
src/data/blog/
├── hello-world/
│   ├── index.md
│   └── image-20260425230034809.png
├── writing-workflow/
│   └── index.md
└── ...
```

文件夹名 `<slug>` 就是 URL：`/posts/<slug>`。只用小写英文字母 + 数字 + 连字符。

为什么不放一个 markdown 平铺：图片粘到 md 里时 Typora 会自动复制到同目录，跨文章不会混；以后想搬运 / 删除某篇也是整文件夹一起带走。

## Frontmatter 模板

```yaml
---
title: "文章标题"
pubDatetime: 2026-04-25T23:30:00+08:00
description: "一句话摘要，列表页和首页 timeline 都用它。"
tags:
  - 站务
featured: false
---
```

几个容易踩的坑：

- `pubDatetime` **必须带时区**（`+08:00`），不然按 UTC 解析会偏 8 小时
- `description` 控制在 60 字以内 —— 列表卡和 OG 图都用它
- `featured: true` 会把文章置顶到首页时间线，同时开不超过 3 篇
- `draft: true` 在线上隐藏（dev 还能看）

完整 schema 在 `src/content.config.ts`。

## 写正文

- **不要**在 md 里写 `# 一级标题`，那是 frontmatter 自动生成的
- 章节用 `## `（h2），子章节用 `### `
- 代码块用三反引号围栏，并加语言标识，例如 bash、ts
- 图片用相对路径 `![](./image-xxx.png)`

Typora 偏好设置里要打开两个选项，否则截图粘贴不会自动落到当前文件夹：

- 「图像 → 插入图片时」选 **复制图片到当前文件夹（./）**
- 「图片语法偏好 → 优先使用相对路径」勾选

设好之后，写文章 + 粘截图 + 保存，全程不需要手动管文件位置。

## 本地预览

```bash
npm run dev
```

打开 http://127.0.0.1:4321/posts/<slug> 看效果。dev server 支持 HMR，改 md 自动刷新。

构建检查（可选但推荐）：

```bash
npm run build
```

这一步做几件事：

- TypeScript 类型 + 内容 schema 校验
- 图片转 webp + 多尺寸 srcset（一张 1.5 MB 的截图压完大概 60-100 KB）
- 生成 RSS / sitemap / OG 图

build 通过了再 push 比较稳。

## 部署

```bash
git add -A
git commit -m "post: <slug> · 一句话标题"
git push
```

Cloudflare Pages 监听 `main` 分支，push 后自动构建上线，约 1-2 分钟。

撤稿就在 frontmatter 里加 `draft: true` 再 push 一次；要彻底删稿就 `git rm -r src/data/blog/<slug>`。

## Cheatsheet

| 操作          | 命令                                                          |
| ------------- | ------------------------------------------------------------- |
| 新建文章      | `mkdir src/data/blog/foo && touch src/data/blog/foo/index.md` |
| 本地预览      | `npm run dev`                                                 |
| 构建检查      | `npm run build`                                               |
| 部署          | `git add -A && git commit -m "post: foo" && git push`         |
| 切深浅        | 顶栏右上 `[◑ light]` / `[◐ dark]`                             |
| 调字号 / 主色 | 右下角 `~$ tweaks --config`                                   |
| 搜索          | ⌘K / Ctrl+K                                                   |

## 一点感想

写博客这件事，工具链越简单，越能坚持得久。这次重做完，从「想写一篇」到「已经在线上」的最短路径是：

```
mkdir src/data/blog/foo && cd $_ && code index.md
# 写完
git add -A && git commit -m "post: foo" && git push
```

没有数据库、没有后台、没有 webpack 配置。

慢就是快。
