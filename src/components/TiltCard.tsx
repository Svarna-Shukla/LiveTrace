"use client";

import { useRef } from "react";
import { motion, useMotionTemplate, useSpring } from "framer-motion";
import clsx from "clsx";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
}

const SPRING = { stiffness: 150, damping: 18, mass: 0.5 };

export default function TiltCard({ children, className }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(0, SPRING);
  const rotateY = useSpring(0, SPRING);
  const glowX = useSpring(50, SPRING);
  const glowY = useSpring(50, SPRING);
  const background = useMotionTemplate`radial-gradient(280px circle at ${glowX}% ${glowY}%, rgba(139,92,246,0.18), transparent 70%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    rotateY.set((px - 0.5) * 14);
    rotateX.set((0.5 - py) * 14);
    glowX.set(px * 100);
    glowY.set(py * 100);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    glowX.set(50);
    glowY.set(50);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className={clsx("group relative overflow-hidden rounded-2xl backdrop-blur-md", className)}
    >
      <motion.div className="pointer-events-none absolute inset-0" style={{ background }} />
      <div className="relative">{children}</div>
    </motion.div>
  );
}
