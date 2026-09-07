import React, { useMemo } from 'react';
import { formatCurrency } from '../utils/currency';
import { CategoryIcon } from './CategoryIcon';
import { ChevronRight, ShoppingCart, Fish, Cookie, Utensils } from 'lucide-react';

const CATEGORY_STYLES = {
  groceries: { bg: '#DBEAFE', color: '#2563EB', bar: '#3B82F6', icon: 'ShoppingCart' },
  meat: { bg: '#FFEDD5', color: '#EA580C', bar: '#F97316', icon: 'Fish' },
  fish: { bg: '#FFEDD5', color: '#EA580C', bar: '#F97316', icon: 'Fish' },
  snacks: { bg: '#FCE7F3', color: '#DB2777', bar: '#EC4899', icon: 'Cookie' },
  default: { bg: '#F1F5F9', color: '#475569', bar: '#10B981', icon: 'Utensils' },
};

const getCategoryTheme = (name = '', idx = 0) => {
  const lower = name.toLowerCase();
  if (lower.includes('grocer') || lower.includes('market')) return CATEGORY_STYLES.groceries;
  if (lower.includes('meat') || lower.includes('fish') || lower.includes('chicken')) return CATEGORY_STYLES.meat;
  if (lower.includes('snack') || lower.includes('cookie') || lower.includes('sweet')) return CATEGORY_STYLES.snacks;

  const fallbacks = [
    { bg: '#DBEAFE', color: '#2563EB', bar: '#3B82F6', icon: 'ShoppingCart' },
    { bg: '#FFEDD5', color: '#EA580C', bar: '#F97316', icon: 'Fish' },
    { bg: '#FCE7F3', color: '#DB2777', bar: '#EC4899', icon: 'Cookie' },
  ];
  return fallbacks[idx % fallbacks.length];
};

export const TopCategories = ({ expenses = [], onSeeAll, onCategoryClick }) => {
  // 100% Real Dynamic Categories based strictly on actual recorded expenses
  const topCategories = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return [];
    }

    const totals = {};
    let grandTotal = 0;
    expenses.forEach((e) => {
      const cat = e.category || 'Other';
      totals[cat] = (totals[cat] || 0) + (Number(e.amount) || 0);
      grandTotal += (Number(e.amount) || 0);
    });

    const sorted = Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return sorted.map(([name, spent], idx) => {
      const pct = grandTotal > 0 ? Math.round((spent / grandTotal) * 100) : 0;
      return {
        name,
        spent,
        pct,
        theme: getCategoryTheme(name, idx),
      };
    });
  }, [expenses]);

  return (
    <div className="top-categories-section">
      {/* Header */}
      <div className="top-categories-header">
        <h3 className="top-categories-title">Top Categories This Month</h3>
        {onSeeAll && topCategories.length > 0 && (
          <button type="button" className="see-all-btn" onClick={onSeeAll}>
            <span>See All</span>
            <ChevronRight size={15} />
          </button>
        )}
      </div>

      {topCategories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.25rem 1rem', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #EAECEF', color: '#64748B', fontSize: '0.82rem' }}>
          No category spending recorded yet this month.
        </div>
      ) : (
        /* 3 Horizontal Cards Grid */
        <div className="top-categories-grid">
          {topCategories.map((cat, idx) => (
            <div
              key={cat.name + idx}
              className="top-category-card"
              onClick={() => onCategoryClick && onCategoryClick(cat.name)}
              title={`Category: ${cat.name}`}
            >
              {/* Left Icon */}
              <div
                className="top-cat-icon-badge"
                style={{ background: cat.theme.bg }}
              >
                <CategoryIcon
                  name={cat.theme.icon}
                  size={18}
                  color={cat.theme.color}
                />
              </div>

              {/* Content */}
              <div className="top-cat-content">
                <span className="top-cat-name">{cat.name}</span>
                <div className="top-cat-numbers">
                  <span className="top-cat-amount">{formatCurrency(cat.spent)}</span>
                  <span className="top-cat-pct">{cat.pct}%</span>
                </div>
                {/* Mini progress line */}
                <div className="top-cat-progress-track">
                  <div
                    className="top-cat-progress-fill"
                    style={{
                      width: `${Math.max(cat.pct, 4)}%`,
                      background: cat.theme.bar,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
