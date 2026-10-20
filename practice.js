/* =====================================================================
   QPS PRACTICE — one stop per QPS level, one activity at a time.
   Order inside a stop (gradual release):
     Learn the pattern → Blend → Hear it first (sort) → Change one part
     → Build it → Which one says it? → Which spelling? → Sentences
     → Practice Check (graded, stars).
   Big-word stops (9a, 9b, 9c, 10): Learn → Chop → Blend → Build → Check.
   Words are said in Mr. O's voice (his chunk recordings blended, see
   buildBlend in index.html). Big words, sentences and spoken directions
   use the computer voice. Nothing plays until the student taps.
   ===================================================================== */
(function () {
  const STORE_KEY = 'qps_practice_v1';
  const PASS = 80;                                   // same as the Assessment's mastery mark
  const COUNTS = { blend: 5, sort: 8, chains: 6, build: 5, decode: 6, spell: 5, sentences: 4 };
  const STEP_NAMES = {
    learn: 'Learn', blend: 'Blend', sort: 'Listen', chains: 'Change', build: 'Build',
    decode: 'Read', spell: 'Spell', sentences: 'Sentences', chop: 'Chop', letterRead: 'Read',
    letterHear: 'Listen', check: 'Check'
  };

  let stop = null, steps = [], stepIndex = 0, busy = false, playRun = 0, checkStarted = null;
  let lessonRun = 0, exampleRun = 0, fromSequence = false;
  // A lesson or an example plays its own sounds one after another; those calls are not a student's tap.
  const inSequence = (fn) => { fromSequence = true; try { return fn(); } finally { fromSequence = false; } };
  const QA = /[?&]qa\b/.test(location.search);        // test runs only: each round names its answer
  const mark = (box, answer) => { if (QA) box.dataset.answer = answer; };
  const $ = (id) => document.getElementById(id);

  /* ---------- small helpers ---------- */
  const split = (w) => w.split('|');
  const join = (chunks) => chunks.join('');
  const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (arr, n) => shuffle(arr).slice(0, n);
  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  function button(cls, text, onClick, label) { const b = el('button', cls, text); b.type = 'button'; if (label) b.setAttribute('aria-label', label); b.onclick = onClick; return b; }

  // Stars are kept per student (login.js sets QPS_STUDENT), so a shared Chromebook keeps each child's own.
  const storeKey = () => STORE_KEY + (window.QPS_STUDENT ? ':' + window.QPS_STUDENT : '');
  function loadStore() { try { return JSON.parse(localStorage.getItem(storeKey())) || {}; } catch (e) { return {}; } }
  function saveStore(s) { try { localStorage.setItem(storeKey(), JSON.stringify(s)); } catch (e) { /* private window: progress just isn't kept */ } }
  function stopRecord(id) { return loadStore()[id] || { reached: 0, stars: 0 }; }
  function saveStopRecord(id, rec) { const s = loadStore(); s[id] = { ...stopRecord(id), ...rec }; saveStore(s); }

  /* ---------- audio ---------- */
  function fileFor(chunk) {
    const c = chunk.toLowerCase();
    if (c === 're') return stop && stop.id === '10' ? 're-long' : 're-short';
    return c;
  }
  // Parts a word is said with: big-word stops split prefix/suffix bases into letters.
  function soundParts(chunks) {
    if (!stop || !stop.split) return chunks;
    return chunks.flatMap(c => stop.split[c] ? split(stop.split[c]) : [c]);
  }
  async function guarded(fn) {
    // A tap plays at once (Marcos 10/19: "hitting letters too soon makes the second letter not be
    // heard. I should hear the sound as soon as I hit the letter"): whatever is still playing stops.
    if (window.stopSounds) stopSounds();
    if (window.QPSRead) QPSRead.stop(); else if (window.speechSynthesis) speechSynthesis.cancel();
    if (!fromSequence) { lessonRun++; exampleRun++; }   // a student's tap also ends a lesson or example being read
    const mine = ++playRun;
    busy = true;
    try { getAudioCtx(); await fn(); } finally { if (mine === playRun) busy = false; }
  }
  // Real words on this stop's lists; anything else (made-up words, near misses) is respelled.
  let realWords = new Set();
  function collectReal(st) {
    const words = [
      ...(st.real || []), ...(st.letters || []),
      ...(st.chains || []).flat(),
      ...st.learn.examples.flatMap(w => w.split('>')),
      ...((st.sort && st.sort.words) || []).filter(([, key]) => key !== 'made').map(([w]) => w)
    ];
    return new Set(words.map(w => w.replace(/\|/g, '')));
  }
  // A whole word. Mr. O's own recording of the whole word wins (stop, play, whaf…).
  // Otherwise the computer voice: real words as written, made-up words respelled
  // (respell.js) so the voice says them right — joined sound recordings sounded strange.
  function sayWord(chunks) {
    return guarded(async () => {
      const word = join(chunks);
      const rec = await loadBuffer(word.toLowerCase());
      if (rec) return playBuffer(rec);
      return speakComputer(realWords.has(word) || !window.Respell ? word : Respell.respell(soundParts(chunks)));
    });
  }
  function sayChunk(chunk) {
    return guarded(async () => {
      if (stop && stop.split && stop.split[chunk]) {            // a base word like lock (or the ac in action)
        const rec = await loadBuffer(chunk.toLowerCase());
        if (rec) return playBuffer(rec);
        // two letters like "ac" are read as letter names; hand the voice a spelling it sounds out ("akk")
        return speakComputer(chunk.length <= 2 && window.Respell ? Respell.respell(split(stop.split[chunk])) : chunk);
      }
      const buf = await buildBlend([fileFor(chunk)]);
      return buf ? playBuffer(buf) : speakComputer(chunk);
    });
  }
  function sayText(text) { return guarded(() => speakComputer(text)); }

  /* ---------- near-miss choices (must SOUND different from the word) ---------- */
  function nearMisses(st, chunks) {
    const out = [];
    if (st.contrast === 'drop') {
      const cons = (c) => c.length === 1 && !'aeiou'.includes(c);
      for (let i = 0; i < chunks.length - 1; i++) {
        if (cons(chunks[i]) && cons(chunks[i + 1])) {
          out.push(chunks.filter((_, k) => k !== i), chunks.filter((_, k) => k !== i + 1));
          break;
        }
      }
    } else if (st.contrast) {
      const i = chunks.findIndex(c => st.contrast[c]);
      if (i >= 0) st.contrast[chunks[i]].forEach(alt => out.push([...chunks.slice(0, i), ...split(alt), ...chunks.slice(i + 1)]));
    }
    return out.filter(v => join(v) !== join(chunks)).slice(0, 2);
  }
  // The chunk that carries the stop's pattern (highlighted after a miss).
  function patternIndex(chunks) {
    if (stop.contrast === 'drop') return -1;
    if (stop.contrast) return chunks.findIndex(c => stop.contrast[c]);
    return -1;
  }

  /* ---------- the steps of a stop ---------- */
  function buildSteps(st) {
    if (st.letters) return ['learn', 'letterRead', 'letterHear', 'check'];
    if (st.big) return ['learn', 'chop', 'blend', 'build', 'check'];
    const s = ['learn', 'blend'];
    if (st.sort) s.push('sort');
    if (st.chains) s.push('chains');
    s.push('build', 'decode', 'spell');
    if (st.sentences) s.push('sentences');
    s.push('check');
    return s;
  }

  /* ---------- home: the stop path ---------- */
  function renderStops() {
    const grid = $('stopGrid');
    if (!grid) return;
    grid.innerHTML = '';
    PRACTICE_STOPS.forEach(st => {
      const rec = stopRecord(st.id);
      const card = button('stop-card', '', () => openStop(st.id), `Stop ${st.num}, ${st.name}`);
      card.append(el('span', 'stop-num', st.num), el('span', 'stop-example' + (st.example.length > 7 ? ' long' : ''), st.example), el('span', 'stop-name', st.name));
      const stars = el('span', 'stop-stars');
      stars.setAttribute('aria-label', `${rec.stars} of 3 stars`);
      stars.textContent = '★★★'.slice(0, rec.stars) + '☆☆☆'.slice(0, 3 - rec.stars);
      card.append(stars);
      grid.append(card);
    });
    if (window.QPSLogin) QPSLogin.renderPlan();      // the signed-in student's own stop
  }

  function openStop(id) {
    stop = PRACTICE_STOPS.find(s => s.id === id);
    steps = buildSteps(stop);
    realWords = collectReal(stop);
    const rec = stopRecord(id);
    // A stop in progress picks up where the student stopped; a finished stop starts over.
    stepIndex = (rec.reached || 0) >= steps.length ? 0 : (rec.reached || 0);
    $('welcomeView').style.display = 'none';
    $('appView').style.display = 'none';
    $('practiceView').style.display = 'block';
    $('practiceTitle').textContent = `${stop.num} · ${stop.name}`;
    document.title = `QPS Literacy Hub | Practice ${stop.num}`;
    showStep();
    window.scrollTo(0, 0);
  }

  function backToStops() {
    if (window.speechSynthesis) speechSynthesis.cancel();
    $('practiceView').style.display = 'none';
    $('welcomeView').style.display = 'block';
    document.title = 'QPS Literacy Hub';
    renderStops();
    window.scrollTo(0, 0);
  }

  function renderChips() {
    const row = $('practiceSteps');
    row.innerHTML = '';
    const reached = stopRecord(stop.id).reached || 0;
    steps.forEach((s, i) => {
      const chip = button('step-chip', STEP_NAMES[s], () => { if (i <= reached) { stepIndex = i; showStep(); } }, `Step ${i + 1}, ${STEP_NAMES[s]}`);
      if (i === stepIndex) chip.classList.add('current');
      else if (i < reached) chip.classList.add('done');
      if (i > reached) chip.disabled = true;
      row.append(chip);
    });
  }

  function showStep() {
    renderChips();
    const area = $('practiceArea');
    area.innerHTML = '';
    $('practiceNext').style.display = 'none';
    const type = steps[stepIndex];
    const done = () => {
      const rec = stopRecord(stop.id);
      saveStopRecord(stop.id, { reached: Math.max(rec.reached || 0, stepIndex + 1) });
      renderChips();
      const next = $('practiceNext');
      next.textContent = `Next: ${STEP_NAMES[steps[stepIndex + 1]] || ''} ➡️`;
      next.style.display = stepIndex + 1 < steps.length ? 'inline-flex' : 'none';
    };
    ACTIVITIES[type](area, done);
  }

  function nextStep() {
    if (stepIndex + 1 < steps.length) { stepIndex++; showStep(); window.scrollTo(0, 0); }
  }

  /* ---------- lesson lines: words, letter names and sounds ----------
     In practice-data.js a lesson line marks
       /sh/  a SOUND — shown as a sound tile; read aloud with Mr. O's recording
       {sh}  LETTER NAMES — shown in bold; the voice says "s-h"
     (Marcos 10/16: "where it says 'say' the sound that follows is just the
     letter names" — the voice read "sh" as S-H.) */
  function lessonLine(line) {
    const p = el('p', 'p-learn-line');
    const segs = [];
    let text = null;                                  // the current run of spoken words
    const flushText = () => { text = null; };
    line.split(/(\/[a-z]+\/|\{[a-z]+\})/).forEach(tok => {
      if (!tok) return;
      const sound = tok.match(/^\/([a-z]+)\/$/);
      if (sound) {
        const chip = button('p-sound', sound[1], () => sayChunk(sound[1]), `Hear the sound ${sound[1]}`);
        p.append(chip);
        segs.push({ kind: 'sound', chunk: sound[1], el: chip });
        flushText();
        return;
      }
      if (!text) { text = { kind: 'text', el: el('span', 'p-say-run'), say: [] }; p.append(text.el); segs.push(text); }
      const letters = tok.match(/^\{([a-z]+)\}$/);
      if (letters) {
        const w = el('span', 'rw p-letters', letters[1]);
        text.el.append(w);
        text.say.push(letters[1].toUpperCase().split('').join('-'));   // S-H, A: capitals so the voice says letter names
      } else {
        tok.split(/(\s+)/).forEach(t => {
          if (!t) return;
          if (/^\s+$/.test(t)) { text.el.append(document.createTextNode(t)); return; }
          text.el.append(el('span', 'rw', t));
          text.say.push(t);
        });
      }
    });
    // A run that starts right after a sound tile (". C and H say") drops the leading punctuation.
    segs.forEach(sg => { if (sg.kind === 'text') sg.el.dataset.say = sg.say.join(' ').replace(/^[\s.,;:!?)]+/, ''); });
    return { el: p, segs };
  }
  // Pauses in a lesson (Marcos 10/19: "this sounds confusing since it is said too fast"): a beat
  // before and after each of Mr. O's sounds, so "the a says … /a/ … Add e" doesn't run together,
  // and a longer one between lines.
  const PAUSE = { word: 150, sound: 450, line: 900 };
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  // true = read to the end; false = another reading of the lesson took over
  async function readLesson(lines) {
    const mine = ++lessonRun;
    for (const line of lines) {
      for (const [k, sg] of line.segs.entries()) {
        if (mine !== lessonRun) return false;
        if (sg.kind === 'sound') {
          sg.el.classList.add('lit');
          await inSequence(() => sayChunk(sg.chunk));
          sg.el.classList.remove('lit');
        } else if (/[a-z0-9]/i.test(sg.el.dataset.say)) {
          if (window.QPSRead) await QPSRead.say(sg.el); else await speakComputer(sg.el.dataset.say);
        }
        const next = line.segs[k + 1];
        await wait(!next ? PAUSE.line : sg.kind === 'sound' || next.kind === 'sound' ? PAUSE.sound : PAUSE.word);
      }
    }
    return mine === lessonRun;
  }

  /* ---------- shared pieces ---------- */
  function direction(area, text) {
    const row = el('div', 'p-direction');
    const p = window.QPSRead ? QPSRead.wrap(el('p', ''), text) : el('p', '', text);
    // A speaker always answers: it stops whatever is being read and reads this line.
    const btn = button('p-say', '🔊', () => (window.QPSRead ? QPSRead.say(p) : sayText(text)), 'Hear the directions');
    row.append(btn, p);
    area.append(row);
    return { row, btn, p, text };
  }

  /* Directions first (Marcos 10/19: "the directions should be forced to be hit before they can hit
     anything. Kids are clicking without knowing what to do."). A step's work stays locked until its
     directions are heard to the end; stopped early does not count. A device with no voice gets a
     reading wait, then "I read it". Once open, the 🔊 reads them again any time. */
  const READ_MS_PER_WORD = 450, READ_MIN_MS = 3000;
  function lockUntilHeard(dir, work) {
    let open = false, reading = false;
    work.inert = true;
    work.classList.add('p-locked');
    dir.row.classList.add('p-must-hear');
    const note = el('p', 'p-hear-note', '👆 Tap 🔊 to hear the directions first.');
    dir.row.after(note);
    const unlock = () => {
      open = true;
      work.inert = false;
      work.classList.remove('p-locked');
      dir.row.classList.remove('p-must-hear');
      note.remove();
    };
    dir.btn.onclick = async () => {
      if (reading) return;                                // a second tap must not cut the reading off
      reading = true;
      const how = window.QPSRead ? await QPSRead.say(dir.p) : (await sayText(dir.text), 'end');
      reading = false;
      if (open) return;
      if (how === 'end') return unlock();
      if (how === 'novoice') return readItYourself();
      note.textContent = '👆 It stopped early. Tap 🔊 to hear the directions to the end.';
    };
    // No voice on this device: wait long enough to read the line, then the student says they read it.
    function readItYourself() {
      note.textContent = '📖 Read the directions. Then tap I read it.';
      const ok = button('p-btn p-read-it', '⏳ Read it first', unlock);
      ok.disabled = true;
      note.append(' ', ok);
      const words = dir.text.split(/\s+/).filter(Boolean).length;
      setTimeout(() => { ok.disabled = false; ok.textContent = '✅ I read it'; }, Math.max(READ_MIN_MS, words * READ_MS_PER_WORD));
    }
  }
  function progress(area, n, total) {
    const dots = el('div', 'p-dots');
    dots.setAttribute('aria-label', `${n} of ${total}`);
    for (let i = 0; i < total; i++) dots.append(el('span', i < n ? 'on' : ''));
    area.append(dots);
  }
  function feedback(area) { const f = el('div', 'p-feedback'); f.setAttribute('aria-live', 'polite'); area.append(f); return f; }
  function tiles(chunks, opts = {}) {
    const row = el('div', 'p-tiles' + (opts.big ? ' big' : ''));
    chunks.forEach((c, i) => {
      const t = el('span', 'p-tile', c);
      if (opts.mark === i) t.classList.add('mark');
      row.append(t);
    });
    return row;
  }
  // Runs `count` rounds of one activity; `round(box, index, finish)` draws one item.
  function rounds(area, items, round, done, introText) {
    let i = 0;
    const box = el('div', 'p-round');
    const dir = direction(area, introText);
    area.append(box);
    lockUntilHeard(dir, box);
    const step = () => {
      box.innerHTML = '';
      progress(box, i, items.length);
      round(box, items[i], () => {
        i++;
        if (i >= items.length) { box.innerHTML = ''; progress(box, i, items.length); box.append(el('p', 'p-well', '⭐ Nice work! You finished this part.')); done(); }
        else {
          const go = button('p-btn p-go', 'Next one ➡️', step);
          box.append(go);
          go.focus();
        }
      });
    };
    step();
  }

  /* ---------- activities ---------- */
  const ACTIVITIES = {
    learn(area, done) {
      const card = el('div', 'p-learn');
      const lines = stop.learn.lines.map(lessonLine);
      // The lesson is this step's directions: its sound tiles and examples open once it is heard.
      const lockables = () => [ex, ...card.querySelectorAll('.p-sound')];
      const sayBtn = button('p-btn p-hear', '🔊 Hear the lesson', async () => {
        if (!(await readLesson(lines))) return;
        lockables().forEach(e => { e.inert = false; e.classList.remove('p-locked'); });
        if (note.isConnected) note.remove();
        done();
      });
      const note = el('p', 'p-hear-note', '👆 Tap Hear the lesson first.');
      card.append(el('h2', 'p-learn-title', `Learn: ${stop.name}`));
      lines.forEach(l => card.append(l.el));
      card.append(sayBtn, note);
      card.append(el('p', 'p-small', 'Tap a word to hear it.'));
      const ex = el('div', 'p-examples');
      // "a>b" shows a before-and-after pair, like mat → mate.
      stop.learn.examples.forEach(w => {
        const words = w.split('>').map(split);
        // m · a · t … mat → m · ate … mate, with a beat between sounds, before the word, and between words
        const b = button('p-example', '', async () => {
          if (window.stopSounds) stopSounds();
          if (window.QPSRead) QPSRead.stop();
          lessonRun++;
          const mine = ++exampleRun;                       // another tap ends this example
          const still = () => mine === exampleRun;
          for (const [k, chunks] of words.entries()) {
            if (k) await wait(900);
            if (chunks.length > 1) {
              for (const c of chunks) { if (!still()) return; await inSequence(() => sayChunk(c)); await wait(350); }
              await wait(150);
            }
            if (!still()) return;
            await inSequence(() => sayWord(chunks));
          }
        }, `Hear ${words.map(join).join(' and ')}`);
        words.forEach((chunks, k) => { if (k) b.append(el('span', 'p-arrow', '→')); b.append(tiles(chunks)); });
        ex.append(b);
      });
      card.append(ex);
      lockables().forEach(e => { e.inert = true; e.classList.add('p-locked'); });
      area.append(card);
    },

    blend(area, done) {
      rounds(area, pick(stop.real, COUNTS.blend).map(split), (box, chunks, finish) => {
        let next = 0;
        const row = el('div', 'p-tiles big');
        const blendBtn = button('p-btn p-hear', '🔊 Blend it', async () => {
          await sayWord(chunks);
          row.classList.add('blended');
          blendBtn.disabled = true;
          finish();
        });
        blendBtn.disabled = true;
        chunks.forEach((c, i) => {
          const t = button('p-tile tap' + (i === 0 ? ' glow' : ''), c, async () => {
            if (i > next) return;                           // not yet: the sounds go in order
            if (i < next) return sayChunk(c);              // a sound already heard: hear it again (Marcos 10/19)
            // the tap moves on at once, so a quick next tap is taken (and cuts this sound off)
            t.classList.remove('glow'); t.classList.add('heard');
            next++;
            if (next < chunks.length) row.children[next].classList.add('glow');
            await sayChunk(c);
            if (next >= chunks.length) blendBtn.disabled = false;
          }, `Sound ${i + 1}: ${c}`);
          row.append(t);
        });
        box.append(row, blendBtn);
      }, done, 'Tap each sound in order and say it. Then tap Blend it and say the whole word.');
    },

    sort(area, done) {
      const s = stop.sort;
      rounds(area, pick(s.words, COUNTS.sort), (box, [w, key], finish) => {
        const chunks = split(w);
        mark(box, key);
        const word = el('div', 'p-hidden-word', s.seeWord ? join(chunks) : '?');
        const fb = feedback(box);
        box.append(button('p-btn p-hear', '🔊 Hear the word', () => sayWord(chunks)), word);
        const bins = el('div', 'p-bins');
        s.bins.forEach(b => {
          const bin = button('p-bin', b.label, async () => {
            if (bins.dataset.done) return;
            bins.dataset.done = '1';
            word.textContent = join(chunks);
            const right = s.bins.find(x => x.key === key);
            if (b.key === key) { bin.classList.add('right'); fb.textContent = '✅ Yes!'; }
            else {
              bin.classList.add('wrong');
              [...bins.children].find(x => x.textContent === right.label).classList.add('right');
              fb.textContent = `Not quite. ${join(chunks)} goes with ${right.label}. Listen again.`;
              await sayWord(chunks);
            }
            finish();
          });
          bins.append(bin);
        });
        box.append(s.prompt ? el('p', 'p-small', s.prompt) : '', bins, fb);
      }, done, s.seeWord ? 'Read the word. Tap Hear the word to check. Then pick the box it goes in.' : 'Tap Hear the word and listen. The word is hidden. Pick the box it goes in.');
    },

    chains(area, done) {
      const pairs = pick(stop.chains, COUNTS.chains);
      const middles = stop.chains.flatMap(([a, b]) => [diff(split(a), split(b)).newPart, diff(split(b), split(a)).newPart]).filter(Boolean);
      rounds(area, pairs, (box, [a, b], finish) => {
        const A = split(a), B = split(b);
        mark(box, diff(A, B).newPart.replace(/\|/g, ''));
        const d = diff(A, B);
        const fb = feedback(box);
        box.append(el('p', 'p-small', 'This word says:'));
        const aBtn = button('p-word-btn', '', () => sayWord(A), `Hear ${join(A)}`);
        aBtn.append(tiles(A));
        box.append(aBtn);
        box.append(button('p-btn p-hear', '🔊 Now make this word', () => sayWord(B)));
        const target = el('div', 'p-tiles big');
        const shown = [...B.slice(0, d.start), '___', ...B.slice(d.start + d.newLen)];
        shown.forEach(c => target.append(el('span', 'p-tile' + (c === '___' ? ' blank' : ''), c)));
        box.append(target);
        const correct = d.newPart;
        const choices = shuffle([correct, ...pick([...new Set(middles)].filter(m => m !== correct && m.replace(/\|/g, '') !== correct.replace(/\|/g, '')), 2)]);
        const opts = el('div', 'p-options');
        choices.forEach(c => {
          const o = button('p-option', c.replace(/\|/g, ''), async () => {
            if (opts.dataset.done) return;
            if (c === correct) {
              opts.dataset.done = '1';
              o.classList.add('right');
              target.innerHTML = '';
              target.append(...tiles(B, { big: true }).children);
              fb.textContent = `✅ Yes! ${join(A)} turned into ${join(B)}.`;
              await sayWord(B);
              finish();
            } else {
              o.classList.add('wrong'); o.disabled = true;
              fb.textContent = 'Not that one. Listen to the new word again.';
              await sayWord(B);
            }
          });
          opts.append(o);
        });
        box.append(opts, fb);
      }, done, 'Listen to the new word. Pick the part that changes to make it.');
    },

    build(area, done) {
      const items = pick(stop.real, COUNTS.build).map(split);
      rounds(area, items, (box, chunks, finish) => buildRound(box, chunks, finish, false), done, 'Tap Hear the word. Tap the parts in order to build it. Then tap Check.');
    },

    decode(area, done) {
      rounds(area, pick(stop.made, COUNTS.decode).map(split), (box, chunks, finish) => decodeRound(box, chunks, finish, false), done, 'This is a made-up word. Read it out loud first. Then tap each speaker to listen, and pick the one that says the word.');
    },

    spell(area, done) {
      rounds(area, pick(stop.made, COUNTS.spell).map(split), (box, chunks, finish) => spellRound(box, chunks, finish, false), done, 'Tap Hear the word. It is a made-up word. Pick the right spelling.');
    },

    sentences(area, done) {
      rounds(area, pick(stop.sentences, COUNTS.sentences), (box, sentence, finish) => {
        const line = el('p', 'p-sentence');
        sentence.split(' ').forEach((word, i) => {
          if (i) line.append(' ');
          line.append(button('p-sword rw', word, () => sayText(word.replace(/[.,?!]/g, '')), `Hear ${word}`));
        });
        line.dataset.say = sentence;
        box.append(line, button('p-btn p-hear', '🔊 Hear the sentence', async () => {
          // cut off by a tap on a word = not heard yet; tap Hear the sentence again
          if (window.QPSRead) { if ((await QPSRead.say(line)) === 'stopped') return; } else await sayText(sentence);
          finish();
        }));
      }, done, 'Read the sentence out loud. Tap a word if you need help. Then tap Hear the sentence to check yourself.');
    },

    chop(area, done) {
      const words = pick(stop.real, stop.id === '9c' ? 5 : 6).map(split);
      rounds(area, words, (box, chunks, finish) => chopRound(box, chunks, finish, false), done,
        stop.parts ? 'Find the prefix or the suffix. Tap the gap between the parts to chop the word. Then tap Check.'
                   : 'Tap the gaps to chop the word into parts. Each part has one vowel sound. Then tap Check.');
    },

    letterRead(area, done) {
      rounds(area, pick(stop.letters, 8), (box, letter, finish) => {
        const others = pick(stop.letters.filter(l => l !== letter), 2);
        choiceRound(box, letter, shuffle([letter, ...others]), finish, false);
      }, done, 'Look at the letter. Say its sound. Then tap each speaker and pick the one that matches.');
    },

    letterHear(area, done) {
      rounds(area, pick(stop.letters, 8), (box, letter, finish) => {
        const fb = feedback(box);
        box.append(button('p-btn p-hear', '🔊 Hear the sound', () => sayChunk(letter)));
        const opts = el('div', 'p-options');
        shuffle([letter, ...pick(stop.letters.filter(l => l !== letter), 2)]).forEach(l => {
          const o = button('p-option big', l, async () => {
            if (opts.dataset.done) return;
            if (l === letter) { opts.dataset.done = '1'; o.classList.add('right'); fb.textContent = '✅ Yes!'; finish(); }
            else { o.classList.add('wrong'); o.disabled = true; fb.textContent = `Not that one. That letter says a different sound. Listen again.`; await sayChunk(letter); }
          });
          opts.append(o);
        });
        box.append(opts, fb);
      }, done, 'Tap Hear the sound. Pick the letter that makes it.');
    },

    check(area, done) {
      let items;
      if (stop.letters) items = pick(stop.letters, 10).map((l, i) => ({ kind: i % 2 ? 'letterHear' : 'letterRead', chunks: [l] }));
      else if (stop.big) items = shuffle([...pick(stop.real, 5).map(w => ({ kind: 'chop', chunks: split(w) })), ...pick(stop.real, 5).map(w => ({ kind: 'build', chunks: split(w) }))]);
      else items = shuffle([...pick(stop.made, 6).map(w => ({ kind: 'decode', chunks: split(w) })), ...pick(stop.made, 4).map(w => ({ kind: 'spell', chunks: split(w) }))]);
      const results = [];
      checkStarted = new Date();
      const dir = direction(area, 'Practice Check. Do your best. This time the site does not tell you the answer until the end.');
      const box = el('div', 'p-round');
      area.append(box);
      lockUntilHeard(dir, box);
      let i = 0;
      const next = () => {
        box.innerHTML = '';
        if (i >= items.length) return finishCheck(area, box, items, results, done);
        progress(box, i, items.length);
        const it = items[i];
        const record = (ok) => { results.push(ok); i++; next(); };
        if (it.kind === 'decode') decodeRound(box, it.chunks, record, true);
        else if (it.kind === 'spell') spellRound(box, it.chunks, record, true);
        else if (it.kind === 'build') buildRound(box, it.chunks, record, true);
        else if (it.kind === 'chop') chopRound(box, it.chunks, record, true);
        else if (it.kind === 'letterRead') choiceRound(box, it.chunks[0], shuffle([it.chunks[0], ...pick(stop.letters.filter(l => l !== it.chunks[0]), 2)]), record, true);
        else letterHearCheck(box, it.chunks[0], record);
      };
      next();
    }
  };

  /* ---------- rounds shared by practice and the check ---------- */
  // graded=true: one try, no right/wrong shown, calls finish(isRight).
  function buildRound(box, chunks, finish, graded) {
    mark(box, chunks.join('|'));
    const fb = feedback(box);
    box.append(button('p-btn p-hear', '🔊 Hear the word', () => sayWord(chunks)));
    const slots = el('div', 'p-tiles big');
    const pool = el('div', 'p-pool');
    const filled = chunks.map(() => null);
    const decoys = decoysFor(chunks);
    // Load every part's recording now, so the first tap on a part plays without waiting for it
    if (window.loadBuffer) [...chunks, ...decoys].forEach(c => { if (!(stop.split && stop.split[c])) loadBuffer(fileFor(c)); });
    const cards = shuffle([...chunks.map((c, i) => ({ c, id: 'w' + i })), ...decoys.map((c, i) => ({ c, id: 'd' + i }))]);
    const slotEls = chunks.map((_, i) => {
      const s = button('p-tile slot', '', () => { if (filled[i]) { filled[i].btn.style.visibility = 'visible'; filled[i] = null; s.textContent = ''; s.classList.add('slot'); } }, `Box ${i + 1}`);
      slots.append(s);
      return s;
    });
    cards.forEach(card => {
      const b = button('p-tile tap', card.c, () => {
        const at = filled.indexOf(null);
        if (at < 0) return;
        filled[at] = { c: card.c, btn: b };
        slotEls[at].textContent = card.c; slotEls[at].classList.remove('slot');
        b.style.visibility = 'hidden';
        if (!graded) sayChunk(card.c);
      });
      pool.append(b);
    });
    const check = button('p-btn p-check', 'Check ✅', async () => {
      if (filled.includes(null)) { fb.textContent = 'Fill every box first.'; return; }
      const wrongAt = filled.findIndex((f, i) => f.c !== chunks[i]);
      if (graded) { check.disabled = true; return finish(wrongAt < 0); }
      if (wrongAt < 0) { check.disabled = true; slots.classList.add('blended'); fb.textContent = `✅ You built ${join(chunks)}!`; await sayWord(chunks); return finish(); }
      fb.textContent = `Look at box ${wrongAt + 1}. Listen to that part again and try again.`;
      slotEls[wrongAt].classList.add('wrong-slot');
      setTimeout(() => slotEls[wrongAt].classList.remove('wrong-slot'), 1500);
      for (let i = wrongAt; i < filled.length; i++) { if (filled[i]) { filled[i].btn.style.visibility = 'visible'; filled[i] = null; slotEls[i].textContent = ''; slotEls[i].classList.add('slot'); } }
      await sayChunk(chunks[wrongAt]);
    });
    box.append(el('p', 'p-small', 'Your word:'), slots, el('p', 'p-small', 'Parts:'), pool, check, fb);
  }

  function decoysFor(chunks) {
    const out = new Set();
    const i = patternIndex(chunks);
    if (i >= 0) stop.contrast[chunks[i]].forEach(alt => { if (!alt.includes('|')) out.add(alt); });
    if (stop.contrast === 'drop' || stop.big || out.size < 2) {
      const others = shuffle(stop.real.flatMap(split)).filter(c => !chunks.includes(c));
      for (const c of others) { if (out.size >= 2) break; out.add(c); }
    }
    return [...out].filter(c => !chunks.includes(c)).slice(0, 2);
  }

  function decodeRound(box, chunks, finish, graded) {
    mark(box, chunks.join('|'));
    const fb = feedback(box);
    box.append(el('div', 'p-big-word', join(chunks)));
    const options = shuffle([chunks, ...nearMisses(stop, chunks)]);
    let chosen = null;
    const opts = el('div', 'p-options');
    options.forEach((o, n) => {
      const b = button('p-option listen', `🔊 ${n + 1}`, async () => {
        [...opts.children].forEach(x => x.classList.remove('picked'));
        b.classList.add('picked'); chosen = o;
        await sayWord(o);
      }, `Choice ${n + 1}`);
      if (QA) b.dataset.say = join(o);
      opts.append(b);
    });
    const check = button('p-btn p-check', 'This one ✅', async () => {
      if (!chosen) { fb.textContent = 'Tap a speaker first.'; return; }
      const ok = join(chosen) === join(chunks);
      if (graded) { check.disabled = true; return finish(ok); }
      if (ok) { check.disabled = true; fb.textContent = '✅ Yes! That one says the word.'; return finish(); }
      const mark = patternIndex(chunks);
      fb.textContent = mark >= 0 ? `Not that one. Look at the ${chunks[mark]} part. Listen to each one again.` : 'Not that one. Listen to each one again and look at every letter.';
      [...opts.children].find(x => x.classList.contains('picked')).classList.add('wrong');
    });
    box.append(opts, check, fb);
  }

  function spellRound(box, chunks, finish, graded) {
    mark(box, chunks.join('|'));
    const fb = feedback(box);
    box.append(button('p-btn p-hear', '🔊 Hear the word', () => sayWord(chunks)));
    const opts = el('div', 'p-options');
    shuffle([chunks, ...nearMisses(stop, chunks)]).forEach(o => {
      const b = button('p-option', join(o), async () => {
        if (opts.dataset.done) return;
        const ok = join(o) === join(chunks);
        if (graded) { opts.dataset.done = '1'; return finish(ok); }
        if (ok) { opts.dataset.done = '1'; b.classList.add('right'); fb.textContent = '✅ Yes! That is how it is spelled.'; return finish(); }
        b.classList.add('wrong'); b.disabled = true;
        const mark = patternIndex(chunks);
        fb.textContent = mark >= 0 ? `Not that one. Listen for the ${chunks[mark]} sound.` : 'Not that one. Listen again.';
        await sayWord(chunks);
      });
      opts.append(b);
    });
    box.append(opts, fb);
  }

  function chopRound(box, chunks, finish, graded) {
    mark(box, chunks.join('|'));
    const fb = feedback(box);
    const word = join(chunks);
    const cuts = new Set();
    let pos = 0;
    const answer = new Set(chunks.slice(0, -1).map(c => (pos += c.length)));
    const row = el('div', 'p-chop');
    const gaps = [];
    [...word].forEach((ch, i) => {
      row.append(el('span', 'p-letter', ch));
      if (i < word.length - 1) {
        const g = button('p-gap', '', () => { if (cuts.has(i + 1)) { cuts.delete(i + 1); g.classList.remove('cut'); } else { cuts.add(i + 1); g.classList.add('cut'); } }, `Cut after letter ${i + 1}`);
        gaps.push(g);
        row.append(g);
      }
    });
    box.append(button('p-btn p-hear', '🔊 Hear the word', () => sayWord(chunks)), row);
    const check = button('p-btn p-check', 'Check ✅', async () => {
      const ok = cuts.size === answer.size && [...answer].every(a => cuts.has(a));
      if (graded) { check.disabled = true; return finish(ok); }
      check.disabled = true;
      gaps.forEach((g, i) => { g.classList.toggle('cut', answer.has(i + 1)); g.disabled = true; });
      fb.textContent = ok ? `✅ Yes! ${chunks.join(' · ')}` : `Here are the parts: ${chunks.join(' · ')}. Listen to each part.`;
      for (const c of chunks) { await sayChunk(c); }
      await sayWord(chunks);
      finish();
    });
    box.append(check, fb);
  }

  // Letter shown; three sounds to choose from (stop 1).
  function choiceRound(box, letter, choices, finish, graded) {
    mark(box, letter);
    const fb = feedback(box);
    box.append(el('div', 'p-big-word', letter));
    let chosen = null;
    const opts = el('div', 'p-options');
    choices.forEach((c, n) => {
      const b = button('p-option listen', `🔊 ${n + 1}`, async () => {
        [...opts.children].forEach(x => x.classList.remove('picked'));
        b.classList.add('picked'); chosen = c;
        await sayChunk(c);
      }, `Sound ${n + 1}`);
      if (QA) b.dataset.say = c;
      opts.append(b);
    });
    const check = button('p-btn p-check', 'This one ✅', () => {
      if (!chosen) { fb.textContent = 'Tap a speaker first.'; return; }
      if (graded) { check.disabled = true; return finish(chosen === letter); }
      if (chosen === letter) { check.disabled = true; fb.textContent = `✅ Yes! That is the sound of ${letter}.`; return finish(); }
      fb.textContent = 'Not that one. Listen to each sound again.';
      [...opts.children].find(x => x.classList.contains('picked')).classList.add('wrong');
    });
    box.append(opts, check, fb);
  }

  function letterHearCheck(box, letter, finish) {
    mark(box, letter);
    box.append(button('p-btn p-hear', '🔊 Hear the sound', () => sayChunk(letter)));
    const opts = el('div', 'p-options');
    shuffle([letter, ...pick(stop.letters.filter(l => l !== letter), 2)]).forEach(l => {
      opts.append(button('p-option big', l, () => { if (!opts.dataset.done) { opts.dataset.done = '1'; finish(l === letter); } }));
    });
    box.append(opts);
  }

  function finishCheck(area, box, items, results, done) {
    const right = results.filter(Boolean).length;
    const pct = Math.round((right / items.length) * 100);
    const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : 1;
    const rec = stopRecord(stop.id);
    saveStopRecord(stop.id, { stars: Math.max(rec.stars || 0, stars), reached: steps.length, lastScore: pct });
    box.append(el('div', 'p-score', `${right} of ${items.length}`), el('div', 'p-stars', '★★★'.slice(0, stars) + '☆☆☆'.slice(0, 3 - stars)));
    box.append(el('p', 'p-well', pct >= PASS ? '🎉 You are ready for Mr. O\'s check!' : 'Good work. Practice this stop again to get ready for Mr. O\'s check.'));
    const missed = items.filter((_, k) => !results[k]);
    // Send the Check to Mr. O's results sheet (login.js knows who is signed in).
    if (window.QPSLogin) QPSLogin.saveCheck({
      stop, right, total: items.length, percent: pct, started: checkStarted, finished: new Date(),
      missed: missed.map(it => `${join(it.chunks)} (${STEP_NAMES[it.kind] || it.kind})`)
    });
    if (missed.length) {
      box.append(el('p', 'p-small', 'Words to practice — tap to hear:'));
      const list = el('div', 'p-examples');
      missed.forEach(it => { const b = button('p-example', '', () => (stop.letters ? sayChunk(it.chunks[0]) : sayWord(it.chunks)), `Hear ${join(it.chunks)}`); b.append(tiles(it.chunks)); list.append(b); });
      box.append(list);
    }
    const again = el('div', 'p-end-buttons');
    again.append(button('p-btn p-go', '🏠 Back to all stops', backToStops), button('p-btn p-again', '🔁 Do this stop again', () => { stepIndex = 1; showStep(); window.scrollTo(0, 0); }));
    box.append(again);
    done();
  }

  // Where two chunk lists differ: start index, how many new chunks, and the new part.
  function diff(A, B) {
    let start = 0;
    while (start < A.length && start < B.length && A[start] === B[start]) start++;
    let endA = A.length - 1, endB = B.length - 1;
    while (endA >= start && endB >= start && A[endA] === B[endB]) { endA--; endB--; }
    const part = B.slice(start, endB + 1);
    return { start, newLen: part.length, newPart: part.join('|') };
  }

  window.Practice = { renderStops, openStop, backToStops, nextStep, nearMisses, buildSteps, diff, _sayWord: sayWord, _sayChunk: sayChunk, _state: () => ({ stop, steps, stepIndex }) };
  document.addEventListener('DOMContentLoaded', renderStops);
  if (document.readyState !== 'loading') renderStops();
})();
