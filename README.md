# FilmFeed 4K Bot

WhatsApp bot for requesting movies, series, anime and PC games via the FilmFeed 4K ecosystem.

## Setup

### 1. Add GitHub Secrets

In your GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**

Add each of these secrets:

| Secret | Description |
|--------|-------------|
| `GH_PAT` | GitHub Personal Access Token (needs `gist` + `workflow` scope) |
| `SESSION_VAULT_ID` | GitHub Gist ID for session storage |
| `BOT_PHONE` | WhatsApp bot phone number (international format, no `+`) |
| `TARGET_GROUP_JID` | Primary WhatsApp group JID |
| `TARGET_GROUP_JIDS` | Comma-separated list of allowed group JIDs |
| `TMDB_API_KEY` | TMDB API key |
| `TG_API_ID` | Telegram API ID |
| `TG_API_HASH` | Telegram API Hash |
| `TG_SESSION_STRING` | Telethon session string |
| `RUNNER_LIFETIME_HOURS` | Runner lifetime in hours (default: `4.5`) |

### 2. Trigger First Run

Go to **Actions tab → "FilmFeed 4K Bot Engine" → "Run workflow" → "Run workflow"**

### 3. Scan QR Code

1. Wait ~60 seconds after the workflow starts
2. Go to your `SESSION_VAULT_ID` Gist: `https://gist.github.com/<YOUR_GIST_ID>`
3. Open `latest_qr.txt` and copy the QR text
4. Or visit the QR image URL logged in the Actions output
5. Scan with WhatsApp (**Linked Devices → Link a Device**)

### 4. Session Persistence

After scanning, the session is automatically saved to the Gist vault. Subsequent runs restore from the vault — no re-scan needed.

## Command Reference

| Command | Description | Example |
|---------|-------------|---------|
| `!req <url> \| <quality> \| <token>` | Request a movie or series | `!req https://cinesubz.lk/... \| 1080p \| mytoken` |
| `!req_season <url> \| S<season> \| <quality> \| <token>` | Request a full season | `!req_season https://... \| S02 \| 720p \| mytoken` |
| `!req_game <url> \| Parts <start>-<end> \| <token>` | Request PC game parts | `!req_game https://fitgirl-repacks.site/... \| Parts 1-3 \| mytoken` |
| `!status` | Show bot status and uptime | `!status` |
| `!help` | Show command list | `!help` |

### Quality Options

| Option | Resolution |
|--------|------------|
| `480p` | Standard definition |
| `720p` | HD |
| `1080p` | Full HD |
| `4K` | Ultra HD |

## Architecture

```
GitHub Actions Runner
└── node src/index.js          (Baileys WhatsApp bot)
    ├── resolver.py            (multi-source scraper)
    ├── sinhalasub_resolver.py (SinhalaSub fallback)
    ├── fitgirl_resolver.py    (FitGirl Repacks scraper)
    ├── downloader.py          (Playwright Turnstile bypass)
    └── telegram_downloader.py (Telethon MTProto)
```

## Self-Rotating Runners

The bot auto-triggers the next workflow run on completion, ensuring continuous operation. `RUNNER_LIFETIME_HOURS` controls how long each instance runs before graceful shutdown.

The workflow is scheduled every 4 hours as a fallback via cron, and also auto-dispatches itself via the GitHub API at the end of each run using `GH_PAT`. This dual mechanism guarantees the bot stays online even if a runner exits unexpectedly.
