# AiXin one-click Docker setup (Windows 11 / PowerShell 7+)
# Usage:
#   pwsh -File .\scripts\aixin-up.ps1
#   $env:AIXIN_GPU=1; pwsh -File .\scripts\aixin-up.ps1     # NVIDIA GPU host
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$envFile = "docker/.env"
if (-not (Test-Path $envFile)) {
  Copy-Item "docker/.env.example" $envFile
  Write-Host "Created $envFile from the example. Edit secrets, then re-run this script."
  exit 0
}

# Read docker/.env into a hashtable so we can reuse values below.
$cfg = @{}
Get-Content $envFile | Where-Object { $_ -match '^\s*[^#\s][^=]*=' } | ForEach-Object {
  $parts = $_.Split('=', 2); $cfg[$parts[0].Trim()] = $parts[1].Trim()
}
$dbName = if ($cfg['POSTGRES_DB']) { $cfg['POSTGRES_DB'] } else { "aixin" }
$model  = if ($cfg['AIXIN_LLM_MODEL']) { $cfg['AIXIN_LLM_MODEL'] } else { "qwen2.5:7b-instruct" }

$files = @("-f", "docker/compose.yml")
if ($env:AIXIN_GPU -eq "1") {
  $files += @("-f", "docker/compose.gpu.yml")
  Write-Host "==> GPU override enabled (docker/compose.gpu.yml)"
}
$profiles = if ($env:AIXIN_PROFILES) { $env:AIXIN_PROFILES -split ' ' } else { @("--profile", "llm") }

function dc { docker compose @files --env-file $envFile @args }

Write-Host "==> Building and starting AiXin stack"
dc @profiles up -d --build

if ($profiles -contains "llm") {
  Write-Host "==> Pulling local model $model (first run only)"
  dc exec -T ollama ollama pull $model
}

Write-Host "==> Applying database migrations"
Get-ChildItem "supabase/migrations/*.sql" | Sort-Object Name | ForEach-Object {
  Get-Content $_.FullName -Raw | dc exec -T db psql -v ON_ERROR_STOP=1 -U postgres -d $dbName | Out-Null
}

Write-Host "==> Status"
dc @profiles ps
Write-Host "AiXin is up. Open http://localhost (or your SITE_ADDRESS)."
