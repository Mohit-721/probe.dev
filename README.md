# probe.dev

> **Your API is lying. We prove it.**

A 200 OK doesn't mean it works. Probe runs stateful, multi-step API checks with schema validation, security scanning, and AI-powered diagnostic insights — so you catch failures before your users do.

![Probe Dashboard](https://probe-dev.vercel.app/og.png)

**Live demo → [probe-dev.vercel.app](https://probe-dev.vercel.app)**

---

## ✦ Features

| | |
|---|---|
| 🔁 **Scheduled Monitors** | Run HTTP checks every minute, 5 min, 15 min, hourly, or daily |
| ✅ **Smart Assertions** | Assert status code, max response time, headers, and JSON body fields |
| 🤖 **AI Insights** | Ask your SRE assistant anything — powered by any OpenAI-compatible model (NVIDIA NIM, OpenRouter, OpenAI) |
| 📊 **Live Dashboard** | Real-time latency charts, uptime rings, and run history — auto-refreshes every 15s |
| 🌐 **Public Status Pages** | Share a beautiful, live status page with users. No login required |
| 🚨 **Incident Tracking** | Auto-opens incidents on failure, auto-resolves on recovery |
| 🔐 **SSRF Protection** | Every outbound request is validated against private IP ranges before execution |
| ✏️ **Editable Monitors** | Change schedule, URL, headers, and assertions on existing monitors |
| 🔒 **Row-Level Security** | Postgres RLS ensures users can only ever see their own data |

---

## 🖥 Screenshots

<details>
<summary>Dashboard</summary>

The monitor detail view with live latency chart, activity strip, and run history.

</details>

<details>
<summary>AI Insights</summary>

Ask anything about your monitors. The AI has full context of your runs, incidents, and assertion failures.

</details>

<details>
<summary>Public Status Page</summary>

A shareable, real-time status page with uptime ring, probe strip, and incident history.

</details>

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, Server Actions) |
| **Database** | [Supabase](https://supabase.com) (Postgres + Auth + RLS) |
| **Cache / Rate limits** | [Upstash Redis](https://upstash.com) |
| **AI** | [Vercel AI SDK](https://sdk.vercel.ai) + any OpenAI-compatible endpoint |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Animations** | GSAP |
| **Deployment** | [Vercel](https://vercel.com) |

---

## 🚀 Self-Hosting in 5 Minutes

### 1. Clone the repo

```bash
git clone https://github.com/Mohit-721/probe.dev.git
cd probe.dev
pnpm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema files in order:
   ```
   scripts/001_create_probe_schema.sql
   scripts/002_rls_policies.sql
   scripts/003_public_status.sql
   ```
3. Go to **Authentication → URL Configuration** and set:
   - **Site URL:** `http://localhost:3000` (or your Vercel URL)
   - **Redirect URLs:** `http://localhost:3000/auth/callback`

### 3. Set up Upstash Redis

1. Create a free database at [upstash.com](https://upstash.com)
2. Copy the REST URL and token

### 4. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cron security (generate with: openssl rand -hex 24)
CRON_SECRET=your-secure-random-string

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# AI — works with any OpenAI-compatible endpoint
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_API_KEY=sk-or-v1-your-key
OPENAI_MODEL_NAME=meta-llama/llama-3.1-70b-instruct
```

**Supported AI providers (no code changes needed, just swap env vars):**

| Provider | `OPENAI_BASE_URL` | `OPENAI_MODEL_NAME` |
|---|---|---|
| OpenRouter | `https://openrouter.ai/api/v1` | `meta-llama/llama-3.1-70b-instruct` |
| NVIDIA NIM | `https://integrate.api.nvidia.com/v1` | `meta/llama-3.1-70b-instruct` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o` |
| Groq | `https://api.groq.com/openai/v1` | `llama-3.1-70b-versatile` |

### 5. Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## ⚙️ Deploying to Vercel

### One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Mohit-721/probe.dev)

### Manual deploy

1. Push your fork to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.local` to your Vercel project settings
4. Add a **Vercel Cron Job** (or use [cron-job.org](https://cron-job.org) for free):
   - **URL:** `https://your-app.vercel.app/api/cron`
   - **Schedule:** `* * * * *` (every minute)
   - **Header:** `Authorization: Bearer YOUR_CRON_SECRET`

> **Note:** Vercel Hobby plan limits cron jobs to 2 executions/day. Use [cron-job.org](https://cron-job.org) as a free external trigger to run every minute.

---

## 🔑 How the Cron Works

```
cron-job.org (every 1 min)
    │
    ▼
POST /api/cron  ← Authorization: Bearer CRON_SECRET
    │
    ▼
Fetch all enabled monitors where next_run_at <= now()
    │
    ▼
For each monitor → executeStep() → evaluate assertions
    │
    ├── Insert run record
    ├── Update monitor.last_status, next_run_at
    ├── Open incident if failed (and none already open)
    └── Resolve incident if recovered
```

---

## 🔐 Security

- **SSRF Protection:** All outbound HTTP requests are DNS-resolved first. Any URL resolving to a private/loopback/link-local IP (`10.x`, `172.16-31.x`, `192.168.x`, `169.254.x`, `::1`, etc.) is rejected before the connection is made.
- **Row-Level Security:** Every Supabase table has RLS enabled. Users can only query their own rows — even if they bypass the app layer.
- **Auth headers are server-only:** API keys stored in monitors are never sent to the browser. All probe execution happens server-side.
- **Public status pages** strip all sensitive config (headers, auth tokens) before rendering.
- **Rate limiting:** Manual runs are capped at 30/minute per user. AI queries are capped at 20/hour per user.

---

## 📁 Project Structure

```
app/
├── api/
│   ├── cron/          # Scheduled probe runner
│   ├── insights/      # AI chat endpoint (streaming)
│   ├── monitors/[id]/ # Live dashboard data API
│   └── status/[token] # Public status data API
├── auth/              # Login / signup / callback
├── dashboard/         # Private dashboard pages
│   ├── monitors/      # Monitor list + create + detail
│   ├── runs/          # Run history
│   ├── incidents/     # Incident log
│   └── insights/      # AI chat UI
└── status/[token]/    # Public status page

components/
├── dashboard/         # All private dashboard components
└── status/            # Public status board

lib/
├── runner.ts          # Core probe execution engine
├── safe-fetch.ts      # SSRF-safe HTTP client
├── redis.ts           # Upstash Redis singleton
├── cron.ts            # Cron schedule helpers
└── types.ts           # Shared TypeScript types
```

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

```bash
# Fork → clone → create a branch
git checkout -b feat/your-feature

# Make changes, then
git commit -m "feat: your feature description"
git push origin feat/your-feature
# Open a PR
```

---

## 📄 License

MIT — see [LICENSE](./LICENSE) for details.

---

<p align="center">
  Built with ♥ · <a href="https://probe-dev.vercel.app">Live Demo</a> · <a href="https://github.com/Mohit-721/probe.dev/issues">Report a Bug</a>
</p>
