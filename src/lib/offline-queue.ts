/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Offline Queue (IndexedDB)
   Gère la file d'attente des actions quand le réseau est coupé.
   Les actions sont stockées localement puis synchronisées
   dès que la connexion est rétablie.
   ═══════════════════════════════════════════════════════ */

import { openDB, IDBPDatabase } from "idb";

const DB_NAME = "mc-tablette-queue";
const DB_VERSION = 1;
const STORE_NAME = "pending-actions";

export interface QueuedAction {
  id?: number;
  type: string;
  payload: Record<string, unknown>;
  createdAt: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

/**
 * Ouvre (ou crée) la base IndexedDB pour la file d'attente hors-ligne.
 */
export async function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, {
            keyPath: "id",
            autoIncrement: true,
          });
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Ajoute une action en file d'attente pour synchronisation ultérieure.
 */
export async function queueAction(action: {
  type: string;
  payload: Record<string, unknown>;
}): Promise<number> {
  const db = await getDB();
  const id = await db.add(STORE_NAME, {
    type: action.type,
    payload: action.payload,
    createdAt: Date.now(),
  });
  console.log(`📋 Action mise en file: ${action.type} (id: ${id})`);
  return id as number;
}

/**
 * Récupère toutes les actions en attente (sans les supprimer).
 */
export async function getPendingActions(): Promise<QueuedAction[]> {
  const db = await getDB();
  const actions = await db.getAll(STORE_NAME);
  return actions as QueuedAction[];
}

/**
 * Compte le nombre d'actions en attente.
 */
export async function getQueueCount(): Promise<number> {
  const db = await getDB();
  return db.count(STORE_NAME);
}

/**
 * Supprime une action spécifique de la file.
 */
export async function removeAction(id: number): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

/**
 * Vide complètement la file d'attente.
 */
export async function clearQueue(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
  console.log("✅ Queue vidée");
}

/**
 * Traite et synchronise toutes les actions en attente.
 * Si la synchronisation réussit, la file est vidée.
 * En cas d'échec, les actions restent en file pour un nouvel essai.
 */
export async function flushQueue(
  syncFn: (actions: QueuedAction[]) => Promise<void>
): Promise<{ synced: boolean; count: number }> {
  const db = await getDB();
  const actions = (await db.getAll(STORE_NAME)) as QueuedAction[];

  if (actions.length === 0) {
    return { synced: false, count: 0 };
  }

  try {
    await syncFn(actions);
    await db.clear(STORE_NAME);
    console.log(`✅ Queue synchronisée — ${actions.length} action(s) traitée(s)`);
    return { synced: true, count: actions.length };
  } catch (err) {
    console.error("❌ Échec de la synchronisation:", err);
    return { synced: false, count: actions.length };
  }
}
