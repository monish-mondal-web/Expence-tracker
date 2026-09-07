import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { SpaceSwitcher } from '../components/SpaceSwitcher';
import { MainBudgetCard } from '../components/MainBudgetCard';
import { QuickActions } from '../components/QuickActions';
import { RecentFoodExpenses } from '../components/RecentFoodExpenses';
import { SpendingInsight } from '../components/SpendingInsight';
import { TopCategories } from '../components/TopCategories';
import { Skeleton } from '../components/Skeleton';

export const DashboardPage = () => {
  const {
    dashboardData,
    isDashboardLoading,
    openAddExpense,
    openSetBudget,
    openEditExpense,
    deleteExpenseOptimistic,
    requestConfirm,
    setActiveTab,
    activeSpace,
  } = useApp();

  const { user, isLoading: isAuthLoading } = useAuth();
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const promptedUserKeyRef = useRef(null);

  // Budget prompt rules:
  // 1. If 0 spaces set: prompt on open/refresh every time
  // 2. If 1 space set: prompt daily one time (user-scoped)
  // 3. If 2 spaces set: prompt every 2 days (48 hours interval, user-scoped)
  // 4. If 3 or more spaces set (already have monthly limits set): NEVER prompt!
  useEffect(() => {
    // Strictly wait until both auth and dashboard data are completely loaded for the user
    if (isAuthLoading || !user || isDashboardLoading || !dashboardData) return;

    // Check if this user session has already processed the prompt on this mount
    const currentUserKey = String(user._id || user.email || '');
    if (!currentUserKey) return;
    if (promptedUserKeyRef.current === currentUserKey) return;

    // Check if user has budget doc or any monthly budget amount set
    const hasBudgetDoc =
      Boolean(dashboardData?.hasBudget) &&
      (Number(dashboardData?.monthlyBudget) || 0) > 0;

    let spaceCount = 0;

    if (hasBudgetDoc) {
      const rawCategoryBudgets = dashboardData?.categoryBudgets || [];
      const validBudgets = rawCategoryBudgets.filter((cb) => (Number(cb?.amount) || 0) > 0);

      const serverSpaces = dashboardData?.spaces || [];
      const budgetedSpaces = serverSpaces.filter((s) => (Number(s?.monthlyBudget) || 0) > 0);

      const breakdown = dashboardData?.categoryBreakdown || [];
      const budgetedBreakdown = breakdown.filter((b) => (Number(b?.budget) || 0) > 0);

      const distinctBudgetedNames = new Set([
        ...validBudgets.map((cb) => (cb.category || '').toLowerCase().trim()),
        ...budgetedSpaces.map((s) => (s.name || '').toLowerCase().trim()),
        ...budgetedBreakdown.map((b) => (b.category || '').toLowerCase().trim()),
      ]);
      distinctBudgetedNames.delete('');

      spaceCount = Math.max(validBudgets.length, distinctBudgetedNames.size);
    } else {
      spaceCount = 0;
    }

    // Rule 4: 3 or more spaces set (or monthly limit already complete) -> NEVER PROMPT!
    if (spaceCount >= 3) {
      promptedUserKeyRef.current = currentUserKey;
      return;
    }

    // Rule 1: 0 spaces set -> auto prompt every open/refresh
    if (spaceCount === 0) {
      promptedUserKeyRef.current = currentUserKey;
      openSetBudget();
      return;
    }

    // Rule 2: 1 space set -> Daily 1 time
    if (spaceCount === 1) {
      promptedUserKeyRef.current = currentUserKey;
      const todayStr = new Date().toISOString().slice(0, 10);
      const storageKey = `pk_budget_prompt_1space_${currentUserKey}_date`;
      const lastPrompt = localStorage.getItem(storageKey);

      if (lastPrompt !== todayStr) {
        localStorage.setItem(storageKey, todayStr);
        openSetBudget();
      }
      return;
    }

    // Rule 3: 2 spaces set -> Every 2 days (48 hours interval)
    if (spaceCount === 2) {
      promptedUserKeyRef.current = currentUserKey;
      const storageKey = `pk_budget_prompt_2spaces_${currentUserKey}_time`;
      const lastPromptTime = Number(localStorage.getItem(storageKey)) || 0;
      const nowTime = Date.now();
      const twoDaysMs = 2 * 24 * 60 * 60 * 1000;

      if (nowTime - lastPromptTime >= twoDaysMs) {
        localStorage.setItem(storageKey, String(nowTime));
        openSetBudget();
      }
      return;
    }
  }, [isAuthLoading, isDashboardLoading, dashboardData, user, openSetBudget]);

  // Space-aware daily safe spend and remaining calculations
  const isSpaceMode = activeSpace && activeSpace !== 'All';
  const spaceObj = isSpaceMode
    ? (dashboardData?.spaces?.find((s) => s.name?.toLowerCase() === activeSpace?.toLowerCase()) || dashboardData?.activeSpaceData)
    : null;

  const budget = isSpaceMode ? (spaceObj?.monthlyBudget || 0) : (dashboardData?.monthlyBudget || 0);
  const remainingBudget = isSpaceMode ? (spaceObj?.remainingBudget || 0) : (dashboardData?.remainingBudget || 0);
  const dynamicSafeDailyBudget = isSpaceMode
    ? (spaceObj?.dynamicSafeDailyBudget || spaceObj?.safeDailyBudget || 0)
    : (dashboardData?.dynamicSafeDailyBudget || 0);
  const safeDailyBudget = isSpaceMode
    ? (spaceObj?.safeDailyBudget || 0)
    : (dashboardData?.safeDailyBudget || 0);
  const dailySafeSpend = dynamicSafeDailyBudget || safeDailyBudget || 0;
  const todaySpent = isSpaceMode ? (spaceObj?.todaySpent || 0) : (dashboardData?.todaySpent || 0);

  const safeRemainingToday = isSpaceMode
    ? Math.round((dailySafeSpend - todaySpent) * 100) / 100
    : (dashboardData?.safeRemainingToday !== undefined
        ? dashboardData.safeRemainingToday
        : Math.round((dailySafeSpend - todaySpent) * 100) / 100);

  const isLimitExpired =
    (dailySafeSpend > 0 && todaySpent >= dailySafeSpend) ||
    (budget > 0 && remainingBudget <= 0 && todaySpent > 0);

  const handleDeleteExpense = (expense) => {
    requestConfirm({
      title: 'Delete Expense',
      message: `Are you sure you want to delete this ${expense.category} expense of ₹${expense.amount}?`,
      onConfirm: async () => {
        deleteExpenseOptimistic(expense);
      },
    });
  };

  return (
    <div className="dashboard-content-flow">
      {/* 0. Top Spaces Switcher (Food, Travel, Room Rent, Gym, Custom Spaces) */}
      <SpaceSwitcher />

      {/* 1. Main Space Budget Card with live Dynamic Safe Limit Breakdown */}
      <MainBudgetCard
        data={dashboardData}
        onSetBudget={openSetBudget}
        isExpanded={isBreakdownOpen}
        onToggleExpand={() => setIsBreakdownOpen((prev) => !prev)}
      />

      {/* 2. Quick Actions Row (Add Expense, Set Budget, Daily ₹..., Calendar) */}
      <QuickActions
        onAddExpense={() => openAddExpense()}
        onSetBudget={openSetBudget}
        dailySafeSpend={dailySafeSpend}
        safeRemainingToday={safeRemainingToday}
        isDailyLimitActive={isBreakdownOpen}
        isLimitExpired={isLimitExpired}
        onToggleDailyLimit={() => setIsBreakdownOpen((prev) => !prev)}
        onOpenCalendar={() => setActiveTab('calendar')}
      />

      {isDashboardLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Skeleton height="160px" borderRadius="var(--radius-xl)" />
          <Skeleton height="100px" borderRadius="var(--radius-xl)" />
          <Skeleton height="90px" borderRadius="var(--radius-xl)" />
        </div>
      ) : (
        <>
          {/* 3. Recent Food Expenses Card (Matching reference design 1:1) */}
          <RecentFoodExpenses
            expenses={dashboardData?.recentExpenses || []}
            onSeeAll={() => setActiveTab('expenses')}
            onItemClick={(item) => openEditExpense(item)}
            onDeleteExpense={handleDeleteExpense}
            onAddExpense={() => openAddExpense()}
          />

          {/* 4. Spending Insight Card */}
          <SpendingInsight
            data={dashboardData}
          />

          {/* 5. Top Categories This Month */}
          <TopCategories
            expenses={dashboardData?.recentExpenses || []}
            onSeeAll={() => setActiveTab('budget')}
            onCategoryClick={() => setActiveTab('expenses')}
          />
        </>
      )}
    </div>
  );
};
