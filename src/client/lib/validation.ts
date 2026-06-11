import { z } from "zod";
import { ALIAS_MAX_LENGTH } from "./constants";

const HAS_URI_SCHEME_PATTERN = /^[A-Za-z][A-Za-z\d+\-.]*:\/\//;

export const normalizeUrlInput = (url: string): string => {
	const trimmed = url.trim();
	if (!trimmed) return trimmed;
	if (HAS_URI_SCHEME_PATTERN.test(trimmed)) return trimmed;
	return `https://${trimmed}`;
};

const isIpAddress = (hostname: string): boolean => {
	if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) return true;
	if (hostname.includes(":") || hostname.startsWith("[")) return true;
	return false;
};

export const urlSchema = z.object({
	url: z
		.preprocess(
			(value) => (typeof value === "string" ? normalizeUrlInput(value) : value),
			z.string().url("Invalid URL"),
		)
		.refine((url) => url.toLowerCase().startsWith("https://"), {
			message: "Only HTTPS URLs are allowed",
		})
		.refine(
			(url) => {
				try {
					const hostname = new URL(url).hostname;
					return !isIpAddress(hostname) && hostname.includes(".");
				} catch {
					return false;
				}
			},
			{ message: "IP addresses are not allowed, use a domain name" },
		),
});

export type UrlFormData = z.infer<typeof urlSchema>;

export const isValidAlias = (alias: string): boolean => {
	if (alias.length < 1 || alias.length > ALIAS_MAX_LENGTH) return false;
	return /^[A-Za-z0-9]+$/.test(alias);
};
