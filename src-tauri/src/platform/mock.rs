//! Headless mock implementation of `WindowPlatform` for unit and CI testing.

use std::collections::HashMap;
use std::error::Error;
use std::sync::{Arc, RwLock};

use super::error::PlatformError;
use super::{DisplayAffinity, VibrancyEffect, WindowPlatform};

/// Recorded call entry for tracking and asserting platform method invocations.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PlatformCallRecord {
    pub method: String,
    pub hwnd: isize,
    pub details: String,
}

/// Simulated internal state of a single window.
#[derive(Debug, Clone, PartialEq)]
pub struct MockWindowState {
    pub hwnd: isize,
    pub affinity: DisplayAffinity,
    pub click_through: bool,
    pub no_activate: bool,
    pub vibrancy: VibrancyEffect,
    pub visible: bool,
    pub unfocused: bool,
    pub destroyed: bool,
    pub opacity: f64,
}

impl Default for MockWindowState {
    fn default() -> Self {
        Self {
            hwnd: 0,
            affinity: DisplayAffinity::None,
            click_through: false,
            no_activate: false,
            vibrancy: VibrancyEffect::None,
            visible: false,
            unfocused: false,
            destroyed: false,
            opacity: 1.0,
        }
    }
}

/// Shared internal state wrapped in `Arc<RwLock<...>>`.
#[derive(Debug)]
pub struct MockPlatformInner {
    pub windows: HashMap<isize, MockWindowState>,
    pub auto_register: bool,
    pub os_build: u32,
    pub dwm_enabled: bool,
    pub error_injection: HashMap<String, PlatformError>,
    pub error_injection_once: HashMap<String, PlatformError>,
    pub call_log: Vec<PlatformCallRecord>,
}

impl Default for MockPlatformInner {
    fn default() -> Self {
        Self {
            windows: HashMap::new(),
            auto_register: true,
            os_build: 22631, // Modern Windows default (Build >= 19041)
            dwm_enabled: true,
            error_injection: HashMap::new(),
            error_injection_once: HashMap::new(),
            call_log: Vec::new(),
        }
    }
}

/// Headless `WindowPlatform` mock implementation.
///
/// Designed with thread-safe interior mutability (`Arc<RwLock<MockPlatformInner>>`).
/// Safe to clone and share across threads, async IPC commands, and test runners.
#[derive(Debug, Clone, Default)]
pub struct MockWindowPlatform {
    inner: Arc<RwLock<MockPlatformInner>>,
}

impl MockWindowPlatform {
    /// Creates a new lenient mock that automatically registers valid HWNDs on first access.
    pub fn new() -> Self {
        Self {
            inner: Arc::new(RwLock::new(MockPlatformInner::default())),
        }
    }

    /// Creates a strict mock requiring explicit `register_window` calls before operations.
    pub fn new_strict() -> Self {
        let inner = MockPlatformInner {
            auto_register: false,
            ..Default::default()
        };
        Self {
            inner: Arc::new(RwLock::new(inner)),
        }
    }

    /// Creates a mock with explicit OS build and DWM composition settings.
    pub fn with_options(os_build: u32, dwm_enabled: bool) -> Self {
        let inner = MockPlatformInner {
            os_build,
            dwm_enabled,
            ..Default::default()
        };
        Self {
            inner: Arc::new(RwLock::new(inner)),
        }
    }

    /// Explicitly registers a new window handle in the mock.
    pub fn register_window(&self, hwnd: isize) -> Result<(), PlatformError> {
        Self::validate_hwnd(hwnd)?;
        let mut guard = self.inner.write().map_err(|e| PlatformError::LockPoisoned(e.to_string()))?;
        let state = MockWindowState {
            hwnd,
            ..Default::default()
        };
        guard.windows.insert(hwnd, state);
        Ok(())
    }

    /// Marks a window handle as destroyed, causing subsequent operations to fail with Win32 1400.
    pub fn destroy_window(&self, hwnd: isize) -> Result<(), PlatformError> {
        Self::validate_hwnd(hwnd)?;
        let mut guard = self.inner.write().map_err(|e| PlatformError::LockPoisoned(e.to_string()))?;
        let win = guard.windows.get_mut(&hwnd).ok_or(PlatformError::WindowNotFound(hwnd))?;
        if win.destroyed {
            return Err(PlatformError::InvalidWindowHandle(hwnd));
        }
        win.destroyed = true;
        Ok(())
    }

    /// Injects a persistent error for a given method name.
    pub fn inject_error(&self, method: &str, error: PlatformError) -> Result<(), PlatformError> {
        let mut guard = self.inner.write().map_err(|e| PlatformError::LockPoisoned(e.to_string()))?;
        guard.error_injection.insert(method.to_string(), error);
        Ok(())
    }

    /// Injects a one-shot error that fails the next invocation and is then cleared.
    pub fn inject_error_once(&self, method: &str, error: PlatformError) -> Result<(), PlatformError> {
        let mut guard = self.inner.write().map_err(|e| PlatformError::LockPoisoned(e.to_string()))?;
        guard.error_injection_once.insert(method.to_string(), error);
        Ok(())
    }

    /// Clears all injected errors.
    pub fn clear_injected_errors(&self) -> Result<(), PlatformError> {
        let mut guard = self.inner.write().map_err(|e| PlatformError::LockPoisoned(e.to_string()))?;
        guard.error_injection.clear();
        guard.error_injection_once.clear();
        Ok(())
    }

    /// Simulates a specific Windows OS build number (e.g. 18363 for pre-2004 legacy OS).
    pub fn set_os_build(&self, build: u32) -> Result<(), PlatformError> {
        let mut guard = self.inner.write().map_err(|e| PlatformError::LockPoisoned(e.to_string()))?;
        guard.os_build = build;
        Ok(())
    }

    /// Simulates enabling or disabling DWM desktop composition.
    pub fn set_dwm_enabled(&self, enabled: bool) -> Result<(), PlatformError> {
        let mut guard = self.inner.write().map_err(|e| PlatformError::LockPoisoned(e.to_string()))?;
        guard.dwm_enabled = enabled;
        Ok(())
    }

    /// Sets window alpha opacity (0.0 - 1.0) for testing pairwise combinations.
    pub fn set_opacity(&self, hwnd: isize, opacity: f64) -> Result<(), PlatformError> {
        Self::validate_hwnd(hwnd)?;
        let mut guard = self.inner.write().map_err(|e| PlatformError::LockPoisoned(e.to_string()))?;
        let win = guard.windows.get_mut(&hwnd).ok_or(PlatformError::WindowNotFound(hwnd))?;
        if win.destroyed {
            return Err(PlatformError::InvalidWindowHandle(hwnd));
        }
        win.opacity = opacity.clamp(0.0, 1.0);
        Ok(())
    }

    /// Retrieves window alpha opacity.
    pub fn get_opacity(&self, hwnd: isize) -> Option<f64> {
        let guard = self.inner.read().ok()?;
        guard.windows.get(&hwnd).map(|w| w.opacity)
    }

    /// Returns a copy of the current state of a window, if it exists.
    pub fn get_window_state(&self, hwnd: isize) -> Option<MockWindowState> {
        let guard = self.inner.read().ok()?;
        guard.windows.get(&hwnd).cloned()
    }

    /// Checks if a window is visible.
    pub fn is_visible(&self, hwnd: isize) -> bool {
        self.get_window_state(hwnd).map(|s| s.visible).unwrap_or(false)
    }

    /// Checks if a window was shown unfocused.
    pub fn is_unfocused(&self, hwnd: isize) -> bool {
        self.get_window_state(hwnd).map(|s| s.unfocused).unwrap_or(false)
    }

    /// Checks if click-through is enabled.
    pub fn is_click_through(&self, hwnd: isize) -> bool {
        self.get_window_state(hwnd).map(|s| s.click_through).unwrap_or(false)
    }

    /// Checks if no-activate style is enabled.
    pub fn is_no_activate(&self, hwnd: isize) -> bool {
        self.get_window_state(hwnd).map(|s| s.no_activate).unwrap_or(false)
    }

    /// Returns the complete invocation call log.
    pub fn get_call_log(&self) -> Vec<PlatformCallRecord> {
        self.inner.read().map(|g| g.call_log.clone()).unwrap_or_default()
    }

    /// Returns the number of times a specific platform method was called.
    pub fn call_count(&self, method: &str) -> usize {
        self.inner
            .read()
            .map(|g| g.call_log.iter().filter(|r| r.method == method).count())
            .unwrap_or(0)
    }

    /// Clears the recorded call log.
    pub fn clear_call_log(&self) -> Result<(), PlatformError> {
        let mut guard = self.inner.write().map_err(|e| PlatformError::LockPoisoned(e.to_string()))?;
        guard.call_log.clear();
        Ok(())
    }

    /// Handles window recreation across display or DPI changes.
    pub fn handle_window_recreation(&self, old_hwnd: isize, new_hwnd: isize) -> Result<(), Box<dyn Error>> {
        let prev_affinity = {
            let guard = self.inner.read().map_err(|e| Box::new(PlatformError::LockPoisoned(e.to_string())) as Box<dyn Error>)?;
            guard.windows.get(&old_hwnd).map(|s| s.affinity).unwrap_or(DisplayAffinity::None)
        };
        {
            let mut guard = self.inner.write().map_err(|e| Box::new(PlatformError::LockPoisoned(e.to_string())) as Box<dyn Error>)?;
            guard.windows.remove(&old_hwnd);
        }
        self.register_window(new_hwnd)?;
        self.set_display_affinity(new_hwnd, prev_affinity)?;
        Ok(())
    }

    // --- Internal Helpers ---

    fn validate_hwnd(hwnd: isize) -> Result<(), PlatformError> {
        if hwnd == 0 {
            return Err(PlatformError::NullHwnd);
        }
        if hwnd < 0 {
            return Err(PlatformError::NegativeHwnd(hwnd));
        }
        Ok(())
    }

    fn check_injected_error(guard: &mut MockPlatformInner, method: &str) -> Result<(), Box<dyn Error>> {
        if let Some(err) = guard.error_injection_once.remove(method) {
            return Err(Box::new(err));
        }
        if let Some(err) = guard.error_injection.get(method) {
            return Err(Box::new(err.clone()));
        }
        Ok(())
    }

    fn ensure_window_mut(
        guard: &mut MockPlatformInner,
        hwnd: isize,
    ) -> Result<&mut MockWindowState, Box<dyn Error>> {
        Self::validate_hwnd(hwnd).map_err(|e| Box::new(e) as Box<dyn Error>)?;

        if !guard.windows.contains_key(&hwnd) {
            if guard.auto_register {
                let initial = MockWindowState {
                    hwnd,
                    ..Default::default()
                };
                guard.windows.insert(hwnd, initial);
            } else {
                return Err(Box::new(PlatformError::WindowNotFound(hwnd)));
            }
        }

        let win = guard.windows.get_mut(&hwnd).unwrap();
        if win.destroyed {
            return Err(Box::new(PlatformError::InvalidWindowHandle(hwnd)));
        }
        Ok(win)
    }

    fn check_window_read(
        guard: &MockPlatformInner,
        hwnd: isize,
    ) -> Result<&MockWindowState, Box<dyn Error>> {
        Self::validate_hwnd(hwnd).map_err(|e| Box::new(e) as Box<dyn Error>)?;

        let win = guard.windows.get(&hwnd).ok_or_else(|| {
            Box::new(PlatformError::WindowNotFound(hwnd)) as Box<dyn Error>
        })?;

        if win.destroyed {
            return Err(Box::new(PlatformError::InvalidWindowHandle(hwnd)));
        }
        Ok(win)
    }
}

impl WindowPlatform for MockWindowPlatform {
    fn set_display_affinity(&self, hwnd: isize, affinity: DisplayAffinity) -> Result<(), Box<dyn Error>> {
        let mut guard = self.inner.write().map_err(|e| Box::new(PlatformError::LockPoisoned(e.to_string())) as Box<dyn Error>)?;
        guard.call_log.push(PlatformCallRecord {
            method: "set_display_affinity".into(),
            hwnd,
            details: format!("{:?}", affinity),
        });
        Self::check_injected_error(&mut guard, "set_display_affinity")?;

        if affinity == DisplayAffinity::ExcludeFromCapture && guard.os_build < 19041 {
            return Err(Box::new(PlatformError::UnsupportedOsVersion(guard.os_build)));
        }

        if affinity == DisplayAffinity::ExcludeFromCapture && !guard.dwm_enabled {
            return Err(Box::new(PlatformError::DwmCompositionDisabled));
        }

        let win = Self::ensure_window_mut(&mut guard, hwnd)?;
        win.affinity = affinity;
        Ok(())
    }

    fn get_display_affinity(&self, hwnd: isize) -> Result<DisplayAffinity, Box<dyn Error>> {
        let mut guard = self.inner.write().map_err(|e| Box::new(PlatformError::LockPoisoned(e.to_string())) as Box<dyn Error>)?;
        guard.call_log.push(PlatformCallRecord {
            method: "get_display_affinity".into(),
            hwnd,
            details: String::new(),
        });
        Self::check_injected_error(&mut guard, "get_display_affinity")?;

        if guard.auto_register && !guard.windows.contains_key(&hwnd) {
            Self::validate_hwnd(hwnd).map_err(|e| Box::new(e) as Box<dyn Error>)?;
            let initial = MockWindowState {
                hwnd,
                ..Default::default()
            };
            guard.windows.insert(hwnd, initial);
        }

        let win = Self::check_window_read(&guard, hwnd)?;
        Ok(win.affinity)
    }

    fn set_click_through(&self, hwnd: isize, enabled: bool) -> Result<(), Box<dyn Error>> {
        let mut guard = self.inner.write().map_err(|e| Box::new(PlatformError::LockPoisoned(e.to_string())) as Box<dyn Error>)?;
        guard.call_log.push(PlatformCallRecord {
            method: "set_click_through".into(),
            hwnd,
            details: format!("{}", enabled),
        });
        Self::check_injected_error(&mut guard, "set_click_through")?;

        let win = Self::ensure_window_mut(&mut guard, hwnd)?;
        win.click_through = enabled;
        Ok(())
    }

    fn set_no_activate(&self, hwnd: isize, enabled: bool) -> Result<(), Box<dyn Error>> {
        let mut guard = self.inner.write().map_err(|e| Box::new(PlatformError::LockPoisoned(e.to_string())) as Box<dyn Error>)?;
        guard.call_log.push(PlatformCallRecord {
            method: "set_no_activate".into(),
            hwnd,
            details: format!("{}", enabled),
        });
        Self::check_injected_error(&mut guard, "set_no_activate")?;

        let win = Self::ensure_window_mut(&mut guard, hwnd)?;
        win.no_activate = enabled;
        Ok(())
    }

    fn apply_vibrancy(&self, hwnd: isize, effect: VibrancyEffect) -> Result<(), Box<dyn Error>> {
        let mut guard = self.inner.write().map_err(|e| Box::new(PlatformError::LockPoisoned(e.to_string())) as Box<dyn Error>)?;
        guard.call_log.push(PlatformCallRecord {
            method: "apply_vibrancy".into(),
            hwnd,
            details: format!("{:?}", effect),
        });
        Self::check_injected_error(&mut guard, "apply_vibrancy")?;

        let win = Self::ensure_window_mut(&mut guard, hwnd)?;
        win.vibrancy = effect;
        Ok(())
    }

    fn show_unfocused(&self, hwnd: isize) -> Result<(), Box<dyn Error>> {
        let mut guard = self.inner.write().map_err(|e| Box::new(PlatformError::LockPoisoned(e.to_string())) as Box<dyn Error>)?;
        guard.call_log.push(PlatformCallRecord {
            method: "show_unfocused".into(),
            hwnd,
            details: String::new(),
        });
        Self::check_injected_error(&mut guard, "show_unfocused")?;

        let win = Self::ensure_window_mut(&mut guard, hwnd)?;
        win.visible = true;
        win.unfocused = true;
        Ok(())
    }

    fn hide(&self, hwnd: isize) -> Result<(), Box<dyn Error>> {
        let mut guard = self.inner.write().map_err(|e| Box::new(PlatformError::LockPoisoned(e.to_string())) as Box<dyn Error>)?;
        guard.call_log.push(PlatformCallRecord {
            method: "hide".into(),
            hwnd,
            details: String::new(),
        });
        Self::check_injected_error(&mut guard, "hide")?;

        let win = Self::ensure_window_mut(&mut guard, hwnd)?;
        win.visible = false;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_trait_dispatch_and_state_transitions() {
        let platform = MockWindowPlatform::new();
        let hwnd = 12345;

        // Default state
        assert_eq!(platform.get_display_affinity(hwnd).unwrap(), DisplayAffinity::None);
        assert!(!platform.is_visible(hwnd));
        assert!(!platform.is_click_through(hwnd));

        // Affinity change
        platform.set_display_affinity(hwnd, DisplayAffinity::ExcludeFromCapture).unwrap();
        assert_eq!(platform.get_display_affinity(hwnd).unwrap(), DisplayAffinity::ExcludeFromCapture);

        // Click-through and no-activate
        platform.set_click_through(hwnd, true).unwrap();
        platform.set_no_activate(hwnd, true).unwrap();
        assert!(platform.is_click_through(hwnd));
        assert!(platform.is_no_activate(hwnd));

        // Vibrancy
        let acrylic = VibrancyEffect::Acrylic { r: 15, g: 23, b: 42, a: 200 };
        platform.apply_vibrancy(hwnd, acrylic).unwrap();

        // Show unfocused
        platform.show_unfocused(hwnd).unwrap();
        let state = platform.get_window_state(hwnd).unwrap();
        assert!(state.visible);
        assert!(state.unfocused);
        assert_eq!(state.vibrancy, acrylic);

        // Hide
        platform.hide(hwnd).unwrap();
        assert!(!platform.is_visible(hwnd));
    }

    #[test]
    fn test_invalid_hwnd_boundaries() {
        let platform = MockWindowPlatform::new();

        // Null HWND (0) rejection
        let null_err = platform.set_display_affinity(0, DisplayAffinity::ExcludeFromCapture).unwrap_err();
        assert_eq!(null_err.downcast_ref::<PlatformError>(), Some(&PlatformError::NullHwnd));

        // Negative HWND rejection
        let neg_err = platform.get_display_affinity(-10).unwrap_err();
        assert_eq!(neg_err.downcast_ref::<PlatformError>(), Some(&PlatformError::NegativeHwnd(-10)));
    }

    #[test]
    fn test_strict_mode_and_destroyed_window() {
        let platform = MockWindowPlatform::new_strict();
        let hwnd = 8888;

        // Unknown HWND in strict mode fails
        let err = platform.show_unfocused(hwnd).unwrap_err();
        assert_eq!(err.downcast_ref::<PlatformError>(), Some(&PlatformError::WindowNotFound(hwnd)));

        // Register window succeeds
        platform.register_window(hwnd).unwrap();
        assert!(platform.show_unfocused(hwnd).is_ok());

        // Destroy window causes subsequent operations to fail with Win32 1400
        platform.destroy_window(hwnd).unwrap();
        let dest_err = platform.hide(hwnd).unwrap_err();
        assert_eq!(dest_err.downcast_ref::<PlatformError>(), Some(&PlatformError::InvalidWindowHandle(hwnd)));
    }

    #[test]
    fn test_error_injection() {
        let platform = MockWindowPlatform::new();
        let hwnd = 7777;

        // Injected fault
        platform.inject_error("set_display_affinity", PlatformError::InjectedFault("Simulated driver crash".into())).unwrap();
        let err = platform.set_display_affinity(hwnd, DisplayAffinity::ExcludeFromCapture).unwrap_err();
        assert_eq!(err.downcast_ref::<PlatformError>(), Some(&PlatformError::InjectedFault("Simulated driver crash".into())));

        // Clear injection restores normal behavior
        platform.clear_injected_errors().unwrap();
        assert!(platform.set_display_affinity(hwnd, DisplayAffinity::ExcludeFromCapture).is_ok());

        // One-shot injection
        platform.inject_error_once("hide", PlatformError::InjectedFault("Temporary glitch".into())).unwrap();
        assert!(platform.hide(hwnd).is_err());
        assert!(platform.hide(hwnd).is_ok()); // second call succeeds
    }

    #[test]
    fn test_os_build_and_dwm_guards() {
        let platform = MockWindowPlatform::new();
        let hwnd = 5555;

        // Legacy OS build (< 19041) rejects ExcludeFromCapture
        platform.set_os_build(18363).unwrap();
        let os_err = platform.set_display_affinity(hwnd, DisplayAffinity::ExcludeFromCapture).unwrap_err();
        assert_eq!(os_err.downcast_ref::<PlatformError>(), Some(&PlatformError::UnsupportedOsVersion(18363)));

        // Monitor mode still allowed on legacy OS
        assert!(platform.set_display_affinity(hwnd, DisplayAffinity::Monitor).is_ok());

        // Modern OS build but disabled DWM composition
        platform.set_os_build(22631).unwrap();
        platform.set_dwm_enabled(false).unwrap();
        let dwm_err = platform.set_display_affinity(hwnd, DisplayAffinity::ExcludeFromCapture).unwrap_err();
        assert_eq!(dwm_err.downcast_ref::<PlatformError>(), Some(&PlatformError::DwmCompositionDisabled));
    }

    #[test]
    fn test_thread_safety_send_sync() {
        use std::thread;

        let platform = MockWindowPlatform::new();
        let mut handles = Vec::new();

        for i in 1..=20 {
            let p = platform.clone();
            handles.push(thread::spawn(move || {
                let hwnd = 1000 + i;
                p.set_display_affinity(hwnd, DisplayAffinity::ExcludeFromCapture).unwrap();
                let aff = p.get_display_affinity(hwnd).unwrap();
                assert_eq!(aff, DisplayAffinity::ExcludeFromCapture);
            }));
        }

        for h in handles {
            h.join().unwrap();
        }

        assert_eq!(platform.get_call_log().len(), 40);
    }

    #[test]
    fn test_window_recreation() {
        let platform = MockWindowPlatform::new_strict();
        platform.register_window(101).unwrap();
        platform.set_display_affinity(101, DisplayAffinity::ExcludeFromCapture).unwrap();

        // Recreate window onto 102
        platform.handle_window_recreation(101, 102).unwrap();
        assert_eq!(platform.get_display_affinity(102).unwrap(), DisplayAffinity::ExcludeFromCapture);
        assert!(platform.get_display_affinity(101).is_err());
    }
}
