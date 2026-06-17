export type LineValue = 6 | 7 | 8 | 9;

export type HexagramInfo = {
  name: string;
  upper: string;
  lower: string;
  lines: boolean[];
};

export type DivinationResult = {
  castAt: string;
  timeZone: string;
  utcOffsetMinutes: number;
  dayBoundary: "23:00";
  lines: LineValue[];
  primary: HexagramInfo;
  transformed: HexagramInfo;
  movingLines: number[];
  monthBranch: string;
  dayGanZhi: string;
  dayBranch: string;
};

export type InterpretationFact = {
  id: string;
  statement: string;
};

export type ReadingSelection = {
  rule: string;
  classical: string[];
  evidenceIds: string[];
};

export type RuleConclusion = {
  category: "weather" | "general";
  verdict: "clear" | "cloudy" | "rain" | "wind" | "storm" | "changeable" | "mixed";
  directAnswer: string;
  action: string;
  confidence: "low" | "medium";
  evidenceIds: string[];
};

// LLM 在程式已判定方向後，補上的具體白話解釋（不得改變方向）
export type LlmConclusion = {
  verdict: string; // 40-80 字，開門見山直答使用者的問題（不得保證結果）
  explanation: string; // 先白話翻譯經文，再連到使用者問題的具體解釋
  basis: string; // 為何用這條經文/動爻判讀（帶入經文實際內容）
  advice: string; // 2-3 條具體可執行的建議
};

// 結構化輸出段落：前端依 llm 與否決定打字機或直接顯示
export type AnalysisSection = {
  id: string;
  title: string;
  body: string;
  llm: boolean; // true 表示內容主要由 LLM 生成
};

export type StrategyId =
  | "pause"
  | "small-test"
  | "clarify"
  | "seek-feedback"
  | "protect-energy"
  | "commit"
  | "adapt"
  | "simplify";

export type VerifiedInterpretation = {
  analysis: string;
  facts: InterpretationFact[];
  strategyIds: StrategyId[];
  mode: "rule-engine" | "verified-llm" | "verified-fallback";
};

export type Scripture = {
  trad: string;
  gua: string;
  yao: string[];
};
