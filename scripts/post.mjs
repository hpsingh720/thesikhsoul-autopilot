// Publishes the rendered reel to Instagram via the official Graph API.
// Needs env: IG_USER_ID, IG_ACCESS_TOKEN, VIDEO_URL. Optional: DRY_RUN=true.
import fs from "node:fs";

const { IG_USER_ID, IG_ACCESS_TOKEN, VIDEO_URL, DRY_RUN } = process.env;
const G = "https://graph.instagram.com/v23.0";

const plan = JSON.parse(fs.readFileSync("out/plan.json", "utf8"));
const caption = plan.caption ?? "";

if (String(DRY_RUN).toLowerCase() === "true") {
  console.log("DRY_RUN=true → skipping Instagram post.");
  console.log("Would post:", VIDEO_URL);
  console.log("Caption:\n" + caption);
  process.exit(0);
}

if (!IG_USER_ID || !IG_ACCESS_TOKEN || !VIDEO_URL) {
  console.error("Missing IG_USER_ID, IG_ACCESS_TOKEN or VIDEO_URL.");
  process.exit(1);
}

const api = async (url, params) => {
  const body = new URLSearchParams({ ...params, access_token: IG_ACCESS_TOKEN });
  const res = await fetch(url, { method: "POST", body });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(`API error at ${url}: ${JSON.stringify(json)}`);
  }
  return json;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  console.log("Creating media container…");
  const container = await api(`${G}/${IG_USER_ID}/media`, {
    media_type: "REELS",
    video_url: VIDEO_URL,
    caption,
  });
  const id = container.id;
  console.log("Container:", id);

  let status = "IN_PROGRESS";
  for (let i = 0; i < 36 && status !== "FINISHED"; i++) {
    await sleep(10_000);
    const res = await fetch(
      `${G}/${id}?fields=status_code&access_token=${IG_ACCESS_TOKEN}`
    );
    const json = await res.json();
    status = json.status_code ?? "UNKNOWN";
    console.log(`Processing… (${i + 1}) status=${status}`);
    if (status === "ERROR") {
      throw new Error("Instagram could not process the video: " + JSON.stringify(json));
    }
  }
  if (status !== "FINISHED") throw new Error("Timed out waiting for processing.");

  console.log("Publishing…");
  const pub = await api(`${G}/${IG_USER_ID}/media_publish`, { creation_id: id });
  console.log("✅ Posted! Media ID:", pub.id);
} catch (err) {
  console.error("❌ Posting failed:", err.message);
  process.exit(1);
}
