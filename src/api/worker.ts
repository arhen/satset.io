import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { CloudflareAdapter } from "elysia/adapter/cloudflare-worker";
import { isSocialMediaBot } from "./lib/botDetect";
import {
	deleteCachedUrl,
	deleteExpiredUrl,
	getCachedOgMetadata,
	getCachedUrl,
	getUrlFromDb,
	incrementClickCount,
	setCachedOgMetadata,
	setCachedUrl,
} from "./lib/cache";
import { generateBase62 } from "./lib/constants";
import { fetchOgMetadata } from "./lib/ogFetcher";
import { generateBotHtml } from "./lib/ogHtml";
import { checkRateLimit, incrementRateLimit } from "./lib/rateLimit";
import {
	cspHeader,
	errorResponse,
	getClientIp,
	securityHeaders,
} from "./lib/security";
import { isValidAlias, isValidUrl } from "./lib/validation";
import { AliasParams, CreateUrlRequest } from "./schemas";
import type { Env } from "./types";

let currentEnv: Env;

const createApp = () =>
	new Elysia({ adapter: CloudflareAdapter })
		.use(
			cors({
				origin: [
					"https://satset.io",
					"https://www.satset.io",
					"http://localhost:3000",
				],
				methods: ["GET", "POST", "OPTIONS"],
			}),
		)
		.onError(({ code, error }) => {
			console.error(`Error [${code}]:`, error);
			return errorResponse("Internal server error", 500);
		})
		.get("/api/health", () => ({ status: "ok", timestamp: Date.now() }))
		.post(
			"/api/urls",
			async ({ body, request }) => {
				const env = currentEnv;
				const { DB, CACHE } = env;
				const ip = getClientIp(request);
				const requestUrl = new URL(request.url);
				const shortDomain = requestUrl.host;

				if (!ip) return errorResponse("Bad request", 400);

				const rateCheck = await checkRateLimit(CACHE, ip, "create", env);
				if (!rateCheck.allowed) {
					return errorResponse("Rate limit exceeded", 429, {
						"Retry-After": String(rateCheck.retryAfter),
					});
				}

				let { alias, original_url } = body;

				if (!isValidUrl(original_url)) {
					return errorResponse("Invalid URL", 400);
				}

				if (alias) {
					if (!isValidAlias(alias)) {
						return errorResponse("Invalid alias format", 400);
					}

					const existing = await DB.prepare(
						"SELECT id FROM urls WHERE alias = ?",
					)
						.bind(alias)
						.first();

					if (existing) {
						const newAlias = await generateUniqueAlias(DB, 7);
						if (!newAlias) return errorResponse("Service unavailable", 503);
						alias = newAlias;
					}
				} else {
					const newAlias = await generateUniqueAlias(DB, 6);
					if (!newAlias) return errorResponse("Service unavailable", 503);
					alias = newAlias;
				}

				const now = Date.now();
				const expiryDays = Number.parseInt(env.URL_EXPIRY_DAYS, 10);
				const expiresAt = now + expiryDays * 24 * 60 * 60 * 1000;

				await DB.prepare(
					`INSERT INTO urls (alias, original_url, created_at, expires_at) VALUES (?, ?, ?, ?)`,
				)
					.bind(alias, original_url, now, expiresAt)
					.run();

				await setCachedUrl(CACHE, alias, original_url, expiresAt);
				await incrementRateLimit(CACHE, ip, "create");

				return {
					alias,
					short_url: `${requestUrl.protocol}//${shortDomain}/${alias}`,
					original_url,
					expires_at: expiresAt,
					created_at: now,
				};
			},
			{ body: CreateUrlRequest },
		)
		.get(
			"/api/urls/check/:alias",
			async ({ params }) => {
				const { DB } = currentEnv;
				const { alias } = params;

				if (!isValidAlias(alias)) {
					return { available: false, alias, reason: "Invalid format" };
				}

				const existing = await DB.prepare("SELECT id FROM urls WHERE alias = ?")
					.bind(alias)
					.first();

				return { available: !existing, alias };
			},
			{ params: AliasParams },
		)
		.get(
			"/api/redirect/:alias",
			async ({ params, request }) => {
				const env = currentEnv;
				const { DB, CACHE } = env;
				const { alias } = params;
				const ip = getClientIp(request);

				if (!isValidAlias(alias)) return errorResponse("Not found", 404);
				if (!ip) return errorResponse("Bad request", 400);

				const rateCheck = await checkRateLimit(CACHE, ip, "redirect", env);
				if (!rateCheck.allowed) {
					return errorResponse("Rate limit exceeded", 429, {
						"Retry-After": String(rateCheck.retryAfter),
					});
				}

				const cached = await getCachedUrl(CACHE, alias);
				if (cached) {
					incrementClickCount(DB, alias);
					await incrementRateLimit(CACHE, ip, "redirect");
					return { original_url: cached.original_url, alias };
				}

				const record = await getUrlFromDb(DB, alias);
				if (!record) {
					await deleteExpiredUrl(DB, alias);
					return errorResponse("Not found", 404);
				}

				await setCachedUrl(
					CACHE,
					alias,
					record.original_url,
					record.expires_at,
				);
				incrementClickCount(DB, alias);
				await incrementRateLimit(CACHE, ip, "redirect");

				return { original_url: record.original_url, alias };
			},
			{ params: AliasParams },
		)
		.compile();

const app = createApp();

async function generateUniqueAlias(
	db: D1Database,
	length: number,
): Promise<string | null> {
	let alias = generateBase62(length);
	let attempts = 0;

	while (attempts < 5) {
		const check = await db
			.prepare("SELECT id FROM urls WHERE alias = ?")
			.bind(alias)
			.first();
		if (!check) return alias;
		alias = generateBase62(length + 1);
		attempts++;
	}

	return null;
}

const isStaticAsset = (pathname: string): boolean => {
	const staticExtensions = [
		".js",
		".css",
		".ico",
		".png",
		".jpg",
		".jpeg",
		".gif",
		".svg",
		".woff",
		".woff2",
		".ttf",
		".eot",
		".map",
	];
	return staticExtensions.some((ext) => pathname.endsWith(ext));
};

const serveIndexHtml = async (assets: Fetcher): Promise<Response> => {
	const indexResponse = await assets.fetch(
		new Request("http://localhost/index.html"),
	);
	return new Response(indexResponse.body, {
		status: indexResponse.status,
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			"Cache-Control": "no-cache",
			...securityHeaders,
			"Content-Security-Policy": cspHeader,
		},
	});
};

const serveBotHtml = async (
	alias: string,
	env: Env,
	baseUrl: string,
): Promise<Response | null> => {
	const { DB, CACHE } = env;

	if (!isValidAlias(alias)) return null;

	let originalUrl: string | null = null;

	const cached = await getCachedUrl(CACHE, alias);
	if (cached) {
		originalUrl = cached.original_url;
	} else {
		const record = await getUrlFromDb(DB, alias);
		if (record) {
			originalUrl = record.original_url;
		}
	}

	if (!originalUrl) return null;

	let targetOg = await getCachedOgMetadata(CACHE, alias);
	if (targetOg === "not_cached") {
		targetOg = await fetchOgMetadata(originalUrl, 3000);
		await setCachedOgMetadata(CACHE, alias, targetOg);
	}

	const html = generateBotHtml({ alias, originalUrl, baseUrl, targetOg });

	return new Response(html, {
		status: 200,
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
			...securityHeaders,
		},
	});
};

export default {
	async fetch(
		request: Request,
		env: Env,
		_ctx: ExecutionContext,
	): Promise<Response> {
		try {
			currentEnv = env;

			const url = new URL(request.url);
			const { pathname } = url;
			const baseUrl = `${url.protocol}//${url.host}`;

			if (isStaticAsset(pathname)) {
				return env.ASSETS.fetch(request);
			}

			if (pathname === "/" || pathname === "/index.html") {
				return serveIndexHtml(env.ASSETS);
			}

			if (pathname.startsWith("/api/")) {
				return app.fetch(request);
			}

			const alias = pathname.slice(1);
			const userAgent = request.headers.get("user-agent");

			if (isSocialMediaBot(userAgent) && alias && !alias.includes("/")) {
				const botResponse = await serveBotHtml(alias, env, baseUrl);
				if (botResponse) return botResponse;
			}

			return serveIndexHtml(env.ASSETS);
		} catch (error) {
			console.error("Unhandled error:", error);
			return new Response("Internal server error", {
				status: 500,
				headers: securityHeaders,
			});
		}
	},

	async scheduled(
		_controller: ScheduledController,
		env: Env,
		_ctx: ExecutionContext,
	): Promise<void> {
		const { DB, CACHE } = env;
		const now = Date.now();

		const expired = await DB.prepare(
			"SELECT alias FROM urls WHERE expires_at < ?",
		)
			.bind(now)
			.all<{ alias: string }>();

		if (expired.results) {
			for (const record of expired.results) {
				await deleteCachedUrl(CACHE, record.alias);
			}
			await DB.prepare("DELETE FROM urls WHERE expires_at < ?").bind(now).run();
		}
	},
};

export type { Env };
