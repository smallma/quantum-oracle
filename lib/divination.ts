import { Lunar } from "lunar-javascript";
import { deriveHexagrams } from "@/lib/hexagrams";
import type { DivinationResult, LineValue } from "@/lib/types";

export function randomSixteenth(): number {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return (values[0] % 16) + 1;
}

export function castYarrowLine(drawSixteenth = randomSixteenth): LineValue {
  const draw = drawSixteenth();
  if (draw === 1) return 6;
  if (draw <= 4) return 9;
  if (draw <= 9) return 7;
  return 8;
}

export function castDivination(at = new Date()): DivinationResult {
  const lines = Array.from({ length: 6 }, () => castYarrowLine());
  const hexagrams = deriveHexagrams(lines);
  const lunar = Lunar.fromDate(at);

  return {
    castAt: at.toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    utcOffsetMinutes: -at.getTimezoneOffset(),
    dayBoundary: "23:00",
    lines,
    ...hexagrams,
    monthBranch: lunar.getMonthZhiExact(),
    dayGanZhi: lunar.getDayInGanZhiExact(),
    dayBranch: lunar.getDayZhiExact(),
  };
}
