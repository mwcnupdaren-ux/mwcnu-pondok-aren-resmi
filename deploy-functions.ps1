# ============================================================
# Deploy 9 Edge Functions modul konsultasi + CORS allowlist terbaru.
# CLI dipatok ke supabase@3.2.0 (versi lokal yang sudah diaudit).
#
# verify-nia TIDAK termasuk dalam skrip ini: fungsi tersebut berada di luar
# modul konsultasi dan harus di-deploy terpisah setelah keputusan + pengujian
# NIA (lihat PHASE2_BACKEND.md §9.0.1).
#
# Pakai:
#   1) Buat Access Token: https://supabase.com/dashboard/account/tokens
#   2) Siapkan di lingkungan shell (nilai TIDAK boleh dicetak):
#        SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
#        SUPABASE_ANON_KEY atau SUPABASE_PUBLISHABLE_KEY,
#        CONSULTATION_SECRET_PEPPER
#   3) Jalankan:
#        $env:SUPABASE_ACCESS_TOKEN = "sbp_..."
#        .\deploy-functions.ps1
#
# Skrip berhenti pada kegagalan pertama dan menampilkan ringkasan.
# Tidak ada rollback otomatis; deployment TIDAK bersifat atomik.
# Konfigurasi verify_jwt mengikuti PHASE2_BACKEND.md §9:
#   - fungsi pemohon/anonim : --no-verify-jwt
#   - fungsi staf           : JWT gateway aktif (default)
# ============================================================
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$Ref = 'wvfcifqolohfipvepxss'
$Cli = 'supabase@3.2.0'

# Flag global --yes tersedia pada `link` dan `functions deploy` di CLI 3.2.0
# (diverifikasi dari bantuan --help lokal). Dipakai agar tidak bergantung prompt.
$Yes = '--yes'

function Tampilkan-Ringkasan {
  $ok = if ($script:Berhasil.Count -gt 0) { $script:Berhasil -join ', ' } else { '(tidak ada)' }
  $gagal = if ($script:Gagal.Count -gt 0) { $script:Gagal -join ', ' } else { '(tidak ada)' }
  $belum = if ($script:Belum.Count -gt 0) { $script:Belum -join ', ' } else { '(tidak ada)' }
  Write-Host "`n==> Ringkasan deployment" -ForegroundColor Yellow
  Write-Host "  Berhasil diproses : $ok"
  Write-Host "  Gagal             : $gagal"
  Write-Host "  Belum diproses    : $belum"
}

function Invoke-Deploy {
  param(
    [Parameter(Mandatory = $true)][string]$Nama,
    [switch]$Publik
  )

  Write-Host "==> Deploy $Nama" -ForegroundColor Green
  if ($Publik) {
    npx $Cli functions deploy $Nama --no-verify-jwt $Yes
  } else {
    npx $Cli functions deploy $Nama $Yes
  }
  if ($LASTEXITCODE -ne 0) {
    $script:Gagal += $Nama
    # Function yang gagal sudah diproses: keluarkan dari daftar belum diproses
    # agar tidak muncul di dua kategori simultan pada ringkasan.
    $script:Belum = @($script:Belum | Where-Object { $_ -ne $Nama })
    Tampilkan-Ringkasan
    # Peringatan parsial hanya relevan bila ada function sebelumnya yang sukses.
    if ($script:Berhasil.Count -gt 0) {
      Write-Host 'PERINGATAN: function yang berhasil sebelumnya MUNGKIN sudah aktif di remote.' -ForegroundColor Red
      Write-Host 'Kondisi remote dapat menjadi campuran versi (function baru + lama). Tidak ada rollback otomatis.' -ForegroundColor Red
    }
    exit $LASTEXITCODE
  }
  $script:Berhasil += $Nama
  $script:Belum = @($script:Belum | Where-Object { $_ -ne $Nama })
}

# --- Preflight A: access token (keberadaan saja, nilai tidak pernah dicetak) ---
if (-not $env:SUPABASE_ACCESS_TOKEN) {
  Write-Host "SUPABASE_ACCESS_TOKEN belum diset." -ForegroundColor Yellow
  Write-Host "Ambil token di https://supabase.com/dashboard/account/tokens lalu jalankan:" -ForegroundColor Yellow
  Write-Host '  $env:SUPABASE_ACCESS_TOKEN = "sbp_..."' -ForegroundColor Cyan
  exit 1
}

# --- Preflight B: project reference ---
# CLI 3.2.0 memperlakukan nilai 20 huruf kecil sebagai project ref.
if ($Ref -notmatch '^[a-z]{20}$') {
  Write-Host 'Format project reference tidak valid (harus 20 huruf kecil).' -ForegroundColor Red
  exit 1
}
Write-Host "Target project (project reference): $Ref" -ForegroundColor Yellow
Write-Host 'Ini project yang akan dihubungkan oleh perintah link. Hentikan bila bukan project yang dimaksud.' -ForegroundColor Yellow

# --- Preflight C: secret wajib (hanya status; nilai tidak disimpan/dicetak) ---
$Wajib = @('SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'CONSULTATION_SECRET_PEPPER')
$KunciPublik = @('SUPABASE_ANON_KEY', 'SUPABASE_PUBLISHABLE_KEY')
$Missing = @()
foreach ($n in $Wajib) {
  if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($n))) { $Missing += $n }
}
$adaKunciPublik = $false
foreach ($n in $KunciPublik) {
  if (-not [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($n))) { $adaKunciPublik = $true }
}
if (-not $adaKunciPublik) { $Missing += 'SUPABASE_ANON_KEY atau SUPABASE_PUBLISHABLE_KEY' }
if ($Missing.Count -gt 0) {
  Write-Host "Variabel wajib belum tersedia: $($Missing -join ', ')" -ForegroundColor Red
  Write-Host 'Periksa lingkungan shell lalu ulangi. Nilai variabel tidak dicetak.' -ForegroundColor Red
  exit 1
}
Write-Host 'Preflight lingkungan: variabel wajib tersedia (nilai tidak dicetak).' -ForegroundColor Green
Write-Host 'CATATAN: ini hanya status LOKAL. Secret remote harus diverifikasi terpisah sebelum deployment.' -ForegroundColor Yellow

# --- Preflight D: prasyarat scope token (tidak divalidasi otomatis) ---
Write-Host 'Prasyarat token: izin link project dan deploy Edge Functions harus tersedia. Scope TIDAK divalidasi otomatis oleh skrip ini.' -ForegroundColor Yellow

# --- Daftar eksplisit sembilan function ---
$Publik = @(
  'consultation-public',
  'consultation-ticket-create',
  'consultation-ticket-access',
  'consultation-ticket-message',
  'consultation-attachment'
)
$Staf = @(
  'consultation-admin',
  'consultation-consultant',
  'consultation-review',
  'consultation-publication'
)
$SemuaFunction = @($Publik + $Staf)
$script:Berhasil = @()
$script:Gagal = @()
$script:Belum = @($SemuaFunction)

# --- Link: bila gagal, hentikan sebelum function pertama ---
Write-Host "==> Link project $Ref" -ForegroundColor Green
npx $Cli link --project-ref $Ref $Yes
if ($LASTEXITCODE -ne 0) {
  Tampilkan-Ringkasan
  Write-Host 'Link gagal: tidak ada function yang di-deploy.' -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host '==> Deploy fungsi publik (verify_jwt=false)' -ForegroundColor Green
foreach ($fn in $Publik) { Invoke-Deploy -Nama $fn -Publik }

Write-Host '==> Deploy fungsi staf (verify_jwt=true)' -ForegroundColor Green
foreach ($fn in $Staf) { Invoke-Deploy -Nama $fn }

Tampilkan-Ringkasan

# --- Smoke test manual (bukan request otomatis; tanpa token/secret) ---
Write-Host "`n==> Selesai. Verifikasi manual HTTP dan CORS SETELAH deployment:" -ForegroundColor Green
Write-Host '  curl.exe -i -X OPTIONS "https://wvfcifqolohfipvepxss.supabase.co/functions/v1/consultation-public" -H "Origin: https://mwcnupondokaren.or.id" -H "Access-Control-Request-Method: POST"' -ForegroundColor Cyan
Write-Host '  Harapan: HTTP 204, access-control-allow-origin: https://mwcnupondokaren.or.id, dan allow-methods memuat POST.' -ForegroundColor DarkGray
Write-Host '  Jalankan manual; periksa status HTTP dan header CORS. Rujuk PHASE2_BACKEND.md §9.1 untuk uji fungsi lainnya.' -ForegroundColor DarkGray
