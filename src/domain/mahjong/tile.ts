export type Suit = "man" | "pin" | "sou";
export type TileId = string;

const honorNames = ["東", "南", "西", "北", "白", "發", "中"];

export function tileIndex(tile: TileId): number {
  const red = /^aka([1-3])$/.exec(tile);
  if (red) return [4, 13, 22][Number(red[1]) - 1];
  const match = /^(man|pin|sou)([1-9])$/.exec(tile);
  if (match)
    return { man: 0, pin: 9, sou: 18 }[match[1] as Suit] + Number(match[2]) - 1;
  const honor = /^ji([1-7])$/.exec(tile);
  if (honor) return 27 + Number(honor[1]) - 1;
  throw new Error(`不正な牌です: ${tile}`);
}

export function indexTile(index: number): TileId {
  if (index < 0 || index > 33) throw new Error(`不正な牌番号です: ${index}`);
  if (index >= 27) return `ji${index - 26}`;
  const suits: Suit[] = ["man", "pin", "sou"];
  return `${suits[Math.floor(index / 9)]}${(index % 9) + 1}`;
}

export function tileName(tile: TileId): string {
  const red = /^aka([1-3])$/.exec(tile);
  if (red) return `赤五${["萬", "筒", "索"][Number(red[1]) - 1]}`;
  const index = tileIndex(tile);
  if (index >= 27) return honorNames[index - 27];
  const ranks = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];
  return `${ranks[index % 9]}${["萬", "筒", "索"][Math.floor(index / 9)]}`;
}

export const isHonor = (index: number) => index >= 27;
export const isTerminal = (index: number) =>
  index < 27 && (index % 9 === 0 || index % 9 === 8);
export const isYaochu = (index: number) => isHonor(index) || isTerminal(index);
export const isSimple = (index: number) => !isYaochu(index);
export const isRed = (tile: TileId) => /^aka[1-3]$/.test(tile);

export function nextDoraIndex(indicator: number): number {
  if (indicator < 27)
    return Math.floor(indicator / 9) * 9 + (((indicator % 9) + 1) % 9);
  if (indicator <= 30) return indicator === 30 ? 27 : indicator + 1;
  return indicator === 33 ? 31 : indicator + 1;
}

export function toCounts(tiles: TileId[]): number[] {
  const counts = Array<number>(34).fill(0);
  for (const tile of tiles) {
    const index = tileIndex(tile);
    counts[index] += 1;
    if (counts[index] > 4)
      throw new Error(`${tileName(tile)}が4枚を超えています`);
  }
  return counts;
}
