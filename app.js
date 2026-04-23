/* ============================
   Vokabeltrainer — Karteikarten
   Leitner System (7 Stages)
   ============================ */

(() => {
  'use strict';

  // ── State ──
  const MAX_STAGE = 7;
  let vocabs = []; // { id, english, german, stage }
  let direction = 'en-de'; // 'en-de', 'de-en', 'random'
  let practiceQueue = [];
  let practiceIndex = 0;
  let sessionCorrect = 0;
  let sessionWrong = 0;
  let currentDirection = 'en-de'; // resolved direction for current card

  // ── DOM References ──
  const $ = (sel) => document.querySelector(sel);
  const screens = {
    landing: $('#landing-screen'),
    dashboard: $('#dashboard-screen'),
    practice: $('#practice-screen'),
    results: $('#results-screen'),
  };

  // Landing
  const vocabFileInput = $('#vocab-file-input');
  const profileFileInput = $('#profile-file-input');

  // Dashboard
  const stagesGrid = $('#stages-grid');
  const statTotal = $('#stat-total');
  const statMastered = $('#stat-mastered');
  const statProgress = $('#stat-progress');
  const startPracticeBtn = $('#start-practice-btn');
  const exportBtn = $('#export-btn');
  const resetBtn = $('#reset-btn');
  const addMoreBtn = $('#add-more-btn');
  const addVocabFileInput = $('#add-vocab-file-input');

  // Direction
  const dirBtns = [
    { btn: $('#dir-en-de'), dir: 'en-de' },
    { btn: $('#dir-de-en'), dir: 'de-en' },
    { btn: $('#dir-random'), dir: 'random' },
  ];

  // Practice
  const backToDashboardBtn = $('#back-to-dashboard-btn');
  const practiceCounter = $('#practice-counter');
  const practiceProgressFill = $('#practice-progress-fill');
  const scoreCorrectEl = $('#score-correct');
  const scoreWrongEl = $('#score-wrong');
  const flashcard = $('#flashcard');
  const flashcardStage = $('#flashcard-stage');
  const flashcardPrompt = $('#flashcard-prompt');
  const revealArea = $('#flashcard-reveal-area');
  const revealBtn = $('#reveal-btn');
  const assessmentArea = $('#flashcard-assessment-area');
  const revealedTranslation = $('#revealed-translation');
  const markWrongBtn = $('#mark-wrong-btn');
  const markCorrectBtn = $('#mark-correct-btn');

  // Results
  const finalCorrect = $('#final-correct');
  const finalWrong = $('#final-wrong');
  const finalRate = $('#final-rate');
  const resultsAgainBtn = $('#results-again-btn');
  const resultsDashboardBtn = $('#results-dashboard-btn');

  // ── Screen Navigation ──
  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
  }

  // ── Vocab Loading ──
  function loadVocabsFromJSON(json, merge = false) {
    let data;
    try {
      data = JSON.parse(json);
    } catch {
      toast('❌ Ungültige JSON-Datei!');
      return false;
    }

    if (!Array.isArray(data) || data.length === 0) {
      toast('❌ JSON muss ein Array von Vokabeln sein!');
      return false;
    }

    const newVocabs = data.map((item, i) => {
      const en = item.English || item.english || item.en || '';
      const de = item.German || item.german || item.de || '';
      return {
        id: merge ? `v${vocabs.length + i}` : `v${i}`,
        english: en.trim(),
        german: de.trim(),
        stage: 1,
      };
    }).filter(v => v.english && v.german);

    if (newVocabs.length === 0) {
      toast('❌ Keine gültigen Vokabeln gefunden!');
      return false;
    }

    if (merge) {
      // Avoid duplicates
      const existingKeys = new Set(vocabs.map(v => `${v.english}|||${v.german}`));
      let added = 0;
      newVocabs.forEach(v => {
        const key = `${v.english}|||${v.german}`;
        if (!existingKeys.has(key)) {
          vocabs.push(v);
          existingKeys.add(key);
          added++;
        }
      });
      toast(`✅ ${added} neue Vokabeln hinzugefügt!`);
    } else {
      vocabs = newVocabs;
      toast(`✅ ${vocabs.length} Vokabeln geladen!`);
    }

    return true;
  }

  function loadProfile(json) {
    let data;
    try {
      data = JSON.parse(json);
    } catch {
      toast('❌ Ungültige Profil-Datei!');
      return false;
    }

    if (!data.vocabs || !Array.isArray(data.vocabs)) {
      toast('❌ Ungültiges Profil-Format!');
      return false;
    }

    vocabs = data.vocabs.map((v, i) => ({
      id: v.id || `v${i}`,
      english: v.english || '',
      german: v.german || '',
      stage: Math.max(1, Math.min(MAX_STAGE, v.stage || 1)),
    }));

    if (data.direction) direction = data.direction;

    toast(`✅ Profil geladen! (${vocabs.length} Vokabeln)`);
    return true;
  }

  // ── Export ──
  function exportProfile() {
    const profile = {
      version: 1,
      exportDate: new Date().toISOString(),
      direction,
      vocabs: vocabs.map(v => ({
        id: v.id,
        english: v.english,
        german: v.german,
        stage: v.stage,
      })),
    };

    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vokabeltrainer_profil_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('💾 Profil exportiert!');
  }

  // ── Dashboard Rendering ──
  function renderDashboard() {
    // Stage cards
    const stageLabels = ['Neu', 'Beginner', 'Lernend', 'Kenner', 'Fortgeschr.', 'Experte', 'Gemeistert'];
    stagesGrid.innerHTML = '';
    for (let s = 1; s <= MAX_STAGE; s++) {
      const count = vocabs.filter(v => v.stage === s).length;
      const card = document.createElement('div');
      card.className = 'stage-card';
      card.dataset.stage = s;
      card.innerHTML = `
        <div class="stage-number">Fach ${s}</div>
        <div class="stage-count">${count}</div>
        <div class="stage-label">${stageLabels[s - 1]}</div>
      `;
      stagesGrid.appendChild(card);
    }

    // Stats
    const total = vocabs.length;
    const mastered = vocabs.filter(v => v.stage === MAX_STAGE).length;
    const progress = total > 0 ? Math.round((mastered / total) * 100) : 0;
    statTotal.textContent = total;
    statMastered.textContent = mastered;
    statProgress.textContent = `${progress}%`;

    // Direction buttons
    dirBtns.forEach(({ btn, dir }) => {
      btn.classList.toggle('active', direction === dir);
    });
  }

  // ── Practice ──
  function buildPracticeQueue() {
    // Prioritize lower stages: cards in stage 1 appear more often
    // Simple approach: include all cards, shuffle, prioritize lower stages
    const pool = [...vocabs];

    // Weight by inverse stage: stage 1 has weight 7, stage 7 has weight 1
    const weighted = [];
    pool.forEach(v => {
      const weight = MAX_STAGE - v.stage + 1;
      for (let i = 0; i < weight; i++) {
        weighted.push(v);
      }
    });

    // Shuffle
    for (let i = weighted.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [weighted[i], weighted[j]] = [weighted[j], weighted[i]];
    }

    // Deduplicate (keep first occurrence, up to ~20 cards per round)
    const seen = new Set();
    practiceQueue = [];
    const maxCards = Math.min(20, vocabs.length);
    for (const v of weighted) {
      if (practiceQueue.length >= maxCards) break;
      if (!seen.has(v.id)) {
        seen.add(v.id);
        practiceQueue.push(v);
      }
    }
  }

  function startPractice() {
    if (vocabs.length === 0) {
      toast('⚠️ Keine Vokabeln geladen!');
      return;
    }

    buildPracticeQueue();
    practiceIndex = 0;
    sessionCorrect = 0;
    sessionWrong = 0;
    showScreen('practice');
    showCard();
  }

  function resolveDirection() {
    if (direction === 'random') {
      return Math.random() < 0.5 ? 'en-de' : 'de-en';
    }
    return direction;
  }

  function showCard() {
    if (practiceIndex >= practiceQueue.length) {
      showResults();
      return;
    }

    const vocab = practiceQueue[practiceIndex];
    currentDirection = resolveDirection();

    // Update header
    practiceCounter.textContent = `${practiceIndex + 1} / ${practiceQueue.length}`;
    const pct = ((practiceIndex) / practiceQueue.length) * 100;
    practiceProgressFill.style.width = `${pct}%`;
    scoreCorrectEl.textContent = `✅ ${sessionCorrect}`;
    scoreWrongEl.textContent = `❌ ${sessionWrong}`;

    // Show prompt
    flashcardStage.textContent = `Fach ${vocab.stage}`;
    flashcardStage.style.color = `var(--stage-${vocab.stage})`;

    const prompt = currentDirection === 'en-de' ? vocab.english : vocab.german;
    flashcardPrompt.textContent = prompt;

    // Reset areas
    revealArea.style.display = 'block';
    assessmentArea.style.display = 'none';

    // Re-trigger card animation
    flashcard.style.animation = 'none';
    flashcard.offsetHeight; // reflow
    flashcard.style.animation = '';
  }

  function revealTranslation() {
    const vocab = practiceQueue[practiceIndex];
    const answer = currentDirection === 'en-de' ? vocab.german : vocab.english;
    
    revealedTranslation.textContent = answer;
    
    revealArea.style.display = 'none';
    assessmentArea.style.display = 'flex';
  }

  function handleAssessment(isCorrect) {
    const vocab = practiceQueue[practiceIndex];
    const oldStage = vocab.stage;

    if (isCorrect) {
      vocab.stage = Math.min(MAX_STAGE, vocab.stage + 1);
      sessionCorrect++;
      toast(oldStage < MAX_STAGE ? `Fach ${oldStage} → ${vocab.stage} ⬆️` : `Fach ${MAX_STAGE} — Gemeistert! 🌟`);
    } else {
      vocab.stage = Math.max(1, vocab.stage - 1);
      sessionWrong++;
      toast(oldStage > 1 ? `Fach ${oldStage} → ${vocab.stage} ⬇️` : `Fach 1 — Weiter üben! 💪`);
    }

    // Update score display immediately
    scoreCorrectEl.textContent = `✅ ${sessionCorrect}`;
    scoreWrongEl.textContent = `❌ ${sessionWrong}`;

    nextCard();
  }

  function nextCard() {
    practiceIndex++;
    showCard();
  }

  function showResults() {
    const total = sessionCorrect + sessionWrong;
    const rate = total > 0 ? Math.round((sessionCorrect / total) * 100) : 0;

    finalCorrect.textContent = sessionCorrect;
    finalWrong.textContent = sessionWrong;
    finalRate.textContent = `${rate}%`;

    // Update progress bar to 100%
    practiceProgressFill.style.width = '100%';

    showScreen('results');
  }

  // ── Toast ──
  function toast(message) {
    let el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.remove('show');
    void el.offsetHeight;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2500);
  }

  // ── Confirm Dialog ──
  function confirmDialog(title, message) {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal-box">
          <h3>${title}</h3>
          <p>${message}</p>
          <div class="modal-actions">
            <button class="btn btn-secondary" id="modal-cancel">Abbrechen</button>
            <button class="btn btn-primary" id="modal-confirm">Bestätigen</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      overlay.querySelector('#modal-cancel').onclick = () => {
        overlay.remove();
        resolve(false);
      };
      overlay.querySelector('#modal-confirm').onclick = () => {
        overlay.remove();
        resolve(true);
      };
      overlay.onclick = (e) => {
        if (e.target === overlay) {
          overlay.remove();
          resolve(false);
        }
      };
    });
  }

  // ── File Reading Helper ──
  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  // ── Event Listeners ──

  // Landing: Load vocab JSON
  vocabFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await readFile(file);
    if (loadVocabsFromJSON(text)) {
      renderDashboard();
      showScreen('dashboard');
    }
    e.target.value = '';
  });

  // Landing: Load profile
  profileFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await readFile(file);
    if (loadProfile(text)) {
      renderDashboard();
      showScreen('dashboard');
    }
    e.target.value = '';
  });

  // Dashboard: Add more vocabs
  addMoreBtn.addEventListener('click', () => {
    addVocabFileInput.click();
  });

  addVocabFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await readFile(file);
    if (loadVocabsFromJSON(text, true)) {
      renderDashboard();
    }
    e.target.value = '';
  });

  // Dashboard: Export
  exportBtn.addEventListener('click', exportProfile);

  // Dashboard: Reset
  resetBtn.addEventListener('click', async () => {
    const confirmed = await confirmDialog(
      '🗑️ Alles zurücksetzen?',
      'Alle Vokabeln und Fortschritte werden gelöscht. Exportiere vorher dein Profil!'
    );
    if (confirmed) {
      vocabs = [];
      direction = 'en-de';
      showScreen('landing');
      toast('🗑️ Alles zurückgesetzt!');
    }
  });

  // Dashboard: Direction toggle
  dirBtns.forEach(({ btn, dir }) => {
    btn.addEventListener('click', () => {
      direction = dir;
      dirBtns.forEach(d => d.btn.classList.toggle('active', d.dir === direction));
    });
  });

  // Dashboard: Start practice
  startPracticeBtn.addEventListener('click', startPractice);

  // Practice: Setup Event Listeners
  revealBtn.addEventListener('click', revealTranslation);
  markCorrectBtn.addEventListener('click', () => handleAssessment(true));
  markWrongBtn.addEventListener('click', () => handleAssessment(false));

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!screens.practice.classList.contains('active')) return;
    
    // Check if modal dialog is active
    if (document.querySelector('.modal-overlay')) return;

    if (revealArea.style.display !== 'none') {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        revealTranslation();
      }
    } else if (assessmentArea.style.display !== 'none') {
      if (e.key === '1' || e.key === 'ArrowLeft') {
        e.preventDefault();
        handleAssessment(false); // wrong
      } else if (e.key === '2' || e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleAssessment(true);  // correct
      }
    }
  });

  // Practice: Back to dashboard
  backToDashboardBtn.addEventListener('click', () => {
    renderDashboard();
    showScreen('dashboard');
  });

  // Results: Again
  resultsAgainBtn.addEventListener('click', startPractice);

  // Results: Back to dashboard
  resultsDashboardBtn.addEventListener('click', () => {
    renderDashboard();
    showScreen('dashboard');
  });

})();
