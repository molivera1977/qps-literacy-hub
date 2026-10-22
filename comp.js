/* =====================================================================
   COMPREHENSION TRACK ENGINE (comp-data.js holds the passages)
   For students who passed every QPS level. Each skill has Learn,
   Practice (8 passages) and Check (5 passages = 10 points).

   A COURSE, walked through one step at a time (Marcos 10/21: "shouldn't the site escort the kids
   through each one" · "This should be clearer for them and me"). At each level (1–4):
     Learn (the first time) → Practice (8 passages) → Check (5 passages = 10 points).
     • The level changes ONLY on the Check (he chose: no moving up or down in the middle of Practice).
     • 8+ of 10 (80%) is a pass. 2 passes at a level → the next level (like the phonics stops).
     • The Check opens after that round's Practice; after any Check, Practice comes first again.
     • 2 passes at Level 4 → the skill is FINISHED: "Mr. O will check you soon" (his dashboard flags it).
       After that they can keep practicing (review); nothing moves.
   The level is kept on the student's device AND as one row per student
   on the 'qps-levels' tab of Mr. O's sheet (the same row is updated, not
   added), so a new or wiped device picks up where they left off.
   Every Practice and Check row sent to the sheet names the level.
   ===================================================================== */
(function () {
  const PRACTICE_N = 8, CHECK_N = 5, MAX_LEVEL = 4, DEFAULT_START = 1;
  // Everyone starts over at Level 1 and earns each level (Marcos 10/21: "why not just put them all at Level 1 and let
  // them earn their way up"): progress saved before the restart — on a device or on the sheet — is set aside. Saved
  // progress carries the course version (v); anything without this one is old. (A version, not a time: a device
  // with a wrong clock must not lose its progress.)
  const COURSE_V = 2;
  const CHECK_PASS = 8, PASSES_NEEDED = 2;          // 8 of 10 points = 80%, twice per level
  const STORE = 'qps_comp_v1:';
  const SEEN_KEEP = 24;

  /* ---------- the level rules (pure, so they can be tested) ---------- */
  function freshSkill(start) { return { level: start, passes: 0, learned: false, practiced: false, finished: false, seen: [] }; }

  // A finished Check (points; `need` to pass: 8 of 10, or the Maze goal for the level) → the new skill state.
  // Practice comes first again after any Check.
  // moved: 'pass' (1 of 2), 'up' (2 of 2 → next level), 'finished' (2 of 2 at the top level), or null
  function afterCheck(sk, points, need = CHECK_PASS) {
    const base = { ...sk, practiced: false };
    if (sk.finished || points < need) return { ...base, moved: null };
    const passes = (sk.passes || 0) + 1;
    if (passes < PASSES_NEEDED) return { ...base, passes, moved: 'pass' };
    if (sk.level < MAX_LEVEL) return { ...base, level: sk.level + 1, passes: 0, moved: 'up' };
    return { ...base, passes: PASSES_NEEDED, finished: true, moved: 'finished' };
  }

  /* ---------- per-student state ---------- */
  const who = () => window.QPS_STUDENT || '';
  const startLevel = (name) => (typeof COMP_START_LEVEL !== 'undefined' && COMP_START_LEVEL[name]) || DEFAULT_START;
  function load(name) {
    try { const st = JSON.parse(localStorage.getItem(STORE + name)) || null; return st && st.v === COURSE_V ? st : null; } catch (e) { return null; }
  }
  function save(name, st) { try { localStorage.setItem(STORE + name, JSON.stringify(st)); } catch (e) { /* private window */ } }
  function stateFor(name) { return load(name) || { skills: {}, t: 0 }; }
  function skillState(name, id) { const sk = stateFor(name).skills[id]; return sk ? { ...freshSkill(sk.level), ...sk } : freshSkill(startLevel(name)); }
  function putSkill(name, id, sk) {
    const st = stateFor(name);
    const { moved, ...keep } = sk;
    save(name, { ...st, skills: { ...st.skills, [id]: keep }, t: Date.now(), v: COURSE_V });
  }
  function levelOf(name, id) { return skillState(name, id).level; }

  // Backup row on the sheet: form = "context=3;main=2|t=1760500000000"
  function backupLevels(name) {
    if (!window.QPSLogin) return;
    const st = stateFor(name);
    // "context=3|t=…|p=context:1|f=|l=context" — level, then passes / finished / learned (older readers stop at |t=)
    const ent = Object.entries(st.skills);
    const form = ent.map(([k, v]) => `${k}=${v.level}`).join(';') + `|t=${st.t || Date.now()}` +
      `|p=${ent.map(([k, v]) => `${k}:${v.passes || 0}`).join(',')}` +
      `|f=${ent.filter(([, v]) => v.finished).map(([k]) => k).join(',')}` +
      `|l=${ent.filter(([, v]) => v.learned).map(([k]) => k).join(',')}|v=${COURSE_V}` +
      // the passages already seen, so another device doesn't repeat them first (Marcos 10/21)
      `|s=${ent.map(([k, v]) => `${k}:${(v.seen || []).join('.')}`).join(',')}`;
    QPSLogin.send({
      game: 'qps-levels', sessionId: 'lvl-' + name.replace(/[^A-Za-z0-9]+/g, '-'),
      form, score: 0, correct: 0, total: 0, maxScore: 0, percent: 0, done: false,
      elapsed: 0, tabSwitches: 0, wrongQuestions: ''
    });
  }

  // Every sign-in reads the backup row back from the sheet (10/21: a kid can switch Chromebooks).
  // A device with nothing saved takes the row; a device with its own progress keeps whichever is further along
  // for each skill (the course only moves forward: finished, then level, then passes, then learned — no clocks
  // to trust), and the passages seen on either device are both kept, so neither repeats them first.
  const rank = (sk) => (sk.finished ? 1e6 : 0) + sk.level * 100 + (sk.passes || 0) * 10 + (sk.learned ? 1 : 0);
  function fromRow(form) {
    const segs = String(form).split('|');
    const get = (key) => (segs.find(x => x.startsWith(key + '=')) || '').slice(key.length + 1);
    if (Number(get('v')) !== COURSE_V) return null;    // a row from before the restart
    const passes = {}; get('p').split(',').forEach(x => { const [k, n] = x.split(':'); if (k) passes[k] = Math.max(0, Math.min(PASSES_NEEDED, Number(n) || 0)); });
    const seen = {}; get('s').split(',').forEach(x => { const [k, ids] = x.split(':'); if (k) seen[k] = (ids || '').split('.').filter(id => /^[A-Z]\d-\d\d$/.test(id)).slice(-SEEN_KEEP); });
    const finished = new Set(get('f').split(',').filter(Boolean)), learned = new Set(get('l').split(',').filter(Boolean));
    const skills = {};
    segs[0].split(';').forEach(p => {
      const [k, v] = p.split('=');
      const lv = Number(v);
      if (k && lv >= 1 && lv <= MAX_LEVEL) skills[k] = { ...freshSkill(lv), passes: passes[k] || 0, finished: finished.has(k), learned: learned.has(k), seen: seen[k] || [] };
    });
    return Object.keys(skills).length ? { skills, t: Number(get('t')) || Date.now(), v: COURSE_V } : null;
  }
  function merge(mine, theirs) {
    const skills = { ...mine.skills };
    let changed = false;
    Object.entries(theirs.skills).forEach(([k, sk]) => {
      const here = skills[k] ? { ...freshSkill(skills[k].level), ...skills[k] } : null;
      const keep = !here || rank(sk) > rank(here) ? sk : here;
      const other = keep === sk ? (here ? here.seen : []) : sk.seen;
      const seen = [...other.filter(id => !keep.seen.includes(id)), ...keep.seen].slice(-SEEN_KEEP);
      const next = { ...keep, seen };
      if (JSON.stringify(next) !== JSON.stringify(here)) { skills[k] = next; changed = true; }
    });
    return changed ? { ...mine, skills, t: Date.now(), v: COURSE_V } : null;
  }
  async function restore(name) {
    if (!name || !window.QPSLogin || !QPSLogin.readTab) return false;
    const rows = await QPSLogin.readTab('qps-levels');
    const row = (rows || []).find(r => r.name === name);
    const theirs = row && row.form ? fromRow(row.form) : null;
    if (!theirs) return false;
    const mine = load(name);
    const next = mine ? merge(mine, theirs) : theirs;
    if (!next) return false;
    save(name, next);
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
    const u = new SpeechSynthesisUtterance(host.dataset.say);
    u.lang = 'en-US';
    speechSynthesis.speak(u);
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
  // Marcos 10/21: "The question looks just like the answer choices." Each answer carries a letter (A B C D),
  // the question sits in its own labeled box, and "Pick one answer" stands between them.
  function choice(text, onPick, k) {
    const b = el('button', 'c-choice');
    b.type = 'button';
    const words = el('span', 'c-words');
    words.dataset.say = text;
    wordsInto(words, text, false);
    if (k != null) b.append(el('span', 'c-letter', 'ABCDEF'[k]));
    b.append(speaker(words, 'Hear this answer'), words);
    b.onclick = () => onPick(b);
    return b;
  }

  // The question: its own box with a label, so it never looks like an answer button
  function askBox(text) {
    const box = el('div', 'c-ask-box');
    box.append(el('div', 'c-tag c-tag-q', '❓ Question'), block('p', 'c-ask', text, { mark: true, label: 'Hear the question' }));
    return box;
  }
  const pickLabel = () => el('div', 'c-tag c-tag-pick', '👆 Pick one answer');

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
  // The reading level in words only (Marcos 10/21: kids saw "Level 4 ●●●●" — every dot filled — and thought
  // they were done). No filled dots that can look like "finished".
  function levelDots(level) {
    const d = el('div', 'c-level');
    d.setAttribute('aria-label', `Reading level ${level} of ${MAX_LEVEL}`);
    d.append(el('span', 'c-level-label', `📚 Reading level ${level}`));
    return d;
  }

  // Passes as boxes (stars are the score), or "Finished"
  function passMeter(sk) {
    const m = el('div', 'p-pass-meter c-pass');
    if (sk.finished) { m.append(el('span', 'p-pass-label', '🎉 Finished')); return m; }
    for (let k = 0; k < PASSES_NEEDED; k++) m.append(el('span', 'p-pass-dot' + (k < sk.passes ? ' on' : ''), k < sk.passes ? '✅' : '⬜'));
    m.append(el('span', 'p-pass-label', `${sk.passes} of ${PASSES_NEEDED} passes`));
    return m;
  }
  const nowOf = (sk) => (!sk.learned ? 'learn' : sk.finished ? 'done' : !sk.practiced ? 'practice' : 'check');

  // The course screen — no menu to pick from: where they are, the three steps with the one to do lit,
  // what to do (read aloud), and ONE button for it.
  function open(id) {
    skill = skillById(id);
    if (!skill) return;
    stopSpeaking();
    const name = who();
    const sk = skillState(name, skill.id);
    const area = $('compView');
    area.innerHTML = '';
    document.title = `QPS Literacy Hub | ${skill.name}`;
    header(area, `${skill.icon} ${skill.name}`);
    const top = el('div', 'c-row');
    top.append(levelDots(sk.level), passMeter(sk));
    area.append(top);
    const now = nowOf(sk);
    const maze = skill.kind === 'maze';
    // what one round is: Words in context = 8 passages / a 5-passage Check; Maze = 1 story / a 3-minute Check
    const pWhat = maze ? '1 story' : `${PRACTICE_N} passages`, cWhat = maze ? `1 story, ${window.Maze.MINUTES} minutes` : `${CHECK_N} passages`;
    const steps = el('ol', 'c-steps');
    [['learn', '1. Learn'], ['practice', `2. Practice · ${pWhat}`], ['check', `3. Check · ${cWhat}`]].forEach(([k, t]) => {
      const done = (k === 'learn' && sk.learned) || (k === 'practice' && (sk.practiced || sk.finished)) || (k === 'check' && sk.finished);
      steps.append(el('li', 'c-step' + (k === now ? ' now' : '') + (done ? ' done' : ''), (done ? '✅ ' : k === now ? '👉 ' : '') + t));
    });
    area.append(steps);
    const say = now === 'learn' ? `First, learn how ${skill.name} works. Tap Learn.`
      : now === 'done' ? `You finished ${skill.name}! Mr. O will check you soon. You can keep practicing.`
      : now === 'practice' ? (sk.passes ? `Pass 2. Practice ${pWhat} again at Level ${sk.level}. Then take the Check again.`
                                        : `Practice ${pWhat} at Level ${sk.level}. Then take the Check.`)
      : maze ? `You finished the practice. Now take the Check: ${window.Maze.checkSay(sk.level, skill)}`
      : `You finished the practice. Now take the Check: ${CHECK_N} passages. You need 80% to pass.`;
    area.append(block('p', 'c-lead c-next-say', say, { label: 'Hear what to do' }));
    const foot = el('div', 'p-end-buttons');
    foot.append(now === 'learn' ? btn('p-btn p-next-big', '▶ Learn', () => learn())
      : now === 'check' ? btn('p-btn p-next-big', `▶ Take the Check · ${cWhat}`, () => run('check'))
      : btn('p-btn p-next-big', now === 'done' ? '▶ Keep practicing' : sk.passes ? '▶ Start pass 2: Practice' : `▶ Practice · ${pWhat}`, () => run('practice')));
    if (sk.learned) foot.append(btn('p-btn p-again', '📘 See the lesson again', () => learn()));
    area.append(foot);
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
    foot.append(btn('p-btn p-next', 'Next ➡️', () => { const n = who(); putSkill(n, skill.id, { ...skillState(n, skill.id), learned: true }); backupLevels(n); open(skill.id); }));
    area.append(foot);
    show();
  }

  // Pick the next passage at this level, oldest-seen first.
  // Practice and the Check each have their own passages (use: 'check'), so a Check never repeats a Practice passage.
  function nextItem(sk, used, graded) {
    const all = skill.levels[sk.level] || [];
    const mine = all.filter(it => (it.use === 'check') === !!graded);
    const pool = mine.length ? mine : all;
    const fresh = pool.filter(it => !sk.seen.includes(it.id) && !used.has(it.id));
    const pick = fresh.length ? shuffle(fresh)[0]
      : [...pool].filter(it => !used.has(it.id)).sort((a, b) => sk.seen.indexOf(a.id) - sk.seen.indexOf(b.id))[0] || pool[0];
    return pick;
  }

  function run(mode) {
    if (skill.kind === 'maze') return window.Maze.run(skill, mode);
    stopSpeaking();
    const name = who();
    const graded = mode === 'check';
    const n = graded ? CHECK_N : PRACTICE_N;
    let sk = skillState(name, skill.id);
    const startLv = sk.level;
    const used = new Set();
    const missed = [];
    const started = new Date();
    let i = 0, points = 0, firstTryRight = 0;

    const area = $('compView');
    const step = () => {
      area.innerHTML = '';
      header(area, `${skill.icon} ${graded ? 'Check' : 'Practice'}: ${skill.name}`);
      if (i >= n) return finish();
      const top = el('div', 'c-row');
      const dots = el('div', 'p-dots');
      dots.setAttribute('aria-hidden', 'true');
      for (let k = 0; k < n; k++) dots.append(el('span', k < i ? 'on' : ''));
      // how far they are, in words: "Passage 1 of 5" (the dots alone looked like "done")
      const where = el('div', 'c-where');
      where.append(el('span', 'c-where-label', `Passage ${i + 1} of ${n}`), dots);
      top.append(where, levelDots(sk.level));
      area.append(top);
      if (graded && i === 0) area.append(block('p', 'c-lead', 'This is the Check. Do your best. You will see how you did at the end.'));

      const item = nextItem(sk, used, graded);
      used.add(item.id);
      const word = targetWord(item);
      const card = el('div', 'c-card');
      const passage = block('p', 'c-passage', item.passage, { mark: true, label: 'Hear the passage' });
      card.append(el('div', 'c-tag c-tag-read', '📖 Read'), passage);
      area.append(card);

      const q = el('div', 'c-q');
      area.append(q);
      const fb = el('div', 'p-feedback');
      fb.setAttribute('aria-live', 'polite');

      // Part 1: what the word means
      q.append(askBox(`What does *${word}* mean in this passage?`), pickLabel());
      const opts = el('div', 'c-choices');
      // Practice lists every passage not right on the first try (Marcos 10/18: "list those too"),
      // with both picks: "(picked: hungry, then right)" or "(picked: hungry, then lazy)".
      let tries = 0, firstRight = null, firstPick = '';
      shuffle(item.choices).forEach((text, k) => {
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
            if (tries > 1) missed.push(`[${item.id}] ${word} (picked: ${firstPick}, then right)`);
            return partTwo();
          }
          b.classList.add('wrong'); b.disabled = true;
          if (tries === 1) {
            firstPick = text;
            fb.textContent = 'Not quite. Read the words around it again. Try one more time.';
            markClue(passage, item.clues[0]);
          } else {
            lock(opts);
            [...opts.children].forEach(c => { if (c.querySelector('.c-words').dataset.say === item.choices[0]) c.classList.add('right'); });
            fb.textContent = `It means "${item.choices[0]}."`;
            missed.push(`[${item.id}] ${word} (picked: ${firstPick}, then ${text})`);
            partTwo();
          }
        }, k));
      });
      q.append(opts, fb);

      // Part 2: which words showed it (the evidence)
      const partTwo = () => {
        const right1 = firstRight === true;
        if (!graded && right1) firstTryRight++;
        sk = { ...sk, seen: [...sk.seen.filter(x => x !== item.id), item.id].slice(-SEEN_KEEP) };   // the level stays put
        putSkill(name, skill.id, sk);
        const q2 = el('div', 'c-q');
        q2.append(askBox(`Which words in the passage helped you know what *${word}* means?`), pickLabel());
        const opts2 = el('div', 'c-choices');
        const fb2 = el('div', 'p-feedback');
        fb2.setAttribute('aria-live', 'polite');
        shuffle(item.clues).forEach((text, k) => {
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
            }
            const foot = el('div', 'practice-foot');
            foot.append(btn('p-btn p-next', i + 1 >= n ? 'Finish ➡️' : 'Next ➡️', () => { i++; step(); }));
            area.append(foot);
            foot.querySelector('button').focus();
          }, k));
        });
        q2.append(opts2, fb2);
        area.append(q2);
        q2.querySelector('.c-ask').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      };
      window.scrollTo(0, 0);
    };

    const finish = () => {
      const finished = new Date();
      const before = sk.level, wasFinished = sk.finished;
      let total, score;
      if (graded) { total = CHECK_N * 2; score = points; sk = afterCheck(sk, points); }
      else { total = n; score = firstTryRight; sk = { ...sk, practiced: true }; }
      const moved = sk.moved;
      putSkill(name, skill.id, sk);
      backupLevels(name);
      const pct = Math.round((score / total) * 100);
      if (window.QPSLogin) QPSLogin.send({
        game: 'qps-c-' + skill.id,
        sessionId: `qps-c-${skill.id}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        form: graded ? `Check · Level ${before}` + (moved === 'up' ? ` → ${sk.level}` : moved === 'finished' ? ' · finished' : moved === 'pass' ? ` · pass ${sk.passes} of ${PASSES_NEEDED}` : '')
                     : `Practice · Level ${startLv}`,
        score, correct: score, total, maxScore: total, percent: pct, done: true,
        elapsed: Math.round((finished - started) / 1000), tabSwitches: 0,
        wrongQuestions: missed.join(' | '),
        startedAt: started.toISOString(), finishedAt: finished.toISOString()
      });

      // the end, like the phonics Check: a percent, the passes, what it means (read aloud), one next button
      const box = el('div', 'p-round');
      box.append(el('div', 'p-score', `${pct}%`));
      if (graded) {
        const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : 1;
        box.append(el('div', 'p-stars', '★★★'.slice(0, stars) + '☆☆☆'.slice(0, 3 - stars)), passMeter(sk));
      }
      const got = `You got ${pct}%.`;
      const msg = !graded ? (wasFinished ? `${got} right on the first try. Nice review!` : `You finished the practice! You got ${pct}% right on the first try. Now take the Check.`)
        : wasFinished ? `${got} Nice review! You already finished ${skill.name}.`
        : moved === 'up' ? `${got} You passed again! That is 2 of 2 passes. You move up to Level ${sk.level}!`
        : moved === 'finished' ? `${got} You passed again! That is 2 of 2 passes. You finished ${skill.name}! Mr. O will check you soon.`
        : moved === 'pass' ? `${got} You passed! That is 1 of 2 passes. Practice ${PRACTICE_N} passages again and pass the Check again ${before < MAX_LEVEL ? `to move up to Level ${before + 1}` : `to finish ${skill.name}`}.`
        : `${got} You need 80% to pass. Not this time. Practice again, then take the Check again.`;
      box.append(block('p', 'p-well' + (graded && !moved && !wasFinished ? ' not-yet' : ''), msg, { label: 'Hear how you did' }));
      const foot = el('div', 'p-end-buttons');
      const next = !graded ? (wasFinished ? btn('p-btn p-next-big', '▶ Keep practicing', () => run('practice')) : btn('p-btn p-next-big', `▶ Take the Check · ${CHECK_N} passages`, () => run('check')))
        : wasFinished || moved === 'finished' ? btn('p-btn p-next-big', '🏠 Back to my plan', backToPlan)
        : moved === 'up' ? btn('p-btn p-next-big', `▶ Start Level ${sk.level}`, () => open(skill.id))
        : btn('p-btn p-next-big', moved === 'pass' ? '▶ Start pass 2' : '▶ Practice again', () => run('practice'));
      foot.append(next, btn('p-btn p-again', `${skill.icon} Back to ${skill.name}`, () => open(skill.id)));
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

  // Mr. O and guests can open a skill at any level (login.js renderAllComp). Students never get this:
  // the site picks their level. The passages they have already seen are kept, so they are not repeated first.
  function openAt(id, level) {
    const name = who();
    const lv = Math.max(1, Math.min(MAX_LEVEL, Number(level) || DEFAULT_START));
    putSkill(name, id, { ...freshSkill(lv), learned: true, seen: skillState(name, id).seen || [] });
    open(id);
  }

  // For the plan card: level, passes, finished
  function progressOf(name, id) { const sk = skillState(name, id); return { level: sk.level, passes: sk.passes || 0, finished: !!sk.finished }; }
  window.Comp = { open, openAt, levelOf, progressOf, restore, maxLevel: MAX_LEVEL, skills: () => COMP_SKILLS, _rules: { afterCheck, freshSkill },
    // for maze.js: the same course (state, the sheet, the screens) with its own story screen
    _kit: { who, skillState, putSkill, backupLevels, afterCheck, nextItem: (sk, used, graded) => nextItem(sk, used, graded),
            setSkill: (s) => { skill = s; }, el, btn, block, speaker, header, levelDots, passMeter, show, stopSpeaking, backToPlan,
            PASSES_NEEDED, MAX_LEVEL, SEEN_KEEP } };
})();
