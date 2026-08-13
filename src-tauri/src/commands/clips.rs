use crate::DbState;
use crate::db::models::Clip;
use crate::errors::{AppError, Result};
use rusqlite::params;
use tauri::State;

#[tauri::command]
pub async fn create_clip(
    state: State<'_, DbState>,
    title: String,
    twitch_url: Option<String>,
    youtube_url: Option<String>,
    thumbnail_url: Option<String>,
    clip_date: Option<String>,
    status: Option<String>,
    notes: Option<String>,
) -> Result<Clip> {
    let status_val = status.unwrap_or_else(|| "Novo".to_string());

    let mut final_twitch_clip_id: Option<String> = None;
    let mut final_thumb: Option<String> = thumbnail_url;
    let mut final_game_name: Option<String> = None;
    let mut final_duration: Option<i64> = None;
    let mut final_views: i64 = 0;

    if let Some(ref url) = twitch_url {
        let slug = if let Some(pos) = url.find("clips.twitch.tv/") {
            let rest = &url[pos + "clips.twitch.tv/".len()..];
            rest.split(['?', '/', '&', '#']).next().unwrap_or("").to_string()
        } else if let Some(pos) = url.find("/clip/") {
            let rest = &url[pos + "/clip/".len()..];
            rest.split(['?', '/', '&', '#']).next().unwrap_or("").to_string()
        } else if !url.contains('/') && url.len() > 5 {
            url.clone()
        } else {
            String::new()
        };

        if !slug.is_empty() {
            final_twitch_clip_id = Some(slug.clone());

            // Tenta buscar credenciais da Twitch do banco e libera a trava antes do await
            let creds = {
                let conn = state
                    .db
                    .lock()
                    .map_err(|e| AppError::Database(e.to_string()))?;
                let mut cid = None;
                let mut csec = None;
                if let Ok(mut stmt) = conn.prepare("SELECT key, value FROM settings WHERE key IN ('twitch_client_id', 'twitch_client_secret')") {
                    if let Ok(rows) = stmt.query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, Option<String>>(1)?))) {
                        for (k, v) in rows.flatten() {
                            match k.as_str() {
                                "twitch_client_id" => cid = v,
                                "twitch_client_secret" => csec = v,
                                _ => {}
                            }
                        }
                    }
                }
                (cid, csec)
            };

            if let (Some(client_id), Some(client_secret)) = creds {
                let mut twitch = crate::api::twitch::TwitchClient::new(client_id, client_secret);
                if twitch.authenticate().await.is_ok() {
                    if let Ok(Some(clip_info)) = twitch.get_clip_by_id(&slug).await {
                        if final_thumb.is_none() && !clip_info.thumbnail_url.is_empty() {
                            final_thumb = Some(clip_info.thumbnail_url);
                        }
                        if !clip_info.game_name.is_empty() {
                            final_game_name = Some(clip_info.game_name);
                        }
                        final_views = clip_info.view_count;
                        final_duration = Some(clip_info.duration.round() as i64);
                    }
                }
            }
        }
    }

    if let Some(ref yt_url) = youtube_url {
        let yt_id = if let Some(pos) = yt_url.find("shorts/") {
            let rest = &yt_url[pos + "shorts/".len()..];
            rest.split(['?', '/', '&', '#']).next().unwrap_or("").to_string()
        } else if let Some(pos) = yt_url.find("youtu.be/") {
            let rest = &yt_url[pos + "youtu.be/".len()..];
            rest.split(['?', '/', '&', '#']).next().unwrap_or("").to_string()
        } else if let Some(pos) = yt_url.find("v=") {
            let rest = &yt_url[pos + "v=".len()..];
            rest.split(['?', '/', '&', '#']).next().unwrap_or("").to_string()
        } else {
            String::new()
        };

        if !yt_id.is_empty() && final_thumb.is_none() {
            final_thumb = Some(format!("https://img.youtube.com/vi/{}/hqdefault.jpg", yt_id));
        }
    }

    let conn = state
        .db
        .lock()
        .map_err(|e| AppError::Database(e.to_string()))?;

    conn.execute(
        "INSERT INTO clips (twitch_clip_id, title, twitch_url, youtube_url, thumbnail_url, duration, views, game_name, clip_date, status, notes) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![final_twitch_clip_id, title, twitch_url, youtube_url, final_thumb, final_duration, final_views, final_game_name, clip_date, status_val, notes],
    )?;

    let id = conn.last_insert_rowid();

    // Auto-categorizar pelo jogo se o nome do jogo for conhecido
    if let Some(ref gname) = final_game_name {
        if !gname.is_empty() {
            const CATEGORY_COLORS: &[&str] = &[
                "#a78bfa", "#34d399", "#f59e0b", "#60a5fa", "#f472b6", "#fb923c", "#2dd4bf", "#818cf8",
            ];
            let cat_id = match conn.query_row("SELECT id FROM categories WHERE name = ?1", params![gname], |row| row.get::<_, i64>(0)) {
                Ok(cid) => cid,
                Err(_) => {
                    let color_idx = gname.len() % CATEGORY_COLORS.len();
                    let color = CATEGORY_COLORS[color_idx];
                    let _ = conn.execute("INSERT INTO categories (name, color) VALUES (?1, ?2)", params![gname, color]);
                    conn.last_insert_rowid()
                }
            };
            let _ = conn.execute("INSERT OR IGNORE INTO clip_categories (clip_id, category_id) VALUES (?1, ?2)", params![id, cat_id]);
        }
    }

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
        "SELECT c.id, c.title, c.twitch_url, c.youtube_url, c.instagram_url, c.thumbnail_url, c.duration, c.created_at, c.clip_date, c.status, c.notes, c.twitch_clip_id, c.match_id, c.views, c.game_name,
                (SELECT GROUP_CONCAT(category_id) FROM clip_categories WHERE clip_id = c.id) AS category_ids
         FROM clips c WHERE c.id = ?1"
    )?;

    let clip = stmt
        .query_row(params![id], |row| {
            let cat_str: Option<String> = row.get(15)?;
            let category_ids =
                cat_str.map(|s| s.split(',').filter_map(|p| p.parse::<i64>().ok()).collect());

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
                views: row.get(13)?,
                game_name: row.get(14)?,
                category_ids,
            })
        })
        .map_err(|_| AppError::NotFound(format!("Clip with id {id} not found")))?;

    Ok(clip)
}

#[tauri::command]
pub fn list_clips(
    state: State<'_, DbState>,
    filter_status: Option<String>,
    filter_category_id: Option<i64>,
    search_query: Option<String>,
    sort_by: Option<String>,
    sort_order: Option<String>,
) -> Result<Vec<Clip>> {
    let conn = state
        .db
        .lock()
        .map_err(|e| AppError::Database(e.to_string()))?;

    let mut sql = "SELECT c.id, c.title, c.twitch_url, c.youtube_url, c.instagram_url, c.thumbnail_url, c.duration, c.created_at, c.clip_date, c.status, c.notes, c.twitch_clip_id, c.match_id, c.views, c.game_name,
            (SELECT GROUP_CONCAT(category_id) FROM clip_categories WHERE clip_id = c.id) AS category_ids
     FROM clips c WHERE 1=1".to_string();
    let mut param_values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(ref status) = filter_status {
        sql.push_str(" AND c.status = ?");
        param_values.push(Box::new(status.clone()));
    }

    if let Some(cat_id) = filter_category_id {
        sql.push_str(" AND c.id IN (SELECT clip_id FROM clip_categories WHERE category_id = ?)");
        param_values.push(Box::new(cat_id));
    }

    if let Some(ref search) = search_query {
        sql.push_str(" AND c.title LIKE ?");
        param_values.push(Box::new(format!("%{search}%")));
    }

    let sort_col = match sort_by.as_deref() {
        Some("title") => "c.title",
        Some("clip_date") => "c.clip_date",
        Some("views") => "c.views",
        _ => "c.created_at",
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
            let cat_str: Option<String> = row.get(15)?;
            let category_ids =
                cat_str.map(|s| s.split(',').filter_map(|p| p.parse::<i64>().ok()).collect());

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
                views: row.get(13)?,
                game_name: row.get(14)?,
                category_ids,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(clips)
}

#[tauri::command]
pub fn delete_all_clips(state: State<'_, DbState>) -> Result<()> {
    let conn = state
        .db
        .lock()
        .map_err(|e| AppError::Database(e.to_string()))?;

    conn.execute("DELETE FROM clips", [])?;
    Ok(())
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

    // Auto-promote to "Postado" when a YouTube URL is linked,
    // unless the user explicitly set a different terminal status.
    let has_youtube = youtube_url
        .as_deref()
        .map(|u| !u.trim().is_empty())
        .unwrap_or(false);

    let effective_status = if has_youtube && status != "Postado" && status != "Descartado" {
        "Postado".to_string()
    } else {
        status
    };

    let rows = conn.execute(
        "UPDATE clips SET title = ?1, twitch_url = ?2, youtube_url = ?3, instagram_url = ?4, thumbnail_url = ?5, duration = ?6, clip_date = ?7, status = ?8, notes = ?9 WHERE id = ?10",
        params![title, twitch_url, youtube_url, instagram_url, thumbnail_url, duration, clip_date, effective_status, notes, id],
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
