// Optional AI brain (Claude). Works only if the ANTHROPIC_API_KEY secret exists.
// Rules baked in: never writes or changes Gurbani, never invents history.
const KEY = process.env.ANTHROPIC_API_KEY;
const GKEY = process.env.GEMINI_API_KEY;
export const aiOn = () => Boolean(GKEY || KEY);

const SYSTEM = `You help run @TheSikhSoul, a Sikh devotional Instagram page.
Rules you never break:
- Never write, alter, paraphrase-as-scripture, or invent Gurbani. Never invent historical facts or dates.
- Never suggest images of the Sikh Gurus.
- Tone: humble, warm, sincere. No hype words, no emojis spam (max 2).
Reply with JSON only, no prose.`;

const parse = (text) => { const m = (text || "").match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; };

const askGemini = async (prompt, maxTokens) => {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GKEY}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, responseMimeType: "application/json" },
    }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return parse(json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "");
};

export const ask = async (prompt, maxTokens = 600) => {
  if (GKEY) {
    try { return await askGemini(prompt, Math.max(maxTokens, 800)); }
    catch (e) { console.log("Gemini call failed (continuing without AI):", e.message); if (!KEY) return null; }
  }
  if (!KEY) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "claude-haiku-5-5",
        max_tokens: maxTokens,
        system: SYSTEM,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const json = await res.json();
    const text = json?.content?.[0]?.text || "";
    const m = text.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  } catch (e) {
    console.log("AI call failed (continuing without AI):", e.message);
    return null;
  }
};

// Picks stock-footage search words that fit the quote's mood.
export const footageWords = async (text) => {
  const r = await ask(
    `A reel will show this line as text: "${text}"
Give 3 short English search phrases for calm vertical stock footage that fits its mood.
Allowed: nature, sky, light, rain, rivers, fields, candles/diya flames, hands, silhouettes, roads at dawn.
Not allowed: any religious building, any people's faces in close-up, any religious figures.
JSON: {"queries":["...","...","..."]}`, 200);
  return Array.isArray(r?.queries) ? r.queries.slice(0, 3) : null;
};

// Writes a caption around the post. Gurbani/quote text is passed in and kept as-is.
export const caption = async (kind, body, extra = "") => {
  const r = await ask(
    `Write an Instagram caption for a ${kind} reel. The on-screen text is:
"""${body}"""
${extra}
Give: a 1-line hook (max 12 words) that makes people stop, then 1-2 sincere lines of reflection,
then a soft call to share it with someone who needs it. Mix English with a little Punjabi only if natural.
JSON: {"caption":"..."}`, 400);
  return typeof r?.caption === "string" ? r.caption.trim() : null;
};

// Drafts new quote ideas in the page's own voice, from its existing quotes.
export const quoteIdeas = async (examples) => {
  const r = await ask(
    `Here are quotes this page owner wrote himself:
${examples.map((q) => "- " + q).join("\n")}
Write 6 NEW short quotes in the same voice (some English, some Punjabi Gurmukhi, some 2-line).
They must be original reflections, not Gurbani, not quotes from famous people.
JSON: {"ideas":["...", "..."]}`, 900);
  return Array.isArray(r?.ideas) ? r.ideas.slice(0, 6) : null;
};
