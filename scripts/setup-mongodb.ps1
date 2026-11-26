param([switch]$InstallCompass)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
function Install-Package([string]$id) {
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        throw "Windows Package Manager (winget) is missing. Install App Installer from Microsoft Store."
    }
    & winget install --id $id --exact --source winget --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) { throw "Installation of $id returned exit code $LASTEXITCODE. Check the installer and rerun." }
}
function Find-Mongosh {
    $cmd = Get-Command mongosh.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $candidates = @("$env:ProgramFiles\mongosh\mongosh.exe", "$env:ProgramFiles\mongosh\bin\mongosh.exe", "$env:LOCALAPPDATA\Programs\mongosh\mongosh.exe", "$env:LOCALAPPDATA\Programs\mongosh\bin\mongosh.exe")
    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) { return $candidate }
    }
    return $null
}
$shell = Find-Mongosh
if (-not $shell) {
    Install-Package 'MongoDB.Shell'
    $env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User') + ';' + $env:Path
    $shell = Find-Mongosh
    if (-not $shell) { throw 'mongosh is not found. Reopen PowerShell and rerun this script.' }
}
$uri = 'mongodb://127.0.0.1:27017/?serverSelectionTimeoutMS=3000'
function Test-Mongo {
    $ErrorActionPreference = 'Continue'
    & $shell $uri --quiet --eval 'db.adminCommand({ping:1}).ok' 2>$null | Out-Null
    return ($LASTEXITCODE -eq 0)
}
if (-not (Test-Mongo)) {
    $service = Get-Service -Name MongoDB -ErrorAction SilentlyContinue
    if (-not $service) {
        Install-Package 'MongoDB.Server'
        $service = Get-Service -Name MongoDB -ErrorAction SilentlyContinue
    }
    if ($service -and $service.Status -ne 'Running') {
        Start-Service -Name MongoDB
    }
    $connected = $false
    for ($i = 0; $i -lt 10; $i++) {
        if (Test-Mongo) { $connected = $true; break }
        Start-Sleep -Seconds 2
    }
    if (-not $connected) { throw 'Cannot connect to local MongoDB. Check the MongoDB service or start your existing server.' }
}
Write-Host 'MongoDB connection successful.' -ForegroundColor Green
& $shell $uri --quiet --file (Join-Path $root 'database\init-safe.js')
if ($LASTEXITCODE -ne 0) { throw 'Database initialization failed. Existing records have not been dropped.' }
if ($InstallCompass) {
    $compass = @("$env:LOCALAPPDATA\MongoDBCompass\MongoDBCompass.exe", "$env:LOCALAPPDATA\Programs\MongoDB Compass\MongoDBCompass.exe", "$env:ProgramFiles\MongoDB Compass\MongoDBCompass.exe")
    if (-not ($compass | Where-Object { Test-Path $_ })) {
        Install-Package 'MongoDB.Compass.Full'
    }
}
Write-Host 'FloodFlow database setup complete. Open Compass and connect to mongodb://127.0.0.1:27017' -ForegroundColor Green
