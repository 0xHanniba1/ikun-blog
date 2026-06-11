import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_DAYS = 7;
const TIMEZONE = "Asia/Shanghai";

function unquote(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function getScalar(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.*?)\\s*$`, "m"));
  return match ? unquote(match[1]) : "";
}

function getTags(frontmatter) {
  const inline = getScalar(frontmatter, "tags");
  if (inline.startsWith("[") && inline.endsWith("]")) {
    return inline
      .slice(1, -1)
      .split(",")
      .map(unquote)
      .filter(Boolean);
  }

  const lines = frontmatter.split(/\r?\n/);
  const tagsIndex = lines.findIndex(line => /^tags:\s*$/.test(line));
  if (tagsIndex === -1) return ["others"];

  const tags = [];
  for (const line of lines.slice(tagsIndex + 1)) {
    const match = line.match(/^\s+-\s+(.+?)\s*$/);
    if (!match) break;
    tags.push(unquote(match[1]));
  }
  return tags.length > 0 ? tags : ["others"];
}

function parsePost(markdown, filePath) {
  const match = markdown.match(
    /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/
  );
  if (!match) throw new Error(`Missing frontmatter: ${filePath}`);

  const [, frontmatter, body] = match;
  const pubDatetime = getScalar(frontmatter, "pubDatetime");
  const publishedAt = new Date(pubDatetime);
  if (!pubDatetime || Number.isNaN(publishedAt.getTime())) {
    throw new Error(`Invalid pubDatetime: ${filePath}`);
  }

  return {
    body,
    draft: getScalar(frontmatter, "draft") === "true",
    publishedAt,
    tags: getTags(frontmatter),
  };
}

export function countBody(markdown) {
  const cleaned = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~`>\-]/g, " ");
  const cjk = (cleaned.match(/[一-鿿]/g) || []).length;
  const english = (cleaned.match(/[A-Za-z][A-Za-z'-]*/g) || []).length;

  return {
    words: cjk + english,
    minutes: cjk / 300 + english / 200,
  };
}

async function findMarkdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async entry => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) return findMarkdownFiles(path);
      return entry.isFile() &&
        entry.name.endsWith(".md") &&
        !entry.name.startsWith("_")
        ? [path]
        : [];
    })
  );
  return files.flat();
}

function zonedDateParts(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map(part => [part.type, part.value]));
}

function formatDate(date) {
  const { year, month, day } = zonedDateParts(date);
  return `${year}-${month}-${day}`;
}

function formatDateTime(date) {
  const { year, month, day, hour, minute } = zonedDateParts(date);
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function calendarDay(date) {
  const { year, month, day } = zonedDateParts(date);
  return Date.UTC(Number(year), Number(month) - 1, Number(day)) / DAY_MS;
}

export async function generateStats({ blogDir, now = new Date() }) {
  const files = await findMarkdownFiles(blogDir);
  const posts = await Promise.all(
    files.map(async filePath =>
      parsePost(await readFile(filePath, "utf8"), filePath)
    )
  );
  const publishedPosts = posts.filter(
    post => !post.draft && post.publishedAt.getTime() <= now.getTime()
  );
  const tags = new Set(publishedPosts.flatMap(post => post.tags));
  const recentThreshold = now.getTime() - RECENT_DAYS * DAY_MS;

  let totalWords = 0;
  let readingMinutes = 0;
  for (const post of publishedPosts) {
    const count = countBody(post.body);
    totalWords += count.words;
    readingMinutes += count.minutes;
  }

  const earliest = publishedPosts.reduce(
    (min, post) =>
      !min || post.publishedAt < min ? post.publishedAt : min,
    null
  );

  return {
    generatedAt: formatDateTime(now),
    totalPosts: publishedPosts.length,
    totalTags: tags.size,
    totalWords,
    readingMinutes: Number(readingMinutes.toFixed(4)),
    recentPosts: publishedPosts.filter(
      post => post.publishedAt.getTime() >= recentThreshold
    ).length,
    since: earliest ? formatDate(earliest) : formatDate(now),
    uptimeDays: earliest ? calendarDay(now) - calendarDay(earliest) : 0,
  };
}

export async function writeStats(options) {
  const stats = await generateStats(options);
  await mkdir(dirname(options.outputFile), { recursive: true });
  await writeFile(options.outputFile, `${JSON.stringify(stats, null, 2)}\n`, "utf8");
  return stats;
}

const isMain =
  process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  const blogDir = resolve("src/data/blog");
  const outputFile = resolve("src/generated/blog-stats.json");

  try {
    const stats = await writeStats({ blogDir, outputFile });
    process.stdout.write(
      `Generated ${outputFile} (${stats.totalPosts} posts)\n`
    );
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
    process.exitCode = 1;
  }
}
