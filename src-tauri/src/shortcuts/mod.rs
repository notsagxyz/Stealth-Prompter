use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

use crate::platform::WindowPlatform;
use crate::storage::StorageEngine;

pub fn setup_shortcuts(
    app: &AppHandle,
    platform: Arc<dyn WindowPlatform>,
    storage: Arc<StorageEngine>,
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
                                    let _ = h.emit("prompter:visibility_changed", false);
                                } else {
                                    let _ = p.show_unfocused(hwnd_isize);
                                    let _ = h.emit("prompter:visibility_changed", true);
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

    // Register Alt+L (Toggle Click-Through / Unlock atomically from backend)
    if let Ok(shortcut) = "alt+l".parse::<Shortcut>() {
        let h = app_handle.clone();
        let p = platform_handle.clone();
        let st = storage.clone();
        let _ = app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                if let Ok(mut current) = st.load_settings() {
                    let next = !current.click_through;
                    current.click_through = next;

                    #[cfg(windows)]
                    {
                        use tauri::Manager;
                        if let Some(w) = h.get_webview_window("prompter") {
                            if let Ok(hwnd) = w.hwnd() {
                                let _ = p.set_click_through(hwnd.0 as isize, next);
                            }
                        }
                    }
                    #[cfg(not(windows))]
                    {
                        let _ = p.set_click_through(1001, next);
                    }

                    let _ = st.save_settings(&current);
                    let _ = h.emit("prompter:settings_sync", &current);
                }
            }
        });
    }

    // Register Alt+PageUp (Manual Scroll Up — works even in click-through)
    if let Ok(shortcut) = "alt+pageup".parse::<Shortcut>() {
        let h = app_handle.clone();
        let _ = app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                let _ = h.emit("prompter:action", serde_json::json!({ "type": "scroll_up", "value": 90 }));
            }
        });
    }

    // Register Alt+PageDown (Manual Scroll Down — works even in click-through)
    if let Ok(shortcut) = "alt+pagedown".parse::<Shortcut>() {
        let h = app_handle.clone();
        let _ = app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                let _ = h.emit("prompter:action", serde_json::json!({ "type": "scroll_down", "value": 90 }));
            }
        });
    }

    // Register Alt+Shift+Up (opacity_up: Background Opacity +10% — works even in click-through)
    if let Ok(shortcut) = "alt+shift+up".parse::<Shortcut>() {
        let h = app_handle.clone();
        let st = storage.clone();
        let _ = app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                if let Ok(mut current) = st.load_settings() {
                    let next = ((current.window_opacity + 0.1) * 100.0).round() / 100.0;
                    current.window_opacity = next.clamp(0.10, 1.0);
                    let _ = st.save_settings(&current);
                    let _ = h.emit("prompter:settings_sync", &current);
                    let _ = h.emit("prompter:action", serde_json::json!({ "type": "opacity_up" }));
                }
            }
        });
    }

    // Register Alt+Shift+Down (opacity_down: Background Opacity -10% — works even in click-through)
    if let Ok(shortcut) = "alt+shift+down".parse::<Shortcut>() {
        let h = app_handle.clone();
        let st = storage.clone();
        let _ = app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                if let Ok(mut current) = st.load_settings() {
                    let next = ((current.window_opacity - 0.1) * 100.0).round() / 100.0;
                    current.window_opacity = next.clamp(0.10, 1.0);
                    let _ = st.save_settings(&current);
                    let _ = h.emit("prompter:settings_sync", &current);
                    let _ = h.emit("prompter:action", serde_json::json!({ "type": "opacity_down" }));
                }
            }
        });
    }

    Ok(())
}
