import { describe, it, expect } from "vitest";
import { createInitialState, startGame, applyAction, finishGame } from "./logic.js";

describe("template-game logic", () => {
  it("increments score while playing", () => {
    let s = createInitialState();
    s = applyAction(s);
    expect(s.score).toBe(0);
    s = startGame(s);
    s = applyAction(s);
    expect(s.score).toBe(1);
    s = finishGame(s);
    expect(s.phase).toBe("gameover");
  });
});
