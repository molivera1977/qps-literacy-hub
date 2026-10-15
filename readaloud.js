/* =====================================================================
   READ ALOUD WITH HIGHLIGHT — every 🔊 on the hub lights each word as
   it is read (Marcos 10/15: "where's the highlighting for the read
   aloud"). Same method as the science lessons:
     • voices that report each word (onboundary) move the highlight;
     • voices that never report (many Chromebook voices) get a highlight
       paced by hand from the length of the text.
   Rate stays 1.0, the speed Mr. O chose for this site (speakComputer).
   ===================================================================== */
window.QPSRead = (function () {
  const RATE = 1.0;
  const MS_PER_LETTER = 58, PACE_BASE = 0.92;   // measured on the science lessons at 0.92
  let current = null, timer = null, endCurrent = null, gen = 0;

  // Put each word of `text` in its own span (class rw) inside host.
  function wrap(host, text) {
    host.textContent = '';
    String(text).split(/(\s+)/).forEach(tok => {
      if (!tok) return;
      if (/^\s+$/.test(tok)) { host.append(document.createTextNode(tok)); return; }
      const w = document.createElement('span');
      w.className = 'rw';
      w.textContent = tok;
      host.append(w);
    });
    return host;
  }

  function wordsOf(host) { return [...host.querySelectorAll('.rw, .c-w')]; }
  function light(words, i) { words.forEach((w, k) => w.classList.toggle('lit', k === i)); }
  function clear() {
    if (timer) { clearInterval(timer); timer = null; }
    if (current) wordsOf(current).forEach(w => w.classList.remove('lit'));
    current = null;
  }

  function stop() {
    const end = endCurrent;
    endCurrent = null;
    if (window.speechSynthesis) speechSynthesis.cancel();
    clear();
    if (end) end();
  }

  // Read a block aloud, lighting its words. Resolves when the voice finishes.
  function say(host) {
    stop();
    gen++;
    return new Promise(resolve => {
      const words = wordsOf(host);
      const text = host.dataset.say || words.map(w => w.textContent).join(' ') || host.textContent;
      if (!text || !window.speechSynthesis) { resolve(); return; }
      const u = new SpeechSynthesisUtterance(text);
      u.rate = RATE;
      current = host;
      let reported = false;
      const finish = () => { if (endCurrent === finish) endCurrent = null; clear(); resolve(); };
      endCurrent = finish;
      // charIndex → the word it falls in (count the words before it)
      u.onboundary = (e) => {
        if (e.name && e.name !== 'word') return;
        reported = true;
        if (timer) { clearInterval(timer); timer = null; }
        light(words, text.slice(0, e.charIndex).split(/\s+/).filter(Boolean).length);
      };
      u.onstart = () => {
        if (!words.length) return;
        const per = Math.max(170, (text.length * MS_PER_LETTER) / words.length * (PACE_BASE / RATE));
        let i = 0;
        light(words, i);
        timer = setInterval(() => {
          if (reported) { clearInterval(timer); timer = null; return; }
          i++;
          if (i >= words.length) { clearInterval(timer); timer = null; return; }
          light(words, i);
        }, per);
      };
      u.onend = u.onerror = finish;
      try { speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { finish(); }
    });
  }

  // Static directions in the page (a .p-direction with a 🔊 button and a <p>):
  // wrap the words and make the button read that <p> with the highlight.
  function upgradeStatic(root) {
    (root || document).querySelectorAll('.p-direction').forEach(row => {
      const btn = row.querySelector('.p-say');
      const p = row.querySelector('p');
      if (!btn || !p || p.querySelector('.rw')) return;
      wrap(p, p.textContent);
      btn.removeAttribute('onclick');
      btn.onclick = () => say(p);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => upgradeStatic());
  else upgradeStatic();

  // Several blocks in a row (a lesson). Stops early if another speaker is tapped.
  async function sayAll(hosts) {
    for (const h of hosts) {
      const p = say(h);
      const mine = gen;
      await p;
      await new Promise(r => setTimeout(r, 120));
      if (gen !== mine) return;
    }
  }

  return { wrap, say, sayAll, stop, upgradeStatic };
})();
