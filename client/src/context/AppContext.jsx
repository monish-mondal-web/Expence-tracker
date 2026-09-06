import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toLocalISODate } from '../utils/date';
import { api } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [todayDate] = useState(toLocalISODate(now));

  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  // Cached dashboard state for instant optimistic updates
  const [dashboardData, setDashboardData] = useState(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);

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

  // Fetch dashboard data
  const loadDashboard = useCallback(async () => {
    try {
      const res = await api.getDashboard(currentMonth, currentYear, todayDate);
      if (res.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsDashboardLoading(false);
    }
  }, [currentMonth, currentYear, todayDate]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard, refreshKey]);

  // Fetch categories
  const loadCategories = useCallback(async () => {
    try {
      const res = await api.getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
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
  // OPTIMISTIC UI ACTIONS (Instant UI update -> Background sync)
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
      const safeRemToday = prev.safeDailyBudget - updatedToday;

      let safeKey = 'safe';
      let safeStatus = 'SAFE ZONE';
      if (updatedToday > prev.safeDailyBudget) {
        safeKey = 'exceeded';
        safeStatus = 'OVER SAFE LIMIT';
      } else if (updatedToday >= prev.safeDailyBudget * 0.8) {
        safeKey = 'approaching';
        safeStatus = 'APPROACHING LIMIT ⚠️';
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

    showToast('Expense added');
    closeAddExpense();

    // 2. BACKGROUND SERVER SYNC
    try {
      const res = await api.createExpense(payload);
      if (res.success && res.data) {
        // Swap temp ID with real DB ID
        setDashboardData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            recentExpenses: prev.recentExpenses.map((e) =>
              e._id === tempId ? res.data : e
            ),
          };
        });
      }
      triggerRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to save expense. Rolling back.', 'error');
      triggerRefresh();
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

      return {
        ...prev,
        totalSpent: updatedTotal,
        todaySpent: updatedToday,
        remainingBudget: updatedRemaining,
        budgetUsedPercentage: budgetPct,
        recentExpenses: prev.recentExpenses.filter((e) => e._id !== expense._id),
      };
    });

    showToast('Expense deleted');

    // 2. BACKGROUND SERVER SYNC
    try {
      await api.deleteExpense(expense._id);
      triggerRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to delete on server', 'error');
      triggerRefresh();
    }
  };

  const setBudgetOptimistic = async ({ budgetAmount, month, year }) => {
    const num = Number(budgetAmount);

    // 1. INSTANT LOCAL STATE UPDATE
    setDashboardData((prev) => {
      if (!prev) return prev;
      const baseDaily = Math.round((num / 30) * 100) / 100;
      const safeDaily = Math.round((baseDaily * 0.7) * 100) / 100;
      const remaining = num - prev.totalSpent;
      const pct = num > 0 ? Math.min(100, Math.round((prev.totalSpent / num) * 1000) / 10) : 0;

      return {
        ...prev,
        hasBudget: true,
        monthlyBudget: num,
        baseDailyBudget: baseDaily,
        safeDailyBudget: safeDaily,
        remainingBudget: remaining,
        budgetUsedPercentage: pct,
        safeRemainingToday: safeDaily - prev.todaySpent,
      };
    });

    showToast('Budget updated');
    closeSetBudget();

    // 2. BACKGROUND SERVER SYNC
    try {
      await api.setBudget({ budgetAmount: num, month, year });
      triggerRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to sync budget to server', 'error');
      triggerRefresh();
    }
  };

  return (
    <AppContext.Provider
      value={{
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
        prevMonth,
        nextMonth,
        addExpenseOptimistic,
        deleteExpenseOptimistic,
        setBudgetOptimistic,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
