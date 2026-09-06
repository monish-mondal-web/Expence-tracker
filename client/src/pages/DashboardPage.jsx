import React from 'react';
import { useApp } from '../context/AppContext';
import { FintechHeroCard } from '../components/FintechHeroCard';
import { SpendVsBudgetGrid } from '../components/SpendVsBudgetGrid';
import { ExpenseList } from '../components/ExpenseList';
import { Skeleton } from '../components/Skeleton';

export const DashboardPage = () => {
  const {
    dashboardData,
    isDashboardLoading,
    openAddExpense,
    openSetBudget,
    setActiveTab,
  } = useApp();

  return (
    <div className="dashboard-content-flow">
      {/* 1. Salung Minimalist Executive Wallet Card with Integrated Actions & Progress */}
      <FintechHeroCard
        data={dashboardData}
        onSetBudget={openSetBudget}
        onAddExpense={() => openAddExpense()}
        onNavigateCalendar={() => setActiveTab('calendar')}
      />

      {isDashboardLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Skeleton height="140px" borderRadius="var(--radius-xl)" />
          <Skeleton height="100px" borderRadius="var(--radius-xl)" />
        </div>
      ) : (
        <>
          {/* 1. Recent Food Transactions List (Placed first as requested) */}
          <ExpenseList
            expenses={dashboardData?.recentExpenses || []}
            title="Recent Food Expenses"
            showViewAll={true}
          />

          {/* 2. Spend vs Budget 2-Column Grid */}
          <SpendVsBudgetGrid
            expenses={dashboardData?.recentExpenses || []}
            monthlyBudget={dashboardData?.monthlyBudget || 0}
            onCategoryClick={() => setActiveTab('expenses')}
          />
        </>
      )}
    </div>
  );
};
