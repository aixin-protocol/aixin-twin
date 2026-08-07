#!/usr/bin/env bash
# AiXin interim RunPod deployment.
# Intended for a RunPod Secure Cloud GPU Pod with /workspace on persistent storage.
set -euo pipefail

APP_DIR=${AIXIN_APP_DIR:-/workspace/aixin}
ENV_FILE=${AIXIN_ENV_FILE:-$APP_DIR/runpod/aixin.local}
STATE_DIR=${AIXIN_STATE_DIR:-/workspace/aixin-state}
LOG_DIR="$STATE_DIR/logs"
MODEL_DIR="$STATE_DIR/ollama-models"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE"
  echo "Run: cp $APP_DIR/runpod/.env.example $ENV_FILE"
  echo "Then edit every <...> value and rerun this script."
  exit 1
fi

mkdir -p "$LOG_DIR" "$MODEL_DIR"
cd "$APP_DIR"

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

required=(VITE_SUPABASE_URL VITE_SUPABASE_PUBLISHABLE_KEY VITE_SUPABASE_PROJECT_ID SUPABASE_URL)
for name in "${required[@]}"; do
  value=${!name:-}
  if [ -z "$value" ] || [[ "$value" == *"<"* ]]; then
    echo "Set $name in $ENV_FILE before continuing."
    exit 1
  fi
done

export BUN_INSTALL=${BUN_INSTALL:-/workspace/.bun}
export PATH="$BUN_INSTALL/bin:$PATH"
if ! command -v bun >/dev/null 2>&1; then
  echo "==> Installing Bun on persistent storage"
  curl -fsSL https://bun.sh/install | bash
fi

if ! command -v ollama >/dev/null 2>&1; then
  echo "==> Installing Ollama"
  curl -fsSL https://ollama.com/install.sh | sh
fi

export OLLAMA_HOST=127.0.0.1:11434
export OLLAMA_MODELS="$MODEL_DIR"
if ! curl -fsS http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
  echo "==> Starting private Ollama service"
  nohup ollama serve >"$LOG_DIR/ollama.log" 2>&1 &
  echo $! >"$STATE_DIR/ollama.pid"
  for _ in $(seq 1 60); do
    curl -fsS http://127.0.0.1:11434/api/tags >/dev/null 2>&1 && break
    sleep 1
  done
fi

if ! curl -fsS http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
  echo "Ollama failed to start. Read $LOG_DIR/ollama.log"
  exit 1
fi

MODEL=${AIXIN_LLM_MODEL:-qwen2.5:14b-instruct}
echo "==> Ensuring model is present: $MODEL"
ollama pull "$MODEL"

echo "==> Installing dependencies and building AiXin"
bun install --frozen-lockfile
NITRO_PRESET=node-server bun run build

if [ -f "$STATE_DIR/app.pid" ]; then
  old_pid=$(cat "$STATE_DIR/app.pid")
  if kill -0 "$old_pid" 2>/dev/null; then
    kill "$old_pid"
    for _ in $(seq 1 20); do
      kill -0 "$old_pid" 2>/dev/null || break
      sleep 1
    done
  fi
fi

echo "==> Starting AiXin on port ${PORT:-3000}"
nohup bun .output/server/index.mjs >"$LOG_DIR/app.log" 2>&1 &
echo $! >"$STATE_DIR/app.pid"

for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:${PORT:-3000}/" >/dev/null 2>&1; then
    echo "AiXin is ready. Open the RunPod HTTP service for port ${PORT:-3000}."
    echo "Logs: tail -f $LOG_DIR/app.log"
    exit 0
  fi
  sleep 1
done

echo "AiXin did not become ready. Read $LOG_DIR/app.log"
exit 1
