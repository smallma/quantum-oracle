import { deriveHexagrams } from "@/lib/hexagrams";
import { Lunar } from "lunar-javascript";
import scriptureData from "@/lib/scripture.json";
import type {
  DivinationResult,
  InterpretationFact,
  LineValue,
  Scripture,
  StrategyId,
} from "@/lib/types";

const SCRIPTURE = scriptureData as Record<string, Scripture>;

export const STRATEGIES: Record<StrategyId, string> = {
  pause: "先保留決定空間，不要因一時壓力倉促定案。",
  "small-test": "把下一步縮成低成本的小測試，用實際回饋取代猜測。",
  clarify: "先寫清楚真正要解決的核心問題，避免同時追逐太多目標。",
  "seek-feedback": "找一位立場不同但可信任的人，檢查你可能忽略的盲點。",
  "protect-energy": "先守住時間、注意力與資源，停止沒有明確回報的消耗。",
  commit: "選定一個可控方向持續推進，避免因反覆猶豫而耗損。",
  adapt: "保留調整空間；當新資訊出現時，允許策略改變而非硬撐。",
  simplify: "刪除非必要步驟，把複雜局面整理成一個可以立即執行的行動。",
};

const DEFAULT_STRATEGIES: StrategyId[] = ["clarify", "small-test", "seek-feedback"];

const YAO_POSITION_NAMES = ["初", "二", "三", "四", "五", "上"];

export function lookupScripture(name: string): Scripture {
  const s = SCRIPTURE[name];
  if (!s) throw new Error(`查無「${name}」經文資料`);
  return s;
}

function assertLines(lines: unknown): asserts lines is LineValue[] {
  if (
    !Array.isArray(lines) ||
    lines.length !== 6 ||
    lines.some((line) => ![6, 7, 8, 9].includes(Number(line)))
  ) {
    throw new Error("六爻資料必須完整且只能包含 6、7、8、9。");
  }
}

export function verifyDivination(input: DivinationResult): DivinationResult {
  assertLines(input.lines);
  const derived = deriveHexagrams(input.lines);
  if (
    input.primary?.name !== derived.primary.name ||
    input.transformed?.name !== derived.transformed.name ||
    JSON.stringify(input.movingLines) !== JSON.stringify(derived.movingLines)
  ) {
    throw new Error("卦象資料與六爻原始值不一致。");
  }
  if (!/^[子丑寅卯辰巳午未申酉戌亥]$/.test(input.monthBranch)) {
    throw new Error("月建格式不正確。");
  }
  if (!/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/.test(input.dayGanZhi)) {
    throw new Error("日辰格式不正確。");
  }
  if (input.dayBoundary !== "23:00") {
    throw new Error("日辰換日規則不一致。");
  }
  const instant = new Date(input.castAt);
  if (Number.isNaN(instant.getTime())) throw new Error("占卜時間格式不正確。");

  let parts: Record<string, string>;
  try {
    parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: input.timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }).formatToParts(instant).map((part) => [part.type, part.value]),
    );
  } catch {
    throw new Error("時區格式不正確。");
  }

  const wallClock = new Date(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  const lunar = Lunar.fromDate(wallClock);
  if (
    input.monthBranch !== lunar.getMonthZhiExact() ||
    input.dayGanZhi !== lunar.getDayInGanZhiExact() ||
    input.dayBranch !== lunar.getDayZhiExact()
  ) {
    throw new Error("月建或日辰與占卜時間不一致。");
  }
  return { ...input, ...derived };
}

export function buildFacts(result: DivinationResult): InterpretationFact[] {
  const primaryS = lookupScripture(result.primary.name);
  const transformedS = lookupScripture(result.transformed.name);

  const facts: InterpretationFact[] = [
    {
      id: "primary",
      statement: `本卦為「${result.primary.name}」（${result.primary.upper}上${result.primary.lower}下）。`,
    },
    { id: "primary-gua", statement: `本卦卦辭：${primaryS.gua}` },
    {
      id: "transformed",
      statement: `之卦為「${result.transformed.name}」（${result.transformed.upper}上${result.transformed.lower}下）。`,
    },
    { id: "transformed-gua", statement: `之卦卦辭：${transformedS.gua}` },
    {
      id: "moving",
      statement: result.movingLines.length
        ? `動爻位於第 ${result.movingLines.join("、")} 爻。`
        : "本次六爻皆不變，為靜卦。",
    },
  ];

  result.movingLines.forEach((pos) => {
    const yao = primaryS.yao[pos - 1];
    facts.push({
      id: `yao-${pos}`,
      statement: `第${pos}爻（${YAO_POSITION_NAMES[pos - 1]}）動，爻辭：${yao}`,
    });
  });

  if (result.movingLines.length === 0) {
    facts.push({ id: "no-moving-hint", statement: "靜卦以本卦卦辭為主要判讀依據。" });
  } else if (result.movingLines.length >= 4) {
    facts.push({ id: "many-moving", statement: "動爻較多（四爻以上），整體局面變動較大，宜以之卦觀其趨勢。" });
  }

  facts.push({ id: "month", statement: `節氣月建為「${result.monthBranch}」。` });
  facts.push({ id: "day", statement: `日辰「${result.dayGanZhi}」，採子初 23:00 換日。` });
  return facts;
}

export function normalizeStrategies(value: unknown): StrategyId[] {
  if (!Array.isArray(value)) return DEFAULT_STRATEGIES;
  const valid = value.filter(
    (item): item is StrategyId => typeof item === "string" && item in STRATEGIES,
  );
  const unique = [...new Set(valid)].slice(0, 3);
  return unique.length ? unique : DEFAULT_STRATEGIES;
}

const DISCLAIMER =
  "以上解讀以《周易》原文為依據，著重整理思路；本系統不推斷五行旺衰、吉凶結果或具體應期，請以實際資訊與自身判斷為主。";

// LLM 失敗時的 fallback：用經文原文 + 通用策略構成解讀
export function renderVerifiedAnalysis(
  facts: InterpretationFact[],
  strategyIds: StrategyId[],
): string {
  const get = (id: string) => facts.find((f) => f.id === id)?.statement ?? "";
  const movingFacts = facts.filter((f) => f.id.startsWith("yao-"));
  const movingBlock = movingFacts.length
    ? `\n\n動爻爻辭：\n${movingFacts.map((f) => `· ${f.statement.replace(/^.*?爻辭：/, "")}`).join("\n")}`
    : "\n\n本次為靜卦，以卦辭為主。";

  return [
    `${get("primary")}\n${get("primary-gua")}`,
    `${get("transformed")}\n${get("transformed-gua")}`,
    `${get("moving")}${movingBlock}`,
    "可參考的思考方向：",
    strategyIds.map((id, i) => `${i + 1}. ${STRATEGIES[id]}`).join("\n"),
    DISCLAIMER,
  ].join("\n\n");
}
