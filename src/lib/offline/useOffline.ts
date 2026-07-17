"use client";

import { useCallback, useEffect, useState } from "react";
import { saveBusiness } from "@/lib/actions";
import {
  allPending,
  PENDING_EVENT,
  removePending,
  updatePending,
  type PendingBusiness,
} from "./queue";

/**
 * Tracks connectivity + the offline write queue, and flushes queued businesses
 * to the server when the connection returns (or on demand).
 */
export function useOffline() {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState<PendingBusiness[]>([]);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setPending(await allPending());
    } catch {
      /* IndexedDB unavailable — ignore */
    }
  }, []);

  const flush = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    setSyncing(true);
    try {
      const items = await allPending();
      for (const it of items) {
        try {
          const res = await saveBusiness(it.input);
          if (res?.error) {
            // Server rejected it (e.g. duplicate phone). Keep it, flag the reason.
            await updatePending({ ...it, error: res.error });
          } else {
            await removePending(it.id);
          }
        } catch {
          // Network/unexpected failure — stop and retry on the next flush.
          break;
        }
      }
    } finally {
      setSyncing(false);
      await refresh();
    }
  }, [refresh]);

  useEffect(() => {
    setOnline(navigator.onLine);
    refresh();
    if (navigator.onLine) flush();

    const goOnline = () => {
      setOnline(true);
      flush();
    };
    const goOffline = () => setOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    window.addEventListener(PENDING_EVENT, refresh);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener(PENDING_EVENT, refresh);
    };
  }, [flush, refresh]);

  return { online, pending, syncing, flush, refresh, discard: removePending };
}
