export const securityHeaders = {
	"X-Frame-Options": "DENY",
	"X-Content-Type-Options": "nosniff",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Permissions-Policy": "geolocation=(), microphone=(), camera=()",
};

export const cspHeader =
	"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self' data: blob:; connect-src 'self'";

export const getClientIp = (request: Request): string | null => {
	const cfIp = request.headers.get("cf-connecting-ip");
	if (cfIp) return cfIp;

	const forwardedFor = request.headers.get("x-forwarded-for");
	if (forwardedFor) {
		const firstIp = forwardedFor.split(",")[0]?.trim();
		if (firstIp) return firstIp;
	}

	return null;
};

export const jsonResponse = (
	data: object,
	status: number,
	extraHeaders?: Record<string, string>,
): Response => {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			"Content-Type": "application/json",
			...securityHeaders,
			...extraHeaders,
		},
	});
};

export const errorResponse = (
	message: string,
	status: number,
	extraHeaders?: Record<string, string>,
): Response => {
	return jsonResponse({ error: message }, status, extraHeaders);
};
