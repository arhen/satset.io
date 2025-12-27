export interface OgMetadata {
	title: string | null;
	description: string | null;
	image: string | null;
	siteName: string | null;
}

const OG_PATTERNS = {
	title: /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i,
	titleAlt: /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i,
	description:
		/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i,
	descriptionAlt:
		/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i,
	image: /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
	imageAlt: /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
	siteName:
		/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i,
	siteNameAlt:
		/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i,
	titleTag: /<title[^>]*>([^<]+)<\/title>/i,
	metaDescription:
		/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
	metaDescriptionAlt:
		/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i,
};

function extractMeta(
	html: string,
	primary: RegExp,
	alt: RegExp,
): string | null {
	const match = html.match(primary) || html.match(alt);
	return match?.[1] ? decodeHtmlEntities(match[1].trim()) : null;
}

function decodeHtmlEntities(str: string): string {
	return str
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#039;/g, "'")
		.replace(/&#x27;/g, "'")
		.replace(/&#x2F;/g, "/");
}

function resolveUrl(url: string | null, baseUrl: string): string | null {
	if (!url) return null;

	if (url.startsWith("http://") || url.startsWith("https://")) {
		return url;
	}

	if (url.startsWith("//")) {
		return `https:${url}`;
	}

	try {
		return new URL(url, baseUrl).href;
	} catch {
		return null;
	}
}

export async function fetchOgMetadata(
	url: string,
	timeoutMs = 3000,
): Promise<OgMetadata | null> {
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

		const response = await fetch(url, {
			signal: controller.signal,
			headers: {
				"User-Agent":
					"Mozilla/5.0 (compatible; SatSetBot/1.0; +https://satset.io)",
				Accept: "text/html,application/xhtml+xml",
			},
			redirect: "follow",
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			return null;
		}

		const contentType = response.headers.get("content-type") || "";
		if (!contentType.includes("text/html")) {
			return null;
		}

		const reader = response.body?.getReader();
		if (!reader) return null;

		let html = "";
		const decoder = new TextDecoder();
		const maxBytes = 50 * 1024;

		while (html.length < maxBytes) {
			const { done, value } = await reader.read();
			if (done) break;
			html += decoder.decode(value, { stream: true });

			if (html.includes("</head>")) break;
		}

		reader.cancel();

		const title =
			extractMeta(html, OG_PATTERNS.title, OG_PATTERNS.titleAlt) ||
			html.match(OG_PATTERNS.titleTag)?.[1]?.trim() ||
			null;

		const description =
			extractMeta(html, OG_PATTERNS.description, OG_PATTERNS.descriptionAlt) ||
			extractMeta(
				html,
				OG_PATTERNS.metaDescription,
				OG_PATTERNS.metaDescriptionAlt,
			);

		const imageRaw = extractMeta(html, OG_PATTERNS.image, OG_PATTERNS.imageAlt);
		const image = resolveUrl(imageRaw, url);

		const siteName = extractMeta(
			html,
			OG_PATTERNS.siteName,
			OG_PATTERNS.siteNameAlt,
		);

		return {
			title: title ? title.substring(0, 200) : null,
			description: description ? description.substring(0, 500) : null,
			image,
			siteName: siteName ? siteName.substring(0, 100) : null,
		};
	} catch {
		return null;
	}
}
