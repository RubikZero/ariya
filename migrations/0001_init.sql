CREATE TABLE IF NOT EXISTS mod_errors (
    hash TEXT PRIMARY KEY,
    mod_id TEXT NOT NULL,
    mod_version TEXT NOT NULL,
    game_version TEXT,
    error_message TEXT NOT NULL,
    stack_trace TEXT NOT NULL,
    game_state TEXT NOT NULL,
    player_os TEXT NOT NULL,
    os_version TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mod_errors_created_at ON mod_errors(created_at DESC);