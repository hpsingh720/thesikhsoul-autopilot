// Beat-maps an audio file: writes <track>.beats.json with {bpm, beats:[seconds]}
// Usage: node scripts/beatmap.mjs public/music/track.mp3
import { execSync } from "node:child_process";
import fs from "node:fs";

const src = process.argv[2];
if (!src || !fs.existsSync(src)) { console.error("no such file:", src); process.exit(1); }
const out = src.replace(/\.[^.]+$/, "") + ".beats.json";
const tmp = "/tmp/beatmap.wav";
execSync(`ffmpeg -v error -y -i "${src}" -ac 1 -ar 22050 -f wav "${tmp}"`);

const buf = fs.readFileSync(tmp);
let dataOff = buf.indexOf(Buffer.from("data"));
if (dataOff < 0) { console.error("bad wav"); process.exit(1); }
const dataLen = buf.readUInt32LE(dataOff + 4);
const pcmStart = dataOff + 8;
const n = Math.min(Math.floor(dataLen / 2), Math.floor((buf.length - pcmStart) / 2));
const sr = 22050, hop = 256;
const frames = Math.floor(n / hop);
const env = new Float64Array(frames);
for (let f = 0; f < frames; f++) {
  let s = 0;
  for (let i = 0; i < hop; i++) {
    const v = buf.readInt16LE(pcmStart + (f * hop + i) * 2) / 32768;
    s += v * v;
  }
  env[f] = Math.sqrt(s / hop);
}
const onset = new Float64Array(frames - 1);
for (let i = 1; i < frames; i++) onset[i - 1] = Math.max(0, env[i] - env[i - 1]);
const fps = sr / hop;

let best = { score: -1, bpm: 0 };
for (let bpm = 70; bpm <= 160; bpm += 0.5) {
  const lag = Math.round((fps * 60) / bpm);
  if (lag >= onset.length - 1) continue;
  let s = 0;
  for (let i = 0; i < onset.length - lag; i++) s += onset[i] * onset[i + lag];
  s /= onset.length - lag;
  if (s > best.score) best = { score: s, bpm };
}
const period = 60 / best.bpm;
const durSec = n / sr;

let bestPhase = { score: -1, t: 0 };
for (let p = 0; p < period; p += 0.01) {
  let s = 0, c = 0;
  for (let t = p; t < durSec - 0.1; t += period) {
    const idx = Math.round(t * fps);
    if (idx < onset.length) { s += onset[idx]; c++; }
  }
  if (c > 0 && s / c > bestPhase.score) bestPhase = { score: s / c, t: p };
}
const beats = [];
const win = Math.round(0.07 * fps);
for (let t = bestPhase.t; t < durSec - 0.1; t += period) {
  const c = Math.round(t * fps);
  let bi = c, bv = -1;
  for (let k = Math.max(0, c - win); k <= Math.min(onset.length - 1, c + win); k++) {
    if (onset[k] > bv) { bv = onset[k]; bi = k; }
  }
  beats.push(Math.round((bi / fps) * 1000) / 1000);
}

fs.writeFileSync(out, JSON.stringify({ bpm: Math.round(best.bpm * 10) / 10, duration: Math.round(durSec * 100) / 100, beats }, null, 1));
console.log(`${out}: ${best.bpm.toFixed(1)} BPM, ${beats.length} beats over ${durSec.toFixed(1)}s`);
