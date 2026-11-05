// Weekly: pulls real view counts for each posted reel, saves them (the planner learns
// which formats work), and sends Manpreet a plain report on Telegram.
import { loadHistory, saveHistory } from "./history.mjs";
import { notify } from "./notify.mjs";
const { IG_ACCESS_TOKEN } = process.env;
const G = "https://graph.instagram.com/v23.0";
const h = loadHistory();
const getViews = async (id) => {
  for (const metric of ["views", "plays", "reach"]) {
    try {
      const r = await fetch(`${G}/${id}/insights?metric=${metric}&access_token=${IG_ACCESS_TOKEN}`);
      const j = await r.json();
      const v = j?.data?.[0]?.values?.[0]?.value ?? j?.data?.[0]?.total_value?.value;
      if (typeof v === "number") return v;
    } catch {}
  }
  return null;
};
for (const p of h.posts.slice(-40)) if (p.mediaId) { const v = await getViews(p.mediaId); if (v !== null) p.views = v; }
saveHistory(h);
const week = h.posts.filter((p) => typeof p.views === "number" && Date.now() - new Date(p.date).getTime() < 8 * 864e5);
const byKind = {};
week.forEach((p) => (byKind[p.kind] ||= []).push(p.views));
const lines = Object.entries(byKind).map(([k, v]) => `${k}: avg ${Math.round(v.reduce((a, b) => a + b, 0) / v.length)} views (${v.length} posts)`);
const best = [...week].sort((a, b) => b.views - a.views)[0];
await notify(week.length
  ? `📈 Weekly report\n${lines.join("\n")}\n\nBest: ${best.kind} on ${best.date} — ${best.views} views${best.quote ? `\n"${best.quote.slice(0, 80)}"` : ""}\n\nI now show more of what works.`
  : "📈 Weekly report: no view data yet (needs a few days of new posts).");
console.log(lines.join("\n") || "no data");
