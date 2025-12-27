import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useTheme } from "../lib/useTheme";

function PrivacyPage() {
	const { isDarkMode, toggleTheme } = useTheme();

	return (
		<div
			className={clsx(
				"relative min-h-screen w-full px-4 py-12 transition-colors duration-300",
				isDarkMode ? "bg-[#121212]" : "bg-[#fbfbfb]",
			)}
		>
			{/* Theme Toggle Button */}
			<div className="absolute right-4 top-4">
				<button
					type="button"
					onClick={toggleTheme}
					className={clsx(
						"flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-all focus:outline-none",
						isDarkMode ? "bg-white/10 text-white" : "bg-black/5 text-gray-700",
					)}
					aria-label={
						isDarkMode ? "Switch to light mode" : "Switch to dark mode"
					}
				>
					{isDarkMode ? (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="currentColor"
							className="h-5 w-5"
						>
							<title>Sun icon</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
							/>
						</svg>
					) : (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="currentColor"
							className="h-5 w-5"
						>
							<title>Moon icon</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
							/>
						</svg>
					)}
				</button>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="mx-auto max-w-2xl"
			>
				{/* Back Link */}
				<Link
					to="/"
					className={clsx(
						"mb-8 inline-flex items-center gap-2 text-sm transition-colors",
						isDarkMode
							? "text-gray-400 hover:text-white"
							: "text-gray-500 hover:text-gray-900",
					)}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
						className="h-4 w-4"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
						/>
					</svg>
					Back to home
				</Link>

				{/* Header */}
				<h1
					className={clsx(
						"mb-8 text-3xl font-bold",
						isDarkMode ? "text-white" : "text-gray-900",
					)}
					style={{ fontFamily: '"Funnel Display", system-ui, sans-serif' }}
				>
					About & Privacy
				</h1>

				{/* Content */}
				<div
					className={clsx(
						"space-y-8 text-base leading-relaxed",
						isDarkMode ? "text-gray-300" : "text-gray-600",
					)}
				>
					{/* What is SatSet */}
					<section>
						<h2
							className={clsx(
								"mb-4 text-xl font-semibold",
								isDarkMode ? "text-white" : "text-gray-900",
							)}
						>
							⚡ What is satset.io?
						</h2>
						<p className="mb-4">
							SatSet is a <strong>no-nonsense URL shortener</strong> built out
							of frustration with existing tools. We were tired of:
						</p>
						<ul className="list-inside list-disc space-y-2 pl-2">
							<li>
								🔐 <strong>Forced logins</strong> — just to shorten a link?
								Really?
							</li>
							<li>
								📊 <strong>Data harvesting</strong> — tracking everything you do
							</li>
							<li>
								😵 <strong>Cluttered interfaces</strong> — ads, popups, and
								unnecessary features everywhere
							</li>
							<li>
								🐢 <strong>Slow workflows</strong> — too many clicks for a
								simple task
							</li>
						</ul>
						<p className="mt-4">
							So we built SatSet.{" "}
							<strong>Paste a URL, get a short link in an instant.</strong>{" "}
							That's it. No signup, no tracking, no BS. Just get the job done.
						</p>
					</section>

					{/* Privacy & Security */}
					<section>
						<h2
							className={clsx(
								"mb-4 text-xl font-semibold",
								isDarkMode ? "text-white" : "text-gray-900",
							)}
						>
							🔒 Privacy & Security
						</h2>
						<p className="mb-4">
							We take your privacy seriously. Here's what we store:
						</p>
						<ul className="list-inside list-disc space-y-2 pl-2">
							<li>Your URLs (original + shortened alias)</li>
						</ul>
						<p className="mt-4 mb-4">
							That's it. We do <strong>NOT</strong> collect:
						</p>
						<ul className="list-inside list-disc space-y-2 pl-2">
							<li>❌ Personal information or accounts</li>
							<li>❌ IP addresses of you or your visitors</li>
							<li>❌ Cookies or tracking data</li>
							<li>❌ Browser fingerprints</li>
							<li>❌ Any analytics</li>
						</ul>
						<p className="mt-4">
							<strong>🗑️ Auto-delete:</strong> All links expire after{" "}
							<strong>14 days</strong> and are permanently deleted. No data
							hoarding here.
						</p>
						<p className="mt-4">
							<strong>🛡️ Security:</strong> We only accept HTTPS URLs, IP
							addresses and localhost are not allowed.
						</p>
					</section>

					{/* Questions */}
					<section>
						<h2
							className={clsx(
								"mb-4 text-xl font-semibold",
								isDarkMode ? "text-white" : "text-gray-900",
							)}
						>
							💬 Questions?
						</h2>
						<p>
							Found a bug? Have a suggestion? Open an issue on{" "}
							<a
								href="https://github.com/arhen/satset.io/issues"
								target="_blank"
								rel="noopener noreferrer"
								className="text-teal-500 underline hover:text-teal-400"
							>
								GitHub
							</a>
							. We'd love to hear from you!
						</p>
					</section>
				</div>
			</motion.div>
		</div>
	);
}

export const Route = createFileRoute("/privacy")({
	component: PrivacyPage,
});
