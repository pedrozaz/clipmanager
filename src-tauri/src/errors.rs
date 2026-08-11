use serde::Serialize;
use std::fmt;

#[derive(Debug)]
pub enum AppError {
    Database(String),
    Api(String),
    Parse(String),
    NotFound(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Database(msg) => write!(f, "Database error: {msg}"),
            AppError::Api(msg) => write!(f, "API error: {msg}"),
            AppError::Parse(msg) => write!(f, "Parse error: {msg}"),
            AppError::NotFound(msg) => write!(f, "Not found: {msg}"),
        }
    }
}

impl std::error::Error for AppError {}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl From<rusqlite::Error> for AppError {
    fn from(err: rusqlite::Error) -> Self {
        AppError::Database(err.to_string())
    }
}

impl From<reqwest::Error> for AppError {
    fn from(err: reqwest::Error) -> Self {
        AppError::Api(err.to_string())
    }
}

pub type Result<T> = std::result::Result<T, AppError>;
