use crate::DbState;
use crate::api::youtube::YoutubeClient;
use crate::db::models::Analytics;
use crate::errors::{AppError, Result};
use rusqlite::params;
use tauri::State;

#[tauri::command]
pub async fn fetch_youtube_analytics(state: State<'_, DbState>, clip_id: i64) -> Result<Analytics> {
    let (youtube_url, api_key) = {
        let conn = state
            .db
            .lock()
            .map_err(|e| AppError::Database(e.to_string()))?;

        let mut clip_stmt = conn.prepare("SELECT youtube_url FROM clips WHERE id = ?1")?;
        let youtube_url: Option<String> =
            clip_stmt
                .query_row(params![clip_id], |row| row.get(0))
                .map_err(|_| AppError::NotFound(format!("Clipe {clip_id} não encontrado.")))?;

        let url = youtube_url.ok_or_else(|| {
            AppError::NotFound("Este clipe não possui uma URL do YouTube configurada.".to_string())
        })?;

        let mut setting_stmt =
            conn.prepare("SELECT value FROM settings WHERE key = 'youtube_api_key'")?;
        let key: Option<String> = setting_stmt.query_row([], |row| row.get(0)).unwrap_or(None);

        let api_key = key.ok_or_else(|| {
            AppError::NotFound(
                "YouTube Data API Key não configurada nas Configurações.".to_string(),
            )
        })?;

        (url, api_key)
    };

    let video_id = YoutubeClient::extract_video_id(&youtube_url)?;
    let client = YoutubeClient::new(api_key);
    let stats = client.get_video_stats(&video_id).await?;

    let conn = state
        .db
        .lock()
        .map_err(|e| AppError::Database(e.to_string()))?;

    conn.execute(
        "INSERT INTO analytics (clip_id, platform, views, likes, comments, shares, retention_avg)
         VALUES (?1, 'youtube', ?2, ?3, ?4, 0, NULL)",
        params![clip_id, stats.views, stats.likes, stats.comments],
    )?;

    let last_id = conn.last_insert_rowid();

    let mut stmt = conn.prepare(
        "SELECT id, clip_id, platform, views, likes, comments, shares, retention_avg, fetched_at
         FROM analytics WHERE id = ?1",
    )?;

    let analytics = stmt.query_row(params![last_id], |row| {
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
    })?;

    Ok(analytics)
}

#[tauri::command]
pub async fn fetch_all_analytics(state: State<'_, DbState>) -> Result<Vec<Analytics>> {
    let clip_ids = {
        let conn = state
            .db
            .lock()
            .map_err(|e| AppError::Database(e.to_string()))?;
        let mut stmt = conn
            .prepare("SELECT id FROM clips WHERE youtube_url IS NOT NULL AND youtube_url != ''")?;
        let rows = stmt.query_map([], |row| row.get::<_, i64>(0))?;
        rows.filter_map(std::result::Result::ok)
            .collect::<Vec<i64>>()
    };

    let mut results = Vec::new();
    for id in clip_ids {
        if let Ok(analytics) = fetch_youtube_analytics(state.clone(), id).await {
            results.push(analytics);
        }
    }

    Ok(results)
}

#[tauri::command]
pub fn get_analytics_history(state: State<'_, DbState>, clip_id: i64) -> Result<Vec<Analytics>> {
    let conn = state
        .db
        .lock()
        .map_err(|e| AppError::Database(e.to_string()))?;

    let mut stmt = conn.prepare(
        "SELECT id, clip_id, platform, views, likes, comments, shares, retention_avg, fetched_at
         FROM analytics WHERE clip_id = ?1 ORDER BY fetched_at ASC",
    )?;

    let history = stmt
        .query_map(params![clip_id], |row| {
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

    Ok(history)
}

#[tauri::command]
pub async fn test_youtube_connection(state: State<'_, DbState>) -> Result<String> {
    let api_key = {
        let conn = state
            .db
            .lock()
            .map_err(|e| AppError::Database(e.to_string()))?;
        let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = 'youtube_api_key'")?;
        let key: Option<String> = stmt.query_row([], |row| row.get(0)).unwrap_or(None);
        key.ok_or_else(|| AppError::NotFound("YouTube Data API Key não configurada.".to_string()))?
    };

    let client = YoutubeClient::new(api_key);
    // Use Rick Astley video ID as reference test
    let stats = client.get_video_stats("dQw4w9WgXcQ").await?;

    Ok(format!(
        "Conexão bem-sucedida! Título retornado: '{}' (Views: {})",
        stats.title, stats.views
    ))
}
