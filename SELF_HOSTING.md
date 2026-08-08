# Self-Hosting AiXin in Mainland China

A complete runbook for running the entire AiXin stack — web app, database + auth, LLM, and receipt anchoring — on infrastructure you control: Alibaba Cloud ECS, a local Ubuntu server, or a Windows 11 machine.

Everything here is chosen so that **no component depends on a service that is blocked or unreliable from inside mainland China**.

**Looking for the exact, ordered, step-by-step install?** Use
[`DEPLOY_RUNBOOK.md`](./DEPLOY_RUNBOOK.md) — a beginner-friendly runbook with every command for
Ubuntu 24.04 (Alibaba Cloud ECS, NVIDIA GPU) and Windows 11, with checkpoints after each step.
This file is the reference: architecture, blocked-service swaps, manual (non-Docker) routes, and
the full environment-variable table.

If Alibaba Cloud is currently too slow or disconnecting, start with **Part R** of
[`DEPLOY_RUNBOOK.md`](./DEPLOY_RUNBOOK.md). It provides a beginner, checkpoint-by-checkpoint RunPod
GPU Pod route for the web app plus private Qwen while retaining the existing managed backend. Treat
that as an interim development/demo environment until mainland-China connectivity is measured.

If you have never used a terminal, Git, or Docker before, **start with §0.0 below** — it installs
and explains every tool from zero. If your tools are already installed, skip to
**§0 One-click Docker setup**.


---

## 0.0 Absolute beginner setup — install and understand your tools

This section assumes **nothing**. Work through it top to bottom once per machine. Everything after
it assumes these tools exist.

### 0.0.1 Words you will see, in plain English

| Term | What it actually means |
| --- | --- |
| Terminal / shell | A window where you type commands instead of clicking. On Ubuntu it is the black window; on Windows it is PowerShell. |
| `$` at the start of a line | "Type this in a Linux/Ubuntu terminal." Do **not** type the `$`. |
| `PS>` at the start of a line | "Type this in Windows PowerShell." Do **not** type the `PS>`. |
| `sudo` | "Run this command as administrator." It will ask for your password; typing shows nothing — that is normal. |
| SSH | A way to get a terminal on a remote server (your Alibaba Cloud machine) from your own computer. |
| Repository (repo) | A folder of source code tracked by Git. AiXin has two: `aixin-twin` (the app) and `aixin-protocol` (the spec/docs). |
| Clone | Download a copy of a repo, with its history, onto this machine. |
| Build | Turn the human-readable source code into the optimised files a server actually runs. |
| Container / Docker image | A pre-packed box holding a program plus everything it needs, so it runs the same on every machine. |
| Compose | A file listing several containers (app, database, proxy, LLM) so one command starts them all. |
| Environment variable | A named setting read at start-up, e.g. a password or a URL. Ours live in `docker/.env`. |
| Migration | A `.sql` file that creates or changes database tables. |

Two habits that save hours:

1. **Copy commands one block at a time** and read the output before continuing.
2. If a command prints an error, stop. Do not run the next one. Search the exact error text in the
   troubleshooting table in §10 or in `DEPLOY_RUNBOOK.md`.

### 0.0.2 Get a terminal on the machine you are installing on

**Ubuntu server (Alibaba Cloud ECS) — from Windows:**

```powershell
# In PowerShell on your laptop. Replace with your server's public IP.
ssh root@<ecs-public-ip>
# type "yes" the first time, then your server password
```

**Ubuntu server — from macOS/Linux:** same `ssh root@<ecs-public-ip>` in Terminal.

**Ubuntu desktop:** press `Ctrl` + `Alt` + `T`.

**Windows 11:** press the Start key, type `PowerShell`, right-click **Windows PowerShell** →
**Run as administrator**.

Check you are where you think you are:

```bash
whoami      # who you are logged in as
hostname    # which machine you are on
pwd         # which folder you are in
```

### 0.0.3 Install Git — Ubuntu

```bash
sudo apt-get update
sudo apt-get install -y git
git --version                      # expect: git version 2.4x.x
```

### 0.0.4 Install Git — Windows 11

Option A (recommended, one command in an **administrator** PowerShell):

```powershell
winget install --id Git.Git -e --source winget
```

Option B (manual): open `https://git-scm.com/download/win`, download the 64-bit installer, run it,
and click **Next** through every screen — the defaults are correct.

Then **close and reopen PowerShell** (installers only change the PATH for new windows) and verify:

```powershell
git --version
```

### 0.0.5 Configure Git once, on every machine

```bash
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main
git config --global pull.rebase false
# Windows only — keeps our shell scripts working:
git config --global core.autocrlf input
```

`user.name` / `user.email` only label the commits you make; any values work.

### 0.0.6 The only 8 Git commands you need

| Goal | Command |
| --- | --- |
| Download the code the first time | `git clone https://github.com/aixin-protocol/aixin-twin.git aixin` |
| Enter the folder | `cd aixin` |
| Get the latest code from GitHub | `git pull --ff-only` |
| See which files you changed | `git status` |
| See the last 5 commits | `git log --oneline -5` |
| Stage your changes | `git add -A` |
| Save them locally with a message | `git commit -m "what I changed"` |
| Upload them to GitHub | `git push` |

Rules of thumb for this project: **the servers only ever `git pull`.** You edit code in your
development environment, push from there, and on the Ubuntu/Windows boxes you only ever pull and
redeploy. That way a server never has local changes that block a pull.

If `git pull` ever refuses because of local edits you do not care about:

```bash
git status                  # look at what would be lost
git checkout -- .           # discard local edits to tracked files
git pull --ff-only
```

If GitHub is slow or blocked from mainland China, mirror the repo to `gitee.com` once through
Gitee's "import repository" feature and clone that URL instead — every other command is identical.

### 0.0.7 Install Docker — Ubuntu

Docker runs the app, database, proxy, and local LLM as containers, so you do not install Node,
Postgres, or Nginx by hand.

```bash
# 1. tools Docker's repo needs
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# 2. add Docker's signing key (Alibaba mirror — fast inside China)
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 3. add the repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 4. install engine + compose plugin
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

# 5. start it now and on every boot
sudo systemctl enable --now docker
```

Verify — both lines must succeed:

```bash
sudo docker run --rm hello-world     # prints "Hello from Docker!"
docker compose version               # prints v2.x
```

Optional, so you can drop `sudo`:

```bash
sudo usermod -aG docker $USER
newgrp docker          # or log out and back in
docker run --rm hello-world
```

If the image download hangs, Docker Hub is being blocked — add China registry mirrors
(§6.2) and run `sudo systemctl restart docker`, then retry.

### 0.0.8 Install Docker — Windows 11

1. Enable WSL2 (Docker Desktop's engine) in an **administrator** PowerShell:

   ```powershell
   wsl --install -d Ubuntu-24.04
   ```
   Reboot when asked, then set a Linux username/password at first launch.
2. Install Docker Desktop:

   ```powershell
   winget install --id Docker.DockerDesktop -e
   ```
3. Launch **Docker Desktop** and wait for the whale icon to say *Engine running*.
4. Settings → **Resources → WSL Integration** → enable `Ubuntu-24.04`.
5. Settings → **Docker Engine** → paste the `registry-mirrors` block from §6.2 → **Apply & restart**.

Verify inside the WSL shell (`wsl -d Ubuntu-24.04`):

```bash
docker run --rm hello-world
docker compose version
```

Docker Desktop must be **running** before any AiXin script; it does not auto-start unless you tick
that box in Settings → General.

### 0.0.9 Do you need anything else installed?

No. Node 22, Bun, Postgres, Caddy, and Ollama all run **inside** containers built by our
`Dockerfile`. You only install extras if you deliberately choose the manual, non-Docker route in
§6.6 / §7.2.

Two small helpers are still worth having on Ubuntu for the verification steps:

```bash
sudo apt-get install -y jq postgresql-client   # pretty-print JSON, run psql from the host
```

### 0.0.10 What "build" means here, and how to do it

"Building" AiXin means: install dependencies with Bun → run `vite build` to produce a Node server
bundle → copy that bundle into a small Node 22 image. All three steps live in `Dockerfile`, so you
never run them by hand. One command does everything:

```bash
cd /opt/aixin                 # wherever you cloned it
chmod +x scripts/aixin-up.sh  # once: mark the script executable
AIXIN_GPU=1 AIXIN_PROFILES="--profile llm --profile supabase" ./scripts/aixin-up.sh
```

Drop `AIXIN_GPU=1` on machines without an NVIDIA GPU. The script is safe to re-run: it rebuilds,
restarts, pulls the local model on first run, and applies every migration in
`supabase/migrations/`. A first build takes 15–40 minutes (it downloads base images); later builds
take 3–6 minutes.

The **first** run stops early to create `docker/.env` and asks you to fill in secrets — that is
expected. Fill it in (§5 lists every variable, `DEPLOY_RUNBOOK.md` §A5–A6 walks through it) and run
the same command again.

### 0.0.11 The everyday loop, once installed

```bash
cd /opt/aixin
git pull --ff-only                                     # 1. get the new code
AIXIN_GPU=1 AIXIN_PROFILES="--profile llm --profile supabase" ./scripts/aixin-up.sh   # 2. rebuild
curl -sf -o /dev/null -w '%{http_code}\n' http://localhost/    # 3. expect 200
docker compose -f docker/compose.yml --env-file docker/.env ps  # 4. all services "running"
```

Useful when something looks wrong:

```bash
# live application logs (Ctrl+C to stop watching)
docker compose -f docker/compose.yml --env-file docker/.env logs -f app
# restart just the app after changing a server-side secret
docker compose -f docker/compose.yml --env-file docker/.env restart app
# stop everything (data is kept in the db-data volume)
docker compose -f docker/compose.yml --env-file docker/.env down
```

**Checkpoint for §0.0:** `git --version`, `docker run --rm hello-world`, and
`docker compose version` all succeed on this machine. Only then continue.

---


## 0. One-click Docker setup

Files shipped in the repo:

| File | Purpose |
| --- | --- |
| `Dockerfile` | Multi-stage build (Bun build → Node 22 Alpine runtime, `NITRO_PRESET=node-server`) |
| `docker/compose.yml` | App + Postgres + Caddy reverse proxy, with optional `llm` and `supabase` profiles |
| `docker/.env.example` | Every variable the stack needs, with China-friendly defaults |
| `docker/Caddyfile` | Reverse proxy / automatic HTTPS |
| `scripts/aixin-up.sh` | One-click bring-up for Ubuntu / WSL2 / macOS |
| `scripts/aixin-up.ps1` | One-click bring-up for Windows 11 PowerShell |

### Ubuntu / WSL2

```bash
git clone <your-mirror>/aixin-twin.git && cd aixin-twin
chmod +x scripts/aixin-up.sh
./scripts/aixin-up.sh          # first run copies docker/.env — edit secrets
./scripts/aixin-up.sh          # second run builds, starts, pulls model, migrates
```

### Windows 11

```powershell
git clone <your-mirror>/aixin-twin.git; cd aixin-twin
pwsh -File .\scripts\aixin-up.ps1   # first run creates docker\.env — edit secrets
pwsh -File .\scripts\aixin-up.ps1   # second run brings the stack up
```

The script is idempotent: it creates `docker/.env` from the example, builds the image, starts the stack, pulls the local Ollama model on first run, applies `supabase/migrations/*.sql` in order, and prints service status. Re-run it after any code or env change.

### What comes up

| Service | Port | Notes |
| --- | --- | --- |
| `proxy` (Caddy) | 80 / 443 | Set `SITE_ADDRESS=aixin.example.cn` for automatic HTTPS; `:80` for LAN |
| `app` | internal 3000 | TanStack Start Node server |
| `db` (supabase/postgres) | 5432 | Volume `db-data`, migrations auto-applied |
| `ollama` (profile `llm`) | 11434 | Local model, nothing leaves your network |
| `auth` + `rest` (profile `supabase`) | 9999 / 3001 | GoTrue + PostgREST for a fully local data plane |

### Profiles

```bash
# app + db + proxy only (you point at an existing data plane / cloud LLM)
AIXIN_PROFILES="" ./scripts/aixin-up.sh

# add a local LLM (default)
AIXIN_PROFILES="--profile llm" ./scripts/aixin-up.sh

# fully local: local LLM + local auth/REST
AIXIN_PROFILES="--profile llm --profile supabase" ./scripts/aixin-up.sh
```

### China mirrors

```bash
# in docker/.env
NPM_REGISTRY=https://registry.npmmirror.com
AIXIN_LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1   # or Ollama / DeepSeek
```

For Docker Hub, configure a registry mirror as described in §6.2 before the first build.

### Everyday operations

```bash
docker compose -f docker/compose.yml --env-file docker/.env logs -f app
docker compose -f docker/compose.yml --env-file docker/.env restart app
docker compose -f docker/compose.yml --env-file docker/.env down          # stop
docker compose -f docker/compose.yml --env-file docker/.env exec db \
  pg_dump -U postgres aixin > backup.sql                                  # backup
```

Note: `VITE_*` variables are baked into the browser bundle at build time, so changing them requires a rebuild (`--build`, which the script always passes). Server-side secrets are read at runtime and only need a `restart`.

---


## 1. Architecture

```text
                       ┌──────────────────────────────┐
   Browser  ──HTTPS──▶ │  Nginx / SLB  (TLS, :443)    │
                       └──────────────┬───────────────┘
                                      │ :3000
                       ┌──────────────▼───────────────┐
                       │  AiXin web app               │
                       │  TanStack Start (Node 22)    │
                       │  SSR + server functions      │
                       └───┬──────────┬───────────┬───┘
                           │          │           │
              ┌────────────▼──┐  ┌────▼───────┐  ┌▼──────────────┐
              │ Supabase       │  │ LLM        │  │ EVM RPC       │
              │ self-hosted    │  │ Ollama     │  │ BSC Testnet   │
              │ Postgres+Auth  │  │  or Qwen/  │  │  (optional —  │
              │ :8000 / :5432  │  │  DeepSeek  │  │  anchoring)   │
              └────────────────┘  └────────────┘  └───────────────┘
```

Four moving parts:

| Part | What it is | Runs where |
| --- | --- | --- |
| Web app | TanStack Start (React 19, SSR + server functions) | Node 22 process behind Nginx |
| Data plane | Self-hosted Supabase (Postgres, GoTrue auth, PostgREST, Realtime, Storage) | Docker Compose, or Alibaba RDS + GoTrue |
| LLM | Ollama (fully local) or a domestic OpenAI-compatible API | Same host, GPU host, or domestic cloud |
| Anchoring | EVM JSON-RPC endpoint for signed receipt anchoring | External RPC, or disabled |

---

## 2. What is blocked, and what to use instead

| Dependency today | Reachable from China? | In-China replacement |
| --- | --- | --- |
| Lovable AI Gateway (`ai.gateway.lovable.dev`) | No / unreliable | **Ollama** on localhost, or a domestic OpenAI-compatible endpoint: Alibaba **Qwen** (DashScope compatible mode), **DeepSeek**, **Moonshot/Kimi**, **Zhipu GLM**. Same `@ai-sdk/openai-compatible` provider — only base URL, key, and model id change. |
| Lovable Cloud (hosted Supabase) | No | **Self-hosted Supabase** Docker stack, or Alibaba **RDS PostgreSQL** + GoTrue container. |
| npm registry / Docker Hub / GitHub | Slow or blocked | Install-time mirrors: `registry.npmmirror.com`, Alibaba Container Registry mirror, Gitee/self-hosted Git mirror. |
| BSC Testnet public RPC (`data-seed-prebsc-*.binance.org`) | Unreliable | A paid RPC provider reachable from CN (Ankr/QuickNode with a CN-friendly PoP), your own BSC testnet node, or **run with anchoring disabled** — the app already writes `tx_hash: null` and shows an honest "not anchored" state instead of faking a hash. |
| Telegram adapter | **Blocked, no workaround** | Do not enable it in a CN-only deployment. Use the Gmail/SMTP adapter, or add a WeCom (企业微信) / DingTalk webhook adapter — both are outbound HTTPS to domestic endpoints and slot into the same adapter model. |
| Gmail API (`googleapis.com`) | Blocked | Replace with SMTP against a domestic provider (Aliyun DirectMail, Tencent SES) or an internal relay. |
| GitHub Committer tool | Blocked | Optional feature — leave `GITHUB_API_KEY` unset; the tool degrades cleanly. |
| CoinGecko (price forecasts) | Usually reachable, sometimes throttled | Optional: swap for a domestic market-data API, or cache results server-side. |

---

## 3. Prerequisites

### Sizing

| Scenario | vCPU | RAM | Disk | GPU |
| --- | --- | --- | --- | --- |
| App + Supabase, LLM on domestic cloud API | 4 | 8 GB | 80 GB SSD | none |
| App + Supabase + Ollama 7–8B (CPU) | 8 | 16 GB | 120 GB SSD | none (slow, ~5-15 tok/s) |
| App + Supabase + Ollama 7–14B (GPU) | 8 | 32 GB | 200 GB SSD | 1× 16–24 GB (A10 / 4090 / L20) |
| Ollama 32B+ | 16 | 64 GB | 400 GB SSD | 1× 48 GB+ (A100 / L40S) |

Rule of thumb for Ollama VRAM: model params (B) × ~0.7 GB for Q4 quantisation, plus 2–4 GB for context.

### Ports

| Port | Service | Exposure |
| --- | --- | --- |
| 80 / 443 | Nginx | Public |
| 3000 | AiXin app | Localhost only |
| 8000 | Supabase Kong gateway | Localhost or private VPC |
| 5432 | Postgres | Localhost / VPC only — never public |
| 11434 | Ollama | Localhost / VPC only |

### Legal / networking note for public hosting in China

Any domain serving content from a mainland Chinese IP requires **ICP filing (ICP备案)** before Alibaba will open ports 80/443 on your ECS. Filing takes roughly 1–3 weeks and needs a Chinese business licence or resident ID. Until then, access the app over a private IP, a VPN, or a non-standard port for internal testing.

---

## 4. Required code changes for a self-hosted stack

Two edits are needed before the app can run outside Lovable. Both are small and localised.

### 4.1 Build for Node instead of Cloudflare Workers

The default build targets a Cloudflare Worker runtime. For a plain server, target Node.

`vite.config.ts`:

```ts
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: {
    preset: "node-server",
  },
});
```

After `bun run build`, the Node entry point is emitted at `.output/server/index.mjs` and started with `node .output/server/index.mjs` (listens on `PORT`, default 3000).

> Note: `src/lib/anchor.server.ts` and `src/lib/erc8004.server.ts` use `viem`, which is pure JS and works fine on Node.

### 4.2 Point the LLM at Ollama or a domestic provider — no code change needed

This is now **env-driven**. `src/lib/ai-gateway.server.ts` exposes `resolveChatModel(role)`, and every AI call site
(`src/routes/api/chat.ts`, `src/lib/task-thread.server.ts`, `src/lib/execution.server.ts`, `src/lib/skillcraft.functions.ts`)
goes through it:

- If **`AIXIN_LLM_BASE_URL`** is set, the app builds an OpenAI-compatible provider against that endpoint,
  authenticates with `AIXIN_LLM_API_KEY`, and uses `AIXIN_LLM_MODEL` (default `qwen2.5:7b-instruct`).
  `LOVABLE_API_KEY` is **not required** in this mode — nothing calls `ai.gateway.lovable.dev`.
- If it is unset, the app falls back to the hosted Lovable AI Gateway (default for the cloud preview).
- If neither is configured, AI features degrade gracefully (fallback text/outcomes) instead of crashing;
  chat returns a clear `No LLM configured` error.

Matching env values:

| Backend | `AIXIN_LLM_BASE_URL` | `AIXIN_LLM_MODEL` | `AIXIN_LLM_API_KEY` |
| --- | --- | --- | --- |
| Ollama (Docker stack) | `http://ollama:11434/v1` | `qwen2.5:14b-instruct` | `ollama` (any non-empty string) |
| Ollama (host install) | `http://127.0.0.1:11434/v1` | `qwen2.5:14b-instruct` | `ollama` |
| Alibaba Qwen (DashScope) | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus` | your DashScope key |
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` | your DeepSeek key |
| Moonshot / Kimi | `https://api.moonshot.cn/v1` | `moonshot-v1-32k` | your Moonshot key |
| Zhipu GLM | `https://open.bigmodel.cn/api/paas/v4` | `glm-4-plus` | your Zhipu key |

`docker/compose.yml` already passes all three into the app container, so on the Docker path you only edit `docker/.env`.

**Tool calling matters.** AiXin's Master Twin delegates through tools (`delegate_to_specialist` etc.). Pick a model with solid function-calling support: `qwen2.5:14b-instruct` or larger locally; `qwen-plus`, `deepseek-chat`, or `glm-4-plus` in the cloud. Small models (≤7B) frequently fail to emit valid tool calls and the Ask AiXin flow will stall.

> Governance is model-independent: SIP validation, Ed25519 receipt signing, and BSC Testnet anchoring are deterministic code and behave identically on a local model.
> One exception: the **Telegram adapter** reaches Telegram through the Lovable connector gateway and still needs `LOVABLE_API_KEY` + `TELEGRAM_API_KEY`. Telegram is unreachable from mainland China anyway — leave the adapter off there.

---

## 5. Environment variables

Create `.env` at the repo root. Client variables (`VITE_*`) are baked in at **build** time — rebuild after changing them.

```bash
# ---- Client (public, embedded in the browser bundle) ----
VITE_SUPABASE_URL=https://aixin.example.cn
VITE_SUPABASE_PUBLISHABLE_KEY=<supabase anon key>

# ---- Server: data plane ----
SUPABASE_URL=http://127.0.0.1:8000
SUPABASE_PUBLISHABLE_KEY=<supabase anon key>
SUPABASE_ANON_KEY=<supabase anon key>
SUPABASE_SERVICE_ROLE_KEY=<supabase service role key>

# ---- Server: LLM ----
AIXIN_LLM_BASE_URL=http://127.0.0.1:11434/v1
AIXIN_LLM_API_KEY=ollama
AIXIN_LLM_MODEL=qwen2.5:14b-instruct
LOVABLE_API_KEY=ollama          # reused as the bearer for the chosen provider

# ---- Server: receipt signing (Ed25519 seed, hex; openssl rand -hex 32) ----
AIXIN_SIGNING_SEED=

# ---- Server: receipt anchoring (optional) ----
BSC_TESTNET_RPC_URL=
BSC_TESTNET_PRIVATE_KEY=
AUDIT_ANCHOR_CONTRACT_ADDRESS=
ERC8004_IDENTITY_ADDRESS=
ERC8004_REPUTATION_ADDRESS=
ERC8004_VALIDATION_ADDRESS=

# ---- Server: external validator (optional) ----
AIXIN_VALIDATOR_URL=

# ---- Server: optional adapters (leave empty in a CN-only deploy) ----
GITHUB_API_KEY=
TELEGRAM_API_KEY=

PORT=3000
```

| Variable | Required | Effect if unset |
| --- | --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Browser cannot reach the backend; sign-in fails |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | Yes | Server functions return "Server misconfigured" |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Public verify endpoint and admin paths fail |
| `LOVABLE_API_KEY` (bearer for the LLM) | Yes | Chat returns 500 |
| `AIXIN_LLM_BASE_URL`, `AIXIN_LLM_API_KEY`, `AIXIN_LLM_MODEL` | Yes, in China | Unset = falls back to the (blocked) Lovable AI Gateway |
| `AIXIN_SIGNING_SEED` | Recommended | Receipts are stored unsigned and shown as "unsigned" |
| `BSC_TESTNET_*`, `AUDIT_ANCHOR_CONTRACT_ADDRESS` | No | Receipts hashed and stored with `tx_hash: null`, shown as "not anchored" |
| `ERC8004_*` | No | Registry writes report `simulated` |
| `AIXIN_VALIDATOR_URL` | No | Receipts hashed locally but unsigned, with a `degraded_reason` |
| `GITHUB_API_KEY`, `TELEGRAM_API_KEY` | No | Those adapters stay disabled |

`SUPABASE_URL` should point at the Supabase gateway reachable **from the server** (`http://127.0.0.1:8000`), while `VITE_SUPABASE_URL` must be the URL reachable **from the browser** (your public HTTPS host, proxied to :8000).

---

## 6. Ubuntu 22.04 / 24.04

### 6.1 Base packages and mirrors

```bash
sudo apt update && sudo apt -y upgrade
sudo apt -y install curl git build-essential nginx ca-certificates postgresql-client

# Node 22 (via NodeSource; on Alibaba ECS the mirror below is faster)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt -y install nodejs

# Bun
curl -fsSL https://bun.sh/install | bash
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc

# npm mirror (China)
npm config set registry https://registry.npmmirror.com
bun config set registry https://registry.npmmirror.com 2>/dev/null || \
  printf '[install]\nregistry = "https://registry.npmmirror.com"\n' >> ~/.bunfig.toml
```

### 6.2 Docker + Compose with a China mirror

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER && newgrp docker

sudo tee /etc/docker/daemon.json >/dev/null <<'JSON'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://registry.cn-hangzhou.aliyuncs.com"
  ]
}
JSON
sudo systemctl restart docker
docker compose version
```

### 6.3 Self-hosted Supabase

```bash
git clone --depth 1 https://github.com/supabase/supabase /opt/supabase
# If GitHub is unreachable, mirror the repo to Gitee first and clone from there.
cd /opt/supabase/docker
cp .env.example .env
```

Generate secrets and put them in `/opt/supabase/docker/.env`:

```bash
# JWT secret (40+ chars)
openssl rand -base64 48 | tr -d '\n'
# Postgres password
openssl rand -hex 24
# Dashboard password
openssl rand -hex 16
```

Set at minimum: `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `DASHBOARD_USERNAME`, `DASHBOARD_PASSWORD`, `SITE_URL=https://aixin.example.cn`, `API_EXTERNAL_URL=https://aixin.example.cn`.

`ANON_KEY` and `SERVICE_ROLE_KEY` are JWTs signed with your `JWT_SECRET`. Generate them with the official self-hosting key generator, or locally:

```bash
docker run --rm -e JWT_SECRET="<your jwt secret>" node:22-alpine sh -c '
npm i -q jsonwebtoken >/dev/null 2>&1
node -e "
const jwt=require(\"jsonwebtoken\");
const s=process.env.JWT_SECRET, iat=Math.floor(Date.now()/1000), exp=iat+60*60*24*365*10;
console.log(\"ANON_KEY=\"+jwt.sign({role:\"anon\",iss:\"supabase\",iat,exp},s));
console.log(\"SERVICE_ROLE_KEY=\"+jwt.sign({role:\"service_role\",iss:\"supabase\",iat,exp},s));
"'
```

Bring it up:

```bash
cd /opt/supabase/docker
docker compose pull
docker compose up -d
docker compose ps        # all services healthy
curl -s http://127.0.0.1:8000/rest/v1/ -H "apikey: $ANON_KEY" | head -c 200
```

### 6.4 Apply the AiXin schema

There are 17 migrations in `supabase/migrations/`. They **must** run in filename order — later ones alter tables created earlier.

```bash
cd /path/to/aixin
export PGPASSWORD='<POSTGRES_PASSWORD>'
for f in $(ls supabase/migrations/*.sql | sort); do
  echo "==> $f"
  psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -f "$f" || break
done
```

Sanity check:

```bash
psql -h 127.0.0.1 -U postgres -d postgres -c "\dt public.*"
```

You should see `twins`, `skills`, `receipts`, `decision_cards`, `tasks`, `task_events`, `task_outcomes`, `task_messages`, `adapters`, `profiles`, `user_roles`, and friends.

Enable Realtime for the tables the UI subscribes to (tasks/events), if the migrations did not already:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks, public.task_events, public.task_messages;
```

Auth settings: in the Supabase Studio (`http://127.0.0.1:8000`, or tunnel it) set **Site URL** and **Redirect URLs** to `https://aixin.example.cn` and `https://aixin.example.cn/auth`. Disable Google OAuth for a CN deployment (Google is blocked) and enable email/password.

### 6.5 Ollama

```bash
curl -fsSL https://ollama.com/install.sh | sh
sudo systemctl enable --now ollama

# Pull a tool-calling-capable model
ollama pull qwen2.5:14b-instruct     # 8 vCPU / GPU recommended
# ollama pull qwen2.5:7b-instruct    # lighter, weaker tool calls

# Keep it on localhost
sudo systemctl edit ollama
# [Service]
# Environment="OLLAMA_HOST=127.0.0.1:11434"
sudo systemctl restart ollama

curl -s http://127.0.0.1:11434/v1/models | head -c 300
```

If GitHub/ollama.com is unreachable, download the release tarball via a mirror and extract to `/usr/local/bin/ollama`, then create the systemd unit manually.

### 6.6 Build and run the app

```bash
cd /path/to/aixin
bun install
# apply the §4 code changes first
bun run build
node .output/server/index.mjs   # smoke test on :3000, Ctrl-C when OK
```

systemd unit at `/etc/systemd/system/aixin.service`:

```ini
[Unit]
Description=AiXin web app
After=network.target docker.service ollama.service

[Service]
Type=simple
User=aixin
WorkingDirectory=/opt/aixin
EnvironmentFile=/opt/aixin/.env
ExecStart=/usr/bin/node /opt/aixin/.output/server/index.mjs
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now aixin
sudo journalctl -u aixin -f
```

### 6.7 Nginx + TLS

`/etc/nginx/sites-available/aixin`:

```nginx
server {
  listen 80;
  server_name aixin.example.cn;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name aixin.example.cn;

  ssl_certificate     /etc/nginx/ssl/aixin.crt;
  ssl_certificate_key /etc/nginx/ssl/aixin.key;

  client_max_body_size 20m;

  # Supabase API + auth, exposed under the same origin
  location ~ ^/(rest|auth|realtime|storage|functions)/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # The app (SSR + server functions + streaming chat)
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;        # required for streamed chat responses
    proxy_read_timeout 300s;
  }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/aixin /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Certificates: use an Alibaba Cloud SSL certificate (free DV tier) — Let's Encrypt's ACME endpoints are reachable but occasionally slow from CN.

`proxy_buffering off` is not optional: the Ask AiXin chat streams tokens, and buffering makes it appear frozen until the response completes.

---

## 7. Windows 11

Two routes. **WSL2 is strongly recommended** — it runs the Ubuntu instructions verbatim and avoids Windows-specific path and service issues. The native route is documented for machines where WSL2 is unavailable.

### 7.1 Route A — WSL2 (recommended)

```powershell
# PowerShell as Administrator
wsl --install -d Ubuntu-24.04
wsl --set-default-version 2
# Reboot, create your Linux user, then:
wsl
```

Inside the Ubuntu shell, follow **§6 in full**. Two Windows-side notes:

- **Docker**: install Docker Desktop for Windows and enable *Settings → Resources → WSL Integration* for your distro, or install Docker directly inside WSL2 (`curl -fsSL https://get.docker.com | sudo sh`) and start it with `sudo service docker start`.
- **GPU for Ollama**: NVIDIA GPUs pass through to WSL2 automatically with a current Windows driver — no driver install inside Linux. Verify with `nvidia-smi` in the WSL shell.
- **Port access**: WSL2 forwards `localhost` to Windows automatically, so `http://localhost:3000` works from a Windows browser.
- **Keep the project inside the Linux filesystem** (`/home/you/aixin`), not `/mnt/c/...` — cross-filesystem I/O makes `bun install` and Vite builds 5–10× slower.

### 7.2 Route B — Native Windows

**Install the toolchain (PowerShell as Administrator):**

```powershell
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Oven-sh.Bun -e
winget install --id Git.Git -e
winget install --id Docker.DockerDesktop -e
winget install --id Ollama.Ollama -e
winget install --id PostgreSQL.psqlODBC -e   # or install full PostgreSQL for psql.exe
```

Restart the shell, then set the China npm mirror:

```powershell
npm config set registry https://registry.npmmirror.com
bun config set registry https://registry.npmmirror.com
```

**Docker Desktop mirrors:** Settings → Docker Engine, add:

```json
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://registry.cn-hangzhou.aliyuncs.com"
  ]
}
```

Apply & Restart. Ensure the WSL2 backend is enabled (Settings → General).

**Supabase:**

```powershell
git clone --depth 1 https://github.com/supabase/supabase C:\supabase
cd C:\supabase\docker
Copy-Item .env.example .env
notepad .env          # fill in the same values as §6.3
docker compose pull
docker compose up -d
docker compose ps
```

Generate secrets on Windows:

```powershell
# 48-byte base64 secret
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Max 256 }))
```

Use the same Node one-liner from §6.3 (via `docker run`) to mint `ANON_KEY` / `SERVICE_ROLE_KEY`.

**Apply migrations:**

```powershell
$env:PGPASSWORD = "<POSTGRES_PASSWORD>"
Get-ChildItem .\supabase\migrations\*.sql | Sort-Object Name | ForEach-Object {
  Write-Host "==> $($_.Name)"
  & psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -f $_.FullName
  if ($LASTEXITCODE -ne 0) { throw "Migration failed: $($_.Name)" }
}
```

If `psql.exe` is not on PATH, add `C:\Program Files\PostgreSQL\16\bin` to the system PATH, or run it inside the container:

```powershell
docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 < .\supabase\migrations\<file>.sql
```

**Ollama:**

```powershell
ollama pull qwen2.5:14b-instruct
# Bind to localhost only
[Environment]::SetEnvironmentVariable("OLLAMA_HOST","127.0.0.1:11434","Machine")
Restart-Service Ollama -ErrorAction SilentlyContinue
Invoke-RestMethod http://127.0.0.1:11434/v1/models
```

Ollama for Windows installs as a background service and starts at login. Models land in `%USERPROFILE%\.ollama\models` — point `OLLAMA_MODELS` at a larger drive if C: is tight.

**Build and run:**

```powershell
cd C:\aixin
bun install
# apply the §4 code changes first
bun run build
node .output\server\index.mjs
```

**Run as a Windows service with NSSM:**

```powershell
winget install --id NSSM.NSSM -e
nssm install AiXin "C:\Program Files\nodejs\node.exe" "C:\aixin\.output\server\index.mjs"
nssm set AiXin AppDirectory C:\aixin
nssm set AiXin AppEnvironmentExtra NODE_ENV=production PORT=3000
nssm set AiXin AppStdout C:\aixin\logs\out.log
nssm set AiXin AppStderr C:\aixin\logs\err.log
nssm set AiXin Start SERVICE_AUTO_START
nssm start AiXin
```

NSSM does not read `.env` files. Either list every variable in `AppEnvironmentExtra`, or start via a wrapper `.cmd` that sets them. Alternative without NSSM: Task Scheduler → *Create Task* → trigger *At startup*, action `node.exe C:\aixin\.output\server\index.mjs`, *Run whether user is logged on or not*.

**Reverse proxy:** install Nginx for Windows (`winget install --id nginx.nginx`) and reuse the §6.7 config with Windows paths, or use IIS with Application Request Routing (URL Rewrite + ARR reverse proxy to `http://127.0.0.1:3000`). If using IIS, disable response buffering on the proxy rule so chat streaming works.

**Firewall:**

```powershell
New-NetFirewallRule -DisplayName "AiXin HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
# Do NOT open 3000, 5432, 8000, or 11434 to the network.
```

---

## 8. Alibaba Cloud (阿里云) specifics

### 8.1 ECS

- **Region**: `cn-hangzhou`, `cn-shanghai`, or `cn-beijing` for domestic users. Avoid Hong Kong if your users are on the mainland — cross-border latency and occasional throttling.
- **Image**: Ubuntu 24.04 LTS 64-bit.
- **Instance**: `ecs.g7.xlarge` (4 vCPU / 16 GB) for app + Supabase with a cloud LLM. For local Ollama with GPU, use `ecs.gn7i-c8g1.2xlarge` (A10 24 GB).
- **Disk**: 100 GB ESSD PL1 minimum; Postgres + model weights grow quickly.
- **Bandwidth**: pay-by-traffic, 5 Mbps peak is enough for a demo; SSR + streaming is light.

### 8.2 Security group

| Direction | Port | Source | Purpose |
| --- | --- | --- | --- |
| Inbound | 443 | 0.0.0.0/0 | HTTPS |
| Inbound | 80 | 0.0.0.0/0 | HTTP → HTTPS redirect |
| Inbound | 22 | your office IP only | SSH |
| Inbound | 5432 / 8000 / 11434 / 3000 | **none** | keep internal |

### 8.3 Managed alternatives

- **RDS PostgreSQL** instead of the Postgres container: create a 16.x instance in the same VPC, point the Supabase stack's `POSTGRES_HOST`/`POSTGRES_PASSWORD` at it, and run the migrations against the RDS endpoint. You get automatic backups, PITR, and monitoring. Enable the `pgcrypto` and `uuid-ossp` extensions; note that `pg_cron`/`pg_net` (used by the anchor retry queue) may need the RDS extension console or an external scheduler — see §8.5.
- **OSS** for Supabase Storage: set the storage backend to S3-compatible with the OSS endpoint (`oss-cn-hangzhou.aliyuncs.com`), a dedicated RAM user, and a private bucket.
- **SLB / ALB** in front of Nginx if you run more than one app instance; terminate TLS there with an Alibaba Cloud certificate.
- **PAI-EAS / DashScope** to host the LLM inside your VPC instead of on the app host — this keeps model traffic off the public internet and off any GPU on the web tier.

### 8.4 Keeping the LLM inside the VPC

Whether you run Ollama on a separate GPU ECS or use DashScope over a VPC endpoint, set `AIXIN_LLM_BASE_URL` to the **private** address (e.g. `http://10.0.1.12:11434/v1`) and allow port 11434 only from the app instance's security group. No LLM traffic should traverse the public internet.

### 8.5 Anchor retry cron

The app exposes `POST /api/public/anchor/retry` (apikey-guarded) and, on Lovable Cloud, calls it every 15 minutes via `pg_cron` + `pg_net`. If your self-hosted Postgres lacks those extensions, replace it with a system cron:

```bash
*/15 * * * * curl -fsS -X POST https://aixin.example.cn/api/public/anchor/retry \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" >/dev/null 2>&1
```

On Windows, create a Task Scheduler task with a 15-minute repeat running the equivalent `Invoke-RestMethod`.

---

## 9. Verification checklist

Run this end to end after deployment. Each step exercises a different subsystem.

| # | Action | Proves |
| --- | --- | --- |
| 1 | Load `https://aixin.example.cn` — landing page renders in EN, toggle to 中文 | SSR + i18n |
| 2 | Sign up with email/password, confirm, sign in | GoTrue auth + redirect URLs |
| 3 | Complete onboarding, hatch the Master Twin **AiXin** | DB writes + RLS |
| 4 | Open **Ask AiXin**, type a goal, watch the plan stream in | LLM endpoint + streaming through Nginx |
| 5 | Install a skill from the Marketplace, assign it to a Specialist | Skills lifecycle |
| 6 | Delegate a high-risk task; a **Decision Card** appears with evidence | SIP validator + deterministic rules |
| 7 | Approve it (supply a rationale if prompted) | Human-in-the-loop governance |
| 8 | Open **Reputation** — the receipt shows *Signed* or an honest *Unsigned* badge | Receipt hashing / validator |
| 9 | Click **Verify** → the public `/verify/:sipId` page loads with hashes | Public verification endpoint + service role key |
| 10 | If anchoring is configured, the receipt carries a real tx hash and BscScan link | EVM RPC reachability |

Health probes:

```bash
curl -sI https://aixin.example.cn | head -1                 # 200
curl -s http://127.0.0.1:11434/v1/models | head -c 120      # model list
docker compose -f /opt/supabase/docker/docker-compose.yml ps # all healthy
sudo journalctl -u aixin -n 50 --no-pager
```

---

## 10. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `relation "..." does not exist` while migrating | Migrations applied out of order | Drop the schema and re-run with `ls *.sql \| sort` |
| Sign-in redirects to a blank page or `localhost` | Supabase `SITE_URL` / Redirect URLs still default | Set both to your public HTTPS origin, restart the auth container |
| Browser calls hit the wrong host | `VITE_SUPABASE_URL` points at `127.0.0.1` | Set it to the public origin and **rebuild** — `VITE_*` is baked in at build time |
| Chat spinner never streams | Nginx buffering, or IIS response buffering | `proxy_buffering off;` and `proxy_read_timeout 300s;` |
| Chat replies but never delegates / no Decision Card | Model too small for tool calling | Use `qwen2.5:14b-instruct` or a cloud model with function calling |
| `context length exceeded` from Ollama | Default 2k–4k context | `ollama run <model>` then `/set parameter num_ctx 16384`, or bake a Modelfile with `PARAMETER num_ctx 16384` |
| Ollama very slow | Running on CPU | Check `ollama ps` for GPU offload; reduce model size or add a GPU |
| `Missing LOVABLE_API_KEY` 500 | Bearer for the LLM not set | Set `LOVABLE_API_KEY` (any non-empty value for Ollama) |
| Receipts always "not anchored" | RPC/key/contract unset or RPC unreachable from CN | Set `BSC_TESTNET_*` + `AUDIT_ANCHOR_CONTRACT_ADDRESS`, or accept the honest unanchored state |
| Receipts "Unsigned" with a degraded reason | `AIXIN_VALIDATOR_URL` unset or unreachable | Deploy `@aixin-protocol/validator-server` alongside the app and set the URL |
| `bun install` hangs | npm registry blocked | Set the npmmirror registry (§6.1) |
| `docker compose pull` times out | Docker Hub blocked | Configure registry mirrors (§6.2) |
| Telegram adapter never receives messages | Telegram is blocked in CN | Expected — use email/WeCom instead |
| 403 from Alibaba on ports 80/443 | ICP filing incomplete | Finish filing, or test over a private IP / alternate port |

---

## 11. Fully-offline profile

For an air-gapped or strictly domestic deployment, this configuration has **zero** dependencies outside your network at runtime:

- Supabase self-hosted on the same host or VPC
- Ollama on localhost or a VPC GPU node
- Anchoring disabled (`BSC_TESTNET_*` empty) — receipts remain hashed, signed by a local validator, and verifiable at `/verify/:sipId`; they just carry no on-chain proof
- `AIXIN_VALIDATOR_URL` pointing at a validator container on the same host
- Telegram, Gmail, GitHub adapters left unconfigured
- Nginx with an internal CA certificate

The governance story stays intact: deterministic SIP validation, Decision Cards, and signed receipts all run locally. Only the public blockchain anchor — an optional, clearly-labelled layer — is dropped.
