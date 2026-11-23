//! StealthPrompter Core Rust Backend Library
//!
//! Exposes platform abstraction (WindowPlatform trait, Win32 backend, mock platform),
//! persistence engine (atomic JSON storage for settings and scripts),
//! IPC commands, and global shortcuts.

pub mod commands;
pub mod platform;
pub mod shortcuts;
pub mod storage;

use std::sync::Arc;
#[cfg(windows)]
use tauri::Manager;

// Re-export core platform types
pub use platform::{
    create_platform, DisplayAffinity, MockPlatformInner, MockWindowPlatform, MockWindowState,
    PlatformCallRecord, PlatformError, VibrancyEffect, WindowPlatform,
};

#[cfg(target_os = "windows")]
pub use platform::WindowsPlatform;

// Re-export storage types
pub use storage::{
    Cue, GeneralSettings, HotkeysSettings, HudSettings, Script, ScriptSummary, Settings,
    StorageEngine, StorageError, WindowGeometry,
};

pub fn run() {
    let platform = create_platform();
    let storage = StorageEngine::default_engine()
        .unwrap_or_else(|_| StorageEngine::new("."));

    let platform_arc: Arc<dyn WindowPlatform> = Arc::from(platform);
    let storage_arc = Arc::new(storage);

    let platform_for_setup = platform_arc.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(platform_arc)
        .manage(storage_arc)
        .invoke_handler(tauri::generate_handler![
            commands::set_capture_exclusion,
            commands::get_capture_exclusion,
            commands::toggle_prompter_window,
            commands::set_click_through,
            commands::load_settings,
            commands::save_settings,
            commands::list_scripts,
            commands::load_script,
            commands::save_script,
            commands::delete_script,
        ])
        .setup(move |app| {
            // Setup global shortcuts
            let _ = shortcuts::setup_shortcuts(&app.handle(), platform_for_setup.clone());

            // Initialize prompter window on startup
            #[cfg(windows)]
            {
                if let Some(prompter_win) = app.get_webview_window("prompter") {
                    if let Ok(hwnd) = prompter_win.hwnd() {
                        let hwnd_isize = hwnd.0 as isize;
                        // Exclude from capture by default
                        let _ = platform_for_setup.set_display_affinity(
                            hwnd_isize,
                            DisplayAffinity::ExcludeFromCapture,
                        );
                        // Ensure it has WS_EX_NOACTIVATE style
                        let _ = platform_for_setup.set_no_activate(hwnd_isize, true);
                    }
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running StealthPrompter application");
}
