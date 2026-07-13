import { describe, expect, it } from "vitest";
import { calculateHand, type HandInput } from "./hand";

const context = {
  winMethod: "ron" as const,
  roundWind: "east" as const,
  seatWind: "south" as const,
};
const hand = (
  concealedTiles: string[],
  winningTile: string,
  extra: Partial<HandInput> = {},
): HandInput => ({ concealedTiles, winningTile, context, ...extra });
const ids = (input: HandInput) => calculateHand(input).yaku.map((x) => x.id);

describe("役判定", () => {
  it("平和・断么九を判定する", () => {
    const result = calculateHand(
      hand(
        [
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
        "pin8",
      ),
    );
    expect(result.han).toBe(2);
    expect(result.yaku.map((x) => x.id)).toEqual(
      expect.arrayContaining(["pinfu", "tanyao"]),
    );
    expect(result.fu?.roundedFu).toBe(30);
  });

  it("役牌・対々和・三暗刻を判定する", () => {
    const input = hand(
      [
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
      "ji5",
      {
        melds: [{ type: "triplet", tiles: ["ji1", "ji1", "ji1"], open: true }],
      },
    );
    expect(ids(input)).toEqual(
      expect.arrayContaining(["bakaze", "toitoi", "sanankou"]),
    );
  });

  it("七対子を25符で判定する", () => {
    const result = calculateHand(
      hand(
        [
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
        "ji5",
        { context: { ...context, riichi: true } },
      ),
    );
    expect(result.yaku.map((x) => x.id)).toEqual(
      expect.arrayContaining(["chiitoitsu", "riichi"]),
    );
    expect(result.fu).toMatchObject({ rawFu: 25, roundedFu: 25 });
  });

  it("国士無双十三面待ちをダブル役満とする", () => {
    const yaochu = [
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
    ];
    const result = calculateHand(hand(yaochu, "ji7"));
    expect(result.yakumanMultiplier).toBe(2);
    expect(result.yaku[0].name).toBe("国士無双十三面待ち");
  });

  it("四暗刻単騎をダブル役満とする", () => {
    const result = calculateHand(
      hand(
        [
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
        "ji5",
      ),
    );
    expect(result.yakumanMultiplier).toBe(2);
    expect(result.yaku[0].id).toBe("suuankou");
  });

  it("純正九蓮宝燈をダブル役満とする", () => {
    const result = calculateHand(
      hand(
        [
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
        "man5",
      ),
    );
    expect(result.yakumanMultiplier).toBe(2);
    expect(result.yaku[0].name).toBe("純正九蓮宝燈");
  });

  it("ダブル役満形と天和を複合する", () => {
    const yaochu = [
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
    ];
    const result = calculateHand(
      hand(yaochu, "ji7", {
        context: { ...context, winMethod: "tsumo", tenhou: true },
      }),
    );
    expect(result.yakumanMultiplier).toBe(3);
    expect(result.yaku.map((item) => item.id)).toEqual(
      expect.arrayContaining(["kokushi", "tenhou"]),
    );
    expect(result.fu).toBeUndefined();
  });

  it("ドラ・裏ドラ・赤ドラを翻数へ加える", () => {
    const result = calculateHand(
      hand(
        [
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
        "pin8",
        {
          context: {
            ...context,
            riichi: true,
            doraIndicators: ["pin7"],
            uraDoraIndicators: ["sou4"],
          },
        },
      ),
    );
    expect(result.yaku).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "dora", han: 1 }),
        expect.objectContaining({ id: "ura-dora", han: 2 }),
        expect.objectContaining({ id: "aka-dora", han: 1 }),
      ]),
    );
  });
});

describe("符計算", () => {
  it("連風牌の雀頭を2符として切り上げる", () => {
    const result = calculateHand(
      hand(
        [
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
        "ji1",
        {
          context: { ...context, seatWind: "east", riichi: true },
        },
      ),
    );
    expect(result.fu?.items).toContainEqual({ label: "雀頭（東）", fu: 2 });
    expect(result.fu).toMatchObject({ rawFu: 46, roundedFu: 50 });
  });

  it("ロンで完成した刻子を明刻として数える", () => {
    const result = calculateHand(
      hand(
        [
          "man1",
          "man1",
          "man1",
          "pin4",
          "pin5",
          "pin6",
          "sou7",
          "sou8",
          "sou9",
          "pin5",
          "pin5",
          "sou2",
          "sou2",
        ],
        "sou2",
        {
          context: { ...context, riichi: true },
        },
      ),
    );
    expect(result.fu?.items).toContainEqual({ label: "明刻（二索）", fu: 2 });
    expect(result.fu?.roundedFu).toBe(40);
  });

  it("平和ツモを固定20符とする", () => {
    const result = calculateHand(
      hand(
        [
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
        "pin8",
        {
          context: { ...context, winMethod: "tsumo" },
        },
      ),
    );
    expect(result.fu).toEqual({
      rawFu: 20,
      roundedFu: 20,
      items: [{ label: "平和ツモ（固定）", fu: 20 }],
    });
  });
});

describe("入力検証", () => {
  it("5枚目の同一牌を拒否する", () => {
    expect(() =>
      calculateHand(
        hand(
          [
            "man1",
            "man1",
            "man1",
            "man1",
            "man2",
            "man3",
            "man4",
            "pin2",
            "pin3",
            "pin4",
            "sou2",
            "sou3",
            "sou4",
          ],
          "man1",
        ),
      ),
    ).toThrow("4枚を超えています");
  });
});
