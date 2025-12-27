import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { MoonIcon, SunIcon } from "./icons";

interface ThemeToggleProps {
	isDarkMode: boolean;
	onToggle: () => void;
}

export function ThemeToggle({ isDarkMode, onToggle }: ThemeToggleProps) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<div className="absolute right-4 top-4">
			<button
				type="button"
				onClick={onToggle}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				className={clsx(
					"flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-all focus:outline-none",
					isDarkMode ? "bg-white/10 text-white" : "bg-black/5 text-gray-700",
					isHovered &&
						(isDarkMode
							? "ring-2 ring-teal-500 ring-offset-2 ring-offset-[#121212]"
							: "ring-2 ring-teal-500 ring-offset-2 ring-offset-[#fbfbfb]"),
				)}
				aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
			>
				{isDarkMode ? (
					<SunIcon animated={isHovered} />
				) : (
					<MoonIcon animated={isHovered} />
				)}
			</button>

			<AnimatePresence>
				{isHovered && (
					<motion.div
						initial={{ opacity: 0, x: 10, scale: 0.95 }}
						animate={{ opacity: 1, x: 0, scale: 1 }}
						exit={{ opacity: 0, x: 10, scale: 0.95 }}
						transition={{ type: "spring", stiffness: 260, damping: 20 }}
						className="absolute bottom-0 right-full top-0 z-50 mr-4 flex items-center"
					>
						<div
							className={clsx(
								"absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 rounded-tr-sm",
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
								<span>{isDarkMode ? "Toggle to light" : "Toggle to dark"}</span>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
