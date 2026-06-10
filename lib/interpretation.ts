import { deriveHexagrams, deriveMutualHexagram } from "@/lib/hexagrams";
import { lookupMeaning } from "@/lib/hexagram-meanings";
import { Lunar } from "lunar-javascript";
import scriptureData from "@/lib/scripture.json";
import type {
  DivinationResult,
  InterpretationFact,
  LineValue,
  ReadingSelection,
  RuleConclusion,
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

const TRIGRAM_MEANINGS: Record<string, { image: string; quality: string }> = {
  乾: { image: "天", quality: "主動、剛健、持續推進" },
  坤: { image: "地", quality: "承載、包容、順勢配合" },
  坎: { image: "水", quality: "險阻、流動、反覆試煉" },
  離: { image: "火", quality: "明察、依附、顯現與照亮" },
  震: { image: "雷", quality: "啟動、震動、突發變化" },
  巽: { image: "風", quality: "滲透、溝通、漸進影響" },
  艮: { image: "山", quality: "停止、界線、穩住位置" },
  兌: { image: "澤", quality: "交流、喜悅、開放互動" },
};

const WEATHER_KEYWORDS = /天氣|氣象|下雨|會雨|雨勢|晴天|晴朗|陰天|多雲|颱風|雷雨|帶傘|戶外|出門.*雨/;

const WEATHER_WEIGHTS: Record<string, Partial<Record<RuleConclusion["verdict"], number>>> = {
  乾: { clear: 3 },
  坤: { cloudy: 3 },
  坎: { rain: 4 },
  離: { clear: 3 },
  震: { storm: 3, changeable: 1 },
  巽: { wind: 3, changeable: 1 },
  艮: { cloudy: 1 },
  兌: { rain: 1, cloudy: 1 },
};

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

  const mutual = deriveMutualHexagram(result.primary.lines);
  facts.push({
    id: "mutual",
    statement: `互卦為「${mutual.name}」（${mutual.upper}上${mutual.lower}下），用來觀察局勢內在發展。`,
  });

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

function lineFact(pos: number, scripture: Scripture, transformed = false): InterpretationFact {
  return {
    id: `${transformed ? "transformed-" : ""}yao-${pos}`,
    statement: `${transformed ? "之卦" : "本卦"}第${pos}爻（${YAO_POSITION_NAMES[pos - 1]}）爻辭：${scripture.yao[pos - 1]}`,
  };
}

export function selectReading(result: DivinationResult): ReadingSelection {
  const count = result.movingLines.length;
  const primary = lookupScripture(result.primary.name);
  const transformed = lookupScripture(result.transformed.name);
  const unchanged = [1, 2, 3, 4, 5, 6].filter((pos) => !result.movingLines.includes(pos));

  if (count === 0) {
    return { rule: "靜卦：以本卦卦辭為主。", classical: [primary.gua], evidenceIds: ["primary-gua"] };
  }
  if (count === 1) {
    const pos = result.movingLines[0];
    return { rule: "一爻動：以本卦動爻為主。", classical: [primary.yao[pos - 1]], evidenceIds: [`yao-${pos}`] };
  }
  if (count === 2) {
    const positions = [...result.movingLines].sort((a, b) => b - a);
    return {
      rule: "二爻動：兼看兩條動爻，以上爻為主。",
      classical: positions.map((pos) => primary.yao[pos - 1]),
      evidenceIds: positions.map((pos) => `yao-${pos}`),
    };
  }
  if (count === 3) {
    return {
      rule: "三爻動：比較本卦與之卦卦辭，觀察前後轉變。",
      classical: [primary.gua, transformed.gua],
      evidenceIds: ["primary-gua", "transformed-gua"],
    };
  }
  if (count === 4) {
    const positions = [...unchanged].sort((a, b) => a - b);
    return {
      rule: "四爻動：以之卦兩條不變爻為主，以下爻為主。",
      classical: positions.map((pos) => transformed.yao[pos - 1]),
      evidenceIds: positions.map((pos) => `transformed-yao-${pos}`),
    };
  }
  if (count === 5) {
    const pos = unchanged[0];
    return {
      rule: "五爻動：以之卦唯一不變爻為主。",
      classical: [transformed.yao[pos - 1]],
      evidenceIds: [`transformed-yao-${pos}`],
    };
  }
  if (result.primary.name === "乾為天") {
    return {
      rule: "乾卦六爻皆動：採用九。",
      classical: ["用九：見群龍无首，吉。"],
      evidenceIds: ["use-nine"],
    };
  }
  if (result.primary.name === "坤為地") {
    return {
      rule: "坤卦六爻皆動：採用六。",
      classical: ["用六：利永貞。"],
      evidenceIds: ["use-six"],
    };
  }
  return {
    rule: "六爻皆動：以之卦卦辭觀其結果。",
    classical: [transformed.gua],
    evidenceIds: ["transformed-gua"],
  };
}

export function buildInterpretationFacts(result: DivinationResult): InterpretationFact[] {
  const facts = buildFacts(result);
  const transformed = lookupScripture(result.transformed.name);
  const selection = selectReading(result);
  for (const id of selection.evidenceIds) {
    const match = id.match(/^transformed-yao-(\d)$/);
    if (match) facts.push(lineFact(Number(match[1]), transformed, true));
  }
  facts.push({ id: "reading-rule", statement: selection.rule });
  if (selection.evidenceIds.includes("use-nine")) {
    facts.push({ id: "use-nine", statement: "乾卦用九：見群龍无首，吉。" });
  }
  if (selection.evidenceIds.includes("use-six")) {
    facts.push({ id: "use-six", statement: "坤卦用六：利永貞。" });
  }
  facts.push({ id: "primary-meaning", statement: `本卦固定卦意：${lookupMeaning(result.primary.name)}` });
  facts.push({ id: "transformed-meaning", statement: `之卦固定卦意：${lookupMeaning(result.transformed.name)}` });
  return facts;
}

function addScore(
  scores: Record<string, number>,
  trigram: string,
  weight: number,
) {
  for (const [verdict, score] of Object.entries(WEATHER_WEIGHTS[trigram] ?? {})) {
    scores[verdict] = (scores[verdict] ?? 0) + Number(score) * weight;
  }
}

export function deriveRuleConclusion(question: string, result: DivinationResult): RuleConclusion {
  const reading = selectReading(result);
  if (!WEATHER_KEYWORDS.test(question)) {
    const isStatic = result.movingLines.length === 0;
    return {
      category: "general",
      verdict: "mixed",
      directAnswer: isStatic
        ? `這次是靜卦，卦象沒有顯示明顯轉折；針對「${question}」，目前情勢較可能延續既有格局，宜先看清條件再決定是否前進。`
        : `針對「${question}」，卦象顯示事情正由「${result.primary.name}」的現況，往「${result.transformed.name}」所代表的方向轉變。`,
      action: result.movingLines.length >= 3
        ? `局勢變動較多，先比較「${result.primary.name}」到「${result.transformed.name}」的差異，再決定下一步。`
        : isStatic
          ? "先補足資訊、確認限制與可用資源；若要行動，採取可回頭的小步驟，並觀察現況是否出現新的變化訊號。"
          : "先依動爻揭示的關鍵位置檢查現況，再採取一個可驗證、可調整的小步驟。",
      confidence: "low",
      evidenceIds: [...reading.evidenceIds, "reading-rule", "primary-meaning"],
    };
  }

  const mutual = deriveMutualHexagram(result.primary.lines);
  const scores: Record<string, number> = {};
  addScore(scores, result.primary.upper, 3);
  addScore(scores, result.primary.lower, 3);
  addScore(scores, mutual.upper, 1);
  addScore(scores, mutual.lower, 1);
  addScore(scores, result.transformed.upper, 1);
  addScore(scores, result.transformed.lower, 1);
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [first, second] = ranked;
  const verdict = (first?.[0] ?? "changeable") as RuleConclusion["verdict"];
  const close = !first || Boolean(second && first[1] - second[1] <= 2);
  const labels: Record<RuleConclusion["verdict"], string> = {
    clear: "偏晴朗或日照較明顯",
    cloudy: "偏陰或雲量較多",
    rain: "偏向有雨或濕度升高",
    wind: "偏向風勢較明顯",
    storm: "偏向有雷雨或突發變化",
    changeable: "偏向天氣快速變化",
    mixed: "訊號互相衝突，難判單一走向",
  };
  const finalVerdict = close ? "mixed" : verdict;
  return {
    category: "weather",
    verdict: finalVerdict,
    directAnswer: close
      ? "卦象中的天氣訊號互相牽制，無法可靠判成單一晴雨結果。"
      : `依卦象規則，本次天氣傾向${labels[verdict]}。`,
    action: ["rain", "storm", "mixed", "changeable"].includes(finalVerdict)
      ? "安排戶外活動時保留備案並攜帶雨具；卦象不是氣象觀測，出門前仍應查即時預報。"
      : "戶外安排可照常準備，但卦象不是氣象觀測，出門前仍應查即時預報。",
    confidence: close ? "low" : "medium",
    evidenceIds: ["primary", "mutual", "transformed", "reading-rule"],
  };
}

export function describeHexagramStructure(result: DivinationResult): string {
  const upper = TRIGRAM_MEANINGS[result.primary.upper];
  const lower = TRIGRAM_MEANINGS[result.primary.lower];
  return `本卦「${result.primary.name}」由上卦${result.primary.upper}（象${upper.image}，重點為${upper.quality}）與下卦${result.primary.lower}（象${lower.image}，重點為${lower.quality}）組成。下卦可視為事情的內在基礎與起點，上卦則呈現外在環境與後續表現；兩者合看，形成此卦的整體處境。`;
}

export function describeTransformation(result: DivinationResult): string {
  if (result.movingLines.length === 0) {
    return `本次六爻皆靜，因此沒有形成不同的變卦；畫面中的本卦與之卦相同是正常結果。這表示卦象重點集中在「${result.primary.name}」本身，目前格局偏向延續，短期內未呈現明顯轉折。`;
  }
  const transformedUpper = TRIGRAM_MEANINGS[result.transformed.upper];
  const transformedLower = TRIGRAM_MEANINGS[result.transformed.lower];
  return `本次第 ${result.movingLines.join("、")} 爻變動，使本卦轉為「${result.transformed.name}」。之卦由上${result.transformed.upper}（象${transformedUpper.image}，${transformedUpper.quality}）與下${result.transformed.lower}（象${transformedLower.image}，${transformedLower.quality}）組成，用來觀察事情經過變化後較可能呈現的趨勢。`;
}

export function renderThreePartAnalysis(
  result: DivinationResult,
  conclusion: RuleConclusion,
): string {
  const selection = selectReading(result);
  const transformedMeaning = result.primary.name === result.transformed.name
    ? ""
    : `\n\n之卦趨勢\n${lookupMeaning(result.transformed.name)}`;
  return [
    `經文原文\n${selection.classical.join("\n")}`,
    `本卦卦象\n${describeHexagramStructure(result)}\n\n本卦卦意\n${lookupMeaning(result.primary.name)}`,
    `變化趨勢\n${describeTransformation(result)}${transformedMeaning}`,
    `針對你的提問\n結論：${conclusion.directAnswer}\n\n判斷依據：本次依「${selection.rule}」判讀，並以本卦所呈現的現況與之卦所顯示的變化方向交叉檢查。\n\n建議策略：${conclusion.action}`,
    `判讀規則\n${selection.rule}`,
    `可信程度：${conclusion.confidence === "medium" ? "中等" : "偏低"}。卦象只提供象徵性參考，不是事實保證。`,
  ].join("\n\n");
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
