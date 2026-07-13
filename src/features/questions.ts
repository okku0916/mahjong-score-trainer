import {
  calculateScore,
  paymentLabel,
  type ScoreCondition,
} from "../domain/score";
import type { MeldInput } from "../domain/mahjong/hand";
import { generateHandScenario } from "./practice/generators/handGenerator";
export type Mode = "fu" | "han" | "score";
export interface Question {
  id: string;
  mode: Mode;
  title: string;
  facts: string[];
  tiles?: string[];
  winTile?: string;
  melds?: MeldInput[];
  doraIndicators?: string[];
  uraDoraIndicators?: string[];
  choices: string[];
  answer: string;
  explanation: string[];
  tags: string[];
  source: "generated" | "fallback";
}
const pick = <T>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
const shuffle = <T>(xs: T[]) => [...xs].sort(() => Math.random() - 0.5);
export const tileSrc = (id: string) => `/tiles/${id}-66-90-l.png`;
const lastFingerprint: Partial<Record<Mode, string>> = {};

function fuQuestion(): Question {
  const scenario = generateHandScenario("fu", {
    excludeFingerprint: lastFingerprint.fu,
  });
  lastFingerprint.fu = scenario.fingerprint;
  const result = scenario.result;
  const fu = result.fu!;
  const explanation = [...fu.items.map((item) => `${item.label} ${item.fu}符`)];
  if (fu.rawFu !== fu.roundedFu)
    explanation.push(`合計${fu.rawFu}符 → ${fu.roundedFu}符に切り上げ`);
  else explanation.push(`合計 ${fu.roundedFu}符`);
  return {
    id: crypto.randomUUID(),
    mode: "fu",
    title: "この和了は何符？",
    facts: scenario.facts,
    tiles: scenario.hand.concealedTiles,
    winTile: scenario.hand.winningTile,
    melds: scenario.hand.melds,
    choices: [
      "20符",
      "25符",
      "30符",
      "40符",
      "50符",
      "60符",
      "70符",
      "80符",
      "90符",
      "100符",
      "110符",
    ],
    answer: `${fu.roundedFu}符`,
    explanation,
    tags: ["符計算", ...scenario.tags],
    source: scenario.source,
  };
}
function hanQuestion(): Question {
  const scenario = generateHandScenario("han", {
    excludeFingerprint: lastFingerprint.han,
  });
  lastFingerprint.han = scenario.fingerprint;
  const result = scenario.result;
  if (result.yakumanMultiplier) {
    const answer =
      result.yakumanMultiplier === 1
        ? "役満"
        : `${result.yakumanMultiplier}倍役満`;
    return {
      id: crypto.randomUUID(),
      mode: "han",
      title: "合計で何翻？",
      facts: scenario.facts,
      tiles: scenario.hand.concealedTiles,
      winTile: scenario.hand.winningTile,
      melds: scenario.hand.melds,
      doraIndicators: scenario.hand.context.doraIndicators,
      uraDoraIndicators: scenario.hand.context.uraDoraIndicators,
      choices: [
        ...new Set([
          "3翻",
          "6翻",
          "13翻",
          "役満",
          "2倍役満",
          "3倍役満以上",
          answer,
        ]),
      ],
      answer,
      explanation: [...result.yaku.map((item) => item.name), `合計 ${answer}`],
      tags: ["翻数計算", "役満", ...scenario.tags],
      source: scenario.source,
    };
  }
  return {
    id: crypto.randomUUID(),
    mode: "han",
    title: "合計で何翻？",
    facts: scenario.facts,
    tiles: scenario.hand.concealedTiles,
    winTile: scenario.hand.winningTile,
    melds: scenario.hand.melds,
    doraIndicators: scenario.hand.context.doraIndicators,
    uraDoraIndicators: scenario.hand.context.uraDoraIndicators,
    choices: Array.from({ length: 13 }, (_, index) => `${index + 1}翻`),
    answer: `${result.han}翻`,
    explanation: [
      ...result.yaku.map((item) => `${item.name} ${item.han}翻`),
      `合計 ${result.han}翻`,
    ],
    tags: ["翻数計算", ...scenario.tags],
    source: scenario.source,
  };
}
function scoreQuestion(): Question {
  const conditions: ScoreCondition[] = [
    { dealer: false, winMethod: "ron", fu: 30, han: 4 },
    { dealer: true, winMethod: "ron", fu: 60, han: 3 },
    { dealer: false, winMethod: "tsumo", fu: 40, han: 3 },
    { dealer: true, winMethod: "tsumo", fu: 30, han: 4 },
    { dealer: false, winMethod: "ron", fu: 30, han: 5 },
    { dealer: false, winMethod: "tsumo", yakumanMultiplier: 2 },
  ];
  const available = conditions.filter(
    (condition) => JSON.stringify(condition) !== lastFingerprint.score,
  );
  const c = pick(available);
  lastFingerprint.score = JSON.stringify(c);
  const r = calculateScore(c),
    answer = paymentLabel(r.payment);
  const distractors =
    c.winMethod === "ron"
      ? [
          "3,900点",
          "7,700点",
          "8,000点",
          "11,600点",
          "12,000点",
          "16,000点",
          "32,000点",
          "64,000点",
        ]
      : [
          "1,000点オール",
          "2,000点オール",
          "3,900点オール",
          "4,000点オール",
          "親 3,900点 / 子 2,000点",
          "親 32,000点 / 子 16,000点",
        ];
  const facts = [
    c.dealer ? "親" : "子",
    c.winMethod === "ron" ? "ロン" : "ツモ",
    c.yakumanMultiplier
      ? `${c.yakumanMultiplier}倍役満`
      : `${c.fu}符 ${c.han}翻`,
  ];
  return {
    id: crypto.randomUUID(),
    mode: "score",
    title: c.winMethod === "ron" ? "受取点数は？" : "各プレイヤーの支払いは？",
    facts,
    choices: shuffle([
      answer,
      ...shuffle(distractors.filter((x) => x !== answer)).slice(0, 3),
    ]),
    answer,
    explanation: [
      `基本点：${r.basicPoints.toLocaleString()}点`,
      r.limitName
        ? `点数区分：${r.limitName}`
        : "基本点に親・子と和了方法の倍率を適用",
      `100点単位に切り上げ：${answer}`,
    ],
    tags: ["点数計算"],
    source: "generated",
  };
}
export const createQuestion = (mode: Mode): Question =>
  mode === "fu"
    ? fuQuestion()
    : mode === "han"
      ? hanQuestion()
      : scoreQuestion();
