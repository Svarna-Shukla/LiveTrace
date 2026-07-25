import JSZip from "jszip";
import { isIgnoredPath, isCodeFile, MAX_FILES, MAX_TOTAL_CHARS, type IngestedFile, type IngestResult } from "./ingestFilters";

export type { IngestedFile };
export type ZipExtractResult = IngestResult;

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
