import { useEffect, useState } from "react";
import {
	initSyncService,
	onSyncStatusChange,
	type SyncStatus,
} from "../lib/sync";

export function useSyncStatus() {
	const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
	const [isOfflineToastVisible, setIsOfflineToastVisible] = useState(false);

	useEffect(() => {
		const cleanup = initSyncService();

		const unsubscribe = onSyncStatusChange((status, message) => {
			setSyncStatus(status);

			if (status === "offline" && message) {
				setIsOfflineToastVisible(true);
			} else if (status === "success" || status === "idle") {
				setIsOfflineToastVisible(false);
			}
		});

		return () => {
			cleanup();
			unsubscribe();
		};
	}, []);

	const hideOfflineToast = () => setIsOfflineToastVisible(false);
	const showOfflineToast = () => setIsOfflineToastVisible(true);

	return {
		syncStatus,
		isOfflineToastVisible,
		hideOfflineToast,
		showOfflineToast,
	};
}
