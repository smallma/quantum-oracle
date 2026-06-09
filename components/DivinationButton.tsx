"use client";

import { motion } from "framer-motion";

export function DivinationButton({
  disabled,
  active,
  onClick,
}: {
  disabled: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.015 }}
      whileTap={disabled ? undefined : { scale: 0.985 }}
      className="group relative h-14 w-full overflow-hidden rounded-full border border-[#9f8143]/45 bg-[#b7924d]/10 text-xs tracking-[0.34em] text-[#f1d89b] transition disabled:cursor-not-allowed disabled:opacity-45"
    >
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#e7c574]/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative">{active ? "卦象凝聚中" : "開始卜卦"}</span>
    </motion.button>
  );
}
