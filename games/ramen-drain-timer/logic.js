export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 320;
export const TARGET_TIME_MIN = 5.5;
export const TARGET_TIME_MAX = 6.5;
export const SUCCESS_THRESHOLD_MS = 50; // ±0.05 秒以内で成功

export function createInitialState(bestScore = 0, rng = Math.random) {
  const targetTimeMs =
    (TARGET_TIME_MIN + rng() * (TARGET_TIME_MAX - TARGET_TIME_MIN)) * 1000;
  return {
    phase: "title",
    currentTimeMs: 0,
    targetTimeMs,
    bestScore: Math.max(0, Number(bestScore) || 0),
    shake: 0,
    explosionFrames: 0,
  };
}

export function startGame(state) {
  return {
    ...state,
    phase: "playing",
    currentTimeMs: 0,
    targetTimeMs:
      (TARGET_TIME_MIN + Math.random() * (TARGET_TIME_MAX - TARGET_TIME_MIN)) * 1000,
    shake: 0,
    explosionFrames: 0,
  };
}

export function stopTimer(state) {
  if (state.phase !== "playing") return state;
  const diff = Math.abs(state.currentTimeMs - state.targetTimeMs);
  const isPerfect = diff <= SUCCESS_THRESHOLD_MS;
  const score = isPerfect
    ? Math.max(0, 100 - Math.floor(diff / 10))
    : 0;
  return {
    ...state,
    phase: isPerfect ? "success" : "gameover",
    bestScore: isPerfect ? Math.max(state.bestScore, score) : state.bestScore,
    shake: isPerfect ? 0 : 20,
    explosionFrames: isPerfect ? 0 : 60,
  };
}

export function tickState(state, deltaMs) {
  if (state.phase !== "playing") {
    if (state.phase === "gameover" && state.explosionFrames > 0) {
      return {
        ...state,
        explosionFrames: state.explosionFrames - 1,
        shake: Math.min(20, 10 + Math.random() * 15),
      };
    }
    return state;
  }
  const nextTime = state.currentTimeMs + deltaMs;
  const nextShake = Math.max(0, state.shake - deltaMs * 0.02);
  return {
    ...state,
    currentTimeMs: nextTime,
    shake: nextShake,
  };
}

export function formatTimeMs(ms) {
  return (ms / 1000).toFixed(2);
}

export function getRankLabel(score) {
  if (score >= 95) return "神の湯切り技";
  if (score >= 85) return "ラーメン職人";
  if (score >= 70) return "店長候補";
  if (score >= 50) return "バイト新人";
  return "湯切り未熟者";
}

export function createExplosionParticles(x, y, count = 50) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 3 + Math.random() * 7;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 60 + Math.random() * 30,
      color: `hsl(${10 + Math.random() * 40}, 100%, ${50 + Math.random() * 30}%)`,
      size: 2 + Math.random() * 4,
    });
  }
  return particles;
}
