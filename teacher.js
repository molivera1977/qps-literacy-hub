/* ═══════════════════════════════════════════════════════
   teacher.js · THE TEACHER SCREEN (Marcos 11/10: "update to new teacher mode",
   the same screen as his other sites)
   Teacher Access, or Mr. O on the name list, + his PIN → this screen, not the student home:
     • pick a phonics stop and a step, or a reading course, a level and a part — any one,
       nothing has to be passed first
     • 👀 Try it as a student — the share guest view opens right there (?share=…&teach=…):
       you answer like a student; ⏩ Skip the wait opens anything that is shut; nothing is
       saved; ← Teacher screen comes back here
     • 🖥️ Slide Mode — the Learn lesson, big, for the desk or the board. Never the practice
       or the Check (the 10/30 standard).
     • ✅ Answer key — the words and every right answer on one page; you can print it
     • 📝 Assessment (asks the PIN; the one thing here that saves) · 📗 Behind the QPS
   Students never get any of this: it opens only for Mr. O signed in with his PIN, or on the
   share link with &teach= (which saves nothing).
═══════════════════════════════════════════════════════ */
(function () {
  const SHARE = !!window.SHARE_MODE;
  const $ = (id) => document.getElementById(id);
  const PICK_KEY = 'qps_teacher_pick';
  const TEACH = SHARE ? new URLSearchParams(location.search).get('teach') : null;
  const MAX_LEVEL = 4;
  const PARTS = [['learn', 'Learn'], ['practice', 'Practice'], ['check', 'Check']];
  const VIEWS = ['loginView', 'welcomeView', 'practiceView', 'compView', 'appView', 'teacherView', 'slideView', 'keyView', 'teachReady'];

  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined && text !== null) e.textContent = text; return e; }
  function btn(cls, text, fn, label) { const b = el('button', cls, text); b.type = 'button'; b.onclick = fn; if (label) b.setAttribute('aria-label', label); return b; }
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const stops = () => (typeof PRACTICE_STOPS !== 'undefined' ? PRACTICE_STOPS : []);
  const courses = () => (typeof COMP_SKILLS !== 'undefined' ? COMP_SKILLS : []);
  const stopById = (id) => stops().find((s) => s.id === id);
  const courseById = (id) => courses().find((c) => c.id === id);
  const stepsOf = (st) => window.Practice.buildSteps(st);
  const stepName = (k) => (window.Practice.STEP_NAMES || {})[k] || k;
  const partName = (k) => (PARTS.find(([x]) => x === k) || [k, k])[1];
  const join = (w) => w.replace(/\|/g, '');
  const dots = (w) => w.split('|').join(' · ');
  function only(id) { VIEWS.forEach((v) => { const e = $(v); if (e) e.style.display = v === id ? 'block' : 'none'; }); window.scrollTo(0, 0); }
  function quiet() { if (window.Practice && Practice.hush) Practice.hush(); if (window.QPSRead) QPSRead.stop(); else if (window.speechSynthesis) speechSynthesis.cancel(); if (window.stopSounds) stopSounds(); }

  /* ---------- the pick ---------- */
  // { kind: 's', stop, step } — a phonics stop and a step · { kind: 'c', course, level, part } — a reading course
  function loadPick() { try { return JSON.parse(sessionStorage.getItem(PICK_KEY)) || null; } catch (e) { return null; } }
  function savePick() { try { sessionStorage.setItem(PICK_KEY, JSON.stringify(pick)); } catch (e) { /* private window */ } }
  const encode = (p) => (p.kind === 's' ? `s.${p.stop}.${p.step}` : `c.${p.course}.${p.level}.${p.part}`);
  function decode(t) {
    const [k, a, b, c] = String(t || '').split('.');
    if (k === 's' && stopById(a)) { const st = stopById(a); return { kind: 's', stop: a, step: stepsOf(st).includes(b) ? b : 'learn' }; }
    if (k === 'c' && courseById(a)) return { kind: 'c', course: a, level: Math.max(1, Math.min(MAX_LEVEL, Number(b) || 1)), part: PARTS.some(([x]) => x === c) ? c : 'learn' };
    return null;
  }
  function label(p) {
    if (p.kind === 's') { const st = stopById(p.stop); return st ? `Stop ${st.num} · ${st.name} · ${stepName(p.step)}` : ''; }
    const c = courseById(p.course);
    return c ? `${c.icon || ''} ${c.name} · Level ${p.level} · ${partName(p.part)}`.trim() : '';
  }
  let pick = null;
  function ensurePick() {
    pick = decode(encode(loadPick() || {})) || (stops()[0] ? { kind: 's', stop: stops()[0].id, step: 'learn' } : null);
  }

  /* ---------- the Teacher screen ---------- */
  function build() {
    if ($('teacherView')) return;
    const v = el('main', 'hub-container t-view');
    v.id = 'teacherView';
    v.style.display = 'none';
    v.innerHTML = `
      <div class="t-bar">
        <span class="t-title">🧑‍🏫 Teacher</span>
        <span class="t-note">Nothing here is saved, except the Assessment.</span>
        <button type="button" class="t-exit" id="tExit">✕ Exit teacher</button>
      </div>
      <h3 class="t-h">Phonics stop</h3>
      <div class="t-row" id="tStops"></div>
      <h3 class="t-h">Reading</h3>
      <div class="t-row" id="tCourses"></div>
      <div id="tStepBox"><h3 class="t-h">Step</h3><div class="t-row" id="tSteps"></div></div>
      <div id="tLevelBox">
        <h3 class="t-h">Level</h3><div class="t-row" id="tLevels"></div>
        <h3 class="t-h">Part</h3><div class="t-row" id="tParts"></div>
      </div>
      <p class="t-picked" id="tPicked"></p>
      <div class="t-actions">
        <button type="button" class="t-act" id="tTry">👀 Try it as a student<span>You answer, like a student, from the step you picked. ⏩ Skip the wait opens anything that is shut. Nothing is saved.</span></button>
        <button type="button" class="t-act" id="tSlides">🖥️ Slide Mode<span>The Learn lesson, big, for your desk or the board. Never the practice or the Check.</span></button>
        <button type="button" class="t-act" id="tKey">✅ Answer key<span>The words and every right answer on one page. You can print it.</span></button>
      </div>
      <h3 class="t-h">Also</h3>
      <div class="t-actions">
        <button type="button" class="t-act" id="tAssess">📝 Assessment<span>Your test between screenings: pick a student, mark each word, save it to your dashboard. Asks your PIN. This one saves.</span></button>
        <a class="t-act" id="tBehind" href="https://mroteacher.com/behind-the-qps/" target="behind-the-qps" rel="noopener">📗 Behind the QPS<span>How the hub works and how each child's plan is set.</span></a>
      </div>`;
    const after = $('appView') || $('welcomeView');
    after.after(v);
    $('tExit').onclick = exit;
    $('tTry').onclick = tryIt;
    $('tSlides').onclick = slides;
    $('tKey').onclick = key;
    $('tAssess').onclick = () => { quiet(); if (window.enterApp) window.enterApp('test'); };   // its own PIN box opens over this screen
  }

  function choice(row, text, on, fn, aria) {
    const b = btn('t-btn' + (on ? ' on' : ''), text, fn, aria);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    row.append(b);
  }
  function render() {
    const s = $('tStops'), c = $('tCourses'), st = $('tSteps'), lv = $('tLevels'), pt = $('tParts');
    [s, c, st, lv, pt].forEach((r) => { r.innerHTML = ''; });
    stops().forEach((x) => choice(s, `${x.num} ${x.name}`, pick.kind === 's' && pick.stop === x.id,
      () => { pick = { kind: 's', stop: x.id, step: pick.kind === 's' && stepsOf(x).includes(pick.step) ? pick.step : 'learn' }; changed(); }, `Stop ${x.num}, ${x.name}`));
    courses().forEach((x) => choice(c, `${x.icon || ''} ${x.name}`.trim(), pick.kind === 'c' && pick.course === x.id,
      () => { pick = { kind: 'c', course: x.id, level: pick.kind === 'c' ? pick.level : 1, part: pick.kind === 'c' ? pick.part : 'learn' }; changed(); }, x.name));
    const isStop = pick.kind === 's';
    $('tStepBox').hidden = !isStop;
    $('tLevelBox').hidden = isStop;
    if (isStop) stepsOf(stopById(pick.stop)).forEach((k) => choice(st, stepName(k), pick.step === k, () => { pick = { ...pick, step: k }; changed(); }));
    else {
      for (let n = 1; n <= MAX_LEVEL; n++) choice(lv, `Level ${n}`, pick.level === n, () => { pick = { ...pick, level: n }; changed(); });
      PARTS.forEach(([k, t]) => choice(pt, t, pick.part === k, () => { pick = { ...pick, part: k }; changed(); }));
    }
    $('tPicked').textContent = `Picked: ${label(pick)}`;
  }
  function changed() { savePick(); render(); }

  function open() {
    build();
    ensurePick();
    if (!pick) return;
    quiet();
    render();
    only('teacherView');
    document.title = 'QPS Literacy Hub | Teacher';
  }
  const active = () => !SHARE && !!(window.QPSLogin && QPSLogin.who && QPSLogin.who() === QPSLogin.TEACHER);
  function exit() { quiet(); if (window.QPSLogin) QPSLogin.signOut(); }

  /* ---------- 👀 Try it as a student ---------- */
  function tryIt() {
    savePick();
    location.href = location.pathname + window.SHARE_LINK + '&teach=' + encodeURIComponent(encode(pick));   // share.js holds the code
  }

  /* ---------- 🖥️ Slide Mode ---------- */
  let slideAt = 0;
  function buildSlides() {
    if ($('slideView')) return;
    const v = el('main', 'hub-container sl-view');
    v.id = 'slideView';
    v.style.display = 'none';
    v.innerHTML = `
      <div class="sl-bar">
        <span class="sl-title" id="slTitle">🖥️ Slide Mode</span>
        <span class="sl-go">
          <button type="button" id="slPrev" aria-label="Back one slide">◀</button>
          <select id="slJump" aria-label="Go to a slide"></select>
          <button type="button" id="slNext" aria-label="Forward one slide">▶</button>
        </span>
        <button type="button" class="t-exit" id="slClose">✕ Teacher screen</button>
      </div>
      <div id="slStage" class="sl-stage"></div>`;
    $('teacherView').after(v);
    $('slPrev').onclick = () => slideGo(slideAt - 1);
    $('slNext').onclick = () => slideGo(slideAt + 1);
    $('slJump').onchange = (e) => { slideGo(Number(e.target.value)); e.target.blur(); };
    $('slClose').onclick = () => { quiet(); open(); };
    document.addEventListener('keydown', (e) => {
      if ($('slideView').style.display !== 'block') return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); slideGo(slideAt + 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); slideGo(slideAt - 1); }
      else if (e.key === 'Escape') { quiet(); open(); }
    });
  }
  function slideList() {
    if (pick.kind === 's') {
      const n = window.Practice.slideCount(pick.stop);
      const st = stopById(pick.stop);
      const screens = st.learn.screens || [{}];
      return Array.from({ length: n }, (_, k) => `${k + 1}. ${screens[k] && screens[k].label ? screens[k].label : `Learn: ${st.name}`}`);
    }
    return [`Learn: ${courseById(pick.course).name}`];
  }
  function renderCourseSlide(host) {
    const c = courseById(pick.course);
    host.innerHTML = '';
    const card = el('div', 'p-learn p-slide');
    card.append(el('h2', 'p-learn-title', `${c.icon || ''} Learn: ${c.name}`.trim()));
    const lines = c.learn.map((t) => {
      const p = el('p', 'p-learn-line');
      if (window.QPSRead) QPSRead.wrap(p, t.replace(/\*/g, '')); else p.textContent = t.replace(/\*/g, '');
      card.append(p);
      return p;
    });
    card.append(btn('p-btn p-hear', '🔊 Hear this slide', () => { quiet(); if (window.QPSRead) QPSRead.sayAll(lines); }));
    host.append(card);
  }
  function slideGo(k) {
    const list = slideList();
    slideAt = Math.max(0, Math.min(list.length - 1, k));
    $('slJump').value = String(slideAt);
    $('slPrev').disabled = slideAt === 0;
    $('slNext').disabled = slideAt === list.length - 1;
    quiet();
    if (pick.kind === 's') window.Practice.renderSlide(pick.stop, slideAt, $('slStage'));
    else renderCourseSlide($('slStage'));
  }
  function slides() {
    build(); buildSlides();
    const list = slideList();
    const jump = $('slJump');
    jump.innerHTML = '';
    list.forEach((t, k) => jump.append(new Option(t, String(k))));
    $('slTitle').textContent = `🖥️ ${pick.kind === 's' ? `Stop ${stopById(pick.stop).num} · ${stopById(pick.stop).name}` : courseById(pick.course).name}`;
    only('slideView');
    slideGo(0);
  }

  /* ---------- ✅ Answer key ---------- */
  function buildKey() {
    if ($('keyView')) return;
    const v = el('main', 'hub-container key-view');
    v.id = 'keyView';
    v.style.display = 'none';
    v.innerHTML = `
      <div class="sl-bar key-bar">
        <span class="sl-title">✅ Answer key</span>
        <button type="button" class="t-exit" id="keyPrint">🖨️ Print</button>
        <button type="button" class="t-exit" id="keyClose">✕ Teacher screen</button>
      </div>
      <div id="keyBody" class="key-body"></div>`;
    $('teacherView').after(v);
    $('keyPrint').onclick = () => window.print();
    $('keyClose').onclick = () => open();
  }
  const section = (title, rows, note) => rows.length ? `<section class="key-sec"><h3>${esc(title)}</h3>${note ? `<p class="key-note">${esc(note)}</p>` : ''}<ul>${rows.join('')}</ul></section>` : '';
  const said = (chunks) => {
    if (!window.Respell) return '';
    const r = window.Respell.respell(chunks);
    return r && r !== join(chunks.join('|')) ? ` <span class="key-said">said like "${esc(r)}"</span>` : '';
  };
  function stopKeyHTML(st) {
    const out = [];
    const what = st.letters ? 'the letters' : st.big ? 'the word list' : 'the made-up words';
    out.push(`<p class="key-note">Practice picks from these each time, so a student sees some of them. The Check uses ${what}. The right answer is marked ✅.</p>`);
    const ex = [];
    const screens = st.learn.screens || [{ examples: st.learn.examples }];
    screens.forEach((sc) => (sc.examples || []).forEach((w) => ex.push(`<li>${w.split('>').map((x) => `<b>${esc(join(x))}</b> = ${esc(dots(x))}`).join(' → ')}</li>`)));
    out.push(section('Learn: the examples', ex));
    const tries = [];
    screens.forEach((sc) => {
      if (!sc.try) return;
      if (typeof sc.try === 'string') tries.push(`<li>Chop <b>${esc(join(sc.try))}</b>: ✅ ${esc(dots(sc.try))}</li>`);
      else tries.push(`<li>${esc(sc.try.ask)} <b>${esc(join(sc.try.word))}</b>: ✅ ${esc(sc.try.choices[0])}${sc.try.choices.slice(1).map((c) => ` <span class="key-wrong">${esc(c)}</span>`).join('')}</li>`);
    });
    out.push(section('Learn: Try it', tries));
    if (st.letters) out.push(section('Letters (Read and Listen): each letter and its sound', st.letters.map((l) => `<li><b>${esc(l)}</b></li>`), 'Read: the 🔊 that says the letter\'s sound ✅. Listen: the letter that makes the sound ✅.'));
    if (st.real) {
      const chop2 = st.chop2 || {};
      out.push(section(st.big ? 'Chop, Blend and Build: the words and their parts' : 'Blend and Build: the words and their parts',
        st.real.map((w) => `<li><b>${esc(join(w))}</b> = ✅ ${esc(dots(w))}${chop2[w] ? ` <span class="key-note">(also taken: ${esc(dots(chop2[w]))})</span>` : ''}</li>`)));
    }
    if (st.sort) {
      const box = (k) => (st.sort.bins.find((b) => b.key === k) || { label: k }).label;
      out.push(section('Listen: each word and its box', st.sort.words.map(([w, k]) => `<li><b>${esc(join(w))}</b> → ✅ ${esc(box(k))}</li>`), st.sort.seeWord ? 'The word is on screen.' : 'The word is hidden: the student hears it.'));
    }
    if (st.chains) out.push(section('Change: the word, the new word, and the part that changes', st.chains.map(([a, b]) => {
      const d = window.Practice.diff(a.split('|'), b.split('|'));
      return `<li><b>${esc(join(a))}</b> → <b>${esc(join(b))}</b>: ✅ ${esc(join(d.newPart))}</li>`;
    })));
    if (st.made) out.push(section('Read, Spell and the Check: the made-up words', st.made.map((w) => `<li><b>${esc(join(w))}</b> = ${esc(dots(w))}${said(w.split('|'))}</li>`),
      'Read: the 🔊 that says the word ✅. Spell: the word as written here ✅.'));
    if (st.sentences) out.push(section('Sentences', st.sentences.map((t) => `<li>${esc(t)}</li>`)));
    return out.join('');
  }
  function courseKeyHTML(c, level) {
    const items = c.levels[level] || [];
    const use = (it) => (it.use === 'check' ? 'Check' : 'Practice');
    if (c.kind === 'maze') {
      return `<p class="key-note">Level ${level}: ${items.length} stories. In each box the right word is ✅ and bold; the other two are struck out.</p>` +
        items.map((it) => `<section class="key-sec"><h3>${esc(it.title)} <span class="key-note">(${use(it)})</span></h3><p class="key-story">${
          esc(it.text).replace(/\{([^}|]+)\|([^}]*)\}/g, (m, right, rest) => `<b class="key-right">✅ ${right}</b> <span class="key-wrong">${rest.split('|').join('</span> <span class="key-wrong">')}</span>`)
        }</p></section>`).join('');
    }
    return `<p class="key-note">Level ${level}: ${items.length} passages. Each passage has two questions: what the word means, and which words helped. The right answer to each is ✅; the wrong choices are struck out.</p>` +
      items.map((it) => `<section class="key-sec"><h3>${esc(it.id)} <span class="key-note">(${use(it)})</span></h3><p class="key-story">${
        esc(it.passage).replace(/\*([^*]+)\*/g, '<b>$1</b>')}</p><ul><li>Means: <b class="key-right">✅ ${esc(it.choices[0])}</b>${it.choices.slice(1).map((x) => ` <span class="key-wrong">${esc(x)}</span>`).join('')}</li>${
        it.clues && it.clues.length ? `<li>Helped: <b class="key-right">✅ "${esc(it.clues[0])}"</b>${it.clues.slice(1).map((x) => ` <span class="key-wrong">"${esc(x)}"</span>`).join('')}</li>` : ''}</ul></section>`).join('');
  }
  function key() {
    build(); buildKey();
    let title, body;
    if (pick.kind === 's') { const st = stopById(pick.stop); title = `Stop ${st.num} · ${st.name}`; body = stopKeyHTML(st); }
    else { const c = courseById(pick.course); title = `${c.name} · Level ${pick.level}`; body = courseKeyHTML(c, pick.level); }
    $('keyBody').innerHTML = `<h2 class="key-title">QPS Literacy Hub Answer Key — ${esc(title)}</h2>${body}`;
    quiet();
    only('keyView');
    document.title = `QPS Literacy Hub Answer Key — ${title}`;
  }

  /* ---------- the share view on a teacher's &teach= link ---------- */
  let teachPick = null;
  function teachReady(p) {
    teachPick = p;
    window.QPS_TEACH = true;
    const card = el('main', 'hub-container teach-ready');
    card.id = 'teachReady';
    card.innerHTML = `
      <p class="teach-ready-h">🧑‍🏫 Try it as a student</p>
      <p class="teach-ready-what" id="teachWhat"></p>
      <p class="teach-ready-note">You answer, the way a student does. ⏩ Skip the wait opens anything that is shut. Nothing is saved.</p>
      <button type="button" class="p-btn p-next-big" id="teachStart">▶ Start</button>`;
    ($('welcomeView') || document.body.firstElementChild).before(card);
    $('teachWhat').textContent = label(p);
    only('teachReady');
    $('teachStart').onclick = () => { card.remove(); teachStart(); };   // the tap also lets the device speak
  }
  function teachBar() {
    const bar = el('div', 'teach-bar');
    bar.id = 'teachBar';
    bar.innerHTML = `
      <span class="teach-bar-what">🧑‍🏫 Trying it as a student · nothing is saved</span>
      <span class="teach-go">
        <button type="button" id="teachPrev" aria-label="Back one step">◀</button>
        <select id="teachJump" aria-label="Go to a step"></select>
        <button type="button" id="teachNext" aria-label="Forward one step">▶</button>
      </span>
      <button type="button" id="teachSkip">⏩ Skip the wait</button>
      <button type="button" id="teachBack">← Teacher screen</button>`;
    document.body.append(bar);
    document.body.classList.add('teach-on');
    const jump = $('teachJump');
    const list = teachPick.kind === 's' ? stepsOf(stopById(teachPick.stop)).map((k, i) => [String(i), stepName(k)]) : PARTS.map(([k, t]) => [k, t]);
    list.forEach(([v, t]) => jump.append(new Option(t, v)));
    const go = (v) => {
      quiet();
      if (teachPick.kind === 's') window.Practice.openAt(teachPick.stop, Number(v));
      else { only('compView'); window.Comp.teach(teachPick.course, teachPick.level, v); }
      jump.value = String(v);
      sync();
    };
    jump.onchange = () => { go(jump.value); jump.blur(); };
    $('teachPrev').onclick = () => { const i = jump.selectedIndex; if (i > 0) go(jump.options[i - 1].value); };
    $('teachNext').onclick = () => { const i = jump.selectedIndex; if (i < jump.options.length - 1) go(jump.options[i + 1].value); };
    $('teachSkip').onclick = () => { if (window.Practice && Practice.skipWait) Practice.skipWait(); if (window.Comp && Comp.stopSpeaking) Comp.stopSpeaking(); if (window.speechSynthesis) speechSynthesis.cancel(); };
    $('teachBack').onclick = () => { quiet(); location.href = location.pathname + '#teacher'; };
    return go;
  }
  // the bar follows the student's own moves (Next, a step chip)
  function sync() {
    const jump = $('teachJump');
    if (!jump) return;
    if (teachPick.kind === 's' && window.Practice) {
      const s = window.Practice._state();
      if (s.stop && s.stop.id === teachPick.stop) jump.value = String(s.stepIndex);
    }
    $('teachPrev').disabled = jump.selectedIndex <= 0;
    $('teachNext').disabled = jump.selectedIndex >= jump.options.length - 1;
  }
  function teachStart() {
    const go = teachBar();
    const first = teachPick.kind === 's' ? String(Math.max(0, stepsOf(stopById(teachPick.stop)).indexOf(teachPick.step))) : teachPick.part;
    $('teachJump').value = first;
    go(first);
    setInterval(sync, 400);
  }

  window.QPSTeacher = { open, active, _pick: () => pick, _encode: encode, _decode: decode };

  function boot() {
    if (TEACH) { const p = decode(TEACH); if (p) teachReady(p); return; }
    if (active()) open();                    // a reload, or ← Teacher screen from the guest view
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
