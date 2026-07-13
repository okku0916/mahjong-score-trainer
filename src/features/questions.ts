import {
  calculateScore,
  paymentLabel,
  type ScoreCondition,
} from "../domain/score";
import { calculateHand, type HandInput } from "../domain/mahjong/hand";
import { tileName } from "../domain/mahjong/tile";
export type Mode = "fu" | "han" | "score";
export interface Question {
  id: string;
  mode: Mode;
  title: string;
  facts: string[];
  tiles?: string[];
  winTile?: string;
  choices: string[];
  answer: string;
  explanation: string[];
  tags: string[];
}
const pick = <T>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
const shuffle = <T>(xs: T[]) => [...xs].sort(() => Math.random() - 0.5);
interface HandScenario {
  hand: HandInput;
  facts: string[];
}
const handScenarios: HandScenario[] = [
  {
    hand: {
      concealedTiles: [
        "man2",
        "man3",
        "man4",
        "pin3",
        "pin4",
        "pin5",
        "sou6",
        "sou7",
        "sou8",
        "pin6",
        "pin7",
        "sou5",
        "sou5",
      ],
      winningTile: "pin8",
      context: { winMethod: "tsumo", roundWind: "east", seatWind: "south" },
    },
    facts: ["子・ツモ", "門前", "場風 東・自風 南"],
  },
  {
    hand: {
      concealedTiles: [
        "man1",
        "man1",
        "man1",
        "pin4",
        "pin5",
        "pin6",
        "sou7",
        "sou8",
        "sou9",
        "sou2",
        "sou2",
        "sou2",
        "ji1",
      ],
      winningTile: "ji1",
      context: {
        winMethod: "ron",
        roundWind: "east",
        seatWind: "east",
        riichi: true,
      },
    },
    facts: ["親・ロン", "門前・リーチ", "場風 東・自風 東"],
  },
  {
    hand: {
      concealedTiles: [
        "man2",
        "man2",
        "man3",
        "man3",
        "pin4",
        "pin4",
        "pin5",
        "pin5",
        "sou6",
        "sou6",
        "sou7",
        "sou7",
        "ji5",
      ],
      winningTile: "ji5",
      context: {
        winMethod: "ron",
        roundWind: "east",
        seatWind: "south",
        riichi: true,
      },
    },
    facts: ["子・ロン", "門前・リーチ", "場風 東・自風 南"],
  },
];
export const tileSrc = (id: string) => `/tiles/${id}-66-90-l.png`;

function fuQuestion(): Question {
  const scenario = pick(handScenarios);
  const result = calculateHand(scenario.hand);
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
    tags: ["符計算", result.waitType ?? "待ち"],
  };
}
function hanQuestion(): Question {
  const base = pick(handScenarios);
  const scenario: HandScenario =
    base === handScenarios[0]
      ? {
          ...base,
          hand: {
            ...base.hand,
            context: {
              ...base.hand.context,
              riichi: true,
              doraIndicators: ["pin7"],
            },
          },
          facts: [...base.facts, `ドラ表示牌 ${tileName("pin7")}`],
        }
      : base;
  const result = calculateHand(scenario.hand);
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
      choices: ["1翻", "2翻", "3翻", "4翻", "5翻", "6翻", "役満", answer],
      answer,
      explanation: [...result.yaku.map((item) => item.name), `合計 ${answer}`],
      tags: ["翻数計算", "役満"],
    };
  }
  return {
    id: crypto.randomUUID(),
    mode: "han",
    title: "合計で何翻？",
    facts: scenario.facts,
    tiles: scenario.hand.concealedTiles,
    winTile: scenario.hand.winningTile,
    choices: ["1翻", "2翻", "3翻", "4翻", "5翻", "6翻", "7翻", "8翻"],
    answer: `${result.han}翻`,
    explanation: [
      ...result.yaku.map((item) => `${item.name} ${item.han}翻`),
      `合計 ${result.han}翻`,
    ],
    tags: ["翻数計算", ...result.yaku.map((item) => item.id)],
  };
}
function scoreQuestion(): Question {
  const c: ScoreCondition = pick([
    { dealer: false, winMethod: "ron", fu: 30, han: 4 },
    { dealer: true, winMethod: "ron", fu: 60, han: 3 },
    { dealer: false, winMethod: "tsumo", fu: 40, han: 3 },
    { dealer: true, winMethod: "tsumo", fu: 30, han: 4 },
    { dealer: false, winMethod: "ron", fu: 30, han: 5 },
    { dealer: false, winMethod: "tsumo", yakumanMultiplier: 2 },
  ] as ScoreCondition[]);
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
  };
}
export const createQuestion = (mode: Mode): Question =>
  mode === "fu"
    ? fuQuestion()
    : mode === "han"
      ? hanQuestion()
      : scoreQuestion();
