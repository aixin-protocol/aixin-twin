# AiXin one-click Docker setup (Windows 11 / PowerShell 7+)
# Usage:  pwsh -File .\scripts\aixin-up.ps1
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$envFile = "docker/.env"
if (-not (Test-Path $envFile)) {
  Copy-Item "docker/.env.example" $envFile
  Write-Host "Created $envFile from the example. Edit secrets, then re-run this script."
  exit 0
}

$profiles = if ($env:AIXIN_PROFILES) { $env:AIXIN_PROFILES -split ' ' } else { @("--profile", "llm") }

Write-Host "==> Building and starting AiXin stack"
docker compose -f docker/compose.yml --env-file $envFile @profiles up -d --build

if ($profiles -contains "llm") {
  $model = (Select-String -Path $envFile -Pattern '^AIXIN_LLM_MODEL=' | Select-Object -First 1)
  $model = if ($model) { $model.Line.Split('=', 2)[1] } else { "qwen2.5:7b-instruct" }
  Write-Host "==> Pulling local model $model (first run only)"
  docker compose -f docker/compose.yml --env-file $envFile exec -T ollama ollama pull $model
}

Write-Host "==> Applying database migrations"
Get-ChildItem "supabase/migrations/*.sql" | Sort-Object Name | ForEach-Object {
  Get-Content $_.FullName -Raw | docker compose -f docker/compose.yml --env-file $envFile `
    exec -T db psql -v ON_ERROR_STOP=1 -U postgres -d aixin | Out-Null
}

Write-Host "==> Status"
docker compose -f docker/compose.yml --env-file $envFile ps
Write-Host "AiXin is up. Open http://localhost (or your SITE_ADDRESS)."
