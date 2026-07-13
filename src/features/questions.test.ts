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
});
