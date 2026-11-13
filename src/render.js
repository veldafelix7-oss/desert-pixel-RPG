export const W = 1920,
  H = 1408;
const rect = (c, x, y, w, h, col) => {
  c.fillStyle = col;
  c.fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, w, h);
};
let seed = 517;
function rnd() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
export const buildings = [
  { x: 700, y: 420, w: 160, h: 124, type: "inn" },
  { x: 480, y: 650, w: 130, h: 110, type: "forge" },
  { x: 1130, y: 470, w: 140, h: 116, type: "home" },
  { x: 1250, y: 830, w: 154, h: 114, type: "house" },
];
export const obstacles = [
  ...buildings.map((b) => ({ x: b.x, y: b.y + 24, w: b.w, h: b.h - 24 })),
  { x: 950, y: 615, w: 183, h: 94 },
];
export const palmPositions = [
  [870, 560],
  [1110, 540],
  [1170, 660],
  [1060, 770],
  [900, 790],
  [1330, 610],
  [640, 780],
  [1230, 1000],
  [670, 380],
  [1000, 400],
  [420, 900],
  [1490, 700],
];
export function canWalk(x, y) {
  return (
    x > 45 &&
    x < W - 45 &&
    y > 65 &&
    y < H - 45 &&
    !obstacles.some(
      (o) =>
        x > o.x - 10 && x < o.x + o.w + 10 && y > o.y - 6 && y < o.y + o.h + 8,
    )
  );
}
function palm(c, x, y, size = 1) {
  c.save();
  c.translate(x, y);
  c.scale(size, size);
  rect(c, -8, 5, 55, 9, "#957b4f55");
  rect(c, -3, -42, 10, 52, "#84603b");
  rect(c, 1, -42, 4, 52, "#b0864c");
  for (let i = 0; i < 5; i++)
    rect(c, -4 + (i % 2) * 2, -i * 10, 9, 3, "#735238");
  const leaves = [
    [-40, -55, 35, 9],
    [-32, -65, 29, 10],
    [-19, -73, 23, 13],
    [4, -68, 28, 10],
    [14, -60, 32, 10],
    [24, -51, 24, 10],
    [-32, -47, 22, 10],
    [-24, -39, 12, 9],
    [12, -43, 14, 10],
    [22, -36, 9, 10],
    [-5, -80, 9, 21],
  ];
  for (const [a, b, w, h] of leaves) rect(c, a, b, w, h, "#365b43");
  for (const [a, b, w, h] of leaves.slice(0, 6))
    rect(c, a, b, w - 4, 4, "#6c854c");
  rect(c, -6, -57, 18, 13, "#597343");
  rect(c, 0, -51, 5, 5, "#b9974c");
  c.restore();
}
function rock(c, x, y, s) {
  rect(c, x + 3, y + s * 0.5, s + 4, s * 0.4, "#a3815150");
  rect(c, x, y, s, s * 0.65, "#a58a59");
  rect(c, x + 4, y - 4, s - 8, s * 0.5, "#c1a574");
  rect(c, x + 5, y - 3, s - 10, 3, "#dfc38b");
  rect(c, x + s - 5, y + 1, 5, s * 0.6, "#8d754e");
}
function house(c, b) {
  const { x, y, w, h } = b;
  rect(c, x + 15, y + 22, w + 8, h, "#977b4b55");
  rect(c, x, y + 25, w, h - 25, "#b48851");
  rect(c, x + 6, y + 25, w - 12, h - 31, "#cda16a");
  rect(c, x, y + 22, w, 10, "#edcc8a");
  rect(c, x - 6, y, w + 12, 28, "#d9b77b");
  rect(c, x, y - 7, w, 28, "#e6c88f");
  rect(c, x + 8, y, w - 16, 13, "#bca16d");
  rect(c, x + 13, y + 5, w - 26, 5, "#c6ad79");
  for (let i = 0; i < w; i += 24) {
    rect(c, x + i, y - 12, 16, 12, "#edd39a");
    rect(c, x + i + 12, y - 9, 4, 10, "#b29564");
  }
  rect(c, x + w * 0.5 - 13, y + h - 42, 26, 42, "#504c36");
  rect(c, x + w * 0.5 - 10, y + h - 36, 20, 36, "#343e31");
  rect(c, x + w * 0.5 + 5, y + h - 22, 3, 3, "#d4b775");
  rect(c, x + 20, y + 48, 21, 26, "#7b7350");
  rect(c, x + 23, y + 51, 15, 20, "#314f45");
  rect(c, x + 29, y + 51, 3, 20, "#ae9765");
  rect(c, x + w - 40, y + 48, 21, 26, "#475a45");
  rect(c, x + w - 36, y + 51, 4, 20, "#8f8558");
  for (let i = 0; i < 9; i++) {
    const xx = x + 10 + ((i * 31) % (w - 20)),
      yy = y + 40 + ((i * 17) % (h - 48));
    rect(c, xx, yy, 11, 2, "#b68b54");
  }
  if (b.type === "inn") {
    rect(c, x - 8, y + h - 56, w + 16, 23, "#526c63");
    for (let i = 0; i < w + 16; i += 24)
      rect(c, x - 8 + i, y + h - 56, 12, 23, "#829c7b");
    rect(c, x - 8, y + h - 33, w + 16, 4, "#364f44");
    rect(c, x - 5, y + h - 33, 4, 39, "#665338");
    rect(c, x + w + 1, y + h - 33, 4, 39, "#665338");
  }
  if (b.type === "forge") {
    rect(c, x + w + 12, y + h - 20, 36, 15, "#504d3c");
    rect(c, x + w + 18, y + h - 28, 24, 10, "#646954");
    rect(c, x + w + 16, y + h - 30, 30, 4, "#9b9c7a");
  }
}
export function createWorld() {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  seed = 517;
  rect(g, 0, 0, W, H, "#c5a16a");
  for (let i = 0; i < 6500; i++) {
    const x = rnd() * W,
      y = rnd() * H;
    rect(
      g,
      x,
      y,
      2 + rnd() * 6,
      2,
      ["#b79460", "#d4b57b", "#d9ba80", "#c09b64"][i % 4],
    );
  } // stepped dunes
  for (let i = 0; i < 25; i++) {
    const x = rnd() * W,
      y = rnd() * H;
    for (let j = 0; j < 6; j++)
      rect(g, x + j * 8, y - j * 4, 100 - j * 12, 3, "#dfbe803d");
  }
  // ochre escarpments framing the playable oasis
  for (const [x, y, w, h] of [
    [80, 95, 470, 115],
    [1170, 100, 530, 130],
    [1620, 360, 250, 170],
    [80, 1120, 520, 100],
    [1460, 1160, 380, 120],
  ]) {
    rect(g, x + 18, y + 26, w, h, "#95734b");
    rect(g, x, y, w, h - 12, "#b18b55");
    rect(g, x + 12, y - 14, w - 34, h - 28, "#d1ac6d");
    rect(g, x + 22, y - 14, w - 54, 7, "#e7c486");
    for (let j = 0; j < w; j += 30)
      rect(g, x + j, y + h - 35, 6, 20 + (j % 21), "#8e704a");
  }
  // walked paths
  for (let y = 340; y < 1170; y += 8) {
    const bend = Math.sin(y / 160) * 45;
    rect(g, 790 + bend, y, 95, 8, "#d8b882");
    rect(g, 810 + bend, y, 55, 8, "#ddbf89");
  }
  for (let x = 540; x < 1460; x += 8) {
    const bend = Math.sin(x / 210) * 25;
    rect(g, x, 770 + bend, 8, 60, "#dbba81");
  }
  // stepped oasis shoreline
  for (const [x, y, w, h] of [
    [920, 590, 220, 140],
    [900, 615, 260, 90],
    [940, 575, 160, 165],
  ])
    rect(g, x, y, w, h, "#8e9d65");
  for (const [x, y, w, h] of [
    [934, 603, 192, 110],
    [918, 625, 230, 60],
    [950, 590, 148, 137],
  ])
    rect(g, x, y, w, h, "#709c7c");
  for (const [x, y, w, h] of [
    [945, 615, 175, 87],
    [930, 630, 205, 45],
    [963, 603, 128, 110],
  ])
    rect(g, x, y, w, h, "#468f88");
  rect(g, 960, 630, 146, 63, "#3a8281");
  for (let i = 0; i < 26; i++)
    rect(
      g,
      950 + rnd() * 155,
      615 + rnd() * 85,
      8 + rnd() * 20,
      2,
      "#86c4a895",
    );
  // low masonry walls and ruins
  for (const [x, y, len] of [
    [500, 540, 112],
    [1120, 945, 90],
    [610, 970, 100],
    [1450, 450, 150],
    [300, 400, 112],
  ]) {
    rect(g, x + 6, y + 9, len, 20, "#9e804f55");
    rect(g, x, y, len, 18, "#ad8a55");
    rect(g, x, y - 4, len, 7, "#dfc28a");
    for (let j = 0; j < len; j += 22) {
      rect(g, x + j, y, 2, 17, "#957a4f");
      rect(g, x + j, y - 12, 14, 10, "#d4b57b");
    }
  }
  for (let i = 0; i < 110; i++) {
    const x = rnd() * W,
      y = rnd() * H;
    if (x > 430 && x < 1430 && y > 360 && y < 1060) continue;
    rock(g, x, y, 10 + rnd() * 23);
  }
  // desert scrub
  for (let i = 0; i < 120; i++) {
    const x = rnd() * W,
      y = rnd() * H;
    if (x > 700 && x < 1160 && y > 530 && y < 830) continue;
    rect(g, x, y, 3, 10, "#858751");
    rect(g, x - 4, y + 3, 3, 5, "#96915a");
    rect(g, x + 4, y + 1, 3, 8, "#767b4b");
  }
  // rugs and market details
  rect(g, 720, 630, 62, 40, "#a1674a");
  rect(g, 724, 634, 54, 32, "#bc9061");
  rect(g, 728, 638, 46, 24, "#7f7760");
  for (let i = 0; i < 4; i++) rect(g, 733 + i * 11, 642, 5, 16, "#d5b880");
  for (const [x, y] of [
    [676, 710],
    [870, 502],
    [1190, 820],
    [1430, 934],
  ]) {
    rect(g, x + 3, y + 4, 16, 16, "#826444");
    rect(g, x, y, 16, 17, "#9c6f46");
    rect(g, x + 3, y - 3, 10, 4, "#bd8e58");
    rect(g, x + 5, y - 2, 6, 2, "#594e35");
  }
  buildings.forEach((b) => house(g, b));
  palmPositions.forEach(([x, y]) => palm(g, x, y, 1.25));
  // road markers
  for (const [x, y] of [
    [850, 900],
    [1450, 780],
  ]) {
    rect(g, x, y, 5, 31, "#795f3c");
    rect(g, x - 18, y - 4, 41, 13, "#987644");
    rect(g, x - 14, y, 29, 3, "#dbba79");
  }
  return c;
}
export function drawCharacter(g, p, t = 0, look = {}) {
  g.save();
  g.translate(Math.round(p.x / 2) * 2, Math.round(p.y / 2) * 2);
  const moving = p.moving;
  const step = moving ? Math.sin(t * 15) * 3 : 0;
  const skin = ["#ce9a67", "#9d6b46", "#e6ba88"][look.skin || 0],
    hair = ["#4a3b30", "#b9884b", "#c8c1a2"][look.hair || 0],
    cloth = ["#467372", "#8c584c", "#697443"][look.outfit || 0];
  rect(g, -13, 0, 28, 7, "#695f424d");
  rect(g, -8, -5 + step, 6, 9, "#494837");
  rect(g, 3, -5 - step, 6, 9, "#494837");
  rect(g, -10, -22, 21, 18, cloth);
  rect(g, -10, -7, 21, 3, "#b6a174");
  rect(g, -4, -22, 5, 15, "#9db1a0");
  rect(g, -12, -20, 4, 12, skin);
  rect(g, 10, -20, 4, 12, skin);
  rect(g, -8, -37, 17, 16, skin);
  rect(g, -9, -39, 19, 7, hair);
  rect(g, -9, -34, 4, 10, hair);
  if (p.fy >= 0) {
    rect(g, -2, -30, 3, 3, "#343b30");
    rect(g, 6, -30, 3, 3, "#343b30");
  } else rect(g, -7, -35, 15, 10, hair);
  rect(g, 13, -21, 4, 23, "#babeb0");
  rect(g, 10, -3, 10, 3, "#cbb475");
  rect(g, 14, 0, 3, 5, "#76563a");
  g.restore();
}
export function drawEnemy(g, e, t) {
  const x = Math.round(e.x / 2) * 2,
    y = Math.round(e.y / 2) * 2;
  const s = Math.sin(t * 7 + e.id) * 2;
  rect(g, x - 15, y + 4, 32, 6, "#78604444");
  for (let i = 0; i < 3; i++) {
    rect(g, x - 22, y - 6 + i * 5 + s, 10, 3, "#75563a");
    rect(g, x + 12, y - 6 + i * 5 - s, 10, 3, "#75563a");
  }
  rect(g, x - 12, y - 11, 25, 18, e.flash > 0 ? "#f4d99b" : "#75543b");
  rect(g, x - 8, y - 15, 17, 15, e.flash > 0 ? "#fff0ba" : "#b07745");
  rect(g, x - 4, y - 13, 9, 8, "#c28d50");
  rect(g, x - 8, y + 1, 4, 4, "#e3bc67");
  rect(g, x + 5, y + 1, 4, 4, "#e3bc67");
  rect(g, x - 2, y - 23, 6, 11, "#87603d");
  rect(g, x + 2, y - 27, 9, 6, "#76513b");
  rect(g, x + 8, y - 25, 5, 8, "#b27c45");
  if (e.hp < e.max) {
    rect(g, x - 17, y - 37, 34, 4, "#594b36");
    rect(g, x - 17, y - 37, 34 * Math.max(0, e.hp / e.max), 4, "#c76848");
  }
}
export function drawMap(g, world, p, enemies, width, height) {
  g.clearRect(0, 0, width, height);
  g.drawImage(world, 0, 0, width, height);
  const sx = width / W,
    sy = height / H;
  g.fillStyle = "#f2e8c2";
  g.fillRect(p.x * sx - 2, p.y * sy - 2, 4, 4);
  g.strokeStyle = "#233d33";
  g.strokeRect(p.x * sx - 3, p.y * sy - 3, 6, 6);
  g.fillStyle = "#b84f37";
  enemies
    .filter((e) => e.hp > 0)
    .forEach((e) => g.fillRect(e.x * sx - 1, e.y * sy - 1, 3, 3));
  g.fillStyle = "#fae393";
  g.fillRect(610 * sx - 2, 775 * sy - 2, 4, 4);
}
