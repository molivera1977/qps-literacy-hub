#!/usr/bin/env node
/* Writes WAV files of blended words with the SAME code the page uses
   (blend-core.js), so Mr. O can listen before a change goes live.
   Usage (from the site folder, macOS):
     node tools/blend-sample.js <out-folder> s|u|n sh|i|p j|ate ...        */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const BlendCore = require('../blend-core.js');

const site = path.join(__dirname, '..');
const args = process.argv.slice(2);
const opts = {};
while (args[0] && args[0].startsWith('--')) { const [k, v] = args.shift().slice(2).split('='); opts[k] = k === 'mode' ? v : Number(v); }
const [outDir, ...words] = args;
if (!outDir || !words.length) { console.error('usage: node tools/blend-sample.js <out-folder> s|u|n ...'); process.exit(1); }
fs.mkdirSync(outDir, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'blend-'));
const RATE = 48000;

// Decode one recording to mono samples at 48 kHz (both channels mixed, like the page).
function load(name) {
  const wav = path.join(tmp, name + '.wav');
  execFileSync('afconvert', ['-f', 'WAVE', '-d', `LEI16@${RATE}`, '-c', '1', path.join(site, name + '.m4a'), wav]);
  const buf = fs.readFileSync(wav);
  let off = 12;
  while (off < buf.length) {
    const id = buf.toString('ascii', off, off + 4), size = buf.readUInt32LE(off + 4);
    if (id === 'data') {
      const n = size / 2, out = new Float32Array(n);
      for (let i = 0; i < n; i++) out[i] = buf.readInt16LE(off + 8 + i * 2) / 32768;
      return out;
    }
    off += 8 + size + (size % 2);
  }
  throw new Error('no audio in ' + name);
}

function writeWav(file, data) {
  const b = Buffer.alloc(44 + data.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + data.length * 2, 4); b.write('WAVE', 8);
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(RATE, 24); b.writeUInt32LE(RATE * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(data.length * 2, 40);
  data.forEach((v, i) => b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2));
  fs.writeFileSync(file, b);
}

for (const w of words) {
  const chunks = w.split('|');
  const out = BlendCore.blend(chunks.map(load), RATE, opts);
  const name = chunks.join('');
  writeWav(path.join(outDir, name + '.wav'), out);
  console.log(`${name}: ${(out.length / RATE).toFixed(2)} s`);
}
fs.rmSync(tmp, { recursive: true, force: true });
