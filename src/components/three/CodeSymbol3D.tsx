"use client";

import { motion } from "framer-motion";
import { playfair } from "@/app/fonts";

const GOLD_DARK = "184, 134, 11";

/** Stacked, fading diagonal text-shadow layers fake a true CSS extrusion —
 * each layer nudges one pixel further down-right, so the glyph reads as a
 * solid 3D block rather than flat text, no WebGL/geometry involved. */
const DEPTH_SHADOW = Array.from(
  { length: 16 },
  (_, i) => `${i + 1}px ${i + 1}px 0 rgba(${GOLD_DARK}, ${(0.85 - i * 0.045).toFixed(2)})`,
).join(", ");

const GLOW_FILTER = "drop-shadow(0 0 25px rgba(243,186,66,0.8)) drop-shadow(0 0 60px rgba(243,186,66,0.4))";

export default function CodeSymbol3D() {
  return (
    <div className="relative flex h-full w-full items-center justify-center" style={{ perspective: "1000px" }}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.2),transparent_65%)] blur-3xl" />

      <motion.div
        animate={{ rotateY: [-10, 10, -10], y: [-8, 8, -8] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative flex select-none items-center justify-center"
      >
        <span
          className={`${playfair.className} font-bold leading-none`}
          style={{
            fontSize: "clamp(180px, 20vw, 320px)",
            background: "linear-gradient(180deg, #FFE17D 0%, #F3BA42 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            textShadow: DEPTH_SHADOW,
            filter: GLOW_FILTER,
          }}
        >
          {"{ }"}
        </span>
      </motion.div>
    </div>
  );
}
