import { describe, expect, it } from "vitest";
import { castYarrowLine } from "@/lib/divination";
import { deriveHexagrams, describeHexagram } from "@/lib/hexagrams";

describe("大衍之數", () => {
  it.each([
    [1, 6], [2, 9], [5, 7], [10, 8],
  ])("依十六分位映射爻值", (draw, expected) => {
    expect(castYarrowLine(() => draw)).toBe(expected);
  });

  it("推導乾卦與動爻後的坤卦", () => {
    const result = deriveHexagrams([9, 9, 9, 9, 9, 9]);
    expect(result.primary.name).toBe("乾為天");
    expect(result.transformed.name).toBe("坤為地");
    expect(result.movingLines).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("完整涵蓋六十四卦", () => {
    const names = new Set<string>();
    for (let value = 0; value < 64; value += 1) {
      const lines = Array.from({ length: 6 }, (_, index) => Boolean(value & (1 << index)));
      names.add(describeHexagram(lines).name);
    }
    expect(names.size).toBe(64);
    expect(names.has(undefined as unknown as string)).toBe(false);
  });

  // 防回歸：非對稱八卦（震艮兌巽）的字串編碼曾經與 slice 順序方向相反，造成對應錯誤。
  it.each([
    // lines 由下而上（1=陽 0=陰）
    [[1, 0, 0, 0, 0, 1], "山雷頤"],   // 下震 上艮
    [[0, 0, 1, 0, 0, 0], "地山謙"],   // 下艮 上坤
    [[1, 0, 0, 0, 0, 0], "地雷復"],   // 下震 上坤
    [[1, 1, 0, 1, 0, 0], "雷澤歸妹"], // 下兌 上震
    [[0, 1, 1, 0, 0, 0], "地風升"],   // 下巽 上坤
    [[1, 0, 1, 0, 0, 1], "山火賁"],   // 下離 上艮
  ])("正確對應非對稱八卦組合: %s", (rawLines, name) => {
    expect(describeHexagram(rawLines.map(Boolean)).name).toBe(name);
  });

  it("動爻變化方向與之卦自洽（謙之坤 ⇄ 復之坤）", () => {
    // 真實 lines=[9,8,8,8,8,8]：初九動 → 本卦地雷復、之卦坤為地
    const r = deriveHexagrams([9, 8, 8, 8, 8, 8]);
    expect(r.primary.name).toBe("地雷復");
    expect(r.transformed.name).toBe("坤為地");
    expect(r.movingLines).toEqual([1]);
  });
});
