# Stealth Prompter — Screen Share & Recording Invisibility Verification Guide

This short guide walks you through verifying that **Stealth** is completely invisible to your audience using **WDA_EXCLUDEFROMCAPTURE** on Windows 10 (build 19041+) and Windows 11.

## 1. Automated Probe (Already Verified)

Run our native Win32 DWM probe:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\verify_invisibility.ps1
```

Expected result: `Canary Pixels Found: 0 / 37500` when `WDA_EXCLUDEFROMCAPTURE` is active.

## 2. Verify with OBS Studio

1. Launch `stealth.exe` and click **Start** (or press `Alt+H`) so the floating prompter window is visible on your screen.
2. Open **OBS Studio**.
3. Add a **Display Capture** source in your active Scene.
4. Confirm in the OBS preview that your desktop and other windows appear normally, while **Stealth** is completely absent (100% invisible in OBS).
5. Optionally toggle **Screen Capture Stealth** to *Visible* in Stealth's Settings to confirm it reappears immediately, then set it back to *Hidden*.

## 3. Verify with Xbox Game Bar (Win+G)

1. With the **Stealth** prompter window open on screen, press **`Win+G`** to open **Xbox Game Bar**.
2. Click **Capture -> Start Recording** (or `Win+Alt+R`), read a few lines while scrolling, and stop the recording.
3. Open the recorded `.mp4` in `Videos\Captures` and verify that the Stealth prompter overlay does not appear anywhere in the video.
