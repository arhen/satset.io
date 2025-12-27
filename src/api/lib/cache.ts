import type { CacheEntry, UrlRecord } from "../types";
import { CACHE_TTL_SECONDS, OG_CACHE_TTL_SECONDS } from "./constants";
import type { OgMetadata } from "./ogFetcher";
import { isValidUrl } from "./validation";

export const getCachedUrl = async (
	cache: KVNamespace,
	alias: string,
): Promise<CacheEntry | null> => {
	const cached = await cache.get(alias);
	if (!cached) return null;

	const entry: CacheEntry = JSON.parse(cached);
	if (entry.expires_at < Date.now()) {
		await cache.delete(alias);
		return null;
	}

	if (!isValidUrl(entry.original_url)) {
		await cache.delete(alias);
		return null;
	}

	return entry;
};

export const setCachedUrl = async (
	cache: KVNamespace,
	alias: string,
	originalUrl: string,
	expiresAt: number,
): Promise<void> => {
	const entry: CacheEntry = {
		original_url: originalUrl,
		expires_at: expiresAt,
	};
	await cache.put(alias, JSON.stringify(entry), {
		expirationTtl: CACHE_TTL_SECONDS,
	});
};

export const deleteCachedUrl = async (
	cache: KVNamespace,
	alias: string,
): Promise<void> => {
	await cache.delete(alias);
};

export const getCachedOgMetadata = async (
	cache: KVNamespace,
	alias: string,
): Promise<OgMetadata | null | "not_cached"> => {
	const ogCacheKey = `og:${alias}`;
	const cached = await cache.get(ogCacheKey);

	if (cached === null) return "not_cached";
	if (cached === "null") return null;

	return JSON.parse(cached);
};

export const setCachedOgMetadata = async (
	cache: KVNamespace,
	alias: string,
	metadata: OgMetadata | null,
): Promise<void> => {
	const ogCacheKey = `og:${alias}`;
	if (metadata) {
		await cache.put(ogCacheKey, JSON.stringify(metadata), {
			expirationTtl: OG_CACHE_TTL_SECONDS,
		});
	} else {
		await cache.put(ogCacheKey, "null", { expirationTtl: 3600 });
	}
};

export const getUrlFromDb = async (
	db: D1Database,
	alias: string,
): Promise<UrlRecord | null> => {
	const record = await db
		.prepare("SELECT original_url, expires_at FROM urls WHERE alias = ?")
		.bind(alias)
		.first<UrlRecord>();

	if (!record) return null;
	if (record.expires_at < Date.now()) return null;
	if (!isValidUrl(record.original_url)) return null;

	return record;
};

export const deleteExpiredUrl = async (
	db: D1Database,
	alias: string,
): Promise<void> => {
	await db.prepare("DELETE FROM urls WHERE alias = ?").bind(alias).run();
};

export const incrementClickCount = (db: D1Database, alias: string): void => {
	db.prepare("UPDATE urls SET click_count = click_count + 1 WHERE alias = ?")
		.bind(alias)
		.run();
};
