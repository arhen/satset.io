export const BASE62_CHARS =
	"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export const ALIAS_MAX_LENGTH = 16;
export const ALIAS_MIN_LENGTH = 1;
export const CACHE_TTL_SECONDS = 3600;
export const MAX_URL_LENGTH = 2048;
export const OG_CACHE_TTL_SECONDS = 86400;
export const OG_FETCH_TIMEOUT_MS = 3000;

export const generateBase62 = (length = 6): string => {
	let result = "";
	for (let i = 0; i < length; i++) {
		result += BASE62_CHARS[Math.floor(Math.random() * 62)];
	}
	return result;
};
