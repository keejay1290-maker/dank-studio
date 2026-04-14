$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$RootDir = Resolve-Path "$ScriptPath\..\..\.."
$TargetFile = Join-Path $RootDir "artifacts\dayz-builder\src\lib\shapeMasterpieces.ts"

function Check-Braces($content) {
    $opens = ($content.ToCharArray() | Where-Object { $_ -eq '{' }).Count
    $closes = ($content.ToCharArray() | Where-Object { $_ -eq '}' }).Count
    if ($opens -ne $closes) {
        Write-Host "ERR: BRACE MISMATCH: $opens opens vs $closes closes."
        return $false
    }
    return $true
}

Write-Host "Auditing Syntax for $TargetFile..."
if (-not (Test-Path $TargetFile)) {
    Write-Host "ERR: Target file not found at $TargetFile"
    exit 1
}
$Content = Get-Content $TargetFile -Raw


Write-Host "Running TS Compiler Audit..."
Set-Location (Join-Path $RootDir "artifacts\dayz-builder")
npx tsc --noEmit


if ($LASTEXITCODE -ne 0) {
    Write-Host "ERR: TSC FAILED."
    exit 1
}

Write-Host "SUCCESS: SYNTAX PERFECT."
exit 0
