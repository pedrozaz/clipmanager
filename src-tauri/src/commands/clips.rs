use crate::DbState;
use crate::db::models::Clip;
use crate::errors::{AppError, Result};
use rusqlite::params;
use tauri::State;

#[tauri::command]
pub fn create_clip(
    state: State<'_, DbState>,
    title: String,
    twitch_url: Option<String>,
    clip_date: Option<String>,
    status: Option<String>,
    notes: Option<String>,
) -> Result<Clip> {
    let conn = state
        .db
        .lock()
        .map_err(|e| AppError::Database(e.to_string()))?;
    let status_val = status.unwrap_or_else(|| "novo".to_string());

    conn.execute(
        "INSERT INTO clips (title, twitch_url, clip_date, status, notes) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![title, twitch_url, clip_date, status_val, notes],
    )?;

    let id = conn.last_insert_rowid();
    get_clip_internal(&conn, id)
}

#[tauri::command]
pub fn get_clip(state: State<'_, DbState>, id: i64) -> Result<Clip> {
    let conn = state
        .db
        .lock()
        .map_err(|e| AppError::Database(e.to_string()))?;
    get_clip_internal(&conn, id)
}

fn get_clip_internal(conn: &rusqlite::Connection, id: i64) -> Result<Clip> {
    let mut stmt = conn.prepare(
        "SELECT id, title, twitch_url, youtube_url, instagram_url, thumbnail_url, duration, created_at, clip_date, status, notes, twitch_clip_id, match_id FROM clips WHERE id = ?1"
    )?;

    let clip = stmt
        .query_row(params![id], |row| {
            Ok(Clip {
                id: row.get(0)?,
                title: row.get(1)?,
                twitch_url: row.get(2)?,
                youtube_url: row.get(3)?,
                instagram_url: row.get(4)?,
                thumbnail_url: row.get(5)?,
                duration: row.get(6)?,
                created_at: row.get(7)?,
                clip_date: row.get(8)?,
                status: row.get(9)?,
                notes: row.get(10)?,
                twitch_clip_id: row.get(11)?,
                match_id: row.get(12)?,
            })
        })
        .map_err(|_| AppError::NotFound(format!("Clip with id {id} not found")))?;

    Ok(clip)
}

#[tauri::command]
pub fn list_clips(
    state: State<'_, DbState>,
    filter_status: Option<String>,
    search_query: Option<String>,
    sort_by: Option<String>,
    sort_order: Option<String>,
) -> Result<Vec<Clip>> {
    let conn = state
        .db
        .lock()
        .map_err(|e| AppError::Database(e.to_string()))?;

    let mut sql = "SELECT id, title, twitch_url, youtube_url, instagram_url, thumbnail_url, duration, created_at, clip_date, status, notes, twitch_clip_id, match_id FROM clips WHERE 1=1".to_string();
    let mut param_values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(ref status) = filter_status {
        sql.push_str(" AND status = ?");
        param_values.push(Box::new(status.clone()));
    }

    if let Some(ref search) = search_query {
        sql.push_str(" AND title LIKE ?");
        param_values.push(Box::new(format!("%{search}%")));
    }

    let sort_col = match sort_by.as_deref() {
        Some("title") => "title",
        Some("clip_date") => "clip_date",
        _ => "created_at",
    };

    let order = match sort_order.as_deref() {
        Some("ASC") | Some("asc") => "ASC",
        _ => "DESC",
    };

    sql.push_str(&format!(" ORDER BY {sort_col} {order}"));

    let mut stmt = conn.prepare(&sql)?;
    let params_slice: Vec<&dyn rusqlite::ToSql> = param_values.iter().map(|p| p.as_ref()).collect();

    let clips = stmt
        .query_map(params_slice.as_slice(), |row| {
            Ok(Clip {
                id: row.get(0)?,
                title: row.get(1)?,
                twitch_url: row.get(2)?,
                youtube_url: row.get(3)?,
                instagram_url: row.get(4)?,
                thumbnail_url: row.get(5)?,
                duration: row.get(6)?,
                created_at: row.get(7)?,
                clip_date: row.get(8)?,
                status: row.get(9)?,
                notes: row.get(10)?,
                twitch_clip_id: row.get(11)?,
                match_id: row.get(12)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(clips)
}

#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub fn update_clip(
    state: State<'_, DbState>,
    id: i64,
    title: String,
    twitch_url: Option<String>,
    youtube_url: Option<String>,
    instagram_url: Option<String>,
    thumbnail_url: Option<String>,
    duration: Option<i64>,
    clip_date: Option<String>,
    status: String,
    notes: Option<String>,
) -> Result<Clip> {
    let conn = state
        .db
        .lock()
        .map_err(|e| AppError::Database(e.to_string()))?;

    let rows = conn.execute(
        "UPDATE clips SET title = ?1, twitch_url = ?2, youtube_url = ?3, instagram_url = ?4, thumbnail_url = ?5, duration = ?6, clip_date = ?7, status = ?8, notes = ?9 WHERE id = ?10",
        params![title, twitch_url, youtube_url, instagram_url, thumbnail_url, duration, clip_date, status, notes, id],
    )?;

    if rows == 0 {
        return Err(AppError::NotFound(format!("Clip with id {id} not found")));
    }

    get_clip_internal(&conn, id)
}

#[tauri::command]
pub fn update_clip_status(state: State<'_, DbState>, id: i64, new_status: String) -> Result<Clip> {
    let conn = state
        .db
        .lock()
        .map_err(|e| AppError::Database(e.to_string()))?;

    let rows = conn.execute(
        "UPDATE clips SET status = ?1 WHERE id = ?2",
        params![new_status, id],
    )?;

    if rows == 0 {
        return Err(AppError::NotFound(format!("Clip with id {id} not found")));
    }

    get_clip_internal(&conn, id)
}

#[tauri::command]
pub fn delete_clip(state: State<'_, DbState>, id: i64) -> Result<()> {
    let conn = state
        .db
        .lock()
        .map_err(|e| AppError::Database(e.to_string()))?;

    let rows = conn.execute("DELETE FROM clips WHERE id = ?1", params![id])?;

    if rows == 0 {
        return Err(AppError::NotFound(format!("Clip with id {id} not found")));
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use crate::db::connection::init_in_memory_db;

    #[test]
    fn test_clip_crud() {
        let conn = init_in_memory_db().unwrap();

        conn.execute(
            "INSERT INTO clips (title, status) VALUES ('Ace Ascent', 'novo')",
            [],
        )
        .unwrap();
        let id = conn.last_insert_rowid();

        let clip = super::get_clip_internal(&conn, id).unwrap();
        assert_eq!(clip.title, "Ace Ascent");
        assert_eq!(clip.status, "novo");

        conn.execute("UPDATE clips SET status = 'editado' WHERE id = ?1", [id])
            .unwrap();
        let updated = super::get_clip_internal(&conn, id).unwrap();
        assert_eq!(updated.status, "editado");

        conn.execute("DELETE FROM clips WHERE id = ?1", [id])
            .unwrap();
        assert!(super::get_clip_internal(&conn, id).is_err());
    }
}
