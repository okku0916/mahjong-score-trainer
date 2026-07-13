import {
  isHonor,
  isRed,
  isSimple,
  isTerminal,
  isYaochu,
  nextDoraIndex,
  tileIndex,
  tileName,
  toCounts,
  type TileId,
} from "./tile";

export type Wind = "east" | "south" | "west" | "north";
export type WaitType = "ryanmen" | "kanchan" | "penchan" | "shanpon" | "tanki";

export interface MeldInput {
  type: "sequence" | "triplet" | "quad";
  tiles: TileId[];
  open: boolean;
}

export interface HandContext {
  winMethod: "ron" | "tsumo";
  roundWind: Wind;
  seatWind: Wind;
  riichi?: boolean;
  doubleRiichi?: boolean;
  ippatsu?: boolean;
  haitei?: boolean;
  houtei?: boolean;
  rinshan?: boolean;
  chankan?: boolean;
  tenhou?: boolean;
  chiihou?: boolean;
  doraIndicators?: TileId[];
  uraDoraIndicators?: TileId[];
}

export interface HandInput {
  concealedTiles: TileId[];
  winningTile: TileId;
  melds?: MeldInput[];
  context: HandContext;
}

export interface YakuResult {
  id: string;
  name: string;
  han: number;
  yakumanMultiplier: number;
}
export interface FuItem {
  label: string;
  fu: number;
}
export interface FuResult {
  rawFu: number;
  roundedFu: number;
  items: FuItem[];
}
export interface HandResult {
  yaku: YakuResult[];
  han: number;
  yakumanMultiplier: number;
  fu?: FuResult;
  waitType?: WaitType;
}

interface Group {
  type: "sequence" | "triplet" | "quad";
  tile: number;
  open: boolean;
  source: "concealed" | "meld";
}
interface Division {
  pair: number;
  groups: Group[];
  winningGroup: number;
  waitType: WaitType;
}

const windIndex: Record<Wind, number> = {
  east: 27,
  south: 28,
  west: 29,
  north: 30,
};
const yaku = (
  id: string,
  name: string,
  han: number,
  yakumanMultiplier = 0,
): YakuResult => ({ id, name, han, yakumanMultiplier });

function validate(input: HandInput): void {
  const melds = input.melds ?? [];
  if (input.concealedTiles.length + 1 + melds.length * 3 !== 14)
    throw new Error("和了手の牌数が不正です");
  const all = [
    ...input.concealedTiles,
    input.winningTile,
    ...melds.flatMap((m) => m.tiles),
  ];
  toCounts(all);
  for (const meld of melds) {
    const indexes = meld.tiles.map(tileIndex).sort((a, b) => a - b);
    const expected = meld.type === "quad" ? 4 : 3;
    if (indexes.length !== expected)
      throw new Error("副露面子の牌数が不正です");
    if (
      meld.type === "sequence" &&
      !(
        indexes[0] < 27 &&
        indexes[0] + 1 === indexes[1] &&
        indexes[1] + 1 === indexes[2]
      )
    )
      throw new Error("順子が不正です");
    if (meld.type !== "sequence" && !indexes.every((x) => x === indexes[0]))
      throw new Error("刻子・槓子が不正です");
  }
  if (
    (input.context.riichi || input.context.doubleRiichi) &&
    melds.some((m) => m.open)
  )
    throw new Error("副露手では立直できません");
}

function concealedGroups(counts: number[], required: number): Group[][] {
  const results: Group[][] = [];
  const search = (work: number[], groups: Group[]) => {
    const first = work.findIndex((n) => n > 0);
    if (first < 0) {
      if (groups.length === required) results.push(groups);
      return;
    }
    if (groups.length >= required) return;
    if (work[first] >= 3) {
      work[first] -= 3;
      search(work, [
        ...groups,
        { type: "triplet", tile: first, open: false, source: "concealed" },
      ]);
      work[first] += 3;
    }
    if (first < 27 && first % 9 <= 6 && work[first + 1] && work[first + 2]) {
      work[first]--;
      work[first + 1]--;
      work[first + 2]--;
      search(work, [
        ...groups,
        { type: "sequence", tile: first, open: false, source: "concealed" },
      ]);
      work[first]++;
      work[first + 1]++;
      work[first + 2]++;
    }
  };
  search([...counts], []);
  return results;
}

function waitFor(group: Group, winning: number): WaitType | null {
  if (group.type !== "sequence")
    return group.type === "triplet" && group.tile === winning
      ? "shanpon"
      : null;
  const offset = winning - group.tile;
  if (offset < 0 || offset > 2) return null;
  if (offset === 1) return "kanchan";
  if (
    (group.tile % 9 === 0 && offset === 2) ||
    (group.tile % 9 === 6 && offset === 0)
  )
    return "penchan";
  return "ryanmen";
}

function standardDivisions(input: HandInput): Division[] {
  const melds = input.melds ?? [];
  const counts = toCounts([...input.concealedTiles, input.winningTile]);
  const fixed: Group[] = melds.map((m) => ({
    type: m.type,
    tile: tileIndex(m.tiles[0]),
    open: m.open,
    source: "meld",
  }));
  const winning = tileIndex(input.winningTile);
  const results: Division[] = [];
  for (let pair = 0; pair < 34; pair++) {
    if (counts[pair] < 2) continue;
    counts[pair] -= 2;
    for (const concealed of concealedGroups(counts, 4 - fixed.length)) {
      const groups = [...concealed, ...fixed];
      if (pair === winning)
        results.push({ pair, groups, winningGroup: -1, waitType: "tanki" });
      concealed.forEach((group, index) => {
        const waitType = waitFor(group, winning);
        if (waitType)
          results.push({ pair, groups, winningGroup: index, waitType });
      });
    }
    counts[pair] += 2;
  }
  return results;
}

const allIndexes = (division: Division) => [
  division.pair,
  division.pair,
  ...division.groups.flatMap((g) =>
    g.type === "sequence"
      ? [g.tile, g.tile + 1, g.tile + 2]
      : Array(g.type === "quad" ? 4 : 3).fill(g.tile),
  ),
];
const isClosed = (input: HandInput) => !(input.melds ?? []).some((m) => m.open);
const valuePair = (pair: number, context: HandContext) =>
  pair >= 31 ||
  pair === windIndex[context.roundWind] ||
  pair === windIndex[context.seatWind];
const sequenceStarts = (d: Division) =>
  d.groups.filter((g) => g.type === "sequence").map((g) => g.tile);

function commonYaku(input: HandInput, closed: boolean): YakuResult[] {
  const c = input.context;
  const result: YakuResult[] = [];
  if (c.tenhou) result.push(yaku("tenhou", "天和", 0, 1));
  if (c.chiihou) result.push(yaku("chiihou", "地和", 0, 1));
  if (c.doubleRiichi) result.push(yaku("double-riichi", "ダブル立直", 2));
  else if (c.riichi) result.push(yaku("riichi", "立直", 1));
  if (c.ippatsu && (c.riichi || c.doubleRiichi))
    result.push(yaku("ippatsu", "一発", 1));
  if (closed && c.winMethod === "tsumo")
    result.push(yaku("menzen-tsumo", "門前清自摸和", 1));
  if (c.haitei) result.push(yaku("haitei", "海底撈月", 1));
  if (c.houtei) result.push(yaku("houtei", "河底撈魚", 1));
  if (c.rinshan) result.push(yaku("rinshan", "嶺上開花", 1));
  if (c.chankan) result.push(yaku("chankan", "槍槓", 1));
  return result;
}

function bonusItems(input: HandInput): YakuResult[] {
  const tiles = [
    ...input.concealedTiles,
    input.winningTile,
    ...(input.melds ?? []).flatMap((m) => m.tiles),
  ];
  const countDora = (indicators: TileId[]) =>
    indicators.reduce((sum, indicator) => {
      const dora = nextDoraIndex(tileIndex(indicator));
      return sum + tiles.filter((tile) => tileIndex(tile) === dora).length;
    }, 0);
  const dora = countDora(input.context.doraIndicators ?? []);
  const ura =
    input.context.riichi || input.context.doubleRiichi
      ? countDora(input.context.uraDoraIndicators ?? [])
      : 0;
  const red = tiles.filter(isRed).length;
  return [
    dora ? yaku("dora", "ドラ", dora) : null,
    ura ? yaku("ura-dora", "裏ドラ", ura) : null,
    red ? yaku("aka-dora", "赤ドラ", red) : null,
  ].filter((item): item is YakuResult => item !== null);
}

function divisionYaku(input: HandInput, d: Division): YakuResult[] {
  const closed = isClosed(input);
  const indexes = allIndexes(d);
  const result = commonYaku(input, closed);
  const sequences = d.groups.filter((g) => g.type === "sequence");
  const sets = d.groups.filter((g) => g.type !== "sequence");
  const add = (
    condition: boolean,
    id: string,
    name: string,
    closedHan: number,
    openHan = closedHan,
  ) => {
    if (condition) result.push(yaku(id, name, closed ? closedHan : openHan));
  };
  add(indexes.every(isSimple), "tanyao", "断么九", 1);
  for (const group of sets) {
    if (group.tile >= 31)
      result.push(
        yaku(
          `yakuhai-${group.tile}`,
          `役牌 ${tileName(`ji${group.tile - 26}`)}`,
          1,
        ),
      );
    if (group.tile === windIndex[input.context.roundWind])
      result.push(yaku("bakaze", "場風牌", 1));
    if (group.tile === windIndex[input.context.seatWind])
      result.push(yaku("jikaze", "自風牌", 1));
  }
  add(
    closed &&
      sequences.length === 4 &&
      !valuePair(d.pair, input.context) &&
      d.waitType === "ryanmen",
    "pinfu",
    "平和",
    1,
  );
  if (closed) {
    const sequenceCounts = new Map<number, number>();
    sequenceStarts(d).forEach((x) =>
      sequenceCounts.set(x, (sequenceCounts.get(x) ?? 0) + 1),
    );
    const identicalPairs = [...sequenceCounts.values()].reduce(
      (sum, count) => sum + Math.floor(count / 2),
      0,
    );
    if (identicalPairs >= 2) result.push(yaku("ryanpeikou", "二盃口", 3));
    else if (identicalPairs === 1) result.push(yaku("iipeikou", "一盃口", 1));
  }
  const seq = new Set(sequenceStarts(d));
  const sanshoku = [...seq].some(
    (s) => s < 9 && seq.has(s + 9) && seq.has(s + 18),
  );
  add(sanshoku, "sanshoku", "三色同順", 2, 1);
  const setTiles = new Set(sets.map((group) => group.tile));
  const sanshokuDoukou = [...setTiles].some(
    (tile) => tile < 9 && setTiles.has(tile + 9) && setTiles.has(tile + 18),
  );
  add(sanshokuDoukou, "sanshoku-doukou", "三色同刻", 2);
  const ittsu = [0, 9, 18].some(
    (base) => seq.has(base) && seq.has(base + 3) && seq.has(base + 6),
  );
  add(ittsu, "ittsu", "一気通貫", 2, 1);
  add(sequences.length === 0, "toitoi", "対々和", 2);
  const concealedTriplets = d.groups.filter(
    (g, index) =>
      g.type !== "sequence" &&
      !g.open &&
      !(
        input.context.winMethod === "ron" &&
        index === d.winningGroup &&
        d.waitType === "shanpon"
      ),
  ).length;
  add(concealedTriplets >= 3, "sanankou", "三暗刻", 2);
  add(
    sets.filter((g) => g.type === "quad").length >= 3,
    "sankantsu",
    "三槓子",
    2,
  );
  const dragonSets = sets.filter((g) => g.tile >= 31).length;
  add(dragonSets === 2 && d.pair >= 31, "shousangen", "小三元", 2);
  add(indexes.every(isYaochu), "honroutou", "混老頭", 2);
  const everyGroupHasYaochu =
    d.groups.every((g) =>
      g.type === "sequence"
        ? g.tile % 9 === 0 || g.tile % 9 === 6
        : isYaochu(g.tile),
    ) && isYaochu(d.pair);
  if (everyGroupHasYaochu && sequences.length)
    add(indexes.some(isHonor), "chanta", "混全帯么九", 2, 1);
  if (everyGroupHasYaochu && sequences.length && !indexes.some(isHonor))
    add(true, "junchan", "純全帯么九", 3, 2);
  const suits = new Set(
    indexes.filter((x) => x < 27).map((x) => Math.floor(x / 9)),
  );
  if (suits.size === 1) add(indexes.some(isHonor), "honitsu", "混一色", 3, 2);
  if (suits.size === 1 && !indexes.some(isHonor))
    add(true, "chinitsu", "清一色", 6, 5);
  const windSets = sets.filter((g) => g.tile >= 27 && g.tile <= 30).length;
  if (dragonSets === 3) result.push(yaku("daisangen", "大三元", 0, 1));
  if (windSets === 4) result.push(yaku("daisuushi", "大四喜", 0, 2));
  else if (windSets === 3 && d.pair >= 27 && d.pair <= 30)
    result.push(yaku("shousuushi", "小四喜", 0, 1));
  if (indexes.every(isHonor)) result.push(yaku("tsuuiisou", "字一色", 0, 1));
  if (indexes.every(isTerminal))
    result.push(yaku("chinroutou", "清老頭", 0, 1));
  const green = new Set([19, 20, 21, 23, 25, 32]);
  if (indexes.every((x) => green.has(x)))
    result.push(yaku("ryuuiisou", "緑一色", 0, 1));
  if (sets.length === 4 && concealedTriplets === 4)
    result.push(
      yaku(
        "suuankou",
        d.waitType === "tanki" ? "四暗刻単騎" : "四暗刻",
        0,
        d.waitType === "tanki" ? 2 : 1,
      ),
    );
  if (sets.filter((g) => g.type === "quad").length === 4)
    result.push(yaku("suukantsu", "四槓子", 0, 1));
  return result;
}

function calculateFu(
  input: HandInput,
  d: Division,
  yakuItems: YakuResult[],
): FuResult {
  if (
    yakuItems.some((x) => x.id === "pinfu") &&
    input.context.winMethod === "tsumo"
  )
    return {
      rawFu: 20,
      roundedFu: 20,
      items: [{ label: "平和ツモ（固定）", fu: 20 }],
    };
  const items: FuItem[] = [{ label: "基本符", fu: 20 }];
  if (isClosed(input) && input.context.winMethod === "ron")
    items.push({ label: "門前ロン", fu: 10 });
  if (input.context.winMethod === "tsumo") items.push({ label: "ツモ", fu: 2 });
  if (valuePair(d.pair, input.context))
    items.push({ label: `雀頭（${tileName(`ji${d.pair - 26}`)}）`, fu: 2 });
  d.groups.forEach((group, index) => {
    if (group.type === "sequence") return;
    const ronOpened =
      input.context.winMethod === "ron" &&
      index === d.winningGroup &&
      d.waitType === "shanpon";
    const open = group.open || ronOpened;
    let fu = group.type === "quad" ? (open ? 8 : 16) : open ? 2 : 4;
    if (isYaochu(group.tile)) fu *= 2;
    items.push({
      label: `${open ? "明" : "暗"}${group.type === "quad" ? "槓" : "刻"}（${tileName(group.tile >= 27 ? `ji${group.tile - 26}` : `${["man", "pin", "sou"][Math.floor(group.tile / 9)]}${(group.tile % 9) + 1}`)}）`,
      fu,
    });
  });
  if (["tanki", "kanchan", "penchan"].includes(d.waitType))
    items.push({
      label: `${{ tanki: "単騎", kanchan: "嵌張", penchan: "辺張" }[d.waitType as "tanki" | "kanchan" | "penchan"]}待ち`,
      fu: 2,
    });
  let rawFu = items.reduce((sum, x) => sum + x.fu, 0);
  if (rawFu === 20 && input.context.winMethod === "ron") {
    items.push({ label: "副露ロンの最低符", fu: 10 });
    rawFu = 30;
  }
  return { rawFu, roundedFu: Math.ceil(rawFu / 10) * 10, items };
}

function specialHand(input: HandInput): HandResult | null {
  if ((input.melds ?? []).length) return null;
  const counts = toCounts([...input.concealedTiles, input.winningTile]);
  const unique = counts.filter(Boolean).length;
  const yaochuIndexes = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
  if (
    yaochuIndexes.every((x) => counts[x] >= 1) &&
    yaochuIndexes.some((x) => counts[x] >= 2)
  ) {
    const thirteenWait =
      toCounts(input.concealedTiles).filter(Boolean).length === 13;
    const item = yaku(
      "kokushi",
      thirteenWait ? "国士無双十三面待ち" : "国士無双",
      0,
      thirteenWait ? 2 : 1,
    );
    const items = [
      item,
      ...commonYaku(input, true).filter((x) => x.yakumanMultiplier),
    ];
    return {
      yaku: items,
      han: 0,
      yakumanMultiplier: items.reduce((sum, x) => sum + x.yakumanMultiplier, 0),
    };
  }
  for (const base of [0, 9, 18]) {
    const suitCounts = counts.slice(base, base + 9);
    const outsideSuit = counts.some(
      (count, index) => count > 0 && (index < base || index >= base + 9),
    );
    const isChuuren =
      !outsideSuit &&
      suitCounts[0] >= 3 &&
      suitCounts[8] >= 3 &&
      suitCounts.slice(1, 8).every((x) => x >= 1);
    if (isChuuren) {
      const before = toCounts(input.concealedTiles).slice(base, base + 9);
      const pure = before.every((x, i) => x === (i === 0 || i === 8 ? 3 : 1));
      const item = yaku(
        "chuuren",
        pure ? "純正九蓮宝燈" : "九蓮宝燈",
        0,
        pure ? 2 : 1,
      );
      const items = [
        item,
        ...commonYaku(input, true).filter((x) => x.yakumanMultiplier),
      ];
      return {
        yaku: items,
        han: 0,
        yakumanMultiplier: items.reduce(
          (sum, x) => sum + x.yakumanMultiplier,
          0,
        ),
      };
    }
  }
  if (unique === 7 && counts.filter((x) => x === 2).length === 7) {
    const indexes = counts.flatMap((n, i) => (n ? [i, i] : []));
    const items = [...commonYaku(input, true), yaku("chiitoitsu", "七対子", 2)];
    if (indexes.every(isSimple)) items.push(yaku("tanyao", "断么九", 1));
    if (indexes.every(isYaochu)) items.push(yaku("honroutou", "混老頭", 2));
    if (indexes.every(isHonor)) items.push(yaku("tsuuiisou", "字一色", 0, 1));
    const green = new Set([19, 20, 21, 23, 25, 32]);
    if (indexes.every((x) => green.has(x)))
      items.push(yaku("ryuuiisou", "緑一色", 0, 1));
    const suits = new Set(
      indexes.filter((x) => x < 27).map((x) => Math.floor(x / 9)),
    );
    if (suits.size === 1 && indexes.some(isHonor))
      items.push(yaku("honitsu", "混一色", 3));
    if (suits.size === 1 && !indexes.some(isHonor))
      items.push(yaku("chinitsu", "清一色", 6));
    const yakumanMultiplier = items.reduce(
      (sum, x) => sum + x.yakumanMultiplier,
      0,
    );
    const scoredItems = yakumanMultiplier
      ? items.filter((x) => x.yakumanMultiplier)
      : [...items, ...bonusItems(input)];
    return {
      yaku: scoredItems,
      han: scoredItems.reduce((sum, x) => sum + x.han, 0),
      yakumanMultiplier,
      fu: yakumanMultiplier
        ? undefined
        : {
            rawFu: 25,
            roundedFu: 25,
            items: [{ label: "七対子（固定）", fu: 25 }],
          },
      waitType: "tanki",
    };
  }
  return null;
}

export function calculateHand(input: HandInput): HandResult {
  validate(input);
  const special = specialHand(input);
  if (special) return special;
  const candidates = standardDivisions(input)
    .map((division) => {
      let items = divisionYaku(input, division);
      const yakumanMultiplier = items.reduce(
        (sum, x) => sum + x.yakumanMultiplier,
        0,
      );
      if (yakumanMultiplier) items = items.filter((x) => x.yakumanMultiplier);
      else if (items.length) items = [...items, ...bonusItems(input)];
      return {
        yaku: items,
        han: items.reduce((sum, x) => sum + x.han, 0),
        yakumanMultiplier,
        fu: yakumanMultiplier ? undefined : calculateFu(input, division, items),
        waitType: division.waitType,
      };
    })
    .filter((x) => x.yaku.length);
  if (!candidates.length) throw new Error("和了形でないか、役がありません");
  const basicPoints = (result: HandResult) => {
    if (result.yakumanMultiplier) return result.yakumanMultiplier * 8000;
    const raw = (result.fu?.roundedFu ?? 20) * 2 ** (result.han + 2);
    const limit =
      result.han >= 13
        ? 8000
        : result.han >= 11
          ? 6000
          : result.han >= 8
            ? 4000
            : result.han >= 6
              ? 3000
              : result.han >= 5 || raw >= 2000
                ? 2000
                : raw;
    return limit;
  };
  return candidates.sort(
    (a, b) =>
      basicPoints(b) - basicPoints(a) ||
      b.han - a.han ||
      (b.fu?.roundedFu ?? 0) - (a.fu?.roundedFu ?? 0),
  )[0];
}
