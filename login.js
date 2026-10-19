/* =====================================================================
   QPS SIGN-IN AND MY PLAN
   A student signs in with their name and student number (same as Mr. O's
   other sites). Their plan then shows their official track: the stop
   where they stopped on the Wonders Quick Phonics Screener (mCLASS data
   meeting, Oct 14, 2026). Students who passed every section see every
   stop. Mr. O and guests see everything: every stop and every
   comprehension skill; Mr. O also gets the Assessment card (PIN). Each student's stars are kept under their name.
   Guests on Mr. O's share link (?share=<code>, share.js) skip sign-in as "Guest".
   ===================================================================== */
(function () {
  const LOGIN_KEY = 'qps_student_v1';

  // ⚠️ ROSTER SYNC — keep identical to the Teacher Dashboard ROSTER
  // and every other student-facing activity.
  const ROSTER = [
    { name: "Mr. O (Teacher)",           id: "9377" },
    { name: "Avery, Jo'Von",             id: "10053632" },
    { name: "Belasquez Bonilla, Eduin",  id: "10058674" },
    { name: "Castaneda, Kelvin",         id: "10053248" },
    { name: "Chicas-Santos, Allison",    id: "10066737" },
    { name: "Collado, Roniel",           id: "10060249" },
    { name: "Dejesus, Michael",          id: "10049434" },
    { name: "Dock, Fakeem",              id: "10059720" },
    { name: "Douglas, Iyana",            id: "10070980" },
    { name: "Dumphrey, Christopher",     id: "10060696" },
    { name: "Flores, Kiara",             id: "10052834" },
    { name: "Johnson, Destiny",          id: "10052926" },
    { name: "Jones, Tahji",              id: "10060315" },
    { name: "Lawrence, Eric",            id: "10057451" },
    { name: "Madero, Jovany",            id: "10076374" },
    { name: "Pettway, Lanaura",          id: "10060616" },
    { name: "Polanco Soriano, Thiara",   id: "10060503" },
    { name: "Roberts, Robyn",            id: "10060925" },
    { name: "Rojas, Alanie",             id: "10076388" },
    { name: "Sanchez Rodriguez, Johanelyz", id: "10076767" },
    { name: "Vega, Taishmara",           id: "10054043" },
    { name: "Watts, Autumn",             id: "10039032" },
    { name: "Zelaya-Osorto, Nazareth",   id: "10053626" }
];

  const GUEST_SLOTS = {
    '937701': 'Guest 1', '937702': 'Guest 2', '937703': 'Guest 3',
    '937704': 'Guest 4', '937705': 'Guest 5', '937706': 'Guest 6',
    '937707': 'Guest 7', '937708': 'Guest 8', '937709': 'Guest 9',
    '937710': 'Guest 10'
};

  // Official track = the practice stop to work on. Mr. O changes a track here.
  // "comp" = the comprehension track (comp.js) for students who passed every QPS level.
  const TRACKS = {
    "Castaneda, Kelvin":              "2",
    "Watts, Autumn":                  "3",
    "Rojas, Alanie":                  "5",
    "Madero, Jovany":                 "5",
    "Johnson, Destiny":               "5",
    "Sanchez Rodriguez, Johanelyz":   "5",
    "Avery, Jo'Von":                  "5",
    "Zelaya-Osorto, Nazareth":        "5",
    "Jones, Tahji":                   "5",
    "Dumphrey, Christopher":          "5",
    "Polanco Soriano, Thiara":        "6",
    "Chicas-Santos, Allison":         "6",
    "Lawrence, Eric":                 "7",
    "Vega, Taishmara":                "9b",
    "Collado, Roniel":                "9c",
    "Dock, Fakeem":                   "9c",
    "Dejesus, Michael":               "comp", // passed every section → comprehension track
    "Roberts, Robyn":                 "comp", // passed every section → comprehension track
    "Flores, Kiara":                  "comp", // passed every section → comprehension track
    "Belasquez Bonilla, Eduin":       "comp", // passed every section → comprehension track
    "Douglas, Iyana":                 "comp", // passed every section → comprehension track
    "Pettway, Lanaura":               "comp", // passed every section → comprehension track
  };

  const SHARE = !!window.SHARE_MODE;
  const TEACHER = 'Mr. O (Teacher)';               // share.js: the code lives there, the same on every site
  const $ = (id) => document.getElementById(id);
  const firstName = (name) => name.includes(',') ? name.split(',')[1].trim() : name.replace(/ \((Guest|Teacher)\)$/, '');
  const say = (text) => { if (window.speakComputer) speakComputer(text); };

  let student = '';

  function trackFor(name) {
    const id = TRACKS[name];
    return id && typeof PRACTICE_STOPS !== 'undefined' ? PRACTICE_STOPS.find(s => s.id === id) || null : null;
  }

  /* ---------- sign-in screen ---------- */
  function buildNameList() {
    const sel = $('qpsName');
    ROSTER.forEach(s => sel.append(new Option(s.name, s.name)));
    const div = new Option('── Guests ──', ''); div.disabled = true; sel.append(div);
    Object.entries(GUEST_SLOTS).forEach(([code, label]) => sel.append(new Option('🙋 ' + label, 'GUEST:' + code)));
  }

  function onNamePick() {
    const val = $('qpsName').value;
    const guest = val.startsWith('GUEST:');
    $('qpsLoginError').textContent = '';
    $('qpsPinBox').hidden = !val;
    $('qpsGuestBox').hidden = !guest;
    $('qpsPinLabel').textContent = guest ? 'Guest code' : 'Your student number';
    if (val) setTimeout(() => $('qpsPin').focus(), 60);
  }

  function trySignIn() {
    const val = $('qpsName').value;
    const pin = $('qpsPin').value.trim();
    const err = $('qpsLoginError');
    err.textContent = '';
    if (!val) { err.textContent = 'Pick your name first.'; return; }
    if (!pin) { err.textContent = val.startsWith('GUEST:') ? 'Type your guest code.' : 'Type your student number.'; return; }
    let name = '';
    if (val.startsWith('GUEST:')) {
      if (pin !== val.slice(6)) { err.textContent = 'That guest code is not right. Try again.'; return; }
      const first = $('qpsGuestName').value.trim();
      if (!first) { err.textContent = 'Type your first name.'; return; }
      name = first + ' (Guest)';
    } else {
      const s = ROSTER.find(r => r.name === val);
      if (!s || s.id !== pin) { err.textContent = 'That number is not right. Try again.'; $('qpsPin').select(); return; }
      name = val;
    }
    $('qpsPin').value = '';
    signIn(name);
  }

  function showLogin() {
    ['welcomeView', 'appView', 'practiceView', 'compView'].forEach(id => { const e = $(id); if (e) e.style.display = 'none'; });
    $('loginView').style.display = 'block';
    $('qpsName').value = ''; $('qpsPin').value = ''; $('qpsGuestName').value = '';
    onNamePick();
    window.scrollTo(0, 0);
  }

  function signIn(name) {
    student = name;
    window.QPS_STUDENT = name;                       // practice.js keeps stars under this name
    if (window.setTeacherMode) setTeacherMode(name === TEACHER);   // Mr. O also sees the Assessment card (it still asks for the PIN)
    if (!SHARE) { try { sessionStorage.setItem(LOGIN_KEY, name); } catch (e) {} }
    $('loginView').style.display = 'none';
    $('welcomeView').style.display = 'block';
    if (window.Practice) Practice.renderStops();      // stars for THIS student, then the plan
    renderPlan();
    // Comprehension students on a new or wiped device get their level back from the sheet.
    if (TRACKS[name] === 'comp' && window.Comp) Comp.restore(name).then(got => { if (got && student === name) renderPlan(); });
    window.scrollTo(0, 0);
  }

  function signOut() {
    if (SHARE) return;
    if (window.speechSynthesis) speechSynthesis.cancel();
    student = '';
    window.QPS_STUDENT = '';
    if (window.setTeacherMode) setTeacherMode(false);
    try { sessionStorage.removeItem(LOGIN_KEY); } catch (e) {}
    showLogin();
  }

  /* ---------- my plan ---------- */
  function starsFor(stopId) {
    try {
      const store = JSON.parse(localStorage.getItem('qps_practice_v1:' + student)) || {};
      return (store[stopId] && store[stopId].stars) || 0;
    } catch (e) { return 0; }
  }

  function renderPlan() {
    const box = $('planBox');
    if (!box || !student) return;
    const first = firstName(student);
    const track = trackFor(student);
    box.innerHTML = '';
    box.hidden = false;

    const top = document.createElement('div');
    top.className = 'plan-top';
    const hi = document.createElement('h2');
    hi.className = 'plan-hi';
    hi.textContent = `Hi, ${first}!`;
    const out = document.createElement('button');
    out.type = 'button'; out.className = 'plan-signout'; out.textContent = 'Not you? Sign out';
    out.onclick = signOut;
    if (SHARE) out.hidden = true;
    top.append(hi, out);
    box.append(top);

    const sub = document.querySelector('#welcomeView .welcome-sub');
    const grid = $('stopGrid');
    if (TRACKS[student] === 'comp' && window.Comp) {
      renderCompPlan(box, first);
      if (sub) sub.parentElement.hidden = true;
      if (grid) grid.hidden = true;
      return;
    }
    if (track) {
      const stars = starsFor(track.id);
      const line = `Your stop is number ${track.num}, ${track.sayName || track.name}. Tap Start.`;
      const dir = document.createElement('div');
      dir.className = 'p-direction';
      const sayBtn = document.createElement('button');
      sayBtn.type = 'button'; sayBtn.className = 'p-say'; sayBtn.textContent = '🔊';
      sayBtn.setAttribute('aria-label', 'Hear your plan');
      sayBtn.onclick = () => say(`Hi ${first}. ${line}`);
      const p = document.createElement('p');
      p.className = 'plan-line';
      p.textContent = `Your stop is ${track.num} · ${track.name}.`;
      if (window.QPSRead) {
        QPSRead.wrap(p, p.textContent);
        // A stop named with letters (sh ch th) is spoken by its sayName, so the voice doesn't read S-H.
        if (track.sayName) p.dataset.say = `Your stop is ${track.num}, ${track.sayName}.`;
        sayBtn.onclick = () => QPSRead.say(p);
      }
      dir.append(sayBtn, p);

      const card = document.createElement('button');
      card.type = 'button'; card.className = 'plan-card';
      card.setAttribute('aria-label', `Start stop ${track.num}, ${track.sayName || track.name}. ${stars} of 3 stars.`);
      card.onclick = () => Practice.openStop(track.id);
      card.innerHTML = '<span class="stop-num"></span><span class="plan-example"></span><span class="plan-name"></span><span class="stop-stars"></span><span class="plan-go">Start ▶</span>';
      card.querySelector('.stop-num').textContent = track.num;
      card.querySelector('.plan-example').textContent = track.example;
      card.querySelector('.plan-name').textContent = track.name;
      card.querySelector('.stop-stars').textContent = '★★★'.slice(0, stars) + '☆☆☆'.slice(0, 3 - stars);
      box.append(dir, card);
      if (sub) sub.parentElement.hidden = true;     // no "pick your stop" — Mr. O picked it
      if (grid) grid.hidden = true;
    } else {
      const p = document.createElement('p');
      p.className = 'plan-line';
      p.textContent = seesEverything()
        ? 'Pick a phonics stop, or a reading skill below.'
        : TRACKS[student] === null
          ? 'You passed every QPS stop! Pick any stop to keep your skills sharp.'
          : 'Pick a stop to practice.';
      box.append(p);
      if (sub) sub.parentElement.hidden = true;
      if (grid) grid.hidden = false;
    }
    renderAllComp();
  }

  // One comprehension skill as a card, with this student's level.
  function compCard(sk) {
    const lv = Comp.levelOf(student, sk.id);
    const card = document.createElement('button');
    card.type = 'button'; card.className = 'plan-card';
    card.setAttribute('aria-label', `Start ${sk.name}. Level ${lv} of 4.`);
    card.onclick = () => Comp.open(sk.id);
    card.innerHTML = '<span class="plan-example"></span><span class="plan-name"></span><span class="plan-level"></span><span class="plan-go">Start ▶</span>';
    card.querySelector('.plan-example').textContent = sk.icon;
    card.querySelector('.plan-name').textContent = sk.name;
    card.querySelector('.plan-level').textContent = `Level ${lv} of 4`;
    return card;
  }

  // Mr. O and a guest see everything: every phonics stop, then the comprehension skills under
  // them (students only get comprehension on the "comp" track). Marcos 10/15: "i want to see everything".
  const seesEverything = () => SHARE || student === TEACHER;
  function renderAllComp() {
    const old = $('guestComp');
    if (old) old.remove();
    if (!seesEverything() || !window.Comp || !$('stopGrid')) return;
    const sec = document.createElement('section');
    sec.id = 'guestComp'; sec.className = 'plan-box';
    sec.setAttribute('aria-label', 'Reading for meaning');
    const h = document.createElement('h2');
    h.className = 'plan-hi'; h.textContent = 'Reading for meaning';
    const p = document.createElement('p');
    p.className = 'plan-line';
    p.textContent = 'The comprehension track, for students who passed every QPS stop. A student gets passages at their own level, and the site moves them up and down. Here you can open any level.';
    sec.append(h, p);
    Comp.skills().forEach(sk => {
      const name = document.createElement('h3');
      name.className = 'guest-comp-skill';
      name.textContent = `${sk.icon} ${sk.name}`;
      const cards = document.createElement('div');
      cards.className = 'guest-comp-grid';
      for (let lv = 1; lv <= (Comp.maxLevel || 4); lv++) cards.append(levelCard(sk, lv));
      sec.append(name, cards);
    });
    $('stopGrid').after(sec);
  }

  // One level of a comprehension skill, for Mr. O and guests: opens the skill at that level.
  function levelCard(sk, lv) {
    const note = (sk.levelNotes && sk.levelNotes[lv]) || '';
    const card = document.createElement('button');
    card.type = 'button'; card.className = 'plan-card level-card';
    card.setAttribute('aria-label', `Start ${sk.name} at level ${lv}. ${note}`);
    card.onclick = () => Comp.openAt(sk.id, lv);
    card.innerHTML = '<span class="plan-name"></span><span class="plan-level"></span><span class="plan-go">Start ▶</span>';
    card.querySelector('.plan-name').textContent = `Level ${lv}`;
    card.querySelector('.plan-level').textContent = note;
    return card;
  }

  // Plan for the comprehension track: each skill with the student's level.
  function renderCompPlan(box, first) {
    const skills = Comp.skills();
    const dir = document.createElement('div');
    dir.className = 'p-direction';
    const line = 'You passed every QPS stop! Your plan is reading for meaning. The site will match the passages to you.';
    const sayBtn = document.createElement('button');
    sayBtn.type = 'button'; sayBtn.className = 'p-say'; sayBtn.textContent = '🔊';
    sayBtn.setAttribute('aria-label', 'Hear your plan');
    sayBtn.onclick = () => say(`Hi ${first}. ${line} Tap Start.`);
    const p = document.createElement('p');
    p.className = 'plan-line';
    p.textContent = line;
    if (window.QPSRead) { QPSRead.wrap(p, line); sayBtn.onclick = () => QPSRead.say(p); }
    dir.append(sayBtn, p);
    box.append(dir);
    skills.forEach(sk => box.append(compCard(sk)));
  }

  /* ---------- results to Mr. O's sheet (same as his other sites) ---------- */
  const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzv8CWv1yyi8NeH04now9UxVL4IZm5yMqqsEGMcgGdrcAOWVB-aSp5siTvSSJXIUpzFMA/exec';

  // Any row to the sheet, for the signed-in student. A guest's work is never sent.
  function send(row) {
    if (SHARE || !student || !row || !row.game) return;
    const body = { action: 'submit', name: student, ...row };
    window.QPS_LAST_SENT = body;                             // for testing
    try {
      fetch(SHEET_URL, {
        method: 'POST', mode: 'no-cors', keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }).catch(() => {});
    } catch (e) { /* offline: the work still shows on this device */ }
  }

  // Read one tab back (one entry per student) — used for the level backup.
  async function readTab(game) {
    if (SHARE) return [];
    try {
      const res = await fetch(`${SHEET_URL}?action=leaderboard&game=${encodeURIComponent(game)}`, { cache: 'no-store' });
      return await res.json();
    } catch (e) { return []; }
  }

  // One row per finished Practice Check, on the stop's own tab (qps-5 = Silent e).
  function saveCheck(r) {
    if (SHARE || !student || !r || !r.stop) return;          // a guest's work is never sent
    const started = r.started || r.finished;
    const elapsed = Math.max(0, Math.round((r.finished - started) / 1000));
    send({
      game: 'qps-' + r.stop.id,
      sessionId: 'qps-' + r.stop.id + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      form: `Practice Check · ${r.stop.num} ${r.stop.name}`,
      score: r.right, correct: r.right, total: r.total, maxScore: r.total,
      percent: r.percent,
      done: true,
      elapsed,
      tabSwitches: 0,
      wrongQuestions: r.missed.join(' | '),
      startedAt: started.toISOString(),
      finishedAt: r.finished.toISOString()
    });
  }

  /* ---------- start ---------- */
  buildNameList();
  $('qpsName').addEventListener('change', onNamePick);
  ['qpsPin', 'qpsGuestName'].forEach(id => $(id).addEventListener('keydown', e => { if (e.key === 'Enter') trySignIn(); }));
  $('qpsSignIn').addEventListener('click', trySignIn);

  window.QPSLogin = { renderPlan, signOut, trackFor, saveCheck, send, readTab, _tracks: TRACKS };

  if (SHARE) { signIn('Guest'); return; }
  let saved = '';
  try { saved = sessionStorage.getItem(LOGIN_KEY) || ''; } catch (e) {}
  if (saved && (ROSTER.some(s => s.name === saved) || saved.endsWith(' (Guest)'))) signIn(saved);
  else showLogin();
})();
