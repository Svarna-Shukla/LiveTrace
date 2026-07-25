/**
 * Minimal regex-based syntax highlighter for the code ingestion editor.
 * Not a real tokenizer/lexer — good enough for JS/TS/Python-ish snippets
 * without pulling in a full highlighting library.
 */

const KEYWORDS = new Set([
  // JS / TS
  "const", "let", "var", "function", "async", "await", "return", "if", "else", "for", "while",
  "switch", "case", "break", "continue", "class", "extends", "new", "this", "import", "export",
  "from", "default", "try", "catch", "finally", "throw", "typeof", "instanceof", "of", "in",
  "null", "undefined", "true", "false", "interface", "type", "enum", "implements", "public",
  "private", "protected", "static", "readonly", "void", "as", "require", "module", "exports",
  // Python
  "def", "elif", "except", "pass", "lambda", "with", "yield", "None", "True", "False", "and",
  "or", "not", "is", "self", "raise", "global", "nonlocal",
]);

const TOKEN_RE =
  /(\/\/[^\n]*|#[^\n]*)|(`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*\b)/g;

const STYLES: Record<string, string> = {
  comment: "color:#6a9955;font-style:italic",
  string: "color:#ce9178",
  number: "color:#b5cea8",
  keyword: "color:#c586c0",
};

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function highlightCode(source: string): string {
  let result = "";
  let lastIndex = 0;

  for (const m of source.matchAll(TOKEN_RE)) {
    const start = m.index ?? 0;
    result += escapeHtml(source.slice(lastIndex, start));

    const [full, comment, str, num, word] = m;
    if (comment !== undefined) {
      result += `<span style="${STYLES.comment}">${escapeHtml(comment)}</span>`;
    } else if (str !== undefined) {
      result += `<span style="${STYLES.string}">${escapeHtml(str)}</span>`;
    } else if (num !== undefined) {
      result += `<span style="${STYLES.number}">${escapeHtml(num)}</span>`;
    } else if (word !== undefined && KEYWORDS.has(word)) {
      result += `<span style="${STYLES.keyword}">${escapeHtml(word)}</span>`;
    } else {
      result += escapeHtml(full);
    }
    lastIndex = start + full.length;
  }

  result += escapeHtml(source.slice(lastIndex));
  return result;
}
