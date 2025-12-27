import { useCallback, useEffect, useState } from "react";

export function useTheme() {
	const [isDarkMode, setIsDarkMode] = useState(() => {
		if (typeof window === "undefined") return true;

		// Check localStorage first
		const saved = localStorage.getItem("theme");
		if (saved) return saved === "dark";

		// Fall back to system preference
		return window.matchMedia("(prefers-color-scheme: dark)").matches;
	});

	// Listen for system preference changes
	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

		const handleChange = (e: MediaQueryListEvent) => {
			// Only update if no saved preference
			if (!localStorage.getItem("theme")) {
				setIsDarkMode(e.matches);
			}
		};

		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, []);

	// Listen for localStorage changes (cross-tab sync)
	useEffect(() => {
		const handleStorage = (e: StorageEvent) => {
			if (e.key === "theme") {
				setIsDarkMode(e.newValue === "dark");
			}
		};

		window.addEventListener("storage", handleStorage);
		return () => window.removeEventListener("storage", handleStorage);
	}, []);

	const toggleTheme = useCallback(() => {
		setIsDarkMode((prev) => {
			const newValue = !prev;
			localStorage.setItem("theme", newValue ? "dark" : "light");
			return newValue;
		});
	}, []);

	return { isDarkMode, toggleTheme };
}
