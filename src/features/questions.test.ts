import { describe, expect, it } from "vitest";
import { createQuestion, type Mode } from "./questions";

describe("問題生成", () => {
  it.each<Mode>(["fu", "han", "score"])(
    "%sモードの正解が選択肢に含まれる",
    (mode) => {
      for (let i = 0; i < 30; i++) {
        const question = createQuestion(mode);
        expect(question.mode).toBe(mode);
        expect(question.choices).toContain(question.answer);
        expect(question.explanation.length).toBeGreaterThan(0);
      }
    },
  );

  it("連続して異なる出題IDを生成する", () => {
    expect(createQuestion("fu").id).not.toBe(createQuestion("fu").id);
  });

  it.each<Mode>(["fu", "han", "score"])(
    "%sモードで同じ内容を連続出題しない",
    (mode) => {
      const first = createQuestion(mode);
      const second = createQuestion(mode);
      const content = (question: ReturnType<typeof createQuestion>) =>
        JSON.stringify({
          facts: question.facts,
          tiles: question.tiles,
          win: question.winTile,
          melds: question.melds,
        });
      expect(content(second)).not.toBe(content(first));
    },
  );
});
