/**
 * Smart Shop — Offline Mode (IndexedDB via `idb`)
 * Permet de continuer à scanner/ajouter des produits hors-ligne,
 * puis synchronise automatiquement quand la connexion revient.
 */

import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'maison-consciente-smart-shop';
const DB_VERSION = 1;
const STORE_SESSIONS = 'pending_sessions';
const STORE_ITEMS = 'pending_items';

interface PendingSession {
  id: string;
  data: {
    name?: string;
    budgetCents?: number;
    storeName?: string;
  };
  createdAt: number;
  synced: boolean;
}

interface PendingItem {
  id: string;
  sessionId: string;
  data: {
    barcode?: string;
    productName: string;
    brand?: string;
    priceCents: number;
    quantity?: number;
    category?: string;
    imageUrl?: string;
  };
  createdAt: number;
  synced: boolean;
}

class SmartShopOffline {
  private db: IDBPDatabase | null = null;

  /** Initialize the IndexedDB database */
  async init(): Promise<void> {
    if (this.db) return;
    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Pending sessions store
          if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
            const sessionStore = db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
            sessionStore.createIndex('synced', 'synced');
            sessionStore.createIndex('createdAt', 'createdAt');
          }
          // Pending items store
          if (!db.objectStoreNames.contains(STORE_ITEMS)) {
            const itemStore = db.createObjectStore(STORE_ITEMS, { keyPath: 'id' });
            itemStore.createIndex('synced', 'synced');
            itemStore.createIndex('sessionId', 'sessionId');
            itemStore.createIndex('createdAt', 'createdAt');
          }
        },
      });
    } catch (error) {
      console.error('[Smart Shop Offline] DB init failed:', error);
      throw error;
    }
  }

  /** Check if offline mode is supported */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }

  /** Queue a session creation for later sync */
  async queueSession(data: PendingSession['data']): Promise<string> {
    await this.init();
    if (!this.db) throw new Error('IndexedDB non disponible');

    const id = crypto.randomUUID();
    const entry: PendingSession = {
      id,
      data,
      createdAt: Date.now(),
      synced: false,
    };

    await this.db.put(STORE_SESSIONS, entry);
    return id;
  }

  /** Queue an item addition for later sync */
  async queueItem(sessionId: string, data: PendingItem['data']): Promise<string> {
    await this.init();
    if (!this.db) throw new Error('IndexedDB non disponible');

    const id = crypto.randomUUID();
    const entry: PendingItem = {
      id,
      sessionId,
      data,
      createdAt: Date.now(),
      synced: false,
    };

    await this.db.put(STORE_ITEMS, entry);
    return id;
  }

  /** Get all unsynced pending sessions */
  async getPendingSessions(): Promise<PendingSession[]> {
    await this.init();
    if (!this.db) return [];

    return this.db.getAllFromIndex(STORE_SESSIONS, 'synced', 0) as Promise<PendingSession[]>;
  }

  /** Get all unsynced pending items */
  async getPendingItems(): Promise<PendingItem[]> {
    await this.init();
    if (!this.db) return [];

    return this.db.getAllFromIndex(STORE_ITEMS, 'synced', 0) as Promise<PendingItem[]>;
  }

  /** Get pending items count for a session */
  async getPendingItemCount(sessionId: string): Promise<number> {
    await this.init();
    if (!this.db) return 0;

    const items = await this.db.getAllFromIndex(STORE_ITEMS, 'sessionId', sessionId) as PendingItem[];
    return items.filter(i => !i.synced).length;
  }

  /** Mark a session as synced */
  async markSessionSynced(id: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    const entry = await this.db.get(STORE_SESSIONS, id);
    if (entry) {
      entry.synced = true;
      await this.db.put(STORE_SESSIONS, entry);
    }
  }

  /** Mark an item as synced */
  async markItemSynced(id: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    const entry = await this.db.get(STORE_ITEMS, id);
    if (entry) {
      entry.synced = true;
      await this.db.put(STORE_ITEMS, entry);
    }
  }

  /**
   * Sync all pending operations to the server.
   * Call this when network connectivity is restored.
   */
  async syncAll(): Promise<{ sessionsSynced: number; itemsSynced: number; errors: number }> {
    await this.init();
    if (!this.db) return { sessionsSynced: 0, itemsSynced: 0, errors: 0 };

    let sessionsSynced = 0;
    let itemsSynced = 0;
    let errors = 0;

    // Sync pending sessions
    const pendingSessions = await this.getPendingSessions();
    for (const session of pendingSessions) {
      try {
        const res = await fetch('/api/smart-shop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create-session', ...session.data }),
        });
        if (res.ok) {
          await this.markSessionSynced(session.id);
          sessionsSynced++;
        } else {
          errors++;
        }
      } catch {
        errors++;
      }
    }

    // Sync pending items
    const pendingItems = await this.getPendingItems();
    for (const item of pendingItems) {
      try {
        const res = await fetch('/api/smart-shop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add-scanned-item', sessionId: item.sessionId, ...item.data }),
        });
        if (res.ok) {
          await this.markItemSynced(item.id);
          itemsSynced++;
        } else {
          errors++;
        }
      } catch {
        errors++;
      }
    }

    // Clean up synced entries older than 1 hour
    await this.cleanupSynced();

    return { sessionsSynced, itemsSynced, errors };
  }

  /** Remove synced entries older than 1 hour */
  private async cleanupSynced(): Promise<void> {
    if (!this.db) return;

    const oneHourAgo = Date.now() - 3600000;

    const tx = this.db.transaction([STORE_SESSIONS, STORE_ITEMS], 'readwrite');

    // Clean sessions
    const sessions = await tx.objectStore(STORE_SESSIONS).getAll() as PendingSession[];
    for (const s of sessions) {
      if (s.synced && s.createdAt < oneHourAgo) {
        await tx.objectStore(STORE_SESSIONS).delete(s.id);
      }
    }

    // Clean items
    const items = await tx.objectStore(STORE_ITEMS).getAll() as PendingItem[];
    for (const i of items) {
      if (i.synced && i.createdAt < oneHourAgo) {
        await tx.objectStore(STORE_ITEMS).delete(i.id);
      }
    }

    await tx.done;
  }

  /** Clear all pending data (for debugging/testing) */
  async clearAll(): Promise<void> {
    await this.init();
    if (!this.db) return;

    const tx = this.db.transaction([STORE_SESSIONS, STORE_ITEMS], 'readwrite');
    await tx.objectStore(STORE_SESSIONS).clear();
    await tx.objectStore(STORE_ITEMS).clear();
    await tx.done;
  }
}

/** Singleton instance */
export const smartShopOffline = new SmartShopOffline();

/**
 * React hook-like helper: start online/offline sync listener.
 * Returns a cleanup function to stop listening.
 */
export function startOfflineSyncListener(onSync?: (result: { sessionsSynced: number; itemsSynced: number; errors: number }) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  let wasOffline = !navigator.onLine;

  const handleOnline = async () => {
    if (wasOffline) {
      wasOffline = false;
      try {
        const result = await smartShopOffline.syncAll();
        if (onSync && (result.sessionsSynced > 0 || result.itemsSynced > 0)) {
          onSync(result);
        }
      } catch (error) {
        console.error('[Smart Shop Offline] Sync failed:', error);
      }
    }
  };

  const handleOffline = () => {
    wasOffline = true;
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
