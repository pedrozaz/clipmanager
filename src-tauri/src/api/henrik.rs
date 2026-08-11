use crate::errors::{AppError, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValorantMatchInfo {
    pub match_id: String,
    pub map: String,
    pub agent: String,
    pub kda: String,
    pub result: String,
    pub score: String,
    pub started_at: String,
}

#[derive(Debug, Deserialize)]
struct HenrikMatchesResponse {
    data: Option<Vec<HenrikMatchData>>,
}

#[derive(Debug, Deserialize)]
struct HenrikMatchData {
    metadata: Option<HenrikMetadata>,
    players: Option<HenrikPlayersData>,
    teams: Option<HenrikTeamsData>,
}

#[derive(Debug, Deserialize)]
struct HenrikMetadata {
    match_id: Option<String>,
    map: Option<String>,
    game_start_patched: Option<String>,
}

#[derive(Debug, Deserialize)]
struct HenrikPlayersData {
    all_players: Option<Vec<HenrikPlayer>>,
}

#[derive(Debug, Deserialize)]
struct HenrikPlayer {
    name: Option<String>,
    tag: Option<String>,
    character: Option<String>,
    team: Option<String>,
    stats: Option<HenrikPlayerStats>,
}

#[derive(Debug, Deserialize)]
struct HenrikPlayerStats {
    kills: Option<i64>,
    deaths: Option<i64>,
    assists: Option<i64>,
}

#[derive(Debug, Deserialize)]
struct HenrikTeamsData {
    red: Option<HenrikTeam>,
    blue: Option<HenrikTeam>,
}

#[derive(Debug, Deserialize)]
struct HenrikTeam {
    has_won: Option<bool>,
    rounds_won: Option<i64>,
}

pub struct HenrikClient {
    api_key: Option<String>,
    http: Client,
}

impl HenrikClient {
    pub fn new(api_key: Option<String>) -> Self {
        Self {
            api_key,
            http: Client::new(),
        }
    }

    pub async fn get_recent_matches(
        &self,
        region: &str,
        name: &str,
        tag: &str,
    ) -> Result<Vec<ValorantMatchInfo>> {
        let url = format!(
            "https://api.henrikdev.xyz/valorant/v3/matches/{}/{}/{}",
            region.trim(),
            name.trim(),
            tag.trim()
        );

        let mut req = self.http.get(&url);
        if let Some(key) = self.api_key.as_ref().filter(|k| !k.trim().is_empty()) {
            req = req.header("Authorization", key.trim());
        }

        let res = req.send().await?;

        if !res.status().is_success() {
            let err_text = res.text().await.unwrap_or_default();
            return Err(AppError::Api(format!("Henrik API error: {err_text}")));
        }

        let api_res: HenrikMatchesResponse = res.json().await?;
        let matches_raw = api_res.data.unwrap_or_default();

        let mut matches = Vec::new();
        for m in matches_raw {
            let meta = match m.metadata {
                Some(ref meta) => meta,
                None => continue,
            };

            let match_id = meta.match_id.clone().unwrap_or_default();
            let map = meta
                .map
                .clone()
                .unwrap_or_else(|| "Desconhecido".to_string());
            let started_at = meta.game_start_patched.clone().unwrap_or_default();

            let players = m.players.as_ref().and_then(|p| p.all_players.as_ref());
            let target_player = players.and_then(|plist| {
                plist.iter().find(|p| {
                    p.name.as_deref().unwrap_or("").eq_ignore_ascii_case(name)
                        && p.tag.as_deref().unwrap_or("").eq_ignore_ascii_case(tag)
                })
            });

            let (agent, kda, team_name) = match target_player {
                Some(p) => {
                    let char_name = p.character.clone().unwrap_or_else(|| "Agente".to_string());
                    let (k, d, a) = match p.stats {
                        Some(ref s) => (
                            s.kills.unwrap_or(0),
                            s.deaths.unwrap_or(0),
                            s.assists.unwrap_or(0),
                        ),
                        None => (0, 0, 0),
                    };
                    (
                        char_name,
                        format!("{k}/{d}/{a}"),
                        p.team.clone().unwrap_or_default(),
                    )
                }
                None => ("Agente".to_string(), "0/0/0".to_string(), "".to_string()),
            };

            let (result, score) = match m.teams {
                Some(ref t) => {
                    let is_red = team_name.eq_ignore_ascii_case("Red");
                    let my_team = if is_red {
                        t.red.as_ref()
                    } else {
                        t.blue.as_ref()
                    };
                    let enemy_team = if is_red {
                        t.blue.as_ref()
                    } else {
                        t.red.as_ref()
                    };

                    let my_rounds = my_team.and_then(|tm| tm.rounds_won).unwrap_or(0);
                    let enemy_rounds = enemy_team.and_then(|tm| tm.rounds_won).unwrap_or(0);
                    let won = my_team.and_then(|tm| tm.has_won).unwrap_or(false);

                    let res_str = if won { "Vitória" } else { "Derrota" };
                    (res_str.to_string(), format!("{my_rounds} - {enemy_rounds}"))
                }
                None => ("Partida".to_string(), "0 - 0".to_string()),
            };

            matches.push(ValorantMatchInfo {
                match_id,
                map,
                agent,
                kda,
                result,
                score,
                started_at,
            });
        }

        Ok(matches)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_henrik_matches_response_json() {
        let json_data = r#"{
            "data": [
                {
                    "metadata": {
                        "match_id": "match-uuid-1234",
                        "map": "Ascent",
                        "game_start_patched": "10 de ago. de 2026"
                    },
                    "players": {
                        "all_players": [
                            {
                                "name": "Streamer",
                                "tag": "BR1",
                                "character": "Jett",
                                "team": "Red",
                                "stats": { "kills": 25, "deaths": 12, "assists": 5 }
                            }
                        ]
                    },
                    "teams": {
                        "red": { "has_won": true, "rounds_won": 13 },
                        "blue": { "has_won": false, "rounds_won": 8 }
                    }
                }
            ]
        }"#;

        let res: HenrikMatchesResponse = serde_json::from_str(json_data).unwrap();
        assert!(res.data.is_some());
        let matches = res.data.unwrap();
        assert_eq!(matches.len(), 1);
        assert_eq!(
            matches[0].metadata.as_ref().unwrap().map.as_deref(),
            Some("Ascent")
        );
    }
}
