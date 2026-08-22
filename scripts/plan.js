// Decides today's content: gurpurab / shahidi tribute / sangrand / daily quote.
// Writes out/plan.json (composition, filename, caption) and out/props.json.
import fs from "node:fs";
import path from "node:path";
import { getGurpurabsForDate, getNanakshahiDate } from "nanakshahi";

const ROOT = process.cwd();
const istNow = new Date(
  new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
);
const pad = (n) => String(n).padStart(2, "0");
const ymd = `${istNow.getFullYear()}${pad(istNow.getMonth() + 1)}${pad(istNow.getDate())}`;
const seed = Number(ymd);

const listMedia = (dir, exts) => {
  const full = path.join(ROOT, "public", dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => exts.includes(path.extname(f).toLowerCase()))
    .sort();
};
const pickSeeded = (arr) => (arr.length ? arr[seed % arr.length] : null);

const brollFile = pickSeeded(listMedia("broll", [".mp4", ".mov", ".m4v"]));
const musicFile = pickSeeded(listMedia("music", [".mp3", ".m4a", ".wav", ".aac"]));
const broll = brollFile ? `broll/${brollFile}` : null;
const music = musicFile ? `music/${musicFile}` : null;

const nd = getNanakshahiDate(istNow);
const dateLine = `${nd.punjabiDate.date} ${nd.punjabiDate.monthName} ${nd.punjabiDate.year} ਨਾਨਕਸ਼ਾਹੀ`;

const events = getGurpurabsForDate(istNow);
const gurpurabs = events.filter((e) => e.type === "gurpurab");
const historical = events.filter((e) => e.type === "historical");
const sangrand = events.find(
  (e) => e.type === "calendar" && /^Beginning of /i.test(e.en)
);

const TEXT_STYLES = ["glow", "shine", "simple", "strip"];
const LAYOUTS = ["card", "full"];
const h = (n) => Math.abs((seed * 2654435761 + n * 96769) % 104729);
const dailyTextStyle = TEXT_STYLES[h(1) % TEXT_STYLES.length];
const dailyLayout = LAYOUTS[h(2) % LAYOUTS.length];

const TAGS =
  "#Sikhi #Sikh #Gurbani #Waheguru #Punjab #ਗੁਰਬਾਣੀ #SikhSoul #ChardiKala";

let plan;

const isSolemn = (t) =>
  /Shaheedi|Shaeedi|Jotti Jot|ਸ਼ਹੀਦੀ|ਜੋਤੀ ਜੋਤ/i.test(t);

if (gurpurabs.length > 0 || historical.length > 0) {
  const ev = gurpurabs[0] || historical[0];
  const solemn = isSolemn(ev.en + ev.pa);
  const greeting = solemn ? "ਕੋਟਿ ਕੋਟਿ ਪ੍ਰਣਾਮ" : "ਲੱਖ ਲੱਖ ਵਧਾਈਆਂ";
  const capLead = solemn
    ? `🙏 ${ev.en}\n${ev.pa}\n\nKot Kot Parnaam. We remember with deepest shardha.`
    : `🙏 ${ev.en}\n${ev.pa}\n\nLakh Lakh Vadhaiyan to the entire Sangat!`;
  plan = {
    composition: "GurpurabReel",
    props: { titlePa: ev.pa, titleEn: ev.en, greeting, dateLine, broll, music, seed, textStyle: solemn ? "simple" : "shine" },
    caption: `${capLead}\n\nFollow ${"@thesikhsoul"} for daily Sikhi.\n\n${TAGS}`,
    kind: solemn ? "shahidi-tribute" : "gurpurab",
  };
} else if (sangrand) {
  const monthPa = nd.punjabiDate.monthName;
  const monthEn = nd.englishDate.monthName;
  plan = {
    composition: "GurpurabReel",
    props: {
      titlePa: `ਸੰਗਰਾਂਦ — ${monthPa}`,
      titleEn: `Sangrand · The month of ${monthEn} begins`,
      greeting: "ਸੰਗਰਾਂਦ ਦੀਆਂ ਲੱਖ ਲੱਖ ਵਧਾਈਆਂ",
      dateLine,
      broll,
      music,
      seed,
      textStyle: "glow",
    },
    caption: `🌅 Sangrand — ${monthEn} (${monthPa})\n\nSangrand diyan Lakh Lakh Vadhaiyan!\n\nFollow @thesikhsoul for daily Sikhi.\n\n${TAGS}`,
    kind: "sangrand",
  };
} else {
  const quotes = JSON.parse(
    fs.readFileSync(path.join(ROOT, "content/quotes.json"), "utf8")
  );
  const statePath = path.join(ROOT, "content/state.json");
  const state = fs.existsSync(statePath)
    ? JSON.parse(fs.readFileSync(statePath, "utf8"))
    : { index: 0 };
  const q = quotes[state.index % quotes.length];
  state.index = (state.index + 1) % quotes.length;
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  plan = {
    composition: "QuoteReel",
    props: { quote: q.text, broll, music, seed, textStyle: dailyTextStyle, layout: dailyLayout },
    caption: `${q.text}\n\nFollow @thesikhsoul for daily Sikhi 🙏\n\n${TAGS}`,
    kind: "quote",
  };
}

plan.filename = `reel-${ymd}-${pad(istNow.getHours())}${pad(istNow.getMinutes())}.mp4`;

fs.mkdirSync(path.join(ROOT, "out"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "out/plan.json"), JSON.stringify(plan, null, 2));
fs.writeFileSync(
  path.join(ROOT, "out/props.json"),
  JSON.stringify(plan.props, null, 2)
);

console.log(`Plan: ${plan.kind} → ${plan.composition} → ${plan.filename}`);
console.log(`Broll: ${broll ?? "generated background"} | Music: ${music ?? "none (silent)"}`);
