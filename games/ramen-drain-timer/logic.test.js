import { describe, it, expect } from "vitest";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TARGET_TIME_MIN,
  TARGET_TIME_MAX,
  SUCCESS_THRESHOLD_MS,
  createInitialState,
  startGame,
  stopTimer,
  tickState,
  formatTimeMs,
  getRankLabel,
} from "./logic.js";

describe("ramen-drain-timer logic", () => {
  it("initializes with random target time between 5.5 and 6.5 seconds", () => {
    const state = createInitialState(0, () => 0.5);
    expect(state.phase).toBe("title");
    expect(state.currentTimeMs).toBe(0);
    expect(state.targetTimeMs).toBe(6000); // 5.5 + 0.5 * 1.0 = 6.0 seconds
    expect(state.bestScore).toBe(0);
  });

  it("starts game with new random target time", () => {
    let state = createInitialState(3, () => 0.3);
    state = startGame(state);
    expect(state.phase).toBe("playing");
    expect(state.currentTimeMs).toBe(0);
    expect(state.targetTimeMs).toBeGreaterThanOrEqual(TARGET_TIME_MIN * 1000);
    expect(state.targetTimeMs).toBeLessThanOrEqual(TARGET_TIME_MAX * 1000);
  });

  it("increments score on perfect stop and fails on large error", () => {
    let state = startGame(createInitialState(0, () => 0.5));
    state.targetTimeMs = 6000; // 6.0 seconds
    
    // Perfect stop (within 50ms)
    state.currentTimeMs = 5980; // 20ms early
    state = stopTimer(state);
    expect(state.phase).toBe("success");
    expect(state.bestScore).toBeGreaterThan(80);

    // Reset and try with large error
    state = startGame(createInitialState(0, () => 0.5));
    state.targetTimeMs = 6000;
    state.currentTimeMs = 6500; // 500ms late
    state = stopTimer(state);
    expect(state.phase).toBe("gameover");
    expect(state.bestScore).toBe(0);
  });

  it("transitions to gameover with explosion when stopped too late", () => {
    let state = startGame(createInitialState(0, () => 0.5));
    state.targetTimeMs = 5000;
    state.currentTimeMs = 6000; // 1 second late
    state = stopTimer(state);
    expect(state.phase).toBe("gameover");
    expect(state.explosionFrames).toBeGreaterThan(0);
  });

  it("ticks time while playing and reduces shake", () => {
    let state = startGame(createInitialState(0, () => 0.5));
    state.shake = 10;
    const originalTime = state.currentTimeMs;
    state = tickState(state, 100);
    expect(state.currentTimeMs).toBe(originalTime + 100);
    expect(state.shake).toBeLessThan(10);
  });

  it("continues explosion animation after gameover", () => {
    let state = {
      phase: "gameover",
      currentTimeMs: 0,
      targetTimeMs: 6000,
      bestScore: 50,
      shake: 20,
      explosionFrames: 30,
    };
    state = tickState(state, 100);
    expect(state.phase).toBe("gameover");
    expect(state.explosionFrames).toBe(29);
    expect(state.shake).toBeGreaterThan(0);
  });

  it("formats time correctly", () => {
    expect(formatTimeMs(0)).toBe("0.00");
    expect(formatTimeMs(100)).toBe("0.10");
    expect(formatTimeMs(1234)).toBe("1.23");
    expect(formatTimeMs(6000)).toBe("6.00");
  });

  it("returns appropriate rank labels", () => {
    expect(getRankLabel(98)).toContain("神");
    expect(getRankLabel(90)).toContain("職人");
    expect(getRankLabel(75)).toContain("店長");
    expect(getRankLabel(55)).toContain("バイト");
    expect(getRankLabel(30)).toContain("未熟者");
  });
});
