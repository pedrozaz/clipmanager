pub mod db;
pub mod errors;

use db::connection::init_db;
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::Manager;

pub struct DbState(pub Mutex<Connection>);

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("failed to get app data dir");
            let conn = init_db(&app_dir).expect("failed to initialize database");
            app.manage(DbState(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
