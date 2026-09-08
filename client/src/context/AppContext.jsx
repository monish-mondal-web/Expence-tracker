import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toLocalISODate } from '../utils/date';
import { api } from '../services/api';
import { onSyncChange, getPendingSyncCount } from '../services/offlineStorage';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [todayDate] = useState(toLocalISODate(now));

  // Network & Sync State
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const getTabFromPath = () => {
    if (typeof window === 'undefined') return 'dashboard';
    const cleanPath = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
    if (!cleanPath || cleanPath === 'dashboard' || cleanPath === 'home') return 'dashboard';
    if (cleanPath === 'budget' || cleanPath === 'analytics') return 'budget';
    if (cleanPath === 'expenses') return 'expenses';
    if (cleanPath === 'calendar') return 'calendar';
    if (cleanPath === 'settings' || cleanPath === 'more') return 'settings';
    return 'dashboard';
  };

  const getPathFromTab = (tab) => {
    switch (tab) {
      case 'dashboard':
        return '/';
      case 'budget':
      case 'analytics':
        return '/budget';
      case 'expenses':
        return '/expenses';
      case 'calendar':
        return '/calendar';
      case 'settings':
      case 'more':
        return '/settings';
      default:
        return '/';
    }
  };

  const [activeTab, setActiveTabState] = useState(getTabFromPath);

  const setActiveTab = useCallback((tab, replace = false) => {
    const canonicalTab = tab === 'analytics' ? 'budget' : tab;
    setActiveTabState(canonicalTab);
    if (typeof window !== 'undefined') {
      const targetPath = getPathFromTab(canonicalTab);
      if (window.location.pathname !== targetPath) {
        if (replace) {
          window.history.replaceState({ tab: canonicalTab }, '', targetPath);
        } else {
          window.history.pushState({ tab: canonicalTab }, '', targetPath);
        }
      }
    }
  }, []);

  // Listen for browser Back/Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const tab = getTabFromPath();
      setActiveTabState(tab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [refreshKey, setRefreshKey] = useState(0);

  // Cached dashboard state for instant optimistic updates
  const [dashboardData, setDashboardData] = useState(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);

  // Spaces management - defaults to 'Food & Dining' on every page refresh/reload
  const [activeSpace, setActiveSpaceState] = useState('Food & Dining');

  const setActiveSpace = useCallback((space) => {
    setActiveSpaceState(space);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pk_active_space');
    }
  }, []);

  const [isAddSpaceOpen, setIsAddSpaceOpen] = useState(false);
  const openAddSpace = () => setIsAddSpaceOpen(true);
  const closeAddSpace = () => setIsAddSpaceOpen(false);

  // Modals
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [preselectedDate, setPreselectedDate] = useState(null);
  const [isSetBudgetOpen, setIsSetBudgetOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  // Toasts
  const [toasts, setToasts] = useState([]);

  // Categories cache
  const [categories, setCategories] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // Listen to Network status & Sync events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Back online! Syncing data...', 'success');
      api.syncPendingData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast('Offline mode — changes saved locally', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribeSync = onSyncChange((status) => {
      if (status.isSyncing !== undefined) setIsSyncing(status.isSyncing);
      if (status.pendingCount !== undefined) setPendingSyncCount(status.pendingCount);
    });

    const unsubscribeCompleted = api.onSyncCompleted((count) => {
      showToast(`Synced ${count} offline change${count > 1 ? 's' : ''} to server`, 'success');
      triggerRefresh();
    });

    getPendingSyncCount().then((count) => setPendingSyncCount(count));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeSync();
      unsubscribeCompleted();
    };
  }, [showToast, triggerRefresh]);

  // Fetch dashboard data (with offline cache recovery)
  const loadDashboard = useCallback(async () => {
    try {
      const res = await api.getDashboard(currentMonth, currentYear, todayDate, activeSpace);
      if (res && res.data) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.warn('Dashboard fetch error (checking local cache):', err);
    } finally {
      setIsDashboardLoading(false);
    }
  }, [currentMonth, currentYear, todayDate, activeSpace]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard, refreshKey]);

  // Fetch categories
  const loadCategories = useCallback(async () => {
    try {
      const res = await api.getCategories();
      if (res && res.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.warn('Categories fetch error:', err);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories, refreshKey]);

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Open modal helpers
  const openAddExpense = (date = null) => {
    setEditingExpense(null);
    setPreselectedDate(date || todayDate);
    setIsAddExpenseOpen(true);
  };

  const openEditExpense = (expense) => {
    setEditingExpense(expense);
    setPreselectedDate(null);
    setIsAddExpenseOpen(true);
  };

  const closeAddExpense = () => {
    setIsAddExpenseOpen(false);
    setEditingExpense(null);
    setPreselectedDate(null);
  };

  const openSetBudget = () => {
    setIsSetBudgetOpen(true);
  };

  const closeSetBudget = () => {
    setIsSetBudgetOpen(false);
  };

  const requestConfirm = ({ title, message, onConfirm }) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        try {
          await onConfirm();
        } finally {
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
        }
      },
    });
  };

  const closeConfirm = () => {
    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
  };

  // -------------------------------------------------------------
  // OPTIMISTIC & OFFLINE RESILIENT UI ACTIONS
  // -------------------------------------------------------------
  const addExpenseOptimistic = async (payload) => {
    const tempId = `temp_${Date.now()}`;
    const newExp = {
      _id: tempId,
      amount: payload.amount,
      date: payload.date,
      category: payload.category,
      note: payload.note || '',
      createdAt: new Date().toISOString(),
    };

    // 1. INSTANT LOCAL STATE UPDATE (0ms)
    setDashboardData((prev) => {
      if (!prev) return prev;
      const isToday = toLocalISODate(payload.date) === todayDate;
      const updatedTotal = prev.totalSpent + payload.amount;
      const updatedToday = isToday ? prev.todaySpent + payload.amount : prev.todaySpent;
      const updatedRemaining = Math.max(0, prev.monthlyBudget - updatedTotal);
      const budgetPct = prev.monthlyBudget > 0 ? Math.min(100, Math.round((updatedTotal / prev.monthlyBudget) * 1000) / 10) : 0;
      const effectiveLimit = prev.dynamicSafeDailyBudget || prev.safeDailyBudget || 0;
      const safeRemToday = effectiveLimit - updatedToday;

      let safeKey = 'safe';
      let safeStatus = 'ON TRACK';
      if (effectiveLimit > 0 && updatedToday > effectiveLimit) {
        safeKey = 'exceeded';
        safeStatus = 'OVER SAFE LIMIT';
      } else if (effectiveLimit > 0 && updatedToday >= effectiveLimit * 0.85) {
        safeKey = 'approaching';
        safeStatus = 'APPROACHING LIMIT';
      } else if (prev.monthlyBudget > 0 && updatedRemaining <= 0) {
        safeKey = 'exceeded';
        safeStatus = 'OVER SAFE LIMIT';
      }

      return {
        ...prev,
        totalSpent: updatedTotal,
        todaySpent: updatedToday,
        remainingBudget: updatedRemaining,
        budgetUsedPercentage: budgetPct,
        safeRemainingToday: safeRemToday,
        safeZoneKey: safeKey,
        safeZoneStatus: safeStatus,
        recentExpenses: [newExp, ...(prev.recentExpenses || [])],
      };
    });

    closeAddExpense();

    // 2. BACKGROUND SERVER SYNC OR OFFLINE QUEUE
    try {
      const res = await api.createExpense(payload);
      if (res && res._isOffline) {
        showToast('Saved offline. Will auto-sync when online.', 'info');
      } else {
        showToast('Expense added successfully');
      }

      if (res && res.data && res.data._id) {
        setDashboardData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            recentExpenses: (prev.recentExpenses || []).map((e) =>
              e._id === tempId ? res.data : e
            ),
          };
        });
      }
      triggerRefresh();
    } catch (err) {
      console.error('Expense addition error:', err);
      showToast('Error saving expense, kept in local session.', 'error');
    }
  };

  const deleteExpenseOptimistic = async (expense) => {
    // 1. INSTANT LOCAL STATE UPDATE (0ms)
    setDashboardData((prev) => {
      if (!prev) return prev;
      const isToday = toLocalISODate(expense.date) === todayDate;
      const updatedTotal = Math.max(0, prev.totalSpent - expense.amount);
      const updatedToday = isToday ? Math.max(0, prev.todaySpent - expense.amount) : prev.todaySpent;
      const updatedRemaining = prev.monthlyBudget - updatedTotal;
      const budgetPct = prev.monthlyBudget > 0 ? Math.min(100, Math.round((updatedTotal / prev.monthlyBudget) * 1000) / 10) : 0;
      const effectiveLimit = prev.dynamicSafeDailyBudget || prev.safeDailyBudget || 0;

      let safeKey = 'safe';
      let safeStatus = 'ON TRACK';
      if (effectiveLimit > 0 && updatedToday > effectiveLimit) {
        safeKey = 'exceeded';
        safeStatus = 'OVER SAFE LIMIT';
      } else if (effectiveLimit > 0 && updatedToday >= effectiveLimit * 0.85) {
        safeKey = 'approaching';
        safeStatus = 'APPROACHING LIMIT';
      } else if (prev.monthlyBudget > 0 && updatedRemaining <= 0) {
        safeKey = 'exceeded';
        safeStatus = 'OVER SAFE LIMIT';
      }

      return {
        ...prev,
        totalSpent: updatedTotal,
        todaySpent: updatedToday,
        remainingBudget: updatedRemaining,
        budgetUsedPercentage: budgetPct,
        safeRemainingToday: effectiveLimit - updatedToday,
        safeZoneKey: safeKey,
        safeZoneStatus: safeStatus,
        recentExpenses: (prev.recentExpenses || []).filter((e) => e._id !== expense._id),
      };
    });

    // 2. BACKGROUND SERVER SYNC OR OFFLINE QUEUE
    try {
      const res = await api.deleteExpense(expense._id);
      if (res && res._isOffline) {
        showToast('Deleted offline. Will sync when online.', 'info');
      } else {
        showToast('Expense deleted');
      }
      triggerRefresh();
    } catch (err) {
      console.error('Delete expense error:', err);
      showToast('Error deleting on server, removed locally.', 'error');
    }
  };

  const setBudgetOptimistic = async ({ budgetAmount, categoryBudgets = [], month, year }) => {
    let num = Number(budgetAmount);
    if ((isNaN(num) || num <= 0) && Array.isArray(categoryBudgets) && categoryBudgets.length > 0) {
      num = categoryBudgets.reduce((sum, c) => sum + (Number(c?.amount) || 0), 0);
    }

    // 1. INSTANT LOCAL STATE UPDATE
    setDashboardData((prev) => {
      if (!prev) return prev;
      const baseDaily = Math.round((num / 30) * 100) / 100;
      const safeDaily = Math.round((baseDaily * 0.7) * 100) / 100;
      const remaining = num - prev.totalSpent;
      const pct = num > 0 ? Math.min(100, Math.round((prev.totalSpent / num) * 1000) / 10) : 0;

      return {
        ...prev,
        hasBudget: num > 0,
        monthlyBudget: num,
        baseDailyBudget: baseDaily,
        safeDailyBudget: safeDaily,
        remainingBudget: remaining,
        budgetUsedPercentage: pct,
        safeRemainingToday: safeDaily - prev.todaySpent,
        categoryBudgets,
      };
    });

    closeSetBudget();

    // 2. BACKGROUND SERVER SYNC OR OFFLINE QUEUE
    try {
      const res = await api.setBudget({ budgetAmount: num, categoryBudgets, month, year });
      if (res && res._isOffline) {
        showToast('Budget saved offline. Will auto-sync when online.', 'info');
      } else {
        showToast('Budget saved successfully');
      }
      triggerRefresh();
    } catch (err) {
      console.error('Budget sync error:', err);
      showToast('Failed to sync budget to server, kept locally.', 'error');
    }
  };

  const resetBudgetOptimistic = async (budgetId) => {
    setDashboardData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        hasBudget: false,
        monthlyBudget: 0,
        safeDailyBudget: 0,
        dynamicSafeDailyBudget: 0,
        remainingBudget: 0,
        budgetUsedPercentage: 0,
        categoryBudgets: [],
      };
    });

    try {
      let res;
      if (budgetId) {
        res = await api.resetBudget(budgetId);
      }
      if (res && res._isOffline) {
        showToast('Monthly budget reset offline', 'info');
      } else {
        showToast('Monthly budget reset');
      }
      triggerRefresh();
    } catch (err) {
      console.error('Budget reset error:', err);
      showToast('Reset locally.', 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        isOnline,
        isSyncing,
        pendingSyncCount,
        syncNow: api.syncPendingData,
        currentMonth,
        currentYear,
        setCurrentMonth,
        setCurrentYear,
        todayDate,
        activeTab,
        setActiveTab,
        refreshKey,
        triggerRefresh,
        dashboardData,
        isDashboardLoading,
        categories,
        loadCategories,
        isAddExpenseOpen,
        openAddExpense,
        openEditExpense,
        closeAddExpense,
        editingExpense,
        preselectedDate,
        isSetBudgetOpen,
        openSetBudget,
        closeSetBudget,
        confirmModal,
        requestConfirm,
        closeConfirm,
        toasts,
        showToast,
        activeSpace,
        setActiveSpace,
        isAddSpaceOpen,
        openAddSpace,
        closeAddSpace,
        prevMonth,
        nextMonth,
        addExpenseOptimistic,
        deleteExpenseOptimistic,
        setBudgetOptimistic,
        resetBudgetOptimistic,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
