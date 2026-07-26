"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, X } from "lucide-react";

interface SaveWorkflowModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  initialName: string;
  isUpdate: boolean;
  saving: boolean;
  error: string | null;
}

export default function SaveWorkflowModal({
  open,
  onClose,
  onSave,
  initialName,
  isUpdate,
  saving,
  error,
}: SaveWorkflowModalProps) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (open) setName(initialName);
  }, [open, initialName]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="animate-fade-in-up relative flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {isUpdate ? "Update Workflow" : "Save Workflow"}
            </h2>
            <p className="text-[11px] text-slate-400">Name this workflow so you can find it later</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) onSave(name.trim());
          }}
          className="flex flex-col gap-3 px-5 py-4"
        >
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">Workflow Name</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Checkout API Trace"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[12.5px] text-slate-700 outline-none focus:border-violet-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </label>

          {error && <p className="text-[11.5px] font-medium text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-violet-600 dark:hover:bg-violet-500"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isUpdate ? "Update" : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}
