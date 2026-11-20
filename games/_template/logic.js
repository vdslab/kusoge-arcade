export function createInitialState() {
  return { phase: "title", score: 0 };
}

export function startGame(state) {
  return { ...state, phase: "playing", score: 0 };
}

export function applyAction(state) {
  if (state.phase !== "playing") return state;
  return { ...state, score: state.score + 1 };
}

export function finishGame(state) {
  return { ...state, phase: "gameover" };
}
