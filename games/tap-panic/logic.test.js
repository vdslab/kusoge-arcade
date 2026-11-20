import { describe, it, expect } from "vitest";
import {
  GAME_DURATION_MS,
  createInitialState,
  startGame,
  registerHit,
  isPointInTarget,
  tickState,
  getRankLabel,
} from "./logic.js";

describe("tap-panic logic", () => {
  it("ignores hits before game starts and increments score while playing", () => {
    let s = createInitialState(3);
    expect(registerHit(s).score).toBe(0);

    s = startGame(s);
    expect(s.phase).toBe("playing");
    expect(s.timeLeftMs).toBe(GAME_DURATION_MS);

    s = registerHit(s, () => 0.5);
    expect(s.score).toBe(1);
    expect(s.bestScore).toBe(3);

    for (let i = 0; i < 4; i++) s = registerHit(s, () => 0.25);
    expect(s.score).toBe(5);
    expect(s.bestScore).toBe(5);
  });

  it("detects target hit radius and transitions to gameover when timer expires", () => {
    let s = startGame(createInitialState());
    expect(isPointInTarget(s, s.targetX, s.targetY)).toBe(true);
    expect(isPointInTarget(s, 0, 0)).toBe(false);

    s = tickState(s, GAME_DURATION_MS + 100);
    expect(s.phase).toBe("gameover");
    expect(s.timeLeftMs).toBe(0);
  });

  it("returns appropriate rank labels", () => {
    expect(getRankLabel(0)).toContain("ストレッチ");
    expect(getRankLabel(15)).toContain("見習い");
    expect(getRankLabel(30)).toContain("プロ");
    expect(getRankLabel(45)).toContain("亜光速");
  });
});
