import type { OgMetadata } from "./ogFetcher";

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

function truncate(str: string, maxLength: number): string {
	if (str.length <= maxLength) return str;
	return `${str.substring(0, maxLength)}...`;
}

interface OgHtmlOptions {
	alias: string;
	originalUrl: string;
	baseUrl?: string;
	targetOg?: OgMetadata | null;
}

export function generateBotHtml({
	alias,
	originalUrl,
	baseUrl = "https://satset.io",
	targetOg,
}: OgHtmlOptions): string {
	const shortUrl = `${baseUrl}/${alias}`;

	const title = targetOg?.title || truncate(originalUrl, 60);
	const description = targetOg?.description || `Shared via ${shortUrl}`;
	const imageUrl = targetOg?.image || `${baseUrl}/og-image.png`;
	const siteName = targetOg?.siteName || new URL(originalUrl).hostname;

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${escapeHtml(title)}</title>
	<meta name="description" content="${escapeHtml(description)}">
	
	<meta property="og:type" content="website">
	<meta property="og:url" content="${escapeHtml(shortUrl)}">
	<meta property="og:title" content="${escapeHtml(title)}">
	<meta property="og:description" content="${escapeHtml(description)}">
	<meta property="og:image" content="${escapeHtml(imageUrl)}">
	<meta property="og:site_name" content="${escapeHtml(siteName)}">
	
	<meta name="twitter:card" content="summary_large_image">
	<meta name="twitter:url" content="${escapeHtml(shortUrl)}">
	<meta name="twitter:title" content="${escapeHtml(title)}">
	<meta name="twitter:description" content="${escapeHtml(description)}">
	<meta name="twitter:image" content="${escapeHtml(imageUrl)}">
	
	<meta http-equiv="refresh" content="0;url=${escapeHtml(originalUrl)}">
	
	<link rel="canonical" href="${escapeHtml(shortUrl)}">
	<link rel="icon" type="image/svg+xml" href="${baseUrl}/favicon.svg">
</head>
<body>
	<p>Redirecting to <a href="${escapeHtml(originalUrl)}">${escapeHtml(truncate(originalUrl, 100))}</a>...</p>
</body>
</html>`;
}
