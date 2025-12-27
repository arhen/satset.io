import {
	ALIAS_MAX_LENGTH,
	ALIAS_MIN_LENGTH,
	MAX_URL_LENGTH,
} from "./constants";

export const isValidAlias = (alias: string): boolean => {
	if (alias.length < ALIAS_MIN_LENGTH || alias.length > ALIAS_MAX_LENGTH) {
		return false;
	}
	return /^[A-Za-z0-9]+$/.test(alias);
};

export const isIpAddress = (hostname: string): boolean => {
	if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) return true;
	if (hostname.includes(":") || hostname.startsWith("[")) return true;
	return false;
};

export const isValidDomain = (hostname: string): boolean => {
	const lower = hostname.toLowerCase();
	if (isIpAddress(lower)) return false;
	if (lower === "localhost" || lower === "localhost.localdomain") return false;
	if (lower.endsWith(".local") || lower.endsWith(".internal")) return false;
	if (!lower.includes(".")) return false;
	const parts = lower.split(".");
	const tld = parts[parts.length - 1] ?? "";
	if (tld.length < 2) return false;
	return true;
};

export const isValidUrl = (url: string): boolean => {
	try {
		if (url.length > MAX_URL_LENGTH) return false;
		const parsed = new URL(url);
		if (parsed.protocol !== "https:") return false;
		if (!isValidDomain(parsed.hostname)) return false;
		return true;
	} catch {
		return false;
	}
};
