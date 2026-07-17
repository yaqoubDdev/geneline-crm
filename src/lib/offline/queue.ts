import type { BizType, Stage } from "@/lib/types";

/**
 * Offline write queue (IndexedDB). New businesses logged with no connection are
 * stored here and replayed to the server once the agent is back online. Only NEW
 * businesses are queued — editing/onboarding require a connection.
 */

// Mirrors the new-business fields of saveBusiness's input (no dbId).
export type NewBusinessInput = {
  name: string;
  address: string;
  contactName: string;
  contact: string;
  type: BizType;
  stage: Stage;
  objection: string;
  lostReason: string;
  nextAction: string;
  followUpDate: string;
};

export type PendingBusiness = {
  id: string;
  input: NewBusinessInput;
  createdAt: number;
  error?: string; // set if the server rejected it on sync (e.g. duplicate phone)
};

const DB_NAME = "gx-crm-offline";
const STORE = "pending-businesses";
export const PENDING_EVENT = "gx-pending-changed";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function store(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  const db = await openDb();
  return db.transaction(STORE, mode).objectStore(STORE);
}

function announce() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PENDING_EVENT));
}

export async function queueNewBusiness(input: NewBusinessInput): Promise<void> {
  const item: PendingBusiness = { id: crypto.randomUUID(), input, createdAt: Date.now() };
  const s = await store("readwrite");
  await promisify(s.add(item));
  announce();
}

export async function allPending(): Promise<PendingBusiness[]> {
  const s = await store("readonly");
  const items = await promisify(s.getAll() as IDBRequest<PendingBusiness[]>);
  return items.sort((a, b) => a.createdAt - b.createdAt);
}

export async function updatePending(item: PendingBusiness): Promise<void> {
  const s = await store("readwrite");
  await promisify(s.put(item));
  announce();
}

export async function removePending(id: string): Promise<void> {
  const s = await store("readwrite");
  await promisify(s.delete(id));
  announce();
}
