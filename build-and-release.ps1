param (
    [string]$Tag = "",
    [string]$Notes = ""
)

$ErrorActionPreference = "Stop"

# 1. Determine Tag version from package.json if not provided
if ([string]::IsNullOrWhiteSpace($Tag)) {
    if (Test-Path "package.json") {
        $pkgJson = Get-Content -Raw -Path "package.json" | ConvertFrom-Json
        $version = $pkgJson.version
        $Tag = "v$version"
    } else {
        $Tag = "v1.0.0"
    }
}

# Generate rich notes from git log if none provided
if ([string]::IsNullOrWhiteSpace($Notes)) {
    $commits = git log -n 5 --pretty=format:"- %s"
    $Notes = @"
## 🚀 Що нового у версії $Tag

### 📝 Останні зміни:
$commits

---

### 📦 Завантаження:
- **Portable EXE**: Запуск без встановлення (один автономний файл).
- **Setup EXE**: Інсталятор 1-клік із ярликами в Робочому столі.
- **ZIP**: Повний розпакований архів.
"@
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Building & Releasing Power Automate Visualizer ($Tag)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 2. Build the Portable EXE & Installers
Write-Host "[1/3] Running 'npm run dist' to build targets..." -ForegroundColor Yellow
Get-Process "Power Automate Visualizer" -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -Recurse -Force dist_electron -ErrorAction SilentlyContinue
npm run dist

$artifacts = Get-ChildItem -Path "dist_electron\*" -Include "*.exe","*.zip" -File | Select-Object -ExpandProperty FullName

if ($artifacts.Count -eq 0) {
    Write-Error "Build failed: No release artifacts found in 'dist_electron'"
    exit 1
}

Write-Host "[2/3] Built release artifacts successfully:" -ForegroundColor Green
foreach ($art in $artifacts) {
    Write-Host "  - $art" -ForegroundColor Green
}

# 3. Create GitHub Release
Write-Host "[3/3] Publishing Release '$Tag' to GitHub..." -ForegroundColor Yellow

$releaseExists = $false
try {
    $existing = gh release view $Tag --json tagName 2>$null
    if ($existing) { $releaseExists = $true }
} catch {
    $releaseExists = $false
}

if ($releaseExists) {
    Write-Host "Release '$Tag' already exists. Uploading assets..." -ForegroundColor Yellow
    foreach ($art in $artifacts) {
        gh release upload $Tag $art --clobber
    }
    gh release edit $Tag --notes $Notes
} else {
    gh release create $Tag $artifacts `
        --title "Power Automate Visualizer $Tag" `
        --notes $Notes
}

# Ensure release is published (not draft)
gh release edit $Tag --draft=false

Write-Host "========================================" -ForegroundColor Green
Write-Host " Release $Tag published successfully!" -ForegroundColor Green
Write-Host " Check it out at: https://github.com/Homka13/PowerAutomate-Descriptor/releases" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
