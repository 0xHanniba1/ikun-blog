import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { generateStats, writeStats } from "./generate-stats.mjs";

const NOW = new Date("2026-06-11T12:00:00+08:00");

async function writePost(root, slug, frontmatter, body) {
  const postDir = join(root, slug);
  await mkdir(postDir, { recursive: true });
  await writeFile(
    join(postDir, "index.md"),
    `---\n${frontmatter}\n---\n\n${body}\n`,
    "utf8"
  );
}

test("generateStats counts only published posts", async t => {
  const root = await mkdtemp(join(tmpdir(), "ikun-blog-stats-"));
  t.after(() => rm(root, { recursive: true, force: true }));

  await writePost(
    root,
    "recent-post",
    `title: "Recent"
pubDatetime: 2026-06-10T12:00:00+08:00
description: "Recent post"
tags:
  - ai-agent
  - tooling`,
    "你好 world."
  );
  await writePost(
    root,
    "old-post",
    `title: "Old"
pubDatetime: 2026-05-20T12:00:00+08:00
description: "Old post"
tags:
  - tooling
  - engineering`,
    "旧文章 uses Playwright."
  );
  await writePost(
    root,
    "draft-post",
    `title: "Draft"
pubDatetime: 2026-06-11T08:00:00+08:00
description: "Draft post"
draft: true
tags:
  - hidden`,
    "这篇草稿不应统计。"
  );
  await writePost(
    root,
    "future-post",
    `title: "Future"
pubDatetime: 2026-06-12T12:00:00+08:00
description: "Future post"
tags:
  - hidden`,
    "这篇未来文章不应统计。"
  );
  await writeFile(
    join(root, "_ignored.md"),
    `---
title: "Ignored"
pubDatetime: 2026-06-11T08:00:00+08:00
description: "Ignored post"
tags:
  - hidden
---

以下划线开头的文件不应统计。
`,
    "utf8"
  );

  const stats = await generateStats({ blogDir: root, now: NOW });

  assert.deepEqual(stats, {
    generatedAt: "2026-06-11 12:00",
    totalPosts: 2,
    totalTags: 3,
    totalWords: 8,
    readingMinutes: 0.0317,
    recentPosts: 1,
    since: "2026-05-20",
    uptimeDays: 22,
  });
});

test("writeStats creates the generated JSON file", async t => {
  const root = await mkdtemp(join(tmpdir(), "ikun-blog-stats-"));
  t.after(() => rm(root, { recursive: true, force: true }));

  await writePost(
    root,
    "one-post",
    `title: "One"
pubDatetime: 2026-06-09T12:00:00+08:00
description: "One post"
tags: [tooling]`,
    "一篇 post。"
  );

  const outputFile = join(root, "generated", "blog-stats.json");
  await writeStats({ blogDir: root, outputFile, now: NOW });

  const output = JSON.parse(await readFile(outputFile, "utf8"));
  assert.equal(output.totalPosts, 1);
  assert.equal(output.totalTags, 1);
  assert.equal(output.recentPosts, 1);
});
