/* =====================================================================
   BLEND CORE — turns Mr. O's separate sound recordings into one word.
   Pure math on sample arrays, shared by the page (index.html buildBlend)
   and tools/blend-sample.js, so the samples he approves are exactly what
   students hear.
   Each recording holds its sound for about a third of a second (right for
   hearing one sound alone, too slow inside a word). In a word of two or
   more sounds, each sound is shortened to at most MAX_SOUND seconds by a
   pitch-keeping time squeeze (WSOLA), and neighbours overlap by OVERLAP
   seconds so they run together. A single sound is left at full length.
   ===================================================================== */
(function (root) {
  const MAX_SOUND = 0.17;   // longest a sound may last inside a word (seconds)
  const OVERLAP = 0.025;    // how much each sound runs into the next (seconds)
  const FADE = 0.008;       // soft edges so nothing clicks (seconds)
  const MAX_SQUEEZE = 3;    // never speed a sound up more than this
  const FINAL_STRETCH = 1.4; // the last sound of a word may run a little longer
  const MODE = 'cut';        // 'cut' or 'squeeze' — see blend(). Words now use the computer voice
                             // (respell.js); joined words 'sounded strange' to Mr. O both ways (10/15).

  // Where the sound starts and stops, judged in 10 ms windows against the
  // recording's own background noise, so quiet sounds like s, f and th stay.
  function span(data, rate) {
    const win = Math.max(1, Math.round(rate * 0.01));
    const rms = [];
    for (let i = 0; i < data.length; i += win) {
      let sum = 0;
      const stop = Math.min(data.length, i + win);
      for (let j = i; j < stop; j++) sum += data[j] * data[j];
      rms.push(Math.sqrt(sum / (stop - i)));
    }
    const sorted = [...rms].sort((a, b) => a - b);
    const noise = sorted[Math.floor(sorted.length * 0.2)];
    const loudest = sorted[sorted.length - 1];
    if (!loudest) return null;
    const limit = Math.max(noise * 4, loudest * 0.05);
    const first = rms.findIndex(v => v > limit);
    if (first < 0) return null;
    let last = rms.length - 1;
    while (last > first && rms[last] <= limit) last--;
    const before = Math.round(rate * 0.03), after = Math.round(rate * 0.05);
    return { start: Math.max(0, first * win - before), end: Math.min(data.length, (last + 1) * win + after) };
  }

  // Make a sound `speed` times shorter without changing its pitch (WSOLA):
  // overlap-add 30 ms slices, each one nudged to line up with the last.
  function squeeze(x, speed, rate) {
    const N = Math.round(rate * 0.03) & ~1;
    if (speed <= 1 || x.length <= N * 2) return x;
    const hop = N / 2, take = hop * speed, tol = Math.round(rate * 0.006);
    const outLen = Math.round(x.length / speed);
    const win = new Float32Array(N);
    for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N);
    const out = new Float32Array(outLen + N), norm = new Float32Array(outLen + N);
    let prev = 0;
    for (let k = 0; k * hop < outLen; k++) {
      const nominal = Math.round(k * take);
      let start = nominal;
      const ref = prev + hop;
      const lo = Math.max(0, nominal - tol), hi = Math.min(x.length - N, nominal + tol);
      if (k > 0 && ref + hop <= x.length && hi >= lo) {
        let best = -Infinity;
        for (let c = lo; c <= hi; c += 2) {
          let s = 0;
          for (let i = 0; i < hop; i += 2) s += x[ref + i] * x[c + i];
          if (s > best) { best = s; start = c; }
        }
      }
      start = Math.max(0, Math.min(start, x.length - N));
      const at = k * hop;
      for (let i = 0; i < N; i++) { out[at + i] += x[start + i] * win[i]; norm[at + i] += win[i]; }
      prev = start;
    }
    const y = new Float32Array(outLen);
    for (let i = 0; i < outLen; i++) y[i] = norm[i] > 0.1 ? out[i] / norm[i] : out[i];
    return y;
  }

  // Shorten by keeping the start of the sound and fading out the held part.
  function cut(seg, len, rate) {
    const y = seg.slice(0, len);
    const tail = Math.min(len, Math.round(rate * 0.04));
    for (let i = 0; i < tail; i++) y[len - 1 - i] *= i / tail;
    return y;
  }

  // One word from several sounds (arrays of samples at the same rate).
  // opts.mode: 'cut' (keep the start of each sound) or 'squeeze' (pitch-kept speed-up)
  // opts.max: longest a sound may last (seconds); the last sound gets FINAL_STRETCH times more.
  function blend(sounds, rate, opts = {}) {
    const mode = opts.mode || MODE;
    const max = opts.max || MAX_SOUND;
    const overlap = opts.overlap !== undefined ? opts.overlap : OVERLAP;
    const many = sounds.length > 1;
    const parts = [];
    for (let k = 0; k < sounds.length; k++) {
      const data = sounds[k];
      const sp = span(data, rate);
      if (!sp) return null;
      let seg = data.slice(sp.start, sp.end);
      const maxLen = Math.round(max * rate * (k === sounds.length - 1 ? FINAL_STRETCH : 1));
      if (many && seg.length > maxLen) {
        seg = mode === 'cut' ? cut(seg, maxLen, rate) : squeeze(seg, Math.min(MAX_SQUEEZE, seg.length / maxLen), rate);
      }
      parts.push(seg);
    }
    const fade = Math.round(FADE * rate);
    const shortest = Math.min(...parts.map(p => p.length));
    const ov = many ? Math.min(Math.round(overlap * rate), Math.floor(shortest / 3)) : 0;
    const total = parts.reduce((n, p) => n + p.length, 0) - ov * (parts.length - 1);
    const out = new Float32Array(total);
    let pos = 0;
    parts.forEach((p, k) => {
      const len = p.length;
      const inRamp = k === 0 ? fade : Math.max(ov, 1);
      const outRamp = k === parts.length - 1 ? fade : Math.max(ov, 1);
      for (let i = 0; i < len; i++) {
        let g = 1;
        if (i < inRamp) g = i / inRamp;
        if (i > len - outRamp) g = Math.min(g, (len - i) / outRamp);
        out[pos + i] += p[i] * g;
      }
      pos += len - ov;
    });
    return out;
  }

  const api = { span, squeeze, blend, MAX_SOUND, OVERLAP };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BlendCore = api;
})(typeof window !== 'undefined' ? window : this);
