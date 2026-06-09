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
  mode: "verified" | "verified-llm" | "verified-fallback";
};

export type Scripture = {
  trad: string;
  gua: string;
  yao: string[];
};
