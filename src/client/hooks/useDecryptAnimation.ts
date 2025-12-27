import { useCallback, useEffect, useRef, useState } from "react";
import { CHARS } from "../lib/constants";

interface UseDecryptAnimationOptions {
	speed?: number;
	charsPerFrame?: number;
}

export function useDecryptAnimation(options: UseDecryptAnimationOptions = {}) {
	const { speed = 25, charsPerFrame = 2 } = options;

	const [isDecrypting, setIsDecrypting] = useState(false);
	const [displayValue, setDisplayValue] = useState("");
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const cleanup = useCallback(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, []);

	const startAnimation = useCallback(
		(targetText: string) => {
			cleanup();

			let revealedCount = 0;
			setIsDecrypting(true);

			setDisplayValue(
				Array.from({ length: targetText.length })
					.map(() => CHARS[Math.floor(Math.random() * CHARS.length)])
					.join(""),
			);

			intervalRef.current = setInterval(() => {
				revealedCount += charsPerFrame;

				setDisplayValue(() => {
					let result = "";
					for (let i = 0; i < targetText.length; i++) {
						if (i < revealedCount) {
							result += targetText[i] || "";
						} else {
							result += CHARS[Math.floor(Math.random() * CHARS.length)];
						}
					}
					return result;
				});

				if (revealedCount > targetText.length) {
					setDisplayValue(targetText);
					setIsDecrypting(false);
					cleanup();
				}
			}, speed);
		},
		[speed, charsPerFrame, cleanup],
	);

	const setValueDirectly = useCallback((value: string) => {
		setDisplayValue(value);
		setIsDecrypting(false);
	}, []);

	useEffect(() => {
		return cleanup;
	}, [cleanup]);

	return {
		isDecrypting,
		displayValue,
		startAnimation,
		setValueDirectly,
	};
}
