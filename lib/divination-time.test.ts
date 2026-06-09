import { describe, expect, it } from "vitest";
import { Lunar } from "lunar-javascript";

describe("精確干支邊界", () => {
  it("節氣發生前不提前切換月建", () => {
    const beforeLiChun = Lunar.fromDate(new Date(2026, 1, 4, 4, 2, 7));
    const atLiChun = Lunar.fromDate(new Date(2026, 1, 4, 4, 2, 8));
    expect(beforeLiChun.getMonthZhiExact()).toBe("丑");
    expect(atLiChun.getMonthZhiExact()).toBe("寅");
  });

  it("採子初二十三時換日", () => {
    const before = Lunar.fromDate(new Date(2026, 5, 9, 22, 59));
    const after = Lunar.fromDate(new Date(2026, 5, 9, 23, 0));
    expect(before.getDayInGanZhiExact()).toBe("甲寅");
    expect(after.getDayInGanZhiExact()).toBe("乙卯");
  });
});
