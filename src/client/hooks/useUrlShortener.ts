import { useCallback, useEffect, useRef, useState } from "react";
import { generateQRCodePNG } from "../../api/lib/qrcode";
import { BASE62_CHARS, getShortUrl } from "../lib/constants";
import { isOnline, queueCreate } from "../lib/sync";

export interface UrlHistoryEntry {
	originalUrl: string;
	shortUrl: string;
	timestamp: number;
	qrCodeDataUrl: string;
}

export function useUrlShortener() {
	const [shortUrl, setShortUrl] = useState<string | null>(null);
	const [customAlias, setCustomAlias] = useState("");
	const [currentOriginalUrl, setCurrentOriginalUrl] = useState("");
	const [urlHistory, setUrlHistory] = useState<UrlHistoryEntry[]>([]);
	const [preGeneratedAlias, setPreGeneratedAlias] = useState("");
	const [preGeneratedQRCode, setPreGeneratedQRCode] = useState<string | null>(
		null,
	);
	const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
	const [committedAlias, setCommittedAlias] = useState("");

	const previousSyncedAliasRef = useRef<string | null>(null);

	const generateBase62String = useCallback(() => {
		const timestamp = Date.now();
		const random = Math.floor(Math.random() * 1000000);
		let uniqueNum = timestamp * 1000000 + random;

		let result = "";
		while (uniqueNum > 0 && result.length < 7) {
			result = BASE62_CHARS[uniqueNum % 62] + result;
			uniqueNum = Math.floor(uniqueNum / 62);
		}

		while (result.length < 6) {
			result = BASE62_CHARS[Math.floor(Math.random() * 62)] + result;
		}

		return result;
	}, []);

	useEffect(() => {
		if (!preGeneratedAlias) {
			const newAlias = generateBase62String();
			setPreGeneratedAlias(newAlias);
			generateQRCodePNG(getShortUrl(newAlias)).then((dataUrl) => {
				setPreGeneratedQRCode(dataUrl);
			});
		}
	}, [preGeneratedAlias, generateBase62String]);

	useEffect(() => {
		const savedHistory = localStorage.getItem("urlHistory");
		if (savedHistory) {
			try {
				setUrlHistory(JSON.parse(savedHistory));
			} catch (error) {
				console.error("Failed to load history:", error);
			}
		}
	}, []);

	useEffect(() => {
		if (urlHistory.length > 0) {
			localStorage.setItem("urlHistory", JSON.stringify(urlHistory));
		}
	}, [urlHistory]);

	const commitToBackend = useCallback((alias: string, originalUrl: string) => {
		queueCreate(alias, originalUrl);
		previousSyncedAliasRef.current = alias;
	}, []);

	const generateShortUrl = useCallback(
		async (url: string) => {
			const alias = preGeneratedAlias;
			const currentQRCode = preGeneratedQRCode || "";

			setQrCodeDataUrl(currentQRCode);
			setCurrentOriginalUrl(url);

			const newEntry: UrlHistoryEntry = {
				originalUrl: url,
				shortUrl: getShortUrl(alias),
				timestamp: Date.now(),
				qrCodeDataUrl: currentQRCode,
			};
			setUrlHistory((prev) => [newEntry, ...prev].slice(0, 10));

			const nextAlias = generateBase62String();
			setPreGeneratedAlias(nextAlias);
			generateQRCodePNG(getShortUrl(nextAlias)).then((dataUrl) => {
				setPreGeneratedQRCode(dataUrl);
			});

			previousSyncedAliasRef.current = null;

			return alias;
		},
		[preGeneratedAlias, preGeneratedQRCode, generateBase62String],
	);

	const getFullShortUrl = useCallback(() => {
		if (!shortUrl) return "";
		const finalAlias = customAlias || shortUrl;
		return getShortUrl(finalAlias);
	}, [shortUrl, customAlias]);

	const findExistingEntry = useCallback(
		(url: string) => {
			return urlHistory.find((entry) => entry.originalUrl === url);
		},
		[urlHistory],
	);

	const updateQRCodeForAlias = useCallback(
		(fullUrl: string) => {
			generateQRCodePNG(fullUrl).then((dataUrl) => {
				setQrCodeDataUrl(dataUrl);
				if (shortUrl) {
					setUrlHistory((prev) =>
						prev.map((entry) =>
							entry.shortUrl === shortUrl
								? {
										...entry,
										shortUrl: fullUrl.replace("https://", ""),
										qrCodeDataUrl: dataUrl,
									}
								: entry,
						),
					);
				}
			});
		},
		[shortUrl],
	);

	const reset = useCallback(() => {
		setShortUrl(null);
		setCustomAlias("");
		setCommittedAlias("");
		previousSyncedAliasRef.current = null;
	}, []);

	return {
		shortUrl,
		setShortUrl,
		customAlias,
		setCustomAlias,
		currentOriginalUrl,
		setCurrentOriginalUrl,
		urlHistory,
		qrCodeDataUrl,
		setQrCodeDataUrl,
		committedAlias,
		setCommittedAlias,
		commitToBackend,
		generateShortUrl,
		getFullShortUrl,
		findExistingEntry,
		updateQRCodeForAlias,
		reset,
		isOnline,
	};
}
