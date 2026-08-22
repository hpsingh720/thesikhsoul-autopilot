// Inbox: pulls new quotes (text), b-roll (videos) and music (audio) that
// Manpreet sends to his private Telegram bot, straight into the repo.
import fs from "node:fs";
import path from "node:path";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED = (process.env.TELEGRAM_ALLOWED_USERNAME || "").replace(/^@/, "").toLowerCase();
if (!TOKEN) { console.log("No TELEGRAM_BOT_TOKEN set — skipping inbox sync."); process.exit(0); }

const API = `https://api.telegram.org/bot${TOKEN}`;
const FILEAPI = `https://api.telegram.org/file/bot${TOKEN}`;
const ROOT = process.cwd();
const statePath = path.join(ROOT, "content/telegram_state.json");
const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, "utf8")) : { offset: 0 };
const MAX_BYTES = 19_500_000; // Telegram bot download limit ~20MB

const tg = async (method, params = {}) => {
  const res = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(`${method}: ${JSON.stringify(json)}`);
  return json.result;
};

const reply = async (chatId, text) => {
  try { await tg("sendMessage", { chat_id: chatId, text }); } catch { /* non-fatal */ }
};

const download = async (fileId, destDir, prefix) => {
  const info = await tg("getFile", { file_id: fileId });
  const ext = path.extname(info.file_path || "") || ".bin";
  const dest = path.join(ROOT, destDir, `${prefix}${ext}`);
  const res = await fetch(`${FILEAPI}/${info.file_path}`);
  if (!res.ok) throw new Error(`download failed: ${res.status}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return path.relative(ROOT, dest);
};

const STARTER_QUOTES = new Set(["ਜਿੱਥੇ ਸਿਮਰਨ ਹੈ, ਉੱਥੇ ਸਕੂਨ ਹੈ।", "Peace isn't found. It's remembered — one Waheguru at a time.", "ਸੇਵਾ ਵਿੱਚ ਹੀ ਅਸਲ ਵਡਿਆਈ ਹੈ।", "Chardi Kala is not the absence of storms. It is the sail.", "ਵਾਹਿਗੁਰੂ ਦਾ ਨਾਮ, ਦਿਲ ਦਾ ਆਰਾਮ।", "Seva asks for no spotlight. That is exactly why it shines.", "An honest day's kirat is also a prayer.", "ਚੜ੍ਹਦੀ ਕਲਾ ਵਿੱਚ ਰਹੋ, ਸਰਬੱਤ ਦਾ ਭਲਾ ਮੰਗੋ।", "Naam in the heart. Humility in the head. Seva in the hands.", "Sangat lifts what willpower alone cannot.", "The storm checks your roots. Simran is how you water them.", "ਮਿਹਨਤ ਆਪਣੀ, ਭਰੋਸਾ ਵਾਹਿਗੁਰੂ ਤੇ।"]);
const quotesPath = path.join(ROOT, "content/quotes.json");
const quotes = fs.existsSync(quotesPath) ? JSON.parse(fs.readFileSync(quotesPath, "utf8")) : [];
let added = { quotes: 0, videos: 0, tracks: 0 };

const updates = await tg("getUpdates", { offset: state.offset, timeout: 0 });
for (const u of updates) {
  state.offset = Math.max(state.offset, u.update_id + 1);
  const m = u.message;
  if (!m) continue;
  const from = (m.from?.username || "").toLowerCase();
  if (ALLOWED && from !== ALLOWED) continue; // strangers are ignored
  const chat = m.chat.id;

  try {
    if (m.text && !m.text.startsWith("/")) {
      const text = m.text.trim();
      if (quotes.some((q) => q.text === text)) {
        await reply(chat, "🔁 Already in the quote bank.");
      } else {
        quotes.push({ text });
        added.quotes++;
        await reply(chat, `✅ Quote saved (#${quotes.length} in the bank).`);
      }
    } else if (m.text === "/clean") {
      const own = quotes.filter((q) => !STARTER_QUOTES.has(q.text));
      if (own.length === 0) {
        await reply(chat, "⚠️ Cleaning now would empty the bank. Send me some of your quotes first, then /clean.");
      } else {
        const removed = quotes.length - own.length;
        quotes.length = 0;
        quotes.push(...own);
        fs.writeFileSync(path.join(ROOT, "content/state.json"), JSON.stringify({ index: 0 }, null, 2));
        await reply(chat, `🧹 Removed ${removed} starter quotes. The bank is now 100% you: ${own.length} quotes, rotation restarted.`);
      }
    } else if (m.text === "/start") {
      await reply(chat, "🙏 TheSikhSoul Inbox ready.\n• Text me a quote → quote bank\n• Send a video (normal, not as file) → b-roll\n• Send an mp3 → music library\n• /clean → remove the built-in starter quotes once yours are in");
    } else if (m.video || (m.document && (m.document.mime_type || "").startsWith("video/"))) {
      const v = m.video || m.document;
      if ((v.file_size || 0) > MAX_BYTES) {
        await reply(chat, "⚠️ Too large for me to fetch. Send it as a normal (compressed) video, not as a file.");
      } else {
        const rel = await download(v.file_id, "public/broll", `tg-${v.file_unique_id}`);
        added.videos++;
        await reply(chat, `🎞️ Added to b-roll: ${path.basename(rel)}`);
      }
    } else if (m.audio || (m.document && (m.document.mime_type || "").startsWith("audio/"))) {
      const a = m.audio || m.document;
      if ((a.file_size || 0) > MAX_BYTES) {
        await reply(chat, "⚠️ Audio too large — keep tracks under ~19MB.");
      } else {
        const rel = await download(a.file_id, "public/music", `tg-${a.file_unique_id}`);
        added.tracks++;
        await reply(chat, `🎵 Added to music: ${path.basename(rel)}`);
      }
    } else if (m.voice) {
      await reply(chat, "🎙️ Voice notes can't be used as music — send an mp3 audio file instead.");
    } else if (m.photo) {
      await reply(chat, "🖼️ Photos aren't used yet — send videos, audio, or quote text.");
    }
  } catch (err) {
    console.error("Message handling error:", err.message);
    await reply(chat, "❌ Something went wrong with that one — try again.");
  }
}

fs.writeFileSync(quotesPath, JSON.stringify(quotes, null, 2));
fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
console.log(`Inbox sync done: +${added.quotes} quotes, +${added.videos} videos, +${added.tracks} tracks (offset ${state.offset})`);
