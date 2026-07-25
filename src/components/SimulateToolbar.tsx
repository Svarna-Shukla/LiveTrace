"use client";

import clsx from "clsx";
import { CircleX, Loader2, ShieldCheck, Zap } from "lucide-react";
import type { SimulationKind } from "@/lib/types";

interface SimulateToolbarProps {
  simActive: SimulationKind | null;
  disabled: boolean;
  onSimulate: (kind: SimulationKind) => void;
}

const BUTTONS: Array<{
  kind: SimulationKind;
  label: string;
  icon: typeof ShieldCheck;
  activeClassName: string;
  idleClassName: string;
}> = [
  {
    kind: "success-login",
    label: "Success Login",
    icon: ShieldCheck,
    activeClassName: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    idleClassName:
      "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/50",
  },
  {
    kind: "wrong-password",
    label: "Wrong Password",
    icon: CircleX,
    activeClassName: "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300",
    idleClassName:
      "border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-red-700 dark:hover:bg-red-950/50",
  },
  {
    kind: "traffic-spike",
    label: "Traffic Spike",
    icon: Zap,
    activeClassName: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300",
    idleClassName:
      "border-slate-200 bg-white text-slate-700 hover:border-amber-200 hover:bg-amber-50/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-amber-700 dark:hover:bg-amber-950/50",
  },
];

export default function SimulateToolbar({ simActive, disabled, onSimulate }: SimulateToolbarProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 z-20 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <span className="pl-2 pr-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          Simulate Request
        </span>
        {BUTTONS.map(({ kind, label, icon: Icon, activeClassName, idleClassName }) => {
          const isActive = simActive === kind;
          return (
            <button
              key={kind}
              onClick={() => onSimulate(kind)}
              disabled={disabled}
              className={clsx(
                "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50",
                isActive ? activeClassName : idleClassName,
              )}
            >
              {isActive ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
