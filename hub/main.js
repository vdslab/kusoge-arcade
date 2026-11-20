const grid = document.getElementById("game-grid");
const statusMessage = document.getElementById("status-message");

function renderGameCard(game) {
  const card = document.createElement("a");
  card.className = "game-card";
  card.href = `./${game.path}`;
  card.dataset.gameSlug = game.slug;

  const title = document.createElement("h2");
  title.textContent = game.title;

  const tagline = document.createElement("p");
  tagline.className = "game-tagline";
  tagline.textContent = game.tagline;

  const controls = document.createElement("p");
  controls.className = "game-controls";
  controls.textContent = `操作: ${game.controls}`;

  const tagList = document.createElement("div");
  tagList.className = "tag-list";
  for (const tagText of game.tags || []) {
    const badge = document.createElement("span");
    badge.className = "tag";
    badge.textContent = tagText;
    tagList.appendChild(badge);
  }

  card.append(title, tagline, controls, tagList);
  return card;
}

async function init() {
  try {
    const res = await fetch("./games-manifest.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const games = Array.isArray(data.games) ? data.games : [];

    if (games.length === 0) {
      statusMessage.textContent = "まだゲームが格納されていません。";
      return;
    }

    for (const game of games) {
      grid.appendChild(renderGameCard(game));
    }
  } catch (err) {
    statusMessage.textContent = `ゲーム一覧の読み込みに失敗しました: ${err.message}`;
    console.error(err);
  }
}

init();
