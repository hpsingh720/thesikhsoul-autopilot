// Draft mode: sends the finished reel to Manpreet's Telegram as a FILE (no compression),
// plus the caption as its own message so it can be copied in one tap.
import fs from "node:fs";
import path from "node:path";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const file = process.argv[2];
const plan = JSON.parse(fs.readFileSync("out/plan.json", "utf8"));
let chat = process.env.TELEGRAM_CHAT_ID;
if (!chat) { try { chat = JSON.parse(fs.readFileSync("content/telegram_state.json", "utf8")).chatId; } catch {} }
if (!TOKEN || !chat) { console.error("No Telegram bot/chat yet — send /start to the bot first."); process.exit(1); }

const api = `https://api.telegram.org/bot${TOKEN}`;
const when = plan.forDate && plan.forDate !== plan.date ? `for TOMORROW (${plan.forDate})` : "for today";
const head = `🎬 New reel ${when} — ${plan.kind}\nSave the file, post it in Instagram, add a trending sound.\nTip: in the Instagram editor, turn "Original audio" down if you use a trending sound.`;

const size = fs.statSync(file).size;
if (size > 49_000_000) {
  await fetch(`${api}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text: `${head}\n\nThe file is too big for Telegram (${Math.round(size / 1e6)} MB). Download it from GitHub: https://github.com/${process.env.GITHUB_REPOSITORY}/raw/main/${file}` }) });
} else {
  const form = new FormData();
  form.append("chat_id", String(chat));
  form.append("caption", head);
  form.append("document", new Blob([fs.readFileSync(file)], { type: "video/mp4" }), path.basename(file));
  const r = await fetch(`${api}/sendDocument`, { method: "POST", body: form });
  const j = await r.json();
  if (!j.ok) { console.error("Telegram send failed:", JSON.stringify(j)); process.exit(1); }
}
await fetch(`${api}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ chat_id: chat, text: plan.caption.slice(0, 4000) }) });
console.log("✅ Draft sent to Telegram:", path.basename(file), Math.round(size / 1e5) / 10, "MB");
