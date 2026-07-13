import { describe, expect, it } from "vitest";
import { calculateHand } from "../../../domain/mahjong/hand";
import { generateHandScenario, type HandPracticeMode } from "./handGenerator";

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

describe("条件付き手牌生成", () => {
  it.each<HandPracticeMode>(["fu", "han"])(
    "%s問題を計算エンジンで再検証できる",
    (mode) => {
      const themes = new Set<string>();
      for (let seed = 0; seed < 100; seed++) {
        const rest = seededRandom(seed + 1);
        let calls = 0;
        const random = () => (calls++ === 0 ? (seed + 0.5) / 100 : rest());
        const scenario = generateHandScenario(mode, { random });
        const recalculated = calculateHand(scenario.hand);
        expect(scenario.source).toBe("generated");
        expect(recalculated.han).toBe(scenario.result.han);
        expect(recalculated.yakumanMultiplier).toBe(
          scenario.result.yakumanMultiplier,
        );
        if (mode === "fu")
          expect(recalculated.fu?.roundedFu).toBeGreaterThanOrEqual(20);
        if (mode === "han")
          expect(scenario.hand.context.doraIndicators?.length).toBeGreaterThan(
            0,
          );
        themes.add(scenario.tags[0]);
      }
      expect(themes.size).toBeGreaterThanOrEqual(mode === "fu" ? 5 : 7);
    },
  );

  it.each<HandPracticeMode>(["fu", "han"])(
    "%s生成の試行上限後に固定問題へ切り替える",
    (mode) => {
      const scenario = generateHandScenario(mode, { maxAttempts: 0 });
      expect(scenario.source).toBe("fallback");
      expect(() => calculateHand(scenario.hand)).not.toThrow();
    },
  );

  it("直前と同じ問題を除外する", () => {
    const first = generateHandScenario("fu", { random: () => 0 });
    const next = generateHandScenario("fu", {
      random: () => 0,
      excludeFingerprint: first.fingerprint,
    });
    expect(next.fingerprint).not.toBe(first.fingerprint);
  });
});
