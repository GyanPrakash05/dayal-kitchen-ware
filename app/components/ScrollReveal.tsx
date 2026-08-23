"use client";

import { motion, useScroll, useTransform } from "motion/react";
import type { ReactNode } from "react";
import { useRef } from "react";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export default function ScrollReveal({
  children,
  className = "",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 95%", "end 10%"],
  });

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.15, 0.4, 0.7, 1],
    [0.15, 0.6, 1, 0.75, 0.4]
  );

  const y = useTransform(
    scrollYProgress,
    [0, 0.4, 1],
    [40, 0, -20]
  );

  const scale = useTransform(
    scrollYProgress,
    [0, 0.4, 1],
    [0.97, 1, 0.98]
  );

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        opacity,
        y,
        scale,
      }}
    >
      {children}
    </motion.div>
  );
}