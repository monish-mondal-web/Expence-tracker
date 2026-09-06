import React, { useMemo } from 'react';
import { ExpenseItem } from './ExpenseItem';
import { formatCurrency } from '../utils/currency';
import { toLocalISODate, getRelativeDateLabel, formatFullDate } from '../utils/date';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { PlusCircle, ShoppingBag } from 'lucide-react';

export const ExpenseList = ({ expenses = [], title = 'Recent Expenses', showViewAll = false }) => {
  const {
    categories,
    triggerRefresh,
    showToast,
    requestConfirm,
    openAddExpense,
    setActiveTab,
    deleteExpenseOptimistic,
  } = useApp();

  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.name] = c;
    });
    return map;
  }, [categories]);

  // Group expenses by date
  const grouped = useMemo(() => {
    const groups = {};
    expenses.forEach((exp) => {
      const dateKey = toLocalISODate(exp.date);
      if (!groups[dateKey]) {
        groups[dateKey] = {
          dateStr: dateKey,
          label: getRelativeDateLabel(exp.date),
          fullLabel: formatFullDate(exp.date),
          total: 0,
          items: [],
        };
      }
      groups[dateKey].total += exp.amount;
      groups[dateKey].items.push(exp);
    });

    // Sort date keys descending
    return Object.values(groups).sort((a, b) => (b.dateStr > a.dateStr ? 1 : -1));
  }, [expenses]);

  const handleDelete = (expense) => {
    requestConfirm({
      title: 'Delete Expense',
      message: `Are you sure you want to delete this ${expense.category} expense of ${formatCurrency(expense.amount)}?`,
      onConfirm: async () => {
        // INSTANT OPTIMISTIC DELETE (0ms)
        deleteExpenseOptimistic(expense);
      },
    });
  };

  if (expenses.length === 0) {
    return (
      <div className="transactions-section">
        <div className="section-header">
          <h2>{title}</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <ShoppingBag size={22} color="#64748B" />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.25rem' }}>
            No food expenses yet.
          </p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => openAddExpense()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <PlusCircle size={16} />
            Add your first expense
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="transactions-section">
      <div className="section-header">
        <h2>{title}</h2>
        {showViewAll && (
          <button type="button" onClick={() => setActiveTab('expenses')}>
            View All
          </button>
        )}
      </div>

      <div className="expenses-groups-container">
        {grouped.map((group) => (
          <div key={group.dateStr} className="date-group">
            <div className="date-group-header">
              <span>{group.label} • {group.fullLabel}</span>
              <span className="date-group-total">Total: {formatCurrency(group.total)}</span>
            </div>
            <div className="date-group-items">
              {group.items.map((item) => (
                <ExpenseItem
                  key={item._id}
                  expense={item}
                  categoryMeta={categoryMap[item.category]}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
