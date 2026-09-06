import React, { useMemo } from 'react';
import { formatCurrency } from '../utils/currency';
import { useApp } from '../context/AppContext';
import { ChevronRight, Plus } from 'lucide-react';

const PROGRESS_COLORS = [
  '#EA580C', // Orange
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#6366F1', // Indigo
];

export const SpendVsBudgetGrid = ({ expenses = [], monthlyBudget = 0, onCategoryClick }) => {
  const { openAddExpense } = useApp();

  // Compute REAL category spending vs budget
  const items = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return [];
    }

    const catTotals = {};
    expenses.forEach((e) => {
      const cat = e.category || 'Other';
      catTotals[cat] = (catTotals[cat] || 0) + e.amount;
    });

    const activeCount = Object.keys(catTotals).length || 1;
    // Dynamic proportion of monthly budget per active category
    const catAllocation = monthlyBudget > 0 ? monthlyBudget / Math.max(activeCount, 4) : 0;

    return Object.entries(catTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, spent]) => {
        const left = Math.max(0, catAllocation - spent);
        const total = Math.max(spent, catAllocation);
        return {
          name,
          spent: Math.round(spent * 100) / 100,
          left: Math.round(left * 100) / 100,
          total: Math.round(total * 100) / 100,
        };
      });
  }, [expenses, monthlyBudget]);

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div className="tim-section-header">
        <h3 className="tim-section-title">Spend vs budget</h3>
        <span className="tim-pill-badge">This month</span>
      </div>

      {items.length > 0 ? (
        <div className="tim-spend-vs-budget-grid">
          {items.map((item, idx) => {
            const color = PROGRESS_COLORS[idx % PROGRESS_COLORS.length];
            const pct = item.total > 0 ? Math.min(100, Math.round((item.spent / item.total) * 100)) : 0;

            return (
              <div
                key={item.name}
                className="tim-budget-item-card"
                onClick={() => onCategoryClick && onCategoryClick(item.name)}
                style={{ cursor: 'pointer' }}
              >
                <div className="tim-item-top-row">
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </span>
                  <ChevronRight size={15} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
                </div>

                <div className="tim-item-amount">{formatCurrency(item.spent)}</div>

                <div className="tim-item-subline">
                  {monthlyBudget > 0 ? `${formatCurrency(item.left)} safe buffer` : 'No budget set'}
                </div>

                <div className="tim-item-progress-track">
                  <div
                    className="tim-item-progress-bar"
                    style={{
                      width: `${pct}%`,
                      background: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '0.86rem',
          }}
        >
          <span>No category spending to compare yet.</span>
          <button
            type="button"
            onClick={() => openAddExpense()}
            style={{
              marginLeft: '0.6rem',
              background: 'none',
              border: 'none',
              color: '#2E8B79',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            + Log Food Expense
          </button>
        </div>
      )}
    </div>
  );
};
