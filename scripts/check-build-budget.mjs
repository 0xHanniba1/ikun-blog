import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST_DIR = "dist";
const HTML_MAX_BYTES = 180_000;
const FONT_FACE_MAX_COUNT = 64;
const FONT_FILE_MAX_BYTES = 512_000;

const failures = [];

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : path;
  });
}

for (const file of walk(DIST_DIR)) {
  const size = statSync(file).size;

  if (file.endsWith(".html")) {
    const html = readFileSync(file, "utf8");
    const fontFaces = html.match(/@font-face/g)?.length ?? 0;

    if (size > HTML_MAX_BYTES) {
      failures.push(`${file}: ${size} bytes exceeds ${HTML_MAX_BYTES}`);
    }

    if (fontFaces > FONT_FACE_MAX_COUNT) {
      failures.push(
        `${file}: ${fontFaces} @font-face rules exceeds ${FONT_FACE_MAX_COUNT}`
      );
    }
  }

  if (file.startsWith(join(DIST_DIR, "_astro", "fonts")) && size > FONT_FILE_MAX_BYTES) {
    failures.push(`${file}: ${size} bytes exceeds ${FONT_FILE_MAX_BYTES}`);
  }
}

if (failures.length > 0) {
  process.stderr.write(
    `Build budget failed:\n${failures.map(failure => `- ${failure}`).join("\n")}\n`
  );
  process.exit(1);
}

process.stdout.write("Build budget passed.\n");
