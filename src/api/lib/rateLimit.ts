import type { Env } from "../types";

type RequestType = "create" | "redirect";

interface RateLimitKeys {
	minuteKey: string;
	dayKey: string;
}

interface RateLimitResult {
	allowed: boolean;
	retryAfter?: number;
}

const getRateLimitKeys = (
	ip: string,
	requestType: RequestType,
): RateLimitKeys => {
	const now = new Date();
	const minute = now.toISOString().slice(0, 16).replace(/[T:]/g, "-");
	const day = now.toISOString().slice(0, 10);
	return {
		minuteKey: `rate:${ip}:${requestType}:min:${minute}`,
		dayKey: `rate:${ip}:${requestType}:day:${day}`,
	};
};

export const checkRateLimit = async (
	cache: KVNamespace,
	ip: string,
	requestType: RequestType,
	env: Env,
): Promise<RateLimitResult> => {
	const { minuteKey, dayKey } = getRateLimitKeys(ip, requestType);
	const minuteLimit = Number.parseInt(env.RATE_LIMIT_PER_MINUTE, 10);
	const dayLimit = Number.parseInt(env.RATE_LIMIT_PER_DAY, 10);

	const minuteCount = await cache.get(minuteKey);
	if (minuteCount && Number.parseInt(minuteCount, 10) >= minuteLimit) {
		return { allowed: false, retryAfter: 60 };
	}

	const dayCount = await cache.get(dayKey);
	if (dayCount && Number.parseInt(dayCount, 10) >= dayLimit) {
		const now = new Date();
		const tomorrow = new Date(now);
		tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
		tomorrow.setUTCHours(0, 0, 0, 0);
		const retryAfter = Math.ceil((tomorrow.getTime() - now.getTime()) / 1000);
		return { allowed: false, retryAfter };
	}

	return { allowed: true };
};

export const incrementRateLimit = async (
	cache: KVNamespace,
	ip: string,
	requestType: RequestType,
): Promise<void> => {
	const { minuteKey, dayKey } = getRateLimitKeys(ip, requestType);

	const currentMinute = await cache.get(minuteKey);
	const newMinuteCount = currentMinute
		? Number.parseInt(currentMinute, 10) + 1
		: 1;
	await cache.put(minuteKey, String(newMinuteCount), { expirationTtl: 60 });

	const currentDay = await cache.get(dayKey);
	const newDayCount = currentDay ? Number.parseInt(currentDay, 10) + 1 : 1;
	await cache.put(dayKey, String(newDayCount), { expirationTtl: 86400 });
};
