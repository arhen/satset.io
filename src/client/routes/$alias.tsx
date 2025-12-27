import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { getRedirectData } from "../lib/api";
import { useTheme } from "../lib/useTheme";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function NotFoundPage() {
	const handleKeyDown = useCallback((e: KeyboardEvent) => {
		if (e.key === "Enter") {
			window.location.href = "/";
		}
	}, []);

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-[#121212] p-4">
			<h1
				className="bg-linear-to-r from-white to-gray-400 bg-clip-text text-6xl font-bold tracking-tight text-transparent md:text-8xl"
				style={{ fontFamily: '"Funnel Display", system-ui, sans-serif' }}
			>
				404
			</h1>
			<p className="mt-4 flex items-center gap-1.5 text-sm text-gray-500">
				<span>Link expired / not found.</span>
				<a
					href="/"
					className="flex items-center gap-1.5 text-gray-400 transition-colors hover:text-gray-300"
				>
					<kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-gray-300">
						Enter
					</kbd>
					<span>to create new</span>
				</a>
			</p>
		</div>
	);
}

interface RedirectPageProps {
	originalUrl: string;
}

function RedirectPage({ originalUrl }: RedirectPageProps) {
	const { isDarkMode } = useTheme();
	const [hasMouseMoved, setHasMouseMoved] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [countdown, setCountdown] = useState(3);
	const [displayedUrl, setDisplayedUrl] = useState(() => {
		// Start with the current alias URL
		const currentAlias = window.location.pathname.slice(1);
		return `${window.location.origin}/${currentAlias}`;
	});
	const [isDecrypting, setIsDecrypting] = useState(false);
	const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const decryptIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
		null,
	);
	const hasRedirectedRef = useRef(false);
	const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Handle mouse movement
	const handleMouseMove = useCallback(() => {
		if (!hasMouseMoved) {
			setHasMouseMoved(true);
		}
	}, [hasMouseMoved]);

	// Start countdown when mouse moves (pause when hovering link)
	useEffect(() => {
		// Only create interval if conditions met AND no existing interval
		if (
			hasMouseMoved &&
			!hasRedirectedRef.current &&
			!isPaused &&
			!countdownRef.current
		) {
			countdownRef.current = setInterval(() => {
				setCountdown((prev) => {
					if (prev <= 1) {
						if (countdownRef.current) {
							clearInterval(countdownRef.current);
							countdownRef.current = null;
						}
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		}

		return () => {
			if (countdownRef.current) {
				clearInterval(countdownRef.current);
				countdownRef.current = null;
			}
		};
	}, [hasMouseMoved, isPaused]);

	// Redirect when countdown reaches 0
	useEffect(() => {
		if (countdown === 0 && !hasRedirectedRef.current) {
			hasRedirectedRef.current = true;
			window.location.href = originalUrl;
		}
	}, [countdown, originalUrl]);

	// Listen for mouse movement on the entire viewport
	useEffect(() => {
		window.addEventListener("mousemove", handleMouseMove);
		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
		};
	}, [handleMouseMove]);

	// Cleanup hover timeout on unmount
	useEffect(() => {
		return () => {
			if (hoverTimeoutRef.current) {
				clearTimeout(hoverTimeoutRef.current);
				hoverTimeoutRef.current = null;
			}
		};
	}, []);

	// Instant redirect on Enter key
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Enter" && !hasRedirectedRef.current) {
				hasRedirectedRef.current = true;
				window.location.href = originalUrl;
			}
		},
		[originalUrl],
	);

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [handleKeyDown]);

	// Decrypt/scramble effect for URL - starts after page load
	useEffect(() => {
		const targetText = originalUrl;
		let revealedCount = 0;

		// Short delay before starting decrypt
		const startDelay = setTimeout(() => {
			setIsDecrypting(true);

			decryptIntervalRef.current = setInterval(() => {
				// Reveal 2 characters per frame
				revealedCount += 2;

				setDisplayedUrl(() => {
					let result = "";
					for (let i = 0; i < targetText.length; i++) {
						if (i < revealedCount) {
							// Already revealed - show target character
							result += targetText[i] || "";
						} else {
							// Not yet revealed - show random character
							result += CHARS[Math.floor(Math.random() * CHARS.length)];
						}
					}
					return result;
				});

				if (revealedCount > targetText.length) {
					setDisplayedUrl(targetText);
					setIsDecrypting(false);
					if (decryptIntervalRef.current) {
						clearInterval(decryptIntervalRef.current);
						decryptIntervalRef.current = null;
					}
				}
			}, 25);
		}, 300);

		return () => {
			clearTimeout(startDelay);
			if (decryptIntervalRef.current) {
				clearInterval(decryptIntervalRef.current);
				decryptIntervalRef.current = null;
			}
		};
	}, [originalUrl]);

	// Calculate progress for the circular loader (0 to 1)
	const progress = hasMouseMoved ? (3 - countdown) / 3 : 0;

	return (
		<div
			className={clsx(
				"flex min-h-screen w-full flex-col items-center justify-center p-4 transition-colors duration-300",
				isDarkMode ? "bg-[#121212]" : "bg-[#fbfbfb]",
			)}
		>
			<div className="flex flex-col items-center text-center">
				{/* Main content - Title + Arrow/Countdown + URL in one line */}
				<div className="flex items-center gap-3">
					<span
						className={clsx(
							"bg-clip-text text-2xl font-medium tracking-tight text-transparent md:text-3xl",
							isDarkMode
								? "bg-linear-to-r from-white to-gray-400"
								: "bg-linear-to-r from-gray-900 to-gray-600",
						)}
						style={{ fontFamily: '"Funnel Display", system-ui, sans-serif' }}
					>
						{hasMouseMoved
							? "You will be redirected in"
							: "You will be redirected to"}
					</span>

					<AnimatePresence mode="wait">
						{hasMouseMoved ? (
							<motion.div
								key="countdown"
								initial={{ scale: 0.8 }}
								animate={{ scale: 1 }}
								exit={{ scale: 0.8 }}
								className="relative flex h-10 w-10 items-center justify-center"
							>
								{/* Background circle */}
								<svg
									className="absolute h-10 w-10 -rotate-90"
									aria-label="Countdown progress"
								>
									<title>Countdown progress</title>
									<circle
										cx="20"
										cy="20"
										r="16"
										fill="none"
										stroke={
											isDarkMode
												? "rgba(255, 255, 255, 0.1)"
												: "rgba(0, 0, 0, 0.1)"
										}
										strokeWidth="3"
									/>
									{/* Progress circle */}
									<motion.circle
										cx="20"
										cy="20"
										r="16"
										fill="none"
										stroke="rgb(20, 184, 166)"
										strokeWidth="3"
										strokeLinecap="round"
										strokeDasharray={2 * Math.PI * 16}
										strokeDashoffset={2 * Math.PI * 16 * (1 - progress)}
										initial={{ strokeDashoffset: 2 * Math.PI * 16 }}
										animate={{
											strokeDashoffset: 2 * Math.PI * 16 * (1 - progress),
										}}
										transition={{ duration: 0.3, ease: "linear" }}
									/>
								</svg>
								{/* Countdown number */}
								<motion.span
									key={countdown}
									initial={{ scale: 1.5 }}
									animate={{ scale: 1 }}
									className={clsx(
										"text-lg font-bold",
										isDarkMode ? "text-white" : "text-gray-900",
									)}
								>
									{countdown}
								</motion.span>
							</motion.div>
						) : (
							<motion.span
								key="arrow"
								animate={{ x: [0, 5, 0] }}
								transition={{
									x: {
										duration: 1.5,
										repeat: Number.POSITIVE_INFINITY,
										ease: "easeInOut",
									},
								}}
								className={clsx(
									"text-2xl md:text-3xl",
									isDarkMode ? "text-gray-400" : "text-gray-500",
								)}
							>
								-&gt;
							</motion.span>
						)}
					</AnimatePresence>

					<a
						href={originalUrl}
						title={originalUrl}
						className={clsx(
							"w-64 truncate text-left text-base transition-colors md:w-96 md:text-lg",
							isDarkMode
								? "text-teal-400 hover:text-teal-300"
								: "text-teal-600 hover:text-teal-500",
						)}
						style={{ fontFamily: "Iosevka, monospace" }}
						onMouseEnter={() => {
							// Delay before pausing to allow mouse to pass by
							hoverTimeoutRef.current = setTimeout(() => {
								setIsPaused(true);
							}, 500);
						}}
						onMouseLeave={() => {
							// Clear pending pause if mouse leaves quickly
							if (hoverTimeoutRef.current) {
								clearTimeout(hoverTimeoutRef.current);
							}
							setIsPaused(false);
						}}
					>
						{displayedUrl}
						{isDecrypting && (
							<motion.span
								animate={{ opacity: [1, 0.3] }}
								transition={{ duration: 0.1, repeat: Number.POSITIVE_INFINITY }}
								className={isDarkMode ? "text-teal-400" : "text-teal-600"}
							>
								_
							</motion.span>
						)}
					</a>
				</div>

				{/* Helper text below */}
				<p
					className={clsx(
						"mt-6 flex items-center gap-1.5 self-start text-sm",
						isDarkMode ? "text-gray-500" : "text-gray-400",
					)}
				>
					<span>Tips: preview link with hover before redirect or</span>
					<kbd
						className={clsx(
							"rounded px-1.5 py-0.5 text-[10px]",
							isDarkMode
								? "bg-white/10 text-gray-300"
								: "bg-black/5 text-gray-500",
						)}
					>
						Enter
					</kbd>
					<span>to go</span>
				</p>
			</div>
		</div>
	);
}

function AliasRoute() {
	const { alias } = Route.useParams();

	const { data, isLoading, isError } = useQuery({
		queryKey: ["redirect", alias],
		queryFn: () => getRedirectData(alias),
	});

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[#121212]">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
			</div>
		);
	}

	if (isError || !data) {
		return <NotFoundPage />;
	}

	return <RedirectPage originalUrl={data.original_url} />;
}

export const Route = createFileRoute("/$alias")({
	component: AliasRoute,
});
