import fs from "node:fs";
const file = "content/history.json";
export const loadHistory = () => {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return { posts: [], usedClips: [] }; }
};
export const saveHistory = (h) => fs.writeFileSync(file, JSON.stringify(h, null, 2));
export const norm = (s) => (s || "").toLowerCase().replace(/[^\p{L}\p{N} ]/gu, "").replace(/\s+/g, " ").trim().slice(0, 40);
