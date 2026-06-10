CREATE TABLE IF NOT EXISTS mod_errors (
    uuid TEXT PRIMARY KEY,
    mod_id TEXT NOT NULL,
    mod_version TEXT NOT NULL,
    game_version TEXT,
    error_message TEXT NOT NULL,
    stack_trace TEXT NOT NULL,
    game_state TEXT NOT NULL,
    player_os TEXT NOT NULL,
    os_version TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);