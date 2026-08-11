use crate::db::models::Setting;
use crate::errors::{AppError, Result};
use crate::DbState;
use rusqlite::params;
use tauri::State;

#[tauri::command]
pub fn get_setting(state: State<'_, DbState>, key: String) -> Result<Option<String>> {
    let conn = state.db.lock().map_err(|e| AppError::Database(e.to_string()))?;

    let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?1")?;
    let val = stmt
        .query_row(params![key], |row| row.get::<_, Option<String>>(0))
        .ok()
        .flatten();

    Ok(val)
}

#[tauri::command]
pub fn set_setting(state: State<'_, DbState>, key: String, value: Option<String>) -> Result<()> {
    let conn = state.db.lock().map_err(|e| AppError::Database(e.to_string()))?;

    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key, value],
    )?;

    Ok(())
}

#[tauri::command]
pub fn list_settings(state: State<'_, DbState>) -> Result<Vec<Setting>> {
    let conn = state.db.lock().map_err(|e| AppError::Database(e.to_string()))?;

    let mut stmt = conn.prepare("SELECT key, value FROM settings ORDER BY key ASC")?;
    let settings = stmt
        .query_map([], |row| {
            Ok(Setting {
                key: row.get(0)?,
                value: row.get(1)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(settings)
}

#[cfg(test)]
mod tests {
    use crate::db::connection::init_in_memory_db;

    #[test]
    fn test_settings_upsert() {
        let conn = init_in_memory_db().unwrap();

        conn.execute(
            "INSERT INTO settings (key, value) VALUES ('twitch_client_id', '123') ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            [],
        ).unwrap();

        let val: Option<String> = conn
            .query_row("SELECT value FROM settings WHERE key = 'twitch_client_id'", [], |row| row.get(0))
            .unwrap();
        assert_eq!(val, Some("123".to_string()));
    }
}
