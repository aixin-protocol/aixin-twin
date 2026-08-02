#!/usr/bin/env bash
# AiXin one-click Docker setup (Linux / macOS / WSL2)
set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE=docker/.env
if [ ! -f "$ENV_FILE" ]; then
  cp docker/.env.example "$ENV_FILE"
  echo "Created $ENV_FILE from the example. Edit secrets, then re-run this script."
  exit 0
fi

PROFILES=${AIXIN_PROFILES:---profile llm}
echo "==> Building and starting AiXin stack ($PROFILES)"
# shellcheck disable=SC2086
docker compose -f docker/compose.yml --env-file "$ENV_FILE" $PROFILES up -d --build

if [[ "$PROFILES" == *llm* ]]; then
  MODEL=$(grep -E '^AIXIN_LLM_MODEL=' "$ENV_FILE" | cut -d= -f2-)
  MODEL=${MODEL:-qwen2.5:7b-instruct}
  echo "==> Pulling local model $MODEL (first run only)"
  docker compose -f docker/compose.yml --env-file "$ENV_FILE" exec -T ollama ollama pull "$MODEL" || \
    echo "   (model pull failed — run it manually later)"
fi

echo "==> Applying database migrations"
for f in supabase/migrations/*.sql; do
  [ -e "$f" ] || continue
  docker compose -f docker/compose.yml --env-file "$ENV_FILE" exec -T db \
    psql -v ON_ERROR_STOP=1 -U postgres -d "${POSTGRES_DB:-aixin}" < "$f" >/dev/null || \
    echo "   skipped (already applied): $f"
done

echo "==> Status"
docker compose -f docker/compose.yml --env-file "$ENV_FILE" ps
echo "AiXin is up. Open http://localhost (or your SITE_ADDRESS)."
