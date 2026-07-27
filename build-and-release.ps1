param (
    [string]$Tag = ""
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

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Building & Releasing Power Automate Visualizer ($Tag)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 2. Build the Portable EXE
Write-Host "[1/3] Running 'npm run dist' to build Portable EXE..." -ForegroundColor Yellow
npm run dist

$exePath = "dist_electron\Power Automate Visualizer-Portable.exe"

if (-not (Test-Path $exePath)) {
    Write-Error "Build failed: Exe file not found at '$exePath'"
    exit 1
}

Write-Host "[2/3] Built executable successfully: $exePath" -ForegroundColor Green

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
    Write-Host "Release '$Tag' already exists. Uploading asset..." -ForegroundColor Yellow
    gh release upload $Tag "$exePath#Power Automate Visualizer-Portable.exe" --clobber
} else {
    gh release create $Tag "$exePath#Power Automate Visualizer-Portable.exe" `
        --title "Power Automate Visualizer $Tag" `
        --notes "Standalone Portable Executable for Windows. Download and run without installation."
}

Write-Host "========================================" -ForegroundColor Green
Write-Host " Release $Tag published successfully!" -ForegroundColor Green
Write-Host " Check it out at: https://github.com/Homka13/PowerAutomate-Descriptor/releases" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
