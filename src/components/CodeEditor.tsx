"use client";

import { useRef } from "react";
import { highlightCode } from "@/lib/highlight";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SHARED_CLASSES =
  "absolute inset-0 h-full w-full resize-none overflow-auto whitespace-pre-wrap break-words p-3 font-mono text-[12.5px] leading-[1.6]";

export default function CodeEditor({ value, onChange, placeholder }: CodeEditorProps) {
  const preRef = useRef<HTMLPreElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleScroll = () => {
    if (preRef.current && textareaRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = `${value.slice(0, start)}  ${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + 2;
    });
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-slate-700 bg-[#1e1e1e]">
      <pre
        ref={preRef}
        aria-hidden
        className={`${SHARED_CLASSES} pointer-events-none m-0 text-slate-200`}
        dangerouslySetInnerHTML={{ __html: `${highlightCode(value)}\n` }}
      />
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        spellCheck={false}
        className={`${SHARED_CLASSES} bg-transparent text-transparent caret-white outline-none placeholder:text-slate-500`}
      />
    </div>
  );
}
