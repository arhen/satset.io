export const CHARS =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export const BASE62_CHARS =
	"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export const ALIAS_MAX_LENGTH = 16;

export const getBaseUrl = () => window.location.origin;

export const getShortUrl = (alias: string) => `${getBaseUrl()}/${alias}`;
