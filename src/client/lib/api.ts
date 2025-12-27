import type {
	CheckAliasResponseType,
	CreateUrlRequestType,
	CreateUrlResponseType,
	RedirectDataResponseType,
} from "../../api/schemas";

const API_BASE = "/api";
const DEFAULT_TIMEOUT = 10000;

const fetchWithTimeout = async (
	url: string,
	options: RequestInit = {},
	timeout = DEFAULT_TIMEOUT,
): Promise<Response> => {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout);

	try {
		const response = await fetch(url, {
			...options,
			signal: controller.signal,
		});
		return response;
	} finally {
		clearTimeout(timeoutId);
	}
};

export type {
	CheckAliasResponseType as CheckAliasResponse,
	CreateUrlRequestType as CreateUrlRequest,
	CreateUrlResponseType as CreateUrlResponse,
	RedirectDataResponseType as RedirectData,
};

export const createUrl = async (
	data: CreateUrlRequestType,
): Promise<CreateUrlResponseType> => {
	const response = await fetchWithTimeout(`${API_BASE}/urls`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const error = (await response.json().catch(() => ({}))) as {
			error?: string;
		};
		throw new Error(error.error || "Failed to create short URL");
	}

	return response.json();
};

export const getRedirectData = async (
	alias: string,
): Promise<RedirectDataResponseType> => {
	const response = await fetchWithTimeout(`${API_BASE}/redirect/${alias}`);

	if (!response.ok) {
		throw new Error("URL not found");
	}

	return response.json();
};

export const checkAlias = async (
	alias: string,
): Promise<CheckAliasResponseType> => {
	const response = await fetchWithTimeout(`${API_BASE}/urls/check/${alias}`);

	if (!response.ok) {
		throw new Error("Failed to check alias");
	}

	return response.json();
};
