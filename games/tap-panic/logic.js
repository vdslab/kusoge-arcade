export const GAME_DURATION_MS = 10_000;
export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 320;
export const TARGET_RADIUS = 44;

export function createInitialState(bestScore = 0) {
  return {
    phase: "title",
    score: 0,
    bestScore: Math.max(0, Number(bestScore) || 0),
    timeLeftMs: GAME_DURATION_MS,
    targetX: CANVAS_WIDTH / 2,
    targetY: CANVAS_HEIGHT / 2,
    shake: 0,
  };
}

export function startGame(state) {
  return {
    ...state,
    phase: "playing",
    score: 0,
    timeLeftMs: GAME_DURATION_MS,
    targetX: CANVAS_WIDTH / 2,
    targetY: CANVAS_HEIGHT / 2,
    shake: 0,
  };
}

export function registerHit(state, rng = Math.random) {
  if (state.phase !== "playing") return state;
  const nextScore = state.score + 1;
  const pad = TARGET_RADIUS + 16;
  const targetX = pad + rng() * (CANVAS_WIDTH - pad * 2);
  const targetY = pad + rng() * (CANVAS_HEIGHT - pad * 2);
  return {
    ...state,
    score: nextScore,
    bestScore: Math.max(state.bestScore, nextScore),
    targetX,
    targetY,
    shake: Math.min(14, 4 + nextScore * 0.3),
  };
}

export function isPointInTarget(state, x, y) {
  const dx = x - state.targetX;
  const dy = y - state.targetY;
  return dx * dx + dy * dy <= (TARGET_RADIUS + 14) ** 2;
}

export function tickState(state, deltaMs) {
  if (state.phase !== "playing") return state;
  const nextTime = Math.max(0, state.timeLeftMs - Math.max(0, deltaMs));
  const nextShake = Math.max(0, state.shake - deltaMs * 0.03);
  if (nextTime <= 0) {
    return {
      ...state,
      phase: "gameover",
      timeLeftMs: 0,
      shake: 0,
    };
  }
  return {
    ...state,
    timeLeftMs: nextTime,
    shake: nextShake,
  };
}

export function getRankLabel(score) {
  if (score >= 40) return "指が亜光速の伝説";
  if (score >= 25) return "プロ連打職人";
  if (score >= 10) return "見習いパンチャー";
  return "まずは寝起きストレッチから";
}
