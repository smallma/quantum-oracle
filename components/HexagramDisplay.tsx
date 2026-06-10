"use client";

import { motion } from "framer-motion";
import { YaoLine } from "@/components/YaoLine";
import type { HexagramInfo } from "@/lib/types";

export function HexagramDisplay({
  label,
  hexagram,
  movingLines = [],
  note,
}: {
  label: string;
  hexagram: HexagramInfo;
  movingLines?: number[];
  note?: string;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="oracle-card flex min-w-0 flex-1 items-center justify-between gap-6 p-6 sm:p-8"
    >
      <div>
        <p className="mb-2 text-[10px] tracking-[0.35em] text-[#9b8a68]">{label}</p>
        <h3 className="font-serif text-2xl text-[#f2dfb3] sm:text-3xl">{hexagram.name}</h3>
        <p className="mt-3 text-xs tracking-[0.24em] text-[#7f786a]">
          上{hexagram.upper} · 下{hexagram.lower}
        </p>
        {note && <p className="mt-4 max-w-44 text-xs leading-5 text-[#8d8578]">{note}</p>}
      </div>
      <div className="flex flex-col gap-2.5 text-[#d6b66e]">
        {[...hexagram.lines].reverse().map((line, reverseIndex) => {
          const position = 6 - reverseIndex;
          return (
            <YaoLine
              key={position}
              value={line}
              moving={movingLines.includes(position)}
              compact
            />
          );
        })}
      </div>
    </motion.article>
  );
}
