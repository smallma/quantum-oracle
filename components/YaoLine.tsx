"use client";

import { motion } from "framer-motion";
import type { LineValue } from "@/lib/types";

export function YaoLine({
  value,
  moving = false,
  compact = false,
}: {
  value: LineValue | boolean;
  moving?: boolean;
  compact?: boolean;
}) {
  const yang = typeof value === "boolean" ? value : value === 7 || value === 9;
  const width = compact ? "w-20" : "w-28 sm:w-36";
  const segment = compact ? "w-[34px]" : "w-[48px] sm:w-[62px]";

  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={`relative flex h-[7px] ${width} items-center justify-between`}
    >
      {yang ? (
        <span className="line-glow h-full w-full rounded-full bg-current" />
      ) : (
        <>
          <span className={`line-glow h-full ${segment} rounded-full bg-current`} />
          <span className={`line-glow h-full ${segment} rounded-full bg-current`} />
        </>
      )}
      {moving && (
        <motion.span
          animate={{ opacity: [0.35, 1, 0.35], scale: [0.8, 1.15, 0.8] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          className="absolute -right-5 h-1.5 w-1.5 rounded-full bg-[#f0c978]"
        />
      )}
    </motion.div>
  );
}
