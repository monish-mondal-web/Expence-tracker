import {
  setCachedData,
  getCachedData,
  saveOfflineExpense,
  deleteOfflineExpense,
  saveMultipleOfflineExpenses,
  getAllOfflineExpenses,
  addToSyncQueue,
  getSyncQueue,
  removeSyncQueueItem,
  getPendingSyncCount,
  notifySyncListeners,
  registerIdMapping,
  resolveRealId,
} from './offlineStorage';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TIMEOUT_MS = 6500;

// Fetch with AbortController timeout
async function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

// Check if error is network/offline related
function isNetworkError(err) {
  return (
    !navigator.onLine ||
    err.name === 'AbortError' ||
    err.message?.includes('Failed to fetch') ||
    err.message?.includes('NetworkError') ||
    err.message?.includes('Network request failed') ||
    err.message?.includes('Load failed')
  );
}

// Core request handler with offline fallback & queueing
async function request(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const url = `${BASE_URL}${endpoint}`;
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('finfood_token') : null;
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...options.headers,
    },
    ...options,
  };

  // -----------------------------------------------------------
  // 1. GET Requests: Stale-While-Revalidate / Offline Cache
  // -----------------------------------------------------------
  if (method === 'GET') {
    const cacheKey = endpoint;

    // If completely offline, immediately return cached response
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const cached = await getCachedData(cacheKey);
      if (cached) {
        return { ...cached, _fromCache: true, _isOffline: true };
      }
    }

    try {
      const res = await fetchWithTimeout(url, config);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Request failed with status ${res.status}`);
      }

      // Cache successful response for offline use
      setCachedData(cacheKey, data);

      // If fetching expenses, save to offline expenses store as well
      if (endpoint.startsWith('/expenses') && data.data && Array.isArray(data.data)) {
        saveMultipleOfflineExpenses(data.data);
      }

      return data;
    } catch (err) {
      // If network failed or timed out, attempt cache recovery
      if (isNetworkError(err)) {
        const cached = await getCachedData(cacheKey);
        if (cached) {
          console.warn(`Network unavailable for ${endpoint}. Serving from offline cache.`);
          return { ...cached, _fromCache: true, _isOffline: true };
        }

        // Fallback: If expenses query has no exact cache match, assemble from local offline store
        if (endpoint.startsWith('/expenses')) {
          const localExpenses = await getAllOfflineExpenses();
          if (localExpenses && localExpenses.length > 0) {
            const total = localExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
            return {
              success: true,
              data: localExpenses,
              totalAmount: total,
              _fromCache: true,
              _isOffline: true,
            };
          }
        }
      }
      throw err;
    }
  }

  // -----------------------------------------------------------
  // 2. Mutations (POST / PUT / DELETE)
  // -----------------------------------------------------------
  const isCurrentlyOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  if (isCurrentlyOffline) {
    return handleOfflineMutation(endpoint, method, options);
  }

  try {
    const res = await fetchWithTimeout(url, config);
    const data = await res.json();

    if (!res.ok) {
      // 401 Unauthorized should throw directly (handled by AuthContext)
      if (res.status === 401) {
        throw new Error(data.error || 'Unauthorized');
      }
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (err) {
    // If it's a network issue (slow connection, disconnected mid-request), queue for offline sync!
    if (isNetworkError(err)) {
      console.warn(`Network failed during mutation (${method} ${endpoint}). Queuing offline mutation.`);
      return handleOfflineMutation(endpoint, method, options);
    }
    throw err;
  }
}

// Handle local persistence and queueing when offline
async function handleOfflineMutation(endpoint, method, options) {
  const body = options.body ? JSON.parse(options.body) : {};

  // A. EXPENSE CREATION
  if (endpoint === '/expenses' && method === 'POST') {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newExpense = {
      ...body,
      _id: tempId,
      createdAt: new Date().toISOString(),
    };

    // Save to local offline store
    await saveOfflineExpense(newExpense, 'pending');

    // Add to sync queue
    await addToSyncQueue({
      type: 'CREATE_EXPENSE',
      endpoint: '/expenses',
      method: 'POST',
      body,
      tempId,
    });

    return {
      success: true,
      data: newExpense,
      _isOffline: true,
      message: 'Saved locally. Will sync when back online.',
    };
  }

  // B. EXPENSE DELETION
  if (endpoint.startsWith('/expenses/') && method === 'DELETE') {
    const rawId = endpoint.replace('/expenses/', '');
    const realId = resolveRealId(rawId);

    await deleteOfflineExpense(rawId);
    if (realId !== rawId) {
      await deleteOfflineExpense(realId);
    }

    await addToSyncQueue({
      type: 'DELETE_EXPENSE',
      endpoint: `/expenses/${realId}`,
      method: 'DELETE',
      targetId: realId,
      rawId,
    });

    return {
      success: true,
      data: { _id: rawId },
      _isOffline: true,
      message: 'Deleted locally. Will sync when back online.',
    };
  }

  // C. EXPENSE UPDATE
  if (endpoint.startsWith('/expenses/') && method === 'PUT') {
    const rawId = endpoint.replace('/expenses/', '');
    const realId = resolveRealId(rawId);

    const updated = { ...body, _id: realId };
    await saveOfflineExpense(updated, 'pending');

    await addToSyncQueue({
      type: 'UPDATE_EXPENSE',
      endpoint: `/expenses/${realId}`,
      method: 'PUT',
      body,
      targetId: realId,
    });

    return {
      success: true,
      data: updated,
      _isOffline: true,
      message: 'Updated locally. Will sync when back online.',
    };
  }

  // D. BUDGET SETTING
  if (endpoint === '/monthly-budget' && method === 'POST') {
    await addToSyncQueue({
      type: 'SET_BUDGET',
      endpoint: '/monthly-budget',
      method: 'POST',
      body,
    });

    return {
      success: true,
      data: body,
      _isOffline: true,
      message: 'Budget saved locally. Will sync when back online.',
    };
  }

  // E. BUDGET RESET
  if (endpoint.startsWith('/monthly-budget/') && method === 'DELETE') {
    await addToSyncQueue({
      type: 'RESET_BUDGET',
      endpoint,
      method: 'DELETE',
    });

    return {
      success: true,
      _isOffline: true,
      message: 'Budget reset locally. Will sync when back online.',
    };
  }

  // Fallback for other mutations
  await addToSyncQueue({
    type: 'GENERIC_MUTATION',
    endpoint,
    method,
    body,
  });

  return {
    success: true,
    data: body,
    _isOffline: true,
    message: 'Action saved locally. Will sync when back online.',
  };
}

// -------------------------------------------------------------
// BACKGROUND SYNC MANAGER
// -------------------------------------------------------------
let isSyncInProgress = false;
const syncCompletedCallbacks = new Set();

export function onSyncCompleted(cb) {
  syncCompletedCallbacks.add(cb);
  return () => syncCompletedCallbacks.delete(cb);
}

export async function syncPendingData() {
  if (isSyncInProgress) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;

  const queue = await getSyncQueue();
  if (!queue || queue.length === 0) {
    notifySyncListeners({ isSyncing: false, pendingCount: 0 });
    return;
  }

  isSyncInProgress = true;
  notifySyncListeners({ isSyncing: true, pendingCount: queue.length });

  let syncedCount = 0;

  for (const item of queue) {
    try {
      let resolvedEndpoint = item.endpoint;

      // Resolve IDs if temp IDs were used
      if (item.targetId) {
        const real = resolveRealId(item.targetId);
        resolvedEndpoint = resolvedEndpoint.replace(item.targetId, real);
      }

      const token = localStorage.getItem('finfood_token');
      const res = await fetchWithTimeout(`${BASE_URL}${resolvedEndpoint}`, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: item.body ? JSON.stringify(item.body) : undefined,
      });

      if (res.ok) {
        const result = await res.json();

        // If expense creation succeeded, map temp ID to real MongoDB _id
        if (item.type === 'CREATE_EXPENSE' && item.tempId && result.data && result.data._id) {
          registerIdMapping(item.tempId, result.data._id);
          await deleteOfflineExpense(item.tempId);
          await saveOfflineExpense(result.data, 'synced');
        }

        await removeSyncQueueItem(item.id);
        syncedCount++;
      } else if (res.status === 404 && item.type === 'DELETE_EXPENSE') {
        // Item already deleted on server, safely dequeue
        await removeSyncQueueItem(item.id);
        syncedCount++;
      }
    } catch (err) {
      console.warn(`Sync item #${item.id} failed, will retry on next connection:`, err);
      break; // Stop loop and keep remaining queue for next retry
    }
  }

  isSyncInProgress = false;
  const remainingCount = await getPendingSyncCount();
  notifySyncListeners({
    isSyncing: false,
    pendingCount: remainingCount,
    lastSynced: Date.now(),
  });

  if (syncedCount > 0) {
    syncCompletedCallbacks.forEach((cb) => {
      try {
        cb(syncedCount);
      } catch (e) {}
    });
  }
}

// Auto-trigger sync on online event and periodic check
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Network connection restored. Starting background sync...');
    setTimeout(() => {
      syncPendingData();
    }, 1200);
  });

  // Periodic interval check
  setInterval(() => {
    if (navigator.onLine && !isSyncInProgress) {
      getPendingSyncCount().then((count) => {
        if (count > 0) {
          syncPendingData();
        }
      });
    }
  }, 18000);
}

// -------------------------------------------------------------
// EXPORTED API
// -------------------------------------------------------------
export const api = {
  syncPendingData,
  onSyncCompleted,

  // Authentication
  register: (data) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  login: (data) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  forgotPassword: (data) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  resetPassword: (data) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMe: () => request('/auth/me'),
  updateProfile: (data) =>
    request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  uploadAvatar: (data) =>
    request('/auth/upload-avatar', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Dashboard
  getDashboard: (month, year, today, space) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    if (today) params.append('today', today);
    if (space) params.append('space', space);
    return request(`/dashboard?${params.toString()}`);
  },

  // Budget
  getBudget: (month, year) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    return request(`/monthly-budget?${params.toString()}`);
  },
  setBudget: (data) =>
    request('/monthly-budget', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateBudget: (id, data) =>
    request(`/monthly-budget/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  resetBudget: (id) =>
    request(`/monthly-budget/${id}`, {
      method: 'DELETE',
    }),

  // Expenses
  getExpenses: (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    return request(`/expenses?${params.toString()}`);
  },
  createExpense: (data) =>
    request('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateExpense: (id, data) =>
    request(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteExpense: (id) =>
    request(`/expenses/${id}`, {
      method: 'DELETE',
    }),

  // Analytics
  getAnalytics: (month, year, today) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    if (today) params.append('today', today);
    return request(`/analytics?${params.toString()}`);
  },

  // Calendar
  getCalendar: (month, year) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    return request(`/calendar?${params.toString()}`);
  },

  // Categories
  getCategories: () => request('/categories'),
  createCategory: (data) =>
    request('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCategory: (id, data) =>
    request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCategory: (id) =>
    request(`/categories/${id}`, {
      method: 'DELETE',
    }),
};
