export interface Env {
	DB: D1Database;
	CACHE: KVNamespace;
	ASSETS: Fetcher;
	URL_EXPIRY_DAYS: string;
	RATE_LIMIT_PER_MINUTE: string;
	RATE_LIMIT_PER_DAY: string;
}

export interface CacheEntry {
	original_url: string;
	expires_at: number;
}

export interface UrlRecord {
	original_url: string;
	expires_at: number;
}
