import React from 'react';
import { PlusCircle, ArrowUpRight, Compass, CalendarDays } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

export const QuickActions = ({
  onAddExpense,
  onSetBudget,
  onOpenCalendar,
  onToggleDailyLimit,
  dailySafeSpend = 0,
  isDailyLimitActive = false,
}) => {
  return (
    <div className="quick-actions-container">
      {/* 1. Add Expense (Primary Emphasized Action) */}
      <button
        type="button"
        className="quick-action-card primary"
        onClick={onAddExpense}
        title="Add Food Expense"
      >
        <div className="quick-action-icon-circle primary">
          <PlusCircle size={22} color="#059669" strokeWidth={2.4} />
        </div>
        <span className="quick-action-label">Add Expense</span>
      </button>

      {/* 2. Set Budget */}
      <button
        type="button"
        className="quick-action-card"
        onClick={onSetBudget}
        title="Manage Monthly Budget"
      >
        <div className="quick-action-icon-circle">
          <ArrowUpRight size={20} color="#0F172A" strokeWidth={2.2} />
        </div>
        <span className="quick-action-label">Set Budget</span>
      </button>

      {/* 3. Daily Safe Limit (Toggles Dynamic Breakdown) */}
      <button
        type="button"
        className={`quick-action-card ${isDailyLimitActive ? 'active-limit' : ''}`}
        onClick={onToggleDailyLimit}
        title="Toggle Dynamic Safe Limit Breakdown"
      >
        <div className="quick-action-icon-circle accent">
          <Compass size={20} color="#FFFFFF" strokeWidth={2.2} />
        </div>
        <span className="quick-action-label accent">
          Daily {formatCurrency(dailySafeSpend)}
        </span>
      </button>

      {/* 4. Calendar */}
      <button
        type="button"
        className="quick-action-card"
        onClick={onOpenCalendar}
        title="View Food Expense Calendar"
      >
        <div className="quick-action-icon-circle">
          <CalendarDays size={20} color="#0F172A" strokeWidth={2} />
        </div>
        <span className="quick-action-label">Calendar</span>
      </button>
    </div>
  );
};
