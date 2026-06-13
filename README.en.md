[🇨🇳 中文](README.md) | [🇬🇧 English](README.en.md)

---

# Ariya

> Slay the Spire 2 Mod exception log collection platform · Self-hosted with Cloudflare Workers

Ariya is a lightweight log collection server designed for **Slay the Spire 2** mods. When the mod catches an in-game exception, it securely uploads the error details (stack trace, game state, runtime environment, etc.) to the Ariya server via HMAC-signed requests. Logs are stored in Cloudflare D1, making it easy for developers to review and analyze errors centrally.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Quick Deploy (Recommended)](#quick-deploy-recommended)
- [Manual Deploy](#manual-deploy)
- [API Documentation](#api-documentation)
- [Admin Panel](#admin-panel)
- [Local Development](#local-development)
- [GitHub CI/CD](#github-cicd)
- [License](#license)

---

## Architecture Overview

```
┌─────────────┐     HMAC-SHA256 Signature    ┌──────────────────┐
│  STS2 Mod   │ ────── POST / ──────────→ │  Ariya Worker    │
│  (C#)       │   X-Mod-Signature Header    │  (Cloudflare)    │
└─────────────┘                           │                  │
                                          │  ┌────────────┐  │
                                          │  │  D1 DB     │  │
                                          │  └────────────┘  │
                                          └──────────────────┘
                                                   │
                                          ┌────────┴────────┐
                                          │  Admin Panel     │
                                          │  GET /admin      │
                                          └─────────────────┘
```

- **Mod** (C#): Catch exception → serialize as JSON → HMAC-SHA256 sign → POST to Ariya
- **Server** (Cloudflare Workers): Verify signature → deduplicate → store → serve admin panel
- **Storage** (D1): SQLite-based distributed database, zero maintenance

---

## Quick Deploy (Recommended)

> Prerequisites: Node.js 18+, npm, a Cloudflare account

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd ariya

# 2. Install dependencies
npm install

# 3. Log in to Cloudflare
npx wrangler login

# 4. One-click setup (interactive wizard)
npm run setup
```

`npm run setup` will:
1. ✅ Check wrangler and Cloudflare login status
2. 🔑 Generate a 256-bit HMAC key
3. 🗄️ Create the D1 database and auto-configure
4. 🔐 Set the HMAC key as a Worker secret
5. 🗄️ Run database migrations
6. 🚀 Deploy to Cloudflare Workers

After completion, the setup script will display a configuration summary. **Keep the HMAC key safe**.

---

## Manual Deploy

If you prefer to deploy step by step, or if `npm run setup` fails:

### 1. Create the D1 database

```bash
npx wrangler d1 create ariya-sts2-mod-logs

# Copy the output database_id and write it to .env (not tracked by git)
echo D1_DATABASE_ID=your-database-id >> .env
```

The `"__D1_DATABASE_ID__"` placeholder in `wrangler.jsonc` will be replaced during deployment. In GitHub Actions, it is passed via Secrets (see CI/CD section).

### 2. Generate HMAC key and set as Secret

```bash
# Generate a 64-character hex key
npm run gen-key

# Set as Worker environment variable (production / remote)
npx wrangler secret put HMAC_SECRET_KEY
```

### 3. Initialize the database

```bash
npx wrangler d1 migrations apply DB --remote
```

### 4. Deploy

```bash
npm run deploy
```

### 5. (Optional) Configure local development

```bash
# Copy the environment variable template
cp .dev.vars.example .dev.vars

# Edit .dev.vars and fill in HMAC_SECRET_KEY
```

---

## API Documentation

### Submit a Log

```
POST /
Content-Type: application/json
X-Mod-Signature: <HMAC-SHA256 Base64 Signature>
```

**Request Body (JSON)**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mod_id` | string | Yes | Mod identifier |
| `mod_version` | string | Yes | Mod version |
| `game_version` | string | No | Game version |
| `error_message` | string | Yes | Error message |
| `stack_trace` | string | Yes | Stack trace |
| `game_state` | string | No | JSON-serialized dictionary containing current scene, room, combat state, player HP, etc. Example:<br>`{"loc.language": "zh-CN", "game.scene": "CombatRoom", "game.in_run": "true", "game.seed": "ABC123", "game.ascension": 5, "game.act": 1, "game.floor": 12, "game.room_type": "EventRoom", "game.characters": "ironclad", "combat.round": 3, "combat.enemy_count": 2, "combat.player_hp": "45/80"}` |
| `player_os` | string | No | Player operating system |
| `os_version` | string | No | OS version details |
| `created_at` | number | Yes | Unix timestamp in milliseconds |

**Signature Algorithm**:

1. Sign the request body (UTF-8 JSON string) with HMAC-SHA256
2. Base64-encode the binary signature
3. Set the result as the `X-Mod-Signature` header

**Deduplication**:

The server computes SHA-256 of `mod_id + mod_version + game_version + error_message + stack_trace` as the unique identifier (`hash`).
When the same error is submitted again, `game_state`, `player_os`, `os_version`, and `created_at` are updated, and `count` is incremented by 1.
The mod does not need to generate or send a UUID.

**Responses**:

- `200` — `{"success": true, "count": 1}` Submitted successfully. `count` indicates total occurrences (1 on first submission, incremented on duplicates)
- `401` — Missing `X-Mod-Signature` header
- `403` — HMAC signature verification failed
- `422` — Request expired (beyond `TIMEOUT` seconds)
- `405` — Request method is not POST

---

## Admin Panel

The admin panel supports two authentication methods:

### Method 1: Cloudflare Access (Recommended, no extra config)

Create an Access application for this Worker in [Cloudflare Zero Trust](https://dash.cloudflare.com).
Access authenticates the user before the request reaches the Worker. The Worker reads the `Cf-Access-Authenticated-User-Email` header to confirm the user is authenticated and displays the admin panel automatically.

### Method 2: Username + Password

```bash
# Run this command after deployment to register an admin (one-time only)
curl -X POST https://your-worker.workers.dev/admin/register-admin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'

# Then log in at /admin using those credentials
```

Passwords are stored as PBKDF2 salted hashes. A session token (HMAC-signed, 24-hour validity) is returned upon login.

### Features

- **🔑 Generate HMAC Key** — Generate a 256-bit key in the browser with one click
- **📤 Test Submission** — Send a sample log from the browser to verify the end-to-end flow
- **📋 Recent Submissions** — View the last 50 log records (including error count)

> Both methods can be enabled simultaneously. Access takes priority.

---

## Local Development

```bash
# Start local development server (default port 8787)
npm run dev

# Initialize local D1 database
npx wrangler d1 migrations apply DB --local

# Run tests
npm test
```

Local development uses keys from `.dev.vars` (not pushed to Git). Remote deployment uses keys set via `wrangler secret put`.

---

## GitHub CI/CD

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically deploys when pushing to the `main` or `master` branch.

Before using it, set up the following Secrets in your GitHub repository:

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token (requires Workers and D1 permissions) |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| `D1_DATABASE_ID` | D1 database ID (get it via `npx wrangler d1 create ariya-sts2-mod-logs`) |
| `HMAC_SECRET_KEY` | HMAC key (should differ from the one used in local `.dev.vars`) |

Get your API token: https://dash.cloudflare.com/profile/api-tokens

---

## License

[MIT](LICENSE)

---

[🇨🇳 中文](README.md) | [🇬🇧 English](README.en.md)
