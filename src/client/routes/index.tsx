import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
	downloadQRCodeFromDataUrl,
	generateQRCodePNG,
} from "../../api/lib/qrcode";
import { ThemeToggle } from "../components/ThemeToggle";
import { Toast } from "../components/Toast";
import {
	ArrowRightIcon,
	CopyIcon,
	InfoIcon,
	LightningLogo,
	QRIcon,
} from "../components/icons";
import { useDecryptAnimation } from "../hooks/useDecryptAnimation";
import { useSyncStatus } from "../hooks/useSyncStatus";
import { useUrlShortener } from "../hooks/useUrlShortener";
import { ALIAS_MAX_LENGTH, getBaseUrl, getShortUrl } from "../lib/constants";
import { isOnline } from "../lib/sync";
import { useTheme } from "../lib/useTheme";
import { isValidAlias, urlSchema, type UrlFormData } from "../lib/validation";

function HomePage() {
	const { isDarkMode, toggleTheme } = useTheme();
	const { syncStatus, isOfflineToastVisible } = useSyncStatus();
	const {
		shortUrl,
		setShortUrl,
		customAlias,
		setCustomAlias,
		currentOriginalUrl,
		setCurrentOriginalUrl,
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
	} = useUrlShortener();

	const { isDecrypting, displayValue, startAnimation, setValueDirectly } =
		useDecryptAnimation();

	const [isCopied, setIsCopied] = useState(false);
	const [isQRDownloaded, setIsQRDownloaded] = useState(false);
	const [isLoading, _setIsLoading] = useState(false);
	const [isAliasInputFocused, setIsAliasInputFocused] = useState(false);
	const [isCopyButtonFocused, setIsCopyButtonFocused] = useState(false);
	const [isQRButtonFocused, setIsQRButtonFocused] = useState(false);
	const [hoveredButton, setHoveredButton] = useState<"copy" | "qr" | null>(
		null,
	);
	const [isMainInputFocused, setIsMainInputFocused] = useState(false);
	const [showArrow, setShowArrow] = useState(false);

	const inputRef = useRef<HTMLInputElement>(null);
	const customAliasRef = useRef<HTMLInputElement>(null);
	const displayAliasRef = useRef<HTMLInputElement>(null);
	const copyButtonRef = useRef<HTMLButtonElement>(null);
	const isProgrammaticFocusRef = useRef(false);

	const isAnyHovered = hoveredButton !== null;
	const showCopyTooltip = isAnyHovered
		? hoveredButton === "copy"
		: isCopyButtonFocused;
	const showQRTooltip = isAnyHovered
		? hoveredButton === "qr"
		: isQRButtonFocused;
	const showCopyRing =
		hoveredButton === "copy" || (!isAnyHovered && isCopyButtonFocused);
	const showQRRing =
		hoveredButton === "qr" || (!isAnyHovered && isQRButtonFocused);

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
		watch,
		clearErrors,
		setError,
	} = useForm<UrlFormData>({
		resolver: zodResolver(urlSchema),
		mode: "onSubmit",
	});

	const onSubmit = useCallback(
		async (data: UrlFormData) => {
			inputRef.current?.blur();
			const existingEntry = findExistingEntry(data.url);

			setTimeout(() => {
				if (existingEntry) {
					const alias = existingEntry.shortUrl.split("/").pop() || "";
					setShortUrl(alias);
					setQrCodeDataUrl(existingEntry.qrCodeDataUrl);
					setCurrentOriginalUrl(data.url);
				} else {
					generateShortUrl(data.url).then((generated) => {
						setShortUrl(generated);
					});
				}
			}, 100);
		},
		[
			findExistingEntry,
			setShortUrl,
			setQrCodeDataUrl,
			setCurrentOriginalUrl,
			generateShortUrl,
		],
	);

	const handlePaste = useCallback(
		(e: React.ClipboardEvent<HTMLInputElement>) => {
			const pastedText = e.clipboardData.getData("text").trim();

			if (
				pastedText.startsWith("http://") ||
				pastedText.startsWith("https://")
			) {
				e.preventDefault();
				setValue("url", pastedText);
				setTimeout(() => handleSubmit(onSubmit)(), 100);
			} else if (pastedText.length > 0) {
				e.preventDefault();
				setValue("url", pastedText);
				setError("url", {
					type: "manual",
					message: "Only HTTPS URLs are allowed",
				});
			}
		},
		[setValue, handleSubmit, onSubmit, setError],
	);

	const watchedUrl = watch("url");
	const prevUrlRef = useRef<string>("");

	useEffect(() => {
		if (prevUrlRef.current && watchedUrl !== prevUrlRef.current && shortUrl) {
			reset();
		}
		if (!watchedUrl) clearErrors("url");
		prevUrlRef.current = watchedUrl || "";
	}, [watchedUrl, shortUrl, clearErrors, reset]);

	const handleCopy = useCallback(async () => {
		if (!shortUrl) return;

		const fullShortUrl = getFullShortUrl();
		const currentAlias = customAlias || shortUrl || "";
		setCommittedAlias(currentAlias);
		commitToBackend(currentAlias, currentOriginalUrl);

		try {
			await navigator.clipboard.writeText(fullShortUrl);
			if (isOnline()) {
				setIsQRDownloaded(false);
				setIsCopied(true);
				setTimeout(() => setIsCopied(false), 3000);
			}
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	}, [
		shortUrl,
		customAlias,
		currentOriginalUrl,
		getFullShortUrl,
		commitToBackend,
		setCommittedAlias,
	]);

	const handleQRDownload = useCallback(async () => {
		if (!shortUrl) return;

		const alias = customAlias || shortUrl || "qrcode";
		const fullUrl = getFullShortUrl();
		setCommittedAlias(alias);
		commitToBackend(alias, currentOriginalUrl);

		try {
			const dataUrl = qrCodeDataUrl || (await generateQRCodePNG(fullUrl));
			downloadQRCodeFromDataUrl(dataUrl, `short-${alias}`);
			if (isOnline()) {
				setIsCopied(false);
				setIsQRDownloaded(true);
				setTimeout(() => setIsQRDownloaded(false), 3000);
			}
		} catch (error) {
			console.error("QR Code generation failed:", error);
		}
	}, [
		shortUrl,
		customAlias,
		currentOriginalUrl,
		qrCodeDataUrl,
		getFullShortUrl,
		commitToBackend,
		setCommittedAlias,
	]);

	const handleAliasKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "a") {
				e.preventDefault();
				setValueDirectly(getFullShortUrl());
				setIsAliasInputFocused(false);
				isProgrammaticFocusRef.current = true;
				setTimeout(() => {
					displayAliasRef.current?.focus();
					displayAliasRef.current?.select();
				}, 10);
				return;
			}

			if ((e.ctrlKey || e.metaKey) && e.key === "c") {
				const currentAlias = customAlias || shortUrl || "";
				setCommittedAlias(currentAlias);
				commitToBackend(currentAlias, currentOriginalUrl);
				if (isOnline()) {
					setIsCopied(true);
					setTimeout(() => setIsCopied(false), 3000);
				}
				return;
			}

			if (
				(e.key === "Delete" || e.key === "Backspace") &&
				!isAliasInputFocused
			) {
				e.preventDefault();
				setCustomAlias("");
				setIsAliasInputFocused(true);
				setTimeout(() => customAliasRef.current?.focus(), 10);
				return;
			}

			if (e.key === "Enter") handleCopy();
		},
		[
			getFullShortUrl,
			customAlias,
			shortUrl,
			currentOriginalUrl,
			isAliasInputFocused,
			commitToBackend,
			handleCopy,
			setValueDirectly,
			setCommittedAlias,
			setCustomAlias,
		],
	);

	const handleAliasFocus = useCallback(() => {
		if (isProgrammaticFocusRef.current) {
			isProgrammaticFocusRef.current = false;
			return;
		}
		setIsAliasInputFocused(true);
		setTimeout(() => customAliasRef.current?.focus(), 10);
	}, []);

	const handleAliasBlur = useCallback(() => {
		setIsAliasInputFocused(false);
		const fullUrl = getFullShortUrl();
		setValueDirectly(fullUrl);
		updateQRCodeForAlias(fullUrl);
	}, [getFullShortUrl, setValueDirectly, updateQRCodeForAlias]);

	useEffect(() => {
		if (inputRef.current) inputRef.current.focus();
	}, []);

	useEffect(() => {
		if (shortUrl) {
			setCustomAlias("");
			setIsAliasInputFocused(false);
			startAnimation(getShortUrl(shortUrl));
			setTimeout(() => copyButtonRef.current?.focus(), 300);
		}
	}, [shortUrl, startAnimation, setCustomAlias]);

	const aliasError =
		customAlias && !isValidAlias(customAlias)
			? `Max ${ALIAS_MAX_LENGTH} alphanumeric characters`
			: null;

	const showSuccessMessage = shortUrl && syncStatus !== "offline";

	return (
		<div
			className={clsx(
				"relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden p-4 transition-colors duration-300",
				isDarkMode ? "bg-[#121212]" : "bg-[#fbfbfb]",
			)}
		>
			<ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />

			<main className="z-10 flex w-full max-w-2xl flex-col items-center">
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="mb-12 flex items-center gap-3 text-center"
				>
					<LightningLogo />
					<h1
						className={clsx(
							"bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl",
							isDarkMode
								? "bg-linear-to-r from-white to-gray-400"
								: "bg-linear-to-r from-gray-900 to-gray-600",
						)}
						style={{ fontFamily: '"Funnel Display", system-ui, sans-serif' }}
					>
						SatSet your link
					</h1>
				</motion.div>

				<div className="relative w-full">
					<motion.form
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.3 }}
						onSubmit={handleSubmit(onSubmit)}
						className={clsx(
							"relative w-full transition-opacity duration-500",
							shortUrl ? "opacity-50 hover:opacity-100" : "opacity-100",
						)}
					>
						<div
							className={clsx(
								"group relative flex w-full items-center pb-2",
								isMainInputFocused ? "scale-100" : "scale-95",
							)}
						>
							<label htmlFor="url-input" className="sr-only">
								Paste your link here
							</label>
							<input
								id="url-input"
								{...register("url")}
								ref={(e) => {
									register("url").ref(e);
									inputRef.current = e;
								}}
								type="text"
								placeholder="Paste your link here..."
								className={clsx(
									"flex-1 border-x-0 border-b border-t-0 bg-transparent px-2 py-2 text-center text-xl transition-[font-size,color] duration-300 focus:shadow-none! focus:outline-none! focus:ring-0!",
									isDarkMode
										? "border-white/30 caret-white placeholder:text-white/30 focus:border-white/30 focus:placeholder:text-white/50"
										: "border-gray-300 caret-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:placeholder:text-gray-500",
									isMainInputFocused
										? isDarkMode
											? "text-white"
											: "text-gray-900"
										: isDarkMode
											? "text-white/30"
											: "text-gray-400",
								)}
								autoComplete="off"
								onPaste={handlePaste}
								onFocus={() => {
									setIsMainInputFocused(true);
									setShowArrow(true);
								}}
								onBlur={() => {
									setShowArrow(false);
									setIsMainInputFocused(false);
								}}
							/>

							<AnimatePresence>
								{showArrow && (
									<motion.div
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										className="absolute right-2 top-1/2 -translate-y-1/2"
									>
										<button
											type="submit"
											disabled={isLoading}
											className={clsx(
												"flex h-10 w-10 items-center justify-center rounded-full bg-transparent transition-all focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
												isDarkMode
													? "text-white/70 hover:bg-white/10 hover:text-white"
													: "text-gray-500 hover:bg-black/10 hover:text-gray-900",
											)}
											aria-label="Shorten Link"
										>
											{isLoading ? (
												<div
													className={clsx(
														"h-5 w-5 animate-spin rounded-full border-2",
														isDarkMode
															? "border-white/30 border-t-white"
															: "border-gray-300 border-t-gray-900",
													)}
												/>
											) : (
												<motion.div
													animate={{ x: [0, 3, 0] }}
													transition={{
														repeat: Number.POSITIVE_INFINITY,
														duration: 2,
														ease: "easeInOut",
													}}
												>
													<ArrowRightIcon />
												</motion.div>
											)}
										</button>
									</motion.div>
								)}
							</AnimatePresence>
						</div>

						{errors.url && (
							<motion.p
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								className="absolute -bottom-8 left-0 text-sm font-medium text-red-400"
							>
								{errors.url.message}
							</motion.p>
						)}
					</motion.form>

					<AnimatePresence>
						{shortUrl && (
							<motion.div
								key="result-section"
								initial={{ opacity: 0, scale: 0.2, y: -50, rotateX: -90 }}
								animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
								exit={{ opacity: 0, scale: 0.2, y: -50, rotateX: -90 }}
								transition={{
									type: "spring",
									stiffness: 260,
									damping: 20,
									mass: 0.8,
								}}
								style={{ transformOrigin: "top center", perspective: 1000 }}
								className="absolute left-0 right-0 top-full mt-8 w-full"
							>
								<div
									className={clsx(
										"relative flex items-center rounded-full border px-8 py-4 shadow-2xl backdrop-blur-xl",
										isDarkMode
											? "border-white/10 bg-[#121212]/90"
											: "border-gray-200 bg-white/90",
									)}
								>
									{!isAliasInputFocused && (
										<input
											type="text"
											ref={displayAliasRef}
											value={
												isDecrypting
													? displayValue
													: displayValue || getFullShortUrl()
											}
											readOnly
											className={clsx(
												"m-0 w-auto min-w-25 flex-1 cursor-pointer border-none bg-transparent p-0 font-mono focus:outline-none focus:ring-0",
												isDarkMode ? "text-white" : "text-gray-900",
											)}
											onKeyDown={handleAliasKeyDown}
											onFocus={handleAliasFocus}
											onClick={handleAliasFocus}
										/>
									)}
									{isAliasInputFocused && (
										<>
											<span
												className={clsx(
													"font-mono",
													isDarkMode ? "text-gray-500" : "text-gray-500",
												)}
											>
												{getBaseUrl()}/
											</span>
											<input
												type="text"
												ref={customAliasRef}
												value={customAlias}
												onChange={(e) => setCustomAlias(e.target.value)}
												placeholder={committedAlias || shortUrl || ""}
												maxLength={ALIAS_MAX_LENGTH}
												className={clsx(
													"m-0 w-auto min-w-25 flex-1 border-none bg-transparent p-0 font-mono focus:outline-none focus:ring-0",
													aliasError
														? "text-red-400"
														: isDarkMode
															? "text-white placeholder:italic placeholder:text-white/60"
															: "text-gray-900 placeholder:italic placeholder:text-gray-400",
												)}
												onKeyDown={handleAliasKeyDown}
												onBlur={handleAliasBlur}
											/>
										</>
									)}

									<div className="ml-auto flex items-center gap-2">
										<button
											type="button"
											ref={copyButtonRef}
											onClick={handleCopy}
											onFocus={() => setIsCopyButtonFocused(true)}
											onBlur={() => setIsCopyButtonFocused(false)}
											onMouseEnter={() => setHoveredButton("copy")}
											onMouseLeave={() => setHoveredButton(null)}
											onKeyDown={(e) => {
												if (e.key === "Enter") handleCopy();
											}}
											className={clsx(
												"group flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-all focus:outline-none",
												isDarkMode ? "bg-white/10" : "bg-black/5",
												showCopyRing &&
													(isDarkMode
														? "ring-2 ring-teal-500 ring-offset-2 ring-offset-[#121212]"
														: "ring-2 ring-teal-500 ring-offset-2 ring-offset-white"),
											)}
											aria-label="Copy short link"
										>
											<CopyIcon
												className={isDarkMode ? "text-white" : "text-gray-700"}
												animated={showCopyRing}
											/>
										</button>

										<button
											type="button"
											onClick={handleQRDownload}
											onFocus={() => setIsQRButtonFocused(true)}
											onBlur={() => setIsQRButtonFocused(false)}
											onMouseEnter={() => setHoveredButton("qr")}
											onMouseLeave={() => setHoveredButton(null)}
											onKeyDown={(e) => {
												if (e.key === "Enter") handleQRDownload();
											}}
											className={clsx(
												"group flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-all focus:outline-none",
												isDarkMode ? "bg-white/10" : "bg-black/5",
												showQRRing &&
													(isDarkMode
														? "ring-2 ring-teal-500 ring-offset-2 ring-offset-[#121212]"
														: "ring-2 ring-teal-500 ring-offset-2 ring-offset-white"),
											)}
											aria-label="Generate QR Code"
										>
											<QRIcon
												className={isDarkMode ? "text-white" : "text-gray-700"}
												animated={showQRRing}
											/>
										</button>
									</div>

									<AnimatePresence>
										{showCopyTooltip && (
											<motion.div
												initial={{ opacity: 0, x: -10, scale: 0.95 }}
												animate={{ opacity: 1, x: 0, scale: 1 }}
												exit={{ opacity: 0, x: -10, scale: 0.95 }}
												transition={{
													type: "spring",
													stiffness: 260,
													damping: 20,
												}}
												className="absolute bottom-0 left-full top-0 z-50 ml-4 flex items-center"
											>
												<div
													className={clsx(
														"absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 rounded-bl-sm",
														isDarkMode ? "bg-[#1a1a1a]" : "bg-white",
													)}
												/>
												<div
													className={clsx(
														"relative whitespace-nowrap rounded-xl px-3 py-2 shadow-2xl",
														isDarkMode ? "bg-[#1a1a1a]" : "bg-white",
													)}
												>
													<div
														className={clsx(
															"flex items-center gap-1.5 text-xs",
															isDarkMode ? "text-gray-400" : "text-gray-500",
														)}
													>
														<kbd
															className={clsx(
																"rounded px-1.5 py-0.5 text-[10px]",
																isDarkMode
																	? "bg-white/10 text-gray-300"
																	: "bg-black/5 text-gray-600",
															)}
														>
															{hoveredButton === "copy" ? "Click" : "Enter"}
														</kbd>
														<span>copy</span>
													</div>
												</div>
											</motion.div>
										)}
									</AnimatePresence>

									<AnimatePresence>
										{showQRTooltip && (
											<motion.div
												initial={{ opacity: 0, x: -10, scale: 0.95 }}
												animate={{ opacity: 1, x: 0, scale: 1 }}
												exit={{ opacity: 0, x: -10, scale: 0.95 }}
												transition={{
													type: "spring",
													stiffness: 260,
													damping: 20,
												}}
												className="absolute bottom-0 left-full top-0 z-50 ml-4 flex items-center"
											>
												<div
													className={clsx(
														"absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 rounded-bl-sm",
														isDarkMode ? "bg-[#1a1a1a]" : "bg-white",
													)}
												/>
												<div
													className={clsx(
														"relative whitespace-nowrap rounded-xl px-3 py-2 shadow-2xl",
														isDarkMode ? "bg-[#1a1a1a]" : "bg-white",
													)}
												>
													<div
														className={clsx(
															"flex items-center gap-1.5 text-xs",
															isDarkMode ? "text-gray-400" : "text-gray-500",
														)}
													>
														<kbd
															className={clsx(
																"rounded px-1.5 py-0.5 text-[10px]",
																isDarkMode
																	? "bg-white/10 text-gray-300"
																	: "bg-black/5 text-gray-600",
															)}
														>
															{hoveredButton === "qr" ? "Click" : "Enter"}
														</kbd>
														<span>download</span>
													</div>
												</div>
											</motion.div>
										)}
									</AnimatePresence>
								</div>

								{showSuccessMessage && (
									<motion.p
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.2 }}
										className="mt-4 text-center text-sm text-teal-800"
									>
										Short link is ready.{" "}
										<button
											type="button"
											onClick={handleAliasFocus}
											className="cursor-pointer hover:text-teal-600"
										>
											Click to custom!
										</button>
									</motion.p>
								)}

								{aliasError && (
									<motion.p
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										className="mt-2 text-center text-xs text-red-400"
									>
										{aliasError}
									</motion.p>
								)}
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</main>

			<Toast
				visible={isCopied && !isOfflineToastVisible}
				message="Shortener link copied to clipboard"
				variant="success"
				isDarkMode={isDarkMode}
			/>
			<Toast
				visible={isQRDownloaded && !isOfflineToastVisible}
				message="QR Code downloaded"
				variant="success"
				isDarkMode={isDarkMode}
			/>
			<Toast
				visible={isOfflineToastVisible}
				message="No internet connection. Your link is not ready to use."
				variant="error"
				isDarkMode={isDarkMode}
			/>

			<Link
				to="/privacy"
				className={clsx(
					"absolute bottom-6 right-6 flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all",
					isDarkMode
						? "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
						: "bg-black/5 text-gray-500 hover:bg-black/10 hover:text-gray-900",
				)}
			>
				<InfoIcon />
				About & Privacy
			</Link>
		</div>
	);
}

export const Route = createFileRoute("/")({
	component: HomePage,
});
