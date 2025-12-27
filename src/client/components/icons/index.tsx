import clsx from "clsx";

interface IconProps {
	className?: string;
	animated?: boolean;
}

export function SunIcon({ className, animated }: IconProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			strokeWidth={1.5}
			stroke="currentColor"
			className={clsx("h-5 w-5", animated && "animate-ring-shake", className)}
			aria-hidden="true"
		>
			<title>Sun icon</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
			/>
		</svg>
	);
}

export function MoonIcon({ className, animated }: IconProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			strokeWidth={1.5}
			stroke="currentColor"
			className={clsx("h-5 w-5", animated && "animate-ring-shake", className)}
			aria-hidden="true"
		>
			<title>Moon icon</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
			/>
		</svg>
	);
}

export function CopyIcon({ className, animated }: IconProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
			className={clsx(
				"h-5 w-5 transition-transform active:scale-90",
				animated && "animate-ring-shake",
				className,
			)}
		>
			<title>Copy icon</title>
			<path d="M7 4V2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3Zm2 0h6V3H9v1Z" />
			<path d="M5 6v12h14V6H5Zm3 3h8v2H8V9Zm0 4h8v2H8v-2Z" />
		</svg>
	);
}

export function QRIcon({ className, animated }: IconProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
			className={clsx(
				"h-5 w-5 transition-transform active:scale-90",
				animated && "animate-ring-shake",
				className,
			)}
		>
			<title>QR Code</title>
			<path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm8-2h2v2h-2v-2zm2 2h2v2h2v-2h-2v-2h-2v2zm2-2v-2h2v2h-2zm0 6h2v2h-2v-2zm-4 0h2v2h-2v-2z" />
		</svg>
	);
}

export function CheckIcon({ className }: IconProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			className={clsx("h-3.5 w-3.5", className)}
			aria-hidden="true"
		>
			<path
				fillRule="evenodd"
				d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
				clipRule="evenodd"
			/>
		</svg>
	);
}

export function CloseIcon({ className }: IconProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			className={clsx("h-3.5 w-3.5", className)}
			aria-hidden="true"
		>
			<path
				fillRule="evenodd"
				d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
				clipRule="evenodd"
			/>
		</svg>
	);
}

export function ArrowRightIcon({ className }: IconProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={clsx("h-6 w-6", className)}
		>
			<title>Shorten Link</title>
			<line x1="5" y1="12" x2="19" y2="12" />
			<polyline points="12 5 19 12 12 19" />
		</svg>
	);
}

export function InfoIcon({ className }: IconProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			strokeWidth={1.5}
			stroke="currentColor"
			className={clsx("h-4 w-4", className)}
			aria-hidden="true"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
			/>
		</svg>
	);
}

export function BackIcon({ className }: IconProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			strokeWidth={1.5}
			stroke="currentColor"
			className={clsx("h-4 w-4", className)}
			aria-hidden="true"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
			/>
		</svg>
	);
}

export function LightningLogo({ className }: IconProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 32 32"
			className={clsx("h-10 w-10 md:h-12 md:w-12", className)}
			aria-hidden="true"
		>
			<defs>
				<linearGradient id="flash" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" style={{ stopColor: "#14b8a6" }} />
					<stop offset="100%" style={{ stopColor: "#0d9488" }} />
				</linearGradient>
			</defs>
			<path d="M18 2L6 18h8l-2 12 12-16h-8l2-12z" fill="url(#flash)" />
		</svg>
	);
}
