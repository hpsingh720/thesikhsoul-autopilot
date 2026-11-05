// Today's Hukamnama from Sri Darbar Sahib, via BaniDB. Gurbani is shown exactly as given.
const URL = "https://api.banidb.com/v2/hukamnamas/today";
const isGurmukhi = (s) => typeof s === "string" && /[਀-੿]/.test(s) && !/[A-Za-z]/.test(s);
const isEnglish = (s) => typeof s === "string" && /^[\x20-\x7E‘-”]+$/.test(s) && s.split(" ").length > 3;

// BaniDB's shape has changed over versions, so search the response for line objects
// that carry Gurmukhi unicode plus an English translation.
export const extractLines = (json) => {
  const lines = [];
  const walk = (o) => {
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o)) { o.forEach(walk); return; }
    const pa = o?.gurmukhi?.unicode ?? o?.verse?.unicode ?? o?.unicode;
    if (isGurmukhi(pa)) {
      const t = o.translation || o.line?.translation || {};
      const en = t?.english?.default ?? t?.en?.bdb ?? t?.en?.ms ?? t?.en?.ssk ?? null;
      lines.push({ pa: pa.trim(), en: isEnglish(en) ? en.trim() : null });
      return;
    }
    Object.values(o).forEach(walk);
  };
  walk(json);
  const seen = new Set();
  return lines.filter((l) => (seen.has(l.pa) ? false : seen.add(l.pa)));
};

export const pickRahao = (lines) => {
  if (!lines.length) return null;
  let i = lines.findIndex((l) => l.pa.includes("ਰਹਾਉ"));
  if (i < 0) i = 0;
  const chosen = i > 0 ? [lines[i - 1], lines[i]] : [lines[i]];
  return {
    pa: chosen.map((l) => l.pa).join("\n"),
    en: chosen.map((l) => l.en).filter(Boolean).join(" "),
  };
};

export const todaysHukamnama = async () => {
  try {
    const res = await fetch(URL, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const json = await res.json();
    const lines = extractLines(json);
    const pick = pickRahao(lines);
    if (!pick) return null;
    const ang = JSON.stringify(json).match(/"ang"\s*:\s*(\d+)/)?.[1] || null;
    return { ...pick, ang };
  } catch (e) {
    console.log("Hukamnama fetch failed:", e.message);
    return null;
  }
};
