import test from "node:test";
import assert from "node:assert/strict";
import {
  unit,
  inArc,
  freshSave,
  validSave,
  loadSave,
  saveGame,
  SAVE_KEY,
  penalty,
} from "../src/core.js";
const store = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
};
test("diagonal movement is normalized", () =>
  assert.ok(Math.abs(Math.hypot(...Object.values(unit(1, 1))) - 1) < 0.001));
test("attack only hits in facing arc and reach", () => {
  const p = { x: 0, y: 0, fx: 1, fy: 0 };
  assert.ok(inArc(p, { x: 25, y: 0 }, 40));
  assert.ok(!inArc(p, { x: -25, y: 0 }, 40));
  assert.ok(!inArc(p, { x: 50, y: 0 }, 40));
});
test("save roundtrip and recovery from damaged primary", () => {
  const st = store(),
    s = freshSave();
  assert.ok(saveGame(st, s));
  saveGame(st, { ...s, coins: 40 });
  st.setItem(SAVE_KEY, "broken");
  assert.equal(loadSave(st).coins, 30);
});
test("invalid saves rejected", () => {
  assert.ok(!validSave({ ...freshSave(), hp: NaN }));
  assert.ok(!validSave({ ...freshSave(), x: -1 }));
  assert.ok(!validSave({ ...freshSave(), version: 2 }));
});
test("defeat only damages equipment, retains inventory and coins", () => {
  const s = { ...freshSave(), hp: 0, coins: 70, potions: 2 };
  const n = penalty(s);
  assert.equal(n.durability, 85);
  assert.equal(n.coins, 70);
  assert.equal(n.potions, 2);
  assert.equal(n.hp, 100);
});
test("bad appearance data cannot crash renderer on restore", () => {
  assert.ok(!validSave({ ...freshSave(), look: null }));
  assert.ok(
    !validSave({ ...freshSave(), look: { skin: 99, hair: 0, outfit: 0 } }),
  );
});
test("storage quota errors are reported without destroying gameplay", () => {
  assert.equal(
    saveGame(
      {
        getItem: () => null,
        setItem: () => {
          throw new Error("quota");
        },
      },
      freshSave(),
    ),
    false,
  );
});
