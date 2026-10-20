/* =====================================================================
   RESPELL — how the computer voice is told to say a made-up word.
   Students always SEE the real spelling (zait); the voice is handed a
   spelling it pronounces correctly ("zayt"). Mr. O approved respelled
   samples 10/15 ("the respellings sound great"). The voice differs by
   device, so voices.html lists every made-up word to check on a Chromebook.
   Built from the word's chunks; WORDS overrides any whole word by hand.
   Loaded by index.html (Learning Lab, Word Builder) and practice.js.
   ===================================================================== */
(function (root) {
  // Chunk → what to hand the voice. Anything not listed is said as written.
  const CHUNKS = {
    // magic-e endings
    ate: 'ayt', ade: 'ayd', ane: 'ayn', ape: 'ayp',
    ine: 'yne', ile: 'yle', ice: 'yse',
    // "oh" + a consonant came out SHORT on the Mac voice (zoht = zot, lohz = loz, ploht = plot — the same
    // audio, 10/19); "oat"/"oaz" come out exactly like note/vote/doze. ole stays: hohl = hole.
    ole: 'ohl', oze: 'oaz', ote: 'oat', une: 'oon',
    // vowel teams
    ai: 'ay', ay: 'ay', ea: 'ee', oa: 'oa', oo: 'oo', ou: 'ow',
    oi: 'oy', oy: 'oy', au: 'aw', aw: 'aw', oe: 'o', ew: 'oo', ol: 'ohl', al: 'awl',
    // bossy R: er, ir and ur all say er
    ir: 'er', ur: 'er',
    // tricky letters
    // tch and dge stay as written: "zach" was read like the name Zach and "lij" letter by letter (10/19)
    kn: 'n', wr: 'r', gn: 'n', qu: 'kw', x: 'ks', ck: 'k', ph: 'f', wh: 'w', c: 'k'
  };
  // Whole words that need a hand-made spelling (made-up word: voice spelling).
  const WORDS = {
    hes: 'hess',
    // measured 10/19 on the Mac voice: these were read letter by letter (mib, tep, igg) or sounded
    // exactly like another choice (zat = zot)
    mib: 'mihb', tep: 'tehp', ig: 'ihgg', zat: 'zatt'
  };

  function respell(chunks) {
    const word = chunks.join('').toLowerCase();
    if (WORDS[word]) return WORDS[word];
    const parts = chunks.map(c => c.toLowerCase());
    let out = '';
    for (let i = 0; i < parts.length; i++) {
      const k = parts[i], next = parts[i + 1];
      // oa before one last consonant reads best as o_e: loab → lobe, shoam → shome
      if (k === 'oa' && i === parts.length - 2 && /^[bcdfgklmnprstvz]$/.test(next)) { out += 'o' + next + 'e'; break; }
      if (k === 'igh') { out += i === parts.length - 1 ? 'y' : 'igh'; continue; }   // migh → my
      if (k === 'g' && next && /^[eiy]/.test(next)) { out += 'gh'; continue; }        // gerd stays a hard g: gherd
      if (k === 'ch' && i > 0 && i === parts.length - 1) { out += 'tch'; continue; }   // zech was read "zek": zetch
      out += CHUNKS[k] !== undefined ? CHUNKS[k] : k;
    }
    // A short vowel closed by one consonant is spelled the way English writes a short vowel, so the
    // voice says it short (Marcos 10/20: "many short vowel words are being spoken as long vowel"): the
    // last consonant doubled (guf → guff, zub → zubb, mut → mutt), a k as ck (tuk → tuck). Measured on the
    // Mac voice: 40 of 40 real short words (cut, cub, hug…) sound exactly the same spelled that way,
    // and 51 of 336 made-up voice strings did not match their doubled spelling. Not "al": "all" says aw;
    // not pul/ful/bul: pull, full, bull say the u of "book".
    const n = parts.length, last = parts[n - 1], vowel = parts[n - 2];
    if (n >= 2 && /^[aeiou]$/.test(vowel) && /^[bdfgklmnprstvz]$/.test(last) && out.endsWith(last) && !(vowel === 'a' && last === 'l') && !(vowel === 'u' && last === 'l' && /[pfb]$/.test(parts[n - 3] || ''))) {
      out = last === 'k' ? out.slice(0, -1) + 'ck' : out + last;
    }
    // A two-letter word like "ab" or "ot" can be read as letter names: double the end ("abb").
    if (/^[aeiou][bcdfghjklmnpqrstvwxyz]$/.test(out)) out += out[1];
    return out;
  }

  const api = { respell, CHUNKS, WORDS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Respell = api;
})(typeof window !== 'undefined' ? window : this);
