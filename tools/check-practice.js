#!/usr/bin/env node
/* Checks the practice content before a push:
   1. every chunk is one of Mr. O's recordings (.m4a in the site folder)
   2. no practice word is an Assessment test word
   3. every made-up word gets two near-miss choices that are spelled
      differently and are made of recordings too
   4. made-up words are not real words (warning, from the system dictionary)
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
  window: {}, location: { search: '' }, localStorage: { getItem: () => null, setItem() {} },
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
const fileFor = (stop, c) => (c === 're' ? (stop.id === '10' ? 're-long' : 're-short') : c);
function checkChunks(stop, word, where) {
  const chunks = word.split('|').flatMap(c => stop.split && stop.split[c] ? stop.split[c].split('|') : [c]);
  chunks.forEach(c => { if (!recordings.has(fileFor(stop, c))) errors.push(`${stop.id} ${where}: "${word}" needs a recording of "${c}"`); });
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

console.log(`${stops.length} stops, ${words} words checked against ${recordings.size} recordings and ${testWords.size} test words.`);
warnings.forEach(w => console.log('warning: ' + w));
if (errors.length) { errors.forEach(e => console.log('ERROR: ' + e)); process.exit(1); }
console.log('All practice content is OK.');
