/* =====================================================================
   COMPREHENSION TRACK ENGINE (comp-data.js holds the passages)
   For students who passed every QPS level. Each skill has Learn,
   Practice (8 passages) and Check (5 passages = 10 points).

   It grows with the student. Every passage is at the student's level
   (1–4) for that skill:
     • 3 right in a row (first try)      → up one level
     • 2 wrong out of the last 3          → down one level
     • Check 8+ of 10 → up one · Check 4 or less → down one
     • Going back UP to a level that was just too hard takes more:
       8 right in a row, or 9+ on a Check.
   (Simulated 10/15 against readers of known level: without that last
   rule a student spent ~40% of passages above their level; with it,
   ~18%, and a strong reader still climbs in 5–10 passages.)
   The level is kept on the student's device AND as one row per student
   on the 'qps-levels' tab of Mr. O's sheet (the same row is updated, not
   added), so a new or wiped device picks up where they left off.
   Every Practice and Check row sent to the sheet names the level.
   ===================================================================== */
(function () {
  const PRACTICE_N = 8, CHECK_N = 5, MAX_LEVEL = 4, DEFAULT_START = 2;
  const UP_STREAK = 3, UP_BACK_STREAK = 8, DOWN_WINDOW = 3, DOWN_WRONG = 2;
  const CHECK_UP = 8, CHECK_UP_BACK = 9, CHECK_DOWN = 4;
  const STORE = 'qps_comp_v1:';
  const SEEN_KEEP = 24;

  /* ---------- the level rules (pure, so they can be tested) ---------- */
  function freshSkill(start) { return { level: start, streak: 0, recent: [], seen: [], droppedFrom: 0 }; }

  // One first-try answer at the current level → the new skill state.
  function afterAnswer(sk, right) {
    const recent = [...sk.recent, right].slice(-DOWN_WINDOW);
    const streak = right ? sk.streak + 1 : 0;
    const need = sk.level + 1 === sk.droppedFrom ? UP_BACK_STREAK : UP_STREAK;
    if (streak >= need && sk.level < MAX_LEVEL) return { ...sk, level: sk.level + 1, streak: 0, recent: [], moved: 'up' };
    if (recent.filter(r => !r).length >= DOWN_WRONG && sk.level > 1) return { ...sk, level: sk.level - 1, droppedFrom: sk.level, streak: 0, recent: [], moved: 'down' };
    return { ...sk, streak, recent, moved: null };
  }

  // A finished Check (points out of 10) → the new skill state.
  function afterCheck(sk, points) {
    const need = sk.level + 1 === sk.droppedFrom ? CHECK_UP_BACK : CHECK_UP;
    if (points >= need && sk.level < MAX_LEVEL) return { ...sk, level: sk.level + 1, streak: 0, recent: [], moved: 'up' };
    if (points <= CHECK_DOWN && sk.level > 1) return { ...sk, level: sk.level - 1, droppedFrom: sk.level, streak: 0, recent: [], moved: 'down' };
    return { ...sk, moved: null };
  }

  /* ---------- per-student state ---------- */
  const who = () => window.QPS_STUDENT || '';
  const startLevel = (name) => (typeof COMP_START_LEVEL !== 'undefined' && COMP_START_LEVEL[name]) || DEFAULT_START;
  function load(name) {
    try { return JSON.parse(localStorage.getItem(STORE + name)) || null; } catch (e) { return null; }
  }
  function save(name, st) { try { localStorage.setItem(STORE + name, JSON.stringify(st)); } catch (e) { /* private window */ } }
  function stateFor(name) { return load(name) || { skills: {}, t: 0 }; }
  function skillState(name, id) { return stateFor(name).skills[id] || freshSkill(startLevel(name)); }
  function putSkill(name, id, sk) {
    const st = stateFor(name);
    const { moved, ...keep } = sk;
    save(name, { ...st, skills: { ...st.skills, [id]: keep }, t: Date.now() });
  }
  function levelOf(name, id) { return skillState(name, id).level; }

  // Backup row on the sheet: form = "context=3;main=2|t=1760500000000"
  function backupLevels(name) {
    if (!window.QPSLogin) return;
    const st = stateFor(name);
    const form = Object.entries(st.skills).map(([k, v]) => `${k}=${v.level}`).join(';') + `|t=${st.t || Date.now()}`;
    QPSLogin.send({
      game: 'qps-levels', sessionId: 'lvl-' + name.replace(/[^A-Za-z0-9]+/g, '-'),
      form, score: 0, correct: 0, total: 0, maxScore: 0, percent: 0, done: false,
      elapsed: 0, tabSwitches: 0, wrongQuestions: ''
    });
  }

  // A device with nothing saved reads the backup row back from the sheet.
  async function restore(name) {
    if (!name || load(name) || !window.QPSLogin || !QPSLogin.readTab) return false;
    const rows = await QPSLogin.readTab('qps-levels');
    const row = (rows || []).find(r => r.name === name);
    if (!row || !row.form || load(name)) return false;
    const [pairs, t] = String(row.form).split('|t=');
    const skills = {};
    pairs.split(';').forEach(p => {
      const [k, v] = p.split('=');
      const lv = Number(v);
      if (k && lv >= 1 && lv <= MAX_LEVEL) skills[k] = freshSkill(lv);
    });
    if (!Object.keys(skills).length) return false;
    save(name, { skills, t: Number(t) || Date.now() });
    return true;
  }

  /* ---------- small helpers ---------- */
  const $ = (id) => document.getElementById(id);
  const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  function btn(cls, text, onClick, label) { const b = el('button', cls, text); b.type = 'button'; if (label) b.setAttribute('aria-label', label); b.onclick = onClick; return b; }
  const skillById = (id) => COMP_SKILLS.find(s => s.id === id);
  const plain = (passage) => passage.replace(/\*/g, '');
  const targetWord = (item) => (/\*([^*]+)\*/.exec(item.passage) || [])[1] || '';

  /* ---------- read aloud: a speaker on the left of every block, words lit as they are read ---------- */
  function stopSpeaking() {
    if (window.QPSRead) QPSRead.stop();
    else if (window.speechSynthesis) speechSynthesis.cancel();
  }
  // Words wrapped in spans (with their place in the spoken text) so the voice can light them.
  function wordsInto(host, text, markWord) {
    let pos = 0;
    const parts = text.split(/(\*[^*]+\*)/);
    parts.forEach(part => {
      const isTarget = /^\*[^*]+\*$/.test(part);
      const t = isTarget ? part.slice(1, -1) : part;
      const wrap = isTarget && markWord ? el('mark', 'c-target') : null;
      t.split(/(\s+)/).forEach(tok => {
        if (!tok) return;
        if (/^\s+$/.test(tok)) { (wrap || host).append(document.createTextNode(tok)); pos += tok.length; return; }
        const w = el('span', 'c-w', tok);
        w.dataset.at = pos;
        (wrap || host).append(w);
        pos += tok.length;
      });
      if (wrap) host.append(wrap);
    });
  }
  // The shared reader (readaloud.js) lights each word, on voices with or without word events.
  function speak(host) {
    if (window.QPSRead) { QPSRead.say(host); return; }
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    speechSynthesis.speak(new SpeechSynthesisUtterance(host.dataset.say));
  }
  // A speaker icon is a span (it can sit inside an answer button); its tap never answers.
  function speaker(host, label) {
    const s = el('span', 'c-say', '🔊');
    s.setAttribute('role', 'button');
    s.setAttribute('tabindex', '0');
    s.setAttribute('aria-label', label || 'Hear this');
    const go = (e) => { e.preventDefault(); e.stopPropagation(); speak(host); };
    s.addEventListener('click', go);
    s.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') go(e); });
    return s;
  }
  // A readable block: speaker, then the words.
  function block(tag, cls, text, opts = {}) {
    const row = el(tag, 'c-block ' + (cls || ''));
    const words = el('span', 'c-words');
    words.dataset.say = plain(text);
    wordsInto(words, text, opts.mark);
    row.append(speaker(words, opts.label), words);
    return row;
  }
  // An answer button: speaker + words; tapping the words answers.
  function choice(text, onPick) {
    const b = el('button', 'c-choice');
    b.type = 'button';
    const words = el('span', 'c-words');
    words.dataset.say = text;
    wordsInto(words, text, false);
    b.append(speaker(words, 'Hear this answer'), words);
    b.onclick = () => onPick(b);
    return b;
  }

  /* ---------- screens ---------- */
  let skill = null;
  function show() {
    ['welcomeView', 'appView', 'practiceView', 'loginView'].forEach(id => { const e = $(id); if (e) e.style.display = 'none'; });
    $('compView').style.display = 'block';
    window.scrollTo(0, 0);
  }
  function backToPlan() {
    stopSpeaking();
    $('compView').style.display = 'none';
    $('welcomeView').style.display = 'block';
    document.title = 'QPS Literacy Hub';
    if (window.QPSLogin) QPSLogin.renderPlan();
    window.scrollTo(0, 0);
  }
  function header(area, title) {
    const top = el('div', 'practice-top');
    top.append(btn('home-btn', '⬅️ My plan', backToPlan, 'Back to my plan'), el('h1', 'practice-title', title));
    area.append(top);
  }
  function levelDots(level) {
    const d = el('div', 'c-level');
    d.setAttribute('aria-label', `Level ${level} of ${MAX_LEVEL}`);
    d.append(el('span', 'c-level-label', `Level ${level}`));
    for (let i = 1; i <= MAX_LEVEL; i++) d.append(el('span', 'c-level-dot' + (i <= level ? ' on' : '')));
    return d;
  }

  function open(id) {
    skill = skillById(id);
    if (!skill) return;
    stopSpeaking();
    const area = $('compView');
    area.innerHTML = '';
    document.title = `QPS Literacy Hub | ${skill.name}`;
    header(area, `${skill.icon} ${skill.name}`);
    const lv = levelOf(who(), skill.id);
    area.append(levelDots(lv));
    area.append(block('p', 'c-lead', 'Pick what to do. Start with Learn the first time.'));
    const menu = el('div', 'c-menu');
    menu.append(
      btn('c-menu-btn learn', '📘 Learn', () => learn()),
      btn('c-menu-btn practice', `✏️ Practice · ${PRACTICE_N} passages`, () => run('practice')),
      btn('c-menu-btn check', `⭐ Check · ${CHECK_N} passages`, () => run('check'))
    );
    area.append(menu);
    show();
  }

  function learn() {
    stopSpeaking();
    const area = $('compView');
    area.innerHTML = '';
    header(area, `${skill.icon} Learn: ${skill.name}`);
    const box = el('div', 'c-card');
    skill.learn.forEach(t => box.append(block('p', 'c-learn', t)));
    area.append(box);
    const foot = el('div', 'practice-foot');
    foot.append(btn('p-btn p-next', 'Next ➡️', () => open(skill.id)));
    area.append(foot);
    show();
  }

  // Pick the next passage at this level, oldest-seen first.
  function nextItem(sk, used) {
    const pool = skill.levels[sk.level] || [];
    const fresh = pool.filter(it => !sk.seen.includes(it.id) && !used.has(it.id));
    const pick = fresh.length ? shuffle(fresh)[0]
      : [...pool].filter(it => !used.has(it.id)).sort((a, b) => sk.seen.indexOf(a.id) - sk.seen.indexOf(b.id))[0] || pool[0];
    return pick;
  }

  function run(mode) {
    stopSpeaking();
    const name = who();
    const graded = mode === 'check';
    const n = graded ? CHECK_N : PRACTICE_N;
    let sk = skillState(name, skill.id);
    const startLv = sk.level;
    const used = new Set();
    const missed = [];
    const started = new Date();
    let i = 0, points = 0, firstTryRight = 0, peak = startLv;

    const area = $('compView');
    const step = () => {
      area.innerHTML = '';
      header(area, `${skill.icon} ${graded ? 'Check' : 'Practice'}: ${skill.name}`);
      if (i >= n) return finish();
      const top = el('div', 'c-row');
      const dots = el('div', 'p-dots');
      dots.setAttribute('aria-label', `${i} of ${n}`);
      for (let k = 0; k < n; k++) dots.append(el('span', k < i ? 'on' : ''));
      top.append(dots, levelDots(sk.level));
      area.append(top);
      if (graded && i === 0) area.append(block('p', 'c-lead', 'This is the Check. Do your best. You will see how you did at the end.'));

      const item = nextItem(sk, used);
      used.add(item.id);
      const word = targetWord(item);
      const card = el('div', 'c-card');
      const passage = block('p', 'c-passage', item.passage, { mark: true, label: 'Hear the passage' });
      card.append(passage);
      area.append(card);

      const q = el('div', 'c-q');
      area.append(q);
      const fb = el('div', 'p-feedback');
      fb.setAttribute('aria-live', 'polite');

      // Part 1: what the word means
      q.append(block('p', 'c-ask', `What does *${word}* mean in this passage?`, { mark: true, label: 'Hear the question' }));
      const opts = el('div', 'c-choices');
      let tries = 0, firstRight = null;
      shuffle(item.choices).forEach(text => {
        opts.append(choice(text, (b) => {
          if (b.disabled) return;
          const right = text === item.choices[0];
          tries++;
          if (firstRight === null) firstRight = right;
          if (graded) {
            b.classList.add('picked');
            lock(opts);
            if (right) points++; else missed.push(`[${item.id}] ${word} (picked: ${text})`);
            return partTwo();
          }
          if (right) {
            b.classList.add('right'); lock(opts);
            fb.textContent = tries === 1 ? '✅ Yes!' : '✅ Yes, you got it.';
            return partTwo();
          }
          b.classList.add('wrong'); b.disabled = true;
          if (tries === 1) {
            fb.textContent = 'Not quite. Read the words around it again. Try one more time.';
            markClue(passage, item.clues[0]);
          } else {
            lock(opts);
            [...opts.children].forEach(c => { if (c.querySelector('.c-words').dataset.say === item.choices[0]) c.classList.add('right'); });
            fb.textContent = `It means "${item.choices[0]}."`;
            missed.push(`[${item.id}] ${word} (picked: ${text})`);
            partTwo();
          }
        }));
      });
      q.append(opts, fb);

      // Part 2: which words showed it (the evidence)
      const partTwo = () => {
        const right1 = firstRight === true;
        if (!graded) {
          if (right1) firstTryRight++;
          const before = sk.level;
          sk = afterAnswer({ ...sk, seen: [...sk.seen.filter(x => x !== item.id), item.id].slice(-SEEN_KEEP) }, right1);
          peak = Math.max(peak, sk.level);
          putSkill(name, skill.id, sk);
          if (sk.level !== before) backupLevels(name);
        } else {
          sk = { ...sk, seen: [...sk.seen.filter(x => x !== item.id), item.id].slice(-SEEN_KEEP) };
          putSkill(name, skill.id, sk);
        }
        const q2 = el('div', 'c-q');
        q2.append(block('p', 'c-ask', `Which words in the passage helped you know what *${word}* means?`, { mark: true, label: 'Hear the question' }));
        const opts2 = el('div', 'c-choices');
        const fb2 = el('div', 'p-feedback');
        fb2.setAttribute('aria-live', 'polite');
        shuffle(item.clues).forEach(text => {
          opts2.append(choice(text, (b) => {
            if (b.disabled) return;
            const right = text === item.clues[0];
            lock(opts2);
            if (graded) {
              b.classList.add('picked');
              if (right) points++; else missed.push(`[${item.id}] clue for ${word} (picked: ${text})`);
            } else {
              b.classList.add(right ? 'right' : 'wrong');
              if (!right) [...opts2.children].forEach(c => { if (c.querySelector('.c-words').dataset.say === item.clues[0]) c.classList.add('right'); });
              fb2.textContent = right ? '✅ Those are the clue words!' : `The best clue is "${item.clues[0]}."`;
              markClue(passage, item.clues[0]);
              if (sk.moved === 'up') fb2.textContent += ' ⭐ Level up! The next passages will be harder.';
              if (sk.moved === 'down') fb2.textContent += ' Next, a passage at a new level.';
            }
            const foot = el('div', 'practice-foot');
            foot.append(btn('p-btn p-next', i + 1 >= n ? 'Finish ➡️' : 'Next ➡️', () => { i++; step(); }));
            area.append(foot);
            foot.querySelector('button').focus();
          }));
        });
        q2.append(opts2, fb2);
        area.append(q2);
        q2.querySelector('.c-ask').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      };
      window.scrollTo(0, 0);
    };

    const finish = () => {
      const finished = new Date();
      const before = sk.level;
      let total, score;
      if (graded) {
        total = CHECK_N * 2; score = points;
        sk = afterCheck(sk, points);
        putSkill(name, skill.id, sk);
      } else {
        total = n; score = firstTryRight;
      }
      backupLevels(name);
      const pct = Math.round((score / total) * 100);
      if (window.QPSLogin) QPSLogin.send({
        game: 'qps-c-' + skill.id,
        sessionId: `qps-c-${skill.id}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        form: graded ? `Check · Level ${before}${sk.level !== before ? ' → ' + sk.level : ''}`
                     : `Practice · Level ${startLv}${sk.level !== startLv ? ' → ' + sk.level : ''}${peak > Math.max(startLv, sk.level) ? ` (tried ${peak})` : ''}`,
        score, correct: score, total, maxScore: total, percent: pct, done: true,
        elapsed: Math.round((finished - started) / 1000), tabSwitches: 0,
        wrongQuestions: missed.join(' | '),
        startedAt: started.toISOString(), finishedAt: finished.toISOString()
      });

      const box = el('div', 'p-round');
      box.append(el('div', 'p-score', graded ? `${score} of ${total}` : `${score} of ${total} right on the first try`));
      if (graded) {
        const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : 1;
        box.append(el('div', 'p-stars', '★★★'.slice(0, stars) + '☆☆☆'.slice(0, 3 - stars)));
      }
      const moved = sk.level > (graded ? before : startLv) ? `⭐ You moved up to Level ${sk.level}!`
                  : sk.level < (graded ? before : startLv) ? `Next time you will practice at Level ${sk.level}.`
                  : `You are at Level ${sk.level}.`;
      box.append(block('p', 'p-well', moved));
      const foot = el('div', 'practice-foot');
      foot.append(btn('p-btn p-next', 'Back ➡️', () => open(skill.id)));
      area.append(box, foot);
    };
    step();
    show();
  }

  function lock(opts) { [...opts.children].forEach(c => { c.disabled = true; }); }
  // Light up the clue words in the passage.
  function markClue(passage, clue) {
    const words = [...passage.querySelectorAll('.c-w')];
    const clean = (s) => s.toLowerCase().replace(/[^a-z0-9']/g, '');
    const target = clue.split(/\s+/).map(clean).filter(Boolean);
    for (let s = 0; s + target.length <= words.length; s++) {
      if (target.every((t, k) => clean(words[s + k].textContent) === t)) {
        for (let k = 0; k < target.length; k++) words[s + k].classList.add('c-clue');
        return;
      }
    }
  }

  window.Comp = { open, levelOf, restore, skills: () => COMP_SKILLS, _rules: { afterAnswer, afterCheck, freshSkill } };
})();
