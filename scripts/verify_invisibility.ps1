<#
.SYNOPSIS
    Automated Invisibility & Screen Capture Exclusion Verification Script for Stealth.
.DESCRIPTION
    Verifies pixel-level window invisibility under Windows Desktop Window Manager (DWM)
    using the Win32 SetWindowDisplayAffinity API with WDA_EXCLUDEFROMCAPTURE = 0x00000011 (17).
    Deploys a high-contrast #FF00FF (Pure Magenta) probe window and uses a resilient dual-engine
    capture pipeline (GDI CopyFromScreen with automatic fallback to Win32 PrintWindow PW_RENDERFULLCONTENT).
    Validates that with affinity = 0 (WDA_NONE) the window is fully visible in capture, and with
    affinity = 17 (WDA_EXCLUDEFROMCAPTURE) zero canary pixels leak into capture buffers.
    Generates a structured JSON report and returns standard CI/CD exit codes (0 = PASS, 1 = FAIL, 2 = ERROR).
.PARAMETER Engine
    Capture engine: "Auto", "GDI", "PrintWindow", "FFmpeg", or "DXGI". Default is "Auto".
.PARAMETER Mode
    Execution mode: "Canary", "SelfTest", or "AttachWindow". Default is "Canary".
.PARAMETER Canary
    Switch to force canary probe window self-test mode.
.PARAMETER Hwnd
    Target window handle (for AttachWindow mode).
.PARAMETER ProcessName
    Target process name to discover window handle (default "stealth").
.PARAMETER CanaryHex
    Canary color hex string (default "#FF00FF").
.PARAMETER Tolerance
    Color distance tolerance per channel (default 5).
.PARAMETER ReportPath
    Destination file path for structured JSON report (default "scripts/invisibility_report.json").
.PARAMETER NonInteractive
    Suppresses interactive console prompts for automated CI/CD runs.
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts\verify_invisibility.ps1 -Canary
    powershell -ExecutionPolicy Bypass -File scripts\verify_invisibility.ps1 -Engine Auto -ReportPath scripts\invisibility_report.json
#>

[CmdletBinding()]
param(
    [ValidateSet("Auto", "GDI", "PrintWindow", "FFmpeg", "DXGI")]
    [string]$Engine = "Auto",

    [ValidateSet("Canary", "SelfTest", "AttachWindow")]
    [string]$Mode = "Canary",

    [switch]$Canary,

    [IntPtr]$Hwnd = [IntPtr]::Zero,

    [string]$ProcessName = "stealth",

    [string]$CanaryHex = "#FF00FF",

    [int]$Tolerance = 5,

    [string]$ReportPath = "scripts/invisibility_report.json",

    [switch]$NonInteractive
)

# Enforce Canary mode if switch is provided
if ($Canary) {
    $Mode = "Canary"
}

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "      Stealth Invisibility Verification Suite (WDA_EXCLUDEFROMCAPTURE)          " -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Mode:        $Mode" -ForegroundColor Gray
Write-Host "Engine:      $Engine" -ForegroundColor Gray
Write-Host "Canary Hex:  $CanaryHex" -ForegroundColor Gray
Write-Host "Tolerance:   $Tolerance" -ForegroundColor Gray
Write-Host "Report Path: $ReportPath" -ForegroundColor Gray
Write-Host ""

# Ensure System.Drawing and Windows Forms assemblies are loaded
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

# Define Win32 P/Invoke Native Type if not already loaded in session
if (-not ([System.Management.Automation.PSTypeName]'Stealth.InvisibilityNative').Type) {
    $nativeSource = @"
using System;
using System.Drawing;
using System.Runtime.InteropServices;

namespace Stealth {
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
        public int Width { get { return Right - Left; } }
        public int Height { get { return Bottom - Top; } }
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct OSVERSIONINFOEXW {
        public int dwOSVersionInfoSize;
        public int dwMajorVersion;
        public int dwMinorVersion;
        public int dwBuildNumber;
        public int dwPlatformId;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 128)]
        public string szCSDVersion;
        public ushort wServicePackMajor;
        public ushort wServicePackMinor;
        public ushort wSuiteMask;
        public byte wProductType;
        public byte wReserved;
    }

    public static class InvisibilityNative {
        [DllImport("ntdll.dll")]
        public static extern int RtlGetVersion(ref OSVERSIONINFOEXW lpVersionInformation);

        [DllImport("dwmapi.dll", PreserveSig = false)]
        public static extern int DwmIsCompositionEnabled(out bool pfEnabled);

        [DllImport("user32.dll", SetLastError = true)]
        public static extern bool SetWindowDisplayAffinity(IntPtr hWnd, uint dwAffinity);

        [DllImport("user32.dll", SetLastError = true)]
        public static extern bool GetWindowDisplayAffinity(IntPtr hWnd, out uint pdwAffinity);

        [DllImport("user32.dll", SetLastError = true)]
        public static extern bool PrintWindow(IntPtr hwnd, IntPtr hdcBlt, uint nFlags);

        [DllImport("user32.dll")]
        public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

        [DllImport("user32.dll")]
        public static extern bool IsWindow(IntPtr hWnd);

        public const uint WDA_NONE = 0x00000000;
        public const uint WDA_MONITOR = 0x00000001;
        public const uint WDA_EXCLUDEFROMCAPTURE = 0x00000011; // 17 decimal
        public const uint PW_RENDERFULLCONTENT = 0x00000002;

        public static uint GetOsBuild() {
            OSVERSIONINFOEXW os = new OSVERSIONINFOEXW();
            os.dwOSVersionInfoSize = Marshal.SizeOf(os);
            if (RtlGetVersion(ref os) == 0) {
                return (uint)os.dwBuildNumber;
            }
            return 0;
        }
    }
}
"@
    Add-Type -TypeDefinition $nativeSource
}

# --- Helper Functions ---

function Parse-HexColor([string]$hex) {
    $clean = $hex.Trim().TrimStart('#')
    if ($clean.Length -ne 6) {
        throw "Invalid hex color format: '$hex'. Expected 6-character hex code (e.g. #FF00FF)."
    }
    $r = [Convert]::ToInt32($clean.Substring(0, 2), 16)
    $g = [Convert]::ToInt32($clean.Substring(2, 2), 16)
    $b = [Convert]::ToInt32($clean.Substring(4, 2), 16)
    return [System.Drawing.Color]::FromArgb(255, $r, $g, $b)
}

function Test-PixelCanary([System.Drawing.Color]$c, [System.Drawing.Color]$target, [int]$tol) {
    if ($c.A -eq 0) { return $false } # Ignore fully transparent pixels
    $dr = [Math]::Abs([int]$c.R - [int]$target.R)
    $dg = [Math]::Abs([int]$c.G - [int]$target.G)
    $db = [Math]::Abs([int]$c.B - [int]$target.B)
    return ($dr -le $tol -and $dg -le $tol -and $db -le $tol)
}

function Get-ClippedRegion([int]$x, [int]$y, [int]$width, [int]$height, [int]$screenWidth, [int]$screenHeight) {
    $left = [Math]::Max(0, [Math]::Min($x, $screenWidth))
    $top = [Math]::Max(0, [Math]::Min($y, $screenHeight))
    $right = [Math]::Max(0, [Math]::Min($x + $width, $screenWidth))
    $bottom = [Math]::Max(0, [Math]::Min($y + $height, $screenHeight))

    return [PSCustomObject]@{
        X = $left
        Y = $top
        Width = [Math]::Max(0, $right - $left)
        Height = [Math]::Max(0, $bottom - $top)
        WasClipped = ($left -ne $x -or $top -ne $y -or ($right - $left) -ne $width -or ($bottom - $top) -ne $height)
    }
}

function Capture-WindowBitmap([IntPtr]$targetHwnd, [System.Drawing.Rectangle]$bounds, [string]$requestedEngine) {
    $effectiveEngine = $requestedEngine
    $bmp = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

    if ($requestedEngine -eq "GDI" -or $requestedEngine -eq "Auto") {
        try {
            $g = [System.Drawing.Graphics]::FromImage($bmp)
            $g.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
            $g.Dispose()
            $effectiveEngine = "GDI"
            return @{ Bitmap = $bmp; EngineUsed = $effectiveEngine }
        }
        catch {
            # In headless, locked, or background virtual sessions, CopyFromScreen fails with Win32 error 6/5
            if ($requestedEngine -eq "GDI") {
                $bmp.Dispose()
                throw "GDI CopyFromScreen failed: $($_.Exception.Message)"
            }
            # Fallback to PrintWindow
            $effectiveEngine = "PrintWindow"
        }
    }

    if ($effectiveEngine -eq "PrintWindow" -or $effectiveEngine -eq "Auto") {
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $hdc = $g.GetHdc()
        $pwSuccess = [Stealth.InvisibilityNative]::PrintWindow($targetHwnd, $hdc, [Stealth.InvisibilityNative]::PW_RENDERFULLCONTENT)
        $g.ReleaseHdc($hdc)
        $g.Dispose()

        if (-not $pwSuccess) {
            # Fallback attempt with default flags (0)
            $g = [System.Drawing.Graphics]::FromImage($bmp)
            $hdc = $g.GetHdc()
            [Stealth.InvisibilityNative]::PrintWindow($targetHwnd, $hdc, 0) | Out-Null
            $g.ReleaseHdc($hdc)
            $g.Dispose()
        }
        return @{ Bitmap = $bmp; EngineUsed = "PrintWindow" }
    }

    if ($requestedEngine -eq "FFmpeg") {
        # Check if ffmpeg is available
        $ffmpegPath = Get-Command "ffmpeg" -ErrorAction SilentlyContinue
        if ($ffmpegPath) {
            $tempFile = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "sp_probe_$([Guid]::NewGuid().ToString('N')).png")
            $cmd = "ffmpeg -f gdigrab -i desktop -vframes 1 -y `"$tempFile`""
            Invoke-Expression $cmd | Out-Null
            if (Test-Path $tempFile) {
                $fullBmp = [System.Drawing.Bitmap]::FromFile($tempFile)
                $g = [System.Drawing.Graphics]::FromImage($bmp)
                $g.DrawImage($fullBmp, 0, 0, $bounds, [System.Drawing.GraphicsUnit]::Pixel)
                $g.Dispose()
                $fullBmp.Dispose()
                Remove-Item -Force $tempFile -ErrorAction SilentlyContinue
                return @{ Bitmap = $bmp; EngineUsed = "FFmpeg" }
            }
        }
        # Fallback to PrintWindow
        return Capture-WindowBitmap -targetHwnd $targetHwnd -bounds $bounds -requestedEngine "PrintWindow"
    }

    if ($requestedEngine -eq "DXGI") {
        # Emulated DXGI pipeline fallback to PrintWindow in pure PowerShell environment
        return Capture-WindowBitmap -targetHwnd $targetHwnd -bounds $bounds -requestedEngine "PrintWindow"
    }

    return @{ Bitmap = $bmp; EngineUsed = $effectiveEngine }
}

function Analyze-BitmapForCanary([System.Drawing.Bitmap]$bmp, [System.Drawing.Color]$targetColor, [int]$tol) {
    $canaryCount = 0
    $nonBlackCount = 0
    $totalPixels = $bmp.Width * $bmp.Height

    # Fast sampling using LockBits
    $rect = New-Object System.Drawing.Rectangle(0, 0, $bmp.Width, $bmp.Height)
    $bmpData = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $byteCount = [Math]::Abs($bmpData.Stride) * $bmp.Height
    $bytes = New-Object byte[] $byteCount
    [System.Runtime.InteropServices.Marshal]::Copy($bmpData.Scan0, $bytes, 0, $byteCount)
    $bmp.UnlockBits($bmpData)

    for ($i = 0; $i -lt $byteCount; $i += 4) {
        $b = $bytes[$i]
        $g = $bytes[$i + 1]
        $r = $bytes[$i + 2]
        $a = $bytes[$i + 3]

        if ($r -gt 0 -or $g -gt 0 -or $b -gt 0) {
            $nonBlackCount++
        }

        if ($a -gt 0) {
            $dr = [Math]::Abs([int]$r - [int]$targetColor.R)
            $dg = [Math]::Abs([int]$g - [int]$targetColor.G)
            $db = [Math]::Abs([int]$b - [int]$targetColor.B)
            if ($dr -le $tol -and $dg -le $tol -and $db -le $tol) {
                $canaryCount++
            }
        }
    }

    return @{
        CanaryCount = $canaryCount
        NonBlackCount = $nonBlackCount
        TotalPixels = $totalPixels
        IsAllBlack = ($nonBlackCount -eq 0)
    }
}

# --- Step 1: Environment & Kernel Prerequisites Check ---
Write-Host "[1/5] Checking OS Build and DWM Composition..." -ForegroundColor Yellow
$osBuild = [Stealth.InvisibilityNative]::GetOsBuild()
$dwmEnabled = $false
try {
    [Stealth.InvisibilityNative]::DwmIsCompositionEnabled([ref]$dwmEnabled) | Out-Null
} catch {
    $dwmEnabled = $true
}

Write-Host "  -> OS Build: $osBuild (Windows 10 Build >= 19041 required for WDA_EXCLUDEFROMCAPTURE)" -ForegroundColor Gray
Write-Host "  -> DWM Composition: $(if ($dwmEnabled) {'Active'} else {'Disabled'})" -ForegroundColor Gray

if ($osBuild -lt 19041 -and $osBuild -ne 0) {
    Write-Host "ERROR: WDA_EXCLUDEFROMCAPTURE (0x00000011 / 17) requires Windows 10 Build 19041+ or Windows 11. Current build: $osBuild." -ForegroundColor Red
    $errorReport = @{
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        status = "ERROR"
        exitCode = 2
        osBuild = $osBuild
        dwmEnabled = $dwmEnabled
        error = "Unsupported Windows build: $osBuild. WDA_EXCLUDEFROMCAPTURE requires Build 19041+."
    } | ConvertTo-Json -Depth 5
    $reportDir = [System.IO.Path]::GetDirectoryName($ReportPath)
    if ($reportDir -and -not (Test-Path $reportDir)) { New-Item -ItemType Directory -Path $reportDir -Force | Out-Null }
    [System.IO.File]::WriteAllText($ReportPath, $errorReport, [System.Text.Encoding]::UTF8)
    exit 2
}

# --- Step 2: Initialize Target Window or Canary Probe ---
Write-Host "[2/5] Initializing Test Window (Mode: $Mode)..." -ForegroundColor Yellow
$canaryColor = Parse-HexColor -hex $CanaryHex
$probeForm = $null
$targetHwnd = [IntPtr]::Zero
$windowBounds = [System.Drawing.Rectangle]::Empty

if ($Mode -eq "Canary" -or $Mode -eq "SelfTest") {
    $probeForm = New-Object System.Windows.Forms.Form
    $probeForm.Text = "Stealth Invisibility Canary Probe"
    $probeForm.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::None
    $probeForm.BackColor = $canaryColor
    $probeForm.Size = New-Object System.Drawing.Size(250, 150)
    $probeForm.StartPosition = [System.Windows.Forms.FormStartPosition]::Manual
    $probeForm.Location = New-Object System.Drawing.Point(100, 100)
    $probeForm.TopMost = $true
    $probeForm.ShowInTaskbar = $false
    $probeForm.Show()
    [System.Windows.Forms.Application]::DoEvents()
    Start-Sleep -Milliseconds 150

    $targetHwnd = $probeForm.Handle
    $windowBounds = $probeForm.Bounds
    Write-Host "  -> Created WinForms Canary Window (HWND: $targetHwnd, Bounds: $($windowBounds.ToString()), Color: $CanaryHex)" -ForegroundColor Green
} else {
    # AttachWindow Mode
    if ($Hwnd -ne [IntPtr]::Zero) {
        $targetHwnd = $Hwnd
    } else {
        $proc = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero } | Select-Object -First 1
        if ($proc) {
            $targetHwnd = $proc.MainWindowHandle
        }
    }

    if ($targetHwnd -eq [IntPtr]::Zero -or -not [Stealth.InvisibilityNative]::IsWindow($targetHwnd)) {
        Write-Host "ERROR: Target window not found or invalid HWND." -ForegroundColor Red
        exit 2
    }

    $rect = New-Object Stealth.RECT
    [Stealth.InvisibilityNative]::GetWindowRect($targetHwnd, [ref]$rect) | Out-Null
    $windowBounds = New-Object System.Drawing.Rectangle($rect.Left, $rect.Top, $rect.Width, $rect.Height)
    Write-Host "  -> Attached to target window HWND: $targetHwnd (Bounds: $($windowBounds.ToString()))" -ForegroundColor Green
}

# --- Step 3: Control Phase (Affinity = 0 / WDA_NONE) ---
Write-Host "[3/5] Running Control Phase (Affinity = 0 / WDA_NONE)..." -ForegroundColor Yellow
$setAffinity0 = [Stealth.InvisibilityNative]::SetWindowDisplayAffinity($targetHwnd, [Stealth.InvisibilityNative]::WDA_NONE)
[uint32]$queryAffinity0 = 999
[Stealth.InvisibilityNative]::GetWindowDisplayAffinity($targetHwnd, [ref]$queryAffinity0) | Out-Null

if ($probeForm) { [System.Windows.Forms.Application]::DoEvents() }
Start-Sleep -Milliseconds 100

$controlCapture = Capture-WindowBitmap -targetHwnd $targetHwnd -bounds $windowBounds -requestedEngine $Engine
$controlAnalysis = Analyze-BitmapForCanary -bmp $controlCapture.Bitmap -targetColor $canaryColor -tol $Tolerance
$controlCapture.Bitmap.Dispose()

Write-Host "  -> Control Affinity Set: $setAffinity0 | Query Affinity: $queryAffinity0" -ForegroundColor Gray
Write-Host "  -> Engine Used: $($controlCapture.EngineUsed)" -ForegroundColor Gray
Write-Host "  -> Canary Pixels Found: $($controlAnalysis.CanaryCount) / $($controlAnalysis.TotalPixels)" -ForegroundColor Gray

$controlPassed = ($controlAnalysis.CanaryCount -gt 0)
if (-not $controlPassed) {
    Write-Host "  [WARN] Control phase did not detect canary pixels! (Capture may be blocked or obscured)" -ForegroundColor Red
} else {
    Write-Host "  [OK] Control phase visible in capture as expected." -ForegroundColor Green
}

# --- Step 4: Test Phase (Affinity = 17 / WDA_EXCLUDEFROMCAPTURE) ---
Write-Host "[4/5] Running Test Phase (Affinity = 17 / WDA_EXCLUDEFROMCAPTURE)..." -ForegroundColor Yellow
$setAffinity17 = [Stealth.InvisibilityNative]::SetWindowDisplayAffinity($targetHwnd, [Stealth.InvisibilityNative]::WDA_EXCLUDEFROMCAPTURE)
[uint32]$queryAffinity17 = 999
[Stealth.InvisibilityNative]::GetWindowDisplayAffinity($targetHwnd, [ref]$queryAffinity17) | Out-Null

if ($probeForm) { [System.Windows.Forms.Application]::DoEvents() }
Start-Sleep -Milliseconds 150

$testCapture = Capture-WindowBitmap -targetHwnd $targetHwnd -bounds $windowBounds -requestedEngine $Engine
$testAnalysis = Analyze-BitmapForCanary -bmp $testCapture.Bitmap -targetColor $canaryColor -tol $Tolerance
$testCapture.Bitmap.Dispose()

Write-Host "  -> Test Affinity Set: $setAffinity17 | Query Affinity: $queryAffinity17" -ForegroundColor Gray
Write-Host "  -> Engine Used: $($testCapture.EngineUsed)" -ForegroundColor Gray
Write-Host "  -> Canary Pixels Found: $($testAnalysis.CanaryCount) / $($testAnalysis.TotalPixels)" -ForegroundColor Gray

# Cleanup probe form
if ($probeForm) {
    $probeForm.Close()
    $probeForm.Dispose()
    $probeForm = $null
}

# Evaluate Pass/Fail
$testPassed = ($testAnalysis.CanaryCount -eq 0 -and $queryAffinity17 -eq 17)
$overallPass = ($controlPassed -and $testPassed)

# --- Step 5: Generate Report and Exit Code ---
Write-Host "[5/5] Synthesizing Invisibility Report..." -ForegroundColor Yellow

$statusStr = if ($overallPass) { "PASS" } else { "FAIL" }
$exitCode = if ($overallPass) { 0 } else { 1 }

$summaryText = if ($overallPass) {
    "Window with WDA_EXCLUDEFROMCAPTURE (17) is 100% excluded from screen capture (0 leaked canary pixels)."
} else {
    "Invisibility verification failed: Control phase passed=$controlPassed, Test phase canary leak=$($testAnalysis.CanaryCount) pixels."
}

$reportObject = [PSCustomObject]@{
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    status = $statusStr
    exitCode = $exitCode
    osBuild = $osBuild
    dwmEnabled = $dwmEnabled
    engine = $testCapture.EngineUsed
    canaryHex = $CanaryHex
    tolerance = $Tolerance
    phases = [PSCustomObject]@{
        control = [PSCustomObject]@{
            affinity = 0
            affinityName = "WDA_NONE"
            canaryPixelsFound = $controlAnalysis.CanaryCount
            totalSampled = $controlAnalysis.TotalPixels
            isVisibleInCapture = ($controlAnalysis.CanaryCount -gt 0)
        }
        test = [PSCustomObject]@{
            affinity = 17
            affinityName = "WDA_EXCLUDEFROMCAPTURE"
            canaryPixelsFound = $testAnalysis.CanaryCount
            totalSampled = $testAnalysis.TotalPixels
            isExcludedFromCapture = ($testAnalysis.CanaryCount -eq 0)
        }
    }
    summary = $summaryText
}

$reportDir = [System.IO.Path]::GetDirectoryName($ReportPath)
if ($reportDir -and -not (Test-Path $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
}

$reportJson = $reportObject | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText($ReportPath, $reportJson, [System.Text.Encoding]::UTF8)

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
if ($overallPass) {
    Write-Host "   RESULT: PASS (Exit Code 0)                                                  " -ForegroundColor Green
    Write-Host "   Window surface completely excluded from capture via WDA_EXCLUDEFROMCAPTURE! " -ForegroundColor Green
} else {
    Write-Host "   RESULT: FAIL (Exit Code 1)                                                  " -ForegroundColor Red
    Write-Host "   $summaryText" -ForegroundColor Red
}
Write-Host "   Report generated at: $ReportPath" -ForegroundColor Gray
Write-Host "================================================================================" -ForegroundColor Cyan

exit $exitCode
