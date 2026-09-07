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
  // 1. If 0 spaces/budgets added: prompt on every page refresh/reload until a budget is set
  // 2. If ONLY Food & Dining is budgeted: prompt daily 1-time on open/refresh; if dismissed, don't prompt again today
  // 3. If 2 or more spaces are budgeted: never prompt
  useEffect(() => {
    if (isDashboardLoading || !dashboardData || hasPromptedBudgetRef.current) return;

    const serverSpaces = dashboardData?.spaces || [];
    const categoryBudgets = dashboardData?.categoryBudgets || [];

    const budgetedSpaces = serverSpaces.filter((s) => (Number(s.monthlyBudget) || 0) > 0);
    const validCategoryBudgets = categoryBudgets.filter((cb) => (Number(cb.amount) || 0) > 0);

    const hasAnyBudget =
      (Number(dashboardData?.monthlyBudget) || 0) > 0 ||
      budgetedSpaces.length > 0 ||
      validCategoryBudgets.length > 0;

    // Rule 1: No space/budget added at all
    if (!hasAnyBudget) {
      hasPromptedBudgetRef.current = true;
      const timer = setTimeout(() => {
        openSetBudget();
      }, 400);
      return () => clearTimeout(timer);
    }

    // Count distinct spaces/categories with budget
    const distinctBudgetedNames = new Set([
      ...budgetedSpaces.map((s) => s.name.toLowerCase()),
      ...validCategoryBudgets.map((cb) => cb.category.toLowerCase()),
    ]);

    // Rule 3: If 2 or more spaces are budgeted, do not prompt
    if (distinctBudgetedNames.size >= 2) {
      hasPromptedBudgetRef.current = true;
      return;
    }

    // Rule 2: Only Food & Dining is budgeted
    const onlyHasFood =
      distinctBudgetedNames.size === 1 &&
      Array.from(distinctBudgetedNames)[0].includes('food');

    if (onlyHasFood) {
      hasPromptedBudgetRef.current = true;
      const todayStr = new Date().toISOString().slice(0, 10);
      const lastPrompt = localStorage.getItem('pk_budget_prompt_food_only_date');

      if (lastPrompt !== todayStr) {
        localStorage.setItem('pk_budget_prompt_food_only_date', todayStr);
        const timer = setTimeout(() => {
          openSetBudget();
        }, 400);
        return () => clearTimeout(timer);
      }
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
