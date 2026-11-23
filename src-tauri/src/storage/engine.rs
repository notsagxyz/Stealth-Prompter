use std::fs::{self, File};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::thread::sleep;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use serde::de::DeserializeOwned;
use serde::Serialize;
use thiserror::Error;

use super::models::{Script, ScriptSummary, Settings};

static TMP_COUNTER: AtomicUsize = AtomicUsize::new(1);

// ============================================================================
// Storage Errors
// ============================================================================

#[derive(Debug, Error)]
pub enum StorageError {
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON serialization/deserialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("File not found: {0}")]
    NotFound(String),

    #[error("Corrupted file at {path}: {reason}")]
    CorruptFile { path: String, reason: String },

    #[error("Invalid identifier: {0}")]
    InvalidId(String),

    #[error("File lock conflict: {0}")]
    LockConflict(String),
}

impl From<StorageError> for String {
    fn from(err: StorageError) -> Self {
        err.to_string()
    }
}

// ============================================================================
// Storage Engine
// ============================================================================

#[derive(Debug, Clone)]
pub struct StorageEngine {
    base_dir: PathBuf,
}

impl StorageEngine {
    /// Initialize with a custom base directory (crucial for unit tests and sandboxes)
    pub fn new(base_dir: impl Into<PathBuf>) -> Self {
        Self {
            base_dir: base_dir.into(),
        }
    }

    /// Default production storage path: %APPDATA%\com.stealthprompter.desktop\
    pub fn default_path() -> Result<PathBuf, StorageError> {
        let app_data = std::env::var("APPDATA")
            .map(PathBuf::from)
            .or_else(|_| {
                std::env::var("USERPROFILE")
                    .map(|p| PathBuf::from(p).join("AppData").join("Roaming"))
            })
            .unwrap_or_else(|_| PathBuf::from("."));

        Ok(app_data.join("com.stealthprompter.desktop"))
    }

    /// Convenience constructor with default production directory
    pub fn default_engine() -> Result<Self, StorageError> {
        Ok(Self::new(Self::default_path()?))
    }

    pub fn base_dir(&self) -> &Path {
        &self.base_dir
    }

    pub fn settings_path(&self) -> PathBuf {
        self.base_dir.join("settings.json")
    }

    pub fn scripts_dir(&self) -> PathBuf {
        self.base_dir.join("scripts")
    }

    /// Returns path to script JSON file after validating script ID against path traversal
    pub fn script_path(&self, id: &str) -> Result<PathBuf, StorageError> {
        self.validate_id(id)?;
        Ok(self.scripts_dir().join(format!("{}.json", id)))
    }

    /// Security validation against directory traversal, forbidden characters, and reserved names
    pub fn validate_id(&self, id: &str) -> Result<(), StorageError> {
        if id.is_empty() || id.trim().is_empty() {
            return Err(StorageError::InvalidId(
                "Invalid script ID: identifier cannot be empty".to_string(),
            ));
        }

        if id.contains("..") {
            return Err(StorageError::InvalidId(format!(
                "Invalid script ID '{}': contains directory traversal sequence '..'",
                id
            )));
        }

        const FORBIDDEN_CHARS: &[char] = &['/', '\\', '\0', ':', '*', '?', '"', '<', '>', '|'];
        if let Some(c) = id.chars().find(|c| c.is_control() || FORBIDDEN_CHARS.contains(c)) {
            return Err(StorageError::InvalidId(format!(
                "Invalid script ID '{}': contains forbidden character {:?}",
                id, c
            )));
        }

        if id.ends_with('.') || id.ends_with(' ') {
            return Err(StorageError::InvalidId(format!(
                "Invalid script ID '{}': cannot end with a period or space",
                id
            )));
        }

        const DOS_RESERVED: &[&str] = &[
            "CON", "PRN", "AUX", "NUL",
            "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
            "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
        ];

        let stem = id.split('.').next().unwrap_or(id).trim();
        if DOS_RESERVED.iter().any(|&r| stem.eq_ignore_ascii_case(r)) {
            return Err(StorageError::InvalidId(format!(
                "Invalid script ID '{}': matches reserved DOS device name",
                id
            )));
        }

        Ok(())
    }

    // ========================================================================
    // Low-Level Core: Atomic File Write & Read with Corruption Backup
    // ========================================================================

    /// Atomically writes JSON to target path using the write-temp -> sync_all -> rename pattern.
    /// Serializes in memory first to prevent partial/truncated writes on serialization errors.
    pub fn atomic_write_json<T: Serialize>(&self, target_path: &Path, data: &T) -> Result<(), StorageError> {
        // 1. Serialize in-memory before touching disk
        let payload = serde_json::to_string_pretty(data)?;

        // 2. Ensure parent directory exists
        if let Some(parent) = target_path.parent() {
            fs::create_dir_all(parent)?;
        }

        // 3. Unique temporary file in the SAME directory to guarantee same-volume rename
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos();
        let pid = std::process::id();
        let counter = TMP_COUNTER.fetch_add(1, Ordering::Relaxed);
        let tmp_path = format!("{}.{}_{}_{}.tmp", target_path.display(), now, pid, counter);
        let tmp_path = PathBuf::from(tmp_path);

        // 4. Write data & flush disk buffers via sync_all
        {
            let mut file = File::create(&tmp_path)?;
            file.write_all(payload.as_bytes())?;
            file.sync_all()?;
            // Explicitly drop file handle to release Win32 lock before renaming
        }

        // 5. Atomic rename with Windows transient lock retry loop
        let mut last_err = None;
        for attempt in 0..5 {
            match fs::rename(&tmp_path, target_path) {
                Ok(_) => {
                    return Ok(());
                }
                Err(err) => {
                    last_err = Some(err);
                    // Exponential backoff for transient locks (antivirus, search indexer)
                    sleep(Duration::from_millis(10 * (1 << attempt)));
                }
            }
        }

        // Clean up tmp file if rename failed
        let _ = fs::remove_file(&tmp_path);
        Err(StorageError::Io(last_err.unwrap()))
    }

    /// Reads JSON file with corruption backup (<file>.corrupt) and optional default fallback
    pub fn read_json<T: DeserializeOwned>(
        &self,
        file_path: &Path,
        default_fallback: Option<T>,
    ) -> Result<T, StorageError> {
        if !file_path.exists() {
            return match default_fallback {
                Some(default_val) => Ok(default_val),
                None => Err(StorageError::NotFound(file_path.display().to_string())),
            };
        }

        let bytes = match fs::read(file_path) {
            Ok(b) => b,
            Err(err) if err.kind() == std::io::ErrorKind::NotFound => {
                return match default_fallback {
                    Some(default_val) => Ok(default_val),
                    None => Err(StorageError::NotFound(file_path.display().to_string())),
                };
            }
            Err(err) => return Err(StorageError::Io(err)),
        };

        // Check for 0-byte corrupt file
        if bytes.is_empty() {
            let corrupt_path = format!("{}.corrupt", file_path.display());
            let _ = fs::copy(file_path, &corrupt_path);

            return match default_fallback {
                Some(default_val) => Ok(default_val),
                None => Err(StorageError::CorruptFile {
                    path: file_path.display().to_string(),
                    reason: "Zero-byte file".to_string(),
                }),
            };
        }

        // Parse JSON bytes (handles UTF-8 decoding and JSON syntax errors)
        match serde_json::from_slice::<T>(&bytes) {
            Ok(parsed) => Ok(parsed),
            Err(parse_err) => {
                let corrupt_path = format!("{}.corrupt", file_path.display());
                let _ = fs::copy(file_path, &corrupt_path);

                match default_fallback {
                    Some(default_val) => Ok(default_val),
                    None => Err(StorageError::CorruptFile {
                        path: file_path.display().to_string(),
                        reason: format!("Parse error: {}", parse_err),
                    }),
                }
            }
        }
    }

    // ========================================================================
    // Settings CRUD
    // ========================================================================

    /// Loads settings with automatic self-healing fallback to defaults and .corrupt backup
    pub fn load_settings(&self) -> Result<Settings, StorageError> {
        self.read_json(&self.settings_path(), Some(Settings::default()))
    }

    /// Validates and atomically saves settings
    pub fn save_settings(&self, settings: &Settings) -> Result<(), StorageError> {
        let mut to_save = settings.clone();
        to_save.clamp();
        self.atomic_write_json(&self.settings_path(), &to_save)
    }

    // ========================================================================
    // Script CRUD
    // ========================================================================

    /// Lists summaries of all stored scripts, sorted by updated_at descending
    pub fn list_scripts(&self) -> Result<Vec<ScriptSummary>, StorageError> {
        let dir = self.scripts_dir();
        if !dir.exists() {
            return Ok(Vec::new());
        }

        let mut summaries = Vec::new();
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("json") {
                if let Ok(script) = self.read_json::<Script>(&path, None) {
                    summaries.push(script.summary());
                }
            }
        }

        summaries.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
        Ok(summaries)
    }

    /// Loads script by ID
    pub fn load_script(&self, id: &str) -> Result<Script, StorageError> {
        let path = self.script_path(id)?;
        self.read_json::<Script>(&path, None)
    }

    /// Atomically saves a script
    pub fn save_script(&self, script: &Script) -> Result<(), StorageError> {
        let path = self.script_path(&script.id)?;
        self.atomic_write_json(&path, script)
    }

    /// Deletes a script by ID. Returns true if deleted, false if file did not exist.
    pub fn delete_script(&self, id: &str) -> Result<bool, StorageError> {
        let path = self.script_path(id)?;
        if path.exists() {
            fs::remove_file(path)?;
            Ok(true)
        } else {
            Ok(false)
        }
    }

    /// Creates and persists a new script with generated timestamp and ID
    pub fn create_script(&self, title: &str, content: &str) -> Result<Script, StorageError> {
        let now_unix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        let id = format!("script-{}", now_unix);
        let iso_ts = format!("{}Z", now_unix);

        let script = Script::new(id, title, content, iso_ts);
        self.save_script(&script)?;
        Ok(script)
    }

    /// Clones an existing script with a new ID
    pub fn duplicate_script(&self, id: &str, new_title: Option<&str>) -> Result<Script, StorageError> {
        let mut script = self.load_script(id)?;
        let now_unix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        script.id = format!("script-{}-copy", now_unix);
        script.title = new_title
            .map(|t| t.to_string())
            .unwrap_or_else(|| format!("{} (Copy)", script.title));
        let iso_ts = format!("{}Z", now_unix);
        script.created_at = iso_ts.clone();
        script.updated_at = iso_ts;

        self.save_script(&script)?;
        Ok(script)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_atomic_write_and_read_settings() {
        let dir = tempdir().unwrap();
        let engine = StorageEngine::new(dir.path());

        let mut settings = Settings::default();
        settings.scroll_speed = 5.0;
        settings.theme = "dark-glass".to_string();

        engine.save_settings(&settings).unwrap();

        let loaded = engine.load_settings().unwrap();
        assert_eq!(loaded.scroll_speed, 5.0);
        assert_eq!(loaded.theme, "dark-glass");
        assert_eq!(loaded.mirror_mode, false);
    }

    #[test]
    fn test_corruption_recovery_malformed_json() {
        let dir = tempdir().unwrap();
        let engine = StorageEngine::new(dir.path());

        // Write corrupt JSON
        let settings_file = engine.settings_path();
        fs::create_dir_all(dir.path()).unwrap();
        fs::write(&settings_file, "{\"scroll_speed\": 4, malformed json...").unwrap();

        // Safe load must fallback to default
        let loaded = engine.load_settings().unwrap();
        assert_eq!(loaded, Settings::default());

        // Must generate .corrupt backup file
        let corrupt_backup = dir.path().join("settings.json.corrupt");
        assert!(corrupt_backup.exists());
    }

    #[test]
    fn test_corruption_recovery_zero_byte_file() {
        let dir = tempdir().unwrap();
        let engine = StorageEngine::new(dir.path());

        let settings_file = engine.settings_path();
        fs::create_dir_all(dir.path()).unwrap();
        fs::write(&settings_file, "").unwrap();

        let loaded = engine.load_settings().unwrap();
        assert_eq!(loaded, Settings::default());

        let corrupt_backup = dir.path().join("settings.json.corrupt");
        assert!(corrupt_backup.exists());
    }

    #[test]
    fn test_script_crud_lifecycle() {
        let dir = tempdir().unwrap();
        let engine = StorageEngine::new(dir.path());

        let script = Script::new("script-1", "Test Title", "Line one\nLine two", "2026-11-23T00:00:00Z");
        engine.save_script(&script).unwrap();

        let loaded = engine.load_script("script-1").unwrap();
        assert_eq!(loaded.title, "Test Title");
        assert_eq!(loaded.word_count(), 4);

        let list = engine.list_scripts().unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].id, "script-1");
        assert_eq!(list[0].word_count, 4);

        let deleted = engine.delete_script("script-1").unwrap();
        assert!(deleted);
        assert!(matches!(engine.load_script("script-1"), Err(StorageError::NotFound(_))));
    }

    #[test]
    fn test_path_traversal_prevention() {
        let dir = tempdir().unwrap();
        let engine = StorageEngine::new(dir.path());

        assert!(matches!(engine.load_script("../evil"), Err(StorageError::InvalidId(_))));
        assert!(matches!(engine.load_script("foo/bar"), Err(StorageError::InvalidId(_))));
        assert!(matches!(engine.load_script("foo\\bar"), Err(StorageError::InvalidId(_))));
    }

    #[test]
    fn test_directory_auto_creation() {
        let dir = tempdir().unwrap();
        let nested = dir.path().join("deep").join("nested").join("scripts").join("script-99.json");
        let engine = StorageEngine::new(dir.path());

        let script = Script::new("script-99", "Deep Script", "Content", "2026-11-23T00:00:00Z");
        engine.atomic_write_json(&nested, &script).unwrap();

        assert!(nested.exists());
    }

    #[test]
    fn test_atomic_write_midway_failure_preserves_target() {
        let dir = tempdir().unwrap();
        let engine = StorageEngine::new(dir.path());

        let mut initial_settings = Settings::default();
        initial_settings.scroll_speed = 4.0;
        engine.save_settings(&initial_settings).unwrap();

        // Attempting to write un-serializable or failing write
        let settings_path = engine.settings_path();
        let content_before = fs::read_to_string(&settings_path).unwrap();

        // Create an invalid tmp file to simulate abort
        let simulated_tmp = format!("{}.simulated.tmp", settings_path.display());
        fs::write(&simulated_tmp, "partial broken data").unwrap();

        // Target content must remain unchanged
        let content_after = fs::read_to_string(&settings_path).unwrap();
        assert_eq!(content_before, content_after);
    }

    #[test]
    fn test_binary_non_utf8_corruption_settings_self_healing() {
        let dir = tempdir().unwrap();
        let engine = StorageEngine::new(dir.path());

        // Write non-UTF-8 binary corruption to settings.json
        let settings_file = engine.settings_path();
        fs::create_dir_all(dir.path()).unwrap();
        let corrupt_bytes: [u8; 6] = [0xFF, 0xFE, 0x00, 0x41, 0x80, 0xBF];
        fs::write(&settings_file, &corrupt_bytes).unwrap();

        // Must self-heal to default settings
        let loaded = engine.load_settings().unwrap();
        assert_eq!(loaded, Settings::default());

        // Must create .corrupt backup file with exact raw bytes
        let corrupt_backup = dir.path().join("settings.json.corrupt");
        assert!(corrupt_backup.exists());
        let backup_bytes = fs::read(&corrupt_backup).unwrap();
        assert_eq!(backup_bytes, corrupt_bytes);
    }

    #[test]
    fn test_binary_non_utf8_corruption_load_script_returns_corrupt_file_error() {
        let dir = tempdir().unwrap();
        let engine = StorageEngine::new(dir.path());

        fs::create_dir_all(engine.scripts_dir()).unwrap();
        let script_file = engine.scripts_dir().join("bad-script.json");
        let corrupt_bytes: [u8; 5] = [0xFF, 0xFE, 0xFD, 0x80, 0x90];
        fs::write(&script_file, &corrupt_bytes).unwrap();

        // Must return typed StorageError::CorruptFile
        let result = engine.load_script("bad-script");
        match result {
            Err(StorageError::CorruptFile { path, reason }) => {
                assert!(path.contains("bad-script.json"));
                assert!(!reason.is_empty());
            }
            other => panic!("Expected CorruptFile error, got {:?}", other),
        }

        // Must create .corrupt backup file
        let corrupt_backup = engine.scripts_dir().join("bad-script.json.corrupt");
        assert!(corrupt_backup.exists());
        let backup_bytes = fs::read(&corrupt_backup).unwrap();
        assert_eq!(backup_bytes, corrupt_bytes);
    }

    #[test]
    fn test_validate_id_win32_and_dos_reserved() {
        let dir = tempdir().unwrap();
        let engine = StorageEngine::new(dir.path());

        // Empty & whitespace
        assert!(matches!(engine.validate_id(""), Err(StorageError::InvalidId(_))));
        assert!(matches!(engine.validate_id("   "), Err(StorageError::InvalidId(_))));

        // Directory traversal & slashes
        assert!(matches!(engine.validate_id(".."), Err(StorageError::InvalidId(_))));
        assert!(matches!(engine.validate_id("../script"), Err(StorageError::InvalidId(_))));
        assert!(matches!(engine.validate_id("script/1"), Err(StorageError::InvalidId(_))));
        assert!(matches!(engine.validate_id("script\\1"), Err(StorageError::InvalidId(_))));

        // Colons
        assert!(matches!(engine.validate_id("script:id"), Err(StorageError::InvalidId(_))));
        assert!(matches!(engine.validate_id("c:script"), Err(StorageError::InvalidId(_))));

        // Illegal Win32 characters
        assert!(matches!(engine.validate_id("script*"), Err(StorageError::InvalidId(_))));
        assert!(matches!(engine.validate_id("script?"), Err(StorageError::InvalidId(_))));
        assert!(matches!(engine.validate_id("script\"name"), Err(StorageError::InvalidId(_))));
        assert!(matches!(engine.validate_id("script<name"), Err(StorageError::InvalidId(_))));
        assert!(matches!(engine.validate_id("script>name"), Err(StorageError::InvalidId(_))));
        assert!(matches!(engine.validate_id("script|name"), Err(StorageError::InvalidId(_))));

        // Control characters & null bytes
        assert!(matches!(engine.validate_id("script\0name"), Err(StorageError::InvalidId(_))));
        assert!(matches!(engine.validate_id("script\x01name"), Err(StorageError::InvalidId(_))));
        assert!(matches!(engine.validate_id("script\nname"), Err(StorageError::InvalidId(_))));
        assert!(matches!(engine.validate_id("script\tname"), Err(StorageError::InvalidId(_))));

        // Trailing dot or space
        assert!(matches!(engine.validate_id("script."), Err(StorageError::InvalidId(_))));
        assert!(matches!(engine.validate_id("script "), Err(StorageError::InvalidId(_))));

        // DOS reserved device names (case-insensitive)
        let dos_names = [
            "CON", "con", "Prn", "PRN", "aux", "AUX", "NUL", "nul",
            "COM1", "com1", "COM9", "com9", "LPT1", "lpt1", "LPT9", "lpt9",
            "con.json", "NUL.txt", "aux.backup",
        ];
        for reserved in &dos_names {
            assert!(
                matches!(engine.validate_id(reserved), Err(StorageError::InvalidId(_))),
                "Expected rejection for DOS reserved name: {}",
                reserved
            );
        }

        // Valid IDs must succeed
        assert!(engine.validate_id("script-123").is_ok());
        assert!(engine.validate_id("my_cool_script").is_ok());
        assert!(engine.validate_id("speech-2026-11-23").is_ok());
        assert!(engine.validate_id("connect").is_ok()); // Prefix 'con' but valid
        assert!(engine.validate_id("nullable").is_ok()); // Prefix 'nul' but valid
        assert!(engine.validate_id("auxiliary").is_ok()); // Prefix 'aux' but valid
    }

    #[test]
    fn test_save_settings_preserves_extended_valid_ranges() {
        let dir = tempdir().unwrap();
        let engine = StorageEngine::new(dir.path());

        let mut settings = Settings::default();
        settings.font_size = 120;
        settings.scroll_speed = 15.0;
        settings.window_opacity = 0.08;
        settings.line_height = 4.5;

        // Verify that Settings::validate confirms these are valid
        assert!(settings.validate().is_ok());

        // Save and reload
        engine.save_settings(&settings).unwrap();
        let loaded = engine.load_settings().unwrap();

        // Must NOT be clamped to old narrow ranges (12..72, 1.0..10.0)
        assert_eq!(loaded.font_size, 120);
        assert!((loaded.scroll_speed - 15.0).abs() < f64::EPSILON);
        assert!((loaded.window_opacity - 0.08).abs() < f64::EPSILON);
        assert!((loaded.line_height - 4.5).abs() < f64::EPSILON);
    }

    #[test]
    fn test_settings_clamp_harmonized_with_validate() {
        let mut settings = Settings::default();

        // Out-of-bounds lower
        settings.scroll_speed = 0.01;
        settings.font_size = 2;
        settings.window_opacity = 0.01;
        settings.line_height = 0.1;
        assert!(settings.validate().is_err());

        settings.clamp();
        assert!((settings.scroll_speed - 0.1).abs() < f64::EPSILON);
        assert_eq!(settings.font_size, 8);
        assert!((settings.window_opacity - 0.05).abs() < f64::EPSILON);
        assert!((settings.line_height - 0.5).abs() < f64::EPSILON);
        assert!(settings.validate().is_ok());

        // Out-of-bounds upper
        settings.scroll_speed = 50.0;
        settings.font_size = 200;
        settings.window_opacity = 2.0;
        settings.line_height = 10.0;
        assert!(settings.validate().is_err());

        settings.clamp();
        assert!((settings.scroll_speed - 20.0).abs() < f64::EPSILON);
        assert_eq!(settings.font_size, 144);
        assert!((settings.window_opacity - 1.0).abs() < f64::EPSILON);
        assert!((settings.line_height - 5.0).abs() < f64::EPSILON);
        assert!(settings.validate().is_ok());
    }
}
