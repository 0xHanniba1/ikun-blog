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
 */
export function getPath(
  id: string,
  filePath: string | undefined,
  includeBase = true
) {
  const pathSegments = filePath
    ?.replace(BLOG_PATH, "")
    .split("/")
    .filter(path => path !== "")
    .filter(path => !path.startsWith("_"))
    .slice(0, -1) // drop the file name itself
    .map(segment => slugifyStr(segment));

  const basePath = includeBase ? "/posts" : "";

  const blogIdParts = id.split("/");
  const lastSegment = blogIdParts.length > 0
    ? blogIdParts[blogIdParts.length - 1]
    : id;

  // Treat `index` as a folder marker, not a path segment.
  const slug = lastSegment === "index" ? "" : lastSegment;

  if (!pathSegments || pathSegments.length < 1) {
    return slug ? [basePath, slug].join("/") : basePath || "/";
  }

  return slug
    ? [basePath, ...pathSegments, slug].join("/")
    : [basePath, ...pathSegments].join("/");
}
