pub mod commands;
pub mod db;
pub mod errors;

use db::connection::init_db;
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::Manager;

pub struct DbState {
    pub db: Mutex<Connection>,
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
            app.manage(DbState {
                db: Mutex::new(conn),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::clips::create_clip,
            commands::clips::get_clip,
            commands::clips::list_clips,
            commands::clips::update_clip,
            commands::clips::update_clip_status,
            commands::clips::delete_clip,
            commands::categories::create_category,
            commands::categories::list_categories,
            commands::categories::update_category,
            commands::categories::delete_category,
            commands::categories::add_category_to_clip,
            commands::categories::remove_category_from_clip,
            commands::categories::get_clip_categories,
            commands::settings::get_setting,
            commands::settings::set_setting,
            commands::settings::list_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
