#!/usr/bin/env bash
# AiXin one-click Docker setup (Linux / macOS / WSL2)
#
#   ./scripts/aixin-up.sh              # app + db + proxy + local LLM (CPU)
#   AIXIN_GPU=1 ./scripts/aixin-up.sh  # same, with NVIDIA GPU acceleration
#   AIXIN_PROFILES="--profile llm --profile supabase" ./scripts/aixin-up.sh
set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE=docker/.env
if [ ! -f "$ENV_FILE" ]; then
  cp docker/.env.example "$ENV_FILE"
  echo "Created $ENV_FILE from the example. Edit secrets, then re-run this script."
  exit 0
fi
# Values from docker/.env drive the psql calls below too.
set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a
DB_NAME=${POSTGRES_DB:-aixin}
# The server reads SUPABASE_PUBLISHABLE_KEY; fall back to the browser key if unset.
export SUPABASE_PUBLISHABLE_KEY=${SUPABASE_PUBLISHABLE_KEY:-${VITE_SUPABASE_PUBLISHABLE_KEY:-}}

COMPOSE_FILES=(-f docker/compose.yml)
if [ "${AIXIN_GPU:-0}" = "1" ]; then
  COMPOSE_FILES+=(-f docker/compose.gpu.yml)
  echo "==> GPU override enabled (docker/compose.gpu.yml)"
fi

PROFILES=${AIXIN_PROFILES:---profile llm}
dc() { docker compose "${COMPOSE_FILES[@]}" --env-file "$ENV_FILE" "$@"; }

echo "==> Building and starting AiXin stack ($PROFILES)"
# shellcheck disable=SC2086
dc $PROFILES up -d --build

if [[ "$PROFILES" == *llm* ]]; then
  MODEL=${AIXIN_LLM_MODEL:-qwen2.5:7b-instruct}
  echo "==> Pulling local model $MODEL (first run only)"
  dc exec -T ollama ollama pull "$MODEL" || \
    echo "   (model pull failed — run it manually later)"
fi

# The app schema references auth.users, so GoTrue must have created the auth
# schema before any migration is applied.
if [[ "$PROFILES" == *supabase* ]]; then
  echo "==> Waiting for the auth schema (GoTrue migrations)"
  for _ in $(seq 1 60); do
    if dc exec -T db psql -tAqU postgres -d "$DB_NAME" \
        -c "select to_regclass('auth.users') is not null" 2>/dev/null | grep -q '^t$'; then
      echo "   auth schema ready"
      break
    fi
    sleep 2
  done
  if ! dc exec -T db psql -tAqU postgres -d "$DB_NAME" \
      -c "select to_regclass('auth.users') is not null" 2>/dev/null | grep -q '^t$'; then
    echo "ERROR: auth.users never appeared. Check: dc logs auth" >&2
    exit 1
  fi
fi

echo "==> Applying database migrations"
for f in supabase/migrations/*.sql; do
  [ -e "$f" ] || continue
  dc exec -T db psql -v ON_ERROR_STOP=1 -U postgres -d "$DB_NAME" < "$f" >/dev/null || \
    echo "   skipped (already applied): $f"
done

echo "==> Restarting the app so it picks up the migrated schema"
dc restart app >/dev/null


echo "==> Status"
dc $PROFILES ps
echo "AiXin is up. Open http://localhost (or your SITE_ADDRESS)."
