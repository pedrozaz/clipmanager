use crate::errors::{AppError, Result};
use rusqlite::Connection;
use std::fs;
use std::path::Path;

const MIGRATIONS_SQL: &str = r#"
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS clips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    twitch_url TEXT,
    youtube_url TEXT,
    instagram_url TEXT,
    thumbnail_url TEXT,
    duration INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    clip_date TEXT,
    status TEXT NOT NULL DEFAULT 'novo',
    notes TEXT,
    twitch_clip_id TEXT UNIQUE,
    match_id TEXT
);

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#8b5cf6'
);

CREATE TABLE IF NOT EXISTS clip_categories (
    clip_id INTEGER NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (clip_id, category_id)
);

CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clip_id INTEGER NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    retention_avg REAL,
    fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS match_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clip_id INTEGER NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
    match_id TEXT,
    agent TEXT,
    map TEXT,
    score TEXT,
    kda TEXT,
    result TEXT,
    rank TEXT
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);
"#;

pub fn init_db(app_dir: &Path) -> Result<Connection> {
    if !app_dir.exists() {
        fs::create_dir_all(app_dir)
            .map_err(|e| AppError::Database(format!("Failed to create app dir: {e}")))?;
    }

    let db_path = app_dir.join("clipmanager.db");
    let conn = Connection::open(db_path)?;
    conn.execute_batch(MIGRATIONS_SQL)?;

    Ok(conn)
}

pub fn init_in_memory_db() -> Result<Connection> {
    let conn = Connection::open_in_memory()?;
    conn.execute_batch(MIGRATIONS_SQL)?;
    Ok(conn)
}
