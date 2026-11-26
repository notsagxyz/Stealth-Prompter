use serde::{Deserialize, Serialize};

// ============================================================================
// Default Value Generators
// ============================================================================

fn default_scroll_speed() -> f64 {
    3.0
}
fn default_font_size() -> u32 {
    28
}
fn default_line_height() -> f64 {
    1.5
}
fn default_window_opacity() -> f64 {
    0.9
}
fn default_theme() -> String {
    "dark-glass".to_string()
}
fn default_accent_color() -> String {
    "#7c6cff".to_string()
}
fn default_language() -> String {
    "en".to_string()
}
fn default_speed() -> f64 {
    2.5
}
fn default_true() -> bool {
    true
}

fn default_toggle_play() -> String {
    "Alt+Space".to_string()
}
fn default_speed_up() -> String {
    "Alt+Up".to_string()
}
fn default_speed_down() -> String {
    "Alt+Down".to_string()
}
fn default_toggle_window() -> String {
    "Alt+H".to_string()
}
fn default_scroll_up() -> String {
    "Alt+PageUp".to_string()
}
fn default_scroll_down() -> String {
    "Alt+PageDown".to_string()
}
fn default_opacity_up() -> String {
    "Alt+Shift+Up".to_string()
}
fn default_opacity_down() -> String {
    "Alt+Shift+Down".to_string()
}
fn default_toggle_click_through() -> String {
    "Alt+L".to_string()
}
fn default_restart() -> String {
    "Alt+R".to_string()
}

fn default_window_x() -> i32 {
    100
}
fn default_window_y() -> i32 {
    100
}
fn default_window_width() -> u32 {
    800
}
fn default_window_height() -> u32 {
    400
}

// ============================================================================
// Window Geometry
// ============================================================================

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct WindowGeometry {
    #[serde(default = "default_window_x")]
    pub x: i32,
    #[serde(default = "default_window_y")]
    pub y: i32,
    #[serde(default = "default_window_width")]
    pub width: u32,
    #[serde(default = "default_window_height")]
    pub height: u32,
}

impl Default for WindowGeometry {
    fn default() -> Self {
        Self {
            x: default_window_x(),
            y: default_window_y(),
            width: default_window_width(),
            height: default_window_height(),
        }
    }
}

// ============================================================================
// Hotkey Settings
// ============================================================================

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct HotkeysSettings {
    #[serde(default = "default_toggle_play", alias = "togglePlay")]
    pub toggle_play: String,
    #[serde(default = "default_speed_up", alias = "speedUp")]
    pub speed_up: String,
    #[serde(default = "default_speed_down", alias = "speedDown")]
    pub speed_down: String,
    #[serde(default = "default_toggle_window", alias = "toggleWindow")]
    pub toggle_window: String,
    #[serde(default = "default_scroll_up", alias = "scrollUp")]
    pub scroll_up: String,
    #[serde(default = "default_scroll_down", alias = "scrollDown")]
    pub scroll_down: String,
    #[serde(default = "default_opacity_up", alias = "opacityUp")]
    pub opacity_up: String,
    #[serde(default = "default_opacity_down", alias = "opacityDown")]
    pub opacity_down: String,
    #[serde(default = "default_toggle_click_through", alias = "toggleClickThrough")]
    pub toggle_click_through: String,
    #[serde(default = "default_restart")]
    pub restart: String,
}

impl Default for HotkeysSettings {
    fn default() -> Self {
        Self {
            toggle_play: default_toggle_play(),
            speed_up: default_speed_up(),
            speed_down: default_speed_down(),
            toggle_window: default_toggle_window(),
            scroll_up: default_scroll_up(),
            scroll_down: default_scroll_down(),
            opacity_up: default_opacity_up(),
            opacity_down: default_opacity_down(),
            toggle_click_through: default_toggle_click_through(),
            restart: default_restart(),
        }
    }
}

// ============================================================================
// General & HUD Settings (Sub-models)
// ============================================================================

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct GeneralSettings {
    #[serde(default = "default_theme")]
    pub theme: String,
    #[serde(default, alias = "lastScriptId")]
    pub last_script_id: Option<String>,
    #[serde(default = "default_true", alias = "offlineOnly")]
    pub offline_only: bool,
    #[serde(default, alias = "telemetryEnabled")]
    pub telemetry_enabled: bool,
}

impl Default for GeneralSettings {
    fn default() -> Self {
        Self {
            theme: default_theme(),
            last_script_id: None,
            offline_only: true,
            telemetry_enabled: false,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct HudSettings {
    #[serde(default = "default_scroll_speed", alias = "scrollSpeed", alias = "speed")]
    pub scroll_speed: f64,
    #[serde(default = "default_font_size", alias = "fontSize")]
    pub font_size: u32,
    #[serde(default = "default_line_height", alias = "lineHeight")]
    pub line_height: f64,
    #[serde(default = "default_window_opacity", alias = "windowOpacity", alias = "opacity")]
    pub window_opacity: f64,
    #[serde(default, alias = "mirrorMode")]
    pub mirror_mode: bool,
    #[serde(default, alias = "clickThrough")]
    pub click_through: bool,
    #[serde(default, alias = "hudGeometry")]
    pub geometry: Option<WindowGeometry>,
}

impl Default for HudSettings {
    fn default() -> Self {
        Self {
            scroll_speed: default_scroll_speed(),
            font_size: default_font_size(),
            line_height: default_line_height(),
            window_opacity: default_window_opacity(),
            mirror_mode: false,
            click_through: false,
            geometry: Some(WindowGeometry::default()),
        }
    }
}

// ============================================================================
// Root Settings Model
// ============================================================================

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Settings {
    // HUD Settings properties
    #[serde(default = "default_scroll_speed", alias = "scrollSpeed", alias = "speed")]
    pub scroll_speed: f64,
    #[serde(default = "default_font_size", alias = "fontSize")]
    pub font_size: u32,
    #[serde(default = "default_line_height", alias = "lineHeight")]
    pub line_height: f64,
    #[serde(default = "default_window_opacity", alias = "windowOpacity", alias = "opacity")]
    pub window_opacity: f64,
    #[serde(default, alias = "mirrorMode")]
    pub mirror_mode: bool,
    #[serde(default, alias = "clickThrough")]
    pub click_through: bool,

    // General Settings properties
    #[serde(default = "default_theme")]
    pub theme: String,
    #[serde(default = "default_accent_color", alias = "accentColor")]
    pub accent_color: String,
    #[serde(default = "default_language")]
    pub language: String,
    #[serde(default, alias = "lastScriptId")]
    pub last_script_id: Option<String>,
    #[serde(default = "default_true", alias = "offlineOnly")]
    pub offline_only: bool,
    #[serde(default, alias = "telemetryEnabled")]
    pub telemetry_enabled: bool,

    // Geometry & Hotkeys
    #[serde(default, alias = "hudGeometry")]
    pub geometry: Option<WindowGeometry>,
    #[serde(default)]
    pub hotkeys: HotkeysSettings,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            scroll_speed: default_scroll_speed(),
            font_size: default_font_size(),
            line_height: default_line_height(),
            window_opacity: default_window_opacity(),
            mirror_mode: false,
            click_through: false,
            theme: default_theme(),
            accent_color: default_accent_color(),
            language: default_language(),
            last_script_id: None,
            offline_only: true,
            telemetry_enabled: false,
            geometry: Some(WindowGeometry::default()),
            hotkeys: HotkeysSettings::default(),
        }
    }
}

impl Settings {
    pub fn validate(&self) -> Result<(), String> {
        if self.scroll_speed < 0.1 || self.scroll_speed > 20.0 {
            return Err(format!("scroll_speed {} out of range [0.1, 20.0]", self.scroll_speed));
        }
        if self.font_size < 8 || self.font_size > 144 {
            return Err(format!("font_size {} out of range [8, 144]", self.font_size));
        }
        if self.window_opacity < 0.10 || self.window_opacity > 1.0 {
            return Err(format!("window_opacity {} out of range [0.10, 1.0]", self.window_opacity));
        }
        if self.line_height < 0.5 || self.line_height > 5.0 {
            return Err(format!("line_height {} out of range [0.5, 5.0]", self.line_height));
        }
        Ok(())
    }

    pub fn clamp(&mut self) {
        self.scroll_speed = self.scroll_speed.clamp(0.1, 20.0);
        self.font_size = self.font_size.clamp(8, 144);
        self.window_opacity = self.window_opacity.clamp(0.10, 1.0);
        self.line_height = self.line_height.clamp(0.5, 5.0);
    }

    pub fn general(&self) -> GeneralSettings {
        GeneralSettings {
            theme: self.theme.clone(),
            last_script_id: self.last_script_id.clone(),
            offline_only: self.offline_only,
            telemetry_enabled: self.telemetry_enabled,
        }
    }

    pub fn hud(&self) -> HudSettings {
        HudSettings {
            scroll_speed: self.scroll_speed,
            font_size: self.font_size,
            line_height: self.line_height,
            window_opacity: self.window_opacity,
            mirror_mode: self.mirror_mode,
            click_through: self.click_through,
            geometry: self.geometry.clone(),
        }
    }
}

// ============================================================================
// Script, Cue & ScriptSummary Models
// ============================================================================

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Cue {
    pub id: String,
    pub label: String,
    pub position: f64,
    #[serde(default)]
    pub notes: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Script {
    #[serde(alias = "scriptId")]
    pub id: String,
    pub title: String,
    #[serde(default, alias = "text")]
    pub content: String,
    #[serde(default, alias = "scrollPosition", alias = "lastPosition")]
    pub last_position: f64,
    #[serde(default = "default_speed")]
    pub speed: f64,
    #[serde(default, alias = "createdAt")]
    pub created_at: String,
    #[serde(default, alias = "updatedAt")]
    pub updated_at: String,
    #[serde(default)]
    pub cues: Vec<Cue>,
}

impl Script {
    pub fn new(
        id: impl Into<String>,
        title: impl Into<String>,
        content: impl Into<String>,
        timestamp: impl Into<String>,
    ) -> Self {
        let ts = timestamp.into();
        Self {
            id: id.into(),
            title: title.into(),
            content: content.into(),
            last_position: 0.0,
            speed: default_speed(),
            created_at: ts.clone(),
            updated_at: ts,
            cues: Vec::new(),
        }
    }

    pub fn word_count(&self) -> usize {
        self.content.split_whitespace().count()
    }

    pub fn summary(&self) -> ScriptSummary {
        ScriptSummary {
            id: self.id.clone(),
            title: self.title.clone(),
            created_at: self.created_at.clone(),
            updated_at: self.updated_at.clone(),
            last_position: self.last_position,
            speed: self.speed,
            word_count: self.word_count(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ScriptSummary {
    pub id: String,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
    pub last_position: f64,
    pub speed: f64,
    pub word_count: usize,
}

impl From<&Script> for ScriptSummary {
    fn from(script: &Script) -> Self {
        script.summary()
    }
}
