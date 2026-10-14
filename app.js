// Screens and saving. The game rules live in logic.js.

var app = document.getElementById("app");
var SAVE_KEY = "daily-words-save";

var save = loadSave();
var round = null; // the round being played right now

// ---------- Saving (phone storage). Never crash if storage is blocked. ----------

function loadSave() {
  try {
    var text = localStorage.getItem(SAVE_KEY);
    if (text) return JSON.parse(text);
  } catch (e) { /* ignore */ }
  return newSave();
}

function writeSave() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ }
}

// ---------- Small helpers ----------

// Say a word out loud, if the phone can. Helps people who read English as a second language.
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  var voice = new SpeechSynthesisUtterance(text);
  voice.lang = "en";
  voice.rate = 0.85;
  speechSynthesis.speak(voice);
}

function show(html) {
  app.innerHTML = html;
  window.scrollTo(0, 0);
}

function onClick(id, fn) {
  var el = document.getElementById(id);
  if (el) el.onclick = fn;
}

// ---------- Home screen ----------

function showHome() {
  var today = dateKey();
  var doneToday = save.lastDay === today;
  var level = levelFor(save.points);
  var start = pointsForLevel(level);
  var next = pointsForLevel(level + 1);
  var percent = Math.round(((save.points - start) / (next - start)) * 100);

  // The last 7 days as dots
  var week = "";
  for (var i = 6; i >= 0; i--) {
    var day = shiftDay(today, -i);
    var played = !!save.days[day];
    var name = new Date(day + "T12:00:00").toLocaleDateString("en", { weekday: "short" }).slice(0, 2);
    week += '<div class="day">' + name +
      '<div class="dot' + (played ? " done" : "") + (i === 0 ? " today" : "") + '">' +
      (played ? "✓" : "") + "</div></div>";
  }

  var mainButton = doneToday
    ? '<p class="center"><b>✅ Done for today!</b><br><span class="muted">Come back tomorrow to keep your streak.</span></p>'
    : '<button class="main" id="start">Start today’s 5 words</button>';

  show(
    '<div class="top"><h1>📘 Daily Words</h1></div>' +
    '<div class="stats">' +
      '<div class="card stat"><b>🔥 ' + currentStreak(save, today) + '</b>day streak</div>' +
      '<div class="card stat"><b>⭐ ' + save.points + '</b>points</div>' +
      '<div class="card stat"><b>🏅 ' + level + '</b>level</div>' +
    "</div>" +
    '<div class="card"><div class="bar"><div style="width:' + percent + '%"></div></div>' +
      '<span class="muted">' + (next - save.points) + " points to level " + (level + 1) + "</span></div>" +
    '<div class="card week">' + week + "</div>" +
    mainButton +
    '<button id="practice">Practice (no points)</button>' +
    '<button id="badges">🏆 My badges</button>' +
    '<p class="muted center">Words learned: ' + save.learned.length + "</p>"
  );

  onClick("start", function () { startRound(false); });
  onClick("practice", function () { startRound(true); });
  onClick("badges", showBadges);
}

// ---------- Quiz ----------

function startRound(isPractice) {
  // Daily round: same questions for everyone today.
  // Practice round: different every time.
  var seed = isPractice ? dateKey() + "-practice-" + Date.now() : dateKey();
  round = {
    practice: isPractice,
    questions: buildQuestions(WORDS, seed),
    index: 0,
    score: 0,
    rightWords: []
  };
  showQuestion();
}

function showQuestion() {
  var q = round.questions[round.index];
  var picture = "";
  var prompt = "";

  if (q.kind === "emoji") {
    picture = '<div class="big-emoji" aria-hidden="true">' + q.emoji + "</div>";
    prompt = "What is this?";
  } else if (q.kind === "meaning") {
    prompt = "Which word means:<br>“" + q.meaning + "”";
  } else {
    prompt = q.sentence.replace("___", "_____");
  }

  var buttons = q.choices.map(function (choice, i) {
    return '<button class="choice" data-i="' + i + '">' + choice + "</button>";
  }).join("");

  show(
    '<p class="muted">Question ' + (round.index + 1) + " of " + round.questions.length +
      (round.practice ? " · practice" : "") + "</p>" +
    '<div class="bar"><div style="width:' + (round.index / round.questions.length) * 100 + '%"></div></div>' +
    picture +
    '<p class="prompt">' + prompt + "</p>" +
    '<div id="choices">' + buttons + "</div>" +
    '<div id="result"></div>'
  );

  var buttonList = document.querySelectorAll(".choice");
  for (var i = 0; i < buttonList.length; i++) {
    buttonList[i].onclick = function () { answer(this); };
  }
}

function answer(clickedButton) {
  var q = round.questions[round.index];
  var picked = clickedButton.textContent;
  var isRight = picked === q.answer;

  // Lock all buttons and color them
  var buttonList = document.querySelectorAll(".choice");
  for (var i = 0; i < buttonList.length; i++) {
    buttonList[i].disabled = true;
    if (buttonList[i].textContent === q.answer) buttonList[i].classList.add("right");
  }

  var message;
  if (isRight) {
    round.score++;
    round.rightWords.push(q.word);
    message = '<p class="feedback good">✅ Correct!</p>';
  } else {
    clickedButton.classList.add("wrong");
    message = '<p class="feedback bad">❌ The answer is “' + q.answer + "”.</p>";
  }

  // Always show the word in a full sentence so the player learns it.
  var fullSentence = q.sentence.replace("___", "<b>" + q.word + "</b>");
  var isLast = round.index === round.questions.length - 1;

  document.getElementById("result").innerHTML =
    message +
    '<p>' + q.emoji + " " + fullSentence + "</p>" +
    '<button class="listen" id="listen">🔊 Listen</button>' +
    '<button class="main" id="next">' + (isLast ? "See my result" : "Next") + "</button>";

  onClick("listen", function () { speak(q.word + ". " + q.sentence.replace("___", q.word)); });
  onClick("next", function () {
    round.index++;
    if (isLast) showResult(); else showQuestion();
  });
  document.getElementById("next").focus();
  if (isRight) speak(q.word);
}

// ---------- Result ----------

function showResult() {
  var total = round.questions.length;
  var won = null;

  if (!round.practice) {
    won = finishDaily(save, dateKey(), round.score, total, round.rightWords);
    save = won.save;
    writeSave();
  }

  var title = round.score === total ? "🎉 Perfect!" : round.score >= 3 ? "👏 Good job!" : "💪 Keep going!";
  var rewards = "";

  if (won && won.pointsWon > 0) {
    rewards += '<div class="card center"><p style="font-size:32px;margin:0"><b>+' + won.pointsWon + " points ⭐</b></p>" +
      "<p class=\"muted\">🔥 " + save.streak + "-day streak</p></div>";
    if (won.leveledUp) {
      rewards += '<div class="card center"><b>🏅 Level up! You are now level ' + levelFor(save.points) + ".</b></div>";
    }
    won.newBadges.forEach(function (badge) {
      rewards += '<div class="card center"><span style="font-size:40px">' + badge.emoji + "</span><br><b>New badge: " +
        badge.name + "</b><br><span class=\"muted\">" + badge.text + "</span></div>";
    });
  } else if (round.practice) {
    rewards = '<p class="center muted">Practice does not give points.</p>';
  }

  show(
    '<h1 class="center">' + title + "</h1>" +
    '<p class="center" style="font-size:28px"><b>' + round.score + " / " + total + "</b></p>" +
    rewards +
    (round.practice ? "" : '<button id="share">📤 Share my score</button>') +
    '<button class="main" id="home">Back to home</button>'
  );

  onClick("home", showHome);
  onClick("share", function () {
    var text = "Daily Words " + dateKey() + ": " + round.score + "/" + total + " 🔥 " + save.streak + "-day streak";
    if (navigator.share) navigator.share({ text: text }).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(text);
    this.textContent = "✅ Copied";
  });
}

// ---------- Badges ----------

function showBadges() {
  var tiles = BADGES.map(function (badge) {
    var earned = save.badges.indexOf(badge.id) !== -1;
    return '<div class="badge' + (earned ? "" : " locked") + '"><div class="e">' + badge.emoji + "</div><b>" +
      badge.name + "</b><small>" + badge.text + "</small></div>";
  }).join("");

  show(
    "<h1>🏆 My badges</h1>" +
    '<p class="muted">You have ' + save.badges.length + " of " + BADGES.length + ".</p>" +
    '<div class="badges">' + tiles + "</div>" +
    '<button class="main" id="home" style="margin-top:16px">Back</button>' +
    '<button class="link" id="reset">Delete my progress</button>'
  );

  onClick("home", showHome);
  onClick("reset", function () {
    if (confirm("Delete all your points, streak and badges?")) {
      save = newSave();
      writeSave();
      showHome();
    }
  });
}

// ---------- Start ----------

showHome();

// Offline support: the app keeps working with no internet.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(function () {});
}
