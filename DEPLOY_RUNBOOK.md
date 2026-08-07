# AiXin Deployment Runbook — Ubuntu (Alibaba Cloud) and Windows 11

This is the **ordered, copy-paste runbook**. Do the steps in the order given; each part
ends with a **CHECKPOINT** you must pass before continuing. If a checkpoint fails, fix it
there — do not skip ahead.

- **Part R — RunPod GPU Pod.** Fast interim environment when Alibaba connectivity is unstable.
- **Part A — Ubuntu 24.04 on Alibaba Cloud ECS (with NVIDIA GPUs).** Your mainland target.
- **Part B — Windows 11 laptop.** Do this only after Part A works.
- **Part C — the day-to-day loop:** develop in Manus → push to Git → pull and redeploy on the server.

Background and design rationale (why each component was chosen, blocked-service table,
Alibaba specifics, manual non-Docker route) live in [`SELF_HOSTING.md`](./SELF_HOSTING.md).
This file is the *sequence*; that file is the *reference*.

Conventions used below:

- `$` = run in a Linux shell (Ubuntu / WSL2). `PS>` = run in Windows PowerShell 7.
- Anything in `<angle brackets>` is a value **you** replace.
- "Run as root" on ECS means you are already `root@iZ...` as in a fresh Alibaba image. If you
  are a normal user, prefix commands with `sudo`.

---

## Part R — RunPod GPU Pod (interim working environment)

This route gets AiXin running without waiting for Alibaba Cloud troubleshooting. It runs the
**AiXin web server and private Qwen/Ollama model on RunPod**, while the existing managed AiXin
backend continues to provide authentication and the database. This is deliberate: RunPod Pods are
already containers and are not a dependable Docker Compose host for the six-container local stack.

Do **not** choose Serverless for this first deployment. Choose:

- **Secure Cloud → GPU Pod → On-demand** (not Spot/Community);
- an L40S, A40, RTX 4090, or another GPU with 24–48 GB VRAM;
- a current **RunPod PyTorch** template;
- a **100–150 GB persistent network volume mounted at `/workspace`**;
- HTTP port **3000** only. Do not expose 11434, 5432, or database/auth ports.

The exact GPU inventory and hourly prices change, so select by VRAM and availability rather than
following a hard-coded product name or price.

### R1. Create and connect to the Pod

1. In RunPod, create the Pod using the choices above.
2. Wait until its status is **Running**.
3. Open **Connect** and copy its SSH command. It resembles:

   ```powershell
   ssh root@<runpod-ssh-host> -p <runpod-ssh-port> -i $HOME\.ssh\id_ed25519
   ```

4. Paste that command into PowerShell on your own computer.
5. After connecting, verify the GPU and persistent mount:

   ```bash
   nvidia-smi
   df -h /workspace
   touch /workspace/persistence-test && ls -l /workspace/persistence-test
   ```

**CHECKPOINT R1:** `nvidia-smi` shows the rented GPU and `/workspace` has the network-volume size
you selected. Stop here if `/workspace` is not persistent.

### R2. Install Git and download AiXin

Run inside the RunPod terminal:

```bash
apt-get update
apt-get install -y git curl ca-certificates nano jq
git --version

cd /workspace
git clone https://github.com/aixin-protocol/aixin-twin.git aixin
cd /workspace/aixin
git log --oneline -3
```

If the folder already exists after a Pod restart, update instead of cloning:

```bash
cd /workspace/aixin
git pull --ff-only
```

**CHECKPOINT R2:** `ls` shows `package.json`, `runpod/`, `scripts/`, and `src/`.

### R3. Configure the environment without exposing secrets

```bash
cd /workspace/aixin
cp runpod/.env.example runpod/aixin.local
chmod 600 runpod/aixin.local
nano runpod/aixin.local
```

Copy the existing backend URL, publishable key, and project ID from the current app environment
into the matching fields. A publishable key is designed for browser use; private testnet keys are
not. Put optional private keys only in `runpod/aixin.local`, which Git ignores, and never paste that file
into chat, screenshots, or commits.

Keep these Qwen values for the first test:

```dotenv
AIXIN_LLM_BASE_URL=http://127.0.0.1:11434/v1
AIXIN_LLM_API_KEY=ollama
AIXIN_LLM_MODEL=qwen2.5:14b-instruct
HOST=0.0.0.0
PORT=3000
```

Use `qwen2.5:7b-instruct` if the Pod has less than 24 GB VRAM. Larger models improve tool calling
but increase download time, memory use, and cost.

**CHECKPOINT R3:** this command prints `configuration present` without printing any values:

```bash
grep -q '<' runpod/aixin.local && echo 'ERROR: placeholders remain' || echo 'configuration present'
```

### R4. One-command install, build, and start

```bash
cd /workspace/aixin
chmod +x scripts/runpod-up.sh
./scripts/runpod-up.sh
```

The script installs Bun and Ollama, stores model weights and logs under persistent `/workspace`,
pulls Qwen, builds the Node-server version of AiXin, and starts both processes with `nohup` so an
SSH disconnect does not stop them. The first model pull can take several minutes.

Verify without printing secrets:

```bash
curl -I http://127.0.0.1:3000/
curl -s http://127.0.0.1:11434/api/tags | jq '.models[].name'
nvidia-smi
tail -n 30 /workspace/aixin-state/logs/app.log
```

**CHECKPOINT R4:** the first command returns HTTP 200, the second lists Qwen, and `nvidia-smi`
shows Ollama using GPU memory after a model request.

### R5. Open AiXin through RunPod

In the Pod page, open **Connect → HTTP Services → port 3000**. RunPod provides an HTTPS proxy URL.
Open it in a private browser window and complete the functional test in **A10**.

Do not expose port 11434 through RunPod. AiXin reaches it locally inside the Pod, and making it
public would let strangers consume the GPU.

**CHECKPOINT R5:** login, Ask AiXin, and one Decision Card work from the HTTPS proxy URL.

### R6. Stop, restart, update, and recover

Before relying on the Pod, test persistence:

1. Stop the Pod in RunPod (do **not** terminate it).
2. Start it again and reconnect.
3. Confirm `/workspace/aixin` and `/workspace/aixin-state/ollama-models` still exist.
4. Restart the services:

   ```bash
   cd /workspace/aixin
   ./scripts/runpod-up.sh
   ```

After future code pushes:

```bash
cd /workspace/aixin
git pull --ff-only
./scripts/runpod-up.sh
curl -I http://127.0.0.1:3000/
```

If the site fails, inspect:

```bash
tail -n 100 /workspace/aixin-state/logs/app.log
tail -n 100 /workspace/aixin-state/logs/ollama.log
```

Stopping saves compute charges but storage charges continue. **Terminating may delete Pod-local
data**; verify the network volume and backups first.

### R7. What this interim route does not prove

- RunPod does not provide a confirmed mainland-China region. Test the proxy URL from China Mobile,
  China Telecom/Unicom, and the actual target users before treating it as production.
- RunPod's proxy hostname may change when infrastructure is recreated; it is not the final custom
  domain/ICP architecture.
- The managed backend remains external in this interim route. Moving auth/database is a separate,
  planned migration—not something to improvise inside a GPU Pod.
- Keep the Alibaba instance. Diagnose it in parallel; do not destroy it just because RunPod works.

---

## Part A — Ubuntu 24.04 on Alibaba Cloud ECS

Assumed starting point (this is exactly what you have): a fresh Ubuntu 24.04 LTS ECS instance
with the NVIDIA driver installed (`nvidia-smi` prints your L20 cards), nothing else.

### A0. Sanity-check the machine (2 min)

```bash
lsb_release -a                 # expect Ubuntu 24.04 LTS
nvidia-smi                     # expect your GPUs, Driver 580.x, CUDA 13.x
free -h                        # expect >= 16 GB RAM
df -h /                        # expect >= 60 GB free
nproc                          # CPU cores
```

**CHECKPOINT A0:** `nvidia-smi` lists your GPUs and the disk has at least 60 GB free
(the app image, Postgres volume, and one 7–14B model together need ~40 GB).

### A1. Base packages and China mirrors (5 min)

```bash
# Alibaba's own APT mirror is already default on their images; set it explicitly if not.
sed -i 's|http://[a-z.]*archive.ubuntu.com|http://mirrors.cloud.aliyuncs.com|g' \
  /etc/apt/sources.list /etc/apt/sources.list.d/*.sources 2>/dev/null || true

apt-get update
apt-get install -y curl git ca-certificates gnupg lsb-release unzip jq postgresql-client
```

**CHECKPOINT A1:** `git --version`, `curl --version`, and `psql --version` all print a version.

### A2. Install Docker Engine + Compose plugin (5 min)

```bash
# Docker's own repo is slow/blocked from CN — use Alibaba's mirror of it.
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
```

Point Docker at a China image mirror (needed for `oven/bun`, `node`, `caddy`, `postgres`, `ollama`):

```bash
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'JSON'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerproxy.net",
    "https://mirror.ccs.tencentyun.com"
  ],
  "log-driver": "json-file",
  "log-opts": { "max-size": "50m", "max-file": "3" }
}
JSON
systemctl restart docker
```

**CHECKPOINT A2:**

```bash
docker run --rm hello-world     # must print "Hello from Docker!"
docker compose version          # must print v2.x
```

If `hello-world` fails to pull, swap a different mirror into `registry-mirrors` and
`systemctl restart docker`. Do not continue until this passes.

### A3. NVIDIA Container Toolkit — let Docker see the GPUs (5 min)

The driver alone is not enough; containers need this toolkit.

```bash
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey \
  | gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list \
  | sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' \
  > /etc/apt/sources.list.d/nvidia-container-toolkit.list

apt-get update && apt-get install -y nvidia-container-toolkit
nvidia-ctk runtime configure --runtime=docker
systemctl restart docker
```

If `nvidia.github.io` is unreachable from your ECS, download the three `.deb` files
(`libnvidia-container1`, `libnvidia-container-tools`, `nvidia-container-toolkit`) on a machine
that can reach it, `scp` them over, then `dpkg -i *.deb` followed by the same
`nvidia-ctk`/`systemctl` commands.

**CHECKPOINT A3:**

```bash
docker run --rm --gpus all nvidia/cuda:12.4.0-base-ubuntu22.04 nvidia-smi
```
This must print the same GPU table you saw on the host. If it errors with
`could not select device driver`, the toolkit is not wired in — re-run
`nvidia-ctk runtime configure --runtime=docker && systemctl restart docker`.

### A4. Get the source (2 min)

```bash
cd /opt
git clone https://github.com/aixin-protocol/aixin-twin.git aixin
cd /opt/aixin
git log --oneline -3
```

If GitHub is slow or blocked from the ECS, mirror the repo to Gitee once and clone from there:

```bash
# after creating an empty repo on gitee.com
git clone https://gitee.com/<you>/aixin-twin.git aixin
```

**CHECKPOINT A4:** `ls /opt/aixin` shows `Dockerfile`, `docker/`, `scripts/`, `supabase/`,
`package.json`.

If you cloned earlier and `supabase/` or `package.json` are missing, you have an older clone
from before the full application source was published. Update it in place:

```bash
cd /opt/aixin
git pull origin main
ls package.json supabase/migrations | head
```


### A5. Fill in the environment file (10 min — the step people get wrong)

```bash
cd /opt/aixin
cp docker/.env.example docker/.env

# generate the two secrets you need
openssl rand -hex 32     # -> JWT_SECRET
openssl rand -hex 24     # -> POSTGRES_PASSWORD

nano docker/.env
```

Minimum viable values for a fully local, China-safe deployment:

```dotenv
SITE_ADDRESS=:80                      # or aixin.example.cn for automatic HTTPS
PUBLIC_SITE_URL=http://<ecs-public-ip>
NPM_REGISTRY=https://registry.npmmirror.com

POSTGRES_PASSWORD=<from openssl rand -hex 24>
POSTGRES_DB=aixin
JWT_SECRET=<from openssl rand -hex 32>

# Local data plane (the "supabase" profile serves these on the host)
SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_URL=http://<ecs-public-ip>:8000
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key you generate in A6>
VITE_SUPABASE_PROJECT_ID=aixin-local
SUPABASE_SERVICE_ROLE_KEY=<service key you generate in A6>

# Local GPU LLM
AIXIN_LLM_BASE_URL=http://ollama:11434/v1
AIXIN_LLM_API_KEY=ollama
AIXIN_LLM_MODEL=qwen2.5:14b-instruct   # 7b if you want it lighter

# Receipt anchoring — leave blank to run honestly un-anchored
BSC_TESTNET_RPC_URL=
BSC_ANCHOR_PRIVATE_KEY=
RECEIPT_SIGNING_PRIVATE_KEY=

# Telegram is blocked in CN — leave empty
TELEGRAM_BOT_TOKEN=
```

Two rules to remember:

1. `VITE_*` values are **baked into the browser bundle at build time**. They must be URLs the
   *browser* can reach (your public IP or domain), not `localhost`. Changing them requires a
   rebuild, not a restart.
2. Everything without the `VITE_` prefix is read on the server at runtime; changing those only
   needs `docker compose restart app`.

**CHECKPOINT A5:** `grep -c '=' docker/.env` returns a number, and no line still says
`change-me`.

### A6. Generate the anon / service keys (5 min)

The self-hosted data plane signs its two API keys with your `JWT_SECRET`.

```bash
cd /opt/aixin
docker run --rm -e JWT_SECRET="$(grep '^JWT_SECRET=' docker/.env | cut -d= -f2-)" \
  node:22-alpine sh -c '
  npm i -s jsonwebtoken >/dev/null 2>&1
  node -e "
    const jwt=require(\"jsonwebtoken\");
    const s=process.env.JWT_SECRET, exp=Math.floor(Date.now()/1000)+60*60*24*365*5;
    console.log(\"ANON=\"+jwt.sign({role:\"anon\",iss:\"supabase\",exp},s));
    console.log(\"SERVICE=\"+jwt.sign({role:\"service_role\",iss:\"supabase\",exp},s));
  "'
```

Paste `ANON` into `VITE_SUPABASE_PUBLISHABLE_KEY` and `SERVICE` into
`SUPABASE_SERVICE_ROLE_KEY` in `docker/.env`.

**CHECKPOINT A6:** both keys are long three-part strings separated by dots.

### A7. First bring-up (15–40 min, mostly image pulls and the app build)

```bash
cd /opt/aixin
chmod +x scripts/aixin-up.sh

# GPU + local LLM + local auth/REST
AIXIN_GPU=1 AIXIN_PROFILES="--profile llm --profile supabase" ./scripts/aixin-up.sh
```

What the script does, in order: builds the app image (Bun install → `vite build` with
`NITRO_PRESET=node-server` → Node 22 runtime), starts Postgres and waits for it to be healthy,
starts `auth`, `rest`, `ollama`, `app`, `proxy`, pulls your Ollama model, then applies every
file in `supabase/migrations/` in filename order.

Watch it:

```bash
docker compose -f docker/compose.yml -f docker/compose.gpu.yml --env-file docker/.env \
  --profile llm --profile supabase ps
docker compose -f docker/compose.yml --env-file docker/.env logs -f app
```

**CHECKPOINT A7:** every service shows `running` (and `db` shows `healthy`).

### A8. Verify each layer bottom-up (10 min)

```bash
# 1. Database + schema
docker compose -f docker/compose.yml --env-file docker/.env exec -T db \
  psql -U postgres -d aixin -c "\dt public.*"
# expect tasks, skills, receipts, decision_cards, specialist_twins, ...

# 2. GPU is actually being used by Ollama
docker compose -f docker/compose.yml -f docker/compose.gpu.yml --env-file docker/.env \
  exec -T ollama nvidia-smi | head -15

# 3. The model answers
docker compose -f docker/compose.yml --env-file docker/.env exec -T ollama \
  ollama run qwen2.5:14b-instruct "Reply with the single word: ready"

# 4. The web app answers through the proxy
curl -I http://localhost/            # expect HTTP/1.1 200
curl -s http://localhost/ | head -5  # expect HTML
```

Then open `http://<ecs-public-ip>/` in a browser.

**CHECKPOINT A8:** the landing page renders, and `nvidia-smi` inside the `ollama` container
shows non-zero GPU memory while the model is loaded.

### A9. Open only the ports you need (5 min)

In the ECS console → **Security Groups → Inbound**:

| Port | Source | Why |
| --- | --- | --- |
| 22 | your IP only | SSH |
| 80 | 0.0.0.0/0 | HTTP (redirects to HTTPS once you set a domain) |
| 443 | 0.0.0.0/0 | HTTPS |
| 8000 | 0.0.0.0/0 | only if the browser must reach the data plane directly |

Never expose **3000** (app), **5432** (Postgres), **9999** (auth), or **11434** (Ollama).

```bash
ss -tlnp | grep -E '3000|5432|11434'   # should show 127.0.0.1 / docker-internal only
```

**CHECKPOINT A9:** from your laptop, `curl -I http://<ecs-ip>/` works and
`nc -vz <ecs-ip> 5432` is refused/timed out.

### A10. Functional end-to-end test (15 min)

Do this in the browser, in order — it is also the demo script:

1. **Sign up** → confirm you land on onboarding (email autoconfirm is on in the local profile).
2. **Hatch the Master Twin (AiXin)** → it appears on the dashboard.
3. **Skills → Marketplace → install** a skill (e.g. Refund Reviewer) → it shows in My Skills.
4. **Specialists → create a specialist → assign the skill.**
5. **Ask AiXin** → type a real request (e.g. "refund order ORD-1001 for the duplicate charge").
6. The plan appears, work runs, and a **Decision Card** is raised with the evidence panel
   (customer, order, ledger-verified tiles, risk flags).
7. **Approve** with a rationale → a **receipt** is written.
8. **Reputation** → the receipt shows `Signed`; it shows `Anchored` with a BscScan link only if
   you supplied `BSC_TESTNET_RPC_URL` + `BSC_ANCHOR_PRIVATE_KEY`, otherwise an honest
   "not anchored" state.
9. Open `http://<ecs-ip>/verify/<sipId>` → the public verification page renders.
10. Switch language to 简体中文 and repeat step 5 to confirm the ZH path.

**CHECKPOINT A10:** you completed install → assign → delegate → approve → receipt → verify.

### A11. Survive reboots and keep the disk clean (5 min)

```bash
# Docker's restart policies already do this; confirm after a reboot:
reboot
# then, back on the box:
cd /opt/aixin && docker compose -f docker/compose.yml --env-file docker/.env ps

# nightly backup (crontab -e)
0 3 * * * cd /opt/aixin && docker compose -f docker/compose.yml --env-file docker/.env \
  exec -T db pg_dump -U postgres aixin | gzip > /var/backups/aixin-$(date +\%F).sql.gz

# reclaim space from old builds
docker system prune -f
```

**CHECKPOINT A11:** after a reboot, the site answers on port 80 with no manual action.

### The local LLM is env-driven (no code change needed)

Setting **`AIXIN_LLM_BASE_URL`** in `docker/.env` is all it takes: every AI call in the app
(chat, task threads, outcome generation, SkillCraft) resolves its model from
`AIXIN_LLM_BASE_URL` / `AIXIN_LLM_API_KEY` / `AIXIN_LLM_MODEL` and never touches
`ai.gateway.lovable.dev`. `LOVABLE_API_KEY` is not required on your ECS.

Leave `AIXIN_LLM_BASE_URL` unset only if you deliberately want the hosted Lovable gateway.
On this GPU box keep `AIXIN_LLM_MODEL=qwen2.5:14b-instruct` (or larger) — models at 7B and
below often fail to emit valid tool calls, which stalls delegation.

The only remaining Lovable-gateway dependency is the **Telegram adapter** (connector gateway),
which is unreachable from mainland China regardless — leave it disabled there.

---

## Part B — Windows 11 laptop

Only start this once Part A is green. Route B1 (WSL2) is strongly recommended: it is the same
Linux path you just proved, so bugs don't differ between machines.

### B1. Enable WSL2 + Ubuntu (15 min, one reboot)

```powershell
# PowerShell as Administrator
wsl --install -d Ubuntu-24.04
# reboot when prompted, then set your Linux username/password at first launch
wsl --set-default-version 2
wsl -l -v            # expect Ubuntu-24.04  Running  2
```

### B2. Install Docker Desktop (10 min)

1. Download **Docker Desktop for Windows** from `docs.docker.com/desktop/install/windows-install/`
   (or Alibaba's software mirror if that host is slow).
2. Install with **"Use WSL 2 based engine"** checked.
3. Settings → **Resources → WSL Integration** → enable your `Ubuntu-24.04` distro.
4. Settings → **Docker Engine** → add the same `registry-mirrors` block from step A2 → Apply.
5. If your laptop has an NVIDIA GPU: install the current Windows NVIDIA driver (it provides
   WSL2 CUDA automatically — do **not** install a driver inside WSL).

**CHECKPOINT B2:** inside `wsl -d Ubuntu-24.04`:

```bash
docker run --rm hello-world
docker run --rm --gpus all nvidia/cuda:12.4.0-base-ubuntu22.04 nvidia-smi   # GPU laptops only
```

### B3. Clone and bring up inside WSL (20 min)

```bash
# in the Ubuntu (WSL) shell — keep the repo on the Linux filesystem, NOT /mnt/c, for speed
sudo apt-get update && sudo apt-get install -y git jq postgresql-client
mkdir -p ~/src && cd ~/src
git clone https://github.com/aixin-protocol/aixin-twin.git aixin && cd aixin

cp docker/.env.example docker/.env
nano docker/.env      # same values as A5, but:
                      #   SITE_ADDRESS=:8080
                      #   HTTP_PORT=8080
                      #   PUBLIC_SITE_URL=http://localhost:8080
                      #   VITE_SUPABASE_URL=http://localhost:8000
                      #   AIXIN_LLM_MODEL=qwen2.5:7b-instruct   (laptops)
chmod +x scripts/aixin-up.sh
AIXIN_PROFILES="--profile llm --profile supabase" ./scripts/aixin-up.sh   # add AIXIN_GPU=1 on GPU laptops
```

Generate the anon/service keys exactly as in A6, then re-run the script (the rebuild picks up
the new `VITE_*` values).

**CHECKPOINT B3:** `http://localhost:8080/` opens in the Windows browser (WSL2 forwards
localhost automatically). Then repeat the A10 functional test.

### B4. Route B2 — native Windows, no WSL (only if you must)

```powershell
# Package manager
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e          # Node 22
winget install --id Oven-sh.Bun -e
winget install --id Docker.DockerDesktop -e
winget install --id Ollama.Ollama -e              # native Windows Ollama

# verify
git --version; node -v; bun -v; docker version; ollama --version
```

Then:

```powershell
cd $HOME\src
git clone https://github.com/aixin-protocol/aixin-twin.git aixin; cd aixin
Copy-Item docker\.env.example docker\.env
notepad docker\.env               # AIXIN_LLM_BASE_URL=http://host.docker.internal:11434/v1
ollama pull qwen2.5:7b-instruct
pwsh -File .\scripts\aixin-up.ps1
```

To run the app **without** Docker (dev loop on the laptop):

```powershell
bun install
$env:NITRO_PRESET="node-server"; bun run build
node .output\server\index.mjs     # serves on http://localhost:3000
```

**CHECKPOINT B4:** `curl.exe -I http://localhost:8080/` (Docker) or
`http://localhost:3000/` (bare Node) returns 200.

### B5. Windows-specific gotchas

- Keep the repo out of `C:\Users\...` when using WSL — cross-filesystem I/O is 5–10× slower.
- Docker Desktop must be **running** before `aixin-up.ps1`; it does not auto-start on login
  unless you enable it in Settings → General.
- PowerShell 5.1 will choke on this script's syntax — use **PowerShell 7** (`pwsh`).
- Windows Defender Firewall will prompt on first bind; allow on **private** networks only.
- Line endings: run `git config --global core.autocrlf input` before cloning so the shell
  scripts stay LF.

---

## Part C — the day-to-day loop (Manus → Git → Ubuntu / Windows)

Manus stays the development environment. The servers only ever *pull*.

```text
Manus (edit, generate, test)
   │  git push
   ▼
GitHub  aixin-protocol/aixin-twin        (app)
        aixin-protocol/aixin-protocol    (spec + docs mirror)
   │  git pull
   ├──────────────▶ Ubuntu / Alibaba ECS   (production-like)
   └──────────────▶ Windows 11 laptop      (local demo)
```

### C1. Redeploy on Ubuntu after a push

```bash
cd /opt/aixin
git pull --ff-only

# code-only change (no new env, no new migration)
AIXIN_GPU=1 AIXIN_PROFILES="--profile llm --profile supabase" ./scripts/aixin-up.sh

# server-secret change only (no rebuild needed)
docker compose -f docker/compose.yml --env-file docker/.env restart app
```

The script is idempotent and always rebuilds, so it also covers new `VITE_*` values and new
migration files. Deploy takes ~3–6 minutes on warm caches.

### C2. Post-deploy smoke test (run every time — 90 seconds)

```bash
cd /opt/aixin
git log --oneline -1                                  # 1. right commit is deployed
docker compose -f docker/compose.yml --env-file docker/.env ps      # 2. all running
curl -sf -o /dev/null -w '%{http_code}\n' http://localhost/         # 3. expect 200
docker compose -f docker/compose.yml --env-file docker/.env exec -T db \
  psql -U postgres -d aixin -c "select count(*) from public.receipts;"   # 4. schema intact
docker compose -f docker/compose.yml --env-file docker/.env logs --since 5m app \
  | grep -iE 'error|unhandled' | head -20             # 5. no new errors
```

Then click once through **Ask AiXin → Decision Card → approve → receipt** in the browser.

### C3. Rollback

```bash
cd /opt/aixin
git log --oneline -10
git checkout <last-good-sha>
AIXIN_GPU=1 AIXIN_PROFILES="--profile llm --profile supabase" ./scripts/aixin-up.sh
```

Migrations are additive, so a code rollback is safe. If a migration itself was the problem,
restore from the nightly dump:

```bash
gunzip -c /var/backups/aixin-<date>.sql.gz | docker compose -f docker/compose.yml \
  --env-file docker/.env exec -T db psql -U postgres -d aixin
```

### C4. Keep the two repos in sync

`ROADMAP.md`, `SELF_HOSTING.md`, and this runbook must exist identically in
`aixin-protocol/aixin-twin` (app) and `aixin-protocol/aixin-protocol` (spec). The app exposes
`POST /api/public/mirror-roadmap` to mirror doc changes; for anything else, push to both.

---

## Quick troubleshooting index

| Symptom | Cause | Fix |
| --- | --- | --- |
| `docker pull` hangs or times out | Docker Hub blocked | Add/swap `registry-mirrors` in `/etc/docker/daemon.json`, `systemctl restart docker` |
| `could not select device driver ... gpu` | NVIDIA Container Toolkit missing | Redo **A3** |
| Ollama replies but GPU shows 0 % | GPU override not passed | Use `AIXIN_GPU=1` (adds `docker/compose.gpu.yml`) |
| `bun install` extremely slow | npm registry | `NPM_REGISTRY=https://registry.npmmirror.com` in `docker/.env` |
| App loads but every request 401s | wrong `VITE_SUPABASE_PUBLISHABLE_KEY` | Regenerate keys (**A6**) with the *current* `JWT_SECRET`, rebuild |
| Login redirects to the wrong host | `PUBLIC_SITE_URL` / `GOTRUE_SITE_URL` mismatch | Set `PUBLIC_SITE_URL` to the exact origin users type, restart `auth` |
| Blank page, `db` unhealthy | migrations not applied | `./scripts/aixin-up.sh` again, or apply `supabase/migrations/*.sql` in filename order |
| Receipts show "not anchored" | no RPC / anchor key | Expected and honest; set `BSC_TESTNET_RPC_URL` + `BSC_ANCHOR_PRIVATE_KEY` to anchor |
| Chat returns `No LLM configured` | `AIXIN_LLM_BASE_URL` missing from `docker/.env` (and no `LOVABLE_API_KEY`) | Set the three `AIXIN_LLM_*` values, then `docker compose ... restart app` |
| Model OOM / very slow | model too large for the card | Use `qwen2.5:7b-instruct`, or pin one GPU with `CUDA_VISIBLE_DEVICES=0` |
| Site reachable locally, not publicly | ECS security group | Open 80/443 inbound (**A9**) |

---

## Time budget

| Part | First time | Repeat |
| --- | --- | --- |
| Part R RunPod interim | 20–45 min plus model download | 3–6 min |
| A0–A3 host prep | 20 min | — |
| A4–A6 source + env + keys | 20 min | — |
| A7 first build and bring-up | 15–40 min | 3–6 min (C1) |
| A8–A11 verification + hardening | 30 min | 2 min (C2) |
| Part B Windows (WSL2 route) | 45–60 min | 3–6 min |
