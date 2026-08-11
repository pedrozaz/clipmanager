use clipmanager_lib::api::youtube::YoutubeClient;
use clipmanager_lib::db::connection::init_in_memory_db;
use clipmanager_lib::errors::AppError;

#[test]
fn test_full_clip_lifecycle_integration() {
    let conn = init_in_memory_db().expect("failed to init db");

    // 1. Insert clip
    conn.execute(
        "INSERT INTO clips (title, twitch_url, status) VALUES ('Full Clutch Ascent', 'https://clips.twitch.tv/test1234', 'novo')",
        [],
    )
    .expect("failed to insert clip");
    let clip_id = conn.last_insert_rowid();

    // 2. Insert category and link
    conn.execute(
        "INSERT INTO categories (name, color) VALUES ('Highlight', '#8b5cf6')",
        [],
    )
    .expect("failed to insert category");
    let cat_id = conn.last_insert_rowid();

    conn.execute(
        "INSERT INTO clip_categories (clip_id, category_id) VALUES (?1, ?2)",
        [clip_id, cat_id],
    )
    .expect("failed to link category");

    // 3. Update status to 'editando' and add YouTube URL
    conn.execute(
        "UPDATE clips SET status = 'editando', youtube_url = 'https://youtube.com/shorts/dQw4w9WgXcQ' WHERE id = ?1",
        [clip_id],
    )
    .expect("failed to update status");

    // 4. Link Valorant match data
    conn.execute(
        "INSERT INTO match_data (clip_id, match_id, agent, map, score, kda, result)
         VALUES (?1, 'match-999', 'Jett', 'Ascent', '13 - 10', '24/11/5', 'Vitória')",
        [clip_id],
    )
    .expect("failed to link match data");

    // 5. Add Analytics entry
    conn.execute(
        "INSERT INTO analytics (clip_id, platform, views, likes, comments)
         VALUES (?1, 'youtube', 4500, 320, 15)",
        [clip_id],
    )
    .expect("failed to insert analytics");

    // 6. Verify assertions
    let (status, youtube_url): (String, String) = conn
        .query_row(
            "SELECT status, youtube_url FROM clips WHERE id = ?1",
            [clip_id],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )
        .expect("failed to query clip");

    assert_eq!(status, "editando");
    assert_eq!(youtube_url, "https://youtube.com/shorts/dQw4w9WgXcQ");

    let video_id = YoutubeClient::extract_video_id(&youtube_url).unwrap();
    assert_eq!(video_id, "dQw4w9WgXcQ");

    let views: i64 = conn
        .query_row(
            "SELECT views FROM analytics WHERE clip_id = ?1",
            [clip_id],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(views, 4500);

    let (agent, result): (String, String) = conn
        .query_row(
            "SELECT agent, result FROM match_data WHERE clip_id = ?1",
            [clip_id],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )
        .unwrap();
    assert_eq!(agent, "Jett");
    assert_eq!(result, "Vitória");

    // 7. Delete clip and verify CASCADE on match_data, analytics, clip_categories
    conn.execute("DELETE FROM clips WHERE id = ?1", [clip_id])
        .unwrap();

    let cat_links: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM clip_categories WHERE clip_id = ?1",
            [clip_id],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(cat_links, 0);

    let match_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM match_data WHERE clip_id = ?1",
            [clip_id],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(match_count, 0);

    let analytics_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM analytics WHERE clip_id = ?1",
            [clip_id],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(analytics_count, 0);
}

#[test]
fn test_settings_upsert_and_not_found_error() {
    let conn = init_in_memory_db().unwrap();

    conn.execute(
        "INSERT INTO settings (key, value) VALUES ('twitch_username', 'streamer_test')
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        [],
    )
    .unwrap();

    let val: String = conn
        .query_row(
            "SELECT value FROM settings WHERE key = 'twitch_username'",
            [],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(val, "streamer_test");

    let err: Result<String, _> =
        conn.query_row("SELECT title FROM clips WHERE id = 9999", [], |r| r.get(0));
    assert!(err.is_err());

    let app_err = AppError::NotFound("Clip 9999 not found".to_string());
    assert_eq!(app_err.to_string(), "Not found: Clip 9999 not found");
}
