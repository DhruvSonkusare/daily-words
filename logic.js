// Game rules. No screen code and no saving code here, only plain functions.
// The same file runs in the browser and in Node (for the tests).

var QUESTIONS_PER_DAY = 5;
var POINTS_PER_CORRECT = 10;   // points for each right answer
var POINTS_PERFECT_BONUS = 20; // extra points if all 5 are right

// ---------- Dates ----------

// Today as text, like "2026-10-14". Uses the phone's own calendar day.
function dateKey(date) {
  date = date || new Date();
  var month = String(date.getMonth() + 1).padStart(2, "0");
  var day = String(date.getDate()).padStart(2, "0");
  return date.getFullYear() + "-" + month + "-" + day;
}

// Move a day key forward or back. shiftDay("2026-10-14", -1) is "2026-10-13".
function shiftDay(key, days) {
  var ms = new Date(key + "T00:00:00Z").getTime() + days * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}

// ---------- Random, but the same for everyone on the same day ----------

// Turns a text (like the date) into a random-number function.
// Same text in = same numbers out. So all players get the same daily questions.
function makeRandom(seedText) {
  var n = 0;
  for (var i = 0; i < seedText.length; i++) {
    n = (n * 31 + seedText.charCodeAt(i)) % 2147483647;
  }
  if (n <= 0) n = 1;
  return function () {
    n = (n * 48271) % 2147483647; // a simple, well-known generator
    return n / 2147483647;        // a number between 0 and 1
  };
}

// Returns a shuffled copy of a list.
function shuffle(list, random) {
  var copy = list.slice();
  for (var i = copy.length - 1; i > 0; i--) {
    var j = Math.floor(random() * (i + 1));
    var temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

// ---------- Questions ----------

// 3 kinds of question:
//   "emoji"   - see a picture, pick the word
//   "meaning" - read what it means, pick the word
//   "blank"   - read a sentence with a gap, pick the word that fits
var QUESTION_KINDS = ["emoji", "meaning", "blank"];

// Make today's questions. Each has 3 choices (fewer choices = easier to read).
function buildQuestions(words, seedText) {
  var random = makeRandom(seedText);
  var chosen = shuffle(words, random).slice(0, QUESTIONS_PER_DAY);
  var kinds = shuffle(QUESTION_KINDS.concat(QUESTION_KINDS), random);

  return chosen.map(function (word, index) {
    var others = words.filter(function (w) { return w.word !== word.word; });
    var wrongChoices = shuffle(others, random).slice(0, 2);
    var choices = shuffle([word].concat(wrongChoices), random).map(function (w) { return w.word; });

    return {
      kind: kinds[index],
      word: word.word,
      emoji: word.emoji,
      meaning: word.meaning,
      sentence: word.sentence,
      choices: choices,
      answer: word.word
    };
  });
}

// ---------- Levels ----------

// Points needed to START a level: level 1 = 0, level 2 = 100, level 3 = 300, level 4 = 600 ...
function pointsForLevel(level) {
  return 50 * level * (level - 1);
}

function levelFor(points) {
  var level = 1;
  while (points >= pointsForLevel(level + 1)) level++;
  return level;
}

// ---------- Badges ----------

var BADGES = [
  { id: "first",   emoji: "🌱", name: "First day",    text: "Finish your first daily 5" },
  { id: "streak3", emoji: "🔥", name: "3-day streak", text: "Play 3 days in a row" },
  { id: "streak7", emoji: "⚡", name: "7-day streak", text: "Play 7 days in a row" },
  { id: "streak30", emoji: "👑", name: "30-day streak", text: "Play 30 days in a row" },
  { id: "perfect", emoji: "🎯", name: "Perfect day",  text: "Get all 5 right" },
  { id: "words25", emoji: "📚", name: "25 words",     text: "Learn 25 different words" },
  { id: "level5",  emoji: "🏆", name: "Level 5",      text: "Reach level 5" }
];

// Has the player earned this badge yet?
function hasEarned(badgeId, save) {
  if (badgeId === "first") return Object.keys(save.days).length >= 1;
  if (badgeId === "streak3") return save.bestStreak >= 3;
  if (badgeId === "streak7") return save.bestStreak >= 7;
  if (badgeId === "streak30") return save.bestStreak >= 30;
  if (badgeId === "perfect") {
    return Object.keys(save.days).some(function (day) {
      return save.days[day].score === save.days[day].total;
    });
  }
  if (badgeId === "words25") return save.learned.length >= 25;
  if (badgeId === "level5") return levelFor(save.points) >= 5;
  return false;
}

// ---------- The saved player data ----------

function newSave() {
  return {
    points: 0,
    streak: 0,        // days in a row
    bestStreak: 0,
    lastDay: null,    // last day the player finished the daily 5
    days: {},         // for each day played: { score, total }
    badges: [],       // ids of badges earned
    learned: []       // words answered right
  };
}

// The streak to show today.
// If you did not play yesterday or today, the streak is over: show 0.
function currentStreak(save, today) {
  if (save.lastDay === today) return save.streak;
  if (save.lastDay === shiftDay(today, -1)) return save.streak;
  return 0;
}

// Call this when the player finishes the daily 5.
// Gives back the new save plus what they won.
// Only the FIRST round each day gives points. Practice rounds give nothing.
function finishDaily(oldSave, today, score, total, rightWords) {
  if (oldSave.lastDay === today) {
    return { save: oldSave, pointsWon: 0, newBadges: [], leveledUp: false };
  }

  var save = JSON.parse(JSON.stringify(oldSave)); // work on a copy

  // Streak: played yesterday? +1. Otherwise start again at 1.
  if (save.lastDay === shiftDay(today, -1)) save.streak = save.streak + 1;
  else save.streak = 1;
  if (save.streak > save.bestStreak) save.bestStreak = save.streak;

  save.lastDay = today;
  save.days[today] = { score: score, total: total };
  rightWords.forEach(function (w) {
    if (save.learned.indexOf(w) === -1) save.learned.push(w);
  });

  // Points: per right answer + perfect bonus + small streak bonus (max 7 days counted)
  var pointsWon = score * POINTS_PER_CORRECT;
  if (score === total) pointsWon += POINTS_PERFECT_BONUS;
  pointsWon += Math.min(save.streak, 7) * 2;

  var levelBefore = levelFor(save.points);
  save.points += pointsWon;

  // Check for new badges
  var newBadges = BADGES.filter(function (badge) {
    return save.badges.indexOf(badge.id) === -1 && hasEarned(badge.id, save);
  });
  newBadges.forEach(function (badge) { save.badges.push(badge.id); });

  return {
    save: save,
    pointsWon: pointsWon,
    newBadges: newBadges,
    leveledUp: levelFor(save.points) > levelBefore
  };
}

// Lets Node load this file for the tests. Browsers skip this part.
if (typeof module !== "undefined") {
  module.exports = {
    QUESTIONS_PER_DAY: QUESTIONS_PER_DAY, BADGES: BADGES,
    dateKey: dateKey, shiftDay: shiftDay, buildQuestions: buildQuestions,
    levelFor: levelFor, pointsForLevel: pointsForLevel,
    newSave: newSave, currentStreak: currentStreak, finishDaily: finishDaily
  };
}
