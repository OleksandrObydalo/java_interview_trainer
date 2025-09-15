import { TOPICS, QUESTIONS } from "questions";
import { shuffle, formatTime, spacedNext, todayKey } from "utils";

/* State */
const state = {
  mode: "flashcards",
  filtered: [...QUESTIONS],
  currentIdx: 0,
  order: [],
  timerId: null,
  mockSeconds: 120
};

const els = {
  tabs: () => document.querySelectorAll(".tab-btn"),
  views: {
    flashcards: document.getElementById("flashcardsView"),
    quiz: document.getElementById("quizView"),
    mock: document.getElementById("mockView")
  },
  sidebar: {
    filters: document.getElementById("topicFilters"),
    statTotal: document.getElementById("statTotal"),
    statDue: document.getElementById("statDue"),
    statAvg: document.getElementById("statAvg")
  },
  flash: {
    q: document.getElementById("fcQuestion"),
    a: document.getElementById("fcAnswer"),
    tags: document.getElementById("fcTags"),
    show: document.getElementById("showAnswerBtn"),
    next: document.getElementById("nextCardBtn")
  },
  quiz: {
    q: document.getElementById("quizQuestion"),
    opts: document.getElementById("quizOptions"),
    feedback: document.getElementById("quizFeedback"),
    next: document.getElementById("quizNextBtn")
  },
  mock: {
    q: document.getElementById("mockQuestion"),
    a: document.getElementById("mockAnswer"),
    timer: document.getElementById("mockTimer"),
    notes: document.getElementById("mockNotes"),
    restart: document.getElementById("mockRestart"),
    next: document.getElementById("mockNextBtn")
  }
};

/* Progress storage */
const LS_KEY = "jit_progress_v1";

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch { return {}; }
}
function saveProgress(p) { localStorage.setItem(LS_KEY, JSON.stringify(p)); }
let progress = loadProgress(); // { [id]: { ef, interval, reps, due, last, scoreAvg } }

function getMeta(qId) {
  return progress[qId] || { ef: 2.5, interval: 0, reps: 0, due: 0, scoreAvg: 0, last: 0 };
}
function updateProgress(qId, grade) {
  const prev = getMeta(qId);
  const sched = spacedNext(grade, prev);
  const scoreAvg = Math.round(((prev.scoreAvg || 0) * 0.7 + grade * 0.3) * 100) / 100;
  progress[qId] = { ...sched, scoreAvg, last: Date.now() };
  saveProgress(progress);
  renderStats();
}

/* Filters and order */
function buildFilters() {
  els.sidebar.filters.innerHTML = "";
  TOPICS.forEach(t => {
    const id = `topic-${t}`;
    const wrap = document.createElement("label");
    wrap.innerHTML = `<input type="checkbox" id="${id}" checked />${t}`;
    els.sidebar.filters.appendChild(wrap);
    wrap.querySelector("input").addEventListener("change", applyFilters);
  });
  applyFilters();
}

function applyFilters() {
  const selected = new Set(
    [...els.sidebar.filters.querySelectorAll("input:checked")].map(i => i.id.replace("topic-",""))
  );
  state.filtered = QUESTIONS.filter(q => selected.has(q.topic));
  state.order = state.filtered.map((_, i) => i);
  renderStats();
  resetMode(false);
}

/* Stats */
function renderStats() {
  els.sidebar.statTotal.textContent = state.filtered.length;
  const due = state.filtered.filter(q => getMeta(q.id).due <= Date.now()).length;
  els.sidebar.statDue.textContent = due;
  const avg = state.filtered.length
    ? (state.filtered.reduce((s, q) => s + (getMeta(q.id).scoreAvg || 0), 0) / state.filtered.length).toFixed(2)
    : "0";
  els.sidebar.statAvg.textContent = avg;
}

/* Mode management */
function switchMode(to) {
  state.mode = to;
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.mode === to));
  Object.entries(els.views).forEach(([k, el]) => el.hidden = (k !== to));
  resetMode(false);
}

function resetMode(resetOrder) {
  if (resetOrder) state.order = state.filtered.map((_, i) => i);
  state.currentIdx = 0;
  stopTimer();
  if (state.mode === "flashcards") renderFlashcard();
  if (state.mode === "quiz") renderQuiz();
  if (state.mode === "mock") renderMock();
}

/* Selection helpers */
function currentQuestion() {
  if (!state.filtered.length) return null;
  const idx = state.order[state.currentIdx] ?? 0;
  return state.filtered[idx];
}
function nextQuestion() {
  state.currentIdx = (state.currentIdx + 1) % (state.order.length || 1);
}

/* Flashcards */
function renderFlashcard() {
  const q = currentQuestion();
  if (!q) { els.flash.q.textContent = "No questions for selected topics."; return; }
  els.flash.q.textContent = q.q;
  els.flash.a.hidden = true;
  els.flash.a.innerHTML = renderAnswer(q);
  els.flash.tags.textContent = `Topic: ${q.topic}`;
}

function renderAnswer(q) {
  if (q.type === "open") {
    return `<ul>${q.a.map(li => `<li>${escapeHtml(li)}</li>`).join("")}</ul>`;
  } else if (q.type === "mcq") {
    return `<div><strong>Answer:</strong> ${escapeHtml(q.options[q.answer])}<br><span class="explain">${escapeHtml(q.explain || "")}</span></div>`;
  }
  return "";
}

/* Quiz */
let quizAnswered = false;
function renderQuiz() {
  const q = currentQuestion();
  if (!q) { els.quiz.q.textContent = "No questions."; return; }
  // Ensure the question has 4 options, generating them if necessary
  const mcq = q.type === "mcq" ? q : toGeneratedMCQ(q);

  els.quiz.q.textContent = mcq.q;
  els.quiz.opts.innerHTML = "";
  quizAnswered = false;
  els.quiz.feedback.textContent = "";
  els.quiz.next.disabled = true;
  const options = shuffle(mcq.options.map((t, i) => ({ t, i })));
  options.forEach(({ t, i }) => {
    const li = document.createElement("li");
    li.textContent = t;
    li.tabIndex = 0;
    li.addEventListener("click", () => choose(i === mcq.answer, li, mcq));
    li.addEventListener("keydown", (e) => { if (e.key === "Enter") li.click(); });
    els.quiz.opts.appendChild(li);
  });
}

function choose(correct, el, mcq) {
  if (quizAnswered) return;
  quizAnswered = true;
  el.classList.add(correct ? "correct" : "wrong");
  els.quiz.feedback.textContent = correct ? "Correct!" : `Incorrect. ${mcq.explain || ""}`;
  updateProgress(mcq.id, correct ? 5 : 2);
  els.quiz.next.disabled = false;
}

/* Mock interview */
function renderMock() {
  const q = currentQuestion();
  if (!q) { els.mock.q.textContent = "No questions."; return; }
  els.mock.q.textContent = q.q;
  els.mock.a.innerHTML = renderAnswer(q);
  els.mock.notes.value = "";
  state.mockSeconds = 120;
  els.mock.timer.textContent = formatTime(state.mockSeconds);
  startTimer();
}

function startTimer() {
  stopTimer();
  state.timerId = setInterval(() => {
    state.mockSeconds -= 1;
    if (state.mockSeconds <= 0) {
      state.mockSeconds = 0;
      stopTimer();
    }
    els.mock.timer.textContent = formatTime(state.mockSeconds);
  }, 1000);
}
function stopTimer() {
  if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }
}

/* Keyboard shortcuts */
function bindShortcuts() {
  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea")) return;
    if (e.key === " ") {
      if (state.mode === "flashcards") {
        e.preventDefault();
        els.flash.a.hidden = !els.flash.a.hidden;
      }
    }
    if (e.key.toLowerCase() === "n") {
      e.preventDefault();
      goNext();
    }
    if ("12345".includes(e.key)) {
      const g = Number(e.key);
      const q = currentQuestion(); if (!q) return;
      updateProgress(q.id, g);
      goNext();
    }
  });
}

/* Helpers */
function goNext() {
  nextQuestion();
  if (state.mode === "flashcards") renderFlashcard();
  if (state.mode === "quiz") renderQuiz();
  if (state.mode === "mock") renderMock();
}

function toGeneratedMCQ(q) {
  // Generate a simple MCQ from open question bullets, ensuring exactly 4 options.
  const correct = (q.a && q.a[0]) ? q.a[0] : "Correct option";

  // Collect potential distractors from other open questions in the same topic.
  // Ensure distractors are unique and not the same as the correct answer.
  let potentialDistractors = QUESTIONS.filter(x =>
    x.topic === q.topic && x.id !== q.id && x.type === "open"
  ).flatMap(x => x.a?.slice(0, 1) || [])
   .filter(d => d !== correct);

  // Take up to 3 unique distractors
  const distractors = shuffle(potentialDistractors).slice(0, 3);

  let options = [correct, ...distractors];

  // If we have less than 4 options, add generic ones
  let genericOptionCounter = 1;
  while (options.length < 4) {
    let genericOption = `Another option ${genericOptionCounter}`;
    // Ensure generic options are also unique within the current set
    while (options.includes(genericOption)) {
      genericOptionCounter++;
      genericOption = `Another option ${genericOptionCounter}`;
    }
    options.push(genericOption);
    genericOptionCounter++;
  }

  // Shuffle all options to randomize their positions
  const finalOptions = shuffle(options);
  const answerIndex = finalOptions.indexOf(correct);

  return {
    id: q.id + "-gen",
    topic: q.topic,
    type: "mcq",
    q: q.q,
    options: finalOptions,
    answer: answerIndex,
    explain: "Generated from card; check phrasing."
  };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
}

/* UI wiring */
function initUI() {
  // Tabs
  els.tabs().forEach(btn => btn.addEventListener("click", () => switchMode(btn.dataset.mode)));
  // Sidebar controls
  document.getElementById("shuffleBtn").addEventListener("click", () => {
    state.order = shuffle(state.order);
    resetMode(false);
  });
  document.getElementById("resetProgressBtn").addEventListener("click", () => {
    if (confirm("Reset progress?")) {
      progress = {};
      saveProgress(progress);
      renderStats();
    }
  });
  // Flashcards
  els.flash.show.addEventListener("click", () => { els.flash.a.hidden = !els.flash.a.hidden; });
  els.flash.next.addEventListener("click", goNext);
  document.querySelectorAll("#flashcardsView .g").forEach(b => b.addEventListener("click", () => {
    const q = currentQuestion(); if (!q) return;
    updateProgress(q.id, Number(b.dataset.g));
    goNext();
  }));
  // Quiz
  els.quiz.next.addEventListener("click", goNext);
  // Mock
  els.mock.restart.addEventListener("click", () => { renderMock(); });
  els.mock.next.addEventListener("click", goNext);
  document.querySelectorAll("#mockView .g").forEach(b => b.addEventListener("click", () => {
    const q = currentQuestion(); if (!q) return;
    updateProgress(q.id, Number(b.dataset.g));
    goNext();
  }));
  // Export/Import
  document.getElementById("exportProgress").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `jit-progress-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    console.log("Progress exported successfully.");
  });
  document.getElementById("importProgress").addEventListener("change", async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (typeof data !== "object") throw new Error("bad");
      progress = data;
      saveProgress(progress);
      renderStats();
      alert("Imported successfully.");
    } catch {
      alert("Failed to import JSON.");
    } finally {
      e.target.value = "";
    }
  });
}

/* Boot */
function boot() {
  buildFilters();
  bindShortcuts();
  initUI();
  switchMode("flashcards");
}
boot();