import { createUrl } from "./api";

const SYNC_QUEUE_KEY = "syncQueue";
const SYNCED_URLS_KEY = "syncedUrls";

export interface SyncTask {
	id: string;
	type: "create";
	alias: string;
	originalUrl: string;
	createdAt: number;
	retryCount: number;
}

export interface SyncedUrl {
	alias: string;
	originalUrl: string;
	syncedAt: number;
	expiresAt: number;
}

export interface ApiCreateResponse {
	alias: string;
	short_url: string;
	original_url: string;
	expires_at: number;
	created_at: number;
}

export type SyncStatus = "idle" | "syncing" | "offline" | "error" | "success";

type SyncStatusListener = (status: SyncStatus, message?: string) => void;
const listeners: Set<SyncStatusListener> = new Set();

let currentStatus: SyncStatus = "idle";
let isSyncing = false;

export const onSyncStatusChange = (
	listener: SyncStatusListener,
): (() => void) => {
	listeners.add(listener);
	return () => listeners.delete(listener);
};

const notifyListeners = (status: SyncStatus, message?: string): void => {
	currentStatus = status;
	queueMicrotask(() => {
		for (const listener of listeners) {
			try {
				listener(status, message);
			} catch (e) {
				console.error("Sync listener error:", e);
			}
		}
	});
};

export const isOnline = (): boolean => navigator.onLine;

const getSyncQueue = (): SyncTask[] => {
	try {
		const queue = localStorage.getItem(SYNC_QUEUE_KEY);
		return queue ? JSON.parse(queue) : [];
	} catch {
		return [];
	}
};

const saveSyncQueue = (queue: SyncTask[]): void => {
	try {
		localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
	} catch (e) {
		console.error("Failed to save sync queue:", e);
	}
};

export const getSyncedUrls = (): Map<string, SyncedUrl> => {
	try {
		const data = localStorage.getItem(SYNCED_URLS_KEY);
		if (!data) return new Map();
		const arr: SyncedUrl[] = JSON.parse(data);
		return new Map(arr.map((u) => [u.alias, u]));
	} catch {
		return new Map();
	}
};

const saveSyncedUrls = (urls: Map<string, SyncedUrl>): void => {
	try {
		localStorage.setItem(SYNCED_URLS_KEY, JSON.stringify([...urls.values()]));
	} catch (e) {
		console.error("Failed to save synced URLs:", e);
	}
};

export const queueCreate = (alias: string, originalUrl: string): void => {
	queueMicrotask(() => {
		const syncedUrls = getSyncedUrls();
		if (syncedUrls.has(alias)) return;

		const queue = getSyncQueue();

		const existing = queue.find(
			(t) => t.alias === alias && t.type === "create",
		);
		if (existing) return;

		const task: SyncTask = {
			id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
			type: "create",
			alias,
			originalUrl,
			createdAt: Date.now(),
			retryCount: 0,
		};

		queue.push(task);
		saveSyncQueue(queue);

		if (isOnline()) {
			scheduleSync();
		} else {
			notifyListeners(
				"offline",
				"No internet connection. Your link is not ready to use.",
			);
		}
	});
};

export const isAliasSynced = (alias: string): boolean => {
	const syncedUrls = getSyncedUrls();
	return syncedUrls.has(alias);
};

export const isAliasPending = (alias: string): boolean => {
	const queue = getSyncQueue();
	return queue.some((t) => t.alias === alias && t.type === "create");
};

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

const scheduleSync = (): void => {
	if (syncTimeout) return;

	syncTimeout = setTimeout(() => {
		syncTimeout = null;
		processQueue();
	}, 100);
};

const processCreateTask = async (task: SyncTask): Promise<boolean> => {
	if (!task.originalUrl) return false;

	try {
		const data = await createUrl({
			alias: task.alias,
			original_url: task.originalUrl,
		});

		const syncedUrls = getSyncedUrls();
		syncedUrls.set(task.alias, {
			alias: data.alias,
			originalUrl: task.originalUrl,
			syncedAt: Date.now(),
			expiresAt: data.expires_at,
		});
		saveSyncedUrls(syncedUrls);

		return true;
	} catch (error) {
		console.error("Sync create error:", error);
		return false;
	}
};

export const processQueue = async (): Promise<void> => {
	if (isSyncing) return;

	if (!isOnline()) {
		notifyListeners(
			"offline",
			"No internet connection. Your link is not ready to use.",
		);
		return;
	}

	const queue = getSyncQueue();
	if (queue.length === 0) {
		notifyListeners("idle");
		return;
	}

	isSyncing = true;
	notifyListeners("syncing");

	const remainingTasks: SyncTask[] = [];
	let hasSuccess = false;
	let hasError = false;

	const results = await Promise.allSettled(
		queue.map(async (task) => {
			const success = await processCreateTask(task);
			return { task, success };
		}),
	);

	for (const result of results) {
		if (result.status === "fulfilled") {
			const { task, success } = result.value;
			if (success) {
				hasSuccess = true;
			} else {
				task.retryCount++;
				if (task.retryCount < 5) {
					remainingTasks.push(task);
				} else {
					hasError = true;
				}
			}
		} else {
			hasError = true;
		}
	}

	saveSyncQueue(remainingTasks);
	isSyncing = false;

	if (remainingTasks.length > 0) {
		const retryDelay = Math.min(
			1000 * 2 ** (remainingTasks[0]?.retryCount ?? 0),
			30000,
		);
		setTimeout(() => {
			if (isOnline()) processQueue();
		}, retryDelay);

		notifyListeners("error", "Some links are still syncing...");
	} else if (hasSuccess) {
		notifyListeners("success", "Link synced successfully!");
	} else if (hasError) {
		notifyListeners("error", "Failed to sync some links");
	} else {
		notifyListeners("idle");
	}
};

export const getPendingSyncCount = (): number => getSyncQueue().length;

export const getSyncStatus = (): SyncStatus => currentStatus;

export const initSyncService = (): (() => void) => {
	const handleOnline = (): void => {
		console.log("Online - processing sync queue");
		processQueue();
	};

	const handleOffline = (): void => {
		console.log("Offline");
		notifyListeners(
			"offline",
			"No internet connection. Your link is not ready to use.",
		);
	};

	window.addEventListener("online", handleOnline);
	window.addEventListener("offline", handleOffline);

	if (isOnline() && getSyncQueue().length > 0) {
		setTimeout(processQueue, 500);
	} else if (!isOnline()) {
		notifyListeners("offline");
	}

	return () => {
		window.removeEventListener("online", handleOnline);
		window.removeEventListener("offline", handleOffline);
	};
};
