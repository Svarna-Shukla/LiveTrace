import { isIgnoredPath, isCodeFile, MAX_FILES, MAX_TOTAL_CHARS, type IngestedFile, type IngestResult } from "./ingestFilters";

function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/** `webkitRelativePath` is populated by browsers for `<input webkitdirectory>` selections. */
function relativePath(file: File): string {
  const withRelativePath = file as File & { webkitRelativePath?: string };
  const path = withRelativePath.webkitRelativePath;
  return path && path.length > 0 ? path : file.name;
}

/**
 * Recursively walks a raw folder selection (`<input webkitdirectory>` or a
 * multi-file drop), applying the same ignore-list/extension allowlist as
 * `extractZipSource` so folder and zip uploads behave identically.
 */
export async function extractFolderSource(fileList: FileList | File[]): Promise<IngestResult> {
  const allFiles = Array.from(fileList);
  const files: IngestedFile[] = [];
  let combined = "";
  let skipped = 0;
  let truncated = false;

  for (const file of allFiles) {
    const path = relativePath(file).replace(/\\/g, "/");
    if (isIgnoredPath(path) || !isCodeFile(path)) {
      skipped++;
      continue;
    }
    if (files.length >= MAX_FILES || combined.length >= MAX_TOTAL_CHARS) {
      truncated = true;
      skipped++;
      continue;
    }

    let text: string;
    try {
      text = await readFileText(file);
    } catch {
      skipped++;
      continue;
    }
    files.push({ path, content: text });
    combined += `\n// ---- ${path} ----\n${text}\n`;
  }

  return { files, combined: combined.trim(), fileCount: files.length, skipped, truncated };
}
