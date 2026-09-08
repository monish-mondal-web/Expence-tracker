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

  dbPromise = new Promise((resolve, reject) => {
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
      return new Promise((resolve) => {
        const tx = db.transaction('cache', 'readwrite');
        const store = tx.objectStore('cache');
        store.put({ key, data, timestamp: Date.now() });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => {
          setLS(`cache_${key}`, data);
          resolve(false);
        };
      });
    }
  } catch (e) {
    // fallback
  }
  setLS(`cache_${key}`, data);
  return true;
}

export async function getCachedData(key) {
  try {
    const db = await openDB();
    if (db) {
      return new Promise((resolve) => {
        const tx = db.transaction('cache', 'readonly');
        const store = tx.objectStore('cache');
        const req = store.get(key);
        req.onsuccess = () => {
          if (req.result && req.result.data) {
            resolve(req.result.data);
          } else {
            resolve(getLS(`cache_${key}`));
          }
        };
        req.onerror = () => resolve(getLS(`cache_${key}`));
      });
    }
  } catch (e) {
    // fallback
  }
  return getLS(`cache_${key}`);
}

// -------------------------------------------------------------
// EXPENSES STORE (Offline-first Expenses Database)
// -------------------------------------------------------------
export async function saveOfflineExpense(expense, syncStatus = 'synced') {
  const record = {
    ...expense,
    sync_status: syncStatus,
    updatedAt: new Date().toISOString(),
  };

  try {
    const db = await openDB();
    if (db) {
      return new Promise((resolve) => {
        const tx = db.transaction('expenses', 'readwrite');
        const store = tx.objectStore('expenses');
        store.put(record);
        tx.oncomplete = () => resolve(record);
        tx.onerror = () => {
          const list = getLS('expenses') || [];
          const idx = list.findIndex((e) => e._id === record._id);
          if (idx >= 0) list[idx] = record;
          else list.unshift(record);
          setLS('expenses', list);
          resolve(record);
        };
      });
    }
  } catch (e) {}

  const list = getLS('expenses') || [];
  const idx = list.findIndex((e) => e._id === record._id);
  if (idx >= 0) list[idx] = record;
  else list.unshift(record);
  setLS('expenses', list);
  return record;
}

export async function saveMultipleOfflineExpenses(expensesList) {
  if (!Array.isArray(expensesList)) return;
  for (const exp of expensesList) {
    await saveOfflineExpense(exp, 'synced');
  }
}

export async function deleteOfflineExpense(id) {
  try {
    const db = await openDB();
    if (db) {
      return new Promise((resolve) => {
        const tx = db.transaction('expenses', 'readwrite');
        const store = tx.objectStore('expenses');
        store.delete(id);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => {
          const list = getLS('expenses') || [];
          setLS('expenses', list.filter((e) => e._id !== id));
          resolve(true);
        };
      });
    }
  } catch (e) {}

  const list = getLS('expenses') || [];
  setLS('expenses', list.filter((e) => e._id !== id));
  return true;
}

export async function getAllOfflineExpenses() {
  try {
    const db = await openDB();
    if (db) {
      return new Promise((resolve) => {
        const tx = db.transaction('expenses', 'readonly');
        const store = tx.objectStore('expenses');
        const req = store.getAll();
        req.onsuccess = () => {
          if (req.result && req.result.length > 0) {
            resolve(req.result);
          } else {
            resolve(getLS('expenses') || []);
          }
        };
        req.onerror = () => resolve(getLS('expenses') || []);
      });
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
      return new Promise((resolve) => {
        const tx = db.transaction('sync_queue', 'readonly');
        const store = tx.objectStore('sync_queue');
        const req = store.getAll();
        req.onsuccess = () => {
          resolve(req.result || getLS('sync_queue') || []);
        };
        req.onerror = () => resolve(getLS('sync_queue') || []);
      });
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
        tx.onerror = () => {
          const q = getLS('sync_queue') || [];
          setLS('sync_queue', q.filter((i) => i.id !== id));
          resolve();
        };
      });
    } else {
      const q = getLS('sync_queue') || [];
      setLS('sync_queue', q.filter((i) => i.id !== id));
    }
  } catch (e) {
    const q = getLS('sync_queue') || [];
    setLS('sync_queue', q.filter((i) => i.id !== id));
  }

  const count = await getPendingSyncCount();
  notifySyncListeners({ isSyncing: false, pendingCount: count });
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
