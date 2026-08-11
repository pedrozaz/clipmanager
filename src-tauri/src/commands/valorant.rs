use crate::DbState;
use crate::api::henrik::{HenrikClient, ValorantMatchInfo};
use crate::db::models::MatchData;
use crate::errors::{AppError, Result};
use rusqlite::params;
use tauri::State;

#[tauri::command]
pub async fn fetch_recent_matches(
    state: State<'_, DbState>,
    size: Option<i64>,
    start: Option<i64>,
    mode: Option<String>,
) -> Result<Vec<ValorantMatchInfo>> {
    let (riot_id, region, api_key) = {
        let conn = state
            .db
            .lock()
            .map_err(|e| AppError::Database(e.to_string()))?;

        let mut stmt = conn.prepare(
            "SELECT key, value FROM settings WHERE key IN ('riot_id', 'valorant_region', 'valorant_api_key')",
        )?;
        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, Option<String>>(1)?))
        })?;

        let mut rid = None;
        let mut reg = None;
        let mut key = None;

        for (k, v) in rows.flatten() {
            match k.as_str() {
                "riot_id" => rid = v,
                "valorant_region" => reg = v,
                "valorant_api_key" => key = v,
                _ => {}
            }
        }

        (
            rid.ok_or_else(|| {
                AppError::NotFound("Riot ID não configurado nas Configurações.".to_string())
            })?,
            reg.unwrap_or_else(|| "br".to_string()),
            key,
        )
    };

    let parts: Vec<&str> = riot_id.split('#').collect();
    if parts.len() != 2 {
        return Err(AppError::Parse(
            "Formato do Riot ID inválido. Use o formato Nome#TAG (ex: Streamer#BR1).".to_string(),
        ));
    }

    let client = HenrikClient::new(api_key);
    client.get_recent_matches(&region, parts[0], parts[1], size, start, mode.as_deref()).await
}

#[tauri::command]
pub async fn fetch_match_by_id(
    state: State<'_, DbState>,
    match_id: String,
) -> Result<ValorantMatchInfo> {
    let (riot_id, region, api_key) = {
        let conn = state
            .db
            .lock()
            .map_err(|e| AppError::Database(e.to_string()))?;

        let mut stmt = conn.prepare(
            "SELECT key, value FROM settings WHERE key IN ('riot_id', 'valorant_region', 'valorant_api_key')",
        )?;
        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, Option<String>>(1)?))
        })?;

        let mut rid = None;
        let mut reg = None;
        let mut key = None;

        for (k, v) in rows.flatten() {
            match k.as_str() {
                "riot_id" => rid = v,
                "valorant_region" => reg = v,
                "valorant_api_key" => key = v,
                _ => {}
            }
        }

        (
            rid.ok_or_else(|| AppError::NotFound("Riot ID não configurado nas Configurações.".to_string()))?,
            reg.unwrap_or_else(|| "br".to_string()),
            key,
        )
    };

    let parts: Vec<&str> = riot_id.split('#').collect();
    let name = parts.first().copied().unwrap_or("");
    let tag = parts.get(1).copied().unwrap_or("");

    let client = HenrikClient::new(api_key);
    client.get_match_by_id(&region, &match_id, name, tag).await
}

#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub fn link_match_to_clip(
    state: State<'_, DbState>,
    clip_id: i64,
    match_id: String,
    agent: String,
    map: String,
    score: String,
    kda: String,
    result: String,
    rank: Option<String>,
) -> Result<MatchData> {
    let conn = state
        .db
        .lock()
        .map_err(|e| AppError::Database(e.to_string()))?;

    conn.execute(
        "DELETE FROM match_data WHERE clip_id = ?1",
        params![clip_id],
    )?;

    conn.execute(
        "INSERT INTO match_data (clip_id, match_id, agent, map, score, kda, result, rank)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![clip_id, match_id, agent, map, score, kda, result, rank],
    )?;

    let _ = conn.execute(
        "UPDATE clips SET match_id = ?1 WHERE id = ?2",
        params![match_id, clip_id],
    );

    let last_id = conn.last_insert_rowid();

    let mut stmt = conn.prepare(
        "SELECT id, clip_id, match_id, agent, map, score, kda, result, rank FROM match_data WHERE id = ?1",
    )?;

    let data = stmt.query_row(params![last_id], |row| {
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
    })?;

    Ok(data)
}

#[tauri::command]
pub fn get_clip_match_data(state: State<'_, DbState>, clip_id: i64) -> Result<Option<MatchData>> {
    let conn = state
        .db
        .lock()
        .map_err(|e| AppError::Database(e.to_string()))?;

    let mut stmt = conn.prepare(
        "SELECT id, clip_id, match_id, agent, map, score, kda, result, rank FROM match_data WHERE clip_id = ?1",
    )?;

    let data = stmt
        .query_row(params![clip_id], |row| {
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
        })
        .ok();

    Ok(data)
}

#[tauri::command]
pub fn unlink_match_from_clip(state: State<'_, DbState>, clip_id: i64) -> Result<()> {
    let conn = state
        .db
        .lock()
        .map_err(|e| AppError::Database(e.to_string()))?;

    conn.execute(
        "DELETE FROM match_data WHERE clip_id = ?1",
        params![clip_id],
    )?;

    let _ = conn.execute(
        "UPDATE clips SET match_id = NULL WHERE id = ?1",
        params![clip_id],
    );

    Ok(())
}

#[tauri::command]
pub async fn test_valorant_connection(state: State<'_, DbState>) -> Result<String> {
    let matches = fetch_recent_matches(state, Some(5), Some(0), None).await?;

    if matches.is_empty() {
        Ok(
            "Conexão com a Henrik API efetuada com sucesso! Nenhuma partida recente encontrada."
                .to_string(),
        )
    } else {
        let first = &matches[0];
        Ok(format!(
            "Conexão bem-sucedida! Última partida: Mapa {} com {} ({}) - Placar {}",
            first.map, first.agent, first.result, first.score
        ))
    }
}
