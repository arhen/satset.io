const BOT_PATTERNS = [
	"facebookexternalhit",
	"Facebot",
	"Twitterbot",
	"LinkedInBot",
	"TelegramBot",
	"WhatsApp",
	"Discordbot",
	"Slackbot",
	"SkypeUriPreview",
	"Pinterest",
	"TikTok",
	"Snapchat",
	"Googlebot",
	"bingbot",
	"bot",
	"crawler",
	"spider",
	"preview",
];

export function isSocialMediaBot(userAgent: string | null): boolean {
	if (!userAgent) return false;
	const ua = userAgent.toLowerCase();
	return BOT_PATTERNS.some((pattern) => ua.includes(pattern.toLowerCase()));
}
