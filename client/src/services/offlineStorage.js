/**
 * offlineStorage.js
 * Comprehensive IndexedDB & LocalStorage offline persistence layer for Pocket Khorcha.
 * Manages local caching, offline expenses, and background sync queue.
 */

const DB_NAME = 'pocket_khorcha_db';
const DB_VERSION = 1;

let dbPromise = null;

// Initialize IndexedDB
function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. General API response cache (Dashboard, budgets, analytics, categories, etc.)
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'key' });
      }

      // 2. Offline Expenses collection
      if (!db.objectStoreNames.contains('expenses')) {
        const expenseStore = db.createObjectStore('expenses', { keyPath: '_id' });
        expenseStore.createIndex('date', 'date', { unique: false });
        expenseStore.createIndex('category', 'category', { unique: false });
        expenseStore.createIndex('sync_status', 'sync_status', { unique: false });
      }

      // 3. Offline Sync Queue (Mutations to replay when back online)
      if (!db.objectStoreNames.contains('sync_queue')) {
        const queueStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.warn('IndexedDB failed to open, falling back to LocalStorage:', event.target.error);
      resolve(null);
    };
  });

  return dbPromise;
}

// LocalStorage Fallback Helpers
const LS_PREFIX = 'pk_offline_';
function getLS(key) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setLS(key, val) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(val));
  } catch (e) {}
}

// -------------------------------------------------------------
// CACHE STORE (GET requests: Dashboard, Budget, Categories, etc.)
// -------------------------------------------------------------
export async function setCachedData(key, data) {
  try {
    const db = await openDB();
    if (db) {
      await new Promise((resolve) => {
        const tx = db.transaction('cache', 'readwrite');
        const store = tx.objectStore('cache');
        store.put({ key, data, timestamp: Date.now() });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    }
  } catch (e) {}
  setLS(`cache_${key}`, data);
  return true;
}

export async function getCachedData(key) {
  try {
    const db = await openDB();
    if (db) {
      const result = await new Promise((resolve) => {
        const tx = db.transaction('cache', 'readonly');
        const store = tx.objectStore('cache');
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ? req.result.data : null);
        req.onerror = () => resolve(null);
      });
      if (result !== null && result !== undefined) {
        return result;
      }
    }
  } catch (e) {}
  return getLS(`cache_${key}`);
}

// -------------------------------------------------------------
// EXPENSES STORE (Offline-first Expenses Database)
// -------------------------------------------------------------
export async function saveOfflineExpense(expense, syncStatus = 'synced') {
  if (!expense || !expense._id) return null;

  const record = {
    ...expense,
    sync_status: syncStatus,
    updatedAt: new Date().toISOString(),
  };

  try {
    const db = await openDB();
    if (db) {
      await new Promise((resolve) => {
        const tx = db.transaction('expenses', 'readwrite');
        const store = tx.objectStore('expenses');
        store.put(record);
        tx.oncomplete = () => resolve(record);
        tx.onerror = () => resolve(null);
      });
    }
  } catch (e) {}

  // ALWAYS keep LocalStorage fallback in sync
  try {
    const list = getLS('expenses') || [];
    const idx = list.findIndex((e) => e._id === record._id);
    if (idx >= 0) list[idx] = record;
    else list.unshift(record);
    setLS('expenses', list);
  } catch (e) {}

  return record;
}

export async function saveMultipleOfflineExpenses(expensesList) {
  if (!Array.isArray(expensesList)) return;
  for (const exp of expensesList) {
    await saveOfflineExpense(exp, 'synced');
  }
}

/**
 * Reconciles the local offline cache with authoritative server records.
 * Saves current server records, AND deletes any local 'synced' expenses that
 * were deleted on the server so old deleted data never haunts the user!
 */
export async function syncExpensesWithServer(serverExpenses, month = null, year = null) {
  if (!Array.isArray(serverExpenses)) return;

  const serverIdSet = new Set(serverExpenses.map((e) => String(e._id)));

  // 1. Upsert all valid expenses from the server
  for (const exp of serverExpenses) {
    await saveOfflineExpense(exp, 'synced');
  }

  // 2. Find and purge any local expenses that no longer exist on the server
  try {
    const localExpenses = await getAllOfflineExpenses();
    for (const localExp of localExpenses) {
      // Don't delete pending offline mutations waiting to be uploaded
      if (localExp.sync_status === 'pending' || String(localExp._id).startsWith('temp_')) {
        continue;
      }

      // Check date bounds if month & year are provided
      if (month && year && localExp.date) {
        const d = new Date(localExp.date);
        const expMonth = d.getMonth() + 1;
        const expYear = d.getFullYear();
        if (expMonth !== month || expYear !== year) {
          continue; // Belongs to another month, don't prune now
        }
      }

      // If this expense is marked 'synced' but is missing from server's list, it was deleted!
      if (!serverIdSet.has(String(localExp._id))) {
        await deleteOfflineExpense(localExp._id);
      }
    }
  } catch (err) {
    console.warn('[OfflineStorage] Error cleaning stale expenses:', err);
  }
}

export async function deleteOfflineExpense(id) {
  if (!id) return true;
  const idStr = String(id);

  try {
    const db = await openDB();
    if (db) {
      await new Promise((resolve) => {
        const tx = db.transaction('expenses', 'readwrite');
        const store = tx.objectStore('expenses');
        store.delete(idStr);
        // Also delete numeric/raw if applicable
        if (id !== idStr) {
          store.delete(id);
        }
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    }
  } catch (e) {}

  // ALWAYS also delete from LocalStorage fallback
  try {
    const list = getLS('expenses') || [];
    setLS('expenses', list.filter((e) => String(e._id) !== idStr));
  } catch (e) {}

  return true;
}

export async function getAllOfflineExpenses() {
  try {
    const db = await openDB();
    if (db) {
      const result = await new Promise((resolve) => {
        const tx = db.transaction('expenses', 'readonly');
        const store = tx.objectStore('expenses');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });

      // If IndexedDB returned an array (even if empty []), use it as the source of truth!
      if (Array.isArray(result)) {
        return result;
      }
    }
  } catch (e) {}

  return getLS('expenses') || [];
}

// -------------------------------------------------------------
// SYNC QUEUE STORE (Mutations queued while offline)
// -------------------------------------------------------------
const syncListeners = new Set();

export function notifySyncListeners(status) {
  syncListeners.forEach((listener) => {
    try {
      listener(status);
    } catch (e) {}
  });
}

export function onSyncChange(callback) {
  syncListeners.add(callback);
  return () => syncListeners.delete(callback);
}

export async function addToSyncQueue(mutation) {
  const item = {
    ...mutation,
    timestamp: Date.now(),
  };

  try {
    const db = await openDB();
    if (db) {
      await new Promise((resolve) => {
        const tx = db.transaction('sync_queue', 'readwrite');
        const store = tx.objectStore('sync_queue');
        store.add(item);
        tx.oncomplete = () => resolve();
        tx.onerror = () => {
          const q = getLS('sync_queue') || [];
          q.push(item);
          setLS('sync_queue', q);
          resolve();
        };
      });
    } else {
      const q = getLS('sync_queue') || [];
      q.push(item);
      setLS('sync_queue', q);
    }
  } catch (e) {
    const q = getLS('sync_queue') || [];
    q.push(item);
    setLS('sync_queue', q);
  }

  const count = await getPendingSyncCount();
  notifySyncListeners({ isSyncing: false, pendingCount: count });
  return item;
}

export async function getSyncQueue() {
  try {
    const db = await openDB();
    if (db) {
      const result = await new Promise((resolve) => {
        const tx = db.transaction('sync_queue', 'readonly');
        const store = tx.objectStore('sync_queue');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });
      if (Array.isArray(result)) {
        return result;
      }
    }
  } catch (e) {}

  return getLS('sync_queue') || [];
}

export async function removeSyncQueueItem(id) {
  try {
    const db = await openDB();
    if (db) {
      await new Promise((resolve) => {
        const tx = db.transaction('sync_queue', 'readwrite');
        const store = tx.objectStore('sync_queue');
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    }
  } catch (e) {}

  const q = getLS('sync_queue') || [];
  setLS('sync_queue', q.filter((i) => i.id !== id));

  const count = await getPendingSyncCount();
  notifySyncListeners({ isSyncing: false, pendingCount: count });
}

/**
 * Cancels and deletes all queued mutations associated with a local tempId.
 * Used when an offline-created expense is deleted before syncing online.
 */
export async function removeMutationsForTempId(tempId) {
  if (!tempId) return;
  const queue = await getSyncQueue();
  for (const item of queue) {
    if (item.tempId === tempId || item.targetId === tempId || item.rawId === tempId) {
      if (item.id !== undefined) {
        await removeSyncQueueItem(item.id);
      }
    }
  }
}

/**
 * Updates the queued body for an offline mutation (e.g. edit before upload).
 */
export async function updateMutationBody(targetId, newBody) {
  if (!targetId || !newBody) return;
  const queue = await getSyncQueue();
  for (const item of queue) {
    if (item.tempId === targetId || item.targetId === targetId) {
      item.body = { ...item.body, ...newBody };
      try {
        const db = await openDB();
        if (db && item.id !== undefined) {
          const tx = db.transaction('sync_queue', 'readwrite');
          tx.objectStore('sync_queue').put(item);
        }
      } catch (e) {}
    }
  }
  const q = getLS('sync_queue') || [];
  const updated = q.map((item) =>
    item.tempId === targetId || item.targetId === targetId
      ? { ...item, body: { ...item.body, ...newBody } }
      : item
  );
  setLS('sync_queue', updated);
}

export async function getPendingSyncCount() {
  const queue = await getSyncQueue();
  return queue ? queue.length : 0;
}

// -------------------------------------------------------------
// ID MAPPING (Temp ID -> Real MongoDB _id)
// -------------------------------------------------------------
const idMap = new Map();

export function registerIdMapping(tempId, realId) {
  if (tempId && realId) {
    idMap.set(tempId, realId);
    try {
      const stored = getLS('id_map') || {};
      stored[tempId] = realId;
      setLS('id_map', stored);
    } catch (e) {}
  }
}

export function resolveRealId(id) {
  if (!id) return id;
  if (idMap.has(id)) return idMap.get(id);
  const stored = getLS('id_map') || {};
  return stored[id] || id;
}

// -------------------------------------------------------------
// PURGE / LOGOUT HELPER
// -------------------------------------------------------------
export async function clearAllOfflineData() {
  try {
    const db = await openDB();
    if (db) {
      await new Promise((resolve) => {
        const tx = db.transaction(['expenses', 'cache', 'sync_queue'], 'readwrite');
        tx.objectStore('expenses').clear();
        tx.objectStore('cache').clear();
        tx.objectStore('sync_queue').clear();
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    }
  } catch (e) {}

  try {
    if (typeof window !== 'undefined') {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('pk_') || k.startsWith('finfood_cached_'))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    }
  } catch (e) {}

  notifySyncListeners({ isSyncing: false, pendingCount: 0 });
}
