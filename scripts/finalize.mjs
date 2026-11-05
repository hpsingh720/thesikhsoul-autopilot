// After a successful render: record the post and retire every clip it used (deleted for good).
import fs from "node:fs";
import path from "node:path";
import { loadHistory, saveHistory } from "./history.mjs";
const plan = JSON.parse(fs.readFileSync("out/plan.json", "utf8"));
const h = loadHistory();
for (const rel of plan.clips || []) {
  const id = path.basename(rel, path.extname(rel));
  if (!h.usedClips.includes(id)) h.usedClips.push(id);
  try { fs.unlinkSync(path.join("public", rel)); } catch {}
}
h.posts.push({ date: plan.date, forDate: plan.forDate, file: plan.filename, kind: plan.kind, quote: plan.quote || null, music: plan.props.music || null, clips: plan.clips || [], style: plan.props.textStyle || null });
saveHistory(h);
console.log(`Recorded ${plan.kind}. Retired ${plan.clips?.length || 0} clip(s).`);
