import type { HexagramInfo, LineValue } from "@/lib/types";

// 字串順序為「初爻→中爻→上爻」（由下而上），與 describeHexagram 的 slice 順序一致
const TRIGRAMS: Record<string, string> = {
  "111": "乾",
  "110": "兌",
  "101": "離",
  "100": "震",
  "011": "巽",
  "010": "坎",
  "001": "艮",
  "000": "坤",
};

const HEXAGRAM_NAMES: Record<string, string> = {
  "乾-乾": "乾為天", "坤-坤": "坤為地", "坎-震": "水雷屯", "艮-坎": "山水蒙",
  "坎-乾": "水天需", "乾-坎": "天水訟", "坤-坎": "地水師", "坎-坤": "水地比",
  "巽-乾": "風天小畜", "乾-兌": "天澤履", "坤-乾": "地天泰", "乾-坤": "天地否",
  "乾-離": "天火同人", "離-乾": "火天大有", "坤-艮": "地山謙", "震-坤": "雷地豫",
  "兌-震": "澤雷隨", "艮-巽": "山風蠱", "坤-兌": "地澤臨", "巽-坤": "風地觀",
  "離-震": "火雷噬嗑", "艮-離": "山火賁", "艮-坤": "山地剝", "坤-震": "地雷復",
  "乾-震": "天雷無妄", "艮-乾": "山天大畜", "艮-震": "山雷頤", "兌-巽": "澤風大過",
  "坎-坎": "坎為水", "離-離": "離為火", "兌-艮": "澤山咸", "震-巽": "雷風恆",
  "乾-艮": "天山遯", "震-乾": "雷天大壯", "離-坤": "火地晉", "坤-離": "地火明夷",
  "巽-離": "風火家人", "離-兌": "火澤睽", "坎-艮": "水山蹇", "震-坎": "雷水解",
  "艮-兌": "山澤損", "巽-震": "風雷益", "兌-乾": "澤天夬", "乾-巽": "天風姤",
  "兌-坤": "澤地萃", "坤-巽": "地風升", "兌-坎": "澤水困", "坎-巽": "水風井",
  "兌-離": "澤火革", "離-巽": "火風鼎", "震-震": "震為雷", "艮-艮": "艮為山",
  "巽-艮": "風山漸", "震-兌": "雷澤歸妹", "震-離": "雷火豐", "離-艮": "火山旅",
  "巽-巽": "巽為風", "兌-兌": "兌為澤", "巽-坎": "風水渙", "坎-兌": "水澤節",
  "巽-兌": "風澤中孚", "震-艮": "雷山小過", "坎-離": "水火既濟", "離-坎": "火水未濟",
};

export function describeHexagram(lines: boolean[]): HexagramInfo {
  const lower = TRIGRAMS[lines.slice(0, 3).map(Number).join("")];
  const upper = TRIGRAMS[lines.slice(3, 6).map(Number).join("")];
  return { name: HEXAGRAM_NAMES[`${upper}-${lower}`], upper, lower, lines };
}

export function deriveHexagrams(values: LineValue[]) {
  const primaryLines = values.map((value) => value === 7 || value === 9);
  const transformedLines = values.map((value) =>
    value === 6 ? true : value === 9 ? false : value === 7,
  );

  return {
    primary: describeHexagram(primaryLines),
    transformed: describeHexagram(transformedLines),
    movingLines: values.flatMap((value, index) =>
      value === 6 || value === 9 ? [index + 1] : [],
    ),
  };
}

export function deriveMutualHexagram(lines: boolean[]): HexagramInfo {
  if (lines.length !== 6) throw new Error("互卦需要完整六爻。");
  return describeHexagram([lines[1], lines[2], lines[3], lines[2], lines[3], lines[4]]);
}
