import {
  calculateHand,
  type HandInput,
  type HandResult,
  type MeldInput,
} from "../../../domain/mahjong/hand";
import { indexTile, type TileId } from "../../../domain/mahjong/tile";

export type HandPracticeMode = "fu" | "han";

export interface GeneratedHandScenario {
  hand: HandInput;
  result: HandResult;
  facts: string[];
  tags: string[];
  source: "generated" | "fallback";
  fingerprint: string;
}

interface Recipe {
  id: string;
  modes: HandPracticeMode[];
  hand: HandInput;
  expectedFu?: number;
  expectedYaku?: string;
}

interface Candidate {
  hand: HandInput;
  recipe: Recipe;
}

export interface GeneratorOptions {
  random?: () => number;
  maxAttempts?: number;
  excludeFingerprint?: string;
}

const baseContext = {
  roundWind: "east" as const,
  seatWind: "south" as const,
};

const recipes: Recipe[] = [
  {
    id: "pinfu-tsumo",
    modes: ["fu", "han"],
    expectedFu: 20,
    expectedYaku: "pinfu",
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
      context: { ...baseContext, winMethod: "tsumo" },
    },
  },
  {
    id: "pinfu-ron",
    modes: ["fu", "han"],
    expectedFu: 30,
    expectedYaku: "pinfu",
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
      context: { ...baseContext, winMethod: "ron", riichi: true },
    },
  },
  {
    id: "chiitoitsu",
    modes: ["fu", "han"],
    expectedFu: 25,
    expectedYaku: "chiitoitsu",
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
      context: { ...baseContext, winMethod: "ron", riichi: true },
    },
  },
  {
    id: "terminal-triplet-tanki",
    modes: ["fu"],
    expectedFu: 50,
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
        ...baseContext,
        winMethod: "ron",
        seatWind: "east",
        riichi: true,
      },
    },
  },
  {
    id: "open-minimum",
    modes: ["fu", "han"],
    expectedFu: 30,
    expectedYaku: "tanyao",
    hand: {
      concealedTiles: [
        "pin3",
        "pin4",
        "pin5",
        "sou6",
        "sou7",
        "sou8",
        "man6",
        "man7",
        "pin5",
        "pin5",
      ],
      winningTile: "man8",
      melds: [
        { type: "sequence", tiles: ["sou2", "sou3", "sou4"], open: true },
      ],
      context: { ...baseContext, winMethod: "ron" },
    },
  },
  {
    id: "closed-kan",
    modes: ["fu"],
    expectedFu: 90,
    hand: {
      concealedTiles: [
        "man1",
        "man1",
        "man1",
        "pin9",
        "pin9",
        "pin9",
        "sou4",
        "sou5",
        "sou6",
        "ji1",
      ],
      winningTile: "ji1",
      melds: [
        { type: "quad", tiles: ["ji5", "ji5", "ji5", "ji5"], open: false },
      ],
      context: { ...baseContext, winMethod: "ron", riichi: true },
    },
  },
  {
    id: "sanshoku",
    modes: ["han"],
    expectedYaku: "sanshoku",
    hand: {
      concealedTiles: [
        "man2",
        "man3",
        "man4",
        "pin2",
        "pin3",
        "pin4",
        "sou2",
        "sou3",
        "man6",
        "man7",
        "man8",
        "pin5",
        "pin5",
      ],
      winningTile: "sou4",
      context: { ...baseContext, winMethod: "ron", riichi: true },
    },
  },
  {
    id: "dora-and-ura",
    modes: ["han"],
    expectedYaku: "pinfu",
    hand: {
      concealedTiles: [
        "man2",
        "man3",
        "man4",
        "pin3",
        "pin4",
        "aka2",
        "sou6",
        "sou7",
        "sou8",
        "pin6",
        "pin7",
        "sou5",
        "sou5",
      ],
      winningTile: "pin8",
      context: {
        ...baseContext,
        winMethod: "ron",
        riichi: true,
        doraIndicators: ["pin7"],
        uraDoraIndicators: ["sou4"],
      },
    },
  },
  {
    id: "ittsu",
    modes: ["han"],
    expectedYaku: "ittsu",
    hand: {
      concealedTiles: [
        "man1",
        "man2",
        "man3",
        "man4",
        "man5",
        "man6",
        "man7",
        "man8",
        "pin2",
        "pin3",
        "pin4",
        "sou5",
        "sou5",
      ],
      winningTile: "man9",
      context: { ...baseContext, winMethod: "ron", riichi: true },
    },
  },
  {
    id: "kokushi",
    modes: ["han"],
    expectedYaku: "kokushi",
    hand: {
      concealedTiles: [
        "man1",
        "man9",
        "pin1",
        "pin9",
        "sou1",
        "sou9",
        "ji1",
        "ji2",
        "ji3",
        "ji4",
        "ji5",
        "ji6",
        "ji7",
      ],
      winningTile: "ji7",
      context: { ...baseContext, winMethod: "ron" },
    },
  },
  {
    id: "suuankou-tanki",
    modes: ["han"],
    expectedYaku: "suuankou",
    hand: {
      concealedTiles: [
        "man1",
        "man1",
        "man1",
        "man2",
        "man2",
        "man2",
        "pin3",
        "pin3",
        "pin3",
        "sou4",
        "sou4",
        "sou4",
        "ji5",
      ],
      winningTile: "ji5",
      context: { ...baseContext, winMethod: "ron" },
    },
  },
  {
    id: "chuuren",
    modes: ["han"],
    expectedYaku: "chuuren",
    hand: {
      concealedTiles: [
        "man1",
        "man1",
        "man1",
        "man2",
        "man3",
        "man4",
        "man5",
        "man6",
        "man7",
        "man8",
        "man9",
        "man9",
        "man9",
      ],
      winningTile: "man5",
      context: { ...baseContext, winMethod: "tsumo" },
    },
  },
];

const fallbackRecipe: Record<HandPracticeMode, Recipe> = {
  fu: recipes.find((recipe) => recipe.id === "pinfu-ron")!,
  han: recipes.find((recipe) => recipe.id === "sanshoku")!,
};

const pick = <T>(items: T[], random: () => number): T =>
  items[Math.floor(random() * items.length)];

function shuffledSuits(random: () => number): string[] {
  const suits = ["man", "pin", "sou"];
  for (let index = suits.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [suits[index], suits[target]] = [suits[target], suits[index]];
  }
  return suits;
}

function transformTile(tile: TileId, suitMap: string[]): TileId {
  const red = /^aka([1-3])$/.exec(tile);
  if (red) {
    const targetSuit = suitMap[Number(red[1]) - 1];
    return `aka${["man", "pin", "sou"].indexOf(targetSuit) + 1}`;
  }
  const match = /^(man|pin|sou)([1-9])$/.exec(tile);
  if (!match) return tile;
  const source = ["man", "pin", "sou"].indexOf(match[1]);
  return `${suitMap[source]}${match[2]}`;
}

function transformMeld(meld: MeldInput, suitMap: string[]): MeldInput {
  return {
    ...meld,
    tiles: meld.tiles.map((tile) => transformTile(tile, suitMap)),
  };
}

function transformRecipe(recipe: Recipe, random: () => number): Candidate {
  const suitMap = shuffledSuits(random);
  const hand: HandInput = {
    ...recipe.hand,
    concealedTiles: recipe.hand.concealedTiles.map((tile) =>
      transformTile(tile, suitMap),
    ),
    winningTile: transformTile(recipe.hand.winningTile, suitMap),
    melds: recipe.hand.melds?.map((meld) => transformMeld(meld, suitMap)),
    context: {
      ...recipe.hand.context,
      doraIndicators: recipe.hand.context.doraIndicators?.map((tile) =>
        transformTile(tile, suitMap),
      ),
      uraDoraIndicators: recipe.hand.context.uraDoraIndicators?.map((tile) =>
        transformTile(tile, suitMap),
      ),
    },
  };
  return { hand, recipe };
}

function addHanIndicators(
  candidate: Candidate,
  random: () => number,
): Candidate {
  const context = candidate.hand.context;
  const doraIndicators = context.doraIndicators?.length
    ? context.doraIndicators
    : [indexTile(Math.floor(random() * 34))];
  const uraDoraIndicators =
    context.uraDoraIndicators?.length ||
    !(context.riichi || context.doubleRiichi) ||
    random() >= 0.35
      ? context.uraDoraIndicators
      : [indexTile(Math.floor(random() * 34))];
  return {
    ...candidate,
    hand: {
      ...candidate.hand,
      context: { ...context, doraIndicators, uraDoraIndicators },
    },
  };
}

function prepareCandidate(
  mode: HandPracticeMode,
  candidate: Candidate,
  random: () => number,
): Candidate {
  return mode === "han" ? addHanIndicators(candidate, random) : candidate;
}

function fingerprint(hand: HandInput): string {
  return JSON.stringify({
    tiles: [...hand.concealedTiles].sort(),
    win: hand.winningTile,
    melds: hand.melds ?? [],
    context: hand.context,
  });
}

function factsFor(hand: HandInput): string[] {
  const winds = { east: "東", south: "南", west: "西", north: "北" };
  const open = (hand.melds ?? []).some((meld) => meld.open);
  const facts = [
    `${hand.context.seatWind === "east" ? "親" : "子"}・${hand.context.winMethod === "ron" ? "ロン" : "ツモ"}`,
    open ? "副露" : "門前",
    `場風 ${winds[hand.context.roundWind]}・自風 ${winds[hand.context.seatWind]}`,
  ];
  if (hand.context.doubleRiichi) facts.push("ダブル立直");
  else if (hand.context.riichi) facts.push("リーチ");
  if (hand.context.ippatsu) facts.push("一発");
  if (hand.context.haitei) facts.push("海底");
  if (hand.context.houtei) facts.push("河底");
  if (hand.context.rinshan) facts.push("嶺上開花");
  if (hand.context.chankan) facts.push("槍槓");
  return facts;
}

function validateCandidate(
  mode: HandPracticeMode,
  candidate: Candidate,
): GeneratedHandScenario | null {
  try {
    const result = calculateHand(candidate.hand);
    if (mode === "fu" && (result.yakumanMultiplier || !result.fu)) return null;
    if (
      candidate.recipe.expectedFu !== undefined &&
      result.fu?.roundedFu !== candidate.recipe.expectedFu
    )
      return null;
    if (
      candidate.recipe.expectedYaku &&
      !result.yaku.some((item) => item.id === candidate.recipe.expectedYaku)
    )
      return null;
    const handFingerprint = fingerprint(candidate.hand);
    return {
      hand: candidate.hand,
      result,
      facts: factsFor(candidate.hand),
      tags: [
        candidate.recipe.id,
        ...result.yaku.map((item) => item.id),
        result.waitType ?? "special",
      ],
      source: "generated",
      fingerprint: handFingerprint,
    };
  } catch {
    return null;
  }
}

export function generateHandScenario(
  mode: HandPracticeMode,
  options: GeneratorOptions = {},
): GeneratedHandScenario {
  const random = options.random ?? Math.random;
  const maxAttempts = options.maxAttempts ?? 100;
  const available = recipes.filter((recipe) => recipe.modes.includes(mode));
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = prepareCandidate(
      mode,
      transformRecipe(pick(available, random), random),
      random,
    );
    const scenario = validateCandidate(mode, candidate);
    if (scenario && scenario.fingerprint !== options.excludeFingerprint)
      return scenario;
  }
  for (const value of [0, 0.2, 0.4, 0.6, 0.8, 0.999]) {
    const fallbackRandom = () => value;
    const fallback = validateCandidate(
      mode,
      prepareCandidate(
        mode,
        transformRecipe(fallbackRecipe[mode], fallbackRandom),
        fallbackRandom,
      ),
    );
    if (fallback && fallback.fingerprint !== options.excludeFingerprint)
      return { ...fallback, source: "fallback" };
  }
  throw new Error("固定問題の検証に失敗しました");
}
