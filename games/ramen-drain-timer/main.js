import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  createInitialState,
  startGame,
  stopTimer,
  tickState,
  formatTimeMs,
  getRankLabel,
  createExplosionParticles,
} from "./logic.js";

const STORAGE_KEY = "kusoge:ramen-drain-timer:best";
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const targetTimeEl = document.getElementById("target-time");
const currentTimeEl = document.getElementById("current-time");
const bestScoreEl = document.getElementById("best-score");
const bannerEl = document.getElementById("result-banner");
const startBtn = document.getElementById("start-btn");
const stopBtn = document.getElementById("stop-btn");
const retryBtn = document.getElementById("retry-btn");
const muteBtn = document.getElementById("mute-btn");

let muted = false;
let audioCtx = null;
let particles = [];
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

function playBeep(freq = 440, duration = 0.05, type = "sine") {
  if (muted) return;
  try {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;
    if (!audioCtx) audioCtx = new AudioContextCtor();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {
    // ignore audio errors in headless environments
  }
}

function playExplosionSound() {
  if (muted) return;
  try {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;
    if (!audioCtx) audioCtx = new AudioContextCtor();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  } catch {
    // ignore audio errors
  }
}

let state = createInitialState(loadBest());

function syncUi() {
  targetTimeEl.textContent = formatTimeMs(state.targetTimeMs);
  currentTimeEl.textContent = formatTimeMs(state.currentTimeMs);
  bestScoreEl.textContent = String(state.bestScore);

  startBtn.hidden = state.phase !== "title";
  stopBtn.hidden = state.phase !== "playing";
  retryBtn.hidden = state.phase !== "success" && state.phase !== "gameover";

  if (state.phase === "title") {
    bannerEl.textContent = "スタートを押して開始！";
    bannerEl.style.color = "var(--warning)";
  } else if (state.phase === "playing") {
    const progress = (state.currentTimeMs / state.targetTimeMs) * 100;
    if (progress > 90) {
      bannerEl.textContent = "今だ！！";
      bannerEl.style.color = "var(--danger)";
    } else {
      bannerEl.textContent = `目標：${formatTimeMs(state.targetTimeMs)}秒でストップ！`;
      bannerEl.style.color = "var(--warning)";
    }
  } else if (state.phase === "success") {
    const diff = Math.abs(state.currentTimeMs - state.targetTimeMs);
    bannerEl.textContent = `成功！ズレ ${formatTimeMs(diff)}秒 — 称号：${getRankLabel(state.bestScore)}`;
    bannerEl.style.color = "#4f7cff";
  } else {
    bannerEl.textContent = `爆発！！！ズレ ${formatTimeMs(Math.abs(state.currentTimeMs - state.targetTimeMs))}秒で店が壊滅...`;
    bannerEl.style.color = "var(--danger)";
  }
}

function render() {
  ctx.save();
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Background
  ctx.fillStyle = "#171c2b";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Apply shake effect
  if (state.shake > 0.2) {
    const sx = (Math.random() - 0.5) * state.shake;
    const sy = (Math.random() - 0.5) * state.shake;
    ctx.translate(sx, sy);
  }

  // Draw pot/boiling effect
  const potY = CANVAS_HEIGHT - 80;
  const potRadius = 100;
  
  // Pot body
  ctx.fillStyle = "#3a4a5c";
  ctx.beginPath();
  ctx.ellipse(CANVAS_WIDTH / 2, potY + 30, potRadius, potRadius * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Water surface
  const waterColor = state.phase === "playing" 
    ? `hsl(200, 70%, ${40 + Math.sin(Date.now() / 100) * 10}%)`
    : "#2a5a8a";
  ctx.fillStyle = waterColor;
  ctx.beginPath();
  ctx.ellipse(CANVAS_WIDTH / 2, potY + 25, potRadius - 5, (potRadius - 5) * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Boiling bubbles (only when playing)
  if (state.phase === "playing") {
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    for (let i = 0; i < 8; i++) {
      const bx = CANVAS_WIDTH / 2 + (Math.sin(Date.now() / 200 + i) * 60);
      const by = potY + 20 + Math.abs(Math.cos(Date.now() / 150 + i)) * 15;
      const br = 3 + Math.sin(Date.now() / 100 + i * 2) * 2;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Timer display
  ctx.fillStyle = state.phase === "gameover" ? "#ff2e5c" : "#f3f6ff";
  ctx.font = "bold 48px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(formatTimeMs(state.currentTimeMs), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

  // Target time indicator
  ctx.fillStyle = "#a4b0d0";
  ctx.font = "18px system-ui, sans-serif";
  ctx.fillText(`目標：${formatTimeMs(state.targetTimeMs)}秒`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

  // Progress bar
  const progressWidth = 200;
  const progressHeight = 12;
  const progressX = (CANVAS_WIDTH - progressWidth) / 2;
  const progressY = CANVAS_HEIGHT - 120;
  
  // Background bar
  ctx.fillStyle = "#2a3545";
  ctx.fillRect(progressX, progressY, progressWidth, progressHeight);

  // Progress fill
  const progress = Math.min(1, state.currentTimeMs / state.targetTimeMs);
  const progressColor = progress > 0.9 ? "#ff2e5c" : "#4f7cff";
  ctx.fillStyle = progressColor;
  ctx.fillRect(progressX, progressY, progressWidth * progress, progressHeight);

  // Target line marker
  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(progressX + progressWidth * (state.targetTimeMs / (state.targetTimeMs + 1000)), progressY - 4);
  ctx.lineTo(progressX + progressWidth * (state.targetTimeMs / (state.targetTimeMs + 1000)), progressY + progressHeight + 4);
  ctx.stroke();

  // Title text
  if (state.phase === "title") {
    ctx.fillStyle = "#f3f6ff";
    ctx.font = "bold 24px system-ui, sans-serif";
    ctx.fillText("ラーメン湯切りパニック", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    ctx.fillStyle = "#a4b0d0";
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillText("Space キー / クリック / タップでストップ", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
  }

  // Explosion effect
  if (state.phase === "gameover" && state.explosionFrames > 0) {
    // Flash effect
    ctx.fillStyle = `rgba(255, 100, 50, ${state.explosionFrames / 120})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Create particles on first frame
    if (particles.length === 0) {
      particles = createExplosionParticles(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }

    // Update and draw particles
    particles = particles.filter((p) => p.life > 0);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2; // gravity
      p.life--;
      p.size *= 0.98;

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Game over text
    if (state.explosionFrames % 10 < 5) {
      ctx.fillStyle = "#ffd166";
      ctx.font = "bold 36px system-ui, sans-serif";
      ctx.fillText("爆発！！！" , CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
  }

  // Success text
  if (state.phase === "success") {
    ctx.fillStyle = "#4f7cff";
    ctx.font = "bold 32px system-ui, sans-serif";
    ctx.fillText("完璧！！", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
  }

  ctx.restore();
}

function handleStop() {
  if (state.phase !== "playing") return;
  const prevPhase = state.phase;
  state = stopTimer(state);
  saveBest(state.bestScore);
  
  if (state.phase === "success") {
    playBeep(880, 0.1, "sine");
    setTimeout(() => playBeep(1100, 0.15, "sine"), 100);
  } else {
    playExplosionSound();
  }
  
  syncUi();
}

function begin() {
  state = startGame(state);
  particles = [];
  playBeep(520, 0.08);
  syncUi();
}

startBtn.addEventListener("click", begin);
retryBtn.addEventListener("click", begin);
stopBtn.addEventListener("click", handleStop);

canvas.addEventListener("pointerdown", (ev) => {
  if (state.phase === "playing") {
    ev.preventDefault();
    handleStop();
  }
});

window.addEventListener("keydown", (ev) => {
  if (ev.code === "Space" && !ev.repeat) {
    ev.preventDefault();
    if (state.phase === "playing") {
      handleStop();
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
  state = tickState(state, dt);
  syncUi();
  render();
  requestAnimationFrame(loop);
}

syncUi();
render();
requestAnimationFrame(loop);
