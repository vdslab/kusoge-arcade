import { createInitialState, startGame, applyAction } from "./logic.js";

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const startBtn = document.getElementById("start-btn");
const retryBtn = document.getElementById("retry-btn");
const muteBtn = document.getElementById("mute-btn");

let state = createInitialState();
let muted = false;

function render() {
  scoreEl.textContent = String(state.score);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1d2233";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    state.phase === "playing" ? `SCORE: ${state.score}` : "PRESS START",
    canvas.width / 2,
    canvas.height / 2
  );
}

startBtn.addEventListener("click", () => {
  state = startGame(state);
  startBtn.hidden = true;
  retryBtn.hidden = false;
  render();
});

retryBtn.addEventListener("click", () => {
  state = startGame(createInitialState());
  render();
});

canvas.addEventListener("pointerdown", () => {
  state = applyAction(state);
  render();
});

muteBtn.addEventListener("click", () => {
  muted = !muted;
  muteBtn.setAttribute("aria-pressed", String(muted));
  muteBtn.textContent = muted ? "🔇 ミュート" : "🔊 音あり";
});

render();
