use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Clip {
    pub id: Option<i64>,
    pub title: String,
    pub twitch_url: Option<String>,
    pub youtube_url: Option<String>,
    pub instagram_url: Option<String>,
    pub thumbnail_url: Option<String>,
    pub duration: Option<i64>,
    pub created_at: Option<String>,
    pub clip_date: Option<String>,
    pub status: String,
    pub notes: Option<String>,
    pub twitch_clip_id: Option<String>,
    pub match_id: Option<String>,
    pub views: Option<i64>,
    pub category_ids: Option<Vec<i64>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub id: Option<i64>,
    pub name: String,
    pub color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipCategory {
    pub clip_id: i64,
    pub category_id: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Analytics {
    pub id: Option<i64>,
    pub clip_id: i64,
    pub platform: String,
    pub views: i64,
    pub likes: i64,
    pub comments: i64,
    pub shares: i64,
    pub retention_avg: Option<f64>,
    pub fetched_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatchData {
    pub id: Option<i64>,
    pub clip_id: i64,
    pub match_id: Option<String>,
    pub agent: Option<String>,
    pub map: Option<String>,
    pub score: Option<String>,
    pub kda: Option<String>,
    pub result: Option<String>,
    pub rank: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Setting {
    pub key: String,
    pub value: Option<String>,
}
