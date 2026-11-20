import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TARGET_RADIUS,
  createInitialState,
  startGame,
  registerHit,
  isPointInTarget,
  tickState,
  getRankLabel,
} from "./logic.js";

const STORAGE_KEY = "kusoge:tap-panic:best";
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time-left");
const bestEl = document.getElementById("best-score");
const bannerEl = document.getElementById("result-banner");
const startBtn = document.getElementById("start-btn");
const tapBtn = document.getElementById("tap-btn");
const retryBtn = document.getElementById("retry-btn");
const muteBtn = document.getElementById("mute-btn");

let muted = false;
let audioCtx = null;
let lastFrameTime = performance.now();

function loadBest() {
  try {
    return Number(localStorage.getItem(STORAGE_KEY) || "0") || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // ignore storage errors
  }
}

function playBeep(freq = 440, duration = 0.05) {
  if (muted) return;
  try {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;
    if (!audioCtx) audioCtx = new AudioContextCtor();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {
    // ignore audio errors in headless environments
  }
}

let state = createInitialState(loadBest());

function syncUi() {
  scoreEl.textContent = String(state.score);
  timeEl.textContent = (state.timeLeftMs / 1000).toFixed(1);
  bestEl.textContent = String(state.bestScore);

  startBtn.hidden = state.phase !== "title";
  tapBtn.hidden = state.phase !== "playing";
  retryBtn.hidden = state.phase !== "gameover";

  if (state.phase === "title") {
    bannerEl.textContent = "スタートを押して開始！";
  } else if (state.phase === "playing") {
    bannerEl.textContent = `現在の勢い: ${getRankLabel(state.score)}`;
  } else {
    bannerEl.textContent = `終了！ ${state.score}回 — 称号: ${getRankLabel(state.score)}`;
  }
}

function render() {
  ctx.save();
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = "#171c2b";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (state.shake > 0.2) {
    const sx = (Math.random() - 0.5) * state.shake;
    const sy = (Math.random() - 0.5) * state.shake;
    ctx.translate(sx, sy);
  }

  // Subtle grid
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let x = 40; x < CANVAS_WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let y = 40; y < CANVAS_HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }

  if (state.phase === "playing") {
    ctx.beginPath();
    ctx.arc(state.targetX, state.targetY, TARGET_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "#ff4f79";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#ffd166";
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("押せ!", state.targetX, state.targetY);
  } else if (state.phase === "title") {
    ctx.fillStyle = "#f3f6ff";
    ctx.font = "bold 28px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("10秒連打パニック", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 14);
    ctx.fillStyle = "#a4b0d0";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText("赤い丸・連打ボタン・Space でスコア加算", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 24);
  } else {
    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 34px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`SCORE: ${state.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 16);
    ctx.fillStyle = "#f3f6ff";
    ctx.font = "18px system-ui, sans-serif";
    ctx.fillText(getRankLabel(state.score), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 26);
  }

  ctx.restore();
}

function handleHit() {
  if (state.phase !== "playing") return;
  state = registerHit(state);
  saveBest(state.bestScore);
  playBeep(320 + Math.min(600, state.score * 18), 0.045);
  syncUi();
}

function begin() {
  state = startGame(state);
  playBeep(520, 0.08);
  syncUi();
}

startBtn.addEventListener("click", begin);
retryBtn.addEventListener("click", begin);
tapBtn.addEventListener("click", handleHit);

canvas.addEventListener("pointerdown", (ev) => {
  if (state.phase !== "playing") return;
  const rect = canvas.getBoundingClientRect();
  const x = ((ev.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
  const y = ((ev.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
  if (isPointInTarget(state, x, y)) {
    handleHit();
  }
});

window.addEventListener("keydown", (ev) => {
  if (ev.code === "Space" && !ev.repeat) {
    ev.preventDefault();
    if (state.phase === "playing") {
      handleHit();
    } else {
      begin();
    }
  }
});

muteBtn.addEventListener("click", () => {
  muted = !muted;
  muteBtn.setAttribute("aria-pressed", String(muted));
  muteBtn.textContent = muted ? "🔇 ミュート" : "🔊 音あり";
});

function loop(now) {
  const dt = Math.min(100, now - lastFrameTime);
  lastFrameTime = now;
  const prevPhase = state.phase;
  state = tickState(state, dt);
  if (prevPhase === "playing" && state.phase === "gameover") {
    playBeep(220, 0.2);
  }
  syncUi();
  render();
  requestAnimationFrame(loop);
}

syncUi();
render();
requestAnimationFrame(loop);
