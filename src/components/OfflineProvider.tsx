"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CloudUpload, RefreshCw, WifiOff } from "lucide-react";
import { C } from "@/lib/theme";
import { useOffline } from "@/lib/offline/useOffline";

/**
 * Registers the service worker and renders a global connection / sync bar.
 * Mounted once in the root layout.
 */
export default function OfflineProvider() {
  const router = useRouter();
  const { online, pending, syncing, flush } = useOffline();
  const prev = useRef(0);

  // Register the SW in production only (dev HMR + SW caching don't mix well).
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);

  // When the queue finishes draining, pull the freshly-synced data into the page.
  useEffect(() => {
    if (prev.current > 0 && pending.length === 0) router.refresh();
    prev.current = pending.length;
  }, [pending.length, router]);

  if (online && pending.length === 0) return null;

  const errored = pending.filter((p) => p.error).length;
  const bg = !online ? C.clay : syncing ? C.green : C.amber;

  return (
    <div
      style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 200,
        background: bg, color: "#fff", padding: "9px 16px",
        display: "flex", alignItems: "center", gap: 10, justifyContent: "center",
        fontSize: 13.5, fontWeight: 600, boxShadow: "0 -4px 14px rgba(0,0,0,.12)",
      }}
    >
      {!online ? (
        <>
          <WifiOff size={16} />
          <span>
            You&apos;re offline.{" "}
            {pending.length > 0
              ? `${pending.length} saved on this device — will sync when you're back.`
              : "New businesses save on this device and sync later."}
          </span>
        </>
      ) : syncing ? (
        <>
          <RefreshCw size={16} className="gx-spin" />
          <span>Syncing {pending.length}…</span>
        </>
      ) : (
        <>
          <CloudUpload size={16} />
          <span>
            {pending.length} waiting to sync
            {errored > 0 ? ` · ${errored} need attention` : ""}
          </span>
          <button
            onClick={() => flush()}
            style={{
              marginLeft: 6, padding: "5px 12px", borderRadius: 8, border: "1.5px solid #fff",
              background: "transparent", color: "#fff", fontSize: 12.5, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Sync now
          </button>
        </>
      )}
    </div>
  );
}
