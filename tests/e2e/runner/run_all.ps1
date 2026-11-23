[CmdletBinding()]
param(
    [ValidateSet("1", "2", "3", "4", "5", "All")]
    [string]$Tier = "All"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$projectRoot = Resolve-Path (Join-Path $scriptDir "..\..\..")
$e2eDir = Join-Path $projectRoot "tests\e2e"
$reportFile = Join-Path $e2eDir "test_report.json"

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "                Teleprompter E2E Master Test Runner                             " -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Target Tier: $Tier" -ForegroundColor Yellow
Write-Host "Project Root: $projectRoot"
Write-Host "Report Path:  $reportFile`n"

$tierDirs = @{
    "1" = @("tier1_features")
    "2" = @("tier2_boundaries")
    "3" = @("tier3_combinations")
    "4" = @("tier4_scenarios")
    "5" = @("tier5_adversarial")
    "All" = @("tier1_features", "tier2_boundaries", "tier3_combinations", "tier4_scenarios", "tier5_adversarial")
}

$dirsToScan = $tierDirs[$Tier]
$testFiles = @()

foreach ($dir in $dirsToScan) {
    $fullPath = Join-Path $e2eDir $dir
    if (Test-Path $fullPath) {
        $files = Get-ChildItem -Path $fullPath -File | Where-Object { $_.Name -match '\.test\.(js|ts|mjs)$' } | Sort-Object Name
        $testFiles += $files
    }
}

if ($testFiles.Count -eq 0) {
    Write-Host "ERROR: No test files found for Tier $Tier in $e2eDir" -ForegroundColor Red
    $emptyReport = [PSCustomObject]@{
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        tier = $Tier
        total = 0
        passed = 0
        failed = 0
        skipped = 0
        duration_ms = 0
        status = "FAIL"
        results = @()
    }
    $json = $emptyReport | ConvertTo-Json -Depth 5
    [System.IO.File]::WriteAllText($reportFile, $json, [System.Text.UTF8Encoding]::new($false))
    exit 1
}

$overallTotal = 0
$overallPassed = 0
$overallFailed = 0
$results = @()
$masterStartTime = Get-Date

Write-Host ("{0,-6} | {1,-42} | {2,5} | {3,5} | {4,5} | {5,6} | {6,8}" -f "Tier", "Test File", "Tests", "Pass", "Fail", "Status", "Time")
Write-Host ("-" * 82)

foreach ($file in $testFiles) {
    $parentDir = Split-Path -Leaf (Split-Path -Parent $file.FullName)
    $fileTier = switch ($parentDir) {
        "tier1_features" { "1" }
        "tier2_boundaries" { "2" }
        "tier3_combinations" { "3" }
        "tier4_scenarios" { "4" }
        "tier5_adversarial" { "5" }
        default { "?" }
    }

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $pinfo = New-Object System.Diagnostics.ProcessStartInfo
    $pinfo.FileName = "node"
    $pinfo.Arguments = "--test `"$($file.FullName)`""
    $pinfo.RedirectStandardOutput = $true
    $pinfo.RedirectStandardError = $true
    $pinfo.UseShellExecute = $false
    $pinfo.CreateNoWindow = $true

    $p = New-Object System.Diagnostics.Process
    $p.StartInfo = $pinfo
    $p.Start() | Out-Null
    $stdout = $p.StandardOutput.ReadToEnd()
    $stderr = $p.StandardError.ReadToEnd()
    $p.WaitForExit()
    $sw.Stop()

    $exitCode = $p.ExitCode
    $fileDuration = [math]::Round($sw.Elapsed.TotalMilliseconds, 2)

    $testsCount = 0
    $passCount = 0
    $failCount = 0

    $suitesCount = 0
    if ($stdout -match '# suites\s+(\d+)') {
        $suitesCount = [int]$matches[1]
    }
    if ($stdout -match '# tests\s+(\d+)') {
        $testsCount = [int]$matches[1]
    }
    if ($stdout -match '# pass\s+(\d+)') {
        $passCount = [int]$matches[1]
    }
    if ($stdout -match '# fail\s+(\d+)') {
        $failCount = [int]$matches[1]
    }

    # Detect if file had 0 tests or was an empty file pseudo-passed by node test runner
    $isEmptyFile = ($suitesCount -eq 0 -and $stdout -match "ok \d+ - .*$([regex]::Escape($file.Name))")

    if ($testsCount -eq 0 -or $isEmptyFile) {
        # An empty file with 0 tests should not be counted as a passed test
        $testsCount = 1
        $passCount = 0
        $failCount = 1
    }

    $fileStatus = if ($exitCode -eq 0 -and $failCount -eq 0) { "PASS" } else { "FAIL" }

    $overallTotal += $testsCount
    $overallPassed += $passCount
    $overallFailed += $failCount

    $statusColor = if ($fileStatus -eq "PASS") { "Green" } else { "Red" }
    $formattedLine = "{0,-6} | {1,-42} | {2,5} | {3,5} | {4,5} | {5,6} | {6,6}ms" -f $fileTier, $file.Name, $testsCount, $passCount, $failCount, $fileStatus, [int]$fileDuration
    Write-Host $formattedLine -ForegroundColor $statusColor

    if ($fileStatus -eq "FAIL") {
        Write-Host "   --- FAILURE DETAILS ($($file.Name)) ---" -ForegroundColor Red
        if ($stderr) { Write-Host $stderr -ForegroundColor DarkRed }
        if ($stdout) {
            $failureLines = $stdout -split "`n" | Where-Object { $_ -match '✖|fail|Error|AssertionError' }
            foreach ($fl in $failureLines) { Write-Host "   $fl" -ForegroundColor DarkYellow }
        }
    }

    $results += [PSCustomObject]@{
        tier = $fileTier
        file = $file.Name
        path = "tests/e2e/$parentDir/$($file.Name)"
        tests = $testsCount
        passed = $passCount
        failed = $failCount
        status = $fileStatus
        duration_ms = $fileDuration
    }
}

$masterEndTime = Get-Date
$totalDurationMs = [math]::Round(($masterEndTime - $masterStartTime).TotalMilliseconds, 2)
$overallStatus = if ($overallFailed -eq 0) { "PASS" } else { "FAIL" }

Write-Host ("=" * 82)
$summaryColor = if ($overallStatus -eq "PASS") { "Green" } else { "Red" }
Write-Host ("Summary: Total={0} | Passed={1} | Failed={2} | Duration={3:N2}s | Status={4}" -f $overallTotal, $overallPassed, $overallFailed, ($totalDurationMs / 1000), $overallStatus) -ForegroundColor $summaryColor
Write-Host ("=" * 82)

$report = [PSCustomObject]@{
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    tier = $Tier
    total = $overallTotal
    passed = $overallPassed
    failed = $overallFailed
    skipped = 0
    duration_ms = $totalDurationMs
    status = $overallStatus
    results = $results
}

$json = $report | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText($reportFile, $json, [System.Text.UTF8Encoding]::new($false))
Write-Host "Test report written to: $reportFile`n"

if ($overallStatus -eq "FAIL") {
    exit 1
} else {
    exit 0
}
