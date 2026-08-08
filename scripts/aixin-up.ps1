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
# The server reads SUPABASE_PUBLISHABLE_KEY; fall back to the browser key if unset.
if (-not $cfg['SUPABASE_PUBLISHABLE_KEY']) {
  $env:SUPABASE_PUBLISHABLE_KEY = $cfg['VITE_SUPABASE_PUBLISHABLE_KEY']
}

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

# The app schema references auth.users, so GoTrue must migrate first.
if ($profiles -contains "supabase") {
  Write-Host "==> Waiting for the auth schema (GoTrue migrations)"
  $ready = $false
  for ($i = 0; $i -lt 60 -and -not $ready; $i++) {
    $out = dc exec -T db psql -tAqU postgres -d $dbName -c "select to_regclass('auth.users') is not null" 2>$null
    if ("$out".Trim() -eq "t") { $ready = $true } else { Start-Sleep -Seconds 2 }
  }
  if (-not $ready) { throw "auth.users never appeared. Check: docker compose logs auth" }
  Write-Host "   auth schema ready"
}

Write-Host "==> Applying database migrations"
Get-ChildItem "supabase/migrations/*.sql" | Sort-Object Name | ForEach-Object {
  Get-Content $_.FullName -Raw | dc exec -T db psql -v ON_ERROR_STOP=1 -U postgres -d $dbName | Out-Null
}

Write-Host "==> Restarting the app so it picks up the migrated schema"
dc restart app | Out-Null


Write-Host "==> Status"
dc @profiles ps
Write-Host "AiXin is up. Open http://localhost (or your SITE_ADDRESS)."
