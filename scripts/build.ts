#!/usr/bin/env bun

import { existsSync } from "node:fs";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { $ } from "bun";

const ROOT_DIR = path.resolve(import.meta.dir, "..");
const SRC_DIR = path.join(ROOT_DIR, "src");
const CLIENT_DIR = path.join(SRC_DIR, "client");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const DIST_DIR = path.join(ROOT_DIR, "dist");

async function clean() {
	console.log("🧹 Cleaning dist directory...");
	if (existsSync(DIST_DIR)) {
		await rm(DIST_DIR, { recursive: true });
	}
	await mkdir(DIST_DIR, { recursive: true });
}

async function buildJS() {
	console.log("📦 Building JavaScript bundle...");

	const result = await Bun.build({
		entrypoints: [path.join(CLIENT_DIR, "main.tsx")],
		outdir: DIST_DIR,
		minify: true,
		splitting: true,
		format: "esm",
		target: "browser",
		naming: {
			entry: "[name]-[hash].js",
			chunk: "[name]-[hash].js",
			asset: "[name]-[hash][ext]",
		},
	});

	if (!result.success) {
		console.error("❌ Build failed:");
		for (const log of result.logs) {
			console.error(log);
		}
		process.exit(1);
	}

	const entryOutput = result.outputs.find(
		(o) => o.kind === "entry-point" && o.path.includes("main"),
	);
	if (!entryOutput) {
		throw new Error("Could not find entry output");
	}

	const entryFilename = path.basename(entryOutput.path);
	console.log(`   ✓ Entry: ${entryFilename}`);

	return entryFilename;
}

async function buildCSS() {
	console.log("🎨 Building Tailwind CSS...");

	const cssOutputPath = path.join(DIST_DIR, "styles.css");

	try {
		await $`bunx postcss ${path.join(CLIENT_DIR, "global.css")} -o ${cssOutputPath}`.quiet();
		console.log("   ✓ CSS built successfully");
	} catch (error) {
		console.error("❌ CSS build failed:", error);
		process.exit(1);
	}

	return "styles.css";
}

async function buildHTML(jsFilename: string, cssFilename: string) {
	console.log("📄 Generating index.html...");

	const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>SatSet your link</title>
    
    <meta name="title" content="SatSet your link" />
    <meta name="description" content="Lightning-fast URL shortener. Create short, memorable links instantly with QR codes." />
    
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://satset.io/" />
    <meta property="og:title" content="SatSet your link" />
    <meta property="og:description" content="Lightning-fast URL shortener. Create short, memorable links instantly with QR codes." />
    <meta property="og:image" content="https://satset.io/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="satset.io" />
    
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="https://satset.io/" />
    <meta name="twitter:title" content="SatSet your link" />
    <meta name="twitter:description" content="Lightning-fast URL shortener. Create short, memorable links instantly with QR codes." />
    <meta name="twitter:image" content="https://satset.io/og-image.png" />
    
    <meta name="theme-color" content="#14b8a6" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <link rel="apple-touch-icon" href="/favicon.svg" />
    
    <link rel="stylesheet" href="/${cssFilename}" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/${jsFilename}"></script>
  </body>
</html>`;

	await writeFile(path.join(DIST_DIR, "index.html"), html, "utf-8");
	console.log("   ✓ index.html generated");
}

async function copyAssets() {
	console.log("📁 Copying static assets...");

	const assetsToCheck = [
		"favicon.svg",
		"og-image.png",
		"og-image.png",
		"favicon.ico",
		"favicon.png",
		"robots.txt",
	];

	for (const asset of assetsToCheck) {
		const srcPath = path.join(PUBLIC_DIR, asset);
		if (existsSync(srcPath)) {
			await cp(srcPath, path.join(DIST_DIR, asset));
			console.log(`   ✓ Copied ${asset}`);
		}
	}
}

async function main() {
	console.log("\n🚀 Building URL Shortener for production...\n");

	const startTime = Date.now();

	await clean();
	const jsFilename = await buildJS();
	const cssFilename = await buildCSS();
	await buildHTML(jsFilename, cssFilename);
	await copyAssets();

	const duration = ((Date.now() - startTime) / 1000).toFixed(2);
	console.log(`\n✅ Build complete in ${duration}s`);
	console.log(`   Output: ${DIST_DIR}\n`);
}

main().catch((err) => {
	console.error("Build error:", err);
	process.exit(1);
});
