//! Native Win32 implementation of `WindowPlatform` using Windows 10/11 APIs.

use std::error::Error;

use windows::Win32::Foundation::HWND;
use windows::Win32::Graphics::Dwm::{
    DwmIsCompositionEnabled, DwmSetWindowAttribute, DWMWA_SYSTEMBACKDROP_TYPE,
    DWMSBT_MAINWINDOW, DWMSBT_NONE, DWMSBT_TRANSIENTWINDOW,
};
use windows::Win32::UI::WindowsAndMessaging::{
    GetWindowDisplayAffinity, GetWindowLongPtrW, IsWindow, SetWindowDisplayAffinity,
    SetWindowLongPtrW, SetWindowPos, ShowWindow, GWL_EXSTYLE, HWND_TOP, SWP_FRAMECHANGED,
    SWP_NOACTIVATE, SWP_NOMOVE, SWP_NOSIZE, SWP_NOZORDER, SW_HIDE, SW_SHOWNOACTIVATE,
    WDA_EXCLUDEFROMCAPTURE, WDA_MONITOR, WDA_NONE, WINDOW_DISPLAY_AFFINITY, WS_EX_LAYERED,
    WS_EX_NOACTIVATE, WS_EX_TRANSPARENT,
};

use super::{DisplayAffinity, PlatformError, VibrancyEffect, WindowPlatform};

#[repr(C)]
struct OsVersionInfoExW {
    dw_os_version_info_size: u32,
    dw_major_version: u32,
    dw_minor_version: u32,
    dw_build_number: u32,
    dw_platform_id: u32,
    sz_csd_version: [u16; 128],
    w_service_pack_major: u16,
    w_service_pack_minor: u16,
    w_suite_mask: u16,
    w_product_type: u8,
    w_reserved: u8,
}

#[link(name = "ntdll")]
extern "system" {
    fn RtlGetVersion(lpversioninformation: *mut OsVersionInfoExW) -> i32;
}

/// Retrieves the actual Windows OS build number via ntdll (bypassing application compatibility manifests).
pub fn get_os_build() -> u32 {
    let mut info: OsVersionInfoExW = unsafe { std::mem::zeroed() };
    info.dw_os_version_info_size = std::mem::size_of::<OsVersionInfoExW>() as u32;
    let status = unsafe { RtlGetVersion(&mut info) };
    if status == 0 {
        info.dw_build_number
    } else {
        0
    }
}

/// Checks whether DWM desktop composition is currently active.
pub fn is_dwm_enabled() -> bool {
    unsafe {
        DwmIsCompositionEnabled()
            .map(|enabled| enabled.as_bool())
            .unwrap_or(false)
    }
}

/// Native Win32 window platform driver.
#[derive(Debug, Default, Clone)]
pub struct WindowsPlatform;

impl WindowsPlatform {
    pub fn new() -> Self {
        Self
    }

    /// Validates that an HWND is non-zero, positive, and references an active Win32 window.
    pub fn validate_hwnd(hwnd: isize) -> Result<HWND, Box<dyn Error>> {
        if hwnd == 0 {
            return Err(Box::new(PlatformError::NullHwnd));
        }
        if hwnd < 0 {
            return Err(Box::new(PlatformError::NegativeHwnd(hwnd)));
        }
        let win_hwnd = HWND(hwnd as *mut std::ffi::c_void);
        if !unsafe { IsWindow(win_hwnd) }.as_bool() {
            return Err(Box::new(PlatformError::InvalidWindowHandle(hwnd)));
        }
        Ok(win_hwnd)
    }
}

impl WindowPlatform for WindowsPlatform {
    fn set_display_affinity(&self, hwnd: isize, affinity: DisplayAffinity) -> Result<(), Box<dyn Error>> {
        let win_hwnd = Self::validate_hwnd(hwnd)?;

        if affinity == DisplayAffinity::ExcludeFromCapture {
            let build = get_os_build();
            if build > 0 && build < 19041 {
                return Err(Box::new(PlatformError::UnsupportedOsVersion(build)));
            }
            if !is_dwm_enabled() {
                return Err(Box::new(PlatformError::DwmCompositionDisabled));
            }
        }

        let win_affinity = match affinity {
            DisplayAffinity::None => WDA_NONE,
            DisplayAffinity::Monitor => WDA_MONITOR,
            DisplayAffinity::ExcludeFromCapture => WDA_EXCLUDEFROMCAPTURE,
        };

        unsafe {
            SetWindowDisplayAffinity(win_hwnd, win_affinity)
                .map_err(|e| Box::new(PlatformError::Win32(e.to_string())))?;
        }
        Ok(())
    }

    fn get_display_affinity(&self, hwnd: isize) -> Result<DisplayAffinity, Box<dyn Error>> {
        let win_hwnd = Self::validate_hwnd(hwnd)?;
        let mut raw_affinity: u32 = 0;
        unsafe {
            GetWindowDisplayAffinity(win_hwnd, &mut raw_affinity as *mut u32)
                .map_err(|e| Box::new(PlatformError::Win32(e.to_string())))?;
        }
        let win_affinity = WINDOW_DISPLAY_AFFINITY(raw_affinity);
        let affinity = match win_affinity {
            WDA_NONE => DisplayAffinity::None,
            WDA_MONITOR => DisplayAffinity::Monitor,
            WDA_EXCLUDEFROMCAPTURE => DisplayAffinity::ExcludeFromCapture,
            _ => DisplayAffinity::from_raw(raw_affinity).unwrap_or(DisplayAffinity::None),
        };
        Ok(affinity)
    }

    fn set_click_through(&self, hwnd: isize, enabled: bool) -> Result<(), Box<dyn Error>> {
        let win_hwnd = Self::validate_hwnd(hwnd)?;
        unsafe {
            let ex_style = GetWindowLongPtrW(win_hwnd, GWL_EXSTYLE);
            let new_style = if enabled {
                ex_style | (WS_EX_TRANSPARENT.0 as isize) | (WS_EX_LAYERED.0 as isize)
            } else {
                ex_style & !(WS_EX_TRANSPARENT.0 as isize)
            };
            SetWindowLongPtrW(win_hwnd, GWL_EXSTYLE, new_style);
            let _ = SetWindowPos(
                win_hwnd,
                HWND_TOP,
                0,
                0,
                0,
                0,
                SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE | SWP_FRAMECHANGED,
            );
        }
        Ok(())
    }

    fn set_no_activate(&self, hwnd: isize, enabled: bool) -> Result<(), Box<dyn Error>> {
        let win_hwnd = Self::validate_hwnd(hwnd)?;
        unsafe {
            let ex_style = GetWindowLongPtrW(win_hwnd, GWL_EXSTYLE);
            let new_style = if enabled {
                ex_style | (WS_EX_NOACTIVATE.0 as isize)
            } else {
                ex_style & !(WS_EX_NOACTIVATE.0 as isize)
            };
            SetWindowLongPtrW(win_hwnd, GWL_EXSTYLE, new_style);
            let _ = SetWindowPos(
                win_hwnd,
                HWND_TOP,
                0,
                0,
                0,
                0,
                SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE | SWP_FRAMECHANGED,
            );
        }
        Ok(())
    }

    fn apply_vibrancy(&self, hwnd: isize, effect: VibrancyEffect) -> Result<(), Box<dyn Error>> {
        let win_hwnd = Self::validate_hwnd(hwnd)?;
        let backdrop = match effect {
            VibrancyEffect::None => DWMSBT_NONE.0 as u32,
            VibrancyEffect::Mica => DWMSBT_MAINWINDOW.0 as u32,
            VibrancyEffect::Acrylic { .. } => DWMSBT_TRANSIENTWINDOW.0 as u32,
            VibrancyEffect::Blur => DWMSBT_TRANSIENTWINDOW.0 as u32,
        };
        unsafe {
            let _ = DwmSetWindowAttribute(
                win_hwnd,
                DWMWA_SYSTEMBACKDROP_TYPE,
                &backdrop as *const _ as *const _,
                std::mem::size_of::<u32>() as u32,
            );
        }
        Ok(())
    }

    fn show_unfocused(&self, hwnd: isize) -> Result<(), Box<dyn Error>> {
        let win_hwnd = Self::validate_hwnd(hwnd)?;
        unsafe {
            let _ = ShowWindow(win_hwnd, SW_SHOWNOACTIVATE);
        }
        Ok(())
    }

    fn hide(&self, hwnd: isize) -> Result<(), Box<dyn Error>> {
        let win_hwnd = Self::validate_hwnd(hwnd)?;
        unsafe {
            let _ = ShowWindow(win_hwnd, SW_HIDE);
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_os_build_detection() {
        let build = get_os_build();
        assert!(build > 0, "OS build should be detected on Windows");
    }

    #[test]
    fn test_dwm_status() {
        // DWM is active on modern Windows desktop sessions
        let _dwm = is_dwm_enabled();
    }

    #[test]
    fn test_windows_platform_null_hwnd_rejection() {
        let platform = WindowsPlatform::new();
        let err = platform.set_display_affinity(0, DisplayAffinity::ExcludeFromCapture).unwrap_err();
        assert_eq!(err.downcast_ref::<PlatformError>(), Some(&PlatformError::NullHwnd));
    }

    #[test]
    fn test_windows_platform_negative_hwnd_rejection() {
        let platform = WindowsPlatform::new();
        let err = platform.get_display_affinity(-100).unwrap_err();
        assert_eq!(err.downcast_ref::<PlatformError>(), Some(&PlatformError::NegativeHwnd(-100)));
    }

    #[test]
    fn test_windows_platform_invalid_hwnd_rejection() {
        let platform = WindowsPlatform::new();
        // Arbitrary non-existent handle
        let err = platform.show_unfocused(999_999_999).unwrap_err();
        assert_eq!(err.downcast_ref::<PlatformError>(), Some(&PlatformError::InvalidWindowHandle(999_999_999)));
    }
}
