$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "`n=== LeadHunter - Verificacao de Deploy ===`n" -ForegroundColor Cyan

$envFile = Join-Path $root 'backend\.env'
$required = @('SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'SUPABASE_DB_PASSWORD')
$missing = @()

if (-not (Test-Path $envFile)) {
  Write-Host "ERRO: backend/.env nao encontrado" -ForegroundColor Red
  Write-Host "Copie backend/.env.example e preencha as variaveis.`n"
  exit 1
}

$envContent = Get-Content $envFile -Raw
foreach ($key in $required) {
  if ($envContent -notmatch "$key=.+") {
    $missing += $key
  }
}

if ($missing.Count -gt 0) {
  Write-Host "ERRO: Variaveis faltando em backend/.env:" -ForegroundColor Red
  $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
  exit 1
}

Write-Host "OK  backend/.env configurado" -ForegroundColor Green

Write-Host "`nBuild backend..." -ForegroundColor Cyan
Push-Location (Join-Path $root 'backend')
npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }
Pop-Location
Write-Host "OK  backend build" -ForegroundColor Green

Write-Host "`nBuild frontend..." -ForegroundColor Cyan
Push-Location (Join-Path $root 'frontend')
npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }
Pop-Location
Write-Host "OK  frontend build" -ForegroundColor Green

Write-Host "`n=== Pronto para deploy! ===`n" -ForegroundColor Green
Write-Host "Siga os 3 passos em DEPLOY.md:`n"
Write-Host "  1. Render  -> dashboard.render.com/blueprints" -ForegroundColor White
Write-Host "  2. Vercel  -> vercel.com/new" -ForegroundColor White
Write-Host "  3. CORS    -> FRONTEND_URL no Render`n" -ForegroundColor White
Write-Host "Login: admin / leadhunter123`n" -ForegroundColor DarkGray
