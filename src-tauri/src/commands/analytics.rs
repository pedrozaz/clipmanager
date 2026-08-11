use crate::DbState;
use crate::api::youtube::YoutubeClient;
use crate::db::models::Analytics;
use crate::errors::{AppError, Result};
use rusqlite::params;
use serde::Serialize;
use tauri::State;

#[derive(Debug, Serialize)]
pub struct DashboardStats {
    pub total_clips: i64,
    pub total_views: i64,
    pub avg_likes: f64,
    pub top_clip_title: Option<String>,
    pub top_clip_views: i64,
}

#[derive(Debug, Serialize)]
pub struct StatusCount {
    pub status: String,
    pub count: i64,
}

#[derive(Debug, Serialize)]
pub struct TopClipStat {
    pub id: i64,
    pub title: String,
    pub views: i64,
    pub likes: i64,
    pub status: String,
    pub youtube_url: Option<String>,
}

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
    let stats = client.get_video_stats("dQw4w9WgXcQ").await?;

    Ok(format!(
        "Conexão bem-sucedida! Título retornado: '{}' (Views: {})",
        stats.title, stats.views
    ))
}

#[tauri::command]
pub fn get_dashboard_stats(state: State<'_, DbState>) -> Result<DashboardStats> {
    let conn = state
        .db
        .lock()
        .map_err(|e| AppError::Database(e.to_string()))?;

    let total_clips: i64 = conn
        .query_row("SELECT COUNT(*) FROM clips", [], |r| r.get(0))
        .unwrap_or(0);

    let total_views: i64 = conn
        .query_row(
            "SELECT COALESCE(SUM(views), 0) FROM (SELECT views FROM analytics GROUP BY clip_id HAVING id = MAX(id))",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0);

    let avg_likes: f64 = conn
        .query_row(
            "SELECT COALESCE(AVG(likes), 0.0) FROM (SELECT likes FROM analytics GROUP BY clip_id HAVING id = MAX(id))",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0.0);

    let (top_clip_title, top_clip_views) = conn
        .query_row(
            "SELECT c.title, MAX(a.views) FROM clips c JOIN analytics a ON c.id = a.clip_id GROUP BY c.id ORDER BY a.views DESC LIMIT 1",
            [],
            |r| Ok((r.get::<_, String>(0)?, r.get::<_, i64>(1)?)),
        )
        .ok()
        .map(|(t, v)| (Some(t), v))
        .unwrap_or((None, 0));

    Ok(DashboardStats {
        total_clips,
        total_views,
        avg_likes,
        top_clip_title,
        top_clip_views,
    })
}

#[tauri::command]
pub fn get_clips_by_status_count(state: State<'_, DbState>) -> Result<Vec<StatusCount>> {
    let conn = state
        .db
        .lock()
        .map_err(|e| AppError::Database(e.to_string()))?;

    let mut stmt = conn.prepare("SELECT status, COUNT(*) FROM clips GROUP BY status")?;
    let list = stmt
        .query_map([], |row| {
            Ok(StatusCount {
                status: row.get(0)?,
                count: row.get(1)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(list)
}

#[tauri::command]
pub fn get_top_clips(state: State<'_, DbState>, limit: Option<i64>) -> Result<Vec<TopClipStat>> {
    let conn = state
        .db
        .lock()
        .map_err(|e| AppError::Database(e.to_string()))?;
    let l = limit.unwrap_or(10);

    let mut stmt = conn.prepare(
        "SELECT c.id, c.title, MAX(a.views) as views, MAX(a.likes) as likes, c.status, c.youtube_url
         FROM clips c JOIN analytics a ON c.id = a.clip_id
         GROUP BY c.id ORDER BY views DESC LIMIT ?1",
    )?;

    let list = stmt
        .query_map(params![l], |row| {
            Ok(TopClipStat {
                id: row.get(0)?,
                title: row.get(1)?,
                views: row.get(2)?,
                likes: row.get(3)?,
                status: row.get(4)?,
                youtube_url: row.get(5)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(list)
}
