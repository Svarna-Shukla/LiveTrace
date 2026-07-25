/**
 * Shared filtering rules for pulling source files out of a .zip archive or a
 * raw folder selection (webkitdirectory). Both ingestion paths need the same
 * ignore-list and code-extension allowlist so a file isn't treated
 * differently depending on how it was uploaded.
 */

export const CODE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".go", ".json"];

// Allowlisting by CODE_EXTENSIONS already excludes these, but call them out
// explicitly so intent is clear and asset files are never accidentally
// picked up by a future extension addition.
const IGNORED_ASSET_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico", ".pdf"];

export const MAX_FILES = 200;
export const MAX_TOTAL_CHARS = 400_000;

export interface IngestedFile {
  path: string;
  content: string;
}

export interface IngestResult {
  files: IngestedFile[];
  combined: string;
  fileCount: number;
  skipped: number;
  truncated: boolean;
}

export function isIgnoredPath(path: string): boolean {
  return /(^|\/)(node_modules|\.git|\.next|dist|build)(\/|$)/.test(path);
}

export function isCodeFile(path: string): boolean {
  const base = path.split("/").pop() ?? path;
  const lower = base.toLowerCase();
  if (IGNORED_ASSET_EXTENSIONS.some((ext) => lower.endsWith(ext))) return false;
  if (base.startsWith(".env")) return true;
  return CODE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}
