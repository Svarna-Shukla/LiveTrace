"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { LayoutDashboard, LogOut, UserCircle2, Zap } from "lucide-react";

interface LandingNavProps {
  onOpenAuth: () => void;
}

export default function LandingNav({ onOpenAuth }: LandingNavProps) {
  const { data: session } = useSession();

  return (
    <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.5)]">
          <Zap size={16} />
        </div>
        <span className="text-sm font-bold tracking-tight text-white">LiveTrace</span>
      </div>

      <nav className="hidden items-center gap-7 text-[13px] font-medium text-slate-300 sm:flex">
        <a href="#features" className="transition-colors hover:text-white">
          Features
        </a>
        <a href="#pricing" className="transition-colors hover:text-white">
          Pricing
        </a>
      </nav>

      {session ? (
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[12.5px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
          >
            <LayoutDashboard size={13} />
            Dashboard
          </Link>
          <button
            onClick={() => signOut()}
            title="Sign out"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 backdrop-blur transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3.5 py-1.5 text-[12.5px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
        >
          <UserCircle2 size={13} />
          Sign In / Register
        </button>
      )}
    </header>
  );
}
