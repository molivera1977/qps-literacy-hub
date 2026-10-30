#!/usr/bin/env node
/* Checks the practice content before a push:
   1. every chunk is one of Mr. O's recordings (.m4a in the site folder)
   2. no practice word is an Assessment test word
   3. every made-up word gets two near-miss choices that are spelled
      differently and are made of recordings too
   4. made-up words are not real words (warning, from the system dictionary)
   5. big-word stops (Marcos 10/30, "without actually practicing them"): no word contains a test word (4+
      letters), sits inside one (5+ letters) or shares a 6-letter chunk with one; a sound note names a part
      of its word and a recording; Chop's second chop is the same letters
   Run from the site folder:  node tools/check-practice.js            */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const site = path.join(__dirname, '..');
const recordings = new Set(fs.readdirSync(site).filter(f => f.endsWith('.m4a')).map(f => f.slice(0, -4)));
const html = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
const bank = html.slice(html.indexOf('const wordBank'), html.indexOf('// Level display names'));
const testWords = new Set([...bank.matchAll(/w:"([a-z]+)"/g)].map(m => m[1]));

const ctx = vm.createContext({
  window: { addEventListener() {} }, location: { search: '' }, localStorage: { getItem: () => null, setItem() {} },
  document: { readyState: 'loading', addEventListener() {}, getElementById: () => null }
});
vm.runInContext(fs.readFileSync(path.join(site, 'practice-data.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(site, 'practice.js'), 'utf8'), ctx);
const stops = vm.runInContext('PRACTICE_STOPS', ctx);
const { nearMisses } = ctx.window.Practice;

let dict = new Set();
try { dict = new Set(fs.readFileSync('/usr/share/dict/words', 'utf8').split('\n').filter(w => w === w.toLowerCase())); } catch (e) { /* no dictionary: skip the warning */ }

// Slang, slurs and rude words a made-up word or a near miss must never spell.
const BLOCKED = new Set(['yid','goy','poon','fark','fag','fuk','fuc','fuq','suk','sux','cum','kum','coc','cok','dik','dic','nig','nigg','ass','tit','tits','poop','pee','pis','piss','shat','shit','crap','dam','damn','hel','hell','jiz','jis','wop','kike','spic','chink','gook','homo','turd','butt','boob','puss','fart','sexy','sex','nob','knob','wang','dong','dang']);
const errors = [], warnings = [];
const SOUND_NAMES = vm.runInContext('SOUND_NAMES', ctx);
const fileFor = (stop, c) => (c === 're' ? (stop.id === '10' ? 're-long' : 're-short') : c.toLowerCase());
// the recording a part of this word plays: its sound note, if it has one
const partFile = (stop, word, c) => { const n = stop.sounds && stop.sounds[word] && stop.sounds[word][c]; return n ? (SOUND_NAMES[n] || n) : fileFor(stop, c); };
function checkChunks(stop, word, where) {
  const chunks = word.split('|').flatMap(c => stop.split && stop.split[c] ? stop.split[c].split('|') : [c]);
  chunks.forEach(c => { const f = partFile(stop, word, c); if (!recordings.has(f)) errors.push(`${stop.id} ${where}: "${word}" needs a recording of "${f}"`); });
  const spelled = word.replace(/\|/g, '');
  if (testWords.has(spelled)) errors.push(`${stop.id} ${where}: "${spelled}" is an Assessment test word`);
}

let words = 0;
for (const stop of stops) {
  const all = [
    ...(stop.letters || []).map(w => [w, 'letters']),
    ...(stop.real || []).map(w => [w, 'real']),
    ...(stop.made || []).map(w => [w, 'made']),
    ...((stop.sort && stop.sort.words) || []).map(([w]) => [w, 'sort']),
    ...(stop.chains || []).flatMap(([a, b]) => [[a, 'chains'], [b, 'chains']]),
    ...stop.learn.examples.flatMap(w => w.split('>').map(x => [x, 'learn']))
  ];
  // Stop 1 practices the letters themselves, so its items are the test's letters by design.
  all.forEach(([w, where]) => { words++; if (stop.id !== '1') checkChunks(stop, w, where); else if (!recordings.has(w)) errors.push(`${stop.id}: no recording for "${w}"`); });
  // Lesson lines: every /sound/ mark plays one of Mr. O's recordings.
  // /x~y/ shows x and plays y; /uh/ /ee/ /air/ … are sound names (SOUND_NAMES)
  for (const line of stop.learn.lines) for (const m of line.matchAll(/\/([a-z]+)(?:~([a-z]+))?\//g)) {
    const snd = m[2] || m[1], f = SOUND_NAMES[snd] || fileFor(stop, snd);
    if (!recordings.has(f)) errors.push(`${stop.id} lesson: no recording for the sound /${m[0].slice(1, -1)}/`);
  }
  for (const [word, notes] of Object.entries(stop.sounds || {})) for (const [c, n] of Object.entries(notes)) {
    if (word.split('|').filter(x => x === c).length !== 1) errors.push(`${stop.id}: the sound note on "${c}" in "${word}" must name one part of the word`);
    if (!recordings.has(SOUND_NAMES[n] || n)) errors.push(`${stop.id}: the sound note "${c}=${n}" in "${word}" has no recording`);
  }
  // Try it after a teaching screen: a word the stop already says (its list or its lesson words), never a test word
  const said = new Set([...(stop.real || []), ...stop.learn.examples]);
  for (const sc of stop.learn.screens || []) {
    if (!sc.try) { if (!sc.recap) warnings.push(`${stop.id}: Learn screen "${sc.label}" has no Try it`); continue; }
    const w = typeof sc.try === 'string' ? sc.try : sc.try.word;
    if (!said.has(w)) errors.push(`${stop.id}: Try it "${w}" (screen "${sc.label}") is not one of the stop's words`);
    checkChunks(stop, w, 'try');
    if (typeof sc.try !== 'string' && !(sc.try.ask && sc.try.choices && sc.try.choices.length === 2)) errors.push(`${stop.id}: Try it on "${sc.label}" needs ask and 2 choices`);
  }
  for (const [word, alt] of Object.entries(stop.chop2 || {})) {
    if (!(stop.real || []).includes(word)) errors.push(`${stop.id}: second chop for "${word}", which is not on the list`);
    if (alt.replace(/\|/g, '') !== word.replace(/\|/g, '') || alt === word) errors.push(`${stop.id}: second chop "${alt}" is not another chop of "${word}"`);
  }
  for (const w of stop.made || []) {
    const chunks = w.split('|');
    const misses = nearMisses(stop, chunks);
    if (misses.length < 2) errors.push(`${stop.id} made: "${w}" has only ${misses.length} near-miss choices`);
    const spellings = new Set([chunks.join(''), ...misses.map(m => m.join(''))]);
    if (spellings.size !== misses.length + 1) errors.push(`${stop.id} made: "${w}" has a repeated choice`);
    misses.forEach(m => m.forEach(c => { if (!recordings.has(fileFor(stop, c))) errors.push(`${stop.id} near-miss of "${w}": needs a recording of "${c}"`); }));
    misses.forEach(m => { const sp = m.join(''); if (testWords.has(sp)) errors.push(`${stop.id}: near-miss "${sp}" (of "${w}") is a test word`); if (BLOCKED.has(sp)) errors.push(`${stop.id}: near-miss "${sp}" (of "${w}") is a blocked word`); });
    if (BLOCKED.has(chunks.join(''))) errors.push(`${stop.id}: made-up word "${chunks.join('')}" is a blocked word`);
    if (dict.has(chunks.join(''))) warnings.push(`${stop.id}: made-up word "${chunks.join('')}" is in the dictionary`);
  }
}

// 5. Close to a test word (Marcos 10/30: prepare for the test "without actually practicing them"). Errors on the
//    big-word stops, where the rule was made; warnings on the others.
const share6 = (a, b) => { for (let i = 0; i + 6 <= a.length; i++) if (b.includes(a.slice(i, i + 6))) return a.slice(i, i + 6); return null; };
for (const stop of stops) {
  if (stop.id === '1') continue;
  const items = [...(stop.real || []), ...(stop.made || []), ...((stop.sort && stop.sort.words) || []).map(([w]) => w), ...(stop.chains || []).flat(),
    ...stop.learn.examples.flatMap(w => w.split('>')), ...(stop.example ? [stop.example.replace(/·/g, '|')] : [])];
  for (const w of new Set(items.map(x => x.replace(/\|/g, '').toLowerCase()))) for (const t of testWords) {
    const s6 = w !== t && share6(w, t);
    const why = w === t ? 'is' : t.length >= 4 && w.includes(t) ? 'contains' : w.length >= 5 && t.includes(w) ? 'sits inside' : s6 ? `shares "${s6}" with` : null;
    if (why) (stop.big ? errors : warnings).push(`${stop.id}: "${w}" ${why} the test word "${t}"`);
  }
}

// Nothing the computer voice says may come out as letter NAMES (Marcos 10/16: "a few sounds
// come out as just naming letters"). Short or vowel-less strings get read as letters.
const Respell = require('../respell.js');
const OK_SHORT = new Set(['bo', 'my']);           // approved by ear 10/15 (boe, migh)
const PARTS = new Set(['sh','ch','th','wh','ck','ng','tch','dge','kn','wr','gn','qu','ai','ay','ea','oa','oe','oo','ew','ou','oi','oy','au','aw','igh','ar','or','er','ir','ur','un','re','pre','dis','non','ful','ness','est','ate','ine','ole']);
for (const stop of stops) {
  const real = new Set([...(stop.real || []), ...(stop.letters || []), ...(stop.chains || []).flat(), ...stop.learn.examples.flatMap(w => w.split('>')), ...((stop.sort && stop.sort.words) || []).filter(([, k]) => k !== 'made').map(([w]) => w)].map(w => w.replace(/\|/g, '')));
  const items = [...(stop.real || []), ...(stop.chains || []).flat(), ...stop.learn.examples.flatMap(w => w.split('>')), ...((stop.sort && stop.sort.words) || []).map(([w]) => w)];
  for (const w of stop.made || []) { items.push(w); nearMisses(stop, w.split('|')).forEach(v => items.push(v.join('|'))); }
  for (const it of items) {
    const c = it.split('|'), word = c.join('');
    if (recordings.has(word) || stop.id === '1') continue;          // his recording plays, or stop 1's letters
    const tts = real.has(word) ? word : Respell.respell(c);
    if ((tts.length <= 2 || !/[aeiouy]/.test(tts)) && !OK_SHORT.has(tts)) errors.push(`${stop.id}: "${word}" goes to the voice as "${tts}" — may be read as letter names`);
  }
  for (const line of stop.learn.lines) {
    const spoken = line.replace(/\/[a-z]+(?:~[a-z]+)?\//g, ' ').replace(/\{[a-z]+\}/g, ' ');
    for (const w of spoken.toLowerCase().match(/[a-z]+/g) || []) if (PARTS.has(w)) errors.push(`${stop.id} lesson: the voice reads the word part "${w}" — mark it /${w}/ (sound) or {${w}} (letter names)`);
  }
  if (!stop.sayName && /^[a-z]{1,3}( [a-z]{1,3})+$/.test(stop.name)) errors.push(`stop ${stop.id} "${stop.name}" needs a sayName so the voice doesn't read letters`);
}

console.log(`${stops.length} stops, ${words} words checked against ${recordings.size} recordings and ${testWords.size} test words.`);
warnings.forEach(w => console.log('warning: ' + w));
if (errors.length) { errors.forEach(e => console.log('ERROR: ' + e)); process.exit(1); }
console.log('All practice content is OK.');
