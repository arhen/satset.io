-- URL Shortener Database Schema for Cloudflare D1

-- Main URLs table
CREATE TABLE IF NOT EXISTS urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alias TEXT UNIQUE NOT NULL,           -- Short code (e.g., "abc123"), max 16 chars
    original_url TEXT NOT NULL,           -- The full original URL
    click_count INTEGER DEFAULT 0,        -- Anonymous click counter
    created_at INTEGER NOT NULL,          -- Unix timestamp (milliseconds)
    expires_at INTEGER NOT NULL,          -- Unix timestamp (milliseconds), 14 days from creation
    
    -- Indexes for fast lookups
    CONSTRAINT alias_length CHECK (length(alias) >= 1 AND length(alias) <= 16),
    CONSTRAINT alias_format CHECK (alias GLOB '[A-Za-z0-9]*')
);

-- Index for fast alias lookups (primary use case)
CREATE INDEX IF NOT EXISTS idx_urls_alias ON urls(alias);

-- Index for cleanup job (find expired URLs)
CREATE INDEX IF NOT EXISTS idx_urls_expires_at ON urls(expires_at);

-- Note: Rate limiting is now handled by KV with auto-expiry (TTL)
-- KV keys: rate:{ip}:{type}:min:{YYYY-MM-DD-HH-mm} (60s TTL)
--          rate:{ip}:{type}:day:{YYYY-MM-DD} (24h TTL)
