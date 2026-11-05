// Sends a message to Manpreet's Telegram chat (the chat that last talked to the bot).
import fs from "node:fs";
export const notify = async (text) => {
  const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!TOKEN) return;
  let chat = process.env.TELEGRAM_CHAT_ID;
  if (!chat) {
    try { chat = JSON.parse(fs.readFileSync("content/telegram_state.json", "utf8")).chatId; } catch {}
  }
  if (!chat) return;
  try {
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text }),
    });
  } catch {}
};
