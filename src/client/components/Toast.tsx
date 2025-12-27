import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { CheckIcon, CloseIcon } from "./icons";

interface ToastProps {
	visible: boolean;
	message: string;
	variant?: "success" | "error";
	isDarkMode: boolean;
}

export function Toast({
	visible,
	message,
	variant = "success",
	isDarkMode,
}: ToastProps) {
	return (
		<AnimatePresence>
			{visible && (
				<motion.div
					initial={{ opacity: 0, y: 50 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: 20 }}
					className="fixed inset-x-0 bottom-8 z-50 flex justify-center"
				>
					<div
						className={clsx(
							"flex items-center gap-3 rounded-full border px-6 py-3 shadow-2xl backdrop-blur-xl",
							variant === "error" && "border-red-500/30",
							variant === "success" &&
								(isDarkMode ? "border-white/10" : "border-gray-200"),
							isDarkMode
								? "bg-[#121212]/80 text-white"
								: "bg-white/80 text-gray-900",
						)}
					>
						<div
							className={clsx(
								"flex h-5 w-5 items-center justify-center rounded-full",
								variant === "success" && "bg-teal-500 text-black",
								variant === "error" && "bg-red-500 text-white",
							)}
						>
							{variant === "success" ? <CheckIcon /> : <CloseIcon />}
						</div>
						<span className="text-sm font-medium">{message}</span>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
