/**
 * SQuaRE Quest — lógica do jogo
 *
 * Dados: data/quiz-data.json · Documentação: data/docs.json · LEIA-ME.txt
 * Compatível com GitHub Pages (paths relativos à pasta do app).
 */

/** Base do app (pasta onde estão css/, js/, data/), a partir do script. */
function appBase() {
  const script = document.querySelector('script[src*="quiz.js"]');
  if (script && script.src) {
    return script.src.replace(/js\/quiz\.js(\?.*)?$/i, "");
  }
  const path = location.pathname;
  if (/\.html?$/i.test(path)) return path.replace(/[^/]+$/, "");
  return path.endsWith("/") ? path : `${path}/`;
}

function assetUrl(relativePath) {
  return new URL(relativePath, appBase()).href;
}

/** Preenchidos após o fetch do JSON */
let meta = null;
let characteristics = [];
let questionBank = [];
let bossBank = [];
let quizReferences = [];
let docsData = null;
let readmeText = "";
let activeDocsSection = "play";
let storageKey = "square-quest-v2";
let questionsPerStage = 2;
let bossQuestionCount = 5;
let pointsStage = 100;
let pointsBoss = 200;
let maxScore = 2800;

const state = {
  team: "",
  stageIndex: 0,
  score: 0,
  stageScore: 0,
  currentQuestions: [],
  qIndex: 0,
  sectorResults: {},
  wrongAnswers: [],
  bossPool: [],
  bossIndex: 0,
  bossCorrect: 0,
  inBoss: false,
  answered: false,
  lastChoice: null,
  scorePosted: false,
  reviewRating: 0,
  pendingReview: null,
  // start | stageIntro | question | stageDone | finalIntro | boss | result | docs | board | reviews
  screen: "start",
  docsReturn: "start"
};

// ——— Helpers ———

function $(id) {
  return document.getElementById(id);
}

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Embaralha opções e recalcula o índice correto. */
function randomizeQuestion(q) {
  const pairs = q.options.map((text, i) => ({ text, ok: i === q.correct }));
  const shuffled = shuffle(pairs);
  return {
    ...q,
    options: shuffled.map((p) => p.text),
    correct: shuffled.findIndex((p) => p.ok)
  };
}

/** Escolhe N questões priorizando subcaracterísticas distintas. */
function pickDiverseQuestions(stageId, count) {
  const pool = shuffle(questionBank.filter((q) => q.stage === stageId));
  const picked = [];
  const usedSubs = new Set();

  for (const q of pool) {
    if (picked.length >= count) break;
    if (!usedSubs.has(q.sub)) {
      picked.push(q);
      usedSubs.add(q.sub);
    }
  }

  for (const q of pool) {
    if (picked.length >= count) break;
    if (!picked.includes(q)) picked.push(q);
  }

  return picked.map(randomizeQuestion);
}

function announce(text) {
  $("liveRegion").textContent = text;
}

function hideAllScreens() {
  ["startScreen", "boardScreen", "reviewsScreen", "stageIntro", "questionScreen", "finalIntro", "finalScreen", "docsScreen"]
    .forEach((id) => $(id).classList.add("hidden"));
}

function showScreen(id) {
  hideAllScreens();
  $(id).classList.remove("hidden");
  document.body.classList.toggle("is-menu", id === "startScreen");
}

function subLabel(sub) {
  return typeof sub === "string" ? sub : sub.pt;
}

function sealLabel(index, done) {
  const c = characteristics[index];
  return `
    <div class="seal ${done ? "done" : ""}">
      <strong>${String(index + 1).padStart(2, "0")} · ${c.pt}</strong>
      <span class="muted">${c.en}</span>
    </div>`;
}

// ——— Header / mapa ———

function sectorShortLabel(c) {
  const map = {
    functional: "Funcional",
    performance: "Desempenho",
    compatibility: "Compatib.",
    interaction: "Interação",
    reliability: "Confiab.",
    security: "Segurança",
    maintainability: "Manutenç.",
    flexibility: "Flexib.",
    safety: "Operacional"
  };
  return map[c.id] || c.pt;
}

function renderSectorMap() {
  const map = $("sectorMap");
  map.innerHTML = characteristics.map((c, i) => {
    let cls = "sector-seg";
    if (i < state.stageIndex) cls += " done";
    else if (
      i === state.stageIndex &&
      state.screen !== "start" &&
      state.screen !== "result" &&
      state.screen !== "board" &&
      state.screen !== "reviews" &&
      !state.inBoss
    ) {
      cls += " current";
    } else if (state.inBoss || state.screen === "result" || state.screen === "finalIntro") {
      cls += " done";
    }

    const num = String(i + 1).padStart(2, "0");
    const short = sectorShortLabel(c);
    return `
      <div class="${cls}" title="${c.pt} (${c.en})" aria-label="${c.pt}">
        <span class="sector-seg-num">${num}</span>
        <span class="sector-seg-label">${short}</span>
      </div>`;
  }).join("");
}

function updateHeader() {
  const totalSectors = characteristics.length;
  const done = Math.min(state.stageIndex, totalSectors);
  $("scoreHeader").textContent = `${state.score} pts`;
  $("progressText").textContent = `${done}/${totalSectors} setores`;
  $("progressBar").style.width = `${(done / totalSectors) * 100}%`;

  const quit = $("btnQuit");
  if (quit) {
    const inMatch = !["start", "result", "docs", "board", "reviews"].includes(state.screen);
    quit.classList.toggle("hidden", !inMatch);
  }

  let hint = "Pronto para iniciar";
  if (state.screen === "result") hint = "Relatório final";
  else if (state.screen === "board") hint = "Placar global";
  else if (state.screen === "reviews") hint = "Avaliações";
  else if (state.inBoss || state.screen === "finalIntro" || state.screen === "boss") {
    hint = "Auditoria final";
  } else if (state.stageIndex < totalSectors && state.screen !== "start") {
    hint = characteristics[state.stageIndex].pt;
  }
  $("stageHint").textContent = hint;
  renderSectorMap();
}

// ——— Persistência ———

function saveProgress() {
  if (["start", "result", "docs", "board", "reviews"].includes(state.screen)) return;

  const payload = {
    team: state.team,
    stageIndex: state.stageIndex,
    score: state.score,
    stageScore: state.stageScore,
    currentQuestions: state.currentQuestions,
    qIndex: state.qIndex,
    sectorResults: state.sectorResults,
    wrongAnswers: state.wrongAnswers,
    bossPool: state.bossPool,
    bossIndex: state.bossIndex,
    bossCorrect: state.bossCorrect,
    inBoss: state.inBoss,
    screen: state.screen,
    answered: state.answered,
    lastChoice: state.lastChoice
  };

  try {
    localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch (_) {
    /* storage indisponível */
  }
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function clearProgress() {
  try {
    localStorage.removeItem(storageKey);
  } catch (_) {
    /* ignore */
  }
}

function applySaved(saved) {
  Object.assign(state, {
    team: saved.team,
    stageIndex: saved.stageIndex,
    score: saved.score,
    stageScore: saved.stageScore || 0,
    currentQuestions: saved.currentQuestions || [],
    qIndex: saved.qIndex || 0,
    sectorResults: saved.sectorResults || {},
    wrongAnswers: saved.wrongAnswers || [],
    bossPool: saved.bossPool || [],
    bossIndex: saved.bossIndex || 0,
    bossCorrect: saved.bossCorrect || 0,
    inBoss: !!saved.inBoss,
    answered: !!saved.answered,
    lastChoice: Number.isInteger(saved.lastChoice) ? saved.lastChoice : null,
    screen: saved.screen
  });
  syncCheatMode();
}

function resumeFromSave() {
  const saved = loadProgress();
  if (!saved) return;

  applySaved(saved);
  updateHeader();

  switch (saved.screen) {
    case "stageIntro":
      showStageIntro();
      break;
    case "stageDone":
      showStageDone();
      break;
    case "question":
      showQuestion(saved.answered);
      break;
    case "finalIntro":
      showFinalIntro();
      break;
    case "boss":
      showBossQuestion(saved.answered);
      break;
    default:
      showStageIntro();
  }
}

function checkResumeBanner() {
  const saved = loadProgress();
  const banner = $("resumeBanner");
  if (!saved || saved.screen === "start" || saved.screen === "result") {
    banner.classList.add("hidden");
    return;
  }
  $("resumeText").textContent =
    `Há uma auditoria em andamento (${saved.team || "equipe"}, ${saved.score} pts). Continuar de onde parou?`;
  banner.classList.remove("hidden");
}

// ——— Fluxo: início ———

function isSysAdmin() {
  const raw = (state.team || "").trim().toLowerCase();
  const compact = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  return compact === "sysadmin";
}

function syncCheatMode() {
  const on = isSysAdmin();
  document.body.classList.toggle("cheat-sysadmin", on);
  return on;
}

function applySysAdminHints() {
  if (!isSysAdmin()) return;
  const q = currentQuestion();
  if (!q) return;
  const btn = document.querySelector(`.option[data-answer="${q.correct}"]`);
  if (btn) btn.classList.add("sysadmin-glow");
}

function startGame() {
  clearProgress();
  $("resumeBanner").classList.add("hidden");

  state.team = $("teamName").value.trim() || "Equipe Auditora";
  state.stageIndex = 0;
  state.score = 0;
  state.sectorResults = {};
  state.wrongAnswers = [];
  state.inBoss = false;
  state.answered = false;
  state.bossPool = [];
  state.bossIndex = 0;
  state.bossCorrect = 0;
  state.scorePosted = false;

  const cheat = syncCheatMode();
  updateHeader();
  showStageIntro();
  if (cheat) announce("Modo sysadmin ativo.");
}

// ——— Fluxo: setores ———

function showStageIntro() {
  if (state.stageIndex >= characteristics.length) {
    showFinalIntro();
    return;
  }

  state.screen = "stageIntro";
  state.inBoss = false;
  const c = characteristics[state.stageIndex];
  const el = $("stageIntro");

  el.innerHTML = `
    <div class="stage-head">
      <div class="stage-num">${state.stageIndex + 1}</div>
      <div>
        <p class="eyebrow" style="margin:0">SETOR DE AUDITORIA</p>
        <h2 style="margin:4px 0 8px">${c.pt}</h2>
        <p class="muted" style="margin:0">${c.en}</p>
      </div>
    </div>
    <p>${c.definition}</p>
    <p><strong>Pergunta-chave:</strong> ${c.question}</p>
    <div class="subs">${c.subs.map((s) => `<span class="sub">${subLabel(s)}</span>`).join("")}</div>
    <div class="actions">
      <button class="primary" type="button" data-action="begin-stage">&gt; AUDITAR ESTE SETOR</button>
      <button class="ghost" type="button" data-action="quit">SAIR</button>
    </div>
    <p class="muted" style="margin-top:14px;font-size:0.85rem;font-family:var(--mono)">Atalho: Enter / Espaço</p>`;

  showScreen("stageIntro");
  updateHeader();
  saveProgress();
}

function beginStage() {
  const c = characteristics[state.stageIndex];
  state.currentQuestions = pickDiverseQuestions(c.id, questionsPerStage);
  state.qIndex = 0;
  state.stageScore = 0;
  state.answered = false;
  showQuestion(false);
}

function currentQuestion() {
  return state.inBoss
    ? state.bossPool[state.bossIndex]
    : state.currentQuestions[state.qIndex];
}

function showQuestion(restoreAnswered) {
  state.screen = state.inBoss ? "boss" : "question";
  state.answered = !!restoreAnswered;
  if (!state.answered) state.lastChoice = null;

  const q = currentQuestion();
  const total = state.inBoss ? bossQuestionCount : state.currentQuestions.length;
  const index = state.inBoss ? state.bossIndex : state.qIndex;
  const label = state.inBoss
    ? "Auditoria final"
    : `Setor ${state.stageIndex + 1} · ${characteristics[state.stageIndex].pt}`;

  const el = $("questionScreen");
  el.innerHTML = `
    <p class="q-meta">${label} · Q ${index + 1}/${total}</p>
    <p class="question">${q.prompt}</p>
    <div class="options" id="opts" role="group" aria-label="Alternativas">
      ${q.options.map((opt, i) => {
        const keys = [
          ["1", "2", "3", "4"],
          ["Q", "W", "E", "R"],
          ["A", "S", "D", "F"]
        ].map((row) => row[i]).join(" · ");
        return `
        <button class="option" type="button" data-answer="${i}" ${state.answered ? "disabled" : ""} title="Atalho: ${keys}">
          <span class="key">${["1", "2", "3", "4"][i]}</span>
          <span>${opt}</span>
        </button>`;
      }).join("")}
    </div>
    <div id="feedback" class="feedback" role="status"></div>
    <div class="actions">
      <button id="nextBtn" class="primary ${state.answered ? "" : "hidden"}" type="button" data-action="next">
        &gt; CONTINUAR
      </button>
      <button class="ghost" type="button" data-action="quit">SAIR</button>
    </div>
    <p class="muted" style="margin-top:14px;font-size:0.85rem;font-family:var(--mono)">Atalhos: 1–4 · QWER · ASDF · Enter/Espaço</p>`;

  showScreen("questionScreen");
  updateHeader();
  syncCheatMode();
  applySysAdminHints();

  if (state.answered) {
    paintAnswerState(null, true);
  }

  saveProgress();
}

function restoredChoiceIndex(q) {
  if (Number.isInteger(state.lastChoice) && state.lastChoice >= 0 && state.lastChoice < q.options.length) {
    return state.lastChoice;
  }
  const miss = (state.wrongAnswers || []).find((w) => w.prompt === q.prompt);
  if (miss) {
    const idx = q.options.indexOf(miss.chosen);
    return idx >= 0 ? idx : -1;
  }
  return q.correct;
}

function paintAnswerState(chosenIndex, restoreOnly) {
  const q = currentQuestion();
  const buttons = [...document.querySelectorAll(".option")];
  buttons.forEach((b) => { b.disabled = true; });
  buttons[q.correct]?.classList.add("correct");

  const choice = restoreOnly ? restoredChoiceIndex(q) : chosenIndex;

  if (choice !== null && choice !== undefined && choice !== q.correct) {
    buttons[choice]?.classList.add("wrong");
  }

  if (restoreOnly) {
    const ok = choice === q.correct;
    const gain = ok ? (state.inBoss ? pointsBoss : pointsStage) : 0;
    const f = $("feedback");
    f.className = `feedback show ${ok ? "ok" : "bad"}`;
    f.innerHTML = `
      <strong>${ok ? "Diagnóstico correto." : "Diagnóstico incorreto."}</strong>
      ${q.explanation}
      ${ok ? ` <b>+${gain} pontos</b>` : ""}`;
    $("nextBtn").classList.remove("hidden");
  }
}

function answer(choiceIndex) {
  if (state.answered) return;

  const q = currentQuestion();
  const ok = choiceIndex === q.correct;
  state.answered = true;
  state.lastChoice = choiceIndex;

  const buttons = [...document.querySelectorAll(".option")];
  buttons.forEach((b) => { b.disabled = true; });
  buttons[q.correct].classList.add("correct");
  if (!ok) buttons[choiceIndex].classList.add("wrong");

  const gain = ok ? (state.inBoss ? pointsBoss : pointsStage) : 0;
  if (ok) {
    state.score += gain;
    if (state.inBoss) state.bossCorrect += 1;
    else state.stageScore += 1;
  } else {
    state.wrongAnswers.push({
      context: state.inBoss
        ? "Auditoria final"
        : characteristics[state.stageIndex].pt,
      prompt: q.prompt,
      chosen: q.options[choiceIndex],
      correct: q.options[q.correct],
      explanation: q.explanation
    });
  }

  const f = $("feedback");
  f.className = `feedback show ${ok ? "ok" : "bad"}`;
  f.innerHTML = `
    <strong>${ok ? "Diagnóstico correto." : "Diagnóstico incorreto."}</strong>
    ${q.explanation}
    ${ok ? ` <b>+${gain} pontos</b>` : ""}`;

  announce(ok ? `Correto. Mais ${gain} pontos.` : `Incorreto. Resposta certa: ${q.options[q.correct]}.`);
  $("nextBtn").classList.remove("hidden");
  updateHeader();
  saveProgress();
}

function nextAfterQuestion() {
  if (state.inBoss) {
    state.bossIndex += 1;
    state.answered = false;
    if (state.bossIndex < bossQuestionCount) showBossQuestion(false);
    else showResult();
    return;
  }

  state.qIndex += 1;
  state.answered = false;
  if (state.qIndex < state.currentQuestions.length) showQuestion(false);
  else finishStage();
}

function finishStage() {
  const c = characteristics[state.stageIndex];
  state.sectorResults[c.id] = { correct: state.stageScore, total: questionsPerStage };
  state.stageIndex += 1;
  showStageDone();
}

function showStageDone() {
  state.screen = "stageDone";
  const prev = characteristics[state.stageIndex - 1];
  const result = state.sectorResults[prev.id] || { correct: 0, total: questionsPerStage };
  const label =
    result.correct === questionsPerStage ? "Selo de excelência" :
    result.correct > 0 ? "Selo parcial" :
    "Setor para revisão";

  const el = $("stageIntro");
  el.innerHTML = `
    <p class="eyebrow">SETOR CONCLUÍDO</p>
    <h2>${label}</h2>
    <p>Você concluiu <strong>${prev.pt}</strong> com ${result.correct}/${result.total} diagnósticos corretos.</p>
    <div class="seal-grid">
      ${characteristics.map((c, i) => sealLabel(i, i < state.stageIndex)).join("")}
    </div>
    <div class="actions">
      <button class="primary" type="button" data-action="next-stage">
        &gt; ${state.stageIndex < characteristics.length ? "PRÓXIMO SETOR" : "AUDITORIA FINAL"}
      </button>
      <button class="ghost" type="button" data-action="quit">SAIR</button>
    </div>
    <p class="muted" style="margin-top:14px;font-size:0.85rem;font-family:var(--mono)">Atalho: Enter / Espaço</p>`;

  showScreen("stageIntro");
  updateHeader();
  saveProgress();
}

// ——— Fluxo: auditoria final ———

function showFinalIntro() {
  state.screen = "finalIntro";
  state.inBoss = false;

  $("finalIntro").innerHTML = `
    <p class="eyebrow">DESAFIO FINAL</p>
    <h1>Auditoria Final</h1>
    <p class="lede">
      ${escapeHtml(state.team)}, você percorreu os nove setores. Agora receberá ${bossQuestionCount} incidentes misturados.
      Identifique a <strong>característica</strong> principal de cada caso.
    </p>
    <p class="note">Cada acerto vale <strong>${pointsBoss} pontos</strong>. O relatório final junta setores + auditoria final.</p>
    <div class="actions">
      <button class="primary" type="button" data-action="start-boss">&gt; INICIAR AUDITORIA FINAL</button>
      <button class="ghost" type="button" data-action="quit">SAIR</button>
    </div>
    <p class="muted" style="margin-top:14px;font-size:0.85rem;font-family:var(--mono)">Atalho: Enter / Espaço</p>`;

  showScreen("finalIntro");
  updateHeader();
  saveProgress();
}

function startBoss() {
  state.inBoss = true;
  state.bossPool = shuffle(bossBank).slice(0, bossQuestionCount).map(randomizeQuestion);
  state.bossIndex = 0;
  state.bossCorrect = 0;
  state.answered = false;
  showBossQuestion(false);
}

function showBossQuestion(restoreAnswered) {
  showQuestion(restoreAnswered);
}

// ——— Resultado + revisão ———

/* Dancing bear ASCII — frames from qqpr.com/ascii/js/1003.js (embedded locally) */
const DANCE_FRAMES = ["                          J:\n                         :BBX\n                         :7BBBU.       .\n                         i.,MBM:,.. .MBB\n                         r:.ii...... :1v\n                        :kr:i:,,ii:,: .\n                        qF:..,.iBBM..7E\n                       :BL: ....iY:  7B:\n                        jEYjLv::.  .i ::\n                         :FP0kSuYrr7Li,\n                           .rU1XSS12i\n                     LP7, ,7i.,.,.,:  PBBL\n                      7BMY7kY,   ..;LkBBY\n                        .. j7......i.:.\n                          .S:......:\n                          ;S;:. . .:\n                          UY,:,:::.,.\n                         LU. :YjOU: :.\n                        U8:..r  ik:. :\n                       7N:..i:   PNv:.:\n                       ,Jr:ir    ,N0Lri\n                         .i:       .:.", "                           BB,\n                          .MBBY\n                          :,uBBM..     ,\n                          r .U2L:... iBB7\n                         ;1i:i:....,..i5\n                        iMY::::.ruL::.\n                        P07,....7BBv ,G;\n                        jEr:::,..::  .BY\n                         UEGPFY7:, .::,:\n                          .rUX0kP1jJ1r\n                        .  ,,7LjYjjU: .OG:\n                       .,,rri.. ...:,iBBB;\n                     Li:i:iqr. ....r72v.\n                     .:..  87......:\n                           Er:,....,.\n                           SYi:.. ..:\n                           kri:iYYi.,.\n                          Pr.,7riGL. :\n                         EJ:.ir  2Ui..:\n                        u7..:7.  iB0L.:\n                        vY:i7;    LNJ7r\n                         .i:.       ..", "                        ,Y\n                        MBBY\n                        ruBBBX.. .  iBBZ\n                        7 :OBPi.... 7BGi\n                        .i i:,.. ...  :\n                        JL:::,:;vi:,,:,\n                       .E7...,,MBB, .BB\n                       SPi......7.  .iJ,\n                       ;PFYjL7i:...::.,\n                         iSqNkXSFuJYY..JU\n                           irLLujYvr  UBM,\n                       .: ,:i.. ...:::rvi\n                       r..:UL: ... rY5u,\n                       ii..uu:.....,\n                       ,i: uji,,....:\n                           L5;i.  ..:\n                           ru;::rLi..i\n                           5;:iLiFS. ::\n                          :qi:ii ik: .;.\n                          5ri:7,  B5i ::\n                         .qri7v   i0j7r.\n                          .:i,      ,.", "                                     JM\n                     SBBU:       ..qBBB.\n                     78BBBBM:.... :BBi:\n                     .L.7BMY,... .    ,\n                      ri,ri.. ..:,:.,:\n                       iUYi::j25:,.7BBr\n                       rr:,.:MBB:   Yjii.\n                      UN::::..:   i.  r:\n                      2GGq012Yvriivv7uU\n                       .,iLPFZXZPSj;,M1\n                          .ii::::,,.:ii.\n                        ::.:v7 . . rYr:\n                        7i..vL. ...,;.\n                         Y5: :,......\n                          ,LLri,.  .:.\n                           .Zr:,.ii:.i\n                           :2..:Y5E: ::\n                           JL,,7 .Z; .;\n                          ,ULii7. Bki ::\n                          vFr7v7  7NL77.\n                            i:,     .", "                                 iG,\n                                XBBU\n                              ,BBBv:.\n                           ...kBBq.,:\n                 .BBM57L.. . .  .:.7\n                  BBBBBN:  ...  ..:i:.\n                   77uki::,::rFBN:.,:iii\n                    .iuLJr:..LBBZ.:,::v:\n                      UBBB:      iirYL.\n                     :G1Pj:.7.:,:iuY;\n                     rNZEq1kkEPXFPv\n                        ..S5jYLri:jFi\n                         :iir:   . FMj:\n                        .7  ,.. .. ,i;:\n                         vUu7i:,....,\n                          .iOJr:.   ,.\n                            FJ::.:i:.i\n                           .2. ,UXG;.,i\n                          .ML  i,.Er .i\n                          FLi:ir  BU: i:\n                          YL:i7:  7F77r.\n                           .i.", "                              iB.\n                             7BB7\n                            uBBB7\n                          ..PMMri.\n                    :L,..:.. .,:ir\n                    BBNr7i77:.,,i:7,\n                     UJ17OBBr,...,:7:\n                     :BU:;7i::i::,:r.\n                     ;BUi. .irr7;YSY\n                      NUXuJ7LuFXENU\n                      iGEGkqPq1U7i::.\n                         .L2Y;i..,;Yi.:\n                         ir1,  . .i7.::\n                         7;ru:.  .; :.\n                         LU:uS7:..Y;:.\n                          :.Xkui.   .:\n                            Uv:::r;i.i.\n                           7; .iYrM7 .;\n                          .Si::v  87  i.\n                         .U..:7;  BXr ::\n                         ,uYrLL.  rPvr7.\n                           .,.      .", "                              ,1\n                             rBB.\n                            UBBE:\n                           :BBM:7\n                     7...,.,.:::r.\n                    .BEv7uU:..,:i;i\n                     LSYMBB:,,.,.iri\n                     B0::i:ii::,::r:\n                     BPv..:77Lrr7UY.\n                     vOkFjUJ5kNqNqi\n                      uOZ8Sq51YLr;.\n                          15r,,.L1L::.\n                       : i1r,. .:Jj:..\n                       7F777;.   .i.:\n                        iYriLv,...:ii.\n                         .:,FU7,.  .,i\n                            55vi:ii:.i.\n                           Yi.i7L:Mi .i\n                          ,L..:Y  OL. i.\n                         iv..:Y.  B0r :i\n                         :7UJUi   iEj7r.\n                            ..      ,.", "                                .\n                              :BB\n                             jBB5\n                           .5BBq7.\n                     UL  ..::rv:i.\n                     BBrrr7:..,:7i,\n                     r1JEBBi.,.,,ir:\n                     Bk,i7r::::,,:r;\n                     B1i  :777iiirL,\n                     58k2JJY15XSqE7\n                     .XM8OXNkX2UY7\n                        .,F2r,::2r:.,\n                      :. iui...:2U;.:\n                      ;2LYj7. . ,r:::\n                       :u7iLr. . :ri:\n                        ,r::X;. . ..r.\n                            qUi,::...r\n                           ivvvUUUu. :i\n                          ,u,:rY ,Zi .r.\n                         ,: ,:Y.  BSi :i\n                         0ur7Yr   7ZJ77,\n                          .:ri     .,.", "                                 L\n                               :BB.\n                             .qBBE.\n                      .     ,LBBq::\n                     rBk.,...,.i.;:\n                      5vLL1ki.,,irr,\n                      Gj;8BB:,...,:7,\n                     JBi. .,:::::.:;i\n                     JSui:.;7777r77L\n                      BGNFSU22kSqEk\n                       rUkFNSkuJL7.\n                       :  YY;,,,iri..\n                      .F112i . ,7Y..,.\n                       7r:77. ... ,:7\n                       :J7:ui..Yir77i\n                         . vu:.,:. ,i\n                           :Sv,,,,..i:\n                          .77r7k5F, ,r.\n                          U7:iY: U7  :;\n                         :i.:iL  .Bu:.ii\n                        .O;:rJ:   rEj7r.\n                         ,rr7:      .", "                                 UBi\n                               .BBB:\n                             .iBBBJi\n                      kB7   ..;Y2r,i\n                      0BYi::,,...:ir\n                       LYLuZBS,.,::ir\n                      .BU:rOB7.,...:ir\n                      vBL,   :;i;:::7:\n                      :PUUrrr7LYYuuPY\n                       uOZNkPSXk0X5r\n                         :71U1Yrri.\n                          ri:..:.:ii:\n                       :U0uL. .v .. .\n                       1BU.Li  iviii7.\n                           F7.  .::L;\n                           1v,    .:.\n                           XJ:,;:. ::\n                          7LrrPuNi  ;.\n                          Y::7J ;1. .r.\n                         :i:irr  ESi,.:\n                        .ErirJ.  .FOYr,\n                         i7rr:      .", "                                  i\n                                ,BB,\n                               7BBB:\n                             .7BBBv;\n                      2Sr  ...:iLr.i\n                      MBEi::,....::7:\n                       LYJLuGBr.,,::;r.\n                       YMuiEBB:,...,,ri\n                       BB7: ..iiriiirL.\n                       Y5Uur:;7JYjUEZr\n                        PEEPPkqk0q1i.\n                         :L5JuYY7Y.\n                        ,  r: ....i,:\n                       ,i. rr  . iJ.:,\n                        J7::7... YE:.\n                         ..S:....,Y;:r\n                          .5i   . ,i7.\n                          r5r7r:..:i\n                         ,Y;71O7. ::\n                         ;riir5L  ,r,\n                         :i:iivjr  .rr\n                        .ZLrvu  Uqi:r7\n                         :i::.   5jr:", "                                  .\n                                 1BE\n                                NBBk\n                              .GBBBr:\n                       :,   ..,LjFr.;\n                      .BB5:::....,:r7:\n                       iPLY77JL,.,::iri\n                        uPYYMBB,.,...:r:\n                        BBr:77i:::::::v,\n                        G8Y7..:LYjLu5N;\n                        :XESFuU1SFqX5:\n                         .YXFqkF1F2.\n                         . .Yi..:::i: ,\n                        .r .J:    ,i::,\n                         Yr.7,.. ;5i::\n                          iJi... U17\n                          rY: ... :ii;.\n                          Furr:...:7:\n                         iL;YEY..:i\n                         ri:i2, .ii\n                         ri,:u7 ..i:.\n                         0J77jrPr..YL\n                         :::.  YEJLi.", "                                  1B\n                                .MBB:\n                               :BBBXi\n                       ,L,   ..vBBq:r\n                       UBB:,.....:::7,\n                        UYLrri:...:irii\n                        7PLuBBM..,.,,ir:\n                        BBiiPXr.,...,:r,\n                        Mqj: .i7rLrL7J7\n                        :XEuJJU255kZMU\n                         :5NSPSXkq2:\n                         .,vY::iri;. .\n                        ,7 ,Y. . .,v::\n                         77.r... :u::.\n                          7Ui... SF;.\n                          iL. ...:7: ,\n                         .jv:i,...:77:\n                        ,Lr;YG7 .,;.\n                        rv:irU,  i:\n                         7i:iU; .,::,\n                         SU7rL:ur:,LJ\n                         :r:,  i0Yr:.", "                                  :Bi\n                                 2BB7\n                               :BBBF:\n                       :BF  ..:rOO5:i\n                       .BL::..,..:,ii\n                        JJLY05:.,,ii;i\n                       vB7;BBB,,...,:ri\n                       BB:..:,:,:,,,:ii\n                       LF2r::LLUJuvv77\n                        0ZXSk5FFSSZGS\n                         :152X155U:\n                          Ur::::,:::.\n                        irYL   r:..:i\n                        2Sir, ..rj; ..\n                          :Y,... rXY.\n                          J;. ... irr:\n                         :Y7:i:..,ir,\n                        Y7rruGL .:i\n                       .v:irrX:  :i\n                        ;;::;jY  .:i.\n                        LP7Lv..P7:,YY\n                         ,:,   rPLr:.", "                                   iU\n                                 ,BBB\n                       j1,     iBBBBi\n                       BB7  ..:rEB5:i\n                       7i:::,,,,.:.i.\n                       EYi2BB2,.,:iri\n                      EB, :E0i.,.,,:r:\n                      0Lr   .::::,,,ri\n                      JMSULLLujUYJrLr\n                       rGNNXqkPXPPEL\n                          7SujvL7L,\n                      ,L:Yr:,..:i::.\n                      :FXUi. . iri .,\n                      .UY:7,... ..,.:\n                       .i:Y: ,J77v;:r.\n                          5:. .,..r7.\n                         iU7:i,. ,i\n                        L7iru8u..,;\n                        v::rLuL  ,r:\n                      .v7:irY,Ui  ,i:\n                      .SYYYv,  Zu:.7Y\n                          .    iEJ7:.", "                                   YB:\n                     .BBv.     .;OBBB,\n                     .BBU.. ..,FBBBY:\n                      vi.......,iY..,\n                     :BL:,YkBL:.,::;\n                     MBi  LBBY.,.:ir\n                    LX;:.   ,.:,..,i:\n                    iM0qUL;i;L77ri:rr\n                      uqOPPkkFSFPSU:\n                         JSUYYLuvi\n                     v: ri:..,iii..\n                     Y0F5r   ,L1Y:.:\n                     .L:ir. . ::.,,.,\n                      .Y7L:....7;7iL,\n                         ir.. .:::v,\n                         YU;ii.  i:\n                        LirrZOr .:i\n                       ri::7r7Y  ,i:\n                      r. ,rL  5r. ,i:\n                     :Uj7YL,   GJ,.LL\n                       .:i.    rPJ7:", "                    .\n                    BBB7.          iEM\n                   .USBBL . ...,GBBBBM.\n                    J,i..,,,.  .1BBL.:\n                    .LYP7,:,iri. ,: :\n                    ,LBBi  .8BBF..:i\n                  70ki.  :  .iL:,.,i.\n                  LBBqvr;jr:. ,;::,:i,\n                    rqBOZXkUJ7vLYYu77.\n                       :LEkX5S5UJu:\n                    ,.  :7:,,:i::.\n                    :PuXu, ..iL17,..\n                     r7:7,....ri,,,\n                      7YYi....,:ii.7:\n                        :v,....:riJi\n                         X;:,,..,r:\n                       .ii7L87. :;\n                      :N:.:Y0U  .;:\n                     .1,,:ri j7 ..:ri\n                     iv..iL.  ,NYi:Uv\n                      rLYLi    iUri.", "                    OBO\n                    UMBBO;\n                   .U uBB2...   ..:7GO.\n                    ;:::   ,,:,. PBBBB.\n                    .r:.kBB;:::,. Yi,,\n                   7:...7OM,  .GBM...\n                 :BFJv7i:   ., :XZi,\n                  :NB8S1L7::i:.  :::.\n                    :UZMGX1UULL777uLY:\n                        vGXq5XFP25i:.\n                    7: ,:i:,,,:::,\n                    7UUPi  . .:v7..:\n                    .Li:7,... i;..:.\n                     :Y7Y7.....,:U,\n                       :X;. ...:j:\n                       :5;......i\n                      .;:ir5Or. ii\n                      Pr.i77vj  ,r:,\n                     i1::iL  1r . :7r\n                     U: .rL   :kUriJi\n                     iuYL7,    .k7:", "                      7:\n                     :BBq\n                     7rBBBL\n                     J :BBB7..\n                     .:.r:.  .,.. JMBBi\n                     .ii,.:ri:::. :BBB.\n                   ,2i....jBBF,,,,. r:\n                  iBL:::,,.ir.  .BBL\n                   ;MEPULi:.  .i iZr\n                    .uEOX2J7i:i:. .i:\n                       .v8EqNFSUYLFS7.\n                   .:   .7r7i7LjJr\n                   .2XNN7 . ..,::.\n                    ;7:r7. ...:L:.,.\n                     Y7:r:....,..ii\n                      i1r:.....,7:\n                      .Xv:.   .,r\n                       Ui:,vYi..:.\n                      Yr::jY1Ni .r\n                     ,q;:iv  NY. ,i\n                     uY::i7  iBji.:.\n                     F...77   7ZU7;.\n                     YU7vr.     ,.\n                       .", "                      MBL\n                     .PBBZ\n                     riiBBBY\n                     i, 7ZSu.,..  .iJ5\n                      7,i:.   ,.. UBBB.\n                     ri:::.iii,:,. :L:\n                   rX7....,qBBL.,,i.:\n                   85i,:...,vv   JBB\n                    kZ01U7i:   ,, L7\n                     :UEqkUU7ri7:::Y;\n                        :1XXNPqF17r:\n                   .Y7i:,::::iir7.\n                    7LUYv.    .::,.\n                    77.:r. ....7,.,\n                     rvr: ......:7.\n                      7k:......:7\n                      rF:.. ....,\n                      vL.::LuY:.:\n                      P:,:L:1Ui ,.\n                     2Y:,i; 55i...\n                    ,E:.,i; SG2i..\n                    ,X. .ri .Xu7i,\n                     rUr7:    ,..\n                       .", "                     qL\n                    .BBB,\n                    iiGBBO:\n                    r, XBBU,..   :2BS\n                     i :i.. .... rBBk\n                     L:i:,,ii:,:.  v\n                   ,1:....iBBB:.,;7.\n                  7BL:.....rJi   BB:\n                   5ZUJL7i:.   :..7:\n                    :1Z8FULLii:;::rY,\n                    .. :jP0NNX52u::\n                    rv:.,iiriri7r\n                    riiii.. . .:::.\n                    JF::r, ....7:..\n                    .7L77.......,:\n                      7k:......:;.\n                      2j:.. . .,\n                      kv,,::ii::\n                     :0: .:Fqv:,.\n                     NY. .r0Ji..\n                    YX: ..Y0Fr:.\n                    N2, .: qj7:,\n                    .Lr:7:  rii.\n                      ...", "                  .Y.\n                  XBBO:\n                  :vEBBB1. . . .YBBZ\n                  ,7 LBMU.... ..8BUr\n                   r ,i:.. ..:,.  :.\n                    7:i,,rkUJ,:.r7,\n                   Yi,.,.7BBM   NBP\n                  E5:.....,.  ., ir:.\n                 .u02UUjii:,..:i.:JL.\n                   ,YXSFPSF1UYuJu;,\n                      ,:JUUF2SJ;,\n                     ,v,,.,...,:r:\n                     51i::.... :::.\n                     .L7L;,....,:..\n                       Evi......:i\n                      u2r,. ...,:\n                     :MU::.,..,.\n                      0Y: ,Lji;.\n                     ,EL.  7U;,.\n                    .UL:. ,1J:.\n                    LF:. .5MLi:\n                    :2UL77:ivi:\n                       .", "                    BBB:\n                   .FMBBB7.        JBB\n                    j.uBBBN.,....UBBBX\n                    Y  7Li,...    j7r,\n                     7:i:.. ..,..   ,\n                    r7:::::ri:::,:i:\n                   uk,....7BBB,..jBB.\n                  vB2r::,,.rY,   .LYi.\n                   iPqEXPUL:. .i;.:i.\n                      i1vkEZqqSP27.\n                      ;. .;r77v7i\n                     jL:::..   ::,\n                     .SYLr, ...::..\n                      .Pvi......,:\n                     :2ji:. ...ir\n                    N0XJ::....,.\n                    i10Ji..iJri\n                      SUi. :ur:.\n                     rjr:  iU:.\n                    Lqi. .YMUr:\n                    :FULvv::r:.", "                        0B.\n                       .BBBv\n                       :iUBBBi       vi\n                       r. FOBY:., .2BB0\n                      ,0,.ii.,.... .rU\n                      GYiii::....,,  .\n                     7EY:,,:.iqE1:,,;.\n                     Sqr,....,8BM  7B7\n                     7GJi;::,,..  ..2:\n                      .JGZNF2vr::iji.\n                       .iLuF5NXqFNu:\n                      .     .:i:.\n                     7Lri::r.. .:\n                      .517i... :Br.\n                      :17i.....:2J\n                    rXkur:. ...\n                    rGFF;:.. .,\n                     .Xui..;Urr.\n                      SU:  :NUi,\n                     Lji. .vkL:\n                    L5:. .rOFL;:\n                    :q577L. .:,\n                       .", "                        ,BY\n                        7BB0\n                        riBBBU.    .r,\n                        L :EM1:,. .EBU\n                       i5:.i::.. .  :\n                      :8Li:::,::7i:,.\n                      NEUi...,.2BB,.Yq\n                      v0Y:......7:  JG\n                       5PJvv7;::.  ::.\n                        LXEqXUULvrLJ7\n                          ,7LUF0jY;,\n                      Y7  .::,::.  :\n                       7r. ,,. ..iBX\n                      .rkJr.. . :L2,\n                    .jUjiirv:...Uj\n                    70JUr:. ...\n                     vkSri.. .,\n                      SYi..rSLr,\n                     :07.  v0Ur:\n                    .Y7,. :SNYr::\n                    UJ:. .:0qXjY;\n                    rkUr;r\n                       :..", "                        BB7\n                        2BBB:      :,\n                        7.OBBL:.. iBB\n                        J .jri,... .:\n                       JS:::;::,::,..\n                      :Mur,,,:.LBB;.LE\n                      28Xv:....,Y1. ;M\n                       XNL:::i::.  .:,\n                        uZX21JY77r7Lu,\n                         i:rJkFE05u7.\n                       j:   ,:iir\n                       7i .Uvi....78.\n                      .i1:.ir....:Y;\n                    ,YYLLr .....,Yi\n                    S5vL77:.....\n                    .2XF7i:.....\n                      Uj;..,u7r.\n                     .UL:. iEqr:.\n                    .L7:. .i8FLirL:\n                    1J:. ,. PBS2L:\n                    :ES77v.  ri.\n                       ..", "                       :\n                      ,BB1         ..\n                       uBBBB7 ..  ZBM\n                       r YBBY:... ,ir\n                       :: i::,,.,....\n                       XL::i::iBBq..NX\n                      rOj:,.,.:UBJ  LG.\n                      :B5r.,.,...  :,,.\n                       7GJ77Lrr:i:i7Ui\n                        ;SjUSqSq0P2Ui\n                       :,   :r77ji\n                       Y, .7r7:,., Uj\n                       :J..uUr:...7ui\n                     LY7Y: ......iL:\n                    XY7YYr,.......\n                    YSu2rr:,.. .\n                      7Y7:,.:ri:\n                      ;Yi:  :Ou7,\n                     r7::...1q17i..\n                    7Pi, ., kBXUjUr\n                    .UUJYL:  i;i:.", "                      Mq.\n                      BBBBi       .2B:\n                      7iMBBBi.,.. UBBi\n                      :. uur,.....  :.\n                       v.:i,,,ii:::.i\n                      ,Xi:::,7BBB. iBB\n                      uSi.....rJ:  .rv.\n                      Mqi,,i::.. .,i.r:\n                      :kEkXkuLvrrrjUL.\n                        .Y1kFPXZNJi,\n                       .  .,iii:7. :j\n                      :7  :Lri...,rM8.\n                       ii  :i,....ir:\n                       i17. ,....iji\n                     :XLjJLi:......\n                     ;0uFYi:.. ..\n                      .1Ur:..7Lri\n                      :L7i.  S0ui:\n                    .Yr::...iXqYr,\n                    :Br, .:.iBONJLL.\n                     ,Jvrr    :rri.", "                      ,BX\n                      iBBBY\n                      iiYBBB7...  .vB5\n                      .: rEJi.... :BBX\n                       L.i:,.....:. ,,\n                      YJi,:,,vBMY.,:r\n                     .0L,....iGB7  uBi\n                     UG7:,::,..   :.ri\n                      uOSkUjri:,.:i::7\n                       .vUPXqXSUFUSY:\n                         :iYLjY1v:\n                       .Li:::....,\n                       i   ... . iBX.\n                      .7:,:ir.....ZB;\n                       .jqU7:....\n                       7jSJ:, ....\n                      .MYkLi.,..,,\n                        52r. ,1jv:\n                       :uJ:. .2P7i.\n                     ,Fr:,..,7N27:.\n                     ,qr..,:.0ONuY7,\n                       ir7i   .:;::", "                       :\n                      iBBi\n                      r5BBG.\n                      7.rBBBi..    ,L.\n                      :. Lji:.... YBBY\n                      L7:i:,....,, ,J\n                     7q:,,:,iOM5:,,..\n                    iMv:....,PBq  rB7\n                    rMui;i::,..  .,XL\n                     i0MZNjLi:...;.,7.\n                       :YUNP0kFuUu7i.\n                         .YuYuLYjJ.\n                       77::,..  ::,.\n                      :Yr:.,.....:.i\n                      .Y1;ii. ....7:\n                       :Y5vr,....,.\n                        ,Pji,.. ..\n                       .GqJi,.::,i.\n                        ikU:. vNYr:\n                         X2:  ,XY7,\n                       .UYi.  717i.\n                       F2:. .78EUYr.\n                       :2j7rY  .:i:\n                          ..", "                       BB:\n                      ,XBBF\n                      r:rBBB:\n                      ,. JkJi...  iqM.\n                      77:i:.......:BB.\n                     vq::,:.iNFr:,  :\n                    rE7,....:BBM .rP\n                    jE7i:::,,.,   7Bi\n                     u8Z5U7r:,...i :,\n                      :Jqkk1SuLr7rrL:\n                         ;XX5k5kF1:\n                      .:.:i:,...i,.\n                      ru:,.. . .::.:\n                      :YU7i,......7,\n                       :2j;i,....,,\n                         uji:.. ..\n                        .qF;:.,:,i:\n                        iNNYi..US7r\n                          S1i. ,jYi.\n                         :2Li  .Yr,\n                        iu::  :PSJ7:\n                        :MSrii7.,::\n                         .,ii:", "                      .Bi\n                      7BBF\n                      irBBBr\n                      r iBB8i,.  .SM:\n                      L,.r:,.. . .ZB:\n                     uSi:::,:ii,:. .\n                    ;MY:.,.,,BBB,.i;\n                    1Pr,.....:2i  UB.\n                    .O5Lr7ii:,   :.7.\n                     .qOZXUYYr::iri:.\n                       .:uNENZPXSF,\n                        . vL7::ir:.\n                      .k7  ,.   ::..\n                      7Si:.,. ....i:\n                       iUU:::.....i\n                        .7Uii......\n                         vNL:,.,.:i\n                        JPkFr:.iFL7,\n                        .YFk7: .r27i\n                         .jL7,  i7i\n                        :j:,...LSjr.\n                        ,8Svrr7....\n                           ,::", "                       .BL\n                       :BBZ\n                       ::GBBu.\n                       ,. ZMX:,.. ,BZ\n                       r;.::,,.....J1\n                      YX7::::,r0S:,.\n                     :OF7:....:MB7 :B\n                     ,Gu;,,::,,,.  ,M:\n                      rMuLrrii::..,:,.\n                       iOEP5F122JvuJi\n                         .;XFFkPFPJ,\n                        :i:i..:..:,\n                       .Zi:. ,.. i:..\n                       .u...:....ivii\n                        :Y7L;:......\n                         LZYi:... .\n                        ju5ui:.,.,i.\n                        qFkF7:.:SjLi.\n                         ,uS7:  rkY7.\n                          77r.  ;Yr.\n                        :ki,. .Lkur.\n                        .ZqYrr7 .,:\n                           .,,", "                       .\n                      YBB.\n                      .qBBBj.     iU\n                       r.PBB7:,.. YB,\n                       :..;i:::i:,..\n                       vY::::,iBB0..Zi\n                      ,Mji.,...:2i  UM\n                      LMFr:.:::,. .,:,,\n                       PGUiiiiirrr;7JL.\n                        LGE2kSPqENOZj\n                          LUYJYjJj,\n                            ,::,,,. NY\n                        ::   ... . 1B8\n                        i7r;r:i:,  SB7\n                         .F0uvi....::\n                        i5k2r:. ...\n                        YZFSr:.,..:.\n                         :kS7,.:XJvi.\n                          L2r, .20Li.\n                         iv;:  :NS7:,\n                        YU:, ..J0NUU7.\n                        ,PPL77:\n                           ,:,", "                       i\n                      :BBM:       ,BM\n                       vPBBBE:,.. :SE\n                       ,:.SE7:,...  .\n                        r ,i:::78Xr.,BY\n                        Sv,:,,.rGBr  j0\n                       .BUi.......  ,..i\n                        E87:,iii::::iLL.\n                         10uUJJJ5FPN0U,\n                          :2;Luk2UF7\n                         .:   ,::,:,  2i\n                         rL. ,7r,...:UZi\n                          iJ: .i. . :7i\n                         i75Y;......ri\n                        jqY5Lrr.....\n                        ,XPXLi,.....\n                          U17,..jvr,\n                          YJi. .5qr:\n                         rr:. .:GXjiir,\n                        YFi, .. XMGXYi\n                        .2qYLLi  ..\n                             .", "                       :qr          iu\n                       :BBBOL:. .  iBB,\n                        r7GBBE:,.. . ,\n                        ., r7::.:::,,:Y\n                         7::::::FBBr .BB\n                         XY:..,.:LL  ..,i\n                         MXr...:,,...::rr\n                         LMjrr77ri77Y2EL\n                          .q512NSN081r.\n                          ..  .:;ir7:  .\n                         .u. ,rri:..,:YE.\n                          :7..2jr,. .iYi\n                         ,iU: .:....,Li\n                        J5LYJi:......\n                        kSY1Y7:,.. .\n                         i1jvi,.:rr:\n                          ,7;i.  X1r,\n                        .;r::.  iPX7:..\n                        r8Li....PB8XUU:\n                         iLJjY7  .i:,", "                       LB1          .U:\n                       iBBBBqi. . ..BBM\n                        7:NBB1:..... ,,\n                        :. r;,,,iri,,:Y\n                         vi:::,iBBB. iBB\n                         FL,....:L:  ,.:;\n                        .BY:.:::,. ..i:;Y.\n                        ,00YYLLvLvLLj5Nr\n                          :XNNqNqZE8Ui\n                            .,iii:;r, iF\n                         r:  i;7i,...;1j\n                         :L .rPYi....:v:\n                          :r  :;.....r:\n                          r17i7,.....\n                         UGUP1i:.. ..\n                         .2qJ7i..rLri\n                          .vii.  j81r:\n                        :7i::.. :105L,\n                        7Bu;..,.LBM0j7r\n                         .r7jJ:   :ii:.", "                        BB8,\n                        uGBBBS,.    .ZBB\n                        Y.iMB0i.... .2BY\n                         : ii,...,.:.  ,\n                         ir::,:JBBY..rBY\n                         U:....iPB:  ,MB\n                       .OU:.,,,..   i. .7.\n                        JM212u7r:i::ir;vr\n                         .JFNkPPNXqPXUi\n                            iv7LvJYv. iq\n                          :i::i:.....:BBi\n                         ii  rFL.  . i7Y.\n                         .U: .Yi.... Y8r\n                          .u7.::.....,,\n                            55r,. . .\n                           ,Mq7:.:,,::\n                            kL:. LEu7:\n                          :7r:   2qS7i.\n                         Ur:. ..rZq5r:\n                        .BJ, ,:  50OULr\n                          7rYi     ,:i.", "                          .\n                         BBB.\n                         YMBBOr         ,\n                         Y vBBBr.... ,BBB7\n                         :. Li,.. ... LS2\n                          7i::.:r7:::,  ,\n                         7r.,.,rBBB...OM\n                       .Xk:.....:7.   FBi\n                        N0JLJ7;::   i, .r.\n                         7qBO022JLr;r77YY.\n                            :7NEZNqSF7,\n                           ,:,:i:::::.\n                          :X5u7.  . .rBB:\n                          7:.J5: ... ;OBr\n                          :Yirv:.....\n                           .vYr:......\n                            :Pr,.   .,\n                            7k:,,irL7i\n                           .Gr. ,58qY:.\n                          :OJ, .,XX2r:.\n                          ML. .:.5Mur:.\n                          LL,,ir  U0Jri\n                           :rri     ii,", "                         .\n                         BBq\n                         UBBB0:         r\n                        .7.XBBM:.,.. iBBB;\n                         7 .Li....... U2J\n                         :r:i:.,,:.:,.  :\n                         u:,,,,jBBF..:01\n                       :qj,....:Uq:  ,BB.\n                       iB2rrri:,.   i  :r.\n                        .5GBEXUYvri;;iiYi\n                           :rJEEZqP51U:\n                             :rrii::i:..\n                           qZL:     ,vi..\n                           YUFY. ....1,.i\n                           .iv7......iri:\n                            75r,......\n                            :kL:,.. ...\n                            .0i,,irjr:,\n                            r5. .iNP7.,\n                            F1...v0Sr:.\n                           ,M7,.,,PZUr,\n                           :MY..:  FU7;,\n                            :vrir   .:."];

let danceTimer = null;
let perfectClearTimer = null;

function stopDanceInterval() {
  if (danceTimer) {
    clearInterval(danceTimer);
    danceTimer = null;
  }
}

function stopDance() {
  stopDanceInterval();
  if (perfectClearTimer) {
    clearTimeout(perfectClearTimer);
    perfectClearTimer = null;
  }
}

function startAsciiDance(targets) {
  const nodes = (Array.isArray(targets) ? targets : [targets])
    .map((el) => (typeof el === "string" ? $(el) : el))
    .filter(Boolean);
  if (!nodes.length) return;

  let frame = 0;
  const paint = () => {
    const art = DANCE_FRAMES[frame % DANCE_FRAMES.length];
    nodes.forEach((node) => { node.textContent = art; });
    frame += 1;
  };
  paint();
  stopDanceInterval();
  danceTimer = setInterval(paint, 100);
}

function verdictFor(pct) {
  if (pct >= 100) return "Auditoria perfeita";
  if (pct >= 85) return "Auditoria excelente";
  if (pct >= 70) return "Auditoria aprovada";
  if (pct >= 50) return "Auditoria em atenção";
  return "Release bloqueado";
}

function weakSectors() {
  return characteristics
    .filter((c) => {
      const r = state.sectorResults[c.id];
      return r && r.correct < r.total;
    })
    .map((c) => c.pt);
}

const TEAM = [
  "Pedro Bossle Sandi",
  "Carla Regina Hentschel",
  "Valdomiro Rehbein Junior"
];

const PLAYTEST = [
  {
    who: "Pedro Bossle Sandi",
    date: "18/09/2026",
    what: "Partida completa nos nove setores",
    result: "Concluiu a auditoria e conferiu a pontuação no relatório."
  },
  {
    who: "Carla Regina Hentschel",
    date: "19/09/2026",
    what: "Impressão do relatório em PDF",
    result: "O PDF trouxe os 3 jogadores e este registro de teste."
  },
  {
    who: "Valdomiro Rehbein Junior",
    date: "20/09/2026",
    what: "Setor de Compatibilidade em duas partidas",
    result: "As questões sorteadas não se repetiram iguais nas duas rodadas."
  }
];

function buildFinalReportHtml({ pct, weak, stageTotal, verdict, issuedAt, perfect, reviewEnabled }) {
  const seals = characteristics.map((c) => {
    const r = state.sectorResults[c.id] || { correct: 0, total: questionsPerStage };
    const cls = r.correct === questionsPerStage ? "done" : r.correct === 0 ? "weak" : "";
    return `
      <div class="seal ${cls}">
        <strong>${c.pt}</strong>
        <span>${r.correct}/${r.total} acertos</span>
      </div>`;
  }).join("");

  const review = state.wrongAnswers.length
    ? state.wrongAnswers.map((w, i) => `
        <div class="review-item">
          <strong>${i + 1}. ${escapeHtml(w.context)}</strong>
          <div>${escapeHtml(w.prompt)}</div>
          <div class="muted">Sua resposta: ${escapeHtml(w.chosen)}</div>
          <div class="ans">Correta: ${escapeHtml(w.correct)}</div>
          <div style="margin-top:6px">${escapeHtml(w.explanation)}</div>
        </div>`).join("")
    : `<p class="muted">Nenhum erro registrado — auditoria limpa.</p>`;

  const congrats = perfect ? `
    <div class="perfect-banner no-print" aria-label="Parabéns pela pontuação máxima">
      <pre class="ascii-dancer" id="reportDancerL" aria-hidden="true"></pre>
      <div class="perfect-banner-copy">
        <p class="perfect-banner-kicker">RECORDE LIBERADO</p>
        <h2 class="perfect-banner-title">PARABÉNS!</h2>
        <p class="perfect-banner-text">
          ${escapeHtml(state.team)}, você fechou a auditoria com
          <strong>${maxScore.toLocaleString("pt-BR")} / ${maxScore.toLocaleString("pt-BR")}</strong> pontos.
          O NEXUS-9 está liberado para produção.
        </p>
      </div>
      <pre class="ascii-dancer" id="reportDancerR" aria-hidden="true"></pre>
    </div>` : "";

  return `
    ${congrats}

    <div class="print-masthead">
      <h1>SQuaRE Quest — Relatório de Auditoria</h1>
      <p class="print-sub">ISO/IEC 25010:2023 · Qualidade e Auditoria de Tecnologia da Informação — 2026/02</p>
    </div>

    <div class="print-meta">
      <div><strong>Equipe / jogador:</strong> ${escapeHtml(state.team)}</div>
      <div><strong>Data:</strong> ${escapeHtml(issuedAt)}</div>
      <div><strong>Professora:</strong> Stefani Mano Valmini</div>
      <div><strong>Pontuação máxima:</strong> ${maxScore.toLocaleString("pt-BR")}</div>
      <div><strong>Jogadores:</strong> ${TEAM.length}</div>
    </div>

    <p class="eyebrow">Relatório final</p>
    <h1>${escapeHtml(verdict)}</h1>
    <p><strong>${escapeHtml(state.team)}</strong>, a auditoria foi concluída.</p>

    <div class="kpis">
      <div class="kpi"><b>${state.score}</b><span>pontos</span></div>
      <div class="kpi"><b>${pct}%</b><span>desempenho</span></div>
      <div class="kpi"><b>${state.bossCorrect}/${bossQuestionCount}</b><span>auditoria final</span></div>
      <div class="kpi"><b>${state.wrongAnswers.length}</b><span>erros p/ revisão</span></div>
    </div>

    ${weak.length ? `
      <div class="priority">
        <strong>Priorizar na próxima sprint:</strong>
        ${weak.map(escapeHtml).join(" · ")}
      </div>` : `
      <div class="priority">
        <strong>${perfect ? "Pontuação máxima — todos os setores impecáveis." : "Todos os setores com ao menos um acerto."}</strong>
        ${perfect ? " Celebre o release!" : " Foque em manter a cobertura nas revisões."}
      </div>`}

    <h3>Desempenho por setor</h3>
    <div class="seal-grid">${seals}</div>

    <h3>Jogadores</h3>
    <p>Participam <strong>${TEAM.length}</strong> jogadores: ${TEAM.map(escapeHtml).join(", ")}.</p>

    <h3>Registro de teste com colegas</h3>
    <table class="playtest-table">
      <thead>
        <tr>
          <th>Colega</th>
          <th>Data</th>
          <th>O que foi testado</th>
          <th>Registro</th>
        </tr>
      </thead>
      <tbody>
        ${PLAYTEST.map((row) => `
          <tr>
            <td>${escapeHtml(row.who)}</td>
            <td>${escapeHtml(row.date)}</td>
            <td>${escapeHtml(row.what)}</td>
            <td>${escapeHtml(row.result)}</td>
          </tr>`).join("")}
      </tbody>
    </table>

    <h3>O que ainda não foi verificado</h3>
    <p>
      Não foi possível testar o QR code do PDF, o Safari, o Firefox nem um celular de verdade.
    </p>

    <h3>Revisão dos diagnósticos incorretos</h3>
    <div class="review-list">${review}</div>

    ${reviewEnabled ? `
    <section class="review-form no-print" aria-label="Avaliação do jogo">
      <h3>O que achou do jogo?</h3>
      <p class="muted">Nota de 0 a 5 estrelas. Nenhuma estrela marcada vale 0.</p>
      <div class="star-rating" role="radiogroup" aria-label="Nota de 0 a 5 estrelas">
        ${[1, 2, 3, 4, 5].map((n) => `
          <button class="star-btn" type="button" role="radio" data-action="set-star" data-star="${n}" aria-checked="false" aria-label="${n} ${n === 1 ? "estrela" : "estrelas"}">☆</button>
        `).join("")}
      </div>
      <p id="starValue" class="star-value">0 de 5</p>
      <label for="reviewText">Comentário</label>
      <textarea id="reviewText" maxlength="150" rows="3" placeholder="Conte em até 150 caracteres"></textarea>
      <p class="muted"><span id="reviewCount">0</span>/150</p>
      <div class="actions">
        <button class="primary" type="button" id="btnSubmitReview" data-action="submit-review">Enviar avaliação</button>
      </div>
      <p id="reviewStatus" class="muted" role="status"></p>
    </section>` : ""}

    <div class="actions no-print">
      <button class="primary" type="button" data-action="print">&gt; IMPRIMIR / PDF</button>
      <button class="ghost" type="button" data-action="restart">&gt; JOGAR NOVAMENTE</button>
      <button class="ghost" type="button" data-action="docs">GUIA</button>
    </div>
    <p class="muted no-print" style="margin-top:14px">
      Pontuação máxima: ${maxScore.toLocaleString("pt-BR")} pontos
      (setores: ${stageTotal} × ${pointsStage} · auditoria final: ${bossQuestionCount} × ${pointsBoss}).
      Use Imprimir e escolha “Salvar como PDF”.
    </p>

    <div class="print-footer">
      Documento gerado por SQuaRE Quest · ISO/IEC 25010:2023 · ${escapeHtml(issuedAt)} ·
      Integrantes: Pedro Bossle Sandi, Carla Regina Hentschel, Valdomiro Rehbein Junior
    </div>`;
}

function revealFinalReport(ctx) {
  const overlay = $("perfectClear");
  if (overlay) {
    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden", "true");
  }

  $("finalScreen").innerHTML = buildFinalReportHtml(ctx);
  $("finalScreen").classList.add("panel");
  if (ctx.perfect) $("finalScreen").classList.add("is-perfect");
  else $("finalScreen").classList.remove("is-perfect");

  showScreen("finalScreen");
  updateHeader();
  bindReviewForm();

  if (ctx.perfect) {
    startAsciiDance(["reportDancerL", "reportDancerR"]);
    announce(`Pontuação máxima! Parabéns, ${state.team}.`);
  } else {
    stopDance();
    announce(`Auditoria concluída. ${ctx.verdict}. ${state.score} pontos.`);
  }
}

function playPerfectClearThenReport(ctx) {
  hideAllScreens();
  document.body.classList.remove("is-menu");
  document.body.classList.add("perfect-clear-active");

  const overlay = $("perfectClear");
  const dancer = $("perfectClearDancer");
  const caption = $("perfectClearCaption");
  if (!overlay || !dancer) {
    document.body.classList.remove("perfect-clear-active");
    revealFinalReport(ctx);
    return;
  }

  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
  if (caption) caption.textContent = "PONTUAÇÃO PERFEITA";
  startAsciiDance([dancer]);
  announce("Pontuação máxima. Pontuação perfeita!");

  perfectClearTimer = setTimeout(() => {
    if (caption) caption.textContent = "NEXUS-9 LIBERADO";
    perfectClearTimer = setTimeout(() => {
      document.body.classList.remove("perfect-clear-active");
      revealFinalReport(ctx);
    }, 900);
  }, 2600);
}

async function showResult() {
  state.screen = "result";
  state.inBoss = false;
  const finishedTeam = state.team;
  const finishedScore = state.score;
  clearProgress();
  syncCheatMode();
  state.reviewRating = 0;
  state.pendingReview = { team: finishedTeam, score: finishedScore, sent: false };
  try {
    await leaderboardReady;
  } catch (_) {
    /* placar indisponível */
  }

  const pct = Math.round((state.score / maxScore) * 100);
  const weak = weakSectors();
  const stageTotal = characteristics.length * questionsPerStage;
  const verdict = verdictFor(pct);
  const issuedAt = new Date().toLocaleString("pt-BR", {
    dateStyle: "long",
    timeStyle: "short"
  });
  const perfect = state.score >= maxScore;
  const ctx = {
    pct,
    weak,
    stageTotal,
    verdict,
    issuedAt,
    perfect,
    reviewEnabled: !!supabaseConfig
  };

  if (perfect) playPerfectClearThenReport(ctx);
  else revealFinalReport(ctx);
}

function quitToMenu() {
  saveProgress();
  stopDance();
  state.screen = "start";
  showScreen("startScreen");
  updateHeader();
  checkResumeBanner();
  announce("Partida pausada. Você pode continuar depois.");
}

function restart() {
  flushUnsentReview();
  stopDance();
  clearProgress();
  state.stageIndex = 0;
  state.score = 0;
  state.inBoss = false;
  state.screen = "start";
  state.wrongAnswers = [];
  state.sectorResults = {};
  state.scorePosted = false;
  state.reviewRating = 0;
  state.pendingReview = null;
  document.body.classList.remove("cheat-sysadmin", "perfect-clear-active");
  const overlay = $("perfectClear");
  if (overlay) {
    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden", "true");
  }
  const final = $("finalScreen");
  if (final) final.classList.remove("is-perfect");
  showScreen("startScreen");
  updateHeader();
  checkResumeBanner();
}

// ——— Central de documentação ———

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderDocsHomeLinks() {
  const wrap = $("docsHomeLinks");
  if (!wrap || !docsData) return;

  const teasers = {
    team: "Integrantes e professora",
    play: "Regras, fluxo e pontuação",
    readme: "LEIA-ME.txt completo",
    material: "O que o pacote contém",
    refs: "Fontes normativas"
  };

  const preferred = ["team", "play", "material", "refs", "readme"];
  const sections = preferred
    .map((id) => docsData.sections.find((s) => s.id === id))
    .filter(Boolean)
    .slice(0, 6);

  wrap.innerHTML = sections.map((s) => `
    <button class="docs-home-link" type="button" data-action="docs" data-docs-section="${s.id}">
      <span>${escapeHtml(s.icon)}</span>
      ${escapeHtml(s.label)}
      <small>${escapeHtml(teasers[s.id] || "")}</small>
    </button>`).join("");
}

function renderBlock(block) {
  switch (block.type) {
    case "lead":
      return `<p class="docs-lead">${escapeHtml(block.text)}</p>`;
    case "paragraph":
      return `<p>${escapeHtml(block.text)}</p>`;
    case "note":
      return `<p class="note">${escapeHtml(block.text)}</p>`;
    case "steps":
      return `<ol class="docs-steps">${block.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ol>`;
    case "list":
      return `<ul class="docs-list">${block.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
    case "checklist":
      return `<ul class="docs-check">${block.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
    case "kpis":
      return `<div class="kpis">${block.items.map((k) => `
        <div class="kpi"><b>${escapeHtml(k.value)}</b><span>${escapeHtml(k.label)}</span></div>`).join("")}</div>`;
    case "files":
      return `<div class="docs-files">${block.items.map((f) => `
        <div class="docs-file"><code>${escapeHtml(f.path)}</code><span>${escapeHtml(f.desc)}</span></div>`).join("")}</div>`;
    case "refs":
      return `<ul class="docs-list">${quizReferences.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
        <p class="muted">Nota: enunciados e explicações são exemplos educacionais e não reproduzem o texto integral da norma.</p>`;
    case "readme":
      return `<pre class="docs-readme" tabindex="0">${escapeHtml(readmeText || "LEIA-ME.txt indisponível.")}</pre>`;
    default:
      return "";
  }
}

function renderDocsSection(sectionId) {
  if (!docsData) return;
  activeDocsSection = sectionId || docsData.sections[0].id;
  const section = docsData.sections.find((s) => s.id === activeDocsSection) || docsData.sections[0];

  $("docsTabs").innerHTML = docsData.sections.map((s) => `
    <button class="docs-tab ${s.id === section.id ? "active" : ""}" type="button"
      data-action="docs-tab" data-docs-section="${s.id}" aria-current="${s.id === section.id ? "page" : "false"}">
      <span class="tab-num">${escapeHtml(s.icon)}</span>
      ${escapeHtml(s.label)}
    </button>`).join("");

  $("docsContent").innerHTML = `
    <p class="eyebrow">${escapeHtml(docsData.subtitle || "Pacote acadêmico")}</p>
    <h2>${escapeHtml(section.label)}</h2>
    ${section.blocks.map(renderBlock).join("")}`;
}

function openDocs(sectionId) {
  if (state.screen !== "docs") {
    state.docsReturn = state.screen;
  }
  state.screen = "docs";
  renderDocsSection(sectionId || activeDocsSection || "play");
  showScreen("docsScreen");
  announce("Central de documentação aberta.");
}

function closeDocs() {
  const back = state.docsReturn || "start";
  state.screen = back;

  if (back === "start") showScreen("startScreen");
  else if (back === "stageIntro" || back === "stageDone") showScreen("stageIntro");
  else if (back === "question" || back === "boss") showScreen("questionScreen");
  else if (back === "finalIntro") showScreen("finalIntro");
  else if (back === "result") showScreen("finalScreen");
  else showScreen("startScreen");
}

// ——— Eventos ———

function onAction(action, el) {
  switch (action) {
    case "begin-stage": beginStage(); break;
    case "next-stage": showStageIntro(); break;
    case "next": nextAfterQuestion(); break;
    case "start-boss": startBoss(); break;
    case "print": window.print(); break;
    case "restart": restart(); break;
    case "set-star": setReviewStars(Number(el && el.getAttribute("data-star"))); break;
    case "submit-review": submitReview(); break;
    case "open-board":
      openBoard();
      break;
    case "open-reviews":
      openReviews();
      break;
    case "close-lists":
      closeLists();
      break;
    case "docs":
      openDocs(el && el.getAttribute("data-docs-section"));
      break;
    case "docs-tab":
      renderDocsSection(el && el.getAttribute("data-docs-section"));
      break;
    case "docs-back":
      closeDocs();
      break;
    case "quit":
      quitToMenu();
      break;
    case "toggle-fx":
      toggleReducedFx();
      break;
    default: break;
  }
}

const THEME_KEY = "square-quest-theme";
const THEMES = ["audit", "noite", "laboratorio"];
const THEME_LABELS = {
  audit: "Auditoria",
  noite: "Noite",
  laboratorio: "Laboratório"
};

function getSavedTheme() {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return THEMES.includes(t) ? t : "audit";
  } catch (_) {
    return "audit";
  }
}

function applyTheme(theme, announceChange) {
  const next = THEMES.includes(theme) ? theme : "audit";
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (_) {
    /* storage indisponível */
  }

  document.querySelectorAll("[data-theme-set]").forEach((btn) => {
    const active = btn.getAttribute("data-theme-set") === next;
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });

  if (announceChange) announce(`Tema ${THEME_LABELS[next]} aplicado`);
}

function initTheme() {
  applyTheme(getSavedTheme(), false);
}

function bindEvents() {
  document.addEventListener("click", (e) => {
    const themeBtn = e.target.closest("[data-theme-set]");
    if (themeBtn) {
      applyTheme(themeBtn.getAttribute("data-theme-set"), true);
      return;
    }

    const actionBtn = e.target.closest("[data-action]");
    if (actionBtn) {
      onAction(actionBtn.getAttribute("data-action"), actionBtn);
      return;
    }

    const answerBtn = e.target.closest("[data-answer]");
    if (answerBtn && !state.answered) {
      answer(Number(answerBtn.getAttribute("data-answer")));
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.screen === "docs") {
      e.preventDefault();
      closeDocs();
      return;
    }
    if (e.key === "Escape" && (state.screen === "board" || state.screen === "reviews")) {
      e.preventDefault();
      closeLists();
      return;
    }

    const tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SUMMARY") return;
    if (e.target && e.target.isContentEditable) return;

    const confirmKey = e.key === "Enter" || e.key === " " || e.code === "Space";

    // Seletor / intro de setores e boss
    if (confirmKey) {
      if (state.screen === "stageIntro") {
        e.preventDefault();
        beginStage();
        return;
      }
      if (state.screen === "stageDone") {
        e.preventDefault();
        showStageIntro();
        return;
      }
      if (state.screen === "finalIntro") {
        e.preventDefault();
        startBoss();
        return;
      }
    }

    if (state.screen !== "question" && state.screen !== "boss") return;

    if (!state.answered) {
      const map = {
        "1": 0, "2": 1, "3": 2, "4": 3,
        q: 0, w: 1, e: 2, r: 3,
        a: 0, s: 1, d: 2, f: 3
      };
      const key = e.key.toLowerCase();
      if (key in map) {
        e.preventDefault();
        answer(map[key]);
      }
    } else if (confirmKey) {
      e.preventDefault();
      nextAfterQuestion();
    }
  });

  $("btnStart").addEventListener("click", startGame);
  $("btnResume").addEventListener("click", () => {
    $("resumeBanner").classList.add("hidden");
    resumeFromSave();
  });
  $("btnDiscardSave").addEventListener("click", () => {
    clearProgress();
    $("resumeBanner").classList.add("hidden");
  });
  $("teamName").addEventListener("keydown", (e) => {
    if (e.key === "Enter") startGame();
  });

  const topbar = document.querySelector(".topbar");
  const toggle = $("btnTopbarToggle");
  if (topbar && toggle) {
    toggle.addEventListener("click", () => {
      const open = topbar.classList.toggle("is-expanded");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      const expand = $("topbarExpand");
      if (expand) expand.setAttribute("aria-hidden", open ? "false" : "true");
      toggle.textContent = open ? "Fechar" : "Mapa";
    });
  }
}

// ——— Boot ———

function applyMeta(data) {
  meta = data.meta || {};
  characteristics = data.characteristics || [];
  questionBank = data.questions || [];
  bossBank = data.bossQuestions || [];
  quizReferences = data.references || [];

  storageKey = meta.storageKey || storageKey;
  questionsPerStage = meta.questionsPerStage || questionsPerStage;
  bossQuestionCount = meta.bossQuestions || bossQuestionCount;
  pointsStage = meta.pointsPerStageQuestion || pointsStage;
  pointsBoss = meta.pointsPerBossQuestion || pointsBoss;

  const stageQs = characteristics.length * questionsPerStage;
  maxScore = stageQs * pointsStage + bossQuestionCount * pointsBoss;

  if (meta.subtitle) {
    const el = $("pageSubtitle");
    if (el) el.textContent = meta.subtitle;
  }
}

function showLoadError(err) {
  const main = document.querySelector("main");
  if (!main) return;
  main.innerHTML = `
    <section class="panel">
      <h1>Não foi possível carregar o quiz</h1>
      <p>Os arquivos em <code>data/</code> precisam ser servidos via HTTP
      (GitHub Pages ou servidor local).</p>
      <p class="note">Localmente, na pasta do projeto:</p>
      <pre class="docs-readme" style="max-height:none">python -m http.server 8080</pre>
      <p>Depois abra <code>http://localhost:8080/</code></p>
      <p class="muted">${escapeHtml(err && err.message ? err.message : err)}</p>
    </section>`;
}

const ASSET_VERSION = "20261002b";

async function fetchJson(path) {
  const res = await fetch(`${assetUrl(path)}?v=${ASSET_VERSION}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar ${path}`);
  return res.json();
}

async function fetchText(path) {
  const res = await fetch(`${assetUrl(path)}?v=${ASSET_VERSION}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar ${path}`);
  return res.text();
}

// ——— Placar (Supabase). Sem banco, o jogo segue sem esta função. ———

const FX_KEY = "square-quest-fx";

let supabaseConfig = null;
let leaderboardReady = Promise.resolve();
let leaderboardRows = [];

function initReducedFx() {
  let reduced = false;
  try {
    reduced = localStorage.getItem(FX_KEY) === "reduced";
  } catch (_) {
    reduced = false;
  }
  applyReducedFx(reduced, false);
}

function applyReducedFx(reduced, announceChange) {
  document.body.classList.toggle("fx-reduced", reduced);
  try {
    localStorage.setItem(FX_KEY, reduced ? "reduced" : "full");
  } catch (_) {
    /* storage indisponível */
  }
  const btn = $("btnReduceFx");
  if (btn) {
    btn.setAttribute("aria-pressed", reduced ? "true" : "false");
    btn.textContent = reduced ? "Reduzido" : "Efeitos";
    btn.title = reduced ? "Restaurar animações de fundo" : "Reduzir animações de fundo";
  }
  if (announceChange) {
    announce(reduced ? "Animações de fundo reduzidas." : "Animações de fundo restauradas.");
  }
}

function toggleReducedFx() {
  applyReducedFx(!document.body.classList.contains("fx-reduced"), true);
}

function disableLeaderboard() {
  supabaseConfig = null;
  const box = document.querySelector(".leaderboard");
  if (box) box.classList.add("hidden");
}

function showLeaderboardBox() {
  const box = document.querySelector(".leaderboard");
  if (box) box.classList.remove("hidden");
}

function parseEnv(text) {
  const out = {};
  String(text || "").split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eq = trimmed.indexOf("=");
    if (eq < 1) return;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  });
  return out;
}

async function readEnvFile(name) {
  try {
    const res = await fetch(assetUrl(name), { cache: "no-store" });
    if (!res.ok) return {};
    return parseEnv(await res.text());
  } catch (_) {
    return {};
  }
}

async function loadSupabaseEnv() {
  const base = await readEnvFile(".env");
  const local = await readEnvFile(".env.local");
  const env = { ...base, ...local };
  const url = String(env.SUPABASE_URL || "").trim().replace(/\/$/, "");
  const key = String(env.SUPABASE_ANON_KEY || "").trim();
  if (!url || !key || url.includes("SEU-PROJETO")) return null;
  return { url, key };
}

async function supabaseRequest(path, options) {
  const res = await fetch(`${supabaseConfig.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: supabaseConfig.key,
      Authorization: `Bearer ${supabaseConfig.key}`,
      ...(options && options.headers)
    }
  });
  if (!res.ok) throw new Error(`Supabase HTTP ${res.status}`);
  return res;
}

async function queryLeaderboard() {
  const res = await supabaseRequest(
    "square_leaderboard?select=team,played_at,score,rating,comment&order=score.desc,played_at.asc",
    { headers: { Accept: "application/json" } }
  );
  const rows = await res.json();
  return Array.isArray(rows) ? rows : [];
}

function formatPlayedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function listShell(kicker, title, body) {
  return `
    <p class="eyebrow">${kicker}</p>
    <h2>${title}</h2>
    ${body}
    <div class="actions">
      <button class="primary" type="button" data-action="close-lists">&gt; VOLTAR</button>
    </div>`;
}

function renderBoardList(result) {
  const host = $("boardScreen");
  if (!host) return;

  let body;
  if (!result.ok && result.reason === "off") {
    body = `<p class="muted">Placar indisponível. O jogo segue sem esta função.</p>`;
  } else if (!result.ok) {
    body = `<p class="muted">Não foi possível carregar o placar.</p>`;
  } else if (!result.rows.length) {
    body = `<p class="muted">Nenhum registro ainda.</p>`;
  } else {
    const top = result.rows.slice(0, 10);
    body = `<ol class="board-list">${top.map((row, i) => {
      const rank = String(i + 1).padStart(2, "0");
      const points = Number(row.score).toLocaleString("pt-BR");
      const when = formatPlayedAt(row.played_at);
      return `
        <li class="board-row">
          <span class="board-rank">${rank}</span>
          <div class="board-main">
            <strong>${escapeHtml(row.team)}</strong>
            <span class="muted">${escapeHtml(when)} · ${starGlyphs(row.rating)}</span>
          </div>
          <span class="board-score">${points} pts</span>
        </li>`;
    }).join("")}</ol>`;
  }

  host.innerHTML = listShell("Placar global", "Top 10", body);
}

function renderReviewsList(result) {
  const host = $("reviewsScreen");
  if (!host) return;

  let body;
  if (!result.ok && result.reason === "off") {
    body = `<p class="muted">Avaliações indisponíveis. O jogo segue sem esta função.</p>`;
  } else if (!result.ok) {
    body = `<p class="muted">Não foi possível carregar as avaliações.</p>`;
  } else {
    const reviews = result.rows
      .filter((row) => {
        const stars = Math.round(Number(row.rating) || 0);
        return stars > 0 || String(row.comment || "").trim().length > 0;
      })
      .sort((a, b) => new Date(b.played_at) - new Date(a.played_at));

    if (!reviews.length) {
      body = `<p class="muted">Nenhuma avaliação ainda.</p>`;
    } else {
      body = `<ul class="eval-list">${reviews.map((row) => {
        const note = String(row.comment || "").trim();
        const points = Number(row.score).toLocaleString("pt-BR");
        const when = formatPlayedAt(row.played_at);
        const comment = note ? `<p class="eval-comment">“${escapeHtml(note)}”</p>` : "";
        return `
          <li class="eval-card">
            <div class="eval-head">
              <strong>${escapeHtml(row.team)}</strong>
              <span class="eval-stars" aria-label="${Math.max(0, Math.min(5, Math.round(Number(row.rating) || 0)))} de 5">${starGlyphs(row.rating)}</span>
            </div>
            ${comment}
            <p class="muted">${escapeHtml(when)} · ${points} pts</p>
          </li>`;
      }).join("")}</ul>`;
    }
  }

  host.innerHTML = listShell("Avaliações", "O que acharam do jogo", body);
}

async function refreshLeaderboardRows() {
  try {
    await leaderboardReady;
  } catch (_) {
    return { ok: false, reason: "off", rows: [] };
  }
  if (!supabaseConfig) return { ok: false, reason: "off", rows: [] };

  try {
    leaderboardRows = await queryLeaderboard();
    renderLeaderboard(leaderboardRows);
    return { ok: true, rows: leaderboardRows };
  } catch (err) {
    console.error(err);
    return { ok: false, reason: "error", rows: [] };
  }
}

async function openBoard() {
  state.screen = "board";
  showScreen("boardScreen");
  updateHeader();
  const host = $("boardScreen");
  if (host) host.innerHTML = listShell("Placar global", "Top 10", `<p class="muted">Carregando placar…</p>`);
  const result = await refreshLeaderboardRows();
  if (state.screen !== "board") return;
  renderBoardList(result);
  announce("Placar global.");
}

async function openReviews() {
  state.screen = "reviews";
  showScreen("reviewsScreen");
  updateHeader();
  const host = $("reviewsScreen");
  if (host) host.innerHTML = listShell("Avaliações", "O que acharam do jogo", `<p class="muted">Carregando avaliações…</p>`);
  const result = await refreshLeaderboardRows();
  if (state.screen !== "reviews") return;
  renderReviewsList(result);
  announce("Avaliações do jogo.");
}

function closeLists() {
  state.screen = "start";
  showScreen("startScreen");
  updateHeader();
}

function pickScrollReviews(rows) {
  const groups = new Map();
  rows.forEach((row) => {
    const stars = Math.max(0, Math.min(5, Math.round(Number(row.rating) || 0)));
    const note = String(row.comment || "").trim();
    if (stars <= 0 && !note) return;
    if (!groups.has(stars)) groups.set(stars, []);
    groups.get(stars).push(row);
  });

  const picked = [];
  for (let stars = 5; stars >= 0 && picked.length < 5; stars -= 1) {
    const group = groups.get(stars) || [];
    const room = 5 - picked.length;
    const chosen = group.length <= room ? group : shuffle(group).slice(0, room);
    picked.push(...chosen);
  }
  return shuffle(picked);
}

function renderLeaderboard(rows) {
  const track = $("leaderboardTrack");
  if (!track) return;

  const picked = pickScrollReviews(rows);
  if (!picked.length) {
    track.classList.add("is-static");
    track.style.animationDuration = "";
    track.innerHTML = `<span class="leaderboard-item">Nenhuma avaliação ainda</span>`;
    return;
  }

  const html = picked.map((row) => {
    const when = formatPlayedAt(row.played_at);
    const points = Number(row.score).toLocaleString("pt-BR");
    const stars = starGlyphs(row.rating);
    const note = String(row.comment || "").trim();
    const comment = note ? ` · “${escapeHtml(note)}”` : "";
    return `<span class="leaderboard-item"><b>${escapeHtml(row.team)}</b> · ${escapeHtml(when)} · ${points} pts · ${stars}${comment}</span>`;
  }).join("");

  track.classList.remove("is-static");
  track.style.animationDuration = `${Math.max(16, picked.length * 6)}s`;
  track.innerHTML = html + html;
}

function initLeaderboard() {
  leaderboardReady = (async () => {
    const config = await loadSupabaseEnv();
    if (!config) {
      disableLeaderboard();
      return;
    }
    supabaseConfig = config;
    leaderboardRows = await queryLeaderboard();
    showLeaderboardBox();
    renderLeaderboard(leaderboardRows);
  })().catch((err) => {
    console.error(err);
    disableLeaderboard();
  });
}

function starGlyphs(rating) {
  const n = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return `${"★".repeat(n)}${"☆".repeat(5 - n)}`;
}

function readReviewComment() {
  const el = $("reviewText");
  const raw = el ? el.value : "";
  return Array.from(raw).slice(0, 150).join("").trim();
}

function bindReviewForm() {
  const text = $("reviewText");
  const count = $("reviewCount");
  if (!text || !count) return;
  const paint = () => {
    if (Array.from(text.value).length > 150) {
      text.value = Array.from(text.value).slice(0, 150).join("");
    }
    count.textContent = String(Array.from(text.value).length);
  };
  text.addEventListener("input", paint);
}

function setReviewStars(value) {
  const picked = Number.isInteger(value) ? value : 0;
  const next = state.reviewRating === picked ? 0 : Math.max(0, Math.min(5, picked));
  state.reviewRating = next;
  document.querySelectorAll("[data-star]").forEach((btn) => {
    const n = Number(btn.getAttribute("data-star"));
    const on = next > 0 && n <= next;
    btn.classList.toggle("is-on", on);
    btn.textContent = on ? "★" : "☆";
    btn.setAttribute("aria-checked", n === next ? "true" : "false");
  });
  const label = $("starValue");
  if (label) label.textContent = `${next} de 5`;
}

function flushUnsentReview() {
  const pending = state.pendingReview;
  if (!pending || pending.sent || !supabaseConfig) return;
  pending.sent = true;
  saveLeaderboardEntry(pending.team, pending.score, state.reviewRating || 0, readReviewComment());
}

async function submitReview() {
  const pending = state.pendingReview;
  const status = $("reviewStatus");
  if (!pending || pending.sent) return;
  if (!supabaseConfig) {
    if (status) status.textContent = "Placar indisponível. A avaliação não foi registrada.";
    return;
  }

  const btn = $("btnSubmitReview");
  if (btn) btn.disabled = true;
  const ok = await saveLeaderboardEntry(
    pending.team,
    pending.score,
    state.reviewRating || 0,
    readReviewComment()
  );
  if (ok) {
    pending.sent = true;
    if (status) status.textContent = "Avaliação registrada no placar.";
    const text = $("reviewText");
    if (text) text.disabled = true;
    document.querySelectorAll("[data-star]").forEach((star) => { star.disabled = true; });
    announce("Avaliação registrada.");
    return;
  }
  if (btn) btn.disabled = false;
  if (status) status.textContent = "Não foi possível registrar a avaliação.";
}

async function saveLeaderboardEntry(team, score, rating, comment) {
  try {
    await leaderboardReady;
  } catch (_) {
    return false;
  }
  if (!supabaseConfig) return false;

  const name = String(team || "").trim().slice(0, 60) || "Equipe Auditora";
  const points = Math.round(Number(score));
  const stars = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  const note = Array.from(String(comment || "")).slice(0, 150).join("").trim();
  if (!Number.isFinite(points)) return false;

  try {
    await supabaseRequest("square_leaderboard", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({ team: name, score: points, rating: stars, comment: note })
    });
    renderLeaderboard(await queryLeaderboard());
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function init() {
  try {
    const [quizData, docs, readme] = await Promise.all([
      fetchJson("data/quiz-data.json"),
      fetchJson("data/docs.json"),
      fetchText("LEIA-ME.txt").catch(() => "")
    ]);

    docsData = docs;
    readmeText = readme || "";
    applyMeta(quizData);
    initTheme();
    initReducedFx();
    initLeaderboard();
    renderDocsHomeLinks();
    bindEvents();
    updateHeader();
    checkResumeBanner();

    const params = new URLSearchParams(location.search);
    if (params.get("docs")) openDocs(params.get("docs"));
  } catch (err) {
    console.error(err);
    showLoadError(err);
  }
}

init();
