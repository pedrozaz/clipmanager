use crate::errors::{AppError, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TwitchClipData {
    pub id: String,
    pub url: String,
    pub embed_url: String,
    pub title: String,
    pub thumbnail_url: String,
    pub duration: f64,
    pub created_at: String,
    pub view_count: i64,
    #[serde(default)]
    pub game_id: String,
    #[serde(default)]
    pub game_name: String,
}

#[derive(Debug, Deserialize)]
struct TwitchUserResponse {
    data: Vec<TwitchUser>,
}

#[derive(Debug, Deserialize)]
struct TwitchUser {
    id: String,
}

#[derive(Debug, Deserialize)]
struct TwitchClipsResponse {
    data: Vec<TwitchClipData>,
}

#[derive(Debug, Deserialize)]
struct TwitchTokenResponse {
    access_token: String,
}

#[derive(Debug, Deserialize)]
struct TwitchGameResponse {
    data: Vec<TwitchGame>,
}

#[derive(Debug, Deserialize)]
struct TwitchGame {
    id: String,
    name: String,
}

pub struct TwitchClient {
    client_id: String,
    client_secret: String,
    access_token: Option<String>,
    http: Client,
}

impl TwitchClient {
    pub fn new(client_id: String, client_secret: String) -> Self {
        Self {
            client_id,
            client_secret,
            access_token: None,
            http: Client::new(),
        }
    }

    pub async fn authenticate(&mut self) -> Result<()> {
        let params = [
            ("client_id", self.client_id.as_str()),
            ("client_secret", self.client_secret.as_str()),
            ("grant_type", "client_credentials"),
        ];

        let res = self
            .http
            .post("https://id.twitch.tv/oauth2/token")
            .form(&params)
            .send()
            .await?;

        if !res.status().is_success() {
            let err_text = res.text().await.unwrap_or_default();
            return Err(AppError::Api(format!("Twitch auth failed: {err_text}")));
        }

        let token_res: TwitchTokenResponse = res.json().await?;
        self.access_token = Some(token_res.access_token);
        Ok(())
    }

    pub async fn get_user_id(&self, username: &str) -> Result<String> {
        let token = self
            .access_token
            .as_ref()
            .ok_or_else(|| AppError::Api("Twitch client not authenticated".to_string()))?;

        let res = self
            .http
            .get("https://api.twitch.tv/helix/users")
            .query(&[("login", username)])
            .header("Client-ID", &self.client_id)
            .header("Authorization", format!("Bearer {token}"))
            .send()
            .await?;

        if !res.status().is_success() {
            let err_text = res.text().await.unwrap_or_default();
            return Err(AppError::Api(format!("Twitch get user failed: {err_text}")));
        }

        let user_res: TwitchUserResponse = res.json().await?;
        let user = user_res
            .data
            .into_iter()
            .next()
            .ok_or_else(|| AppError::NotFound(format!("Twitch user '{username}' not found")))?;

        Ok(user.id)
    }

    pub async fn get_games_by_ids(
        &self,
        game_ids: &[String],
    ) -> Result<std::collections::HashMap<String, String>> {
        if game_ids.is_empty() {
            return Ok(std::collections::HashMap::new());
        }

        let token = self
            .access_token
            .as_ref()
            .ok_or_else(|| AppError::Api("Twitch client not authenticated".to_string()))?;

        let mut query_params: Vec<(&str, &str)> = Vec::new();
        for id in game_ids {
            if !id.is_empty() {
                query_params.push(("id", id.as_str()));
            }
        }

        if query_params.is_empty() {
            return Ok(std::collections::HashMap::new());
        }

        let res = self
            .http
            .get("https://api.twitch.tv/helix/games")
            .query(&query_params)
            .header("Client-ID", &self.client_id)
            .header("Authorization", format!("Bearer {token}"))
            .send()
            .await?;

        if !res.status().is_success() {
            return Ok(std::collections::HashMap::new());
        }

        let game_res: TwitchGameResponse = res
            .json()
            .await
            .unwrap_or(TwitchGameResponse { data: vec![] });
        let mut map = std::collections::HashMap::new();
        for game in game_res.data {
            map.insert(game.id, game.name);
        }

        Ok(map)
    }

    pub async fn get_clips(
        &self,
        broadcaster_id: &str,
        started_at: &str,
    ) -> Result<Vec<TwitchClipData>> {
        let token = self
            .access_token
            .as_ref()
            .ok_or_else(|| AppError::Api("Twitch client not authenticated".to_string()))?;

        let res = self
            .http
            .get("https://api.twitch.tv/helix/clips")
            .query(&[
                ("broadcaster_id", broadcaster_id),
                ("started_at", started_at),
                ("first", "100"),
            ])
            .header("Client-ID", &self.client_id)
            .header("Authorization", format!("Bearer {token}"))
            .send()
            .await?;

        if !res.status().is_success() {
            let err_text = res.text().await.unwrap_or_default();
            return Err(AppError::Api(format!(
                "Twitch get clips failed: {err_text}"
            )));
        }

        let clips_res: TwitchClipsResponse = res.json().await?;
        let mut clips = clips_res.data;

        let game_ids: Vec<String> = clips
            .iter()
            .map(|c| c.game_id.clone())
            .filter(|id| !id.is_empty())
            .collect();

        if let Ok(games_map) = self.get_games_by_ids(&game_ids).await {
            for clip in &mut clips {
                if let Some(name) = games_map.get(&clip.game_id) {
                    clip.game_name = name.clone();
                }
            }
        }

        Ok(clips)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_twitch_clip_response_json() {
        let json_data = r#"{
            "data": [
                {
                    "id": "RandomClipId123",
                    "url": "https://clips.twitch.tv/RandomClipId123",
                    "embed_url": "https://clips.twitch.tv/embed?clip=RandomClipId123",
                    "title": "Insane 1v5 Clutch",
                    "thumbnail_url": "https://static-cdn.jtvnw.net/twitch-clips-thumbnails/RandomClipId123-preview-480x272.jpg",
                    "duration": 29.5,
                    "created_at": "2026-08-10T20:15:00Z",
                    "view_count": 1420,
                    "game_id": "516575",
                    "game_name": "VALORANT"
                }
            ]
        }"#;

        let res: TwitchClipsResponse = serde_json::from_str(json_data).unwrap();
        assert_eq!(res.data.len(), 1);
        assert_eq!(res.data[0].id, "RandomClipId123");
        assert_eq!(res.data[0].title, "Insane 1v5 Clutch");
    }
}
