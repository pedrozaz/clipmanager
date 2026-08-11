use crate::DbState;
use crate::api::twitch::TwitchClient;
use crate::errors::{AppError, Result};
use chrono::{Duration, Utc};
use rusqlite::params;
use serde::Serialize;
use tauri::State;

#[derive(Debug, Serialize)]
pub struct ImportResult {
    pub imported: usize,
    pub skipped: usize,
    pub errors: Vec<String>,
}

#[tauri::command]
pub async fn import_twitch_clips(
    state: State<'_, DbState>,
    days_back: u32,
) -> Result<ImportResult> {
    let (client_id, client_secret, username) = {
        let conn = state
            .db
            .lock()
            .map_err(|e| AppError::Database(e.to_string()))?;
        let mut stmt = conn.prepare("SELECT key, value FROM settings WHERE key IN ('twitch_client_id', 'twitch_client_secret', 'twitch_username')")?;
        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, Option<String>>(1)?))
        })?;

        let mut cid = None;
        let mut csec = None;
        let mut uname = None;

        for (k, v) in rows.flatten() {
            match k.as_str() {
                "twitch_client_id" => cid = v,
                "twitch_client_secret" => csec = v,
                "twitch_username" => uname = v,
                _ => {}
            }
        }

        (
            cid.ok_or_else(|| {
                AppError::NotFound(
                    "Twitch Client ID não configurado nas Configurações.".to_string(),
                )
            })?,
            csec.ok_or_else(|| {
                AppError::NotFound(
                    "Twitch Client Secret não configurado nas Configurações.".to_string(),
                )
            })?,
            uname.ok_or_else(|| {
                AppError::NotFound(
                    "Nome de usuário da Twitch não configurado nas Configurações.".to_string(),
                )
            })?,
        )
    };

    let mut twitch = TwitchClient::new(client_id, client_secret);
    twitch.authenticate().await?;

    let broadcaster_id = twitch.get_user_id(&username).await?;
    let start_date = Utc::now() - Duration::days(days_back as i64);
    let started_at_iso = start_date.to_rfc3339();

    let clips = twitch.get_clips(&broadcaster_id, &started_at_iso).await?;

    let mut imported = 0;
    let mut skipped = 0;
    let mut errors = Vec::new();

    let conn = state
        .db
        .lock()
        .map_err(|e| AppError::Database(e.to_string()))?;

    for clip in clips {
        let clip_date = clip.created_at.split('T').next().unwrap_or("").to_string();
        let duration_secs = clip.duration.round() as i64;
        let created_at_iso = clip.created_at.clone();

        let res = conn.execute(
            "INSERT INTO clips (title, twitch_url, thumbnail_url, duration, created_at, clip_date, status, twitch_clip_id, views)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'Novo', ?7, ?8)
             ON CONFLICT(twitch_clip_id) DO UPDATE SET
                title = excluded.title,
                thumbnail_url = excluded.thumbnail_url,
                created_at = excluded.created_at,
                clip_date = excluded.clip_date,
                views = excluded.views",
            params![
                clip.title,
                clip.url,
                clip.thumbnail_url,
                duration_secs,
                created_at_iso,
                clip_date,
                clip.id,
                clip.view_count
            ],
        );

        match res {
            Ok(rows) => {
                if rows > 0 {
                    imported += 1;
                } else {
                    skipped += 1;
                }
            }
            Err(e) => {
                errors.push(format!("Failed to insert clip '{}': {e}", clip.title));
            }
        }
    }

    Ok(ImportResult {
        imported,
        skipped,
        errors,
    })
}

#[tauri::command]
pub async fn test_twitch_connection(state: State<'_, DbState>) -> Result<String> {
    let (client_id, client_secret, username) = {
        let conn = state
            .db
            .lock()
            .map_err(|e| AppError::Database(e.to_string()))?;
        let mut stmt = conn.prepare("SELECT key, value FROM settings WHERE key IN ('twitch_client_id', 'twitch_client_secret', 'twitch_username')")?;
        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, Option<String>>(1)?))
        })?;

        let mut cid = None;
        let mut csec = None;
        let mut uname = None;

        for (k, v) in rows.flatten() {
            match k.as_str() {
                "twitch_client_id" => cid = v,
                "twitch_client_secret" => csec = v,
                "twitch_username" => uname = v,
                _ => {}
            }
        }

        (
            cid.unwrap_or_default(),
            csec.unwrap_or_default(),
            uname.unwrap_or_default(),
        )
    };

    if client_id.is_empty() || client_secret.is_empty() || username.is_empty() {
        return Err(AppError::NotFound(
            "Por favor, preencha Client ID, Client Secret e Usuário.".to_string(),
        ));
    }

    let mut twitch = TwitchClient::new(client_id, client_secret);
    twitch.authenticate().await?;
    let broadcaster_id = twitch.get_user_id(&username).await?;

    Ok(format!(
        "Conexão bem-sucedida! Broadcaster ID do usuário '{username}': {broadcaster_id}"
    ))
}
