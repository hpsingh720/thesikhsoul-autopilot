// Fresh, relevant stock footage from Pexels (free key). Every clip is used once only.
import fs from "node:fs";
import path from "node:path";

const KEY = process.env.PEXELS_API_KEY;
export const pexelsOn = () => Boolean(KEY);

const FALLBACK = ["sunrise sky clouds", "rain drops window", "candle flame dark", "river flowing calm", "wheat field wind", "night stars sky"];

export const fetchFreshClips = async (queries, usedIds, want = 3) => {
  if (!KEY) return [];
  const qs = [...(queries || []), ...FALLBACK].slice(0, 6);
  const got = [];
  for (const q of qs) {
    if (got.length >= want) break;
    try {
      const res = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&orientation=portrait&size=medium&per_page=20`,
        { headers: { Authorization: KEY } }
      );
      const json = await res.json();
      for (const v of json.videos || []) {
        if (got.length >= want) break;
        const id = `px-${v.id}`;
        if (usedIds.has(id) || got.some((g) => g.id === id)) continue;
        if ((v.duration || 0) < 5) continue;
        const files = (v.video_files || [])
          .filter((f) => f.file_type === "video/mp4" && f.height >= f.width && f.height <= 1920)
          .sort((a, b) => b.height - a.height);
        const f = files[0];
        if (!f) continue;
        const dl = await fetch(f.link);
        if (!dl.ok) continue;
        const buf = Buffer.from(await dl.arrayBuffer());
        if (buf.length > 40_000_000) continue;
        const rel = `broll/${id}.mp4`;
        fs.writeFileSync(path.join(process.cwd(), "public", rel), buf);
        got.push({ id, rel, query: q });
      }
    } catch (e) {
      console.log("Pexels search failed for", q, e.message);
    }
  }
  return got;
};
