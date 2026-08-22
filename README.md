# TheSikhSoul Autopilot 🙏

A robot that runs in the cloud (GitHub Actions) and every morning at **6:00 AM India time**:

1. Checks the **Nanakshahi calendar** (gurpurab? shahidi diwas? sangrand?)
2. Renders an original branded reel (your quote / occasion greeting, your b-roll or a generated background, your music)
3. Publishes it to Instagram through Meta's **official API**

No computer needed. Your phone/iPad can be off. Everything is free.

---

## Step 1 — Put this project on GitHub (iPad-friendly)

1. Go to **github.com** → log in → tap **+** → **New repository**
2. Name: `thesikhsoul-autopilot` → set to **Public** (required — Instagram must be able to fetch the video file) → **Create repository**
3. Tap **uploading an existing file** → choose **thesikhsoul-autopilot.zip** from your Files app → **Commit changes**
4. Tap **Add file → Create new file**. In the name box type exactly:
   `.github/workflows/setup.yml`
   Paste this inside, then **Commit changes**:

```yaml
name: Setup
on: workflow_dispatch
permissions:
  contents: write
jobs:
  unpack:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          unzip -o thesikhsoul-autopilot.zip
          rm thesikhsoul-autopilot.zip
          git config user.name "setup-bot"
          git config user.email "actions@users.noreply.github.com"
          git add -A
          git commit -m "Unpack project"
          git push
```

5. Go to the **Actions** tab → **Setup** → **Run workflow** → Run. Wait for the green tick — the whole project is now in your repo.
6. **Activate the robot (2 renames).** GitHub only lets *you* (not the setup robot) install workflow files, so:
   - Open the folder `workflows-install` → tap `daily-post.yml` → tap the **pencil** → at the top, edit the file path to exactly `.github/workflows/daily-post.yml` (delete `workflows-install/`, type the new path) → **Commit changes**
   - Repeat for `refresh-token.yml` → path `.github/workflows/refresh-token.yml` → Commit

## Step 2 — Get your Instagram token (the only fiddly part)

You need two values: **IG_USER_ID** and **IG_ACCESS_TOKEN**.

1. In Safari go to **developers.facebook.com** → log in with the Facebook account linked to you → **Get Started** → create a developer account
2. **My Apps → Create App** → choose the **Instagram** use case (sometimes shown as "Instagram API") → app type **Business** → any name (e.g. `sikhsoul-bot`) → Create
3. In the left menu open **Instagram → API setup with Instagram login**
4. Tap **Add account** and log in as **thesikhsoul** (must be a Professional account — yours already is)
5. Tap **Generate token** next to the account → approve the permissions (`instagram_business_basic`, `instagram_business_content_publish`) → **copy the long token**
6. On the same screen your **Instagram account ID** (a long number) is shown — copy it too

Meta's screens change often. If anything looks different, **screenshot it and send it to Claude** — you'll be navigated through.

## Step 3 — Give the robot its keys

In your repo: **Settings → Secrets and variables → Actions → New repository secret**

- Name: `IG_ACCESS_TOKEN` → paste the long token → Add secret
- Name: `IG_USER_ID` → paste the number → Add secret

Secrets are a locked vault. They are never visible in the code or to anyone.

## Step 4 — Test without posting

**Actions → Daily Post → Run workflow** → set `dry_run` = `true` → Run.

- Green tick = video rendered fine. The finished reel is saved in the `videos/` folder in the repo — open it and watch it.
- Red X = open the failed step, screenshot the log, send to Claude.

## Step 5 — First real post

Run the workflow again with `dry_run` = `false`. In ~3-5 minutes the reel appears on @thesikhsoul. After that, **you do nothing** — it posts daily at 6 AM IST on its own.

To pause the robot anytime: **Settings → Secrets and variables → Actions → Variables → New variable** → `DRY_RUN` = `true`. Delete it to resume.

## Step 6 — Feed it your content (all from iPad, via GitHub website)

- **Your quotes** (most important): open `content/quotes.json` → pencil icon → add lines in the same format → Commit. The robot rotates through them.
- **Your b-roll**: open the `public/broll` folder → Add file → Upload files → your own Gurdwara/nature clips (.mp4, vertical, 10s+). No b-roll = generated background (also fine).
- **Music**: download 2-5 free instrumentals from **pixabay.com/music** → upload into `public/music`. Never upload ripped kirtan recordings — copyright detection can mute reels.

## Step 7 — Token lifetime (read once)

The Instagram token lives 60 days. A weekly workflow refreshes it automatically **if** you add one more secret:

1. GitHub → your profile **Settings → Developer settings → Fine-grained personal access tokens → Generate new token** → Repository access: only `thesikhsoul-autopilot` → Permissions: **Secrets: Read and write** → Generate → copy
2. Add it as repo secret `GH_PAT`

If you skip this, everything still works — you'll just repeat Step 2's token copy every ~2 months.

## What posts when

| Day | What goes out |
|---|---|
| Gurpurab / Parkash Purab / Gurgaddi | Occasion reel + "Lakh Lakh Vadhaiyan" caption |
| Shahidi diwas / Jotti Jot | Tribute reel + "Kot Kot Parnaam" (never "congratulations" — handled automatically) |
| Sangrand | New-month reel with the Nanakshahi month name |
| Every other day | One quote from your bank |

## Customising

- Colors/handle: `src/theme.ts`
- Quote template: `src/QuoteReel.tsx` · Occasion template: `src/GurpurabReel.tsx`
- Posting time: `.github/workflows/daily-post.yml` → the cron line (`30 0` UTC = 6:00 IST)

Built with Remotion, the `nanakshahi` calendar library, and the Instagram Graph API. When stuck: screenshot → Claude.
