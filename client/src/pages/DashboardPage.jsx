import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
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
  } = useApp();

  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const hasPromptedBudgetRef = useRef(false);

  // Budget prompt rules:
  // 1. If 0 spaces set: prompt on open/refresh every time
  // 2. If 1 space set: prompt daily one time
  // 3. If 2 spaces set: prompt every 2 days (48 hours interval)
  // 4. If 3 or more spaces set: do not prompt
  useEffect(() => {
    if (isDashboardLoading || !dashboardData || hasPromptedBudgetRef.current) return;

    const serverSpaces = dashboardData?.spaces || [];
    const categoryBudgets = dashboardData?.categoryBudgets || [];

    const budgetedSpaces = serverSpaces.filter((s) => (Number(s.monthlyBudget) || 0) > 0);
    const validCategoryBudgets = categoryBudgets.filter((cb) => (Number(cb.amount) || 0) > 0);

    const distinctBudgetedNames = new Set([
      ...budgetedSpaces.map((s) => s.name.toLowerCase()),
      ...validCategoryBudgets.map((cb) => cb.category.toLowerCase()),
    ]);

    const hasAnyBudget =
      (Number(dashboardData?.monthlyBudget) || 0) > 0 ||
      budgetedSpaces.length > 0 ||
      validCategoryBudgets.length > 0;

    const spaceCount = hasAnyBudget ? Math.max(1, distinctBudgetedNames.size) : 0;

    // Rule 1: 0 spaces set
    if (spaceCount === 0) {
      hasPromptedBudgetRef.current = true;
      const timer = setTimeout(() => {
        openSetBudget();
      }, 400);
      return () => clearTimeout(timer);
    }

    // Rule 2: 1 space set -> Daily 1 time
    if (spaceCount === 1) {
      hasPromptedBudgetRef.current = true;
      const todayStr = new Date().toISOString().slice(0, 10);
      const lastPrompt = localStorage.getItem('pk_budget_prompt_1space_date');

      if (lastPrompt !== todayStr) {
        localStorage.setItem('pk_budget_prompt_1space_date', todayStr);
        const timer = setTimeout(() => {
          openSetBudget();
        }, 400);
        return () => clearTimeout(timer);
      }
      return;
    }

    // Rule 3: 2 spaces set -> Every 2 days (48h interval)
    if (spaceCount === 2) {
      hasPromptedBudgetRef.current = true;
      const lastPromptTime = Number(localStorage.getItem('pk_budget_prompt_2spaces_time')) || 0;
      const nowTime = Date.now();
      const twoDaysMs = 2 * 24 * 60 * 60 * 1000; // 48 hours

      if (nowTime - lastPromptTime >= twoDaysMs) {
        localStorage.setItem('pk_budget_prompt_2spaces_time', String(nowTime));
        const timer = setTimeout(() => {
          openSetBudget();
        }, 400);
        return () => clearTimeout(timer);
      }
      return;
    }

    // Rule 4: 3 or more spaces set -> Never prompt
    if (spaceCount >= 3) {
      hasPromptedBudgetRef.current = true;
    }
  }, [isDashboardLoading, dashboardData, openSetBudget]);

  const dailySafeSpend =
    dashboardData?.dynamicSafeDailyBudget || dashboardData?.safeDailyBudget || 0;
  const todaySpent = dashboardData?.todaySpent || 0;
  const remainingBudget = dashboardData?.remainingBudget || 0;
  const budget = dashboardData?.monthlyBudget || 0;

  const safeRemainingToday =
    dashboardData?.safeRemainingToday !== undefined
      ? dashboardData.safeRemainingToday
      : Math.round((dailySafeSpend - todaySpent) * 100) / 100;

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
