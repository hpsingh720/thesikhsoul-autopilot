// Decides today's post. Order: calendar occasion > best fresh format > rest day.
// Nothing repeats: clips are used once, quotes rest 30 days, Hukamnama is new every day.
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { eventsOn, leadEvent, toneOf } from "./calendar.mjs";
import { todaysHukamnama } from "./hukamnama.mjs";
import { aiOn, caption as aiCaption, footageWords } from "./ai.mjs";
import { pexelsOn, fetchFreshClips } from "./pexels.mjs";
import { loadHistory, norm } from "./history.mjs";
import { notify } from "./notify.mjs";

const ROOT = process.cwd();
const ist = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
const pad = (n) => String(n).padStart(2, "0");
const ymd = `${ist.getFullYear()}-${pad(ist.getMonth() + 1)}-${pad(ist.getDate())}`;
const seed = Number(ymd.replace(/-/g, ""));
const rand = (n) => (Math.abs((seed * 2654435761 + n * 48611) % 104729)) / 104729;
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const ord = (d) => d + (d % 10 === 1 && d !== 11 ? "st" : d % 10 === 2 && d !== 12 ? "nd" : d % 10 === 3 && d !== 13 ? "rd" : "th");
const dateLine = `${ord(ist.getDate())} ${MONTHS[ist.getMonth()]} ${ist.getFullYear()}`;
const TAGS = "#Sikhi #Sikh #Gurbani #Waheguru #Punjab #ਗੁਰਬਾਣੀ #TheSikhSoul #ChardiKala #Waheguruji";

const hist = loadHistory();
const used = new Set(hist.usedClips);
const list = (dir, exts) => {
  const full = path.join(ROOT, "public", dir);
  return fs.existsSync(full) ? fs.readdirSync(full).filter((f) => exts.includes(path.extname(f).toLowerCase())).sort() : [];
};
const freshOwn = list("broll", [".mp4", ".mov", ".m4v"]).map((f) => `broll/${f}`).filter((r) => !used.has(path.basename(r, path.extname(r))));
const tracks = list("music", [".mp3", ".m4a", ".wav", ".aac"]).map((f) => `music/${f}`);
const lastUse = (rel) => {
  const i = [...hist.posts].reverse().findIndex((p) => p.music === rel);
  return i < 0 ? 1e9 : i;
};
const music = tracks.sort((a, b) => lastUse(b) - lastUse(a) || rand(a.length) - rand(b.length))[0] || null;
const logo = fs.existsSync(path.join(ROOT, "public/logo.png")) ? "logo.png" : null;

// Fresh quotes: not posted in the last 30 days, near-duplicates collapsed.
const quotes = JSON.parse(fs.readFileSync(path.join(ROOT, "content/quotes.json"), "utf8"));
const cutoff = Date.now() - 30 * 864e5;
const recent = new Set(hist.posts.filter((p) => p.quote && new Date(p.date).getTime() > cutoff).map((p) => norm(p.quote)));
const everUsed = new Map();
hist.posts.forEach((p) => p.quote && everUsed.set(norm(p.quote), (everUsed.get(norm(p.quote)) || 0) + 1));
const seenNorm = new Set();
const freshQuotes = quotes.filter((q) => {
  const n = norm(q.text);
  if (recent.has(n) || seenNorm.has(n)) return false;
  seenNorm.add(n);
  return true;
}).sort((a, b) => (everUsed.get(norm(a.text)) || 0) - (everUsed.get(norm(b.text)) || 0));

// Clip supply: own fresh clips first, then AI-picked Pexels footage.
const takeClips = async (n, moodText) => {
  const out = freshOwn.splice(0, n);
  if (out.length < n && pexelsOn()) {
    const words = aiOn() ? await footageWords(moodText) : null;
    const px = await fetchFreshClips(words, used, n - out.length);
    out.push(...px.map((p) => p.rel));
  }
  return out;
};

// Performance-weighted format choice (fills in as the weekly report collects views).
const weight = (kind, base) => {
  const v = hist.posts.filter((p) => p.kind === kind && typeof p.views === "number").map((p) => p.views).sort((a, b) => a - b);
  if (v.length < 3) return base;
  const all = hist.posts.filter((p) => typeof p.views === "number").map((p) => p.views).sort((a, b) => a - b);
  const med = (a) => a[Math.floor(a.length / 2)] || 1;
  return Math.max(0.15, base * (med(v) / med(all)));
};

let plan = null;
const tmr = new Date(ist.getTime() + 864e5);
const ymdT = `${tmr.getFullYear()}-${pad(tmr.getMonth() + 1)}-${pad(tmr.getDate())}`;
const draftMode = (process.env.POST_MODE || "draft") === "draft";
let forDate = ymd, occDateLine = dateLine;
let occasion = null;
if (draftMode && eventsOn(ymdT).length && !hist.posts.some((p) => p.forDate === ymdT)) {
  occasion = leadEvent(eventsOn(ymdT));
  forDate = ymdT;
  occDateLine = `${ord(tmr.getDate())} ${MONTHS[tmr.getMonth()]} ${tmr.getFullYear()}`;
} else if (!hist.posts.some((p) => p.forDate === ymd && ["celebration", "remembrance"].includes(p.kind))) {
  occasion = leadEvent(eventsOn(ymd));
}
const tone = occasion ? toneOf(occasion) : null;

if (occasion && tone) {
  const [clip] = await takeClips(1, occasion.en);
  plan = {
    kind: tone.solemn ? "remembrance" : "celebration",
    composition: "GurpurabReel",
    props: { titlePa: occasion.pa || occasion.en, titleEn: occasion.en, greeting: tone.greeting, dateLine: occDateLine, broll: clip || null, music, seed, logo, textStyle: tone.textStyle },
    caption: `${tone.capLead}\n\n${TAGS}`,
    clips: clip ? [clip] : [],
  };
} else {
  const options = [];
  const huk = await todaysHukamnama();
  if (huk && !hist.posts.some((p) => p.date === ymd && p.kind === "hukamnama")) options.push(["hukamnama", weight("hukamnama", 0.4)]);
  if (freshQuotes.length) options.push(["quote", weight("quote", 0.3)]);
  if (freshQuotes.length && music && (freshOwn.length >= 3 || pexelsOn())) options.push(["montage", weight("montage", 0.3)]);
  const forced = process.env.FORCE_KIND;
  let kind = forced && options.some((o) => o[0] === forced) ? forced : null;
  if (!kind && options.length) {
    const total = options.reduce((s, o) => s + o[1], 0);
    let r = rand(3) * total;
    for (const [k, w] of options) { if ((r -= w) <= 0) { kind = k; break; } }
    kind = kind || options[options.length - 1][0];
  }
  const styles = ["glow", "shine", "simple", "strip"];
  const layout = rand(5) < 0.5 ? "card" : "full";

  if (kind === "hukamnama") {
    const [clip] = await takeClips(1, huk.en || "peace");
    const angTxt = huk.ang ? `, Ang ${huk.ang}` : "";
    const reflect = aiOn() ? await aiCaption("Hukamnama", huk.en || huk.pa, "Write only a short personal reflection. Label nothing as Gurbani.") : null;
    plan = {
      kind,
      composition: "QuoteReel",
      props: { quote: huk.pa, subtitle: huk.en || null, broll: clip || null, music, seed, logo, textStyle: rand(7) < 0.5 ? "glow" : "simple", layout, eyebrow: `ਅੱਜ ਦਾ ਹੁਕਮਨਾਮਾ · ${dateLine}` },
      caption: `📜 Today's Hukamnama Sahib — Sri Darbar Sahib${angTxt}\n${dateLine}\n\n${huk.pa}\n\n${huk.en || ""}${reflect ? `\n\nReflection: ${reflect}` : ""}\n\nWaheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh 🙏\n\n${TAGS} #Hukamnama #HukamnamaSahib`,
      clips: clip ? [clip] : [],
    };
  } else if (kind === "montage" || kind === "quote") {
    const q = freshQuotes[Math.floor(rand(4) * Math.min(3, freshQuotes.length))];
    const cap = aiOn() ? await aiCaption("quote", q.text) : null;
    const baseCap = `${cap || q.text}\n\nFollow @thesikhsoul 🙏\n\n${TAGS}`;
    if (kind === "montage") {
      const clips = await takeClips(4, q.text);
      let built = null, mTrack = music;
      for (const t of [music, ...tracks.filter((x) => x !== music)]) {
        if (clips.length >= 2 && t && (built = buildMontage(t, clips))) { mTrack = t; break; }
      }
      if (built) {
        plan = { kind, composition: "MontageReel", props: { quote: q.text.split("\n")[0], ...built, music: mTrack, seed, logo, textStyle: styles[Math.floor(rand(6) * 3)] }, caption: baseCap, quote: q.text, clips };
      } else {
        freshOwn.unshift(...clips.filter((c) => !c.includes("px-")));
        kind = "quote";
      }
    }
    if (!plan) {
      const [clip] = await takeClips(1, q.text);
      plan = { kind: "quote", composition: "QuoteReel", props: { quote: q.text, broll: clip || null, music, seed, logo, textStyle: styles[Math.floor(rand(6) * 4)], layout }, caption: baseCap, quote: q.text, clips: clip ? [clip] : [] };
    }
  }
}

fs.mkdirSync("out", { recursive: true });
const envFile = process.env.GITHUB_ENV;
if (!plan) {
  console.log("Rest day: nothing fresh to post.");
  if (envFile) fs.appendFileSync(envFile, "SKIP=true\n");
  await notify("😴 Rest day — I had nothing fresh to post, so I posted nothing (better than repeating).\nSend me new quotes or clips, or send /ideas for AI quote drafts.");
} else {
  plan.filename = `reel-${ymd.replace(/-/g, "")}-${pad(ist.getHours())}${pad(ist.getMinutes())}.mp4`;
  plan.date = ymd;
  plan.forDate = plan.kind === "celebration" || plan.kind === "remembrance" ? forDate : ymd;
  fs.writeFileSync("out/plan.json", JSON.stringify(plan, null, 2));
  fs.writeFileSync("out/props.json", JSON.stringify(plan.props, null, 2));
  console.log(`Plan: ${plan.kind} → ${plan.composition} | clips: ${plan.clips.join(", ") || "generated background"} | music: ${music || "none"}`);
}

// ---- Beat-sync montage (unchanged engine, now fed only fresh clips) ----
function buildMontage(musicRel, clips) {
  const beatsFile = path.join(ROOT, "public", musicRel.replace(/\.[^.]+$/, "") + ".beats.json");
  if (!fs.existsSync(beatsFile)) { try { execSync(`node scripts/beatmap.mjs "public/${musicRel}"`, { stdio: "inherit" }); } catch { return null; } }
  let bm; try { bm = JSON.parse(fs.readFileSync(beatsFile, "utf8")); } catch { return null; }
  if (!bm?.beats || bm.beats.length < 12) return null;
  const fps = 30;
  const grid = bm.beats.filter((t) => t >= 0.3);
  const gaps = grid.slice(1).map((t, i) => t - grid[i]).sort((a, b) => a - b);
  const period = gaps[Math.floor(gaps.length / 2)] || 0.5;
  const pattern = period > 0.45 ? [4, 4, 2, 2, ...Array(8).fill(1), 4] : [8, 8, 4, 4, ...Array(12).fill(1), 8];
  // Fit the edit inside the track (never loop past the music's end).
  while (pattern.reduce((a, b) => a + b, 0) + 1 > grid.length && pattern.length > 6) pattern.splice(4, 1);
  if (pattern.reduce((a, b) => a + b, 0) + 1 > grid.length) return null;
  const durOf = (rel) => { try { return parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "public/${rel}"`).toString()); } catch { return 0; } };
  const durs = clips.map(durOf);
  const t0 = grid[0];
  const segments = [];
  let bi = 0;
  pattern.forEach((nb, j) => {
    const from = Math.round((grid[bi] - t0) * fps);
    const to = Math.round((grid[bi + nb] - t0) * fps);
    const clip = j % clips.length;
    const room = Math.max(0, (durs[clip] || 0) - (to - from) / fps - 0.3);
    segments.push({ from, dur: Math.max(1, to - from), clip, startFrom: Math.round(rand(100 + j) * room * fps) });
    bi += nb;
  });
  const last = segments[segments.length - 1];
  return { segments, audioStartFrom: Math.round(t0 * fps), durationInFrames: last.from + last.dur + 10, clips };
}
