import type { LlmConclusion, RuleConclusion } from "@/lib/types";

// 保證性字眼與具體應期：偵測到即整段拒收（退回模板），不做遮蔽以免產生殘句
const FORBIDDEN_PATTERNS = [
  /一定(會|能|可以|不會)/,
  /必然|必定|鐵定|十拿九穩|百分之百|穩(贏|過|上)/,
  /肯定(會|能|可以)/,
  /保證/,
  /絕對/,
  /\d{1,3}\s*[%％]/,
  /[一二兩三四五六七八九十]成(把握|機率|會)/,
  /([一二兩三四五六七八九十百千]|\d+)\s*(天|日|週|周|個?月|年)[內前]/,
  /農曆\s*\d/,
];

// 與天氣 verdict 方向矛盾的字眼（程式判雨，LLM 不得說晴）
const WEATHER_CONFLICTS: Partial<Record<RuleConclusion["verdict"], RegExp>> = {
  rain: /晴朗|放晴|天氣晴|不會下雨/,
  storm: /晴朗|放晴|風平浪靜/,
  clear: /會下雨|大雨|降雨機率高/,
};

export function violatesGuard(s: string): boolean {
  return FORBIDDEN_PATTERNS.some((pattern) => pattern.test(s));
}

export function truncateAtSentence(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s;
  const cut = s.slice(0, maxLen);
  const trimmed = cut.replace(/[^。！？]*$/, "");
  return trimmed || cut + "…";
}

function cleanText(s: unknown, maxLen: number): string {
  if (typeof s !== "string") return "";
  // 移除控制字元
  const t = s.replace(/[\x00-\x1f]/g, " ").trim();
  return truncateAtSentence(t, maxLen);
}

export function parseLlmConclusion(
  raw: unknown,
  conclusion: RuleConclusion,
): LlmConclusion | null {
  if (typeof raw !== "string") return null;
  try {
    const clean = raw
      .replace(/<think>[\s\S]*?<\/think>/g, "")
      .replace(/```json|```/g, "")
      .trim();
    // 容忍 LLM 在 JSON 前後加贅字：抽出第一個 {...} 區塊
    const candidate = clean.startsWith("{")
      ? clean
      : (clean.match(/\{[\s\S]*\}/)?.[0] ?? clean);
    const obj = JSON.parse(candidate);
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return null;

    const verdict = cleanText(obj.verdict, 200);
    const explanation = cleanText(obj.explanation, 600);
    const basis = cleanText(obj.basis, 320);
    const advice = cleanText(obj.advice, 400);

    // 核心欄位缺漏 → 拒收
    if (verdict.length < 10 || explanation.length < 40 || advice.length < 20) return null;
    // 保證性字眼或具體應期 → 整段拒收
    if ([verdict, explanation, basis, advice].some(violatesGuard)) return null;
    // 與程式判定的天氣方向矛盾 → 拒收
    const conflict = WEATHER_CONFLICTS[conclusion.verdict];
    if (
      conclusion.category === "weather" &&
      conflict &&
      [verdict, explanation].some((t) => conflict.test(t))
    ) {
      return null;
    }

    return { verdict, explanation, basis, advice };
  } catch {
    return null;
  }
}
