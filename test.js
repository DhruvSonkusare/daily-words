// Run with: node test.js   (no packages needed)
var assert = require("assert");
var L = require("./logic.js");
var WORDS = require("./words.js");

var passed = 0;
function test(name, fn) { fn(); passed++; console.log("ok -", name); }

test("shiftDay moves across month and year ends", function () {
  assert.strictEqual(L.shiftDay("2026-03-01", -1), "2026-02-28");
  assert.strictEqual(L.shiftDay("2026-12-31", 1), "2027-01-01");
});

test("same day gives the same questions; another day gives different ones", function () {
  var a = L.buildQuestions(WORDS, "2026-10-14");
  var b = L.buildQuestions(WORDS, "2026-10-14");
  var c = L.buildQuestions(WORDS, "2026-10-15");
  assert.deepStrictEqual(a, b);
  assert.notDeepStrictEqual(a, c);
});

test("each question has 3 different choices that include the answer", function () {
  L.buildQuestions(WORDS, "x").forEach(function (q) {
    assert.strictEqual(q.choices.length, 3);
    assert.strictEqual(new Set(q.choices).size, 3);
    assert.ok(q.choices.indexOf(q.answer) !== -1);
  });
});

test("every word has a sentence with exactly one gap", function () {
  WORDS.forEach(function (w) {
    assert.strictEqual(w.sentence.split("___").length, 2, w.word);
  });
});

test("levels", function () {
  assert.strictEqual(L.levelFor(0), 1);
  assert.strictEqual(L.levelFor(99), 1);
  assert.strictEqual(L.levelFor(100), 2);
  assert.strictEqual(L.levelFor(300), 3);
});

test("streak grows on consecutive days and resets after a missed day", function () {
  var s = L.newSave();
  s = L.finishDaily(s, "2026-10-14", 5, 5, []).save;
  s = L.finishDaily(s, "2026-10-15", 3, 5, []).save;
  assert.strictEqual(s.streak, 2);
  assert.strictEqual(L.currentStreak(s, "2026-10-16"), 2); // still alive
  assert.strictEqual(L.currentStreak(s, "2026-10-17"), 0); // missed a day
  s = L.finishDaily(s, "2026-10-17", 3, 5, []).save;
  assert.strictEqual(s.streak, 1);
  assert.strictEqual(s.bestStreak, 2);
});

test("a second round on the same day gives no points", function () {
  var first = L.finishDaily(L.newSave(), "2026-10-14", 5, 5, ["bus"]);
  var again = L.finishDaily(first.save, "2026-10-14", 5, 5, ["bus"]);
  assert.strictEqual(again.pointsWon, 0);
  assert.strictEqual(again.save.points, first.save.points);
});

test("points and badges for a perfect first day", function () {
  var r = L.finishDaily(L.newSave(), "2026-10-14", 5, 5, ["a", "b", "c", "d", "e"]);
  assert.strictEqual(r.pointsWon, 50 + 20 + 2); // 5x10 + perfect bonus + 1 day streak x2
  var ids = r.newBadges.map(function (b) { return b.id; }).sort();
  assert.deepStrictEqual(ids, ["first", "perfect"]);
});

console.log("\n" + passed + " tests passed");
