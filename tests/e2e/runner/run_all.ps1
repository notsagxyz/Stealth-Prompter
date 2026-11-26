[CmdletBinding()]
param(
    [ValidateSet("1", "2", "3", "4", "5", "1-4", "All")]
    [string]$Tier = "1-4",

    [string]$Filter = "",

    [string]$ReportPath = "",

    [switch]$SkipReport,

    [int]$TimeoutSeconds = 180
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$projectRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..")).Path
$e2eDir = Join-Path $projectRoot "tests\e2e"

if ([string]::IsNullOrWhiteSpace($ReportPath)) {
    $resolvedReportPath = Join-Path $e2eDir "test_report.json"
} elseif ([System.IO.Path]::IsPathRooted($ReportPath)) {
    $resolvedReportPath = $ReportPath
} else {
    $resolvedReportPath = Join-Path $projectRoot $ReportPath
}

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "                  Stealth E2E Master Test Runner                                " -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Target Tier:     $Tier" -ForegroundColor Yellow
if (-not [string]::IsNullOrWhiteSpace($Filter)) {
    Write-Host "Filter:          $Filter" -ForegroundColor Yellow
}
Write-Host "Project Root:    $projectRoot"
Write-Host "Timeout/File:    ${TimeoutSeconds}s"
if ($SkipReport) {
    Write-Host "Report Path:     (Skipped via -SkipReport)`n"
} else {
    Write-Host "Report Path:     $resolvedReportPath`n"
}

$tierDirs = @{
    "1"   = @("tier1_features")
    "2"   = @("tier2_boundaries")
    "3"   = @("tier3_combinations")
    "4"   = @("tier4_scenarios")
    "5"   = @("tier5_adversarial")
    "1-4" = @("tier1_features", "tier2_boundaries", "tier3_combinations", "tier4_scenarios")
    "All" = @("tier1_features", "tier2_boundaries", "tier3_combinations", "tier4_scenarios", "tier5_adversarial")
}

$dirsToScan = $tierDirs[$Tier]
$testFiles = @()

foreach ($dir in $dirsToScan) {
    $fullPath = Join-Path $e2eDir $dir
    $dirFiles = @()
    if (Test-Path $fullPath) {
        $dirFiles = @(Get-ChildItem -Path $fullPath -File | Where-Object { $_.Name -match '\.test\.(js|mjs)$' } | Sort-Object Name)
    }

    if ($dir -eq "tier5_adversarial" -and $dirFiles.Count -eq 0 -and $Tier -eq "All") {
        Write-Host "[NOTICE] tier5_adversarial/ contains 0 test files (pre-M7 Phase 2). Skipping Tier 5 cleanly." -ForegroundColor DarkYellow
        continue
    }

    foreach ($f in $dirFiles) {
        if ([string]::IsNullOrWhiteSpace($Filter) -or ($f.Name -like "*$Filter*") -or ($f.FullName -like "*$Filter*")) {
            $testFiles += $f
        }
    }
}

if ($testFiles.Count -eq 0) {
    Write-Host "ERROR: No test files found for Tier '$Tier' (Filter='$Filter') in $e2eDir" -ForegroundColor Red
    if (-not $SkipReport) {
        $reportDir = Split-Path -Parent $resolvedReportPath
        if ($reportDir -and -not (Test-Path $reportDir)) {
            New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
        }
        $emptyReport = [PSCustomObject]@{
            timestamp   = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
            tier        = $Tier
            filter      = $Filter
            total       = 0
            passed      = 0
            failed      = 0
            skipped     = 0
            duration_ms = 0
            status      = "FAIL"
            results     = @()
        }
        $json = $emptyReport | ConvertTo-Json -Depth 5
        [System.IO.File]::WriteAllText($resolvedReportPath, $json, [System.Text.UTF8Encoding]::new($false))
    }
    exit 1
}

$overallTotal = 0
$overallPassed = 0
$overallFailed = 0
$results = @()
$masterStartTime = Get-Date

Write-Host ("{0,-6} | {1,-46} | {2,5} | {3,5} | {4,5} | {5,7} | {6,8}" -f "Tier", "Test File", "Tests", "Pass", "Fail", "Status", "Time")
Write-Host ("-" * 96)

foreach ($file in $testFiles) {
    $parentDir = Split-Path -Leaf (Split-Path -Parent $file.FullName)
    $fileTier = switch ($parentDir) {
        "tier1_features"     { "1" }
        "tier2_boundaries"   { "2" }
        "tier3_combinations" { "3" }
        "tier4_scenarios"    { "4" }
        "tier5_adversarial"  { "5" }
        default              { "?" }
    }

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $pinfo = New-Object System.Diagnostics.ProcessStartInfo
    $pinfo.FileName = "node"
    $pinfo.Arguments = "--test `"$($file.FullName)`""
    $pinfo.WorkingDirectory = $projectRoot
    $pinfo.RedirectStandardOutput = $true
    $pinfo.RedirectStandardError = $true
    $pinfo.UseShellExecute = $false
    $pinfo.CreateNoWindow = $true
    $pinfo.EnvironmentVariables["E2E_PROJECT_ROOT"] = $projectRoot

    $p = New-Object System.Diagnostics.Process
    $p.StartInfo = $pinfo
    $p.Start() | Out-Null

    $outTask = $p.StandardOutput.ReadToEndAsync()
    $errTask = $p.StandardError.ReadToEndAsync()

    $timeoutMs = [Math]::Max(1000, $TimeoutSeconds * 1000)
    $exited = $p.WaitForExit($timeoutMs)
    $timedOut = $false

    if (-not $exited) {
        $timedOut = $true
        try {
            $procId = $p.Id
            & taskkill.exe /PID $procId /T /F 2>$null | Out-Null
        } catch {
            try { $p.Kill() } catch {}
        }
        $p.WaitForExit(5000) | Out-Null
    } else {
        # Ensure all async output buffers flush
        $p.WaitForExit()
    }

    [System.Threading.Tasks.Task]::WaitAll(@($outTask, $errTask), 5000) | Out-Null
    $sw.Stop()

    $stdout = if ($outTask.IsCompleted -and -not $outTask.IsFaulted) { $outTask.Result } else { "" }
    $stderr = if ($errTask.IsCompleted -and -not $errTask.IsFaulted) { $errTask.Result } else { "" }
    $exitCode = if ($timedOut) { 124 } else { $p.ExitCode }
    $p.Dispose()

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

    # Reject 0-test or pseudo-passed empty files
    $isEmptyFile = ($suitesCount -eq 0 -and $stdout -match "ok \d+ - .*$([regex]::Escape($file.Name))")

    if ($timedOut) {
        if ($testsCount -eq 0) { $testsCount = 1 }
        $failCount = [Math]::Max(1, $testsCount - $passCount)
    } elseif ($testsCount -eq 0 -or $isEmptyFile) {
        $testsCount = 1
        $passCount = 0
        $failCount = 1
    }

    $fileStatus = if (-not $timedOut -and $exitCode -eq 0 -and $failCount -eq 0) { "PASS" } elseif ($timedOut) { "TIMEOUT" } else { "FAIL" }

    $overallTotal += $testsCount
    $overallPassed += $passCount
    $overallFailed += $failCount

    $statusColor = if ($fileStatus -eq "PASS") { "Green" } else { "Red" }
    $formattedLine = "{0,-6} | {1,-46} | {2,5} | {3,5} | {4,5} | {5,7} | {6,6}ms" -f $fileTier, $file.Name, $testsCount, $passCount, $failCount, $fileStatus, [int]$fileDuration
    Write-Host $formattedLine -ForegroundColor $statusColor

    if ($fileStatus -ne "PASS") {
        Write-Host "   --- FAILURE DETAILS ($($file.Name)) ---" -ForegroundColor Red
        if ($timedOut) {
            Write-Host "   TIMEOUT: Process exceeded ${TimeoutSeconds}s limit and was terminated." -ForegroundColor Red
        }
        if ($stderr) { Write-Host $stderr -ForegroundColor DarkRed }
        if ($stdout) {
            $failureLines = $stdout -split "`n" | Where-Object { $_ -match 'not ok|✖|fail|Error|AssertionError' }
            foreach ($fl in ($failureLines | Select-Object -First 25)) {
                Write-Host "   $fl" -ForegroundColor DarkYellow
            }
        }
    }

    $results += [PSCustomObject]@{
        tier        = $fileTier
        file        = $file.Name
        path        = "tests/e2e/$parentDir/$($file.Name)"
        tests       = $testsCount
        passed      = $passCount
        failed      = $failCount
        status      = $fileStatus
        timed_out   = $timedOut
        duration_ms = $fileDuration
    }
}

$masterEndTime = Get-Date
$totalDurationMs = [math]::Round(($masterEndTime - $masterStartTime).TotalMilliseconds, 2)
$overallStatus = if ($overallFailed -eq 0) { "PASS" } else { "FAIL" }

Write-Host ("=" * 96)
$summaryColor = if ($overallStatus -eq "PASS") { "Green" } else { "Red" }
Write-Host ("Summary: Files={0} | Total={1} | Passed={2} | Failed={3} | Duration={4:N2}s | Status={5}" -f $results.Count, $overallTotal, $overallPassed, $overallFailed, ($totalDurationMs / 1000), $overallStatus) -ForegroundColor $summaryColor
Write-Host ("=" * 96)

if (-not $SkipReport) {
    $reportDir = Split-Path -Parent $resolvedReportPath
    if ($reportDir -and -not (Test-Path $reportDir)) {
        New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
    }
    $report = [PSCustomObject]@{
        timestamp   = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        tier        = $Tier
        filter      = $Filter
        total       = $overallTotal
        passed      = $overallPassed
        failed      = $overallFailed
        skipped     = 0
        duration_ms = $totalDurationMs
        status      = $overallStatus
        results     = $results
    }

    $json = $report | ConvertTo-Json -Depth 5
    [System.IO.File]::WriteAllText($resolvedReportPath, $json, [System.Text.UTF8Encoding]::new($false))
    Write-Host "Test report written to: $resolvedReportPath`n"
}

if ($overallStatus -eq "FAIL") {
    exit 1
} else {
    exit 0
}
