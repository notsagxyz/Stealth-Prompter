//! Platform abstraction layer for window manipulation and capture exclusion.
//!
//! Decouples Tauri IPC commands and frontend actions from native Win32/OS APIs,
//! enabling headless testing and multi-platform compilation.

use std::error::Error;

pub mod error;
pub mod mock;

#[cfg(target_os = "windows")]
pub mod windows;

pub use error::PlatformError;
pub use mock::{MockPlatformInner, MockWindowPlatform, MockWindowState, PlatformCallRecord};

#[cfg(target_os = "windows")]
pub use windows::WindowsPlatform;

/// Display affinity mode controlling window surface visibility in captures and recordings.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, serde::Serialize, serde::Deserialize)]
pub enum DisplayAffinity {
    /// Window is captured normally. Corresponds to Win32 `WDA_NONE` (0x00000000).
    None,
    /// Window is displayed only on its monitor. Corresponds to Win32 `WDA_MONITOR` (0x00000001).
    Monitor,
    /// Window is completely excluded from screen captures, screen sharing, and recordings.
    /// Corresponds to Win32 `WDA_EXCLUDEFROMCAPTURE` (0x00000011 / 17 decimal).
    ExcludeFromCapture, // 0x00000011 (17)
}

impl DisplayAffinity {
    /// Returns the raw Win32 constant value.
    pub fn to_raw(&self) -> u32 {
        match self {
            DisplayAffinity::None => 0x00000000,
            DisplayAffinity::Monitor => 0x00000001,
            DisplayAffinity::ExcludeFromCapture => 0x00000011,
        }
    }

    /// Converts a raw Win32 display affinity integer flag to `DisplayAffinity`.
    /// Rejects any unrecognized or invalid bitflags.
    pub fn from_raw(raw: u32) -> Result<Self, PlatformError> {
        match raw {
            0x00000000 => Ok(DisplayAffinity::None),
            0x00000001 => Ok(DisplayAffinity::Monitor),
            0x00000011 => Ok(DisplayAffinity::ExcludeFromCapture),
            _ => Err(PlatformError::InvalidAffinityFlag(raw)),
        }
    }

    /// Returns true if this mode excludes the window from screen capture.
    pub fn is_excluded(&self) -> bool {
        matches!(self, DisplayAffinity::ExcludeFromCapture)
    }
}

/// Visual vibrancy / blur effects applied to the window background.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, serde::Serialize, serde::Deserialize)]
pub enum VibrancyEffect {
    /// No background effect (standard transparency or solid).
    None,
    /// Windows 11 Mica material backdrop.
    Mica,
    /// Windows 10/11 Acrylic material backdrop with RGBA tint.
    Acrylic { r: u8, g: u8, b: u8, a: u8 },
    /// Standard Gaussian window blur backdrop.
    Blur,
}

/// Core platform trait abstracting OS window operations.
///
/// Implementations must be thread-safe (`Send + Sync`) to allow shared access
/// via Tauri managed state across asynchronous IPC command handlers.
pub trait WindowPlatform: Send + Sync {
    fn set_display_affinity(&self, hwnd: isize, affinity: DisplayAffinity) -> Result<(), Box<dyn Error>>;
    fn get_display_affinity(&self, hwnd: isize) -> Result<DisplayAffinity, Box<dyn Error>>;
    fn set_click_through(&self, hwnd: isize, enabled: bool) -> Result<(), Box<dyn Error>>;
    fn set_no_activate(&self, hwnd: isize, enabled: bool) -> Result<(), Box<dyn Error>>;
    fn apply_vibrancy(&self, hwnd: isize, effect: VibrancyEffect) -> Result<(), Box<dyn Error>>;
    fn show_unfocused(&self, hwnd: isize) -> Result<(), Box<dyn Error>>;
    fn hide(&self, hwnd: isize) -> Result<(), Box<dyn Error>>;
}

pub fn create_platform() -> Box<dyn WindowPlatform> {
    #[cfg(target_os = "windows")]
    {
        Box::new(WindowsPlatform::new())
    }
    #[cfg(not(target_os = "windows"))]
    {
        Box::new(MockWindowPlatform::new())
    }
}
