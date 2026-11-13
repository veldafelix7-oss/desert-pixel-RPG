export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export function unit(x, y) {
  const d = Math.hypot(x, y);
  return d > 0 ? { x: x / d, y: y / d } : { x: 0, y: 0 };
}
export function inArc(p, e, reach, dot = 0.15) {
  const dx = e.x - p.x,
    dy = e.y - p.y,
    d = Math.hypot(dx, dy);
  return d <= reach && (d === 0 || (dx * p.fx + dy * p.fy) / d >= dot);
}
export const SAVE_KEY = "desert-pixel-save-v1";
export function freshSave(
  name = "Pengembara",
  look = { skin: 0, hair: 0, outfit: 0 },
) {
  return {
    version: 1,
    name,
    look,
    x: 860,
    y: 730,
    hp: 100,
    stamina: 100,
    coins: 30,
    durability: 100,
    kills: 0,
    time: 0,
    quest: false,
    potions: 3,
  };
}
export function validSave(s) {
  return (
    !!s &&
    s.version === 1 &&
    typeof s.name === "string" &&
    s.name.length > 0 &&
    s.name.length <= 20 &&
    [
      "x",
      "y",
      "hp",
      "stamina",
      "coins",
      "durability",
      "kills",
      "time",
      "potions",
    ].every((k) => Number.isFinite(s[k])) &&
    s.x >= 20 &&
    s.x <= 1900 &&
    s.y >= 20 &&
    s.y <= 1380 &&
    s.hp >= 0 &&
    s.hp <= 100 &&
    s.stamina >= 0 &&
    s.stamina <= 100 &&
    s.durability >= 0 &&
    s.durability <= 100 &&
    s.coins >= 0 &&
    s.kills >= 0 &&
    s.potions >= 0 &&
    typeof s.quest === "boolean" &&
    (s.look === undefined ||
      (s.look !== null &&
        typeof s.look === "object" &&
        ["skin", "hair", "outfit"].every(
          (k) =>
            Number.isInteger(s.look[k]) && s.look[k] >= 0 && s.look[k] <= 2,
        )))
  );
}
export function loadSave(storage) {
  for (const key of [SAVE_KEY, SAVE_KEY + "-backup"]) {
    try {
      const s = JSON.parse(storage.getItem(key));
      if (validSave(s)) return s;
    } catch {}
  }
  return null;
}
export function saveGame(storage, s) {
  if (!validSave(s)) return false;
  try {
    const old = storage.getItem(SAVE_KEY);
    if (old) {
      try {
        if (validSave(JSON.parse(old)))
          storage.setItem(SAVE_KEY + "-backup", old);
      } catch {}
    }
    storage.setItem(SAVE_KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}
export function penalty(s) {
  return {
    ...s,
    x: 860,
    y: 730,
    hp: 100,
    stamina: 100,
    durability: Math.max(0, s.durability - 15),
  };
}
