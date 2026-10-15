use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReadingState {
    pub book_id: String,
    pub cfi: String,
    pub progress_pct: f32,
    pub updated_at: u64,
}

fn get_state_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    fs::create_dir_all(&app_dir).map_err(|e| format!("Failed to create dir: {}", e))?;
    Ok(app_dir.join("reading_state.json"))
}

#[tauri::command]
fn save_reading_state(
    app: AppHandle,
    book_id: String,
    cfi: String,
    progress_pct: f32,
) -> Result<(), String> {
    let path = get_state_file_path(&app)?;
    let mut states: HashMap<String, ReadingState> = if path.exists() {
        let content = fs::read_to_string(&path).unwrap_or_else(|_| "{}".to_string());
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        HashMap::new()
    };

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    states.insert(
        book_id.clone(),
        ReadingState {
            book_id,
            cfi,
            progress_pct,
            updated_at: now,
        },
    );

    let serialized = serde_json::to_string_pretty(&states)
        .map_err(|e| format!("Serialization error: {}", e))?;
    fs::write(path, serialized).map_err(|e| format!("File write error: {}", e))?;
    Ok(())
}

#[tauri::command]
fn get_reading_state(app: AppHandle, book_id: String) -> Result<Option<ReadingState>, String> {
    let path = get_state_file_path(&app)?;
    if !path.exists() {
        return Ok(None);
    }
    let content = fs::read_to_string(path).map_err(|e| format!("File read error: {}", e))?;
    let states: HashMap<String, ReadingState> =
        serde_json::from_str(&content).unwrap_or_default();
    Ok(states.get(&book_id).cloned())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            save_reading_state,
            get_reading_state
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
