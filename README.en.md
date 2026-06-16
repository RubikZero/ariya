[中文](README.md) | [English](README.en.md)

---

# Ariya

> Slay the Spire 2 Mod exception log collection platform · Self-hosted with Cloudflare Workers

Ariya is a lightweight log collection server designed for **Slay the Spire 2** mods. When the mod catches an in-game exception, it securely uploads the error details to the Ariya server via HMAC-signed requests. Logs are stored in Cloudflare D1, making it easy for developers to review and analyze errors centrally.

> The project is named after **Iwanaga Ariya**, the Stage 6 Boss of *Touhou Kinjoukyou*. She is the master of Asama Joue Zan (浅間浄穢山, "Purification Mountain"), a device that collects and processes information. As a database for collecting error logs, this project shares the same concept, hence the name.

---

## Table of Contents

- [Ariya](#ariya)
  - [Table of Contents](#table-of-contents)
  - [Architecture Overview](#architecture-overview)
  - [Quick Deploy (Recommended)](#quick-deploy-recommended)
  - [Manual Deploy](#manual-deploy)
    - [1. Create the D1 database](#1-create-the-d1-database)
    - [2. Generate HMAC key and set as Secret](#2-generate-hmac-key-and-set-as-secret)
    - [3. Initialize the database](#3-initialize-the-database)
    - [4. Deploy](#4-deploy)
    - [5. (Optional) Configure local development](#5-optional-configure-local-development)
  - [Authentication](#authentication)
    - [Method 1: Cloudflare Access (Recommended)](#method-1-cloudflare-access-recommended)
    - [Method 2: Username + Password](#method-2-username--password)
  - [Admin Panel](#admin-panel)
    - [Dashboard](#dashboard)
    - [Log Browser](#log-browser)
    - [Log Detail](#log-detail)
    - [Members (Admin only)](#members-admin-only)
    - [Profile](#profile)
    - [Registration](#registration)
  - [API Documentation](#api-documentation)
    - [Submit a Log](#submit-a-log)
  - [Local Development](#local-development)
  - [GitHub CI/CD](#github-cicd)
  - [License](#license)

---

## Architecture Overview

```
┌─────────────┐   HMAC-SHA256 Signature   ┌──────────────────────────┐
│  STS2 Mod   │ ────── POST / ──────────→ │  Ariya Worker            │
│  (C#)       │   X-Mod-Signature Header  │  (Cloudflare Workers)    │
└─────────────┘                           │                          │
                                          │  ┌────────────┐          │
                                          │  │  D1 DB     │          │
                                          │  │  · Logs    │          │
                                          │  │  · Users   │          │
                                          │  │  · Invite  │          │
                                          │  └────────────┘          │
                                          └──────────────────────────┘
                                           │         │
                              ┌────────────┘         └────────────┐
                              ▼                                  ▼
                     ┌─────────────────┐              ┌──────────────────┐
                     │  Cloudflare     │              │  Admin Panel     │
                     │  Zero Trust     │              │  · Dashboard     │
                     │  (optional)     │              │  · Log Browser   │
                     │  Auth + Groups  │              │  · Members       │
                     └─────────────────┘              │  · Profile       │
                                                      └──────────────────┘
```

- **Mod** (C#): Catch exception → serialize as JSON → HMAC-SHA256 sign → POST to Ariya
- **Server** (Cloudflare Workers): Verify signature → deduplicate → manage users → serve admin panel
- **Storage** (D1): SQLite-based distributed database for logs, users, and invite codes

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

# Edit .dev.vars, input HMAC_SECRET_KEY
```

## Authentication

### Method 1: Cloudflare Access (Recommended)

Create an Access application for this Worker in [Cloudflare Zero Trust](https://dash.cloudflare.com).
Users who authenticate via Access for the first time are auto-registered. If their email matches `OWNER_EMAIL`, they automatically become admin.

```bash
# Set team domain and owner email
npx wrangler secret put CF_ACCESS_TEAM_DOMAIN   # e.g. your-team.cloudflareaccess.com
npx wrangler secret put OWNER_EMAIL              # e.g. admin@example.com
```

### Method 2: Username + Password

```bash
# Register the first admin after deployment (one-time only)
curl -X POST https://your-worker.workers.dev/admin/register-admin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'

# Then log in at /admin using those credentials
```

Passwords are stored as PBKDF2 salted hashes. Session tokens (HMAC-signed, 24-hour validity) are used for subsequent requests.

> Both methods can be enabled simultaneously. Access takes priority.

---

## Admin Panel

Navigation in the sidebar varies by role:

| Page | Route | Access |
|------|-------|--------|
| Dashboard | `/admin` | Admin only |
| Log Browser | `/admin/browse` | All users |
| Members | `/admin/users` | Admin only |
| Profile | `/admin/profile` | All users |

### Dashboard

- **🔑 Generate HMAC Key** — Generate a 256-bit key in the browser with one click
- **📤 Test Submission** — Send a sample log from the browser to verify the end-to-end flow
- **📋 Recent Submissions** — View the last 50 logs on the dashboard

### Log Browser

Uses **AG Grid** with server-side pagination. Displays all log fields. Supports:

- **Column resizing** — Drag column edges to adjust width
- **Sorting** — Click column headers
- **Server-side pagination** — Only the current page is fetched
- **Detail navigation** — Click any row to view details

### Log Detail

- **Basic Info** — Time, mod, error message, version, error count, OS, hash
- **Error Details** — Full stack trace, first line highlighted in red
- **Game State** — JSON automatically parsed into a readable table

### Members (Admin only)

- **Member list** — Username, nickname, role, last active
- **Role switching** — Toggle between admin and member
- **Invite codes** — Generate codes with expiration
- **Remove member** — Confirmation-based deletion
- **Transfer ownership** — Give admin rights to another user

### Profile

- **Edit nickname** — Change display name
- **Change password** — Requires current password

### Registration

Visit `/register` to register with an invite code (generated by an admin).

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
| `game_state` | string | No | JSON-serialized game state dictionary |
| `player_os` | string | No | Player OS |
| `os_version` | string | No | OS version |
| `created_at` | number | Yes | Unix timestamp in milliseconds |

**Signature Algorithm**:

1. Sign the request body (UTF-8 JSON) with HMAC-SHA256
2. Base64-encode the signature
3. Set as `X-Mod-Signature` header

**Deduplication**:

The server computes SHA-256 of `mod_id + mod_version + game_version + error_message + stack_trace` as the unique identifier (`hash`).
Duplicates update game state and increment count.

**Responses**:

- `200` — `{"success": true, "count": N}` Submitted successfully
- `401` — Missing `X-Mod-Signature`
- `403` — Invalid HMAC signature
- `422` — Request expired
- `405` — Method not POST

---

## Local Development

```bash
# Start local dev server (default port 8787)
npm run dev

# Initialize local D1 database
npx wrangler d1 migrations apply DB --local

# Run tests
npm test
```

Local development uses `.dev.vars` (not pushed to Git). Remote uses `wrangler secret put`.

---

## GitHub CI/CD

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that deploys on push to `main`.
Documentation-only changes (README, LICENSE, etc.) do not trigger deployment.

Required Secrets:

| Secret | Required | Description |
|--------|----------|-------------|
| `CLOUDFLARE_API_TOKEN` | ✅ | Cloudflare API token |
| `CLOUDFLARE_ACCOUNT_ID` | ✅ | Cloudflare account ID |
| `D1_DATABASE_ID` | ✅ | D1 database ID |
| `HMAC_SECRET_KEY` | ✅ | HMAC secret key |
| `CF_ACCESS_TEAM_DOMAIN` | Optional | Cloudflare Access team domain |
| `OWNER_EMAIL` | Optional | Owner email for auto admin on first Access login |

Get API token: https://dash.cloudflare.com/profile/api-tokens

---

## License

[MIT](LICENSE)

---

[中文](README.md) | [English](README.en.md)
