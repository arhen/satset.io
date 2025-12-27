import QRCode from "qrcode";

function loadLogoImage(): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error("Failed to load logo"));
		img.src = "/favicon.svg";
	});
}

export async function generateQRCodePNG(
	text: string,
	size: number = 300,
): Promise<string> {
	const canvas = document.createElement("canvas");
	await QRCode.toCanvas(canvas, text, {
		width: size,
		margin: 2,
		color: { dark: "#000000", light: "#ffffff" },
		errorCorrectionLevel: "H",
	});

	const ctx = canvas.getContext("2d");
	if (ctx) {
		try {
			const logo = await loadLogoImage();
			const logoSize = size * 0.22;
			const logoX = (size - logoSize) / 2;
			const logoY = (size - logoSize) / 2;

			ctx.beginPath();
			ctx.arc(size / 2, size / 2, logoSize / 2 + 4, 0, Math.PI * 2);
			ctx.fillStyle = "#ffffff";
			ctx.fill();

			ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
		} catch (error) {
			console.warn("Could not add logo to QR code:", error);
		}
	}

	return canvas.toDataURL("image/png");
}

export function downloadQRCodeFromDataUrl(
	dataUrl: string,
	filename: string,
): void {
	const link = document.createElement("a");
	link.download = `${filename}.png`;
	link.href = dataUrl;
	link.click();
}

export async function downloadQRCode(
	text: string,
	filename: string,
	size: number = 300,
): Promise<void> {
	const dataUrl = await generateQRCodePNG(text, size);
	downloadQRCodeFromDataUrl(dataUrl, filename);
}
