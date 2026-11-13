import "./style.css";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import {
  clamp,
  unit,
  inArc,
  freshSave,
  loadSave,
  saveGame,
  penalty,
} from "./core.js";
import {
  W,
  H,
  createWorld,
  drawCharacter,
  drawEnemy,
  drawMap,
  canWalk,
} from "./render.js";
const $ = (s) => document.querySelector(s),
  app = $("#app");
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let storage;
try {
  storage = window.localStorage;
} catch {
  storage = {
    getItem: () => null,
    setItem: () => {
      throw Error("storage unavailable");
    },
  };
}
let settings = { lang: "id", fps: 60, sound: true, music: false, volume: 0.35 };
try {
  const s = JSON.parse(storage.getItem("desert-settings"));
  if (s) settings = { ...settings, ...s };
} catch {}
settings.lang = settings.lang === "en" ? "en" : "id";
settings.fps = settings.fps === 30 ? 30 : 60;
settings.volume = Number.isFinite(settings.volume)
  ? clamp(settings.volume, 0, 1)
  : 0.35;
const t = (id, en) => (settings.lang === "id" ? id : en);
function persistSettings() {
  try {
    storage.setItem("desert-settings", JSON.stringify(settings));
  } catch {
    toast(t("Pengaturan tidak bisa disimpan.", "Settings could not be saved."));
  }
}
let saved = loadSave(storage),
  player = { ...(saved || freshSave()), fx: 0, fy: 1, moving: false };
let mode = "menu",
  modal = false,
  editing = false,
  hiddenPause = false,
  clock = 0,
  last = 0,
  acc = 0,
  saveTimer = 0,
  hudTimer = 0,
  shake = 0,
  attackAnim = 0,
  guard = 0,
  dodgeTime = 0,
  toastTimer = 0;
const cds = { attack: 0, skill1: 0, skill2: 0, dodge: 0 },
  keys = new Set(),
  joy = { x: 0, y: 0 };
let camera = { x: 950, y: 690 },
  effects = [],
  enemies = [];
let hudLayout = {};
try {
  hudLayout = JSON.parse(storage.getItem("desert-hud")) || {};
} catch {}
const world = createWorld();
let ctx, canvas;
const npc = { x: 610, y: 785, fx: 0, fy: 1 };
function makeEnemies() {
  enemies = [
    [1100, 940],
    [1250, 1060],
    [1460, 990],
    [1570, 720],
    [1370, 350],
    [500, 1060],
  ].map(([x, y], id) => ({
    id,
    x,
    y,
    sx: x,
    sy: y,
    hp: 60,
    max: 60,
    hit: 0,
    flash: 0,
    dead: 0,
  }));
}
makeEnemies();
function initShell() {
  app.innerHTML = `<canvas id="world" aria-label="${t("Dunia oasis pixel", "Pixel oasis world")}"></canvas><div id="menu"></div><div id="hud" class="hud hidden"></div><div id="overlay"></div><div id="toast" class="toast hidden" role="status" aria-live="polite"></div><div class="rotate-tip">↻ ${t("Putar HP mendatar untuk kontrol yang lebih nyaman.", "Rotate your phone to landscape for comfortable controls.")}</div>`;
  canvas = $("#world");
  ctx = canvas.getContext("2d");
  resize();
  renderMenu();
}
function resize() {
  if (!canvas) return;
  canvas.width = Math.ceil(innerWidth / 2);
  canvas.height = Math.ceil(innerHeight / 2);
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener("resize", resize);
function renderMenu() {
  mode = "menu";
  app.classList.remove("playing");
  $("#hud").classList.add("hidden");
  $("#menu").classList.remove("hidden");
  $("#menu").innerHTML =
    `<div class="vignette"></div><header class="header"><div class="brand"><span class="brand-mark">✦</span><div class="brand-name">DESERT<small>PIXEL RPG</small></div></div><div class="header-right"><span class="status"><i class="dot"></i>${t("DUNIA OFFLINE", "OFFLINE WORLD")}</span><button class="square" id="settings" aria-label="${t("Pengaturan", "Settings")}">⚙</button></div></header><span class="version">PROTOTYPE / 0.1</span><main class="menu-content"><div class="eyebrow">${t("SEBUAH PETUALANGAN BARU", "A NEW ADVENTURE")}</div><h1>${t("Di balik<br><em>bukit pasir.</em>", "Beyond<br><em>the dunes.</em>")}</h1><p class="intro">${t("Di antara pasir dan reruntuhan, sebuah oasis menanti. Langkah pertamamu dimulai di sini.", "Between the sands and ancient ruins, an oasis awaits. Your first journey begins here.")}</p><button class="primary" id="play"><span>▷ &nbsp; ${saved ? t("LANJUTKAN PETUALANGAN", "CONTINUE ADVENTURE") : t("MULAI PETUALANGAN", "BEGIN ADVENTURE")}</span><span>→</span></button><div class="resume-detail">${saved ? `${escape(saved.name)} · ${t("Petarung", "Fighter")} · ${Math.floor(saved.time / 60)} ${t("menit", "min")}` : t("01 SLOT DUNIA · TERSIMPAN OTOMATIS", "01 WORLD SLOT · AUTOMATIC SAVING")}</div><nav class="menu-links"><button id="profile">${t("Profil", "Profile")}</button><button id="shop">${t("Shop", "Shop")}</button><button id="about">${t("Tentang dunia", "About the world")}</button></nav></main><aside class="scene-tag"><small>01 / ${t("WILAYAH AWAL", "STARTING REGION")}</small><h2>${t("Oasis Nara", "Nara Oasis")}</h2><p>${t("Tempat singgah. Awal sebuah kisah.", "A place to rest. A story to begin.")}</p></aside><footer class="footer"><span><b>✦</b> &nbsp; ${t("DUNIA KECIL. PETUALANGAN BESAR.", "SMALL PIXELS. GRAND ADVENTURES.")}</span><button class="sound" id="sound">${settings.sound ? "♫" : "♩"} &nbsp; ${t("SUARA", "SOUND")} ${settings.sound ? "ON" : "OFF"}</button></footer>`;
  $("#play").onclick = () => (saved ? startGame() : characterModal());
  $("#settings").onclick = settingsModal;
  $("#profile").onclick = profileModal;
  $("#shop").onclick = shopModal;
  $("#about").onclick = aboutModal;
  $("#sound").onclick = () => {
    settings.sound = !settings.sound;
    persistSettings();
    audioStart();
    renderMenu();
  };
}
function toast(msg) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 3100);
}
function openModal(html, wide = false) {
  modal = true;
  clearInput();
  $("#overlay").innerHTML =
    `<div class="modal-shade"><section class="modal ${wide ? "wide" : ""}" role="dialog" aria-modal="true" aria-label="${t("Menu permainan", "Game menu")}"><button class="close" id="close-modal" aria-label="${t("Tutup", "Close")}">×</button>${html}</section></div>`;
  $("#close-modal").onclick = closeModal;
  $("#close-modal").focus();
}
function closeModal() {
  modal = false;
  $("#overlay").innerHTML = "";
  clearInput();
  if (mode === "game") updateHUD();
}
function title(k, h, p = "") {
  return `<div class="eyebrow">${k}</div><h2>${h}</h2>${p ? `<p>${p}</p>` : ""}`;
}
function characterModal() {
  let look = { skin: 0, hair: 0, outfit: 0 };
  openModal(
    title(
      t("PETUALANGAN BARU", "NEW ADVENTURE"),
      t("Siapa namamu, pengembara?", "Who are you, wanderer?"),
      t(
        "Satu langkah menuju Oasis Nara. Prototipe ini menguji class petarung.",
        "Your first step into Nara Oasis. This prototype tests the fighter class.",
      ),
    ) +
      `<div class="row"><canvas class="character-preview" id="char-preview" width="60" height="70" style="flex:none"></canvas><div><span class="badge">${t("PETARUNG · LEVEL 1", "FIGHTER · LEVEL 1")}</span><label for="char-name">${t("NAMA KARAKTER", "CHARACTER NAME")}</label><input id="char-name" maxlength="20" value="${t("Pengembara", "Wanderer")}" autocomplete="off"></div></div><div class="row">${[
        "skin",
        "hair",
        "outfit",
      ]
        .map(
          (key, i) =>
            `<div><label>${[t("KULIT", "SKIN"), t("RAMBUT", "HAIR"), t("PAKAIAN", "OUTFIT")][i]}</label><div class="swatches">${[
              ["#ce9a67", "#9d6b46", "#e6ba88"],
              ["#4a3b30", "#b9884b", "#c8c1a2"],
              ["#467372", "#8c584c", "#697443"],
            ][i]
              .map(
                (col, j) =>
                  `<button class="swatch ${j === 0 ? "selected" : ""}" data-key="${key}" data-val="${j}" style="background:${col}" aria-label="${key} ${j + 1}"></button>`,
              )
              .join("")}</div></div>`,
        )
        .join(
          "",
        )}</div><p class="small-note">${t("Pilihan tubuh dan class lain menyusul. Penampilan tidak memengaruhi statistik.", "Body options and other classes are planned. Appearance does not affect stats.")}</p><button class="primary" id="create">${t("MASUK KE OASIS", "ENTER THE OASIS")} <span>→</span></button>`,
  );
  const preview = () => {
    const g = $("#char-preview").getContext("2d");
    g.clearRect(0, 0, 60, 70);
    g.imageSmoothingEnabled = false;
    g.save();
    g.scale(1.3, 1.3);
    drawCharacter(g, { x: 23, y: 44, fx: 0, fy: 1 }, 0, look);
    g.restore();
  };
  preview();
  document.querySelectorAll(".swatch").forEach(
    (b) =>
      (b.onclick = () => {
        look[b.dataset.key] = Number(b.dataset.val);
        b.parentNode
          .querySelectorAll("button")
          .forEach((v) => v.classList.remove("selected"));
        b.classList.add("selected");
        preview();
      }),
  );
  $("#create").onclick = () => {
    const name = $("#char-name").value.trim();
    if (!name) {
      toast(t("Isi nama karakter dahulu.", "Enter a character name first."));
      return;
    }
    player = { ...freshSave(name, look), fx: 0, fy: 1 };
    makeEnemies();
    for (const key in cds) cds[key] = 0;
    guard = dodgeTime = attackAnim = 0;
    effects = [];
    saved = null;
    persist();
    startGame();
    tutorial(0);
  };
}
function startGame() {
  closeModal();
  mode = "game";
  app.classList.add("playing");
  $("#menu").classList.add("hidden");
  $("#hud").classList.remove("hidden");
  camera = { x: player.x, y: player.y };
  buildHUD();
  audioStart();
}
const controlInfo = {
  attack: ["⚔", () => t("SERANG", "ATTACK"), { x: 90, y: 76 }, 80],
  skill1: ["✧", () => t("TEBAS", "CLEAVE"), { x: 80, y: 70 }, 56],
  skill2: ["◇", () => t("TANGKIS", "GUARD"), { x: 87, y: 57 }, 56],
  dodge: ["➶", () => t("HINDAR", "DODGE"), { x: 96, y: 57 }, 57],
  potion: ["✚", () => t("POTION", "POTION"), { x: 71, y: 87 }, 44],
  bag: ["▤", () => t("TAS", "BAG"), { x: 63, y: 87 }, 44],
  interact: ["☷", () => t("BICARA", "TALK"), { x: 54, y: 87 }, 44],
};
function buildHUD() {
  const h = $("#hud");
  h.innerHTML = `<div class="player-panel"><canvas class="portrait" id="portrait" width="40" height="48"></canvas><div class="player-info"><div class="player-title"><span>${escape(player.name)}</span><small>LV. 01</small></div><div class="meter"><i id="hp-fill"></i></div><div class="meter stamina"><i id="st-fill"></i></div><div class="vitals"><span id="hp-text"></span><span id="st-text"></span></div></div></div><div class="location"><strong>${t("OASIS NARA", "NARA OASIS")}</strong><small>${t("WILAYAH LATIHAN · HARI 01", "TRAINING REGION · DAY 01")}</small></div><button class="square pause-btn" id="pause" aria-label="${t("Jeda", "Pause")}">Ⅱ</button><button class="map-box" id="map-button" aria-label="${t("Buka peta", "Open map")}"><canvas id="minimap" width="145" height="100"></canvas><div class="map-caption">${t("OASIS NARA", "NARA OASIS")} ↗</div></button><div class="quest-panel" id="quest-panel"><button class="quest-fold" id="quest-fold" aria-label="${t("Ciutkan quest", "Collapse quest")}">‹</button><h3>◇ ${t("LANGKAH PERTAMA", "FIRST STEPS")}</h3><strong id="quest-title"></strong><p id="quest-text"></p></div><div class="joystick" id="joystick" role="application" aria-label="${t("Joystick gerak", "Movement joystick")}"><div class="stick"></div></div>${Object.entries(
    controlInfo,
  )
    .map(
      ([id, [icon, label, pos, size]]) =>
        `<button class="control ${id === "attack" ? "attack" : id === "dodge" ? "dodge" : id.startsWith("skill") ? "skill" : "utility"}" id="${id}" data-hud="${id}" aria-label="${label()}"><span class="glyph">${icon}</span><small>${label()}</small></button>`,
    )
    .join(
      "",
    )}<div class="key-hint">WASD / ↑↓←→ &nbsp; ${t("GERAK", "MOVE")} &nbsp; · &nbsp; J ${t("SERANG", "ATTACK")} &nbsp; · &nbsp; K/L ${t("SKILL", "SKILL")} &nbsp; · &nbsp; SPACE ${t("HINDAR", "DODGE")} &nbsp; · &nbsp; E ${t("BICARA", "TALK")}</div><div id="edit-banner"></div>`;
  const g = $("#portrait").getContext("2d");
  g.fillStyle = "#4b5b42";
  g.fillRect(0, 0, 40, 48);
  drawCharacter(g, { x: 20, y: 44, fy: 1 }, 0, player.look);
  $("#pause").onclick = pauseModal;
  $("#map-button").onclick = mapModal;
  $("#quest-fold").onclick = () => {
    const p = $("#quest-panel");
    p.classList.toggle("collapsed");
    $("#quest-fold").textContent = p.classList.contains("collapsed")
      ? "›"
      : "‹";
  };
  let questStart = 0;
  $("#quest-panel").addEventListener(
    "pointerdown",
    (e) => (questStart = e.clientX),
  );
  $("#quest-panel").addEventListener("pointerup", (e) => {
    if (e.clientX - questStart < -35) {
      $("#quest-panel").classList.add("collapsed");
      $("#quest-fold").textContent = "›";
    }
  });
  for (const id of Object.keys(controlInfo)) {
    const b = $("#" + id);
    b.addEventListener("pointerdown", (e) => controlPointer(e, id));
  }
  setupJoystick();
  applyLayout();
  updateHUD();
}
function applyLayout() {
  for (const [id, [, , def, size]] of Object.entries(controlInfo)) {
    const el = $("#" + id);
    if (!el) continue;
    const p = hudLayout[id] || def;
    const actualSize = size * clamp(p.scale || 1, 0.7, 1.4);
    el.style.left = `clamp(4px, calc(${clamp(p.x, 4, 97)}% - ${actualSize / 2}px), calc(100% - ${actualSize + 4}px))`;
    el.style.top = `clamp(4px, calc(${clamp(p.y, 5, 94)}% - ${actualSize / 2}px), calc(100% - ${actualSize + 4}px))`;
    el.style.width = actualSize + "px";
    el.style.height = actualSize + "px";
  }
  const j = $("#joystick"),
    p = hudLayout.joystick;
  if (j && p) {
    const size = 110 * clamp(p.scale || 1, 0.7, 1.4);
    j.style.left = `clamp(4px, calc(${p.x}% - ${size / 2}px), calc(100% - ${size + 4}px))`;
    j.style.top = `clamp(4px, calc(${p.y}% - ${size / 2}px), calc(100% - ${size + 4}px))`;
    j.style.bottom = "auto";
    j.style.width = j.style.height = size + "px";
    j.querySelector(".stick").style.left = j.querySelector(".stick").style.top =
      "calc(50% - 23px)";
  }
}
function controlPointer(e, id) {
  e.preventDefault();
  if (editing) {
    dragHUD(e, id);
    return;
  }
  if (modal || mode !== "game") return;
  audioStart();
  if (id === "bag") bagModal();
  else if (id === "interact") interact();
  else if (id === "potion") usePotion();
  else action(id);
}
function setupJoystick() {
  const j = $("#joystick");
  let pointer = null;
  const move = (e) => {
    if (e.pointerId !== pointer) return;
    const r = j.getBoundingClientRect(),
      x = e.clientX - r.left - r.width / 2,
      y = e.clientY - r.top - r.height / 2,
      d = Math.hypot(x, y),
      n = unit(x, y);
    joy.x = n.x * Math.min(1, d / 30);
    joy.y = n.y * Math.min(1, d / 30);
    j.querySelector(".stick").style.transform =
      `translate(${n.x * Math.min(d, 30)}px,${n.y * Math.min(d, 30)}px)`;
  };
  j.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (editing) {
      dragHUD(e, "joystick");
      return;
    }
    if (modal) return;
    pointer = e.pointerId;
    j.setPointerCapture(pointer);
    move(e);
  });
  j.addEventListener("pointermove", move);
  const end = () => {
    pointer = null;
    joy.x = joy.y = 0;
    j.querySelector(".stick").style.transform = "";
  };
  j.addEventListener("pointerup", end);
  j.addEventListener("pointercancel", end);
  j.addEventListener("lostpointercapture", end);
}
function clearInput() {
  keys.clear();
  joy.x = joy.y = 0;
  const s = $(".stick");
  if (s) s.style.transform = "";
}
function updateHUD() {
  if (mode !== "game" || !$("#hp-fill")) return;
  $("#hp-fill").style.width = player.hp + "%";
  $("#st-fill").style.width = player.stamina + "%";
  $("#hp-text").textContent = `HP ${Math.ceil(player.hp)}/100`;
  $("#st-text").textContent = `STA ${Math.ceil(player.stamina)}/100`;
  $("#quest-title").textContent = player.quest
    ? t("Oasis kembali tenang", "Peace returns to the oasis")
    : player.kills >= 3
      ? t("Kembali ke penjaga oasis", "Return to the oasis keeper")
      : t("Amankan jalur timur", "Secure the eastern trail");
  $("#quest-text").textContent = player.quest
    ? t(
        "Latihan selesai. Jelajahi dan coba skill-mu.",
        "Training complete. Explore and practice your skills.",
      )
    : player.kills >= 3
      ? t(
          "Bicara dengan Rafi, di samping bengkel.",
          "Speak to Rafi beside the forge.",
        )
      : `${t("Kalahkan kalajengking", "Defeat sand scorpions")} · ${Math.min(player.kills, 3)}/3`;
  for (const id of ["attack", "skill1", "skill2", "dodge"]) {
    const b = $("#" + id);
    b.querySelector("small").textContent =
      cds[id] > 0.1 ? cds[id].toFixed(1) + "s" : controlInfo[id][1]();
    b.style.opacity = cds[id] > 0.1 ? ".5" : "1";
  }
  const near = Math.hypot(player.x - npc.x, player.y - npc.y) < 95;
  $("#interact").style.opacity = near ? "1" : ".45";
  const m = $("#minimap");
  drawMap(m.getContext("2d"), world, player, enemies, m.width, m.height);
}
function persist() {
  const s = { ...player };
  delete s.fx;
  delete s.fy;
  delete s.moving;
  if (saveGame(storage, s)) {
    saved = s;
    return true;
  }
  toast(
    t(
      "Penyimpanan gagal. Periksa ruang atau izin penyimpanan.",
      "Save failed. Check available storage or browser permissions.",
    ),
  );
  return false;
}
function pauseModal() {
  if (editing) return;
  openModal(
    title(
      t("PERMAINAN DIJEDA", "GAME PAUSED"),
      t("Ambil napas sejenak.", "Take a moment."),
      t(
        "Dunia menunggu. Progres tersimpan otomatis.",
        "The world can wait. Progress saves automatically.",
      ),
    ) +
      `<button class="primary" id="resume">▷ ${t("LANJUT BERMAIN", "RESUME")}</button><div class="row" style="margin-top:12px"><button class="secondary" id="open-settings">${t("Pengaturan", "Settings")}</button><button class="secondary" id="open-profile">${t("Profil", "Profile")}</button></div><div class="row" style="margin-top:12px"><button class="secondary" id="open-shop">Shop</button><button class="secondary" id="to-menu">${t("Menu utama", "Main menu")}</button></div>`,
  );
  $("#resume").onclick = closeModal;
  $("#open-settings").onclick = settingsModal;
  $("#open-profile").onclick = profileModal;
  $("#open-shop").onclick = shopModal;
  $("#to-menu").onclick = () => {
    if (!persist()) return;
    closeModal();
    renderMenu();
  };
}
function settingsModal() {
  openModal(
    title("PREFERENCES", t("Atur perjalananmu.", "Make it your own.")) +
      `<div class="settings-row"><label for="language">${t("Bahasa", "Language")}</label><select id="language"><option value="id" ${settings.lang === "id" ? "selected" : ""}>Indonesia</option><option value="en" ${settings.lang === "en" ? "selected" : ""}>English</option></select></div><div class="settings-row"><label for="fps">${t("Batas frame rate", "Frame rate limit")}</label><select id="fps"><option value="30" ${settings.fps === 30 ? "selected" : ""}>30 FPS</option><option value="60" ${settings.fps === 60 ? "selected" : ""}>60 FPS</option></select></div><div class="settings-row"><label for="audio">${t("Efek suara", "Sound effects")}</label><input type="checkbox" id="audio" ${settings.sound ? "checked" : ""}></div><div class="settings-row"><label for="music">${t("Musik chiptune", "Chiptune music")}</label><input type="checkbox" id="music" ${settings.music ? "checked" : ""}></div><div class="settings-row"><label for="volume">${t("Volume", "Volume")}</label><input type="range" id="volume" min="0" max="1" step=".05" value="${settings.volume}"></div><div class="row" style="margin-top:20px"><button class="secondary" id="custom-hud" ${mode !== "game" ? "disabled" : ""}>${t("Atur HUD", "Customize HUD")}</button><button class="secondary" id="help">${t("Petunjuk kontrol", "Control guide")}</button></div><p class="small-note">${t("HUD diatur ketika bermain. 60 FPS bergantung pada kemampuan perangkat.", "Customize the HUD while playing. 60 FPS depends on device performance.")}</p>${saved ? `<button class="secondary" id="reset-world" style="width:100%">${t("Mulai petualangan baru…", "Start a new adventure…")}</button>` : ""}`,
  );
  $("#language").onchange = (e) => {
    settings.lang = e.target.value;
    document.documentElement.lang = settings.lang;
    persistSettings();
    if (mode === "menu") renderMenu();
    else buildHUD();
    settingsModal();
  };
  $("#fps").onchange = (e) => {
    settings.fps = Number(e.target.value);
    persistSettings();
  };
  $("#audio").onchange = (e) => {
    settings.sound = e.target.checked;
    persistSettings();
    audioStart();
  };
  $("#music").onchange = (e) => {
    settings.music = e.target.checked;
    persistSettings();
    audioStart();
  };
  $("#volume").oninput = (e) => {
    settings.volume = Number(e.target.value);
    persistSettings();
  };
  $("#custom-hud").onclick = editHUD;
  $("#help").onclick = () => tutorial(0);
  if ($("#reset-world")) $("#reset-world").onclick = confirmReset;
}
function confirmReset() {
  openModal(
    title(
      t("SATU SLOT PETUALANGAN", "ONE ADVENTURE SLOT"),
      t("Ganti petualangan lama?", "Replace your adventure?"),
      t(
        "Karakter, barang, dan progres sebelumnya akan diganti ketika kamu membuat karakter baru. Ini tidak dapat dibatalkan.",
        "Your old character, items and progress will be replaced when you create a new character. This cannot be undone.",
      ),
    ) +
      `<button class="primary" id="confirm-reset">${t("LANJUT KE KARAKTER BARU", "CREATE A NEW CHARACTER")}</button>`,
  );
  $("#confirm-reset").onclick = characterModal;
}
function profileModal() {
  const p = mode === "game" ? player : saved;
  if (!p) {
    openModal(
      title(
        "PROFILE",
        t("Kisahmu belum dimulai.", "Your story awaits."),
        t(
          "Mulai petualangan untuk membuat karakter dan mengisi catatan penemuan.",
          "Start your adventure to create a character and record your discoveries.",
        ),
      ),
    );
    return;
  }
  openModal(
    title(
      t("CATATAN PENGEMBARA", "WANDERER’S JOURNAL"),
      escape(p.name),
      t("Petarung · Level 1 · Oasis Nara", "Fighter · Level 1 · Nara Oasis"),
    ) +
      `<div class="stats"><div class="stat"><b>${p.kills}</b><span>${t("Kalajengking dikalahkan", "Scorpions defeated")}</span></div><div class="stat"><b>${Math.floor(p.time / 60)}m</b><span>${t("Waktu bermain", "Time played")}</span></div><div class="stat"><b>${p.coins}</b><span>${t("Koin", "Coins")}</span></div><div class="stat"><b>${p.durability}%</b><span>${t("Ketahanan equipment", "Equipment condition")}</span></div></div><div class="section-rule"></div><label>${t("KOLEKSI PENEMUAN", "DISCOVERY COLLECTION")}</label><p>◇ ${t("Oasis Nara — tempat singgah pertama", "Nara Oasis — your first refuge")}<br>${p.kills > 0 ? "◇ " + t("Kalajengking pasir — penghuni jalur timur", "Sand scorpion — dweller of the eastern trail") : t("Catatan makhluk belum ditemukan.", "No creatures recorded yet.")}<br>${p.quest ? "✦ " + t("Penjaga Oasis — latihan selesai", "Oasis Protector — training complete") : ""}</p><p class="small-note">${t("Level dan koleksi lanjutan belum tersedia dalam prototipe combat.", "Level progression and extended collections are not included in this combat prototype.")}</p>`,
  );
}
function isSafe() {
  return player.x > 420 && player.x < 920 && player.y > 500 && player.y < 880;
}
function shopModal() {
  const p = mode === "game" ? player : saved;
  openModal(
    title(
      t("PERSEDIAAN OASIS", "OASIS SUPPLIES"),
      t("Bekal untuk perjalanan.", "A little preparation."),
      `${t("Koin", "Coins")}: ${p?.coins || 0} · ${t("Pembelian bekal hanya di area aman.", "Supplies can only be purchased in a safe area.")}`,
    ) +
      `<div class="item"><span class="item-icon">✚</span><div><strong>${t("Potion pemulihan", "Healing potion")}</strong><p>+45 HP · ${t("Isi tas", "In bag")}: ${p?.potions || 0}/9</p></div><button class="secondary" id="buy-potion" ${!p ? "disabled" : ""}>15 ◈</button></div><p class="small-note">${t("Prototipe: satu jenis bekal. Kosmetik dan ekonomi lengkap menyusul.", "Prototype: one supply item. Cosmetics and the full economy are planned.")}</p>`,
  );
  $("#buy-potion").onclick = () => {
    if (!p) return;
    if (!isSafe()) {
      toast(
        t(
          "Kembali ke permukiman untuk membeli bekal.",
          "Return to the settlement to buy supplies.",
        ),
      );
      return;
    }
    if (player.coins < 15) {
      toast(t("Koin belum cukup.", "Not enough coins."));
      return;
    }
    if (player.potions >= 9) {
      toast(t("Slot potion penuh (9).", "Potion stack is full (9)."));
      return;
    }
    player.coins -= 15;
    player.potions++;
    persist();
    sound("coin");
    shopModal();
  };
}
function bagModal() {
  openModal(
    title(
      t("PERLENGKAPAN", "EQUIPMENT"),
      t("Tas pengembara", "Wanderer’s bag"),
      `${t("Perlengkapan latihan", "Training equipment")} · ${2 + (player.potions > 0 ? 1 : 0)} / 8 ${t("slot terpakai", "slots used")}`,
    ) +
      `<div class="item"><span class="item-icon">⚔</span><div><strong>${t("Pedang pengembara", "Wanderer’s sword")}</strong><p>${t("Damage", "Damage")} ${player.durability === 0 ? 12 : 24} · ${t("Ketahanan", "Condition")} ${player.durability}%</p></div></div><div class="item"><span class="item-icon">◇</span><div><strong>${t("Armor kain", "Cloth armor")}</strong><p>${t("Equipment awal petarung", "Starting fighter equipment")}</p></div></div><div class="item"><span class="item-icon">✚</span><div><strong>${t("Potion pemulihan", "Healing potion")} × ${player.potions}</strong><p>+45 HP</p></div><button class="secondary" id="bag-heal">${t("Gunakan", "Use")}</button></div><p class="small-note">${t("HP", "HP")}: ${Math.ceil(player.hp)}/100 · ${t("Koin", "Coins")}: ${player.coins}</p>`,
  );
  $("#bag-heal").onclick = () => {
    usePotion();
    bagModal();
  };
}
function usePotion() {
  if (player.hp >= 100) {
    toast(t("HP sudah penuh.", "HP is already full."));
    return;
  }
  if (player.potions < 1) {
    toast(
      t(
        "Potion habis. Beli di oasis.",
        "No potions left. Visit the oasis shop.",
      ),
    );
    return;
  }
  player.potions--;
  player.hp = Math.min(100, player.hp + 45);
  sound("heal");
  persist();
  toast("+45 HP");
  updateHUD();
}
function interact() {
  if (Math.hypot(player.x - npc.x, player.y - npc.y) > 95) {
    toast(
      t(
        "Dekati Rafi di samping bengkel sebelah barat.",
        "Find Rafi beside the western forge.",
      ),
    );
    return;
  }
  const repair = Math.ceil((100 - player.durability) / 3);
  openModal(
    title(
      t("RAFI · PENJAGA OASIS", "RAFI · OASIS KEEPER"),
      t("Selamat datang, pengembara.", "Welcome, wanderer."),
      player.kills >= 3 && !player.quest
        ? t(
            "Jalur timur lebih aman berkatmu. Terimalah bekal ini.",
            "The eastern trail is safer thanks to you. Take these supplies.",
          )
        : t(
            "Kalajengking berkeliaran di tenggara. Jaga arah pedangmu, dan jangan lupa menghindar.",
            "Scorpions roam to the southeast. Mind your sword’s direction, and remember to dodge.",
          ),
    ) +
      `<p>${t("Koin", "Coins")}: ${player.coins} · ${t("Ketahanan", "Condition")}: ${player.durability}%</p><div class="row"><button class="secondary" id="repair">${t("Perbaiki", "Repair")} · ${repair} ◈</button><button class="secondary" id="rest">${t("Istirahat", "Rest")} · 5 ◈</button></div>${player.kills >= 3 && !player.quest ? `<button class="primary" id="claim">${t("TERIMA HADIAH", "CLAIM REWARD")} · 40 ◈ + 2 ✚</button>` : ""}`,
  );
  $("#repair").onclick = () => {
    if (!repair) {
      toast(t("Equipment masih bagus.", "Equipment is in good condition."));
      return;
    }
    if (player.coins < repair) {
      toast(t("Koin belum cukup.", "Not enough coins."));
      return;
    }
    player.coins -= repair;
    player.durability = 100;
    persist();
    sound("coin");
    interact();
  };
  $("#rest").onclick = () => {
    if (player.hp === 100 && player.stamina === 100) {
      toast(t("Kondisimu sudah pulih.", "You are already rested."));
      return;
    }
    if (player.coins < 5) {
      toast(t("Perlu 5 koin untuk menginap.", "You need 5 coins to rest."));
      return;
    }
    player.coins -= 5;
    player.hp = 100;
    player.stamina = 100;
    persist();
    sound("heal");
    interact();
  };
  if ($("#claim"))
    $("#claim").onclick = () => {
      player.quest = true;
      player.coins += 40;
      player.potions = Math.min(9, player.potions + 2);
      persist();
      sound("coin");
      interact();
    };
}
function mapModal() {
  openModal(
    title(
      t("PETA WILAYAH", "REGION MAP"),
      t("Oasis Nara", "Nara Oasis"),
      t(
        "■ Kamu · ◆ Rafi (barat) · ■ Kalajengking (timur/tenggara)",
        "■ You · ◆ Rafi (west) · ■ Scorpions (east/southeast)",
      ),
    ) +
      `<canvas id="map-large" class="map-large" width="768" height="563"></canvas><p class="small-note">${t("Area latihan prototipe. Bukan peta dunia final.", "Prototype training area. Not the final world map.")}</p>`,
    true,
  );
  const m = $("#map-large");
  drawMap(m.getContext("2d"), world, player, enemies, m.width, m.height);
}
function aboutModal() {
  openModal(
    title(
      "DESERT PIXEL RPG",
      t("Sebuah awal di pasir.", "A beginning in the sands."),
      t(
        "Prototipe 0.1 · Tes gerak dan combat. Nama wilayah dan tampilan logo sementara.",
        "Prototype 0.1 · Movement and combat test. Region names and logo treatment are provisional.",
      ),
    ) +
      `<p>${t("Tersedia: petarung, kalajengking, dua skill, dodge, potion, quest latihan, perbaikan NPC, HUD kustom, dan autosave lokal.", "Available: fighter, scorpions, two skills, dodge, potions, training quest, NPC repairs, customizable HUD and local autosave.")}</p><p>${t("Direncanakan: dunia luas, pemanah, penyihir, cerita bercabang ringan, crafting, rumah, tunggangan, festival, dan kosmetik. Belum diimplementasikan.", "Planned: a larger world, archer, mage, light story branches, crafting, housing, mounts, festivals and cosmetics. Not implemented yet.")}</p><p class="small-note">${t("Save disimpan pada perangkat ini. Menghapus data aplikasi/browser bisa menghapus progres beserta cadangannya.", "Saves live on this device. Clearing app/browser data may erase progress and its backup.")}</p>`,
  );
}
function tutorial(step) {
  const steps = [
    [
      t("Kenali layar petualangan.", "Know your adventure screen."),
      t(
        "Kiri atas: HP merah dan stamina hijau. Kanan atas: minimap. Panel quest di kiri bisa digeser ke pinggir atau diciutkan dengan tombol panah.",
        "Top left: red HP and green stamina. Top right: minimap. Swipe the quest panel left or use its arrow to collapse it.",
      ),
    ],
    [
      t("Bergerak, serang, menghindar.", "Move, strike, dodge."),
      t(
        "Gunakan joystick kiri untuk bergerak. Pedang menyerang sesuai arah hadap. Tebas memberi serangan area, Tangkis mengurangi damage sesaat. Hindar memakai stamina. Di komputer: WASD, J, K, L, dan Space.",
        "Move with the left joystick. Your sword strikes in your facing direction. Cleave deals area damage; Guard briefly reduces incoming damage. Dodge costs stamina. Keyboard: WASD, J, K, L and Space.",
      ),
    ],
    [
      t("Siapkan langkah pertamamu.", "Take your first steps."),
      t(
        "Kalahkan 3 kalajengking di tenggara, lalu bicara dengan Rafi di bengkel barat. Potion memulihkan HP. Equipment rusak saat kalah; Rafi bisa memperbaikinya. Menu menjeda dunia dan progres tersimpan otomatis.",
        "Defeat 3 scorpions to the southeast, then speak with Rafi at the western forge. Potions restore HP. Defeat damages equipment; Rafi can repair it. Menus pause the world and progress saves automatically.",
      ),
    ],
  ];
  openModal(
    `<span class="step-number">${t("PANDUAN", "GUIDE")} 0${step + 1} / 03</span>` +
      title("", steps[step][0], steps[step][1]) +
      `<button class="primary" id="tutorial-next">${step === 2 ? t("SIAP BERPETUALANG", "READY TO EXPLORE") : t("BERIKUTNYA", "NEXT")} →</button>`,
  );
  $("#tutorial-next").onclick = () =>
    step === 2 ? closeModal() : tutorial(step + 1);
}
let selectedHUD = "attack";
function editHUD() {
  closeModal();
  editing = true;
  clearInput();
  $("#hud").classList.add("edit-mode");
  $("#edit-banner").innerHTML =
    `<div class="hud-edit-banner"><span class="eyebrow">CUSTOM HUD</span><p>${t("Geser kontrol. Ketuk kontrol untuk memilih ukuran. Dunia dijeda.", "Drag controls. Select a control to resize it. World paused.")}</p><label for="hud-size">${t("Ukuran", "Size")}</label><input id="hud-size" type="range" min=".7" max="1.4" step=".1" value="1"><div><button id="hud-reset" class="secondary">Reset</button><button id="hud-done" class="secondary">${t("Selesai", "Done")}</button></div></div>`;
  $("#hud-size").oninput = (e) => {
    if (!hudLayout[selectedHUD])
      hudLayout[selectedHUD] = {
        ...(selectedHUD === "joystick"
          ? { x: 12, y: 80 }
          : controlInfo[selectedHUD][2]),
      };
    hudLayout[selectedHUD].scale = Number(e.target.value);
    applyLayout();
  };
  $("#hud-reset").onclick = () => {
    hudLayout = {};
    buildHUD();
    editHUD();
  };
  $("#hud-done").onclick = () => {
    editing = false;
    $("#hud").classList.remove("edit-mode");
    $("#edit-banner").innerHTML = "";
    try {
      storage.setItem("desert-hud", JSON.stringify(hudLayout));
    } catch {
      toast(t("HUD tidak bisa disimpan.", "HUD could not be saved."));
    }
  };
}
function dragHUD(e, id) {
  selectedHUD = id;
  const el = e.currentTarget;
  el.setPointerCapture(e.pointerId);
  $("#hud-size").value = hudLayout[id]?.scale || 1;
  const move = (ev) => {
    hudLayout[id] = {
      x: clamp((ev.clientX / innerWidth) * 100, 5, 95),
      y: clamp((ev.clientY / innerHeight) * 100, 7, 93),
      scale: hudLayout[id]?.scale || 1,
    };
    applyLayout();
  };
  const end = () => {
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerup", end);
    el.removeEventListener("pointercancel", end);
  };
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
}
function action(id) {
  if (mode !== "game" || modal || editing || hiddenPause || cds[id] > 0) return;
  const cost = { attack: 5, skill1: 25, skill2: 18, dodge: 20 }[id];
  if (player.stamina < cost) {
    toast(t("Stamina belum cukup.", "Not enough stamina."));
    return;
  }
  player.stamina -= cost;
  cds[id] = { attack: 0.4, skill1: 4, skill2: 7, dodge: 0.8 }[id];
  if (id === "dodge") {
    dodgeTime = 0.2;
    guard = Math.max(guard, 0.24);
    sound("dodge");
    return;
  }
  if (id === "skill2") {
    guard = 2.5;
    effects.push({ x: player.x, y: player.y, type: "guard", life: 0.4 });
    sound("guard");
    return;
  }
  attackAnim = 0.22;
  const cleave = id === "skill1";
  sound(cleave ? "cleave" : "hit");
  for (const e of enemies) {
    if (e.hp <= 0) continue;
    if (inArc(player, e, cleave ? 112 : 72, cleave ? -0.35 : 0.1)) {
      const damage = (player.durability === 0 ? 12 : 24) * (cleave ? 1.8 : 1);
      e.hp -= damage;
      e.flash = 0.15;
      effects.push({
        x: e.x,
        y: e.y - 30,
        text: Math.round(damage),
        type: "damage",
        life: 0.65,
      });
      shake = 0.12;
      const n = unit(e.x - player.x, e.y - player.y);
      if (canWalk(e.x + n.x * 13, e.y + n.y * 13)) {
        e.x += n.x * 13;
        e.y += n.y * 13;
      }
      if (e.hp <= 0) {
        player.kills++;
        player.coins += 8;
        e.dead = 35;
        effects.push({ x: e.x, y: e.y, text: "+8 ◈", type: "coin", life: 1 });
        sound("coin");
        persist();
      }
    }
  }
  updateHUD();
}
function moveEntity(e, dx, dy) {
  if (canWalk(e.x + dx, e.y)) e.x += dx;
  if (canWalk(e.x, e.y + dy)) e.y += dy;
}
function update(dt) {
  clock += dt;
  effects.forEach((e) => (e.life -= dt));
  effects = effects.filter((e) => e.life > 0);
  if (mode !== "game" || modal || editing || hiddenPause) {
    player.moving = false;
    return;
  }
  player.time += dt;
  for (const key in cds) cds[key] = Math.max(0, cds[key] - dt);
  guard = Math.max(0, guard - dt);
  attackAnim = Math.max(0, attackAnim - dt);
  shake = Math.max(0, shake - dt);
  player.stamina = Math.min(100, player.stamina + dt * 13);
  const ax =
      joy.x +
      (keys.has("d") || keys.has("arrowright") ? 1 : 0) -
      (keys.has("a") || keys.has("arrowleft") ? 1 : 0),
    ay =
      joy.y +
      (keys.has("s") || keys.has("arrowdown") ? 1 : 0) -
      (keys.has("w") || keys.has("arrowup") ? 1 : 0),
    n = unit(ax, ay);
  player.moving = Math.hypot(ax, ay) > 0.08;
  if (dodgeTime > 0) {
    dodgeTime -= dt;
    moveEntity(player, player.fx * 440 * dt, player.fy * 440 * dt);
  } else if (player.moving) {
    player.fx = n.x;
    player.fy = n.y;
    moveEntity(player, n.x * 146 * dt, n.y * 146 * dt);
  }
  if (keys.has("j")) action("attack");
  for (const e of enemies) {
    if (e.hp <= 0) {
      e.dead -= dt;
      if (e.dead <= 0 && Math.hypot(player.x - e.sx, player.y - e.sy) > 260) {
        e.hp = e.max;
        e.x = e.sx;
        e.y = e.sy;
      }
      continue;
    }
    e.flash = Math.max(0, e.flash - dt);
    e.hit = Math.max(0, e.hit - dt);
    const d = Math.hypot(e.x - player.x, e.y - player.y);
    if (d < 260 && !isSafe()) {
      const a = unit(player.x - e.x, player.y - e.y);
      if (d > 30) moveEntity(e, a.x * 67 * dt, a.y * 67 * dt);
      if (d < 39 && e.hit <= 0 && dodgeTime <= 0) {
        const damage = guard > 0 ? 3 : 11;
        player.hp = Math.max(0, player.hp - damage);
        e.hit = 1.15;
        effects.push({
          x: player.x,
          y: player.y - 40,
          text: "−" + damage,
          type: "hurt",
          life: 0.7,
        });
        shake = 0.12;
        sound("hurt");
      }
    } else {
      const dest = {
          x: e.sx + Math.sin(clock * 0.35 + e.id) * 35,
          y: e.sy + Math.cos(clock * 0.4 + e.id) * 27,
        },
        a = unit(dest.x - e.x, dest.y - e.y);
      if (Math.hypot(dest.x - e.x, dest.y - e.y) > 5)
        moveEntity(e, a.x * 22 * dt, a.y * 22 * dt);
    }
  }
  if (player.hp <= 0) {
    player = { ...penalty(player), fx: 0, fy: 1 };
    for (const e of enemies) {
      e.x = e.sx;
      e.y = e.sy;
    }
    camera = { x: player.x, y: player.y };
    persist();
    openModal(
      title(
        t("KEMBALI KE OASIS", "BACK AT THE OASIS"),
        t("Masih ada langkah berikutnya.", "There is another tomorrow."),
        t(
          "Rafi membawamu ke tempat aman. Barang dan koin tetap utuh; equipment kehilangan 15% ketahanan. Perbaiki di bengkel.",
          "Rafi brought you to safety. Your items and coins are intact; equipment lost 15% condition. Visit the forge for repairs.",
        ),
      ) +
        `<button class="primary" id="retry">${t("COBA LAGI", "TRY AGAIN")} →</button>`,
    );
    $("#retry").onclick = closeModal;
  }
  saveTimer += dt;
  if (saveTimer > 5) {
    saveTimer = 0;
    persist();
  }
  hudTimer += dt;
  if (hudTimer > 0.1) {
    hudTimer = 0;
    updateHUD();
  }
}
function render() {
  const cw = canvas.width,
    ch = canvas.height;
  ctx.clearRect(0, 0, cw, ch);
  let zoom =
    mode === "menu"
      ? Math.max(innerWidth / 1500, innerHeight / 960)
      : innerHeight < 600
        ? 1.3
        : 1.65;
  if (mode === "menu") {
    camera.x = 950 + Math.sin(clock * 0.055) * 18;
    camera.y = 690;
  } else {
    camera.x += (player.x - camera.x) * 0.12;
    camera.y += (player.y - camera.y) * 0.12;
  }
  const vw = innerWidth / zoom,
    vh = innerHeight / zoom,
    cx = clamp(camera.x, vw / 2, W - vw / 2),
    cy = clamp(camera.y, vh / 2, H - vh / 2);
  ctx.save();
  ctx.scale(zoom / 2, zoom / 2);
  ctx.translate(
    Math.round(vw / 2 - cx) + (shake > 0 ? Math.sin(clock * 90) * 3 : 0),
    Math.round(vh / 2 - cy),
  );
  ctx.drawImage(world, 0, 0);
  // shimmering water, birds and drifting dust
  ctx.fillStyle = "#c3e3ba66";
  for (let i = 0; i < 7; i++) {
    const x = 955 + i * 22 + Math.sin(clock + i) * 4,
      y = 636 + (i % 3) * 16;
    ctx.fillRect(x, y, 8 + Math.sin(clock * 2 + i) * 5, 2);
  }
  const actors = [
    ...enemies
      .filter((e) => e.hp > 0)
      .map((e) => ({ y: e.y, draw: () => drawEnemy(ctx, e, clock) })),
    {
      y: npc.y,
      draw: () => {
        drawCharacter(ctx, npc, clock, { skin: 1, hair: 2, outfit: 2 });
        ctx.fillStyle = "#eacc85";
        ctx.font = "bold 15px monospace";
        ctx.textAlign = "center";
        ctx.fillText(
          player.kills >= 3 && !player.quest ? "!" : "◇",
          npc.x,
          npc.y - 51,
        );
        if (
          mode === "game" &&
          Math.hypot(player.x - npc.x, player.y - npc.y) < 110
        ) {
          ctx.fillStyle = "#233b2e";
          ctx.fillRect(npc.x - 40, npc.y + 12, 80, 20);
          ctx.fillStyle = "#f0dba6";
          ctx.font = "10px monospace";
          ctx.fillText("RAFI [E]", npc.x, npc.y + 26);
        }
      },
    },
    {
      y: player.y,
      draw: () => {
        drawCharacter(ctx, player, clock, player.look);
        if (guard > 0) {
          ctx.strokeStyle = "#b8dfd0";
          ctx.lineWidth = 3;
          ctx.strokeRect(player.x - 18, player.y - 43, 36, 48);
        }
        if (attackAnim > 0) {
          ctx.strokeStyle = "#fff0b9";
          ctx.lineWidth = 5;
          ctx.beginPath();
          const a = Math.atan2(player.fy, player.fx),
            s = 1 - attackAnim / 0.22;
          ctx.arc(player.x, player.y - 12, 45, a - 1 + s * 0.3, a + 0.4 + s);
          ctx.stroke();
          ctx.strokeStyle = "#d6b765aa";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(player.x, player.y - 12, 54, a - 0.8 + s * 0.3, a + 0.2 + s);
          ctx.stroke();
        }
      },
    },
  ];
  actors.sort((a, b) => a.y - b.y).forEach((a) => a.draw());
  if (mode === "game" && !player.quest) {
    let target = player.kills >= 3 ? npc : enemies.find((e) => e.hp > 0);
    if (target) {
      ctx.save();
      ctx.translate(target.x, target.y - 52 + Math.sin(clock * 3) * 3);
      ctx.fillStyle = "#fce1a0";
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(5, 0);
      ctx.lineTo(0, 6);
      ctx.lineTo(-5, 0);
      ctx.fill();
      ctx.restore();
    }
  }
  for (const e of effects) {
    ctx.globalAlpha = Math.min(1, e.life * 2);
    ctx.font = "bold 15px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle =
      e.type === "hurt" ? "#efae8d" : e.type === "coin" ? "#ffdc7e" : "#fff1cb";
    if (e.text !== undefined)
      ctx.fillText(e.text, e.x, e.y - (1 - e.life) * 25);
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 30; i++) {
    const x = (i * 157 + clock * 12) % W,
      y = (i * 83 + Math.sin(clock * 0.2 + i) * 10) % H;
    ctx.fillStyle = "#ffe3ae40";
    ctx.fillRect(x, y, 3, 2);
  }
  ctx.restore();
}
function frame(now) {
  const dt = Math.min((now - last) / 1000 || 0, 0.05);
  last = now;
  acc += dt;
  const limit = 1 / settings.fps;
  if (acc >= limit - 0.001) {
    const step = Math.min(acc, 0.05);
    acc = 0;
    if (!hiddenPause) {
      update(step);
      render();
    }
  }
  requestAnimationFrame(frame);
}
let audio = null,
  musicTick = 0;
function audioStart() {
  try {
    if (!audio)
      audio = new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume().catch(() => {});
  } catch {}
}
function beep(freq, duration, type = "square", volume = 0.06, delay = 0) {
  if (!audio || settings.volume <= 0) return;
  const o = audio.createOscillator(),
    g = audio.createGain(),
    start = audio.currentTime + delay;
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(volume * settings.volume, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, start + duration);
  o.connect(g);
  g.connect(audio.destination);
  o.start(start);
  o.stop(start + duration + 0.01);
}
function sound(kind) {
  if (!settings.sound || hiddenPause) return;
  const f =
    {
      hit: 170,
      cleave: 110,
      guard: 330,
      dodge: 220,
      hurt: 75,
      coin: 660,
      heal: 440,
    }[kind] || 200;
  beep(f, 0.12, "triangle", 0.18);
  if (["coin", "heal"].includes(kind)) beep(f * 1.5, 0.2, "square", 0.06, 0.09);
}
setInterval(() => {
  if (settings.music && !hiddenPause && audio?.state === "running") {
    const melody = [
      220, 0, 330, 294, 0, 261.63, 196, 0, 220, 329.63, 392, 0, 329.63, 261.63,
      246.94, 0,
    ];
    const note = melody[musicTick++ % melody.length];
    if (note) beep(note, 0.4, "triangle", 0.055);
  }
}, 420);
window.addEventListener("keydown", (e) => {
  if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName))
    return;
  const k = e.key.toLowerCase();
  if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k))
    e.preventDefault();
  if (k === "escape") {
    if (editing) $("#hud-done")?.click();
    else if (modal) closeModal();
    else if (mode === "game") pauseModal();
    return;
  }
  if (mode !== "game" || modal || editing) return;
  keys.add(k);
  if (e.repeat) return;
  audioStart();
  if (k === "k") action("skill1");
  if (k === "l") action("skill2");
  if (k === " ") action("dodge");
  if (k === "e") interact();
  if (k === "i") bagModal();
  if (k === "m") mapModal();
  if (k === "q") usePotion();
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener("blur", () => {
  clearInput();
  if (mode === "game") {
    persist();
    hiddenPause = true;
  }
});
window.addEventListener("focus", () => {
  hiddenPause = document.hidden;
  last = performance.now();
});
document.addEventListener("visibilitychange", () => {
  clearInput();
  hiddenPause = document.hidden;
  if (hiddenPause && mode === "game") persist();
  last = performance.now();
});
window.addEventListener("pagehide", () => {
  if (mode === "game") persist();
});
// Focus trap for keyboard accessibility.
document.addEventListener("keydown", (e) => {
  if (e.key !== "Tab" || !modal) return;
  const nodes = [
    ...document.querySelectorAll(
      ".modal button:not(:disabled),.modal input,.modal select",
    ),
  ];
  if (!nodes.length) return;
  const first = nodes[0],
    end = nodes.at(-1);
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    end.focus();
  } else if (!e.shiftKey && document.activeElement === end) {
    e.preventDefault();
    first.focus();
  }
});
initShell();
requestAnimationFrame(frame);
if (
  import.meta.env.PROD &&
  !Capacitor.isNativePlatform() &&
  "serviceWorker" in navigator &&
  location.protocol.startsWith("http")
)
  navigator.serviceWorker.register("/sw.js").catch(() => {});

if (Capacitor.isNativePlatform()) {
  App.addListener("appStateChange", ({ isActive }) => {
    clearInput();
    hiddenPause = !isActive;
    if (!isActive && mode === "game") persist();
    last = performance.now();
  });
  App.addListener("backButton", () => {
    if (editing) $("#hud-done")?.click();
    else if (modal) closeModal();
    else if (mode === "game") pauseModal();
    else {
      openModal(
        title(
          t("KELUAR", "EXIT"),
          t("Akhiri perjalanan hari ini?", "Call it a day?"),
          t(
            "Progres tetap tersimpan di perangkat ini.",
            "Your progress stays saved on this device.",
          ),
        ) +
          `<button class="primary" id="exit-app">${t("KELUAR GAME", "EXIT GAME")}</button>`,
      );
      $("#exit-app").onclick = () => App.exitApp();
    }
  });
}
