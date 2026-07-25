import JSZip from "jszip";

const CODE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".json"];
const MAX_FILES = 200;
const MAX_TOTAL_CHARS = 400_000;

function isIgnoredPath(path: string): boolean {
  return /(^|\/)(node_modules|\.git|dist|build|\.next)(\/|$)/.test(path);
}

function isCodeFile(path: string): boolean {
  const base = path.split("/").pop() ?? path;
  if (base.startsWith(".env")) return true;
  return CODE_EXTENSIONS.some((ext) => base.toLowerCase().endsWith(ext));
}

export interface ZipExtractResult {
  combined: string;
  fileCount: number;
  skipped: number;
  truncated: boolean;
}

/**
 * Recursively pulls text out of a .zip archive: code/config files only,
 * skipping node_modules/.git/build output and anything binary-looking
 * (by extension whitelist). Files are concatenated with a path-comment
 * separator so the regex parser can still find route/env/db patterns
 * across the whole project.
 */
export async function extractZipSource(file: File | Blob): Promise<ZipExtractResult> {
  const zip = await JSZip.loadAsync(file);
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);

  let combined = "";
  let fileCount = 0;
  let skipped = 0;
  let truncated = false;

  for (const entry of entries) {
    // Zip entries should use forward slashes per spec, but some Windows
    // tools (e.g. PowerShell's Compress-Archive) write backslashes instead —
    // normalize before path matching so node_modules/.git are always caught.
    const path = entry.name.replace(/\\/g, "/");
    if (isIgnoredPath(path) || !isCodeFile(path)) {
      skipped++;
      continue;
    }
    if (fileCount >= MAX_FILES || combined.length >= MAX_TOTAL_CHARS) {
      truncated = true;
      skipped++;
      continue;
    }
    const text = await entry.async("string");
    combined += `\n// ---- ${path} ----\n${text}\n`;
    fileCount++;
  }

  return { combined: combined.trim(), fileCount, skipped, truncated };
}
