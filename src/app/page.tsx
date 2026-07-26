"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { ArrowRight, Braces, Flame, Play, Sparkles, TrendingUp } from "lucide-react";
import LandingNav from "@/components/LandingNav";
import TiltCard from "@/components/TiltCard";
import AuthModal from "@/components/AuthModal";

const CodeSymbol3D = dynamic(() => import("@/components/three/CodeSymbol3D"), { ssr: false });

const FEATURES = [
  {
    icon: Braces,
    title: "Dynamic Code AST Parsing",
    description:
      "Upload any file or .zip and LiveTrace scans real routes, env access, and DB calls to build the graph — no manual wiring.",
  },
  {
    icon: Flame,
    title: "Latency Bottleneck Heatmaps",
    description:
      "Every simulated hop is timed and color-coded, so slow database queries and API calls stand out at a glance.",
  },
  {
    icon: Sparkles,
    title: "AI Code Audits",
    description:
      "Get a health score with concrete findings — hardcoded secrets, missing error handling, sequential queries — before you ship.",
  },
];

const PLANS = [
  { name: "Free", price: "$0", tagline: "For exploring a single codebase", cta: "Start Free" },
  { name: "Pro", price: "$19", tagline: "Unlimited saved workflows + AI audits", cta: "Go Pro", featured: true },
  { name: "Team", price: "$49", tagline: "Shared workflows across your org", cta: "Contact Us" },
];

const DEFAULT_REDIRECT = "/dashboard";

export default function LandingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState(DEFAULT_REDIRECT);

  useEffect(() => {
    // The /dashboard route guard (middleware.ts) bounces unauthenticated
    // visitors here with ?callbackUrl=/dashboard — reopen the auth modal so
    // they can sign in without losing where they were headed.
    const params = new URLSearchParams(window.location.search);
    const callbackUrl = params.get("callbackUrl");
    if (callbackUrl) {
      setRedirectTarget(callbackUrl);
      setAuthOpen(true);
    }
  }, []);

  const handleAuthenticated = () => {
    router.push(redirectTarget);
  };

  const handleGetStarted = () => {
    if (session) {
      router.push(DEFAULT_REDIRECT);
      return;
    }
    setRedirectTarget(DEFAULT_REDIRECT);
    setAuthOpen(true);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(139,92,246,0.25),transparent_45%),radial-gradient(circle_at_85%_15%,rgba(217,70,239,0.15),transparent_40%)]" />

      <LandingNav onOpenAuth={() => setAuthOpen(true)} />

      <section className="relative isolate mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-14 lg:grid-cols-2 lg:gap-6 lg:py-20">
        {/* Left column */}
        <div className="relative flex flex-col items-start pb-16 text-left lg:pb-24">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-[11.5px] font-semibold text-violet-300 backdrop-blur"
          >
            • Real-time Code Intelligence
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="max-w-xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl"
          >
            <span className="block text-white">Visualize Code</span>
            <span className="block bg-gradient-to-r from-[#F5B842] via-[#f7cf7a] to-[#F5B842] bg-clip-text italic text-transparent">
              for Developers
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-5 max-w-md text-[15px] leading-relaxed text-slate-400"
          >
            Upload a codebase, watch it become an interactive architecture diagram, and trigger real error scenarios —
            401s, DB timeouts, 500s — generated straight from your code.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <button
              onClick={handleGetStarted}
              className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-[#F5B842] to-[#e0a530] px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(245,184,66,0.35)] transition-transform hover:scale-[1.03]"
            >
              Get Started
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </button>
            <a
              href="#features"
              title="See it in action"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur transition-colors hover:bg-white/10"
            >
              <Play size={15} className="ml-0.5" fill="currentColor" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.32 }}
            className="absolute bottom-0 left-0 w-[min(320px,90vw)]"
          >
            <TiltCard className="border border-white/10 bg-white/[0.04] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 text-emerald-300">
                  <Flame size={17} />
                </div>
                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">Case Study</p>
                  <p className="text-[13px] font-bold text-white">
                    50ms <span className="text-slate-500">→</span> 12ms p99 latency
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[11.5px] leading-relaxed text-slate-400">
                Acme Eng cut checkout timeouts by 76% after tracing the bottleneck in LiveTrace.
              </p>
            </TiltCard>
          </motion.div>
        </div>

        {/* Right column: 3D hero element */}
        <div className="relative flex flex-col items-center">
          <div className="relative h-[340px] w-full sm:h-[420px] lg:h-[480px]">
            <CodeSymbol3D />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative -mt-10 w-[min(280px,85vw)] sm:-mt-14"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-[0_20px_60px_rgba(139,92,246,0.2)] backdrop-blur-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/25 to-fuchsia-500/25 text-violet-300">
                <TrendingUp size={17} />
              </div>
              <div>
                <p className="text-[15px] font-bold text-white">+23% Team productivity growth</p>
                <p className="text-[10.5px] text-slate-400">Since adopting live workflow tracing</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="relative mx-auto w-full max-w-6xl px-6 py-24">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Built for real debugging, not toy diagrams</h2>
          <p className="mt-2 text-[13.5px] text-slate-400">
            Every feature below runs against your actual code — not a canned demo.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <TiltCard key={title} className="border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-violet-300">
                <Icon size={18} />
              </div>
              <h3 className="mb-1.5 text-[14.5px] font-bold text-white">{title}</h3>
              <p className="text-[12.5px] leading-relaxed text-slate-400">{description}</p>
            </TiltCard>
          ))}
        </div>
      </section>

      <section id="pricing" className="relative mx-auto w-full max-w-6xl px-6 py-24">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Simple pricing</h2>
          <p className="mt-2 text-[13.5px] text-slate-400">Start free. Upgrade when your team needs more.</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.featured
                  ? "relative rounded-2xl border border-violet-400/40 bg-gradient-to-b from-violet-500/10 to-transparent p-6 shadow-[0_0_40px_rgba(139,92,246,0.15)]"
                  : "relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur"
              }
            >
              {plan.featured && (
                <span className="absolute -top-3 left-6 rounded-full bg-violet-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Popular
                </span>
              )}
              <h3 className="text-sm font-bold text-white">{plan.name}</h3>
              <div className="mt-2 text-3xl font-bold text-white">
                {plan.price}
                <span className="text-sm font-medium text-slate-400">/mo</span>
              </div>
              <p className="mt-2 text-[12.5px] text-slate-400">{plan.tagline}</p>
              <button
                onClick={() => {
                  setRedirectTarget(DEFAULT_REDIRECT);
                  setAuthOpen(true);
                }}
                className={
                  plan.featured
                    ? "mt-5 w-full rounded-lg bg-violet-600 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-violet-500"
                    : "mt-5 w-full rounded-lg border border-white/15 bg-white/5 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-white/10"
                }
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative border-t border-white/10 px-6 py-8 text-center text-[11.5px] text-slate-500">
        LiveTrace — Real-time execution visualizer
      </footer>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={handleAuthenticated}
        googleCallbackUrl={redirectTarget}
      />
    </div>
  );
}
