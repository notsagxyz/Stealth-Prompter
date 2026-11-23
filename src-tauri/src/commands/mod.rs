use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager, State};

use crate::platform::{DisplayAffinity, WindowPlatform};
use crate::storage::{Script, ScriptSummary, Settings, StorageEngine};

#[tauri::command]
pub async fn set_capture_exclusion(
    app: AppHandle,
    platform: State<'_, Arc<dyn WindowPlatform>>,
    window_label: Option<String>,
    #[allow(non_snake_case)] windowLabel: Option<String>,
    enabled: bool,
) -> Result<(), String> {
    let label = window_label.or(windowLabel).unwrap_or_else(|| "prompter".to_string());

    #[cfg(windows)]
    let hwnd = match app.get_webview_window(&label) {
        Some(w) => w.hwnd().map_err(|e| e.to_string())?.0 as isize,
        None => return Err(format!("Window '{}' not found", label)),
    };

    #[cfg(not(windows))]
    let hwnd = 1001;

    let affinity = if enabled {
        DisplayAffinity::ExcludeFromCapture
    } else {
        DisplayAffinity::None
    };

    platform
        .set_display_affinity(hwnd, affinity)
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_capture_exclusion(
    app: AppHandle,
    platform: State<'_, Arc<dyn WindowPlatform>>,
    window_label: Option<String>,
    #[allow(non_snake_case)] windowLabel: Option<String>,
) -> Result<bool, String> {
    let label = window_label.or(windowLabel).unwrap_or_else(|| "prompter".to_string());

    #[cfg(windows)]
    let hwnd = match app.get_webview_window(&label) {
        Some(w) => w.hwnd().map_err(|e| e.to_string())?.0 as isize,
        None => 0,
    };

    #[cfg(not(windows))]
    let hwnd = 1001;

    let affinity = platform
        .get_display_affinity(hwnd)
        .map_err(|e| e.to_string())?;

    Ok(affinity == DisplayAffinity::ExcludeFromCapture)
}

#[tauri::command]
pub async fn toggle_prompter_window(
    app: AppHandle,
    platform: State<'_, Arc<dyn WindowPlatform>>,
) -> Result<(), String> {
    #[cfg(windows)]
    {
        if let Some(w) = app.get_webview_window("prompter") {
            let hwnd = w.hwnd().map_err(|e| e.to_string())?.0 as isize;
            let is_visible = w.is_visible().map_err(|e| e.to_string())?;
            if is_visible {
                platform.hide(hwnd).map_err(|e| e.to_string())?;
                let _ = app.emit("prompter:action", serde_json::json!({ "type": "pause" }));
            } else {
                platform.show_unfocused(hwnd).map_err(|e| e.to_string())?;
            }
            Ok(())
        } else {
            Err("Prompter window not found".to_string())
        }
    }

    #[cfg(not(windows))]
    {
        let hwnd = 1001;
        platform.show_unfocused(hwnd).map_err(|e| e.to_string())?;
        Ok(())
    }
}

#[tauri::command]
pub async fn set_click_through(
    app: AppHandle,
    platform: State<'_, Arc<dyn WindowPlatform>>,
    enabled: bool,
) -> Result<(), String> {
    #[cfg(windows)]
    {
        if let Some(w) = app.get_webview_window("prompter") {
            let hwnd = w.hwnd().map_err(|e| e.to_string())?.0 as isize;
            platform
                .set_click_through(hwnd, enabled)
                .map_err(|e| e.to_string())?;
            Ok(())
        } else {
            Err("Prompter window not found".to_string())
        }
    }

    #[cfg(not(windows))]
    {
        let hwnd = 1001;
        platform
            .set_click_through(hwnd, enabled)
            .map_err(|e| e.to_string())?;
        Ok(())
    }
}

#[tauri::command]
pub async fn load_settings(
    storage: State<'_, Arc<StorageEngine>>,
) -> Result<Settings, String> {
    storage.load_settings().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_settings(
    storage: State<'_, Arc<StorageEngine>>,
    settings: Settings,
) -> Result<(), String> {
    storage.save_settings(&settings).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_scripts(
    storage: State<'_, Arc<StorageEngine>>,
) -> Result<Vec<ScriptSummary>, String> {
    storage.list_scripts().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn load_script(
    storage: State<'_, Arc<StorageEngine>>,
    id: String,
) -> Result<Script, String> {
    storage.load_script(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_script(
    storage: State<'_, Arc<StorageEngine>>,
    script: Script,
) -> Result<(), String> {
    storage.save_script(&script).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_script(
    storage: State<'_, Arc<StorageEngine>>,
    id: String,
) -> Result<(), String> {
    storage
        .delete_script(&id)
        .map(|_| ())
        .map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::platform::MockWindowPlatform;

    struct TempDir(std::path::PathBuf);
    impl TempDir {
        fn new() -> Self {
            let p = std::env::temp_dir().join(format!("sp_cmd_test_{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));
            let _ = std::fs::create_dir_all(&p);
            Self(p)
        }
        fn path(&self) -> &std::path::Path {
            &self.0
        }
    }
    impl Drop for TempDir {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.0);
        }
    }
    fn tempdir() -> std::io::Result<TempDir> {
        Ok(TempDir::new())
    }

    #[test]
    fn test_platform_commands_logic_with_mock() {
        let platform = Arc::new(MockWindowPlatform::new());
        let hwnd = 1234;

        // Verify capture exclusion
        assert!(platform.set_display_affinity(hwnd, DisplayAffinity::ExcludeFromCapture).is_ok());
        assert_eq!(platform.get_display_affinity(hwnd).unwrap(), DisplayAffinity::ExcludeFromCapture);

        // Verify click-through
        assert!(platform.set_click_through(hwnd, true).is_ok());

        // Verify show_unfocused and hide
        assert!(platform.show_unfocused(hwnd).is_ok());
        assert!(platform.hide(hwnd).is_ok());
    }

    #[test]
    fn test_storage_commands_logic() {
        let dir = tempdir().unwrap();
        let engine = StorageEngine::new(dir.path());

        // Settings test
        let mut settings = engine.load_settings().unwrap();
        settings.scroll_speed = 7.5;
        assert!(engine.save_settings(&settings).is_ok());
        let reloaded = engine.load_settings().unwrap();
        assert_eq!(reloaded.scroll_speed, 7.5);

        // Script test
        let script = Script {
            id: "test-cmd-script".to_string(),
            title: "Test Cmd Title".to_string(),
            content: "Testing commands logic".to_string(),
            last_position: 100.0,
            speed: 4.0,
            created_at: "2026-11-23T00:00:00Z".to_string(),
            updated_at: "2026-11-23T00:00:00Z".to_string(),
            cues: vec![],
        };
        assert!(engine.save_script(&script).is_ok());
        let list = engine.list_scripts().unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].id, "test-cmd-script");

        let loaded = engine.load_script("test-cmd-script").unwrap();
        assert_eq!(loaded.title, "Test Cmd Title");

        assert!(engine.delete_script("test-cmd-script").is_ok());
        assert_eq!(engine.list_scripts().unwrap().len(), 0);
    }
}
