use crate::DbState;
use crate::db::models::Category;
use crate::errors::{AppError, Result};
use rusqlite::params;
use tauri::State;

#[tauri::command]
pub fn create_category(
    state: State<'_, DbState>,
    name: String,
    color: Option<String>,
) -> Result<Category> {
    let conn = state
        .db
        .lock()
        .map_err(|e| AppError::Database(e.to_string()))?;
    let color_val = color.unwrap_or_else(|| "#8b5cf6".to_string());

    conn.execute(
        "INSERT INTO categories (name, color) VALUES (?1, ?2)",
        params![name, color_val],
    )?;

    let id = conn.last_insert_rowid();
    Ok(Category {
        id: Some(id),
        name,
        color: Some(color_val),
    })
}

#[tauri::command]
pub fn list_categories(state: State<'_, DbState>) -> Result<Vec<Category>> {
    let conn = state
        .db
        .lock()
        .map_err(|e| AppError::Database(e.to_string()))?;

    let mut stmt = conn.prepare("SELECT id, name, color FROM categories ORDER BY name ASC")?;
    let categories = stmt
        .query_map([], |row| {
            Ok(Category {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(categories)
}

#[tauri::command]
pub fn update_category(
    state: State<'_, DbState>,
    id: i64,
    name: String,
    color: Option<String>,
) -> Result<Category> {
    let conn = state
        .db
        .lock()
        .map_err(|e| AppError::Database(e.to_string()))?;
    let color_val = color.unwrap_or_else(|| "#8b5cf6".to_string());

    let rows = conn.execute(
        "UPDATE categories SET name = ?1, color = ?2 WHERE id = ?3",
        params![name, color_val, id],
    )?;

    if rows == 0 {
        return Err(AppError::NotFound(format!(
            "Category with id {id} not found"
        )));
    }

    Ok(Category {
        id: Some(id),
        name,
        color: Some(color_val),
    })
}

#[tauri::command]
pub fn delete_category(state: State<'_, DbState>, id: i64) -> Result<()> {
    let conn = state
        .db
        .lock()
        .map_err(|e| AppError::Database(e.to_string()))?;

    let rows = conn.execute("DELETE FROM categories WHERE id = ?1", params![id])?;
    if rows == 0 {
        return Err(AppError::NotFound(format!(
            "Category with id {id} not found"
        )));
    }

    Ok(())
}

#[tauri::command]
pub fn add_category_to_clip(
    state: State<'_, DbState>,
    clip_id: i64,
    category_id: i64,
) -> Result<()> {
    let conn = state
        .db
        .lock()
        .map_err(|e| AppError::Database(e.to_string()))?;

    conn.execute(
        "INSERT OR IGNORE INTO clip_categories (clip_id, category_id) VALUES (?1, ?2)",
        params![clip_id, category_id],
    )?;

    Ok(())
}

#[tauri::command]
pub fn remove_category_from_clip(
    state: State<'_, DbState>,
    clip_id: i64,
    category_id: i64,
) -> Result<()> {
    let conn = state
        .db
        .lock()
        .map_err(|e| AppError::Database(e.to_string()))?;

    conn.execute(
        "DELETE FROM clip_categories WHERE clip_id = ?1 AND category_id = ?2",
        params![clip_id, category_id],
    )?;

    Ok(())
}

#[tauri::command]
pub fn get_clip_categories(state: State<'_, DbState>, clip_id: i64) -> Result<Vec<Category>> {
    let conn = state
        .db
        .lock()
        .map_err(|e| AppError::Database(e.to_string()))?;

    let mut stmt = conn.prepare(
        "SELECT c.id, c.name, c.color FROM categories c
         INNER JOIN clip_categories cc ON c.id = cc.category_id
         WHERE cc.clip_id = ?1 ORDER BY c.name ASC",
    )?;

    let categories = stmt
        .query_map(params![clip_id], |row| {
            Ok(Category {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(categories)
}

#[cfg(test)]
mod tests {
    use crate::db::connection::init_in_memory_db;

    #[test]
    fn test_category_crud_and_clip_association() {
        let conn = init_in_memory_db().unwrap();

        conn.execute(
            "INSERT INTO clips (title, status) VALUES ('Clutch 1v4', 'novo')",
            [],
        )
        .unwrap();
        let clip_id = conn.last_insert_rowid();

        conn.execute(
            "INSERT INTO categories (name, color) VALUES ('Highlight', '#8b5cf6')",
            [],
        )
        .unwrap();
        let cat_id = conn.last_insert_rowid();

        conn.execute(
            "INSERT INTO clip_categories (clip_id, category_id) VALUES (?1, ?2)",
            [clip_id, cat_id],
        )
        .unwrap();

        let mut stmt = conn.prepare(
            "SELECT c.name FROM categories c INNER JOIN clip_categories cc ON c.id = cc.category_id WHERE cc.clip_id = ?1"
        ).unwrap();
        let cat_name: String = stmt.query_row([clip_id], |row| row.get(0)).unwrap();
        assert_eq!(cat_name, "Highlight");
    }
}
