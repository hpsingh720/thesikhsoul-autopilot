// Refreshes the long-lived Instagram token (valid 60 days). Prints ONLY the new token.
const t = process.env.IG_ACCESS_TOKEN;
if (!t) { console.error("No IG_ACCESS_TOKEN"); process.exit(1); }
const res = await fetch(
  `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${t}`
);
const json = await res.json();
if (!json.access_token) { console.error("Refresh failed: " + JSON.stringify(json)); process.exit(1); }
process.stdout.write(json.access_token);
