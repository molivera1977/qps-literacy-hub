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
  // Two passes (Marcos 10/20: "make them do the entire level twice with a required 80 % check every time
  // to guarantee mastery before testing with Mr. O"): a pass = the practice steps, then a Check at PASS or
  // better. "Ready for Mr. O's check" only after PASSES_NEEDED of them.
  const PASSES_NEEDED = 2;
  const CHECK_N = 10, RECENT_KEEP = 40;               // a Check's items; how many past Check words a stop remembers
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
      // Mr. O's recording only for a word of this stop (real, or a made-up word he recorded): a choice spelled
      // like one of his big-word syllables (sta, ca, con…) must not play that syllable (10/20: "sta" said "stay")
      const own = realWords.has(word) || (stop && (stop.made || []).some(m => m.replace(/\|/g, '') === word));
      const rec = own ? await loadBuffer(word.toLowerCase()) : null;
      if (rec) return playBuffer(rec);
      return speakComputer(realWords.has(word) || !window.Respell ? word : Respell.respell(soundParts(chunks)));
    });
  }
  // A part that says something other than its letters (an·i·mal: the i says "uh") has a sound note on its
  // stop (practice-data.js sounds, named in SOUND_NAMES): the tile shows the letters, this recording plays.
  function partFile(chunks, i) {
    const notes = stop && stop.sounds && stop.sounds[chunks.join('|')];
    const n = notes && notes[chunks[i]];
    return n ? (SOUND_NAMES[n] || n) : null;
  }
  const sayPart = (chunks, i) => sayChunk(chunks[i], partFile(chunks, i));
  function sayChunk(chunk, file) {
    return guarded(async () => {
      if (file) { const buf = await buildBlend([file]); return buf ? playBuffer(buf) : speakComputer(chunk); }
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
  // Parts light up while they are said (Marcos 10/25: "shouldn't these highlight when the sound is said"):
  // one tile for a sound, every tile for the whole word. play() is called at once, so inSequence still applies.
  // A newer run may light the same tile before this one ends; then it is that run's to turn off.
  let litRun = 0;
  async function lightWhile(els, play) {
    const mine = ++litRun;
    els.forEach(e => { e.classList.add('lit'); e.litBy = mine; });
    try { return await play(); } finally { els.forEach(e => { if (e.litBy === mine) e.classList.remove('lit'); }); }
  }
  // Marcos 10/25: "should all sounds light up when they speak after tapping" — yes, one rule: what is being said
  // lights up. Letters on screen light themselves; a 🔊 button lights when the word it says is not on screen.
  function speaker(cls, text, play, label) { const b = button(cls, text, () => lightWhile([b], play), label); return b; }

  /* ---------- heard to the end (Marcos 10/26: "do all three") ----------
     A sound counts as heard only if nothing cut it off: no newer tap (playRun), no leaving the screen and
     no 🔊 reading over it (cutRun). play() must make ONE sayWord / sayChunk call. */
  let cutRun = 0;
  async function playedThrough(play) {
    const run = playRun, cut = cutRun;
    await play();
    return playRun === run + 1 && cutRun === cut;
  }
  // A 🔊 that reads something over a sound: the sound stops for good and does not count as heard.
  function takeOver() { cutRun++; lessonRun++; exampleRun++; if (window.stopSounds) stopSounds(); }
  const lockEl = (e) => { e.inert = true; e.classList.add('p-locked'); };
  const openEl = (e) => { e.inert = false; e.classList.remove('p-locked'); };

  // 1. A word that is not on screen is heard before any answer (the 🔊 glows, the answers are dimmed until then).
  //    hear.locks(...els) names what waits. Hearing it again later is always open.
  function mustHear(cls, text, play, label) {
    let heard = false, locked = [];
    const b = button(cls + ' p-pulse', text, async () => {
      if (!(await lightWhile([b], () => playedThrough(play))) || heard) return;
      heard = true;
      b.classList.remove('p-pulse');
      locked.forEach(openEl);
    }, label);
    b.locks = (...els) => { locked = els; if (!heard) els.forEach(lockEl); return b; };
    return b;
  }

  // 2. Every 🔊 choice is heard to the end before any pick (Marcos 10/30: "we should emphasize to listen to each
  //    word before picking. Maybe locking out a choice until all choices are heard"). Until then a tap only plays;
  //    the next one to hear glows, a heard one gets a ✓. Then `pickLine` is read aloud (the choices wait for it),
  //    and from then on a tap plays AND picks; "This one ✅" works once one is picked.
  //    reset() after a wrong pick: "Listen to each one again" means all of them, and the pick is gone.
  function hearEach(opts, check, fb, pickLine) {
    const heard = new Set();
    let picking = false, picked = null;
    const show = () => {
      const btns = [...opts.children];
      const left = btns.find(b => !heard.has(b));
      btns.forEach(b => { b.classList.toggle('heard', heard.has(b)); b.classList.toggle('p-pulse', b === left); b.classList.toggle('picked', b === picked); });
      if (!check.dataset.answered) check.disabled = !picked;
    };
    const tap = async (b, play) => {
      if (picking) { picked = b; show(); }
      if (!(await lightWhile([b], () => playedThrough(play)))) return;
      heard.add(b);
      show();
      if (picking || heard.size < opts.children.length) return;
      await tell(fb, pickLine, [opts]);
      picking = true;
    };
    return { tap, picked: () => picked, reset: () => { heard.clear(); picking = false; picked = null; show(); }, show };
  }

  // 3. A correction is read aloud — its sounds in Mr. O's recordings, its words by the voice (lesson-line marks:
  //    /ar/ a sound, {ar} letter names, [c|ar] a word) — then `then` plays (the word or part again, one sound).
  //    What it locks opens only once both were heard to the end; cut off, its 🔊 glows to hear it again.
  //    Resolves when heard.
  function tell(fb, text, lock = [], then = null) {
    return new Promise(resolve => {
      const line = lessonLine(text);
      line.el.classList.add('p-told-line');
      lock.forEach(lockEl);
      const run = async () => {
        again.classList.remove('p-pulse');
        const ok = (await readLesson([line])) && (!then || await playedThrough(then));
        if (!ok) { again.classList.add('p-pulse'); return; }
        lock.forEach(openEl);
        resolve();
      };
      const again = button('p-say', '🔊', run, 'Hear that again');
      fb.textContent = '';
      fb.classList.add('p-told');
      fb.append(again, line.el);
      run();
    });
  }
  // Plain feedback ("✅ Yes!") replaces a correction
  function plain(fb, text) { fb.classList.remove('p-told'); fb.textContent = text; }

  /* ---------- near-miss choices (must SOUND different from the word) ---------- */
  // Choices a child must never see or hear (10/20, Marcos: "fag … this might not be appropriate"): slurs,
  // swears, crude and drug words, by spelling AND by what the voice is handed (shirt → "shit", deap → "dope").
  // A blocked choice is skipped and the stop's next contrast fills in.
  const NEVER = new Set(('fag fagg jap japp shit shitt fok fock fuk fuck fuc fuq suk sux cum kum cok cock dik dick nig nigg ' +
    'kike spic spik chink gook wop dyke homo slut hoe ho pimp thug rape porn sex nude boob tit tits titt puss butt ass ' +
    'poop pee piss pis shat crap damn hell bitch jiz jizz cuck kuck turd fart wang dong prick prik twat wank bum gay ' +
    'dope doap weed coke koke kok vape vayp meth gun kill die nazi yid goy paki coon kune spaz gyp ' +
    'fark hor hore whore horz hors muff zit feck fick fak fack frick').split(' '));   // 10/21 stop 6: her→hor, fork→fark, harz→horz
  // …and no choice that ends in a lone vowel: car → "ca", her → "he" read with a LONG vowel (10/20, "sta")
  // …nor w/wh/qu + short a: the voice says "wo" (wat → "what", waf, quap; Marcos 10/20). wack and wap measured right.
  const VOICE_CANT = new Set(['shin', 'fol']);
  // compared loosely, as the tests do: ph→f, ck/c/q→k, doubled consonants once ("frik" = frick, "shitt" = shit)
  const fold = (w) => String(w).toLowerCase().replace(/ph/g, 'f').replace(/ck/g, 'k').replace(/c(?=[aou]|$)/g, 'k').replace(/q/g, 'k').replace(/([^aeiou])\1+/g, '$1');
  const NEVER_FOLDED = new Set([...NEVER].map(fold));
  const allowed = (v) => !NEVER_FOLDED.has(fold(join(v))) && !(window.Respell && NEVER_FOLDED.has(fold(window.Respell.respell(v)))) &&
    !/^[aeiou]$/.test(v[v.length - 1]) && !/^(w|wh|qu)\|a\|(?!ck$|p$)/.test(v.join('|')) &&
    join(v).length > 2 &&   // no two-letter choice: ot, ib were read wrong (10/20)
    !/(^|\|)c\|[eiy]/.test(v.join('|')) &&   // no c before e/i/y: a soft c ("cid" reads "sid"), the voice says k
    !VOICE_CANT.has(join(v));   // the voice cannot say these right, however spelled (Marcos 10/20: shin, fol; he kept pol hol dol bol)
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
    return out.filter(v => join(v) !== join(chunks) && allowed(v)).slice(0, 2);
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
      if (rec.passes) card.append(el('span', 'stop-pass', rec.passes >= PASSES_NEEDED ? '✅✅ 2 of 2 passes' : `✅⬜ ${rec.passes} of ${PASSES_NEEDED} passes`));
      grid.append(card);
    });
    if (window.QPSLogin) QPSLogin.renderPlan();      // the signed-in student's own stop
  }

  function openStop(id) {
    stop = PRACTICE_STOPS.find(s => s.id === id);
    steps = buildSteps(stop);
    realWords = collectReal(stop);
    const rec = stopRecord(id);
    // A stop in progress picks up where the student stopped (after a Check: back at the practice steps).
    stepIndex = (rec.reached || 0) >= steps.length ? 0 : (rec.reached || 0);
    $('welcomeView').style.display = 'none';
    $('appView').style.display = 'none';
    $('practiceView').style.display = 'block';
    $('practiceTitle').textContent = `${stop.num} · ${stop.name}`;
    document.title = `QPS Literacy Hub | Practice ${stop.num}`;
    showStep();
    window.scrollTo(0, 0);
  }

  // Leaving a screen ends everything it was reading (Marcos 10/23: "if I leave I still hear the read
  // aloud"): the lesson or example stops for good, not just the line it was on.
  function hush() {
    cutRun++;
    lessonRun++; exampleRun++;
    if (window.stopSounds) stopSounds();
    if (window.QPSRead) QPSRead.stop(); else if (window.speechSynthesis) speechSynthesis.cancel();
  }
  // Leaving the site (another tab, another site, closing it) ends it too, and Back doesn't bring it back.
  // (QPSRead.stop() here also ends a Reading-for-meaning passage: this file is on every page of the hub.)
  window.addEventListener('pagehide', hush);
  document.addEventListener('visibilitychange', () => { if (document.hidden) hush(); });

  function backToStops() {
    hush();
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
    hush();
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
    line.split(/(\/[a-z]+(?:~[a-z]+)?\/|\{[a-z]+\}|\[[a-z|]+\])/).forEach(tok => {
      if (!tok) return;
      // [c|a|t] (corrections, 10/26): a whole word, said like every word on the stop (made-up ones respelled)
      const word = tok.match(/^\[([a-z|]+)\]$/);
      if (word) {
        const chunks = split(word[1]);
        const chip = speaker('p-sound p-word-chip', join(chunks), () => sayWord(chunks), `Hear ${join(chunks)}`);
        p.append(chip);
        segs.push({ kind: 'word', chunks, el: chip });
        flushText();
        return;
      }
      // /i~uh/ shows i and plays Mr. O's "uh"; /uh/ /ee/ /air/ … are SOUND_NAMES (stops 9a–9c, 10/30)
      const sound = tok.match(/^\/([a-z]+)(?:~([a-z]+))?\/$/);
      if (sound) {
        const snd = sound[2] || sound[1];
        const file = SOUND_NAMES[snd] || (sound[2] ? fileFor(snd) : null);
        const chip = speaker('p-sound', sound[1], () => sayChunk(sound[1], file), `Hear the sound ${snd}`);
        p.append(chip);
        segs.push({ kind: 'sound', chunk: sound[1], file, el: chip });
        flushText();
        return;
      }
      const run = () => { if (!text) { text = { kind: 'text', el: el('span', 'p-say-run'), say: [] }; p.append(text.el); segs.push(text); } return text; };
      const letters = tok.match(/^\{([a-z]+)\}$/);
      if (letters) {
        const w = el('span', 'rw p-letters', letters[1]);
        run().el.append(w);
        text.say.push(letters[1].toUpperCase().split('').join('-'));   // S-H, A: capitals so the voice says letter names
      } else {
        tok.split(/(\s+)/).forEach(t => {
          if (!t) return;
          if (/^\s+$/.test(t)) { (text ? text.el : p).append(document.createTextNode(t)); return; }
          // "+" and "=" are on screen only (10/30, reading specialist: the voice said "plus" and "equals"). Each
          // keeps its beat: "/mo/ + /tor/ = motor" is heard "mo … tor … motor", paced as before.
          if (t === '+' || t === '=') { flushText(); segs.push({ kind: 'gap' }); p.append(document.createTextNode(t)); return; }
          // punctuation right after a sound (/ee/. or /ic/:) is shown only: no silent run, so no extra pause
          if (!text && !/[a-z0-9]/i.test(t)) { p.append(document.createTextNode(t)); return; }
          run().el.append(el('span', 'rw', t));
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
          await lightWhile([sg.el], () => inSequence(() => sayChunk(sg.chunk, sg.file)));
        } else if (sg.kind === 'word') {
          await lightWhile([sg.el], () => inSequence(() => sayWord(sg.chunks)));
        } else if (sg.kind === 'text' && /[a-z0-9]/i.test(sg.el.dataset.say)) {   // a gap (+ or =) is a beat only
          if (window.QPSRead) await QPSRead.say(sg.el); else await speakComputer(sg.el.dataset.say);
        }
        const next = line.segs[k + 1];
        await wait(!next ? PAUSE.line : sg.kind !== 'text' || next.kind !== 'text' ? PAUSE.sound : PAUSE.word);
      }
    }
    return mine === lessonRun;
  }

  /* ---------- shared pieces ---------- */
  // said = what the voice says when it differs from the screen (letter names: "S-H" for sh)
  function direction(area, text, said) {
    const row = el('div', 'p-direction');
    const p = window.QPSRead ? QPSRead.wrap(el('p', ''), text) : el('p', '', text);
    if (said) p.dataset.say = said;
    // A speaker always answers: it stops whatever is being read and reads this line.
    const btn = button('p-say', '🔊', () => { takeOver(); return window.QPSRead ? QPSRead.say(p) : sayText(said || text); }, 'Hear the directions');
    row.append(btn, p);
    area.append(row);
    return { row, btn, p, text };
  }

  /* Directions first (Marcos 10/19: "the directions should be forced to be hit before they can hit
     anything. Kids are clicking without knowing what to do."). A step's work stays locked until its
     directions are heard to the end; stopped early does not count. A device with no voice gets a
     reading wait, then "I read it". Once open, the 🔊 reads them again any time. */
  const READ_MS_PER_WORD = 450, READ_MIN_MS = 3000;
  function lockUntilHeard(dir, work, onOpen) {
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
      if (onOpen) onOpen();
    };
    dir.btn.onclick = async () => {
      if (reading) return;                                // a second tap must not cut the reading off
      reading = true;
      takeOver();
      const how = window.QPSRead ? await QPSRead.say(dir.p) : (await sayText(dir.p.dataset.say || dir.text), 'end');
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
  function rounds(area, items, round, done, introText, introSaid) {
    let i = 0;
    const box = el('div', 'p-round');
    const dir = direction(area, introText, introSaid);
    area.append(box);
    lockUntilHeard(dir, box);
    const step = () => {
      box.innerHTML = '';
      progress(box, i, items.length);
      round(box, items[i], () => {
        i++;
        if (i >= items.length) { box.innerHTML = ''; progress(box, i, items.length); box.append(el('p', 'p-well', `⭐ Nice work! You finished the ${STEP_NAMES[steps[stepIndex]]} step.`)); done(); }
        else {
          const go = button('p-btn p-go', 'Next one ➡️', step);
          box.append(go);
          go.focus();
        }
      });
    };
    step();
  }

  // A signed-in student's starting stop (login.js TRACKS) — recap screens are for them. A guest or Mr. O sees all.
  function startsHere() {
    const tracks = window.QPSLogin && QPSLogin._tracks, who = window.QPS_STUDENT;
    return !tracks || !who || !(who in tracks) || tracks[who] === stop.id;
  }
  // One Learn screen: its lines are read when the student taps Hear the lesson (heard to the end), then every
  // example is heard to the end; then finished(). n of total screens shows as dots.
  /* Try it (Marcos 10/30: "shouldn't there be some questions in each section so kids can practice a little within the
     long learning section?"): after a teaching screen's words, one practice item — chop a word (9a–9c; stop 10's
     chop screens: one chop) or, on stop 10, what a word means. Not graded. Its line is read first and the item waits
     until it was heard; then finished() (Next). */
  function tryIt(card, t, finished) {
    const box = el('div', 'p-round p-try'), said = el('div', 'p-feedback p-item-line'), work = el('div');
    box.append(said, work);
    card.append(box);
    if (typeof t === 'string') {
      chopRound(work, split(t), finished, false);
      tell(said, stop.parts ? 'Try it. Make one chop.' : 'Try it. Chop this word.', [work]);
    } else {
      const order = meaningRound(work, t, finished);
      tell(said, `Try it. ${t.ask}: ${order[0]}, or ${order[1]}?`, [work]);
    }
    box.scrollIntoView({ block: 'nearest' });
  }
  // Stop 10: what a word means — two choices (the first in the data is right), read in the line above, one tap.
  // The answer is told aloud either way. Returns the choices in screen order.
  function meaningRound(box, t, finish) {
    mark(box, t.choices[0]);
    box.append(tiles(split(t.word), { big: true }));
    const fb = feedback(box);
    const opts = el('div', 'p-options');
    const order = shuffle(t.choices);
    order.forEach(c => {
      const b = button('p-option', c, async () => {
        if (opts.dataset.done) return;
        opts.dataset.done = '1';
        const ok = c === t.choices[0];
        b.classList.add(ok ? 'right' : 'wrong');
        await tell(fb, `${ok ? 'Yes!' : 'Not that one.'} ${t.ask} ${t.choices[0]}.`, [opts]);
        finish();
      });
      opts.append(b);
    });
    box.append(opts, fb);
    return order;
  }
  function learnScreen(area, screen, n, total, finished) {
    const card = el('div', 'p-learn');
    const lines = screen.lines.map(lessonLine);
    // The lesson is this step's directions: its sound tiles and examples open once it is heard.
    const lockables = () => [ex, tapDir.row, ...card.querySelectorAll('.p-sound')];
    const sayBtn = button('p-btn p-hear', '🔊 Hear the lesson', async () => {
      if (!(await readLesson(lines))) return;
      lockables().forEach(e => { e.inert = false; e.classList.remove('p-locked'); });
      sayBtn.classList.remove('p-pulse');
      if (note.isConnected) note.remove();
      nextExample();
      if (window.QPSRead && exBtns.some(b => !heard.has(b))) QPSRead.say(tapDir.p);   // Marcos 10/26: "tap a word to hear it should be said aloud"
    });
    const note = el('p', 'p-hear-note', '👆 Tap Hear the lesson first.');
    sayBtn.classList.add('p-pulse');                    // pulses until the lesson is heard (Marcos 10/19)
    card.append(el('h2', 'p-learn-title', `Learn: ${stop.name}`));
    if (total > 1) progress(card, n, total);           // which screen of the lesson
    lines.forEach(l => card.append(l.el));
    card.append(sayBtn, note);
    const tapDir = direction(card, 'Tap each word to hear it.');
    const ex = el('div', 'p-examples');
    // Next waits until every example was heard to the end (Marcos 10/26: "shouldn't the student be forced to
    // click and hear each one before hitting next"). One cut off by another tap is not heard yet.
    // The next one to hear glows; a heard one gets a ✓.
    const exBtns = [], heard = new Set();
    let tried = false;
    const nextExample = () => {
      exBtns.forEach(x => x.classList.remove('p-pulse'));
      const left = exBtns.find(x => !heard.has(x));
      if (left) left.classList.add('p-pulse');
      else if (!screen.try) finished();
      else if (!tried) { tried = true; tryIt(card, screen.try, finished); }   // an example heard again: no second Try it
    };
    // "a>b" shows a before-and-after pair, like mat → mate.
    screen.examples.forEach(w => {
      const words = w.split('>').map(split);
      const rows = words.map(chunks => tiles(chunks));
      // m · a · t … mat → m · ate … mate, with a beat between sounds, before the word, and between words;
      // each tile lights while its sound is said, the whole word while the word is said
      const b = button('p-example', '', async () => {
        if (window.stopSounds) stopSounds();
        if (window.QPSRead) QPSRead.stop();
        lessonRun++;
        const mine = ++exampleRun;                       // another tap ends this example
        const still = () => mine === exampleRun;
        for (const [k, chunks] of words.entries()) {
          const parts = [...rows[k].children];
          if (k) await wait(900);
          if (chunks.length > 1) {
            for (const [i] of chunks.entries()) { if (!still()) return; await lightWhile([parts[i]], () => inSequence(() => sayPart(chunks, i))); await wait(350); }
            await wait(150);
          }
          if (!still()) return;
          await lightWhile(parts, () => inSequence(() => sayWord(chunks)));
        }
        if (!still()) return;
        heard.add(b);
        b.classList.add('heard');
        nextExample();
      }, `Hear ${words.map(join).join(' and ')}`);
      rows.forEach((row, k) => { if (k) b.append(el('span', 'p-arrow', '→')); b.append(row); });
      exBtns.push(b);
      ex.append(b);
    });
    card.append(ex);
    lockables().forEach(e => { e.inert = true; e.classList.add('p-locked'); });
    area.append(card);
  }

  /* ---------- activities ---------- */
  const ACTIVITIES = {
    learn(area, done) {
      // Big-word stops teach one idea per screen (Marcos 10/30, "accept all"). A recap screen is only for a student
      // who starts on this stop, not one coming up from the stop before. A screen's label is for Mr. O only.
      const screens = stop.learn.screens ? stop.learn.screens.filter(sc => !sc.recap || startsHere())
        : [{ lines: stop.learn.lines, examples: stop.learn.examples }];
      let at = 0;
      const show = () => {
        area.innerHTML = '';
        let ended = false;
        learnScreen(area, screens[at], at, screens.length, () => {
          if (ended) return;                               // an example heard again calls this again
          ended = true;
          if (++at >= screens.length) return done();
          const go = button('p-btn p-go', 'Next ➡️', () => { hush(); show(); window.scrollTo(0, 0); });
          area.querySelector('.p-learn').append(go);
          go.focus();
        });
      };
      show();
    },

    blend(area, done) {
      rounds(area, pick(stop.real, COUNTS.blend).map(split), (box, chunks, finish) => {
        let next = 0;
        const row = el('div', 'p-tiles big');
        const blendBtn = button('p-btn p-hear', '🔊 Blend it', async () => {
          await lightWhile([...row.children], () => sayWord(chunks));
          row.classList.add('blended');
          blendBtn.disabled = true;
          finish();
        });
        blendBtn.disabled = true;
        chunks.forEach((c, i) => {
          const t = button('p-tile tap' + (i === 0 ? ' glow' : ''), c, async () => {
            if (i > next) return;                           // not yet: the sounds go in order
            if (i < next) return lightWhile([t], () => sayPart(chunks, i));   // a sound already heard: hear it again (Marcos 10/19)
            // the tap moves on at once, so a quick next tap is taken (and cuts this sound off)
            t.classList.remove('glow'); t.classList.add('heard');
            next++;
            if (next < chunks.length) row.children[next].classList.add('glow');
            await lightWhile([t], () => sayPart(chunks, i));
            if (next >= chunks.length) blendBtn.disabled = false;
          }, `Sound ${i + 1}: ${c}`);
          row.append(t);
        });
        box.append(row, blendBtn);
      }, done, `Tap each ${stop.big ? 'part' : 'sound'} in order and say it. Then tap Blend it and say the whole word.`);
    },

    sort(area, done) {
      const s = stop.sort;
      // a box as the correction says it: a sound box by Mr. O's recording (/a/, /sh/, /ar/), the others by name
      const boxName = (b) => { const n = b.label.split(' — ')[0]; return n === b.key || n.startsWith(b.key + ' ') ? `/${b.key}/` : n; };
      rounds(area, pick(s.words, COUNTS.sort), (box, [w, key], finish) => {
        const chunks = split(w);
        mark(box, key);
        const word = el('div', 'p-hidden-word', s.seeWord ? join(chunks) : '?');
        const fb = feedback(box);
        // a word on screen lights itself; a hidden one lights its 🔊
        const hear = s.seeWord ? button('p-btn p-hear', '🔊 Hear the word', () => lightWhile([word], () => sayWord(chunks)))
          : mustHear('p-btn p-hear', '🔊 Hear the word', () => sayWord(chunks));
        box.append(hear, word);
        const bins = el('div', 'p-bins');
        if (!s.seeWord) hear.locks(bins);                   // the word is hidden: no box before it was heard
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
              await tell(fb, `Not quite. [${chunks.join('|')}] goes in the ${boxName(right)} box.`);
            }
            finish();
          });
          bins.append(bin);
        });
        box.append(s.prompt ? el('p', 'p-small', s.prompt) : '', bins, fb);
      }, done, ...(s.directions || [s.seeWord ? 'Read the word. Tap Hear the word to check. Then tap the box the word goes in.' : 'The word is hidden. Tap Hear the word. Then tap the box the word goes in.']));
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
        const aTiles = tiles(A);
        const aBtn = button('p-word-btn', '', () => lightWhile([...aTiles.children], () => sayWord(A)), `Hear ${join(A)}`);
        aBtn.append(aTiles);
        box.append(aBtn);
        const makeBtn = mustHear('p-btn p-hear', '🔊 Now make this word', () => sayWord(B));
        box.append(makeBtn);
        const target = el('div', 'p-tiles big');
        const shown = [...B.slice(0, d.start), '___', ...B.slice(d.start + d.newLen)];
        shown.forEach(c => target.append(el('span', 'p-tile' + (c === '___' ? ' blank' : ''), c)));
        box.append(target);
        const correct = d.newPart;
        const choices = shuffle([correct, ...pick([...new Set(middles)].filter(m => m !== correct && m.replace(/\|/g, '') !== correct.replace(/\|/g, '')), 2)]);
        const opts = el('div', 'p-options');
        makeBtn.locks(opts);                                // the new word is not on screen: no part before it was heard
        choices.forEach(c => {
          const o = button('p-option', c.replace(/\|/g, ''), async () => {
            if (opts.dataset.done) return;
            if (c === correct) {
              opts.dataset.done = '1';
              o.classList.add('right');
              target.innerHTML = '';
              target.append(...tiles(B, { big: true }).children);
              plain(fb, `✅ Yes! ${join(A)} turned into ${join(B)}.`);
              await lightWhile([...target.children], () => sayWord(B));
              finish();
            } else {
              o.classList.add('wrong'); o.disabled = true;
              await tell(fb, 'Not that one. Listen to the new word again.', [opts], () => lightWhile([makeBtn], () => sayWord(B)));   // the new word is not on screen yet
            }
          });
          opts.append(o);
        });
        box.append(opts, fb);
      }, done, 'Listen to the new word. Pick the part that changes to make it.');
    },

    build(area, done) {
      const items = pick(stop.real, COUNTS.build).map(split);
      rounds(area, items, (box, chunks, finish) => buildRound(box, chunks, finish, false), done, 'Tap Hear the word. Tap the parts in order to build the word. Then tap Check.');
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
          line.append(speaker('p-sword rw', word, () => sayText(word.replace(/[.,?!]/g, '')), `Hear ${word}`));
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
        stop.parts ? 'Find the prefix or the suffix. Make one chop: tap the line right after the prefix or right before the suffix. Then tap Check.'
                   : 'Tap Hear the word. Then tap a line between two letters to chop the word. Each part has one vowel sound. Then tap Check.');
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
        const hear = mustHear('p-btn p-hear', '🔊 Hear the sound', () => sayChunk(letter));
        box.append(hear);
        const opts = el('div', 'p-options');
        hear.locks(opts);
        shuffle([letter, ...pick(stop.letters.filter(l => l !== letter), 2)]).forEach(l => {
          const o = button('p-option big', l, async () => {
            if (opts.dataset.done) return;
            if (l === letter) { opts.dataset.done = '1'; o.classList.add('right'); plain(fb, '✅ Yes!'); finish(); }
            else { o.classList.add('wrong'); o.disabled = true; await tell(fb, 'Not that one. That letter says a different sound. Listen again.', [opts], () => lightWhile([hear], () => sayChunk(letter))); }
          });
          opts.append(o);
        });
        box.append(opts, fb);
      }, done, 'Tap Hear the sound. Pick the letter that makes it.');
    },

    check(area, done) {
      // 10 different words, the ones this student has not had in a Check lately first (Marcos 10/20: a retry
      // must not pass on remembered answers — about half of a Check's words used to come back next time)
      const words = checkWords(stop.letters || (stop.big ? stop.real : stop.made));
      let items;
      if (stop.letters) items = words.map((l, i) => ({ kind: i % 2 ? 'letterHear' : 'letterRead', chunks: [l] }));
      else if (stop.big) items = shuffle(words.map((w, i) => ({ kind: i < 5 ? 'chop' : 'build', chunks: split(w) })));
      else items = shuffle(words.map((w, i) => ({ kind: i < 6 ? 'decode' : 'spell', chunks: split(w) })));
      const results = [];
      checkStarted = new Date();
      // a Check with 🔊 choices says to hear them all (Marcos 10/30); a big-word Check (chop, build) has none
      const dir = direction(area, `Practice Check. Do your best.${stop.big ? '' : ' Listen to every choice before you pick.'} This time the site does not tell you the answer until the end.`);
      const box = el('div', 'p-round');
      area.append(box);
      let opened = false, waiting = null;
      lockUntilHeard(dir, box, () => { opened = true; if (waiting) waiting(); waiting = null; });
      let i = 0;
      const next = () => {
        box.innerHTML = '';
        if (i >= items.length) return finishCheck(area, box, items, results, done);
        progress(box, i, items.length);
        const it = items[i];
        const record = (ok) => { results.push(ok); i++; next(); };
        if (it.kind === 'decode') decodeRound(box, it.chunks, record, true);
        else if (it.kind === 'spell') spellRound(box, it.chunks, record, true);
        else if (it.kind === 'build' || it.kind === 'chop') {
          // big-word Check: "Chop this word." / "Build this word." read first (reading specialist 10/30)
          const said = el('div', 'p-feedback p-item-line'), work = el('div');
          box.append(said, work);
          (it.kind === 'chop' ? chopRound : buildRound)(work, it.chunks, record, true);
          if (work.dataset.answer) box.dataset.answer = work.dataset.answer;
          const tellIt = () => tell(said, it.kind === 'chop' ? 'Chop this word.' : 'Build this word.', [work]);
          if (opened) tellIt(); else { lockEl(work); waiting = tellIt; }
        }
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
    const hear = mustHear('p-btn p-hear', '🔊 Hear the word', () => sayWord(chunks));
    box.append(hear);
    const slots = el('div', 'p-tiles big');
    const pool = el('div', 'p-pool');
    const filled = chunks.map(() => null);
    const decoys = decoysFor(chunks);
    // Load every part's recording now, so the first tap on a part plays without waiting for it
    if (window.loadBuffer) [...chunks, ...decoys].forEach((c, i) => { if (!(stop.split && stop.split[c])) loadBuffer((i < chunks.length && partFile(chunks, i)) || fileFor(c)); });
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
        if (!graded) lightWhile([slotEls[at]], () => (card.id[0] === 'w' ? sayPart(chunks, +card.id.slice(1)) : sayChunk(card.c)));   // the box the part went into
      });
      pool.append(b);
    });
    const check = button('p-btn p-check', 'Check ✅', async () => {
      if (filled.includes(null)) { plain(fb, 'Fill every box first.'); return; }
      const wrongAt = filled.findIndex((f, i) => f.c !== chunks[i]);
      if (graded) { check.disabled = true; return finish(wrongAt < 0); }
      if (wrongAt < 0) { check.disabled = true; slots.classList.add('blended'); plain(fb, `✅ You built ${join(chunks)}!`); await lightWhile(slotEls, () => sayWord(chunks)); return finish(); }
      slotEls[wrongAt].classList.add('wrong-slot');
      setTimeout(() => slotEls[wrongAt].classList.remove('wrong-slot'), 1500);
      for (let i = wrongAt; i < filled.length; i++) { if (filled[i]) { filled[i].btn.style.visibility = 'visible'; filled[i] = null; slotEls[i].textContent = ''; slotEls[i].classList.add('slot'); } }
      await tell(fb, `Look at box ${wrongAt + 1}. Listen to the part that goes in box ${wrongAt + 1}. Then try again.`, [slots, pool, check],
        () => lightWhile([slotEls[wrongAt]], () => sayPart(chunks, wrongAt)));   // that box's part
    });
    hear.locks(slots, pool, check);                       // the word is not on screen: nothing before it was heard
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
    const opts = el('div', 'p-options');
    options.forEach((o, n) => {
      const b = button('p-option listen', `🔊 ${n + 1}`, () => each.tap(b, () => sayWord(o)), `Choice ${n + 1}`);
      b.choice = o;
      if (QA) b.dataset.say = join(o);
      opts.append(b);
    });
    const check = button('p-btn p-check', 'This one ✅', async () => {
      const picked = each.picked();
      if (!picked) { plain(fb, 'Tap a speaker first.'); return; }
      const ok = join(picked.choice) === join(chunks);
      if (graded) { check.dataset.answered = '1'; check.disabled = true; return finish(ok); }
      if (ok) { check.dataset.answered = '1'; check.disabled = true; plain(fb, '✅ Yes! That one says the word.'); return finish(); }
      const mark = patternIndex(chunks);
      picked.classList.add('wrong');
      each.reset();
      tell(fb, mark >= 0 ? `Not that one. Look at the {${chunks[mark]}} part. Listen to each one again.` : 'Not that one. Listen to each one again and look at every letter.', [opts]);
    });
    const each = hearEach(opts, check, fb, 'Now tap the one that says the word.');
    each.show();
    box.append(opts, check, fb);
  }

  function spellRound(box, chunks, finish, graded) {
    mark(box, chunks.join('|'));
    const fb = feedback(box);
    const hear = mustHear('p-btn p-hear', '🔊 Hear the word', () => sayWord(chunks));
    box.append(hear);
    const opts = el('div', 'p-options');
    hear.locks(opts);                                     // a made-up word never shown: no spelling before it was heard
    shuffle([chunks, ...nearMisses(stop, chunks)]).forEach(o => {
      const b = button('p-option', join(o), async () => {
        if (opts.dataset.done) return;
        const ok = join(o) === join(chunks);
        if (graded) { opts.dataset.done = '1'; return finish(ok); }
        if (ok) { opts.dataset.done = '1'; b.classList.add('right'); plain(fb, '✅ Yes! That is how it is spelled.'); return finish(); }
        b.classList.add('wrong'); b.disabled = true;
        const mark = patternIndex(chunks);
        await tell(fb, mark >= 0 ? `Not that one. Listen for the /${chunks[mark]}/ sound.` : 'Not that one. Listen again.', [opts],
          () => lightWhile([hear], () => sayWord(chunks)));
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
    // a second chop that sounds right too (practice-data.js chop2, Marcos 10/30: "accept all"), like an·im·al
    const alt = stop.chop2 && stop.chop2[chunks.join('|')] ? split(stop.chop2[chunks.join('|')]) : null;
    pos = 0;
    const altCuts = alt && new Set(alt.slice(0, -1).map(c => (pos += c.length)));
    const same = (set) => !!set && cuts.size === set.size && [...set].every(a => cuts.has(a));
    const row = el('div', 'p-chop');
    const gaps = [], letters = [];
    [...word].forEach((ch, i) => {
      letters.push(el('span', 'p-letter', ch));
      row.append(letters[i]);
      if (i < word.length - 1) {
        const g = button('p-gap', '', () => { if (cuts.has(i + 1)) { cuts.delete(i + 1); g.classList.remove('cut'); } else { cuts.add(i + 1); g.classList.add('cut'); } }, `Cut after letter ${i + 1}`);
        gaps.push(g);
        row.append(g);
      }
    });
    // 9a–9c: the word is heard before any chop (Marcos 10/30, "accept all"); stop 10's base words are read by sight
    const sayIt = () => lightWhile([...letters, ...gaps], () => sayWord(chunks));
    const hear = stop.parts ? button('p-btn p-hear', '🔊 Hear the word', sayIt) : mustHear('p-btn p-hear', '🔊 Hear the word', sayIt);
    box.append(hear, row);
    const check = button('p-btn p-check', 'Check ✅', async () => {
      const ok = same(answer), okAlt = !ok && same(altCuts);
      if (graded) { check.disabled = true; return finish(ok || okAlt); }
      check.disabled = true;
      gaps.forEach(g => { g.disabled = true; });
      if (okAlt) {                                         // their chop stays; its parts may have no recordings, so the word
        fb.textContent = `✅ Yes! ${alt.join(' · ')} works too.`;
        await sayIt();
        return finish();
      }
      gaps.forEach((g, i) => g.classList.toggle('cut', answer.has(i + 1)));
      // a wrong chop is told, read aloud, before its parts play (10/30: it sounded just like a right one)
      if (ok) fb.textContent = `✅ Yes! ${chunks.join(' · ')}`;
      else await tell(fb, 'That chop is not right. Here are the parts. Listen to each part.');
      // each part lights while it is said (its letters and the gaps between them), then the whole word
      let at = 0;
      for (const [k, c] of chunks.entries()) {
        const n = at; at += c.length;
        await lightWhile([...letters.slice(n, at), ...gaps.slice(n, at - 1)], () => sayPart(chunks, k));
      }
      await sayIt();
      finish();
    });
    if (hear.locks) hear.locks(row, check);               // nothing to chop before the word was heard
    box.append(check, fb);
  }

  // Letter shown; three sounds to choose from (stop 1).
  function choiceRound(box, letter, choices, finish, graded) {
    mark(box, letter);
    const fb = feedback(box);
    box.append(el('div', 'p-big-word', letter));
    const opts = el('div', 'p-options');
    choices.forEach((c, n) => {
      const b = button('p-option listen', `🔊 ${n + 1}`, () => each.tap(b, () => sayChunk(c)), `Sound ${n + 1}`);
      b.choice = c;
      if (QA) b.dataset.say = c;
      opts.append(b);
    });
    const check = button('p-btn p-check', 'This one ✅', () => {
      const picked = each.picked();
      if (!picked) { plain(fb, 'Tap a speaker first.'); return; }
      if (graded) { check.dataset.answered = '1'; check.disabled = true; return finish(picked.choice === letter); }
      if (picked.choice === letter) { check.dataset.answered = '1'; check.disabled = true; plain(fb, `✅ Yes! That is the sound of ${letter}.`); return finish(); }
      picked.classList.add('wrong');
      each.reset();
      tell(fb, 'Not that one. Listen to each sound again.', [opts]);
    });
    // "this letter", not its name: a lone A at the end is read "uh" (Samantha, 10/30), and its sound would give it away
    const each = hearEach(opts, check, fb, 'Now tap the one that is the sound of this letter.');
    each.show();
    box.append(opts, check, fb);
  }

  function letterHearCheck(box, letter, finish) {
    mark(box, letter);
    const hear = mustHear('p-btn p-hear', '🔊 Hear the sound', () => sayChunk(letter));
    box.append(hear);
    const opts = el('div', 'p-options');
    hear.locks(opts);
    shuffle([letter, ...pick(stop.letters.filter(l => l !== letter), 2)]).forEach(l => {
      opts.append(button('p-option big', l, () => { if (!opts.dataset.done) { opts.dataset.done = '1'; finish(l === letter); } }));
    });
    box.append(opts);
  }

  // The Check's words: all different; first the ones not used in this student's recent Checks (shuffled),
  // then the longest-ago ones. The words are remembered as the Check starts, so leaving halfway still rotates.
  function checkWords(pool) {
    const recent = (stopRecord(stop.id).recent || []).filter(w => pool.includes(w));     // oldest first
    const words = [...shuffle(pool.filter(w => !recent.includes(w))), ...recent].slice(0, CHECK_N);
    while (words.length < CHECK_N) words.push(pick(pool, 1)[0]);                       // only a list under 10 words
    saveStopRecord(stop.id, { recent: [...recent.filter(w => !words.includes(w)), ...words].slice(-RECENT_KEEP) });
    return words;
  }

  function finishCheck(area, box, items, results, done) {
    const right = results.filter(Boolean).length;
    const pct = Math.round((right / items.length) * 100);
    const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : 1;
    const rec = stopRecord(stop.id);
    const passed = pct >= PASS;
    const passes = Math.min(PASSES_NEEDED, (rec.passes || 0) + (passed ? 1 : 0));
    saveStopRecord(stop.id, { stars: Math.max(rec.stars || 0, stars), passes, lastScore: pct });
    // Marcos 10/21: the score as a percent, the same as the 80% they need ("both should be a percentage"),
    // what "pass 1 of 2" means in words, and one clear button for what to do next
    box.append(el('div', 'p-score', `${pct}%`), el('div', 'p-stars', '★★★'.slice(0, stars) + '☆☆☆'.slice(0, 3 - stars)));
    const missed = items.filter((_, k) => !results[k]);
    const movesOn = !!(window.QPSLogin && QPSLogin.movesOn && QPSLogin.movesOn(stop.id));
    // Send the Check to Mr. O's results sheet (login.js knows who is signed in). Two passes on the student's
    // own stop move them on (Marcos 10/21): login.js hands back the stop they moved to.
    const moved = window.QPSLogin ? QPSLogin.saveCheck({
      stop, right, total: items.length, percent: pct, passed, passes, started: checkStarted, finished: new Date(),
      missed: missed.map(it => `${join(it.chunks)} (${STEP_NAMES[it.kind] || it.kind})`)
    }) : null;
    const got = `You got ${pct}%.`;
    const msg = moved ? `${got} You passed again! That is 2 of 2 passes. You move on to stop ${moved.num}, ${moved.name}! Mr. O will check stop ${stop.num} with you soon.`
      : passed && passes >= PASSES_NEEDED ? `${got} You passed! That is 2 of 2 passes. You are ready for Mr. O's check!`
      : passed ? `${got} You passed! That is 1 of 2 passes. Do the whole stop one more time and pass the Check again ${movesOn ? 'to move on to the next stop' : 'to be ready for Mr. O\'s check'}.`
      : passes >= PASSES_NEEDED ? `${got} You need ${PASS}% to pass. You still have your 2 of 2 passes.`
      : `${got} You need ${PASS}% to pass. Not this time. Practice the stop again, then take the Check again. Passes so far: ${passes} of ${PASSES_NEEDED}.`;
    const meter = el('div', 'p-pass-meter');
    meter.setAttribute('aria-label', `${passes} of ${PASSES_NEEDED} passes`);
    for (let k = 0; k < PASSES_NEEDED; k++) meter.append(el('span', 'p-pass-dot' + (k < passes ? ' on' : ''), k < passes ? '✅' : '⬜'));   // boxes, not stars: stars are the score
    meter.append(el('span', 'p-pass-label', `${passes} of ${PASSES_NEEDED} passes`));
    const p = window.QPSRead ? QPSRead.wrap(el('p', 'p-well' + (passed ? '' : ' not-yet')), msg) : el('p', 'p-well' + (passed ? '' : ' not-yet'), msg);
    // a stop named with letters (sh ch th) is spoken by its sayName, so the voice doesn't spell S-H (as on the plan card)
    const spoken = moved && moved.sayName ? msg.replace(moved.name, moved.sayName) : msg;
    if (spoken !== msg) p.dataset.say = spoken;
    // Marcos 10/26: the result is read aloud on its own, and the buttons wait until it was heard to the end and
    // every missed word was heard (the next one glows, a heard one gets a ✓). Cut off: its 🔊 glows.
    let resultHeard = false;
    const wordBtns = [], heardWords = new Set();
    const ready = () => {
      const left = wordBtns.find(b => !heardWords.has(b));
      wordBtns.forEach(b => b.classList.toggle('p-pulse', resultHeard && b === left));
      again.hidden = !resultHeard || !!left;
    };
    const readResult = async () => {
      hear.classList.remove('p-pulse');
      takeOver();
      const how = window.QPSRead ? await QPSRead.say(p) : (await sayText(spoken), 'end');
      if (resultHeard) return;
      if (how === 'stopped') { hear.classList.add('p-pulse'); return; }
      resultHeard = true;
      ready();
      if (wordDir && window.QPSRead) QPSRead.say(wordDir.p);   // then what to do with the words, read aloud too
    };
    const hear = button('p-say', '🔊', readResult, 'Hear how you did');
    const line = el('div', 'p-result');
    line.append(hear, p);
    box.append(meter, line);
    let wordDir = null;
    if (missed.length) {
      wordDir = direction(box, 'Words to practice. Tap each word to hear it.');
      wordDir.row.classList.add('center');
      const list = el('div', 'p-examples p-missed');
      missed.forEach(it => {
        const row = tiles(it.chunks);
        const b = button('p-example', '', async () => {
          if (!(await lightWhile([...row.children], () => playedThrough(() => (stop.letters ? sayChunk(it.chunks[0]) : sayWord(it.chunks)))))) return;
          heardWords.add(b);
          b.classList.add('heard');
          ready();
        }, `Hear ${join(it.chunks)}`);
        b.append(row); list.append(b); wordBtns.push(b);
      });
      box.append(list);
    }
    const again = el('div', 'p-end-buttons');
    const restart = () => { stepIndex = 1; showStep(); window.scrollTo(0, 0); };
    if (moved) again.append(button('p-btn p-next-big', `▶ Start stop ${moved.num}, ${moved.name}`, () => openStop(moved.id)), button('p-btn p-again', '🏠 Back to all stops', backToStops));
    else if (passed && passes < PASSES_NEEDED) again.append(button('p-btn p-next-big', '▶ Start pass 2', restart), button('p-btn p-again', '🏠 Back to all stops', backToStops));
    else if (!passed && passes < PASSES_NEEDED) again.append(button('p-btn p-next-big', '▶ Practice again', restart), button('p-btn p-again', '🏠 Back to all stops', backToStops));
    else again.append(button('p-btn p-go', '🏠 Back to all stops', backToStops), button('p-btn p-again', '🔁 Do this stop again', restart));
    box.append(again);
    ready();
    readResult();
    done();
    // After any Check the practice steps come first again (the Check reopens after the last practice step),
    // so a second pass is a whole second run of the stop, not a retake. Set after done(), which marks the
    // step reached, and the chips redrawn so the Check chip locks at once.
    saveStopRecord(stop.id, { reached: 1 });
    renderChips();
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
