"use client";

import { useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import { Loader2, Lock, Mail, User, X } from "lucide-react";
import clsx from "clsx";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthenticated?: () => void;
}

type Mode = "signin" | "register";

export default function AuthModal({ open, onClose, onAuthenticated }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    getProviders()
      .then((providers) => setGoogleEnabled(Boolean(providers?.google)))
      .catch(() => setGoogleEnabled(false));
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not create account.");
          setLoading(false);
          return;
        }
      }

      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError(mode === "register" ? "Account created, but sign-in failed. Try signing in." : "Invalid email or password.");
        setLoading(false);
        return;
      }

      setLoading(false);
      onAuthenticated?.();
      onClose();
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="animate-fade-in-up relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {mode === "signin" ? "Sign In" : "Create Account"}
            </h2>
            <p className="text-[11px] text-slate-400">
              {mode === "signin" ? "Welcome back to LiveTrace" : "Save workflows to your account"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-5 py-4">
          {googleEnabled && (
            <>
              <button
                type="button"
                onClick={() => signIn("google")}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2 text-[12.5px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Continue with Google
              </button>
              <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-wide text-slate-400">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                or
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>
            </>
          )}

          {mode === "register" && (
            <label className="flex flex-col gap-1">
              <span className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">Name</span>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800">
                <User size={13} className="shrink-0 text-slate-400" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  className="w-full bg-transparent text-[12.5px] text-slate-700 outline-none dark:text-slate-200"
                />
              </div>
            </label>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">Email</span>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800">
              <Mail size={13} className="shrink-0 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-transparent text-[12.5px] text-slate-700 outline-none dark:text-slate-200"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">Password</span>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800">
              <Lock size={13} className="shrink-0 text-slate-400" />
              <input
                type="password"
                required
                minLength={mode === "register" ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "At least 8 characters" : "••••••••"}
                className="w-full bg-transparent text-[12.5px] text-slate-700 outline-none dark:text-slate-200"
              />
            </div>
          </label>

          {error && <p className="text-[11.5px] font-medium text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className={clsx(
              "mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-violet-600 dark:hover:bg-violet-500",
            )}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {mode === "signin" ? "Sign In" : "Create Account"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode((m) => (m === "signin" ? "register" : "signin"));
              setError(null);
            }}
            className="text-center text-[11.5px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {mode === "signin" ? "Need an account? Register" : "Already have an account? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
