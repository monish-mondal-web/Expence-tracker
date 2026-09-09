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

// -------------------------------------------------------------
// OFFLINE SYNTHESIS ENGINES (Calculates accurate data from IndexedDB)
// -------------------------------------------------------------

// 1. Synthesize Expenses list with Search, Category filter, and Sorting
async function assembleOfflineExpenses(urlPath) {
  try {
    const url = new URL(urlPath, 'http://localhost');
    const month = Number(url.searchParams.get('month'));
    const year = Number(url.searchParams.get('year'));
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    const sort = url.searchParams.get('sort') || 'newest';

    let expenses = await getAllOfflineExpenses();

    if (month && year) {
      expenses = expenses.filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      });
    }

    if (category && category !== 'All') {
      const catLower = category.toLowerCase().trim();
      expenses = expenses.filter((e) => {
        const eCat = (e.category || '').toLowerCase().trim();
        return eCat === catLower || eCat.includes(catLower);
      });
    }

    if (search && search.trim()) {
      const term = search.toLowerCase().trim();
      expenses = expenses.filter((e) => {
        return (
          (e.note || '').toLowerCase().includes(term) ||
          (e.category || '').toLowerCase().includes(term)
        );
      });
    }

    if (sort === 'oldest') {
      expenses.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sort === 'amount_desc') {
      expenses.sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));
    } else if (sort === 'amount_asc') {
      expenses.sort((a, b) => (Number(a.amount) || 0) - (Number(b.amount) || 0));
    } else {
      expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    const totalAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    return {
      success: true,
      data: expenses,
      totalAmount,
      _fromCache: true,
      _isOffline: true,
    };
  } catch (e) {
    const local = await getAllOfflineExpenses();
    return { success: true, data: local, totalAmount: 0, _isOffline: true };
  }
}

// 2. Synthesize Calendar Matrix and daily spending
async function assembleOfflineCalendar(urlPath) {
  try {
    const url = new URL(urlPath, 'http://localhost');
    const now = new Date();
    const month = Number(url.searchParams.get('month')) || now.getMonth() + 1;
    const year = Number(url.searchParams.get('year')) || now.getFullYear();

    const allExpenses = await getAllOfflineExpenses();
    const monthExpenses = allExpenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });

    const daysMap = {};
    monthExpenses.forEach((e) => {
      const d = new Date(e.date);
      const dateKey = d.toISOString().slice(0, 10);
      if (!daysMap[dateKey]) {
        daysMap[dateKey] = {
          date: dateKey,
          day: d.getDate(),
          totalSpent: 0,
          expenses: [],
        };
      }
      daysMap[dateKey].totalSpent += Number(e.amount) || 0;
      daysMap[dateKey].expenses.push({
        _id: e._id,
        amount: e.amount,
        category: e.category,
        note: e.note,
        date: e.date,
      });
    });

    Object.values(daysMap).forEach((item) => {
      item.totalSpent = Math.round(item.totalSpent * 100) / 100;
    });

    const totalSpent = monthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    return {
      success: true,
      month,
      year,
      totalSpent: Math.round(totalSpent * 100) / 100,
      daysWithExpenses: Object.keys(daysMap).length,
      calendarDays: daysMap,
      _fromCache: true,
      _isOffline: true,
    };
  } catch (e) {
    return { success: true, totalSpent: 0, daysWithExpenses: 0, calendarDays: {}, _isOffline: true };
  }
}

// 3. Synthesize Analytics and Charts
async function assembleOfflineAnalytics(urlPath) {
  try {
    const url = new URL(urlPath, 'http://localhost');
    const now = new Date();
    const month = Number(url.searchParams.get('month')) || now.getMonth() + 1;
    const year = Number(url.searchParams.get('year')) || now.getFullYear();

    const allExpenses = await getAllOfflineExpenses();
    const monthExpenses = allExpenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });

    const totalSpent = monthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Read cached budget or default
    const cachedDash = await getCachedData(`/dashboard?month=${month}&year=${year}`);
    const monthlyBudget = cachedDash?.monthlyBudget || 3000;
    const remainingBudget = Math.max(0, monthlyBudget - totalSpent);
    const budgetUsedPercentage = monthlyBudget > 0 ? Math.min(100, Math.round((totalSpent / monthlyBudget) * 100)) : 0;

    const daysInMonth = new Date(year, month, 0).getDate();
    const elapsedDays = Math.max(1, Math.min(now.getDate(), daysInMonth));
    const remainingDays = Math.max(0, daysInMonth - elapsedDays);
    const averageDailySpend = Math.round(totalSpent / elapsedDays);
    const safeDailyBudget = remainingDays > 0 ? Math.round(remainingBudget / remainingDays) : 0;

    // Daily Chart Data
    const dailyMap = {};
    for (let d = 1; d <= daysInMonth; d++) {
      dailyMap[d] = 0;
    }
    monthExpenses.forEach((e) => {
      const d = new Date(e.date).getDate();
      if (dailyMap[d] !== undefined) {
        dailyMap[d] += Number(e.amount) || 0;
      }
    });

    const dailyChartData = Object.keys(dailyMap).map((d) => ({
      day: Number(d),
      amount: Math.round(dailyMap[d] * 100) / 100,
      safeLimit: safeDailyBudget,
    }));

    // Category Breakdown
    const catMap = {};
    monthExpenses.forEach((e) => {
      const c = e.category || 'Food & Dining';
      if (!catMap[c]) catMap[c] = { category: c, total: 0, count: 0 };
      catMap[c].total += Number(e.amount) || 0;
      catMap[c].count += 1;
    });

    const categoryBreakdown = Object.values(catMap).map((c) => ({
      category: c.category,
      total: Math.round(c.total * 100) / 100,
      count: c.count,
      percentage: totalSpent > 0 ? Math.round((c.total / totalSpent) * 100) : 0,
    }));

    let peakDay = null;
    let maxSpent = 0;
    Object.keys(dailyMap).forEach((d) => {
      if (dailyMap[d] > maxSpent) {
        maxSpent = dailyMap[d];
        peakDay = { day: Number(d), amount: maxSpent };
      }
    });

    return {
      success: true,
      data: {
        month,
        year,
        monthlyBudget,
        totalSpent: Math.round(totalSpent * 100) / 100,
        remainingBudget: Math.round(remainingBudget * 100) / 100,
        budgetUsedPercentage,
        averageDailySpend,
        safeDailyBudget,
        daysTracked: Object.keys(dailyMap).filter((d) => dailyMap[d] > 0).length,
        remainingDays,
        dailyChartData,
        categoryBreakdown,
        peakDay,
      },
      _fromCache: true,
      _isOffline: true,
    };
  } catch (e) {
    return {
      success: true,
      data: { monthlyBudget: 0, totalSpent: 0, remainingBudget: 0, dailyChartData: [], categoryBreakdown: [] },
      _isOffline: true,
    };
  }
}

// 4. Default categories for offline use
function assembleOfflineCategories() {
  return {
    success: true,
    data: [
      { _id: 'cat_1', name: 'Breakfast', icon: 'Coffee', color: '#F59E0B' },
      { _id: 'cat_2', name: 'Lunch', icon: 'Utensils', color: '#10B981' },
      { _id: 'cat_3', name: 'Dinner', icon: 'Moon', color: '#6366F1' },
      { _id: 'cat_4', name: 'Snacks', icon: 'Cookie', color: '#EC4899' },
      { _id: 'cat_5', name: 'Groceries', icon: 'ShoppingBag', color: '#06B6D4' },
      { _id: 'cat_6', name: 'Meat / Fish', icon: 'Fish', color: '#EF4444' },
    ],
    _fromCache: true,
    _isOffline: true,
  };
}

// 5. Synthesize Complete Dashboard Response from local offline database
async function assembleOfflineDashboard(urlPath) {
  try {
    const url = new URL(urlPath, 'http://localhost');
    const now = new Date();
    const month = Number(url.searchParams.get('month')) || now.getMonth() + 1;
    const year = Number(url.searchParams.get('year')) || now.getFullYear();
    const today = url.searchParams.get('today') || now.toISOString().slice(0, 10);
    const space = url.searchParams.get('space') || 'Food & Dining';

    // Check if any recent cached dashboard exists
    const cachedAnyDash = (await getCachedData('/dashboard')) || (await getCachedData(urlPath));
    let cachedData = cachedAnyDash?.data || cachedAnyDash || {};

    // Also check localStorage for local persisted dashboard/budget
    try {
      if (typeof window !== 'undefined') {
        const localSaved = localStorage.getItem('pk_cached_dashboard_v1');
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          if (parsed && typeof parsed === 'object') {
            cachedData = { ...parsed, ...cachedData };
          }
        }
      }
    } catch (e) {}

    const baseBudget = Number(cachedData.monthlyBudget) || 3000;

    const allExpenses = await getAllOfflineExpenses();
    const monthExpenses = allExpenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });

    const totalSpent = monthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const todaySpent = monthExpenses
      .filter((e) => (e.date || '').slice(0, 10) === today)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const daysInMonth = new Date(year, month, 0).getDate();
    const currentDay = Math.min(now.getDate(), daysInMonth);
    const remainingDays = Math.max(1, daysInMonth - currentDay);
    const remainingBudget = Math.max(0, baseBudget - totalSpent);
    const safeDailyBudget = remainingDays > 0 ? Math.round((remainingBudget / remainingDays) * 100) / 100 : 0;
    const dynamicSafeDailyBudget = safeDailyBudget;
    const safeRemainingToday = Math.round((safeDailyBudget - todaySpent) * 100) / 100;

    // Recent 5 expenses
    const sorted = [...monthExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentExpenses = sorted.slice(0, 5);

    // Default spaces
    const defaultSpaces = [
      { name: 'Food & Dining', icon: 'Utensils', color: '#10B981', monthlyBudget: baseBudget, totalSpent, remainingBudget, todaySpent, dynamicSafeDailyBudget },
      { name: 'Household & Maid', icon: 'Brush', color: '#D97706', monthlyBudget: 0, totalSpent: 0, remainingBudget: 0, todaySpent: 0, dynamicSafeDailyBudget: 0 },
      { name: 'Room Rent', icon: 'Bed', color: '#6366F1', monthlyBudget: 0, totalSpent: 0, remainingBudget: 0, todaySpent: 0, dynamicSafeDailyBudget: 0 },
      { name: 'Bills & Utilities', icon: 'Lightbulb', color: '#0EA5E9', monthlyBudget: 0, totalSpent: 0, remainingBudget: 0, todaySpent: 0, dynamicSafeDailyBudget: 0 },
      { name: 'Travel', icon: 'Bike', color: '#F97316', monthlyBudget: 0, totalSpent: 0, remainingBudget: 0, todaySpent: 0, dynamicSafeDailyBudget: 0 },
    ];

    const spaces = cachedData.spaces && Array.isArray(cachedData.spaces) && cachedData.spaces.length > 0
      ? cachedData.spaces
      : defaultSpaces;

    return {
      success: true,
      data: {
        hasBudget: true,
        monthlyBudget: baseBudget,
        totalSpent: Math.round(totalSpent * 100) / 100,
        remainingBudget: Math.round(remainingBudget * 100) / 100,
        todaySpent: Math.round(todaySpent * 100) / 100,
        safeDailyBudget,
        dynamicSafeDailyBudget,
        safeRemainingToday,
        remainingDays,
        recentExpenses,
        categoryBreakdown: cachedData.categoryBreakdown || [],
        spaces,
        month,
        year,
        today,
        smartMessage: 'Offline Mode: Changes saved locally and will auto-sync when online.',
      },
      _fromCache: true,
      _isOffline: true,
    };
  } catch (err) {
    console.error('assembleOfflineDashboard error:', err);
    return {
      success: true,
      data: {
        hasBudget: true,
        monthlyBudget: 3000,
        totalSpent: 0,
        remainingBudget: 3000,
        todaySpent: 0,
        safeDailyBudget: 100,
        dynamicSafeDailyBudget: 100,
        safeRemainingToday: 100,
        remainingDays: 30,
        recentExpenses: [],
        categoryBreakdown: [],
        spaces: [],
      },
      _isOffline: true,
    };
  }
}

// Fallback router for any offline GET endpoint
async function resolveOfflineGet(endpoint) {
  const cached = await getCachedData(endpoint);
  if (cached) {
    return { ...cached, _fromCache: true, _isOffline: true };
  }

  if (endpoint.startsWith('/dashboard')) {
    return assembleOfflineDashboard(endpoint);
  }
  if (endpoint.startsWith('/expenses')) {
    return assembleOfflineExpenses(endpoint);
  }
  if (endpoint.startsWith('/calendar')) {
    return assembleOfflineCalendar(endpoint);
  }
  if (endpoint.startsWith('/analytics')) {
    return assembleOfflineAnalytics(endpoint);
  }
  if (endpoint.startsWith('/categories')) {
    return assembleOfflineCategories();
  }
  if (endpoint.startsWith('/auth/me')) {
    try {
      const localUser = localStorage.getItem('finfood_user');
      if (localUser) {
        return { success: true, user: JSON.parse(localUser), _isOffline: true };
      }
    } catch (e) {}
    return { success: true, user: { name: 'User', email: 'user@local' }, _isOffline: true };
  }
  if (endpoint.startsWith('/monthly-budget')) {
    return {
      success: true,
      data: { budgetAmount: 3000, categoryBudgets: [] },
      _isOffline: true,
    };
  }

  return null;
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
  // 1. GET Requests: Stale-While-Revalidate / Full Offline Engine
  // -----------------------------------------------------------
  if (method === 'GET') {
    const cacheKey = endpoint;

    // If completely offline, immediately synthesize or return cached response
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const offlineResult = await resolveOfflineGet(endpoint);
      if (offlineResult) {
        return offlineResult;
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
      try {
        if (endpoint.startsWith('/dashboard') && data && data.data) {
          localStorage.setItem('pk_cached_dashboard_v1', JSON.stringify(data.data));
        }
      } catch (e) {}

      // If fetching expenses, save to offline expenses store as well
      if (endpoint.startsWith('/expenses') && data.data && Array.isArray(data.data)) {
        saveMultipleOfflineExpenses(data.data);
      }

      return data;
    } catch (err) {
      // If network failed, timed out, OR server/MongoDB errored, fall back to offline cache/synthesis
      console.warn(`[API] Online request failed for ${endpoint}, using local cache:`, err.message);
      try {
        const offlineResult = await resolveOfflineGet(endpoint);
        if (offlineResult) {
          return offlineResult;
        }
      } catch (offlineErr) {
        console.warn(`[API] Offline fallback failed for ${endpoint}:`, offlineErr);
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
      if (res.status === 401) {
        throw new Error(data.error || 'Unauthorized');
      }
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (err) {
    if (isNetworkError(err)) {
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
        await removeSyncQueueItem(item.id);
        syncedCount++;
      }
    } catch (err) {
      break;
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
    setTimeout(() => {
      syncPendingData();
    }, 1200);
  });

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
