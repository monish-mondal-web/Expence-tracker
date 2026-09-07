import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
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

  const dailySafeSpend =
    dashboardData?.dynamicSafeDailyBudget || dashboardData?.safeDailyBudget || 0;

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
      {/* 1. Main Food Budget Card with live Dynamic Safe Limit Breakdown */}
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
        isDailyLimitActive={isBreakdownOpen}
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
            onSeeAll={() => setActiveTab('expenses')}
            onCategoryClick={() => setActiveTab('expenses')}
          />
        </>
      )}
    </div>
  );
};
