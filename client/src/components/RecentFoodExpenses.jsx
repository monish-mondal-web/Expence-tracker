import React, { useMemo } from 'react';
import { formatCurrency } from '../utils/currency';
import { formatTime, getRelativeDateLabel, toLocalISODate } from '../utils/date';
import { useApp } from '../context/AppContext';
import { CategoryIcon } from './CategoryIcon';
import { ChevronRight, PlusCircle, ShoppingBag, Trash2 } from 'lucide-react';

// Pastel category color & background mappings
const getCategoryStyle = (categoryName = '') => {
  const lower = categoryName.toLowerCase();
  if (lower.includes('gym') || lower.includes('fitness') || lower.includes('workout')) {
    return { bg: '#FEF3C7', color: '#D97706', defaultIcon: 'Dumbbell' }; // Amber
  }
  if (lower.includes('tour') || lower.includes('trip') || lower.includes('flight') || lower.includes('travel')) {
    return { bg: '#E0F2FE', color: '#0284C7', defaultIcon: 'Plane' }; // Sky
  }
  if (lower.includes('rent') || lower.includes('room') || lower.includes('flat')) {
    return { bg: '#EEF2FF', color: '#4F46E5', defaultIcon: 'Home' }; // Indigo
  }
  if (lower.includes('health') || lower.includes('medic') || lower.includes('doctor')) {
    return { bg: '#FEE2E2', color: '#DC2626', defaultIcon: 'HeartPulse' }; // Red
  }
  if (lower.includes('snack') || lower.includes('cookie') || lower.includes('sweet') || lower.includes('dessert')) {
    return { bg: '#FCE7F3', color: '#DB2777', defaultIcon: 'Cookie' }; // Pink
  }
  if (lower.includes('meat') || lower.includes('fish') || lower.includes('beef') || lower.includes('chicken') || lower.includes('bbq')) {
    return { bg: '#FFEDD5', color: '#EA580C', defaultIcon: 'Fish' }; // Orange
  }
  if (lower.includes('grocer') || lower.includes('market') || lower.includes('mart')) {
    return { bg: '#DBEAFE', color: '#2563EB', defaultIcon: 'ShoppingCart' }; // Blue
  }
  if (lower.includes('lunch') || lower.includes('dinner') || lower.includes('meal') || lower.includes('food')) {
    return { bg: '#DCFCE7', color: '#059669', defaultIcon: 'Utensils' }; // Green
  }
  if (lower.includes('breakfast') || lower.includes('coffee') || lower.includes('tea') || lower.includes('drink')) {
    return { bg: '#FEF3C7', color: '#D97706', defaultIcon: 'Coffee' }; // Amber
  }
  return { bg: '#F1F5F9', color: '#475569', defaultIcon: 'Utensils' }; // Slate
};

export const RecentFoodExpenses = ({
  expenses = [],
  onSeeAll,
  onItemClick,
  onDeleteExpense,
  onAddExpense,
}) => {
  const { activeSpace } = useApp();

  // Group recent expenses by day (up to 8 most recent items)
  const dayGroups = useMemo(() => {
    const items = (expenses || []).slice(0, 8);
    const groupsMap = {};

    items.forEach((item) => {
      const dateKey = toLocalISODate(item.date);
      if (!groupsMap[dateKey]) {
        const rawDate = item.date ? new Date(item.date) : new Date();
        const relLabel = getRelativeDateLabel(item.date);
        const isToday = relLabel === 'Today';
        const isYesterday = relLabel === 'Yesterday';

        let subLabel = '';
        if (isToday || isYesterday) {
          const day = rawDate.getDate();
          const monthShort = rawDate.toLocaleDateString('en-US', { month: 'short' });
          subLabel = `• ${day} ${monthShort}`;
        }

        groupsMap[dateKey] = {
          dateKey,
          label: relLabel || 'Today',
          subLabel,
          isToday,
          isYesterday,
          total: 0,
          items: [],
        };
      }
      groupsMap[dateKey].total += (Number(item.amount) || 0);
      groupsMap[dateKey].items.push(item);
    });

    // Sort descending by date (latest first)
    return Object.values(groupsMap).sort((a, b) => (b.dateKey > a.dateKey ? 1 : -1));
  }, [expenses]);

  const title = activeSpace && activeSpace !== 'All' ? `Recent ${activeSpace} Expenses` : 'Recent Expenses';

  return (
    <div className="recent-expenses-card">
      {/* Header */}
      <div className="recent-expenses-header">
        <h3 className="recent-expenses-title">{title}</h3>
        {onSeeAll && (
          <button type="button" className="see-all-btn" onClick={onSeeAll}>
            <span>See All</span>
            <ChevronRight size={15} />
          </button>
        )}
      </div>

      {dayGroups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
            <ShoppingBag size={20} color="#94A3B8" />
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '0.75rem' }}>
            No expenses logged yet this month.
          </p>
          <button
            type="button"
            className="btn-secondary"
            onClick={onAddExpense}
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <PlusCircle size={15} />
            <span>Add first expense</span>
          </button>
        </div>
      ) : (
        <div className="recent-expenses-list">
          {dayGroups.map((group) => {
            const dividerClass = group.isToday
              ? 'today'
              : group.isYesterday
              ? 'yesterday'
              : 'past';

            return (
              <div key={group.dateKey} className="recent-day-group">
                {/* Day-wise Divider */}
                <div className={`recent-day-divider ${dividerClass}`}>
                  <div className="recent-day-left">
                    <span className="recent-day-badge">{group.label}</span>
                    {group.subLabel && (
                      <span className="recent-day-subdate">{group.subLabel}</span>
                    )}
                  </div>
                  <div className="recent-day-right">
                    <span className="recent-day-used-label">Used:</span>
                    <span className="recent-day-used-val">
                      {formatCurrency(group.total)}
                    </span>
                  </div>
                </div>

                {/* Day Items */}
                <div className="recent-day-items">
                  {group.items.map((item) => {
                    const style = getCategoryStyle(item.category);
                    const time = item.date ? formatTime(item.date) : '';
                    const displayTime = time || (item.date ? getRelativeDateLabel(item.date) : 'Today');

                    return (
                      <div
                        key={item._id || item.id}
                        className="recent-expense-item"
                        onClick={() => onItemClick && onItemClick(item)}
                        title="Click to edit expense"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onItemClick && onItemClick(item);
                          }
                        }}
                      >
                        {/* Left: Pastel Icon Circle */}
                        <div
                          className="category-circle-badge"
                          style={{ background: style.bg }}
                        >
                          <CategoryIcon
                            name={item.categoryIcon || style.defaultIcon}
                            size={20}
                            color={style.color}
                          />
                        </div>

                        {/* Middle: Category & Time / Note */}
                        <div className="recent-item-info">
                          <h4 className="recent-item-category">{item.category}</h4>
                          <span className="recent-item-time">
                            {displayTime}
                            {item.note ? ` · ${item.note}` : ''}
                          </span>
                        </div>

                        {/* Right: Amount & Delete Button */}
                        <div className="recent-item-right">
                          <span className="recent-item-amount">
                            {formatCurrency(item.amount)}
                          </span>
                          {onDeleteExpense && (
                            <button
                              type="button"
                              className="recent-item-del-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteExpense(item);
                              }}
                              title="Delete expense"
                              aria-label="Delete expense"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
