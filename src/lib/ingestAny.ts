import { extractFolderSource } from "./folderIngest";
import { extractZipSource } from "./zipIngest";
import type { IngestedFile, IngestResult } from "./ingestFilters";

/** `webkitRelativePath` is only populated for folder selections/drops. */
const hasRelativePath = (file: File): boolean =>
  Boolean((file as File & { webkitRelativePath?: string }).webkitRelativePath);

function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/**
 * Single entry point for "the user handed us some files" — folder selection,
 * a .zip archive, or one plain file all resolve to the same `IngestResult`
 * shape. Used by both `CodeIngestModal` and `ArchitectureDiffModal` so the
 * folder/zip/single-file branching only lives in one place.
 */
export async function ingestAnyFiles(fileList: FileList | File[]): Promise<IngestResult> {
  const list = Array.from(fileList);
  if (list.length === 0) {
    return { files: [], combined: "", fileCount: 0, skipped: 0, truncated: false };
  }

  const isFolderSelection = list.length > 1 || hasRelativePath(list[0]);
  if (isFolderSelection) {
    return extractFolderSource(list);
  }

  const file = list[0];
  if (file.name.toLowerCase().endsWith(".zip")) {
    return extractZipSource(file);
  }

  const text = await readTextFile(file);
  const files: IngestedFile[] = [{ path: file.name, content: text }];
  return { files, combined: text, fileCount: 1, skipped: 0, truncated: false };
}
