use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

use crate::platform::WindowPlatform;

pub fn setup_shortcuts(
    app: &AppHandle,
    platform: Arc<dyn WindowPlatform>,
) -> Result<(), Box<dyn std::error::Error>> {
    let app_handle = app.clone();
    let platform_handle = platform.clone();

    // Register Alt+Space (Play/Pause)
    if let Ok(shortcut) = "alt+space".parse::<Shortcut>() {
        let h = app_handle.clone();
        let _ = app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                let _ = h.emit("prompter:action", serde_json::json!({ "type": "toggle_play" }));
            }
        });
    }

    // Register Alt+Up (Speed Up)
    if let Ok(shortcut) = "alt+up".parse::<Shortcut>() {
        let h = app_handle.clone();
        let _ = app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                let _ = h.emit("prompter:action", serde_json::json!({ "type": "speed_up" }));
            }
        });
    }

    // Register Alt+Down (Speed Down)
    if let Ok(shortcut) = "alt+down".parse::<Shortcut>() {
        let h = app_handle.clone();
        let _ = app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                let _ = h.emit("prompter:action", serde_json::json!({ "type": "speed_down" }));
            }
        });
    }

    // Register Alt+H (Toggle Window)
    if let Ok(shortcut) = "alt+h".parse::<Shortcut>() {
        let h = app_handle.clone();
        let p = platform_handle.clone();
        let _ = app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                #[cfg(windows)]
                {
                    use tauri::Manager;
                    if let Some(w) = h.get_webview_window("prompter") {
                        if let Ok(hwnd) = w.hwnd() {
                            let hwnd_isize = hwnd.0 as isize;
                            if let Ok(is_vis) = w.is_visible() {
                                if is_vis {
                                    let _ = p.hide(hwnd_isize);
                                    let _ = h.emit("prompter:action", serde_json::json!({ "type": "pause" }));
                                } else {
                                    let _ = p.show_unfocused(hwnd_isize);
                                }
                            }
                        }
                    }
                }
                #[cfg(not(windows))]
                {
                    let _ = p.show_unfocused(1001);
                }
            }
        });
    }

    // Register Alt+R (Rewind)
    if let Ok(shortcut) = "alt+r".parse::<Shortcut>() {
        let h = app_handle.clone();
        let _ = app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                let _ = h.emit("prompter:action", serde_json::json!({ "type": "rewind" }));
            }
        });
    }

    // Register Alt+L (Toggle Click-Through / Unlock)
    if let Ok(shortcut) = "alt+l".parse::<Shortcut>() {
        let h = app_handle.clone();
        let _ = app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                let _ = h.emit("prompter:toggle_lock", serde_json::json!({}));
            }
        });
    }

    Ok(())
}
