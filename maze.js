/* =====================================================================
   MAZE — the story screen for the Maze course (comp.js runs the course:
   Learn → Practice → Check, 2 passes a level, Levels 1–4).

   Like the DIBELS 8 Maze (Marcos 10/21: "Check like DIBELS — silent, timed 3 min"):
     • A story with a box about every 7th word; each box has 3 words, one makes sense.
     • The story and its boxes are never read aloud, in Practice or the Check (Marcos 10/21: "silent practice
       i think is the way to go. The real test won't have read aloud"). The directions, the lesson, the
       feedback and the result still have their 🔊.
     • Practice: no timer. A wrong pick → try once more, then the right word is shown.
       Score = right on the first try (a percent).
     • Check: 3 minutes, the picks can be changed until the
       time is up or they tap "I'm finished". Score = right − ½ wrong. A box skipped before the
       last box they answered counts as wrong, so skipping can't raise the score.
     • Pass = the goal for the level (comp-data.js MAZE_GOALS). Level 4 = mCLASS grade 4
       middle-of-year At Benchmark (16.5).
   Story text: "{right|wrong|wrong}" marks a box (comp-data.js); the site shuffles the 3 words.
   ===================================================================== */
(function () {
  const MINUTES = 3;
  const K = () => window.Comp._kit;
  const goalOf = (skill, level) => (skill.goals && skill.goals[level]) || 0;
  const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // 9.5 → "9½" on screen, "9 and a half" read aloud
  const showPts = (n) => (Number.isInteger(n) ? String(n) : `${Math.floor(n)}½`);
  const sayPts = (n) => (Number.isInteger(n) ? String(n) : `${Math.floor(n)} and a half`);
  const checkSay = (level, skill) => {
    const g = goalOf(skill, level);
    return `one story, ${MINUTES} minutes. Read it silently. You need ${sayPts(g)} points to pass.`;
  };

  // "One {cat|dog|ran}." → sentences of tokens: { word } or { box: [right, w, w], before, after }
  function parse(text) {
    const sentences = text.match(/[^.!?]+[.!?]+["”’]?\s*/g) || [text];
    let n = 0;
    return sentences.map(s => s.trim().split(/\s+/).filter(Boolean).map(tok => {
      const m = /^([^{]*)\{([^}]*)\}(.*)$/.exec(tok);
      if (!m) return { word: tok };
      return { box: m[2].split('|'), before: m[1], after: m[3], n: n++ };
    }));
  }
  const boxCount = (text) => (text.match(/\{/g) || []).length;

  function run(skill, mode) {
    const k = K();
    k.stopSpeaking();
    k.setSkill(skill);
    const name = k.who();
    const graded = mode === 'check';
    let sk = k.skillState(name, skill.id);
    const level = sk.level, goal = goalOf(skill, level);
    const item = k.nextItem(sk, new Set(), graded);
    sk = { ...sk, seen: [...sk.seen.filter(x => x !== item.id), item.id].slice(-k.SEEN_KEEP) };
    k.putSkill(name, skill.id, sk);

    const area = document.getElementById('compView');
    area.innerHTML = '';
    k.header(area, `${skill.icon} ${graded ? 'Check' : 'Practice'}: ${skill.name}`);
    const top = k.el('div', 'c-row m-top');   // stays on screen while they scroll (the timer, the boxes done)
    const where = k.el('div', 'c-where');
    const count = k.el('span', 'c-where-label m-count');
    where.append(count);
    top.append(where, k.levelDots(level));
    area.append(top);

    const sentences = parse(item.text);
    const total = boxCount(item.text);
    const boxes = [];      // { n, right, pick, tries, firstRight, el }
    const missed = [];
    const started = new Date();
    let clock = null, left = MINUTES * 60, over = false;

    const doneCount = () => boxes.filter(b => (graded ? b.pick != null : b.settled)).length;
    const showCount = () => { count.textContent = `${doneCount()} of ${total} boxes`; };

    // the story
    const card = k.el('div', 'c-card m-card');
    card.append(k.el('div', 'c-tag c-tag-read', '📖 Read silently'));
    const story = k.el('div', 'm-story');
    story.setAttribute('lang', 'en');
    const fb = k.el('div', 'p-feedback m-feedback');
    fb.setAttribute('aria-live', 'polite');

    sentences.forEach(toks => {
      const sent = k.el('span', 'm-sent');
      toks.forEach((t, i) => {
        if (i) sent.append(document.createTextNode(' '));
        if (t.word) { sent.append(k.el('span', 'm-sw', t.word)); return; }
        if (t.before) sent.append(k.el('span', 'm-sw', t.before));
        sent.append(makeBox(t));
        if (t.after) sent.append(k.el('span', 'm-sw m-punct', t.after));
      });
      story.append(sent, document.createTextNode(' '));
    });
    card.append(story);
    area.append(card, fb);

    // One box: the 3 words as buttons, and a slot that shows the right word once Practice settles it
    function makeBox(t) {
      const right = t.box[0];
      const b = { n: t.n, right, pick: null, tries: 0, firstRight: null, settled: false, first: '' };
      const wrap = k.el('span', 'm-box');
      wrap.dataset.n = t.n;
      const slot = k.el('span', 'm-sw m-slot');
      const opts = k.el('span', 'm-opts');
      shuffle(t.box).forEach(w => {
        const o = k.el('button', 'm-opt');
        o.type = 'button';
        o.append(k.el('span', 'm-ow', w));
        o.onclick = () => pick(b, o, w);
        opts.append(o);
      });
      wrap.append(slot);
      wrap.append(opts);
      b.el = wrap; b.slot = slot; b.opts = opts;
      boxes.push(b);
      return wrap;
    }

    function pick(b, o, w) {
      if (over || o.disabled) return;
      if (graded) {
        b.pick = w;
        [...b.opts.children].forEach(c => c.classList.toggle('picked', c === o));
        b.el.classList.add('answered');
        showCount();
        return;
      }
      b.tries++;
      const right = w === b.right;
      if (b.firstRight === null) b.firstRight = right;
      if (right) {
        settle(b, 'right');
        fb.textContent = b.tries === 1 ? '✅ Yes! That word makes sense.' : '✅ Yes, you got it.';
        if (b.tries > 1) missed.push(`[${item.id}] box ${b.n + 1}: ${b.right} (picked: ${b.first}, then right)`);
      } else if (b.tries === 1) {
        b.first = w;
        o.classList.add('wrong'); o.disabled = true;
        fb.textContent = 'Not quite. Read the whole sentence again. Try one more time.';
      } else {
        settle(b, 'shown');
        fb.textContent = `The word that makes sense is "${b.right}."`;
        missed.push(`[${item.id}] box ${b.n + 1}: ${b.right} (picked: ${b.first}, then ${w})`);
      }
      showCount();
      if (boxes.every(x => x.settled)) doneBtn.disabled = false;
    }
    // Practice: the box becomes its right word (green = they got it, blue = it was shown)
    function settle(b, how) {
      b.settled = true;
      b.slot.textContent = b.right;
      b.el.classList.add('settled', how);
      [...b.opts.children].forEach(c => { c.disabled = true; });
    }

    // the foot: Practice "Done" opens when every box is answered; the Check can finish any time
    const foot = k.el('div', 'practice-foot');
    const doneBtn = k.btn('p-btn p-next', graded ? '✔ I\'m finished' : 'Finish ➡️', () => {
      if (graded && doneCount() < total && !window.confirm(`You have ${total - doneCount()} boxes left. Finish anyway?`)) return;
      finish();
    });
    if (!graded) doneBtn.disabled = true;
    foot.append(doneBtn);
    area.append(foot);
    showCount();

    // The Check waits for "Start", then the 3 minutes run (the story is hidden until then)
    if (graded) {
      card.hidden = true; foot.hidden = true;
      const timer = k.el('div', 'm-timer');
      timer.setAttribute('role', 'timer');
      const tick = () => { timer.textContent = `⏱ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; };
      tick();
      top.prepend(timer);
      const intro = k.el('div', 'm-intro');
      intro.append(k.block('p', 'c-lead c-next-say',
        `This is the Check. Read the story silently. At each box, pick the word that makes sense. You have ${MINUTES} minutes. You need ${sayPts(goal)} points to pass. A wrong pick takes away half a point, so be careful. Tap Start when you are ready.`,
        { label: 'Hear what to do' }));
      const go = k.btn('p-btn p-next-big', `▶ Start · ${MINUTES} minutes`, () => {
        k.stopSpeaking();
        intro.remove(); card.hidden = false; foot.hidden = false;
        clock = setInterval(() => {
          left--; tick();
          if (left <= 0) { fb.textContent = '⏱ Time is up!'; finish(); }
        }, 1000);
      });
      intro.append(go);
      area.insertBefore(intro, card);
    } else {
      area.insertBefore(k.block('p', 'c-lead', 'Read the story silently. At each box, pick the word that makes sense.', { label: 'Hear what to do' }), card);
    }
    k.show();

    function finish() {
      if (over) return;
      over = true;
      if (clock) clearInterval(clock);
      k.stopSpeaking();
      const finished = new Date();
      const before = sk.level, wasFinished = sk.finished;
      let score, right = 0, wrong = 0, pct;
      if (graded) {
        const lastAnswered = boxes.reduce((m, b) => (b.pick != null ? Math.max(m, b.n) : m), -1);
        boxes.forEach(b => {
          if (b.pick === b.right) right++;
          else if (b.pick != null || b.n < lastAnswered) { wrong++; missed.push(`[${item.id}] box ${b.n + 1}: ${b.right} (picked: ${b.pick == null ? 'skipped' : b.pick})`); }
        });
        score = Math.max(0, right - wrong / 2);
        pct = right + wrong ? Math.round((right / (right + wrong)) * 100) : 0;
        sk = k.afterCheck(sk, score, goal);
      } else {
        right = boxes.filter(b => b.firstRight).length;
        score = right;
        pct = total ? Math.round((right / total) * 100) : 0;
        sk = { ...sk, practiced: true };
      }
      const moved = sk.moved;
      k.putSkill(name, skill.id, sk);
      k.backupLevels(name);
      if (window.QPSLogin) QPSLogin.send({
        game: 'qps-c-' + skill.id,
        sessionId: `qps-c-${skill.id}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        form: graded ? `Check · Level ${before} · ${showPts(score)} points (goal ${showPts(goal)})` +
                       (moved === 'up' ? ` → ${sk.level}` : moved === 'finished' ? ' · finished' : moved === 'pass' ? ` · pass ${sk.passes} of ${k.PASSES_NEEDED}` : '')
                     : `Practice · Level ${before}`,
        score, correct: right, total, maxScore: graded ? goal : total, percent: pct, done: true,
        elapsed: Math.round((finished - started) / 1000), tabSwitches: 0,
        wrongQuestions: missed.join(' | '),
        startedAt: started.toISOString(), finishedAt: finished.toISOString()
      });
      showEnd({ graded, score, pct, goal, moved, before, wasFinished, right, wrong });
    }

    function showEnd(r) {
      const box = k.el('div', 'p-round');
      if (r.graded) {
        box.append(k.el('div', 'p-score', `${showPts(r.score)} points`), k.el('div', 'm-goal', `You needed ${showPts(r.goal)}`), k.passMeter(sk));
      } else {
        box.append(k.el('div', 'p-score', `${r.pct}%`));
      }
      const got = `You got ${sayPts(r.score)} points. You needed ${sayPts(r.goal)}.`;
      const up = r.before < k.MAX_LEVEL ? `to move up to Level ${r.before + 1}` : `to finish ${skill.name}`;
      const msg = !r.graded ? (r.wasFinished ? `You got ${r.pct}% right on the first try. Nice review!` : `You finished the practice! You got ${r.pct}% right on the first try. Now take the Check.`)
        : r.wasFinished ? `${got} Nice review! You already finished ${skill.name}.`
        : r.moved === 'up' ? `${got} You passed again! That is 2 of 2 passes. You move up to Level ${sk.level}!`
        : r.moved === 'finished' ? `${got} You passed again! That is 2 of 2 passes. You finished ${skill.name}! Mr. O will check you soon.`
        : r.moved === 'pass' ? `${got} You passed! That is 1 of 2 passes. Practice again and pass the Check again ${up}.`
        : `${got} Not this time. Practice again, then take the Check again.`;
      box.append(k.block('p', 'p-well' + (r.graded && !r.moved && !r.wasFinished ? ' not-yet' : ''), msg, { label: 'Hear how you did' }));
      const foot = k.el('div', 'p-end-buttons');
      const open = () => window.Comp.open(skill.id);
      const next = !r.graded ? (r.wasFinished ? k.btn('p-btn p-next-big', '▶ Keep practicing', () => run(skill, 'practice')) : k.btn('p-btn p-next-big', `▶ Take the Check · ${MINUTES} minutes`, () => run(skill, 'check')))
        : r.wasFinished || r.moved === 'finished' ? k.btn('p-btn p-next-big', '🏠 Back to my plan', k.backToPlan)
        : r.moved === 'up' ? k.btn('p-btn p-next-big', `▶ Start Level ${sk.level}`, open)
        : k.btn('p-btn p-next-big', r.moved === 'pass' ? '▶ Start pass 2' : '▶ Practice again', () => run(skill, 'practice'));
      foot.append(next, k.btn('p-btn p-again', `${skill.icon} Back to ${skill.name}`, open));
      // the story stays on screen above the score in Practice; the Check shows only the result
      if (r.graded) { area.innerHTML = ''; k.header(area, `${skill.icon} Check: ${skill.name}`); }
      else { const done = area.querySelector('.practice-foot'); if (done) done.remove(); }
      area.append(box, foot);
      box.scrollIntoView({ block: 'start' });
    }
  }

  window.Maze = { run, MINUTES, checkSay, _parse: parse };
})();
