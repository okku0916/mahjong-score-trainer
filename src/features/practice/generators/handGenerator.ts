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
  rankStrategy?: "independent" | "linked" | "reflect" | "fixed";
}

interface Candidate {
  hand: HandInput;
  recipe: Recipe;
}

export interface GeneratorOptions {
  random?: () => number;
  maxAttempts?: number;
  excludeFingerprint?: string;
  themeId?: string;
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
    rankStrategy: "reflect",
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
    rankStrategy: "reflect",
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
    rankStrategy: "linked",
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
    expectedYaku: "dora",
    rankStrategy: "fixed",
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
    rankStrategy: "reflect",
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
    id: "yakuhai",
    modes: ["han"],
    expectedYaku: "yakuhai-31",
    hand: {
      concealedTiles: [
        "ji5",
        "ji5",
        "ji5",
        "man2",
        "man3",
        "man4",
        "pin3",
        "pin4",
        "pin5",
        "sou6",
        "sou7",
        "pin7",
        "pin7",
      ],
      winningTile: "sou8",
      context: { ...baseContext, winMethod: "ron" },
    },
  },
  {
    id: "iipeikou",
    modes: ["han"],
    expectedYaku: "iipeikou",
    hand: {
      concealedTiles: [
        "man2",
        "man3",
        "man4",
        "man2",
        "man3",
        "man4",
        "pin5",
        "pin6",
        "pin7",
        "sou7",
        "sou8",
        "pin5",
        "pin5",
      ],
      winningTile: "sou9",
      context: { ...baseContext, winMethod: "ron", riichi: true },
    },
  },
  {
    id: "ryanpeikou",
    modes: ["han"],
    expectedYaku: "ryanpeikou",
    hand: {
      concealedTiles: [
        "man2",
        "man3",
        "man4",
        "man2",
        "man3",
        "man4",
        "pin6",
        "pin7",
        "pin8",
        "pin6",
        "pin7",
        "pin8",
        "ji5",
      ],
      winningTile: "ji5",
      context: { ...baseContext, winMethod: "ron" },
    },
  },
  {
    id: "sanshoku-doukou",
    modes: ["han"],
    expectedYaku: "sanshoku-doukou",
    rankStrategy: "linked",
    hand: {
      concealedTiles: [
        "man2",
        "man2",
        "man2",
        "pin2",
        "pin2",
        "pin2",
        "sou2",
        "sou2",
        "man6",
        "man7",
        "man8",
        "pin5",
        "pin5",
      ],
      winningTile: "sou2",
      context: { ...baseContext, winMethod: "ron", riichi: true },
    },
  },
  {
    id: "chanta",
    modes: ["han"],
    expectedYaku: "chanta",
    rankStrategy: "reflect",
    hand: {
      concealedTiles: [
        "man1",
        "man2",
        "man3",
        "pin7",
        "pin8",
        "pin9",
        "sou1",
        "sou1",
        "sou1",
        "ji5",
        "ji5",
        "ji5",
        "ji1",
      ],
      winningTile: "ji1",
      context: { ...baseContext, winMethod: "ron" },
    },
  },
  {
    id: "junchan",
    modes: ["han"],
    expectedYaku: "junchan",
    rankStrategy: "reflect",
    hand: {
      concealedTiles: [
        "man1",
        "man2",
        "man3",
        "pin7",
        "pin8",
        "pin9",
        "sou1",
        "sou1",
        "sou1",
        "man9",
        "man9",
        "man9",
        "pin1",
      ],
      winningTile: "pin1",
      context: { ...baseContext, winMethod: "ron" },
    },
  },
  {
    id: "honitsu",
    modes: ["han"],
    expectedYaku: "honitsu",
    rankStrategy: "reflect",
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
        "man9",
        "ji5",
        "ji5",
        "ji5",
        "ji1",
      ],
      winningTile: "ji1",
      context: { ...baseContext, winMethod: "ron" },
    },
  },
  {
    id: "chinitsu",
    modes: ["han"],
    expectedYaku: "chinitsu",
    rankStrategy: "reflect",
    hand: {
      concealedTiles: [
        "man1",
        "man2",
        "man3",
        "man3",
        "man4",
        "man5",
        "man5",
        "man6",
        "man7",
        "man7",
        "man8",
        "man9",
        "man2",
      ],
      winningTile: "man2",
      context: { ...baseContext, winMethod: "ron" },
    },
  },
  {
    id: "shousangen",
    modes: ["han"],
    expectedYaku: "shousangen",
    hand: {
      concealedTiles: [
        "ji5",
        "ji5",
        "ji5",
        "ji6",
        "ji6",
        "ji6",
        "ji7",
        "man1",
        "man2",
        "man3",
        "pin4",
        "pin5",
        "pin6",
      ],
      winningTile: "ji7",
      context: { ...baseContext, winMethod: "ron" },
    },
  },
  {
    id: "honroutou",
    modes: ["han"],
    expectedYaku: "honroutou",
    rankStrategy: "reflect",
    hand: {
      concealedTiles: [
        "pin9",
        "pin9",
        "pin9",
        "sou1",
        "sou1",
        "sou1",
        "ji5",
        "ji5",
        "ji5",
        "ji1",
      ],
      winningTile: "ji1",
      melds: [
        {
          type: "triplet",
          tiles: ["man1", "man1", "man1"],
          open: true,
        },
      ],
      context: { ...baseContext, winMethod: "ron" },
    },
  },
  {
    id: "sankantsu",
    modes: ["han"],
    expectedYaku: "sankantsu",
    rankStrategy: "reflect",
    hand: {
      concealedTiles: ["sou2", "sou2", "sou2", "ji1"],
      winningTile: "ji1",
      melds: [
        { type: "quad", tiles: ["ji5", "ji5", "ji5", "ji5"], open: true },
        { type: "quad", tiles: ["man1", "man1", "man1", "man1"], open: true },
        { type: "quad", tiles: ["pin9", "pin9", "pin9", "pin9"], open: true },
      ],
      context: { ...baseContext, winMethod: "ron" },
    },
  },
  {
    id: "toitoi",
    modes: ["han"],
    expectedYaku: "toitoi",
    hand: {
      concealedTiles: [
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
      melds: [{ type: "triplet", tiles: ["ji1", "ji1", "ji1"], open: true }],
      context: { ...baseContext, winMethod: "ron" },
    },
  },
  {
    id: "sanankou",
    modes: ["han"],
    expectedYaku: "sanankou",
    hand: {
      concealedTiles: [
        "man2",
        "man2",
        "man2",
        "pin3",
        "pin3",
        "pin3",
        "sou4",
        "sou4",
        "sou4",
        "man6",
        "man7",
        "pin5",
        "pin5",
      ],
      winningTile: "man8",
      context: { ...baseContext, winMethod: "tsumo" },
    },
  },
  {
    id: "double-riichi",
    modes: ["han"],
    expectedYaku: "double-riichi",
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
      context: { ...baseContext, winMethod: "ron", doubleRiichi: true },
    },
  },
  {
    id: "ippatsu",
    modes: ["han"],
    expectedYaku: "ippatsu",
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
      context: {
        ...baseContext,
        winMethod: "ron",
        riichi: true,
        ippatsu: true,
      },
    },
  },
  {
    id: "haitei",
    modes: ["han"],
    expectedYaku: "haitei",
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
      context: { ...baseContext, winMethod: "tsumo", haitei: true },
    },
  },
  {
    id: "houtei",
    modes: ["han"],
    expectedYaku: "houtei",
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
      context: { ...baseContext, winMethod: "ron", houtei: true },
    },
  },
  {
    id: "rinshan",
    modes: ["han"],
    expectedYaku: "rinshan",
    rankStrategy: "reflect",
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
      context: { ...baseContext, winMethod: "tsumo", rinshan: true },
    },
  },
  {
    id: "chankan",
    modes: ["han"],
    expectedYaku: "chankan",
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
      context: { ...baseContext, winMethod: "ron", chankan: true },
    },
  },
  {
    id: "kokushi",
    modes: ["han"],
    expectedYaku: "kokushi",
    rankStrategy: "reflect",
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
    rankStrategy: "reflect",
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
  {
    id: "daisangen",
    modes: ["han"],
    expectedYaku: "daisangen",
    hand: {
      concealedTiles: [
        "ji5",
        "ji5",
        "ji5",
        "ji6",
        "ji6",
        "ji6",
        "ji7",
        "ji7",
        "ji7",
        "man1",
        "man2",
        "man3",
        "ji1",
      ],
      winningTile: "ji1",
      context: { ...baseContext, winMethod: "ron" },
    },
  },
  {
    id: "tenhou",
    modes: ["han"],
    expectedYaku: "tenhou",
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
      context: {
        ...baseContext,
        seatWind: "east",
        winMethod: "tsumo",
        tenhou: true,
      },
    },
  },
  {
    id: "chiihou",
    modes: ["han"],
    expectedYaku: "chiihou",
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
      context: { ...baseContext, winMethod: "tsumo", chiihou: true },
    },
  },
  {
    id: "shousuushi",
    modes: ["han"],
    expectedYaku: "shousuushi",
    rankStrategy: "reflect",
    hand: {
      concealedTiles: [
        "ji1",
        "ji1",
        "ji1",
        "ji2",
        "ji2",
        "ji2",
        "ji3",
        "ji3",
        "ji3",
        "ji4",
        "man1",
        "man2",
        "man3",
      ],
      winningTile: "ji4",
      context: { ...baseContext, winMethod: "ron" },
    },
  },
  {
    id: "daisuushi",
    modes: ["han"],
    expectedYaku: "daisuushi",
    hand: {
      concealedTiles: [
        "ji1",
        "ji1",
        "ji1",
        "ji2",
        "ji2",
        "ji2",
        "ji3",
        "ji3",
        "ji3",
        "ji4",
        "ji4",
        "ji4",
        "ji5",
      ],
      winningTile: "ji5",
      context: { ...baseContext, winMethod: "ron" },
    },
  },
  {
    id: "tsuuiisou",
    modes: ["han"],
    expectedYaku: "tsuuiisou",
    hand: {
      concealedTiles: [
        "ji1",
        "ji1",
        "ji2",
        "ji2",
        "ji3",
        "ji3",
        "ji4",
        "ji4",
        "ji5",
        "ji5",
        "ji6",
        "ji6",
        "ji7",
      ],
      winningTile: "ji7",
      context: { ...baseContext, winMethod: "ron" },
    },
  },
  {
    id: "chinroutou",
    modes: ["han"],
    expectedYaku: "chinroutou",
    rankStrategy: "reflect",
    hand: {
      concealedTiles: [
        "man1",
        "man1",
        "man1",
        "man9",
        "man9",
        "man9",
        "pin1",
        "pin1",
        "pin1",
        "pin9",
        "pin9",
        "pin9",
        "sou1",
      ],
      winningTile: "sou1",
      context: { ...baseContext, winMethod: "ron" },
    },
  },
  {
    id: "ryuuiisou",
    modes: ["han"],
    expectedYaku: "ryuuiisou",
    rankStrategy: "fixed",
    hand: {
      concealedTiles: [
        "sou2",
        "sou2",
        "sou2",
        "sou3",
        "sou3",
        "sou3",
        "sou4",
        "sou4",
        "sou4",
        "sou6",
        "sou6",
        "sou6",
        "ji6",
      ],
      winningTile: "ji6",
      context: { ...baseContext, winMethod: "ron" },
    },
  },
  {
    id: "suukantsu",
    modes: ["han"],
    expectedYaku: "suukantsu",
    rankStrategy: "reflect",
    hand: {
      concealedTiles: ["ji1"],
      winningTile: "ji1",
      melds: [
        { type: "quad", tiles: ["ji5", "ji5", "ji5", "ji5"], open: true },
        { type: "quad", tiles: ["man1", "man1", "man1", "man1"], open: true },
        { type: "quad", tiles: ["pin9", "pin9", "pin9", "pin9"], open: true },
        { type: "quad", tiles: ["sou1", "sou1", "sou1", "sou1"], open: true },
      ],
      context: { ...baseContext, winMethod: "ron" },
    },
  },
];

const fallbackRecipe: Record<HandPracticeMode, Recipe> = {
  fu: recipes.find((recipe) => recipe.id === "pinfu-ron")!,
  han: recipes.find((recipe) => recipe.id === "sanshoku")!,
};

export const HAND_GENERATOR_THEME_IDS: Record<HandPracticeMode, string[]> = {
  fu: recipes
    .filter((recipe) => recipe.modes.includes("fu"))
    .map((recipe) => recipe.id),
  han: recipes
    .filter((recipe) => recipe.modes.includes("han"))
    .map((recipe) => recipe.id),
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

interface RankTransform {
  reflected: boolean[];
  offsets: number[];
}

function sourceSuit(tile: TileId): number | null {
  const red = /^aka([1-3])$/.exec(tile);
  if (red) return Number(red[1]) - 1;
  const match = /^(man|pin|sou)([1-9])$/.exec(tile);
  return match ? ["man", "pin", "sou"].indexOf(match[1]) : null;
}

function sourceRank(tile: TileId): number | null {
  if (/^aka[1-3]$/.test(tile)) return 5;
  const match = /^(?:man|pin|sou)([1-9])$/.exec(tile);
  return match ? Number(match[1]) : null;
}

function allRecipeTiles(recipe: Recipe): TileId[] {
  return [
    ...recipe.hand.concealedTiles,
    recipe.hand.winningTile,
    ...(recipe.hand.melds ?? []).flatMap((meld) => meld.tiles),
    ...(recipe.hand.context.doraIndicators ?? []),
    ...(recipe.hand.context.uraDoraIndicators ?? []),
  ];
}

function chooseInteger(min: number, max: number, random: () => number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function createRankTransform(
  recipe: Recipe,
  random: () => number,
): RankTransform {
  const strategy = recipe.rankStrategy ?? "independent";
  const reflected = Array<boolean>(3).fill(false);
  if (strategy !== "fixed") {
    if (strategy === "linked") reflected.fill(random() < 0.5);
    else for (let suit = 0; suit < 3; suit++) reflected[suit] = random() < 0.5;
  }
  const tiles = allRecipeTiles(recipe);
  const ranges = Array.from({ length: 3 }, (_, suit) => {
    const ranks = tiles
      .filter((tile) => sourceSuit(tile) === suit)
      .map((tile) => sourceRank(tile)!)
      .map((rank) => (reflected[suit] ? 10 - rank : rank));
    if (!ranks.length) return { min: 0, max: 0 };
    return { min: 1 - Math.min(...ranks), max: 9 - Math.max(...ranks) };
  });
  const offsets = Array<number>(3).fill(0);
  if (strategy === "linked") {
    const used = ranges.filter((_, suit) =>
      tiles.some((tile) => sourceSuit(tile) === suit),
    );
    const min = Math.max(...used.map((range) => range.min));
    const max = Math.min(...used.map((range) => range.max));
    offsets.fill(chooseInteger(min, max, random));
  } else if (strategy === "independent") {
    for (let suit = 0; suit < 3; suit++)
      offsets[suit] = chooseInteger(ranges[suit].min, ranges[suit].max, random);
  }
  for (const tile of tiles) {
    if (/^aka[1-3]$/.test(tile)) offsets[sourceSuit(tile)!] = 0;
  }
  return { reflected, offsets };
}

function transformTile(
  tile: TileId,
  suitMap: string[],
  ranks: RankTransform,
): TileId {
  const source = sourceSuit(tile);
  if (source === null) return tile;
  const targetSuit = suitMap[source];
  if (/^aka[1-3]$/.test(tile))
    return `aka${["man", "pin", "sou"].indexOf(targetSuit) + 1}`;
  const originalRank = sourceRank(tile)!;
  const reflectedRank = ranks.reflected[source]
    ? 10 - originalRank
    : originalRank;
  return `${targetSuit}${reflectedRank + ranks.offsets[source]}`;
}

function transformMeld(
  meld: MeldInput,
  suitMap: string[],
  ranks: RankTransform,
): MeldInput {
  return {
    ...meld,
    tiles: meld.tiles.map((tile) => transformTile(tile, suitMap, ranks)),
  };
}

function transformRecipe(recipe: Recipe, random: () => number): Candidate {
  const suitMap = shuffledSuits(random);
  const ranks = createRankTransform(recipe, random);
  const hand: HandInput = {
    ...recipe.hand,
    concealedTiles: recipe.hand.concealedTiles.map((tile) =>
      transformTile(tile, suitMap, ranks),
    ),
    winningTile: transformTile(recipe.hand.winningTile, suitMap, ranks),
    melds: recipe.hand.melds?.map((meld) =>
      transformMeld(meld, suitMap, ranks),
    ),
    context: {
      ...recipe.hand.context,
      doraIndicators: recipe.hand.context.doraIndicators?.map((tile) =>
        transformTile(tile, suitMap, ranks),
      ),
      uraDoraIndicators: recipe.hand.context.uraDoraIndicators?.map((tile) =>
        transformTile(tile, suitMap, ranks),
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
  if (hand.context.tenhou) facts.push("天和");
  if (hand.context.chiihou) facts.push("地和");
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
  const available = recipes.filter(
    (recipe) =>
      recipe.modes.includes(mode) &&
      (!options.themeId || recipe.id === options.themeId),
  );
  if (!available.length)
    throw new Error(`未定義の出題テーマです: ${options.themeId}`);
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
