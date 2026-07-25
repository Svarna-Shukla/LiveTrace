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

export interface IngestedFile {
  path: string;
  content: string;
}

export interface ZipExtractResult {
  files: IngestedFile[];
  combined: string;
  fileCount: number;
  skipped: number;
  truncated: boolean;
}

/**
 * Recursively pulls text out of a .zip archive: code/config files only,
 * skipping node_modules/.git/build output and anything binary-looking (by
 * extension whitelist — images, PDFs, etc. are never in CODE_EXTENSIONS so
 * they're excluded automatically). Returns each file separately (so the
 * sidebar can render a per-file tree/flowchart) as well as a concatenated
 * `combined` string for the editor preview and whole-codebase audit.
 */
export async function extractZipSource(file: File | Blob): Promise<ZipExtractResult> {
  const zip = await JSZip.loadAsync(file);
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);

  const files: IngestedFile[] = [];
  let combined = "";
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
    if (files.length >= MAX_FILES || combined.length >= MAX_TOTAL_CHARS) {
      truncated = true;
      skipped++;
      continue;
    }
    const text = await entry.async("string");
    files.push({ path, content: text });
    combined += `\n// ---- ${path} ----\n${text}\n`;
  }

  return { files, combined: combined.trim(), fileCount: files.length, skipped, truncated };
}
