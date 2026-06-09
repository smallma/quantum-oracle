import { describe, expect, it } from "vitest";
import {
  buildFacts,
  lookupScripture,
  normalizeStrategies,
  renderVerifiedAnalysis,
  verifyDivination,
} from "@/lib/interpretation";
import { deriveHexagrams } from "@/lib/hexagrams";
import type { DivinationResult } from "@/lib/types";

// 設計這組資料時，lines = [9,7,8,8,7,8]，動爻在第 1 爻，
// 由下而上：陽動、陽、陰、陰、陽、陰 → 本卦下乾上坎之變 (實際本卦由 hexagrams.ts 推導)
const baseResult: DivinationResult = {
  castAt: "2026-06-09T04:00:00.000Z",
  timeZone: "Asia/Taipei",
  utcOffsetMinutes: 480,
  dayBoundary: "23:00",
  lines: [9, 7, 8, 8, 7, 8],
  primary: { name: "placeholder", upper: "", lower: "", lines: [] },
  transformed: { name: "placeholder", upper: "", lower: "", lines: [] },
  movingLines: [1],
  monthBranch: "午",
  dayGanZhi: "甲寅",
  dayBranch: "寅",
};

function realResult(): DivinationResult {
  return { ...baseResult, ...deriveHexagrams(baseResult.lines) };
}

describe("經文查詢", () => {
  it("64 卦皆可查到卦辭與六條爻辭", () => {
    const allNames = [
      "乾為天", "坤為地", "火天大有", "山天大畜", "水火既濟", "火水未濟",
    ];
    for (const n of allNames) {
      const s = lookupScripture(n);
      expect(s.gua.length).toBeGreaterThan(0);
      expect(s.yao).toHaveLength(6);
      s.yao.forEach((y) => expect(y.length).toBeGreaterThan(0));
    }
  });

  it("查無此卦會丟出錯誤", () => {
    expect(() => lookupScripture("不存在卦")).toThrow();
  });
});

describe("策略名單", () => {
  it("丟棄未核准策略", () => {
    expect(normalizeStrategies(["commit", "保證發財", "small-test"])).toEqual([
      "commit",
      "small-test",
    ]);
  });
});

describe("可驗證解讀", () => {
  it("buildFacts 帶入本卦/之卦卦辭與動爻爻辭", () => {
    const facts = buildFacts(realResult());
    expect(facts.find((f) => f.id === "primary-gua")?.statement).toMatch(/本卦卦辭：.+/);
    expect(facts.find((f) => f.id === "transformed-gua")?.statement).toMatch(/之卦卦辭：.+/);
    expect(facts.find((f) => f.id === "yao-1")?.statement).toMatch(/第1爻.+爻辭：.+/);
  });

  it("fallback 輸出含經文原文與判讀界線聲明", () => {
    const facts = buildFacts(realResult());
    const text = renderVerifiedAnalysis(facts, ["clarify"]);
    expect(text).toContain("本卦卦辭");
    expect(text).toContain("之卦卦辭");
    expect(text).toContain("不推斷五行旺衰、吉凶結果或具體應期");
    expect(text).not.toMatch(/一定會|必然發生|保證獲利|保證成功/);
  });

  it("拒絕前端竄改主卦", () => {
    const derived = deriveHexagrams(baseResult.lines);
    expect(() => verifyDivination({
      ...baseResult,
      ...derived,
      primary: { ...derived.primary, name: "乾為天" },
    })).toThrow("卦象資料與六爻原始值不一致");
  });

  it("拒絕前端竄改月建與日辰", () => {
    const derived = deriveHexagrams(baseResult.lines);
    expect(() => verifyDivination({
      ...baseResult,
      ...derived,
      monthBranch: "子",
    })).toThrow("月建或日辰與占卜時間不一致");
  });
});
