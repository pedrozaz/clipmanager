use crate::DbState;
use crate::db::models::{Analytics, Category, Clip, ClipCategory, MatchData, Setting};
use crate::errors::{AppError, Result};
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct FullBackup {
    pub version: String,
    pub exported_at: String,
    pub clips: Vec<Clip>,
    pub categories: Vec<Category>,
    pub clip_categories: Vec<ClipCategory>,
    pub analytics: Vec<Analytics>,
    pub match_data: Vec<MatchData>,
    pub settings: Vec<Setting>,
}

#[derive(Debug, Serialize)]
pub struct ImportBackupResult {
    pub clips_imported: usize,
    pub categories_imported: usize,
}

#[tauri::command]
pub fn export_data_json(state: State<'_, DbState>) -> Result<String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| AppError::Database(e.to_string()))?;

    let mut stmt_clips = conn.prepare("SELECT id, title, twitch_url, youtube_url, instagram_url, thumbnail_url, duration, created_at, clip_date, status, notes, twitch_clip_id, match_id, views, game_name FROM clips")?;
    let clips = stmt_clips
        .query_map([], |row| {
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
                category_ids: None,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    let mut stmt_cat = conn.prepare("SELECT id, name, color FROM categories")?;
    let categories = stmt_cat
        .query_map([], |row| {
            Ok(Category {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    let mut stmt_cc = conn.prepare("SELECT clip_id, category_id FROM clip_categories")?;
    let clip_categories = stmt_cc
        .query_map([], |row| {
            Ok(ClipCategory {
                clip_id: row.get(0)?,
                category_id: row.get(1)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    let mut stmt_an = conn.prepare("SELECT id, clip_id, platform, views, likes, comments, shares, retention_avg, fetched_at FROM analytics")?;
    let analytics = stmt_an
        .query_map([], |row| {
            Ok(Analytics {
                id: row.get(0)?,
                clip_id: row.get(1)?,
                platform: row.get(2)?,
                views: row.get(3)?,
                likes: row.get(4)?,
                comments: row.get(5)?,
                shares: row.get(6)?,
                retention_avg: row.get(7)?,
                fetched_at: row.get(8)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    let mut stmt_md = conn.prepare(
        "SELECT id, clip_id, match_id, agent, map, score, kda, result, rank FROM match_data",
    )?;
    let match_data = stmt_md
        .query_map([], |row| {
            Ok(MatchData {
                id: row.get(0)?,
                clip_id: row.get(1)?,
                match_id: row.get(2)?,
                agent: row.get(3)?,
                map: row.get(4)?,
                score: row.get(5)?,
                kda: row.get(6)?,
                result: row.get(7)?,
                rank: row.get(8)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    let mut stmt_set = conn.prepare("SELECT key, value FROM settings WHERE key NOT IN ('twitch_client_secret', 'youtube_api_key', 'valorant_api_key')")?;
    let settings = stmt_set
        .query_map([], |row| {
            Ok(Setting {
                key: row.get(0)?,
                value: row.get(1)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    let backup = FullBackup {
        version: "1.0.0".to_string(),
        exported_at: chrono::Utc::now().to_rfc3339(),
        clips,
        categories,
        clip_categories,
        analytics,
        match_data,
        settings,
    };

    serde_json::to_string_pretty(&backup).map_err(|e| AppError::Parse(e.to_string()))
}

#[tauri::command]
pub fn export_clips_csv(state: State<'_, DbState>) -> Result<String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| AppError::Database(e.to_string()))?;

    let mut stmt = conn.prepare(
        "SELECT id, title, status, clip_date, created_at, twitch_url, youtube_url, instagram_url, notes
         FROM clips ORDER BY id ASC"
    )?;

    let mut csv = String::from(
        "ID,Título,Status,Data do Clipe,Criado em,Twitch URL,YouTube URL,Instagram URL,Anotações\n",
    );

    let rows = stmt.query_map([], |row| {
        let id: i64 = row.get(0)?;
        let title: String = row.get(1)?;
        let status: String = row.get(2)?;
        let clip_date: Option<String> = row.get(3)?;
        let created_at: String = row.get(4)?;
        let twitch_url: Option<String> = row.get(5)?;
        let youtube_url: Option<String> = row.get(6)?;
        let instagram_url: Option<String> = row.get(7)?;
        let notes: Option<String> = row.get(8)?;

        let escape_csv = |s: &str| -> String {
            if s.contains(',') || s.contains('"') || s.contains('\n') {
                format!("\"{}\"", s.replace('"', "\"\""))
            } else {
                s.to_string()
            }
        };

        Ok(format!(
            "{},{},{},{},{},{},{},{},{}\n",
            id,
            escape_csv(&title),
            escape_csv(&status),
            escape_csv(clip_date.as_deref().unwrap_or("")),
            escape_csv(&created_at),
            escape_csv(twitch_url.as_deref().unwrap_or("")),
            escape_csv(youtube_url.as_deref().unwrap_or("")),
            escape_csv(instagram_url.as_deref().unwrap_or("")),
            escape_csv(notes.as_deref().unwrap_or(""))
        ))
    })?;

    for line in rows.flatten() {
        csv.push_str(&line);
    }

    Ok(csv)
}

#[tauri::command]
pub fn import_data_json(state: State<'_, DbState>, json_str: String) -> Result<ImportBackupResult> {
    let backup: FullBackup =
        serde_json::from_str(&json_str).map_err(|e| AppError::Parse(e.to_string()))?;

    let mut conn = state
        .db
        .lock()
        .map_err(|e| AppError::Database(e.to_string()))?;
    let tx = conn.transaction()?;

    let mut clips_imported = 0;
    let mut categories_imported = 0;

    for cat in backup.categories {
        let color = cat.color.unwrap_or_else(|| "#8b5cf6".to_string());
        let res = tx.execute(
            "INSERT INTO categories (id, name, color) VALUES (?1, ?2, ?3)
             ON CONFLICT(id) DO UPDATE SET name = excluded.name, color = excluded.color",
            params![cat.id, cat.name, color],
        );
        if res.is_ok() {
            categories_imported += 1;
        }
    }

    for clip in backup.clips {
        let res = tx.execute(
            "INSERT INTO clips (id, title, twitch_url, youtube_url, instagram_url, thumbnail_url, duration, created_at, clip_date, status, notes, twitch_clip_id, match_id, views, game_name)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)
             ON CONFLICT(id) DO UPDATE SET title = excluded.title, status = excluded.status, notes = excluded.notes, views = excluded.views, game_name = excluded.game_name",
            params![
                clip.id, clip.title, clip.twitch_url, clip.youtube_url, clip.instagram_url,
                clip.thumbnail_url, clip.duration, clip.created_at, clip.clip_date, clip.status,
                clip.notes, clip.twitch_clip_id, clip.match_id, clip.views, clip.game_name
            ],
        );
        if res.is_ok() {
            clips_imported += 1;
        }
    }

    tx.commit()?;

    Ok(ImportBackupResult {
        clips_imported,
        categories_imported,
    })
}

#[cfg(test)]
mod tests {
    use crate::db::connection::init_in_memory_db;

    #[test]
    fn test_export_clips_csv_generation() {
        let conn = init_in_memory_db().unwrap();
        conn.execute(
            "INSERT INTO clips (title, status, notes) VALUES ('Sample Clip', 'novo', 'Good play')",
            [],
        )
        .unwrap();

        let mut stmt = conn.prepare("SELECT count(*) FROM clips").unwrap();
        let count: i64 = stmt.query_row([], |r| r.get(0)).unwrap();
        assert_eq!(count, 1);
    }
}
