use crate::errors::{AppError, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YoutubeVideoStats {
    pub video_id: String,
    pub title: String,
    pub views: i64,
    pub likes: i64,
    pub comments: i64,
}

#[derive(Debug, Deserialize)]
struct YoutubeApiResponse {
    items: Vec<YoutubeVideoItem>,
}

#[derive(Debug, Deserialize)]
struct YoutubeVideoItem {
    id: String,
    snippet: Option<YoutubeSnippet>,
    statistics: Option<YoutubeStatistics>,
}

#[derive(Debug, Deserialize)]
struct YoutubeSnippet {
    title: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct YoutubeStatistics {
    #[serde(default)]
    view_count: String,
    #[serde(default)]
    like_count: String,
    #[serde(default)]
    comment_count: String,
}

pub struct YoutubeClient {
    api_key: String,
    http: Client,
}

impl YoutubeClient {
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            http: Client::new(),
        }
    }

    pub fn extract_video_id(url: &str) -> Result<String> {
        let trimmed = url.trim();

        if trimmed.is_empty() {
            return Err(AppError::Parse("URL do YouTube vazia.".to_string()));
        }

        // Format: shorts/ID
        if let Some(pos) = trimmed.find("/shorts/") {
            let id = &trimmed[pos + 8..];
            let id = id.split(&['?', '&', '/'][..]).next().unwrap_or(id);
            if !id.is_empty() {
                return Ok(id.to_string());
            }
        }

        // Format: youtu.be/ID
        if let Some(pos) = trimmed.find("youtu.be/") {
            let id = &trimmed[pos + 9..];
            let id = id.split(&['?', '&', '/'][..]).next().unwrap_or(id);
            if !id.is_empty() {
                return Ok(id.to_string());
            }
        }

        // Format: watch?v=ID
        if let Some(pos) = trimmed.find("v=") {
            let id = &trimmed[pos + 2..];
            let id = id.split('&').next().unwrap_or(id);
            if !id.is_empty() {
                return Ok(id.to_string());
            }
        }

        // Raw 11-char ID
        if trimmed.len() == 11 && !trimmed.contains('/') {
            return Ok(trimmed.to_string());
        }

        Err(AppError::Parse(format!(
            "Não foi possível extrair o ID do vídeo do YouTube a partir da URL: {url}"
        )))
    }

    pub async fn get_video_stats(&self, video_id: &str) -> Result<YoutubeVideoStats> {
        if self.api_key.trim().is_empty() {
            return Err(AppError::NotFound(
                "YouTube Data API Key não configurada nas Configurações.".to_string(),
            ));
        }

        let res = self
            .http
            .get("https://www.googleapis.com/youtube/v3/videos")
            .query(&[
                ("part", "snippet,statistics"),
                ("id", video_id),
                ("key", &self.api_key),
            ])
            .send()
            .await?;

        if !res.status().is_success() {
            let err_text = res.text().await.unwrap_or_default();
            return Err(AppError::Api(format!("YouTube API error: {err_text}")));
        }

        let api_res: YoutubeApiResponse = res.json().await?;
        let item = api_res.items.into_iter().next().ok_or_else(|| {
            AppError::NotFound(format!("Vídeo do YouTube '{video_id}' não encontrado."))
        })?;

        let snippet = item.snippet.unwrap_or(YoutubeSnippet {
            title: "Vídeo sem título".to_string(),
        });

        let stats = item.statistics.unwrap_or(YoutubeStatistics {
            view_count: "0".to_string(),
            like_count: "0".to_string(),
            comment_count: "0".to_string(),
        });

        Ok(YoutubeVideoStats {
            video_id: item.id,
            title: snippet.title,
            views: stats.view_count.parse().unwrap_or(0),
            likes: stats.like_count.parse().unwrap_or(0),
            comments: stats.comment_count.parse().unwrap_or(0),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_video_id_variations() {
        assert_eq!(
            YoutubeClient::extract_video_id("https://www.youtube.com/watch?v=dQw4w9WgXcQ").unwrap(),
            "dQw4w9WgXcQ"
        );
        assert_eq!(
            YoutubeClient::extract_video_id("https://youtu.be/dQw4w9WgXcQ?t=10").unwrap(),
            "dQw4w9WgXcQ"
        );
        assert_eq!(
            YoutubeClient::extract_video_id("https://www.youtube.com/shorts/dQw4w9WgXcQ").unwrap(),
            "dQw4w9WgXcQ"
        );
        assert_eq!(
            YoutubeClient::extract_video_id("dQw4w9WgXcQ").unwrap(),
            "dQw4w9WgXcQ"
        );
        assert!(YoutubeClient::extract_video_id("https://invalid-url.com").is_err());
    }

    #[test]
    fn test_parse_youtube_api_response_json() {
        let json_data = r#"{
            "items": [
                {
                    "id": "dQw4w9WgXcQ",
                    "snippet": { "title": "Never Gonna Give You Up" },
                    "statistics": {
                        "viewCount": "1500000",
                        "likeCount": "100000",
                        "commentCount": "5000"
                    }
                }
            ]
        }"#;

        let res: YoutubeApiResponse = serde_json::from_str(json_data).unwrap();
        assert_eq!(res.items.len(), 1);
        let item = &res.items[0];
        assert_eq!(item.id, "dQw4w9WgXcQ");
        assert_eq!(
            item.snippet.as_ref().unwrap().title,
            "Never Gonna Give You Up"
        );
        assert_eq!(item.statistics.as_ref().unwrap().view_count, "1500000");
    }
}
