import { BLOG_PATH } from "@/content.config";
import { slugifyStr } from "./slugify";

/**
 * Get full path of a blog post.
 *
 * Conventions supported:
 *   src/data/blog/foo.md             → /posts/foo
 *   src/data/blog/foo/index.md       → /posts/foo                (index drops)
 *   src/data/blog/foo/bar.md         → /posts/foo/bar
 *   src/data/blog/foo/bar/index.md   → /posts/foo/bar
 *
 * The route is derived entirely from `filePath` so it does not depend on how
 * the content loader generates `id`. Astro's glob loader changed the `id` of
 * `foo/index.md` from `foo/index` to `foo`; the old logic appended that `id`
 * after the folder segment and produced doubled `/posts/foo/foo` URLs. `id` is
 * only used as a fallback when `filePath` is missing.
 */
export function getPath(
  id: string,
  filePath: string | undefined,
  includeBase = true
) {
  const basePath = includeBase ? "/posts" : "";

  // Segments relative to the blog root, file name still included.
  const segments = (filePath ?? id)
    .replace(BLOG_PATH, "")
    .split("/")
    .filter(segment => segment !== "")
    .filter(segment => !segment.startsWith("_"));

  // The last segment is the file name (when derived from filePath). Strip the
  // extension and treat `index` as a folder marker that adds no path segment.
  const leaf = segments.pop()?.replace(/\.md$/, "") ?? "";
  const routeSegments = [
    ...segments.map(segment => slugifyStr(segment)),
    ...(leaf === "" || leaf === "index" ? [] : [slugifyStr(leaf)]),
  ];

  if (routeSegments.length < 1) {
    return basePath || "/";
  }

  return [basePath, ...routeSegments].join("/");
}
