import React, { useMemo } from 'react';
import { formatCurrency } from '../utils/currency';
import { useApp } from '../context/AppContext';
import { Plus } from 'lucide-react';

const CARD_COLORS = [
  '#D97706', // Warm Amber / Orange (#1)
  '#2E8B79', // Teal / Emerald (#2)
  '#2563EB', // Royal Blue (#3)
  '#7C3AED', // Violet / Purple (#4)
  '#E11D48', // Crimson / Rose (#5)
];

export const TopExpensesRow = ({ expenses = [] }) => {
  const { openAddExpense } = useApp();

  // Aggregate REAL expenses by category
  const topItems = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return [];
    }

    const catTotals = {};
    expenses.forEach((e) => {
      const cat = e.category || 'Other';
      catTotals[cat] = (catTotals[cat] || 0) + e.amount;
    });

    return Object.entries(catTotals)
      .map(([name, amount]) => ({ name, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [expenses]);

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div className="tim-section-header">
        <h3 className="tim-section-title">Top 5 expenses</h3>
        <span className="tim-pill-badge">This month</span>
      </div>

      {topItems.length > 0 ? (
        <div className="tim-top-expenses-row">
          {topItems.map((item, index) => {
            const bg = CARD_COLORS[index % CARD_COLORS.length];
            return (
              <div
                key={item.name}
                className="tim-squircle-card"
                style={{ background: bg }}
              >
                <div className="tim-squircle-badge">{index + 1}</div>
                <div>
                  <div className="tim-squircle-category">{item.name}</div>
                  <div className="tim-squircle-amount">{formatCurrency(item.amount)}</div>
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
          <span>No food expenses logged yet this month.</span>
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
            + Add Expense
          </button>
        </div>
      )}
    </div>
  );
};
