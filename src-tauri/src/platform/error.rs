//! Platform error types matching boundary test specifications.

use thiserror::Error;

/// Enumeration of platform errors matching E2E test assertions.
#[derive(Error, Debug, Clone, PartialEq, Eq)]
pub enum PlatformError {
    #[error("Null HWND: Window handle cannot be 0 (NULL).")]
    NullHwnd,

    #[error("Negative HWND: {0} is an invalid window handle.")]
    NegativeHwnd(isize),

    #[error("WindowNotFound: No active window registered with HWND {0}.")]
    WindowNotFound(isize),

    #[error("InvalidWindowHandle: Window {0} has been destroyed (Win32 ERROR_INVALID_WINDOW_HANDLE 1400).")]
    InvalidWindowHandle(isize),

    #[error("InvalidAffinityFlag: 0x{0:x} is not a valid Win32 display affinity value.")]
    InvalidAffinityFlag(u32),

    #[error("UnsupportedOsVersion: WDA_EXCLUDEFROMCAPTURE requires Windows 10 Build 19041 (Version 2004) or later. Detected OS build: {0}.")]
    UnsupportedOsVersion(u32),

    #[error("DwmCompositionDisabled: DWM composition is inactive. Window cannot be excluded from capture.")]
    DwmCompositionDisabled,

    #[error("Win32 Error {code}: {message}")]
    Win32ApiError { code: u32, message: String },

    #[error("Win32 error: {0}")]
    Win32(String),

    #[error("InjectedFault: {0}")]
    InjectedFault(String),

    #[error("LockPoisoned: Internal lock poisoned: {0}")]
    LockPoisoned(String),
}
